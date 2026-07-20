import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createAnimatedTabNavigator, SCENE_PRESETS } from './createAnimatedTabNavigator';
import TabBar from './TabBar';

const Tab = createAnimatedTabNavigator();

const TABS = [
  { name: 'Newsfeed', bg: '#101828', accent: '#4C6EF5' },
  { name: 'Explore', bg: '#0B3B2E', accent: '#12B76A' },
  { name: 'Chat', bg: '#3B1D2B', accent: '#EE46BC' },
  { name: 'More', bg: '#2B1D3B', accent: '#9E77ED' },
];

function TabContent({ name, bg, accent }: (typeof TABS)[number]) {
  const insets = useSafeAreaInsets();

  return (
    // opaque on purpose: the incoming scene must occlude the outgoing one as it
    // slides over, otherwise the two read as a crossfade rather than a stack
    <View style={[styles.scene, { backgroundColor: bg, paddingTop: insets.top + 16 }]}>
      <Text style={[styles.eyebrow, { color: accent }]}>TAB</Text>
      <Text style={styles.title}>{name}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rows}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: accent + '55' }]} />
            <View style={styles.rowLines}>
              <View style={[styles.line, { width: `${60 + ((i * 7) % 35)}%` }]} />
              <View style={[styles.line, styles.lineDim, { width: `${30 + ((i * 11) % 40)}%` }]} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Direction is derived from tab order: moving right pulls the new scene in from
 * the right, moving left pulls it from the left. That falls out of positioning
 * scenes on a shared axis, so nothing tracks "previous index" by hand.
 */
export default function TabsFlow() {
  const navigation = useNavigation<any>();
  const [presetKey, setPresetKey] = useState<keyof typeof SCENE_PRESETS>('fade12');
  const [haptics, setHaptics] = useState(true);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Tab.Navigator
        tabBar={(props: any) => <TabBar {...props} />}
        sceneConfig={SCENE_PRESETS[presetKey]}
        hapticsEnabled={haptics}>
        {TABS.map(t => (
          <Tab.Screen key={t.name} name={t.name}>
            {() => <TabContent {...t} />}
          </Tab.Screen>
        ))}
      </Tab.Navigator>

      <View style={[styles.hud, { top: insets.top + 6 }]}>
        {(['fade8', 'fade12', 'fade20', 'depth'] as const).map(k => (
          <Pressable
            key={k}
            onPress={() => setPresetKey(k)}
            style={[styles.hudItem, presetKey === k && styles.hudItemActive]}>
            <Text style={styles.hudText}>{k}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setHaptics(h => !h)}
          style={[styles.hudItem, haptics && styles.hudItemActive]}>
          <Text style={styles.hudText}>haptic</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.hudItem}>
          <Text style={styles.hudText}>close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scene: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 14 },
  rows: { gap: 14, paddingBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  rowLines: { flex: 1, gap: 6 },
  line: { height: 9, borderRadius: 5, backgroundColor: '#FFFFFF22' },
  lineDim: { backgroundColor: '#FFFFFF12' },
  hud: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#000000AA',
    padding: 4,
    borderRadius: 10,
  },
  hudItem: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  hudItemActive: { backgroundColor: '#4C6EF5' },
  hudText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
