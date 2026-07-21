/**
 * FuturisticTabBar — NEXUS COMMAND DOCK v7.0
 * ALL TABS VISIBLE ON SCREEN — no horizontal scroll.
 * Compact icon-only pills that fit any phone width.
 * Each tab gets its unique neon accent. Active = glowing top stripe + filled bg.
 * Inactive = minimal ghost. Fits 10 tabs on 320px screens.
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
  Dimensions,
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
const BAR_H  = 58;   // compact height — fits icon + label
const ICON_S = 16;
const _SW    = Math.max(320, Dimensions.get('window').width);

// Tabs that should never be shown in the bar
const HIDDEN_TABS = new Set([
  'onboarding', 'index',
  // terminal and support are now accessible through other tabs
  'terminal', 'support',
]);

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
  connect: 'connect', pair: 'connect',
};

const TAB_META: Record<string, { color: string; label: string }> = {
  nexushome: { color: '#00E5FF', label: 'HOME' },
  scripts:   { color: '#CC44FF', label: 'SCRPT' },
  butler:    { color: '#00FF88', label: 'AI' },
  knowledge: { color: '#4A9EFF', label: 'KB' },
  logs:      { color: '#FFB020', label: 'PC' },
  builder:   { color: '#FF6644', label: 'BUILD' },
  fileshare: { color: '#FF44AA', label: 'NET' },
  settings:  { color: '#8888AA', label: 'CFG' },
  cosmetic:  { color: '#AA44FF', label: 'SKIN' },
  connect:   { color: '#00CCBB', label: 'PAIR' },
};

function getColor(r: string) { return TAB_META[r]?.color ?? '#00E5FF'; }
function getLabel(r: string) { return TAB_META[r]?.label ?? r.slice(0,4).toUpperCase(); }

function renderIcon(routeName: string, color: string, active: boolean) {
  const props = { size: ICON_S, color, active, dimOpacity: 0.9 };
  switch (routeName) {
    case 'nexushome':  return <NexusCoreIcon    {...props} />;
    case 'scripts':    return <ForgeScriptsIcon {...props} />;
    case 'butler':     return <ButlerAIIcon     {...props} />;
    case 'knowledge':  return <KnowledgeBaseIcon {...props} />;
    case 'logs':       return <IntelLogsIcon    {...props} />;
    case 'builder':    return <BuilderIcon      {...props} />;
    case 'fileshare':  return <VaultIcon        {...props} />;
    case 'settings':   return <ConfigIcon       {...props} />;
    case 'cosmetic':   return <SkinsIcon        {...props} />;
    default:           return <ButlerAIIcon     {...props} />;
  }
}

// ── TAB PILL (compact) ────────────────────────────────────────────
interface TabPillProps {
  routeName: string;
  isFocused: boolean;
  label: string;
  flex: number;
  onPress: () => void;
}

const TabPill = React.memo(function TabPill({ routeName, isFocused, label, flex, onPress }: TabPillProps) {
  const color = getColor(routeName);
  const shortLabel = getLabel(routeName);

  const scaleA  = useRef(new Animated.Value(isFocused ? 1.04 : 1)).current;
  const opA     = useRef(new Animated.Value(isFocused ? 1 : 0.55)).current;
  const dotA    = useRef(new Animated.Value(0.4)).current;
  const redDotA = useRef(new Animated.Value(0.5)).current;
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
      Animated.spring(scaleA, { toValue: isFocused ? 1.04 : 1,   useNativeDriver: true, speed: 32, bounciness: 10 }),
      Animated.timing(opA,    { toValue: isFocused ? 1   : 0.55, useNativeDriver: true, duration: 180 }),
    ]).start();
  }, [isFocused]);

  // Pulsing dot for active tab
  useEffect(() => {
    if (!isFocused) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dotA, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(dotA, { toValue: 0.1, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isFocused]);

  // Unread dot pulse
  useEffect(() => {
    if (!hasUnread) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(redDotA, { toValue: 1,    duration: 400, useNativeDriver: true }),
      Animated.timing(redDotA, { toValue: 0.2,  duration: 400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [hasUnread]);

  return (
    <TouchableOpacity
      onPress={() => { haptics.light(); onPress(); }}
      activeOpacity={0.8}
      style={{ flex, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[
        tp.inner,
        isFocused
          ? { backgroundColor: color + '18', borderColor: color + '70' }
          : { backgroundColor: 'transparent', borderColor: 'transparent' },
        { transform: [{ scale: scaleA }], opacity: opA },
      ]}>
        {/* Active top stripe */}
        {isFocused && (
          <View style={[tp.stripe, { backgroundColor: color,
            shadowColor: color, shadowOpacity: 0.85, shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }]} />
        )}

        {/* Icon with unread dot */}
        <View style={tp.iconWrap}>
          {renderIcon(routeName, color, isFocused)}
          {isFocused && (
            <Animated.View style={[tp.activeDot, { backgroundColor: color, opacity: dotA }]} />
          )}
          {hasUnread && !isFocused && (
            <Animated.View style={[tp.unreadDot, { opacity: redDotA }]} />
          )}
        </View>

        {/* Short label */}
        <Text style={[tp.label, { color: isFocused ? color : color + '66' }]} numberOfLines={1}>
          {shortLabel}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

const tp = StyleSheet.create({
  inner: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 2,
    borderRadius: 10, borderWidth: 1.5,
    minWidth: 30, width: '100%',
    position: 'relative', overflow: 'hidden',
  },
  stripe: {
    position: 'absolute', top: 0, left: 3, right: 3,
    height: 2.5, borderRadius: 1.5,
  },
  iconWrap: {
    position: 'relative', alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  activeDot: {
    position: 'absolute', bottom: -3, width: 3, height: 3, borderRadius: 1.5,
  },
  unreadDot: {
    position: 'absolute', top: -3, right: -3,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF3344', borderWidth: 1.5, borderColor: '#020912',
  },
  label: {
    fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.3,
    textAlign: 'center', includeFontPadding: false,
  },
});

// ── MAIN TAB BAR ─────────────────────────────────────────────────
export default function FuturisticTabBar(
  props: BottomTabBarProps & {
    iconMap?: Record<string, (color: string, size: number) => React.ReactNode>;
  },
) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();

  // Wire global tab switch helper
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
        if (opts?.href === null)                                       return false;
        if (opts?.tabBarButton === null)                               return false;
        if ((opts?.tabBarItemStyle as any)?.display === 'none')       return false;
        return true;
      }),
    [state.routes, descriptors],
  );

  const activeRouteName = visibleRoutes.find(r => r.idx === state.index)?.route?.name ?? 'nexushome';
  const isOnButlerTab   = activeRouteName === 'butler';

  const bottomPad = Math.max(insets.bottom, 8);

  // Multi-color signal line
  const signalColors = visibleRoutes.map(({ route }) => getColor(route.name));

  // flex weight for each tab (equal)
  const tabFlex = 1;

  return (
    <View pointerEvents="box-none" style={[st.outerWrap, { paddingBottom: bottomPad }]}>
      {/* Quick Butler prompt bar — hidden on AI tab */}
      {!isOnButlerTab && <QuickButlerBar />}

      {/* Elevation plate */}
      <View pointerEvents="none" style={st.shadowPlate} />

      {/* Dock */}
      <View style={st.deck}>

        {/* Signal line */}
        <View pointerEvents="none" style={st.signalLine}>
          {signalColors.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>

        {/* Fixed tab row — all tabs in one row, no scroll */}
        <View style={st.tabRow}>
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
                flex={tabFlex}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  outerWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 4,
  },
  shadowPlate: {
    position: 'absolute', left: 6, right: 6, bottom: 0, top: 8,
    borderRadius: 18, backgroundColor: '#000', opacity: 0.75,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.85, shadowRadius: 20 },
      android: { elevation: 20 },
      default: {},
    }),
  },
  deck: {
    height: BAR_H, marginHorizontal: 6, borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#020912',
    borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.16)',
    ...Platform.select({ android: { elevation: 14 }, default: {} }),
  },
  signalLine: {
    height: 2.5, flexDirection: 'row', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 2,
    marginTop: 2.5, // below signal line
  },
});
