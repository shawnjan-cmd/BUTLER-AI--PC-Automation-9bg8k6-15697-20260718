/**
 * SystemVitalsGrid — the "NEXUS COMMAND" system-vitals dashboard, ported
 * to Butler AI's Home screen.
 *
 * Drop-in replacement for <PerformanceStrip /> — same props, same data
 * source (performanceHistory), but rendered as four big edge-to-edge
 * cards (2×2) with a real rolling sparkline under every value, instead
 * of a small horizontal chip strip. Matches the NEXUS Command Center
 * reference (v1.0.43782): big value, real delta badge, thin trend line.
 *
 * No fake/incrementing numbers — every value and every delta comes from
 * performanceHistory's real rolling buffer or the live `latency` prop.
 * Pure React Native Views — no external charting library.
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { performanceHistory, PerfReading } from '@/services/performanceHistory';

const MONO: any = FontFamily.mono;

const CYAN   = '#3C83F6';
const GREEN  = '#00CC96';
const AMBER  = '#F5A820';
const RED    = '#FF4060';
const MID    = '#5A7888';
const DIM    = '#2A3A50';
const TEXT   = '#D4EEF8';
const SURF   = '#0A1420';

export interface SystemVitalsGridProps {
  cpu?:     number; // 0–100
  ram?:     number; // 0–100
  disk?:    number; // 0–100
  latency?: number; // ms
  isConn?:  boolean;
}

const BARS = 18; // sparkline resolution — matches card width nicely at 2-up

// ── one thin trend bar ───────────────────────────────────────────────
function TrendBars({ values, max, color, dim }: { values: number[]; max: number; color: string; dim: boolean }) {
  const padded = values.length >= BARS ? values.slice(-BARS) : Array(BARS - values.length).fill(null).concat(values);
  return (
    <View style={s.sparkRow}>
      {padded.map((v, i) => {
        const isLast = i === padded.length - 1 && v !== null;
        const h = v === null ? 2 : Math.max(3, Math.round((v / Math.max(1, max)) * 22));
        return (
          <View
            key={i}
            style={[
              s.sparkBar,
              {
                height: h,
                backgroundColor: v === null ? DIM : color,
                opacity: dim ? 0.25 : (isLast ? 1 : 0.4 + (i / padded.length) * 0.4),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── delta badge (real trend, not decorative) ─────────────────────────
function DeltaBadge({ delta, unit, color }: { delta: number; unit: string; color: string }) {
  if (delta === 0) return null;
  const up = delta > 0;
  return (
    <View style={[s.deltaPill, { borderColor: color + '40', backgroundColor: color + '0E' }]}>
      <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={9} color={color} />
      <Text style={[s.deltaTxt, { color }]}>{up ? '+' : ''}{delta}{unit}</Text>
    </View>
  );
}

interface VitalCardProps {
  icon: string; label: string; sub: string; color: string;
  value: string; delta: number; unit: string;
  series: number[]; seriesMax: number; connected: boolean;
}

function VitalCard({ icon, label, sub, color, value, delta, unit, series, seriesMax, connected }: VitalCardProps) {
  return (
    <View style={[s.card, { borderColor: color + '28', borderTopColor: color }]}>
      <View style={s.cardTop}>
        <View style={[s.iconBox, { backgroundColor: color + '14', borderColor: color + '40' }]}>
          <MaterialCommunityIcons name={icon as any} size={15} color={color} />
        </View>
        <Text style={s.label} numberOfLines={1}>{label}</Text>
        <View style={{ flex: 1 }} />
        <DeltaBadge delta={delta} unit={unit} color={connected ? color : DIM} />
      </View>

      <Text style={[s.value, { color: connected ? TEXT : DIM }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.sub}>{sub}</Text>

      <TrendBars values={series} max={seriesMax} color={color} dim={!connected} />
    </View>
  );
}

export const SystemVitalsGrid = memo(function SystemVitalsGrid({
  cpu = 0, ram = 0, disk = 0, latency = 0, isConn = false,
}: SystemVitalsGridProps) {
  const [history, setHistory] = useState<PerfReading[]>([]);
  const latencyBuf = useRef<number[]>([]);
  const [, forceTick] = useState(0);

  useEffect(() => {
    performanceHistory.load();
    const unsub = performanceHistory.subscribe(h => setHistory(h));
    performanceHistory.startAutoSampling();
    return () => { unsub(); performanceHistory.stopAutoSampling(); };
  }, []);

  // Real rolling latency buffer — genuine observed pings, not synthetic.
  useEffect(() => {
    if (isConn && latency > 0) {
      latencyBuf.current = [...latencyBuf.current, latency].slice(-BARS);
      forceTick(t => t + 1);
    }
  }, [latency, isConn]);

  const cpuSeries  = history.map(h => h.cpu);
  const ramSeries  = history.map(h => h.ram);
  const diskSeries = history.map(h => h.disk);

  const cpuDelta  = history.length >= 2 ? performanceHistory.getTrend('cpu')  : 0;
  const ramDelta  = history.length >= 2 ? performanceHistory.getTrend('ram')  : 0;
  const diskDelta = history.length >= 2 ? performanceHistory.getTrend('disk') : 0;
  const latDelta  = (() => {
    const buf = latencyBuf.current;
    if (buf.length < 4) return 0;
    const half = Math.floor(buf.length / 2);
    const a = buf.slice(0, half).reduce((s, v) => s + v, 0) / half;
    const b = buf.slice(half).reduce((s, v) => s + v, 0) / (buf.length - half);
    return Math.round(b - a);
  })();

  const CARDS: VitalCardProps[] = [
    {
      icon: 'cpu-64-bit', label: 'CPU', sub: 'processor load', color: cpu > 80 ? RED : CYAN,
      value: isConn ? `${Math.round(cpu)}%` : '—', delta: cpuDelta, unit: '%',
      series: cpuSeries, seriesMax: 100, connected: isConn,
    },
    {
      icon: 'memory', label: 'RAM', sub: 'memory used', color: ram > 85 ? RED : GREEN,
      value: isConn ? `${Math.round(ram)}%` : '—', delta: ramDelta, unit: '%',
      series: ramSeries, seriesMax: 100, connected: isConn,
    },
    {
      icon: 'harddisk', label: 'DISK', sub: 'storage used', color: disk > 90 ? RED : AMBER,
      value: isConn ? `${Math.round(disk)}%` : '—', delta: diskDelta, unit: '%',
      series: diskSeries, seriesMax: 100, connected: isConn,
    },
    {
      icon: 'lightning-bolt', label: 'LATENCY', sub: 'lan ping', color: latency > 200 ? AMBER : GREEN,
      value: isConn && latency > 0 ? `${latency}ms` : '—', delta: latDelta, unit: 'ms',
      series: latencyBuf.current, seriesMax: 300, connected: isConn,
    },
  ];

  return (
    <View style={s.grid}>
      {CARDS.map(c => <VitalCard key={c.label} {...c} />)}
    </View>
  );
});

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 14, gap: 8,
  },
  card: {
    width: '48%',
    backgroundColor: SURF,
    borderWidth: 1, borderTopWidth: 2.5, borderRadius: 14,
    paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 7 },
      android: { elevation: 3 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  iconBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:   { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: MID, letterSpacing: 1.2 },
  value:   { fontFamily: MONO, fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 1 },
  sub:     { fontFamily: MONO, fontSize: 9, color: MID, letterSpacing: 0.2, marginBottom: 8 },
  deltaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
  },
  deltaTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '800' },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 22 },
  sparkBar: { flex: 1, borderRadius: 2, minHeight: 2 },
});

export default SystemVitalsGrid;
