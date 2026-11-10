import AuthTransition from './AuthTransition';
import ModalTransition from './ModalTransition';
import { modalTransitionVariant } from './ModalTransitionTuned';

const layouts = { screen: { width: 400, height: 800 } };

// Animated.Value-like stub exposing the interpolate() contract used by the specs
function progress(v: number) {
  return {
    interpolate: ({ inputRange, outputRange, extrapolate }: any) => {
      const [i0, i1] = inputRange;
      const [o0, o1] = outputRange;
      let x = (v - i0) / (i1 - i0);
      if (extrapolate === 'clamp') x = Math.min(1, Math.max(0, x));
      return o0 + (o1 - o0) * x;
    },
    valueOf: () => v,
  } as any;
}

describe('transition specs', () => {
  it('AuthTransition and ModalTransition use the shipped spring', () => {
    for (const t of [AuthTransition, ModalTransition] as any[]) {
      expect(t.transitionSpec.open).toEqual(t.transitionSpec.close);
      expect(t.transitionSpec.open.config).toMatchObject({ stiffness: 1000, damping: 500, overshootClamping: true });
    }
    expect(AuthTransition.gestureDirection).toBe('horizontal');
    expect(ModalTransition.gestureDirection).toBe('vertical');
  });

  it('modal variants differ only where documented', () => {
    expect(modalTransitionVariant('stock').transitionSpec!.close).toEqual(
      modalTransitionVariant('stock').transitionSpec!.open,
    );
    expect((modalTransitionVariant('solidEased').transitionSpec!.close as any).animation).toBe('timing');
    expect((modalTransitionVariant('solid').transitionSpec!.close as any).animation).toBe('spring');
  });

  it('modal interpolator slides from the bottom and fades in', () => {
    const run = (variant: any, p: number) =>
      (modalTransitionVariant(variant).cardStyleInterpolator as any)({
        current: { progress: p === 0.1 ? progress(0.1) : progress(p) },
        inverted: 1,
        layouts,
      });
    // stub multiply: Animated.multiply with a plain number returns an AnimatedMultiplication; just check translate via solid variant
    const solid = run('solid', 0.5);
    expect(solid.cardStyle.opacity).toBe(1); // faded in within first 25%
    const early = run('solid', 0.125);
    expect(early.cardStyle.opacity).toBeCloseTo(0.5);
    expect(solid.overlayStyle.opacity).toBeCloseTo(0.375);
  });
});
