/**
 * SparklineWidget — Pure React Native animated sparkline charts
 * Shows rolling CPU / RAM / Disk history from performanceHistory service.
 *
 * Uses only RN View + Animated — NO external charting library.
 * Two display modes:
 *   bars    — vertical bar chart (default, compact)
 *   dots    — connected dots line chart
 *
 * Replaces the static TelemetryRow when history data is available.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Platform, Dimensions, ScrollView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { performanceHistory, PerfReading } from '@/services/performanceHistory';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SW } = Dimensions.get('window');

const C = {
  bg:     '#010608',
  surf:   '#060E1A',
  surf2:  '#08121E',
  cyan:   '#00E5FF',
  green:  '#00FF88',
  amber:  '#FFB020',
  red:    '#FF3344',
  purple: '#CC44FF',
  mid:    '#5A7A96',
  dim:    '#1A2E44',
  text:   '#C8E4F0',
};

type ChartField = 'cpu' | 'ram' | 'disk';
type DisplayMode = 'bars' | 'dots';

interface ChartConfig {
  field:   ChartField;
  label:   string;
  color:   string;
  icon:    string;
  iconLib: 'material' | 'community';
}

const CHARTS: ChartConfig[] = [
  { field: 'cpu',  label: 'CPU',  color: C.cyan,   icon: 'memory',   iconLib: 'material'  },
  { field: 'ram',  label: 'RAM',  color: C.green,  icon: 'chip',     iconLib: 'community' },
  { field: 'disk', label: 'DISK', color: C.amber,  icon: 'harddisk', iconLib: 'community' },
];

// ── Animated bar column ────────────────────────────────────────────
function Bar({ value, maxH, color, isLast }: {
  value: number; maxH: number; color: string; isLast: boolean;
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: Math.max(2, (value / 100) * maxH),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: maxH }}>
      <Animated.View style={{
        width: isLast ? 4 : 3, borderRadius: 2,
        backgroundColor: isLast ? color : color + '50',
        height: a,
        ...Platform.select({ ios: isLast ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 } : {}, android: {} }),
      }} />
    </View>
  );
}

// ── Single sparkline chart panel ────────────────────────────────────
function SparkChart({ config, history, mode }: {
  config: ChartConfig;
  history: PerfReading[];
  mode: DisplayMode;
}) {
  const glowA = useRef(new Animated.Value(0.4)).current;
  const readings = useMemo(() => {
    const points = history.map(r => r[config.field]);
    // Pad to 30 bars
    while (points.length < 30) points.unshift(0);
    return points.slice(-30);
  }, [history, config.field]);

  const current = readings[readings.length - 1] ?? 0;
  const avg = useMemo(() => {
    const nonZero = readings.filter(v => v > 0);
    return nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;
  }, [readings]);
  const peak = useMemo(() => Math.max(...readings, 0), [readings]);
  const trend = useMemo(() => {
    if (readings.length < 6) return 0;
    const half = Math.floor(readings.length / 2);
    const first = readings.slice(0, half).filter(v => v > 0);
    const last  = readings.slice(half).filter(v => v > 0);
    if (!first.length || !last.length) return 0;
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast  = last.reduce((a, b) => a + b, 0) / last.length;
    return Math.round(avgLast - avgFirst);
  }, [readings]);

  const col = current > 85 ? C.red : current > 65 ? C.amber : config.color;
  const CHART_H = 52;

  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1, duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.3, duration: 1400, useNativeDriver: false }),
    ]));
    l.start(); return () => l.stop();
  }, []);

  const Icon = config.iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;

  return (
    <View style={[spc.card, { borderTopColor: col }]}>
      {/* Header */}
      <View style={spc.hdr}>
        <Icon name={config.icon as any} size={10} color={col} />
        <Text style={[spc.lbl, { color: col + '90' }]}>{config.label}</Text>
        <View style={{ flex: 1 }} />
        {trend !== 0 && (
          <View style={[spc.trendBadge, { borderColor: (trend > 0 ? C.red : C.green) + '40' }]}>
            <MaterialIcons name={trend > 0 ? 'trending-up' : 'trending-down'} size={8} color={trend > 0 ? C.red : C.green} />
            <Text style={{ fontFamily: MONO, fontSize: 7, color: trend > 0 ? C.red : C.green }}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>

      {/* Big value */}
      <Animated.View style={{ opacity: glowA }}>
        <Text style={[spc.bigVal, { color: col }]} numberOfLines={1}>{current}%</Text>
      </Animated.View>

      {/* Bar chart */}
      {mode === 'bars' ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 1.5 }}>
          {readings.map((v, i) => (
            <Bar
              key={i}
              value={v}
              maxH={CHART_H}
              color={col}
              isLast={i === readings.length - 1}
            />
          ))}
        </View>
      ) : (
        // Dot/line chart using overlapping Views
        <View style={{ height: CHART_H, position: 'relative' }}>
          {readings.map((v, i) => {
            if (i === 0) return null;
            const prev = readings[i - 1];
            const x = (i / (readings.length - 1)) * 100;
            const y = (1 - v / 100) * (CHART_H - 8);
            return (
              <View key={i} pointerEvents="none" style={{
                position: 'absolute',
                left: `${x}%`,
                top: y,
                width: i === readings.length - 1 ? 5 : 3,
                height: i === readings.length - 1 ? 5 : 3,
                borderRadius: 3,
                backgroundColor: i === readings.length - 1 ? col : col + '70',
              }} />
            );
          })}
        </View>
      )}

      {/* Stats row */}
      <View style={spc.statsRow}>
        <View style={spc.statCell}>
          <Text style={spc.statN}>{avg}</Text>
          <Text style={spc.statL}>AVG</Text>
        </View>
        <View style={spc.statCell}>
          <Text style={[spc.statN, peak > 90 && { color: C.red }]}>{peak}</Text>
          <Text style={spc.statL}>PEAK</Text>
        </View>
        <View style={spc.statCell}>
          <Text style={[spc.statN, { color: current > 80 ? C.red : current > 60 ? C.amber : C.green }]}>
            {current > 80 ? 'WARN' : current > 60 ? 'MED' : 'OK'}
          </Text>
          <Text style={spc.statL}>STATE</Text>
        </View>
      </View>
    </View>
  );
}

const spc = StyleSheet.create({
  card:      { flex: 1, backgroundColor: C.surf2, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, borderColor: C.dim, padding: 10, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8 }, android: { elevation: 4 } }) },
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  lbl:       { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  bigVal:    { fontFamily: MONO, fontSize: 24, fontWeight: '900', lineHeight: 28, letterSpacing: -1, marginBottom: 6 },
  trendBadge:{ flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  statsRow:  { flexDirection: 'row', gap: 4, marginTop: 6 },
  statCell:  { flex: 1, alignItems: 'center' },
  statN:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.text },
  statL:     { fontFamily: MONO, fontSize: 6.5, color: C.mid, letterSpacing: 0.5 },
});

// ── Main exported component ─────────────────────────────────────────
export function SparklineWidget({ isConnected }: { isConnected: boolean }) {
  const [history, setHistory] = useState<PerfReading[]>([]);
  const [mode,    setMode]    = useState<DisplayMode>('bars');
  const [loaded,  setLoaded]  = useState(false);
  const glowA = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    performanceHistory.load().then(() => setLoaded(true));
    const unsub = performanceHistory.subscribe(h => setHistory(h));
    performanceHistory.startAutoSampling();
    return () => { unsub(); performanceHistory.stopAutoSampling(); };
  }, []);

  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 2000, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
    ]));
    l.start(); return () => l.stop();
  }, []);

  const noData = history.length === 0;

  return (
    <View style={sp.outer}>
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[C.cyan, C.green, C.amber].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      <View style={sp.headerRow}>
        <MaterialIcons name="show-chart" size={11} color={C.cyan} />
        <Text style={sp.headerTxt}>LIVE PERFORMANCE GRAPH</Text>
        <Text style={sp.historyCount}>{history.length} pts</Text>
        <View style={{ flex: 1 }} />
        {/* Mode toggle */}
        <TouchableOpacity onPress={() => { haptics.light(); setMode(m => m === 'bars' ? 'dots' : 'bars'); }}
          style={sp.modeBtn}>
          <MaterialIcons name={mode === 'bars' ? 'bar-chart' : 'scatter-plot'} size={12} color={C.cyan} />
        </TouchableOpacity>
        {/* Status */}
        <View style={[sp.statusPill, { borderColor: (isConnected ? C.green : C.red) + '45' }]}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isConnected ? C.green : C.red }} />
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: isConnected ? C.green : C.red, fontWeight: '900' }}>
            {isConnected ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      {noData && !isConnected ? (
        <View style={sp.empty}>
          <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={32} color={C.dim} />
          <Text style={sp.emptyTxt}>Connect to PC to start recording performance history</Text>
          <Text style={[sp.emptyTxt, { color: C.dim + '80', fontSize: 8, marginTop: 2 }]}>
            Samples every 60s · 60 points stored · persists across restarts
          </Text>
        </View>
      ) : (
        <>
          <View style={sp.charts}>
            {CHARTS.map(cfg => (
              <SparkChart key={cfg.field} config={cfg} history={history} mode={mode} />
            ))}
          </View>

          {/* Mini timeline ruler */}
          <View style={sp.ruler}>
            <Text style={sp.rulerTxt}>
              {history.length > 0
                ? `${Math.round((Date.now() - history[0].ts) / 60000)}m ago`
                : '—'}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.cyan + '15', alignSelf: 'center' }} />
            <Text style={sp.rulerTxt}>NOW</Text>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={sp.footer}>
        <Text style={sp.footerTxt}>
          ROLLING 30-SAMPLE WINDOW · 1 SAMPLE/MIN · {history.length > 0 ? `PEAK CPU ${performanceHistory.getPeak('cpu')}% · PEAK RAM ${performanceHistory.getPeak('ram')}%` : 'NO DATA YET'}
        </Text>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  outer:      { backgroundColor: C.surf, borderRadius: 14, borderWidth: 1, borderColor: C.cyan + '22', overflow: 'hidden', marginBottom: 14,
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 6 } }) },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  headerTxt:  { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.cyan, letterSpacing: 1 },
  historyCount:{ fontFamily: MONO, fontSize: 8, color: C.mid },
  modeBtn:    { width: 28, height: 28, borderRadius: 7, borderWidth: 1, borderColor: C.cyan + '35', backgroundColor: C.cyan + '08', alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  charts:     { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  ruler:      { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingBottom: 8 },
  rulerTxt:   { fontFamily: MONO, fontSize: 7.5, color: C.mid },
  empty:      { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 8 },
  emptyTxt:   { fontFamily: MONO, fontSize: 9.5, color: C.mid, textAlign: 'center', lineHeight: 14 },
  footer:     { backgroundColor: '#010407', paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.cyan + '12' },
  footerTxt:  { fontFamily: MONO, fontSize: 7.5, color: C.mid },
});

export default SparklineWidget;
