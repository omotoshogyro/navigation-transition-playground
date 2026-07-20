import React, { createContext, useContext, useMemo, useState } from 'react';
import { Easing } from 'react-native';
import { StackNavigationOptions, TransitionPresets } from '@react-navigation/stack';
import AuthTransition from './transitions/AuthTransition';
import ModalTransition, { TransitionSpec } from './transitions/ModalTransition';
import { modalTransitionVariant, CloseVariant } from './transitions/ModalTransitionTuned';

export type PresetKey = 'auth' | 'modal' | 'default';
export type SpeedKey = 'real' | 'slow';
export type { CloseVariant };

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'auth', label: 'AuthTransition' },
  { key: 'modal', label: 'ModalTransition' },
  { key: 'default', label: 'Default iOS' },
];

export const CLOSE_VARIANTS: { key: CloseVariant; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'solid', label: 'Solid card' },
  { key: 'solidEased', label: 'Solid + eased' },
];

/**
 * Same interpolators, but driven by a long linear timing curve so the shape of
 * the animation is legible. The real spring (stiffness 1000 / damping 500 /
 * overshootClamping) settles in ~250ms, which is too fast to inspect.
 */
const SLOW_SPEC: TransitionSpec = {
  animation: 'timing',
  config: { duration: 1600, easing: Easing.linear },
};

/**
 * Mirrors mobile-native's `defaultScreenOptions` (NavigationStack.tsx:273).
 * cardOverlayEnabled is what makes ModalTransition's `overlayStyle` scrim
 * actually render — without it the interpolator's overlay is computed and
 * thrown away.
 */
const MODAL_HOST_OPTIONS: StackNavigationOptions = {
  cardStyle: { backgroundColor: 'transparent' },
  keyboardHandlingEnabled: false,
  presentation: 'transparentModal',
  cardOverlayEnabled: true,
  // the real app defaults this to false and opts in per-screen via `modalOptions`;
  // enabled here so swipe-to-dismiss is testable
  gestureEnabled: true,
  gestureResponseDistance: 240,
};

function optionsFor(
  preset: PresetKey,
  speed: SpeedKey,
  close: CloseVariant,
): StackNavigationOptions {
  const base =
    preset === 'auth'
      ? (AuthTransition as StackNavigationOptions)
      : preset === 'modal'
        ? {
            ...MODAL_HOST_OPTIONS,
            ...(close === 'stock'
              ? (ModalTransition as StackNavigationOptions)
              : (modalTransitionVariant(close) as StackNavigationOptions)),
          }
        : TransitionPresets.SlideFromRightIOS;

  return {
    headerShown: false,
    ...base,
    // Slow-mo overrides both specs, so 'Solid + eased' loses its distinct close
    // curve here — slow-mo is for reading the interpolator, not the spec.
    ...(speed === 'slow'
      ? { transitionSpec: { open: SLOW_SPEC, close: SLOW_SPEC } }
      : null),
  };
}

type Ctx = {
  preset: PresetKey;
  speed: SpeedKey;
  close: CloseVariant;
  setPreset: (p: PresetKey) => void;
  setSpeed: (s: SpeedKey) => void;
  setClose: (c: CloseVariant) => void;
  screenOptions: StackNavigationOptions;
};

const DemoConfigContext = createContext<Ctx | null>(null);

export function DemoConfigProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState<PresetKey>('auth');
  const [speed, setSpeed] = useState<SpeedKey>('real');
  const [close, setClose] = useState<CloseVariant>('stock');

  const value = useMemo(
    () => ({
      preset,
      speed,
      close,
      setPreset,
      setSpeed,
      setClose,
      screenOptions: optionsFor(preset, speed, close),
    }),
    [preset, speed, close],
  );

  return <DemoConfigContext.Provider value={value}>{children}</DemoConfigContext.Provider>;
}

export function useDemoConfig() {
  const ctx = useContext(DemoConfigContext);
  if (!ctx) throw new Error('useDemoConfig must be used inside DemoConfigProvider');
  return ctx;
}
