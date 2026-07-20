import React from 'react';
import { View, Text, Pressable, StyleSheet, I18nManager } from 'react-native';
import { PRESETS, CLOSE_VARIANTS, useDemoConfig } from '../DemoConfig';

function Segment<T extends string>({
  value,
  options,
  onChange,
  fg,
  accent,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
  fg: string;
  accent: string;
}) {
  return (
    <View style={[styles.segment, { borderColor: fg + '33' }]}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.segmentItem, active && { backgroundColor: accent }]}>
            <Text
              numberOfLines={1}
              style={[styles.segmentText, { color: active ? '#fff' : fg + 'BB' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Live switcher. Changing screenOptions re-reads the interpolator on the next
 * transition, so you can flip presets without restarting the app.
 */
export default function Controls({ fg, accent }: { fg: string; accent: string }) {
  const { preset, speed, close, setPreset, setSpeed, setClose } = useDemoConfig();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: fg + '88' }]}>TRANSITION</Text>
      <Segment value={preset} options={PRESETS} onChange={setPreset} fg={fg} accent={accent} />

      {preset === 'modal' && (
        <>
          <Text style={[styles.label, { color: fg + '88' }]}>CLOSE BEHAVIOUR</Text>
          <Segment
            value={close}
            options={CLOSE_VARIANTS}
            onChange={setClose}
            fg={fg}
            accent={accent}
          />
        </>
      )}

      <Text style={[styles.label, { color: fg + '88' }]}>SPEED</Text>
      <Segment
        value={speed}
        options={[
          { key: 'real' as const, label: 'Real spring' },
          { key: 'slow' as const, label: 'Slow-mo 1.6s' },
        ]}
        onChange={setSpeed}
        fg={fg}
        accent={accent}
      />

      <Text style={[styles.foot, { color: fg + '66' }]}>
        RTL: {I18nManager.isRTL ? 'on — transforms mirror via `inverted`' : 'off'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingTop: 14 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  segmentItem: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  segmentText: { fontSize: 12, fontWeight: '600' },
  foot: { fontSize: 11, paddingTop: 4 },
});
