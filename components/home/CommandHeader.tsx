/**
 * BUTLER AI — COMMAND HEADER v3.0 · GLOWWAVE-X SYNTHESIS
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * THE MERGED NEXUS HERO — ONE COMPONENT, EVERYTHING.
 *
 * Replaces: HomeHeader + NexusMegaHeader + NexusCommandCenter + NexusHero + NexusButlerHeaderCard
 *
 * SECTIONS (top → bottom):
 *   ① GlowRail + color stripe
 *   ② Robot hero (ButlerLogo animated, floating, tap-for-tip)
 *   ③ 3D BUTLER AI title (GlitchText + shadow stack)
 *   ④ Status chip row (OFFLINE/CONNECTED · LOCAL AI · AES-256 · HMAC)
 *   ⑤ Live clock (absolute top-right)
 *   ⑥ Metrics strip (6 cells: CPU/RAM/DISK/PING/SCRIPTS/KB)
 *   ⑦ Twin panel (shell terminal left · LAN status right)
 *   ⑧ Capabilities grid (4×2 = 8 cells, SVG icons)
 *   ⑨ CTA buttons (SCAN QR · OPEN AI CHAT)
 *   ⑩ Tips ticker + 5-color stripe footer
 *
 * ANIMATION DRIVER RULE:
 *   All transform/opacity → native driver
 *   All color interpolations → isolated wrapper View, JS driver
 */

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Animated, Dimensions, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlitchText } from '@/components/ui/GlitchText';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { BUTLER_ROBOT_TIPS } from '@/constants/robotTips';
import { FontFamily } from '@/constants/typography';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;
const MONO: any = FontFamily.mono;
const DISP: any = FontFamily.display;
const DISP_BOLD: any = FontFamily.displayBold;

// GlowWave-X palette — ice-blue HUD theme
const C = {
  bg:        '#04080F',
  surface:   '#080F1A',
  surface2:  '#0B1420',
  card:      '#0F1828',
  border:    'rgba(110,231,255,0.10)',
  borderHi:  'rgba(110,231,255,0.22)',
  ice:       '#6EE7FF',
  iceHi:     '#B8F0FF',
  iceDim:    '#2FA2BF',
  mint:      '#34D399',
  violet:    '#A78BFA',
  amber:     '#FDBA74',
  coral:     '#F87171',
  sky:       '#60A5FA',
  text:      '#E4EBF5',
  textMid:   '#7A8FA5',
  textDim:   '#3D4C63',
  dim:       '#1B2A3A',
};

// Capability grid items
const CAPS = [
  { label: 'AI CHAT',  icon: 'robot-happy-outline',     color: C.ice,   tab: 'butler',    hex: '0xA101' },
  { label: 'FLOWS',    icon: 'auto-fix',                 color: C.violet, tab: 'builder',   hex: '0xA202' },
  { label: 'FORGE',    icon: 'code-braces',              color: C.amber, tab: 'scripts',   hex: '0xA303' },
  { label: 'KB',       icon: 'brain',                    color: C.mint,  tab: 'knowledge', hex: '0xA404' },
  { label: 'VAULT',    icon: 'folder-lock-outline',      color: C.coral, tab: 'fileshare', hex: '0xA505' },
  { label: 'INTEL',    icon: 'chart-line',               color: C.sky,   tab: 'logs',      hex: '0xA606' },
  { label: 'CONFIG',   icon: 'tune-variant',             color: '#8888BB', tab: 'settings',  hex: '0xA707' },
  { label: 'PAIR',     icon: 'server-network',           color: '#00CCBB', tab: 'connect',   hex: '0xA808' },
] as const;

const CRAWLER_LINES = [
  { text: 'butler@nexus:~$ python -c "import psutil; print(psutil.cpu_percent())"', color: C.ice,   cmd: true },
  { text: '> 23.4',                                                                  color: C.mint,  cmd: false },
  { text: 'butler@nexus:~$ scan --lan --discover',                                   color: C.amber, cmd: true },
  { text: '> [NEXUS] Found 3 devices on 192.168.1.x',                               color: C.amber, cmd: false },
  { text: '> butler_server @ 192.168.1.100:8766',                                   color: C.mint,  cmd: false },
  { text: 'butler@nexus:~$ auth --verify --hmac',                                    color: C.ice,   cmd: true },
  { text: '> HMAC-SHA256 VERIFIED · AES-256-GCM ACTIVE',                            color: C.mint,  cmd: false },
  { text: 'butler@nexus:~$ kb sync --ai --brief',                                    color: C.violet,cmd: true },
  { text: '> 847 vectors · 23 facts · SIGMA active',                                color: C.violet,cmd: false },
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
] as const;

// ─── ANIMATED ATOMS ───────────────────────────────────────────────

function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15,duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a,
    }} />
  );
}

// ─── ROBOT HERO (floating mascot + tip tooltip) ───────────────────
function RobotHero({ isConn }: { isConn: boolean }) {
  const floatA    = useRef(new Animated.Value(0)).current; // native — translateY
  const glowA     = useRef(new Animated.Value(0.4)).current; // native — opacity
  const orbitA    = useRef(new Animated.Value(0)).current; // native — orbit rotation
  const ring1A    = useRef(new Animated.Value(0)).current; // native — ring1 rotation
  const ring2A    = useRef(new Animated.Value(0)).current; // native — ring2 rotation
  const tipOpA    = useRef(new Animated.Value(0)).current; // native — tooltip opacity
  const tipSlideA = useRef(new Animated.Value(8)).current; // native — tooltip translateY

  const [tipText,    setTipText]    = useState('');
  const [tipVisible, setTipVisible] = useState(false);
  const tipRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ringColor = isConn ? C.mint : C.amber;

  useEffect(() => {
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2400, useNativeDriver: true }),
    ]));
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1200, useNativeDriver: true }),
      Animated.timing(glowA, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
    ]));
    const orbit = Animated.loop(
      Animated.timing(orbitA, { toValue: 1, duration: 9000, useNativeDriver: true })
    );
    const r1 = Animated.loop(
      Animated.timing(ring1A, { toValue: 1, duration: 5200, useNativeDriver: true })
    );
    const r2 = Animated.loop(
      Animated.timing(ring2A, { toValue: 1, duration: 7400, useNativeDriver: true })
    );
    float.start(); glow.start(); orbit.start(); r1.start(); r2.start();
    return () => { float.stop(); glow.stop(); orbit.stop(); r1.stop(); r2.stop(); };
  }, []);

  const showTip = useCallback(() => {
    if (tipRef.current) { clearTimeout(tipRef.current); tipRef.current = null; }
    haptics.medium();
    const tip = BUTLER_ROBOT_TIPS[Math.floor(Math.random() * BUTLER_ROBOT_TIPS.length)];
    setTipText(tip);
    setTipVisible(true);
    tipOpA.setValue(0);
    tipSlideA.setValue(8);
    Animated.parallel([
      Animated.timing(tipOpA,    { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(tipSlideA, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    tipRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(tipOpA,    { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(tipSlideA, { toValue: -6, duration: 200, useNativeDriver: true }),
      ]).start(() => setTipVisible(false));
    }, 3200);
  }, []);

  useEffect(() => {
    return () => { if (tipRef.current) clearTimeout(tipRef.current); };
  }, []);

  const floatY   = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const ring1Rot = ring1A.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ring2Rot = ring2A.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const orbitRot = orbitA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const S = 110; // robot size dp
  const OR = S * 0.62; // orbit radius

  return (
    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
      {/* Tooltip */}
      {tipVisible && (
        <Animated.View style={{
          position: 'absolute', top: -60, left: -80, right: -80,
          backgroundColor: C.surface2, borderRadius: 10,
          borderWidth: 1, borderColor: ringColor + '50',
          padding: 10, zIndex: 99,
          opacity: tipOpA,
          transform: [{ translateY: tipSlideA }],
          ...Platform.select({
            ios: { shadowColor: ringColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8 },
            android: { elevation: 8 },
          }),
        }}>
          <Text style={{
            fontFamily: MONO, fontSize: 11, color: C.text,
            textAlign: 'center', lineHeight: 16,
          }}>{tipText}</Text>
          {/* Tooltip arrow */}
          <View style={{
            position: 'absolute', bottom: -5, alignSelf: 'center',
            width: 10, height: 10, backgroundColor: C.surface2,
            transform: [{ rotate: '45deg' }],
            borderRightWidth: 1, borderBottomWidth: 1,
            borderColor: ringColor + '50',
          }} />
        </Animated.View>
      )}

      <Pressable onPress={showTip} style={{ alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          {/* Three-ring glow halo */}
          <Animated.View style={{
            position: 'absolute',
            top: -(S * 0.18), left: -(S * 0.18), right: -(S * 0.18), bottom: -(S * 0.18),
            borderRadius: S * 0.68, borderWidth: 1,
            borderColor: ringColor,
            opacity: glowA.interpolate({ inputRange: [0.3, 1], outputRange: [0.04, 0.22] }),
          }} />
          <Animated.View style={{
            position: 'absolute',
            top: -(S * 0.10), left: -(S * 0.10), right: -(S * 0.10), bottom: -(S * 0.10),
            borderRadius: S * 0.60, borderWidth: 1.5,
            borderColor: ringColor,
            opacity: glowA.interpolate({ inputRange: [0.3, 1], outputRange: [0.07, 0.40] }),
          }} />

          {/* Ring 1 — clockwise */}
          <Animated.View style={{
            position: 'absolute',
            top: -(S * 0.06), left: -(S * 0.06), right: -(S * 0.06), bottom: -(S * 0.06),
            borderRadius: S * 0.56,
            borderWidth: 1.5,
            borderColor: ringColor + '80',
            borderStyle: 'dashed',
            transform: [{ rotate: ring1Rot }],
          }} />

          {/* Ring 2 — counter-clockwise */}
          <Animated.View style={{
            position: 'absolute',
            top: S * 0.02, left: S * 0.02, right: S * 0.02, bottom: S * 0.02,
            borderRadius: S * 0.46,
            borderWidth: 1,
            borderColor: C.ice + '50',
            borderStyle: 'dashed',
            transform: [{ rotate: ring2Rot }],
          }} />

          {/* Orbit dot */}
          <Animated.View style={{
            position: 'absolute',
            width: OR * 2, height: OR * 2,
            top: (S / 2) - OR, left: (S / 2) - OR,
            transform: [{ rotate: orbitRot }],
          }}>
            <View style={{
              position: 'absolute', top: 0, left: OR - 5,
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: ringColor, opacity: 0.9,
              ...Platform.select({
                ios: { shadowColor: ringColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
              }),
            }} />
          </Animated.View>

          {/* Robot body */}
          <View style={{
            width: S, height: S, borderRadius: S * 0.22,
            backgroundColor: C.card,
            borderWidth: 2, borderColor: ringColor + '70',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            ...Platform.select({
              ios: { shadowColor: ringColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14 },
              android: { elevation: 8 },
            }),
          }}>
            {/* Robot face */}
            <MaterialCommunityIcons name="robot-happy-outline" size={S * 0.56} color={ringColor} />

            {/* Scanline overlay */}
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={{
                position: 'absolute',
                left: 0, right: 0,
                top: i * (S / 12),
                height: 1,
                backgroundColor: ringColor + '08',
              }} />
            ))}

            {/* Corner brackets */}
            <CornerFrame color={ringColor + '60'} size={12} thickness={1.5} />
          </View>
        </Animated.View>
      </Pressable>

      {/* Tap hint */}
      <Text style={{
        fontFamily: MONO, fontSize: 9, color: C.textDim,
        marginTop: 8, letterSpacing: 1.5,
      }}>
        TAP FOR BUTLER TIP
      </Text>
    </View>
  );
}

// ─── METRICS STRIP (6-cell horizontal row) ───────────────────────
function MetricsStrip({ isConn, cpu, ram, disk, latency, scripts, kb }: {
  isConn: boolean; cpu: number; ram: number; disk: number;
  latency: number; scripts: number; kb: number;
}) {
  const CELLS = [
    { label: 'CPU',     value: isConn ? Math.round(cpu)  + '%'        : '—', color: cpu  > 80 ? C.coral : C.ice   },
    { label: 'RAM',     value: isConn ? Math.round(ram)  + '%'        : '—', color: ram  > 85 ? C.coral : C.mint  },
    { label: 'DISK',    value: isConn ? Math.round(disk) + '%'        : '—', color: disk > 90 ? C.coral : C.amber },
    { label: 'PING',    value: isConn && latency > 0 ? latency + 'ms' : '—', color: latency > 200 ? C.amber : C.mint },
    { label: 'SCRIPTS', value: scripts > 0 ? String(scripts)          : '0', color: C.violet },
    { label: 'KB',      value: kb > 0 ? (kb >= 1000 ? (kb/1000).toFixed(0)+'K' : String(kb)) : '—', color: C.sky },
  ];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
      {CELLS.map((c, i) => (
        <View key={i} style={[
          ms.cell,
          i < CELLS.length - 1 && { borderRightWidth: 1, borderRightColor: C.border },
          { borderTopColor: c.color },
        ]}>
          <Text style={[ms.val, { color: isConn || i >= 4 ? c.color : C.textDim }]}>
            {c.value}
          </Text>
          <Text style={ms.lbl}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}
const ms = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderTopWidth: 2 },
  val:  { fontFamily: FontFamily.mono as any, fontSize: 13, fontWeight: '400', lineHeight: 17, letterSpacing: 0, includeFontPadding: false },
  lbl:  { fontFamily: FontFamily.mono as any, fontSize: 7.5, color: '#3D4C63', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase', includeFontPadding: false },
});

// ─── TWIN PANEL ───────────────────────────────────────────────────
function TwinPanel({ isConn, addr, latency, crawlerLines }: {
  isConn: boolean; addr: string; latency: number;
  crawlerLines: { text: string; color: string; cmd: boolean }[];
}) {
  const [visLines,   setVisLines]   = useState<number[]>([]);
  const [crawlLine,  setCrawlLine]  = useState(0);
  const [crawlChar,  setCrawlChar]  = useState(0);
  const crawlRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const radarA = useRef(new Animated.Value(0)).current; // JS driver — width

  useEffect(() => {
    mountedRef.current = true;
    const radarLoop = Animated.loop(
      Animated.timing(radarA, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    radarLoop.start();
    return () => {
      mountedRef.current = false;
      radarLoop.stop();
      if (crawlRef.current) clearTimeout(crawlRef.current);
    };
  }, []);

  const advanceCrawler = useCallback(() => {
    if (!mountedRef.current) return;
    const target = crawlerLines[crawlLine];
    if (!target) return;
    if (crawlChar < target.text.length) {
      setCrawlChar(c => c + 1);
      crawlRef.current = setTimeout(advanceCrawler, 22);
    } else {
      setVisLines(prev => [...prev, crawlLine].slice(-4));
      crawlRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setCrawlLine(l => (l + 1) % crawlerLines.length);
        setCrawlChar(0);
      }, 600);
    }
  }, [crawlLine, crawlChar, crawlerLines]);

  useEffect(() => {
    crawlRef.current = setTimeout(advanceCrawler, 1200);
    return () => { if (crawlRef.current) clearTimeout(crawlRef.current); };
  }, [advanceCrawler]);

  const cc = isConn ? C.mint : C.amber;
  const radarW = radarA.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['5%', '92%', '5%'] });

  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: PAD, paddingVertical: 8 }}>
      {/* Shell terminal */}
      <View style={[tp.panel, { flex: 1.5, borderColor: C.ice + '22' }]}>
        <View style={tp.chrome}>
          {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => (
            <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
          ))}
          <Text style={[tp.chromeLabel, { color: C.ice + '70' }]}>BUTLER_SHELL</Text>
          <PulseDot color={C.mint} size={4} />
        </View>
        <View style={{ padding: 8, gap: 2 }}>
          {visLines.map((ln, i) => {
            const line = crawlerLines[ln];
            if (!line) return null;
            return (
              <Text key={i} style={{
                fontFamily: MONO as any, fontSize: 8, lineHeight: 12,
                color: line.color, opacity: 0.35 + i * 0.18,
              }} numberOfLines={1}>
                {line.cmd ? '$ ' : '  '}{line.text}
              </Text>
            );
          })}
          <Text style={{ fontFamily: MONO as any, fontSize: 8, lineHeight: 12, color: crawlerLines[crawlLine]?.color ?? C.ice }} numberOfLines={1}>
            {crawlerLines[crawlLine]?.cmd ? '$ ' : '  '}
            {crawlerLines[crawlLine]?.text.slice(0, crawlChar)}
            <Text style={{ color: C.ice }}>▌</Text>
          </Text>
        </View>
      </View>

      {/* LAN status */}
      <View style={[tp.panel, { flex: 1, borderColor: cc + '22', alignItems: 'center', justifyContent: 'center', padding: 12 }]}>
        {/* Radar orb */}
        <View style={[tp.radarOuter, { borderColor: cc + '50', backgroundColor: cc + '08' }]}>
          <View style={[tp.radarInner, { borderColor: cc + '25' }]}>
            <PulseDot color={cc} size={10} />
          </View>
        </View>
        <Text style={[tp.radarLabel, { color: cc }]}>{isConn ? 'LAN' : 'SCAN'}</Text>
        {isConn ? (
          <>
            <Text style={{ fontFamily: MONO as any, fontSize: 9, color: C.textMid, marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
              {addr}
            </Text>
            <Text style={{ fontFamily: MONO as any, fontSize: 9, color: C.textDim, marginTop: 2 }}>
              {latency > 0 ? `${latency}ms` : '—'}
            </Text>
          </>
        ) : (
          <Text style={{ fontFamily: MONO as any, fontSize: 9, color: C.textDim, marginTop: 4, textAlign: 'center', lineHeight: 13 }}>
            {'Run butler_server.py\nto pair your PC'}
          </Text>
        )}
        {/* Radar progress bar */}
        <View style={{ width: '90%', height: 3, borderRadius: 2, backgroundColor: cc + '18', marginTop: 8, overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', borderRadius: 2, backgroundColor: cc, width: radarW }} />
        </View>
      </View>
    </View>
  );
}
const tp = StyleSheet.create({
  panel:      { backgroundColor: '#030609', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  chrome:     { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 6, backgroundColor: '#010304', borderBottomWidth: 1, borderBottomColor: 'rgba(0,200,230,0.08)' },
  chromeLabel:{ fontFamily: FontFamily.mono as any, fontSize: 7.5, flex: 1, letterSpacing: 0.5, includeFontPadding: false },
  radarOuter: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radarInner: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  radarLabel: { fontFamily: FontFamily.mono as any, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 5, textTransform: 'uppercase', includeFontPadding: false },
});

// ─── CAPABILITIES GRID (4×2) ──────────────────────────────────────
function CapabilitiesGrid({ goToTab }: { goToTab: (t: string) => void }) {
  const scales = useRef(CAPS.map(() => new Animated.Value(1))).current;
  const pi = (i: number) => Animated.spring(scales[i], { toValue: 0.88, tension: 380, friction: 11, useNativeDriver: true }).start();
  const po = (i: number) => Animated.spring(scales[i], { toValue: 1,    tension: 260, friction: 10, useNativeDriver: true }).start();
  const COL = Math.floor((SW - PAD * 2 - 8 * 3) / 4);

  return (
    <View style={{ paddingHorizontal: PAD, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: C.ice }} />
        <Text style={{ fontFamily: DISP as any, fontSize: 10, fontWeight: '700', color: C.ice + 'CC', letterSpacing: 1.5 }}>
          CORE CAPABILITIES
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: C.mint + '50', backgroundColor: C.mint + '0A' }}>
          <PulseDot color={C.mint} size={4} />
          <Text style={{ fontFamily: MONO as any, fontSize: 7.5, fontWeight: '900', color: C.mint }}>8 MODULES</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {CAPS.map((cap, i) => (
          <Pressable key={i} onPress={() => { haptics.light(); goToTab(cap.tab); }}
            onPressIn={() => pi(i)} onPressOut={() => po(i)}>
            <Animated.View style={[cg.cell, {
              width: COL, borderColor: cap.color + '30', borderTopColor: cap.color,
              transform: [{ scale: scales[i] }],
            }]}>
              <Text style={[cg.hexTag, { color: cap.color + '40' }]}>{cap.hex}</Text>
              <View style={[cg.iconBox, { borderColor: cap.color + '50', backgroundColor: cap.color + '10' }]}>
                <MaterialCommunityIcons name={cap.icon as any} size={20} color={cap.color} />
              </View>
              <Text style={[cg.label, { color: cap.color + 'CC' }]}>{cap.label}</Text>
            </Animated.View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const cg = StyleSheet.create({
  cell:   { alignItems: 'center', borderWidth: 1.5, borderTopWidth: 2.5, borderRadius: 10, paddingVertical: 10, paddingTop: 14, backgroundColor: C.card, overflow: 'hidden', position: 'relative' },
  hexTag: { position: 'absolute', top: 3, right: 4, fontFamily: FontFamily.mono as any, fontSize: 7, includeFontPadding: false },
  iconBox:{ width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  label:  { fontFamily: FontFamily.displayMed as any, fontSize: 8, fontWeight: '500', letterSpacing: 0.5, textAlign: 'center', includeFontPadding: false },
});

// ─── TIPS TICKER ──────────────────────────────────────────────────
function TipsTicker() {
  const [idx, setIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeA, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeA, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setIdx(i => (i + 1) % HEADER_TIPS.length), 260);
    }, 5500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingVertical: 7, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}>
      <MaterialCommunityIcons name="lightbulb-outline" size={10} color={C.amber + '80'} />
      <Animated.Text style={{ fontFamily: MONO as any, fontSize: 9.5, color: C.amber + 'AA', flex: 1, letterSpacing: 0.2, opacity: fadeA, includeFontPadding: false }} numberOfLines={1}>
        {HEADER_TIPS[idx]}
      </Animated.Text>
      <Text style={{ fontFamily: MONO as any, fontSize: 8, color: C.textDim, includeFontPadding: false }}>
        BUTLER OS v9.1
      </Text>
    </View>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export interface CommandHeaderProps {
  safeTop:   number;
  isConn:    boolean;
  addr:      string;
  latency:   number;
  metrics:   { cpu: number; ram: number; disk: number };
  scripts:   number;
  kbCount:   number;
  onPair:    () => void;
  goToTab:   (t: string) => void;
}

export function CommandHeader({
  safeTop, isConn, addr, latency, metrics, scripts, kbCount, onPair, goToTab,
}: CommandHeaderProps) {
  const scanA      = useRef(new Animated.Value(0)).current;  // native — scan Y
  const shimA      = useRef(new Animated.Value(-SW)).current; // native — shim X
  const titleOpA   = useRef(new Animated.Value(0)).current;   // native — entrance
  const titleScaleA= useRef(new Animated.Value(0.94)).current;// native — entrance

  // JS driver — glow border (isolated)
  const glowBorderA= useRef(new Animated.Value(0.3)).current;

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
    // Entrance
    Animated.parallel([
      Animated.spring(titleScaleA, { toValue: 1, tension: 110, friction: 10, useNativeDriver: true }),
      Animated.timing(titleOpA,    { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Native loops
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: 1, duration: 3200, useNativeDriver: true }),
      Animated.timing(scanA, { toValue: 0, duration: 0,    useNativeDriver: true }),
      Animated.delay(5800),
    ]));
    const shimLoop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.5, duration: 2000, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW,      duration: 0,    useNativeDriver: true }),
      Animated.delay(9000),
    ]));
    scanLoop.start(); shimLoop.start();

    // JS border glow loop
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowBorderA, { toValue: 1,   duration: 1800, useNativeDriver: false }),
      Animated.timing(glowBorderA, { toValue: 0.2, duration: 1800, useNativeDriver: false }),
    ]));
    glowLoop.start();

    return () => { scanLoop.stop(); shimLoop.stop(); glowLoop.stop(); };
  }, []);

  const scanY      = scanA.interpolate({ inputRange: [0, 1], outputRange: [-4, 500] });
  const borderColor= glowBorderA.interpolate({ inputRange: [0.2, 1], outputRange: [C.ice + '15', C.ice + '55'] });
  const cc = isConn ? C.mint : C.amber;

  const STRIPE_COLORS = [C.ice, C.mint, C.violet, C.amber, C.sky];

  return (
    <Animated.View style={[ch.root, { borderBottomColor: borderColor }]}>
      {/* Top color stripe */}
      <View style={{ flexDirection: 'row', height: 3 }}>
        {STRIPE_COLORS.map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      {/* Grid background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0.15, 0.30, 0.50, 0.68, 0.84].map((p, i) => (
          <View key={`h${i}`} style={[StyleSheet.absoluteFill, {
            top: `${p * 100}%` as any,
            height: StyleSheet.hairlineWidth,
            backgroundColor: 'rgba(110,231,255,0.03)',
          }]} />
        ))}
      </View>

      {/* Sweeping scanline */}
      <Animated.View pointerEvents="none"
        style={[ch.scanLine, { transform: [{ translateY: scanY }] }]} />

      {/* Shim sweep */}
      <Animated.View pointerEvents="none"
        style={[ch.shim, { transform: [{ translateX: shimA }] }]} />

      {/* ─ LIVE CLOCK (absolute top-right) ─ */}
      <View style={[ch.clockBox, { paddingTop: safeTop + 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Text style={[ch.clockHH, { color: C.text }]}>{time}</Text>
          <Text style={[ch.clockSS, { color: C.ice }]}>{secs}</Text>
        </View>
        <Text style={ch.clockSub}>LOCAL · SECURE</Text>
      </View>

      {/* ─ HERO ZONE ─ */}
      <Animated.View style={[ch.heroZone, {
        paddingTop: safeTop + 10,
        opacity: titleOpA,
        transform: [{ scale: titleScaleA }],
      }]}>
        {/* Eyebrow */}
        <Text style={ch.eyebrow}>AI COMMAND CENTER · PC AUTOMATION</Text>

        {/* Robot mascot */}
        <RobotHero isConn={isConn} />

        {/* 3D BUTLER AI title */}
        <View style={{ alignItems: 'center', position: 'relative', paddingVertical: 4 }}>
          {/* Shadow layer */}
          <Text style={[ch.titleShadow, { top: 3, left: 3 }]}>BUTLER AI</Text>
          {/* Mid layer */}
          <Text style={[ch.titleMid, { top: 1.5, left: 1.5 }]}>BUTLER AI</Text>
          {/* Hero layer with glitch */}
          <GlitchText
            style={ch.titleMain}
            color="#FFFFFF"
            redColor={C.coral}
            blueColor={C.ice}
          >
            BUTLER AI
          </GlitchText>
        </View>

        {/* Tagline */}
        <Text style={ch.tagline}>PC Automation · Local AI · Zero Cloud</Text>

        {/* Status chips row */}
        <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, paddingHorizontal: PAD }}>
          {[
            { label: isConn ? 'ONLINE' : 'OFFLINE', color: cc, icon: isConn ? 'wifi' : 'wifi-off', live: true },
            { label: 'LOCAL AI',  color: C.violet, icon: 'robot-happy-outline', lib: 'community' },
            { label: 'AES-256',   color: C.mint,   icon: 'lock',              lib: 'material'   },
            { label: 'HMAC',      color: C.ice,    icon: 'shield-check',      lib: 'community'  },
          ].map((chip, i) => (
            <View key={i} style={[ch.chip, { borderColor: chip.color + '65', backgroundColor: chip.color + '0D' }]}>
              {chip.live && <PulseDot color={chip.color} size={5} />}
              {chip.lib === 'community'
                ? <MaterialCommunityIcons name={chip.icon as any} size={10} color={chip.color} />
                : <MaterialIcons name={chip.icon as any} size={10} color={chip.color} />}
              <Text style={[ch.chipTxt, { color: chip.color }]}>{chip.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ─ METRICS STRIP ─ */}
      <MetricsStrip
        isConn={isConn}
        cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk}
        latency={latency} scripts={scripts} kb={kbCount}
      />

      {/* ─ TWIN PANEL ─ */}
      <TwinPanel
        isConn={isConn} addr={addr} latency={latency}
        crawlerLines={CRAWLER_LINES}
      />

      {/* ─ CAPABILITIES GRID ─ */}
      <CapabilitiesGrid goToTab={goToTab} />

      {/* ─ CTA BUTTONS ─ */}
      <View style={{ paddingHorizontal: PAD, gap: 8, paddingBottom: 10 }}>
        <TouchableOpacity
          onPress={() => { haptics.heavy(); onPair(); }}
          activeOpacity={0.85}
          style={[ch.ctaBtn, { borderColor: cc + '80', backgroundColor: cc + '14', borderLeftColor: cc }]}>
          <MaterialIcons name="qr-code-scanner" size={17} color={cc} />
          <Text style={[ch.ctaTxt, { color: cc }]}>
            {isConn ? 'CONNECTED · RE-PAIR' : 'SCAN QR TO PAIR PC'}
          </Text>
          <View style={{ flex: 1 }} />
          <MaterialIcons name="arrow-forward" size={15} color={cc + '80'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { haptics.medium(); goToTab('butler'); }}
          activeOpacity={0.85}
          style={[ch.ctaBtn, { borderColor: C.mint + '60', backgroundColor: C.mint + '10', borderLeftColor: C.mint }]}>
          <MaterialCommunityIcons name="robot-happy-outline" size={17} color={C.mint} />
          <Text style={[ch.ctaTxt, { color: C.mint }]}>OPEN AI CHAT</Text>
          <View style={{ flex: 1 }} />
          <MaterialIcons name="arrow-forward" size={15} color={C.mint + '80'} />
        </TouchableOpacity>
      </View>

      {/* ─ TIPS TICKER ─ */}
      <TipsTicker />

      {/* Bottom color stripe */}
      <View style={{ flexDirection: 'row', height: 2.5, opacity: 0.7 }}>
        {STRIPE_COLORS.map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────
const ch = StyleSheet.create({
  root: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: C.ice, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 1.5,
    backgroundColor: C.ice, opacity: 0.06, zIndex: 1,
  },
  shim: {
    position: 'absolute', top: 0, bottom: 0, width: 100,
    backgroundColor: C.ice + '04', zIndex: 0,
    transform: [{ skewX: '-8deg' }],
  },
  clockBox: {
    position: 'absolute', top: 0, right: PAD,
    alignItems: 'flex-end', gap: 3, zIndex: 3,
  },
  clockHH:  { fontFamily: FontFamily.mono as any, fontSize: 24, fontWeight: '900', letterSpacing: 1.2, includeFontPadding: false },
  clockSS:  { fontFamily: FontFamily.mono as any, fontSize: 15, fontWeight: '900', letterSpacing: 1, includeFontPadding: false },
  clockSub: { fontFamily: FontFamily.mono as any, fontSize: 8, color: '#4A7090', letterSpacing: 1.5, fontWeight: '700', includeFontPadding: false },
  heroZone: { alignItems: 'center', paddingBottom: 12, zIndex: 2 },
  eyebrow:  { fontFamily: FontFamily.displayReg as any, fontSize: 9, color: C.ice + '70', letterSpacing: 3, textTransform: 'uppercase', includeFontPadding: false },
  // 3D title layers
  titleShadow: { position: 'absolute', fontFamily: FontFamily.displayBold as any, fontSize: 34, fontWeight: '900', color: C.ice + '18', letterSpacing: 4, includeFontPadding: false },
  titleMid:    { position: 'absolute', fontFamily: FontFamily.displayBold as any, fontSize: 34, fontWeight: '900', color: C.ice + '40', letterSpacing: 4, includeFontPadding: false },
  titleMain:   { fontFamily: FontFamily.displayBold as any, fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4, textShadowColor: C.ice, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18, includeFontPadding: false },
  tagline:  { fontFamily: FontFamily.body as any, fontSize: 12, color: C.textMid, letterSpacing: 0.3, marginTop: 3, includeFontPadding: false },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt:  { fontFamily: FontFamily.mono as any, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3, includeFontPadding: false },
  ctaBtn:   { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1.5, borderLeftWidth: 3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  ctaTxt:   { fontFamily: FontFamily.displayMed as any, fontSize: 13, fontWeight: '500', letterSpacing: 0.5, includeFontPadding: false },
});
