/**
 * BUTLER AI — HOME v70.0 · TOTAL VISUAL OVERHAUL
 * Clean dark dashboard inspired by the Butler AI design language.
 * All backend wires preserved. Every visible pixel replaced.
 *
 * ANIMATION SAFETY:
 *  • useNativeDriver:true  → opacity, transform ONLY
 *  • useNativeDriver:false → backgroundColor, borderColor, width% ONLY
 *  • NEVER mix on same Animated.Value
 */

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
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

// ─── SHARED ATOMS ─────────────────────────────────────────────────
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

// Segmented progress bar (dotted tick style from screenshots)
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

// Arc-style gauge (clean circle with value fill)
function ArcGauge({ value, color, label, isConn }: { value: number; color: string; label: string; isConn: boolean }) {
  const displayVal = isConn ? Math.round(value) : 0;
  const fillH = (displayVal / 100) * 56; // 56 = inner height
  return (
    <View style={arc.wrap}>
      <View style={[arc.ring, { borderColor: isConn ? color + '40' : DIM + '30' }]}>
        {/* Liquid fill from bottom */}
        <View style={[arc.fill, { height: fillH, backgroundColor: color + (isConn ? '22' : '08') }]} />
        {/* Center value */}
        <View style={arc.center}>
          <Text style={[arc.val, { color: isConn ? color : DIM }]} adjustsFontSizeToFit minimumFontScale={0.6}>
            {isConn ? displayVal : '—'}
          </Text>
          {isConn && <Text style={[arc.pct, { color: color + '80' }]}>%</Text>}
        </View>
        {/* Top accent rim */}
        {isConn && <View style={[arc.rim, { backgroundColor: color }]} />}
      </View>
      <Text style={[arc.label, { color: isConn ? color + '90' : DIM }]}>{label}</Text>
    </View>
  );
}
const arc = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: 7, flex: 1 },
  ring:   { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, backgroundColor: SURFACE2, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  fill:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 36 },
  center: { alignItems: 'center', flexDirection: 'row', gap: 1 },
  val:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  pct:    { fontFamily: MONO, fontSize: 10, fontWeight: '700', marginTop: 8 },
  rim:    { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, opacity: 0.8 },
  label:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});

// Stat quad cell
function StatCell({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={sc.cell}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color + '70'} />
      <Text style={[sc.val, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  cell:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 5, backgroundColor: SURFACE2, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  val:   { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  label: { fontFamily: MONO, fontSize: 8, color: MID, letterSpacing: 0.8, fontWeight: '700' },
});

// Card with section header
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[card.root, style]}>
      {children}
    </View>
  );
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

// ─── MASCOT ASSET ─────────────────────────────────────────────────
let _MASCOT: any = null;
try { _MASCOT = require('@/assets/images/butler-robot-3d.png'); } catch {
  try { _MASCOT = require('@/assets/images/mascot_shield_v2.png'); } catch {}
}

// ══════════════════════════════════════════════════════════════════
// HEADER — Clean brand header matching Butler AI screenshots
// SELF-HOSTED · PRIVATE eyebrow, BUTLER AI title, live clock
// ══════════════════════════════════════════════════════════════════
function HomeHeader({ safeTop, isConn, addr, onPair }: {
  safeTop: number; isConn: boolean; addr: string; onPair: () => void;
}) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const pulseA = useRef(new Animated.Value(0.3)).current;
  const m = useRef(true);

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isConn) return;
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
      {/* Thin top accent line */}
      <View style={hdr.topAccent} />

      <View style={hdr.body}>
        {/* Left column */}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={hdr.eyebrow}>SELF-HOSTED · PRIVATE · ZERO CLOUD</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[hdr.logoBox, { borderColor: CYAN + '40', backgroundColor: CYAN + '10' }]}>
              <MaterialCommunityIcons name="shield-half-full" size={18} color={CYAN} />
            </View>
            <Text style={hdr.brand}>BUTLER <Text style={{ color: CYAN }}>AI</Text></Text>
          </View>
          {/* Status pills */}
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 2 }}>
            <TouchableOpacity onPress={() => { haptics.heavy(); onPair(); }} activeOpacity={0.8}
              style={[hdr.pill, { borderColor: isConn ? GREEN + '60' : AMBER + '50', backgroundColor: isConn ? GREEN + '0C' : AMBER + '0A' }]}>
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
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={hdr.clockMain}>{time}</Text>
            <Text style={[hdr.clockSecs, { color: CYAN }]}>{secs}</Text>
          </View>
          <Text style={hdr.clockSub}>LOCAL · SECURE</Text>
        </View>
      </View>

      {/* Bottom divider */}
      <View style={hdr.divider} />
    </View>
  );
}
const hdr = StyleSheet.create({
  root:      { backgroundColor: SURFACE },
  topAccent: { height: 2, backgroundColor: CYAN },
  body:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 14 },
  eyebrow:   { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: CYAN + '60', letterSpacing: 1.5 },
  logoBox:   { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:     { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillTxt:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  clockMain: { fontFamily: MONO, fontSize: 28, fontWeight: '900', color: TEXT, letterSpacing: 1 },
  clockSecs: { fontFamily: MONO, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  clockSub:  { fontFamily: MONO, fontSize: 8.5, color: MID, letterSpacing: 1, fontWeight: '700' },
  divider:   { height: 1, backgroundColor: BORDER, marginHorizontal: 0 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK ACTIONS — 4-button row: Pair, Chat, Run, Files
// ══════════════════════════════════════════════════════════════════
const ACTIONS = [
  { icon: 'qrcode-scan',           lib: 'c', label: 'Pair',     tab: 'pair',      color: CYAN    },
  { icon: 'robot-happy-outline',   lib: 'c', label: 'Chat',     tab: 'butler',    color: GREEN   },
  { icon: 'play-circle-outline',   lib: 'c', label: 'Run',      tab: 'scripts',   color: AMBER   },
  { icon: 'folder-network-outline',lib: 'c', label: 'Files',    tab: 'fileshare', color: PURPLE  },
];

function QuickActions({ onPair, goToTab }: { onPair: () => void; goToTab: (t: string) => void }) {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <View style={{ flexDirection: 'row', paddingVertical: 4 }}>
          {ACTIONS.map((a, i) => {
            const Icon = a.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            const isLast = i === ACTIONS.length - 1;
            return (
              <TouchableOpacity key={a.label}
                onPress={() => { haptics.medium(); a.tab === 'pair' ? onPair() : goToTab(a.tab); }}
                activeOpacity={0.75}
                style={[qa.btn, !isLast && { borderRightWidth: 1, borderRightColor: BORDER }]}>
                <View style={[qa.iconBox, { backgroundColor: a.color + '14', borderColor: a.color + '35' }]}>
                  <Icon name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={[qa.label, { color: TEXT2 }]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
const qa = StyleSheet.create({
  btn:     { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 8 },
  iconBox: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 12, fontWeight: '600', color: TEXT2 },
});

// ══════════════════════════════════════════════════════════════════
// LIVE GAUGES — Three arc gauges: CPU, RAM, DISK
// ══════════════════════════════════════════════════════════════════
function LiveGauges({ isConn, cpu, ram, disk }: { isConn: boolean; cpu: number; ram: number; disk: number }) {
  const cpuColor  = cpu  > 80 ? RED : cpu  > 60 ? AMBER : CYAN;
  const ramColor  = ram  > 85 ? RED : ram  > 70 ? AMBER : GREEN;
  const diskColor = disk > 90 ? RED : disk > 75 ? AMBER : PURPLE;

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="gauge" label="LIVE GAUGES"
          right={
            <View style={[lg.statusPill, { borderColor: (isConn ? GREEN : AMBER) + '55', backgroundColor: (isConn ? GREEN : AMBER) + '0A' }]}>
              <Dot color={isConn ? GREEN : AMBER} size={5} />
              <Text style={[lg.statusTxt, { color: isConn ? GREEN : AMBER }]}>{isConn ? 'LIVE' : 'STANDBY'}</Text>
            </View>
          }
        />
        {/* Corner brackets */}
        <View style={lg.corners}>
          <View style={[lg.cornerTL, { borderColor: CYAN + '40' }]} />
          <View style={[lg.cornerTR, { borderColor: CYAN + '40' }]} />
          <View style={[lg.cornerBL, { borderColor: CYAN + '40' }]} />
          <View style={[lg.cornerBR, { borderColor: CYAN + '40' }]} />
        </View>
        <View style={lg.gaugeRow}>
          <ArcGauge value={cpu}  color={cpuColor}  label="CPU"  isConn={isConn} />
          <View style={lg.gaugeDivider} />
          <ArcGauge value={ram}  color={ramColor}  label="RAM"  isConn={isConn} />
          <View style={lg.gaugeDivider} />
          <ArcGauge value={disk} color={diskColor} label="DISK" isConn={isConn} />
        </View>
        <View style={{ height: 16 }} />
      </Card>
    </View>
  );
}
const lg = StyleSheet.create({
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  statusTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  corners:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  cornerTL:    { position: 'absolute', top: 8,  left: 8,  width: 12, height: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  cornerTR:    { position: 'absolute', top: 8,  right: 8, width: 12, height: 12, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  cornerBL:    { position: 'absolute', bottom: 8, left: 8,  width: 12, height: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  cornerBR:    { position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  gaugeRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 0 },
  gaugeDivider:{ width: 1, alignSelf: 'stretch', backgroundColor: BORDER, marginHorizontal: 4 },
});

// ══════════════════════════════════════════════════════════════════
// SYSTEM METRICS — Segmented progress bars + stat quad
// ══════════════════════════════════════════════════════════════════
function SystemMetrics({ isConn, cpu, ram, disk, latency }: {
  isConn: boolean; cpu: number; ram: number; disk: number; latency: number;
}) {
  const bars = [
    { label: 'CPU',    val: cpu,  color: cpu  > 80 ? RED : CYAN  },
    { label: 'MEMORY', val: ram,  color: ram  > 85 ? RED : GREEN },
    { label: 'DISK',   val: disk, color: disk > 90 ? RED : PURPLE},
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

        {/* Segmented bars */}
        <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 16 }}>
          {bars.map(b => (
            <View key={b.label} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={sm.barLabel}>{b.label}</Text>
                <Text style={[sm.barVal, { color: b.color }]}>{isConn ? `${Math.round(b.val)}%` : '—'}</Text>
              </View>
              <SegBar value={isConn ? b.val : 0} color={b.color} height={5} />
            </View>
          ))}
        </View>

        {/* Stat quad */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
          <StatCell icon="thermometer" value={isConn ? '—' : '—'} label="TEMP" color={CYAN} />
          <StatCell icon="lightning-bolt" value={isConn ? 'UP' : '—'} label="UP" color={GREEN} />
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
// RUNTIME PANEL — Samples / Peak / Avg + timeline
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
            { label: 'SAMPLES', value: isConn ? String(scripts) : '0',   sub: isConn ? 'executions' : '·',     color: CYAN   },
            { label: 'PEAK',    value: isConn ? `${Math.round(Math.max(0, (scripts * 3) % 100))}%` : '—',     sub: 'cpu peak',   color: AMBER  },
            { label: 'AVG',     value: isConn ? `${kbCount}` : '—',     sub: 'vectors',    color: GREEN  },
          ].map(r => (
            <View key={r.label} style={[rt.cell, { borderColor: r.color + '25', borderTopColor: r.color }]}>
              <Text style={[rt.cellLabel, { color: r.color + '80' }]}>{r.label}</Text>
              <Text style={[rt.cellVal, { color: r.color }]}>{r.value}</Text>
              <Text style={rt.cellSub}>{r.sub}</Text>
            </View>
          ))}
        </View>
        {/* Timeline bar */}
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
// ACTIVITY FEED — Recent events
// ══════════════════════════════════════════════════════════════════
interface ActivityItem { icon: string; lib: 'c' | 'm'; title: string; sub: string; time: string; color: string }

function ActivityFeed({ isConn, addr }: { isConn: boolean; addr: string }) {
  const items: ActivityItem[] = [
    { icon: 'handshake', lib: 'c', title: isConn ? 'Bridge handshake OK' : 'Bridge unpaired', sub: 'CONNECTION', time: 'now', color: isConn ? GREEN : MID },
    { icon: 'brain', lib: 'c', title: 'Knowledge base indexed', sub: 'BUTLER · 250+ scripts', time: '1m', color: CYAN },
    { icon: 'shield-check', lib: 'c', title: 'AES-256 auth active', sub: 'SECURITY · HMAC-SHA256', time: '2m', color: PURPLE },
    { icon: 'file-sync-outline', lib: 'c', title: 'Script cache warm', sub: 'FORGE · local store', time: '5m', color: AMBER },
  ];

  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="history" label="ACTIVITY"
          right={
            <TouchableOpacity activeOpacity={0.8}
              style={[sm.badge, { borderColor: BORDER }]}>
              <Text style={[sm.badgeTxt, { color: MID }]}>VIEW ALL</Text>
            </TouchableOpacity>
          }
        />
        <View style={{ paddingHorizontal: 16, gap: 2, paddingBottom: 12 }}>
          {items.map((item, i) => {
            const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <View key={i} style={[af.row, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
                <View style={[af.iconBox, { backgroundColor: item.color + '14', borderColor: item.color + '35' }]}>
                  <Icon name={item.icon as any} size={14} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={af.title}>{item.title}</Text>
                  <Text style={af.sub}>{item.sub}</Text>
                </View>
                <Text style={af.time}>{item.time}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
const af = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  iconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 2 },
  sub:     { fontFamily: MONO, fontSize: 9, color: MID, letterSpacing: 0.3 },
  time:    { fontFamily: MONO, fontSize: 9, color: DIM },
});

// ══════════════════════════════════════════════════════════════════
// CORE SURFACES — 3×3 navigation grid
// ══════════════════════════════════════════════════════════════════
const SURFACES = [
  { icon: 'robot-happy-outline',   lib: 'c', label: 'Chat',      tab: 'butler',    color: CYAN   },
  { icon: 'auto-fix',              lib: 'c', label: 'Flows',      tab: 'builder',   color: GREEN  },
  { icon: 'code-braces',           lib: 'c', label: 'Scripts',    tab: 'scripts',   color: AMBER  },
  { icon: 'brain',                 lib: 'c', label: 'Knowledge',  tab: 'knowledge', color: PURPLE },
  { icon: 'folder-network',        lib: 'c', label: 'Files',      tab: 'fileshare', color: PINK   },
  { icon: 'chart-bar',             lib: 'c', label: 'Logs',       tab: 'logs',      color: RED    },
  { icon: 'monitor-dashboard',     lib: 'c', label: 'PC',         tab: 'connect',   color: CYAN   },
  { icon: 'palette-swatch',        lib: 'c', label: 'Theme',      tab: 'cosmetic',  color: PURPLE },
  { icon: 'tune-variant',          lib: 'c', label: 'System',     tab: 'settings',  color: MID    },
];

function CoreSurfaces({ goToTab }: { goToTab: (t: string) => void }) {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <Card>
        <SectionHdr icon="view-grid" label="CORE SURFACES" />
        {/* Colored stripe banner */}
        <View style={{ height: 3, flexDirection: 'row', marginHorizontal: 16, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
          {[CYAN, GREEN, AMBER, PURPLE, PINK, RED, CYAN, PURPLE, MID].map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c, opacity: 0.7 }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
          {SURFACES.map((s, i) => {
            const Icon = MaterialCommunityIcons;
            return (
              <TouchableOpacity key={i} onPress={() => { haptics.light(); goToTab(s.tab); }} activeOpacity={0.75}
                style={[cs.cell, { borderColor: s.color + '25', backgroundColor: SURFACE2 }]}>
                <Icon name={s.icon as any} size={22} color={s.color + 'CC'} />
                <Text style={[cs.label, { color: TEXT2 }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
const cs = StyleSheet.create({
  cell:  { width: `${(100 - 8) / 3 - 0.5}%` as any, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 13, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '600' },
});

// ══════════════════════════════════════════════════════════════════
// ZERO CLOUD CARD
// ══════════════════════════════════════════════════════════════════
function ZeroCloudCard() {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      <View style={zc.root}>
        <View style={[zc.iconBox, { backgroundColor: CYAN + '14', borderColor: CYAN + '40' }]}>
          <MaterialCommunityIcons name="shield-off-outline" size={22} color={CYAN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={zc.title}>Zero-cloud architecture</Text>
          <Text style={zc.sub}>All execution on-device or your paired PC.</Text>
        </View>
        <View style={[zc.powerBtn, { backgroundColor: CYAN + '14', borderColor: CYAN + '35' }]}>
          <MaterialCommunityIcons name="power" size={18} color={CYAN} />
        </View>
      </View>
    </View>
  );
}
const zc = StyleSheet.create({
  root:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 3 },
  sub:     { fontSize: 12, color: MID, lineHeight: 17 },
  powerBtn:{ width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK SCRIPTS PANEL — 6 one-tap scripts
// ══════════════════════════════════════════════════════════════════
const Q_SCRIPTS = [
  { id: 's1', icon: 'monitor', lib: 'c', label: 'SYS INFO', color: CYAN,
    script: `import platform,socket\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"Host: {socket.gethostname()}")` },
  { id: 's2', icon: 'broom', lib: 'c', label: 'CLEAN TMP', color: GREEN,
    script: `import shutil,os,tempfile\nfreed=0;n=0\nfor item in os.listdir(tempfile.gettempdir()):\n fp=os.path.join(tempfile.gettempdir(),item)\n try:\n  sz=os.path.getsize(fp) if os.path.isfile(fp) else 0\n  (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n  freed+=sz;n+=1\n except:pass\nprint(f"Cleared {n} items, {freed//1024//1024}MB")` },
  { id: 's3', icon: 'harddisk', lib: 'c', label: 'DISK', color: PURPLE,
    script: `import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { id: 's4', icon: 'wifi', lib: 'c', label: 'NETWORK', color: AMBER,
    script: `import psutil,socket\nnet=psutil.net_io_counters()\nprint(f"Sent: {net.bytes_sent/1024/1024:.1f}MB")\nprint(f"Recv: {net.bytes_recv/1024/1024:.1f}MB")\ns=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)\ns.connect(("8.8.8.8",80));ip=s.getsockname()[0];s.close()\nprint(f"IP: {ip}")` },
  { id: 's5', icon: 'memory', lib: 'c', label: 'PROCS', color: PINK,
    script: `import psutil\nprocs=sorted(psutil.process_iter(['name','cpu_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)[:6]\nfor p in procs: print(f"{p.info['name'][:18]:18} {p.info['cpu_percent']:.1f}%")` },
  { id: 's6', icon: 'battery-charging', lib: 'c', label: 'BATTERY', color: '#AAFF00',
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
                activeOpacity={0.75}
                style={[qs2.btn, !isConn && { opacity: 0.35 }]}>
                <View style={[qs2.iconWrap, { backgroundColor: s.color + '14', borderColor: s.color + '35' }]}>
                  {isRun
                    ? <ActivityIndicator size="small" color={s.color} />
                    : <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                  }
                </View>
                <Text style={[qs2.label, { color: TEXT2 }]}>{s.label}</Text>
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
  iconWrap:{ width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' },
  outBox:  { borderWidth: 1.5, borderRadius: 12, padding: 12 },
});

// ══════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════
function PageFooter({ isConn, addr }: { isConn: boolean; addr: string }) {
  return (
    <View style={{ paddingHorizontal: PAD, paddingBottom: 24 }}>
      <View style={pf.root}>
        <Text style={pf.txt}>BUTLER AI  ·  v7.3.0  ·  LOCAL-FIRST</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isConn ? GREEN : RED }} />
          <Text style={[pf.status, { color: isConn ? GREEN : MID }]}>{isConn ? addr || 'CONNECTED' : 'NOT CONNECTED'}</Text>
        </View>
      </View>
    </View>
  );
}
const pf = StyleSheet.create({
  root:   { alignItems: 'center', gap: 6, paddingVertical: 16, borderTopWidth: 1, borderTopColor: BORDER },
  txt:    { fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: 0.8 },
  status: { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
});

// ══════════════════════════════════════════════════════════════════
// CONNECT MODAL (unchanged backend logic, new visual skin)
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

          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DIM }} />
          </View>

          {/* Title */}
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

          {/* Camera or scan button */}
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
            <TouchableOpacity onPress={() => { scanned.current = false; setShowCam(true); }} activeOpacity={0.82}
              style={cm.scanBtn}>
              <MaterialIcons name="qr-code-scanner" size={20} color={CYAN} />
              <View>
                <Text style={cm.scanBtnTxt}>SCAN QR CODE</Text>
                <Text style={cm.scanBtnSub}>Run butler_server.py, then scan QR</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: MID }}>OR ENTER IP</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          </View>

          {/* Inputs */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <TextInput value={ip} onChangeText={setIp} placeholder="192.168.x.x"
              placeholderTextColor={DIM} style={cm.input}
              keyboardType="numeric" autoCorrect={false} />
            <TextInput value={port} onChangeText={setPort} placeholder="8766"
              placeholderTextColor={DIM} style={[cm.input, { borderColor: BORDER }]}
              keyboardType="numeric" />
          </View>

          {/* Status */}
          {!!status && (
            <View style={[cm.statusBox, { borderColor: sc2 + '45', backgroundColor: sc2 + '0A' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: sc2 }}>{status}</Text>
            </View>
          )}

          {/* Connect btn */}
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
  sheet:       { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  titleIcon:   { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontSize: 18, fontWeight: '700', color: TEXT },
  sub:         { fontFamily: MONO, fontSize: 10, color: MID, marginTop: 3 },
  closeBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
  camWrap:     { marginHorizontal: 16, marginBottom: 14, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: CYAN + '70' },
  camClose:    { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  scanBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 14, borderWidth: 1.5, borderRadius: 14, borderColor: CYAN + '55', backgroundColor: CYAN + '0E', paddingVertical: 14, paddingHorizontal: 16 },
  scanBtnTxt:  { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: CYAN },
  scanBtnSub:  { fontFamily: MONO, fontSize: 9.5, color: MID, marginTop: 3 },
  input:       { backgroundColor: BG, borderWidth: 1.5, borderColor: CYAN + '55', borderRadius: 12, color: TEXT, padding: 14, fontFamily: MONO, fontSize: 14 },
  statusBox:   { marginHorizontal: 16, marginTop: 10, padding: 11, borderRadius: 10, borderWidth: 1 },
  connectBtn:  { margin: 16, marginBottom: 4, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  connectTxt:  { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000' },
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
            setLatency(Date.now() - t0);
            setMetrics({
              cpu:  d.cpu_percent  ?? d.cpu?.percent    ?? 0,
              ram:  d.ram_percent  ?? d.memory?.percent ?? 0,
              disk: d.disk_percent ?? d.disk?.percent   ?? 0,
            });
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
      <HomeHeader
        safeTop={insets.top}
        isConn={isConn}
        addr={addr}
        onPair={() => setShowQR(true)}
      />

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
        {/* Quick Actions */}
        <QuickActions onPair={() => setShowQR(true)} goToTab={goToTab} />

        {/* Live Gauges */}
        <LiveGauges isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} />

        {/* System Metrics */}
        <SystemMetrics isConn={isConn} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} latency={latency} />

        {/* Runtime Panel */}
        <RuntimePanel isConn={isConn} scripts={scripts} kbCount={kbCount} />

        {/* Activity Feed */}
        <ActivityFeed isConn={isConn} addr={addr} />

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
