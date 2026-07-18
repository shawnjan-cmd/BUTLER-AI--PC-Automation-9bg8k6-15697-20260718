/**
 * FuturisticTabBar — NEXUS COMMAND DOCK v5.0
 * Unique hand-crafted SVG icons per tab · animated active glow · multi-color signal bar
 * Each tab has its own distinct visual signature — no two icons look alike.
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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
(global as any).__clearButlerUnread = clearButlerUnread;

const DECK     = '#020912';
const MONO: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';
const BAR_HEIGHT = 76;
const _SW = Dimensions.get('window').width;
const IS_NARROW = _SW < 380;
const SVG_SIZE  = IS_NARROW ? 19 : 23;
const ICON_BOX_W = IS_NARROW ? 38 : 46;
const ICON_BOX_H = IS_NARROW ? 35 : 43;

// Unique neon per tab — immediately recognisable by colour + shape combination
const TAB_COLORS: Record<string, string> = {
  nexushome: '#00E5FF',  // cyan — core command
  scripts:   '#CC44FF',  // violet — forge/scripts
  butler:    '#00FF88',  // green — AI butler
  knowledge: '#00CCFF',  // sky — knowledge base
  logs:      '#FFB020',  // amber — intel/logs
  builder:   '#4A9EFF',  // blue — builder
  fileshare: '#FF44AA',  // pink — vault
  settings:  '#FF6644',  // orange — config
  cosmetic:  '#AA44FF',  // purple — skins
};

const HIDDEN_TABS = new Set(['onboarding', 'index', 'connect', 'terminal', 'support']);

const TAB_ALIASES: Record<string, string> = {
  home: 'nexushome', nexushome: 'nexushome', core: 'nexushome',
  scripts: 'scripts', forge: 'scripts', butlr: 'butler',
  butler: 'butler', ai: 'butler', chat: 'butler',
  knowledge: 'knowledge', kb: 'knowledge',
  logs: 'logs', pc: 'logs', intel: 'logs',
  builder: 'builder', build: 'builder',
  fileshare: 'fileshare', vault: 'fileshare', tools: 'fileshare',
  settings: 'settings', config: 'settings', cfg: 'settings',
  cosmetic: 'cosmetic', themes: 'cosmetic', skins: 'cosmetic',
};

const SHORT: Record<string, string> = {
  nexushome:'CORE', scripts:'FORGE', butler:'BUTLR', knowledge:'KB',
  logs:'INTEL', builder:'BUILD', fileshare:'VAULT', settings:'CFG', cosmetic:'SKINS',
};

// ── UNIQUE SVG ICON RENDERER ─────────────────────────────────────────────────
function renderTabIcon(routeName: string, color: string, active: boolean): React.ReactNode {
  const props = { size: SVG_SIZE, color, active, dimOpacity: 0.78 };
  switch (routeName) {
    case 'nexushome': return <NexusCoreIcon    {...props} />;
    case 'scripts':   return <ForgeScriptsIcon {...props} />;
    case 'butler':    return <ButlerAIIcon      {...props} />;
    case 'knowledge': return <KnowledgeBaseIcon {...props} />;
    case 'logs':      return <IntelLogsIcon     {...props} />;
    case 'builder':   return <BuilderIcon       {...props} />;
    case 'fileshare': return <VaultIcon         {...props} />;
    case 'settings':  return <ConfigIcon        {...props} />;
    case 'cosmetic':  return <SkinsIcon         {...props} />;
    default:          return <MaterialCommunityIcons name="dots-horizontal" size={SVG_SIZE} color={color} />;
  }
}

// ── TAB BUTTON ────────────────────────────────────────────────────────────────
function TabButton({
  isFocused, label, routeName, onPress, testID, onLayout,
}: {
  isFocused: boolean; label: string; routeName: string;
  onPress: () => void; testID?: string; onLayout: (e: any) => void;
}) {
  const scale      = useRef(new Animated.Value(isFocused ? 1.08 : 1)).current;
  const dotA       = useRef(new Animated.Value(0.4)).current;
  const redDotA    = useRef(new Animated.Value(0.5)).current;
  const pressA     = useRef(new Animated.Value(0)).current;
  const rippleA    = useRef(new Animated.Value(0)).current;
  const labelFlash = useRef(new Animated.Value(0)).current;
  // JS-driver glow for icon box border — separate value from native-driver scale
  const boxGlowA   = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  const [hasUnread,  setHasUnread]  = useState(_butlerUnread && routeName === 'butler');
  const [showLabel,  setShowLabel]  = useState(false);

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
    // native-driver scale
    Animated.spring(scale, {
      toValue: isFocused ? 1.12 : 1,
      useNativeDriver: true, speed: 24, bounciness: 16,
    }).start();
    // JS-driver box glow
    Animated.timing(boxGlowA, {
      toValue: isFocused ? 1 : 0, duration: 280, useNativeDriver: false,
    }).start();
    if (isFocused) {
      setShowLabel(true);
      labelFlash.setValue(0);
      Animated.sequence([
        Animated.timing(labelFlash, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.delay(750),
        Animated.timing(labelFlash, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setShowLabel(false));
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dotA, { toValue: 1,   duration: 750, useNativeDriver: true }),
      Animated.timing(dotA, { toValue: 0.2, duration: 750, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isFocused]);

  useEffect(() => {
    if (!hasUnread) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(redDotA, { toValue: 1,   duration: 380, useNativeDriver: true }),
      Animated.timing(redDotA, { toValue: 0.25, duration: 380, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [hasUnread]);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressA, { toValue: 1, tension: 420, friction: 12, useNativeDriver: true }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressA, { toValue: 0, tension: 320, friction: 10, useNativeDriver: true }).start();
    rippleA.setValue(0);
    Animated.timing(rippleA, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, []);

  const color = TAB_COLORS[routeName] || '#00E5FF';

  // JS-driver border/bg on the OUTER animated view (never mixed with native-driver scale)
  // Inactive state now shows a faint color-tinted border for icon visibility
  const boxBorderC = boxGlowA.interpolate({
    inputRange: [0, 1],
    outputRange: [color + '55', color + 'CC'],  // was '28' inactive — raised to '55' for visibility
  });
  const boxBgC     = boxGlowA.interpolate({ inputRange: [0, 1], outputRange: [color + '08', color + '22'] });

  // Native-driver transforms only on INNER animated view
  const pressScale   = pressA.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] });
  const pressY       = pressA.interpolate({ inputRange: [0, 1], outputRange: [0, 2.5] });
  const rippleScale  = rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.65, 2.0] });
  const rippleOp     = rippleA.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.58, 0.28, 0] });

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={1}
      onPress={() => { haptics.light(); onPress(); }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={tb.btn}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      {/* Outer scale — native driver */}
      <Animated.View style={[tb.inner, { transform: [{ scale }] }]}>

        {/* Ripple ring — native driver, expandable */}
        <Animated.View pointerEvents="none" style={[tb.ripple, {
          borderColor: color, width: ICON_BOX_W, height: ICON_BOX_H,
          borderRadius: ICON_BOX_W * 0.3,
          transform: [{ scale: rippleScale }], opacity: rippleOp,
          ...(Platform.OS === 'ios' ? {
            shadowColor: color, shadowOffset:{width:0,height:0}, shadowOpacity:0.9, shadowRadius:14,
          } : {}),
        }]} />

        {/* Icon box — JS-driver border/bg, native-driver press scale on inner */}
        <Animated.View style={[tb.iconBoxOuter, {
          borderColor: boxBorderC, backgroundColor: boxBgC,
          ...(Platform.OS === 'ios' && isFocused ? {
            shadowColor: color, shadowOffset:{width:0,height:0}, shadowOpacity:0.7, shadowRadius:12,
          } : {}),
          ...(Platform.OS === 'android' && isFocused ? { elevation: 8 } : {}),
        }]}>
          {/* Inner press-depth wrapper — native driver only */}
          <Animated.View style={[tb.iconBoxInner, {
            transform: [{ scale: pressScale }, { translateY: pressY }],
          }]}>
            {/* HUD corner brackets — only visible when active */}
            {isFocused && (
              <>
                <View style={[tb.corner, { top: 2, left: 2, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color }]} />
                <View style={[tb.corner, { top: 2, right: 2, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: color }]} />
                <View style={[tb.corner, { bottom: 2, left: 2, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: color }]} />
                <View style={[tb.corner, { bottom: 2, right: 2, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color }]} />
              </>
            )}
            {/* Top accent bar on active */}
            {isFocused && <View style={[tb.topAccent, { backgroundColor: color }]} />}
            {/* THE UNIQUE SVG ICON */}
            {renderTabIcon(routeName, color, isFocused)}
          </Animated.View>
        </Animated.View>

        {/* Active pulse dot below */}
        {isFocused && (
          <Animated.View style={[tb.activeDot, { backgroundColor: color, opacity: dotA,
            ...(Platform.OS === 'ios' ? {
              shadowColor: color, shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:5,
            } : {}) }]} />
        )}

        {/* Unread badge */}
        {hasUnread && !isFocused && (
          <Animated.View style={[tb.unreadDot, { opacity: redDotA,
            ...(Platform.OS === 'ios' ? {
              shadowColor:'#FF3344', shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:6,
            } : {}) }]} />
        )}

        {/* Activation label flash */}
        {showLabel && (
          <Animated.View style={[tb.labelFlashWrap, { opacity: labelFlash }]}>
            <View style={[tb.labelChip, { borderColor: color + '80', backgroundColor: color + '1E' }]}>
              <Text style={[tb.labelChipTxt, { color }]}>{SHORT[routeName] || routeName.slice(0,5).toUpperCase()}</Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── MAIN TAB BAR ──────────────────────────────────────────────────────────────
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

  const visibleRoutes = useMemo(() => {
    return state.routes
      .map((route, idx) => ({ route, idx }))
      .filter(({ route }) => {
        if (HIDDEN_TABS.has(route.name)) return false;
        const opts = descriptors[route.key].options as any;
        if (opts?.href === null) return false;
        if (opts?.tabBarButton === null) return false;
        if ((opts?.tabBarItemStyle as any)?.display === 'none') return false;
        return true;
      });
  }, [state.routes, descriptors]);

  const [layouts, setLayouts] = useState<Record<string, { x: number; w: number }>>({});
  const pillX = useRef(new Animated.Value(0)).current;
  const pillW = useRef(new Animated.Value(0)).current;

  const activeVisibleIdx = visibleRoutes.findIndex(r => r.idx === state.index);
  const activeRouteName  = visibleRoutes[activeVisibleIdx]?.route?.name || 'nexushome';
  const activeColor      = TAB_COLORS[activeRouteName] || '#00E5FF';
  const isOnButlerTab    = activeRouteName === 'butler';

  useEffect(() => {
    if (activeVisibleIdx < 0) return;
    const lay = layouts[visibleRoutes[activeVisibleIdx].route.key];
    if (!lay) return;
    Animated.parallel([
      Animated.spring(pillX, { toValue: lay.x + 3, useNativeDriver: false, speed: 18, bounciness: 5 }),
      Animated.spring(pillW, { toValue: Math.max(0, lay.w - 6), useNativeDriver: false, speed: 18, bounciness: 5 }),
    ]).start();
  }, [activeVisibleIdx, layouts, pillX, pillW, visibleRoutes]);

  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View pointerEvents="box-none" style={[st.outerWrap, { paddingBottom: bottomPad }]}>
      {!isOnButlerTab && <QuickButlerBar />}

      {/* Deep shadow plate behind the dock */}
      <View pointerEvents="none" style={st.shadowPlate} />

      <View style={[st.deck, { borderColor: activeColor + '22' }]}>
        {/* Multi-colour signal bar — each segment = one tab's signature colour */}
        <View pointerEvents="none" style={st.signalLine}>
          {visibleRoutes.map(({ route }) => (
            <View key={route.key} style={{ flex: 1, backgroundColor: TAB_COLORS[route.name] || '#00E5FF' }} />
          ))}
        </View>

        {/* Sliding active glow fill (JS-driver — never mixed with native scale) */}
        <Animated.View pointerEvents="none" style={[st.lockFill, {
          left: pillX, width: pillW, backgroundColor: activeColor + '11',
        }]} />
        {/* Sliding active frame */}
        <Animated.View pointerEvents="none" style={[st.lockFrame, {
          left: pillX, width: pillW, borderColor: activeColor + '55',
          ...(Platform.OS === 'ios' ? {
            shadowColor: activeColor, shadowOffset:{width:0,height:0}, shadowOpacity:0.55, shadowRadius:10,
          } : {}),
        }]}>
          <View style={[st.lockTopBar, { backgroundColor: activeColor }]} />
        </Animated.View>

        {/* Tab buttons */}
        <View style={st.row}>
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
              <TabButton
                key={route.key}
                isFocused={isFocused}
                label={String(label)}
                routeName={route.name}
                onPress={onPress}
                testID={`tab-${route.name}`}
                onLayout={(e: any) => {
                  const { x, width } = e.nativeEvent.layout;
                  setLayouts(prev => {
                    const cur = prev[route.key];
                    if (cur && cur.x === x && cur.w === width) return prev;
                    return { ...prev, [route.key]: { x, w: width } };
                  });
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  btn:          { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  inner:        { alignItems: 'center', justifyContent: 'center', paddingVertical: IS_NARROW ? 3 : 5,
                  minHeight: IS_NARROW ? 46 : 54, position: 'relative' },
  // Outer box — JS-driver animated (border/bg) — NEVER mix with native-driver transforms
  // Background tint added so inactive icons are legible against the dark dock
  iconBoxOuter: { width: ICON_BOX_W, height: ICON_BOX_H, borderRadius: 13, borderWidth: 1.5,
                  alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
                  // subtle tint behind every inactive icon so strokes read clearly against dark dock
                  backgroundColor: 'rgba(255,255,255,0.025)' },
  // Inner box — native-driver scale/translateY — NEVER mix with JS-driver colour values
  iconBoxInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  topAccent:    { position: 'absolute', top: 0, left: 6, right: 6, height: 2.5, borderRadius: 1 },
  corner:       { position: 'absolute', width: 6, height: 6 },
  activeDot:    { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  unreadDot:    { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5,
                  backgroundColor: '#FF3344', borderWidth: 1.5, borderColor: '#010810' },
  ripple:       { position: 'absolute', borderWidth: 1.5, top: 5 },
  labelFlashWrap: { position: 'absolute', bottom: -18, alignItems: 'center', zIndex: 20 },
  labelChip:      { borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 },
  labelChipTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.6 },
});

const st = StyleSheet.create({
  outerWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: 4, paddingHorizontal: 8,
  },
  shadowPlate: {
    position: 'absolute', left: 8, right: 8, bottom: 0, top: 10,
    borderRadius: 20,
    backgroundColor: '#000', opacity: 0.78,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset:{width:0,height:14}, shadowOpacity:0.92, shadowRadius:22 }
      : { elevation: 24 }),
  },
  deck: {
    height: BAR_HEIGHT, borderRadius: 18, overflow: 'hidden',
    backgroundColor: DECK, borderWidth: 1.5,
    ...(Platform.OS === 'android' ? { elevation: 12 } : {}),
  },
  signalLine: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 3.5,
    flexDirection: 'row', zIndex: 3,
  },
  row:       { flex: 1, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 2 },
  lockFill:  { position: 'absolute', top: 3.5, bottom: 3, borderRadius: 11 },
  lockFrame: { position: 'absolute', top: 3.5, bottom: 3, borderRadius: 11, borderWidth: 1.5, overflow: 'hidden' },
  lockTopBar:{ position: 'absolute', left: 4, right: 4, top: 0, height: 2.5, borderRadius: 1 },
});
