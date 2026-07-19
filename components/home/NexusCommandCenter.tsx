
/**
 * NexusCommandCenter — Above-the-fold BUTLER AI hero
 * ─────────────────────────────────────────────────────
 * Redesigned with SYS.BOOT aesthetic:
 *  • Black grid background with animated scanlines
 *  • Fake LAN crawler showing discovered nodes
 *  • Live script previews rotating (typewriter)
 *  • Feature grid showing all key capabilities
 *  • Zero useNativeDriver mixing — all transforms useNativeDriver:true
 *    all color/background uses useNativeDriver:false (SEPARATE values)
 *
 * CRASH PREVENTION: Every Animated.Value has ONE driver type only.
 * Native-only: opacity, transform (translate, scale, rotate)
 * JS-only: borderColor, backgroundColor, width% (layout props)
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions, ScrollView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SCREEN_W } = Dimensions.get('window');
const SW = Math.max(320, SCREEN_W);

const C = {
  bg:      '#010407',
  surf:    '#060D18',
  surf2:   '#0A1422',
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
  mid:     '#3A5A76',
  dim:     '#0A1828',
  border:  'rgba(0,229,255,0.10)',
};

// ── FAKE SCRIPT LINES for the crawler terminal ───────────────────
const CRAWLER_LINES = [
  { text: 'butler@nexus:~$ python -c "import psutil; print(psutil.cpu_percent())"', color: C.cyan,    type: 'cmd' },
  { text: '> 23.4',                                                                  color: C.green,   type: 'out' },
  { text: 'butler@nexus:~$ python -c "from pathlib import Path; print(list(Path.home().glob(\'*.py\'))[:3])"', color: C.cyan, type: 'cmd' },
  { text: '> [script_a.py, automate.py, butler_setup.py]',                          color: C.green,   type: 'out' },
  { text: 'butler@nexus:~$ scan --lan --discover',                                  color: C.amber,   type: 'cmd' },
  { text: '> [NEXUS] Found 3 devices on 192.168.1.x',                               color: C.amber,   type: 'out' },
  { text: '> [NEXUS] butler_server detected @ 192.168.1.100:8766',                  color: C.green,   type: 'out' },
  { text: 'butler@nexus:~$ kb sync --ai --brief',                                   color: C.magenta, type: 'cmd' },
  { text: '> [KB] Indexing 247 Python docs... SIGMA-NET active',                    color: C.magenta, type: 'out' },
  { text: '> [KB] 847 vectors · 23 facts · Score: SAGE',                            color: C.magenta, type: 'out' },
  { text: 'butler@nexus:~$ mem --check --report',                                   color: C.teal,    type: 'cmd' },
  { text: '> RAM: 34.2% · DISK: 58.1% · CPU: 12.3% · ALL OK',                      color: C.green,   type: 'out' },
  { text: 'butler@nexus:~$ auth --verify --hmac',                                   color: C.pink,    type: 'cmd' },
  { text: '> HMAC-SHA256 ............. VERIFIED [64-char token]',                   color: C.green,   type: 'out' },
  { text: '> AES-256-GCM ............. ACTIVE',                                      color: C.green,   type: 'out' },
  { text: '> ZERO CLOUD .............. CONFIRMED',                                   color: C.green,   type: 'out' },
];

// ── FEATURE GRID DATA ─────────────────────────────────────────────
const FEATURES = [
  { icon: 'code-braces-box',        lib: 'community' as const, label: '250+\nSCRIPTS',  color: C.magenta },
  { icon: 'robot-happy',            lib: 'community' as const, label: 'LOCAL\nAI',       color: C.cyan    },
  { icon: 'brain',                  lib: 'community' as const, label: 'SIGMA\nNET KB',   color: C.amber   },
  { icon: 'shield-lock',            lib: 'community' as const, label: 'AES\n256',        color: C.green   },
  { icon: 'hammer-screwdriver',     lib: 'community' as const, label: 'PIPELINE\nBLDR',  color: C.yellow  },
  { icon: 'desktop-tower-monitor',  lib: 'community' as const, label: 'PC\nHEALTH',      color: C.blue    },
  { icon: 'wifi-off',               lib: 'community' as const, label: 'LAN\nONLY',       color: C.pink    },
  { icon: 'lock',                   lib: 'material'  as const, label: 'ZERO\nCLOUD',     color: C.teal    },
];

// ── FAKE LAN NODES ────────────────────────────────────────────────
const LAN_NODES = [
  { label: '192.168.1.1',   type: 'ROUTER',  col: C.amber   },
  { label: '192.168.1.100', type: 'PC·HOST', col: C.green   },
  { label: '192.168.1.105', type: 'PHONE',   col: C.cyan    },
  { label: '192.168.1.200', type: 'SCAN…',   col: C.mid     },
];

// ── SAFE PULSE DOT — only opacity, useNativeDriver:true ──────────
function SafePulseDot({ color, size = 5 }: { color: string; size?: number }) {
  const op = useRef(new Animated.Value(0.4)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1,    duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.15, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { mounted.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: op }} />;
}

// ── TYPEWRITER TEXT — safe, no native driver for text animations ──
function TypewriterText({
  lines, color, speed = 40, loop = true,
}: {
  lines: string[]; color: string; speed?: number; loop?: boolean;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const tiRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (tiRef.current) clearTimeout(tiRef.current); };
  }, []);

  useEffect(() => {
    const target = lines[lineIdx];
    if (charIdx < target.length) {
      tiRef.current = setTimeout(() => {
        if (!mounted.current) return;
        setCharIdx(c => c + 1);
      }, speed);
    } else {
      // Line complete — pause then advance
      tiRef.current = setTimeout(() => {
        if (!mounted.current) return;
        const next = (lineIdx + 1) % lines.length;
        if (!loop && next === 0) return;
        setLineIdx(next);
        setCharIdx(0);
      }, 2400);
    }
    return () => { if (tiRef.current) clearTimeout(tiRef.current); };
  }, [charIdx, lineIdx, lines, speed, loop]);

  return (
    <Text style={{ fontFamily: MONO, fontSize: 10, color, lineHeight: 15 }} numberOfLines={2}>
      {lines[lineIdx]?.slice(0, charIdx)}
      <Text style={{ color }}>▌</Text>
    </Text>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
interface Props {
  isConn:    boolean;
  addr:      string;
  latency:   number;
  metrics:   { cpu: number; ram: number; disk: number };
  goToTab:   (t: string) => void;
  onQR:      () => void;
  onRefresh: () => void;
  safeTop:   number;
}

export function NexusCommandCenter({
  isConn, addr, latency, metrics, goToTab, onQR, onRefresh, safeTop,
}: Props) {
  // ── Animated values — NATIVE DRIVER ONLY (opacity/transform) ──
  const scanlineA   = useRef(new Animated.Value(0)).current;   // translateY (native)
  const logoScaleA  = useRef(new Animated.Value(0.92)).current; // scale (native)
  const logoOpA     = useRef(new Animated.Value(0)).current;    // opacity (native)
  const pulseDotA   = useRef(new Animated.Value(0.4)).current;  // opacity (native)
  const crawlerOpA  = useRef(new Animated.Value(0)).current;    // opacity (native)
  const featGridOpA = useRef(new Animated.Value(0)).current;    // opacity (native)
  const connScaleA  = useRef(new Animated.Value(0.9)).current;  // scale (native)

  // ── JS-DRIVER ONLY animated values (color/background) ─────────
  // These are NEVER mixed with native driver animations
  const glowColorA  = useRef(new Animated.Value(0)).current;    // color interp (JS)
  // connBarA removed — scanFill width is driven by radarRotA (same driver group)
  const radarRotA   = useRef(new Animated.Value(0)).current;    // rotation (JS — used with borderColor)

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // ── NATIVE animations ─────────────────────────────────────────
    // Logo entrance (one-shot — no cleanup needed)
    if (mounted.current) {
      Animated.parallel([
        Animated.spring(logoScaleA, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
        Animated.timing(logoOpA, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
      Animated.timing(crawlerOpA, { toValue: 1, duration: 400, delay: 800, useNativeDriver: true }).start();
      Animated.timing(featGridOpA, { toValue: 1, duration: 400, delay: 1200, useNativeDriver: true }).start();
      Animated.spring(connScaleA, { toValue: 1, tension: 100, friction: 8, delay: 400, useNativeDriver: true }).start();
    }

    // Scanline sweep (translateY — native)
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanlineA, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(scanlineA, { toValue: 0, duration: 0,    useNativeDriver: true }),
      Animated.delay(5000),
    ]));
    if (mounted.current) scanLoop.start();

    // Pulse dot (opacity — native)
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulseDotA, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(pulseDotA, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    if (mounted.current) pulseLoop.start();

    // ── JS animations (SEPARATE values — never mixed with native) ──
    // Glow color cycle (JS — used for borderColor interpolation only)
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowColorA, { toValue: 1,   duration: 2000, useNativeDriver: false }),
      Animated.timing(glowColorA, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
    ]));
    if (mounted.current) glowLoop.start();

    // Radar rotation (JS — used with borderColor style only)
    const radarLoop = Animated.loop(
      Animated.timing(radarRotA, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    if (mounted.current) radarLoop.start();

    return () => {
      mounted.current = false;
      scanLoop.stop();
      pulseLoop.stop();
      glowLoop.stop();
      radarLoop.stop();
    };
  }, []); // <-- Missing dependency array closing bracket was the error.

  // ── CRAWLER TERMINAL STATE ─────────────────────────────────────
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const lineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceCrawler = useCallback(() => {
    if (!mounted.current) return;
    const target = CRAWLER_LINES[currentLine];
    if (!target) return;

    if (currentChar < target.text.length) {
      setCurrentChar(c => c + 1);
      lineTimerRef.current = setTimeout(advanceCrawler, 22);
    } else {
      // Line done — show it, move to next after pause
      setVisibleLines(prev => {
        const next = [...prev, currentLine];
        return next.slice(-6); // keep last 6 lines visible
      });
      lineTimerRef.current = setTimeout(() => {
        if (!mounted.current) return;
        setCurrentLine(l => (l + 1) % CRAWLER_LINES.length);
        setCurrentChar(0);
      }, 600);
    }
  }, [currentLine, currentChar]);

  useEffect(() => {
    lineTimerRef.current = setTimeout(advanceCrawler, 1200);
    return () => { if (lineTimerRef.current) clearTimeout(lineTimerRef.current); };
  }, [advanceCrawler]);

  // ── INTERPOLATIONS ─────────────────────────────────────────────
  const scanY = scanlineA.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 320],
  });

  // Glow color for borders (JS driver only)
  const glowBorder = glowColorA.interpolate({
    inputRange: [0.2, 1],
    outputRange: [C.cyan + '20', C.cyan + '70'],
  });

  // Radar sweep color (JS driver only)
  const radarBorder = radarRotA.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [C.cyan + '40', C.green + '80', C.cyan + '40'],
  });

  const cc = isConn ? C.green : C.red;

  // ── 5-COLOR STRIPE ─────────────────────────────────────────────
  const STRIPE = [C.cyan, C.green, C.magenta, C.amber, C.pink];

  return (
    <View style={s.root}>
      {/* ── GRID BACKGROUND ───────────────────────────────────── */}
      <View style={s.gridBg} pointerEvents="none">
        {/* Horizontal grid lines */}
        {[0.12, 0.25, 0.38, 0.52, 0.65, 0.78, 0.91].map((pct, i) => (
          <View key={`h${i}`} style={[s.gridLineH, { top: `${pct * 100}%` as any }]} />
        ))}
        {/* Vertical grid lines */}
        {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((pct, i) => (
          <View key={`v${i}`} style={[s.gridLineV, { left: `${pct * 100}%` as any }]} />
        ))}
        {/* Corner glow blobs */}
        <View style={[s.glowBlob, { top: -40, left: -40, backgroundColor: C.cyan + '08' }]} />
        <View style={[s.glowBlob, { bottom: -20, right: -30, backgroundColor: C.magenta + '06', width: 200, height: 200 }]} />
      </View>

      {/* ── MOVING SCANLINE (native translateY) ───────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[s.scanline, { transform: [{ translateY: scanY }] }]}
      />

      {/* ── 5-COLOR TOP STRIPE ────────────────────────────────── */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {STRIPE.map((col, i) => <View key={i} style={{ flex: 1, backgroundColor: col }} />)}
      </View>

      {/* ═══════════════════════════════════════════════════════
          BLOCK 1: SYS.BOOT HEADER
      ═══════════════════════════════════════════════════════ */}
      <Animated.View style={[s.bootHeader, { opacity: logoOpA, transform: [{ scale: logoScaleA }] }]}>
        <View style={s.bootLeft}>
          {/* SYS.BOOT label */}
          <View style={s.sysBootRow}>
            <Text style={s.sysBoot}>// SYS.BOOT · v7.3.0</Text>
            <SafePulseDot color={C.green} size={5} />
          </View>
          {/* Main title */}
          <Text style={s.titleMain}>
            <Text style={{ color: '#FFF' }}>BUTLER</Text>
            <Text style={{ color: C.cyan }}> AI</Text>
          </Text>
          <View style={s.subTitleRow}>
            <View style={[s.subBadge, { borderColor: C.cyan + '40', backgroundColor: C.cyan + '0A' }]}>
              <Text style={[s.subBadgeTxt, { color: C.cyan }]}>NEXUS · INTELLIGENCE · PLATFORM</Text>
            </View>
          </View>
        </View>

        {/* Right: animated radar circle */}
        <Animated.View style={[s.radarOuter, { borderColor: radarBorder }]}>
          <View style={[s.radarInner, { borderColor: C.cyan + '30' }]}>
            {/* Radar crosshair */}
            <View style={s.radarCrossH} />
            <View style={s.radarCrossV} />
            <Animated.View style={[s.radarDot, { opacity: pulseDotA }]} />
            <SafePulseDot color={cc} size={8} />
          </View>
          <Text style={[s.radarLabel, { color: cc }]}>{isConn ? 'LIVE' : 'SCAN'}</Text>
        </Animated.View>
      </Animated.View>

      {/* ── Connection status bar ─────────────────────────────── */}
      <View style={s.connBar}>
        <SafePulseDot color={cc} size={5} />
        <Text style={[s.connTxt, { color: cc }]}>
          {isConn ? `CONNECTED · ${addr}` : 'OFFLINE · TAP QR TO PAIR'}
        </Text>
        {isConn && latency > 0 && (
          <View style={[s.latBadge, { borderColor: C.mid + '40' }]}>
            <Text style={[s.latTxt, { color: C.mid }]}>{latency}ms</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => { haptics.heavy(); onQR(); }}
          style={[s.connBtn, { borderColor: C.cyan + '55', backgroundColor: C.cyan + '10' }]}>
          <MaterialIcons name="qr-code-scanner" size={14} color={C.cyan} />
          <Text style={[s.connBtnTxt, { color: C.cyan }]}>QR PAIR</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { haptics.light(); goToTab('butler'); }}
          style={[s.connBtn, { borderColor: C.green + '55', backgroundColor: C.green + '10' }]}>
          <MaterialCommunityIcons name="robot-happy-outline" size={14} color={C.green} />
          <Text style={[s.connBtnTxt, { color: C.green }]}>AI CHAT</Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════
          BLOCK 2: LIVE METRICS STRIP
      ═══════════════════════════════════════════════════════ */}
      <View style={s.metricsStrip}>
        {[
          { lbl: 'CPU', val: isConn ? `${Math.round(metrics.cpu)}%` : '--', col: metrics.cpu > 80 ? C.red : C.cyan },
          { lbl: 'RAM', val: isConn ? `${Math.round(metrics.ram)}%` : '--', col: metrics.ram > 85 ? C.red : C.green },
          { lbl: 'DISK', val: isConn ? `${Math.round(metrics.disk)}%` : '--', col: metrics.disk > 90 ? C.red : C.amber },
          { lbl: 'ENC', val: 'AES256', col: C.green },
          { lbl: 'AUTH', val: 'HMAC', col: C.cyan },
          { lbl: 'CLOUD', val: 'ZERO', col: C.pink },
        ].map((m, i) => (
          <View key={i} style={[s.metricPill, { borderColor: m.col + '35' }]}>
            <Text style={[s.metricLbl, { color: m.col + '70' }]}>{m.lbl}</Text>
            <Text style={[s.metricVal, { color: m.col }]}>{m.val}</Text>
          </View>
        ))}
      </View>

      {/* ═══════════════════════════════════════════════════════
          BLOCK 3: TWIN PANEL — Crawler + LAN Scan
      ═══════════════════════════════════════════════════════ */}
      <Animated.View style={[s.twinPanel, { opacity: crawlerOpA }]}>
        {/* LEFT: Script Crawler terminal */}
        <View style={[s.crawlerPanel, { borderColor: C.cyan + '25' }]}>
          {/* Terminal chrome */}
          <View style={s.termChrome}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((col, i) => (
              <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: col }} />
            ))}
            <Text style={s.termTitle}>BUTLER_SHELL</Text>
            <SafePulseDot color={C.green} size={4} />
          </View>
          {/* Visible completed lines */}
          <View style={s.termBody}>
            {visibleLines.map((lineN, i) => {
              const line = CRAWLER_LINES[lineN];
              if (!line) return null;
              return (
                <Text key={i} style={[s.termLine, { color: line.color, opacity: 0.5 + i * 0.1 }]} numberOfLines={1}>
                  {line.type === 'cmd' ? '$ ' : '  '}{line.text}
                </Text>
              );
            })}
            {/* Currently typing line */}
            <Text style={[s.termLine, { color: CRAWLER_LINES[currentLine]?.color ?? C.cyan }]} numberOfLines={1}>
              {CRAWLER_LINES[currentLine]?.type === 'cmd' ? '$ ' : '  '}
              {CRAWLER_LINES[currentLine]?.text.slice(0, currentChar)}
              <Text style={{ color: C.cyan }}>▌</Text>
            </Text>
          </View>
        </View>

        {/* RIGHT: LAN Scanner */}
        <View style={[s.lanPanel, { borderColor: C.amber + '25' }]}>
          <View style={[s.termChrome, { borderBottomColor: C.amber + '20' }]}>
            <MaterialCommunityIcons name="lan-connect" size={9} color={C.amber} />
            <Text style={[s.termTitle, { color: C.amber + '80' }]}>LAN SCAN</Text>
          </View>
          <View style={s.lanBody}>
            {LAN_NODES.map((node, i) => (
              <View key={i} style={s.lanRow}>
                <SafePulseDot color={node.col} size={4} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.lanIp, { color: node.col }]} numberOfLines={1}>{node.label}</Text>
                </View>
                <View style={[s.lanBadge, { borderColor: node.col + '40', backgroundColor: node.col + '0A' }]}>
                  <Text style={[s.lanBadgeTxt, { color: node.col }]}>{node.type}</Text>
                </View>
              </View>
            ))}
            {/* Fake progress bar */}
            <View style={[s.scanProgress, { borderColor: C.amber + '30' }]}>
              <Animated.View style={[s.scanFill, {
                backgroundColor: C.amber,
                width: radarRotA.interpolate({ inputRange: [0, 1], outputRange: ['20%', '85%'] }),
              }]} />
            </View>
            <Text style={s.scanStatus}>SCANNING 192.168.1.x…</Text>
          </View>
        </View>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════
          BLOCK 4: FEATURE GRID (8 capability tiles)
      ═══════════════════════════════════════════════════════ */}
      <Animated.View style={{ opacity: featGridOpA }}>
        <View style={s.featHeader}>
          <View style={[s.featHeaderBar, { backgroundColor: C.cyan }]} />
          <Text style={s.featHeaderTxt}>CORE CAPABILITIES</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.cyan + '20' }} />
          <View style={[s.featBadge, { borderColor: C.green + '50', backgroundColor: C.green + '0A' }]}>
            <SafePulseDot color={C.green} size={4} />
            <Text style={[s.featBadgeTxt, { color: C.green }]}>8 MODULES</Text>
          </View>
        </View>
        <View style={s.featGrid}>
          {FEATURES.map((f, i) => {
            const Icon = f.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <TouchableOpacity key={i} onPress={() => haptics.light()} activeOpacity={0.75}
                style={[s.featCell, { borderColor: f.color + '35', borderTopColor: f.color }]}>
                <View style={[s.featIconBox, { backgroundColor: f.color + '12', borderColor: f.color + '45' }]}>
                  <Icon name={f.icon as any} size={18} color={f.color} />
                </View>
                <Text style={[s.featLabel, { color: f.color }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════
          BLOCK 5: QUICK ACTION ROW
      ═══════════════════════════════════════════════════════ */}
      <Animated.View style={[s.actionRow, { transform: [{ scale: connScaleA }] }]}>
        {[
          { label: 'SCRIPTS', icon: 'code-braces', lib: 'community' as const, col: C.magenta, tab: 'scripts'  },
          { label: 'KB',      icon: 'brain',        lib: 'community' as const, col: C.cyan,    tab: 'knowledge'},
          { label: 'INTEL',   icon: 'chart-bar',    lib: 'community' as const, col: C.amber,   tab: 'logs'     },
          { label: 'BUILD',   icon: 'hammer-screwdriver', lib: 'community' as const, col: C.yellow, tab: 'builder' },
          { label: 'CONFIG',  icon: 'tune',         lib: 'material'  as const, col: C.mid,     tab: 'settings' },
        ].map((btn, i) => {
          const Icon = btn.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i}
              onPress={() => { haptics.light(); goToTab(btn.tab); }}
              style={[s.actionBtn, { borderColor: btn.col + '40', backgroundColor: btn.col + '0A' }]}
              activeOpacity={0.75}>
              <Icon name={btn.icon as any} size={14} color={btn.col} />
              <Text style={[s.actionBtnTxt, { color: btn.col }]}>{btn.label}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* ── Bottom accent bar ─────────────────────────────────── */}
      <View style={{ height: 2.5, flexDirection: 'row', opacity: 0.5 }}>
        {STRIPE.map((col, i) => <View key={i} style={{ flex: 1, backgroundColor: col }} />)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: C.bg,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },

  // Grid BG
  gridBg:    { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,229,255,0.04)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,229,255,0.04)' },
  glowBlob:  { position: 'absolute', width: 250, height: 250, borderRadius: 125 },

  // Scanline
  scanline: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: C.cyan, opacity: 0.06, zIndex: 1,
  },

  // SYS.BOOT header
  bootHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    zIndex: 2,
  },
  bootLeft:    { flex: 1 },
  sysBootRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  sysBoot:     { fontFamily: MONO, fontSize: 9, color: C.cyan + '80', letterSpacing: 1.5 },
  titleMain:   { fontFamily: MONO, fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  subTitleRow: { marginTop: 4 },
  subBadge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  subBadgeTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  // Radar
  radarOuter: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: C.cyan + '05', overflow: 'hidden' },
  radarInner: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  radarCrossH: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: C.cyan + '25' },
  radarCrossV: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: C.cyan + '25' },
  radarDot:   { position: 'absolute', top: 14, right: 14, width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  radarLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 1, position: 'absolute', bottom: 3 },

  // Connection bar
  connBar: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(0,229,255,0.08)',
    backgroundColor: '#020609',
    zIndex: 2,
  },
  connTxt:    { fontFamily: MONO, fontSize: 9.5, fontWeight: '700' },
  latBadge:   { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  latTxt:     { fontFamily: MONO, fontSize: 8 },
  connBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  connBtnTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },

  // Metrics strip
  metricsStrip: {
    flexDirection: 'row', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#020509',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.06)',
    zIndex: 2,
  },
  metricPill: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 7, paddingVertical: 5, gap: 2 },
  metricLbl:  { fontFamily: MONO, fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  metricVal:  { fontFamily: MONO, fontSize: 9, fontWeight: '900' },

  // Twin panel
  twinPanel: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    zIndex: 2,
  },

  // Crawler terminal (left)
  crawlerPanel: {
    flex: 1.4, borderWidth: 1, borderRadius: 10,
    backgroundColor: '#020810', overflow: 'hidden',
  },
  termChrome: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: '#010407',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.10)',
  },
  termTitle:  { fontFamily: MONO, fontSize: 7.5, color: C.cyan + '70', flex: 1, letterSpacing: 0.5 },
  termBody:   { padding: 7, gap: 2 },
  termLine:   { fontFamily: MONO, fontSize: 8, lineHeight: 12 },

  // LAN scanner (right)
  lanPanel: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    backgroundColor: '#020810', overflow: 'hidden',
  },
  lanBody:      { padding: 7, gap: 5 },
  lanRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lanIp:        { fontFamily: MONO, fontSize: 8, fontWeight: '700' },
  lanBadge:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  lanBadgeTxt:  { fontFamily: MONO, fontSize: 6.5, fontWeight: '900' },
  scanProgress: { height: 4, borderRadius: 2, borderWidth: 1, backgroundColor: C.amber + '08', overflow: 'hidden', marginTop: 3 },
  scanFill:     { height: '100%', borderRadius: 2 },
  scanStatus:   { fontFamily: MONO, fontSize: 7, color: C.amber + '60', marginTop: 2 },

  // Feature grid
  featHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8,
    zIndex: 2,
  },
  featHeaderBar: { width: 3, height: 12, borderRadius: 2 },
  featHeaderTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.cyan, letterSpacing: 1.5 },
  featBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  featBadgeTxt:  { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  featGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10, paddingBottom: 8, gap: 6,
    zIndex: 2,
  },
  featCell: {
    width: `${(100 / 4) - 2.2}%` as any,
    alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderTopWidth: 2.5,
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 4,
    backgroundColor: C.surf,
  },
  featIconBox: { width: 34, height: 34, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  featLabel:  { fontFamily: MONO, fontSize: 7, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3, lineHeight: 10 },

  // Action row
  actionRow: {
    flexDirection: 'row', gap: 5,
    paddingHorizontal: 10, paddingBottom: 10,
    zIndex: 2,
  },
  actionBtn:    { flex: 1, alignItems: 'center', gap: 3, borderWidth: 1.5, borderRadius: 9, paddingVertical: 8 },
  actionBtnTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
});
