import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LayoutComponent, ShortcutTarget } from '@/services/layoutCustomization';
import { useSkin } from '@/hooks/useSkin';

const PAGES: ShortcutTarget[] = [
  { type: 'page', pageId: 'home' }, { type: 'page', pageId: 'scripts' }, { type: 'page', pageId: 'chat' },
  { type: 'page', pageId: 'knowledge' }, { type: 'page', pageId: 'monitor' }, { type: 'page', pageId: 'cosmetics' }, { type: 'page', pageId: 'settings' },
];

export const ButlerShortcutBlockEditor = memo(function ButlerShortcutBlockEditor({ component, onChange }: { component: LayoutComponent; onChange: (shortcut: ShortcutTarget | undefined) => void }) {
  const skin = useSkin();
  const current = component.shortcut?.type === 'page' ? component.shortcut.pageId : undefined;
  const index = Math.max(0, PAGES.findIndex(target => target.type === 'page' && target.pageId === current));
  const next = PAGES[(index + 1) % PAGES.length];
  return <View style={[styles.card, { borderColor: `${skin.accent3}45`, backgroundColor: `${skin.bg}CC` }]}>
    <View style={styles.row}><MaterialCommunityIcons name={component.iconName as any || 'link-variant'} size={17} color={skin.accent3} /><View style={{ flex: 1 }}><Text style={[styles.title, { color: skin.text }]}>SHORTCUT TARGET</Text><Text style={[styles.meta, { color: skin.mid }]}>{current ? `PAGE · ${current.toUpperCase()}` : 'NOT ASSIGNED · SAFE BY DEFAULT'}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose next safe Butler page shortcut" onPress={() => onChange(next)} style={[styles.button, { borderColor: skin.accent3, backgroundColor: `${skin.accent3}18` }]}><MaterialCommunityIcons name="arrow-right-bold-outline" size={17} color={skin.accent3} /></TouchableOpacity>{current && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear shortcut target" onPress={() => onChange(undefined)} style={[styles.button, { borderColor: skin.warn, backgroundColor: `${skin.warn}18` }]}><MaterialCommunityIcons name="link-off" size={17} color={skin.warn} /></TouchableOpacity>}</View>
    <Text style={[styles.note, { color: skin.mid }]}>Page targets are allowlisted. Script targets appear only when real server script IDs are supplied; this editor never fabricates IDs or launches anything.</Text>
  </View>;
});

const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 6 }, row: { flexDirection: 'row', alignItems: 'center', gap: 7 }, title: { fontFamily: 'monospace', fontSize: 9, fontWeight: '900' }, meta: { fontFamily: 'monospace', fontSize: 7, marginTop: 2, letterSpacing: 0.6 }, note: { fontFamily: 'monospace', fontSize: 7.5, lineHeight: 12 }, button: { width: 36, height: 36, borderWidth: 1.2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } });

export default ButlerShortcutBlockEditor;
