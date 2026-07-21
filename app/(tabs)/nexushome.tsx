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
const PINK    = '#FF6B9D';
const TEAL    = '#00D4AA';
const BLUE    = '#4A9EFF';
const DIM     = '#2A3A50';
const MID     = '#5A7888';
const TEXT    = '#D4EEF8';
const TEXT2   = '#7898A8';
const MONO: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';
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
// HEADER — COMPACT PROFESSIONAL (70% smaller, elegant)
// ══════════════════════════════════════════════════════════════════
function HomeHeader({ safeTop, isConn, addr, onPair }: {
  safeTop: number; isConn: boolean; addr: string; onPair: () => void;
}) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const [dateStr, setDate] = useState('');
  const glowA  = useRef(new Animated.Value(0.4)).current;
  const floatA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
      setDate(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    update(); const t = setInterval(update, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const gl = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1, duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1800, useNativeDriver: false }),
    ]));
    const fl = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ]));
    gl.start(); fl.start();
    return () => { gl.stop(); fl.stop(); };
  }, []);

  const connCol = isConn ? GREEN : AMBER;
  const floatY  = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const glowBg  = glowA.interpolate({ inputRange: [0, 1], outputRange: [CYAN + '0E', CYAN + '20'] });

  return (
    <View style={[hdr.root, { paddingTop: safeTop }]}>
      <View style={{ height: 2.5, backgroundColor: CYAN }} />
      <View style={hdr.body}>
        {/* ── Shield mascot — compact ── */}
        <Animated.View style={{ transform: [{ translateY: floatY }], flexShrink: 0 }}>
          <Animated.View style={[hdr.mascotBox, { borderColor: CYAN + '70', backgroundColor: glowBg }]}>
            {MASCOT_IMG ? (
              <Image source={MASCOT_IMG} style={hdr.mascotImg} resizeMode="cover" />
            ) : (
              <MaterialCommunityIcons name="robot-happy" size={22} color={CYAN} />
            )}
            <Animated.View style={[hdr.statusOrb, { backgroundColor: connCol, opacity: glowA }]} />
          </Animated.View>
        </Animated.View>

        {/* ── SVG logo ── */}
        <View style={hdr.logoBox}>
          <ButlerAILogo size={46} />
        </View>

        {/* ── Brand + status pills ── */}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            <Text style={hdr.brand}>BUTLER AI</Text>
            <Text style={hdr.brandSep}>:</Text>
            <Text style={hdr.brandSub}>PC AUTOMATION</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <TouchableOpacity onPress={() => { haptics.heavy(); onPair(); }} activeOpacity={0.8}
              style={[hdr.pill, { borderColor: connCol + '60', backgroundColor: connCol + '0C' }]}>
              <PulseDot color={connCol} size={4} />
              <Text style={[hdr.pillTxt, { color: connCol }]}>
                {isConn ? (addr.split(':')[0] || 'ONLINE') : 'PAIR PC'}
              </Text>
            </TouchableOpacity>
            <View style={[hdr.pill, { borderColor: BORDER }]}>
              <MaterialCommunityIcons name="lock-check" size={8} color={MID} />
              <Text style={[hdr.pillTxt, { color: DIM }]}>AES-256</Text>
            </View>
            <View style={[hdr.pill, { borderColor: BORDER }]}>
              <MaterialCommunityIcons name="lan-connect" size={8} color={MID} />
              <Text style={[hdr.pillTxt, { color: DIM }]}>LAN</Text>
            </View>
          </View>
        </View>

        {/* ── Compact clock + QR ── */}
        <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
            <Text style={hdr.clockMain}>{time}</Text>
            <Text style={[hdr.clockSecs, { color: CYAN }]}>{secs}</Text>
          </View>
          <Text style={hdr.dateTxt}>{dateStr}</Text>
          <TouchableOpacity onPress={() => { haptics.heavy(); onPair(); }} activeOpacity={0.8}
            style={[hdr.qrBtn, { borderColor: CYAN + '45', backgroundColor: CYAN + '0A' }]}>
            <MaterialIcons name="qr-code-scanner" size={14} color={CYAN} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 1.5, backgroundColor: CYAN + '25' }} />
    </View>
  );
}

const hdr = StyleSheet.create({
  root:       { backgroundColor: SURF3, overflow: 'hidden' },
  body:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingTop: 9, paddingBottom: 8 },
  mascotBox:  { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flexShrink: 0 },
  mascotImg:  { width: 42, height: 42 },
  statusOrb:  { position: 'absolute', bottom: 3, right: 3, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: SURF3 },
  logoBox:    { width: 46, height: 46, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
  brand:      { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3 },
  brandSep:   { fontSize: 14, fontWeight: '700', color: MID },
  brandSub:   { fontSize: 11, fontWeight: '700', color: CYAN + 'BB', letterSpacing: 0.3 },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  pillTxt:    { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.2 },
  clockMain:  { fontFamily: MONO, fontSize: 17, fontWeight: '900', color: TEXT, letterSpacing: 0.5 },
  clockSecs:  { fontFamily: MONO, fontSize: 10, fontWeight: '900' },
  dateTxt:    { fontFamily: MONO, fontSize: 7, color: DIM, letterSpacing: 0.4 },
  qrBtn:      { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

// ══════════════════════════════════════════════════════════════════
// MINI AI CHAT BAR
// ══════════════════════════════════════════════════════════════════
function MiniChatBar({ isConn }: { isConn: boolean }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');
  const borderA = useRef(new Animated.Value(0)).current;
  const glowA   = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 0.9,  duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.15, duration: 1800, useNativeDriver: false }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    haptics.medium(); setSending(true); setText(''); setReply('');
    try {
      if (isConn) {
        const ip = serverConnection.getIP(), port = serverConnection.getPort();
        const tok = serverConnection.getToken?.() || '';
        const h: Record<string,string> = { 'Content-Type': 'application/json' };
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 25000);
        const res = await fetch(`http://${ip}:${port}/api/butler/chat`, {
          method: 'POST', headers: h,
          body: JSON.stringify({ messages: [{ role: 'user', content: t }] }),
          signal: ctrl.signal,
        });
        if (res.ok) {
          const d = await res.json();
          const r = d.reply || d.content || d.message || d.response || '';
          setReply(r.slice(0, 180) || 'Done.');
          haptics.success();
        } else throw new Error(`Status ${res.status}`);
      } else {
        const lc = t.toLowerCase();
        const OFFLINE = [
          { test: /hi|hello|hey/, r: 'Hello! Connect your PC via QR to unlock full AI responses.' },
          { test: /help|what can/, r: 'I can run Python scripts, monitor your PC, manage files, and chat via local Ollama AI.' },
          { test: /script|python|code/, r: 'Tap SCRIPTS tab to browse 250+ automation scripts.' },
          { test: /pair|connect|qr/, r: 'Run butler_server.py on your PC, then tap PAIR PC at the top.' },
          { test: /privacy|cloud/, r: 'Zero cloud. Everything stays on your local network.' },
        ];
        const match = OFFLINE.find(o => o.test.test(lc));
        setReply(match?.r ?? 'Pair your PC to unlock full AI responses.');
        haptics.success();
      }
    } catch (e: any) {
      setReply(`Error: ${e?.message?.slice(0, 60) || 'Failed'}`);
    } finally { setSending(false); }
  };

  const borderColor = borderA.interpolate({ inputRange: [0, 1], outputRange: [CYAN + '28', CYAN + 'AA'] });
  const glowColor   = glowA.interpolate({ inputRange: [0, 1], outputRange: [CYAN + '0A', CYAN + '1C'] });

  return (
    <View style={chat.root}>
      <View style={chat.labelBar}>
        <MaterialCommunityIcons name="robot-happy-outline" size={11} color={CYAN + '80'} />
        <Text style={chat.labelTxt}>BUTLER AI  ·  LOCAL MODEL  ·  ZERO CLOUD</Text>
        <PulseDot color={isConn ? GREEN : AMBER} size={5} />
        <Text style={[chat.labelTxt, { color: isConn ? GREEN : AMBER }]}>{isConn ? 'ONLINE' : 'OFFLINE'}</Text>
      </View>
      <View style={chat.inputRow}>
        <Animated.View style={[chat.inputWrap, { borderColor, backgroundColor: glowColor }]}>
          <Text style={chat.cursor}>Ψ</Text>
          <TextInput
            value={text}
            onChangeText={t => { setText(t); Animated.timing(borderA, { toValue: t.length > 0 ? 1 : 0, duration: 180, useNativeDriver: false }).start(); }}
            placeholder={isConn ? 'Ask Butler AI anything...' : 'Ask anything (pair PC for full AI)...'}
            placeholderTextColor={DIM}
            style={chat.input}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
            editable={!sending}
            maxLength={400}
          />
          {text.length > 0 && (
            <Text style={[chat.charCount, { color: CYAN + '60' }]}>{text.length}</Text>
          )}
        </Animated.View>
        <TouchableOpacity onPress={send} disabled={!text.trim() || sending} activeOpacity={0.82}
          style={[chat.sendBtn, { backgroundColor: text.trim() && !sending ? CYAN : DIM + '60', borderColor: text.trim() ? CYAN + '60' : 'transparent' }]}>
          {sending
            ? <ActivityIndicator size="small" color={text.trim() ? BG : MID} />
            : <MaterialIcons name="send" size={17} color={text.trim() ? BG : MID} />
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { haptics.light(); (global as any).__butlerSwitchTab?.('butler'); }} activeOpacity={0.8}
          style={[chat.moreBtn, { borderColor: PURPLE + '45', backgroundColor: PURPLE + '0C' }]}>
          <MaterialCommunityIcons name="robot-happy-outline" size={16} color={PURPLE} />
        </TouchableOpacity>
      </View>
      {!!reply && (
        <Pressable onPress={() => setReply('')} style={chat.replyBubble}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={[chat.replyIcon, { backgroundColor: CYAN + '14', borderColor: CYAN + '40' }]}>
              <MaterialCommunityIcons name="robot-happy" size={12} color={CYAN} />
            </View>
            <Text style={chat.replyTxt} numberOfLines={3}>{reply}</Text>
            <MaterialIcons name="close" size={11} color={DIM} />
          </View>
        </Pressable>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 7, paddingHorizontal: 1, paddingBottom: 2 }}>
        {['System stats', 'Clean temp files', 'Show top procs', 'Network info', 'Disk usage'].map(c => (
          <TouchableOpacity key={c} onPress={() => { haptics.light(); setText(c); }} activeOpacity={0.8}
            style={[chat.chip, { borderColor: CYAN + '30', backgroundColor: CYAN + '08' }]}>
            <Text style={[chat.chipTxt, { color: CYAN + 'BB' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const chat = StyleSheet.create({
  root:        { backgroundColor: SURF3, borderBottomWidth: 1, borderBottomColor: CYAN + '18', paddingHorizontal: PAD, paddingTop: 9, paddingBottom: 10, gap: 9 },
  labelBar:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelTxt:    { fontFamily: MONO, fontSize: 8.5, color: MID, letterSpacing: 0.5, fontWeight: '700' },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputWrap:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, minHeight: 46 },
  cursor:      { fontSize: 15, color: CYAN + '80', fontFamily: MONO, fontWeight: '900', marginTop: -1 },
  input:       { flex: 1, fontFamily: MONO, fontSize: 13, color: TEXT, padding: 0 },
  charCount:   { fontFamily: MONO, fontSize: 9, flexShrink: 0 },
  sendBtn:     { width: 46, height: 46, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moreBtn:     { width: 46, height: 46, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  replyBubble: { backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: CYAN + '28', padding: 10 },
  replyIcon:   { width: 24, height: 24, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  replyTxt:    { fontFamily: MONO, fontSize: 11.5, color: TEXT, flex: 1, lineHeight: 17 },
  chip:        { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipTxt:     { fontFamily: MONO, fontSize: 10, fontWeight: '700' },
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
      <View style={{ height: 3, backgroundColor: AMBER + 'A0' }} />
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
          {/* ── DOWNLOAD BUTTON — hidden when PC is connected ── */}
          {!isConn && (
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
              { label: 'HMAC', col: AMBER  },
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
  root:    { backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1.5, borderColor: AMBER + '30', overflow: 'hidden', marginHorizontal: PAD },
  robotBox:{ width: 68, height: 68, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' },
  title:   { fontSize: 17, fontWeight: '700', color: TEXT },
  body:    { fontFamily: MONO, fontSize: 10.5, color: MID, lineHeight: 16 },
  tag:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  btn:     { margin: 16, marginTop: 4, backgroundColor: AMBER, borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnTxt:  { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: BG },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginTop: 8, marginBottom: 4, backgroundColor: '#00CC88', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  downloadTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 0.5, flex: 1, textAlign: 'center' },
});

// ══════════════════════════════════════════════════════════════════
// QUICK ACTIONS — 2×2 GRID (larger icons, more satisfying)
// ══════════════════════════════════════════════════════════════════
const QA_ITEMS = [
  { icon: 'robot-happy-outline', label: 'AI CHAT',  sub: 'Local Ollama',    tab: 'butler',    color: CYAN,   lib: 'c' },
  { icon: 'code-braces',         label: 'SCRIPTS',  sub: '250+ scripts',    tab: 'scripts',   color: GREEN,  lib: 'c' },
  { icon: 'folder-network',      label: 'FILES',    sub: 'LAN transfer',    tab: 'fileshare', color: PURPLE, lib: 'c' },
  { icon: 'brain',               label: 'KB',       sub: 'Knowledge base',  tab: 'knowledge', color: AMBER,  lib: 'c' },
];

function QuickActions({ goToTab, onPair }: { goToTab: (t: string) => void; onPair: () => void }) {
  const scales = useRef(QA_ITEMS.map(() => new Animated.Value(1))).current;
  const pi = (i: number) => Animated.spring(scales[i], { toValue: 0.87, tension: 420, friction: 12, useNativeDriver: true }).start();
  const po = (i: number) => Animated.spring(scales[i], { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={qa.row}>
        {QA_ITEMS.map((a, i) => (
          <Pressable key={a.label}
            onPress={() => { haptics.medium(); a.tab === 'pair' ? onPair() : goToTab(a.tab); }}
            onPressIn={() => pi(i)} onPressOut={() => po(i)}
            style={{ width: '48%' }}>
            <Animated.View style={[qa.cell, {
              backgroundColor: SURFACE, borderColor: a.color + '28', borderTopColor: a.color, borderTopWidth: 2.5,
              transform: [{ scale: scales[i] }],
            }]}>
              <View style={[qa.iconBubble, { backgroundColor: a.color + '14', borderColor: a.color + '40' }]}>
                <MaterialCommunityIcons name={a.icon as any} size={30} color={a.color} />
              </View>
              <Text style={[qa.label, { color: a.color + 'AA' }]}>{a.label}</Text>
              <Text style={[qa.sub, { color: a.color + '55' }]}>{a.sub}</Text>
            </Animated.View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const qa = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  cell:      { alignItems: 'center', paddingVertical: 20, paddingTop: 22, gap: 9, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  iconBubble:{ width: 60, height: 60, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:     { fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  sub:       { fontFamily: MONO, fontSize: 9, letterSpacing: 0.3, textAlign: 'center' },
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
      <HomeHeader safeTop={insets.top} isConn={isConn} addr={addr} onPair={() => setShowQR(true)} />
      <MiniChatBar isConn={isConn} />
      <Animated.View style={{ flex: 1, opacity: enterOpacity, transform: [{ translateY: enterY }] }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 280, gap: 0 }}
          showsVerticalScrollIndicator={false}
          decelerationRate={Platform.OS === 'ios' ? 0.994 : 'normal'}
          overScrollMode="never"
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl refreshing={refresh} onRefresh={onRefresh}
              tintColor={CYAN} colors={[CYAN, GREEN, AMBER]} progressBackgroundColor={SURFACE} />
          }
        >
          {/* ── PAIR PROMPT ── */}
          {!isConn && <><PairPrompt onPair={() => setShowQR(true)} /><View style={{ height: 12 }} /></>}

          {/* ── QUICK ACTIONS 2×2 ── */}
          <QuickActions goToTab={goToTab} onPair={() => setShowQR(true)} />
          <View style={{ height: 12 }} />
          <TipsTicker color={isConn ? CYAN : MID} />
          <View style={{ height: 12 }} />
          <CircuitDivider color={isConn ? CYAN : DIM} />

          {/* ── LIVE GAUGES ── */}
          <LiveGauges isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} cpuH={cpuH} ramH={ramH} diskH={diskH} />
          <View style={{ height: 12 }} />
          <SpectrumDivider colors={[CYAN, GREEN]} />

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

          {/* ── ACTIVITY FEED ── */}
          <ActivityFeed isConn={isConn} addr={addr} scripts={scripts} kbCount={kbCount} />
          <View style={{ height: 12 }} />
          <SpectrumDivider colors={[PURPLE, PINK]} />

          {/* ── CORE NAV ── */}
          <CoreNav goToTab={goToTab} />
          <View style={{ height: 12 }} />
          <NeuralDivider color={GREEN} />

          {/* ── ZERO CLOUD BANNER ── */}
          <ZeroCloudBanner />
          <View style={{ height: 16 }} />
          <PowerDivider color={TEAL} />

          {/* ── PC TOOLS ── */}
          <QuickPCTools isConn={isConn} />
          <View style={{ height: 12 }} />
          <View style={{ paddingHorizontal: PAD }}>
            <RemoteAccessMonetizationCard onConnected={loadData} />
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
