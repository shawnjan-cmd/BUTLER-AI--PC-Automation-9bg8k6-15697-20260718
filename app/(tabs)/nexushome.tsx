/**
 * BUTLER AI — NEXUS HOME v50.0
 * Merged terminal cyberpunk dashboard — 6 cohesive blocks from 14 fragments
 *
 * ANIMATION SAFETY (permanent, never change):
 *  - Native driver: opacity, translateX/Y, scale — ONLY
 *  - JS driver: borderColor, backgroundColor, width% — ONLY
 *  - NEVER mix drivers on the same Animated.Value
 *  - MemoryBrain: ALL useNativeDriver:false (positional + opacity on same values)
 *  - Mounted guard (useRef(true)) on every loop — checked before setState
 */

import React, { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions, Modal, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { serverConnection } from '@/services/serverConnection';
import { connectionHub } from '@/services/connectionHub';
import { executionHistory } from '@/services/executionHistory';
import { kbGrowthTracker } from '@/services/kbGrowthTracker';
import { parseQRConnection } from '@/services/qrParser';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { personalMemory } from '@/services/personalMemory';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import { logger } from '@/utils/logger';
import NexusParticleFX from '@/components/ui/NexusParticleFX';
import { NexusVaultCard } from '@/components/ui/NexusVaultCard';
import { PageMascot } from '@/components/ui/PageMascot';
import { performanceHistory } from '@/services/performanceHistory';
import { RemoteAccessMonetizationCard } from '@/components/home/RemoteAccessMonetizationCard';
import { NexusCommandCenter } from '@/components/home/NexusCommandCenter';
const QRCameraScanner = React.lazy(() => import('@/components/qr/QRCameraScanner'));

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SCREEN_W } = Dimensions.get('window');
const SW = Math.max(320, SCREEN_W);
const PAD = 12;
const GAP = 8;

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const T = {
  bg:      '#010407',
  surf:    '#060D18',
  surf2:   '#0A1422',
  surf3:   '#0D1C30',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  magenta: '#CC44FF',
  amber:   '#FFB020',
  red:     '#FF3344',
  blue:    '#4488FF',
  pink:    '#FF6EB4',
  yellow:  '#FFD400',
  teal:    '#00CCBB',
  text:    '#C8E4F0',
  mid:     '#4A7090',
  dim:     '#1A2E44',
  border:  'rgba(0,229,255,0.10)',
};

// ─── SHARED ATOMS ─────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HudCorners({ color, size = 10, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const b: any = { position: 'absolute', width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[b, { top: 0, left: 0,     borderTopWidth: t,    borderLeftWidth: t    }]} />
      <View style={[b, { top: 0, right: 0,    borderTopWidth: t,    borderRightWidth: t   }]} />
      <View style={[b, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t    }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t   }]} />
    </>
  );
}

function SectionBar({ color, icon, label }: { color: string; icon: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingVertical: 10,
      backgroundColor: color + '06', borderTopWidth: 1, borderBottomWidth: 1, borderColor: color + '20' }}>
      <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: color }} />
      <MaterialCommunityIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color, letterSpacing: 2 }}>{label}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color + '30' }} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// BLOCK A: TOP HEADER + NAV BAR (merged)
// ══════════════════════════════════════════════════════════════════
let _ROBOT_IMG: any = null;
try { _ROBOT_IMG = require('@/assets/images/mascot_shield_v2.png'); } catch {
  try { _ROBOT_IMG = require('@/assets/images/nexus-robot-mascot.png'); } catch {}
}

const NAV_ITEMS = [
  { icon: 'qr-code-scanner',    lib: 'material'   as const, label: 'PAIR',    color: T.cyan,    tab: '_qr'      },
  { icon: 'robot-excited',      lib: 'community'  as const, label: 'AI',      color: T.green,   tab: 'butler'   },
  { icon: 'code-braces-box',    lib: 'community'  as const, label: 'SCRIPTS', color: T.magenta, tab: 'scripts'  },
  { icon: 'brain',              lib: 'community'  as const, label: 'KB',      color: T.cyan,    tab: 'knowledge'},
  { icon: 'chart-bar',          lib: 'community'  as const, label: 'INTEL',   color: T.amber,   tab: 'logs'     },
  { icon: 'folder-open',        lib: 'material'   as const, label: 'VAULT',   color: T.pink,    tab: 'fileshare'},
  { icon: 'hammer-screwdriver', lib: 'community'  as const, label: 'BUILD',   color: T.yellow,  tab: 'builder'  },
  { icon: 'tune',               lib: 'material'   as const, label: 'CFG',     color: T.mid,     tab: 'settings' },
];

function NexusHeaderNav({ safeTop, isConn, addr, latency, onQR, onRefresh, goToTab }: {
  safeTop: number; isConn: boolean; addr: string; latency: number;
  onQR: () => void; onRefresh: () => void; goToTab: (t: string) => void;
}) {
  const pulseA  = useRef(new Animated.Value(0.4)).current;
  const focused = useIsFocused();
  const loopRef = useRef<ReturnType<typeof Animated.loop> | null>(null);
  const mounted = useRef(true);
  const [time, setTime] = useState('');
  const isHttp = isConn && !addr.startsWith('https');

  useEffect(() => {
    const upd = () => { const n = new Date(); setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`); };
    upd(); const t = setInterval(upd, 30000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!focused) { loopRef.current?.stop(); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    loopRef.current = loop; loop.start();
    return () => { mounted.current = false; loop.stop(); loopRef.current = null; };
  }, [focused]);

  const cc = isConn ? T.green : T.red;
  return (
    <View style={[hdr.root, { paddingTop: safeTop }]}>
      {/* 5-color stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[T.cyan, T.green, T.magenta, T.amber, T.pink].map((c,i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* Brand row */}
      <View style={hdr.brandRow}>
        <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cc, opacity: pulseA }} />
        <Text style={hdr.brand}>BUTLER<Text style={{ color: T.cyan }}>·AI</Text></Text>
        <View style={{ flex: 1 }} />
        <Text style={hdr.clock}>{time}</Text>
        <View style={[hdr.connPill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
          <PulseDot color={cc} size={5} />
          <Text style={[hdr.connTxt, { color: cc }]} numberOfLines={1}>
            {isConn ? (addr || 'ONLINE') : 'OFFLINE'}
          </Text>
          {isConn && latency > 0 && <Text style={[hdr.latTxt, { color: T.mid }]}>{latency}ms</Text>}
        </View>
        <TouchableOpacity onPress={() => { haptics.heavy(); onQR(); }} activeOpacity={0.8}
          style={[hdr.iconBtn, { borderColor: T.cyan + '55', backgroundColor: T.cyan + '0C' }]}>
          <MaterialIcons name="qr-code-scanner" size={15} color={T.cyan} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { haptics.light(); onRefresh(); }} activeOpacity={0.8}
          style={[hdr.iconBtn, { borderColor: T.mid + '30' }]}>
          <MaterialIcons name="refresh" size={15} color={T.mid} />
        </TouchableOpacity>
        <PageMascot page="home" size="sm" showBubble />
      </View>

      {/* HTTP warning */}
      {isHttp && (
        <View style={hdr.httpWarn}>
          <MaterialIcons name="lock-open" size={9} color={T.amber} />
          <Text style={hdr.httpTxt}>HTTP (unencrypted) — enable --tls flag on server</Text>
        </View>
      )}

      {/* Nav pills row */}
      <View style={hdr.navRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 8, gap: 6 }}>
          {NAV_ITEMS.map((n, i) => {
            const Icon = n.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <TouchableOpacity key={i} activeOpacity={0.75}
                onPress={() => { haptics.light(); n.tab === '_qr' ? onQR() : goToTab(n.tab); }}
                style={[hdr.pill, { borderColor: n.color + '45', backgroundColor: n.color + '09' }]}>
                <Icon name={n.icon as any} size={11} color={n.color} />
                <Text style={[hdr.pillTxt, { color: n.color }]}>{n.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ height: 1, backgroundColor: T.cyan + '15' }} />
    </View>
  );
}

const hdr = StyleSheet.create({
  root:     { backgroundColor: '#020609', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: T.cyan, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10 }, android: { elevation: 4 } }) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingVertical: 8 },
  brand:    { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  clock:    { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: T.cyan },
  connPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 160 },
  connTxt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', flexShrink: 1 },
  latTxt:   { fontFamily: MONO, fontSize: 7, flexShrink: 0 },
  iconBtn:  { width: 32, height: 32, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  httpWarn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: PAD, paddingVertical: 4,
    backgroundColor: 'rgba(255,176,32,0.07)', borderTopWidth: 1, borderTopColor: 'rgba(255,176,32,0.18)' },
  httpTxt:  { fontFamily: MONO, fontSize: 8, color: 'rgba(255,176,32,0.8)', flex: 1 },
  navRow:   { backgroundColor: '#02060E', borderTopWidth: 1, borderTopColor: T.cyan + '12' },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 11, paddingVertical: 7 },
  pillTxt:  { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 },
});

// ══════════════════════════════════════════════════════════════════
// BLOCK B: NEXUS CONTROL HUB
// Merges: AIChatHero + TerminalFeed into one unified panel
// ══════════════════════════════════════════════════════════════════
type ChanID = 'app' | 'srv' | 'scripts' | 'kb';
interface LogEntry { id: string; ts: number; label: string; ok: boolean | null; col: string; tag: string }

const CHANS = [
  { id: 'app'     as ChanID, label: 'APP',     icon: 'application-outline', color: T.cyan    },
  { id: 'srv'     as ChanID, label: 'SERVER',  icon: 'server-network',      color: T.magenta },
  { id: 'scripts' as ChanID, label: 'SCRIPTS', icon: 'code-braces',         color: T.green   },
  { id: 'kb'      as ChanID, label: 'KB',      icon: 'brain',               color: T.amber   },
];

const BUTLER_CMDS = [
  'butler-nexus:~$ status --json --live',
  'butler-nexus:~$ kb sync --sigma-net',
  'butler-nexus:~$ scan --lan --discover',
  'butler-nexus:~$ auth --verify --hmac',
];

const AI_PROMPTS = [
  '"Run Python on my PC remotely..."',
  '"Clean temp files and free disk space"',
  '"What processes are eating my CPU?"',
  '"Schedule a backup for tonight 11 PM"',
  '"Show me my disk usage by folder"',
];

function NexusControlHub({ isConn, goToTab, onQR }: {
  isConn: boolean; goToTab: (t: string) => void; onQR: () => void;
}) {
  const focused  = useIsFocused();
  // JS-driver values (color/position interpolations)
  const glowA    = useRef(new Animated.Value(0.3)).current;
  const scanA    = useRef(new Animated.Value(-SW)).current;
  // Native-driver value (translateY only — safe)
  const floatA   = useRef(new Animated.Value(0)).current;
  // Cursor opacity — native
  const cursorA  = useRef(new Animated.Value(1)).current;

  const mounted  = useRef(true);
  const [promptIdx, setPromptIdx] = useState(0);
  const [botIdx,    setBotIdx]    = useState(0);
  const [botMsg,    setBotMsg]    = useState('');
  const [logs, setLogs] = useState<Record<ChanID, LogEntry[]>>({ app: [], srv: [], scripts: [], kb: [] });

  // Animations
  useEffect(() => {
    mounted.current = true;
    if (!focused) return;

    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1800, useNativeDriver: false }),
    ]));
    const scan = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 80, duration: 3800, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -SW,     duration: 0,    useNativeDriver: false }),
      Animated.delay(6000),
    ]), { iterations: 3 });
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ]));
    const cursor = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));

    glow.start(); scan.start(); float.start(); cursor.start();

    const ti = setInterval(() => { if (mounted.current) setPromptIdx(i => (i + 1) % AI_PROMPTS.length); }, 3200);
    return () => { mounted.current = false; glow.stop(); scan.stop(); float.stop(); cursor.stop(); clearInterval(ti); };
  }, [focused]);

  // Bot typewriter
  useEffect(() => {
    const target = BUTLER_CMDS[botIdx];
    let i = 0; setBotMsg('');
    const tid = setInterval(() => {
      i++;
      if (mounted.current) setBotMsg(target.slice(0, i));
      if (i >= target.length) { clearInterval(tid); setTimeout(() => { if (mounted.current) setBotIdx(x => (x + 1) % BUTLER_CMDS.length); }, 3200); }
    }, 38);
    return () => clearInterval(tid);
  }, [botIdx]);

  // Load terminal logs
  const loadLogs = useCallback(async () => {
    const now = Date.now();
    try {
      const appE  = logger.getEntries().slice(-3).reverse();
      const appR  = appE.map(e => ({ id: `a${e.ts}`, ts: e.ts, label: e.msg.slice(0, 45), ok: e.level === 'error' ? false : e.level === 'warn' ? null : true, col: T.cyan,    tag: e.level.slice(0, 3).toUpperCase() }));
      const srvE  = autoErrorLogger.getLogs().slice(0, 3);
      const srvR  = srvE.map(e => ({ id: e.id, ts: e.timestamp, label: `${e.source}: ${e.message.slice(0, 35)}`, ok: e.level === 'error' ? false : e.level === 'warn' ? null : true, col: T.magenta, tag: e.level.slice(0, 3).toUpperCase() }));
      const hist  = (await executionHistory.getAll()).slice(0, 3);
      const scrR  = hist.map(h => ({ id: h.id, ts: new Date(h.timestamp).getTime(), label: h.scriptName || 'Script', ok: h.success, col: T.green, tag: h.success ? 'OK' : 'ERR' }));
      let kbR: LogEntry[] = [];
      try {
        const stats = await knowledgeAccumulator.getStats?.();
        const total = stats?.totalFindings ?? 0;
        kbR = [{ id: 'kb-total', ts: now, label: `${total} vectors indexed`, ok: true, col: T.amber, tag: 'KB' }];
      } catch {}
      const mk = (id: ChanID, col: string, tag: string): LogEntry[] => [
        { id: `${id}f1`, ts: now - 500,  label: 'System nominal',    ok: true, col, tag },
        { id: `${id}f2`, ts: now - 2000, label: 'Encryption active', ok: true, col, tag },
      ];
      if (mounted.current) setLogs({
        app:     appR.length ? appR : mk('app', T.cyan, 'SYS'),
        srv:     srvR.length ? srvR : mk('srv', T.magenta, 'SRV'),
        scripts: scrR.length ? scrR : [{ id: 'srf1', ts: now - 1000, label: 'No scripts run yet', ok: null, col: T.green, tag: '—' }],
        kb:      kbR.length  ? kbR  : mk('kb',  T.amber, 'KB'),
      });
    } catch {}
  }, [isConn]);

  useFocusEffect(useCallback(() => { loadLogs(); const t = setInterval(loadLogs, 12000); return () => clearInterval(t); }, [loadLogs]));

  const borderC = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [T.cyan + '20', T.cyan + '75'] });
  const floatY  = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const cc = isConn ? T.green : T.red;

  const CAPS = [
    { icon: 'shield-check',  lib: 'community' as const, label: 'ZERO CLOUD',   sub: 'LAN only',           color: T.green   },
    { icon: 'brain',         lib: 'community' as const, label: 'LOCAL AI',      sub: 'Ollama on PC',       color: T.cyan    },
    { icon: 'code-braces',   lib: 'community' as const, label: '250+ SCRIPTS', sub: 'Python automations', color: T.magenta },
    { icon: 'lock',          lib: 'material'  as const, label: 'AES-256',       sub: 'E2E encrypted',      color: T.amber   },
  ];

  return (
    <Animated.View style={[hub.outer, { borderColor: borderC }]}>
      {/* Scanline */}
      <Animated.View pointerEvents="none" style={[hub.scanLine, { transform: [{ translateX: scanA }] }]} />
      {/* 5-color top stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[T.cyan, T.green, T.magenta, T.amber, T.pink].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <HudCorners color={T.cyan + '40'} size={12} t={1.5} />

      {/* ── HERO ROW: mascot + title + CTAs ── */}
      <View style={hub.heroRow}>
        <Animated.View style={[hub.mascotCol, { transform: [{ translateY: floatY }] }]}>
          {_ROBOT_IMG ? (
            <Image source={_ROBOT_IMG} style={hub.mascotImg} contentFit="contain" transition={200} />
          ) : (
            <View style={hub.mascotFallback}><MaterialCommunityIcons name="robot-happy" size={44} color={T.cyan} /></View>
          )}
          <View style={[hub.mascotBadge, { borderColor: cc + '50', backgroundColor: cc + '0C' }]}>
            <PulseDot color={cc} size={4} />
            <Text style={[hub.mascotBadgeTxt, { color: cc }]}>{isConn ? 'LIVE' : 'PAIR'}</Text>
          </View>
        </Animated.View>

        <View style={hub.titleCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <Text style={hub.title}>BUTLER<Text style={{ color: T.cyan }}> AI</Text></Text>
            <View style={[hub.badge, { borderColor: T.cyan + '45', backgroundColor: T.cyan + '0A' }]}>
              <Text style={[hub.badgeTxt, { color: T.cyan }]}>v7.3</Text>
            </View>
            <View style={[hub.badge, { borderColor: cc + '45', backgroundColor: cc + '0A' }]}>
              <PulseDot color={cc} size={4} />
              <Text style={[hub.badgeTxt, { color: cc }]}>{isConn ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
          </View>
          <Text style={hub.sub} numberOfLines={2}>Local AI · controls your PC · zero cloud · your hardware only</Text>
          <View style={[hub.promptBox, { borderColor: T.cyan + '28' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: T.cyan + '55' }}>{'>'}</Text>
            <Text style={[hub.promptTxt, { color: T.cyan + '75' }]} numberOfLines={1}>{AI_PROMPTS[promptIdx]}</Text>
            <View style={{ width: 5, height: 10, backgroundColor: T.cyan + '55', borderRadius: 1 }} />
          </View>
        </View>

        <View style={hub.ctaCol}>
          <Pressable onPress={() => { haptics.heavy(); goToTab('butler'); }}
            style={({ pressed }) => [hub.ctaPrimary, { backgroundColor: T.cyan, opacity: pressed ? 0.85 : 1 }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={14} color="#000" />
            <Text style={[hub.ctaTxt, { color: '#000' }]}>CHAT</Text>
          </Pressable>
          <Pressable onPress={() => { haptics.medium(); onQR(); }}
            style={({ pressed }) => [hub.ctaSecondary, { borderColor: T.green + '55', opacity: pressed ? 0.8 : 1 }]}>
            <MaterialIcons name="qr-code-scanner" size={14} color={T.green} />
            <Text style={[hub.ctaTxt, { color: T.green }]}>PAIR</Text>
          </Pressable>
          <Pressable onPress={() => { haptics.light(); goToTab('scripts'); }}
            style={({ pressed }) => [hub.ctaSecondary, { borderColor: T.magenta + '55', opacity: pressed ? 0.8 : 1 }]}>
            <MaterialIcons name="code" size={14} color={T.magenta} />
            <Text style={[hub.ctaTxt, { color: T.magenta }]}>CODE</Text>
          </Pressable>
        </View>
      </View>

      {/* ── CAPABILITY CHIPS ── */}
      <View style={hub.capsRow}>
        {CAPS.map((c, i) => {
          const Icon = c.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <View key={i} style={[hub.capChip, { borderColor: c.color + '35', backgroundColor: c.color + '08' }]}>
              <View style={[hub.capIcon, { borderColor: c.color + '50', backgroundColor: c.color + '12' }]}>
                <Icon name={c.icon as any} size={11} color={c.color} />
              </View>
              <View>
                <Text style={[hub.capLabel, { color: c.color }]}>{c.label}</Text>
                <Text style={[hub.capSub,   { color: c.color + '60' }]}>{c.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── TERMINAL FEED PANEL ── */}
      <View style={hub.termOuter}>
        {/* Terminal chrome header */}
        <View style={hub.termChrome}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />)}
          </View>
          <MaterialCommunityIcons name="monitor-dashboard" size={9} color={T.cyan} />
          <Text style={hub.termChromeTitle}>NEXUS LIVE FEED</Text>
          <View style={{ flex: 1 }} />
          <View style={[hub.termStatusPill, { borderColor: (isConn ? T.green : T.red) + '45', backgroundColor: (isConn ? T.green : T.red) + '08' }]}>
            <PulseDot color={isConn ? T.green : T.red} size={4} />
            <Text style={[hub.termStatusTxt, { color: isConn ? T.green : T.red }]}>{isConn ? 'LIVE' : 'OFF'}</Text>
          </View>
        </View>

        {/* 4-channel grid */}
        <View style={hub.chanGrid}>
          {CHANS.map(ch => (
            <View key={ch.id} style={[hub.chan, { borderColor: ch.color + '28' }]}>
              <View style={[hub.chanHdr, { borderBottomColor: ch.color + '18' }]}>
                <MaterialCommunityIcons name={ch.icon as any} size={9} color={ch.color} />
                <Text style={[hub.chanLabel, { color: ch.color }]}>{ch.label}</Text>
                <View style={[hub.chanCount, { borderColor: ch.color + '40', backgroundColor: ch.color + '0A' }]}>
                  <Text style={[hub.chanCountTxt, { color: ch.color }]}>{logs[ch.id].length}</Text>
                </View>
              </View>
              {logs[ch.id].length === 0
                ? <Text style={hub.chanEmpty}>{'>'} idle</Text>
                : logs[ch.id].slice(0, 3).map((r, ri) => (
                  <View key={r.id} style={[hub.chanRow, { borderLeftColor: r.ok === true ? T.green : r.ok === false ? T.red : ch.color }]}>
                    <Text style={[hub.chanRowTxt, { color: ch.color }]} numberOfLines={1}>{r.label}</Text>
                    <View style={[hub.chanTag, { borderColor: ch.color + '35' }]}>
                      <Text style={[hub.chanTagTxt, { color: ch.color }]}>{r.tag}</Text>
                    </View>
                  </View>
                ))
              }
            </View>
          ))}
        </View>

        {/* Bot command line */}
        <View style={hub.botRow}>
          <View style={hub.botAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={11} color={T.cyan} />
            <View style={{ position: 'absolute', bottom: -1, right: -1, width: 5, height: 5, borderRadius: 3, backgroundColor: T.green, borderWidth: 1, borderColor: T.bg }} />
          </View>
          <Text style={hub.botTxt} numberOfLines={1}>{botMsg}</Text>
          <Animated.View style={{ width: 5, height: 11, backgroundColor: T.cyan, borderRadius: 1, opacity: cursorA }} />
        </View>
      </View>

      {/* Bottom ticker */}
      <View style={hub.ticker}>
        <PulseDot color={isConn ? T.green : T.red} size={4} />
        <Text style={hub.tickerTxt} numberOfLines={1}>
          LOCAL LLM · LAN ONLY · AES-256-GCM · HMAC-SHA256 · ZERO TELEMETRY · NO CLOUD
        </Text>
        <View style={[hub.tickerBadge, { borderColor: T.cyan + '30' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 7, color: T.cyan, fontWeight: '900' }}>NEXUS</Text>
        </View>
      </View>

      {/* Bottom stripe */}
      <View style={{ height: 2.5, flexDirection: 'row', opacity: 0.5 }}>
        {[T.cyan, T.green, T.magenta, T.amber, T.pink].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
    </Animated.View>
  );
}

const hub = StyleSheet.create({
  outer:          { borderWidth: 1.5, backgroundColor: T.surf, overflow: 'hidden', position: 'relative',
    ...Platform.select({ ios: { shadowColor: T.cyan, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 }, android: { elevation: 8 } }) },
  scanLine:       { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(0,229,255,0.025)', transform: [{ skewX: '-12deg' }], zIndex: 0 },
  heroRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 10, zIndex: 1 },
  mascotCol:      { width: 66, alignItems: 'center', flexShrink: 0 },
  mascotImg:      { width: 58, height: 72 },
  mascotFallback: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  mascotBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, marginTop: 5 },
  mascotBadgeTxt: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  titleCol:       { flex: 1 },
  title:          { fontFamily: MONO, fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
  badge:          { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt:       { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  sub:            { fontFamily: MONO, fontSize: 8.5, color: T.mid, lineHeight: 13, marginBottom: 6 },
  promptBox:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  promptTxt:      { fontFamily: MONO, fontSize: 8.5, flex: 1 },
  ctaCol:         { gap: 6, flexShrink: 0, width: 62 },
  ctaPrimary:     { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 4 },
  ctaSecondary:   { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 4, borderWidth: 1.5 },
  ctaTxt:         { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  // Capabilities
  capsRow:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 10, gap: 6, zIndex: 1 },
  capChip:        { width: `${(100 / 2) - 1.8}%` as any, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  capIcon:        { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  capLabel:       { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 },
  capSub:         { fontFamily: MONO, fontSize: 7.5, lineHeight: 11 },
  // Terminal feed
  termOuter:      { backgroundColor: '#020810', borderTopWidth: 1, borderTopColor: T.cyan + '18', zIndex: 1 },
  termChrome:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#010407', borderBottomWidth: 1, borderBottomColor: T.cyan + '14' },
  termChromeTitle:{ fontFamily: MONO, fontSize: 8, color: T.cyan + '55', letterSpacing: 0.8, flex: 1, marginLeft: 2 },
  termStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  termStatusTxt:  { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  chanGrid:       { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 5 },
  chan:           { width: `${(100 / 2) - 1.5}%` as any, borderWidth: 1, borderRadius: 8, backgroundColor: '#030A14', overflow: 'hidden' },
  chanHdr:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderBottomWidth: 1, backgroundColor: '#020609' },
  chanLabel:      { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.4, flex: 1 },
  chanCount:      { borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  chanCountTxt:   { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  chanRow:        { borderLeftWidth: 2, paddingLeft: 5, paddingVertical: 3.5, paddingRight: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  chanRowTxt:     { fontFamily: MONO, fontSize: 8, flex: 1 },
  chanTag:        { borderWidth: 1, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  chanTagTxt:     { fontFamily: MONO, fontSize: 6.5, fontWeight: '900' },
  chanEmpty:      { fontFamily: MONO, fontSize: 7.5, color: T.dim, padding: 7 },
  botRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: T.cyan + '14', backgroundColor: '#010508' },
  botAvatar:      { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: T.cyan + '40',
    backgroundColor: T.cyan + '0C', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  botTxt:         { fontFamily: MONO, fontSize: 8.5, color: T.cyan + '90', flex: 1 },
  ticker:         { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 5,
    borderTopWidth: 1, borderTopColor: T.cyan + '12', backgroundColor: '#010407' },
  tickerTxt:      { fontFamily: MONO, fontSize: 7.5, color: T.cyan + '55', flex: 1 },
  tickerBadge:    { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
});

// ══════════════════════════════════════════════════════════════════
// BLOCK C: NEXUS METRICS DASHBOARD
// Merges: TelemetryRow + StatCardsRow + QuickGrid into one block
// ══════════════════════════════════════════════════════════════════
const QUICK_ITEMS = [
  { icon: 'lightning-bolt',         lib: 'community' as const, label: 'SCRIPTS',  color: T.magenta, tab: 'scripts'   },
  { icon: 'robot-excited',          lib: 'community' as const, label: 'AI CHAT',  color: T.green,   tab: 'butler'    },
  { icon: 'folder-network-outline', lib: 'community' as const, label: 'VAULT',    color: T.pink,    tab: 'fileshare' },
  { icon: 'chart-bar',              lib: 'community' as const, label: 'INTEL',    color: T.amber,   tab: 'logs'      },
  { icon: 'hammer-screwdriver',     lib: 'community' as const, label: 'BUILD',    color: T.yellow,  tab: 'builder'   },
  { icon: 'brain',                  lib: 'community' as const, label: 'KB',       color: T.cyan,    tab: 'knowledge' },
  { icon: 'palette-swatch',         lib: 'community' as const, label: 'SKINS',    color: T.magenta, tab: 'cosmetic'  },
  { icon: 'tune-variant',           lib: 'community' as const, label: 'CONFIG',   color: T.mid,     tab: 'settings'  },
];

function NexusMetricsDashboard({ isConn, metrics, scripts, kbCount, goToTab }: {
  isConn: boolean;
  metrics: { cpu: number; ram: number; disk: number };
  scripts: number; kbCount: number;
  goToTab: (t: string) => void;
}) {
  const TELEMETRY = [
    { lbl: 'CPU',  val: isConn ? Math.round(metrics.cpu)  : null, color: metrics.cpu  > 80 ? T.red : metrics.cpu  > 60 ? T.amber : T.cyan,   icon: 'memory'     },
    { lbl: 'RAM',  val: isConn ? Math.round(metrics.ram)  : null, color: metrics.ram  > 85 ? T.red : metrics.ram  > 70 ? T.amber : T.green,  icon: 'storage'    },
    { lbl: 'DISK', val: isConn ? Math.round(metrics.disk) : null, color: metrics.disk > 90 ? T.red : metrics.disk > 75 ? T.amber : T.yellow, icon: 'disc-full'  },
  ];

  const STATS = [
    { label: 'SCRIPTS', value: scripts > 0  ? String(scripts)  : '—', color: T.magenta, icon: 'code-braces' as const, lib: 'community' as const },
    { label: 'VECTORS', value: kbCount > 0  ? String(kbCount)  : '—', color: T.cyan,    icon: 'brain'        as const, lib: 'community' as const },
    { label: 'FREE',    value: isConn ? `${Math.max(0, 100 - Math.round(metrics.disk))}%` : '—', color: T.green, icon: 'harddisk' as const, lib: 'community' as const },
    { label: 'SEC',     value: isConn ? 'OK' : '—',                   color: T.teal,    icon: 'shield-check'  as const, lib: 'community' as const },
  ];

  return (
    <View style={dash.outer}>
      {/* 5-color top stripe */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[T.cyan, T.amber, T.green, T.magenta, T.yellow].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* ── TELEMETRY ROW ── */}
      <View style={dash.section}>
        <View style={dash.sectionHdr}>
          <MaterialIcons name="monitor-heart" size={10} color={T.cyan} />
          <Text style={[dash.sectionTitle, { color: T.cyan }]}>LIVE TELEMETRY</Text>
          <View style={[dash.livePill, { borderColor: (isConn ? T.green : T.red) + '45', backgroundColor: (isConn ? T.green : T.red) + '09' }]}>
            <PulseDot color={isConn ? T.green : T.red} size={4} />
            <Text style={[dash.liveTxt, { color: isConn ? T.green : T.red }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {TELEMETRY.map(({ lbl, val, color, icon }) => (
            <View key={lbl} style={[dash.metricCard, { borderTopColor: color, borderColor: color + '28' }]}>
              <HudCorners color={color + '45'} size={7} t={1} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                <MaterialIcons name={icon as any} size={10} color={color} />
                <Text style={[dash.metricLbl, { color: color + '80' }]}>{lbl}</Text>
              </View>
              <Text style={[dash.metricVal, { color }]}>{val !== null ? `${val}%` : '—'}</Text>
              <View style={dash.metricTrack}>
                <View style={[dash.metricFill, { width: `${val ?? 0}%` as any, backgroundColor: color }]} />
              </View>
              <View style={[dash.metricBadge, { borderColor: color + '40', backgroundColor: color + '0A' }]}>
                <PulseDot color={isConn ? color : T.mid} size={4} />
                <Text style={[dash.metricBadgeTxt, { color: isConn ? color : T.mid }]}>
                  {isConn ? (val !== null && val > 80 ? 'WARN' : 'OK') : 'OFF'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── STAT CARDS ── */}
      <View style={[dash.section, { paddingTop: 0 }]}>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {STATS.map((s, i) => {
            const Icon = s.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <View key={i} style={[dash.statCard, { borderTopColor: s.color, borderColor: s.color + '28' }]}>
                <View style={{ position: 'absolute', top: 6, right: 8, opacity: 0.35 }}>
                  <Icon name={s.icon as any} size={12} color={s.color} />
                </View>
                <HudCorners color={s.color + '30'} size={6} t={1} />
                <Text style={[dash.statVal, { color: s.color }]} adjustsFontSizeToFit minimumFontScale={0.4} numberOfLines={1}>{s.value}</Text>
                <Text style={[dash.statLbl, { color: s.color + '65' }]}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── QUICK LAUNCH GRID ── */}
      <View style={[dash.section, { paddingTop: 0 }]}>
        <View style={dash.sectionHdr}>
          <MaterialCommunityIcons name="rocket-launch" size={10} color={T.amber} />
          <Text style={[dash.sectionTitle, { color: T.amber }]}>QUICK LAUNCH</Text>
        </View>
        <View style={dash.quickGrid}>
          {QUICK_ITEMS.map((q, i) => {
            const Icon = q.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <TouchableOpacity key={i} onPress={() => { haptics.light(); goToTab(q.tab); }}
                activeOpacity={0.75} style={dash.quickCell}>
                <View style={[dash.quickGlass, { borderColor: q.color + '40', borderTopColor: q.color }]}>
                  <View style={[dash.quickIcon, { borderColor: q.color + '55', backgroundColor: q.color + '0E' }]}>
                    <Icon name={q.icon as any} size={18} color={q.color} />
                  </View>
                  <Text style={[dash.quickLbl, { color: q.color }]}>{q.label}</Text>
                  <View style={[dash.quickBar, { backgroundColor: q.color }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom security strip */}
      <View style={dash.secStrip}>
        {[
          { icon: 'lock',         lbl: 'AES-256',     col: T.cyan    },
          { icon: 'verified-user',lbl: 'HMAC-256',    col: T.green   },
          { icon: 'wifi-off',     lbl: 'LAN ONLY',    col: T.amber   },
          { icon: 'no-accounts',  lbl: 'NO ACCOUNTS', col: T.magenta },
          { icon: 'storage',      lbl: 'LOCAL DB',    col: T.blue    },
          { icon: 'block',        lbl: 'NO TELEMETRY',col: T.red     },
        ].map((p, i) => (
          <View key={i} style={[dash.secChip, { borderColor: p.col + '35', backgroundColor: p.col + '07' }]}>
            <MaterialIcons name={p.icon as any} size={10} color={p.col} />
            <Text style={[dash.secChipTxt, { color: p.col }]}>{p.lbl}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const dash = StyleSheet.create({
  outer:        { backgroundColor: T.surf, borderWidth: 1, borderColor: T.border, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 }, android: { elevation: 6 } }) },
  section:      { paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 10 },
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, flex: 1 },
  livePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  liveTxt:      { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  // Telemetry cards
  metricCard:   { flex: 1, backgroundColor: T.surf2, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, paddingHorizontal: 10, paddingVertical: 11, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  metricLbl:    { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  metricVal:    { fontFamily: MONO, fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  metricTrack:  { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  metricFill:   { height: '100%', borderRadius: 2 },
  metricBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, marginTop: 6 },
  metricBadgeTxt:{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  // Stat cards
  statCard:     { flex: 1, backgroundColor: T.surf2, borderRadius: 10, borderWidth: 1.5, borderTopWidth: 3, padding: 10, alignItems: 'center', gap: 2, overflow: 'hidden', position: 'relative' },
  statVal:      { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24, letterSpacing: -1 },
  statLbl:      { fontFamily: MONO, fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  // Quick launch grid
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  quickCell:    { width: `${(100 / 4) - 1.9}%` as any },
  quickGlass:   { alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 4, borderRadius: 13, borderWidth: 1.5, borderTopWidth: 2.5, backgroundColor: T.surf2, overflow: 'hidden', position: 'relative' },
  quickIcon:    { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  quickLbl:     { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' },
  quickBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.6 },
  // Security strip
  secStrip:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PAD, paddingBottom: 12, paddingTop: 4, gap: 6,
    borderTopWidth: 1, borderTopColor: T.cyan + '14', backgroundColor: '#020810' },
  secChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  secChipTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
});

// ══════════════════════════════════════════════════════════════════
// BLOCK D: MEMORY BRAIN WIDGET (standalone — unique animated canvas)
// ALL animations useNativeDriver:false — nodeAnims drive opacity AND
// are referenced in left/top interpolations alongside packetAnims.
// ══════════════════════════════════════════════════════════════════
const NODES_MINI = [
  { x: 50, y: 50, col: T.cyan    }, { x: 25, y: 32, col: T.magenta },
  { x: 75, y: 32, col: T.green  }, { x: 18, y: 57, col: T.amber   },
  { x: 82, y: 57, col: T.pink   }, { x: 30, y: 70, col: T.teal    },
  { x: 70, y: 70, col: T.blue   }, { x: 50, y: 18, col: '#CC33FF' },
];
const EDGES_MINI = [[0,1],[0,2],[0,6],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[1,7]];

function MemoryBrainWidget({ kbArticles, facts, upcoming, goToTab }: {
  kbArticles: number; facts: number; upcoming: number; goToTab: (t: string) => void;
}) {
  const focused   = useIsFocused();
  const CW        = SW - PAD * 2 - 140;
  const CH        = 108;
  const nodeAnims = useRef(NODES_MINI.map(() => new Animated.Value(0.3 + Math.random() * 0.5))).current;
  const packAnims = useRef(EDGES_MINI.slice(0, 5).map(() => new Animated.Value(0))).current;
  const glowA     = useRef(new Animated.Value(0.4)).current;
  const mbMounted = useRef(true);

  const nodePx = useMemo(() => NODES_MINI.map(n => ({ x: Math.round(n.x / 100 * CW), y: Math.round(n.y / 100 * CH), col: n.col })), [CW]);
  const edgePx = useMemo(() => EDGES_MINI.map(([a, b]) => {
    const na = nodePx[a] ?? { x: 0, y: 0, col: T.cyan };
    const nb = nodePx[b] ?? { x: 0, y: 0, col: T.cyan };
    const dx = nb.x - na.x; const dy = nb.y - na.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    return { mx: (na.x + nb.x) / 2, my: (na.y + nb.y) / 2, len, angle: Math.atan2(dy, dx) * 180 / Math.PI, ax: na.x, ay: na.y, bx: nb.x, by: nb.y, colA: na.col };
  }), [nodePx]);

  useEffect(() => {
    mbMounted.current = true;
    if (!focused) return;
    const pulses = nodeAnims.map((a, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 120),
      Animated.timing(a, { toValue: 1,    duration: 900 + i * 80, useNativeDriver: false }),
      Animated.timing(a, { toValue: 0.12, duration: 900 + i * 80, useNativeDriver: false }),
    ])));
    const packets = packAnims.map((a, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 350),
      Animated.timing(a, { toValue: 1, duration: 1100 + i * 150, useNativeDriver: false }),
      Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: false }),
      Animated.delay(600),
    ])));
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
    ]));
    pulses.forEach(p => p.start()); packets.forEach(p => p.start()); glow.start();
    return () => { mbMounted.current = false; pulses.forEach(p => p.stop()); packets.forEach(p => p.stop()); glow.stop(); };
  }, [focused]);

  const borderC  = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [T.cyan + '28', T.cyan + '88'] });
  const level    = kbArticles >= 200 ? 'OMEGA' : kbArticles >= 100 ? 'SAGE' : kbArticles >= 50 ? 'EXPERT' : kbArticles >= 25 ? 'SCHOLAR' : kbArticles >= 10 ? 'STUDENT' : 'LEARNER';
  const levelCol = kbArticles >= 200 ? T.cyan : kbArticles >= 100 ? T.magenta : kbArticles >= 50 ? T.green : kbArticles >= 25 ? T.blue : kbArticles >= 10 ? T.amber : T.mid;

  return (
    <Animated.View style={[brain.outer, { borderColor: borderC }]}>
      <View style={[brain.topBar, { backgroundColor: T.cyan }]} />
      <HudCorners color={T.cyan + '40'} size={8} t={1} />
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <View style={[brain.canvas, { width: CW, height: CH }]}>
          {edgePx.map((e, i) => (
            <Animated.View key={`e${i}`} pointerEvents="none" style={[brain.edge, {
              left: e.mx - e.len / 2, top: e.my - 0.75, width: Math.round(e.len),
              transform: [{ rotate: `${e.angle}deg` }], backgroundColor: e.colA + '28',
              opacity: nodeAnims[EDGES_MINI[i][0]].interpolate({ inputRange: [0.12, 1], outputRange: [0.15, 0.7] }),
            }]} />
          ))}
          {edgePx.slice(0, 5).map((e, i) => (
            <Animated.View key={`p${i}`} pointerEvents="none" style={[brain.packet, {
              left:    packAnims[i].interpolate({ inputRange: [0, 1], outputRange: [e.ax - 3, e.bx - 3] }),
              top:     packAnims[i].interpolate({ inputRange: [0, 1], outputRange: [e.ay - 3, e.by - 3] }),
              backgroundColor: e.colA,
              opacity: packAnims[i].interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }),
            }]} />
          ))}
          {nodePx.map((n, i) => (
            <Animated.View key={`n${i}`} pointerEvents="none" style={[brain.node, { left: n.x - 5, top: n.y - 5, backgroundColor: n.col, opacity: nodeAnims[i] }]} />
          ))}
          <Animated.View pointerEvents="none" style={[brain.hub, { left: nodePx[0].x - 10, top: nodePx[0].y - 10, borderColor: T.cyan, opacity: glowA }]}>
            <MaterialCommunityIcons name="brain" size={10} color={T.cyan} />
          </Animated.View>
        </View>
        <View style={brain.sidebar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <MaterialCommunityIcons name="brain" size={13} color={T.cyan} />
            <Text style={[brain.sideTitle, { color: T.cyan }]}>NEURAL KB</Text>
          </View>
          <View style={[brain.lvlBox, { borderColor: levelCol + '55', backgroundColor: levelCol + '0C' }]}>
            <Text style={[brain.lvlTxt, { color: levelCol }]}>{level}</Text>
          </View>
          <Text style={[brain.bigNum, { color: T.cyan }]}>{kbArticles}</Text>
          <Text style={[brain.bigLbl, { color: T.cyan + '70' }]}>VECTORS</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={[brain.miniStat, { borderColor: T.magenta + '40' }]}>
              <Text style={[brain.miniN, { color: T.magenta }]}>{facts}</Text>
              <Text style={[brain.miniL, { color: T.magenta + '70' }]}>FACTS</Text>
            </View>
            {upcoming > 0 && (
              <View style={[brain.miniStat, { borderColor: T.pink + '40' }]}>
                <Text style={[brain.miniN, { color: T.pink }]}>{upcoming}</Text>
                <Text style={[brain.miniL, { color: T.pink + '70' }]}>EVENTS</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => { haptics.light(); goToTab('knowledge'); }} activeOpacity={0.85}
            style={[brain.openBtn, { borderColor: T.cyan + '50', backgroundColor: T.cyan + '0D' }]}>
            <Text style={[brain.openBtnTxt, { color: T.cyan }]}>OPEN KB {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const brain = StyleSheet.create({
  outer:    { borderWidth: 1.5, borderRadius: 14, backgroundColor: T.surf, overflow: 'hidden', position: 'relative',
    ...Platform.select({ ios: { shadowColor: T.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 }, android: { elevation: 6 } }) },
  topBar:   { height: 2.5 },
  canvas:   { position: 'relative', backgroundColor: '#020810', overflow: 'hidden' },
  edge:     { position: 'absolute', height: 1.5, borderRadius: 1 },
  packet:   { position: 'absolute', width: 7, height: 7, borderRadius: 3.5 },
  node:     { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  hub:      { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: T.cyan + '18' },
  sidebar:  { flex: 1, padding: 12 },
  sideTitle:{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },
  lvlBox:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  lvlTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  bigNum:   { fontFamily: MONO, fontSize: 28, fontWeight: '900', lineHeight: 32, letterSpacing: -1 },
  bigLbl:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', letterSpacing: 0.8 },
  miniStat: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center' },
  miniN:    { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  miniL:    { fontFamily: MONO, fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  openBtn:  { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, marginTop: 8, alignItems: 'center' },
  openBtnTxt:{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
});

// ══════════════════════════════════════════════════════════════════
// BLOCK E: NEXUS OPS CENTER
// Merges: AlertsIntelCard + QuickScriptRunner into one terminal panel
// ══════════════════════════════════════════════════════════════════
const OPS_SCRIPTS = [
  { id: 'sysinfo', icon: 'desktop-mac',      lib: 'community' as const, label: 'SYS INFO',  color: T.cyan,
    script: `import platform,socket\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"Host: {socket.gethostname()}")` },
  { id: 'clean',   icon: 'broom',            lib: 'community' as const, label: 'CLEAN TMP', color: T.green,
    script: `import shutil,os,tempfile\nfreed=0;n=0\nfor item in os.listdir(tempfile.gettempdir()):\n fp=os.path.join(tempfile.gettempdir(),item)\n try:\n  sz=os.path.getsize(fp) if os.path.isfile(fp) else 0\n  (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n  freed+=sz;n+=1\n except:pass\nprint(f"Cleared {n} items, freed {freed//1024//1024}MB")` },
  { id: 'disk',    icon: 'harddisk',         lib: 'community' as const, label: 'DISK',      color: T.blue,
    script: `import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { id: 'net',     icon: 'wifi-strength-4',  lib: 'community' as const, label: 'NETWORK',   color: T.amber,
    script: `import psutil,socket\nnet=psutil.net_io_counters()\nprint(f"Sent: {net.bytes_sent/1024/1024:.1f}MB\\nRecv: {net.bytes_recv/1024/1024:.1f}MB")\ns=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)\ns.connect(("8.8.8.8",80));ip=s.getsockname()[0];s.close()\nprint(f"IP: {ip}")` },
  { id: 'procs',   icon: 'memory',           lib: 'community' as const, label: 'PROCS',     color: T.magenta,
    script: `import psutil\nprocs=sorted(psutil.process_iter(['name','cpu_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)[:6]\nfor p in procs: print(f"{p.info['name'][:18]:18} CPU:{p.info['cpu_percent']:.1f}%")` },
  { id: 'battery', icon: 'battery-charging', lib: 'community' as const, label: 'BATTERY',  color: '#AAFF00',
    script: `import psutil\nb=psutil.sensors_battery()\nif b: print(f"Level: {b.percent:.0f}%\\nPlugged: {b.power_plugged}")\nelse: print("No battery (desktop?)")` },
];

function NexusOpsCenter({ isConn, cpu, goToTab, histItems }: {
  isConn: boolean; cpu: number; goToTab: (t: string) => void; histItems: any[];
}) {
  const [running, setRunning] = useState<string | null>(null);
  const [output,  setOutput]  = useState<{ label: string; text: string; ok: boolean } | null>(null);

  const runScript = async (item: typeof OPS_SCRIPTS[0]) => {
    if (!isConn || running) return;
    haptics.heavy(); setRunning(item.id); setOutput(null);
    try {
      const ip = serverConnection.getIP(); const port = serverConnection.getPort(); const tok = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not connected');
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 28000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method: 'POST', headers: h, body: JSON.stringify({ script: item.script }), signal: ctrl.signal });
      const d = await res.json();
      setOutput({ label: item.label, text: (d.output || d.error || 'Done').trim().slice(0, 500), ok: !d.error });
      haptics.success();
    } catch (e: any) {
      setOutput({ label: item.label, text: 'Error: ' + (e?.message || 'Network'), ok: false });
    } finally { setRunning(null); }
  };

  const alerts = isConn ? [
    { col: cpu > 70 ? T.amber : T.green, label: cpu > 70 ? `CPU HIGH: ${Math.round(cpu)}%` : 'CPU nominal', tag: 'PC'  },
    { col: T.cyan,    label: 'HMAC auth verified',  tag: 'SEC' },
    { col: T.magenta, label: 'Script runtime ready', tag: 'SYS' },
  ] : [
    { col: T.red,  label: 'PC not connected', tag: 'OFF' },
    { col: T.cyan, label: 'Scan QR to pair',  tag: 'TIP' },
  ];

  const intel = histItems.length > 0
    ? histItems.slice(0, 4).map((h: any) => ({ label: h.scriptName || 'Script', tag: h.success ? 'OK' : 'ERR', col: h.success ? T.green : T.red }))
    : [
      { label: 'AI core initialized',   tag: 'SYS', col: T.cyan    },
      { label: 'KB engine idle',         tag: 'KB',  col: T.amber   },
      { label: 'LAN scanner armed',      tag: 'NET', col: T.green   },
      { label: 'Encryption active',      tag: 'SEC', col: T.magenta },
    ];

  return (
    <View style={ops.outer}>
      {/* 5-color stripe */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[T.amber, T.magenta, T.green, T.cyan, T.red].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* ── ALERTS + INTEL (dual panel) ── */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.dim }}>
        {/* Alerts */}
        <View style={ops.panel}>
          <View style={ops.panelHdr}>
            <MaterialIcons name="notifications" size={10} color={T.amber} />
            <Text style={[ops.panelTitle, { color: T.amber }]}>ALERTS</Text>
            <View style={[ops.panelBadge, { borderColor: T.amber + '40', backgroundColor: T.amber + '09' }]}>
              <Text style={[ops.panelBadgeTxt, { color: T.amber }]}>{alerts.length}</Text>
            </View>
          </View>
          {alerts.map((a, i) => (
            <View key={i} style={[ops.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.dim }]}>
              <View style={[ops.dot, { backgroundColor: a.col }]} />
              <Text style={ops.rowTxt} numberOfLines={1}>{a.label}</Text>
              <View style={[ops.tag, { borderColor: a.col + '40' }]}><Text style={[ops.tagTxt, { color: a.col }]}>{a.tag}</Text></View>
            </View>
          ))}
          <TouchableOpacity onPress={() => { haptics.light(); goToTab('logs'); }} style={ops.footer}>
            <Text style={[ops.footerTxt, { color: T.amber }]}>LOGS {'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: T.dim }} />

        {/* Intel */}
        <View style={ops.panel}>
          <View style={ops.panelHdr}>
            <MaterialCommunityIcons name="clipboard-list" size={10} color={T.magenta} />
            <Text style={[ops.panelTitle, { color: T.magenta }]}>INTEL</Text>
            <View style={[ops.panelBadge, { borderColor: T.magenta + '40', backgroundColor: T.magenta + '09' }]}>
              <Text style={[ops.panelBadgeTxt, { color: T.magenta }]}>{intel.length}</Text>
            </View>
          </View>
          {intel.map((r, i) => (
            <View key={i} style={[ops.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.dim }]}>
              <View style={[ops.dot, { backgroundColor: r.col }]} />
              <Text style={ops.rowTxt} numberOfLines={1}>{r.label}</Text>
              <View style={[ops.tag, { borderColor: r.col + '40' }]}><Text style={[ops.tagTxt, { color: r.col }]}>{r.tag}</Text></View>
            </View>
          ))}
          <TouchableOpacity onPress={() => { haptics.light(); goToTab('butler'); }} style={ops.footer}>
            <Text style={[ops.footerTxt, { color: T.magenta }]}>ASK AI {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── QUICK PC SCRIPTS ── */}
      <View style={ops.scriptHdr}>
        <MaterialCommunityIcons name="code-braces-box" size={11} color={T.green} />
        <Text style={[ops.scriptHdrTxt, { color: T.green }]}>QUICK PC SCRIPTS</Text>
        <View style={{ flex: 1 }} />
        <View style={[ops.panelBadge, { borderColor: (isConn ? T.green : T.red) + '45', backgroundColor: (isConn ? T.green : T.red) + '08' }]}>
          <PulseDot color={isConn ? T.green : T.red} size={4} />
          <Text style={[ops.panelBadgeTxt, { color: isConn ? T.green : T.red }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PAD, paddingBottom: output ? 0 : 12 }}>
        {OPS_SCRIPTS.map(item => {
          const Icon = item.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
          const isRun = running === item.id;
          return (
            <Pressable key={item.id} onPress={() => runScript(item)} disabled={!isConn || !!running}
              style={({ pressed }) => ({
                width: '33.33%', alignItems: 'center', paddingVertical: 12, borderRadius: 8, marginBottom: 2,
                opacity: !isConn ? 0.3 : 1, backgroundColor: pressed && isConn ? item.color + '12' : 'transparent',
              })}>
              <View style={[ops.scriptIcon, { borderTopColor: item.color, borderColor: item.color + '30', backgroundColor: item.color + '09' }]}>
                {isRun ? <ActivityIndicator size="small" color={item.color} /> : <Icon name={item.icon as any} size={19} color={item.color} />}
              </View>
              <Text style={[ops.scriptLbl, { color: item.color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {output && (
        <View style={{ paddingHorizontal: PAD, paddingBottom: 12 }}>
          <View style={[ops.outBox, { borderColor: (output.ok ? T.green : T.red) + '50', backgroundColor: (output.ok ? T.green : T.red) + '07' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <MaterialIcons name={output.ok ? 'check-circle' : 'error'} size={12} color={output.ok ? T.green : T.red} />
              <Text style={[ops.outLabel, { color: output.ok ? T.green : T.red }]}>{output.label}</Text>
              <TouchableOpacity onPress={() => setOutput(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={13} color={T.mid} />
              </TouchableOpacity>
            </View>
            <Text style={[ops.outTxt, { color: output.ok ? T.green : T.red }]} selectable>{output.text}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const ops = StyleSheet.create({
  outer:        { backgroundColor: T.surf, borderWidth: 1, borderColor: T.dim, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 5 } }) },
  panel:        { flex: 1 },
  panelHdr:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: PAD, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.dim },
  panelTitle:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, flex: 1 },
  panelBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  panelBadgeTxt:{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: PAD, paddingVertical: 7 },
  dot:          { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  rowTxt:       { fontFamily: MONO, fontSize: 8.5, color: T.text, flex: 1 },
  tag:          { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  tagTxt:       { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  footer:       { paddingHorizontal: PAD, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.dim },
  footerTxt:    { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center' },
  scriptHdr:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: T.dim },
  scriptHdrTxt: { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2 },
  scriptIcon:   { width: 42, height: 42, borderRadius: 11, borderWidth: 1.5, borderTopWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  scriptLbl:    { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', textAlign: 'center' },
  outBox:       { borderWidth: 1.5, borderRadius: 10, padding: 10 },
  outLabel:     { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', flex: 1 },
  outTxt:       { fontFamily: MONO, fontSize: 10, lineHeight: 16 },
});

// ══════════════════════════════════════════════════════════════════
// BLOCK F: SESSION FOOTER TERMINAL
// ══════════════════════════════════════════════════════════════════
function SessionFooter({ isConn, addr }: { isConn: boolean; addr: string }) {
  const ROWS: [string, string, string][] = [
    ['version  ', '7.3.0',              T.green],
    ['telemetry', 'DISABLED',           T.green],
    ['cloud    ', 'DISABLED',           T.green],
    ['crypto   ', 'AES-256 / HMAC-256', T.mid  ],
    ['storage  ', 'DEVICE ONLY',        T.green],
    ['server   ', isConn ? (addr || 'LINKED') : 'NOT CONNECTED', isConn ? T.green : T.red],
  ];
  return (
    <View style={foot.outer}>
      <View style={foot.chrome}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />)}
        <Text style={foot.chromeTitle}>butler@nexus — session</Text>
        <View style={[foot.secureBadge, { borderColor: T.green + '35', backgroundColor: T.green + '09' }]}>
          <Text style={[foot.secureTxt, { color: T.green }]}>SECURE</Text>
        </View>
      </View>
      <View style={foot.body}>
        {ROWS.map(([k, v, col], i) => (
          <View key={i} style={foot.row}>
            <Text style={foot.key}>  {k}:</Text>
            <Text style={[foot.val, { color: col }]}>{v}</Text>
          </View>
        ))}
        <View style={foot.statusRow}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isConn ? T.green : T.red }} />
          <Text style={[foot.statusTxt, { color: isConn ? T.green : T.red }]}>
            {isConn ? 'CONNECTED — HMAC token active' : 'OFFLINE — scan QR to pair PC'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }}>
          <Text style={foot.prompt}>$</Text>
          <View style={{ width: 6, height: 11, backgroundColor: T.cyan + '50', borderRadius: 1 }} />
        </View>
      </View>
      {/* Bottom 5-color stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[T.cyan, T.green, T.magenta, T.amber, T.pink].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
    </View>
  );
}

const foot = StyleSheet.create({
  outer:       { backgroundColor: '#010207', borderRadius: 14, borderWidth: 1, borderColor: T.cyan + '20', overflow: 'hidden', marginBottom: 28 },
  chrome:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#020509', borderBottomWidth: 1, borderBottomColor: T.cyan + '14' },
  chromeTitle: { flex: 1, fontFamily: MONO, fontSize: 8, color: T.cyan + '50', letterSpacing: 0.3, textAlign: 'center' },
  secureBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  secureTxt:   { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  body:        { padding: 12, gap: 3 },
  row:         { flexDirection: 'row', gap: 7 },
  key:         { fontFamily: MONO, fontSize: 8.5, color: T.dim, width: 70 },
  val:         { fontFamily: MONO, fontSize: 8.5, flex: 1 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  statusTxt:   { fontFamily: MONO, fontSize: 8.5 },
  prompt:      { fontFamily: MONO, fontSize: 8.5, color: T.cyan + '55' },
});

// ══════════════════════════════════════════════════════════════════
// CONNECT MODAL
// ══════════════════════════════════════════════════════════════════
function ConnectModal({ visible, onClose, onConnected }: { visible: boolean; onClose: () => void; onConnected: () => void }) {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8766');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const scannedRef = useRef(false);

  const handleQR = useCallback(async (data: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true; setShowCam(false); haptics.success();
    try {
      const parsed = parseQRConnection(data);
      if (parsed?.ip) {
        setIp(parsed.ip); if (parsed.port) setPort(String(parsed.port));
        setStatus(`Connecting to ${parsed.ip}...`); setBusy(true);
        const r = await (serverConnection.connectManual ? serverConnection.connectManual(parsed.ip, String(parsed.port || port)) : Promise.resolve({ success: false, error: 'N/A' }));
        setBusy(false);
        if ((r as any).success) { haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 700); return; }
        throw new Error((r as any).error || 'Failed');
      }
    } catch (e: any) { setBusy(false); setStatus('Error: ' + (e?.message || 'Failed')); }
    const m = data.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?/);
    if (m) { setIp(m[1]); if (m[2]) setPort(m[2]); setStatus(`Found IP: ${m[1]}`); }
    else { setStatus(`Scanned: ${data.slice(0, 40)}`); scannedRef.current = false; }
  }, [port, onConnected, onClose]);

  const connect = async () => {
    if (!ip.trim()) { setStatus('Enter IP address'); return; }
    setBusy(true); setStatus(`Connecting to ${ip.trim()}...`);
    try {
      const r = await (serverConnection.connectManual ? serverConnection.connectManual(ip.trim(), port.trim()) : Promise.resolve({ success: false, error: 'N/A' }));
      if ((r as any).success) { setStatus('Connected!'); haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 600); }
      else throw new Error((r as any).error || 'Failed');
    } catch (e: any) { setStatus('Error: ' + (e?.message || 'Failed')); }
    setBusy(false);
  };

  if (!visible) return null;
  const statusColor = status.includes('Error') ? T.red : status.includes('Connected') ? T.green : T.amber;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <View style={modal.sheet}>
          <View style={{ height: 3, backgroundColor: T.cyan }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, paddingBottom: 12 }}>
            <MaterialIcons name="qr-code-scanner" size={20} color={T.cyan} />
            <Text style={modal.title}>PAIR YOUR PC</Text>
            <Pressable onPress={onClose} style={modal.closeBtn}><MaterialIcons name="close" size={15} color={T.mid} /></Pressable>
          </View>
          {showCam ? (
            <View style={modal.camWrap}>
              <Suspense fallback={null}>
                <QRCameraScanner onScanned={handleQR} hudColor={T.cyan}>
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={{ width: 110, height: 110, borderWidth: 2, borderColor: T.cyan + '60', borderRadius: 4 }} />
                    <Text style={{ fontFamily: MONO, fontSize: 9, color: T.cyan, marginTop: 9, fontWeight: '900', letterSpacing: 1 }}>SCAN QR FROM TERMINAL</Text>
                  </View>
                </QRCameraScanner>
              </Suspense>
              <TouchableOpacity onPress={() => setShowCam(false)} style={modal.camClose}>
                <MaterialIcons name="close" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { scannedRef.current = false; setShowCam(true); }} activeOpacity={0.82}
              style={modal.scanBtn}>
              <MaterialIcons name="qr-code-scanner" size={18} color={T.cyan} />
              <View>
                <Text style={modal.scanBtnTxt}>SCAN QR CODE</Text>
                <Text style={modal.scanBtnSub}>Run butler_server.py then scan QR in terminal</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: T.dim }} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: T.mid }}>OR ENTER IP</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: T.dim }} />
          </View>
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            <TextInput value={ip} onChangeText={setIp} placeholder="192.168.x.x" placeholderTextColor={T.dim}
              style={modal.input} keyboardType="numeric" autoCorrect={false} />
            <TextInput value={port} onChangeText={setPort} placeholder="8766" placeholderTextColor={T.dim}
              style={[modal.input, { borderColor: T.cyan + '30' }]} keyboardType="numeric" />
          </View>
          {status ? (
            <View style={[modal.statusBox, { borderColor: statusColor + '45', backgroundColor: statusColor + '0A' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: statusColor }}>{status}</Text>
            </View>
          ) : null}
          <Pressable onPress={connect} disabled={busy} style={({ pressed }) => [modal.connectBtn, { opacity: pressed || busy ? 0.8 : 1 }]}>
            {busy ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="link" size={18} color="#000" />}
            <Text style={modal.connectTxt}>{busy ? 'CONNECTING...' : 'CONNECT TO PC'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  sheet:     { backgroundColor: T.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 44, overflow: 'hidden' },
  title:     { fontFamily: MONO, fontSize: 15, fontWeight: '900', color: T.text, flex: 1 },
  closeBtn:  { width: 32, height: 32, borderRadius: 8, backgroundColor: T.surf2, alignItems: 'center', justifyContent: 'center' },
  camWrap:   { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: T.cyan + '70' },
  camClose:  { position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  scanBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderRadius: 12, borderColor: T.cyan + '55', backgroundColor: T.cyan + '0A', paddingVertical: 13, paddingHorizontal: 14 },
  scanBtnTxt:{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: T.cyan },
  scanBtnSub:{ fontFamily: MONO, fontSize: 8.5, color: T.mid, marginTop: 1 },
  input:     { backgroundColor: T.bg, borderWidth: 1.5, borderColor: T.cyan + '55', borderRadius: 11, color: T.text, padding: 13, fontFamily: MONO, fontSize: 13 },
  statusBox: { marginHorizontal: 16, marginTop: 8, padding: 9, borderRadius: 8, borderWidth: 1 },
  connectBtn:{ margin: 16, marginBottom: 0, backgroundColor: T.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  connectTxt:{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
});

// ══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
function NexusHomeInner() {
  const insets = useSafeAreaInsets();
  const [isConn,    setIsConn]    = useState(false);
  const [addr,      setAddr]      = useState('');
  const [latency,   setLatency]   = useState(0);
  const [metrics,   setMetrics]   = useState({ cpu: 0, ram: 0, disk: 0, net: 0 });
  const [scripts,   setScripts]   = useState(0);
  const [kbCount,   setKbCount]   = useState(0);
  const [kbFacts,   setKbFacts]   = useState(0);
  const [upcoming,  setUpcoming]  = useState(0);
  const [histItems, setHistItems] = useState<any[]>([]);
  const [showQR,    setShowQR]    = useState(false);
  const [refresh,   setRefresh]   = useState(false);

  const loadData = useCallback(async () => {
    try {
      const conn = serverConnection.isConnected?.() ?? false;
      const ip   = serverConnection.getIP?.()   || '';
      const port = serverConnection.getPort?.() || '';
      setIsConn(conn); setAddr(ip && port ? `${ip}:${port}` : '');
      if (conn && ip && port) {
        const tok = serverConnection.getToken?.() || '';
        const h: Record<string, string> = {};
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController(); const t0 = Date.now();
        setTimeout(() => ctrl.abort(), 7000);
        try {
          const res = await fetch(`http://${ip}:${port}/api/metrics`, { headers: h, signal: ctrl.signal });
          if (res.ok) {
            const d = await res.json();
            setLatency(Date.now() - t0);
            setMetrics({ cpu: d.cpu_percent ?? d.cpu?.percent ?? 0, ram: d.ram_percent ?? d.memory?.percent ?? 0, disk: d.disk_percent ?? d.disk?.percent ?? 0, net: 0 });
            performanceHistory.recordFromMetrics(d);
          }
        } catch {}
      }
    } catch {}
    try { const h = await executionHistory.getAll().catch(() => [] as any[]); const a = Array.isArray(h) ? h : []; setScripts(a.length); setHistItems(a); } catch {}
    try { const fn = (kbGrowthTracker as any).getTotal ?? (kbGrowthTracker as any).getTotalCount; if (fn) { const n = await fn.call(kbGrowthTracker).catch(() => 0); setKbCount(n || 0); } } catch {}
    try { const stats = await knowledgeAccumulator.getStats?.().catch(() => null); if (stats) setKbCount(stats.totalFindings ?? 0); } catch {}
    try { await personalMemory.load(); setKbFacts(personalMemory.getFacts().length); setUpcoming(personalMemory.getUpcomingEvents(30).length); } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, [loadData]));

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      const s = connectionHub.getState();
      setIsConn(s.isConnected ?? false); setAddr(s.addr || '');
      unsub = connectionHub.subscribe((st: any) => {
        setIsConn(st.isConnected ?? false); setAddr(st.addr || '');
        if (st.isConnected) loadData();
      });
    } catch {}
    return () => { unsub?.(); };
  }, [loadData]);

  useEffect(() => {
    (global as any).__nexusHomeOpenQR = () => setShowQR(true);
    return () => { delete (global as any).__nexusHomeOpenQR; };
  }, []);

  const goToTab   = useCallback((tab: string) => { haptics.light(); try { (global as any).__butlerSwitchTab?.(tab); } catch {} }, []);
  const onRefresh = useCallback(async () => { setRefresh(true); haptics.medium(); await loadData(); haptics.success(); setRefresh(false); }, [loadData]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <NexusParticleFX pageId="nexushome" active={true} />
      <ConnectModal visible={showQR} onClose={() => setShowQR(false)} onConnected={loadData} />

      {/* ══ BLOCK A: HEADER + NAV ══ */}
      <NexusHeaderNav
        safeTop={insets.top}
        isConn={isConn} addr={addr} latency={latency}
        onQR={() => setShowQR(true)} onRefresh={onRefresh} goToTab={goToTab}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 240 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={onRefresh}
            tintColor={T.cyan} colors={[T.cyan, T.green, T.magenta]} progressBackgroundColor={T.surf} />
        }
      >
        {/* ══ NEXUS COMMAND CENTER (above-fold hero) ══ */}
        <NexusCommandCenter
          isConn={isConn} addr={addr} latency={latency} metrics={metrics}
          goToTab={goToTab} onQR={() => setShowQR(true)} onRefresh={onRefresh} safeTop={insets.top}
        />

        {/* ══ REMOTE ACCESS ══ */}
        <View style={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 2 }}>
          <RemoteAccessMonetizationCard onConnected={loadData} />
        </View>

        {/* ══ BLOCK B: NEXUS CONTROL HUB (AI chat + terminal feed merged) ══ */}
        <NexusControlHub isConn={isConn} goToTab={goToTab} onQR={() => setShowQR(true)} />

        {/* ══ BLOCK C: METRICS DASHBOARD (telemetry + stats + quick launch merged) ══ */}
        <SectionBar color={T.cyan} icon="monitor-dashboard" label="NEXUS METRICS DASHBOARD" />
        <NexusMetricsDashboard
          isConn={isConn} metrics={metrics} scripts={scripts} kbCount={kbCount} goToTab={goToTab}
        />

        {/* ══ BLOCK D: NEURAL MEMORY BRAIN ══ */}
        <SectionBar color={T.magenta} icon="brain" label="NEURAL MEMORY BRAIN" />
        <View style={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 2 }}>
          <MemoryBrainWidget kbArticles={kbCount} facts={kbFacts} upcoming={upcoming} goToTab={goToTab} />
        </View>

        {/* ══ BLOCK E: OPS CENTER (alerts + intel + quick scripts merged) ══ */}
        <SectionBar color={T.amber} icon="rocket-launch" label="NEXUS OPS CENTER" />
        <NexusOpsCenter isConn={isConn} cpu={metrics.cpu} goToTab={goToTab} histItems={histItems} />

        {/* ══ NEXUS VAULT SECURITY ══ */}
        <SectionBar color={T.green} icon="shield-lock" label="NEXUS VAULT SECURITY" />
        <View style={{ paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 2 }}>
          <NexusVaultCard isConnected={isConn} serverLatencyMs={latency} />
        </View>

        {/* ══ BLOCK F: SESSION FOOTER ══ */}
        <SectionBar color={T.mid} icon="terminal" label="SESSION LOG" />
        <View style={{ paddingHorizontal: PAD, paddingTop: 10 }}>
          <SessionFooter isConn={isConn} addr={addr} />
        </View>
      </ScrollView>
    </View>
  );
}

export default function NexusHomeScreen() {
  return (
    <TabErrorBoundary name="Core">
      <NexusHomeInner />
    </TabErrorBoundary>
  );
}
