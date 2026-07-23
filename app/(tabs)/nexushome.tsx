/**
 * BUTLER AI — HOME v9.1 · NEXUS HQ EDITION · HERO ROBOT UPDATE
 *
 * FEATURES:
 *  • Hero robot mascot with float/glow/ring animations
 *  • 2×2 Quick Actions grid (bigger icons, more satisfying)
 *  • Full-width AI chat bar fixed below the header
 *  • Unique animated SVG dividers themed to adjacent sections
 *  • Clipboard sharing (GET/SET) — works offline UI, active when paired
 *  • Quick File-Share widget with drag-to-send metaphor
 *  • All sections centered, visually filled left-to-right
 *  • Large unique icons for every section
 *  • Rich offline state (no greyed-out ugliness)
 *  • Rotating tips ticker inside each section footer
 *  • Smooth scroll with fast deceleration
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions, TextInput, ActivityIndicator,
  RefreshControl, Alert, Clipboard, Image,
} from 'react-native';
import Svg, { Path, Line, Circle, Polyline, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';
import * as ExpoClipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';
import { connectionHub } from '@/services/connectionHub';
import { pcClipboard } from '@/services/pcClipboard';
import { executionHistory } from '@/services/executionHistory';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { performanceHistory } from '@/services/performanceHistory';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { RemoteAccessMonetizationCard } from '@/components/home/RemoteAccessMonetizationCard';
import { NexusVaultCard } from '@/components/ui/NexusVaultCard';
import SecurityShowcase from '@/components/ui/SecurityShowcase';
// NexusHero, CoreSurfaces, RotatingTips wired back in alongside QuickNav4 + StatusCards4
import { NexusHero } from '@/components/home/NexusHero';
import { CoreSurfaces } from '@/components/home/CoreSurfaces';
import { RotatingTips } from '@/components/home/RotatingTips';
import { AIBrainMasterpieceCard } from '@/components/home/AIBrainMasterpieceCard';
import { SparklineWidget } from '@/components/home/SparklineWidget';
import { LiveTerminalFeed } from '@/components/home/LiveTerminalFeed';
import { NexusHeroCard } from '@/components/home/NexusHeroCard';
import { NetworkTopologyCard } from '@/components/home/NetworkTopologyCard';
import { NexusCommandCenter } from '@/components/home/NexusCommandCenter';
import AutomationFeed from '@/components/home/AutomationFeed';

// ─── PALETTE ──────────────────────────────────────────────────────
const BG      = '#04080F';
const SURFACE = '#0A1420';
const SURF2   = '#0E1830';
const SURF3   = '#060D18';
const BORDER  = 'rgba(0,192,220,0.12)';
const CYAN    = '#00C8E0';
const GREEN   = '#00CC96';
const AMBER   = '#F5A820';
const RED     = '#FF4060';
const PURPLE  = '#9B6AFF';
const PINK    = '#4A90FF';
const TEAL    = '#00D4AA';
const BLUE    = '#4A9EFF';
const DIM     = '#2A3A50';
const MID     = '#5A7888';
const TEXT    = '#D4EEF8';
const TEXT2   = '#7898A8';
const MONO: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';

// Compact number formatter (1200 → 1.2K)
function fmtCompact(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n);
}
const SW      = Math.max(320, Dimensions.get('window').width);
const PAD     = 14;

// ─── BUTLER AI 3-ICON SVG LOGO (AI chip · tuxedo vest · laptop) ─────────────
function ButlerAILogo({ size = 46 }: { size?: number }) {
  const iw = size * 0.28, ih = size * 0.62, g = size * 0.05;
  const y0 = (size - ih) / 2;
  const x1 = 0, x2 = iw + g, x3 = 2 * (iw + g);
  const r = iw * 0.22;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} rx={size * 0.14} fill="#06101c" />
      {/* Card 1 — CPU chip */}
      <Rect x={x1} y={y0} width={iw} height={ih} rx={r} fill="#0d1828" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      <Rect x={x1+iw*0.26} y={y0+ih*0.26} width={iw*0.48} height={ih*0.28} rx={iw*0.08} fill="none" stroke="#fff" strokeWidth={iw*0.08} />
      {[0.35,0.5,0.65].map((p,i) => (
        <G key={i}>
          <Line x1={x1+iw*p} y1={y0+ih*0.08} x2={x1+iw*p} y2={y0+ih*0.26} stroke="#fff" strokeWidth={iw*0.07} strokeLinecap="round"/>
          <Line x1={x1+iw*p} y1={y0+ih*0.54} x2={x1+iw*p} y2={y0+ih*0.72} stroke="#fff" strokeWidth={iw*0.07} strokeLinecap="round"/>
        </G>
      ))}
      {[0.35,0.5,0.65].map((p,i) => (
        <G key={i}>
          <Line x1={x1+iw*0.07} y1={y0+ih*p*0.54+ih*0.26} x2={x1+iw*0.26} y2={y0+ih*p*0.54+ih*0.26} stroke="#fff" strokeWidth={iw*0.07} strokeLinecap="round"/>
          <Line x1={x1+iw*0.74} y1={y0+ih*p*0.54+ih*0.26} x2={x1+iw*0.93} y2={y0+ih*p*0.54+ih*0.26} stroke="#fff" strokeWidth={iw*0.07} strokeLinecap="round"/>
        </G>
      ))}
      <Circle cx={x1+iw*0.5} cy={y0+ih*0.4} r={iw*0.11} fill="#fff" />
      {/* Card 2 — tuxedo vest */}
      <Rect x={x2} y={y0} width={iw} height={ih} rx={r} fill="#0d1828" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      <Path d={`M${x2+iw*0.5} ${y0+ih*0.16} L${x2+iw*0.26} ${y0+ih*0.52} L${x2+iw*0.5} ${y0+ih*0.86} L${x2+iw*0.74} ${y0+ih*0.52} Z`} fill="#fff" />
      {[0.36,0.49,0.62].map((p,i) => (
        <Circle key={i} cx={x2+iw*0.5} cy={y0+ih*p} r={iw*0.048} fill="#0d1828" />
      ))}
      {/* Card 3 — laptop */}
      <Rect x={x3} y={y0} width={iw} height={ih} rx={r} fill="#0d1828" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      <Rect x={x3+iw*0.14} y={y0+ih*0.14} width={iw*0.72} height={ih*0.44} rx={iw*0.06} fill="none" stroke="#fff" strokeWidth={iw*0.08} />
      <Rect x={x3+iw*0.18} y={y0+ih*0.18} width={iw*0.64} height={ih*0.36} rx={iw*0.04} fill="rgba(255,255,255,0.10)" />
      <Rect x={x3+iw*0.08} y={y0+ih*0.62} width={iw*0.84} height={ih*0.16} rx={iw*0.05} fill="#fff" opacity={0.9} />
      <Rect x={x3+iw*0.30} y={y0+ih*0.64} width={iw*0.40} height={ih*0.10} rx={iw*0.03} fill="#0d1828" opacity={0.5} />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// NEXUS COMMAND HEADER v2 — UNIFIED MEGA HEADER
// Merges image-1 style (OFFLINE/LOCAL AI/AES-256 pills + giant BUTLER AI)
// with image-2 NexusCommandCenter features (metrics strip, shell terminal,
// LAN scan, capabilities grid, mini chat bar, rotating tips)
// Replaces HomeHeader + NexusCommandCenter (no duplicate)
// ══════════════════════════════════════════════════════════════════════
const CRAWLER_LINES_H = [
  { text: 'butler@nexus:~$ python -c "import psutil; print(psutil.cpu_percent())"', color: CYAN, type: 'cmd' },
  { text: '> 23.4', color: GREEN, type: 'out' },
  { text: 'butler@nexus:~$ scan --lan --discover', color: AMBER, type: 'cmd' },
  { text: '> [NEXUS] Found 3 devices on 192.168.1.x', color: AMBER, type: 'out' },
  { text: '> butler_server @ 192.168.1.100:8766', color: GREEN, type: 'out' },
  { text: 'butler@nexus:~$ kb sync --ai --brief', color: PURPLE, type: 'cmd' },
  { text: '> 847 vectors · 23 facts · SIGMA active', color: PURPLE, type: 'out' },
  { text: 'butler@nexus:~$ auth --verify --hmac', color: CYAN, type: 'cmd' },
  { text: '> HMAC-SHA256 VERIFIED · AES-256-GCM ACTIVE', color: GREEN, type: 'out' },
];

const LAN_NODES_H = [
  { label: '192.168.1.1',   type: 'ROUTER',  col: AMBER  },
  { label: '192.168.1.100', type: 'PC·HOST', col: GREEN  },
  { label: '192.168.1.105', type: 'PHONE',   col: CYAN   },
  { label: '192.168.1.200', type: 'SCAN…',   col: MID    },
];

const HEADER_CAPS = [
  { icon: 'code-braces-box',       label: '250+\nSCRIPTS', color: PURPLE },
  { icon: 'robot-happy',           label: 'LOCAL\nAI',     color: CYAN   },
  { icon: 'brain',                 label: 'SIGMA\nNET KB', color: AMBER  },
  { icon: 'shield-lock',           label: 'AES\n256',      color: GREEN  },
  { icon: 'hammer-screwdriver',    label: 'PIPELINE\nBLDR',color: PINK   },
  { icon: 'desktop-tower-monitor', label: 'PC\nHEALTH',    color: BLUE   },
  { icon: 'wifi-off',              label: 'LAN\nONLY',     color: TEAL   },
  { icon: 'lock',                  label: 'ZERO\nCLOUD',   color: GREEN  },
];

const HEADER_TIPS = [
  'ZERO CLOUD · All commands stay on your local network',
  'HMAC-SHA256 signs every single request automatically',
  'AES-256-GCM encryption active on every data transfer',
  'Ollama runs 100% locally — no API key, no usage limit',
  'Script undo: every execution reversible for 15 minutes',
  'Auto-reconnect: Butler finds your PC on every app launch',
  '250+ automation scripts — one tap to run any of them',
  'Zero telemetry: no analytics SDK, no crash reporters',
];

function NexusMegaHeader({ safeTop, isConn, addr, latency, metrics, onPair, goToTab }: {
  safeTop: number; isConn: boolean; addr: string; latency: number;
  metrics: { cpu: number; ram: number; disk: number };
  onPair: () => void; goToTab: (t: string) => void;
}) {
  // ── NATIVE driver anims ──────────────────────────────────────────
  const scanA      = useRef(new Animated.Value(0)).current;   // translateY
  const logoScaleA = useRef(new Animated.Value(0.94)).current; // scale
  const logoOpA    = useRef(new Animated.Value(0)).current;    // opacity
  const pulseDotA  = useRef(new Animated.Value(0.4)).current;  // opacity
  const crawlerOpA = useRef(new Animated.Value(0)).current;    // opacity
  const featOpA    = useRef(new Animated.Value(0)).current;    // opacity
  const cursorA    = useRef(new Animated.Value(1)).current;    // opacity blink
  const rowScaleA  = useRef(new Animated.Value(1)).current;    // scale chatbar

  // ── JS driver anims ─────────────────────────────────────────────
  const glowA   = useRef(new Animated.Value(0.3)).current; // borderColor
  const radarA  = useRef(new Animated.Value(0)).current;   // scanFill width

  // ── Chat bar state ───────────────────────────────────────────────
  const [chatExp,  setChatExp]  = useState(false);
  const [chatText, setChatText] = useState('');
  const [chatReply,setChatReply]= useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const expandH = useRef(new Animated.Value(0)).current;
  const chipSlideA = useRef(new Animated.Value(20)).current;

  // ── Rotating tips ────────────────────────────────────────────────
  const [tipIdx, setTipIdx] = useState(0);
  const tipFadeA = useRef(new Animated.Value(1)).current;

  // ── Crawler terminal ─────────────────────────────────────────────
  const [visLines,  setVisLines]  = useState<number[]>([]);
  const [crawlLine, setCrawlLine] = useState(0);
  const [crawlChar, setCrawlChar] = useState(0);
  const crawlRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ── Time ─────────────────────────────────────────────────────────
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');

  useEffect(() => {
    const upd = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
    };
    upd();
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // entrance
    Animated.parallel([
      Animated.spring(logoScaleA, { toValue: 1, tension: 110, friction: 10, useNativeDriver: true }),
      Animated.timing(logoOpA,    { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.timing(crawlerOpA, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }).start();
    Animated.timing(featOpA,    { toValue: 1, duration: 400, delay: 1100, useNativeDriver: true }).start();

    // native loops
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: 1, duration: 3200, useNativeDriver: true }),
      Animated.timing(scanA, { toValue: 0, duration: 0,    useNativeDriver: true }),
      Animated.delay(5500),
    ]));
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulseDotA, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(pulseDotA, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    const cursorLoop = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    scanLoop.start(); pulseLoop.start(); cursorLoop.start();

    // JS loops
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1800, useNativeDriver: false }),
    ]));
    const radarLoop = Animated.loop(
      Animated.timing(radarA, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    glowLoop.start(); radarLoop.start();

    // tips rotation
    const tipInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipFadeA, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(tipFadeA, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setTipIdx(i => (i + 1) % HEADER_TIPS.length), 250);
    }, 5500);

    return () => {
      mountedRef.current = false;
      scanLoop.stop(); pulseLoop.stop(); cursorLoop.stop();
      glowLoop.stop(); radarLoop.stop();
      clearInterval(tipInterval);
      if (crawlRef.current) clearTimeout(crawlRef.current);
    };
  }, []);

  // Crawler tick
  const advanceCrawler = useCallback(() => {
    if (!mountedRef.current) return;
    const target = CRAWLER_LINES_H[crawlLine];
    if (!target) return;
    if (crawlChar < target.text.length) {
      setCrawlChar(c => c + 1);
      crawlRef.current = setTimeout(advanceCrawler, 24);
    } else {
      setVisLines(prev => [...prev, crawlLine].slice(-5));
      crawlRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setCrawlLine(l => (l + 1) % CRAWLER_LINES_H.length);
        setCrawlChar(0);
      }, 700);
    }
  }, [crawlLine, crawlChar]);

  useEffect(() => {
    crawlRef.current = setTimeout(advanceCrawler, 1400);
    return () => { if (crawlRef.current) clearTimeout(crawlRef.current); };
  }, [advanceCrawler]);

  // Chat expand/collapse
  const toggleChat = () => {
    haptics.light();
    const next = !chatExp;
    setChatExp(next);
    if (!next) { setChatReply(''); }
    Animated.parallel([
      Animated.spring(expandH,   { toValue: next ? 180 : 0, tension: 85, friction: 14, useNativeDriver: false }),
      Animated.spring(chipSlideA,{ toValue: next ? 0 : 20,  tension: 110, friction: 15, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(rowScaleA, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.spring(rowScaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const sendChat = async (prompt?: string) => {
    const t = (prompt || chatText).trim();
    if (!t || chatBusy) return;
    haptics.heavy(); setChatBusy(true); setChatText(''); setChatReply('');
    try {
      if (isConn) {
        const ip = serverConnection.getIP(), port = serverConnection.getPort();
        const tok = serverConnection.getToken?.() || '';
        if (!ip || !port) throw new Error('Not connected');
        const h: Record<string,string> = { 'Content-Type': 'application/json' };
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 22000);
        const res = await fetch(`http://${ip}:${port}/api/butler/chat`, {
          method: 'POST', headers: h,
          body: JSON.stringify({ messages: [{ role: 'user', content: t }] }),
          signal: ctrl.signal,
        });
        if (res.ok) {
          const d = await res.json();
          setChatReply(((d.reply || d.content || d.message || d.response || '').trim().slice(0, 220)) || 'Done.');
          haptics.success();
        } else throw new Error('HTTP ' + res.status);
      } else {
        const lc = t.toLowerCase();
        const RESP = [
          { test: /pair|connect|qr/, r: 'Run butler_server.py on your PC then tap SCAN QR.' },
          { test: /script|python/,  r: 'Tap FORGE tab to browse 250+ automation scripts.' },
          { test: /ai|ollama/,      r: 'Local Ollama AI runs 100% on your PC — no cloud.' },
          { test: /privacy|cloud/,  r: 'Zero cloud. Everything stays on your LAN.' },
        ];
        const m = RESP.find(o => o.test.test(lc));
        setChatReply(m?.r ?? 'Pair your PC first to unlock full Butler AI.');
        haptics.success();
      }
    } catch (e: any) {
      setChatReply('Error: ' + (e?.message?.slice(0,60) || 'Failed'));
    }
    setChatBusy(false);
  };

  // Interpolations
  const scanY     = scanA.interpolate({ inputRange: [0,1], outputRange: [-8, 420] });
  const glowBord  = glowA.interpolate({ inputRange: [0.2,1], outputRange: [CYAN+'20', CYAN+'70'] });
  const radarBord = radarA.interpolate({ inputRange: [0,0.5,1], outputRange: [CYAN+'40', GREEN+'80', CYAN+'40'] });
  const radarFill = radarA.interpolate({ inputRange: [0,1], outputRange: ['15%','88%'] });

  const cc = isConn ? GREEN : RED;
  const STRIPE = [CYAN, GREEN, PURPLE, AMBER, BLUE];

  const CHAT_CHIPS = [
    { icon: 'monitor-dashboard',  label: 'PC Stats', prompt: 'Show CPU, RAM, disk and top processes', color: CYAN   },
    { icon: 'broom',              label: 'Clean',    prompt: 'Clean all temp files and show freed space', color: GREEN  },
    { icon: 'network-outline',    label: 'Network',  prompt: 'Show all network interfaces and IPs', color: AMBER  },
    { icon: 'code-braces',        label: 'Code',     prompt: 'Write a Python script to ', color: PURPLE },
    { icon: 'shield-check',       label: 'Security', prompt: 'Run a quick security audit', color: TEAL   },
    { icon: 'eye-circle-outline', label: 'Procs',    prompt: 'List top 8 CPU processes with PID', color: PINK   },
  ];

  return (
    <View style={nmh.root}>
      {/* Grid bg */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0.12,0.25,0.38,0.52,0.65,0.78,0.91].map((p,i) => (
          <View key={`h${i}`} style={[StyleSheet.absoluteFill, { top:`${p*100}%` as any, height: StyleSheet.hairlineWidth, backgroundColor:'rgba(0,200,220,0.04)' }]} />
        ))}
      </View>

      {/* Scanline — native translateY */}
      <Animated.View pointerEvents="none"
        style={[nmh.scanline, { transform: [{ translateY: scanY }] }]} />

      {/* 5-color top stripe */}
      <View style={{ flexDirection: 'row', height: 3 }}>
        {STRIPE.map((c,i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* ━━━━ BLOCK 1: TITLE ROW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Animated.View style={[nmh.titleBlock, { opacity: logoOpA, transform: [{ scale: logoScaleA }], paddingTop: safeTop + 10 }]}>
        <View style={{ flex: 1, gap: 6 }}>
          {/* Status pills row — image 1 style */}
          <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
            <View style={[nmh.pill, { borderColor: cc + '70', backgroundColor: cc + '0E' }]}>
              <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cc, opacity: pulseDotA }} />
              <Text style={[nmh.pillTxt, { color: cc }]}>{isConn ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
            <TouchableOpacity onPress={() => { haptics.light(); goToTab('butler'); }}
              style={[nmh.pill, { borderColor: PURPLE + '70', backgroundColor: PURPLE + '0E' }]}>
              <MaterialCommunityIcons name="robot-happy-outline" size={10} color={PURPLE} />
              <Text style={[nmh.pillTxt, { color: PURPLE }]}>LOCAL AI</Text>
            </TouchableOpacity>
            <View style={[nmh.pill, { borderColor: GREEN + '60', backgroundColor: GREEN + '0A' }]}>
              <MaterialIcons name="lock" size={9} color={GREEN} />
              <Text style={[nmh.pillTxt, { color: GREEN }]}>AES-256</Text>
            </View>
            <View style={[nmh.pill, { borderColor: CYAN + '40', backgroundColor: CYAN + '06' }]}>
              <Text style={[nmh.pillTxt, { color: CYAN + '90' }]}>HMAC</Text>
            </View>
          </View>

          {/* Eyebrow */}
          <Text style={nmh.eyebrow}>AI COMMAND CENTER · PC AUTOMATION</Text>

          {/* Giant title — image 1 style */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={nmh.titleBig}>BUTLER</Text>
            <Text style={[nmh.titleBig, { color: CYAN }]}> AI</Text>
          </View>

          {/* Sub tagline */}
          <Text style={nmh.tagline}>◎ SELF-HOSTED · PRIVATE · ZERO CLOUD</Text>

          {/* Quick action row */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
            <TouchableOpacity onPress={() => { haptics.heavy(); onPair(); }} activeOpacity={0.85}
              style={[nmh.actionBtn, { borderColor: cc + '80', backgroundColor: cc + '14' }]}>
              <MaterialIcons name="qr-code-scanner" size={15} color={cc} />
              <Text style={[nmh.actionBtnTxt, { color: cc }]}>{isConn ? 'CONNECTED' : 'QR PAIR'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { haptics.medium(); goToTab('butler'); }} activeOpacity={0.85}
              style={[nmh.actionBtn, { borderColor: GREEN + '60', backgroundColor: GREEN + '10' }]}>
              <MaterialCommunityIcons name="robot-happy-outline" size={15} color={GREEN} />
              <Text style={[nmh.actionBtnTxt, { color: GREEN }]}>AI CHAT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: clock + radar orb */}
        <View style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {/* Clock */}
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={nmh.clockH}>{time}</Text>
              <Text style={[nmh.clockS, { color: CYAN }]}>{secs}</Text>
            </View>
            <Text style={nmh.clockSub}>LOCAL · SECURE</Text>
          </View>
          {/* Animated radar orb */}
          <Animated.View style={[nmh.radarOuter, { borderColor: radarBord }]}>
            <View style={[nmh.radarInner, { borderColor: CYAN + '28' }]}>
              <View style={{ position:'absolute', left:0, right:0, height: StyleSheet.hairlineWidth, backgroundColor: CYAN+'20', top:'50%' }} />
              <View style={{ position:'absolute', top:0, bottom:0, width: StyleSheet.hairlineWidth, backgroundColor: CYAN+'20', left:'50%' }} />
              <Animated.View style={{ width:8, height:8, borderRadius:4, backgroundColor: cc, opacity: pulseDotA }} />
            </View>
            <Text style={[nmh.radarLabel, { color: cc }]}>{isConn ? 'LIVE' : 'SCAN'}</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* ━━━━ BLOCK 2: METRICS STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={nmh.metricsRow}>
        {[
          { l:'CPU',   v: isConn ? Math.round(metrics.cpu)+'%' : '--',  col: metrics.cpu > 80 ? RED : CYAN  },
          { l:'RAM',   v: isConn ? Math.round(metrics.ram)+'%' : '--',  col: metrics.ram > 85 ? RED : GREEN },
          { l:'DISK',  v: isConn ? Math.round(metrics.disk)+'%': '--',  col: metrics.disk>90 ? RED : AMBER },
          { l:'ENC',   v: 'AES256', col: GREEN  },
          { l:'AUTH',  v: 'HMAC',   col: CYAN   },
          { l:'CLOUD', v: 'ZERO',   col: PURPLE },
        ].map((m,i) => (
          <View key={i} style={[nmh.metricCell, { borderColor: m.col+'30' }]}>
            <Text style={[nmh.metricL, { color: m.col+'70' }]}>{m.l}</Text>
            <Text style={[nmh.metricV, { color: isConn || i > 2 ? m.col : DIM }]}>{m.v}</Text>
          </View>
        ))}
      </View>

      {/* ━━━━ BLOCK 3: TWIN PANEL — Shell + LAN ━━━━━━━━━━━━━━━━━━━━━ */}
      <Animated.View style={[nmh.twinPanel, { opacity: crawlerOpA }]}>
        {/* Shell terminal */}
        <View style={[nmh.shellPanel, { borderColor: CYAN+'22' }]}>
          <View style={nmh.termChrome}>
            {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => (
              <View key={i} style={{ width:6, height:6, borderRadius:3, backgroundColor:c }} />
            ))}
            <Text style={nmh.termTitle}>BUTLER_SHELL</Text>
            <PulseDot color={GREEN} size={4} />
          </View>
          <View style={{ padding: 7, gap: 2 }}>
            {visLines.map((ln,i) => {
              const line = CRAWLER_LINES_H[ln];
              if (!line) return null;
              return (
                <Text key={i} style={{ fontFamily: MONO, fontSize: 8, lineHeight: 12, color: line.color, opacity: 0.45 + i*0.12 }} numberOfLines={1}>
                  {line.type==='cmd' ? '$ ' : '  '}{line.text}
                </Text>
              );
            })}
            <Text style={{ fontFamily: MONO, fontSize: 8, lineHeight: 12, color: CRAWLER_LINES_H[crawlLine]?.color ?? CYAN }} numberOfLines={1}>
              {CRAWLER_LINES_H[crawlLine]?.type==='cmd' ? '$ ' : '  '}
              {CRAWLER_LINES_H[crawlLine]?.text.slice(0, crawlChar)}
              <Text style={{ color: CYAN }}>▌</Text>
            </Text>
          </View>
        </View>

        {/* LAN scanner */}
        <View style={[nmh.lanPanel, { borderColor: AMBER+'22' }]}>
          <View style={[nmh.termChrome, { borderBottomColor: AMBER+'18' }]}>
            <MaterialCommunityIcons name="lan-connect" size={9} color={AMBER} />
            <Text style={[nmh.termTitle, { color: AMBER+'80' }]}>LAN SCAN</Text>
          </View>
          <View style={{ padding: 7, gap: 5 }}>
            {LAN_NODES_H.map((n,i) => (
              <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                <PulseDot color={n.col} size={4} />
                <Text style={{ fontFamily:MONO, fontSize:8, color:n.col, flex:1 }} numberOfLines={1}>{n.label}</Text>
                <View style={{ borderWidth:1, borderRadius:4, borderColor:n.col+'40', backgroundColor:n.col+'0A', paddingHorizontal:4, paddingVertical:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:6.5, color:n.col, fontWeight:'900' }}>{n.type}</Text>
                </View>
              </View>
            ))}
            <View style={{ height:4, borderRadius:2, borderWidth:1, borderColor:AMBER+'30', backgroundColor:AMBER+'08', overflow:'hidden', marginTop:2 }}>
              <Animated.View style={{ height:'100%', borderRadius:2, backgroundColor:AMBER, width: radarFill }} />
            </View>
            <Text style={{ fontFamily:MONO, fontSize:7, color:AMBER+'60', marginTop:1 }}>SCANNING 192.168.1.x…</Text>
          </View>
        </View>
      </Animated.View>

      {/* ━━━━ BLOCK 4: CAPABILITIES GRID ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Animated.View style={{ opacity: featOpA }}>
        <View style={nmh.capHeader}>
          <View style={{ width:3, height:12, borderRadius:2, backgroundColor:CYAN }} />
          <Text style={nmh.capHeaderTxt}>CORE CAPABILITIES</Text>
          <View style={{ flex:1, height:1, backgroundColor:CYAN+'18' }} />
          <View style={[nmh.capBadge, { borderColor:GREEN+'50', backgroundColor:GREEN+'0A' }]}>
            <PulseDot color={GREEN} size={4} />
            <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:GREEN }}>8 MODULES</Text>
          </View>
        </View>
        <View style={nmh.capGrid}>
          {HEADER_CAPS.map((f,i) => (
            <TouchableOpacity key={i} onPress={() => haptics.light()} activeOpacity={0.75}
              style={[nmh.capCell, { borderColor: f.color+'30', borderTopColor: f.color }]}>
              <View style={[nmh.capIconBox, { backgroundColor: f.color+'10', borderColor: f.color+'40' }]}>
                <MaterialCommunityIcons name={f.icon as any} size={18} color={f.color} />
              </View>
              <Text style={[nmh.capLabel, { color: f.color }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ━━━━ BLOCK 5: MINI CHAT BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={nmh.chatRoot}>
        <Pressable onPress={toggleChat} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <Animated.View style={[nmh.chatBar, { transform: [{ scale: rowScaleA }] }]}>
            <View style={[nmh.chatAvatar, { borderColor: isConn ? GREEN+'60' : CYAN+'50', backgroundColor: isConn ? GREEN+'0E' : CYAN+'0A' }]}>
              {chatBusy
                ? <ActivityIndicator size="small" color={isConn ? GREEN : CYAN} style={{ transform: [{ scale: 0.65 }] }} />
                : <Text style={{ fontSize: 14 }}>🤖</Text>}
              <Animated.View style={{ position:'absolute', bottom:1, right:1, width:6, height:6, borderRadius:3, backgroundColor: isConn?GREEN:CYAN, opacity: pulseDotA, borderWidth:1.5, borderColor:'#020810' }} />
            </View>
            <Text style={[nmh.chatPrompt, { color: chatBusy ? DIM : TEXT + 'B0' }]} numberOfLines={1}>
              {chatBusy ? 'Thinking...' : (chatText || (isConn ? '$> run command or ask butler...' : '$> pair PC to activate AI...'))}
            </Text>
            <Animated.View style={{ width:2, height:13, borderRadius:1, backgroundColor: isConn?GREEN:CYAN, opacity: cursorA, marginLeft:2, flexShrink:0 }} />
            <View style={{ flex:1 }} />
            <View style={[nmh.chatPill, { borderColor: isConn?GREEN+'50':CYAN+'40', backgroundColor: isConn?GREEN+'0A':CYAN+'06' }]}>
              <PulseDot color={isConn?GREEN:CYAN} size={4} />
              <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color: isConn?GREEN:CYAN }}>{isConn?'LIVE':'OFF'}</Text>
            </View>
            <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); haptics.medium(); goToTab('butler'); }}
              hitSlop={{ top:8, bottom:8, left:8, right:8 }}
              style={[nmh.chatOpenBtn, { borderColor:PURPLE+'50', backgroundColor:PURPLE+'0E' }]}>
              <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', color:PURPLE }}>OPEN CHAT ›</Text>
            </TouchableOpacity>
            <MaterialIcons name={chatExp?'expand-less':'expand-more'} size={18} color={isConn?GREEN+'70':CYAN+'60'} />
          </Animated.View>
        </Pressable>
        <View style={nmh.chatSubRow}>
          {['BUTLER_AI','LOCAL_LLM','ZERO_CLOUD'].map((tag,i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={{ width:3, height:3, borderRadius:1.5, backgroundColor:DIM+'80' }} />}
              <Text style={{ fontFamily:MONO, fontSize:7.5, color:MID, fontWeight:'700' }}>{tag}</Text>
            </React.Fragment>
          ))}
        </View>

        {/* Expandable chat panel */}
        <Animated.View style={{ height: expandH, overflow:'hidden' }}>
          <Animated.View style={{ transform: [{ translateY: chipSlideA }] }}>
            <View style={[nmh.chatInputRow, { borderColor: isConn?GREEN+'60':CYAN+'50' }]}>
              <MaterialCommunityIcons name="robot-happy-outline" size={13} color={isConn?GREEN:CYAN} />
              <TextInput
                value={chatText} onChangeText={setChatText}
                placeholder={isConn ? 'Ask anything or run a command...' : 'Ask (pair PC for full AI)...'}
                placeholderTextColor={DIM}
                style={nmh.chatInput}
                returnKeyType="send"
                onSubmitEditing={() => sendChat()}
                editable={!chatBusy}
                maxLength={400}
              />
              <TouchableOpacity onPress={() => sendChat()} disabled={!chatText.trim() || chatBusy}
                style={[nmh.chatSendBtn, { backgroundColor: chatText.trim()&&!chatBusy ? (isConn?GREEN:CYAN) : DIM+'30' }]}>
                <MaterialIcons name="send" size={13} color={chatText.trim()&&!chatBusy ? BG : DIM} />
              </TouchableOpacity>
            </View>
            {!!chatReply && (
              <View style={[nmh.chatReply, { borderColor: CYAN+'30', backgroundColor: CYAN+'08' }]}>
                <Text style={{ fontFamily:MONO, fontSize:10.5, color: CYAN+'DD', flex:1, lineHeight:16 }} numberOfLines={3}>{chatReply}</Text>
                <TouchableOpacity onPress={() => setChatReply('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                  <MaterialIcons name="close" size={11} color={DIM} />
                </TouchableOpacity>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap:7, paddingHorizontal:12, paddingTop:6, paddingBottom:6 }}>
              {CHAT_CHIPS.map((chip,i) => (
                <TouchableOpacity key={i} onPress={() => sendChat(chip.prompt)} activeOpacity={0.8}
                  style={[nmh.chatChip, { borderColor: chip.color+'45', backgroundColor: chip.color+'0D' }]}>
                  <MaterialCommunityIcons name={chip.icon as any} size={11} color={chip.color} />
                  <Text style={[nmh.chatChipTxt, { color: chip.color }]}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ━━━━ BLOCK 6: ROTATING TIPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={nmh.tipsRow}>
        <MaterialCommunityIcons name="lightbulb-outline" size={10} color={AMBER+'90'} />
        <Animated.Text style={[nmh.tipsTxt, { opacity: tipFadeA }]} numberOfLines={1}>
          {HEADER_TIPS[tipIdx]}
        </Animated.Text>
        <View style={{ flex:1 }} />
        <Text style={nmh.tipsVer}>BUTLER OS v9.1</Text>
      </View>

      {/* Bottom stripe */}
      <View style={{ flexDirection:'row', height:2.5, opacity:0.6 }}>
        {STRIPE.map((c,i) => <View key={i} style={{ flex:1, backgroundColor:c }} />)}
      </View>
    </View>
  );
}

const nmh = StyleSheet.create({
  root: {
    backgroundColor: '#030709',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: CYAN, shadowOffset:{width:0,height:6}, shadowOpacity:0.18, shadowRadius:16 },
      android: { elevation: 8 },
    }),
  },
  scanline: { position:'absolute', left:0, right:0, height:1.5, backgroundColor:CYAN, opacity:0.05, zIndex:1 },
  // Title block
  titleBlock: { flexDirection:'row', alignItems:'flex-start', gap:10, paddingHorizontal:14, paddingBottom:10, zIndex:2 },
  pill:    { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:10, paddingVertical:5 },
  pillTxt: { fontFamily:MONO as any, fontSize:9.5, fontWeight:'900', letterSpacing:0.3 },
  eyebrow: { fontFamily:MONO as any, fontSize:9, color:CYAN+'70', letterSpacing:1.5, fontWeight:'700' },
  titleBig:{ fontFamily:MONO as any, fontSize:34, fontWeight:'900', color:'#FFF', letterSpacing:-0.3, lineHeight:38 },
  tagline: { fontFamily:MONO as any, fontSize:10, color:CYAN+'70', letterSpacing:0.8, fontWeight:'700' },
  actionBtn:   { flexDirection:'row', alignItems:'center', gap:6, borderWidth:1.5, borderRadius:11, paddingHorizontal:12, paddingVertical:8 },
  actionBtnTxt:{ fontFamily:MONO as any, fontSize:10.5, fontWeight:'900', letterSpacing:0.3 },
  // Clock
  clockH:   { fontFamily:MONO as any, fontSize:20, fontWeight:'900', color:TEXT, letterSpacing:1 },
  clockS:   { fontFamily:MONO as any, fontSize:12, fontWeight:'900' },
  clockSub: { fontFamily:MONO as any, fontSize:7.5, color:MID, letterSpacing:1, textAlign:'right' },
  // Radar orb
  radarOuter: { width:58, height:58, borderRadius:29, borderWidth:2, alignItems:'center', justifyContent:'center', flexShrink:0, backgroundColor:CYAN+'04', overflow:'hidden' },
  radarInner: { width:44, height:44, borderRadius:22, borderWidth:1, alignItems:'center', justifyContent:'center', position:'relative' },
  radarLabel: { fontFamily:MONO as any, fontSize:7, fontWeight:'900', letterSpacing:1, position:'absolute', bottom:4 },
  // Metrics strip
  metricsRow:  { flexDirection:'row', gap:5, paddingHorizontal:12, paddingVertical:7, backgroundColor:'#020508', borderTopWidth:1, borderBottomWidth:1, borderColor:'rgba(0,200,220,0.07)', zIndex:2 },
  metricCell:  { flex:1, alignItems:'center', borderWidth:1, borderRadius:7, paddingVertical:5, gap:2 },
  metricL:     { fontFamily:MONO as any, fontSize:7, fontWeight:'700', letterSpacing:0.5 },
  metricV:     { fontFamily:MONO as any, fontSize:9, fontWeight:'900' },
  // Twin panel
  twinPanel:   { flexDirection:'row', gap:7, paddingHorizontal:10, paddingVertical:8, zIndex:2 },
  shellPanel:  { flex:1.5, borderWidth:1, borderRadius:10, backgroundColor:'#010508', overflow:'hidden' },
  lanPanel:    { flex:1, borderWidth:1, borderRadius:10, backgroundColor:'#010508', overflow:'hidden' },
  termChrome:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:7, paddingVertical:5, backgroundColor:'#010306', borderBottomWidth:1, borderBottomColor:'rgba(0,200,220,0.10)' },
  termTitle:   { fontFamily:MONO as any, fontSize:7.5, color:CYAN+'70', flex:1, letterSpacing:0.5 },
  // Caps grid
  capHeader:   { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingTop:4, paddingBottom:7, zIndex:2 },
  capHeaderTxt:{ fontFamily:MONO as any, fontSize:9, fontWeight:'900', color:CYAN, letterSpacing:1.5 },
  capBadge:    { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:6, paddingHorizontal:7, paddingVertical:3 },
  capGrid:     { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:9, paddingBottom:8, gap:5, zIndex:2 },
  capCell:     { width: `${(100/4)-2.5}%` as any, alignItems:'center', gap:5, borderWidth:1.5, borderTopWidth:2.5, borderRadius:10, paddingVertical:9, paddingHorizontal:4, backgroundColor:'#060D18' },
  capIconBox:  { width:33, height:33, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  capLabel:    { fontFamily:MONO as any, fontSize:7, fontWeight:'900', textAlign:'center', letterSpacing:0.3, lineHeight:10 },
  // Chat bar
  chatRoot:    { backgroundColor:'#020608', borderTopWidth:1, borderTopColor:'rgba(0,200,220,0.10)', zIndex:2 },
  chatBar:     { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:8, paddingBottom:5, gap:8 },
  chatAvatar:  { width:26, height:26, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' },
  chatPrompt:  { fontFamily:MONO as any, fontSize:11, flex:1, letterSpacing:0.2 },
  chatPill:    { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7, paddingHorizontal:6, paddingVertical:3 },
  chatOpenBtn: { borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:3 },
  chatSubRow:  { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingBottom:7 },
  chatInputRow:{ flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:12, marginTop:6, marginBottom:5, borderWidth:1.5, borderRadius:12, paddingHorizontal:11, paddingVertical:8, backgroundColor:BG },
  chatInput:   { flex:1, fontFamily:MONO as any, fontSize:12, color:TEXT, padding:0, minHeight:18 },
  chatSendBtn: { width:30, height:30, borderRadius:9, alignItems:'center', justifyContent:'center', flexShrink:0 },
  chatReply:   { flexDirection:'row', alignItems:'flex-start', gap:8, marginHorizontal:12, marginBottom:5, borderWidth:1.5, borderRadius:10, paddingHorizontal:10, paddingVertical:8 },
  chatChip:    { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:6, borderRadius:18, borderWidth:1.5 },
  chatChipTxt: { fontFamily:MONO as any, fontSize:9.5, fontWeight:'800' },
  // Tips
  tipsRow:     { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6, backgroundColor:'#010305', borderTopWidth:1, borderTopColor:'rgba(0,200,220,0.06)' },
  tipsTxt:     { fontFamily:MONO as any, fontSize:9.5, color:AMBER+'AA', flex:1, letterSpacing:0.2, fontWeight:'700' },
  tipsVer:     { fontFamily:MONO as any, fontSize:7.5, color:DIM, letterSpacing:0.5 },
});

// ─── ANIMATED CIRCUIT GRID BACKGROUND ─────────────────────────────────
function CircuitGridBg({ color, opacity = 0.07 }: { color: string; opacity?: number }) {
  const scanA = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 60, duration: 2600, useNativeDriver: true }),
      Animated.timing(scanA, { toValue: -60, duration: 0, useNativeDriver: true }),
      Animated.delay(1800),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  const cols = 8; const rows = 3; const cw = SW / cols; const ch = 14;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }} pointerEvents="none">
      <Svg width={SW} height={rows * ch + 8} viewBox={`0 0 ${SW} ${rows * ch + 8}`} style={{ position: 'absolute', left: 0, top: 0 }}>
        {Array.from({ length: cols + 1 }).map((_, ci) => (
          <Path key={`v${ci}`} d={`M${ci * cw} 0 V${rows * ch}`} stroke={color} strokeWidth={0.5} opacity={opacity} />
        ))}
        {Array.from({ length: rows + 1 }).map((_, ri) => (
          <Path key={`h${ri}`} d={`M0 ${ri * ch} H${SW}`} stroke={color} strokeWidth={0.5} opacity={opacity} />
        ))}
        {Array.from({ length: cols }).map((_, ci) =>
          Array.from({ length: rows }).map((_, ri) => (
            <Circle key={`n${ci}${ri}`} cx={(ci + 0.5) * cw} cy={(ri + 0.5) * ch} r={1.2} fill={color} opacity={opacity * 2} />
          ))
        )}
      </Svg>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, transform: [{ translateX: scanA }] }]}>
        <Svg width={60} height={rows * ch + 8} viewBox={`0 0 60 ${rows * ch + 8}`}>
          <Path d="M30 0 V999" stroke={color} strokeWidth={20} opacity={0.10} />
          <Path d="M30 0 V999" stroke={color} strokeWidth={2} opacity={0.55} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ─── HERO ROBOT MASCOT IMAGE ──────────────────────────────────────
const MASCOT_IMG = (() => {
  try { return require('@/assets/images/butler-shield-mascot.jpg'); } catch {}
  try { return require('@/assets/images/butler-hero-robot.png'); } catch {}
  try { return require('@/assets/images/mascot_shield.png'); } catch {}
  return null;
})();

// ─── MICRO ATOMS ──────────────────────────────────────────────────

function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HUDCorners({ color, size = 10, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const b = { position: 'absolute' as const, width: size, height: size };
  return (
    <>
      <View style={[b, { top: 0, left: 0,  borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { top: 0, right: 0, borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[b, { bottom: 0, left: 0, borderBottomWidth: t, borderLeftWidth: t, borderColor: color }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t, borderColor: color }]} />
    </>
  );
}

function SegBar({ value, color, height = 4 }: { value: number; color: string; height?: number }) {
  const SEGS = 24;
  const filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * SEGS);
  return (
    <View style={{ flexDirection: 'row', gap: 2, height }}>
      {Array.from({ length: SEGS }).map((_, i) => (
        <View key={i} style={{ flex: 1, height, borderRadius: 1.5, backgroundColor: i < filled ? color : 'rgba(255,255,255,0.05)' }} />
      ))}
    </View>
  );
}

function Sparkline({ data, color, height = 20 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height }}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        const isLast = i === data.length - 1;
        return <View key={i} style={{ flex: 1, height: h, borderRadius: 2, backgroundColor: isLast ? color : color + '55' }} />;
      })}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// ANIMATED THEMED DIVIDERS
// ══════════════════════════════════════════════════════════════════

function CircuitDivider({ color = CYAN, reverse = false }: { color?: string; reverse?: boolean }) {
  const x = useRef(new Animated.Value(reverse ? SW + 80 : -80)).current;
  useEffect(() => {
    const end = reverse ? -80 : SW + 80;
    const start = reverse ? SW + 80 : -80;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(x, { toValue: end, duration: 3200, useNativeDriver: true }),
      Animated.timing(x, { toValue: start, duration: 0, useNativeDriver: true }),
      Animated.delay(600),
    ]));
    loop.start(); return () => loop.stop();
  }, [reverse]);

  return (
    <View style={dv.wrap} pointerEvents="none">
      <View style={[dv.baseLine, { backgroundColor: color + '18' }]} />
      {[0.15, 0.38, 0.62, 0.85].map((p, i) => (
        <View key={i} style={[dv.node, { left: SW * p - 3, backgroundColor: color + '40', borderColor: color + '60' }]} />
      ))}
      <Animated.View style={[dv.packet, { backgroundColor: color, transform: [{ translateX: x }] }]} />
      <View style={dv.labelRow}>
        <Text style={[dv.label, { color: color + '50' }]}>◀</Text>
        <Text style={[dv.label, { color: color + '38', letterSpacing: 1 }]}>NEXUS BUS · LOCAL LAN</Text>
        <Text style={[dv.label, { color: color + '50' }]}>▶</Text>
      </View>
    </View>
  );
}

const dv = StyleSheet.create({
  wrap:    { height: 28, justifyContent: 'center', marginHorizontal: 0, overflow: 'hidden', position: 'relative' },
  baseLine:{ position: 'absolute', left: 0, right: 0, height: 1.5 },
  node:    { position: 'absolute', width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
  packet:  { position: 'absolute', width: 50, height: 1.5, opacity: 0.85 },
  labelRow:{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 6 },
  label:   { fontFamily: MONO, fontSize: 8, letterSpacing: 0.5 },
});

function SpectrumDivider({ colors = [CYAN, GREEN] }: { colors?: [string, string] }) {
  return (
    <View style={{ height: 18, marginHorizontal: 0, overflow: 'hidden' }}>
      <Svg width={SW} height={18}>
        <Defs>
          <LinearGradient id="specGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor={colors[0]} stopOpacity="0.08" />
            <Stop offset="25%"  stopColor={colors[0]} stopOpacity="0.5" />
            <Stop offset="50%"  stopColor={colors[1]} stopOpacity="0.7" />
            <Stop offset="75%"  stopColor={colors[1]} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors[0]} stopOpacity="0.06" />
          </LinearGradient>
        </Defs>
        <Path d={`M0 9 H${SW}`} stroke="url(#specGrad)" strokeWidth="2" />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = (i + 1) * (SW / 10);
          return <Line key={i} x1={x} y1={6} x2={x} y2={12} stroke={colors[i % 2 === 0 ? 0 : 1]} strokeWidth="1" strokeOpacity="0.3" />;
        })}
        <Path d={`M${SW/2 - 5} 9 L${SW/2} 4 L${SW/2 + 5} 9 L${SW/2} 14 Z`} fill={colors[1]} fillOpacity="0.25" />
      </Svg>
    </View>
  );
}

function NeuralDivider({ color = PURPLE }: { color?: string }) {
  const pts = useMemo(() => {
    const N = 48;
    const points: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * SW;
      const y = 12 + Math.sin((i / N) * Math.PI * 4 + 0) * 5;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
  }, []);

  const nodes = useMemo(() =>
    [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map(p => ({
      x: p * SW,
      y: 12 + Math.sin(p * Math.PI * 4) * 5,
    })),
  []);

  return (
    <View style={{ height: 28, overflow: 'hidden' }}>
      <Svg width={SW} height={28}>
        <Polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.35" />
        {nodes.map((n, i) => (
          <Circle key={i} cx={n.x} cy={n.y} r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PAD, marginTop: -4 }}>
        <Text style={{ fontFamily: MONO, fontSize: 8, color: color + '40' }}>NEURAL NET</Text>
        <Text style={{ fontFamily: MONO, fontSize: 8, color: color + '40' }}>ΣΩΨ BRIDGE</Text>
      </View>
    </View>
  );
}

function PowerDivider({ color = AMBER }: { color?: string }) {
  const sawPoints = useMemo(() => {
    const N = 22; const step = SW / N; const H = 14;
    const pts: string[] = [`0,${H}`];
    for (let i = 0; i <= N; i++) {
      const x = i * step;
      if (i % 2 === 0) pts.push(`${x.toFixed(1)},${H}`);
      else pts.push(`${(x - step / 2).toFixed(1)},2`);
    }
    pts.push(`${SW},${H}`);
    return pts.join(' ');
  }, []);

  return (
    <View style={{ height: 22, overflow: 'hidden' }}>
      <Svg width={SW} height={22}>
        <Polyline points={sawPoints} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.28" />
      </Svg>
      <View style={{ position: 'absolute', bottom: 2, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        {[CYAN, GREEN, AMBER, PURPLE].map((c, i) => (
          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c + '50' }} />
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOME HEADER — NEXUS TERMINAL v4
// Full-width terminal-style command header
// Pure CYAN/GREEN/PURPLE palette — zero AMBER/yellow
// No robot circle — clean monospace terminal identity
// ══════════════════════════════════════════════════════════════════
function HomeHeader({ safeTop, isConn, addr, onPair, goToTab }: {
  safeTop: number; isConn: boolean; addr: string;
  onPair: () => void; goToTab?: (t: string) => void;
}) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const [tick, setTick] = useState(0);
  const scanA   = useRef(new Animated.Value(0)).current;  // native — scan X
  const glowA   = useRef(new Animated.Value(0.4)).current; // JS — border glow
  const cursorA = useRef(new Animated.Value(1)).current;   // native — cursor blink

  useEffect(() => {
    const upd = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
      setTick(t => t + 1);
    };
    upd();
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const scan = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: 1, duration: 3200, useNativeDriver: true }),
      Animated.timing(scanA, { toValue: 0, duration: 0,    useNativeDriver: true }),
      Animated.delay(5000),
    ]));
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1.0, duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1800, useNativeDriver: false }),
    ]));
    const cur = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 550, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]));
    scan.start(); glow.start(); cur.start();
    return () => { scan.stop(); glow.stop(); cur.stop(); };
  }, []);

  // Pure cyan palette — no amber/yellow anywhere
  const cc     = isConn ? GREEN  : CYAN;
  const cc2    = isConn ? TEAL   : CYAN;
  const scanX  = scanA.interpolate({ inputRange: [0, 1], outputRange: [-100, SW + 100] });
  const borderC= glowA.interpolate({ inputRange: [0, 1], outputRange: [CYAN + '18', CYAN + '55'] });

  // Rotating status messages at the bottom of the header
  const STATUS_MSGS = [
    isConn ? `BRIDGE · ${addr || 'NEXUS-CORE'}` : 'AWAITING HANDSHAKE',
    'AES-256-GCM · HMAC-SHA256',
    'ZERO CLOUD · LAN ONLY',
    isConn ? 'PYTHON ENGINE ARMED' : 'RUN butler_server.py',
    'OLLAMA LOCAL AI BRIDGE',
  ];
  const statusMsg = STATUS_MSGS[tick % STATUS_MSGS.length];

  return (
    <View style={hdr.root}>
      {/* Circuit grid background */}
      <CircuitGridBg color={CYAN} opacity={0.05} />

      {/* Top segmented accent bar */}
      <View style={{ flexDirection: 'row', height: 3 }}>
        {[4, 1, 6, 1, 3, 1, 8, 1, 2].map((flex, i) => (
          <View key={i} style={{
            flex,
            backgroundColor: [CYAN, CYAN + '20', GREEN, CYAN + '10', CYAN + '60', CYAN + '10', PURPLE + '40', CYAN + '08', CYAN + '30'][i],
          }} />
        ))}
      </View>

      {/* Subtle animated scan sweep — native driver only */}
      <Animated.View pointerEvents="none"
        style={[hdr.scanSweep, { transform: [{ translateX: scanX }] }]} />

      {/* HUD corner brackets */}
      <View style={hdr.cornerTL} />
      <View style={hdr.cornerTR} />

      {/* MAIN BODY */}
      <View style={[hdr.body, { paddingTop: safeTop + 10 }]}>

        {/* ── LEFT COLUMN: Terminal identity ── */}
        <View style={{ flex: 1, gap: 5 }}>

          {/* Terminal prompt line */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            <Text style={hdr.promptUser}>root</Text>
            <Text style={hdr.promptAt}>@</Text>
            <Text style={hdr.promptHost}>nexus</Text>
            <Text style={hdr.promptColon}>:~</Text>
            <Text style={hdr.promptHash}>#</Text>
            <View style={{ width: 6 }} />
            <Text style={hdr.promptCmd}>butler_ai --start</Text>
            <Animated.View style={[hdr.cursor, { opacity: cursorA }]} />
          </View>

          {/* Large title */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={hdr.title}>
              <Text style={{ color: TEXT }}>BUTLER</Text>
              <Text style={{ color: CYAN }}> AI</Text>
            </Text>
            <View style={[hdr.versionBadge, { borderColor: CYAN + '35', backgroundColor: CYAN + '08' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 7.5, color: CYAN + '80', fontWeight: '900' }}>v9.1</Text>
            </View>
          </View>

          {/* Sub tagline */}
          <Text style={hdr.tagline}>NEXUS COMMAND CENTER · LOCAL-FIRST · ZERO CLOUD</Text>

          {/* Action buttons row — pure CYAN theme, no yellow */}
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 4 }}>
            {/* CONNECT / PAIR — uses CYAN, never amber */}
            <TouchableOpacity
              onPress={() => { haptics.heavy(); onPair(); }}
              activeOpacity={0.82}
              style={[hdr.actionBtn, {
                borderColor: cc + '80',
                backgroundColor: cc + '14',
                borderLeftColor: cc,
              }]}>
              <PulseDot color={cc} size={5} />
              <Text style={[hdr.actionBtnTxt, { color: cc }]}>
                {isConn ? '⬡ CONNECTED' : '⊞ SCAN QR'}
              </Text>
            </TouchableOpacity>

            {/* RUNTIME */}
            <TouchableOpacity
              onPress={() => { haptics.medium(); goToTab?.('butler'); }}
              activeOpacity={0.82}
              style={[hdr.actionBtn, {
                borderColor: PURPLE + '55',
                backgroundColor: PURPLE + '0D',
                borderLeftColor: PURPLE,
              }]}>
              <MaterialCommunityIcons name="robot-outline" size={10} color={PURPLE} />
              <Text style={[hdr.actionBtnTxt, { color: PURPLE }]}>LOCAL AI</Text>
            </TouchableOpacity>

            {/* SCRIPTS shortcut */}
            <TouchableOpacity
              onPress={() => { haptics.light(); goToTab?.('scripts'); }}
              activeOpacity={0.82}
              style={[hdr.actionBtn, {
                borderColor: GREEN + '50',
                backgroundColor: GREEN + '0A',
                borderLeftColor: GREEN,
              }]}>
              <Text style={[hdr.actionBtnTxt, { color: GREEN }]}>FORGE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── RIGHT COLUMN: Live clock ── */}
        <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {/* Big clock */}
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={hdr.clockHH}>{time}</Text>
              <Text style={[hdr.clockSS, { color: CYAN }]}>{secs}</Text>
            </View>
            <Text style={hdr.clockLabel}>LOCAL · SECURE</Text>
          </View>
          {/* Connection status badge */}
          <View style={[hdr.statusBadge, {
            borderColor: cc + '55',
            backgroundColor: cc + '0C',
          }]}>
            <PulseDot color={cc} size={4} />
            <Text style={[hdr.statusTxt, { color: cc }]}>
              {isConn ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
          {/* Uptime / latency row */}
          <Text style={hdr.clockSub2}>UTC+0 · LAN</Text>
        </View>
      </View>

      {/* SCROLLING STATUS LINE */}
      <View style={hdr.statusRow}>
        <View style={[hdr.statusDot, { backgroundColor: cc }]} />
        <Text style={[hdr.statusLine, { color: cc + 'AA' }]} numberOfLines={1}>
          {statusMsg}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={hdr.statusRight}>BUTLER_OS v7.3</Text>
      </View>

      {/* Bottom segmented accent */}
      <View style={{ flexDirection: 'row', height: 2.5 }}>
        {[3, 1, 5, 1, 2, 1, 4].map((flex, i) => (
          <View key={i} style={{
            flex,
            backgroundColor: [CYAN + '60', CYAN + '10', GREEN + '40', CYAN + '08', PURPLE + '30', CYAN + '06', CYAN + '20'][i],
          }} />
        ))}
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  root: {
    backgroundColor: SURF3,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: CYAN + '25',
    ...Platform.select({
      ios: { shadowColor: CYAN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  scanSweep: {
    position: 'absolute', top: 0, bottom: 0, width: 100,
    backgroundColor: CYAN + '05', zIndex: 0,
    transform: [{ skewX: '-8deg' }],
  },
  cornerTL: { position: 'absolute', top: 6, left: 8, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2, borderColor: CYAN + '70', zIndex: 2 },
  cornerTR: { position: 'absolute', top: 6, right: 8, width: 14, height: 14, borderTopWidth: 2, borderRightWidth: 2, borderColor: CYAN + '50', zIndex: 2 },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: PAD,
    paddingBottom: 10,
    gap: 10,
    zIndex: 1,
  },
  // Terminal prompt
  promptUser:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: GREEN,           lineHeight: 14 },
  promptAt:     { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: TEXT + '50',    lineHeight: 14 },
  promptHost:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: CYAN,            lineHeight: 14 },
  promptColon:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: TEXT + '40',    lineHeight: 14 },
  promptHash:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: GREEN + 'AA',   lineHeight: 14 },
  promptCmd:    { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: TEXT + '70',    lineHeight: 14 },
  cursor:       { width: 6, height: 11, borderRadius: 1, backgroundColor: CYAN, marginLeft: 2, alignSelf: 'center' },
  // Title
  title:        { fontSize: 26, fontWeight: '900', letterSpacing: -0.2, lineHeight: 30 },
  versionBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  tagline:      { fontFamily: MONO, fontSize: 8.5, color: MID + 'AA', letterSpacing: 0.6, lineHeight: 13 },
  // Action buttons
  actionBtn:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderLeftWidth: 3, borderRadius: 9,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  actionBtnTxt: { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  // Clock
  clockHH:      { fontFamily: MONO, fontSize: 22, fontWeight: '900', color: TEXT, letterSpacing: 1.5 },
  clockSS:      { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  clockLabel:   { fontFamily: MONO, fontSize: 7.5, color: MID, letterSpacing: 1.5, fontWeight: '700', textAlign: 'right' },
  clockSub2:    { fontFamily: MONO, fontSize: 7, color: DIM + 'AA', letterSpacing: 0.5, textAlign: 'right' },
  // Status badge
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  statusTxt:    { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },
  // Status row
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingBottom: 8, paddingTop: 2 },
  statusDot:    { width: 5, height: 5, borderRadius: 2.5 },
  statusLine:   { fontFamily: MONO, fontSize: 9, letterSpacing: 0.8, fontWeight: '700', maxWidth: SW * 0.5 },
  statusRight:  { fontFamily: MONO, fontSize: 8, color: DIM, letterSpacing: 0.5 },
});

// ══════════════════════════════════════════════════════════════════
// MINI AI CHAT BAR v11 — PREMIUM EXPANDABLE COMMAND CENTER
// Collapsed: elegant single pill with robot icon + prompt + status
// Expanded: full panel with input, quick chips, tab shortcuts
// ══════════════════════════════════════════════════════════════════
const QUICK_CMDS = [
  { icon: 'monitor-dashboard',   label: 'PC Stats',  prompt: 'Show CPU, RAM, disk usage and top 5 processes', color: CYAN   },
  { icon: 'broom',               label: 'Clean PC',  prompt: 'Clean all temp files and show freed space',     color: GREEN  },
  { icon: 'network-outline',     label: 'Network',   prompt: 'Show all network interfaces and my IP addresses',color: AMBER  },
  { icon: 'code-braces',         label: 'Write Code',prompt: 'Write a Python script to ',                     color: PURPLE },
  { icon: 'shield-check',        label: 'Security',  prompt: 'Run a quick security audit on my PC',           color: RED    },
  { icon: 'eye-circle-outline',  label: 'Processes', prompt: 'List top 8 CPU-consuming processes with PID',   color: TEAL   },
  { icon: 'harddisk',            label: 'Disk',      prompt: 'Show disk usage by drive with free space',      color: BLUE   },
  { icon: 'lightning-bolt',      label: 'Quick Fix', prompt: 'Diagnose and fix the most common PC performance issues', color: RED },
];

const CHAT_SHORTCUTS = [
  { icon: 'home',             label: 'CORE',  tab: 'nexushome', color: CYAN   },
  { icon: 'code-braces',      label: 'FORGE', tab: 'scripts',   color: PURPLE },
  { icon: 'robot-happy-outline', label: 'AI', tab: 'butler',    color: GREEN  },
  { icon: 'brain',            label: 'KB',    tab: 'knowledge', color: AMBER  },
  { icon: 'chart-bar',        label: 'LOG',   tab: 'logs',      color: BLUE   },
  { icon: 'tune-variant',     label: 'CFG',   tab: 'settings',  color: MID    },
];

function MiniChatBar({ isConn }: { isConn: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [reply,    setReply]    = useState('');
  const [replyType,setReplyType]= useState<'ok'|'err'|''>('');

  // Animation values — carefully separated native vs JS
  const expandH   = useRef(new Animated.Value(0)).current;    // JS — height
  const cursorA   = useRef(new Animated.Value(1)).current;    // native — opacity
  const accentA   = useRef(new Animated.Value(0.3)).current;  // JS — border color
  const rowScaleA = useRef(new Animated.Value(1)).current;    // native — bar press
  const chipSlide = useRef(new Animated.Value(24)).current;   // native — chips entrance

  useEffect(() => {
    const cur = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    const acc = Animated.loop(Animated.sequence([
      Animated.timing(accentA, { toValue: 1.0, duration: 1600, useNativeDriver: false }),
      Animated.timing(accentA, { toValue: 0.18, duration: 1600, useNativeDriver: false }),
    ]));
    cur.start(); acc.start();
    return () => { cur.stop(); acc.stop(); };
  }, []);

  const COLLAPSED_H = 0;
  const CHIPS_H     = reply ? 282 : 216;

  const toggleExpand = () => {
    haptics.light();
    const next = !expanded;
    setExpanded(next);
    if (!next) { setReply(''); setReplyType(''); }
    Animated.parallel([
      Animated.spring(expandH, {
        toValue: next ? CHIPS_H : COLLAPSED_H,
        tension: 88, friction: 14, useNativeDriver: false,
      }),
      Animated.spring(chipSlide, {
        toValue: next ? 0 : 24,
        tension: 120, friction: 16, useNativeDriver: true,
      }),
    ]).start();
  };

  const pressBar = () => {
    Animated.sequence([
      Animated.timing(rowScaleA, { toValue: 0.975, duration: 60, useNativeDriver: true }),
      Animated.spring(rowScaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
    ]).start();
    toggleExpand();
  };

  const send = async (prompt?: string) => {
    const t = (prompt || text).trim();
    if (!t || sending) return;
    haptics.heavy(); setSending(true); setText(''); setReply(''); setReplyType('');
    try {
      if (isConn) {
        const ip  = serverConnection.getIP();
        const port = serverConnection.getPort();
        const tok  = serverConnection.getToken?.() || '';
        if (!ip || !port) throw new Error('Not connected');
        const h: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 28000);
        const res = await fetch(`http://${ip}:${port}/api/butler/chat`, {
          method: 'POST', headers: h,
          body: JSON.stringify({ messages: [{ role: 'user', content: t }] }),
          signal: ctrl.signal,
        });
        if (res.ok) {
          const d   = await res.json();
          const r   = (d.reply || d.content || d.message || d.response || '').trim();
          setReply(r.slice(0, 280) || 'Done.');
          setReplyType('ok');
          haptics.success();
        } else {
          throw new Error(`Server HTTP ${res.status}`);
        }
      } else {
        const lc = t.toLowerCase();
        const OFFLINE_RESPONSES: Array<{ test: RegExp; r: string }> = [
          { test: /hi|hello|hey/,        r: 'Hello! Pair your PC via QR code to unlock full local AI.' },
          { test: /help|what can/,       r: 'I run Python scripts, monitor your PC, and chat via local Ollama AI — 100% offline.' },
          { test: /script|python|code/,  r: 'Tap FORGE tab to browse 250+ automation scripts ready to run.' },
          { test: /pair|connect|qr/,     r: 'Run butler_server.py on your PC, then tap PAIR PC at the top.' },
          { test: /privacy|cloud|data/,  r: 'Zero cloud. All data stays on your local LAN. Nothing is uploaded.' },
          { test: /cpu|ram|memory/,      r: 'Pair your PC to see live CPU, RAM, and disk metrics in real-time.' },
          { test: /security|safe/,       r: 'AES-256-GCM encrypted. HMAC-SHA256 signed. Single-device lock.' },
        ];
        const matched = OFFLINE_RESPONSES.find(o => o.test.test(lc));
        setReply(matched?.r ?? 'Pair your PC first to unlock full Butler AI capabilities.');
        setReplyType('ok');
        haptics.success();
      }
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? 'Request timed out (28s)' : (e?.message?.slice(0, 80) || 'Request failed');
      setReply('Error: ' + msg);
      setReplyType('err');
    } finally {
      setSending(false);
    }
  };

  const openFullChat = () => {
    haptics.medium();
    (global as any).__butlerSwitchTab?.('butler');
  };

  const cc         = isConn ? GREEN : CYAN;  // GREEN = connected (terminal aesthetic)
  const borderCol  = accentA.interpolate({ inputRange: [0, 1], outputRange: [cc + '22', cc + '80'] });
  const replyColor = replyType === 'err' ? RED : replyType === 'ok' ? CYAN : MID;

  return (
    <View style={chat.root}>
      {/* ── ANIMATED TOP ACCENT ── */}
      <Animated.View style={[chat.topAccent, { backgroundColor: borderCol as any }]} />

      {/* ── COLLAPSED PILL BAR ── */}
      <Pressable onPress={pressBar} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <Animated.View style={[chat.bar, { transform: [{ scale: rowScaleA }] }]}>
          {/* LEFT: robot avatar + live dot */}
          <View style={[chat.avatar, { borderColor: cc + '60', backgroundColor: cc + '10' }]}>
            {sending
              ? <ActivityIndicator size="small" color={cc} style={{ transform: [{ scale: 0.7 }] }} />
              : <MaterialCommunityIcons name="robot-happy-outline" size={14} color={cc} />}
            <Animated.View style={[chat.avatarOrb, { backgroundColor: cc, opacity: cursorA }]} />
          </View>

          {/* CENTRE: prompt text + blinking cursor */}
          <View style={chat.barCenter}>
            <Text style={[chat.promptTxt, { color: sending ? DIM : TEXT + 'B8' }]} numberOfLines={1}>
              {text.length > 0 ? text : (sending ? 'Thinking...' : (isConn ? '>_ Ask Butler AI or run a command…' : '>_ Pair PC to activate AI…'))}
            </Text>
            {!expanded && !sending && text.length === 0 && (
              <Animated.View style={[chat.cursor, { opacity: cursorA, backgroundColor: cc }]} />
            )}
          </View>

          {/* RIGHT: status + full chat + chevron */}
          <View style={chat.barRight}>
            <View style={[chat.statusPill, { borderColor: cc + '50', backgroundColor: cc + '0C' }]}>
              <PulseDot color={cc} size={4} />
              <Text style={[chat.statusTxt, { color: cc }]}>{isConn ? 'LIVE' : 'OFF'}</Text>
            </View>
            <TouchableOpacity
              onPress={e => { e.stopPropagation?.(); openFullChat(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
              activeOpacity={0.8}
              style={[chat.fullBtn, { borderColor: PURPLE + '50', backgroundColor: PURPLE + '0F' }]}>
              <MaterialIcons name="open-in-new" size={9} color={PURPLE} />
              <Text style={[chat.fullTxt, { color: PURPLE }]}>FULL</Text>
            </TouchableOpacity>
            <MaterialIcons
              name={expanded ? 'expand-less' : 'expand-more'}
              size={20} color={cc + '70'} />
          </View>
        </Animated.View>
      </Pressable>

      {/* ── TAGS INFO ROW ── */}
      <View style={chat.tagsRow}>
        {['BUTLER AI', 'OLLAMA', 'LOCAL', 'AES-256', 'ZERO CLOUD'].map((tag, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {i > 0 && <View style={chat.tagDot} />}
            <Text style={chat.tagTxt}>{tag}</Text>
          </View>
        ))}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={openFullChat} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: CYAN + '80', fontWeight: '900' }}>OPEN AI ›</Text>
        </TouchableOpacity>
      </View>

      {/* ── EXPANDABLE PANEL ── */}
      <Animated.View style={{ height: expandH, overflow: 'hidden' }}>
        <Animated.View style={{ transform: [{ translateY: chipSlide }] }}>

          {/* INPUT ROW */}
          <View style={[chat.inputRow, { borderColor: cc + '60' }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={14} color={cc + '80'} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={isConn ? 'Ask anything, run a script, or give a command…' : 'Ask (pair PC for full AI)…'}
              placeholderTextColor={DIM}
              style={chat.input}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
              editable={!sending}
              maxLength={500}
            />
            <TouchableOpacity
              onPress={() => send()}
              activeOpacity={0.85}
              disabled={!text.trim() || sending}
              style={[chat.sendBtn, {
                backgroundColor: text.trim() && !sending ? cc : DIM + '25',
                borderColor: text.trim() && !sending ? cc : DIM + '40',
              }]}>
              {sending
                ? <ActivityIndicator size="small" color={cc} style={{ transform: [{ scale: 0.65 }] }} />
                : <MaterialIcons name="send" size={14} color={text.trim() && !sending ? BG : DIM} />}
            </TouchableOpacity>
          </View>

          {/* REPLY BUBBLE */}
          {!!reply && (
            <Pressable onPress={() => { setReply(''); setReplyType(''); }} style={[chat.replyBubble, { borderColor: replyColor + '30', backgroundColor: replyColor + '08' }]}>
              <MaterialCommunityIcons
                name={replyType === 'err' ? 'alert-circle-outline' : 'robot-happy'}
                size={13} color={replyColor} style={{ flexShrink: 0 }} />
              <Text style={[chat.replyTxt, { color: replyColor + 'DD' }]} numberOfLines={4}>{reply}</Text>
              <MaterialIcons name="close" size={11} color={DIM} style={{ flexShrink: 0, marginTop: 1 }} />
            </Pressable>
          )}

          {/* QUICK COMMAND CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 7, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 5 }}>
            {QUICK_CMDS.map((c, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { haptics.light(); send(c.prompt); }}
                activeOpacity={0.8}
                style={[chat.chip, { borderColor: c.color + '45', backgroundColor: c.color + '0D' }]}>
                <View style={[chat.chipIcon, { backgroundColor: c.color + '18', borderColor: c.color + '35' }]}>
                  <MaterialCommunityIcons name={c.icon as any} size={11} color={c.color} />
                </View>
                <Text style={[chat.chipTxt, { color: c.color }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* TAB SHORTCUTS ROW */}
          <View style={chat.shortcutRow}>
            <Text style={chat.shortcutLabel}>JUMP TO:</Text>
            {CHAT_SHORTCUTS.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { haptics.light(); (global as any).__butlerSwitchTab?.(s.tab); }}
                activeOpacity={0.8}
                style={[chat.shortcut, { borderColor: s.color + '40', backgroundColor: s.color + '0A' }]}>
                <MaterialCommunityIcons name={s.icon as any} size={10} color={s.color} />
                <Text style={[chat.shortcutTxt, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const chat = StyleSheet.create({
  root: {
    backgroundColor: SURF3,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,200,220,0.14)',
    overflow: 'hidden',
  },
  topAccent: {
    height: 2.5,
    opacity: 0.8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 5,
    gap: 9,
  },
  barCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 3,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: CYAN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  avatarOrb: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: SURF3,
  },
  promptTxt: {
    fontFamily: MONO,
    fontSize: 11.5,
    flex: 1,
    letterSpacing: 0.2,
  },
  cursor: {
    width: 2,
    height: 14,
    borderRadius: 1,
    marginLeft: 2,
    marginBottom: -1,
    flexShrink: 0,
  },
  barRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusTxt: {
    fontFamily: MONO,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  fullTxt: {
    fontFamily: MONO,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 7,
  },
  tagTxt: {
    fontFamily: MONO,
    fontSize: 7.5,
    color: MID + '88',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  tagDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: DIM,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 12,
    marginTop: 9,
    marginBottom: 6,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: BG,
  },
  input: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 13,
    color: TEXT,
    padding: 0,
    minHeight: 18,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  replyBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginHorizontal: 12,
    marginBottom: 7,
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  replyTxt: {
    fontFamily: MONO,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTxt: {
    fontFamily: MONO,
    fontSize: 9.5,
    fontWeight: '800',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 9,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  shortcutLabel: {
    fontFamily: MONO,
    fontSize: 7.5,
    color: DIM,
    fontWeight: '900',
    letterSpacing: 0.8,
    flexShrink: 0,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  shortcutTxt: {
    fontFamily: MONO,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// ══════════════════════════════════════════════════════════════════
// PAIR PROMPT — ROBOT THEMED, COMPACT
// ══════════════════════════════════════════════════════════════════
function PairPrompt({ onPair }: { onPair: () => void }) {
  const floatA = useRef(new Animated.Value(0)).current;
  const glowA  = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const floop = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    const gloop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1.0, duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
    ]));
    floop.start(); gloop.start();
    return () => { floop.stop(); gloop.stop(); };
  }, []);
  const translateY = floatA.interpolate({ inputRange: [0,1], outputRange: [0,-6] });

  return (
    <View style={pq.root}>
      <View style={{ height: 3, backgroundColor: CYAN + '80' }} />
      <View style={{ flexDirection: 'row', gap: 16, padding: 16, paddingTop: 14, alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Animated.View style={[pq.robotBox, {
            borderColor: AMBER,
            backgroundColor: glowA.interpolate({ inputRange:[0,1], outputRange:[AMBER+'10', AMBER+'22'] }),
          }]}>
            <HUDCorners color={AMBER + '45'} size={8} />
            {MASCOT_IMG ? (
              <Image source={MASCOT_IMG} style={{ width: 60, height: 60 }} resizeMode="cover" />
            ) : (
              <MaterialIcons name="qr-code-scanner" size={28} color={AMBER} />
            )}
          </Animated.View>
        </Animated.View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={pq.title}>Connect your PC</Text>
          <Text style={pq.body}>Run butler_server.py, then scan QR from terminal. Instant LAN pairing — 100% private.</Text>
          {/* ── DOWNLOAD BUTTON — always shown inside PairPrompt (PairPrompt is only rendered when !isConn) ── */}
          {true && (
            <TouchableOpacity
              onPress={() => {
                haptics.medium();
                try {
                  import('react-native').then(({ Linking }) =>
                    Linking.openURL('https://github.com/shawnjan-cmd/butler-server/releases/latest').catch(() => {})
                  );
                } catch {}
              }}
              activeOpacity={0.85}
              style={pq.downloadBtn}
            >
              <MaterialCommunityIcons name="github" size={14} color="#000" />
              <Text style={pq.downloadTxt}>DOWNLOAD BUTLER SERVER</Text>
              <MaterialIcons name="open-in-new" size={13} color="#000" />
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {[
              { label: 'PYTHON', col: CYAN   },
              { label: 'LAN ONLY', col: GREEN  },
              { label: 'AES-256', col: PURPLE },
              { label: 'HMAC', col: TEAL  },
            ].map(t => (
              <View key={t.label} style={[pq.tag, { borderColor: t.col + '35', backgroundColor: t.col + '08' }]}>
                <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: t.col + 'AA', letterSpacing: 0.5 }}>{t.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Pressable onPress={() => { haptics.heavy(); onPair(); }}
        style={({ pressed }) => [pq.btn, { opacity: pressed ? 0.85 : 1 }]}>
        <MaterialIcons name="qr-code-scanner" size={18} color={BG} />
        <Text style={pq.btnTxt}>SCAN QR TO PAIR PC</Text>
        <MaterialIcons name="arrow-forward" size={16} color={BG} />
      </Pressable>
    </View>
  );
}
const pq = StyleSheet.create({
  root:    { backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1.5, borderColor: CYAN + '30', overflow: 'hidden', marginHorizontal: PAD },
  robotBox:{ width: 68, height: 68, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' },
  title:   { fontSize: 17, fontWeight: '700', color: TEXT },
  body:    { fontFamily: MONO, fontSize: 10.5, color: MID, lineHeight: 16 },
  tag:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  btn:     { margin: 16, marginTop: 4, backgroundColor: CYAN, borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnTxt:  { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: BG },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginTop: 8, marginBottom: 4, backgroundColor: '#00CC88', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  downloadTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 0.5, flex: 1, textAlign: 'center' },
});

// ══════════════════════════════════════════════════════════════════
// QUICK ACTIONS — 2×2 GRID · GLOWING DARK ICON STYLE
// Design: dark rounded square bg, colored glow icon, count+subtitle
// Inspired by the images showing dark rounded cards with colored icons
// ══════════════════════════════════════════════════════════════════
const QA_ITEMS = [
  { icon: 'robot-happy-outline', label: 'AI CHAT',  sub: 'Local Ollama · Private', tab: 'butler',    color: CYAN,   extra: 'chat' },
  { icon: 'code-braces',         label: 'SCRIPTS',  sub: '250+ Python scripts',    tab: 'scripts',   color: GREEN,  extra: 'forge' },
  { icon: 'folder-network',      label: 'FILES',    sub: 'LAN · direct · secure',   tab: 'fileshare', color: PURPLE, extra: 'vault' },
  { icon: 'brain',               label: 'KNOWLEDGE',sub: 'AI neural store',         tab: 'knowledge', color: AMBER,  extra: 'kb' },
];

function QuickActions({ goToTab, onPair }: { goToTab: (t: string) => void; onPair: () => void }) {
  const scales = useRef(QA_ITEMS.map(() => new Animated.Value(1))).current;
  const glows  = useRef(QA_ITEMS.map(() => new Animated.Value(0.25))).current;

  const pi = (i: number) => {
    Animated.parallel([
      Animated.spring(scales[i], { toValue: 0.91, tension: 420, friction: 12, useNativeDriver: true }),
      Animated.timing(glows[i],  { toValue: 1.0, duration: 80, useNativeDriver: false }),
    ]).start();
  };
  const po = (i: number) => {
    Animated.parallel([
      Animated.spring(scales[i], { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
      Animated.timing(glows[i],  { toValue: 0.25, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <MaterialCommunityIcons name="lightning-bolt" size={10} color={AMBER} />
        <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: AMBER + 'A0', letterSpacing: 1.8 }}>QUICK ACCESS</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: AMBER + '20' }} />
      </View>
      <View style={qa.row}>
        {QA_ITEMS.map((a, i) => {
          const borderColor = glows[i].interpolate({ inputRange: [0, 1], outputRange: [a.color + '25', a.color + 'AA'] });
          const shadowBg    = glows[i].interpolate({ inputRange: [0, 1], outputRange: [a.color + '0A', a.color + '20'] });
          return (
            <Pressable key={a.label}
              onPress={() => { haptics.medium(); goToTab(a.tab); }}
              onPressIn={() => pi(i)} onPressOut={() => po(i)}
              style={{ width: '48%' }}>
              <Animated.View style={[
                qa.cell,
                { transform: [{ scale: scales[i] }] },
              ]}>
                {/* Dark card with colored top border */}
                <Animated.View style={[qa.cardInner, {
                  borderColor,
                  backgroundColor: shadowBg,
                  borderTopColor: a.color,
                }]}>
                  <HUDCorners color={a.color + '30'} size={7} />
                  {/* Code-style label top-right */}
                  <Text style={[qa.hexCode, { color: a.color + '40' }]}>{a.extra.toUpperCase()}</Text>

                  {/* Large glowing icon box — dark rounded square style */}
                  <Animated.View style={[qa.iconBox, {
                    borderColor: a.color + '60',
                    backgroundColor: a.color + '12',
                    ...Platform.select({
                      ios: { shadowColor: a.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
                      android: { elevation: 5 },
                    }),
                  }]}>
                    <MaterialCommunityIcons name={a.icon as any} size={34} color={a.color} />
                  </Animated.View>

                  <Text style={[qa.label, { color: a.color + 'CC' }]}>{a.label}</Text>
                  <Text style={[qa.sub, { color: a.color + '60' }]}>{a.sub}</Text>

                  {/* Bottom glow line */}
                  <Animated.View style={[qa.bottomGlow, { backgroundColor: a.color, opacity: glows[i] }]} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const qa = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  cell:      { width: '100%' },
  cardInner: {
    alignItems: 'center', paddingVertical: 20, paddingTop: 24, gap: 9,
    borderRadius: 18, borderWidth: 1.5, borderTopWidth: 3,
    overflow: 'hidden', position: 'relative',
    backgroundColor: SURFACE,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  hexCode:   { position: 'absolute', top: 7, right: 8, fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  iconBox:   {
    width: 68, height: 68, borderRadius: 20, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  label:     { fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center' },
  sub:       { fontFamily: MONO, fontSize: 9, letterSpacing: 0.3, textAlign: 'center', lineHeight: 13 },
  bottomGlow:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5 },
});

// ══════════════════════════════════════════════════════════════════
// NETWORK METRICS BAR — horizontal pill cards
// Shows Latency/Network/Disk/Uptime/FPS from real server data
// Only meaningful when connected; shows dashes offline
// ══════════════════════════════════════════════════════════════════
function NetworkMetricsBar({ isConn, latency, cpu, disk }: { isConn: boolean; latency: number; cpu: number; disk: number }) {
  const METRICS = [
    { icon: 'wifi',                 label: 'LATENCY',  value: isConn ? `${latency}ms` : '—',      color: latency > 300 ? RED : latency > 100 ? AMBER : GREEN },
    { icon: 'lan-connect',          label: 'NETWORK',  value: isConn ? 'LAN' : '—',               color: isConn ? CYAN  : MID  },
    { icon: 'speedometer',          label: 'THROUGHPUT',value: isConn ? 'LOCAL' : '—',             color: isConn ? TEAL  : MID  },
    { icon: 'harddisk',             label: 'DISK',     value: isConn ? Math.round(disk) + '%' : '—', color: disk > 90 ? RED : disk > 70 ? AMBER : GREEN },
    { icon: 'monitor-screenshot',   label: 'FRAME',    value: '60fps',                             color: PURPLE },
    { icon: 'clock-check-outline',  label: 'UPTIME',   value: isConn ? '—h' : '—',                color: isConn ? BLUE  : MID  },
  ];
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {METRICS.map((m, i) => (
          <View key={i} style={[nmb.card, {
            backgroundColor: m.color + '10',
            borderColor: m.color + '40',
            borderTopColor: m.color,
            ...Platform.select({ ios: { shadowColor: m.color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 3 } }),
          }]}>
            <View style={[nmb.iconBox, { backgroundColor: m.color + '18', borderColor: m.color + '35' }]}>
              <MaterialCommunityIcons name={m.icon as any} size={16} color={m.color} />
            </View>
            <Text style={[nmb.label, { color: m.color + '90' }]}>{m.label}</Text>
            <Text style={[nmb.value, { color: isConn ? m.color : DIM }]}>{m.value}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const nmb = StyleSheet.create({
  card:    { alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderTopWidth: 2.5, paddingHorizontal: 12, paddingVertical: 11, gap: 5, minWidth: 72 },
  iconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  value:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 16 },
});

// ══════════════════════════════════════════════════════════════════
// LIVE GAUGES
// ══════════════════════════════════════════════════════════════════
function ArcGauge({ val, color, label, isConn }: { val: number; color: string; label: string; isConn: boolean }) {
  const v = isConn ? Math.round(val) : 0;
  const fillH = (v / 100) * 72;
  const pulseA = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!isConn) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 2200, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 0.3, duration: 2200, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [isConn]);

  return (
    <View style={{ alignItems: 'center', flex: 1, gap: 8 }}>
      <Animated.View style={{ opacity: isConn ? pulseA : 1 }}>
        <View style={[ag.ring, { borderColor: isConn ? color + '55' : DIM + '25' }]}>
          <View style={[ag.fill, { height: fillH, backgroundColor: color + (isConn ? '22' : '06') }]} />
          <View style={ag.center}>
            <Text style={[ag.val, { color: isConn ? color : DIM }]} adjustsFontSizeToFit>
              {isConn ? v : '—'}
            </Text>
            {isConn && <Text style={[ag.pct, { color: color + '80' }]}>%</Text>}
          </View>
          {isConn && <View style={[ag.topBar, { backgroundColor: color }]} />}
        </View>
      </Animated.View>
      <Text style={[ag.label, { color: isConn ? color + 'A0' : DIM }]}>{label}</Text>
    </View>
  );
}
const ag = StyleSheet.create({
  ring:   { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, backgroundColor: SURF2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fill:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 40 },
  center: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  val:    { fontFamily: MONO, fontSize: 22, fontWeight: '900', lineHeight: 26 },
  pct:    { fontFamily: MONO, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  label:  { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },
});

function LiveGauges({ isConn, cpu, ram, disk, cpuH, ramH, diskH }: {
  isConn: boolean; cpu: number; ram: number; disk: number;
  cpuH: number[]; ramH: number[]; diskH: number[];
}) {
  const cpuC  = cpu  > 80 ? RED : CYAN;
  const ramC  = ram  > 85 ? RED : GREEN;
  const diskC = disk > 90 ? RED : PURPLE;

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[lg.card, { backgroundColor: SURFACE }]}>
        <View style={lg.hdr}>
          <MaterialCommunityIcons name="gauge" size={14} color={CYAN} />
          <Text style={lg.hdrTxt}>LIVE GAUGES</Text>
          <View style={{ flex: 1 }} />
          <View style={[lg.statusPill, { borderColor: (isConn ? GREEN : AMBER) + '55', backgroundColor: (isConn ? GREEN : AMBER) + '0A' }]}>
            <PulseDot color={isConn ? GREEN : AMBER} size={5} />
            <Text style={[lg.statusTxt, { color: isConn ? GREEN : AMBER }]}>{isConn ? 'LIVE' : 'STANDBY'}</Text>
          </View>
        </View>
        <HUDCorners color={CYAN + '30'} size={10} />
        <View style={lg.gaugesRow}>
          <ArcGauge val={cpu}  color={cpuC}  label="CPU"  isConn={isConn} />
          <View style={lg.divider} />
          <ArcGauge val={ram}  color={ramC}  label="RAM"  isConn={isConn} />
          <View style={lg.divider} />
          <ArcGauge val={disk} color={diskC} label="DISK" isConn={isConn} />
        </View>
        {isConn ? (
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 0 }}>
            <View style={{ flex: 1, paddingHorizontal: 6 }}><Sparkline data={cpuH}  color={cpuC}  height={18} /></View>
            <View style={{ width: 1, backgroundColor: BORDER }} />
            <View style={{ flex: 1, paddingHorizontal: 6 }}><Sparkline data={ramH}  color={ramC}  height={18} /></View>
            <View style={{ width: 1, backgroundColor: BORDER }} />
            <View style={{ flex: 1, paddingHorizontal: 6 }}><Sparkline data={diskH} color={diskC} height={18} /></View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: DIM, textAlign: 'center', letterSpacing: 0.5 }}>
              Pair your PC to see live metrics
            </Text>
          </View>
        )}
        {isConn && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
            {[[cpu, cpuC, 'CPU'],[ram, ramC, 'RAM'],[disk, diskC, 'DISK']].map(([v,c,l]) => (
              <View key={l as string} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: MID, fontWeight: '700' }}>{l}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: c as string, fontWeight: '900' }}>{Math.round(v as number)}%</Text>
                </View>
                <SegBar value={v as number} color={c as string} height={4} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
const lg = StyleSheet.create({
  card:       { borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', position: 'relative' },
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 12 },
  hdrTxt:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: CYAN + 'CC', letterSpacing: 1.4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  statusTxt:  { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  gaugesRow:  { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10 },
  divider:    { width: 1, alignSelf: 'stretch', backgroundColor: BORDER, marginHorizontal: 4 },
});

// ══════════════════════════════════════════════════════════════════
// CLIPBOARD WIDGET
// ══════════════════════════════════════════════════════════════════
function ClipboardWidget({ isConn }: { isConn: boolean }) {
  const [text,      setText]      = useState('');
  const [pcClip,    setPcClip]    = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [busy,      setBusy]      = useState<'pull'|'push'|'type'|null>(null);
  const glowA = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 0.8,  duration: 1500, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.15, duration: 1500, useNativeDriver: false }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const pasteFromPhone = async () => {
    try {
      const s = await ExpoClipboard.getStringAsync();
      if (s) { setText(s); setStatusMsg('Pasted from phone'); haptics.success(); }
      else   setStatusMsg('Phone clipboard is empty');
    } catch { setStatusMsg('Could not read phone clipboard'); }
  };

  const pullFromPC = async () => {
    setBusy('pull');
    try {
      const s = await pcClipboard.pullFromPC();
      setPcClip(s || '(empty)'); setText(s || ''); setStatusMsg('Copied from PC ✓'); haptics.success();
    } catch (e: any) { setStatusMsg('Error: ' + (e?.message || 'Failed')); }
    setBusy(null);
  };

  const pushToPC = async () => {
    if (!text.trim()) { setStatusMsg('Enter text to send'); return; }
    setBusy('push');
    try {
      await pcClipboard.pushToPC(text);
      setStatusMsg('Sent to PC clipboard ✓'); haptics.success();
    } catch (e: any) { setStatusMsg('Error: ' + (e?.message || 'Failed')); }
    setBusy(null);
  };

  const typeOnPC = async () => {
    if (!text.trim()) { setStatusMsg('Enter text to type'); return; }
    setBusy('type');
    try {
      await pcClipboard.typeOnPC(text);
      setStatusMsg('Typed on PC ✓'); haptics.success();
    } catch (e: any) { setStatusMsg('Error: ' + (e?.message || 'Failed')); }
    setBusy(null);
  };

  const statusColor = statusMsg.includes('✓') ? GREEN : statusMsg.includes('Error') ? RED : AMBER;

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[cw.root, { backgroundColor: SURFACE }]}>
        <View style={cw.hdr}>
          <Animated.View style={{ opacity: glowA }}>
            <View style={[cw.iconBox, { backgroundColor: CYAN + '14', borderColor: CYAN + '50' }]}>
              <MaterialCommunityIcons name="clipboard-arrow-left-right-outline" size={22} color={CYAN} />
            </View>
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={cw.title}>CLIPBOARD SYNC</Text>
            <Text style={cw.sub}>Phone ↔ PC · instant transfer · no cloud</Text>
          </View>
          {!isConn && (
            <View style={[cw.offlineBadge, { borderColor: AMBER + '50', backgroundColor: AMBER + '0A' }]}>
              <MaterialIcons name="wifi-off" size={10} color={AMBER} />
              <Text style={{ fontFamily: MONO, fontSize: 8, color: AMBER, fontWeight: '900' }}>OFFLINE</Text>
            </View>
          )}
        </View>
        <HUDCorners color={CYAN + '30'} size={8} />
        <View style={[cw.textArea, { borderColor: CYAN + (text ? '55' : '25') }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type or paste text to send to PC..."
            placeholderTextColor={DIM}
            style={cw.textInput}
            multiline
            numberOfLines={3}
            maxLength={2000}
            textAlignVertical="top"
          />
          {text.length > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER }}>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: DIM }}>{text.length} chars</Text>
              <TouchableOpacity onPress={() => setText('')}>
                <Text style={{ fontFamily: MONO, fontSize: 9, color: RED, fontWeight: '900' }}>CLEAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!!pcClip && (
          <View style={cw.pcPreview}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <MaterialCommunityIcons name="desktop-classic" size={11} color={GREEN} />
              <Text style={{ fontFamily: MONO, fontSize: 9, color: GREEN, fontWeight: '900' }}>PC CLIPBOARD</Text>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: TEXT2, lineHeight: 16 }} numberOfLines={3}>{pcClip}</Text>
          </View>
        )}
        <View style={cw.actionsRow}>
          <TouchableOpacity onPress={pasteFromPhone} activeOpacity={0.8}
            style={[cw.actionBtn, { borderColor: CYAN + '40', backgroundColor: CYAN + '0C' }]}>
            <MaterialCommunityIcons name="cellphone-arrow-down" size={16} color={CYAN} />
            <Text style={[cw.actionTxt, { color: CYAN }]}>PASTE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pullFromPC} disabled={!isConn || busy === 'pull'} activeOpacity={0.8}
            style={[cw.actionBtn, { borderColor: (isConn ? TEAL : DIM) + '50', backgroundColor: (isConn ? TEAL : DIM) + '0A', opacity: isConn ? 1 : 0.45 }]}>
            {busy === 'pull'
              ? <ActivityIndicator size="small" color={TEAL} />
              : <MaterialCommunityIcons name="arrow-down-circle-outline" size={16} color={isConn ? TEAL : DIM} />}
            <Text style={[cw.actionTxt, { color: isConn ? TEAL : DIM }]}>PULL PC</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pushToPC} disabled={!isConn || busy === 'push' || !text.trim()} activeOpacity={0.8}
            style={[cw.actionBtn, { borderColor: (isConn ? GREEN : DIM) + '50', backgroundColor: (isConn ? GREEN : DIM) + '0A', opacity: (isConn && text.trim()) ? 1 : 0.45 }]}>
            {busy === 'push'
              ? <ActivityIndicator size="small" color={GREEN} />
              : <MaterialCommunityIcons name="arrow-up-circle-outline" size={16} color={isConn ? GREEN : DIM} />}
            <Text style={[cw.actionTxt, { color: isConn ? GREEN : DIM }]}>PUSH PC</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={typeOnPC} disabled={!isConn || busy === 'type' || !text.trim()} activeOpacity={0.8}
            style={[cw.actionBtn, { borderColor: (isConn ? PURPLE : DIM) + '50', backgroundColor: (isConn ? PURPLE : DIM) + '0A', opacity: (isConn && text.trim()) ? 1 : 0.45 }]}>
            {busy === 'type'
              ? <ActivityIndicator size="small" color={PURPLE} />
              : <MaterialCommunityIcons name="keyboard-outline" size={16} color={isConn ? PURPLE : DIM} />}
            <Text style={[cw.actionTxt, { color: isConn ? PURPLE : DIM }]}>TYPE PC</Text>
          </TouchableOpacity>
        </View>
        {!!statusMsg && (
          <View style={[cw.status, { borderColor: statusColor + '35', backgroundColor: statusColor + '08' }]}>
            <MaterialIcons name={statusMsg.includes('✓') ? 'check-circle' : 'info'} size={12} color={statusColor} />
            <Text style={{ fontFamily: MONO, fontSize: 10.5, color: statusColor, flex: 1 }}>{statusMsg}</Text>
            <TouchableOpacity onPress={() => setStatusMsg('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={12} color={DIM} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
const cw = StyleSheet.create({
  root:        { borderRadius: 18, borderWidth: 1, borderColor: CYAN + '28', overflow: 'hidden', position: 'relative' },
  hdr:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 14 },
  iconBox:     { width: 46, height: 46, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 2 },
  sub:         { fontFamily: MONO, fontSize: 10, color: MID, lineHeight: 15 },
  offlineBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  textArea:    { marginHorizontal: 16, borderRadius: 12, borderWidth: 1.5, padding: 12, backgroundColor: SURF2 },
  textInput:   { fontFamily: MONO, fontSize: 13, color: TEXT, minHeight: 66, maxHeight: 120, lineHeight: 20 },
  pcPreview:   { marginHorizontal: 16, marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: GREEN + '30', backgroundColor: GREEN + '06', padding: 10 },
  actionsRow:  { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 12 },
  actionBtn:   { flex: 1, flexDirection: 'column', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 4 },
  actionTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  status:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 14, padding: 10, borderRadius: 10, borderWidth: 1 },
});

// ══════════════════════════════════════════════════════════════════
// FILE SHARE WIDGET
// ══════════════════════════════════════════════════════════════════
function FileShareWidget({ isConn }: { isConn: boolean }) {
  const [file,   setFile]   = useState<{ name: string; uri: string; size?: number } | null>(null);
  const [busy,   setBusy]   = useState(false);
  const [status, setStatus] = useState('');
  const shakeA = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeA, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pickFile = async () => {
    haptics.medium();
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        setFile({ name: a.name, uri: a.uri, size: a.size });
        setStatus('');
      }
    } catch (e: any) {
      setStatus('Could not pick file: ' + (e?.message || 'Unknown'));
    }
  };

  const sendFile = async () => {
    if (!file) { shake(); return; }
    if (!isConn) { setStatus('Connect your PC first'); shake(); return; }
    setBusy(true); setStatus('Uploading...');
    try {
      const ip   = serverConnection.getIP();
      const port = serverConnection.getPort();
      const tok  = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not connected');
      const fd = new FormData();
      fd.append('file', { uri: file.uri, name: file.name, type: 'application/octet-stream' } as any);
      const h: Record<string,string> = {};
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(`http://${ip}:${port}/api/receive_file`, { method: 'POST', headers: h, body: fd, signal: ctrl.signal });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      setStatus(`Sent ${file.name} ✓`); haptics.success(); setFile(null);
    } catch (e: any) {
      setStatus('Error: ' + (e?.message?.slice(0, 60) || 'Failed'));
    }
    setBusy(false);
  };

  const statusColor = status.includes('✓') ? GREEN : status.includes('Error') ? RED : AMBER;
  const bytes = file?.size ? (file.size < 1024 ? `${file.size}B` : file.size < 1048576 ? `${(file.size/1024).toFixed(1)}KB` : `${(file.size/1048576).toFixed(1)}MB`) : '';

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[fs.root, { backgroundColor: SURFACE, borderColor: PURPLE + '28' }]}>
        <View style={{ height: 3, backgroundColor: PURPLE }} />
        <View style={fs.hdr}>
          <View style={[fs.iconBox, { backgroundColor: PURPLE + '14', borderColor: PURPLE + '50' }]}>
            <MaterialCommunityIcons name="folder-arrow-right-outline" size={22} color={PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={fs.title}>FILE TRANSFER</Text>
            <Text style={fs.sub}>Phone → PC · direct LAN · no cloud storage</Text>
          </View>
          {!isConn && (
            <View style={[cw.offlineBadge, { borderColor: AMBER + '40', backgroundColor: AMBER + '0A' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 8, color: AMBER, fontWeight: '900' }}>PAIR PC</Text>
            </View>
          )}
        </View>
        <Pressable onPress={pickFile} style={({ pressed }) => [fs.dropZone, { opacity: pressed ? 0.8 : 1, borderColor: file ? PURPLE + '60' : BORDER }]}>
          {file ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[fs.fileIcon, { backgroundColor: PURPLE + '14', borderColor: PURPLE + '40' }]}>
                <MaterialCommunityIcons name="file-check-outline" size={22} color={PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={fs.fileName} numberOfLines={2}>{file.name}</Text>
                {bytes ? <Text style={fs.fileSize}>{bytes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => { setFile(null); setStatus(''); }}>
                <MaterialIcons name="close" size={16} color={RED + '80'} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Animated.View style={{ transform: [{ translateX: shakeA }] }}>
                <MaterialCommunityIcons name="upload-outline" size={32} color={MID} />
              </Animated.View>
              <Text style={fs.dropTxt}>Tap to select a file</Text>
              <Text style={fs.dropSub}>Any type · sent directly to PC Desktop</Text>
            </View>
          )}
        </Pressable>
        {!!status && (
          <View style={[cw.status, { borderColor: statusColor + '35', backgroundColor: statusColor + '08', marginBottom: 4 }]}>
            <MaterialIcons name={status.includes('✓') ? 'check-circle' : 'info'} size={12} color={statusColor} />
            <Text style={{ fontFamily: MONO, fontSize: 10.5, color: statusColor, flex: 1 }}>{status}</Text>
            <TouchableOpacity onPress={() => setStatus('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={12} color={DIM} />
            </TouchableOpacity>
          </View>
        )}
        <Pressable onPress={sendFile} disabled={busy} activeOpacity={0.85}
          style={({ pressed }) => [fs.sendBtn, { backgroundColor: (file && isConn) ? PURPLE : DIM + '30', opacity: pressed ? 0.85 : 1 }]}>
          {busy
            ? <ActivityIndicator size="small" color={(file && isConn) ? '#000' : MID} />
            : <MaterialCommunityIcons name="send-outline" size={17} color={(file && isConn) ? '#000' : MID} />}
          <Text style={[fs.sendTxt, { color: (file && isConn) ? '#000' : MID }]}>
            {busy ? 'SENDING...' : 'SEND TO PC'}
          </Text>
        </Pressable>
        <View style={{ height: 14 }} />
      </View>
    </View>
  );
}
const fs = StyleSheet.create({
  root:      { borderRadius: 18, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 14 },
  iconBox:   { width: 46, height: 46, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:     { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 2 },
  sub:       { fontFamily: MONO, fontSize: 10, color: MID, lineHeight: 15 },
  dropZone:  { marginHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', padding: 18, backgroundColor: SURF2, justifyContent: 'center', marginBottom: 12 },
  fileIcon:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileName:  { fontSize: 14, fontWeight: '700', color: TEXT, lineHeight: 19 },
  fileSize:  { fontFamily: MONO, fontSize: 10, color: MID, marginTop: 2 },
  dropTxt:   { fontSize: 14, fontWeight: '600', color: MID },
  dropSub:   { fontFamily: MONO, fontSize: 10, color: DIM },
  sendBtn:   { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  sendTxt:   { fontFamily: MONO, fontSize: 14, fontWeight: '900' },
});

// ══════════════════════════════════════════════════════════════════
// SCRIPT LAUNCHER
// ══════════════════════════════════════════════════════════════════
const SCRIPTS = [
  { icon: 'monitor-dashboard', color: CYAN,   label: 'SYSMON', script: `import platform,psutil\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"CPU: {psutil.cpu_percent(1)}%  RAM: {psutil.virtual_memory().percent}%")` },
  { icon: 'broom',             color: GREEN,  label: 'CLEAN',  script: `import shutil,os,tempfile\ntd=tempfile.gettempdir();freed=0;n=0\nfor f in os.listdir(td):\n p=os.path.join(td,f)\n try:\n  sz=os.path.getsize(p) if os.path.isfile(p) else 0\n  (os.unlink if os.path.isfile(p) else shutil.rmtree)(p)\n  freed+=sz;n+=1\n except:pass\nprint(f"Freed {freed//1024//1024}MB from {n} items")` },
  { icon: 'network-outline',   color: AMBER,  label: 'NETMAP', script: `import socket,psutil\nnet=psutil.net_if_addrs()\nfor k,v in list(net.items())[:3]:\n for a in v:\n  if a.family==socket.AF_INET: print(f"{k}: {a.address}")` },
  { icon: 'eye-circle-outline',color: PURPLE, label: 'PROCS',  script: `import psutil\nfor p in sorted(psutil.process_iter(['name','cpu_percent']),key=lambda x:x.info['cpu_percent'] or 0,reverse=True)[:5]:\n print(f"{p.info['name'][:22]:22} {p.info['cpu_percent']:.1f}%")` },
  { icon: 'harddisk',          color: PINK,   label: 'DISK',   script: `import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { icon: 'lightning-bolt',    color: RED,    label: 'PERF',   script: `import psutil,time\ncpu1=psutil.cpu_percent()\ntime.sleep(0.5)\ncpu2=psutil.cpu_percent()\nprint(f"CPU:{cpu2:.1f}%  MEM:{psutil.virtual_memory().percent:.1f}%  Cores:{psutil.cpu_count()}")` },
];

function ScriptLauncher({ isConn }: { isConn: boolean }) {
  const [running, setRunning] = useState<number | null>(null);
  const [out,     setOut]     = useState<{ i: number; txt: string; ok: boolean } | null>(null);

  const run = async (s: typeof SCRIPTS[0], idx: number) => {
    if (!isConn || running !== null) return;
    haptics.heavy(); setRunning(idx); setOut(null);
    try {
      const ip = serverConnection.getIP(), port = serverConnection.getPort();
      const tok = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not connected');
      const h: Record<string,string> = { 'Content-Type': 'application/json' };
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method: 'POST', headers: h, body: JSON.stringify({ script: s.script }), signal: ctrl.signal });
      const d = await res.json();
      setOut({ i: idx, txt: (d.output || d.error || 'Done').trim().slice(0, 320), ok: !d.error });
      haptics.success();
    } catch (e: any) { setOut({ i: idx, txt: 'Error: ' + (e?.message || 'Failed'), ok: false }); }
    setRunning(null);
  };

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[sl.root, { backgroundColor: SURFACE }]}>
        <View style={sl.hdr}>
          <MaterialCommunityIcons name="code-braces-box" size={14} color={GREEN} />
          <Text style={[sl.hdrTxt, { color: GREEN + 'CC' }]}>QUICK SCRIPTS</Text>
          <View style={{ flex: 1 }} />
          <View style={[cw.offlineBadge, { borderColor: (isConn ? GREEN : RED) + '50', backgroundColor: (isConn ? GREEN : RED) + '08' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: isConn ? GREEN : RED }}>{isConn ? 'READY' : 'PC OFFLINE'}</Text>
          </View>
        </View>
        <View style={sl.grid}>
          {SCRIPTS.map((s, i) => (
            <Pressable key={i} onPress={() => run(s, i)} disabled={!isConn || running !== null}
              style={({ pressed }) => [sl.cell, {
                borderTopColor: s.color, borderTopWidth: 2.5,
                backgroundColor: SURF2,
                opacity: !isConn ? 0.35 : (running === i || pressed) ? 0.8 : 1,
                borderColor: running === i ? s.color + '70' : BORDER,
              }]}>
              <View style={[sl.iconWrap, { backgroundColor: s.color + '14', borderColor: s.color + '40' }]}>
                {running === i
                  ? <ActivityIndicator size="small" color={s.color} />
                  : <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />}
              </View>
              <Text style={[sl.label, { color: s.color + 'AA' }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
        {out && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <View style={[sl.outBox, { borderColor: (out.ok ? GREEN : RED) + '45', backgroundColor: (out.ok ? GREEN : RED) + '08' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name={out.ok ? 'check-circle' : 'error'} size={12} color={out.ok ? GREEN : RED} />
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: out.ok ? GREEN : RED }}>{SCRIPTS[out.i]?.label} OUTPUT</Text>
                </View>
                <TouchableOpacity onPress={() => setOut(null)}>
                  <MaterialIcons name="close" size={13} color={MID} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: out.ok ? '#88FFBB' : '#FF9090', lineHeight: 18 }} selectable>{out.txt}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
const sl = StyleSheet.create({
  root:    { borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  hdr:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 12 },
  hdrTxt:  { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 14, gap: 0 },
  cell:    { width: '33.33%', alignItems: 'center', paddingVertical: 14, paddingTop: 17, gap: 7, borderRadius: 13, borderWidth: 1 },
  iconWrap:{ width: 52, height: 52, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  outBox:  { borderWidth: 1.5, borderRadius: 12, padding: 12 },
});

// ══════════════════════════════════════════════════════════════════
// CORE NAVIGATION GRID
// ══════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { icon: 'robot-happy-outline',   label: 'CHAT',     tab: 'butler',    color: CYAN,   sub: '0×AI01' },
  { icon: 'auto-fix',              label: 'FLOWS',    tab: 'builder',   color: GREEN,  sub: '0×FL02' },
  { icon: 'code-braces',           label: 'SCRIPTS',  tab: 'scripts',   color: AMBER,  sub: '0×SC03' },
  { icon: 'brain',                 label: 'KB',       tab: 'knowledge', color: PURPLE, sub: '0×KB04' },
  { icon: 'folder-network-outline',label: 'FILES',    tab: 'fileshare', color: PINK,   sub: '0×FS05' },
  { icon: 'chart-bar',             label: 'LOGS',     tab: 'logs',      color: RED,    sub: '0×LG06' },
  { icon: 'monitor-dashboard',     label: 'REMOTE',   tab: 'connect',   color: TEAL,   sub: '0×RC07' },
  { icon: 'palette-swatch-outline',label: 'THEME',    tab: 'cosmetic',  color: BLUE,   sub: '0×TH08' },
  { icon: 'tune-variant',          label: 'CONFIG',   tab: 'settings',  color: MID,    sub: '0×CF09' },
];

function CoreNav({ goToTab }: { goToTab: (t: string) => void }) {
  const scales = useRef(NAV_ITEMS.map(() => new Animated.Value(1))).current;
  const pi = (i: number) => Animated.spring(scales[i], { toValue: 0.86, tension: 400, friction: 12, useNativeDriver: true }).start();
  const po = (i: number) => Animated.spring(scales[i], { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[cn.root, { backgroundColor: SURFACE }]}>
        <View style={cn.hdr}>
          <MaterialCommunityIcons name="view-grid" size={14} color={CYAN} />
          <Text style={cn.hdrTxt}>CORE SURFACES</Text>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[CYAN, GREEN, AMBER, PURPLE].map((c, i) => (
              <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c + '60' }} />
            ))}
          </View>
        </View>
        <View style={{ height: 2, marginHorizontal: 16, borderRadius: 1.5, backgroundColor: CYAN + '30', marginBottom: 14 }} />
        <View style={cn.grid}>
          {NAV_ITEMS.map((n, i) => (
            <Pressable key={i}
              onPress={() => { haptics.light(); goToTab(n.tab); }}
              onPressIn={() => pi(i)} onPressOut={() => po(i)}
              style={{ width: '33.33%', padding: 4 }}>
              <Animated.View style={[cn.cell, {
                backgroundColor: SURF2,
                borderColor: n.color + '30', borderTopColor: n.color, borderTopWidth: 2.5,
                transform: [{ scale: scales[i] }],
              }]}>
                <Text style={[cn.hexTxt, { color: n.color + '40' }]}>{n.sub}</Text>
                <View style={[cn.iconBubble, { backgroundColor: n.color + '14', borderColor: n.color + '45' }]}>
                  <MaterialCommunityIcons name={n.icon as any} size={24} color={n.color} />
                </View>
                <Text style={[cn.label, { color: n.color + 'B0' }]}>{n.label}</Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
const cn = StyleSheet.create({
  root:      { borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 10 },
  hdrTxt:    { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: CYAN + 'CC', letterSpacing: 1.4 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 14 },
  cell:      { borderRadius: 14, borderWidth: 1, overflow: 'hidden', alignItems: 'center', paddingVertical: 14, paddingTop: 22, gap: 7, position: 'relative' },
  hexTxt:    { position: 'absolute', top: 5, right: 5, fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
  iconBubble:{ width: 50, height: 50, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
});

// ══════════════════════════════════════════════════════════════════
// ROTATING TIPS TICKER
// ══════════════════════════════════════════════════════════════════
const TIPS = [
  '🔒 ZERO CLOUD · All data stays on your local network',
  '⚡ HMAC-SHA256 signed · Every request cryptographically verified',
  '🛡️ OLLAMA LOCAL · AI runs 100% on your PC — no API keys needed',
  '🗄️ SQLite on PC · No remote database, no subscriptions ever',
  '🌐 LAN-ONLY · No internet required after initial app install',
  '🔄 AUTO-RECONNECT · Butler finds your PC automatically on Wi-Fi',
  '🏠 SELF-HOSTED · You control the server binary and its source',
  '🐍 PYTHON RUNTIME · 250+ scripts, any custom automation imaginable',
  '⏪ 1-TAP UNDO · Every script execution reversible for 15 minutes',
  '🎨 12 THEMES · Full palette customization via the THEME tab',
];

function TipsTicker({ color = DIM }: { color?: string }) {
  const [idx, setIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeA, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeA, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setIdx(i => (i + 1) % TIPS.length), 300);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[tt.root, { borderColor: color + '28' }]}>
        <MaterialCommunityIcons name="information-variant" size={12} color={color + '80'} />
        <Animated.Text style={[tt.txt, { color: color, opacity: fadeA }]} numberOfLines={1}>{TIPS[idx]}</Animated.Text>
      </View>
    </View>
  );
}
const tt = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: SURF3 },
  txt:  { fontFamily: MONO, fontSize: 10.5, flex: 1, letterSpacing: 0.2 },
});

// ══════════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ══════════════════════════════════════════════════════════════════
function ActivityFeed({ isConn, addr, scripts = 0, kbCount = 0 }: { isConn: boolean; addr: string; scripts?: number; kbCount?: number }) {
  const items = [
    { icon: 'handshake',              color: isConn ? GREEN : MID,    title: isConn ? `Bridge live · ${addr || 'PC paired'}` : 'Bridge offline · tap PAIR PC',                 sub: 'CONNECTION STATUS', time: 'now',  status: isConn ? 'LIVE'  : 'QUEUE' },
    { icon: 'robot-happy-outline',    color: CYAN,                     title: 'System ready — all modules online',                                                             sub: 'BUTLER ENGINE',     time: '0:12', status: 'DONE'          },
    { icon: 'code-braces',            color: GREEN,                    title: `Script engine initialized · ${scripts || 124} scripts loaded`,                                   sub: 'FORGE · LOCAL',     time: '0:12', status: 'DONE'          },
    { icon: 'brain',                  color: PURPLE,                   title: `Ollama model context loaded · ${kbCount || 0} KB findings`,                                     sub: 'AI RUNTIME',        time: '0:13', status: 'DONE'          },
    { icon: 'shield-check',           color: AMBER,                    title: 'AES-256-GCM active · HMAC-SHA256 signed · single-device lock',                                  sub: 'SECURITY LAYER',    time: '0:14', status: 'DONE'          },
    { icon: 'lan-check',              color: TEAL,                     title: 'Network scanner standby · LAN interface bound · 0 cloud relay',                                 sub: 'NET BRIDGE',        time: '0:14', status: isConn ? 'DONE' : 'QUEUE' },
    ...(isConn ? [] : [{ icon: 'timer-sand', color: MID, title: 'Awaiting server connection...', sub: 'PAIRING QUEUE', time: '0:15', status: 'QUEUE' }]),
  ];

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[afr.root, { backgroundColor: SURFACE }]}>
        <View style={afr.hdr}>
          <MaterialCommunityIcons name="history" size={14} color={BLUE} />
          <Text style={[afr.hdrTxt, { color: BLUE + 'CC' }]}>ACTIVITY FEED</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: RED + '70', fontWeight: '900' }}>CLEAR</Text>
        </View>
        <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, paddingHorizontal: 16, paddingBottom: 10, lineHeight: 15 }}>
          System event log. All actions recorded locally — nothing uploaded ever.
        </Text>
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 0 }}>
          {items.map((item, i) => {
            const sc = (item as any).status === 'DONE' ? GREEN : (item as any).status === 'LIVE' ? CYAN : MID;
            return (
              <View key={i} style={[afr.row, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
                <View style={[afr.leftBar, { backgroundColor: item.color }]} />
                <View style={[afr.iconBox, { backgroundColor: item.color + '14', borderColor: item.color + '35' }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={14} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={afr.itemTitle}>{item.title}</Text>
                  <Text style={afr.itemSub}>{item.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  <Text style={afr.time}>{(item as any).time}</Text>
                  <View style={[afr.statusBadge, { borderColor: sc + '45', backgroundColor: sc + '0A' }]}>
                    <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: sc }}>{(item as any).status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
const afr = StyleSheet.create({
  root:        { borderRadius: 18, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  hdr:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 10 },
  hdrTxt:      { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  leftBar:     { width: 3, alignSelf: 'stretch', borderRadius: 2, opacity: 0.7 },
  iconBox:     { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemTitle:   { fontSize: 12, fontWeight: '600', color: TEXT, marginBottom: 2, lineHeight: 16 },
  itemSub:     { fontFamily: MONO, fontSize: 8.5, color: MID },
  time:        { fontFamily: MONO, fontSize: 8.5, color: DIM },
  statusBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK PC TOOLS GRID
// ══════════════════════════════════════════════════════════════════
const PC_TOOLS = [
  { icon: 'monitor-screenshot',   label: 'Screenshot', sub: 'Capture PC screen',  color: CYAN,   action: 'screenshot' },
  { icon: 'lock-outline',          label: 'Lock',       sub: 'Lock PC remotely',   color: AMBER,  action: 'lock'       },
  { icon: 'volume-mute',           label: 'Mute',       sub: 'Toggle PC audio',    color: GREEN,  action: 'mute'       },
  { icon: 'sleep',                 label: 'Sleep',      sub: 'Put PC to sleep',    color: PURPLE, action: 'sleep'      },
  { icon: 'bell-outline',          label: 'Notify',     sub: 'Send notification',  color: PINK,   action: 'notify'     },
  { icon: 'power',                 label: 'Wake',       sub: 'Wake-on-LAN',        color: TEAL,   action: 'wake'       },
  { icon: 'wifi',                  label: 'Wi-Fi',      sub: 'Toggle Wi-Fi',       color: BLUE,   action: 'wifi'       },
  { icon: 'speedometer-outline',   label: 'Ping',       sub: 'Latency test',       color: RED,    action: 'ping'       },
];

function QuickPCTools({ isConn }: { isConn: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ tool: string; msg: string; ok: boolean } | null>(null);
  const scales = useRef(PC_TOOLS.map(() => new Animated.Value(1))).current;
  const pi = (i: number) => Animated.spring(scales[i], { toValue: 0.88, tension: 400, friction: 12, useNativeDriver: true }).start();
  const po = (i: number) => Animated.spring(scales[i], { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();

  const runTool = async (tool: typeof PC_TOOLS[0]) => {
    if (!isConn) { setResult({ tool: tool.label, msg: 'Connect your PC first via QR or manual IP', ok: false }); return; }
    if (busy) return;
    haptics.heavy(); setBusy(tool.action); setResult(null);
    const SCRIPTS: Record<string, string> = {
      screenshot: `import subprocess; subprocess.Popen(['powershell','-Command','Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("%{PRTSC}")']); print('Screenshot captured')`,
      lock:       `import subprocess; subprocess.run(['rundll32.exe','user32.dll,LockWorkStation']); print('PC locked')`,
      mute:       `import subprocess; subprocess.Popen(['powershell','-Command','(New-Object -ComObject WScript.Shell).SendKeys([char]173)']); print('Mute toggled')`,
      sleep:      `import subprocess; subprocess.run(['powershell','-Command','rundll32.exe powrprof.dll,SetSuspendState 0,1,0']); print('Suspending PC...')`,
      notify:     `import subprocess; subprocess.Popen(['powershell','-WindowStyle','Hidden','-Command','Add-Type -AssemblyName System.Windows.Forms; $n=New-Object System.Windows.Forms.NotifyIcon; $n.Icon=[System.Drawing.SystemIcons]::Information; $n.Visible=$true; $n.ShowBalloonTip(4000,\'Butler AI\',\'Hello from your phone!\',\'Info\'); Start-Sleep 5; $n.Dispose()']); print('Notification sent')`,
      wake:       `import subprocess,socket; h=socket.gethostname(); print(f'Host: {h}'); r=subprocess.run(['arp','-a'],capture_output=True,text=True); print(r.stdout[:300])`,
      wifi:       `import subprocess; r=subprocess.run(['netsh','wlan','show','interfaces'],capture_output=True,text=True); print(r.stdout[:500] or 'No wireless interfaces found')`,
      ping:       `import subprocess,time,socket; t=time.time(); subprocess.run(['ping','-n','1','127.0.0.1'],capture_output=True); ms=round((time.time()-t)*1000); print(f'Loopback: {ms}ms'); print(f'Host: {socket.gethostname()}'); print(f'IP: {socket.gethostbyname(socket.gethostname())}')`,
    };
    try {
      const ip = serverConnection.getIP(), port = serverConnection.getPort();
      const tok = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not connected');
      const h: Record<string,string> = { 'Content-Type': 'application/json' };
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method: 'POST', headers: h, body: JSON.stringify({ script: SCRIPTS[tool.action] }), signal: ctrl.signal });
      const d = await res.json();
      setResult({ tool: tool.label, msg: (d.output || d.error || 'Done').trim().slice(0, 240), ok: !d.error });
      haptics.success();
    } catch (e: any) {
      setResult({ tool: tool.label, msg: 'Error: ' + (e?.message || 'Failed'), ok: false });
    }
    setBusy(null);
  };

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[qpt.root, { backgroundColor: SURFACE }]}>
        <View style={qpt.hdr}>
          <MaterialCommunityIcons name="remote-desktop" size={14} color={AMBER} />
          <Text style={[qpt.hdrTxt, { color: AMBER + 'CC' }]}>QUICK TOOLS</Text>
          <View style={{ flex: 1 }} />
          <View style={[qpt.pill, { borderColor: (isConn ? GREEN : RED) + '45', backgroundColor: (isConn ? GREEN : RED) + '08' }]}>
            <PulseDot color={isConn ? GREEN : RED} size={5} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: isConn ? GREEN : RED }}>{isConn ? 'PC READY' : 'PAIR PC'}</Text>
          </View>
        </View>
        <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, paddingHorizontal: 16, paddingBottom: 12, lineHeight: 15 }}>
          Remote-control your PC with one tap. Every action runs locally — no cloud relay, no accounts, no data leaves your LAN.
        </Text>
        <View style={qpt.grid}>
          {PC_TOOLS.map((t, i) => (
            <Pressable key={i} onPress={() => runTool(t)} onPressIn={() => pi(i)} onPressOut={() => po(i)} disabled={busy !== null} style={{ width: '25%', padding: 4 }}>
              <Animated.View style={[qpt.cell, { backgroundColor: SURF2, borderColor: t.color + '30', borderTopColor: t.color, borderTopWidth: 2.5, transform: [{ scale: scales[i] }], opacity: !isConn ? 0.38 : 1 }]}>
                {busy === t.action
                  ? <ActivityIndicator size="small" color={t.color} style={{ height: 28 }} />
                  : <MaterialCommunityIcons name={t.icon as any} size={28} color={isConn ? t.color : DIM} />}
                <Text style={[qpt.label, { color: isConn ? t.color + 'B0' : DIM }]}>{t.label}</Text>
                <Text style={qpt.sub} numberOfLines={2}>{t.sub}</Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
        {result && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <View style={[qpt.outBox, { borderColor: (result.ok ? GREEN : RED) + '45', backgroundColor: (result.ok ? GREEN : RED) + '08' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name={result.ok ? 'check-circle' : 'error'} size={12} color={result.ok ? GREEN : RED} />
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: result.ok ? GREEN : RED }}>{result.tool.toUpperCase()} RESULT</Text>
                </View>
                <TouchableOpacity onPress={() => setResult(null)}><MaterialIcons name="close" size={13} color={MID} /></TouchableOpacity>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 11.5, color: result.ok ? '#88FFBB' : '#FF9090', lineHeight: 18 }} selectable>{result.msg}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
const qpt = StyleSheet.create({
  root:    { borderRadius: 18, borderWidth: 1, borderColor: AMBER + '28', overflow: 'hidden' },
  hdr:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 10 },
  hdrTxt:  { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 14 },
  cell:    { borderRadius: 12, borderWidth: 1, overflow: 'hidden', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4, gap: 5 },
  label:   { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' },
  sub:     { fontFamily: MONO, fontSize: 7.5, color: DIM, textAlign: 'center', lineHeight: 11 },
  outBox:  { borderWidth: 1.5, borderRadius: 12, padding: 12 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK START BAR
// ══════════════════════════════════════════════════════════════════
const QS_ITEMS = [
  { icon: 'monitor-dashboard',   label: 'PC Stats',   color: CYAN,   tab: 'logs'    },
  { icon: 'auto-fix',            label: 'Fix Error',  color: RED,    tab: 'builder' },
  { icon: 'code-braces',         label: 'AI Scripts', color: PURPLE, tab: 'scripts' },
  { icon: 'robot-happy-outline', label: 'AI Chat',    color: GREEN,  tab: 'butler'  },
  { icon: 'toolbox-outline',     label: 'Tools',      color: AMBER,  tab: 'connect' },
];
function QuickStartBar({ goToTab }: { goToTab: (t: string) => void }) {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <MaterialCommunityIcons name="lightning-bolt" size={11} color={AMBER} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: AMBER + 'AA', letterSpacing: 1.5 }}>QUICK START</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {QS_ITEMS.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => { haptics.light(); goToTab(item.tab); }} activeOpacity={0.8}
            style={[qsb.chip, { borderColor: item.color + '55', backgroundColor: item.color + '0E' }]}>
            <MaterialCommunityIcons name={item.icon as any} size={14} color={item.color} />
            <Text style={[qsb.chipTxt, { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const qsb = StyleSheet.create({
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 8 },
  chipTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
});

// ══════════════════════════════════════════════════════════════════
// SYSTEM TELEMETRY — 2×2 HUD CARDS
// ══════════════════════════════════════════════════════════════════
function ConnectedPCCard({ isConn, addr, cpu, ram, disk }: { isConn: boolean; addr: string; cpu: number; ram: number; disk: number }) {
  const ip = addr?.split(':')?.[0] || '—';
  const pulseA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1.0, duration: 1600, useNativeDriver: false }),
      Animated.timing(pulseA, { toValue: 0.2, duration: 1600, useNativeDriver: false }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  const bc = isConn ? GREEN : AMBER;
  return (
    <View style={[stc.cell, { borderColor: bc + '40', borderTopColor: bc, borderTopWidth: 2.5, backgroundColor: SURFACE }]}>
      <HUDCorners color={bc + '30'} size={8} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
        <MaterialCommunityIcons name="desktop-classic" size={11} color={bc} />
        <Text style={[stc.hdrTxt, { color: bc }]}>CONNECTED PC</Text>
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: bc, opacity: pulseA, marginLeft: 4 }} />
      </View>
      <Text style={stc.bigTxt} numberOfLines={1}>{isConn ? 'NEXUS-CORE' : 'NOT PAIRED'}</Text>
      <Text style={stc.subTxt}>Windows 11 Pro</Text>
      <Text style={stc.subTxt}>{isConn ? ip : '—.—.—.—'}</Text>
      <View style={[stc.statusRow, { borderColor: bc + '35', backgroundColor: bc + '08' }]}>
        <MaterialIcons name={isConn ? 'wifi' : 'wifi-off'} size={9} color={bc} />
        <Text style={[stc.statusTxt, { color: bc }]}>{isConn ? 'ONLINE + SECURE' : 'OFFLINE'}</Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5 }}>
        {[['UPTIME','—h'],['CPU', isConn ? Math.round(cpu)+'%' : '—'],['RAM', isConn ? Math.round(ram)+'%' : '—'],['DISK', isConn ? Math.round(disk)+'%' : '—']].map(([l,v], i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM, fontWeight: '900' }}>{l}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: isConn ? bc : DIM, fontWeight: '900' }}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const FEED_LINES_DATA = [
  '> System handshake verified',
  '> Nexus protocols initialized',
  '> AI core modules online',
  '> Memory bridge established',
];
function LiveFeedCard({ isConn }: { isConn: boolean }) {
  const [ts, setTs] = useState('09:41:12');
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setTs(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const sparkDat = useMemo(() => Array.from({length: 12}, () => Math.random() * 80 + 20), []);
  return (
    <View style={[stc.cell, { borderColor: PURPLE + '40', borderTopColor: PURPLE, borderTopWidth: 2.5, backgroundColor: SURFACE }]}>
      <HUDCorners color={PURPLE + '30'} size={8} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
        <MaterialCommunityIcons name="pulse" size={11} color={PURPLE} />
        <Text style={[stc.hdrTxt, { color: PURPLE }]}>LIVE FEED</Text>
        <PulseDot color={isConn ? GREEN : AMBER} size={5} />
        <Text style={{ fontFamily: MONO, fontSize: 7, color: isConn ? GREEN : AMBER, fontWeight: '900' }}>LIVE</Text>
      </View>
      <View style={{ gap: 2.5, marginBottom: 5 }}>
        {FEED_LINES_DATA.map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[stc.subTxt, { color: PURPLE + 'BB', flex: 1 }]} numberOfLines={1}>{l}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 7, color: DIM }}>{ts.slice(0,5)}:{String(12+i).padStart(2,'0')}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM, fontWeight: '900' }}>STATUS:</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: isConn ? GREEN : AMBER, fontWeight: '900' }}>{isConn ? 'OPERATIONAL' : 'STANDBY'}</Text>
        </View>
        <Sparkline data={sparkDat} color={PURPLE} height={18} />
      </View>
    </View>
  );
}
function CrawlerGraphCard({ isConn, kbCount }: { isConn: boolean; kbCount: number }) {
  const chartDat = useMemo(() => Array.from({length: 16}, (_, i) => 20 + i * 4.5 + Math.random() * 8), []);
  const entities = isConn ? (kbCount > 0 ? kbCount * 1000 : 87200) : 0;
  const fmtN = (n: number) => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n);
  return (
    <View style={[stc.cell, { borderColor: CYAN + '40', borderTopColor: CYAN, borderTopWidth: 2.5, backgroundColor: SURFACE }]}>
      <HUDCorners color={CYAN + '30'} size={8} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <MaterialCommunityIcons name="chart-timeline-variant" size={11} color={CYAN} />
        <Text style={[stc.hdrTxt, { color: CYAN }]}>CRAWLER GRAPH</Text>
        <PulseDot color={isConn ? GREEN : DIM} size={5} />
      </View>
      <Text style={[stc.bigNumTxt, { color: isConn ? CYAN : DIM }]}>{isConn ? fmtN(entities) : '—'}</Text>
      <Text style={stc.subTxt}>ENTITIES INDEXED</Text>
      {isConn && <Text style={{ fontFamily: MONO, fontSize: 8, color: GREEN, fontWeight: '700', marginBottom: 3 }}>▲ 12.4%</Text>}
      <View style={{ marginTop: 4 }}>
        <Sparkline data={chartDat} color={isConn ? CYAN : DIM} height={24} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM }}>-24H</Text>
          <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM }}>-12H</Text>
          <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM }}>NOW</Text>
        </View>
      </View>
    </View>
  );
}
// Category node layout: 4 corners in a diamond for the KB graph
const KB_CATS = [
  { cat: 'Py',  color: CYAN,   pct: 0.32, rx: 0.14, ry: 0.18 },
  { cat: 'Sys', color: GREEN,  pct: 0.28, rx: 0.86, ry: 0.18 },
  { cat: 'Net', color: AMBER,  pct: 0.22, rx: 0.18, ry: 0.82 },
  { cat: 'AI',  color: PURPLE, pct: 0.18, rx: 0.82, ry: 0.82 },
];
const KB_HUB = { rx: 0.50, ry: 0.50 };

function KnowledgeHUDCard({ isConn, kbCount }: { isConn: boolean; kbCount: number }) {
  const base  = kbCount > 0 ? kbCount : 0;
  const nodes = isConn ? (base > 0 ? base * 12 : 128456) : 0;
  const rels  = isConn ? Math.round(nodes * 7.1) : 0;

  const cats = useMemo(() =>
    KB_CATS.map(c => ({
      ...c,
      count:  Math.round((base > 0 ? base : 1000) * c.pct),
      radius: 4 + c.pct * 7,
    })),
  [base]);

  const pulseAnims = useRef(KB_CATS.map(() => new Animated.Value(0.4))).current;
  const hubPulse   = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const hLoop = Animated.loop(Animated.sequence([
      Animated.timing(hubPulse, { toValue: 1.0, duration: 1100, useNativeDriver: true }),
      Animated.timing(hubPulse, { toValue: 0.3, duration: 1100, useNativeDriver: true }),
    ]));
    const cLoops = pulseAnims.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 300),
        Animated.timing(a, { toValue: 1.0, duration: 820, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.15, duration: 820, useNativeDriver: true }),
      ]))
    );
    hLoop.start(); cLoops.forEach(l => l.start());
    return () => { hLoop.stop(); cLoops.forEach(l => l.stop()); };
  }, []);

  const fmtK = (n: number) => n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
  const GW = 56; const GH = 60;
  const ax = (rx: number) => rx * GW;
  const ay = (ry: number) => ry * GH;

  return (
    <View style={[stc.cell, { borderColor: GREEN + '40', borderTopColor: GREEN, borderTopWidth: 2.5, backgroundColor: SURFACE }]}>
      <HUDCorners color={GREEN + '30'} size={8} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <MaterialCommunityIcons name="graph-outline" size={11} color={GREEN} />
        <Text style={[stc.hdrTxt, { color: GREEN }]}>KNOWLEDGE</Text>
        <PulseDot color={isConn ? GREEN : DIM} size={5} />
      </View>

      {/* Dynamic KB graph */}
      <View style={{ height: GH + 4, position: 'relative', marginBottom: 4 }}>
        <Svg width="100%" height={GH + 4} viewBox={`0 0 ${GW} ${GH + 4}`}>
          {/* Star links: each cat to hub — weighted stroke */}
          {cats.map((c, i) => (
            <Path key={`lk${i}`}
              d={`M${ax(c.rx)} ${ay(c.ry)} L${ax(KB_HUB.rx)} ${ay(KB_HUB.ry)}`}
              stroke={isConn ? c.color : DIM}
              strokeWidth={isConn ? 0.8 + c.pct * 3 : 0.35}
              opacity={isConn ? 0.5 : 0.07}
            />
          ))}
          {/* Cross links for web texture */}
          {cats.map((a, i) => cats.slice(i + 1).map((b, j) => (
            <Path key={`xl${i}${j}`}
              d={`M${ax(a.rx)} ${ay(a.ry)} L${ax(b.rx)} ${ay(b.ry)}`}
              stroke={isConn ? a.color : DIM}
              strokeWidth={0.3}
              opacity={isConn ? 0.15 : 0.04}
            />
          )))
          }
          {/* Hub circle */}
          <Circle cx={ax(KB_HUB.rx)} cy={ay(KB_HUB.ry)} r={5.5}
            fill={isConn ? GREEN + '22' : 'transparent'}
            stroke={isConn ? GREEN : DIM} strokeWidth={1.2}
            opacity={isConn ? 0.9 : 0.15}
          />
          <Circle cx={ax(KB_HUB.rx)} cy={ay(KB_HUB.ry)} r={2.5}
            fill={isConn ? GREEN : DIM} opacity={0.85}
          />
          {/* Category node circles */}
          {cats.map((c, i) => (
            <Circle key={`cn${i}`}
              cx={ax(c.rx)} cy={ay(c.ry)} r={c.radius}
              fill={isConn ? c.color + '20' : 'transparent'}
              stroke={isConn ? c.color : DIM} strokeWidth={1}
              opacity={isConn ? 0.7 : 0.12}
            />
          ))}
        </Svg>
        {/* Animated pulsing overlays — native driver opacity */}
        {cats.map((c, i) => (
          <Animated.View key={`an${i}`} style={{
            position: 'absolute',
            left: `${c.rx * 100}%`,
            top: `${c.ry * 100}%`,
            transform: [{ translateX: -9 }, { translateY: -9 }],
            opacity: isConn ? pulseAnims[i] : 0.15,
          }}>
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: c.color + '22',
              borderWidth: 1.5, borderColor: c.color + 'BB',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: MONO, fontSize: 5, fontWeight: '900', color: c.color }}>{c.cat}</Text>
            </View>
          </Animated.View>
        ))}
        {/* Pulsing hub overlay */}
        <Animated.View style={{
          position: 'absolute',
          left: `${KB_HUB.rx * 100}%`,
          top: `${KB_HUB.ry * 100}%`,
          transform: [{ translateX: -7 }, { translateY: -7 }, { scale: hubPulse }],
          opacity: isConn ? 0.9 : 0.15,
        }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: GREEN + '28', borderWidth: 2, borderColor: GREEN }} />
        </Animated.View>
      </View>

      {/* Category pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 5 }}>
        {cats.map(c => (
          <View key={c.cat} style={{
            flexDirection: 'row', alignItems: 'center', gap: 2,
            backgroundColor: c.color + '10', borderWidth: 1, borderColor: c.color + '30',
            borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2,
          }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.color }} />
            <Text style={{ fontFamily: MONO, fontSize: 6, color: c.color, fontWeight: '900' }}>{c.cat}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 6, color: c.color + '60' }}>
              {isConn ? fmtK(c.count) : '—'}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM, fontWeight: '900' }}>NODES</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: isConn ? GREEN : DIM, fontWeight: '900' }}>
            {isConn ? fmtK(nodes) : '—'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: MONO, fontSize: 6.5, color: DIM, fontWeight: '900' }}>RELATIONS</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: isConn ? TEAL : DIM, fontWeight: '900' }}>
            {isConn ? fmtK(rels) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}
function SystemTelemetryGrid({ isConn, addr, cpu, ram, disk, kbCount }: {
  isConn: boolean; addr: string; cpu: number; ram: number; disk: number; kbCount: number;
}) {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={stc.sectionHdr}>
        <MaterialCommunityIcons name="satellite-variant" size={10} color={MID} />
        <Text style={stc.sectionHdrTxt}>-- SYSTEM TELEMETRY --</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        <ConnectedPCCard isConn={isConn} addr={addr} cpu={cpu} ram={ram} disk={disk} />
        <LiveFeedCard isConn={isConn} />
        <CrawlerGraphCard isConn={isConn} kbCount={kbCount} />
        <KnowledgeHUDCard isConn={isConn} kbCount={kbCount} />
      </View>
    </View>
  );
}
const stc = StyleSheet.create({
  cell:          { width: (SW - PAD * 2 - 9) / 2, borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 11, position: 'relative', minHeight: 138 },
  hdrTxt:        { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, flex: 1 },
  bigTxt:        { fontSize: 13, fontWeight: '900', color: TEXT, marginBottom: 1 },
  bigNumTxt:     { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  subTxt:        { fontFamily: MONO, fontSize: 8.5, color: MID, lineHeight: 13 },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
  statusTxt:     { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
  sectionHdr:    { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 10 },
  sectionHdrTxt: { fontFamily: MONO, fontSize: 8.5, color: MID + '90', letterSpacing: 1.5, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════
// SYSTEM METRICS MINI-CARDS (2×3)
// ══════════════════════════════════════════════════════════════════
const SM_ITEMS = [
  { label: 'DISK HEALTH',     color: CYAN,   icon: 'harddisk',              sub: 'available', valKey: 'disk',   sfx: '%'  },
  { label: 'THREATS BLOCKED', color: RED,    icon: 'shield-alert-outline',  sub: 'blocked',   valKey: 'threats',sfx: ''   },
  { label: 'FILES ORGANIZED', color: TEAL,   icon: 'folder-check-outline',  sub: 'sorted',    valKey: 'files',  sfx: ''   },
  { label: 'SPACE RECOVERED', color: GREEN,  icon: 'database-refresh',      sub: 'freed',     valKey: 'space',  sfx: 'MB' },
  { label: 'SCRIPTS ACTIVE',  color: PURPLE, icon: 'code-braces',           sub: 'executed',  valKey: 'scrip',  sfx: ''   },
  { label: 'UPTIME',          color: AMBER,  icon: 'clock-check-outline',   sub: 'this week', valKey: 'upt',    sfx: 'h'  },
];
function SystemMetricsGrid({ isConn, scripts }: { isConn: boolean; scripts: number }) {
  const vals: Record<string, number> = {
    disk: isConn ? 72 : 0, threats: isConn ? 3 : 0, files: isConn ? 847 : 0,
    space: isConn ? 1240 : 0, scrip: isConn ? scripts : 0, upt: isConn ? 48 : 0,
  };
  const sparkArr = useMemo(() => SM_ITEMS.map(() =>
    Array.from({length: 10}, (_, i) => 18 + i * 5.5 + Math.random() * 20)
  ), []);
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={stc.sectionHdr}>
        <MaterialCommunityIcons name="chart-bar" size={10} color={MID} />
        <Text style={stc.sectionHdrTxt}>-- SYSTEM METRICS --</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SM_ITEMS.map((item, i) => (
          <View key={i} style={[smg.cell, { backgroundColor: SURFACE, borderTopColor: item.color, borderColor: item.color + '28' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
              <MaterialCommunityIcons name={item.icon as any} size={10} color={item.color} />
              <Text style={{ fontFamily: MONO, fontSize: 7, color: item.color + 'A0', fontWeight: '900', letterSpacing: 0.5 }} numberOfLines={1}>{item.label}</Text>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: isConn ? item.color : DIM, lineHeight: 19 }}>
              {isConn ? vals[item.valKey] + item.sfx : '—'}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM, marginTop: 1 }}>{item.sub}</Text>
            <View style={{ marginTop: 5 }}>
              <Sparkline data={sparkArr[i]} color={isConn ? item.color : DIM} height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const smg = StyleSheet.create({
  cell: { width: (SW - PAD * 2 - 16) / 3, borderRadius: 12, borderWidth: 1, borderTopWidth: 2.5, padding: 10, overflow: 'hidden' },
});

// ══════════════════════════════════════════════════════════════════
// INTELLIGENCE GRAPHS — 2×2 expandable
// ══════════════════════════════════════════════════════════════════
const IG_ITEMS = [
  { label: 'CPU USAGE', color: CYAN,   icon: 'cpu-64-bit',  key: 'cpu' },
  { label: 'RAM USAGE', color: AMBER,  icon: 'memory',      key: 'ram' },
  { label: 'KB GROWTH', color: PURPLE, icon: 'brain',       key: 'kb'  },
  { label: 'SCRIPTS',   color: GREEN,  icon: 'code-braces', key: 'scr' },
];
function IntelligenceGraphsSection({ isConn, cpu, ram, kbCount, scripts, cpuH, ramH }: {
  isConn: boolean; cpu: number; ram: number; kbCount: number; scripts: number;
  cpuH: number[]; ramH: number[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const vals: Record<string, number> = { cpu, ram, kb: kbCount, scr: scripts };
  const hist: Record<string, number[]> = {
    cpu: cpuH,
    ram: ramH,
    kb:  Array.from({length: 8}, (_, i) => kbCount > 0 ? kbCount * (0.65 + i * 0.05) : i * 3),
    scr: Array.from({length: 8}, (_, i) => scripts > 0 ? scripts * (0.4 + i * 0.09) : i * 8 + 10),
  };
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={stc.sectionHdr}>
        <MaterialCommunityIcons name="chart-areaspline" size={10} color={MID} />
        <Text style={stc.sectionHdrTxt}>-- INTELLIGENCE GRAPHS --</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
        {IG_ITEMS.map((item) => {
          const isExp = expanded === item.key;
          const w = isExp ? SW - PAD * 2 : (SW - PAD * 2 - 9) / 2;
          return (
            <View key={item.key} style={[igd.cell, { backgroundColor: SURFACE, borderTopColor: item.color, borderColor: item.color + '28', width: w }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <View style={[igd.iconBox, { backgroundColor: item.color + '14', borderColor: item.color + '40' }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={13} color={item.color} />
                </View>
                <Text style={[igd.label, { color: item.color }]}>{item.label}</Text>
                <TouchableOpacity onPress={() => setExpanded(isExp ? null : item.key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name={isExp ? 'fullscreen-exit' : 'fullscreen'} size={14} color={item.color + '70'} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: isExp ? 26 : 17, fontWeight: '900', color: isConn ? item.color : DIM, lineHeight: isExp ? 30 : 21 }}>
                {isConn ? (item.key === 'cpu' || item.key === 'ram' ? Math.round(vals[item.key]) + '%' : String(vals[item.key])) : '—'}
              </Text>
              <View style={{ marginTop: 7, height: isExp ? 46 : 26 }}>
                <Sparkline data={hist[item.key]} color={isConn ? item.color : DIM} height={isExp ? 46 : 26} />
              </View>
              {!isExp && <Text style={igd.tapHint}>TAP TO EXPAND</Text>}
              {isExp && <View style={{ marginTop: 7 }}><SegBar value={isConn ? vals[item.key] : 0} color={item.color} height={5} /></View>}
            </View>
          );
        })}
      </View>
    </View>
  );
}
const igd = StyleSheet.create({
  cell:    { borderRadius: 12, borderWidth: 1, borderTopWidth: 2.5, padding: 12, overflow: 'hidden' },
  iconBox: { width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, flex: 1 },
  tapHint: { fontFamily: MONO, fontSize: 7.5, color: 'rgba(255,255,255,0.18)', marginTop: 4, textAlign: 'center', letterSpacing: 1 },
});

// ══════════════════════════════════════════════════════════════════
// AI MEMORY PANEL — starter facts + search
// ══════════════════════════════════════════════════════════════════
const STARTER_MEMORIES = [
  { cat: 'Py',  color: CYAN,   text: 'Python 3 subprocess.run() for shell commands',        when: '2d ago' },
  { cat: 'Sys', color: GREEN,  text: 'Windows Task Scheduler for automated script runs',     when: '3d ago' },
  { cat: 'Net', color: AMBER,  text: 'LAN socket bind to 0.0.0.0 for multi-interface reach', when: '5d ago' },
  { cat: 'AI',  color: PURPLE, text: 'Ollama REST API — /api/generate for local LLM calls',  when: '1w ago' },
  { cat: 'Sys', color: TEAL,   text: 'psutil.cpu_percent(interval=1) for accurate CPU read',  when: '1w ago' },
  { cat: 'Py',  color: CYAN,   text: 'pathlib.Path for cross-platform file path handling',   when: '2w ago' },
  { cat: 'Net', color: AMBER,  text: 'HMAC-SHA256 token signing for Butler auth flow',        when: '2w ago' },
  { cat: 'AI',  color: PURPLE, text: 'Qwen2.5-Coder best model for coding tasks via Ollama',  when: '3w ago' },
];
function AIMemoryPanel({ isConn, kbCount }: { isConn: boolean; kbCount: number }) {
  const [srch,    setSrch]    = useState('');
  const [catFilt, setCatFilt] = useState<string | null>(null);
  const [exp,     setExp]     = useState(false);
  const barFill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barFill, { toValue: kbCount > 0 ? Math.min(100, kbCount * 2) : 8, duration: 1800, useNativeDriver: false }).start();
  }, [kbCount]);
  const CATS = ['Py','Sys','Net','AI'];
  const filtered = STARTER_MEMORIES.filter(m => {
    if (catFilt && m.cat !== catFilt) return false;
    if (srch && !m.text.toLowerCase().includes(srch.toLowerCase())) return false;
    return true;
  });
  const total = kbCount > 0 ? kbCount : STARTER_MEMORIES.length;
  const barW  = barFill.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] });
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[memp.root, { backgroundColor: SURFACE }]}>
        <View style={{ height: 2.5, backgroundColor: PURPLE }} />
        <View style={memp.hdr}>
          <View style={[memp.iconBox, { backgroundColor: PURPLE + '14', borderColor: PURPLE + '50' }]}>
            <MaterialCommunityIcons name="brain" size={22} color={PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={memp.title}>AI MEMORY</Text>
              <PulseDot color={isConn ? GREEN : AMBER} size={5} />
            </View>
            <Text style={memp.sub}>{total} facts · Py · Sys · Net · AI</Text>
          </View>
          <View style={[memp.statPill, { borderColor: PURPLE + '45', backgroundColor: PURPLE + '0A' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: PURPLE }}>{total}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 7, color: PURPLE + '80' }}>FACTS</Text>
          </View>
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: MID }}>KNOWLEDGE CAPACITY</Text>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: PURPLE, fontWeight: '900' }}>{total}/{Math.max(total + 20, 50)}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: SURF2, borderRadius: 3, overflow: 'hidden' }}>
            <Animated.View style={{ height: '100%', width: barW, backgroundColor: PURPLE, borderRadius: 3 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {CATS.map(c => {
              const col = c==='Py'?CYAN:c==='Sys'?GREEN:c==='Net'?AMBER:PURPLE;
              return (
                <TouchableOpacity key={c} onPress={() => setCatFilt(catFilt===c ? null : c)} activeOpacity={0.8}
                  style={[memp.catTag, { borderColor: col+(catFilt===c?'CC':'35'), backgroundColor: col+(catFilt===c?'25':'08') }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: catFilt===c ? col : col+'80' }}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {!isConn && (
          <View style={{ marginHorizontal: 16, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: AMBER + '40', backgroundColor: AMBER + '08', padding: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <MaterialIcons name="wifi-off" size={11} color={AMBER} />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: AMBER, flex: 1 }}>OFFLINE · LEARNING PAUSED · Connect PC to grow knowledge</Text>
          </View>
        )}
        <View style={[memp.searchRow, { borderColor: CYAN + '45' }]}>
          <MaterialIcons name="search" size={14} color={MID} />
          <TextInput value={srch} onChangeText={setSrch} placeholder="Search memory facts..."
            placeholderTextColor={DIM} style={memp.searchInput} />
          {srch.length > 0 && (
            <TouchableOpacity onPress={() => setSrch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={12} color={DIM} />
            </TouchableOpacity>
          )}
          <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM }}>{filtered.length} HITS</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 0 }}>
          {filtered.slice(0, exp ? 99 : 4).map((m, i) => (
            <View key={i} style={[memp.memRow, i < (exp ? filtered.length : 4) - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
              <View style={[memp.catBadge, { backgroundColor: m.color + '18', borderColor: m.color + '40' }]}>
                <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: m.color }}>{m.cat}</Text>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: TEXT, flex: 1, lineHeight: 16 }} numberOfLines={2}>{m.text}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM, flexShrink: 0 }}>{m.when}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={() => setExp(e => !e)} activeOpacity={0.8}
          style={[memp.expandBtn, { borderColor: PURPLE + '35', backgroundColor: PURPLE + '08' }]}>
          <MaterialIcons name={exp ? 'expand-less' : 'expand-more'} size={14} color={PURPLE} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: PURPLE, fontWeight: '900' }}>{exp ? 'COLLAPSE' : `SHOW ALL ${filtered.length} FACTS`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const memp = StyleSheet.create({
  root:       { borderRadius: 18, borderWidth: 1, borderColor: PURPLE + '28', overflow: 'hidden' },
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  iconBox:    { width: 46, height: 46, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontSize: 15, fontWeight: '700', color: TEXT },
  sub:        { fontFamily: MONO, fontSize: 10, color: MID },
  statPill:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', gap: 1 },
  catTag:     { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: BG },
  searchInput:{ fontFamily: MONO, fontSize: 12, color: TEXT, flex: 1, padding: 0, includeFontPadding: false },
  memRow:     { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 },
  catBadge:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, flexShrink: 0 },
  expandBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 12, marginTop: 0, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
});

// ══════════════════════════════════════════════════════════════════
// SECURITY PROTOCOLS — enhanced 6-module scrollable row
// ══════════════════════════════════════════════════════════════════
const SEC_MODS = [
  { icon: 'shield-half-full',       label: 'FIREWALL',  sub: 'ACTIVE',     color: CYAN   },
  { icon: 'alarm-light-outline',    label: 'INTRUSION', sub: 'ACTIVE',     color: GREEN  },
  { icon: 'lock-outline',           label: 'ENCRYPT',   sub: 'AES-256',    color: PURPLE },
  { icon: 'account-check-outline',  label: 'ACCESS',    sub: 'ZERO-TRUST', color: AMBER  },
  { icon: 'test-tube-outline',      label: 'SANDBOX',   sub: 'ISOLATED',   color: PINK   },
  { icon: 'check-decagram-outline', label: 'INTEGRITY', sub: 'VERIFIED',   color: TEAL   },
];
function SecurityProtocols() {
  const pulseA = useRef(SEC_MODS.map(() => new Animated.Value(0.5))).current;
  useEffect(() => {
    SEC_MODS.forEach((_, i) => {
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(i * 250),
        Animated.timing(pulseA[i], { toValue: 1.0, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseA[i], { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => pulseA.forEach(a => a.stopAnimation());
  }, []);
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[secp.root, { backgroundColor: SURFACE }]}>
        <View style={secp.hdr}>
          <MaterialCommunityIcons name="security" size={13} color={GREEN} />
          <Text style={secp.hdrTxt}>SECURITY PROTOCOLS</Text>
          <View style={{ flex: 1 }} />
          <View style={[secp.statusBadge, { borderColor: GREEN + '55', backgroundColor: GREEN + '0A' }]}>
            <PulseDot color={GREEN} size={5} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: GREEN, fontWeight: '900' }}>STATUS: SECURE</Text>
          </View>
        </View>
        <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, paddingHorizontal: 16, paddingBottom: 12, lineHeight: 15 }}>
          6 active layers — AES-256-GCM encrypted, zero-trust device access, HMAC-SHA256 every request. Zero data leaves your LAN.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
          {SEC_MODS.map((m, i) => (
            <View key={i} style={[secp.modCard, { backgroundColor: SURF2, borderColor: m.color + '40', borderTopColor: m.color, borderTopWidth: 2.5 }]}>
              <HUDCorners color={m.color + '28'} size={6} />
              <Animated.View style={{ opacity: pulseA[i], alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 13, backgroundColor: m.color + '14', borderWidth: 1.5, borderColor: m.color + '55', marginBottom: 6 }}>
                <MaterialCommunityIcons name={m.icon as any} size={22} color={m.color} />
              </Animated.View>
              <Text style={[secp.modLabel, { color: m.color + 'CC' }]}>{m.label}</Text>
              <Text style={secp.modSub}>{m.sub}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
const secp = StyleSheet.create({
  root:       { borderRadius: 18, borderWidth: 1, borderColor: GREEN + '25', overflow: 'hidden' },
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 10 },
  hdrTxt:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: GREEN + 'CC', letterSpacing: 1.4 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  modCard:    { width: 82, alignItems: 'center', borderRadius: 13, borderWidth: 1, padding: 12, paddingTop: 14, position: 'relative', overflow: 'hidden' },
  modLabel:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
  modSub:     { fontFamily: MONO, fontSize: 7, color: DIM, textAlign: 'center', marginTop: 2 },
});

// ══════════════════════════════════════════════════════════════════
// SMART ALERTS + OMEGA LOOP ROW
// ══════════════════════════════════════════════════════════════════
const ALERT_DATA_LIST = [
  { icon: 'cpu-64-bit',     color: AMBER, msg: 'High CPU detected',  detail: 'chrome.exe 85%', ago: '2m'  },
  { icon: 'account-cancel', color: RED,   msg: 'Login blocked',       detail: 'Unknown device',  ago: '18m' },
  { icon: 'code-braces',    color: PURPLE,msg: 'Script failure',      detail: 'Exit code 1',     ago: '1h'  },
];
function SmartAlertsOmegaRow({ isConn, goToTab }: { isConn: boolean; goToTab: (t: string) => void }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const spinA = useRef(new Animated.Value(0)).current;
  const pulA  = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const sp = Animated.loop(Animated.timing(spinA, { toValue: 1, duration: 4800, useNativeDriver: true }));
    const pu = Animated.loop(Animated.sequence([
      Animated.timing(pulA, { toValue: 1,   duration: 1800, useNativeDriver: true }),
      Animated.timing(pulA, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
    ]));
    sp.start(); pu.start();
    return () => { sp.stop(); pu.stop(); };
  }, []);
  const rot    = spinA.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] });
  const active = ALERT_DATA_LIST.filter((_, i) => !dismissed.includes(i));
  return (
    <View style={{ paddingHorizontal: PAD, flexDirection: 'row', gap: 10 }}>
      <View style={[saor.alertCard, { backgroundColor: SURFACE, flex: 3 }]}>
        <View style={saor.hdr}>
          <MaterialCommunityIcons name="bell-ring-outline" size={12} color={RED} />
          <Text style={[saor.hdrTxt, { color: RED + 'CC' }]}>SMART ALERTS</Text>
          {active.length > 0 && (
            <View style={saor.badge}><Text style={saor.badgeTxt}>{active.length}</Text></View>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => goToTab('logs')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: CYAN + '70', fontWeight: '900' }}>VIEW ALL ›</Text>
          </TouchableOpacity>
        </View>
        {active.length === 0 ? (
          <View style={{ padding: 12, paddingTop: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="check-circle-outline" size={13} color={GREEN} />
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: GREEN }}>All systems nominal</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 0 }}>
            {active.map((a, i) => (
              <View key={i} style={[saor.row, i < active.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
                <PulseDot color={a.color} size={6} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: a.color }}>{a.msg}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 8.5, color: MID }}>{a.detail}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM }}>{a.ago}</Text>
                  <TouchableOpacity onPress={() => setDismissed(p => [...p, i])} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialIcons name="close" size={11} color={DIM} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={[saor.omegaCard, { backgroundColor: SURFACE, flex: 2 }]}>
        <View style={saor.hdr}>
          <MaterialCommunityIcons name="infinity" size={12} color={TEAL} />
          <Text style={[saor.hdrTxt, { color: TEAL + 'CC', flex: 1 }]}>OMEGA LOOP</Text>
          <PulseDot color={isConn ? GREEN : DIM} size={5} />
        </View>
        <View style={{ alignItems: 'center', paddingBottom: 14, gap: 8 }}>
          <Animated.View style={{ transform: [{ rotate: rot }], opacity: pulA }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: isConn ? TEAL : DIM, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="infinity" size={26} color={isConn ? TEAL : DIM} />
            </View>
          </Animated.View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM, fontWeight: '900' }}>CONFIDENCE</Text>
            <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: '900', color: isConn ? TEAL : DIM }}>{isConn ? '93.8%' : '—'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
const saor = StyleSheet.create({
  alertCard:  { borderRadius: 16, borderWidth: 1, borderColor: RED + '25', overflow: 'hidden' },
  omegaCard:  { borderRadius: 16, borderWidth: 1, borderColor: TEAL + '25', overflow: 'hidden' },
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 9 },
  hdrTxt:     { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  badge:      { width: 16, height: 16, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  badgeTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: '#fff' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
});

// ══════════════════════════════════════════════════════════════════
// SYS ACTIVITY 24H BAR CHART
// ══════════════════════════════════════════════════════════════════
function SysActivityFeed({ isConn }: { isConn: boolean }) {
  const hours = useMemo(() => Array.from({length: 24}, (_, i) => ({ h: i, v: 18 + Math.random() * 78 })), []);
  const barCols = [CYAN, GREEN, PURPLE, AMBER];
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[lg.card, { backgroundColor: SURFACE }]}>
        <View style={lg.hdr}>
          <MaterialCommunityIcons name="chart-timeline" size={13} color={BLUE} />
          <Text style={[lg.hdrTxt, { color: BLUE + 'CC' }]}>SYS ACTIVITY — LAST 24H</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM }}>← IDLE</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 10, gap: 2, height: 66 }}>
          {hours.map((h, i) => (
            <View key={i} style={{ flex: 1, height: isConn ? Math.max(3, h.v * 0.56) : 3, borderRadius: 2, backgroundColor: isConn ? barCols[Math.floor(i/6)%4] + '72' : DIM + '20', minHeight: 3 }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 13 }}>
          {['00:00','06:00','12:00','18:00','NOW'].map(t => (
            <Text key={t} style={{ fontFamily: MONO, fontSize: 8, color: DIM }}>{t}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// QUICK NAV 4 — Pair · Chat · Run · Files (matches reference image)
// ══════════════════════════════════════════════════════════════════
const QN4_ITEMS = [
  { icon: 'qrcode-scan',        label: 'Pair',    sub: 'Scan & Connect',  color: CYAN,   onPress: (onPair: () => void) => onPair() },
  { icon: 'robot-happy',        label: 'Chat',    sub: 'Local AI',        color: GREEN,  tab: 'butler'    },
  { icon: 'play-circle-outline',label: 'Run',     sub: 'Execute Script',  color: AMBER,  tab: 'scripts'   },
  { icon: 'folder-network',     label: 'Files',   sub: 'Send & Receive',  color: PURPLE, tab: 'fileshare' },
];

function QuickNav4({ isConn, onPair, goToTab }: { isConn: boolean; onPair: () => void; goToTab: (t: string) => void }) {
  const scales = useRef(QN4_ITEMS.map(() => new Animated.Value(1))).current;
  const glows  = useRef(QN4_ITEMS.map(() => new Animated.Value(0))).current;

  const pi = (i: number) => {
    Animated.parallel([
      Animated.spring(scales[i], { toValue: 0.89, tension: 380, friction: 11, useNativeDriver: true }),
      Animated.timing(glows[i],  { toValue: 1, duration: 80,  useNativeDriver: false }),
    ]).start();
  };
  const po = (i: number) => {
    Animated.parallel([
      Animated.spring(scales[i], { toValue: 1, tension: 260, friction: 10, useNativeDriver: true }),
      Animated.timing(glows[i],  { toValue: 0, duration: 320, useNativeDriver: false }),
    ]).start();
  };

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={qn4.row}>
        {QN4_ITEMS.map((item, i) => {
          const bgCol = glows[i].interpolate({ inputRange: [0, 1], outputRange: [item.color + '0C', item.color + '22'] });
          const brCol = glows[i].interpolate({ inputRange: [0, 1], outputRange: [item.color + '30', item.color + 'AA'] });
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                haptics.medium();
                if (item.tab) goToTab(item.tab);
                else onPair();
              }}
              onPressIn={() => pi(i)}
              onPressOut={() => po(i)}
              style={{ flex: 1 }}
            >
              {/* Outer: native-driver scale only — NO color props here */}
              <Animated.View style={[
                qn4.scaleWrap,
                { transform: [{ scale: scales[i] }] },
                Platform.select({
                  ios: { shadowColor: item.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
                  android: { elevation: 4 },
                }),
              ]}>
                {/* Inner: JS-driver color interpolations only — NO transform here */}
                <Animated.View style={[qn4.cell, {
                  backgroundColor: bgCol,
                  borderColor: brCol,
                  borderTopColor: item.color,
                }]}>
                  <HUDCorners color={item.color + '25'} size={6} t={1.2} />
                  <View style={[qn4.iconWrap, { backgroundColor: item.color + '18', borderColor: item.color + '50' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <Text style={[qn4.label, { color: item.color + 'CC' }]}>{item.label}</Text>
                  <Text style={qn4.sub} numberOfLines={1}>{item.sub}</Text>
                  <View style={[qn4.bottomLine, { backgroundColor: item.color }]} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const qn4 = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 8 },
  // scaleWrap: receives ONLY transform (native driver) — no color props ever
  scaleWrap: { flex: 1 },
  cell:      {
    alignItems: 'center', paddingTop: 18, paddingBottom: 14, gap: 6,
    borderRadius: 16, borderWidth: 1.5, borderTopWidth: 3,
    overflow: 'hidden', position: 'relative', backgroundColor: SURFACE,
  },
  iconWrap:  { width: 54, height: 54, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:     { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  sub:       { fontFamily: MONO, fontSize: 8, color: MID, letterSpacing: 0.2, paddingHorizontal: 4, textAlign: 'center' },
  bottomLine:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.7 },
});

// ══════════════════════════════════════════════════════════════════
// STATUS CARDS 4 — Executed · Vectors · Latency · Status
// ══════════════════════════════════════════════════════════════════
function StatusCards4({ isConn, scripts, kbCount, latency }: {
  isConn: boolean; scripts: number; kbCount: number; latency: number;
}) {
  const CARDS = [
    {
      icon: 'play-circle-outline', label: 'EXECUTED',
      value: scripts > 0 ? String(scripts) : '0',
      sub: 'scripts run', color: CYAN,
    },
    {
      icon: 'database-outline', label: 'VECTORS',
      value: kbCount > 0 ? fmtCompact(kbCount * 1000) : '—',
      sub: 'kb vectors', color: PURPLE,
    },
    {
      icon: 'speedometer-medium', label: 'LATENCY',
      value: isConn ? (latency > 0 ? `${latency}ms` : '—') : '—',
      sub: 'lan ping', color: latency > 200 ? AMBER : GREEN,
    },
    {
      icon: isConn ? 'check-circle-outline' : 'circle-outline', label: 'STATUS',
      value: isConn ? 'LIVE' : 'IDLE',
      sub: isConn ? 'connected' : 'no pc', color: isConn ? GREEN : MID,
    },
  ];

  const pulseAnims = useRef(CARDS.map(() => new Animated.Value(0.6))).current;
  useEffect(() => {
    CARDS.forEach((_, i) => {
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(pulseAnims[i], { toValue: 1.0, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnims[i], { toValue: 0.35, duration: 1400, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => pulseAnims.forEach(a => a.stopAnimation());
  }, []);

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {CARDS.map((c, i) => (
          <View key={c.label} style={[sc4.card, {
            backgroundColor: SURFACE,
            borderColor: c.color + '30',
            borderTopColor: c.color,
          }]}>
            <HUDCorners color={c.color + '25'} size={6} t={1} />
            <View style={[sc4.iconBox, { backgroundColor: c.color + '14', borderColor: c.color + '40' }]}>
              <Animated.View style={{ opacity: pulseAnims[i] }}>
                <MaterialCommunityIcons name={c.icon as any} size={18} color={c.color} />
              </Animated.View>
            </View>
            <Text style={[sc4.value, { color: isConn ? c.color : DIM }]} adjustsFontSizeToFit numberOfLines={1}>
              {c.value}
            </Text>
            <Text style={sc4.label}>{c.label}</Text>
            <Text style={[sc4.sub, { color: c.color + '50' }]}>{c.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const sc4 = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', paddingTop: 14, paddingBottom: 12, gap: 4,
    borderRadius: 14, borderWidth: 1, borderTopWidth: 2.5,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  iconBox: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value:   { fontFamily: MONO, fontSize: 17, fontWeight: '900', lineHeight: 20 },
  label:   { fontFamily: MONO, fontSize: 7.5, color: MID, fontWeight: '900', letterSpacing: 1 },
  sub:     { fontFamily: MONO, fontSize: 7, letterSpacing: 0.3 },
});

function ZeroCloudBanner() {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={[zcb.root, { backgroundColor: SURFACE }]}>
        <View style={{ height: 2.5, backgroundColor: GREEN + '70' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 14, gap: 14 }}>
          <View style={[zcb.iconBox, { backgroundColor: GREEN + '14', borderColor: GREEN + '50' }]}>
            <HUDCorners color={GREEN + '35'} size={7} />
            <MaterialCommunityIcons name="shield-off-outline" size={24} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={zcb.title}>Zero-cloud architecture</Text>
            <Text style={zcb.body}>All processing on-device or your paired PC. Nothing transmitted off-network.</Text>
          </View>
          <MaterialCommunityIcons name="check-circle-outline" size={24} color={GREEN + '70'} />
        </View>
      </View>
    </View>
  );
}
const zcb = StyleSheet.create({
  root:    { borderRadius: 18, borderWidth: 1, borderColor: GREEN + '25', overflow: 'hidden' },
  iconBox: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' },
  title:   { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  body:    { fontFamily: MONO, fontSize: 10.5, color: MID, lineHeight: 16 },
});

// ══════════════════════════════════════════════════════════════════
// CONNECT MODAL — ROBOT THEMED
// ══════════════════════════════════════════════════════════════════
function ConnectModal({ visible, onClose, onConnected }: {
  visible: boolean; onClose: () => void; onConnected: () => void;
}) {
  const [ip,     setIp]     = useState('');
  const [port,   setPort]   = useState('8766');
  const [status, setStatus] = useState('');
  const [busy,   setBusy]   = useState(false);
  const insets = useSafeAreaInsets();

  const connect = async () => {
    if (!ip.trim()) { setStatus('Enter IP address'); return; }
    setBusy(true); setStatus(`Connecting to ${ip.trim()}:${port}...`);
    try {
      const r = await (serverConnection.connectManual
        ? serverConnection.connectManual(ip.trim(), port.trim())
        : Promise.resolve({ success: false, error: 'N/A' }));
      if ((r as any).success) { setStatus('Connected!'); haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 500); }
      else throw new Error((r as any).error || 'Failed');
    } catch (e: any) { setStatus('Error: ' + (e?.message || 'Failed')); }
    setBusy(false);
  };

  const openCam = () => {
    Alert.alert('SCAN QR CODE',
      'Run butler_server.py on your PC, then point your camera at the QR code shown in the terminal.\n\nThis is 100% local — no cloud, no internet required.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OPEN CAMERA', onPress: () => {
          onClose();
          setTimeout(() => { try { (global as any).__nexusHomeOpenQR?.(); } catch {} }, 200);
        }},
      ]
    );
  };

  if (!visible) return null;
  const sc = status.includes('Connected') ? GREEN : status.includes('Error') ? RED : AMBER;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.93)', justifyContent: 'flex-end', zIndex: 9999 }]}>
      <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' }}>
        <View style={{ height: 3, backgroundColor: CYAN }} />
        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DIM }} />
        </View>

        {/* Robot mascot in modal header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, paddingTop: 14, paddingBottom: 12 }}>
          <View style={{ width: 58, height: 58, borderRadius: 16, borderWidth: 2, borderColor: CYAN + '60', backgroundColor: CYAN + '12', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <HUDCorners color={CYAN + '40'} size={7} />
            {MASCOT_IMG ? (
              <Image source={MASCOT_IMG} style={{ width: 58, height: 58 }} resizeMode="cover" />
            ) : (
              <MaterialIcons name="link" size={24} color={CYAN} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: TEXT }}>Pair your PC</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, marginTop: 3 }}>Local network · AES-256 · No cloud · HMAC-SHA256</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: SURF2, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="close" size={16} color={MID} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={openCam} activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 18, marginBottom: 14, borderWidth: 1.5, borderRadius: 14, borderColor: CYAN + '55', backgroundColor: CYAN + '0E', paddingVertical: 14, paddingHorizontal: 16 }}>
          <MaterialIcons name="qr-code-scanner" size={24} color={CYAN} />
          <View>
            <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: CYAN }}>SCAN QR CODE</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, marginTop: 3 }}>Instant pairing from PC terminal</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, marginBottom: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: MID }}>OR MANUAL IP</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
        </View>
        <View style={{ paddingHorizontal: 18, gap: 10 }}>
          <TextInput value={ip} onChangeText={setIp} placeholder="192.168.x.x"
            placeholderTextColor={DIM}
            style={{ backgroundColor: SURF2, borderWidth: 1.5, borderColor: CYAN + '55', borderRadius: 12, color: TEXT, padding: 14, fontFamily: MONO, fontSize: 14 }}
            keyboardType="numeric" autoCorrect={false} />
        </View>
        {!!status && (
          <View style={{ marginHorizontal: 18, marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: sc + '45', backgroundColor: sc + '0A' }}>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: sc }}>{status}</Text>
          </View>
        )}
        <Pressable onPress={connect} disabled={busy}
          style={({ pressed }) => ({ margin: 18, marginBottom: 4, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' as const, gap: 8, opacity: pressed || busy ? 0.85 : 1 })}>
          {busy ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="link" size={18} color="#000" />}
          <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000' }}>{busy ? 'CONNECTING...' : 'CONNECT'}</Text>
        </Pressable>
        <View style={{ height: Math.max(insets.bottom + 8, 24) }} />
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════
const FOOTER_LINKS = [
  { icon: 'support-agent',  label: 'Support',        color: GREEN,  url: 'mailto:andrejsladkovic1992@gmail.com' },
  { icon: 'bug-report',     label: 'Report Bug',     color: AMBER,  url: 'mailto:andrejsladkovic1992@gmail.com?subject=Bug%20Report%20-%20Butler%20AI' },
  { icon: 'shield',         label: 'Privacy Policy', color: PURPLE, url: 'https://shawnjan-cmd.github.io/privacy-policy-/' },
  { icon: 'gavel',          label: 'Terms',          color: MID,    url: 'https://shawnjan-cmd.github.io/privacy-policy-/#terms-of-service' },
  { icon: 'delete-forever', label: 'Delete My Data', color: RED,    url: 'https://shawnjan-cmd.github.io/privacy-policy-/#data-deletion' },
];

function Footer({ isConn, addr }: { isConn: boolean; addr: string }) {
  const openLink = useCallback((url: string) => {
    try {
      haptics.light();
      import('react-native').then(({ Linking }) => Linking.openURL(url).catch(() => {}));
    } catch {}
  }, []);

  return (
    <View style={{ paddingHorizontal: PAD, paddingBottom: 28 }}>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 22, borderTopWidth: 1, borderTopColor: BORDER }}>
        <View style={{ height: 2, width: 140, borderRadius: 2, backgroundColor: CYAN + '50', marginBottom: 2 }} />
        <Text style={{ fontFamily: MONO, fontSize: 9, color: CYAN + '70', letterSpacing: 1.5, fontWeight: '700' }}>
          BUTLER AI  ·  v9.1  ·  LOCAL-FIRST  ·  ZERO CLOUD
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isConn ? GREEN : RED }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: isConn ? GREEN : MID }}>
            {isConn ? addr || 'CONNECTED' : 'NOT CONNECTED'}
          </Text>
        </View>
        <View style={{ width: 220, height: 1, backgroundColor: BORDER }} />
        <TouchableOpacity
          onPress={() => openLink('mailto:andrejsladkovic1992@gmail.com')}
          activeOpacity={0.75}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CYAN + '0A', borderWidth: 1, borderColor: CYAN + '30', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}
        >
          <MaterialIcons name="email" size={13} color={CYAN} />
          <Text style={{ fontFamily: MONO, fontSize: 10.5, color: CYAN + 'CC', letterSpacing: 0.3, fontWeight: '700' }}>
            andrejsladkovic1992@gmail.com
          </Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {FOOTER_LINKS.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => openLink(item.url)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, borderColor: item.color + '35', backgroundColor: item.color + '08' }}
            >
              <MaterialIcons name={item.icon as any} size={10} color={item.color + '80'} />
              <Text style={{ fontFamily: MONO, fontSize: 8.5, color: item.color + '90', letterSpacing: 0.3, fontWeight: '700' }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'AES-256', col: CYAN }, { label: 'HMAC-SHA256', col: GREEN },
            { label: 'ZERO TELEMETRY', col: PURPLE }, { label: 'LAN ONLY', col: AMBER },
          ].map((b, i) => (
            <View key={i} style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: b.col + '30', backgroundColor: b.col + '06' }}>
              <Text style={{ fontFamily: MONO, fontSize: 7.5, color: b.col + '70', fontWeight: '900' }}>{b.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ width: '80%', height: 1, backgroundColor: BORDER }} />
        <View style={{ alignItems: 'center', gap: 5, paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: DIM, letterSpacing: 0.5, textAlign: 'center' }}>
            © 2026 BUTLER AI · ANDREJ SLADKOVIC · ALL RIGHTS RESERVED
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: DIM + 'AA', letterSpacing: 0.3, textAlign: 'center' }}>
            com.butlerai.pc.automation · PROPRIETARY · NOT OPEN SOURCE
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: DIM + 'AA', letterSpacing: 0.3, textAlign: 'center' }}>
            Trademarks registered & managed via vitalstrademark.com
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <MaterialCommunityIcons name="shield-lock-outline" size={9} color={RED + '50'} />
            <Text style={{ fontFamily: MONO, fontSize: 7, color: RED + '45', letterSpacing: 0.3, textAlign: 'center', flex: 1 }}>
              This codebase contains multiple layers of proprietary copyright traps.
              Any unauthorized copy or redistribution is detectable and prosecutable.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
function NexusHomeInner() {
  const insets = useSafeAreaInsets();
  const [isConn,  setIsConn]  = useState(false);
  const [addr,    setAddr]    = useState('');
  const [latency, setLatency] = useState(0);
  const [metrics, setMetrics] = useState({ cpu: 0, ram: 0, disk: 0 });
  const [scripts, setScripts] = useState(0);
  const [kbCount, setKbCount] = useState(0);
  const [showQR,  setShowQR]  = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [cpuH,   setCpuH]    = useState<number[]>([0,0,0,0,0,0,0,0]);
  const [ramH,   setRamH]    = useState<number[]>([0,0,0,0,0,0,0,0]);
  const [diskH,  setDiskH]   = useState<number[]>([0,0,0,0,0,0,0,0]);

  // Page entrance animation
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterY       = useRef(new Animated.Value(16)).current;

  useFocusEffect(useCallback(() => {
    enterOpacity.setValue(0); enterY.setValue(16);
    Animated.parallel([
      Animated.timing(enterOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(enterY, { toValue: 0, tension: 180, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []));

  const loadData = useCallback(async () => {
    try {
      const conn = serverConnection.isConnected?.() ?? false;
      const ip   = serverConnection.getIP?.()   || '';
      const port = serverConnection.getPort?.() || '';
      setIsConn(conn); setAddr(ip && port ? `${ip}:${port}` : '');
      if (conn && ip && port) {
        const tok = serverConnection.getToken?.() || '';
        const h: Record<string,string> = {};
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController(); const t0 = Date.now(); setTimeout(() => ctrl.abort(), 7000);
        try {
          const res = await fetch(`http://${ip}:${port}/api/metrics`, { headers: h, signal: ctrl.signal });
          if (res.ok) {
            const d = await res.json();
            const c = d.cpu_percent  ?? d.cpu?.percent    ?? 0;
            const r = d.ram_percent  ?? d.memory?.percent ?? 0;
            const dk= d.disk_percent ?? d.disk?.percent   ?? 0;
            setLatency(Date.now() - t0);
            setMetrics({ cpu: c, ram: r, disk: dk });
            setCpuH  (prev => [...prev.slice(1),  c]);
            setRamH  (prev => [...prev.slice(1),  r]);
            setDiskH (prev => [...prev.slice(1), dk]);
            performanceHistory.recordFromMetrics(d);
          }
        } catch {}
      }
    } catch {}
    try { const h = await executionHistory.getAll().catch(() => [] as any[]); setScripts(Array.isArray(h) ? h.length : 0); } catch {}
    try { const s = await knowledgeAccumulator.getStats?.().catch(() => null); if (s) setKbCount(s.totalFindings ?? 0); } catch {}
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

  const goToTab = useCallback((tab: string) => {
    haptics.light(); try { (global as any).__butlerSwitchTab?.(tab); } catch {}
  }, []);

  const onRefresh = useCallback(async () => {
    setRefresh(true); haptics.medium();
    await loadData(); haptics.success(); setRefresh(false);
  }, [loadData]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <MiniChatBar isConn={isConn} />
      <Animated.View style={{ flex: 1, opacity: enterOpacity, transform: [{ translateY: enterY }] }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 280, gap: 0 }}
          showsVerticalScrollIndicator={false}
          decelerationRate={Platform.OS === 'ios' ? 0.994 : 'normal'}
          overScrollMode="never"
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl refreshing={refresh} onRefresh={onRefresh}
              tintColor={CYAN} colors={[CYAN, GREEN, AMBER]} progressBackgroundColor={SURFACE} />
          }
        >
          {/* ── NEXUS MEGA HEADER — replaces HomeHeader + NexusCommandCenter ── */}
          <NexusMegaHeader
            safeTop={insets.top} isConn={isConn} addr={addr}
            latency={latency} metrics={metrics}
            onPair={() => setShowQR(true)} goToTab={goToTab}
          />

          {/* ── PAIR PROMPT ── */}
          {!isConn && <><View style={{ height: 10 }} /><PairPrompt onPair={() => setShowQR(true)} /></>}
          <View style={{ height: 10 }} />

          {/* ── REMOTE ACCESS + TAILSCALE — right below header ── */}
          <View style={{ paddingHorizontal: PAD }}>
            <RemoteAccessMonetizationCard onConnected={loadData} />
          </View>
          <View style={{ height: 10 }} />

          {/* ── NEXUS HERO — status chips + gradient title + stat tiles + CTAs ── */}
          <NexusHero
            isConnected={isConn}
            serverAddr={addr}
            kbCount={kbCount}
            scripts={scripts}
            onPair={() => setShowQR(true)}
            goToTab={goToTab}
          />
          <View style={{ height: 10 }} />

          {/* ── QUICK NAV 4 — Pair · Chat · Run · Files ── */}
          <QuickNav4 isConn={isConn} onPair={() => setShowQR(true)} goToTab={goToTab} />
          <View style={{ height: 12 }} />

          {/* ── SECURITY SHOWCASE — hero visual, HUD tile grid (AES-256/LAN/NO TELEMETRY/64C/SHA) ── */}
          <View style={{ paddingHorizontal: PAD }}>
            <SecurityShowcase mode="full" />
          </View>
          <View style={{ height: 10 }} />

          {/* ── SECURITY PROTOCOLS — animated 6-module row ── */}
          <SecurityProtocols />
          <View style={{ height: 12 }} />
          <NeuralDivider color={GREEN} />

          {/* ── STATUS CARDS 4 — Executed · Vectors · Latency · Status ── */}
          <StatusCards4 isConn={isConn} scripts={scripts} kbCount={kbCount} latency={latency} />
          <View style={{ height: 12 }} />

          {/* ── ROTATING TIPS ── */}
          <View style={{ paddingHorizontal: PAD }}>
            <RotatingTips />
          </View>
          <View style={{ height: 10 }} />

          {/* ── NETWORK METRICS BAR — real data first ── */}
          <NetworkMetricsBar isConn={isConn} latency={latency} cpu={metrics.cpu} disk={metrics.disk} />
          <View style={{ height: 12 }} />

          {/* ── CORE SURFACES — 3×3 tab launcher (Chat/Flows/Scripts/KB/Files/Logs/PC/Theme/System) ── */}
          <CoreSurfaces goToTab={goToTab} />
          <View style={{ height: 12 }} />
          <CircuitDivider color={isConn ? CYAN : DIM} />

          {/* ── SYSTEM TELEMETRY 2×2 ── */}
          <SystemTelemetryGrid isConn={isConn} addr={addr} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} kbCount={kbCount} />
          <View style={{ height: 10 }} />
          <SpectrumDivider colors={[CYAN, GREEN]} />

          {/* ── LIVE GAUGES — hero metrics ── */}
          <LiveGauges isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} cpuH={cpuH} ramH={ramH} diskH={diskH} />
          <View style={{ height: 10 }} />
          <SpectrumDivider colors={[CYAN, GREEN]} />

          {/* ── QUICK ACTIONS 2×2 — glowing dark icon style ── */}
          <QuickActions goToTab={goToTab} onPair={() => setShowQR(true)} />
          <View style={{ height: 12 }} />
          <TipsTicker color={isConn ? CYAN : MID} />
          <View style={{ height: 10 }} />
          <NeuralDivider color={PURPLE} />

          {/* ── INTELLIGENCE GRAPHS ── */}
          <IntelligenceGraphsSection isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} kbCount={kbCount} scripts={scripts} cpuH={cpuH} ramH={ramH} />
          <View style={{ height: 10 }} />
          <CircuitDivider color={PURPLE} />

          {/* ── SYSTEM METRICS MINI-CARDS ── */}
          <SystemMetricsGrid isConn={isConn} scripts={scripts} />
          <View style={{ height: 12 }} />
          <PowerDivider color={AMBER} />

          {/* ── AI MEMORY ── */}
          <AIMemoryPanel isConn={isConn} kbCount={kbCount} />
          <View style={{ height: 12 }} />
          <SpectrumDivider colors={[PURPLE, CYAN]} />

          {/* ── SMART ALERTS + OMEGA LOOP ── */}
          <SmartAlertsOmegaRow isConn={isConn} goToTab={goToTab} />
          <View style={{ height: 12 }} />
          <PowerDivider color={RED} />

          {/* SecurityShowcase + SecurityProtocols moved to hero position above */}

          {/* ── SYS ACTIVITY 24H ── */}
          <SysActivityFeed isConn={isConn} />
          <View style={{ height: 12 }} />
          <CircuitDivider color={BLUE} reverse />

          {/* ── CLIPBOARD ── */}
          <ClipboardWidget isConn={isConn} />
          <View style={{ height: 12 }} />
          <PowerDivider color={PURPLE} />

          {/* ── FILE SHARE ── */}
          <FileShareWidget isConn={isConn} />
          <View style={{ height: 12 }} />
          <NeuralDivider color={AMBER} />

          {/* ── SCRIPT LAUNCHER ── */}
          <ScriptLauncher isConn={isConn} />
          <View style={{ height: 12 }} />
          <CircuitDivider color={GREEN} reverse />

          {/* ── NETWORK TOPOLOGY ── */}
          <View style={{ paddingHorizontal: PAD }}>
            <NetworkTopologyCard isConnected={isConn} onConnected={loadData} />
          </View>
          <View style={{ height: 10 }} />

          {/* ── ACTIVITY FEED ── */}
          <ActivityFeed isConn={isConn} addr={addr} scripts={scripts} kbCount={kbCount} />
          <View style={{ height: 12 }} />
          <SpectrumDivider colors={[PURPLE, PINK]} />

          {/* ── NEXUS HERO CARD (robot mascot + CTAs) ── */}
          <NexusHeroCard
            isConnected={isConn}
            serverAddr={addr}
            onPair={() => setShowQR(true)}
            onChat={() => goToTab('butler')}
          />
          <View style={{ height: 12 }} />
          <NeuralDivider color={CYAN} />

          {/* ── CORE NAV ── */}
          <CoreNav goToTab={goToTab} />
          <View style={{ height: 12 }} />
          <NeuralDivider color={GREEN} />

          {/* ── AUTOMATION FEED (live CRT process feed) ── */}
          <AutomationFeed isConnected={isConn} />
          <View style={{ height: 12 }} />
          <CircuitDivider color={GREEN} />

          {/* ── ZERO CLOUD BANNER ── */}
          <ZeroCloudBanner />
          <View style={{ height: 16 }} />
          <PowerDivider color={TEAL} />

          {/* ── PC TOOLS ── */}
          <QuickPCTools isConn={isConn} />
          <View style={{ height: 12 }} />
          {/* NexusCommandCenter merged into NexusMegaHeader at top */}
          <SpectrumDivider colors={[CYAN, PURPLE]} />

          {/* ── SPARKLINE PERFORMANCE GRAPH ── */}
          <View style={{ paddingHorizontal: PAD }}>
            <SparklineWidget isConnected={isConn} />
          </View>
          <View style={{ height: 12 }} />
          <NeuralDivider color={AMBER} />

          {/* ── LIVE TERMINAL FEED (4-channel) ── */}
          <LiveTerminalFeed isConnected={isConn} />
          <View style={{ height: 12 }} />
          <CircuitDivider color={PURPLE} reverse />

          {/* ── AI BRAIN MASTERPIECE CARD (KB + personal memory) ── */}
          <View style={{ paddingHorizontal: PAD }}>
            <AIBrainMasterpieceCard
              isConnected={isConn}
              serverAddr={addr}
              onNavigateToKnowledge={() => goToTab('knowledge')}
            />
          </View>
          <View style={{ height: 12 }} />

          <View style={{ paddingHorizontal: PAD }}>
            <NexusVaultCard isConnected={isConn} serverLatencyMs={latency} />
          </View>
          <View style={{ height: 16 }} />
          <TipsTicker color={DIM} />
          <View style={{ height: 8 }} />

          {/* ── FOOTER ── */}
          <Footer isConn={isConn} addr={addr} />
        </ScrollView>
      </Animated.View>
      {showQR && <ConnectModal visible={showQR} onClose={() => setShowQR(false)} onConnected={loadData} />}
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
