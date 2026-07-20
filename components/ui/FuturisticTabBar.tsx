/**
 * FuturisticTabBar — NEXUS COMMAND DOCK v6.0
 * SCROLLABLE HORIZONTAL — all tabs visible without overlap.
 * Completely new visual: terminal-pill style with colored tags,
 * no icon-in-box, just SVG icon + neon label chip.
 * Active = glowing pill background + top neon stripe.
 * Inactive = ghosted label + dim icon, fully legible.
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
  ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { haptics } from '@/services/haptics';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import QuickButlerBar from '@/components/ui/QuickButlerBar';
import {
  NexusCoreIcon, ForgeScriptsIcon, ButlerAIIcon, KnowledgeBaseIcon,
  IntelLogsIcon, BuilderIcon, VaultIcon, ConfigIcon, SkinsIcon,
} from '@/components/ui/NexusTabIcons';

// ── GLOBAL AI NOTIFICATION STATE ─────────────────────────────────
let _butlerUnread = false;
const _butlerListeners: Set<() => void> = new Set();

export function notifyButlerNewMessage() {
  _butlerUnread = true;
  _butlerListeners.forEach(fn => { try { fn(); } catch (e) { autoErrorLogger?.log?.('warn', '[tabBarListener]', String(e)); } });
}
export function clearButlerUnread() {
  _butlerUnread = false;
  _butlerListeners.forEach(fn => { try { fn(); } catch (e) { autoErrorLogger?.log?.('warn', '[tabBarListener]', String(e)); } });
}
(global as any).__notifyButlerNewMessage = notifyButlerNewMessage;
(global as any).__clearButlerUnread      = clearButlerUnread;

// ── CONSTANTS ────────────────────────────────────────────────────
const MONO: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const BAR_H  = 64;
const ICON_S = 18;
const _SW    = Dimensions.get('window').width;

const HIDDEN_TABS = new Set(['onboarding', 'index', 'terminal', 'support']);

const TAB_ALIASES: Record<string, string> = {
  home: 'nexushome', nexushome: 'nexushome', core: 'nexushome',
  scripts: 'scripts', forge: 'scripts', butlr: 'butler',
  butler: 'butler', ai: 'butler', chat: 'butler',
  knowledge: 'knowledge', kb: 'knowledge',
  logs: 'logs', pc: 'logs', intel: 'logs',
  builder: 'builder', build: 'builder',
  fileshare: 'fileshare', vault: 'fileshare',
  settings: 'settings', config: 'settings', cfg: 'settings',
  cosmetic: 'cosmetic', themes: 'cosmetic', skins: 'cosmetic',
  connect: 'connect',
};

// Each tab gets a unique color + short 4-char label
const TAB_META: Record<string, { color: string; label: string }> = {
  nexushome:      { color: '#00E5FF', label: 'HOME' },
  scripts:        { color: '#CC44FF', label: 'FORG' },
  butler:         { color: '#00FF88', label: 'BTLR' },
  knowledge:      { color: '#00CCFF', label: 'KB  ' },
  logs:           { color: '#FFB020', label: 'INTL' },
  builder:        { color: '#4A9EFF', label: 'BILD' },
  fileshare:      { color: '#FF44AA', label: 'VLUT' },
  settings:       { color: '#FF6644', label: 'CFG ' },
  cosmetic:       { color: '#AA44FF', label: 'SKIN' },
  connect:        { color: '#00CCBB', label: 'PAIR' },
  butler_v1:      { color: '#33AA66', label: 'AI-1' },
  knowledge_v1:   { color: '#3388BB', label: 'KB-1' },
  scripts_legacy: { color: '#AA6633', label: 'SCR1' },
  logs_v1:        { color: '#AA8833', label: 'PC-1' },
  builder_v1:     { color: '#3366AA', label: 'BLD1' },
  fileshare_v1:   { color: '#AA3366', label: 'NET1' },
  cosmetic_v1:    { color: '#6633AA', label: 'SKN1' },
};

function getColor(routeName: string) {
  return TAB_META[routeName]?.color ?? '#00E5FF';
}
function getLabel(routeName: string) {
  return (TAB_META[routeName]?.label ?? routeName.slice(0, 4).toUpperCase()).trim();
}

function renderIcon(routeName: string, color: string, active: boolean) {
  const props = { size: ICON_S, color, active, dimOpacity: 0.85 };
  switch (routeName) {
    case 'nexushome':    return <NexusCoreIcon    {...props} />;
    case 'scripts':      return <ForgeScriptsIcon {...props} />;
    case 'butler':       return <ButlerAIIcon      {...props} />;
    case 'knowledge':    return <KnowledgeBaseIcon {...props} />;
    case 'logs':         return <IntelLogsIcon     {...props} />;
    case 'builder':      return <BuilderIcon       {...props} />;
    case 'fileshare':    return <VaultIcon         {...props} />;
    case 'settings':     return <ConfigIcon        {...props} />;
    case 'cosmetic':     return <SkinsIcon         {...props} />;
    default:
      return <ButlerAIIcon {...props} />;
  }
}

// ── SINGLE TAB PILL ───────────────────────────────────────────────
interface TabPillProps {
  routeName: string;
  isFocused: boolean;
  label: string;
  onPress: () => void;
}

function TabPill({ routeName, isFocused, label, onPress }: TabPillProps) {
  const color   = getColor(routeName);
  const shortLbl = getLabel(routeName);

  // Animations — all native-driver safe (opacity + scale only)
  const scaleA   = useRef(new Animated.Value(isFocused ? 1.06 : 1)).current;
  const opA      = useRef(new Animated.Value(isFocused ? 1 : 0.62)).current;
  const dotA     = useRef(new Animated.Value(0.4)).current;
  const redDotA  = useRef(new Animated.Value(0.5)).current;
  const [hasUnread, setHasUnread] = useState(_butlerUnread && routeName === 'butler');

  useEffect(() => {
    if (routeName !== 'butler') return;
    const fn = () => setHasUnread(_butlerUnread);
    _butlerListeners.add(fn);
    return () => { _butlerListeners.delete(fn); };
  }, [routeName]);

  useEffect(() => {
    if (isFocused && routeName === 'butler') clearButlerUnread();
  }, [isFocused, routeName]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleA, { toValue: isFocused ? 1.06 : 1,    useNativeDriver: true, speed: 28, bounciness: 12 }),
      Animated.timing(opA,    { toValue: isFocused ? 1   : 0.62, useNativeDriver: true, duration: 200 }),
    ]).start();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dotA, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(dotA, { toValue: 0.2, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isFocused]);

  useEffect(() => {
    if (!hasUnread) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(redDotA, { toValue: 1,    duration: 380, useNativeDriver: true }),
      Animated.timing(redDotA, { toValue: 0.25, duration: 380, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [hasUnread]);

  return (
    <TouchableOpacity
      onPress={() => { haptics.light(); onPress(); }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={tp.touch}
    >
      <Animated.View style={[tp.pill,
        isFocused
          ? { backgroundColor: color + '18', borderColor: color + '80' }
          : { backgroundColor: 'transparent', borderColor: color + '28' },
        { transform: [{ scale: scaleA }], opacity: opA },
      ]}>
        {/* Top accent stripe on active */}
        {isFocused && (
          <View style={[tp.topStripe, { backgroundColor: color }]} />
        )}

        {/* Icon row */}
        <View style={tp.iconRow}>
          {renderIcon(routeName, color, isFocused)}

          {/* Active pulsing dot */}
          {isFocused && (
            <Animated.View style={[tp.activeDot, { backgroundColor: color, opacity: dotA }]} />
          )}

          {/* Unread badge */}
          {hasUnread && !isFocused && (
            <Animated.View style={[tp.unreadDot, { opacity: redDotA }]} />
          )}
        </View>

        {/* Label */}
        <Text
          style={[tp.label, { color: isFocused ? color : color + '88' }]}
          numberOfLines={1}
        >
          {shortLbl}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const tp = StyleSheet.create({
  touch:      { marginHorizontal: 3 },
  pill:       {
    width: 54, alignItems: 'center', justifyContent: 'center',
    paddingTop: 6, paddingBottom: 5,
    borderRadius: 13, borderWidth: 1.5,
    overflow: 'hidden', position: 'relative',
  },
  topStripe:  { position: 'absolute', top: 0, left: 4, right: 4, height: 2.5, borderRadius: 1.5 },
  iconRow:    { position: 'relative', marginBottom: 3, alignItems: 'center', justifyContent: 'center' },
  activeDot:  { position: 'absolute', bottom: -4, width: 4, height: 4, borderRadius: 2 },
  unreadDot:  {
    position: 'absolute', top: -4, right: -4,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#FF3344', borderWidth: 1.5, borderColor: '#010810',
  },
  label:      { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.4 },
});

// ── MAIN TAB BAR ─────────────────────────────────────────────────
export default function FuturisticTabBar(
  props: BottomTabBarProps & {
    iconMap?: Record<string, (color: string, size: number) => React.ReactNode>;
  },
) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (global as any).__butlerSwitchTab = (tab: string) => {
      const route = TAB_ALIASES[String(tab || '').toLowerCase()] || tab;
      try { navigation.navigate(route as never); } catch {}
    };
    return () => { delete (global as any).__butlerSwitchTab; };
  }, [navigation]);

  const visibleRoutes = useMemo(() =>
    state.routes
      .map((route, idx) => ({ route, idx }))
      .filter(({ route }) => {
        if (HIDDEN_TABS.has(route.name)) return false;
        const opts = descriptors[route.key].options as any;
        if (opts?.href === null)                         return false;
        if (opts?.tabBarButton === null)                 return false;
        if ((opts?.tabBarItemStyle as any)?.display === 'none') return false;
        return true;
      }),
    [state.routes, descriptors],
  );

  const activeRouteName = visibleRoutes.find(r => r.idx === state.index)?.route?.name ?? 'nexushome';
  const isOnButlerTab   = activeRouteName === 'butler';

  const scrollRef = useRef<ScrollView>(null);
  const activeVisIdx = visibleRoutes.findIndex(r => r.idx === state.index);

  // Auto-scroll to keep active tab visible
  useEffect(() => {
    if (scrollRef.current && activeVisIdx >= 0) {
      // Each pill is ~60px wide with 6px margin — scroll to center it
      const approxX = Math.max(0, activeVisIdx * 60 - _SW / 2 + 30);
      scrollRef.current.scrollTo({ x: approxX, animated: true });
    }
  }, [activeVisIdx]);

  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;

  // Multi-color top signal line colors
  const signalColors = visibleRoutes.map(({ route }) => getColor(route.name));

  return (
    <View pointerEvents="box-none" style={[st.outerWrap, { paddingBottom: bottomPad }]}>
      {/* QuickButlerBar only when not on AI chat tab */}
      {!isOnButlerTab && <QuickButlerBar />}

      {/* Shadow plate */}
      <View pointerEvents="none" style={st.shadowPlate} />

      {/* The dock */}
      <View style={st.deck}>

        {/* ── MULTI-COLOR SIGNAL LINE ── */}
        <View pointerEvents="none" style={st.signalLine}>
          {signalColors.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>

        {/* ── SCROLLABLE TAB ROW ── */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.scrollContent}
          style={st.scroll}
          decelerationRate="fast"
          snapToInterval={60}
          snapToAlignment="start"
          bounces={false}
          overScrollMode="never"
        >
          {visibleRoutes.map(({ route, idx }) => {
            const { options } = descriptors[route.key];
            const isFocused   = state.index === idx;
            const label       = typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel : options.title ?? route.name;
            const onPress = () => {
              const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !ev.defaultPrevented) navigation.navigate(route.name as never);
            };
            return (
              <TabPill
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                label={String(label)}
                onPress={onPress}
              />
            );
          })}
          {/* Trailing spacer so last tab isn't clipped */}
          <View style={{ width: 12 }} />
        </ScrollView>

        {/* Right fade-out gradient hint */}
        <View pointerEvents="none" style={st.rightFade} />

      </View>
    </View>
  );
}

const st = StyleSheet.create({
  outerWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 4,
  },
  shadowPlate: {
    position: 'absolute', left: 6, right: 6, bottom: 0, top: 10,
    borderRadius: 18, backgroundColor: '#000', opacity: 0.8,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.92, shadowRadius: 22 },
      android: { elevation: 22 },
      default: {},
    }),
  },
  deck: {
    height: BAR_H, marginHorizontal: 6, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#020912',
    borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.18)',
    ...Platform.select({ android: { elevation: 14 }, default: {} }),
  },
  signalLine: {
    height: 3, flexDirection: 'row', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
  },
  scroll: {
    flex: 1,
    marginTop: 3,     // below the signal line
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 4,
    minHeight: BAR_H - 3,
  },
  rightFade: {
    position: 'absolute', right: 0, top: 3, bottom: 0, width: 28,
    // Simple transparency hint — not a real gradient (no expo-linear-gradient dep needed)
    backgroundColor: 'transparent',
    borderRightWidth: 0,
  },
});
