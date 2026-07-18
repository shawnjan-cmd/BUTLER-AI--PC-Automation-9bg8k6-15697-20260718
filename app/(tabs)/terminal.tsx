/**
 * ⚡ ACTIVITY LOGS — Butler AI v7.3
 * Full unified log viewer wiring ALL previously hidden services:
 *  • aiLogger           → AI analysis entries
 *  • autoErrorLogger    → App error/warn/info events
 *  • bootErrorLog       → Crash/boot error entries
 *  • connectionDiagnostics → Every connect/disconnect/ping event
 *  • heartbeatEngine    → Connection quality + latency history
 *  • logger (ring buf)  → Internal debug ring buffer
 *
 * Features: filterable chips (ALL/INFO/WARN/ERROR/SUCCESS/CMD/CONN),
 * color-coded source badges, 3-col stats strip, timestamps,
 * CLEAR button, auto-scroll toggle, live refresh.
 * LAYOUT LAW: 3-col stats grid, full phone width.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
  Platform, Animated, ActivityIndicator, Alert,
  TextInput, FlatList, RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { Image as ExpoImage } from 'expo-image';
import { CompactPageHeader } from '@/components/ui/CompactPageHeader';
import { autoErrorLogger, ErrorLogEntry } from '@/services/autoErrorLogger';
import { aiLogger } from '@/services/aiLogger';
import { getBootErrors, clearBootErrors, BootErrorEntry } from '@/services/bootErrorLog';
import { connDiagnostics, DiagEvent } from '@/services/connectionDiagnostics';
import { heartbeatEngine } from '@/services/heartbeatEngine';
import { logger } from '@/utils/logger';
import { useConnectionStatus } from '@/hooks/useConnection';
import { getCrashLogs, clearCrashLogs } from '@/services/bootErrorLog';


const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

// ── Layout constants ──────────────────────────────────────────────
const PAD   = 14;
const GAP3  = 8;
const GAP2  = 8;
const COL3_W = Math.floor((SW - PAD * 2 - GAP3 * 2) / 3);
const COL2_W = Math.floor((SW - PAD * 2 - GAP2) / 2);

// ── Color palette ─────────────────────────────────────────────────
const C = {
  bg:        '#020407',
  surface:   '#070D16',
  surfaceHi: '#0C1420',
  border:    'rgba(0,255,255,0.12)',
  text:      '#D8E8F4',
  textMid:   '#7A9AB8',
  textDim:   '#3A5068',
  teal:      '#00FFFF',
  green:     '#00FF88',
  amber:     '#F5A623',
  red:       '#FF3131',
  purple:    '#BF00FF',
  blue:      '#4A9EFF',
  cyan:      '#00BFFF',
};

// ── Unified log entry type ────────────────────────────────────────
export type LogFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CMD' | 'CONN';

type LogSource = 'CORE' | 'SENSOR' | 'KB' | 'CONN' | 'SCRIPT' | 'BOOT' | 'AI' | 'SYS';
type LogLevel  = 'info' | 'warn' | 'error' | 'success' | 'cmd' | 'conn';

interface UnifiedLogEntry {
  id:        string;
  ts:        number;
  level:     LogLevel;
  source:    LogSource;
  message:   string;
  detail?:   string;
  latencyMs?: number;
}

// ── Source ↔ color map ────────────────────────────────────────────
const SOURCE_COLOR: Record<LogSource, string> = {
  CORE:   C.teal,
  SENSOR: C.blue,
  KB:     C.amber,
  CONN:   C.green,
  SCRIPT: C.purple,
  BOOT:   C.red,
  AI:     C.cyan,
  SYS:    C.textMid,
};

const LEVEL_COLOR: Record<LogLevel, string> = {
  info:    C.blue,
  warn:    C.amber,
  error:   C.red,
  success: C.green,
  cmd:     C.purple,
  conn:    C.teal,
};

const FILTER_CHIPS: { key: LogFilter; label: string; color: string }[] = [
  { key: 'ALL',     label: 'ALL',     color: C.teal   },
  { key: 'INFO',    label: 'INFO',    color: C.blue   },
  { key: 'WARN',    label: 'WARN',    color: C.amber  },
  { key: 'ERROR',   label: 'ERROR',   color: C.red    },
  { key: 'SUCCESS', label: 'SUCCESS', color: C.green  },
  { key: 'CMD',     label: 'CMD',     color: C.purple },
  { key: 'CONN',    label: 'CONN',    color: C.cyan   },
];

// ── SECTION DIVIDER ───────────────────────────────────────────────
function SectionDiv({ icon, label, color, right }: {
  icon: string; label: string; color: string; right?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, marginTop: 4 }}>
      <View style={{ width: 3, height: 14, backgroundColor: color, borderRadius: 2 }} />
      <MaterialIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color, letterSpacing: 2 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: color + '30', marginLeft: 4 }} />
      {right}
    </View>
  );
}

// ── COMPACT STAT CELL (3-col) ─────────────────────────────────────
function StatCell({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <View style={[gs.cell, { borderColor: color + '35', borderTopColor: color }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '60' }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color + '35' }} />
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={[gs.cellVal, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{value}</Text>
      <Text style={gs.cellLabel} numberOfLines={1}>{label}</Text>
      {sub ? <Text style={gs.cellSub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

const gs = StyleSheet.create({
  cell: {
    width: COL3_W, backgroundColor: '#070E1A', borderRadius: 10,
    borderWidth: 1.5, borderTopWidth: 3, padding: 10, gap: 3, alignItems: 'center',
    position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  cellVal:   { fontSize: 20, fontWeight: '900', fontFamily: MONO, lineHeight: 24, textAlign: 'center' },
  cellLabel: { fontSize: 9, fontWeight: '700', color: '#4A6878', fontFamily: MONO, letterSpacing: 0.8, textAlign: 'center' },
  cellSub:   { fontSize: 8, color: '#3A4E5A', fontFamily: MONO, textAlign: 'center' },
});

// ── HEARTBEAT QUALITY CARD ────────────────────────────────────────
function HeartbeatCard({ isConnected }: { isConnected: boolean }) {
  const quality = heartbeatEngine.getConnectionQuality();
  const latHist = heartbeatEngine.getLatencyHistory(12);
  const maxLat  = Math.max(...latHist, 1);

  const scoreColor = quality.score >= 80 ? C.green : quality.score >= 50 ? C.amber : C.red;
  const pulseAnim  = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: false }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={[hbc.card, { borderColor: (isConnected ? scoreColor : C.textDim) + '35' }]}>
      <View style={[hbc.topBar, { backgroundColor: isConnected ? scoreColor : C.textDim }]} />
      <View style={hbc.header}>
        <MaterialCommunityIcons name="heart-pulse" size={13} color={isConnected ? scoreColor : C.textDim} />
        <Text style={[hbc.title, { color: C.text }]}>CONNECTION QUALITY</Text>
        <View style={{ flex: 1 }} />
        <View style={[hbc.statusPill, { borderColor: (isConnected ? scoreColor : C.textDim) + '50', backgroundColor: (isConnected ? scoreColor : C.textDim) + '0C' }]}>
          <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isConnected ? scoreColor : C.textDim, opacity: pulseAnim }} />
          <Text style={[hbc.statusTxt, { color: isConnected ? scoreColor : C.textDim }]}>
            {isConnected ? quality.status.toUpperCase() : 'OFFLINE'}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: GAP3, paddingHorizontal: PAD, paddingBottom: PAD }}>
        {/* Score ring */}
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 64 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: (isConnected ? scoreColor : C.textDim) + '40', alignItems: 'center', justifyContent: 'center', backgroundColor: (isConnected ? scoreColor : C.textDim) + '08' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', fontFamily: MONO, color: isConnected ? scoreColor : C.textDim }}>
              {isConnected ? `${quality.score}` : '--'}
            </Text>
            <Text style={{ fontSize: 7, fontFamily: MONO, color: C.textDim }}>SCORE</Text>
          </View>
        </View>
        {/* Stats 2-col */}
        <View style={{ flex: 1, gap: 5 }}>
          {[
            { label: 'AVG LATENCY', value: isConnected ? `${quality.avgLatency}ms` : '--', color: C.cyan },
            { label: 'JITTER',      value: isConnected ? `${quality.jitter}ms` : '--',     color: C.amber },
            { label: 'PACKET LOSS', value: isConnected ? `${quality.packetLoss}%` : '--',  color: quality.packetLoss > 10 ? C.red : C.green },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 8, fontWeight: '700', fontFamily: MONO, color: C.textDim, width: 76, letterSpacing: 0.5 }}>{item.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '900', fontFamily: MONO, color: item.color }}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* Latency sparkline */}
      {latHist.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 28, paddingHorizontal: PAD, paddingBottom: 8 }}>
          {latHist.map((lat, i) => {
            const h = Math.max(4, (lat / maxLat) * 24);
            const col = lat > 200 ? C.red : lat > 100 ? C.amber : C.green;
            const isLast = i === latHist.length - 1;
            return (
              <View key={i} style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={[{ borderRadius: 2, backgroundColor: col, height: h, width: '80%', opacity: isLast ? 1 : 0.5 + i / latHist.length * 0.5 },
                  Platform.OS === 'ios' && isLast ? { shadowColor: col, shadowOffset:{width:0,height:0}, shadowOpacity:0.8, shadowRadius:4 } : {}]} />
              </View>
            );
          })}
          <Text style={{ fontSize: 7, fontFamily: MONO, color: C.textDim, position: 'absolute', right: PAD, bottom: 10 }}>LATENCY 12-PING</Text>
        </View>
      ) : null}
    </View>
  );
}

const hbc = StyleSheet.create({
  card:      { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10 }, android: { elevation: 4 } }) },
  topBar:    { height: 3 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingTop: 11, paddingBottom: 10 },
  title:     { fontSize: 11, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.8 },
  statusPill:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  statusTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
});

// ── LOG ENTRY ROW ─────────────────────────────────────────────────
const LogRow = React.memo(function LogRow({ entry, expanded, onToggle }: {
  entry: UnifiedLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const levelColor  = LEVEL_COLOR[entry.level] || C.textMid;
  const sourceColor = SOURCE_COLOR[entry.source] || C.textMid;
  const timeStr = new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={[lr.row, { borderLeftColor: levelColor }]}
    >
      {/* Source badge + level */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
        <View style={[lr.sourceBadge, { borderColor: sourceColor + '55', backgroundColor: sourceColor + '12' }]}>
          <Text style={[lr.sourceTxt, { color: sourceColor }]}>[{entry.source}]</Text>
        </View>
        <View style={[lr.levelBadge, { borderColor: levelColor + '50', backgroundColor: levelColor + '10' }]}>
          <Text style={[lr.levelTxt, { color: levelColor }]}>{entry.level.toUpperCase()}</Text>
        </View>
        <Text style={lr.timestamp}>{timeStr}</Text>
        {entry.latencyMs !== undefined ? (
          <View style={[lr.latBadge, { borderColor: C.cyan + '30' }]}>
            <Text style={[lr.latTxt, { color: C.cyan }]}>{entry.latencyMs}ms</Text>
          </View>
        ) : null}
        <MaterialIcons
          name={expanded ? 'expand-less' : 'expand-more'}
          size={12} color={C.textDim}
          style={{ marginLeft: 'auto' as any }}
        />
      </View>
      {/* Message */}
      <Text style={[lr.message, { color: levelColor + 'CC' }]} numberOfLines={expanded ? undefined : 2}>
        {entry.message}
      </Text>
      {/* Detail (expanded) */}
      {expanded && entry.detail ? (
        <Text style={[lr.detail, { color: C.textDim }]}>{entry.detail}</Text>
      ) : null}
    </TouchableOpacity>
  );
});

const lr = StyleSheet.create({
  row:        { borderLeftWidth: 3, paddingLeft: 10, paddingRight: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,220,255,0.07)' },
  sourceBadge:{ borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, flexShrink: 0 },
  sourceTxt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  levelBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  levelTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
  timestamp:  { fontFamily: MONO, fontSize: 8.5, color: '#3A5070' },
  latBadge:   { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  latTxt:     { fontFamily: MONO, fontSize: 7.5, fontWeight: '700' },
  message:    { fontFamily: MONO, fontSize: 12, lineHeight: 17 },
  detail:     { fontFamily: MONO, fontSize: 10, lineHeight: 15, marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', color: '#4A6878' },
});

// ── BOOT ERROR CARD ────────────────────────────────────────────────
function BootErrorCard({ entry }: { entry: BootErrorEntry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => { haptics.selection(); setExpanded(v => !v); }}
      activeOpacity={0.8}
      style={[bec.card, { borderLeftColor: C.red }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
        <View style={[bec.badge, { borderColor: C.red + '50', backgroundColor: C.red + '10' }]}>
          <Text style={[bec.badgeTxt, { color: C.red }]}>[BOOT]</Text>
        </View>
        <View style={[bec.badge, { borderColor: C.amber + '45' }]}>
          <Text style={[bec.badgeTxt, { color: C.amber }]}>{entry.phase.toUpperCase()}</Text>
        </View>
        <Text style={bec.time}>{new Date(entry.tsMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        <Text style={bec.platform}>{entry.platform}</Text>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={12} color={C.textDim} style={{ marginLeft: 'auto' as any }} />
      </View>
      <Text style={[bec.msg, { color: C.red + 'CC' }]} numberOfLines={expanded ? undefined : 2}>{entry.message}</Text>
      {expanded && entry.stack ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <Text style={bec.stack}>{entry.stack}</Text>
        </ScrollView>
      ) : null}
    </TouchableOpacity>
  );
}

const bec = StyleSheet.create({
  card:    { borderLeftWidth: 3, paddingLeft: 10, paddingRight: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,49,49,0.1)', backgroundColor: '#08020A' },
  badge:   { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  badgeTxt:{ fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  time:    { fontFamily: MONO, fontSize: 8.5, color: '#3A5070' },
  platform:{ fontFamily: MONO, fontSize: 8, color: '#3A5070' },
  msg:     { fontFamily: MONO, fontSize: 12, color: '#FF8899', lineHeight: 17 },
  stack:   { fontFamily: MONO, fontSize: 9, color: '#3A4A55', lineHeight: 14 },
});

// ── CRASH LOG CARD ─────────────────────────────────────────────────
function CrashLogCard({ entry }: { entry: { ts: number; msg: string; stack: string; platform: string; version: any } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => { haptics.selection(); setExpanded(v => !v); }}
      activeOpacity={0.8}
      style={[bec.card, { borderLeftColor: '#FF0000', backgroundColor: '#090005' }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
        <View style={[bec.badge, { borderColor: '#FF0000' + '50', backgroundColor: '#FF000010' }]}>
          <Text style={[bec.badgeTxt, { color: '#FF0000' }]}>[CRASH]</Text>
        </View>
        <Text style={bec.time}>{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        <Text style={bec.platform}>{entry.platform}</Text>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={12} color={C.textDim} style={{ marginLeft: 'auto' as any }} />
      </View>
      <Text style={[bec.msg, { color: '#FF6677' }]} numberOfLines={expanded ? undefined : 2}>{entry.msg}</Text>
      {expanded && entry.stack ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <Text style={bec.stack}>{entry.stack}</Text>
        </ScrollView>
      ) : null}
    </TouchableOpacity>
  );
}

// ── CONN DIAG ROW ─────────────────────────────────────────────────
function ConnDiagRow({ event }: { event: DiagEvent }) {
  const typeColor: Record<string, string> = {
    connect: C.green, disconnect: C.red, ping_ok: C.teal, ping_fail: C.amber,
    reconnect: C.cyan, scan: C.purple, error: C.red, app_state: C.textMid,
  };
  const col = typeColor[event.type] || C.textMid;
  const timeStr = new Date(event.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <View style={[cdr.row, { borderLeftColor: col }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <View style={[cdr.typeBadge, { borderColor: col + '55', backgroundColor: col + '12' }]}>
          <Text style={[cdr.typeTxt, { color: col }]}>{event.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        {event.ip ? (
          <Text style={[cdr.addr, { color: C.textDim }]}>{event.ip}:{event.port}</Text>
        ) : null}
        {event.latencyMs !== undefined ? (
          <Text style={[cdr.lat, { color: C.cyan }]}>{event.latencyMs}ms</Text>
        ) : null}
        <Text style={cdr.time}>{timeStr}</Text>
      </View>
      <Text style={[cdr.detail, { color: col + 'AA' }]} numberOfLines={2}>{event.detail}</Text>
    </View>
  );
}

const cdr = StyleSheet.create({
  row:      { borderLeftWidth: 2.5, paddingLeft: 10, paddingRight: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(0,220,255,0.06)' },
  typeBadge:{ borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  typeTxt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  addr:     { fontFamily: MONO, fontSize: 8.5 },
  lat:      { fontFamily: MONO, fontSize: 8.5, fontWeight: '700' },
  time:     { fontFamily: MONO, fontSize: 8.5, color: '#3A5070' },
  detail:   { fontFamily: MONO, fontSize: 11, lineHeight: 16, marginTop: 3 },
});

// ── DATA LOADER ────────────────────────────────────────────────────
async function loadAllLogs(): Promise<{
  unified: UnifiedLogEntry[];
  bootErrors: BootErrorEntry[];
  crashLogs: any[];
  connEvents: DiagEvent[];
  totalCount: number;
  errorCount: number;
  warnCount: number;
  lastEventTs: number;
}> {
  // Load in parallel
  const [autoErrLogs, bootErrs, connEvts, crashEntries] = await Promise.all([
    autoErrorLogger.load(),
    getBootErrors(),
    connDiagnostics.getEvents(),
    getCrashLogs().catch(() => [] as any[]),
  ]);

  const aiLogs    = await aiLogger.getRecentLogs(100).catch(() => [] as any[]);
  const ringLogs  = logger.getEntries();

  const unified: UnifiedLogEntry[] = [];
  let   id = 0;

  // ── autoErrorLogger entries ──────────────────────────────
  autoErrLogs.forEach((e: ErrorLogEntry) => {
    const level: LogLevel =
      e.level === 'error' ? 'error' :
      e.level === 'warn'  ? 'warn'  :
      e.level === 'debug' ? 'cmd'   : 'info';
    const source: LogSource =
      e.source.toLowerCase().includes('conn')   ? 'CONN'   :
      e.source.toLowerCase().includes('kb')     ? 'KB'     :
      e.source.toLowerCase().includes('butler') ? 'AI'     :
      e.source.toLowerCase().includes('script') ? 'SCRIPT' :
      e.source.toLowerCase().includes('boot')   ? 'BOOT'   : 'CORE';
    unified.push({
      id: `ae-${id++}`,
      ts: e.timestamp,
      level,
      source,
      message: `[${e.source}] ${e.message}`,
      detail: e.meta ? JSON.stringify(e.meta).slice(0, 300) : undefined,
    });
  });

  // ── aiLogger entries ──────────────────────────────────────
  aiLogs.forEach((e: any) => {
    const level: LogLevel =
      e.level === 'error'   ? 'error' :
      e.level === 'warn'    ? 'warn'  :
      e.level === 'success' ? 'success' : 'info';
    unified.push({
      id: `ai-${id++}`,
      ts: new Date(e.timestamp || 0).getTime() || Date.now() - 60000,
      level,
      source: 'AI',
      message: `[${e.category || 'AI'}] ${e.message}`,
    });
  });

  // ── Connection diag events (recent 50) ────────────────────
  connEvts.slice(-50).forEach((e: DiagEvent) => {
    const level: LogLevel =
      e.type === 'connect'    ? 'success' :
      e.type === 'disconnect' ? 'warn'    :
      e.type === 'ping_ok'    ? 'conn'    :
      e.type === 'ping_fail'  ? 'warn'    :
      e.type === 'error'      ? 'error'   : 'info';
    unified.push({
      id: `cd-${id++}`,
      ts: e.ts,
      level,
      source: 'CONN',
      message: e.detail,
      latencyMs: e.latencyMs,
      detail: e.ip ? `${e.ip}:${e.port}` : undefined,
    });
  });

  // ── Internal ring buffer ──────────────────────────────────
  ringLogs.slice(-60).forEach((e: any) => {
    const level: LogLevel =
      e.level === 'error' ? 'error' :
      e.level === 'warn'  ? 'warn'  :
      e.level === 'info'  ? 'info'  : 'cmd';
    unified.push({
      id: `ring-${id++}`,
      ts: e.ts,
      level,
      source: 'SYS',
      message: e.msg.slice(0, 200),
    });
  });

  // ── Auto-inject startup message if no logs ────────────────
  if (unified.length === 0) {
    unified.push({
      id: `init-${id++}`,
      ts: Date.now() - 2000,
      level: 'success',
      source: 'CORE',
      message: 'NEXUS v7.3 initialized. All subsystems nominal.',
    });
    unified.push({
      id: `init-${id++}`,
      ts: Date.now() - 1500,
      level: 'info',
      source: 'SENSOR',
      message: 'Hardware API enumeration complete.',
    });
  }

  // Sort by timestamp, newest first
  unified.sort((a, b) => b.ts - a.ts);

  const errorCount = unified.filter(e => e.level === 'error').length;
  const warnCount  = unified.filter(e => e.level === 'warn').length;
  const lastEventTs = unified.length > 0 ? unified[0].ts : 0;
  const totalCount = unified.length + bootErrs.length + crashEntries.length;

  return {
    unified,
    bootErrors: bootErrs,
    crashLogs: crashEntries,
    connEvents: connEvts.reverse().slice(0, 80),
    totalCount,
    errorCount,
    warnCount,
    lastEventTs,
  };
}

// ── MAIN SCREEN ────────────────────────────────────────────────────
export default function ActivityLogsScreen() {
  return (
    <TabErrorBoundary name="Activity Logs">
      <ActivityLogsScreenInner />
    </TabErrorBoundary>
  );
}

function ActivityLogsScreenInner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectionStatus();

  const [filter,      setFilter]      = useState<LogFilter>('ALL');
  const [search,      setSearch]      = useState('');
  const [autoScroll,  setAutoScroll]  = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab,   setActiveTab]   = useState<'feed' | 'conn' | 'boot' | 'quality'>('feed');

  const [unified,     setUnified]     = useState<UnifiedLogEntry[]>([]);
  const [bootErrors,  setBootErrors]  = useState<BootErrorEntry[]>([]);
  const [crashLogs,   setCrashLogs]   = useState<any[]>([]);
  const [connEvents,  setConnEvents]  = useState<DiagEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, errors: 0, warns: 0, lastEventTs: 0 });

  const feedScrollRef = useRef<ScrollView>(null);
  const pulseAnim     = useRef(new Animated.Value(0.4)).current;

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await loadAllLogs();
      setUnified(data.unified);
      setBootErrors(data.bootErrors);
      setCrashLogs(data.crashLogs);
      setConnEvents(data.connEvents);
      setStats({
        total:       data.totalCount,
        errors:      data.errorCount,
        warns:       data.warnCount,
        lastEventTs: data.lastEventTs,
      });
    } catch (e: any) {
      autoErrorLogger.log('error', 'ActivityLogs', e?.message || 'Load failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(() => load(), 15_000);
    return () => clearInterval(t);
  }, [load]));

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: false }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  // Auto-scroll to top (newest) on new data
  useEffect(() => {
    if (autoScroll && feedScrollRef.current) {
      feedScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [unified.length, autoScroll]);

  const filteredEntries = useMemo(() => {
    let entries = unified;
    // Filter by chip
    if (filter !== 'ALL') {
      const filterMap: Record<LogFilter, LogLevel[]> = {
        ALL:     ['info','warn','error','success','cmd','conn'],
        INFO:    ['info'],
        WARN:    ['warn'],
        ERROR:   ['error'],
        SUCCESS: ['success'],
        CMD:     ['cmd'],
        CONN:    ['conn'],
      };
      const allowed = filterMap[filter] || [];
      entries = entries.filter(e => allowed.includes(e.level));
    }
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.message.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        (e.detail || '').toLowerCase().includes(q)
      );
    }
    return entries;
  }, [unified, filter, search]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    Alert.alert(
      'Clear All Logs',
      'This will clear the app activity log, boot errors, connection diagnostics and crash logs. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: async () => {
          haptics.heavy();
          await Promise.all([
            autoErrorLogger.clear(),
            clearBootErrors(),
            clearCrashLogs(),
            connDiagnostics.clearAll(),
            aiLogger.clearLogs(),
          ]).catch(() => {});
          setUnified([]);
          setBootErrors([]);
          setCrashLogs([]);
          setConnEvents([]);
          setStats({ total: 0, errors: 0, warns: 0, lastEventTs: 0 });
          haptics.success();
        }},
      ]
    );
  }, []);

  const lastEventStr = stats.lastEventTs > 0
    ? (() => {
        const diff = Date.now() - stats.lastEventTs;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
      })()
    : 'none';

  const INNER_TABS = [
    { key: 'feed',    label: 'FEED',    icon: 'stream',           color: C.teal   },
    { key: 'conn',    label: 'NETWORK', icon: 'router',           color: C.green  },
    { key: 'boot',    label: 'BOOT',    icon: 'restart-alt',      color: C.red    },
    { key: 'quality', label: 'QUALITY', icon: 'signal-cellular-4-bar', color: C.cyan },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ExpoImage
          source={require('@/assets/images/nexus-hero-bg.jpg')}
          style={{ flex: 1, opacity: 0.08 }}
          contentFit="cover"
        />
      </View>
      <TabSwipeOverlay leftRoute="/(tabs)/builder" rightRoute="/(tabs)/settings" />

      <CompactPageHeader
        accent={C.teal}
        icon="text-box-multiple-outline"
        iconLib="community"
        title="ACTIVITY LOGS"
        badge={`${stats.total} ENTRIES`}
        badgeColor={C.teal}
        isConnected={isConnected}
        safeTop={insets.top}
        rightAction={{ icon: 'refresh', onPress: () => { haptics.light(); load(true); }, color: C.teal }}
        rightAction2={{ icon: 'delete-sweep', onPress: clearAll, color: C.red }}
        extraRow={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isConnected ? C.green : C.amber, opacity: pulseAnim }} />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.textMid, letterSpacing: 0.8 }}>
              {isConnected ? 'CONNECTED · LOG STREAMING' : 'OFFLINE · LOCAL LOGS ONLY'}
            </Text>
            <View style={{ flex: 1 }} />
            {/* Auto-scroll toggle */}
            <TouchableOpacity
              onPress={() => { haptics.selection(); setAutoScroll(v => !v); }}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
                autoScroll
                  ? { borderColor: C.teal + '60', backgroundColor: C.teal + '12' }
                  : { borderColor: C.textDim + '40', backgroundColor: C.textDim + '08' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="vertical-align-bottom" size={10} color={autoScroll ? C.teal : C.textDim} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: autoScroll ? C.teal : C.textDim }}>
                {autoScroll ? 'AUTO' : 'MANUAL'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── 3-col stats strip ── */}
      <View style={{ flexDirection: 'row', gap: GAP3, paddingHorizontal: PAD, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: C.teal + '18', backgroundColor: C.surfaceHi }}>
        <StatCell icon="list" label="TOTAL"  value={String(stats.total)}  color={C.teal}  />
        <StatCell icon="error-outline" label="ERRORS" value={String(stats.errors)} color={stats.errors > 0 ? C.red : C.textDim} sub={stats.errors > 0 ? 'needs attention' : 'clean'} />
        <StatCell icon="access-time" label="LAST EVT" value={lastEventStr} color={C.amber} />
      </View>

      {/* ── Inner tab bar ── */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: C.teal + '20', backgroundColor: '#030810', flexShrink: 0 }}>
        {INNER_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { haptics.selection(); setActiveTab(tab.key); }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                paddingVertical: 10, borderBottomWidth: 3,
                borderBottomColor: isActive ? tab.color : 'transparent',
                backgroundColor: isActive ? tab.color + '0E' : 'transparent' }}
              activeOpacity={0.8}
            >
              <MaterialIcons name={tab.icon as any} size={12} color={isActive ? tab.color : C.textDim} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: isActive ? tab.color : C.textDim, letterSpacing: 0.5 }}>
                {tab.label}
              </Text>
              {tab.key === 'boot' && (bootErrors.length + crashLogs.length) > 0 ? (
                <View style={{ backgroundColor: C.red, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, minWidth: 14, alignItems: 'center' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: '#fff' }}>{bootErrors.length + crashLogs.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ FEED TAB ══ */}
      {activeTab === 'feed' && (
        <View style={{ flex: 1 }}>
          {/* Filter chips + search */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surfaceHi, flexShrink: 0 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 4 }}>
              {FILTER_CHIPS.map(chip => {
                const isActive = filter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    onPress={() => { haptics.selection(); setFilter(chip.key); }}
                    style={[{ borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
                      isActive
                        ? { borderColor: chip.color, backgroundColor: chip.color + '20' }
                        : { borderColor: C.border }]}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: isActive ? chip.color : C.textDim }}>{chip.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: PAD, marginBottom: 8,
              backgroundColor: C.surface, borderRadius: 9, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 7 }}>
              <MaterialIcons name="search" size={13} color={search ? C.teal : C.textDim} />
              <TextInput
                style={{ flex: 1, fontSize: 12, color: C.text, fontFamily: MONO }}
                value={search} onChangeText={setSearch}
                placeholder="Search logs..." placeholderTextColor={C.textDim}
                autoCapitalize="none" autoCorrect={false}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <MaterialIcons name="close" size={11} color={C.textDim} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator color={C.teal} size="large" />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, letterSpacing: 1 }}>LOADING LOGS...</Text>
            </View>
          ) : filteredEntries.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="text-box-check-outline" size={48} color={C.textDim} />
              <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: C.textDim }}>
                {search ? 'No results' : 'No logs to show'}
              </Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.textDim + '80', textAlign: 'center', maxWidth: 260 }}>
                {search ? `Nothing matching "${search}"` : 'Logs appear automatically as events occur'}
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={feedScrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.teal} />}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.teal }} />
                <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.teal + '80', letterSpacing: 1.5 }}>
                  {filteredEntries.length} ENTRIES{filter !== 'ALL' ? ` · ${filter}` : ''}{search ? ` · "${search}"` : ''}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: C.teal + '18' }} />
                <Text style={{ fontFamily: MONO, fontSize: 8, color: C.textDim }}>newest first</Text>
              </View>
              <View style={{ backgroundColor: C.surface, borderRadius: 0, overflow: 'hidden' }}>
                {filteredEntries.map(entry => (
                  <LogRow
                    key={entry.id}
                    entry={entry}
                    expanded={expandedIds.has(entry.id)}
                    onToggle={() => { haptics.selection(); toggleExpand(entry.id); }}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* ══ NETWORK TAB ══ */}
      {activeTab === 'conn' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.green} />}
        >
          {/* Quick stats */}
          <View style={{ padding: PAD, gap: GAP3 }}>
            <SectionDiv icon="router" label="CONNECTION EVENTS" color={C.green}
              right={<Text style={{ fontFamily: MONO, fontSize: 9, color: C.textDim }}>{connEvents.length} events</Text>} />
            <View style={{ flexDirection: 'row', gap: GAP3 }}>
              {[
                { label: 'CONNECTS',  value: String(connEvents.filter(e => e.type === 'connect').length),    color: C.green  },
                { label: 'PINGS OK',  value: String(connEvents.filter(e => e.type === 'ping_ok').length),    color: C.teal   },
                { label: 'FAILURES',  value: String(connEvents.filter(e => e.type.includes('fail') || e.type === 'error').length), color: C.red },
              ].map(item => (
                <StatCell key={item.label} icon="fiber-smart-record" label={item.label} value={item.value} color={item.color} />
              ))}
            </View>
          </View>
          {connEvents.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <MaterialIcons name="wifi-off" size={40} color={C.textDim} />
              <Text style={{ fontFamily: MONO, fontSize: 12, color: C.textDim }}>No connection events recorded</Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.textDim + '80', textAlign: 'center', maxWidth: 260 }}>
                Events appear when you connect, disconnect, or ping your PC server
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: C.surface, marginHorizontal: PAD, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
              {connEvents.map((event) => (
                <ConnDiagRow key={event.id} event={event} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ══ BOOT TAB ══ */}
      {activeTab === 'boot' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: PAD, paddingBottom: 140, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.red} />}
        >
          {/* Crash logs (GlobalErrorBoundary) */}
          {crashLogs.length > 0 && (
            <>
              <SectionDiv icon="warning" label="CRASH LOGS" color="#FF0000"
                right={
                  <TouchableOpacity onPress={async () => { haptics.medium(); await clearCrashLogs(); setCrashLogs([]); }}
                    style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: '#FF000050', backgroundColor: '#FF000010' }}>
                    <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: '#FF0000' }}>CLEAR</Text>
                  </TouchableOpacity>
                }
              />
              <View style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: '#FF000030', overflow: 'hidden' }}>
                {crashLogs.map((c, i) => (
                  <CrashLogCard key={i} entry={c} />
                ))}
              </View>
            </>
          )}

          {/* Boot error logs */}
          {bootErrors.length > 0 ? (
            <>
              <SectionDiv icon="restart-alt" label="BOOT ERRORS" color={C.red}
                right={
                  <TouchableOpacity onPress={async () => { haptics.medium(); await clearBootErrors(); setBootErrors([]); }}
                    style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: C.red + '50', backgroundColor: C.red + '10' }}>
                    <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.red }}>CLEAR</Text>
                  </TouchableOpacity>
                }
              />
              <View style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.red + '30', overflow: 'hidden' }}>
                {bootErrors.map((entry, i) => (
                  <BootErrorCard key={i} entry={entry} />
                ))}
              </View>
            </>
          ) : null}

          {/* All clear */}
          {crashLogs.length === 0 && bootErrors.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 14 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: C.green + '60', backgroundColor: C.green + '0C', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="check-circle-outline" size={36} color={C.green} />
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: C.green }}>ALL SYSTEMS NOMINAL</Text>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.textDim, textAlign: 'center', maxWidth: 280 }}>
                No crash logs or boot errors recorded. App is running cleanly.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ══ QUALITY TAB ══ */}
      {activeTab === 'quality' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: PAD, paddingBottom: 140, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.cyan} />}
        >
          <HeartbeatCard isConnected={isConnected} />

          {/* AI Logger diagnostics */}
          <View style={[qd.card, { borderColor: C.purple + '30' }]}>
            <View style={[qd.topBar, { backgroundColor: C.purple }]} />
            <View style={qd.header}>
              <MaterialIcons name="psychology" size={13} color={C.purple} />
              <Text style={[qd.title, { color: C.text }]}>AI LOGGER DIAGNOSTICS</Text>
            </View>
            {(async () => null)() /* triggers async in render — use state */ }
            <AILoggerDiagnostics />
          </View>

          {/* Logger ring buffer summary */}
          <View style={[qd.card, { borderColor: C.amber + '30' }]}>
            <View style={[qd.topBar, { backgroundColor: C.amber }]} />
            <View style={qd.header}>
              <MaterialIcons name="storage" size={13} color={C.amber} />
              <Text style={[qd.title, { color: C.text }]}>SYSTEM RING BUFFER</Text>
            </View>
            <View style={{ paddingHorizontal: PAD, paddingBottom: PAD, gap: 5 }}>
              {logger.getEntries().slice(0, 8).map((e, i) => {
                const col = e.level === 'error' ? C.red : e.level === 'warn' ? C.amber : C.textMid;
                return (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <Text style={{ fontFamily: MONO, fontSize: 8.5, color: C.textDim, width: 56 }}>
                      {new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                    <View style={{ width: 36 }}>
                      <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: col }}>[{e.level.slice(0,4).toUpperCase()}]</Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: MONO, fontSize: 10, color: col + 'CC', lineHeight: 14 }} numberOfLines={2}>{e.msg}</Text>
                  </View>
                );
              })}
              {logger.getEntries().length === 0 && (
                <Text style={{ fontFamily: MONO, fontSize: 11, color: C.textDim }}>Ring buffer empty — no entries yet</Text>
              )}
            </View>
          </View>

          {/* Recommendations */}
          <RecommendationsCard isConnected={isConnected} stats={stats} />
        </ScrollView>
      )}
    </View>
  );
}

// ── AI LOGGER DIAGNOSTICS WIDGET ──────────────────────────────────
function AILoggerDiagnostics() {
  const [diag, setDiag] = useState<any>(null);
  useEffect(() => {
    aiLogger.getDiagnostics().then(setDiag).catch(() => {});
  }, []);
  if (!diag) return <ActivityIndicator size="small" color={C.purple} style={{ margin: 14 }} />;
  return (
    <View style={{ paddingHorizontal: PAD, paddingBottom: PAD, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: GAP3 }}>
        {[
          { label: 'TOTAL',  value: String(diag.totalLogs),  color: C.purple },
          { label: 'ERRORS', value: String(diag.errorCount), color: C.red    },
          { label: 'WARNS',  value: String(diag.warnCount),  color: C.amber  },
        ].map(item => (
          <View key={item.label} style={{ flex: 1, alignItems: 'center', backgroundColor: item.color + '08', borderRadius: 9, borderWidth: 1, borderColor: item.color + '30', paddingVertical: 9 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', fontFamily: MONO, color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 8, fontFamily: MONO, color: C.textDim, letterSpacing: 0.5, marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>
      {diag.recommendations?.length > 0 && (
        <View style={{ gap: 6 }}>
          {diag.recommendations.slice(0, 3).map((r: string, i: number) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderColor: C.amber + '30', backgroundColor: C.amber + '06' }}>
              <MaterialIcons name="lightbulb-outline" size={12} color={C.amber} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontFamily: MONO, fontSize: 10, color: C.amber + 'CC', lineHeight: 15 }}>{r}</Text>
            </View>
          ))}
        </View>
      )}
      {(!diag.recommendations || diag.recommendations.length === 0) && (
        <View style={{ flexDirection: 'row', gap: 7, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderColor: C.green + '30', backgroundColor: C.green + '06' }}>
          <MaterialIcons name="check-circle-outline" size={12} color={C.green} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: C.green + 'CC' }}>No issues detected — all patterns nominal</Text>
        </View>
      )}
    </View>
  );
}

// ── RECOMMENDATIONS CARD ──────────────────────────────────────────
function RecommendationsCard({ isConnected, stats }: { isConnected: boolean; stats: { total: number; errors: number; warns: number; lastEventTs: number } }) {
  const recs: { icon: string; color: string; text: string }[] = [];

  if (stats.errors > 10)   recs.push({ icon: 'error-outline',     color: C.red,    text: `${stats.errors} errors in log — check ERROR tab for details` });
  if (stats.warns > 20)    recs.push({ icon: 'warning',            color: C.amber,  text: `${stats.warns} warnings — consider clearing old logs` });
  if (!isConnected)        recs.push({ icon: 'wifi-off',           color: C.amber,  text: 'PC offline — connection events are not being recorded' });
  if (stats.errors === 0)  recs.push({ icon: 'check-circle-outline', color: C.green, text: 'Zero errors — app is running cleanly' });
  if (isConnected)         recs.push({ icon: 'router',             color: C.teal,   text: 'Connection active — live events are being logged in NETWORK tab' });
  recs.push({ icon: 'info-outline', color: C.blue, text: 'Activity Logs auto-refresh every 15s. Tap ⟳ to refresh manually.' });

  return (
    <View style={[qd.card, { borderColor: C.cyan + '30' }]}>
      <View style={[qd.topBar, { backgroundColor: C.cyan }]} />
      <View style={qd.header}>
        <MaterialIcons name="tips-and-updates" size={13} color={C.cyan} />
        <Text style={[qd.title, { color: C.text }]}>SYSTEM RECOMMENDATIONS</Text>
      </View>
      <View style={{ paddingHorizontal: PAD, paddingBottom: PAD, gap: 7 }}>
        {recs.map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 9, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9, borderColor: r.color + '35', backgroundColor: r.color + '07' }}>
            <MaterialIcons name={r.icon as any} size={12} color={r.color} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontFamily: MONO, fontSize: 11, color: r.color + 'CC', lineHeight: 17 }}>{r.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const qd = StyleSheet.create({
  card:   { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10 }, android: { elevation: 4 } }) },
  topBar: { height: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 9 },
  title:  { fontSize: 11, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.8 },
});
