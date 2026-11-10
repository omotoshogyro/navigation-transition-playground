import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  createNavigatorFactory,
  TabRouter,
  useNavigationBuilder,
  TabActions,
} from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { SCENE_PRESETS, type SceneConfig } from './scenePresets';
import { dragProgress, resolveTravel, sceneLook, shouldCommit } from './sceneMath';

export { SCENE_PRESETS };
export type { SceneConfig };

type SceneProps = {
  index: number;
  /** 0 → 1 progress of the current transition */
  t: SharedValue<number>;
  from: SharedValue<number>;
  to: SharedValue<number>;
  /** +1 when moving to a later tab, -1 to an earlier one */
  dir: SharedValue<number>;
  config: SceneConfig;
  focused: boolean;
  /** resolved visual travel in px */
  travel: number;
  children: React.ReactNode;
};

/**
 * One screen.
 *
 * Only the two screens involved in the current transition are ever visible, and
 * each derives its look from a single value `d`: 0 = front and centre, 1 = fully
 * departed. The incoming screen runs d from 1 to 0, the outgoing from 0 to 1.
 *
 * Crucially `d` is normalised, so a 1 -> 4 switch renders exactly like 1 -> 2.
 * Index distance never enters the animation.
 */
function Scene({ index, t, from, to, dir, config, focused, travel, children }: SceneProps) {
  const style = useAnimatedStyle(() => {
    const isTo = index === to.value;
    const isFrom = index === from.value;

    if (!isTo && !isFrom) {
      // not part of this transition — never let an unrelated tab flash past
      return { display: 'none' as const, opacity: 0 };
    }

    // the incoming screen enters from the direction of travel; the outgoing one
    // leaves the opposite way
    const d = isTo ? 1 - t.value : t.value;
    const side = isTo ? dir.value : -dir.value;

    const look = sceneLook(d, side, travel, config);
    return {
      display: 'flex' as const,
      zIndex: isTo ? 1 : 0,
      opacity: look.opacity,
      borderRadius: look.borderRadius,
      transform: [{ translateX: look.translateX }, { scale: look.scale }],
    };
  });

  // separate layer so the dim darkens the screen rather than fading it out
  const dimStyle = useAnimatedStyle(() => {
    const isTo = index === to.value;
    const isFrom = index === from.value;
    if (!isTo && !isFrom) {
      return { opacity: 0 };
    }
    const d = isTo ? 1 - t.value : t.value;
    return { opacity: sceneLook(d, 0, 0, config).dim };
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.scene, style]}
      pointerEvents={focused ? 'auto' : 'none'}>
      {children}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.dim, dimStyle]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

/**
 * A tab navigator that hosts its own scenes so they can be animated and driven
 * by a gesture.
 *
 * createBottomTabNavigator (v6) renders each scene as a react-native-screens
 * <Screen activityState={focused ? 2 : 0}>, which hides the outgoing scene
 * natively the instant the index changes. There is no window in which to
 * animate it out, and no way to render two scenes at once.
 *
 * Router behaviour is stock: TabRouter drives state, so deep links, jumpTo,
 * back behaviour and state persistence all work as usual.
 */
function AnimatedTabNavigator({
  initialRouteName,
  children,
  screenOptions,
  tabBar,
  sceneConfig = SCENE_PRESETS.fade12,
  swipeEnabled = true,
  hapticsEnabled = true,
}: any) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(
    TabRouter,
    { initialRouteName, children, screenOptions },
  );

  const { width } = useWindowDimensions();
  const config: SceneConfig = sceneConfig;
  const count = state.routes.length;

  // How far a screen moves on screen. Deliberately NOT how far the finger has
  // to move — a 12px slide would otherwise mean a 12px drag switches tabs.
  const travel = resolveTravel(config, width);
  // The finger always covers a full screen width to commit, whatever the
  // visual travel is.
  const gestureDistance = width;

  // The transition, rather than a position on an axis. Modelling it this way is
  // what makes 1 -> 4 animate identically to 1 -> 2.
  const t = useSharedValue(1);
  const from = useSharedValue(state.index);
  const to = useSharedValue(state.index);
  const dir = useSharedValue(1);
  const current = useSharedValue(state.index);

  const animatedTo = useRef(state.index);
  // set just before a gesture-committed jumpTo, so the effect below does not
  // restart an animation the gesture is already running
  const committedByGesture = useRef(false);

  const haptic = () => {
    if (hapticsEnabled) {
      // selectionAsync is the "selection moved" tick — a single light click,
      // quieter than impactAsync(Light).
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const jumpTo = (routeName: string) => {
    if (routeName !== state.routes[state.index].name) {
      haptic();
    }
    navigation.dispatch({ ...TabActions.jumpTo(routeName), target: state.key });
  };

  const commitFromGesture = (routeName: string) => {
    committedByGesture.current = true;
    haptic();
    navigation.dispatch({ ...TabActions.jumpTo(routeName), target: state.key });
  };

  useEffect(() => {
    if (animatedTo.current === state.index) {
      return;
    }
    const prev = animatedTo.current;
    animatedTo.current = state.index;
    current.value = state.index;

    if (committedByGesture.current) {
      // the gesture is already springing t -> 1 toward this route
      committedByGesture.current = false;
      return;
    }

    // Interrupting mid-flight: hand over from whichever screen is currently
    // dominant, not from `prev`, so the departing screen is the one actually on
    // screen. It does snap to full opacity at the handover — the cost of
    // restarting a normalised transition rather than retargeting a position.
    from.value = t.value < 0.5 ? from.value : to.value;
    to.value = state.index;
    dir.value = Math.sign(state.index - prev) || 1;
    t.value = 0;
    t.value = withSpring(1, config.spring);
  }, [state.index, config.spring, from, to, dir, t, current]);

  // Neighbours must already be mounted for a swipe to reveal anything. Visited
  // tabs stay in the list so the outgoing screen of any later transition exists.
  const [loaded, setLoaded] = useState(() => [state.index]);
  useEffect(() => {
    setLoaded(prev => {
      const next = [state.index - 1, state.index, state.index + 1].filter(
        i => i >= 0 && i < count && !prev.includes(i),
      );
      return next.length ? [...prev, ...next] : prev;
    });
  }, [state.index, count]);

  const pan = Gesture.Pan()
    // require clear horizontal intent so vertical scrolling inside a tab wins
    .activeOffsetX([-16, 16])
    .failOffsetY([-14, 14])
    .enabled(swipeEnabled && count > 1)
    .onBegin(() => {
      from.value = current.value;
      to.value = current.value;
      t.value = 0;
    })
    .onUpdate(e => {
      const wantDir = e.translationX < 0 ? 1 : -1;
      const candidate = current.value + wantDir;
      const atEdge = candidate < 0 || candidate > count - 1;

      dir.value = wantDir;
      to.value = atEdge ? current.value : candidate;

      // rubber band when there is no tab to move to
      t.value = dragProgress(e.translationX, gestureDistance, atEdge);
    })
    .onEnd(e => {
      const target = to.value;
      if (target === current.value) {
        t.value = withSpring(0, config.spring);
        return;
      }

      // t grows as the finger moves away from the start, in whichever direction
      const tVelocity = (dir.value === 1 ? -e.velocityX : e.velocityX) / gestureDistance;

      if (shouldCommit(t.value, dir.value, e.velocityX)) {
        t.value = withSpring(1, { ...config.spring, velocity: tVelocity });
        scheduleOnRN(commitFromGesture, state.routes[target].name);
      } else {
        // not far enough — fall back to where we started, silently
        t.value = withSpring(0, { ...config.spring, velocity: tVelocity });
      }
    });

  return (
    <NavigationContent>
      <GestureDetector gesture={pan}>
        <View style={styles.root}>
          {state.routes.map((route, index) => {
            if (!loaded.includes(index)) {
              return null;
            }
            return (
              <Scene
                key={route.key}
                index={index}
                t={t}
                from={from}
                to={to}
                dir={dir}
                config={config}
                focused={state.index === index}
                travel={travel}>
                {descriptors[route.key].render()}
              </Scene>
            );
          })}
        </View>
      </GestureDetector>

      {tabBar({
        state,
        descriptors,
        navigation,
        onTabPress: (routeName: string) => jumpTo(routeName),
      })}
    </NavigationContent>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#000' },
  scene: { overflow: 'hidden' },
  dim: { backgroundColor: '#000' },
});

export const createAnimatedTabNavigator = createNavigatorFactory(AnimatedTabNavigator);
