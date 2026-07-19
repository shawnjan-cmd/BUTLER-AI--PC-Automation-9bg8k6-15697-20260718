/**
 * SCRIPTS LEGACY — v0.8 Archive
 * Preserved for reference. Redirects to the active scripts tab.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { COLOR, FONT, glow } from '@/constants/tokens';

const MONO: any = FONT.mono;

function ScriptsLegacyInner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top + 16 }]}>
      <View style={s.card}>
        <View style={{ height: 3, flexDirection: 'row' }}>
          {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        <View style={{ padding: 24, alignItems: 'center', gap: 14 }}>
          <View style={[s.iconBox, { borderColor: COLOR.amber + '50', backgroundColor: glow(COLOR.amber, 10) }]}>
            <MaterialCommunityIcons name="archive-clock" size={32} color={COLOR.amber} />
          </View>
          <Text style={s.title}>SCRIPT LIBRARY</Text>
          <Text style={s.sub}>LEGACY ARCHIVE v0.8</Text>
          <Text style={s.desc}>
            This page is the legacy version of the Script Library, preserved for reference.
            The active Script Library has been rebuilt with the new cyberpunk design system.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/scripts')}
            style={[s.btn, { backgroundColor: COLOR.cyan }]}>
            <MaterialCommunityIcons name="code-braces-box" size={16} color="#000" />
            <Text style={s.btnTxt}>GO TO ACTIVE SCRIPTS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLOR.bg, padding: 16, alignItems: 'center', justifyContent: 'center' },
  card:    { backgroundColor: COLOR.surf, borderRadius: 16, borderWidth: 1.5, borderColor: COLOR.amber + '30', overflow: 'hidden', width: '100%', maxWidth: 400 },
  iconBox: { width: 70, height: 70, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title:   { fontFamily: MONO, fontSize: 20, fontWeight: '900', color: COLOR.text, letterSpacing: 0.5 },
  sub:     { fontFamily: MONO, fontSize: 9, color: COLOR.amber, letterSpacing: 2 },
  desc:    { fontFamily: MONO, fontSize: 11, color: COLOR.mid, textAlign: 'center', lineHeight: 18 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  btnTxt:  { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

export default function ScriptsLegacyScreen() {
  return (
    <TabErrorBoundary name="Scripts Legacy">
      <ScriptsLegacyInner />
    </TabErrorBoundary>
  );
}
