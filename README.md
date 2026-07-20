# AuthTransition demo

Isolates `src/navigation/AuthTransition.ts` from **mobile-native** (Minds) so the
transition can be felt on a physical iPhone / Android device.

`src/transitions/AuthTransition.ts` is a **byte-for-byte copy** of the file in
mobile-native. `src/transitions/ModalTransition.ts` is a copy too, with one
change: the deep type import
(`@react-navigation/stack/lib/typescript/src/types`) is replaced by a type
derived from the public options type, because that internal path moved.

React Navigation here is v7, not v6 as in mobile-native — Expo SDK 57 / RN 0.86
requires it. The card-interpolator API (`cardStyleInterpolator`,
`StackCardInterpolationProps`, `current.progress`, `next.progress`, `inverted`)
is unchanged between v6 and v7, so the transition behaves identically.

## Run

```bash
cd ~/Desktop/auth-transition-demo
npm start
```

Then scan the QR with **Expo Go** (iOS: Camera app; Android: the Expo Go
scanner). Phone and Mac must be on the same Wi-Fi. If your network blocks it,
use `npx expo start --tunnel`.

No native build needed — every dependency is bundled in Expo Go.

## What's in the UI

- **Transition** — switch live between `AuthTransition`, `ModalTransition` and
  React Navigation's stock `SlideFromRightIOS`. Takes effect on the next push.
- **Speed** — *Real spring* is the production spec (stiffness 1000, damping 500,
  overshootClamping — settles in ~250ms). *Slow-mo 1.6s* swaps only the
  `transitionSpec` for a linear timing curve and keeps the same interpolator, so
  you can actually see the curve shape.
- **Close behaviour** (shown only for the Modal preset) — compares the shipped
  dismiss against two candidate fixes. See below.
- **Push / Go back**, plus edge-swipe back (horizontal for auth, vertical for
  modal).

## The modal dismiss

The shipped `ModalTransition` ties card opacity linearly to progress, so the
card is semi-transparent across a full screen-height of travel. Entering, that
is invisible (the card is offscreen while it is faint); exiting, it happens in
full view and reads as a dissolve-in-place rather than a slide-away.

| Variant | Change |
|---|---|
| `Stock` | as shipped — `opacity = progress` |
| `Solid card` | fade compressed into the first 25% of progress; card is opaque for the rest of the trip |
| `Solid + eased` | the above, plus a 300ms `Easing.in(Easing.cubic)` **close** spec only (open stays the stock spring) |

Note the open and close specs are identical in the shipped file, so the dismiss
is not timed differently from the present — only the interpolator is at fault.

Slow-mo overrides both specs, so `Solid + eased` loses its distinct close curve
under slow-mo; use it to read the interpolator, then switch back to Real spring
to judge the timing.

## What to look for, in slow-mo

| | |
|---|---|
| Incoming card | slides in from `screen.width`, **and** scales `0.8 → 1` |
| Outgoing card | pushed to `-screen.width` over the **first 40%** of progress — it clears out before the new one lands, leaving a brief gap |
| `perspective: 1000` | makes the scale render correctly in 3D on Android; drop it and Android flattens the zoom |
| `extrapolate: 'identity'` on scale | scale keeps going past 1 during an overscrolling gesture, unlike the clamped translate |
| `inverted` | ±1 for RTL; every transform is multiplied by it so the animation mirrors. Current RTL state is shown at the bottom of the controls |

Compare against *Default iOS*: the stock preset has no scale, and the outgoing
card only moves ~30% of the width with a shadow — this one moves a full width
and zooms.

## Testing RTL mirroring

RTL cannot be toggled at runtime. To check it, add to `App.tsx` above the
component and reload:

```ts
import { I18nManager } from 'react-native';
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
```

In Expo Go this needs a full app restart (close and reopen Expo Go), not just a
Fast Refresh.

## Files

- `App.tsx` — `NavigationContainer` + JS stack; `screenOptions` is the transition
  object, matching `NavigationStack.tsx:253` in mobile-native
- `src/DemoConfig.tsx` — preset/speed state and options composition
- `src/screens/DemoScreen.tsx` — the card (grid background is a deliberate ruler
  for reading the scale)
- `src/components/Controls.tsx` — the segmented switchers
