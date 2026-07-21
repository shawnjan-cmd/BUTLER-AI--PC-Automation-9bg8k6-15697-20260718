/**
 * FuturisticTabBar — NEXUS COMMAND DOCK v8.0 BUTLER EDITION
 *
 * ARCHITECTURE FIX:
 *   QuickButlerBar is now rendered as a NORMAL flex child ABOVE the dock —
 *   NOT position:absolute. This eliminates the overlap bug permanently.
 *   The entire component is position:absolute at the bottom, and inside it
 *   we stack: [QuickButlerBar] then [Dock] vertically.
 *
 * VISUAL:
 *   All 10 tabs visible, no scroll.
 *   Butler-robot themed icons. Multi-color signal line.
 *   Active tab: glowing top stripe + tinted bg + pulsing dot.
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
import Svg, {
  Path, Circle, Rect, Line, G, Polygon, Defs, LinearGradient, Stop,
} from 'react-native-svg';

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
const MONO: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const DOCK_H = 62;   // taller dock for larger icons
const ICON_S = 22;   // bigger icon size
const _SW    = Math.max(320, Dimensions.get('window').width);

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
  nexushome: { color: '#00E5FF', label: 'HOME'  },
  scripts:   { color: '#CC44FF', label: 'FORGE' },
  butler:    { color: '#00FF88', label: 'AI'    },
  knowledge: { color: '#4A9EFF', label: 'KB'    },
  logs:      { color: '#FFB020', label: 'PC'    },
  builder:   { color: '#FF6644', label: 'BUILD' },
  fileshare: { color: '#FF44AA', label: 'NET'   },
  settings:  { color: '#8888BB', label: 'CFG'   },
  cosmetic:  { color: '#AA44FF', label: 'SKIN'  },
  connect:   { color: '#00CCBB', label: 'PAIR'  },
};

function getColor(r: string) { return TAB_META[r]?.color ?? '#00E5FF'; }
function getLabel(r: string) { return TAB_META[r]?.label ?? r.slice(0, 4).toUpperCase(); }

// ── BUTLER-ROBOT-THEMED ICONS — all custom SVG ────────────────────
// Each tab has a unique robot/butler design element

// PAIR / CONNECT — QR Scanner robot eye
function PairIcon({ size = 17, color = '#00CCBB', active = false }) {
  const s = size, cx = s / 2, cy = s / 2;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Outer QR frame corners */}
      <Rect x={cx - s*0.42} y={cy - s*0.42} width={s*0.26} height={s*0.26} rx={s*0.04}
        stroke={color} strokeWidth={s*0.06} fill="none" />
      <Rect x={cx + s*0.16} y={cy - s*0.42} width={s*0.26} height={s*0.26} rx={s*0.04}
        stroke={color} strokeWidth={s*0.06} fill="none" />
      <Rect x={cx - s*0.42} y={cy + s*0.16} width={s*0.26} height={s*0.26} rx={s*0.04}
        stroke={color} strokeWidth={s*0.06} fill="none" />
      {/* Inner squares */}
      <Rect x={cx - s*0.30} y={cy - s*0.30} width={s*0.12} height={s*0.12} rx={s*0.02} fill={color} opacity={0.8} />
      <Rect x={cx + s*0.18} y={cy - s*0.30} width={s*0.12} height={s*0.12} rx={s*0.02} fill={color} opacity={0.8} />
      <Rect x={cx - s*0.30} y={cy + s*0.18} width={s*0.12} height={s*0.12} rx={s*0.02} fill={color} opacity={0.8} />
      {/* Bottom right: robot eye instead of QR */}
      <Circle cx={cx + s*0.28} cy={cy + s*0.28} r={s*0.16} stroke={color} strokeWidth={s*0.05} fill="none" />
      <Circle cx={cx + s*0.28} cy={cy + s*0.28} r={s*0.06} fill={color} opacity={active ? 1 : 0.6} />
      {/* Scan line */}
      {active && <Line x1={cx - s*0.46} y1={cy - s*0.02} x2={cx + s*0.46} y2={cy - s*0.02}
        stroke={color} strokeWidth={s*0.03} opacity={0.5} />}
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

// ── TAB PILL ─────────────────────────────────────────────────────
interface TabPillProps {
  routeName: string;
  isFocused: boolean;
  label: string;
  flex: number;
  onPress: () => void;
}

const TabPill = React.memo(function TabPill({ routeName, isFocused, label, flex, onPress }: TabPillProps) {
  const color      = getColor(routeName);
  const shortLabel = getLabel(routeName);

  const scaleA  = useRef(new Animated.Value(isFocused ? 1.05 : 1)).current;
  const opA     = useRef(new Animated.Value(isFocused ? 1 : 0.52)).current;
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
      Animated.spring(scaleA, { toValue: isFocused ? 1.05 : 1, useNativeDriver: true, speed: 35, bounciness: 12 }),
      Animated.timing(opA,    { toValue: isFocused ? 1 : 0.52,  useNativeDriver: true, duration: 170 }),
    ]).start();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dotA, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(dotA, { toValue: 0.1, duration: 900, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [isFocused]);

  useEffect(() => {
    if (!hasUnread) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(redDotA, { toValue: 1,   duration: 380, useNativeDriver: true }),
      Animated.timing(redDotA, { toValue: 0.2, duration: 380, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
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
          ? { backgroundColor: color + '1A', borderColor: color + '65' }
          : { backgroundColor: 'transparent', borderColor: 'transparent' },
        { transform: [{ scale: scaleA }], opacity: opA },
      ]}>
        {/* Glowing top stripe */}
        {isFocused && (
          <View style={[tp.stripe, {
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 0.9, shadowRadius: 7,
            shadowOffset: { width: 0, height: 0 },
          }]} />
        )}

        {/* Icon */}
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
        <Text style={[tp.label, { color: isFocused ? color : color + '60' }]} numberOfLines={1}>
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
    borderRadius: 11, borderWidth: 1.5,
    minWidth: 32, width: '100%',
    position: 'relative', overflow: 'hidden',
  },
  stripe: {
    position: 'absolute', top: 0, left: 2, right: 2,
    height: 3, borderRadius: 1.5,
  },
  iconWrap: {
    position: 'relative', alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  activeDot: {
    position: 'absolute', bottom: -4, width: 4, height: 4, borderRadius: 2,
  },
  unreadDot: {
    position: 'absolute', top: -3, right: -3,
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: '#FF3344', borderWidth: 1.5, borderColor: '#010508',
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

  // Wire global tab switch
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
        if (opts?.href === null)                                        return false;
        if (opts?.tabBarButton === null)                                return false;
        if ((opts?.tabBarItemStyle as any)?.display === 'none')        return false;
        return true;
      }),
    [state.routes, descriptors],
  );

  const activeRouteName = visibleRoutes.find(r => r.idx === state.index)?.route?.name ?? 'nexushome';
  const isOnButlerTab   = activeRouteName === 'butler';

  // Bottom safe area padding
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

  // Multi-color signal stripe from visible tabs
  const signalColors = visibleRoutes.map(({ route }) => getColor(route.name));

  return (
    /**
     * ROOT LAYOUT:
     *   position:absolute covers the bottom area.
     *   Inner is a COLUMN:  [QuickButlerBar] → [Dock]
     *   This is the key fix — the bar is a SIBLING not an absolute overlay.
     */
    <View
      pointerEvents="box-none"
      style={[st.root, { paddingBottom: bottomPad }]}
    >
      {/* ── QUICK BUTLER BAR — renders ABOVE the dock ── */}
      {!isOnButlerTab ? (
        <View style={st.barWrapper} pointerEvents="box-none">
          <QuickButlerBar />
        </View>
      ) : null}

      {/* ── DROP SHADOW PLATE ── */}
      <View pointerEvents="none" style={st.shadowPlate} />

      {/* ── DOCK ── */}
      <View style={st.dock}>

        {/* Cyan signal line — single color, no rainbow */}
        <View pointerEvents="none" style={[st.signalLine, { backgroundColor: 'rgba(0,200,224,0.55)' }]} />

        {/* Tab row */}
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
  // The absolute root — covers only what it needs
  root: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    flexDirection: 'column',   // ← key: stack vertically
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },

  // Wrapper for QuickButlerBar — sits above the dock naturally
  barWrapper: {
    width: '100%',
    // Small gap between bar and dock
    marginBottom: 3,
  },

  shadowPlate: {
    position: 'absolute',
    left: 4, right: 4,
    // Covers just the dock height
    bottom: 0, height: 64,
    borderRadius: 16,
    backgroundColor: '#000',
    opacity: 0.78,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.85,
        shadowRadius: 18,
      },
      android: { elevation: 20 },
      default: {},
    }),
  },

  dock: {
    height: DOCK_H,
    marginHorizontal: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#020912',
    borderWidth: 1.5,
    borderColor: 'rgba(0,200,224,0.20)',
    ...Platform.select({ android: { elevation: 16 }, default: {} }),
  },

  signalLine: {
    height: 2.5,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 3,
  },

  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 3,
    paddingTop: 3,   // below signal line
    paddingBottom: 2,
    marginTop: 2.5,
  },
});
