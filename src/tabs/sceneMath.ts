/**
 * Pure maths behind createAnimatedTabNavigator, kept free of react-native
 * imports so it can be unit tested. Functions are marked 'worklet' so they can
 * be called from reanimated UI-thread callbacks.
 */

export type SceneLook = {
  /** scale of a screen once it has fully left */
  minScale: number;
  radius: number;
  dim: number;
  fade: number;
};

/** past this fling speed (px/s) a swipe commits regardless of distance dragged */
export const VELOCITY_COMMIT = 450;

/** Linear map of x from [0,1] to [a,b], clamped (same as interpolate + CLAMP). */
export function lerpClamped(x: number, a: number, b: number): number {
  'worklet';
  const c = x < 0 ? 0 : x > 1 ? 1 : x;
  return a + (b - a) * c;
}

/** Visual travel in px: absolute travelPx wins, else a fraction of the width. */
export function resolveTravel(
  config: { travelPx?: number; travelFraction?: number },
  width: number,
): number {
  return config.travelPx ?? width * (config.travelFraction ?? 1);
}

/**
 * Look of one scene at departure amount `d` (0 = front and centre, 1 = fully
 * departed). `side` is +1/-1, the direction it departs towards.
 */
export function sceneLook(d: number, side: number, travel: number, config: SceneLook) {
  'worklet';
  return {
    opacity: lerpClamped(d, 1, config.fade),
    borderRadius: lerpClamped(d, 0, config.radius),
    translateX: side * travel * d,
    scale: lerpClamped(d, 1, config.minScale),
    dim: lerpClamped(d, 0, config.dim),
  };
}

/** Transition progress while dragging; rubber-bands (max 0.25) at the edges. */
export function dragProgress(translationX: number, distance: number, atEdge: boolean): number {
  'worklet';
  const raw = Math.abs(translationX) / distance;
  return atEdge ? Math.min(raw * 0.25, 0.25) : Math.min(raw, 1);
}

/** Whether a released drag commits to the next tab. dir: +1 later tab, -1 earlier. */
export function shouldCommit(t: number, dir: number, velocityX: number): boolean {
  'worklet';
  const flung = dir === 1 ? velocityX < -VELOCITY_COMMIT : velocityX > VELOCITY_COMMIT;
  return t > 0.5 || flung;
}
