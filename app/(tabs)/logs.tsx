/**
 * BUTLER AI — PC INTEL v3.0 · PLAY STORE PREMIUM
 * Full visual overhaul matching nexushome.tsx aesthetic.
 * Segmented progress bars · Arc gauges · Sparklines · HUD corners
 * All backend wires from v2.0 preserved unchanged.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable,
  Platform, Animated, ActivityIndicator, Alert, Dimensions, RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { useConnectionStatus } from '@/hooks/useConnection';
import { serverConnection } from '@/services/serverConnection';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { PC_ACTION_SCRIPTS, PC_SCAN_SCRIPT } from '@/services/pcActionScripts';
import { performanceHistory } from '@/services/performanceHistory';
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import { PerformanceMonitorWidget, PerformanceStrip } from '@/components/ui/PerformanceMonitorWidget';

const MONO: any = FONT.mono;
const SANS: any = FONT.sans;
const SW  = Math.max(320, Dimensions.get('window').width);
const PAD = 14;
const GAP = 8;

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
const TEAL     = '#00B4D8';
const BLUE     = '#4A9EFF';
const DIM      = '#3A5A6A';
const MID      = '#6A8A9A';
const TEXT     = '#D8EEF4';
const TEXT2    = '#8AAABB';

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

function HUDCorners({ color, size = 8 }: { color: string; size?: number }) {
  const s = { position: 'absolute', width: size, height: size } as const;
  return (
    <>
      <View style={[s, { top: 0,    left: 0,  borderTopWidth: 1.5,    borderLeftWidth: 1.5,   borderColor: color }]} />
      <View style={[s, { top: 0,    right: 0, borderTopWidth: 1.5,    borderRightWidth: 1.5,  borderColor: color }]} />
      <View style={[s, { bottom: 0, left: 0,  borderBottomWidth: 1.5, borderLeftWidth: 1.5,   borderColor: color }]} />
      <View style={[s, { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5,  borderColor: color }]} />
    </>
  );
}

function SegBar({ value, color, height = 5 }: { value: number; color: string; height?: number }) {
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

function Sparkline({ data, color, height = 24 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        return (
          <View key={i} style={{
            flex: 1, height: h, borderRadius: 2,
            backgroundColor: i === data.length - 1 ? color : color + '55',
          }} />
        );
      })}
    </View>
  );
}

function ArcGauge({ value, color, label, isConn }: { value: number; color: string; label: string; isConn: boolean }) {
  const displayVal = isConn ? Math.round(value) : 0;
  const fillH = (displayVal / 100) * 56;
  const glowA = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    if (!isConn) return;
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 2400, useNativeDriver: true }),
      Animated.timing(glowA, { toValue: 0.3, duration: 2400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [isConn]);

  const crit = value > 85 ? RED : value > 70 ? AMBER : color;

  return (
    <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
      <Animated.View style={{ opacity: isConn ? glowA : 0.35 }}>
        <View style={[ag.ring, { borderColor: isConn ? crit + '55' : DIM + '25' }]}>
          <View style={[ag.fill, { height: fillH, backgroundColor: crit + (isConn ? '25' : '08') }]} />
          <View style={ag.rim} />
          <View style={ag.center}>
            <Text style={[ag.val, { color: isConn ? crit : DIM }]} adjustsFontSizeToFit minimumFontScale={0.6}>
              {isConn ? displayVal : '—'}
            </Text>
            {isConn && <Text style={[ag.pct, { color: crit + '80' }]}>%</Text>}
          </View>
          {isConn && <View style={[ag.topBar, { backgroundColor: crit }]} />}
        </View>
      </Animated.View>
      <Text style={[ag.label, { color: isConn ? crit + 'AA' : DIM }]}>{label}</Text>
    </View>
  );
}
const ag = StyleSheet.create({
  ring:   { width: 78, height: 78, borderRadius: 39, borderWidth: 1.5, backgroundColor: SURFACE2, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  fill:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 39 },
  rim:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 39, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  center: { alignItems: 'center', flexDirection: 'row', gap: 1 },
  val:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  pct:    { fontFamily: MONO, fontSize: 10, fontWeight: '700', marginTop: 8 },
  label:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});

function Card({ children, style, accentColor = CYAN }: { children: React.ReactNode; style?: any; accentColor?: string }) {
  return (
    <View style={[card.root, { borderColor: accentColor + '20' }, style]}>
      <View style={[card.topBar, { backgroundColor: accentColor }]} />
      {children}
    </View>
  );
}
const card = StyleSheet.create({
  root:   { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 4 } }) },
  topBar: { height: 3 },
});

function SectionHdr({ icon, label, lib = 'm', color = CYAN, right }: {
  icon: string; label: string; lib?: 'm' | 'c'; color?: string; right?: React.ReactNode;
}) {
  const Icon = lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
      <Icon name={icon as any} size={13} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: color + 'CC', letterSpacing: 1.4, flex: 1 }}>{label}</Text>
      {right}
    </View>
  );
}

function StatusBadge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderColor: color + '50', backgroundColor: color + '0C' }}>
      <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color }}>{text}</Text>
    </View>
  );
}

// ─── INTEL HEADER ─────────────────────────────────────────────────
function IntelHeader({ safeTop, isConn }: { safeTop: number; isConn: boolean }) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const [dateStr, setDate] = useState('');
  const shimA   = useRef(new Animated.Value(-SW)).current;
  const pulseA  = useRef(new Animated.Value(0.3)).current;
  const m = useRef(true);

  useEffect(() => {
    const upd = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
      setDate(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    upd(); const t = setInterval(upd, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    m.current = true;
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

  const cc = isConn ? GREEN : AMBER;

  return (
    <View style={[ih.root, { paddingTop: safeTop }]}>
      <View style={ih.topStripe} />
      <Animated.View pointerEvents="none" style={[ih.shimmer, { transform: [{ translateX: shimA }] }]} />

      <View style={ih.body}>
        {/* Left */}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ih.eyebrow}>PYTHON AUTOMATION · LIVE METRICS · PC CONTROL</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[ih.logoBox, { borderColor: GREEN + '55', backgroundColor: GREEN + '10' }]}>
              <MaterialIcons name="monitor-heart" size={20} color={GREEN} />
              <Animated.View style={{ position: 'absolute', bottom: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: cc, opacity: pulseA }} />
            </View>
            <Text style={ih.brand}>PC <Text style={{ color: GREEN }}>INTEL</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 2 }}>
            <View style={[ih.pill, { borderColor: cc + '65', backgroundColor: cc + '0D' }]}>
              <Dot color={cc} size={5} />
              <Text style={[ih.pillTxt, { color: cc }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
            </View>
            <View style={[ih.pill, { borderColor: BORDER }]}>
              <MaterialCommunityIcons name="shield-check" size={10} color={MID} />
              <Text style={[ih.pillTxt, { color: MID }]}>AES-256 · LOCAL</Text>
            </View>
          </View>
        </View>

        {/* Right: clock */}
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={ih.clockMain}>{time}</Text>
            <Text style={[ih.clockSecs, { color: GREEN }]}>{secs}</Text>
          </View>
          <Text style={ih.clockSub}>LOCAL · SECURE</Text>
          <Text style={ih.dateTxt}>{dateStr}</Text>
        </View>
      </View>

      {/* Circuit trace bottom */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        <View style={{ flex: 3, backgroundColor: GREEN + '18' }} />
        <View style={{ width: 12, backgroundColor: GREEN }} />
        <View style={{ flex: 2, backgroundColor: CYAN + '14' }} />
        <View style={{ width: 6, backgroundColor: CYAN }} />
        <View style={{ flex: 5, backgroundColor: GREEN + '08' }} />
        <View style={{ width: 10, backgroundColor: AMBER }} />
        <View style={{ flex: 3, backgroundColor: AMBER + '12' }} />
      </View>
    </View>
  );
}
const ih = StyleSheet.create({
  root:      { backgroundColor: SURFACE, overflow: 'hidden' },
  topStripe: { height: 2.5, backgroundColor: GREEN },
  shimmer:   { position: 'absolute', top: 0, bottom: 0, width: 90, backgroundColor: 'rgba(0,200,150,0.04)', zIndex: 0 },
  body:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13, zIndex: 1 },
  eyebrow:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', color: GREEN + '55', letterSpacing: 1.5 },
  logoBox:   { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  brand:     { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillTxt:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  clockMain: { fontFamily: MONO, fontSize: 30, fontWeight: '900', color: TEXT, letterSpacing: 1 },
  clockSecs: { fontFamily: MONO, fontSize: 19, fontWeight: '900', letterSpacing: 1 },
  clockSub:  { fontFamily: MONO, fontSize: 8.5, color: MID, letterSpacing: 1, fontWeight: '700' },
  dateTxt:   { fontFamily: MONO, fontSize: 8, color: DIM, letterSpacing: 0.5 },
});

// ─── LIVE GAUGES SECTION ──────────────────────────────────────────
function LiveGauges({ isConn, cpu, ram, disk, cpuH, ramH, diskH }: {
  isConn: boolean; cpu: number; ram: number; disk: number;
  cpuH: number[]; ramH: number[]; diskH: number[];
}) {
  const cpuColor  = cpu  > 80 ? RED : cpu  > 60 ? AMBER : CYAN;
  const ramColor  = ram  > 85 ? RED : ram  > 70 ? AMBER : GREEN;
  const diskColor = disk > 90 ? RED : disk > 75 ? AMBER : PURPLE;

  return (
    <Card accentColor={GREEN}>
      <SectionHdr icon="gauge" lib="c" label="LIVE GAUGES" color={GREEN}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
            borderColor: (isConn ? GREEN : AMBER) + '55', backgroundColor: (isConn ? GREEN : AMBER) + '0A' }}>
            <Dot color={isConn ? GREEN : AMBER} size={5} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: isConn ? GREEN : AMBER }}>{isConn ? 'LIVE' : 'STANDBY'}</Text>
          </View>
        }
      />
      {/* HUD corners overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: 8,  left: 8,  width: 12, height: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: GREEN + '45' }} />
        <View style={{ position: 'absolute', top: 8,  right: 8, width: 12, height: 12, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: GREEN + '45' }} />
        <View style={{ position: 'absolute', bottom: 8, left: 8,  width: 12, height: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: GREEN + '45' }} />
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: GREEN + '45' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, gap: 4 }}>
        <ArcGauge value={cpu}  color={cpuColor}  label="CPU"  isConn={isConn} />
        <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: BORDER, marginHorizontal: 4 }} />
        <ArcGauge value={ram}  color={ramColor}  label="RAM"  isConn={isConn} />
        <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: BORDER, marginHorizontal: 4 }} />
        <ArcGauge value={disk} color={diskColor} label="DISK" isConn={isConn} />
      </View>

      {/* Sparklines */}
      {isConn ? (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 10, gap: 0 }}>
          <View style={{ flex: 1, paddingHorizontal: 4 }}>
            <Sparkline data={cpuH}  color={cpuColor}  height={20} />
          </View>
          <View style={{ width: 1, backgroundColor: BORDER }} />
          <View style={{ flex: 1, paddingHorizontal: 4 }}>
            <Sparkline data={ramH}  color={ramColor}  height={20} />
          </View>
          <View style={{ width: 1, backgroundColor: BORDER }} />
          <View style={{ flex: 1, paddingHorizontal: 4 }}>
            <Sparkline data={diskH} color={diskColor} height={20} />
          </View>
        </View>
      ) : <View style={{ height: 16 }} />}
    </Card>
  );
}

// ─── SYSTEM METRICS SECTION ───────────────────────────────────────
function SystemMetrics({ isConn, cpu, ram, disk, latency }: {
  isConn: boolean; cpu: number; ram: number; disk: number; latency: number;
}) {
  const bars = [
    { label: 'CPU',    val: cpu,  color: cpu  > 80 ? RED : CYAN,   trend: cpu  > 70 },
    { label: 'MEMORY', val: ram,  color: ram  > 85 ? RED : GREEN,  trend: ram  > 75 },
    { label: 'DISK',   val: disk, color: disk > 90 ? RED : PURPLE, trend: false },
  ];

  return (
    <Card accentColor={CYAN}>
      <SectionHdr icon="chart-line" lib="c" label="SYSTEM METRICS" color={CYAN}
        right={<StatusBadge text={isConn ? 'LIVE' : 'IDLE'} color={isConn ? GREEN : AMBER} />}
      />
      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 16 }}>
        {bars.map(b => (
          <View key={b.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isConn ? b.color : DIM }} />
                <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '700', color: MID, letterSpacing: 0.5 }}>{b.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {isConn && b.trend && <MaterialIcons name="trending-up" size={11} color={RED + 'AA'} />}
                <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: b.color }}>{isConn ? `${Math.round(b.val)}%` : '—'}</Text>
              </View>
            </View>
            <SegBar value={isConn ? b.val : 0} color={b.color} height={5} />
          </View>
        ))}
      </View>

      {/* Stat quad */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
        {[
          { icon: 'thermometer', lib: 'c', val: isConn ? '—' : '—',            label: 'TEMP',  color: CYAN   },
          { icon: 'lightning-bolt', lib: 'c', val: isConn ? 'UP' : '—',        label: 'UP',    color: GREEN  },
          { icon: 'lan-connect',  lib: 'c', val: isConn ? 'OK' : 'OFF',        label: 'STATE', color: isConn ? GREEN : MID },
          { icon: 'speedometer',  lib: 'c', val: isConn && latency > 0 ? `${latency}` : '—', label: 'MS', color: AMBER  },
        ].map((s, i) => {
          const Icon = MaterialCommunityIcons;
          return (
            <View key={i} style={[smq.cell, { borderTopColor: s.color, borderColor: s.color + '28' }]}>
              <HUDCorners color={s.color + '50'} size={7} />
              <Icon name={s.icon as any} size={16} color={s.color + '80'} />
              <Text style={[smq.val, { color: s.color }]} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>{s.val}</Text>
              <Text style={smq.label}>{s.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
const smq = StyleSheet.create({
  cell:  { flex: 1, backgroundColor: SURFACE2, borderRadius: 11, borderWidth: 1.5, borderTopWidth: 3, padding: 10, alignItems: 'center', gap: 3, position: 'relative', overflow: 'hidden' },
  val:   { fontFamily: MONO, fontSize: 14, fontWeight: '900', lineHeight: 17, textAlign: 'center' },
  label: { fontFamily: MONO, fontSize: 8, color: MID, letterSpacing: 0.8, textAlign: 'center' },
});

// ─── TODAY'S STRIP ────────────────────────────────────────────────
function TodayStrip({ isConn, kbCount, scripts, latency, scanMb }: {
  isConn: boolean; kbCount: number; scripts: number; latency: number; scanMb: number;
}) {
  const stats = [
    { label: 'KB FACTS', value: String(kbCount),                              color: CYAN,   icon: 'brain'       },
    { label: 'SCRIPTS',  value: scripts > 0 ? String(scripts) : '—',         color: PURPLE, icon: 'code-braces' },
    { label: 'LATENCY',  value: latency > 0 ? `${latency}ms` : '—',          color: AMBER,  icon: 'speedometer' },
    { label: 'FREED MB', value: scanMb > 0 ? `${scanMb}` : '—',             color: GREEN,  icon: 'delete-sweep'},
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {stats.map((s, i) => {
        const Icon = MaterialCommunityIcons;
        return (
          <View key={i} style={[ts.cell, { borderTopColor: s.color, borderColor: s.color + '25', borderTopWidth: 2.5 }]}>
            <Icon name={s.icon as any} size={14} color={s.color + '70'} />
            <Text style={[ts.val, { color: s.color }]}>{s.value}</Text>
            <Text style={ts.label}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const ts = StyleSheet.create({
  cell:  { flex: 1, alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, paddingVertical: 12, gap: 4,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 }, android: { elevation: 2 } }) },
  val:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 16 },
  label: { fontFamily: MONO, fontSize: 7.5, color: MID, letterSpacing: 0.5 },
});

// ─── QUICK ACTIONS GRID ───────────────────────────────────────────
const ACTIONS = [
  { id: 'full_clean',    icon: 'broom',             lib: 'c', label: 'FULL CLEAN',  color: GREEN  },
  { id: 'organize',      icon: 'folder-cog',        lib: 'c', label: 'ORGANIZE',    color: AMBER  },
  { id: 'disk_report',   icon: 'chart-donut',       lib: 'c', label: 'DISK REPORT', color: BLUE   },
  { id: 'empty_recycle', icon: 'delete-sweep',      lib: 'c', label: 'RECYCLE BIN', color: RED    },
  { id: 'memory_clean',  icon: 'memory',            lib: 'm', label: 'FREE RAM',    color: PURPLE },
  { id: 'privacy_clean', icon: 'shield-remove',     lib: 'c', label: 'PRIVACY',     color: TEAL   },
];

function QuickActions({ isConn, actionId, onRun }: {
  isConn: boolean; actionId: string | null; onRun: (id: string, label: string) => void;
}) {
  const scaleAs = useRef(ACTIONS.map(() => new Animated.Value(1))).current;
  const pressIn  = (i: number) => Animated.spring(scaleAs[i], { toValue: 0.88, tension: 400, friction: 12, useNativeDriver: true }).start();
  const pressOut = (i: number) => Animated.spring(scaleAs[i], { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <Card accentColor={AMBER}>
      <SectionHdr icon="flash-on" lib="m" label="QUICK ACTIONS" color={AMBER}
        right={!isConn ? <StatusBadge text="PAIR PC" color={RED} /> : <StatusBadge text="READY" color={GREEN} />}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
        {ACTIONS.map((a, i) => {
          const Icon = a.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          const isRun = actionId === a.id;
          return (
            <Pressable key={a.id}
              onPress={() => { haptics.medium(); onRun(a.id, a.label); }}
              onPressIn={() => pressIn(i)}
              onPressOut={() => pressOut(i)}
              disabled={!isConn || !!actionId}
              style={{ width: `${(100 - 16) / 3}%` as any }}>
              <Animated.View style={[qa.cell, {
                borderColor: a.color + '35', borderTopColor: a.color, borderTopWidth: 3,
                backgroundColor: SURFACE2, opacity: !isConn ? 0.4 : 1,
                transform: [{ scale: scaleAs[i] }],
              }]}>
                <HUDCorners color={a.color + '55'} size={6} />
                {isRun
                  ? <ActivityIndicator size="small" color={a.color} />
                  : <View style={[qa.iconBubble, { borderColor: a.color + '50', backgroundColor: a.color + '12' }]}>
                      <Icon name={a.icon as any} size={20} color={a.color} />
                    </View>
                }
                <Text style={[qa.label, { color: isRun ? a.color : TEXT2 }]}>{a.label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
const qa = StyleSheet.create({
  cell:       { alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 13, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  iconBubble: { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:      { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 },
});

// ─── QUICK SCRIPTS GRID ───────────────────────────────────────────
const QUICK_SCRIPTS = [
  { id: 'qs-clean',   label: 'CLEAN TMP',  icon: 'broom',        lib: 'c', color: GREEN,
    script: `import os,shutil,tempfile\nr=0;f=0\nfor p in [tempfile.gettempdir()]:\n    for i in os.listdir(p):\n        fp=os.path.join(p,i)\n        try:\n            s=os.path.getsize(fp) if os.path.isfile(fp) else 0\n            (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n            r+=1;f+=s\n        except:pass\nprint(f"Cleared {r} items, freed {f//1024//1024}MB")` },
  { id: 'qs-disk',    label: 'DISK INFO',  icon: 'harddisk',     lib: 'c', color: BLUE,
    script: `import psutil\nfor p in psutil.disk_partitions():\n    try:\n        u=psutil.disk_usage(p.mountpoint)\n        print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n    except:pass` },
  { id: 'qs-procs',   label: 'TOP PROCS',  icon: 'memory',       lib: 'm', color: PURPLE,
    script: `import psutil\nps=sorted(psutil.process_iter(['pid','name','cpu_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)\nprint("PID    CPU%   NAME")\nfor p in ps[:8]:\n    i=p.info\n    print(f"{i['pid']:<7}{i['cpu_percent']:<7.1f}{i['name'][:28]}")` },
  { id: 'qs-net',     label: 'NET TEST',   icon: 'wifi',         lib: 'm', color: AMBER,
    script: `import socket,time\nfor h,po in [('google.com',80),('8.8.8.8',53),('cloudflare.com',443)]:\n    try:\n        s=socket.socket();s.settimeout(3)\n        t=time.perf_counter();s.connect((h,po));ms=(time.perf_counter()-t)*1000;s.close()\n        print(f"OK  {h}:{po}  {ms:.0f}ms")\n    except Exception as e:\n        print(f"FAIL {h}:{po}  {e}")` },
  { id: 'qs-ram',     label: 'FREE RAM',   icon: 'cpu-64-bit',   lib: 'c', color: TEAL,
    script: `import psutil,gc\nvm=psutil.virtual_memory()\nprint(f"Before: {vm.percent}% used")\ncc=gc.collect()\nprint(f"GC: {cc} objs")\nvm2=psutil.virtual_memory()\nprint(f"After: {vm2.percent}% | Freed: {(vm.used-vm2.used)//1024//1024}MB")` },
  { id: 'qs-ip',      label: 'IP + NET',   icon: 'lan',          lib: 'c', color: PINK,
    script: `import socket,psutil\nprint(f"Host: {socket.gethostname()}")\ntry:\n    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.connect(("8.8.8.8",80));print(f"LAN IP: {s.getsockname()[0]}");s.close()\nexcept:pass\nnet=psutil.net_io_counters()\nprint(f"Sent: {net.bytes_sent/1024/1024:.1f}MB  Recv: {net.bytes_recv/1024/1024:.1f}MB")` },
  { id: 'qs-ports',   label: 'PORTS',      icon: 'radar',        lib: 'c', color: RED,
    script: `import socket\nfrom concurrent.futures import ThreadPoolExecutor\nH="127.0.0.1";PORTS=list(range(1,1025))\ndef scan(p):\n    s=socket.socket();s.settimeout(0.3);r=s.connect_ex((H,p));s.close()\n    return p if r==0 else None\nwith ThreadPoolExecutor(max_workers=150) as ex:\n    open_p=[p for p in ex.map(scan,PORTS) if p]\nprint(f"Open ({len(open_p)}): {sorted(open_p)}")` },
  { id: 'qs-startup', label: 'STARTUP',    icon: 'rocket-launch',lib: 'c', color: AMBER,
    script: `import sys\nif sys.platform=='win32':\n    import winreg;KEY=r"SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run"\n    with winreg.OpenKey(winreg.HKEY_CURRENT_USER,KEY) as k:\n        i=0\n        while True:\n            try:n,v,_=winreg.EnumValue(k,i);print(f"  {n}: {v[:55]}");i+=1\n            except OSError:break\nelse:\n    import subprocess;r=subprocess.run(["systemctl","list-unit-files","--state=enabled","--no-pager"],capture_output=True,text=True);print(r.stdout[:800])` },
  { id: 'qs-recycle', label: 'EMPTY BIN',  icon: 'delete-sweep', lib: 'c', color: CYAN,
    script: `import subprocess,sys\nif sys.platform=='win32':\n    subprocess.run(['powershell','-Command','Clear-RecycleBin -Force -ErrorAction SilentlyContinue'],capture_output=True)\n    print("Recycle bin emptied")\nelse:\n    import shutil,os;t=os.path.expanduser('~/.local/share/Trash/files')\n    shutil.rmtree(t,ignore_errors=True);os.makedirs(t,exist_ok=True)\n    print("Trash emptied")` },
];

function QuickScripts({ isConn, qsRunning, qsResult, onRun, onClearResult }: {
  isConn: boolean; qsRunning: string | null; qsResult: { label: string; output: string; color: string } | null;
  onRun: (item: typeof QUICK_SCRIPTS[0]) => void; onClearResult: () => void;
}) {
  return (
    <Card accentColor={PURPLE}>
      <SectionHdr icon="code" lib="m" label="QUICK PC SCRIPTS" color={PURPLE}
        right={<StatusBadge text={isConn ? 'READY' : 'OFFLINE'} color={isConn ? GREEN : RED} />}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: qsResult ? 0 : 14, gap: 8 }}>
        {QUICK_SCRIPTS.map(item => {
          const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          const isRun = qsRunning === item.id;
          return (
            <TouchableOpacity key={item.id}
              onPress={() => { haptics.medium(); onRun(item); }}
              disabled={!isConn || !!qsRunning}
              activeOpacity={0.78}
              style={{ width: `${(100 - 16) / 3}%` as any }}>
              <View style={[qs.cell, {
                borderTopColor: item.color, borderColor: item.color + '30',
                opacity: !isConn ? 0.35 : 1,
              }]}>
                <View style={{ position: 'absolute', bottom: 4, left: 5, width: 5, height: 5, borderRadius: 2.5, backgroundColor: item.color, opacity: 0.7 }} />
                {isRun
                  ? <ActivityIndicator size="small" color={item.color} />
                  : <Icon name={item.icon as any} size={22} color={item.color} />
                }
                <Text style={[qs.label, { color: isRun ? item.color : TEXT2 }]}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {qsResult && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6 }}>
          <View style={{ borderWidth: 1.5, borderRadius: 12, padding: 12, borderColor: qsResult.color + '50', backgroundColor: qsResult.color + '08' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MaterialIcons name="terminal" size={12} color={qsResult.color} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: qsResult.color, flex: 1, letterSpacing: 1 }}>
                {qsResult.label} OUTPUT
              </Text>
              <TouchableOpacity onPress={onClearResult} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={13} color={MID} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: qsResult.color + 'CC', lineHeight: 17 }} selectable>
              {qsResult.output}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}
const qs = StyleSheet.create({
  cell:  { alignItems: 'center', paddingVertical: 14, gap: 7, backgroundColor: SURFACE2, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, position: 'relative', overflow: 'hidden' },
  label: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 },
});

// ─── SCAN RESULTS ─────────────────────────────────────────────────
function ScanResults({ isConn, scanData, scanning, onScan }: {
  isConn: boolean; scanData: any; scanning: boolean; onScan: () => void;
}) {
  const bars = [
    { label: 'TEMP FILES', val: isConn ? Math.min(99, Math.round(scanData.tempFiles.sizeMb / 100)) : 0, color: RED    },
    { label: 'BROWSER',    val: isConn ? Math.min(99, Math.round(scanData.browserCache.sizeMb / 100)) : 0, color: AMBER  },
    { label: 'LARGE FILES',val: isConn ? Math.min(99, scanData.largeFiles.count) : 0,                   color: PURPLE },
    { label: 'DISK FULL',  val: isConn ? Math.round(scanData.diskPct ?? 0) : 0,                         color: BLUE   },
  ];

  return (
    <Card accentColor={TEAL}>
      <SectionHdr icon="search" lib="m" label="SCAN RESULTS" color={TEAL}
        right={
          <TouchableOpacity onPress={onScan} disabled={scanning || !isConn} activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
              borderColor: TEAL + '55', backgroundColor: TEAL + '0E', opacity: !isConn ? 0.4 : 1 }}>
            {scanning
              ? <ActivityIndicator size="small" color={TEAL} />
              : <MaterialIcons name="radar" size={12} color={TEAL} />}
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: TEAL }}>{scanning ? 'SCANNING' : 'SCAN NOW'}</Text>
          </TouchableOpacity>
        }
      />
      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 16 }}>
        {bars.map(b => (
          <View key={b.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '700', color: MID }}>{b.label}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: b.color }}>{b.val > 0 ? `${b.val}%` : '—'}</Text>
            </View>
            <SegBar value={b.val} color={b.color} height={4} />
          </View>
        ))}
        {isConn && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="cleaning-services" size={14} color={GREEN} />
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '700', color: GREEN }}>
                {scanData.totalRecoverable > 0 ? `${(scanData.totalRecoverable / 1024).toFixed(1)}GB recoverable` : 'Run scan to analyze'}
              </Text>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: DIM }}>{scanData.lifetimeCleaned > 0 ? `${scanData.lifetimeCleaned} cleaned` : ''}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

// ─── AUTOMATION SECTION ───────────────────────────────────────────
const AUTO_ITEMS = [
  { icon: 'schedule',        col: TEAL,   label: 'Auto-clean temp files',   sub: 'Daily 9AM · temp+cache',       id: 'full_clean'    },
  { icon: 'folder-special',  col: AMBER,  label: 'Auto-organize Downloads', sub: 'Weekly · by file type',        id: 'organize'      },
  { icon: 'security',        col: PURPLE, label: 'Privacy wipe on idle',    sub: '30min idle · clipboard+docs',  id: 'privacy_clean' },
  { icon: 'bar-chart',       col: BLUE,   label: 'Monday disk report',      sub: 'Weekly · full breakdown',      id: 'disk_report'   },
];

function SmartAutomation({ isConn, onRun }: { isConn: boolean; onRun: (id: string, label: string) => void }) {
  return (
    <Card accentColor={CYAN}>
      <SectionHdr icon="smart-toy" lib="m" label="SMART AUTOMATION" color={CYAN} />
      <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}>
        {AUTO_ITEMS.map((item, i) => (
          <TouchableOpacity key={i}
            onPress={() => { haptics.medium(); onRun(item.id, item.label); }}
            activeOpacity={0.85}
            style={[sa.row, { borderColor: item.col + '30', backgroundColor: item.col + '07' }]}>
            <View style={[sa.iconBox, { borderColor: item.col + '45', backgroundColor: item.col + '12' }]}>
              <MaterialIcons name={item.icon as any} size={16} color={item.col} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sa.label, { color: isConn ? item.col : MID }]}>{item.label}</Text>
              <Text style={sa.sub}>{item.sub}</Text>
            </View>
            <View style={[sa.runBadge, {
              borderColor: (isConn ? GREEN : MID) + '40',
              backgroundColor: (isConn ? GREEN : MID) + '0A',
            }]}>
              <Dot color={isConn ? GREEN : MID} size={4} />
              <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: isConn ? GREEN : MID }}>
                {isConn ? 'RUN' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}
const sa = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:   { fontFamily: MONO, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  sub:     { fontFamily: MONO, fontSize: 8.5, color: DIM },
  runBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
});

// ─── UNDO JOURNAL ─────────────────────────────────────────────────
function UndoJournal({ isConn, undoList, rollingId, onRollback }: {
  isConn: boolean; undoList: any[]; rollingId: number | null; onRollback: (id: number) => void;
}) {
  return (
    <Card accentColor={AMBER}>
      <SectionHdr icon="undo" lib="m" label="UNDO JOURNAL" color={AMBER}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderColor: AMBER + '40', backgroundColor: AMBER + '08' }}>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: AMBER }}>{undoList.length} ENTRIES</Text>
          </View>
        }
      />
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {undoList.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20, gap: 9 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: isConn ? GREEN + '40' : DIM + '30', backgroundColor: isConn ? GREEN + '0A' : SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={isConn ? 'check-circle-outline' : 'wifi-off'} size={24} color={isConn ? GREEN : DIM} />
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: isConn ? GREEN : DIM, textAlign: 'center' }}>
              {isConn ? 'No pending rollbacks — all clear' : 'Connect PC to view undo journal'}
            </Text>
          </View>
        ) : undoList.map((entry: any) => (
          <View key={entry.id} style={uj.row}>
            <View style={[uj.dot, { backgroundColor: AMBER }]} />
            <View style={{ flex: 1 }}>
              <Text style={uj.title} numberOfLines={1}>{entry.userRequest || 'Script execution'}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: AMBER, marginTop: 2 }}>{entry.remainingMin}</Text>
            </View>
            <TouchableOpacity onPress={() => onRollback(entry.id)} disabled={rollingId === entry.id}
              style={[uj.btn, { borderColor: AMBER + '60', backgroundColor: AMBER + '0A' }]}>
              {rollingId === entry.id
                ? <ActivityIndicator size="small" color={AMBER} />
                : <>
                    <MaterialIcons name="undo" size={13} color={AMBER} />
                    <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER }}>UNDO</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Card>
  );
}
const uj = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: BORDER },
  dot:   { width: 8, height: 36, borderRadius: 2, flexShrink: 0 },
  title: { fontSize: 13, fontWeight: '600', color: TEXT },
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
});

// ─── KEY METRICS STRIP ────────────────────────────────────────────
function KeyMetrics({ kbCount, scriptsRun, scriptsUndone, diskFree, cpu, isConn }: {
  kbCount: number; scriptsRun: number; scriptsUndone: number; diskFree: number; cpu: number; isConn: boolean;
}) {
  const items = [
    { label: 'KB ENTRIES', val: String(kbCount),                                 color: CYAN   },
    { label: 'SCRIPTS',    val: isConn ? String(scriptsRun) : '—',               color: PURPLE },
    { label: 'DISK FREE',  val: isConn ? `${100 - diskFree}%` : '—',             color: GREEN  },
    { label: 'CPU %',      val: isConn ? `${Math.round(cpu)}%` : '—',            color: cpu > 80 ? RED : TEAL  },
    { label: 'UNDONE',     val: isConn ? String(scriptsUndone) : '—',            color: AMBER  },
    { label: 'AES-256',    val: 'ON',                                             color: GREEN  },
  ];

  return (
    <Card accentColor={CYAN}>
      <SectionHdr icon="bar-chart" lib="m" label="KEY METRICS" color={CYAN} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
        {items.map((item, i) => (
          <View key={i} style={[km.cell, { borderTopColor: item.color, borderColor: item.color + '28' }]}>
            <HUDCorners color={item.color + '45'} size={6} />
            <Text style={[km.val, { color: item.color }]} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>{item.val}</Text>
            <Text style={km.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
const km = StyleSheet.create({
  cell:  { width: `${(100 - 16) / 3}%` as any, backgroundColor: SURFACE2, borderRadius: 11, borderWidth: 1.5, borderTopWidth: 3, padding: 10, alignItems: 'center', gap: 3, position: 'relative', overflow: 'hidden' },
  val:   { fontFamily: MONO, fontSize: 18, fontWeight: '900', lineHeight: 22, textAlign: 'center' },
  label: { fontFamily: MONO, fontSize: 8, color: MID, letterSpacing: 0.8, textAlign: 'center' },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────
const PLACEHOLDER_METRICS = { cpu: 0, ram: 0, disk: 0 };
const PLACEHOLDER_SCAN = { tempFiles: { sizeMb: 0 }, browserCache: { sizeMb: 0 }, largeFiles: { count: 0 }, totalRecoverable: 0, lifetimeCleaned: 0, scriptsRun: 0, scriptsUndone: 0, diskPct: 0 };

function PCIntelInner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectionStatus();

  const [metrics,   setMetrics]   = useState(PLACEHOLDER_METRICS);
  const [scanData,  setScanData]  = useState(PLACEHOLDER_SCAN);
  const [undoList,  setUndoList]  = useState<any[]>([]);
  const [kbCount,   setKbCount]   = useState(0);
  const [scanning,  setScanning]  = useState(false);
  const [actionId,  setActionId]  = useState<string | null>(null);
  const [qsRunning, setQsRunning] = useState<string | null>(null);
  const [qsResult,  setQsResult]  = useState<{ label: string; output: string; color: string } | null>(null);
  const [rollingId, setRollingId] = useState<number | null>(null);
  const [latency,   setLatency]   = useState(0);
  const [refreshing,setRefreshing]= useState(false);

  // Sparkline history
  const [cpuH,  setCpuH]  = useState<number[]>([0,0,0,0,0,0,0,0]);
  const [ramH,  setRamH]  = useState<number[]>([0,0,0,0,0,0,0,0]);
  const [diskH, setDiskH] = useState<number[]>([0,0,0,0,0,0,0,0]);

  const fetchAll = useCallback(async () => {
    if (!serverConnection.isConnected()) return;
    try {
      const t0   = Date.now();
      const mRes = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/metrics'), {}).catch(() => null);
      if (mRes?.ok) {
        const d = await mRes.json();
        const c = d.cpu?.percent ?? d.cpu_percent ?? 0;
        const r = d.memory?.percent ?? d.ram_percent ?? 0;
        const dk= d.disk?.percent ?? d.disk_percent ?? 0;
        setLatency(Date.now() - t0);
        setMetrics({ cpu: c, ram: r, disk: dk });
        setCpuH(prev  => [...prev.slice(1),  c]);
        setRamH(prev  => [...prev.slice(1),  r]);
        setDiskH(prev => [...prev.slice(1), dk]);
        performanceHistory?.recordFromMetrics?.(d);
        setScanData(prev => ({ ...prev, diskPct: dk }));
      }
      const uRes = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/undo/list'), {}).catch(() => null);
      if (uRes?.ok) { const d = await uRes.json(); setUndoList(Array.isArray(d.entries) ? d.entries : []); }
    } catch {}
  }, []);

  const fetchKB = useCallback(async () => {
    try { const s = await knowledgeAccumulator.getStats(); setKbCount(s.totalFindings ?? 0); } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    fetchKB();
    if (isConnected) fetchAll();
  }, [isConnected, fetchAll, fetchKB]));

  useEffect(() => {
    if (!isConnected) return;
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [isConnected, fetchAll]);

  const runAction = useCallback(async (id: string, label: string) => {
    if (!isConnected) { Alert.alert('Offline', 'Connect to PC from HOME tab first.'); return; }
    const script = PC_ACTION_SCRIPTS[id];
    if (!script) { Alert.alert(label, `${label} not available on this server version.`); return; }
    haptics.heavy(); setActionId(id);
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 30000);
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/execute'),
        { method: 'POST', body: JSON.stringify({ script }), signal: ctrl.signal });
      const d = await res.json(); haptics.success();
      Alert.alert(label, d.output || d.error || 'Done'); fetchAll();
    } catch (e: any) { haptics.warning(); Alert.alert('Error', e?.message || 'Failed'); }
    finally { setActionId(null); }
  }, [isConnected, fetchAll]);

  const runScan = useCallback(async () => {
    if (!isConnected) { Alert.alert('Offline', 'Connect PC first.'); return; }
    haptics.heavy(); setScanning(true);
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 30000);
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/execute'),
        { method: 'POST', body: JSON.stringify({ script: PC_SCAN_SCRIPT }), signal: ctrl.signal });
      const raw = await res.json();
      const d = raw.output ? JSON.parse(raw.output.trim()) : null;
      if (d) setScanData({
        tempFiles: d.temp_files ?? PLACEHOLDER_SCAN.tempFiles,
        browserCache: d.browser_cache ?? PLACEHOLDER_SCAN.browserCache,
        largeFiles: d.large_files ?? PLACEHOLDER_SCAN.largeFiles,
        totalRecoverable: d.total_recoverable_mb ?? 0,
        lifetimeCleaned: d.stats?.cleaned ?? 0,
        scriptsRun: d.stats?.scripts_run ?? 0,
        scriptsUndone: d.stats?.undone ?? 0,
        diskPct: metrics.disk,
      });
      haptics.success();
      Alert.alert('Scan Complete', `${d?.total_recoverable_mb ?? 0}MB recoverable`);
    } catch (e: any) { Alert.alert('Scan Error', e?.message); }
    finally { setScanning(false); }
  }, [isConnected, metrics.disk]);

  const rollback = useCallback(async (id: number) => {
    if (!isConnected) return;
    setRollingId(id);
    try {
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/undo/rollback'), { method: 'POST', body: JSON.stringify({ id }) });
      const d = await res.json(); haptics.success();
      Alert.alert('Rollback', d.message || 'Restored');
      setUndoList(prev => prev.filter(e => e.id !== id));
    } catch (e: any) { Alert.alert('Error', e?.message); }
    finally { setRollingId(null); }
  }, [isConnected]);

  const runQS = useCallback(async (item: typeof QUICK_SCRIPTS[0]) => {
    if (!isConnected) return;
    setQsRunning(item.id); setQsResult(null);
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 30000);
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/execute'),
        { method: 'POST', body: JSON.stringify({ script: item.script }), signal: ctrl.signal });
      const d = await res.json();
      setQsResult({ label: item.label, output: (d.output || d.error || 'No output').slice(0, 1200), color: item.color });
      haptics.success();
    } catch (e: any) {
      setQsResult({ label: item.label, output: 'Error: ' + (e?.message || 'Timeout'), color: RED });
      haptics.warning();
    } finally { setQsRunning(null); }
  }, [isConnected]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); haptics.medium();
    await Promise.all([fetchAll(), fetchKB()]);
    haptics.success(); setRefreshing(false);
  }, [fetchAll, fetchKB]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <TabSwipeOverlay leftRoute="/(tabs)/knowledge" rightRoute="/(tabs)/builder" />
      <IntelHeader safeTop={insets.top} isConn={isConnected} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 280 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={GREEN} colors={[GREEN, CYAN, AMBER]}
            progressBackgroundColor={SURFACE} />
        }
      >
        {/* Performance Strip — compact always-visible bar */}
        <PerformanceStrip isConnected={isConnected} />

        {/* Today's stat strip */}
        <TodayStrip
          isConn={isConnected} kbCount={kbCount} scripts={scanData.scriptsRun}
          latency={latency} scanMb={scanData.lifetimeCleaned}
        />

        {/* Live gauges */}
        <LiveGauges
          isConn={isConnected} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk}
          cpuH={cpuH} ramH={ramH} diskH={diskH}
        />

        {/* System metrics */}
        <SystemMetrics isConn={isConnected} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} latency={latency} />

        {/* Key metrics grid */}
        <KeyMetrics
          isConn={isConnected} kbCount={kbCount} cpu={metrics.cpu}
          scriptsRun={scanData.scriptsRun} scriptsUndone={scanData.scriptsUndone}
          diskFree={metrics.disk}
        />

        {/* Quick actions */}
        <QuickActions isConn={isConnected} actionId={actionId} onRun={runAction} />

        {/* Scan results */}
        <ScanResults isConn={isConnected} scanData={scanData} scanning={scanning} onScan={runScan} />

        {/* Quick scripts */}
        <QuickScripts
          isConn={isConnected} qsRunning={qsRunning} qsResult={qsResult}
          onRun={runQS} onClearResult={() => setQsResult(null)}
        />

        {/* Smart automation */}
        <SmartAutomation isConn={isConnected} onRun={runAction} />

        {/* Undo journal */}
        <UndoJournal isConn={isConnected} undoList={undoList} rollingId={rollingId} onRollback={rollback} />

        {/* Performance Monitor Widget — detailed graphs */}
        <PerformanceMonitorWidget isConnected={isConnected} cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} />
      </ScrollView>
    </View>
  );
}

export default function PCIntelScreen() {
  return (
    <TabErrorBoundary name="PC Intel">
      <PCIntelInner />
    </TabErrorBoundary>
  );
}
