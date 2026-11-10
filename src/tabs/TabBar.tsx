import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBar({ state, onTabPress }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityLabel={`${route.name} tab`}
            accessibilityState={{ selected: focused }}
            accessibilityHint={focused ? undefined : `Switches to ${route.name}`}
            hitSlop={{ top: 6, bottom: 6 }}
            onPress={() => !focused && onTabPress(route.name)}>
            <View style={[styles.dot, focused && styles.dotActive]} />
            <Text style={[styles.label, focused && styles.labelActive]}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#0B0F1A',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#FFFFFF22',
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center', gap: 5, minHeight: 44 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF33' },
  dotActive: { backgroundColor: '#4C6EF5' },
  label: { fontSize: 11, fontWeight: '600', color: '#FFFFFF66' },
  labelActive: { color: '#FFFFFF' },
});
