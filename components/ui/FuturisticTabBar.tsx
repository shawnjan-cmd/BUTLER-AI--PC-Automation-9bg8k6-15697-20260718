/**
 * FuturisticTabBar — NEXUS COMMAND DOCK v9.0 CLEAN CARD EDITION
 *
 * VISUAL: Clean dark rounded card matching screenshot reference.
 *   • Dark card with "ALL PAGES" header label
 *   • Each tab: icon + label, active = rounded square highlight
 *   • Single cyan top accent line
 *   • No rainbow, no heavy glow — elegant and professional
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
  Dimensions, Pressable,
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
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

// ── GLOBAL AI NOTIFICATION STATE ─────────────────────────────────
let _butlerUnread = false;
const _butlerListeners: Set<() => void> = new Set();

export function notifyButlerNewMessage() {
  _butlerUnread = true;
  _butlerListeners.forEach(fn => {
    try { fn(); } catch (e) { autoErrorLogger?.log?.('warn', '[tabBarListener]', String(e)); }
  });
}
export function clearButlerUnread() {
  _butlerUnread = false;
  _butlerListeners.forEach(fn => {
    try { fn(); } catch (e) { autoErrorLogger?.log?.('warn', '[tabBarListener]', String(e)); }
  });
}
(global as any).__notifyButlerNewMessage = notifyButlerNewMessage;
(global as any).__clearButlerUnread      = clearButlerUnread;

// ── CONSTANTS ────────────────────────────────────────────────────
const MONO: any  = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const SANS: any  = Platform.OS === 'ios' ? 'System' : 'sans-serif';
const DOCK_H     = 68;
const ICON_S     = 22;
const _SW        = Math.max(320, Dimensions.get('window').width);

const HIDDEN_TABS = new Set(['onboarding', 'index', 'terminal', 'support']);

const TAB_ALIASES: Record<string, string> = {
  home: 'nexushome', nexushome: 'nexushome', core: 'nexushome',
  scripts: 'scripts', forge: 'scripts',
  butlr: 'butler', butler: 'butler', ai: 'butler', chat: 'butler',
  knowledge: 'knowledge', kb: 'knowledge',
  logs: 'logs', pc: 'logs', intel: 'logs',
  builder: 'builder', build: 'builder',
  fileshare: 'fileshare', vault: 'fileshare',
  settings: 'settings', config: 'settings', cfg: 'settings',
  cosmetic: 'cosmetic', themes: 'cosmetic', skins: 'cosmetic',
  connect: 'connect', pair: 'connect',
};

const TAB_META: Record<string, { color: string; label: string }> = {
  nexushome: { color: '#00E5FF', label: 'Home'  },
  scripts:   { color: '#CC44FF', label: 'Forge' },
  butler:    { color: '#00FF88', label: 'AI'    },
  knowledge: { color: '#4A9EFF', label: 'KB'    },
  logs:      { color: '#FFB020', label: 'Intel' },
  builder:   { color: '#FF6644', label: 'Build' },
  fileshare: { color: '#FF44AA', label: 'Vault' },
  settings:  { color: '#8888BB', label: 'Cfg'   },
  cosmetic:  { color: '#AA44FF', label: 'Skins' },
  connect:   { color: '#00CCBB', label: 'Pair'  },
};

function getColor(r: string)  { return TAB_META[r]?.color ?? '#00E5FF'; }
function getLabel(r: string)  { return TAB_META[r]?.label ?? r.slice(0, 5); }

// ── PAIR ICON ────────────────────────────────────────────────────
function PairIcon({ size = 17, color = '#00CCBB', active = false }) {
  const s = size; const cx = s / 2; const cy = s / 2;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Rect x={cx-s*0.42} y={cy-s*0.42} width={s*0.26} height={s*0.26} rx={s*0.04}
        stroke={color} strokeWidth={s*0.06} fill="none" />
      <Rect x={cx+s*0.16} y={cy-s*0.42} width={s*0.26} height={s*0.26} rx={s*0.04}
        stroke={color} strokeWidth={s*0.06} fill="none" />
      <Rect x={cx-s*0.42} y={cy+s*0.16} width={s*0.26} height={s*0.26} rx={s*0.04}
        stroke={color} strokeWidth={s*0.06} fill="none" />
      <Rect x={cx-s*0.30} y={cy-s*0.30} width={s*0.12} height={s*0.12} rx={s*0.02} fill={color} opacity={0.8} />
      <Rect x={cx+s*0.18} y={cy-s*0.30} width={s*0.12} height={s*0.12} rx={s*0.02} fill={color} opacity={0.8} />
      <Rect x={cx-s*0.30} y={cy+s*0.18} width={s*0.12} height={s*0.12} rx={s*0.02} fill={color} opacity={0.8} />
      <Circle cx={cx+s*0.28} cy={cy+s*0.28} r={s*0.16} stroke={color} strokeWidth={s*0.05} fill="none" />
      <Circle cx={cx+s*0.28} cy={cy+s*0.28} r={s*0.06} fill={color} opacity={active ? 1 : 0.6} />
    </Svg>
  );
}

function renderIcon(routeName: string, color: string, active: boolean) {
  const props = { size: ICON_S, color, active, dimOpacity: 0.88 };
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
    case 'connect':    return <PairIcon size={ICON_S} color={color} active={active} />;
    default:           return <ButlerAIIcon     {...props} />;
  }
}

// ── TAB ITEM ─────────────────────────────────────────────────────
interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  label: string;
  flex: number;
  onPress: () => void;
}

const TabItem = React.memo(function TabItem({ routeName, isFocused, label, flex, onPress }: TabItemProps) {
  const color = getColor(routeName);
  const shortLabel = getLabel(routeName);

  const scaleA = useRef(new Animated.Value(isFocused ? 1 : 1)).current;
  const bgA    = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const textA  = useRef(new Animated.Value(isFocused ? 1 : 0.45)).current;

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
      Animated.spring(scaleA, { toValue: isFocused ? 1.04 : 1, useNativeDriver: true, speed: 40, bounciness: 10 }),
      Animated.timing(bgA,   { toValue: isFocused ? 1 : 0, duration: 200, useNativeDriver: false }),
      Animated.timing(textA, { toValue: isFocused ? 1 : 0.45, duration: 180, useNativeDriver: false }),
    ]).start();
  }, [isFocused]);

  const bgColor    = bgA.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', color + '22'] });
  const borderColor= bgA.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', color + '55'] });
  const labelColor = textA.interpolate({ inputRange: [0, 1], outputRange: [color + '70', color] });

  return (
    <TouchableOpacity
      onPress={() => { haptics.light(); onPress(); }}
      activeOpacity={0.75}
      style={{ flex, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={{ transform: [{ scale: scaleA }], alignItems: 'center' }}>
        <Animated.View style={[ti.iconBox, { backgroundColor: bgColor, borderColor }]}>
          {/* Active indicator dot above icon */}
          {isFocused && (
            <View style={[ti.activeDot, { backgroundColor: color }]} />
          )}
          {renderIcon(routeName, isFocused ? color : color + '70', isFocused)}
          {/* Unread badge */}
          {hasUnread && !isFocused && (
            <View style={ti.unreadBadge} />
          )}
        </Animated.View>
        <Animated.Text style={[ti.label, { color: labelColor }]} numberOfLines={1}>
          {shortLabel}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

const ti = StyleSheet.create({
  iconBox: {
    width: 44, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, position: 'relative',
  },
  activeDot: {
    position: 'absolute', top: -1, left: '50%', marginLeft: -10,
    width: 20, height: 2.5, borderRadius: 1.5,
  },
  unreadBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF3344', borderWidth: 1.5, borderColor: '#020912',
  },
  label: {
    fontFamily: SANS, fontSize: 9.5, fontWeight: '600',
    letterSpacing: 0.2, textAlign: 'center',
    includeFontPadding: false,
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
        if (opts?.href === null)                                 return false;
        if (opts?.tabBarButton === null)                         return false;
        if ((opts?.tabBarItemStyle as any)?.display === 'none') return false;
        return true;
      }),
    [state.routes, descriptors],
  );

  const activeRouteName = visibleRoutes.find(r => r.idx === state.index)?.route?.name ?? 'nexushome';
  const isOnButlerTab   = activeRouteName === 'butler';
  const activeColor     = getColor(activeRouteName);
  const bottomPad       = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

  return (
    <View pointerEvents="box-none" style={[st.root, { paddingBottom: bottomPad }]}>
      {/* ── QUICK BUTLER BAR above dock ── */}
      {!isOnButlerTab && (
        <View style={st.barWrapper} pointerEvents="box-none">
          <QuickButlerBar />
        </View>
      )}

      {/* ── DOCK CARD ── */}
      <View style={st.card}>
        {/* Top accent line — active tab color */}
        <View style={[st.topAccent, { backgroundColor: activeColor }]} />

        {/* Header row */}
        <View style={st.cardHeader}>
          <View style={[st.headerDot, { backgroundColor: activeColor }]} />
          <Text style={[st.headerLabel, { color: activeColor + 'A0' }]}>ALL PAGES</Text>
          <View style={{ flex: 1 }} />
          <Text style={st.pageCount}>{visibleRoutes.length}</Text>
        </View>

        {/* Tabs */}
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
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                label={String(label)}
                flex={1}
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
  root: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  barWrapper: {
    width: '100%',
    marginBottom: 4,
  },
  card: {
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 18,
    backgroundColor: '#020D1A',
    borderWidth: 1.5,
    borderColor: 'rgba(0,200,224,0.18)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.9,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
      default: {},
    }),
  },
  topAccent: {
    height: 2.5,
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 6,
  },
  headerDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  headerLabel: {
    fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 1.2,
  },
  pageCount: {
    fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)',
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
});
