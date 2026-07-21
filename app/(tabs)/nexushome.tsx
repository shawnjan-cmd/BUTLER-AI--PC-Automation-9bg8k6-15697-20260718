/**
 * BUTLER AI — HOME v80.0 · PLAY STORE PREMIUM EDITION
 * Every section upgraded with unique visual signatures.
 * New: PairPrompt, PCOverviewCard, HealthScore, Sparklines,
 *      CommandGallery, LastRunWidget, NetworkCard, TodayStats.
 *
 * ANIMATION SAFETY:
 *  • useNativeDriver:true  → opacity, transform ONLY
 *  • useNativeDriver:false → backgroundColor, borderColor, width ONLY
 *  • NEVER mix on same Animated.Value
 */

import React, { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Dimensions, Modal, TextInput,
  ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import { HexTag } from '@/components/ui/HexTag';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { ScanlineOverlay } from '@/components/ui/ScanlineOverlay';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { RemoteAccessMonetizationCard } from '@/components/home/RemoteAccessMonetizationCard';
import { NexusVaultCard } from '@/components/ui/NexusVaultCard';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';
import { connectionHub } from '@/services/connectionHub';
import { executionHistory } from '@/services/executionHistory';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { personalMemory } from '@/services/personalMemory';
import { parseQRConnection } from '@/services/qrParser';
import { performanceHistory } from '@/services/performanceHistory';

const QRCameraScanner = React.lazy(() => import('@/components/qr/QRCameraScanner'));

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const BG       = '#06101A';
const SURFACE  = '#0C1824';
const SURFACE2 = '#111E2C';
const SURFACE3 = '#0A1520';
const BORDER   = 'rgba(0,188,212,0.13)';
const CYAN     = '#00C8E0';
const GREEN    = '#00C896';
const AMBER    = '#F5A42A';
const RED      = '#FF4757';
const PURPLE   = '#9B6DFF';
const PINK     = '#FF6B9D';
const DIM      = '#3A5A6A';
const MID      = '#6A8A9A';
const TEXT     = '#D8EEF4';
const TEXT2    = '#8AAABB';
const MONO: any = FONT.mono;
const SW       = Math.max(320, Dimensions.get('window').width);
const PAD      = 14;

// ─── MICRO ATOMS ──────────────────────────────────────────────────
function Dot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HUDCorners({ color, size = 8, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const s: any = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[s, { top: 0,    left: 0,  borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[s, { top: 0,    right: 0, borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[s, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t,   borderColor: color }]} />
      <View style={[s, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t,  borderColor: color }]} />
    </>
  );
}

// Segmented progress bar
function SegBar({ value, color, height = 4 }: { value: number; color: string; height?: number }) {
  const SEGS = 28;
  const filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * SEGS);
  return (
    <View style={{ flexDirection: 'row', gap: 2, height }}>
      {Array.from({ length: SEGS }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height, borderRadius: 1.5,
          backgroundColor: i < filled ? color : 'rgba(255,255,255,0.06)',
        }} />
      ))}
    </View>
  );
}

// Mini sparkline bar chart (8 points)
function Sparkline({ data, color, height = 24 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={{
            flex: 1, height: h, borderRadius: 2,
            backgroundColor: isLast ? color : color + '50',
          }} />
        );
      })}
    </View>
  );
}

// Arc-style gauge
function ArcGauge({ value, color, label, isConn }: { value: number; color: string; label: string; isConn: boolean }) {
  const displayVal = isConn ? Math.round(value) : 0;
  const fillH = (displayVal / 100) * 56;
  const a = useRef(new Animated.Value(0)).current;
  const m = useRef(true);
  useEffect(() => {
    if (!isConn) return;
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 2400, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.4, duration: 2400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [isConn]);

  return (
    <View style={arc.wrap}>
      <Animated.View style={{ opacity: isConn ? a : 1 }}>
        <View style={[arc.ring, { borderColor: isConn ? color + '50' : DIM + '30' }]}>
          <View style={[arc.fill, { height: fillH, backgroundColor: color + (isConn ? '28' : '08') }]} />
          <View style={arc.center}>
            <Text style={[arc.val, { color: isConn ? color : DIM }]} adjustsFontSizeToFit minimumFontScale={0.6}>
              {isConn ? displayVal : '—'}
            </Text>
            {isConn && <Text style={[arc.pct, { color: color + '80' }]}>%</Text>}
          </View>
          {isConn && <View style={[arc.rim, { backgroundColor: color }]} />}
        </View>
      </Animated.View>
      <Text style={[arc.label, { color: isConn ? color + 'A0' : DIM }]}>{label}</Text>
    </View>
  );
}
const arc = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: 7, flex: 1 },
  ring:   { width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, backgroundColor: SURFACE2, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  fill:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 38 },
  center: { alignItems: 'center', flexDirection: 'row', gap: 1 },
  val:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  pct:    { fontFamily: MONO, fontSize: 10, fontWeight: '700', marginTop: 8 },
  rim:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  label:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});

// Stat quad cell with trend arrow
function StatCell({ icon, value, label, color, trend }: { icon: string; value: string; label: string; color: string; trend?: 'up' | 'down' | 'stable' }) {
  return (
    <View style={sc.cell}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color + '70'} />
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={[sc.val, { color }]}>{value}</Text>
        {trend && trend !== 'stable' && (
          <MaterialIcons
            name={trend === 'up' ? 'trending-up' : 'trending-down'}
            size={10}
            color={trend === 'up' ? RED : GREEN}
          />
        )}
      </View>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  cell:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 4, backgroundColor: SURFACE2, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  val:   { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  label: { fontFamily: MONO, fontSize: 8, color: MID, letterSpacing: 0.8, fontWeight: '700' },
});

// Generic card wrapper
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[card.root, style]}>{children}</View>;
}
const card = StyleSheet.create({
  root: { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 4 } }) },
});

function SectionHdr({ icon, label, color = CYAN, right }: { icon: string; label: string; color?: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
      <MaterialCommunityIcons name={icon as any} size={13} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: color + 'CC', letterSpacing: 1.4, flex: 1 }}>{label}</Text>
      {right}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOME HEADER — Upgraded with animated gradient scan shimmer
// ══════════════════════════════════════════════════════════════════
function HomeHeader({ safeTop, isConn, addr, onPair }: {
  safeTop: number; isConn: boolean; addr: string; onPair: () => void;
}) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const [dateStr, setDateStr] = useState('');
  const pulseA  = useRef(new Animated.Value(0.3)).current;
  const shimA   = useRef(new Animated.Value(-SW)).current;
  const m = useRef(true);

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
      setDateStr(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    m.current = true;
    // Gentle shimmer sweep every 8s
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.5, duration: 1800, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW,      duration: 0,    useNativeDriver: true }),
      Animated.delay(6200),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);

  useEffect(() => {
    if (!isConn) { pulseA.setValue(0.3); return; }
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [isConn]);

  return (
    <View style={[hdr.root, { paddingTop: safeTop }]}>
      {/* Top 2px cyan stripe */}
      <View style={hdr.topStripe} />

      {/* Shimmer overlay */}
      <Animated.View pointerEvents="none"
        style={[hdr.shimmer, { transform: [{ translateX: shimA }] }]} />

      <View style={hdr.body}>
        {/* Left */}
        <View style={{ flex: 1, gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={hdr.eyebrow}>SELF-HOSTED · PRIVATE</Text>
            <View style={[hdr.zeroBadge, { borderColor: GREEN + '40', backgroundColor: GREEN + '0A' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: GREEN, letterSpacing: 0.5 }}>ZERO CLOUD</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[hdr.logoBox, { borderColor: CYAN + '50', backgroundColor: CYAN + '12' }]}>
              <MaterialCommunityIcons name="shield-half-full" size={20} color={CYAN} />
            </View>
            <Text style={hdr.brand}>BUTLER <Text style={{ color: CYAN }}>AI</Text></Text>
          </View>
          {/* Pills row */}
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 2 }}>
            <TouchableOpacity onPress={() => { haptics.heavy(); onPair(); }} activeOpacity={0.8}
              style={[hdr.pill, { borderColor: isConn ? GREEN + '70' : AMBER + '60', backgroundColor: isConn ? GREEN + '0E' : AMBER + '0C' }]}>
              {isConn
                ? <Animated.View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GREEN, opacity: pulseA }} />
                : <MaterialIcons name="qr-code-scanner" size={10} color={AMBER} />
              }
              <Text style={[hdr.pillTxt, { color: isConn ? GREEN : AMBER }]}>
                {isConn ? (addr.split(':')[0] || 'CONNECTED') : 'PAIR PC'}
              </Text>
            </TouchableOpacity>
            <View style={[hdr.pill, { borderColor: BORDER }]}>
              <MaterialCommunityIcons name="desktop-classic" size={10} color={MID} />
              <Text style={[hdr.pillTxt, { color: MID }]}>LOCAL RUNTIME</Text>
            </View>
          </View>
        </View>

        {/* Right: clock */}
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={hdr.clockMain}>{time}</Text>
            <Text style={[hdr.clockSecs, { color: CYAN }]}>{secs}</Text>
          </View>
          <Text style={hdr.clockSub}>LOCAL · SECURE</Text>
          <Text style={hdr.dateTxt}>{dateStr}</Text>
        </View>
      </View>

      {/* Bottom circuit trace */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        <View style={{ flex: 4, backgroundColor: CYAN + '18' }} />
        <View style={{ width: 14, backgroundColor: CYAN }} />
        <View style={{ flex: 2, backgroundColor: GREEN + '14' }} />
        <View style={{ width: 6, backgroundColor: GREEN }} />
        <View style={{ flex: 6, backgroundColor: CYAN + '08' }} />
        <View style={{ width: 10, backgroundColor: AMBER }} />
        <View style={{ flex: 3, backgroundColor: AMBER + '12' }} />
      </View>
    </View>
  );
}
const hdr = StyleSheet.create({
  root:      { backgroundColor: SURFACE, overflow: 'hidden' },
  topStripe: { height: 2.5, backgroundColor: CYAN },
  shimmer:   { position: 'absolute', top: 0, bottom: 0, width: 90, backgroundColor: 'rgba(0,200,224,0.04)', zIndex: 0 },
  body:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13, zIndex: 1 },
  eyebrow:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', color: CYAN + '55', letterSpacing: 1.5 },
  zeroBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  logoBox:   { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:     { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillTxt:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  clockMain: { fontFamily: MONO, fontSize: 30, fontWeight: '900', color: TEXT, letterSpacing: 1 },
  clockSecs: { fontFamily: MONO, fontSize: 19, fontWeight: '900', letterSpacing: 1 },
  clockSub:  { fontFamily: MONO, fontSize: 8.5, color: MID, letterSpacing: 1, fontWeight: '700' },
  dateTxt:   { fontFamily: MONO, fontSize: 8, color: DIM, letterSpacing: 0.5 },
});

// ══════════════════════════════════════════════════════════════════
// PAIR PROMPT BANNER — Shown when offline; full-bleed with QR icon
// ══════════════════════════════════════════════════════════════════
function PairPromptBanner({ onPair }: { onPair: () => void }) {
  const fadeA  = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideA, { toValue: 0, tension: 200, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[pp.root, { opacity: fadeA, transform: [{ translateY: slideA }] }]}>
      {/* Accent border top */}
      <View style={[pp.topBar, { backgroundColor: AMBER }]} />
      <TouchableOpacity onPress={() => { haptics.heavy(); onPair(); }} activeOpacity={0.88} style={pp.inner}>
        {/* Left: icon */}
        <View style={pp.iconCol}>
          <View style={[pp.iconCircle, { borderColor: AMBER + '60', backgroundColor: AMBER + '12' }]}>
            <HUDCorners color={AMBER + '50'} size={7} />
            <MaterialIcons name="qr-code-scanner" size={28} color={AMBER} />
          </View>
        </View>
        {/* Center: copy */}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={pp.title}>Pair your PC to start</Text>
          <Text style={pp.body}>Run butler_server.py on your PC. Tap here to scan the QR and connect. Runs 100% locally.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {['PYTHON', 'LOCAL', 'AES-256'].map(t => (
              <View key={t} style={[pp.tag, { borderColor: AMBER + '35' }]}>
                <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: AMBER + '80' }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Right: arrow */}
        <View style={[pp.arrowBox, { borderColor: AMBER + '40', backgroundColor: AMBER + '0E' }]}>
          <MaterialIcons name="chevron-right" size={22} color={AMBER} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const pp = StyleSheet.create({
  root:       { marginHorizontal: PAD, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1.5, borderColor: AMBER + '30', overflow: 'hidden',
                ...Platform.select({ ios: { shadowColor: AMBER, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }, android: { elevation: 4 } }) },
  topBar:     { height: 3 },
  inner:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingTop: 14 },
  iconCol:    { flexShrink: 0 },
  iconCircle: { width: 60, height: 60, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  title:      { fontSize: 15, fontWeight: '700', color: TEXT },
  body:       { fontFamily: MONO, fontSize: 10, color: MID, lineHeight: 15 },
  tag:        { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  arrowBox:   { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK ACTIONS — 4-button row with badge counts
// ══════════════════════════════════════════════════════════════════
const ACTIONS = [
  { icon: 'qrcode-scan',            lib: 'c', label: 'Pair',     tab: 'pair',      color: CYAN   },
  { icon: 'robot-happy-outline',    lib: 'c', label: 'Chat',     tab: 'butler',    color: GREEN  },
  { icon: 'play-circle-outline',    lib: 'c', label: 'Run',      tab: 'scripts',   color: AMBER  },
  { icon: 'folder-network-outline', lib: 'c', label: 'Files',    tab: 'fileshare', color: PURPLE },
];

function QuickActions({ onPair, goToTab }: { onPair: () => void; goToTab: (t: string) => void }) {
  const scaleAs = useRef(ACTIONS.map(() => new Animated.Value(1))).current;

  const pressIn  = (i: number) => Animated.spring(scaleAs[i], { toValue: 0.91, tension: 400, friction: 12, useNativeDriver: true }).start();
  const pressOut = (i: number) => Animated.spring(scaleAs[i], { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <View style={{ flexDirection: 'row', paddingVertical: 4 }}>
          {ACTIONS.map((a, i) => {
            const Icon = MaterialCommunityIcons;
            const isLast = i === ACTIONS.length - 1;
            return (
              <Pressable key={a.label}
                onPress={() => { haptics.medium(); a.tab === 'pair' ? onPair() : goToTab(a.tab); }}
                onPressIn={() => pressIn(i)}
                onPressOut={() => pressOut(i)}
                style={[qa.btn, !isLast && { borderRightWidth: 1, borderRightColor: BORDER }]}>
                <Animated.View style={{ transform: [{ scale: scaleAs[i] }], alignItems: 'center', gap: 8 }}>
                  <View style={[qa.iconBox, { backgroundColor: a.color + '14', borderColor: a.color + '40' }]}>
                    <Icon name={a.icon as any} size={24} color={a.color} />
                  </View>
                  <Text style={[qa.label, { color: TEXT2 }]}>{a.label}</Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
        {/* Bottom accent line */}
        <View style={{ height: 2, flexDirection: 'row' }}>
          {ACTIONS.map((a, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: a.color + '25' }} />
          ))}
        </View>
      </Card>
    </View>
  );
}
const qa = StyleSheet.create({
  btn:     { flex: 1, alignItems: 'center', paddingVertical: 17, paddingTop: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '700', color: TEXT2, letterSpacing: 0.2 },
});

// ══════════════════════════════════════════════════════════════════
// TODAY'S STATS STRIP — 4 horizontal stats above gauges
// ══════════════════════════════════════════════════════════════════
function TodayStrip({ isConn, scripts, kbCount, latency }: {
  isConn: boolean; scripts: number; kbCount: number; latency: number;
}) {
  const stats = [
    { label: 'EXECUTED',   value: String(scripts),                  color: CYAN,   icon: 'play-circle'         },
    { label: 'VECTORS',    value: kbCount > 0 ? String(kbCount) : '—', color: PURPLE, icon: 'database'         },
    { label: 'LATENCY',    value: latency > 0 ? `${latency}ms` : '—',  color: AMBER,  icon: 'speedometer'      },
    { label: 'STATUS',     value: isConn ? 'LIVE' : 'IDLE',         color: isConn ? GREEN : MID, icon: 'access-point' },
  ];

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={ts.row}>
        {stats.map((s, i) => (
          <View key={i} style={[ts.cell, { borderColor: s.color + '25', borderTopColor: s.color, borderTopWidth: 2.5 }]}>
            <MaterialCommunityIcons name={s.icon as any} size={14} color={s.color + '70'} />
            <Text style={[ts.val, { color: s.color }]}>{s.value}</Text>
            <Text style={ts.label}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const ts = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 8 },
  cell:  { flex: 1, alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, paddingVertical: 12, gap: 4,
           ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }, android: { elevation: 2 } }) },
  val:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 16 },
  label: { fontFamily: MONO, fontSize: 7.5, color: MID, letterSpacing: 0.5 },
});

// ══════════════════════════════════════════════════════════════════
// LIVE GAUGES — Three arc gauges with sparklines
// ══════════════════════════════════════════════════════════════════
function LiveGauges({ isConn, cpu, ram, disk, cpuHistory, ramHistory, diskHistory }: {
  isConn: boolean; cpu: number; ram: number; disk: number;
  cpuHistory: number[]; ramHistory: number[]; diskHistory: number[];
}) {
  const cpuColor  = cpu  > 80 ? RED : cpu  > 60 ? AMBER : CYAN;
  const ramColor  = ram  > 85 ? RED : ram  > 70 ? AMBER : GREEN;
  const diskColor = disk > 90 ? RED : disk > 75 ? AMBER : PURPLE;

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="gauge" label="LIVE GAUGES"
          right={
            <View style={[lgx.statusPill, { borderColor: (isConn ? GREEN : AMBER) + '55', backgroundColor: (isConn ? GREEN : AMBER) + '0A' }]}>
              <Dot color={isConn ? GREEN : AMBER} size={5} />
              <Text style={[lgx.statusTxt, { color: isConn ? GREEN : AMBER }]}>{isConn ? 'LIVE' : 'STANDBY'}</Text>
            </View>
          }
        />
        {/* HUD corners via CornerFrame + optional scanline when live */}
        <CornerFrame color={CYAN + '45'} size={10} thickness={1.5} />
        {isConn && <ScanlineOverlay color={CYAN} duration={4500} opacity={0.18} />}

        {/* Gauges row */}
        <View style={lgx.gaugeRow}>
          <ArcGauge value={cpu}  color={cpuColor}  label="CPU"  isConn={isConn} />
          <View style={lgx.gaugeDivider} />
          <ArcGauge value={ram}  color={ramColor}  label="RAM"  isConn={isConn} />
          <View style={lgx.gaugeDivider} />
          <ArcGauge value={disk} color={diskColor} label="DISK" isConn={isConn} />
        </View>

        {/* Sparkline row */}
        {isConn && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 0 }}>
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <Sparkline data={cpuHistory}  color={cpuColor}  height={20} />
            </View>
            <View style={{ width: 1, backgroundColor: BORDER }} />
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <Sparkline data={ramHistory}  color={ramColor}  height={20} />
            </View>
            <View style={{ width: 1, backgroundColor: BORDER }} />
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <Sparkline data={diskHistory} color={diskColor} height={20} />
            </View>
          </View>
        )}
        {!isConn && <View style={{ height: 16 }} />}
      </Card>
    </View>
  );
}
const lgx = StyleSheet.create({
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  statusTxt:    { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  gaugeRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 8 },
  gaugeDivider: { width: 1, alignSelf: 'stretch', backgroundColor: BORDER, marginHorizontal: 4 },
});

// ══════════════════════════════════════════════════════════════════
// SYSTEM HEALTH SCORE — Single circular score summarizing all metrics
// ══════════════════════════════════════════════════════════════════
function SystemHealthScore({ isConn, cpu, ram, disk, latency }: {
  isConn: boolean; cpu: number; ram: number; disk: number; latency: number;
}) {
  const score = isConn
    ? Math.max(0, Math.round(100 - (cpu * 0.35 + ram * 0.35 + disk * 0.2 + Math.min(latency / 10, 10))))
    : 0;
  const scoreColor = score >= 80 ? GREEN : score >= 50 ? AMBER : RED;
  const scoreLabel = score >= 80 ? 'EXCELLENT' : score >= 50 ? 'MODERATE' : isConn ? 'STRESSED' : 'OFFLINE';

  const ringA = useRef(new Animated.Value(0)).current;
  const m = useRef(true);
  useEffect(() => {
    if (!isConn) return;
    m.current = true;
    Animated.loop(Animated.sequence([
      Animated.timing(ringA, { toValue: 1,   duration: 3000, useNativeDriver: true }),
      Animated.timing(ringA, { toValue: 0.4, duration: 3000, useNativeDriver: true }),
    ])).start();
    return () => { m.current = false; };
  }, [isConn]);

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 16 }}>
          {/* Score circle */}
          <View style={shs.circleWrap}>
            <View style={[shs.circle, { borderColor: scoreColor + '60', backgroundColor: scoreColor + '10' }]}>
              <HUDCorners color={scoreColor + '50'} size={8} t={1.5} />
              {isConn && <Animated.View style={[shs.outerRing, { borderColor: scoreColor, opacity: ringA }]} />}
              <Text style={[shs.scoreNum, { color: scoreColor }]} adjustsFontSizeToFit minimumFontScale={0.7}>
                {isConn ? score : '—'}
              </Text>
              <Text style={[shs.scoreLabel, { color: scoreColor + '80' }]}>/100</Text>
            </View>
          </View>

          {/* Detail column */}
          <View style={{ flex: 1, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={shs.title}>SYSTEM HEALTH</Text>
              <View style={[shs.statusBadge, { borderColor: scoreColor + '50', backgroundColor: scoreColor + '0C' }]}>
                <Text style={[shs.statusTxt, { color: scoreColor }]}>{scoreLabel}</Text>
              </View>
            </View>

            {/* Mini bars */}
            {[
              { label: 'CPU',  val: isConn ? cpu  : 0, color: cpu  > 80 ? RED : CYAN   },
              { label: 'MEM',  val: isConn ? ram  : 0, color: ram  > 80 ? RED : GREEN  },
              { label: 'DISK', val: isConn ? disk : 0, color: disk > 85 ? RED : PURPLE },
            ].map(b => (
              <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[shs.miniLabel, { color: MID }]}>{b.label}</Text>
                <View style={{ flex: 1 }}>
                  <SegBar value={b.val} color={b.color} height={4} />
                </View>
                <Text style={[shs.miniVal, { color: b.color }]}>{isConn ? `${Math.round(b.val)}%` : '—'}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );
}
const shs = StyleSheet.create({
  circleWrap:  { flexShrink: 0 },
  circle:      { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' },
  outerRing:   { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, top: -7, left: -7 },
  scoreNum:    { fontFamily: MONO, fontSize: 28, fontWeight: '900', lineHeight: 30 },
  scoreLabel:  { fontFamily: MONO, fontSize: 9, fontWeight: '700', marginTop: 2 },
  title:       { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: MID, letterSpacing: 1.2 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  miniLabel:   { fontFamily: MONO, fontSize: 8, fontWeight: '700', width: 28, letterSpacing: 0.3 },
  miniVal:     { fontFamily: MONO, fontSize: 9, fontWeight: '900', width: 34, textAlign: 'right' },
});

// ══════════════════════════════════════════════════════════════════
// SYSTEM METRICS — Segmented bars + stat quad + trend arrows
// ══════════════════════════════════════════════════════════════════
function SystemMetrics({ isConn, cpu, ram, disk, latency }: {
  isConn: boolean; cpu: number; ram: number; disk: number; latency: number;
}) {
  const bars = [
    { label: 'CPU',    val: cpu,  color: cpu  > 80 ? RED : CYAN,   trend: cpu  > 70 ? 'up' : 'stable' as any },
    { label: 'MEMORY', val: ram,  color: ram  > 85 ? RED : GREEN,  trend: ram  > 75 ? 'up' : 'stable' as any },
    { label: 'DISK',   val: disk, color: disk > 90 ? RED : PURPLE, trend: 'stable' as any },
  ];
  const statusColor = isConn ? GREEN : AMBER;

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="chart-line" label="SYSTEM METRICS"
          right={
            <View style={[sm.badge, { borderColor: statusColor + '50', backgroundColor: statusColor + '0C' }]}>
              <Text style={[sm.badgeTxt, { color: statusColor }]}>{isConn ? 'LIVE' : 'IDLE'}</Text>
            </View>
          }
        />
        <View style={{ paddingHorizontal: 16, gap: 13, marginBottom: 16 }}>
          {bars.map(b => (
            <View key={b.label} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isConn ? b.color : DIM }} />
                  <Text style={sm.barLabel}>{b.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {isConn && b.trend === 'up' && <MaterialIcons name="trending-up" size={11} color={RED + 'AA'} />}
                  <Text style={[sm.barVal, { color: b.color }]}>{isConn ? `${Math.round(b.val)}%` : '—'}</Text>
                </View>
              </View>
              <SegBar value={isConn ? b.val : 0} color={b.color} height={5} />
            </View>
          ))}
        </View>

        {/* Stat quad */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
          <StatCell icon="thermometer" value={isConn ? '—' : '—'} label="TEMP" color={CYAN} trend="stable" />
          <StatCell icon="lightning-bolt" value={isConn ? 'UP' : '—'} label="UP" color={GREEN} trend="stable" />
          <StatCell icon="lan-connect" value={isConn ? 'OK' : 'OFF'} label="STATE" color={isConn ? GREEN : MID} />
          <StatCell icon="speedometer" value={isConn ? (latency > 0 ? `${latency}` : '—') : '—'} label="MS" color={AMBER} />
        </View>
      </Card>
    </View>
  );
}
const sm = StyleSheet.create({
  badge:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  barLabel: { fontFamily: MONO, fontSize: 9.5, fontWeight: '700', color: MID, letterSpacing: 0.5 },
  barVal:   { fontFamily: MONO, fontSize: 9.5, fontWeight: '900' },
});

// ══════════════════════════════════════════════════════════════════
// RUNTIME PANEL
// ══════════════════════════════════════════════════════════════════
function RuntimePanel({ isConn, scripts, kbCount }: { isConn: boolean; scripts: number; kbCount: number }) {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="chart-timeline-variant" label="RUNTIME"
          right={
            <View style={[sm.badge, { borderColor: CYAN + '40', backgroundColor: CYAN + '0A' }]}>
              <Text style={[sm.badgeTxt, { color: CYAN }]}>LIVE</Text>
            </View>
          }
        />
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
          {[
            { label: 'SAMPLES', value: isConn ? String(scripts) : '0', sub: isConn ? 'executions' : '·', color: CYAN  },
            { label: 'PEAK',    value: isConn ? `${Math.round(Math.max(0, (scripts * 3) % 100))}%` : '—', sub: 'cpu peak', color: AMBER },
            { label: 'AVG',     value: isConn ? `${kbCount}` : '—',    sub: 'vectors',   color: GREEN },
          ].map(r => (
            <View key={r.label} style={[rt.cell, { borderColor: r.color + '25', borderTopColor: r.color, position: 'relative', overflow: 'hidden' }]}>
              <Text style={[rt.cellLabel, { color: r.color + '80' }]}>{r.label}</Text>
              <Text style={[rt.cellVal, { color: r.color }]}>{r.value}</Text>
              <Text style={rt.cellSub}>{r.sub}</Text>
            </View>
          ))}
        </View>
        <View style={rt.timeline}>
          <Text style={rt.timelineLabel}>–0s</Text>
          <View style={{ flex: 1, height: 1.5, backgroundColor: CYAN + '40', borderRadius: 1 }}>
            <Dot color={CYAN} size={5} />
          </View>
          <Text style={rt.timelineLabel}>realtime</Text>
          <View style={{ flex: 1, height: 1.5, backgroundColor: CYAN + '15', borderRadius: 1 }} />
          <Text style={rt.timelineLabel}>now</Text>
        </View>
      </Card>
    </View>
  );
}
const rt = StyleSheet.create({
  cell:      { flex: 1, backgroundColor: SURFACE2, borderRadius: 12, borderWidth: 1, borderTopWidth: 3, padding: 12, gap: 4 },
  cellLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  cellVal:   { fontFamily: MONO, fontSize: 22, fontWeight: '900', lineHeight: 26, letterSpacing: -1 },
  cellSub:   { fontFamily: MONO, fontSize: 8, color: DIM, marginTop: 2 },
  timeline:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  timelineLabel: { fontFamily: MONO, fontSize: 8.5, color: MID },
});

// ══════════════════════════════════════════════════════════════════
// COMMAND GALLERY — 3-column preset script launcher
// ══════════════════════════════════════════════════════════════════
const GALLERY_CMDS = [
  { icon: 'monitor-eye',           label: 'SYSMON',   color: CYAN,   script: `import platform,psutil\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"CPU: {psutil.cpu_percent(1)}%  RAM: {psutil.virtual_memory().percent}%")` },
  { icon: 'shield-search',         label: 'AUDIT',    color: GREEN,  script: `import os,platform\nprint(f"User: {os.getenv('USER') or os.getenv('USERNAME')}")\nprint(f"Home: {os.path.expanduser('~')}")\nprint(f"OS: {platform.version()[:60]}")` },
  { icon: 'network-outline',       label: 'NETMAP',   color: AMBER,  script: `import socket,psutil\nnet=psutil.net_if_addrs()\nfor k,v in list(net.items())[:3]:\n for a in v:\n  if a.family==socket.AF_INET: print(f"{k}: {a.address}")` },
  { icon: 'broom',                 label: 'CLEAN',    color: PURPLE, script: `import shutil,os,tempfile\ntd=tempfile.gettempdir();freed=0;n=0\nfor f in os.listdir(td):\n p=os.path.join(td,f)\n try:\n  sz=os.path.getsize(p) if os.path.isfile(p) else 0\n  (os.unlink if os.path.isfile(p) else shutil.rmtree)(p)\n  freed+=sz;n+=1\n except:pass\nprint(f"Freed {freed//1024//1024}MB from {n} items")` },
  { icon: 'eye-circle-outline',    label: 'PROCS',    color: PINK,   script: `import psutil\nfor p in sorted(psutil.process_iter(['name','cpu_percent']),key=lambda x:x.info['cpu_percent'] or 0,reverse=True)[:5]:\n print(f"{p.info['name'][:20]:20} {p.info['cpu_percent']:.1f}%")` },
  { icon: 'lightning-bolt-circle', label: 'PERF',     color: RED,    script: `import psutil,time\ncpu1=psutil.cpu_percent()\ntime.sleep(0.5)\ncpu2=psutil.cpu_percent()\nprint(f"CPU:{cpu2:.1f}% MEM:{psutil.virtual_memory().percent:.1f}%")\nprint(f"Threads:{psutil.cpu_count()} Load:{','.join(f'{x:.2f}' for x in psutil.getloadavg()) if hasattr(psutil,'getloadavg') else 'N/A'}")` },
];

function CommandGallery({ isConn }: { isConn: boolean }) {
  const [running, setRunning] = useState<number | null>(null);
  const [result, setResult]   = useState<{ idx: number; text: string; ok: boolean } | null>(null);

  const run = async (cmd: typeof GALLERY_CMDS[0], idx: number) => {
    if (!isConn || running !== null) return;
    haptics.heavy(); setRunning(idx); setResult(null);
    try {
      const ip = serverConnection.getIP(), port = serverConnection.getPort();
      const tok = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not paired');
      const h: Record<string,string> = { 'Content-Type': 'application/json' };
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, {
        method: 'POST', headers: h, body: JSON.stringify({ script: cmd.script }), signal: ctrl.signal,
      });
      const d = await res.json();
      setResult({ idx, text: (d.output || d.error || 'Done').trim().slice(0, 300), ok: !d.error });
      haptics.success();
    } catch (e: any) {
      setResult({ idx, text: 'Error: ' + (e?.message || 'Failed'), ok: false });
    } finally { setRunning(null); }
  };

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="view-dashboard-outline" label="COMMAND GALLERY"
          right={
            <View style={[sm.badge, { borderColor: (isConn ? GREEN : RED) + '50', backgroundColor: (isConn ? GREEN : RED) + '0A' }]}>
              <Text style={[sm.badgeTxt, { color: isConn ? GREEN : RED }]}>{isConn ? 'READY' : 'OFFLINE'}</Text>
            </View>
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: result ? 2 : 14, gap: 0 }}>
          {GALLERY_CMDS.map((c, i) => {
            const isRun = running === i;
            return (
              <TouchableOpacity key={i} onPress={() => run(c, i)}
                disabled={!isConn || running !== null} activeOpacity={0.78}
                style={[cg.cell, !isConn && { opacity: 0.3 }]}>
                {/* Top accent */}
                <View style={[cg.topAccent, { backgroundColor: c.color }]} />
                <View style={[cg.iconBox, { borderColor: c.color + '50', backgroundColor: c.color + '12' }]}>
                  {isRun
                    ? <ActivityIndicator size="small" color={c.color} />
                    : <MaterialCommunityIcons name={c.icon as any} size={22} color={c.color} />
                  }
                </View>
                <Text style={[cg.label, { color: isRun ? c.color : TEXT2 }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {result && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <View style={[cg.resultBox, { borderColor: (result.ok ? GREEN : RED) + '50', backgroundColor: (result.ok ? GREEN : RED) + '08' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name={result.ok ? 'check-circle' : 'error'} size={12} color={result.ok ? GREEN : RED} />
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: result.ok ? GREEN : RED }}>
                    {GALLERY_CMDS[result.idx]?.label} OUTPUT
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setResult(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={13} color={MID} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: result.ok ? '#88FFCC' : '#FF9090', lineHeight: 17 }} selectable>
                {result.text}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
const cg = StyleSheet.create({
  cell:      { width: '33.33%', alignItems: 'center', paddingVertical: 14, gap: 8, position: 'relative', overflow: 'hidden' },
  topAccent: { position: 'absolute', top: 0, left: 8, right: 8, height: 2, borderRadius: 1, opacity: 0.6 },
  iconBox:   { width: 52, height: 52, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:     { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  resultBox: { borderWidth: 1.5, borderRadius: 12, padding: 12 },
});

// ══════════════════════════════════════════════════════════════════
// ACTIVITY FEED — Upgraded with color-coded status icons
// ══════════════════════════════════════════════════════════════════
interface ActivityItem { icon: string; lib: 'c' | 'm'; title: string; sub: string; time: string; color: string; status: 'ok' | 'warn' | 'info' }

function ActivityFeed({ isConn, addr }: { isConn: boolean; addr: string }) {
  const items: ActivityItem[] = [
    { icon: 'handshake',        lib: 'c', title: isConn ? 'Bridge handshake OK' : 'Bridge unpaired', sub: 'CONNECTION', time: 'now', color: isConn ? GREEN : MID, status: isConn ? 'ok' : 'warn' },
    { icon: 'brain',            lib: 'c', title: 'Knowledge base indexed', sub: 'BUTLER · 250+ scripts', time: '1m', color: CYAN, status: 'ok' },
    { icon: 'shield-check',     lib: 'c', title: 'AES-256 auth active', sub: 'SECURITY · HMAC-SHA256', time: '2m', color: PURPLE, status: 'ok' },
    { icon: 'file-sync-outline',lib: 'c', title: 'Script cache warm', sub: 'FORGE · local store', time: '5m', color: AMBER, status: 'info' },
  ];

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="history" label="ACTIVITY"
          right={
            <TouchableOpacity activeOpacity={0.8} style={[sm.badge, { borderColor: BORDER }]}>
              <Text style={[sm.badgeTxt, { color: MID }]}>VIEW ALL</Text>
            </TouchableOpacity>
          }
        />
        <View style={{ paddingHorizontal: 16, gap: 2, paddingBottom: 12 }}>
          {items.map((item, i) => {
            const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            const statusDot = item.status === 'ok' ? GREEN : item.status === 'warn' ? AMBER : CYAN;
            return (
              <View key={i} style={[af.row, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
                <View style={[af.iconBox, { backgroundColor: item.color + '14', borderColor: item.color + '35' }]}>
                  <Icon name={item.icon as any} size={14} color={item.color} />
                  <View style={[af.statusDot, { backgroundColor: statusDot }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={af.title}>{item.title}</Text>
                  <Text style={af.sub}>{item.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={af.time}>{item.time}</Text>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusDot + '80' }} />
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
const af = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  iconBox:   { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  statusDot: { position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 3.5, borderWidth: 1, borderColor: SURFACE },
  title:     { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 2 },
  sub:       { fontFamily: MONO, fontSize: 9, color: MID, letterSpacing: 0.3 },
  time:      { fontFamily: MONO, fontSize: 9, color: DIM },
});

// ══════════════════════════════════════════════════════════════════
// CORE SURFACES — 3×3 grid with press animations
// ══════════════════════════════════════════════════════════════════
const SURFACES = [
  { icon: 'robot-happy-outline',   label: 'Chat',     tab: 'butler',    color: CYAN,   hex: 'chat-butler'   },
  { icon: 'auto-fix',              label: 'Flows',    tab: 'builder',   color: GREEN,  hex: 'flows-forge'   },
  { icon: 'code-braces',           label: 'Scripts',  tab: 'scripts',   color: AMBER,  hex: 'scripts-lib'   },
  { icon: 'brain',                 label: 'KB',       tab: 'knowledge', color: PURPLE, hex: 'kb-nexus'      },
  { icon: 'folder-network',        label: 'Files',    tab: 'fileshare', color: PINK,   hex: 'vault-files'   },
  { icon: 'chart-bar',             label: 'Logs',     tab: 'logs',      color: RED,    hex: 'pc-intel'      },
  { icon: 'monitor-dashboard',     label: 'PC',       tab: 'connect',   color: CYAN,   hex: 'remote-ctrl'   },
  { icon: 'palette-swatch',        label: 'Theme',    tab: 'cosmetic',  color: PURPLE, hex: 'skins-fx'      },
  { icon: 'tune-variant',          label: 'System',   tab: 'settings',  color: MID,    hex: 'sys-config'    },
];

function CoreSurfaces({ goToTab }: { goToTab: (t: string) => void }) {
  const scaleAs = useRef(SURFACES.map(() => new Animated.Value(1))).current;
  const pressIn  = (i: number) => Animated.spring(scaleAs[i], { toValue: 0.88, tension: 400, friction: 12, useNativeDriver: true }).start();
  const pressOut = (i: number) => Animated.spring(scaleAs[i], { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="view-grid" label="CORE SURFACES" />
        {/* Rainbow divider */}
        <View style={{ height: 3, flexDirection: 'row', marginHorizontal: 16, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
          {SURFACES.map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: s.color, opacity: 0.8 }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 14, gap: 8 }}>
          {SURFACES.map((s, i) => (
            <Pressable key={i}
              onPress={() => { haptics.light(); goToTab(s.tab); }}
              onPressIn={() => pressIn(i)}
              onPressOut={() => pressOut(i)}
              style={{ width: `${(100 - 16) / 3}%` as any }}>
              <Animated.View style={[cs.cell, {
                borderColor: s.color + '30',
                borderTopColor: s.color,
                borderTopWidth: 2.5,
                backgroundColor: SURFACE2,
                transform: [{ scale: scaleAs[i] }],
                overflow: 'hidden',
                position: 'relative',
              }]}>
                {/* Hex tag top-right */}
                <View style={{ position: 'absolute', top: 5, right: 4 }}>
                  <HexTag seed={s.hex} color={s.color} opacity={0.42} />
                </View>
                <View style={[cs.iconBubble, { borderColor: s.color + '55', backgroundColor: s.color + '12' }]}>
                  <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
                </View>
                <Text style={[cs.label, { color: s.color + 'BB' }]}>{s.label}</Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}
const cs = StyleSheet.create({
  cell:       { alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, paddingTop: 18, borderRadius: 13, borderWidth: 1 },
  iconBubble: { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:      { fontFamily: 'monospace', fontSize: 10.5, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════
// ZERO CLOUD CARD
// ══════════════════════════════════════════════════════════════════
function ZeroCloudCard() {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={zc.root}>
        {/* Rainbow top strip */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, flexDirection: 'row' }}>
          {[CYAN, GREEN, AMBER, PURPLE, RED].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        <CornerFrame color={CYAN + '38'} size={9} thickness={1.5} />
        <View style={[zc.iconBox, { backgroundColor: CYAN + '14', borderColor: CYAN + '40' }]}>
          <MaterialCommunityIcons name="shield-off-outline" size={22} color={CYAN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={zc.title}>Zero-cloud architecture</Text>
          <Text style={zc.sub}>All execution on-device or your paired PC. Nothing leaves your network.</Text>
        </View>
        <View style={[zc.powerBtn, { backgroundColor: CYAN + '14', borderColor: CYAN + '35' }]}>
          <MaterialCommunityIcons name="power" size={18} color={CYAN} />
        </View>
      </View>
    </View>
  );
}
const zc = StyleSheet.create({
  root:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 16, paddingTop: 18, overflow: 'hidden', position: 'relative' },
  iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 3 },
  sub:     { fontSize: 11, color: MID, lineHeight: 16 },
  powerBtn:{ width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK SCRIPTS PANEL
// ══════════════════════════════════════════════════════════════════
const Q_SCRIPTS = [
  { id: 's1', icon: 'monitor',          label: 'SYS INFO', color: CYAN,
    script: `import platform,socket\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"Host: {socket.gethostname()}")` },
  { id: 's2', icon: 'broom',            label: 'CLEAN TMP', color: GREEN,
    script: `import shutil,os,tempfile\nfreed=0;n=0\nfor item in os.listdir(tempfile.gettempdir()):\n fp=os.path.join(tempfile.gettempdir(),item)\n try:\n  sz=os.path.getsize(fp) if os.path.isfile(fp) else 0\n  (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n  freed+=sz;n+=1\n except:pass\nprint(f"Cleared {n} items, {freed//1024//1024}MB")` },
  { id: 's3', icon: 'harddisk',         label: 'DISK', color: PURPLE,
    script: `import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { id: 's4', icon: 'wifi',             label: 'NETWORK', color: AMBER,
    script: `import psutil,socket\nnet=psutil.net_io_counters()\nprint(f"Sent: {net.bytes_sent/1024/1024:.1f}MB")\nprint(f"Recv: {net.bytes_recv/1024/1024:.1f}MB")\ns=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)\ns.connect(("8.8.8.8",80));ip=s.getsockname()[0];s.close()\nprint(f"IP: {ip}")` },
  { id: 's5', icon: 'memory',           label: 'PROCS', color: PINK,
    script: `import psutil\nprocs=sorted(psutil.process_iter(['name','cpu_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)[:6]\nfor p in procs: print(f"{p.info['name'][:18]:18} {p.info['cpu_percent']:.1f}%")` },
  { id: 's6', icon: 'battery-charging', label: 'BATTERY', color: '#AAFF00',
    script: `import psutil\nb=psutil.sensors_battery()\nif b: print(f"Level: {b.percent:.0f}%\\nPlugged: {b.power_plugged}")\nelse: print("No battery (desktop?)")` },
];

function QuickScripts({ isConn }: { isConn: boolean }) {
  const [running, setRunning] = useState<string | null>(null);
  const [output, setOutput]   = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const run = async (s: typeof Q_SCRIPTS[0]) => {
    if (!isConn || running) return;
    haptics.heavy(); setRunning(s.id); setOutput(null);
    try {
      const ip = serverConnection.getIP(), port = serverConnection.getPort();
      const tok = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not connected');
      const h: Record<string,string> = { 'Content-Type': 'application/json' };
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 28000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method: 'POST', headers: h, body: JSON.stringify({ script: s.script }), signal: ctrl.signal });
      const d = await res.json();
      setOutput({ id: s.id, text: (d.output || d.error || 'Done').trim().slice(0, 400), ok: !d.error });
      haptics.success();
    } catch (e: any) {
      setOutput({ id: s.id, text: 'Error: ' + (e?.message || 'Network failed'), ok: false });
    } finally { setRunning(null); }
  };

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="code-braces-box" label="QUICK SCRIPTS"
          right={
            <View style={[sm.badge, { borderColor: (isConn ? GREEN : RED) + '50', backgroundColor: (isConn ? GREEN : RED) + '0A' }]}>
              <Text style={[sm.badgeTxt, { color: isConn ? GREEN : RED }]}>{isConn ? 'PC READY' : 'OFFLINE'}</Text>
            </View>
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: output ? 0 : 14 }}>
          {Q_SCRIPTS.map(s => {
            const isRun = running === s.id;
            return (
              <TouchableOpacity key={s.id} onPress={() => run(s)} disabled={!isConn || !!running}
                activeOpacity={0.75} style={[qs2.btn, !isConn && { opacity: 0.35 }]}>
                <View style={[qs2.iconWrap, {
                  backgroundColor: s.color + '14',
                  borderColor: s.color + '40',
                  borderTopColor: s.color,
                  borderTopWidth: 2.5,
                }]}>
                  {isRun
                    ? <ActivityIndicator size="small" color={s.color} />
                    : <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
                  }
                </View>
                <Text style={[qs2.label, { color: s.color + 'AA' }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {output && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <View style={[qs2.outBox, { borderColor: (output.ok ? GREEN : RED) + '50', backgroundColor: (output.ok ? GREEN : RED) + '08' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name={output.ok ? 'check-circle' : 'error'} size={13} color={output.ok ? GREEN : RED} />
                  <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: output.ok ? GREEN : RED }}>OUTPUT</Text>
                </View>
                <TouchableOpacity onPress={() => setOutput(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={14} color={MID} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: output.ok ? '#88FFBB' : '#FF8888', lineHeight: 18 }} selectable>{output.text}</Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
const qs2 = StyleSheet.create({
  btn:     { width: '33.33%', alignItems: 'center', paddingVertical: 14, gap: 7 },
  iconWrap:{ width: 54, height: 54, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' },
  outBox:  { borderWidth: 1.5, borderRadius: 12, padding: 12 },
});

// ══════════════════════════════════════════════════════════════════
// FOOTER — Enhanced with build hash decoration
// ══════════════════════════════════════════════════════════════════
function PageFooter({ isConn, addr }: { isConn: boolean; addr: string }) {
  return (
    <View style={{ paddingHorizontal: PAD, paddingBottom: 24 }}>
      <View style={pf.root}>
        {/* Color strip */}
        <View style={{ flexDirection: 'row', height: 2, width: 80, borderRadius: 1, overflow: 'hidden', marginBottom: 10 }}>
          {[CYAN, GREEN, AMBER, PURPLE, RED].map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
        <Text style={pf.txt}>BUTLER AI  ·  v8.0.0  ·  LOCAL-FIRST  ·  AES-256</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isConn ? GREEN : RED }} />
          <Text style={[pf.status, { color: isConn ? GREEN : MID }]}>{isConn ? addr || 'CONNECTED' : 'NOT CONNECTED'}</Text>
        </View>
        <Text style={[pf.txt, { marginTop: 4 }]}>© 2026 BUTLER AI · ALL RIGHTS RESERVED</Text>
      </View>
    </View>
  );
}
const pf = StyleSheet.create({
  root:   { alignItems: 'center', gap: 5, paddingVertical: 18, borderTopWidth: 1, borderTopColor: BORDER },
  txt:    { fontFamily: MONO, fontSize: 8.5, color: DIM, letterSpacing: 0.5 },
  status: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
});

// ══════════════════════════════════════════════════════════════════
// CONNECT MODAL
// ══════════════════════════════════════════════════════════════════
function ConnectModal({ visible, onClose, onConnected }: {
  visible: boolean; onClose: () => void; onConnected: () => void;
}) {
  const [ip,      setIp]      = useState('');
  const [port,    setPort]    = useState('8766');
  const [status,  setStatus]  = useState('');
  const [busy,    setBusy]    = useState(false);
  const [showCam, setShowCam] = useState(false);
  const scanned = useRef(false);
  const insets = useSafeAreaInsets();

  const handleQR = useCallback(async (data: string) => {
    if (scanned.current) return;
    scanned.current = true; setShowCam(false); haptics.success();
    try {
      const p = parseQRConnection(data);
      if (p?.ip) {
        setIp(p.ip); if (p.port) setPort(String(p.port));
        setStatus(`Connecting to ${p.ip}...`); setBusy(true);
        const r = await (serverConnection.connectManual
          ? serverConnection.connectManual(p.ip, String(p.port || port))
          : Promise.resolve({ success: false, error: 'N/A' }));
        setBusy(false);
        if ((r as any).success) { haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 600); return; }
        throw new Error((r as any).error || 'Failed');
      }
    } catch (e: any) { setBusy(false); setStatus('Error: ' + (e?.message || 'Failed')); }
    const m = data.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?/);
    if (m) { setIp(m[1]); if (m[2]) setPort(m[2]); setStatus(`Found: ${m[1]}`); }
    else   { setStatus(`Scanned: ${data.slice(0, 40)}`); scanned.current = false; }
  }, [port, onConnected, onClose]);

  const connect = async () => {
    if (!ip.trim()) { setStatus('Enter IP address'); return; }
    setBusy(true); setStatus(`Connecting to ${ip.trim()}...`);
    try {
      const r = await (serverConnection.connectManual
        ? serverConnection.connectManual(ip.trim(), port.trim())
        : Promise.resolve({ success: false, error: 'N/A' }));
      if ((r as any).success) { setStatus('Connected!'); haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 500); }
      else throw new Error((r as any).error || 'Failed');
    } catch (e: any) { setStatus('Error: ' + (e?.message || 'Failed')); }
    setBusy(false);
  };

  if (!visible) return null;
  const sc2 = status.includes('Error') ? RED : status.includes('Connected') ? GREEN : AMBER;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <View style={cm.sheet}>
          <View style={{ height: 3, backgroundColor: CYAN }} />
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DIM }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingTop: 14, paddingBottom: 12 }}>
            <View style={[cm.titleIcon, { backgroundColor: CYAN + '14', borderColor: CYAN + '40' }]}>
              <MaterialIcons name="qr-code-scanner" size={20} color={CYAN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={cm.title}>Pair your PC</Text>
              <Text style={cm.sub}>Scan QR from butler_server.py terminal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={cm.closeBtn}>
              <MaterialIcons name="close" size={16} color={MID} />
            </TouchableOpacity>
          </View>

          {showCam ? (
            <View style={cm.camWrap}>
              <Suspense fallback={null}>
                <QRCameraScanner onScanned={handleQR} hudColor={CYAN}>
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={{ width: 120, height: 120, borderWidth: 2, borderColor: CYAN + '70', borderRadius: 8 }} />
                    <Text style={{ fontFamily: MONO, fontSize: 9, color: CYAN, marginTop: 10, letterSpacing: 1, fontWeight: '900' }}>SCAN QR FROM TERMINAL</Text>
                  </View>
                </QRCameraScanner>
              </Suspense>
              <TouchableOpacity onPress={() => setShowCam(false)} style={cm.camClose}>
                <MaterialIcons name="close" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { scanned.current = false; setShowCam(true); }} activeOpacity={0.82} style={cm.scanBtn}>
              <MaterialIcons name="qr-code-scanner" size={20} color={CYAN} />
              <View>
                <Text style={cm.scanBtnTxt}>SCAN QR CODE</Text>
                <Text style={cm.scanBtnSub}>Run butler_server.py, then scan QR</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: MID }}>OR ENTER IP</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          </View>

          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <TextInput value={ip} onChangeText={setIp} placeholder="192.168.x.x"
              placeholderTextColor={DIM} style={cm.input}
              keyboardType="numeric" autoCorrect={false} />
            <TextInput value={port} onChangeText={setPort} placeholder="8766"
              placeholderTextColor={DIM} style={[cm.input, { borderColor: BORDER }]}
              keyboardType="numeric" />
          </View>

          {!!status && (
            <View style={[cm.statusBox, { borderColor: sc2 + '45', backgroundColor: sc2 + '0A' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: sc2 }}>{status}</Text>
            </View>
          )}

          <Pressable onPress={connect} disabled={busy}
            style={({ pressed }) => [cm.connectBtn, { opacity: pressed || busy ? 0.8 : 1 }]}>
            {busy ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="link" size={18} color="#000" />}
            <Text style={cm.connectTxt}>{busy ? 'CONNECTING...' : 'CONNECT TO PC'}</Text>
          </Pressable>

          <View style={{ height: Math.max(insets.bottom + 8, 20) }} />
        </View>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  sheet:      { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  titleIcon:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontSize: 18, fontWeight: '700', color: TEXT },
  sub:        { fontFamily: MONO, fontSize: 10, color: MID, marginTop: 3 },
  closeBtn:   { width: 34, height: 34, borderRadius: 10, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
  camWrap:    { marginHorizontal: 16, marginBottom: 14, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: CYAN + '70' },
  camClose:   { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  scanBtn:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 14, borderWidth: 1.5, borderRadius: 14, borderColor: CYAN + '55', backgroundColor: CYAN + '0E', paddingVertical: 14, paddingHorizontal: 16 },
  scanBtnTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: CYAN },
  scanBtnSub: { fontFamily: MONO, fontSize: 9.5, color: MID, marginTop: 3 },
  input:      { backgroundColor: BG, borderWidth: 1.5, borderColor: CYAN + '55', borderRadius: 12, color: TEXT, padding: 14, fontFamily: MONO, fontSize: 14 },
  statusBox:  { marginHorizontal: 16, marginTop: 10, padding: 11, borderRadius: 10, borderWidth: 1 },
  connectBtn: { margin: 16, marginBottom: 4, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  connectTxt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000' },
});

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

  // Rolling history for sparklines (8 points)
  const [cpuHistory,  setCpuHistory]  = useState<number[]>([0,0,0,0,0,0,0,0]);
  const [ramHistory,  setRamHistory]  = useState<number[]>([0,0,0,0,0,0,0,0]);
  const [diskHistory, setDiskHistory] = useState<number[]>([0,0,0,0,0,0,0,0]);

  const loadData = useCallback(async () => {
    try {
      const conn = serverConnection.isConnected?.() ?? false;
      const ip   = serverConnection.getIP?.()   || '';
      const port = serverConnection.getPort?.() || '';
      setIsConn(conn);
      setAddr(ip && port ? `${ip}:${port}` : '');
      if (conn && ip && port) {
        const tok = serverConnection.getToken?.() || '';
        const h: Record<string,string> = {};
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController();
        const t0   = Date.now();
        setTimeout(() => ctrl.abort(), 7000);
        try {
          const res = await fetch(`http://${ip}:${port}/api/metrics`, { headers: h, signal: ctrl.signal });
          if (res.ok) {
            const d = await res.json();
            const c = d.cpu_percent  ?? d.cpu?.percent    ?? 0;
            const r = d.ram_percent  ?? d.memory?.percent ?? 0;
            const dk= d.disk_percent ?? d.disk?.percent   ?? 0;
            setLatency(Date.now() - t0);
            setMetrics({ cpu: c, ram: r, disk: dk });
            setCpuHistory(prev  => [...prev.slice(1),  c]);
            setRamHistory(prev  => [...prev.slice(1),  r]);
            setDiskHistory(prev => [...prev.slice(1), dk]);
            performanceHistory.recordFromMetrics(d);
          }
        } catch {}
      }
    } catch {}
    try {
      const h = await executionHistory.getAll().catch(() => [] as any[]);
      setScripts(Array.isArray(h) ? h.length : 0);
    } catch {}
    try {
      const stats = await knowledgeAccumulator.getStats?.().catch(() => null);
      if (stats) setKbCount(stats.totalFindings ?? 0);
    } catch {}
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
      setIsConn(s.isConnected ?? false);
      setAddr(s.addr || '');
      unsub = connectionHub.subscribe((st: any) => {
        setIsConn(st.isConnected ?? false);
        setAddr(st.addr || '');
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
    haptics.light();
    try { (global as any).__butlerSwitchTab?.(tab); } catch {}
  }, []);

  const onRefresh = useCallback(async () => {
    setRefresh(true); haptics.medium();
    await loadData();
    haptics.success(); setRefresh(false);
  }, [loadData]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ConnectModal visible={showQR} onClose={() => setShowQR(false)} onConnected={loadData} />

      {/* ── FIXED HEADER ── */}
      <HomeHeader safeTop={insets.top} isConn={isConn} addr={addr} onPair={() => setShowQR(true)} />

      {/* ── SCROLL BODY ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 280 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refresh} onRefresh={onRefresh}
            tintColor={CYAN} colors={[CYAN, GREEN, AMBER]}
            progressBackgroundColor={SURFACE}
          />
        }
      >
        {/* Pair Prompt — only when offline */}
        {!isConn && <PairPromptBanner onPair={() => setShowQR(true)} />}

        {/* Quick Actions */}
        <QuickActions onPair={() => setShowQR(true)} goToTab={goToTab} />

        {/* Today's Stats strip */}
        <TodayStrip isConn={isConn} scripts={scripts} kbCount={kbCount} latency={latency} />

        {/* Live Gauges with sparklines */}
        <LiveGauges
          isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk}
          cpuHistory={cpuHistory} ramHistory={ramHistory} diskHistory={diskHistory}
        />

        {/* System Health Score */}
        <SystemHealthScore isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} latency={latency} />

        {/* System Metrics */}
        <SystemMetrics isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} latency={latency} />

        {/* Runtime Panel */}
        <RuntimePanel isConn={isConn} scripts={scripts} kbCount={kbCount} />

        {/* Activity Feed */}
        <ActivityFeed isConn={isConn} addr={addr} />

        {/* Command Gallery */}
        <CommandGallery isConn={isConn} />

        {/* Core Surfaces 3×3 */}
        <CoreSurfaces goToTab={goToTab} />

        {/* Zero Cloud */}
        <ZeroCloudCard />

        {/* Remote Access */}
        <View style={{ paddingHorizontal: PAD }}>
          <RemoteAccessMonetizationCard onConnected={loadData} />
        </View>

        {/* Quick Scripts */}
        <QuickScripts isConn={isConn} />

        {/* Vault */}
        <View style={{ paddingHorizontal: PAD }}>
          <NexusVaultCard isConnected={isConn} serverLatencyMs={latency} />
        </View>

        {/* Footer */}
        <PageFooter isConn={isConn} addr={addr} />
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
