import { SCENE_PRESETS } from './scenePresets';
import { dragProgress, resolveTravel, sceneLook, shouldCommit } from './sceneMath';

describe('SCENE_PRESETS', () => {
  it('fade12 is a 12px crossfade', () => {
    const c = SCENE_PRESETS.fade12;
    expect(resolveTravel(c, 400)).toBe(12);
    expect(sceneLook(0, 1, 12, c).opacity).toBe(1);
    expect(sceneLook(1, 1, 12, c)).toMatchObject({ opacity: 0, translateX: 12, scale: 1, dim: 0 });
    expect(sceneLook(0.5, -1, 12, c)).toMatchObject({ opacity: 0.5, translateX: -6 });
  });
  it('slide travels a full screen width with no fade', () => {
    const c = SCENE_PRESETS.slide;
    expect(resolveTravel(c, 400)).toBe(400);
    expect(sceneLook(1, 1, 400, c)).toMatchObject({ opacity: 1, translateX: 400 });
  });
  it('depth scales, rounds and dims', () => {
    const c = SCENE_PRESETS.depth;
    expect(resolveTravel(c, 400)).toBeCloseTo(340);
    const gone = sceneLook(1, -1, 340, c);
    expect(gone).toMatchObject({ scale: 0.86, borderRadius: 28, dim: 0.3, translateX: -340 });
    expect(sceneLook(0, 1, 340, c)).toMatchObject({ scale: 1, borderRadius: 0, dim: 0 });
  });
  it('clamps d outside 0..1', () => {
    expect(sceneLook(2, 1, 0, SCENE_PRESETS.depth).scale).toBe(0.86);
    expect(sceneLook(-1, 1, 0, SCENE_PRESETS.depth).scale).toBe(1);
  });
});

describe('gesture helpers', () => {
  it('rubber-bands at edges', () => {
    expect(dragProgress(-200, 400, false)).toBe(0.5);
    expect(dragProgress(-800, 400, false)).toBe(1);
    expect(dragProgress(-400, 400, true)).toBe(0.25);
    expect(dragProgress(-100, 400, true)).toBeCloseTo(0.0625);
  });
  it('commits past halfway or on a fling', () => {
    expect(shouldCommit(0.6, 1, 0)).toBe(true);
    expect(shouldCommit(0.2, 1, -500)).toBe(true);
    expect(shouldCommit(0.2, 1, 500)).toBe(false);
    expect(shouldCommit(0.2, -1, 500)).toBe(true);
    expect(shouldCommit(0.2, -1, 100)).toBe(false);
  });
});
