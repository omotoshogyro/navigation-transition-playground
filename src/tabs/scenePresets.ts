/**
 * Tab transition presets. Every preset is a SceneConfig: the look of a screen
 * as its departure amount d goes 0 (front and centre) to 1 (fully gone).
 * See README "Transition presets".
 */
export type SceneConfig = {
  /** scale of a screen once it has fully left */
  minScale: number;
  /** corner radius of a screen once it has fully left */
  radius: number;
  /** how dark a departed screen goes, 0-1 */
  dim: number;
  /** opacity of a departed screen — 0 gives a full crossfade, 1 no fade */
  fade: number;
  /**
   * Visual horizontal travel. Absolute px, or a fraction of screen width.
   * This is deliberately independent of how far the finger has to move: a 12px
   * slide still commits on a full-width drag.
   */
  travelPx?: number;
  travelFraction?: number;
  spring: { damping: number; stiffness: number; mass: number };
};

const SPRING = { damping: 22, stiffness: 190, mass: 0.9 };

export const SCENE_PRESETS: Record<string, SceneConfig> = {
  // a hint of directional movement, carried by a crossfade. 12px still reads as
  // "came from the right" / "came from the left" without the eye tracking a
  // travelling screen. fade8/fade20 bracket it either side for tuning by thumb.
  fade8: { minScale: 1, radius: 0, dim: 0, fade: 0, travelPx: 8, spring: SPRING },
  fade12: { minScale: 1, radius: 0, dim: 0, fade: 0, travelPx: 12, spring: SPRING },
  fade20: { minScale: 1, radius: 0, dim: 0, fade: 0, travelPx: 20, spring: SPRING },
  // full pager: a screen's width of travel, no fade
  slide: { minScale: 1, radius: 0, dim: 0, fade: 1, travelFraction: 1, spring: SPRING },
  depth: {
    minScale: 0.86,
    radius: 28,
    dim: 0.3,
    fade: 1,
    travelFraction: 0.85,
    spring: SPRING,
  },
};
