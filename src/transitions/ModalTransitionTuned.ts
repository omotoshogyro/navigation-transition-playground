import {
  StackCardInterpolationProps,
  StackCardInterpolatedStyle,
  StackNavigationOptions,
} from '@react-navigation/stack';
import { Animated, Easing } from 'react-native';
import { TransitionSpec } from './ModalTransition';

const { multiply } = Animated;

/** Stock TransitionIOSSpec — identical to what ModalTransition uses today. */
const springSpec: TransitionSpec = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 10,
    restSpeedThreshold: 10,
  },
};

/**
 * Accelerate-away close. Ease-IN (slow start, fast finish) matches the physical
 * read of something being dropped/dismissed, and gets the card offscreen
 * quickly so any unmount cost lands after the motion instead of during it.
 */
const easedCloseSpec: TransitionSpec = {
  animation: 'timing',
  config: { duration: 300, easing: Easing.in(Easing.cubic) },
};

export type CloseVariant = 'stock' | 'solid' | 'solidEased';

/**
 * The shipped ModalTransition ties card opacity linearly to progress, so the
 * card is semi-transparent through the entire screen-height of travel. On the
 * way in that is hidden (the card is offscreen while it is faint); on the way
 * out it happens in full view and reads as a dissolve rather than a slide.
 *
 * `holdUntil` moves the whole fade into the first N of progress, so the card is
 * opaque for the rest of the trip.
 */
function interpolatorFor(holdUntil: number) {
  return function ({
    current,
    inverted,
    layouts: { screen },
  }: StackCardInterpolationProps): StackCardInterpolatedStyle {
    const translateY = multiply(
      current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screen.height, 0],
        extrapolate: 'clamp',
      }),
      inverted,
    );

    const opacity =
      holdUntil >= 1
        ? // shipped behaviour: opacity === progress
          multiply(current.progress, inverted)
        : current.progress.interpolate({
            inputRange: [0, holdUntil],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          });

    return {
      cardStyle: {
        opacity,
        transform: [{ translateY }],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.75],
          extrapolate: 'clamp',
        }),
      },
    };
  };
}

export function modalTransitionVariant(
  variant: CloseVariant,
): Partial<StackNavigationOptions> {
  return {
    gestureDirection: 'vertical',
    transitionSpec: {
      open: springSpec,
      close: variant === 'solidEased' ? easedCloseSpec : springSpec,
    },
    cardStyleInterpolator: interpolatorFor(variant === 'stock' ? 1 : 0.25),
  };
}
