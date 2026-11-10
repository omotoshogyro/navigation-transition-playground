import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Controls from '../components/Controls';

const PALETTE = [
  { bg: '#101828', fg: '#F2F4F7', accent: '#4C6EF5' },
  { bg: '#0B3B2E', fg: '#E9FBF3', accent: '#12B76A' },
  { bg: '#3B1D2B', fg: '#FDEEF4', accent: '#EE46BC' },
  { bg: '#2B1D3B', fg: '#F1ECFD', accent: '#9E77ED' },
];

/**
 * A single card in the demo stack.
 *
 * The grid + edge border exist on purpose: the auth transition scales the
 * incoming card from 0.8 -> 1, and a flat colour field makes that invisible.
 * Straight lines running to the edges make the scale obvious.
 */
export default function DemoScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const depth: number = route.params?.depth ?? 0;
  const theme = PALETTE[depth % PALETTE.length];

  const cells = Math.ceil(width / 44) + 1;

  return (
    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
      {/* grid, purely a visual ruler for the scale/translate */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, r) => (
          <View key={r} style={styles.gridRow}>
            {Array.from({ length: cells }).map((__, c) => (
              <View key={c} style={[styles.gridCell, { borderColor: theme.fg + '14' }]} />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.body, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>SCREEN</Text>
          <Text style={[styles.depth, { color: theme.fg }]}>{depth + 1}</Text>
          <Text style={[styles.hint, { color: theme.fg + 'AA' }]}>
            {depth === 0
              ? 'Push to see the incoming card slide + scale up from 80%. Swipe from the left edge to pop.'
              : 'Watch the card behind: it clears left over the first 40% of progress, faster than this one arrives.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, { backgroundColor: theme.accent }]}
            accessibilityRole="button"
            onPress={() => navigation.push('Demo', { depth: depth + 1 })}>
            <Text style={styles.btnText}>Push screen {depth + 2}</Text>
          </Pressable>
          {depth === 0 && (
            <Pressable
              style={[styles.btn, styles.btnGhost, { borderColor: theme.fg + '55' }]}
              accessibilityRole="button"
              onPress={() => navigation.navigate('Tabs')}>
              <Text style={[styles.btnText, { color: theme.fg }]}>Open tabs flow →</Text>
            </Pressable>
          )}
          {navigation.canGoBack() && (
            <Pressable
              style={[styles.btn, styles.btnGhost, { borderColor: theme.fg + '55' }]}
              accessibilityRole="button"
              onPress={() => navigation.goBack()}>
              <Text style={[styles.btnText, { color: theme.fg }]}>Go back</Text>
            </Pressable>
          )}
        </View>

        <Controls fg={theme.fg} accent={theme.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderWidth: StyleSheet.hairlineWidth },
  gridRow: { flexDirection: 'row' },
  gridCell: { width: 44, height: 44, borderRightWidth: 1, borderBottomWidth: 1 },
  body: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  depth: { fontSize: 96, fontWeight: '800', lineHeight: 104 },
  hint: { fontSize: 15, lineHeight: 22, maxWidth: 340 },
  actions: { gap: 10 },
  btn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
