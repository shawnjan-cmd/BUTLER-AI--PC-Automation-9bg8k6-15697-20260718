/**
 * SCRIPTS LEGACY — v0.8 Archive index
 * Now a visible tab (SCR-V1) after Settings.
 * Shows what each legacy tab contains + navigation buttons.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { COLOR, FONT, glow } from '@/constants/tokens';

const MONO: any = FONT.mono;

const LEGACY_TABS = [
  {
    tab: 'AI-V1',
    route: '/(tabs)/butler_v1',
    title: 'Butler AI Chat v1',
    desc: 'Full original chat page: NexusV8 hero header, emoji reactions on messages, context suggestion rail, session stats strip, scroll-to-bottom with unread badge, AI disclosure modal, PrivacyWhy card, PerformanceMonitorWidget, AutomationFeed, NexusQuickChips, ButlerWelcomeHub, and complete input bar with HUD corner brackets.',
    color: COLOR.cyan,
    icon: 'robot-outline' as const,
    lib: 'community' as const,
  },
  {
    tab: 'KB-V1',
    route: '/(tabs)/knowledge_v1',
    title: 'Knowledge Base v1',
    desc: 'Full 9-tab KB page: SIGMA-NET visualiser, neural KB graph, Φ-NEXUS bridge protocol tab, Butler Bot full tab with log terminal, QLH harvester, lambda scan file import, domain breakdown chart, growth sparkline, recent crawl history, and all category bar animations.',
    color: COLOR.amber,
    icon: 'brain' as const,
    lib: 'community' as const,
  },
];

function ScriptsLegacyInner() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLOR.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 120, paddingHorizontal: 14, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={{ height: 3, flexDirection: 'row' }}>
          {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[s.iconBox, { borderColor: COLOR.amber + '50', backgroundColor: glow(COLOR.amber, 10) }]}>
              <MaterialIcons name="history" size={24} color={COLOR.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: COLOR.amber }]}>LEGACY ARCHIVE</Text>
              <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.mid, marginTop: 2, letterSpacing: 0.8 }}>
                SCR-V1 · All pages visible after Settings tab
              </Text>
            </View>
          </View>
          <View style={[s.infoBanner, { borderColor: COLOR.green + '30', backgroundColor: glow(COLOR.green, 6) }]}>
            <MaterialIcons name="check-circle-outline" size={13} color={COLOR.green} />
            <Text style={{ fontFamily: MONO, fontSize: 10.5, color: COLOR.mid, flex: 1, lineHeight: 16 }}>
              {'Open AI-V1, KB-V1, or SCR-V1 tabs directly from the tab bar to read and copy code without spending credits.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Legacy tab cards */}
      {LEGACY_TABS.map(info => {
        const Icon = info.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
        return (
          <View key={info.tab} style={[s.card, { borderColor: info.color + '30', borderTopColor: info.color }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={[s.iconBox, { borderColor: info.color + '45', backgroundColor: glow(info.color, 10), width: 50, height: 50, borderRadius: 14 }]}>
                <Icon name={info.icon as any} size={24} color={info.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: info.color }]}>{info.title}</Text>
                <View style={[s.tabBadge, { borderColor: info.color + '55', backgroundColor: glow(info.color, 10) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: info.color }}>{info.tab} TAB</Text>
                </View>
              </View>
            </View>
            <Text style={s.cardDesc}>{info.desc}</Text>
            <TouchableOpacity
              onPress={() => router.push(info.route as any)}
              style={[s.navBtn, { borderColor: info.color + '55', backgroundColor: glow(info.color, 9) }]}
            >
              <MaterialIcons name="open-in-new" size={14} color={info.color} />
              <Text style={[s.navBtnTxt, { color: info.color }]}>OPEN {info.tab} — READ CODE</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* SCR-V1 current page note */}
      <View style={[s.card, { borderColor: COLOR.amber + '30', borderTopColor: COLOR.amber }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <View style={[s.iconBox, { borderColor: COLOR.amber + '45', backgroundColor: glow(COLOR.amber, 10), width: 50, height: 50, borderRadius: 14 }]}>
            <MaterialIcons name="history" size={24} color={COLOR.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: COLOR.amber }]}>Script Library Archive (this page)</Text>
            <View style={[s.tabBadge, { borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 10) }]}>
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.amber }}>SCR-V1 TAB</Text>
            </View>
          </View>
        </View>
        <Text style={s.cardDesc}>
          {'This is the SCR-V1 index page. The original scripts page was fully rewritten as FORGE. Navigate to the active scripts from below.'}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/scripts')}
          style={[s.navBtn, { backgroundColor: COLOR.cyan }]}
        >
          <MaterialCommunityIcons name="code-braces-box" size={14} color="#000" />
          <Text style={[s.navBtnTxt, { color: '#000' }]}>GO TO ACTIVE SCRIPTS (FORGE)</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.dim, textAlign: 'center', lineHeight: 14, paddingHorizontal: 16 }}>
        {'Tab bar order after Settings:\nAI-V1 · KB-V1 · SCR-V1\nScroll right in the tab bar to reach them.'}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header:     { backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1.5, borderColor: COLOR.amber + '30', overflow: 'hidden' },
  card:       { backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1, borderTopWidth: 3, padding: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  iconBox:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  title:      { fontFamily: MONO, fontSize: 18, fontWeight: '900', letterSpacing: 0.4 },
  cardTitle:  { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 0.3, marginBottom: 6 },
  cardDesc:   { fontFamily: MONO, fontSize: 11, color: COLOR.mid, lineHeight: 17, marginBottom: 14 },
  tabBadge:   { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  navBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: 'transparent', borderRadius: 11, paddingVertical: 12 },
  navBtnTxt:  { fontFamily: MONO, fontSize: 11, fontWeight: '900' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 11 },
});

export default function ScriptsLegacyScreen() {
  return (
    <TabErrorBoundary name="Scripts Legacy">
      <ScriptsLegacyInner />
    </TabErrorBoundary>
  );
}
