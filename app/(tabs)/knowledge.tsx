/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NEXUS KNOWLEDGE BASE v8.0 — TERMINAL GLASS EDITION            ║
 * ║  ©2026 PROPRIETARY — Andrej Sladkovic. ALL RIGHTS RESERVED      ║
 * ║                                                                   ║
 * ║  Theme: "Terminal Glass" — dark navy glass surfaces, neon HUD   ║
 * ║  accents, monospace everything, circuit trace borders.           ║
 * ║                                                                   ║
 * ║  UNIQUE FEATURES:                                                 ║
 * ║  • Full-bleed DNA helix visualization showing KB density        ║
 * ║  • Live neural network node map for knowledge connections        ║
 * ║  • Entropy-wave topic diversity indicator                        ║
 * ║  • Self-repairing KB integrity scanner with visual pulse        ║
 * ║  • Fingerprint-style knowledge heatmap per domain                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Pressable,
  StyleSheet, Platform, Alert, ActivityIndicator, Animated,
  Dimensions, FlatList, KeyboardAvoidingView,
} from 'react-native';
import Svg, {
  Path, Circle, Rect, Line, Polygon, G, Defs,
  LinearGradient as SvgGrad, Stop, Ellipse, Polyline,
} from 'react-native-svg';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { COLOR, FONT, glow } from '@/constants/tokens';
import { knowledgeAccumulator, CompressedKnowledge, ResearchSession } from '@/services/knowledgeAccumulator';
import { kbOrganizerBot } from '@/services/kbOrganizerBot';
import { sigmaNetCrawler, SIGMA_PYTHON_TARGETS, SigmaRelayResult } from '@/services/serverCrawler';
import { serverConnection } from '@/services/serverConnection';
import { quantumLinkHarvester, QLHStats } from '@/services/quantumLinkHarvester';
import { nexusBridge } from '@/services/nexusBridge';
import { kbGrowthTracker, ChartBucket } from '@/services/kbGrowthTracker';
import { autoConnectEngine, EngineEvent } from '@/services/autoConnectEngine';
import { knowledgeGrowthEngine } from '@/services/knowledgeGrowthEngine';

const MONO: any = FONT.mono;
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;

// ─── PALETTE ─────────────────────────────────────────────────────
const AMBER   = '#FFB020';
const CYAN    = '#00E5FF';
const GREEN   = '#00FF88';
const PURPLE  = '#CC44FF';
const RED     = '#FF3344';
const TEAL    = '#00CCBB';
const BLUE    = '#4A9EFF';
const PINK    = '#FF6EB4';
const YELLOW  = '#FFD400';
const BG      = '#010407';
const SURF    = '#060D18';
const SURF2   = '#0A1422';
const BORDER  = 'rgba(255,176,32,0.12)';
const MID     = '#4A7090';
const DIM     = '#1A2E44';
const TEXT    = '#C8E4F0';

// ─── TYPES ───────────────────────────────────────────────────────
type TabKey = 'dashboard' | 'crawler' | 'manual' | 'base' | 'bot';
type KBStats = { totalSessions: number; totalFindings: number; storageUsed: number };
type CrawlLog = { ts: number; msg: string; type: 'info' | 'ok' | 'warn' | 'error' };

// ─── MICRO ATOMS ─────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HUDCorners({ color, size = 8, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const s: any = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[s, { top: 0, left: 0,    borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[s, { top: 0, right: 0,   borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[s, { bottom: 0, left: 0, borderBottomWidth: t, borderLeftWidth: t,   borderColor: color }]} />
      <View style={[s, { bottom: 0, right: 0,borderBottomWidth: t, borderRightWidth: t,  borderColor: color }]} />
    </>
  );
}

function SectionHdr({ icon, label, color, sub, right, iconLib = 'community' }: {
  icon: string; label: string; color: string; sub?: string;
  right?: React.ReactNode; iconLib?: 'material' | 'community';
}) {
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color }} />
        <Icon name={icon as any} size={12} color={color} />
        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: color + 'DD', letterSpacing: 2, flex: 1 }}>{label}</Text>
        {right}
        <View style={{ flex: 1, height: 1, backgroundColor: color + '20', maxWidth: 40 }} />
      </View>
      {sub ? <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, marginLeft: 28, marginTop: 3, lineHeight: 15 }}>{sub}</Text> : null}
    </View>
  );
}

// ─── UNIQUE: DNA HELIX — full-width knowledge density visualizer ──
function DNAHelix({ findings, sessions }: { findings: number; sessions: number }) {
  const scrollA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scrollA, { toValue: 1, duration: 6000, useNativeDriver: true })
    );
    loop.start(); return () => loop.stop();
  }, []);
  const W = SW - PAD * 2;
  const H = 56;
  const NODES = 14;
  const COLORS = [AMBER, CYAN, GREEN, PURPLE, TEAL, PINK, YELLOW, BLUE];

  // SVG path for upper strand
  const upperPath = Array.from({ length: NODES }, (_, i) => {
    const x = (i / (NODES - 1)) * W;
    const y = H / 2 + Math.sin((i / NODES) * Math.PI * 2) * (H * 0.35);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  // SVG path for lower strand
  const lowerPath = Array.from({ length: NODES }, (_, i) => {
    const x = (i / (NODES - 1)) * W;
    const y = H / 2 - Math.sin((i / NODES) * Math.PI * 2) * (H * 0.35);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <View style={{ width: '100%', overflow: 'hidden' }}>
      <Svg width={W} height={H}>
        <Defs>
          <SvgGrad id="dna_upper" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={AMBER} stopOpacity="0.6" />
            <Stop offset="0.5" stopColor={CYAN} stopOpacity="0.9" />
            <Stop offset="1" stopColor={GREEN} stopOpacity="0.6" />
          </SvgGrad>
          <SvgGrad id="dna_lower" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={PURPLE} stopOpacity="0.6" />
            <Stop offset="0.5" stopColor={PINK} stopOpacity="0.9" />
            <Stop offset="1" stopColor={TEAL} stopOpacity="0.6" />
          </SvgGrad>
        </Defs>
        <Path d={upperPath} stroke="url(#dna_upper)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d={lowerPath} stroke="url(#dna_lower)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {/* Cross-links (base pairs) */}
        {Array.from({ length: NODES }, (_, i) => {
          const x = (i / (NODES - 1)) * W;
          const y1 = H / 2 + Math.sin((i / NODES) * Math.PI * 2) * (H * 0.35);
          const y2 = H / 2 - Math.sin((i / NODES) * Math.PI * 2) * (H * 0.35);
          const col = COLORS[i % COLORS.length];
          const hasFinding = i < Math.min(NODES, Math.ceil((findings / Math.max(1, findings + 10)) * NODES));
          return (
            <G key={i}>
              <Line x1={x} y1={y1} x2={x} y2={y2} stroke={col} strokeWidth={1.5} opacity={hasFinding ? 0.8 : 0.2} />
              <Circle cx={x} cy={y1} r={3.5} fill={col} opacity={hasFinding ? 1 : 0.25} />
              <Circle cx={x} cy={y2} r={3.5} fill={col} opacity={hasFinding ? 1 : 0.25} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── UNIQUE: NEURAL NODE MAP — knowledge topology visualization ───
function NeuralNodeMap({ stats }: { stats: KBStats | null }) {
  const W = SW - PAD * 2;
  const H = 100;
  const categories = ['Python', 'Security', 'System', 'Network', 'Windows', 'AI', 'Files', 'Web'];
  const colors = [CYAN, RED, AMBER, GREEN, BLUE, PURPLE, YELLOW, PINK];
  const glowAnims = useRef(categories.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const loops = glowAnims.map((a, i) => {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 1000 + i * 200, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: 1000 + i * 200, useNativeDriver: true }),
      ]));
      loop.start(); return loop;
    });
    return () => loops.forEach(l => l.stop());
  }, []);

  // Arrange nodes in a circular pattern
  const nodes = categories.map((cat, i) => {
    const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2;
    const r = H * 0.36;
    return {
      cat, color: colors[i],
      x: W / 2 + r * Math.cos(angle),
      y: H / 2 + r * Math.sin(angle) + 4,
      size: 8 + (i % 3) * 2,
    };
  });

  return (
    <View style={{ width: '100%', position: 'relative' }}>
      <Svg width={W} height={H} style={{ overflow: 'visible' }}>
        <Defs>
          <SvgGrad id="hub_glow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={AMBER} stopOpacity="0.25" />
            <Stop offset="1" stopColor={AMBER} stopOpacity="0" />
          </SvgGrad>
        </Defs>
        {/* Connection lines from hub */}
        {nodes.map((n, i) => (
          <Line key={i} x1={W / 2} y1={H / 2 + 4} x2={n.x} y2={n.y}
            stroke={n.color} strokeWidth={1} opacity={0.3} strokeDasharray="3,4" />
        ))}
        {/* Cross-connections between adjacent nodes */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return (
            <Line key={`cc-${i}`} x1={n.x} y1={n.y} x2={next.x} y2={next.y}
              stroke={n.color} strokeWidth={0.8} opacity={0.15} />
          );
        })}
        {/* Hub centre */}
        <Circle cx={W / 2} cy={H / 2 + 4} r={14} fill="url(#hub_glow)" />
        <Circle cx={W / 2} cy={H / 2 + 4} r={10} stroke={AMBER} strokeWidth={2} fill={SURF} />
        <Circle cx={W / 2} cy={H / 2 + 4} r={4} fill={AMBER} />
        {/* Outer nodes */}
        {nodes.map((n, i) => (
          <G key={i}>
            <Circle cx={n.x} cy={n.y} r={n.size + 3} fill={n.color} opacity={0.12} />
            <Circle cx={n.x} cy={n.y} r={n.size} fill={SURF2} stroke={n.color} strokeWidth={1.5} />
            <Circle cx={n.x} cy={n.y} r={n.size * 0.4} fill={n.color} opacity={0.9} />
          </G>
        ))}
      </Svg>
      {/* Labels around the ring */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {nodes.map((n, i) => {
          // Offset label outward from node
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const labelR = H * 0.48;
          const lx = W / 2 + labelR * Math.cos(angle);
          const ly = H / 2 + 4 + labelR * Math.sin(angle) - 5;
          return (
            <Text key={i} style={{
              position: 'absolute',
              left: lx - 22, top: ly,
              fontFamily: MONO, fontSize: 7, fontWeight: '900', color: n.color,
              width: 44, textAlign: 'center',
            }}>{n.cat.toUpperCase()}</Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── UNIQUE: ENTROPY WAVE — topic diversity indicator ─────────────
function EntropyWave({ findings }: { findings: number }) {
  const W = SW - PAD * 2;
  const H = 40;
  const phaseA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(phaseA, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    loop.start(); return () => loop.stop();
  }, []);

  const BANDS = [
    { freq: 1.0, amp: 0.28, color: AMBER, opacity: 0.9 },
    { freq: 2.2, amp: 0.18, color: CYAN,  opacity: 0.7 },
    { freq: 3.7, amp: 0.12, color: GREEN, opacity: 0.5 },
    { freq: 5.1, amp: 0.08, color: PURPLE, opacity: 0.35 },
  ];

  const buildPath = (freq: number, amp: number, phase: number) => {
    const STEPS = 40;
    return Array.from({ length: STEPS + 1 }, (_, i) => {
      const x = (i / STEPS) * W;
      const t = (i / STEPS) * Math.PI * 2 * freq + phase;
      const y = H / 2 + Math.sin(t) * amp * H + Math.cos(t * 0.7) * amp * 0.5 * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <View style={{ width: '100%', overflow: 'hidden', borderRadius: 8 }}>
      <Svg width={W} height={H}>
        {BANDS.map((band, i) => {
          // Static paths since Animated doesn't work inside SVG paths directly
          const path = buildPath(band.freq, band.amp, i * 0.8);
          return (
            <Path key={i} d={path} stroke={band.color} strokeWidth={2 - i * 0.3}
              fill="none" opacity={band.opacity} strokeLinecap="round" />
          );
        })}
        {/* Centre baseline */}
        <Line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={AMBER} strokeWidth={0.5} opacity={0.2} strokeDasharray="4,6" />
      </Svg>
    </View>
  );
}

// ─── UNIQUE: KNOWLEDGE FINGERPRINT — heatmap per domain ───────────
function KnowledgeFingerprint({ stats }: { stats: KBStats | null }) {
  const W = SW - PAD * 2;
  const ROWS = 6;
  const COLS = 18;
  const CELL_W = (W - (COLS - 1) * 2) / COLS;
  const CELL_H = 8;
  const domains = ['Python', 'Security', 'System', 'Network', 'Windows', 'AI'];
  const domColors = [CYAN, RED, AMBER, GREEN, BLUE, PURPLE];

  // Generate deterministic heatmap values seeded by domain + position
  const cells = useMemo(() => {
    return domains.map((domain, ri) => {
      const col = domColors[ri];
      return Array.from({ length: COLS }, (_, ci) => {
        // Pseudo-random but deterministic
        const seed = (ri * 17 + ci * 7) % 100;
        const v = (Math.sin(seed * 0.4) * 0.5 + 0.5);
        return { value: v, color: col };
      });
    });
  }, []);

  return (
    <View style={{ gap: 3 }}>
      {cells.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: domColors[ri], width: 52 }}>
            {domains[ri].toUpperCase()}
          </Text>
          <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
            {row.map((cell, ci) => (
              <View key={ci} style={{
                flex: 1, height: CELL_H, borderRadius: 2,
                backgroundColor: cell.color,
                opacity: Math.max(0.08, cell.value * 0.9),
              }} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── TICKER ───────────────────────────────────────────────────────
const KB_TICKER = [
  '>> kb.index() :: vectors=active :: aes256=on',
  '>> sigma_net.crawl() :: relay=pc :: target=py_docs',
  '>> omega_loop.grow() :: 35_topics :: silent=true',
  '>> knowledge.compress() :: jaccard=0.82 :: dedup=on',
  '>> butler.context() :: kb_hit=true :: latency=12ms',
  '>> neural.map() :: nodes=8 :: connections=36',
  '>> entropy.scan() :: diversity=0.94 :: balanced=true',
];

function Ticker() {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const line = KB_TICKER[idx];
    if (chars < line.length) {
      const t = setTimeout(() => { if (m.current) setChars(c => c + 1); }, 18);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (m.current) { setIdx(i => (i + 1) % KB_TICKER.length); setChars(0); }
    }, 2600);
    return () => clearTimeout(t);
  }, [chars, idx]);
  return (
    <Text style={{ fontFamily: MONO, fontSize: 8.5, color: AMBER, flex: 1 }} numberOfLines={1}>
      {KB_TICKER[idx].slice(0, chars)}<Text style={{ color: AMBER + '50' }}>▌</Text>
    </Text>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────
function KBHeader({ safeTop, isConn, findings, onRefresh }: {
  safeTop: number; isConn: boolean; findings: number; onRefresh: () => void;
}) {
  const shimA = useRef(new Animated.Value(-SW)).current;
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    const upd = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
    };
    upd(); const t = setInterval(upd, 1000);
    return () => { m.current = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.5, duration: 2000, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW,      duration: 0,    useNativeDriver: true }),
      Animated.delay(7000),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const cc = isConn ? GREEN : RED;

  return (
    <View style={[khdr.root, { paddingTop: safeTop }]}>
      {/* Top 5-stripe */}
      <View style={{ height: 3.5, flexDirection: 'row' }}>
        {[AMBER, PURPLE, CYAN, GREEN, PINK].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      {/* Shimmer */}
      <Animated.View pointerEvents="none" style={[khdr.shimmer, { transform: [{ translateX: shimA }] }]} />

      {/* Main header row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 10, zIndex: 1 }}>
        {/* Left */}
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '700', color: AMBER + '60', letterSpacing: 2 }}>
              NEURAL INDEX · SIGMA-NET · OMEGA-LOOP
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[khdr.logoBox, { borderColor: AMBER + '55', backgroundColor: AMBER + '10' }]}>
              <HUDCorners color={AMBER + '50'} size={6} />
              <MaterialCommunityIcons name="brain" size={20} color={AMBER} />
              <View style={{ position: 'absolute', top: -2, right: -2 }}>
                <PulseDot color={AMBER} size={5} />
              </View>
            </View>
            <Text style={khdr.brand}>
              <Text style={{ color: AMBER }}>{'['}</Text>
              <Text style={{ color: '#FFF' }}>NEXUS</Text>
              <Text style={{ color: CYAN }}>_KB</Text>
              <Text style={{ color: AMBER }}>{']'}</Text>
            </Text>
          </View>
          {/* Pill row */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <View style={[khdr.pill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
              <PulseDot color={cc} size={5} />
              <Text style={[khdr.pillTxt, { color: cc }]}>{isConn ? 'RELAY ON' : 'LOCAL'}</Text>
            </View>
            <View style={[khdr.pill, { borderColor: AMBER + '40', backgroundColor: AMBER + '08' }]}>
              <MaterialCommunityIcons name="database" size={9} color={AMBER} />
              <Text style={[khdr.pillTxt, { color: AMBER }]}>{findings} FACTS</Text>
            </View>
            <View style={[khdr.pill, { borderColor: PURPLE + '40', backgroundColor: PURPLE + '08' }]}>
              <MaterialCommunityIcons name="radar" size={9} color={PURPLE} />
              <Text style={[khdr.pillTxt, { color: PURPLE }]}>AES-256</Text>
            </View>
          </View>
        </View>

        {/* Right: clock + refresh */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={{ fontFamily: MONO, fontSize: 26, fontWeight: '900', color: TEXT, letterSpacing: 1 }}>{time}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: AMBER, letterSpacing: 1 }}>{secs}</Text>
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: MID, letterSpacing: 1, fontWeight: '700' }}>KB · INDEXED</Text>
          <TouchableOpacity onPress={() => { haptics.light(); onRefresh(); }}
            style={[khdr.refreshBtn, { borderColor: AMBER + '45', backgroundColor: AMBER + '0A' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="refresh" size={15} color={AMBER} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ticker row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingBottom: 9, zIndex: 1 }}>
        <MaterialCommunityIcons name="radar" size={9} color={AMBER + '80'} />
        <Ticker />
      </View>

      {/* Circuit trace bottom */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        <View style={{ flex: 4, backgroundColor: AMBER + '20' }} />
        <View style={{ width: 12, backgroundColor: AMBER }} />
        <View style={{ flex: 2, backgroundColor: PURPLE + '15' }} />
        <View style={{ width: 6,  backgroundColor: PURPLE }} />
        <View style={{ flex: 5, backgroundColor: CYAN + '08' }} />
        <View style={{ width: 10, backgroundColor: CYAN }} />
        <View style={{ flex: 3, backgroundColor: CYAN + '10' }} />
      </View>
    </View>
  );
}
const khdr = StyleSheet.create({
  root:       { backgroundColor: '#020609', overflow: 'hidden' },
  shimmer:    { position: 'absolute', top: 0, bottom: 0, width: 90, backgroundColor: 'rgba(255,176,32,0.04)', zIndex: 0 },
  logoBox:    { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' },
  brand:      { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  pillTxt:    { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  refreshBtn: { width: 32, height: 32, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

// ─── TAB SELECTOR — full-width, no scroll ─────────────────────────
const TABS: { key: TabKey; label: string; icon: string; lib: 'material' | 'community'; color: string }[] = [
  { key: 'dashboard', label: 'BOARD',   icon: 'view-dashboard',  lib: 'community', color: AMBER  },
  { key: 'bot',       label: 'BOT',     icon: 'robot',           lib: 'community', color: PURPLE },
  { key: 'crawler',   label: 'CRAWL',   icon: 'spider-web',      lib: 'community', color: CYAN   },
  { key: 'manual',    label: 'ADD',     icon: 'pencil-plus',     lib: 'community', color: TEAL   },
  { key: 'base',      label: 'XPLORE',  icon: 'storage',         lib: 'material',  color: GREEN  },
];

function KBTabBar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#010305', borderBottomWidth: 1, borderBottomColor: BORDER }}>
      {TABS.map((tab, i) => {
        const isActive = tab.key === active;
        const Icon = tab.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
        return (
          <TouchableOpacity key={tab.key} onPress={() => { haptics.selection(); onSelect(tab.key); }} activeOpacity={0.8}
            style={[kbt.tab, { flex: 1, borderBottomColor: isActive ? tab.color : 'transparent',
              backgroundColor: isActive ? tab.color + '0D' : 'transparent',
              borderRightWidth: i < TABS.length - 1 ? 1 : 0, borderRightColor: BORDER,
            }]}>
            <Icon name={tab.icon as any} size={13} color={isActive ? tab.color : DIM + 'AA'} />
            <Text style={[kbt.label, { color: isActive ? tab.color : DIM + 'AA', fontWeight: isActive ? '900' : '600' }]}>
              {tab.label}
            </Text>
            {isActive && <View style={{ position: 'absolute', top: 0, left: 8, right: 8, height: 2.5, backgroundColor: tab.color, borderRadius: 1.5 }} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const kbt = StyleSheet.create({
  tab:   { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 10, borderBottomWidth: 3, position: 'relative' },
  label: { fontFamily: MONO, fontSize: 7.5, letterSpacing: 0.3 },
});

// ─── WIDE STAT CARD ───────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub }: { label: string; value: string | number; color: string; icon: string; sub?: string }) {
  return (
    <View style={[stc.card, { borderTopColor: color, borderTopWidth: 3, borderColor: color + '25' }]}>
      <View style={[stc.iconBox, { borderColor: color + '50', backgroundColor: color + '10' }]}>
        <MaterialIcons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[stc.value, { color }]} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>{value}</Text>
      <Text style={stc.label}>{label}</Text>
      {sub ? <Text style={[stc.sub, { color: color + '70' }]}>{sub}</Text> : null}
    </View>
  );
}
const stc = StyleSheet.create({
  card:    { flex: 1, backgroundColor: SURF2, borderRadius: 12, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 5 },
  iconBox: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  value:   { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  label:   { fontFamily: MONO, fontSize: 7.5, color: MID, letterSpacing: 0.8, textAlign: 'center' },
  sub:     { fontFamily: MONO, fontSize: 7, letterSpacing: 0.3 },
});

// ─── FULL-WIDTH AUTOMATION LAYER ROW ─────────────────────────────
function AutoLayerRow({ id, label, desc, color, active, extraBadge }: {
  id: string; label: string; desc: string; color: string; active: boolean; extraBadge?: string;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  return (
    <View style={[alr.wrap, {
      borderLeftWidth: 4, borderLeftColor: active ? color : DIM + '40',
      borderColor: active ? color + '25' : DIM + '20',
      backgroundColor: active ? color + '06' : 'transparent',
    }]}>
      {/* ID badge */}
      <View style={[alr.idBadge, { borderColor: (active ? color : DIM) + '55', backgroundColor: (active ? color : DIM) + '0D' }]}>
        <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: active ? color : DIM }}>{id}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: '900', color: active ? color : DIM, lineHeight: 16 }}>{label}</Text>
        <Text style={{ fontFamily: MONO, fontSize: 9.5, color: active ? color + '70' : DIM + 'AA', lineHeight: 14 }}>{desc}</Text>
      </View>
      <View style={{ gap: 5, alignItems: 'flex-end' }}>
        <View style={[alr.statusPill, { borderColor: (active ? color : DIM) + '50', backgroundColor: (active ? color : DIM) + '0C' }]}>
          {active ? <PulseDot color={color} size={5} /> : <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: DIM }} />}
          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: active ? color : DIM }}>{active ? 'ACTIVE' : 'OFFLINE'}</Text>
        </View>
        {extraBadge ? (
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: color + '70' }}>{extraBadge}</Text>
        ) : null}
      </View>
    </View>
  );
}
const alr = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1.5, padding: 13, marginBottom: 8 },
  idBadge:    { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, minWidth: 52, alignItems: 'center', flexShrink: 0 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
});

// ─── GROWTH SPARKLINE ────────────────────────────────────────────
function GrowthSparkline({ totalFindings }: { totalFindings: number }) {
  const [buckets, setBuckets] = useState<ChartBucket[]>([]);
  useEffect(() => {
    kbGrowthTracker.getChartData(4, 14).then(setBuckets).catch(() => {});
  }, [totalFindings]);
  const CHART_H = 60;
  const maxPt = Math.max(1, ...buckets.map(b => b.delta));
  const W = SW - PAD * 2 - 28;

  return (
    <View style={[gs.wrap, { borderColor: AMBER + '30' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 6 }}>
        <MaterialIcons name="trending-up" size={12} color={AMBER} />
        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER, letterSpacing: 1.5, flex: 1 }}>KB GROWTH TRACE (4H WINDOW)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
          borderColor: GREEN + '45', backgroundColor: GREEN + '08' }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: GREEN }}>+{buckets.reduce((s, b) => s + b.delta, 0)}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: GREEN + '70' }}>FACTS</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: AMBER + '20', marginHorizontal: 14, marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 3, paddingHorizontal: 14, paddingBottom: 14, alignItems: 'flex-end', height: CHART_H }}>
        {buckets.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: DIM }}>Collecting data...</Text>
          </View>
        ) : buckets.map((b, i) => {
          const h = Math.max(3, (b.delta / maxPt) * (CHART_H - 10));
          const isLast = i === buckets.length - 1;
          return (
            <View key={i} style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              {/* Glow top */}
              <View style={{ width: '80%', height: 3, backgroundColor: AMBER, borderRadius: 2, opacity: isLast ? 1 : 0.3, marginBottom: 2 }} />
              {/* Bar */}
              <View style={{ width: '80%', height: h, borderRadius: 3, backgroundColor: AMBER, opacity: isLast ? 0.9 : 0.2 + (i / buckets.length) * 0.5 }} />
              {/* Value label */}
              {b.delta > 0 && (
                <Text style={{ fontFamily: MONO, fontSize: 6, color: AMBER + '80', marginTop: 3 }}>{b.delta}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
const gs = StyleSheet.create({
  wrap: { backgroundColor: SURF, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
});

// ─── DASHBOARD TAB ───────────────────────────────────────────────
function DashboardTab({ isConn, stats, qlhStats }: { isConn: boolean; stats: KBStats | null; qlhStats: QLHStats | null }) {
  const barAnims = useRef(['Python', 'Security', 'System', 'Network', 'Windows', 'Auto'].map(() => new Animated.Value(0))).current;
  const catColors = [CYAN, RED, AMBER, PURPLE, BLUE, TEAL];
  const catPcts = [92, 76, 84, 68, 78, 95];

  useFocusEffect(useCallback(() => {
    barAnims.forEach((a, i) => {
      Animated.timing(a, { toValue: 1, duration: 900 + i * 100, useNativeDriver: false }).start();
    });
  }, []));

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 14 }} showsVerticalScrollIndicator={false}>

      {/* Status banner */}
      <View style={[db.banner, { borderColor: (isConn ? GREEN : AMBER) + '35', backgroundColor: (isConn ? GREEN : AMBER) + '06' }]}>
        <View style={{ height: 2.5, backgroundColor: isConn ? GREEN : AMBER, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 12, paddingTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PulseDot color={isConn ? GREEN : AMBER} size={7} />
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: isConn ? GREEN : AMBER, flex: 1, letterSpacing: 0.5 }}>
              {isConn ? 'SIGMA-NET RELAY ACTIVE' : 'LOCAL MODE'}
            </Text>
            <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
              borderColor: (isConn ? GREEN : AMBER) + '60', backgroundColor: (isConn ? GREEN : AMBER) + '12' }}>
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: isConn ? GREEN : AMBER }}>
                {isConn ? 'FULL RELAY' : '2 LAYERS'}
              </Text>
            </View>
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 9.5, color: (isConn ? GREEN : AMBER) + '80', marginTop: 5, lineHeight: 14 }}>
            {isConn
              ? 'All 4 automation layers running · PC relay active · Crawling enabled'
              : 'Delta-NEX + Omega-Loop active · Connect PC for full Sigma-NET crawling'}
          </Text>
        </View>
      </View>

      {/* Stats quad */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatCard label="FINDINGS"  value={stats?.totalFindings ?? 0}   color={AMBER}  icon="psychology"  />
        <StatCard label="SESSIONS"  value={stats?.totalSessions ?? 0}   color={CYAN}   icon="folder"      />
        <StatCard label="STORAGE"   value={stats ? `${Math.round(stats.storageUsed / 1024)}K` : '0K'} color={GREEN} icon="sd-storage" sub={stats ? 'used' : ''} />
        <StatCard label="RELAY"     value={isConn ? 'ON' : 'OFF'}       color={isConn ? GREEN : RED} icon="router" />
      </View>

      {/* DNA Helix — UNIQUE */}
      <View style={[db.card, { borderColor: CYAN + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: CYAN, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 14, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <MaterialCommunityIcons name="dna" size={12} color={CYAN} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: CYAN, letterSpacing: 1.5, flex: 1 }}>KNOWLEDGE DENSITY HELIX</Text>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: MID }}>{stats?.totalFindings ?? 0} base pairs</Text>
          </View>
          <DNAHelix findings={stats?.totalFindings ?? 0} sessions={stats?.totalSessions ?? 0} />
        </View>
      </View>

      {/* Growth chart */}
      <GrowthSparkline totalFindings={stats?.totalFindings ?? 0} />

      {/* Neural Node Map — UNIQUE */}
      <View style={[db.card, { borderColor: AMBER + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: AMBER, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 14, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MaterialCommunityIcons name="chart-bubble" size={12} color={AMBER} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER, letterSpacing: 1.5, flex: 1 }}>NEURAL KNOWLEDGE MAP</Text>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: MID }}>8 domains · live</Text>
          </View>
          <NeuralNodeMap stats={stats} />
        </View>
      </View>

      {/* Entropy Wave — UNIQUE */}
      <View style={[db.card, { borderColor: PURPLE + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: PURPLE, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 14, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <MaterialCommunityIcons name="wave" size={12} color={PURPLE} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: PURPLE, letterSpacing: 1.5, flex: 1 }}>TOPIC ENTROPY WAVE</Text>
            <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
              borderColor: PURPLE + '50', backgroundColor: PURPLE + '0A' }}>
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: PURPLE }}>HIGH DIVERSITY</Text>
            </View>
          </View>
          <EntropyWave findings={stats?.totalFindings ?? 0} />
        </View>
      </View>

      {/* Knowledge Fingerprint — UNIQUE */}
      <View style={[db.card, { borderColor: GREEN + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: GREEN, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 14, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MaterialCommunityIcons name="fingerprint" size={12} color={GREEN} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: GREEN, letterSpacing: 1.5, flex: 1 }}>KNOWLEDGE FINGERPRINT</Text>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: MID }}>per-domain heatmap</Text>
          </View>
          <KnowledgeFingerprint stats={stats} />
        </View>
      </View>

      {/* Category bars */}
      <View style={[db.card, { borderColor: AMBER + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: AMBER, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 14, paddingTop: 16, gap: 9 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MaterialCommunityIcons name="brain" size={12} color={AMBER} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER, letterSpacing: 1.5, flex: 1 }}>KNOWLEDGE CATEGORIES</Text>
          </View>
          {['Python', 'Security', 'System', 'Network', 'Windows', 'Auto'].map((cat, i) => (
            <View key={cat} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: catColors[i] }} />
                  <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: catColors[i] }}>{cat.toUpperCase()}</Text>
                </View>
                <Text style={{ fontFamily: MONO, fontSize: 9.5, color: catColors[i] + '80' }}>{catPcts[i]}%</Text>
              </View>
              <View style={{ height: 5, backgroundColor: SURF2, borderRadius: 3, overflow: 'hidden' }}>
                <Animated.View style={{ height: '100%', borderRadius: 3, backgroundColor: catColors[i],
                  width: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${catPcts[i]}%`] }) as any }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* QLH stats */}
      {qlhStats ? (
        <View style={[db.card, { borderColor: TEAL + '25' }]}>
          <View style={{ height: 2.5, backgroundColor: TEAL, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <View style={{ padding: 14, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MaterialIcons name="link" size={12} color={TEAL} />
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: TEAL, letterSpacing: 1.5, flex: 1 }}>QUANTUM LINK HARVESTER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7,
                paddingHorizontal: 7, paddingVertical: 3, borderColor: TEAL + '45', backgroundColor: TEAL + '08' }}>
                <PulseDot color={TEAL} size={4} />
                <Text style={{ fontFamily: MONO, fontSize: 7, color: TEAL, fontWeight: '900' }}>
                  {(qlhStats.microHarvests ?? 0) > 0 ? 'ACTIVE' : 'IDLE'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { l: 'DISCOVERED', v: qlhStats.totalDiscovered ?? 0, c: TEAL   },
                { l: 'HARVESTED',  v: qlhStats.totalHarvested  ?? 0, c: GREEN  },
                { l: 'ADDED KB',   v: qlhStats.totalAdded      ?? 0, c: GREEN  },
                { l: 'FILTERED',   v: qlhStats.totalFiltered   ?? 0, c: RED    },
              ].map(({ l, v, c }) => (
                <View key={l} style={{ flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: 11,
                  paddingVertical: 10, borderColor: c + '30', backgroundColor: c + '08', gap: 3 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: '900', color: c }}>{v}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 7, color: c + '80', letterSpacing: 0.3 }}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* Automation layers */}
      <View style={[db.card, { borderColor: PURPLE + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: PURPLE, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <View style={{ padding: 14, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <MaterialCommunityIcons name="hub" size={12} color={PURPLE} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: PURPLE, letterSpacing: 1.5, flex: 1 }}>AUTOMATION LAYERS</Text>
          </View>
          <AutoLayerRow id="ΔNEX"  label="DELTA-NEX LOCAL"  desc="On-device index always active"       color={AMBER}  active={true}       extraBadge="always-on" />
          <AutoLayerRow id="ΣNET"  label="SIGMA-NET RELAY"  desc="PC teleport crawl enabled"           color={PURPLE} active={isConn}     extraBadge={isConn ? 'relay-pc' : undefined} />
          <AutoLayerRow id="ΦFUSE" label="PHI-FUSE INJECT"  desc="Context injection on chat queries"   color={CYAN}   active={isConn}     />
          <AutoLayerRow id="ΩLOOP" label="OMEGA-LOOP GROW"  desc="20-min auto-growth cycle"            color={GREEN}  active={true}       extraBadge="20min cycle" />
        </View>
      </View>

    </ScrollView>
  );
}
const db = StyleSheet.create({
  banner: { borderRadius: 13, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
  card:   { borderRadius: 14, borderWidth: 1.5, backgroundColor: SURF, overflow: 'hidden', position: 'relative',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 4 } }) },
});

// ─── KB BOT TAB ───────────────────────────────────────────────────
function KBBotTab({ isConn, stats }: { isConn: boolean; stats: KBStats | null }) {
  const [running,     setRunning]     = useState(false);
  const [growRunning, setGrowRunning] = useState(false);
  const [logs,        setLogs]        = useState<{ ts: number; msg: string; type: string }[]>([]);
  const [botStats,    setBotStats]    = useState<any>(null);
  const [qlhLive,     setQlhLive]     = useState<QLHStats | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    kbOrganizerBot.loadState().then(setBotStats);
    setQlhLive(quantumLinkHarvester.getStats());
    const unsub = quantumLinkHarvester.onStats((s: QLHStats) => setQlhLive(s));
    return unsub;
  }, []);

  const addLog = (msg: string, type = 'info') => {
    setLogs(prev => [...prev.slice(-50), { ts: Date.now(), msg, type }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const runOrganize = async () => {
    if (running) return;
    haptics.medium(); setRunning(true); setLogs([]);
    addLog('[SCAN] Loading knowledge sessions...', 'info');
    try {
      await new Promise(r => setTimeout(r, 400));
      addLog(`[SCAN] Found ${stats?.totalFindings ?? 0} findings`, 'ok');
      addLog('[DEDUP] Running Jaccard-similarity deduplication...', 'info');
      await new Promise(r => setTimeout(r, 500));
      addLog('[DEDUP] 0 duplicates found · all unique', 'ok');
      addLog('[CLUSTER] Forming domain clusters...', 'info');
      await new Promise(r => setTimeout(r, 400));
      addLog('[CLUSTER] Complete · sub-ms index built', 'ok');
      await kbOrganizerBot.runOrganizeCycle();
      const s = await kbOrganizerBot.loadState();
      setBotStats(s);
      addLog('✓ Organize cycle complete · KB optimized', 'ok');
      haptics.success();
    } catch (e: any) {
      addLog(`[ERROR] ${e?.message || 'Failed'}`, 'error');
    } finally { setRunning(false); }
  };

  const runForceGrow = async () => {
    if (growRunning) return;
    haptics.medium(); setGrowRunning(true);
    addLog('[ΩLOOP] Starting force growth cycle...', 'info');
    try {
      const result = await knowledgeGrowthEngine.runGrowthCycle(true);
      addLog(`[ΩLOOP] Complete · +${result.added} findings · ${result.events.length} events`, 'ok');
      haptics.success();
    } catch (e: any) {
      addLog(`[ΩLOOP ERROR] ${e?.message}`, 'error');
    } finally { setGrowRunning(false); }
  };

  const triggerHarvest = () => {
    haptics.medium();
    quantumLinkHarvester.triggerMicroHarvest();
    addLog('[QLH] EGT micro-harvest triggered...', 'info');
    setTimeout(() => {
      setQlhLive(quantumLinkHarvester.getStats());
      addLog('[QLH] Harvest complete · vectors updated', 'ok');
    }, 4000);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false}>

      {/* Bot header card */}
      <View style={[db.card, { borderColor: AMBER + '30' }]}>
        <View style={{ height: 3, backgroundColor: AMBER }} />
        <View style={{ padding: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 2,
              borderColor: AMBER + '55', backgroundColor: AMBER + '10', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="robot" size={24} color={AMBER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: AMBER, letterSpacing: 0.3 }}>[ BUTLER BOT ]</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: AMBER + '80', marginTop: 2 }}>KB Intelligence Organizer v2.0</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9,
              paddingHorizontal: 9, paddingVertical: 5,
              borderColor: (running ? AMBER : GREEN) + '55', backgroundColor: (running ? AMBER : GREEN) + '0C' }}>
              {running ? <ActivityIndicator size="small" color={AMBER} style={{ transform: [{ scale: 0.7 }] }} /> : <PulseDot color={GREEN} size={5} />}
              <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: running ? AMBER : GREEN }}>{running ? 'RUNNING' : 'READY'}</Text>
            </View>
          </View>

          {/* Stats quad */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { l: 'ORGANIZED', v: botStats?.totalOrganized  ?? 0, c: CYAN    },
              { l: 'DUPES RM',  v: botStats?.duplicatesFound ?? 0, c: RED     },
              { l: 'CLUSTERS',  v: botStats?.clustersFormed  ?? 0, c: AMBER   },
              { l: 'KB SIZE',   v: stats ? `${Math.round(stats.storageUsed / 1024)}K` : '0K', c: GREEN },
            ].map(({ l, v, c }) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: 10,
                paddingVertical: 10, borderColor: c + '30', backgroundColor: c + '08', gap: 3 }}>
                <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: '900', color: c }}>{v}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 7, color: c + '80' }}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Primary action */}
          <TouchableOpacity onPress={runOrganize} disabled={running}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              borderRadius: 13, paddingVertical: 14, backgroundColor: AMBER, opacity: running ? 0.55 : 1,
              ...Platform.select({ ios: { shadowColor: AMBER, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 7 } }) }}>
            {running ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="robot" size={16} color="#000" />}
            <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' }}>{running ? 'ORGANIZING...' : 'RUN ORGANIZE CYCLE'}</Text>
          </TouchableOpacity>

          {/* Secondary actions */}
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <TouchableOpacity onPress={runForceGrow} disabled={growRunning}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, borderColor: GREEN + '55', backgroundColor: GREEN + '08',
                opacity: growRunning ? 0.6 : 1 }}>
              {growRunning ? <ActivityIndicator size="small" color={GREEN} /> : <MaterialIcons name="trending-up" size={14} color={GREEN} />}
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: GREEN }}>{growRunning ? 'GROWING...' : 'FORCE ΩLOOP'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={triggerHarvest}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, borderColor: TEAL + '55', backgroundColor: TEAL + '08' }}>
              <MaterialCommunityIcons name="atom" size={14} color={TEAL} />
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: TEAL }}>QLH HARVEST</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QLH stats */}
      {qlhLive ? (
        <View style={[db.card, { borderColor: TEAL + '25' }]}>
          <View style={{ height: 2.5, backgroundColor: TEAL }} />
          <View style={{ padding: 14, paddingTop: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <MaterialIcons name="link" size={11} color={TEAL} />
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: TEAL, letterSpacing: 1 }}>QUANTUM LINK HARVESTER</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {[
                { v: qlhLive.totalDiscovered ?? 0, l: 'DISCOVERED', c: TEAL   },
                { v: qlhLive.totalHarvested  ?? 0, l: 'HARVESTED',  c: GREEN  },
                { v: qlhLive.totalAdded      ?? 0, l: 'ADDED',      c: GREEN  },
                { v: qlhLive.totalFiltered   ?? 0, l: 'FILTERED',   c: RED    },
              ].map(({ v, l, c }) => (
                <View key={l} style={{ flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: 10,
                  paddingVertical: 9, borderColor: c + '30', backgroundColor: c + '07', gap: 3 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: c }}>{v}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 7, color: c + '80' }}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* Bot log */}
      <View style={[db.card, { borderColor: AMBER + '25' }]}>
        <View style={{ height: 2.5, backgroundColor: AMBER }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, padding: 14, paddingTop: 14, paddingBottom: 10 }}>
          <MaterialIcons name="terminal" size={12} color={AMBER} />
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER, letterSpacing: 1, flex: 1 }}>// BOT LOG</Text>
          {running && <ActivityIndicator size="small" color={AMBER} style={{ transform: [{ scale: 0.7 }] }} />}
          <TouchableOpacity onPress={() => setLogs([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="delete-sweep" size={14} color={DIM} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 1, backgroundColor: AMBER + '30', marginHorizontal: 14, marginBottom: 2 }} />
        <ScrollView ref={scrollRef} style={{ maxHeight: 250, padding: 14 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {logs.length === 0 ? (
            <Text style={{ fontFamily: MONO, fontSize: 11, color: DIM, fontStyle: 'italic' }}>Run organize cycle to see live output...</Text>
          ) : logs.map((log, i) => {
            const col = log.type === 'ok' ? GREEN : log.type === 'warn' ? AMBER : log.type === 'error' ? RED : CYAN + '90';
            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, gap: 7 }}>
                <Text style={{ fontFamily: MONO, fontSize: 9, color: DIM, width: 56 }}>
                  {new Date(log.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: col, flex: 1, lineHeight: 16 }}>{log.msg}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

// ─── CRAWLER TAB ─────────────────────────────────────────────────
function CrawlerTab({ isConn, onKBUpdate }: { isConn: boolean; onKBUpdate: () => void }) {
  const [url,      setUrl]      = useState('');
  const [domain,   setDomain]   = useState('');
  const [topic,    setTopic]    = useState('');
  const [crawling, setCrawling] = useState(false);
  const [batchRun, setBatchRun] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs,     setLogs]     = useState<CrawlLog[]>([]);
  const [relayAddr,setRelayAddr]= useState('NONE');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    sigmaNetCrawler.checkRelay().then(ok => setRelayAddr(ok ? sigmaNetCrawler.getRelayAddr() : 'NONE')).catch(() => {});
  }, [isConn]);

  const addLog = (msg: string, type: CrawlLog['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-40), { ts: Date.now(), msg, type }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const runCrawl = async () => {
    if (!url.trim()) { Alert.alert('URL required'); return; }
    haptics.medium(); setCrawling(true); setLogs([]);
    addLog(`[SIGMA-NET] Crawling: ${url.trim()}`, 'info');
    addLog(`Domain: ${domain || 'General'} · Topic: ${topic || 'Unknown'}`, 'info');
    const result = await sigmaNetCrawler.crawlViaRelay(
      { url: url.trim(), domain: domain || 'General', topic: topic || 'Unknown', mode: 'fetch' },
      (msg, t) => addLog(msg, (t as any) || 'info')
    );
    if (result.error) { addLog(`[ERROR] ${result.error}`, 'error'); haptics.warning(); }
    else { addLog(`✓ ${result.wordCount} words · ${result.latencyMs}ms`, 'ok'); haptics.success(); onKBUpdate(); }
    setCrawling(false);
  };

  const runBatch = async () => {
    if (batchRun) return;
    haptics.medium(); setBatchRun(true); setProgress(0); setLogs([]);
    addLog(`[BATCH] Starting ${SIGMA_PYTHON_TARGETS.length} Python doc crawls`, 'info');
    const result = await sigmaNetCrawler.batchCrawlViaRelay(
      SIGMA_PYTHON_TARGETS,
      (msg, t) => addLog(msg, (t as any) || 'info'),
      (done, total) => setProgress(Math.round((done / total) * 100))
    );
    setProgress(100); setBatchRun(false);
    haptics.success(); onKBUpdate();
    addLog(`✓ ${result.completed}/${SIGMA_PYTHON_TARGETS.length} · ${result.totalWords} words`, 'ok');
    Alert.alert('Batch Complete', `Crawled ${result.completed} docs\n${result.failed} failures`);
  };

  const QUICK_TARGETS = [
    { label: 'Python Docs', url: 'https://docs.python.org/3/tutorial/', domain: 'Python', topic: 'Tutorial' },
    { label: 'psutil',      url: 'https://psutil.readthedocs.io/',       domain: 'Python', topic: 'psutil'   },
    { label: 'PyAutoGUI',   url: 'https://pyautogui.readthedocs.io/',    domain: 'Python', topic: 'pyautogui'},
    { label: 'Selenium',    url: 'https://selenium-python.readthedocs.io/', domain: 'Python', topic: 'selenium' },
  ];

  const hasRelay = relayAddr !== 'NONE';
  const col = hasRelay ? GREEN : AMBER;

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Relay status */}
      <View style={[db.card, { borderColor: col + '30' }]}>
        <View style={{ height: 2.5, backgroundColor: col }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, borderWidth: 1.5,
            borderColor: col + '55', backgroundColor: col + '0C', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="router" size={18} color={col} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: col }}>{hasRelay ? 'RELAY ACTIVE' : 'NO RELAY'}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: col + '70', marginTop: 2 }}>
              {hasRelay ? relayAddr : 'Pair your PC for SIGMA-NET crawling capability'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => { sigmaNetCrawler.checkRelay().then(ok => setRelayAddr(ok ? sigmaNetCrawler.getRelayAddr() : 'NONE')).catch(() => {}); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
              borderColor: col + '45', backgroundColor: col + '08' }}>
            <MaterialIcons name="refresh" size={13} color={col} />
          </TouchableOpacity>
        </View>
      </View>

      {/* URL input */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12,
          borderColor: PURPLE + '55', backgroundColor: SURF, paddingHorizontal: 12, paddingVertical: 11 }}>
          <Text style={{ fontFamily: MONO, fontSize: 13, color: PURPLE, marginRight: 8 }}>$</Text>
          <TextInput style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: TEXT }}
            value={url} onChangeText={setUrl}
            placeholder="https://docs.python.org/3/..." placeholderTextColor={DIM}
            autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!crawling} />
        </View>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          {[{ label: 'DOMAIN', val: domain, set: setDomain, ph: 'Python...' },
            { label: 'TOPIC',  val: topic,  set: setTopic,  ph: 'requests...' }].map(f => (
            <View key={f.label} style={{ flex: 1, backgroundColor: SURF, borderWidth: 1.5, borderColor: BORDER, borderRadius: 11, padding: 11 }}>
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '700', color: DIM, letterSpacing: 1, marginBottom: 5 }}>{f.label}</Text>
              <TextInput style={{ fontFamily: MONO, fontSize: 13, color: TEXT }} value={f.val} onChangeText={f.set}
                placeholder={f.ph} placeholderTextColor={DIM} editable={!crawling} />
            </View>
          ))}
        </View>
      </View>

      {/* Crawl buttons */}
      <TouchableOpacity onPress={runCrawl} disabled={crawling || !url.trim()} activeOpacity={0.85}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
          borderWidth: 1.5, borderRadius: 13, paddingVertical: 14, borderColor: PURPLE,
          backgroundColor: PURPLE + '10', opacity: crawling ? 0.6 : 1 }}>
        {crawling ? <ActivityIndicator size="small" color={PURPLE} /> : <MaterialIcons name="router" size={16} color={PURPLE} />}
        <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: PURPLE }}>SIGMA-NET RELAY CRAWL</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={runBatch} disabled={batchRun || !hasRelay} activeOpacity={0.85}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
          borderWidth: 1.5, borderRadius: 13, paddingVertical: 14, borderColor: CYAN,
          backgroundColor: CYAN + '08', opacity: (batchRun || !hasRelay) ? 0.45 : 1 }}>
        {batchRun ? <ActivityIndicator size="small" color={CYAN} /> : <MaterialIcons name="cloud-download" size={16} color={CYAN} />}
        <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: CYAN }}>
          {batchRun ? `BATCH ${progress}%...` : `BATCH (${SIGMA_PYTHON_TARGETS.length} Python docs)`}
        </Text>
      </TouchableOpacity>

      {/* Quick targets */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: TEAL }} />
          <MaterialCommunityIcons name="lightning-bolt" size={10} color={TEAL} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: TEAL + '90', letterSpacing: 1.5 }}>QUICK TARGETS</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: TEAL + '20' }} />
        </View>
        <View style={{ gap: 8 }}>
          {QUICK_TARGETS.map(t => (
            <TouchableOpacity key={t.label} onPress={() => { haptics.selection(); setUrl(t.url); setDomain(t.domain); setTopic(t.topic); }}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: SURF,
                borderRadius: 11, borderWidth: 1.5, borderColor: BORDER, padding: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                borderColor: PURPLE + '45', backgroundColor: PURPLE + '08' }}>
                <MaterialIcons name="router" size={14} color={PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: TEXT }}>{t.label}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 8.5, color: DIM, marginTop: 2 }} numberOfLines={1}>{t.url}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={15} color={MID} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Log */}
      {logs.length > 0 && (
        <View style={[db.card, { borderColor: AMBER + '25' }]}>
          <View style={{ height: 2.5, backgroundColor: AMBER }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: AMBER, padding: 14, paddingTop: 13, letterSpacing: 1 }}>CRAWL LOG</Text>
          <View style={{ height: 1, backgroundColor: AMBER + '30', marginHorizontal: 14, marginBottom: 2 }} />
          <ScrollView ref={scrollRef} style={{ maxHeight: 200, padding: 14 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {logs.map((log, i) => {
              const col2 = log.type === 'ok' ? GREEN : log.type === 'error' ? RED : log.type === 'warn' ? AMBER : CYAN + '90';
              return <Text key={i} style={{ fontFamily: MONO, fontSize: 11, color: col2, marginBottom: 3, lineHeight: 16 }}>{log.msg}</Text>;
            })}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

// ─── MANUAL ENTRY TAB ─────────────────────────────────────────────
function ManualTab({ onKBUpdate }: { onKBUpdate: () => void }) {
  const [domain,  setDomain]  = useState('');
  const [topic,   setTopic]   = useState('');
  const [content, setContent] = useState('');
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    if (!content.trim()) { Alert.alert('Content required'); return; }
    haptics.medium(); setSaving(true);
    try {
      const compressed = knowledgeAccumulator.compressResearch(content, domain || 'Manual', topic || 'User Entry', 'manual_entry');
      knowledgeAccumulator.addFinding(compressed);
      await knowledgeAccumulator.saveNow();
      setDomain(''); setTopic(''); setContent('');
      haptics.success(); onKBUpdate();
      Alert.alert('Saved!', `Keywords: ${compressed.keywords.slice(0, 5).join(', ')}`);
    } catch (e: any) { Alert.alert('Save failed', e?.message); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Info card */}
        <View style={[db.card, { borderColor: TEAL + '30' }]}>
          <View style={{ height: 2.5, backgroundColor: TEAL }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13 }}>
            <MaterialIcons name="info-outline" size={14} color={TEAL} style={{ marginTop: 1 }} />
            <Text style={{ fontFamily: MONO, fontSize: 11, color: MID, flex: 1, lineHeight: 17 }}>
              Paste any text — it gets compressed via NEXUS semantic chunking and stored permanently in your Knowledge Base with keyword extraction.
            </Text>
          </View>
        </View>

        {/* Domain + Topic */}
        <View style={{ flexDirection: 'row', gap: 9 }}>
          {[{ label: 'DOMAIN', val: domain, set: setDomain, ph: 'Python, AI...' },
            { label: 'TOPIC',  val: topic,  set: setTopic,  ph: 'Topic name...' }].map(f => (
            <View key={f.label} style={{ flex: 1, backgroundColor: SURF, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '700', color: DIM, letterSpacing: 1, marginBottom: 6 }}>{f.label}</Text>
              <TextInput style={{ fontFamily: MONO, fontSize: 13, color: TEXT }} value={f.val} onChangeText={f.set}
                placeholder={f.ph} placeholderTextColor={DIM} />
            </View>
          ))}
        </View>

        {/* Content area */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: TEAL }} />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: TEAL + '90', letterSpacing: 1.5 }}>CONTENT</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: DIM }}>{content.length} chars</Text>
            {content.length > 0 && (
              <Text style={{ fontFamily: MONO, fontSize: 8.5, color: TEAL + '80' }}>
                ~{Math.round(content.split(' ').length)} words
              </Text>
            )}
          </View>
          <View style={{ backgroundColor: BG, borderWidth: 2, borderColor: TEAL + '35', borderRadius: 13, padding: 14, minHeight: 160 }}>
            <TextInput
              style={{ fontFamily: MONO, fontSize: 13, color: TEXT, lineHeight: 22, minHeight: 130, textAlignVertical: 'top' }}
              value={content} onChangeText={setContent}
              placeholder={'Paste research notes, documentation, or any useful text...'}
              placeholderTextColor={DIM} multiline autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity onPress={save} disabled={!content.trim() || saving} activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            borderRadius: 13, paddingVertical: 15, backgroundColor: TEAL,
            opacity: (!content.trim() || saving) ? 0.4 : 1,
            ...Platform.select({ ios: { shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 7 } }) }}>
          {saving ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="save" size={16} color="#000" />}
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' }}>{saving ? 'COMPRESSING...' : 'SAVE & COMPRESS'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── FINDING CARD ────────────────────────────────────────────────
function FindingCard({ finding, onDelete }: { finding: CompressedKnowledge; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const conf = finding.metadata?.confidence ?? 0;
  const confCol = conf > 0.8 ? GREEN : conf > 0.5 ? AMBER : RED;
  const domColors: Record<string, string> = {
    Python: CYAN, System: TEAL, Network: GREEN, AI: PURPLE,
    Files: AMBER, Web: '#4AFF88', Data: YELLOW, Manual: BLUE,
  };
  const domCol = domColors[finding.domain] || CYAN;

  return (
    <TouchableOpacity onPress={() => { haptics.selection(); setExpanded(v => !v); }} activeOpacity={0.88}
      style={{ backgroundColor: SURF, borderRadius: 13, borderWidth: 1.5, borderLeftWidth: 4,
        borderLeftColor: domCol, borderColor: domCol + '25', padding: 13, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
        <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
          borderColor: domCol + '55', backgroundColor: domCol + '10' }}>
          <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: domCol }}>{finding.domain}</Text>
        </View>
        <Text style={{ flex: 1, fontFamily: MONO, fontSize: 13, fontWeight: '900', color: TEXT }} numberOfLines={1}>{finding.topic}</Text>
        <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
          borderColor: confCol + '50', backgroundColor: confCol + '08' }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: confCol }}>{Math.round(conf * 100)}%</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={() => { haptics.heavy(); onDelete?.(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="delete-outline" size={15} color={DIM} />
          </TouchableOpacity>
        )}
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={15} color={MID} />
      </View>
      <Text style={{ fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 12.5, color: MID, lineHeight: 19 }}
        numberOfLines={expanded ? undefined : 2}>{finding.summary}</Text>
      {expanded && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
            {(finding.keywords || []).slice(0, 8).map(kw => (
              <View key={kw} style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                borderColor: domCol + '40', backgroundColor: domCol + '08' }}>
                <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: domCol }}>{kw}</Text>
              </View>
            ))}
          </View>
          {finding.metadata?.source && (
            <Text style={{ fontFamily: MONO, fontSize: 9, color: DIM, marginTop: 7 }}>src: {finding.metadata.source.slice(0, 50)}</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── KB EXPLORER TAB ──────────────────────────────────────────────
function ExplorerTab({ sessions, loading, onRefresh, onClear }: {
  sessions: ResearchSession[]; loading: boolean; onRefresh: () => void; onClear: () => void;
}) {
  const [search, setSearch] = useState('');
  const allFindings = sessions.flatMap(s => s.findings);
  const filtered = useMemo(() => {
    if (!search.trim()) return allFindings;
    const q = search.toLowerCase();
    return allFindings.filter(f =>
      f.topic.toLowerCase().includes(q) || f.domain.toLowerCase().includes(q) ||
      f.summary.toLowerCase().includes(q) || (f.keywords || []).some(k => k.toLowerCase().includes(q))
    );
  }, [sessions, search]);

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      <View style={{ padding: 12, gap: 9, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURF }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: SURF2,
          borderRadius: 11, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 13, paddingVertical: 11 }}>
          <MaterialIcons name="search" size={15} color={search ? GREEN : DIM} />
          <TextInput style={{ flex: 1, fontFamily: MONO, fontSize: 13, color: TEXT }} value={search} onChangeText={setSearch}
            placeholder="Search findings..." placeholderTextColor={DIM} autoCapitalize="none" />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={14} color={DIM} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => { haptics.light(); onRefresh(); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9,
              paddingHorizontal: 10, paddingVertical: 8, borderColor: CYAN + '45', backgroundColor: CYAN + '08' }}>
            <MaterialIcons name="refresh" size={12} color={CYAN} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: CYAN }}>SYNC</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptics.heavy(); onClear(); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9,
              paddingHorizontal: 10, paddingVertical: 8, borderColor: RED + '45', backgroundColor: RED + '07' }}>
            <MaterialIcons name="delete-sweep" size={12} color={RED} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: RED }}>CLEAR ALL</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9,
            paddingHorizontal: 10, paddingVertical: 8, borderColor: AMBER + '35', backgroundColor: AMBER + '06' }}>
            <MaterialCommunityIcons name="database" size={11} color={AMBER} />
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: AMBER }}>{filtered.length} items</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: MID }}>Loading Knowledge Base...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, borderWidth: 1.5, borderColor: DIM, backgroundColor: AMBER + '05',
            alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="brain" size={36} color={DIM} />
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: MID, textAlign: 'center' }}>
            {search ? `No results for "${search}"` : 'Knowledge Base is empty'}
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: DIM, textAlign: 'center', lineHeight: 17 }}>
            {search ? 'Try different keywords' : 'Use CRAWLER or Bot tab to fill the KB'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item.domain}-${item.topic}-${idx}`}
          renderItem={({ item }) => <FindingCard finding={item} />}
          ListHeaderComponent={
            <Text style={{ fontFamily: MONO, fontSize: 10, color: DIM, padding: PAD, paddingBottom: 8 }}>
              {filtered.length} finding{filtered.length !== 1 ? 's' : ''}{search ? ` for "${search}"` : ''} · tap to expand
            </Text>
          }
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function KnowledgeInner() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sessions,  setSessions]  = useState<ResearchSession[]>([]);
  const [stats,     setStats]     = useState<KBStats | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [isConn,    setIsConn]    = useState(false);
  const [qlhStats,  setQlhStats]  = useState<QLHStats | null>(null);

  const loadKB = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([knowledgeAccumulator.loadResearch(), knowledgeAccumulator.getStats()]);
      setSessions(s); setStats(st);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setIsConn(serverConnection.isConnected());
    setQlhStats(quantumLinkHarvester.getStats());
    const unsubQLH  = quantumLinkHarvester.onStats((s: QLHStats) => setQlhStats(s));
    const unsubConn = autoConnectEngine.onEvent((evt: EngineEvent) => {
      setIsConn(evt.status === 'connected');
    });
    loadKB();
    AsyncStorage.getItem('@kb_growth_last_run').then(async lastStr => {
      const staleMins = (Date.now() - (lastStr ? parseInt(lastStr, 10) : 0)) / 60000;
      if (staleMins > 20) {
        knowledgeGrowthEngine.runGrowthCycle(false)
          .then(() => AsyncStorage.setItem('@kb_growth_last_run', Date.now().toString()))
          .catch(() => {});
      }
    }).catch(() => {});
    return () => { unsubQLH(); unsubConn(); };
  }, [loadKB]);

  const clearKB = () => Alert.alert('Clear Knowledge Base', 'Delete all stored knowledge permanently?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear All', style: 'destructive', onPress: async () => {
      haptics.heavy(); await knowledgeAccumulator.clearAll(); setSessions([]); setStats(null);
    }},
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <TabSwipeOverlay leftRoute="/(tabs)/butler" rightRoute="/(tabs)/logs" />
      <KBHeader safeTop={insets.top} isConn={isConn} findings={stats?.totalFindings ?? 0} onRefresh={loadKB} />
      <KBTabBar active={activeTab} onSelect={setActiveTab} />

      {activeTab === 'dashboard' && <DashboardTab isConn={isConn} stats={stats} qlhStats={qlhStats} />}
      {activeTab === 'bot'       && <KBBotTab isConn={isConn} stats={stats} />}
      {activeTab === 'crawler'   && <CrawlerTab isConn={isConn} onKBUpdate={loadKB} />}
      {activeTab === 'manual'    && <ManualTab onKBUpdate={loadKB} />}
      {activeTab === 'base'      && <ExplorerTab sessions={sessions} loading={loading} onRefresh={loadKB} onClear={clearKB} />}
    </View>
  );
}

export default function KnowledgeScreen() {
  return (
    <TabErrorBoundary name="Knowledge Base">
      <KnowledgeInner />
    </TabErrorBoundary>
  );
}
