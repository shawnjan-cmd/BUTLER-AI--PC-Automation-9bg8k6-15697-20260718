/**
 * RuntimeDiagnosticsHUD — Floating error badge + full diagnostics modal
 * ─────────────────────────────────────────────────────────────────────
 * Shows a compact badge in the corner when errors exist.
 * Tap → full diagnostic dashboard:
 *   ERRORS tab  — categorised error list with auto-fix buttons
 *   NETWORK tab — network failures with URL + status
 *   HEALTH tab  — server, storage, service liveness
 *   AUTO-FIX tab — fix history + bulk fix button
 *
 * Never crashes, never blocks UI.
 */

import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Animated,
  ScrollView, TouchableOpacity, Platform, Dimensions,
  ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { runtimeErrorMonitor, RuntimeError, HealthSnapshot, ErrorCategory, ErrorSeverity } from '@/services/runtimeErrorMonitor';
import { securityAuditEngine, SecurityFinding, AuditReport, VulnSeverity } from '@/services/securityAuditEngine';
import { appHealthEngine, HealthFinding } from '@/services/appHealthEngine';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SW } = Dimensions.get('window');

const C = {
  bg:     '#010508', surf:   '#060E1A', surf2:  '#09141F',
  cyan:   '#00E5FF', green:  '#00FF88', amber:  '#FFB020',
  red:    '#FF3344', purple: '#CC44FF', mid:    '#5A7A96',
  dim:    '#1A2E44', text:   '#C8E4F0', teal:   '#00CCBB',
};

function severityColor(sev: ErrorSeverity): string {
  switch (sev) {
    case 'critical': return C.red;
    case 'error':    return '#FF6644';
    case 'warning':  return C.amber;
    case 'info':     return C.cyan;
  }
}

function categoryIcon(cat: ErrorCategory): string {
  switch (cat) {
    case 'js_crash':         return 'lightning-bolt';
    case 'unhandled_promise':return 'alert-circle';
    case 'network':          return 'wifi-off';
    case 'console_error':    return 'console';
    case 'console_warn':     return 'alert';
    case 'health_check':     return 'heart-pulse';
    case 'component_crash':  return 'view-grid-outline';
    case 'storage':          return 'database-alert';
    case 'service':          return 'cog-off';
    case 'auto_fix':         return 'auto-fix';
  }
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000)    return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`;
  return `${Math.floor(d / 3600000)}h ago`;
}

// ── Floating badge ────────────────────────────────────────────────
function FloatingBadge({ count, critCount, onPress }: {
  count: number; critCount: number; onPress: () => void;
}) {
  const pulseA = useRef(new Animated.Value(1)).current;
  const glowA  = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (critCount > 0) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseA, { toValue: 1.12, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseA, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
      ]));
      const glow = Animated.loop(Animated.sequence([
        Animated.timing(glowA, { toValue: 1,   duration: 700, useNativeDriver: false }),
        Animated.timing(glowA, { toValue: 0.3, duration: 700, useNativeDriver: false }),
      ]));
      pulse.start(); glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseA.setValue(1); glowA.setValue(0.5);
    }
  }, [critCount]);

  const badgeColor = critCount > 0 ? C.red : count > 0 ? C.amber : C.green;
  const borderColor = glowA.interpolate({
    inputRange: [0.3, 1],
    outputRange: [badgeColor + '40', badgeColor + 'CC'],
  });

  return (
    <Animated.View style={[fb.outer, { transform: [{ scale: pulseA }] }]}>
      <Animated.View style={[fb.badge, { borderColor, backgroundColor: badgeColor + '18' }]}>
        <Pressable onPress={() => { haptics.heavy(); onPress(); }} style={fb.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons
            name={critCount > 0 ? 'lightning-bolt' : count > 0 ? 'alert' : 'shield-check'}
            size={13}
            color={badgeColor}
          />
          {count > 0 && (
            <Text style={[fb.count, { color: badgeColor }]}>
              {count > 99 ? '99+' : count}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
const fb = StyleSheet.create({
  outer: { position: 'absolute', bottom: 130, right: 12, zIndex: 9999 },
  badge: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  count: { fontFamily: MONO, fontSize: 10, fontWeight: '900' },
});

// ── Error row ─────────────────────────────────────────────────────
function ErrorRow({ error, onFix, fixing }: {
  error: RuntimeError;
  onFix: (id: string) => void;
  fixing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const col = severityColor(error.severity);
  const icon = categoryIcon(error.category);

  return (
    <Pressable onPress={() => setExpanded(v => !v)} style={[er.outer, { borderLeftColor: col, borderColor: col + '25' }]}>
      <View style={er.row}>
        {/* Icon + severity */}
        <View style={[er.iconBox, { backgroundColor: col + '15', borderColor: col + '40' }]}>
          <MaterialCommunityIcons name={icon as any} size={12} color={col} />
        </View>

        {/* Message */}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[er.msg, { color: col === C.cyan ? C.text : '#FFF' }]} numberOfLines={expanded ? undefined : 2}>
            {error.message}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={er.source} numberOfLines={1}>{error.source}</Text>
            <Text style={er.ts}>{timeAgo(error.ts)}</Text>
            {error.count > 1 && (
              <View style={[er.countBadge, { borderColor: col + '40', backgroundColor: col + '10' }]}>
                <Text style={[er.countTxt, { color: col }]}>×{error.count}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Status */}
        <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {error.autoFixed ? (
            <View style={er.fixedBadge}>
              <MaterialIcons name="check-circle" size={11} color={C.green} />
              <Text style={[er.fixedTxt, { color: C.green }]}>FIXED</Text>
            </View>
          ) : error.fixAttempted ? (
            <View style={[er.fixedBadge, { borderColor: C.amber + '40' }]}>
              <MaterialIcons name="error-outline" size={11} color={C.amber} />
              <Text style={[er.fixedTxt, { color: C.amber }]}>TRIED</Text>
            </View>
          ) : (
            <Pressable onPress={() => { haptics.light(); onFix(error.id); }} disabled={fixing}
              style={[er.fixBtn, { borderColor: col + '55', backgroundColor: col + '10' }]}>
              {fixing ? <ActivityIndicator size="small" color={col} style={{ width: 14, height: 14 }} /> : <MaterialCommunityIcons name="auto-fix" size={11} color={col} />}
              <Text style={[er.fixBtnTxt, { color: col }]}>FIX</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={er.detail}>
          {error.url && <Text style={er.detailTxt} selectable>URL: {error.url}</Text>}
          {error.statusCode !== undefined && <Text style={er.detailTxt}>Status: {error.statusCode}</Text>}
          {error.fixResult && <Text style={[er.detailTxt, { color: error.autoFixed ? C.green : C.amber }]}>Fix: {error.fixResult}</Text>}
          {error.stack && <Text style={[er.detailTxt, { color: C.mid, fontSize: 7.5 }]} selectable numberOfLines={6}>{error.stack}</Text>}
        </View>
      )}
    </Pressable>
  );
}
const er = StyleSheet.create({
  outer:      { borderWidth: 1, borderRadius: 10, borderLeftWidth: 3, backgroundColor: C.surf2, marginBottom: 7, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 10 },
  iconBox:    { width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  msg:        { fontFamily: MONO, fontSize: 9.5, lineHeight: 13 },
  source:     { fontFamily: MONO, fontSize: 7.5, color: C.mid },
  ts:         { fontFamily: MONO, fontSize: 7.5, color: C.mid },
  countBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  countTxt:   { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  fixedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, borderColor: C.green + '40' },
  fixedTxt:   { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  fixBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  fixBtnTxt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  detail:     { borderTopWidth: 1, borderTopColor: C.dim, paddingHorizontal: 10, paddingTop: 7, paddingBottom: 8, gap: 4 },
  detailTxt:  { fontFamily: MONO, fontSize: 8.5, color: C.text, lineHeight: 13 },
});

// ── Health panel ──────────────────────────────────────────────────
function HealthPanel({ health }: { health: HealthSnapshot | null }) {
  if (!health) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={C.cyan} />
        <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>Running health checks...</Text>
      </View>
    );
  }

  const serverCol   = health.server === 'ok' ? C.green : health.server === 'degraded' ? C.amber : C.red;
  const storageCol  = health.storage === 'ok' ? C.green : health.storage === 'warn' ? C.amber : C.red;

  const CHECKS = [
    { label: 'BUTLER SERVER',    value: health.server.toUpperCase(), color: serverCol,   icon: 'server', sub: health.server === 'ok' ? `${health.serverLatency}ms latency` : 'Check server is running' },
    { label: 'ASYNC STORAGE',    value: health.storage.toUpperCase(), color: storageCol,  icon: 'database', sub: `~${health.storageUsedKB}KB estimated usage` },
    { label: 'ERROR COUNT',      value: String(health.errorCount),    color: health.criticalCount > 0 ? C.red : C.amber, icon: 'alert-circle', sub: `${health.criticalCount} critical/error` },
  ];

  const SERVICES = Object.entries(health.services).map(([k, v]) => ({
    label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
    ok: v as boolean,
  }));

  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }} showsVerticalScrollIndicator={false}>
      <Text style={hp.sectionTitle}>SYSTEM STATUS</Text>
      {CHECKS.map((c, i) => (
        <View key={i} style={[hp.checkRow, { borderColor: c.color + '35', backgroundColor: c.color + '08' }]}>
          <View style={[hp.checkIcon, { borderColor: c.color + '55', backgroundColor: c.color + '12' }]}>
            <MaterialCommunityIcons name={c.icon as any} size={16} color={c.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[hp.checkLabel, { color: c.color }]}>{c.label}</Text>
            <Text style={hp.checkSub}>{c.sub}</Text>
          </View>
          <View style={[hp.statusBadge, { borderColor: c.color + '55', backgroundColor: c.color + '12' }]}>
            <Text style={[hp.statusTxt, { color: c.color }]}>{c.value}</Text>
          </View>
        </View>
      ))}

      <Text style={[hp.sectionTitle, { marginTop: 8 }]}>SERVICE LIVENESS</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {SERVICES.map((s, i) => (
          <View key={i} style={[hp.serviceChip, { borderColor: (s.ok ? C.green : C.red) + '40', backgroundColor: (s.ok ? C.green : C.red) + '08' }]}>
            <MaterialIcons name={s.ok ? 'check-circle' : 'error-outline'} size={11} color={s.ok ? C.green : C.red} />
            <Text style={[hp.serviceTxt, { color: s.ok ? C.green : C.red }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[hp.sectionTitle, { marginTop: 8 }]}>LAST CHECKED</Text>
      <Text style={hp.checkSub}>{new Date(health.ts).toLocaleTimeString()} · Auto-refreshes every 30s</Text>
    </ScrollView>
  );
}
const hp = StyleSheet.create({
  sectionTitle: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: C.mid, letterSpacing: 1.5 },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  checkIcon:    { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkLabel:   { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  checkSub:     { fontFamily: MONO, fontSize: 8.5, color: C.mid, marginTop: 2 },
  statusBadge:  { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  statusTxt:    { fontFamily: MONO, fontSize: 9, fontWeight: '900' },
  serviceChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 },
  serviceTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
});

// ── Tab bar ───────────────────────────────────────────────────────
type TabID = 'errors' | 'network' | 'security' | 'health' | 'autofix';
function TabBar({ active, onChange, counts }: {
  active: TabID;
  onChange: (t: TabID) => void;
  counts: Record<TabID, number>;
}) {
  const TABS: { id: TabID; label: string; icon: string }[] = [
    { id: 'errors',   label: 'ERRORS',   icon: 'lightning-bolt' },
    { id: 'network',  label: 'NETWORK',  icon: 'wifi-off' },
    { id: 'security', label: 'SEC',      icon: 'shield-alert' },
    { id: 'health',   label: 'HEALTH',   icon: 'heart-pulse' },
    { id: 'autofix',  label: 'FIX',      icon: 'auto-fix' },
  ];
  return (
    <View style={tbar.row}>
      {TABS.map(t => {
        const isActive = active === t.id;
        const col = isActive ? C.cyan : C.mid;
        return (
          <Pressable key={t.id} onPress={() => { haptics.light(); onChange(t.id); }}
            style={[tbar.tab, isActive && { borderBottomColor: C.cyan, borderBottomWidth: 2 }]}>
            <MaterialCommunityIcons name={t.icon as any} size={12} color={col} />
            <Text style={[tbar.label, { color: col }]}>{t.label}</Text>
            {counts[t.id] > 0 && (
              <View style={[tbar.badge, { backgroundColor: isActive ? C.cyan : C.amber }]}>
                <Text style={tbar.badgeTxt}>{counts[t.id] > 99 ? '99+' : counts[t.id]}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
const tbar = StyleSheet.create({
  row:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.dim, backgroundColor: '#020810' },
  tab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  label:    { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  badge:    { borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  badgeTxt: { fontFamily: MONO, fontSize: 7, fontWeight: '900', color: '#000' },
});

// ── Security vulnerability severity helper ────────────────────────
function vulnColor(sev: VulnSeverity): string {
  switch (sev) {
    case 'critical': return C.red;
    case 'high':     return '#FF6644';
    case 'medium':   return C.amber;
    case 'low':      return C.teal;
    case 'info':     return C.cyan;
  }
}

// ── Security finding row ──────────────────────────────────────────
function SecurityFindingRow({ finding, onFix, onAccept, fixing }: {
  finding: SecurityFinding;
  onFix:    (id: string) => void;
  onAccept: (id: string) => void;
  fixing:   boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const col = vulnColor(finding.severity);
  return (
    <Pressable onPress={() => setExpanded(v => !v)}
      style={[sf.outer, { borderLeftColor: col, borderColor: col + '25' }]}>
      <View style={sf.row}>
        <View style={[sf.badge, { borderColor: col + '55', backgroundColor: col + '12' }]}>
          <Text style={[sf.badgeTxt, { color: col }]}>{finding.checkId}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[sf.title, { color: '#FFF' }]} numberOfLines={expanded ? undefined : 2}>{finding.title}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Text style={[sf.sev, { color: col }]}>{finding.severity.toUpperCase()}</Text>
            {finding.cwe && <Text style={sf.cwe}>{finding.cwe}</Text>}
            {finding.autoFixed && (
              <View style={sf.fixedBadge}>
                <MaterialIcons name="check-circle" size={9} color={C.green} />
                <Text style={sf.fixedTxt}>AUTO-FIXED</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
          {finding.status === 'open' && !finding.autoFixed && (
            <Pressable onPress={() => onFix(finding.id)} disabled={fixing}
              style={[sf.fixBtn, { borderColor: col + '55', backgroundColor: col + '10' }]}>
              {fixing
                ? <ActivityIndicator size="small" color={col} style={{ width: 12 }} />
                : <MaterialCommunityIcons name="auto-fix" size={10} color={col} />}
              <Text style={[sf.fixBtnTxt, { color: col }]}>FIX</Text>
            </Pressable>
          )}
          {finding.status === 'open' && (
            <Pressable onPress={() => onAccept(finding.id)}
              style={[sf.acceptBtn]}>
              <Text style={sf.acceptTxt}>ACCEPT RISK</Text>
            </Pressable>
          )}
        </View>
      </View>
      {expanded && (
        <View style={sf.detail}>
          <Text style={[sf.detailLabel, { color: col }]}>DESCRIPTION</Text>
          <Text style={sf.detailTxt}>{finding.description}</Text>
          <Text style={[sf.detailLabel, { color: C.amber, marginTop: 7 }]}>EVIDENCE</Text>
          <Text style={sf.detailTxt}>{finding.evidence}</Text>
          <Text style={[sf.detailLabel, { color: C.green, marginTop: 7 }]}>REMEDIATION</Text>
          <Text style={sf.detailTxt}>{finding.remediation}</Text>
          {finding.fixResult && (
            <>
              <Text style={[sf.detailLabel, { color: C.cyan, marginTop: 7 }]}>FIX RESULT</Text>
              <Text style={[sf.detailTxt, { color: finding.autoFixed ? C.green : C.amber }]}>{finding.fixResult}</Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
const sf = StyleSheet.create({
  outer:      { borderWidth: 1, borderRadius: 10, borderLeftWidth: 3, backgroundColor: C.surf2, marginBottom: 7, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  badge:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, flexShrink: 0, alignSelf: 'flex-start', marginTop: 1 },
  badgeTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  title:      { fontFamily: MONO, fontSize: 10, lineHeight: 14, fontWeight: '700' },
  sev:        { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  cwe:        { fontFamily: MONO, fontSize: 8, color: C.mid },
  fixedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fixedTxt:   { fontFamily: MONO, fontSize: 7, fontWeight: '900', color: C.green },
  fixBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  fixBtnTxt:  { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  acceptBtn:  { paddingHorizontal: 4, paddingVertical: 2 },
  acceptTxt:  { fontFamily: MONO, fontSize: 7, color: C.mid },
  detail:     { borderTopWidth: 1, borderTopColor: C.dim, padding: 10, gap: 4 },
  detailLabel:{ fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  detailTxt:  { fontFamily: MONO, fontSize: 9, color: C.text, lineHeight: 13 },
});

// ── Security score ring ───────────────────────────────────────────
function SecurityScoreRing({ score, critical, high, medium, low }: {
  score: number; critical: number; high: number; medium: number; low: number;
}) {
  const col = score >= 80 ? C.green : score >= 60 ? C.amber : C.red;
  return (
    <View style={[sr2.outer, { borderColor: col + '45', backgroundColor: col + '08' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={[sr2.scoreBox, { borderColor: col }]}>
          <Text style={[sr2.scoreNum, { color: col }]}>{score}</Text>
          <Text style={[sr2.scoreLabel, { color: col + '80' }]}>/ 100</Text>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[sr2.title, { color: col }]}>SECURITY SCORE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[
              { n: critical, label: 'CRIT',   col: C.red     },
              { n: high,     label: 'HIGH',   col: '#FF6644' },
              { n: medium,   label: 'MED',    col: C.amber   },
              { n: low,      label: 'LOW',    col: C.teal    },
            ].map((s, i) => (
              <View key={i} style={[sr2.chip, { borderColor: s.col + '45' }]}>
                <Text style={[sr2.chipN, { color: s.col }]}>{s.n}</Text>
                <Text style={[sr2.chipL, { color: s.col + '80' }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
const sr2 = StyleSheet.create({
  outer:      { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  scoreBox:   { width: 64, height: 64, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreNum:   { fontFamily: MONO, fontSize: 22, fontWeight: '900', lineHeight: 26 },
  scoreLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '700' },
  title:      { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  chipN:      { fontFamily: MONO, fontSize: 10, fontWeight: '900' },
  chipL:      { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
});

// ── Full dashboard modal ──────────────────────────────────────────
export function RuntimeDiagnosticsHUD() {
  const insets = useSafeAreaInsets();
  const [errors,       setErrors]       = useState<RuntimeError[]>([]);
  const [health,       setHealth]       = useState<HealthSnapshot | null>(null);
  const [auditReport,  setAuditReport]  = useState<AuditReport | null>(null);
  const [appFindings,  setAppFindings]  = useState<HealthFinding[]>([]);
  const [open,         setOpen]         = useState(false);
  const [tab,          setTab]          = useState<TabID>('errors');
  const [fixing,       setFixing]       = useState<Record<string, boolean>>({});
  const [fixingAll,    setFixingAll]    = useState(false);
  const slideA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = runtimeErrorMonitor.subscribe((errs, h) => {
      setErrors(errs);
      if (h) setHealth(h);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = securityAuditEngine.subscribe((report) => {
      if (report) setAuditReport(report);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = appHealthEngine.subscribe((findings) => {
      setAppFindings(findings);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (open) {
      Animated.spring(slideA, { toValue: 1, useNativeDriver: true, tension: 55, friction: 12 }).start();
    } else {
      Animated.timing(slideA, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [open]);

  const totalCount  = errors.length;
  const critCount   = errors.filter(e => e.severity === 'critical' || e.severity === 'error').length;
  const netErrors   = useMemo(() => errors.filter(e => e.category === 'network'), [errors]);
  const fixHistory  = useMemo(() => errors.filter(e => e.category === 'auto_fix' || e.fixAttempted), [errors]);
  const securityOpenCount = auditReport ? auditReport.findings.filter(f => f.status === 'open').length : 0;
  const securityCritCount = auditReport ? auditReport.critical + auditReport.high : 0;

  const tabCounts: Record<TabID, number> = {
    errors:   errors.filter(e => e.category !== 'network' && e.category !== 'auto_fix').length,
    network:  netErrors.length,
    security: securityOpenCount,
    health:   health ? (health.server !== 'ok' ? 1 : 0) : 0,
    autofix:  fixHistory.length + appFindings.filter(f => !f.fixed).length,
  };

  const handleFix = useCallback(async (id: string, source: 'runtime' | 'security' | 'health' = 'runtime') => {
    setFixing(f => ({ ...f, [id]: true }));
    if (source === 'security') {
      await securityAuditEngine.attemptFix(id).catch(() => {});
    } else if (source === 'health') {
      await appHealthEngine.attemptFix(id).catch(() => {});
    } else {
      await runtimeErrorMonitor.attemptFix(id).catch(() => {});
    }
    setFixing(f => ({ ...f, [id]: false }));
  }, []);

  const handleFixAll = useCallback(async () => {
    haptics.heavy();
    setFixingAll(true);
    await Promise.allSettled([
      runtimeErrorMonitor.attemptFixAll(),
      appHealthEngine.attemptFixAll(),
      // Auto-fix all open security findings that have a fix
      ...(auditReport?.findings.filter(f => f.status === 'open').map(f =>
        securityAuditEngine.attemptFix(f.id)
      ) ?? []),
    ]);
    setFixingAll(false);
  }, [auditReport]);

  const handleClear = useCallback(() => {
    if (Platform.OS === 'web') {
      runtimeErrorMonitor.clearAll();
    } else {
      Alert.alert('Clear all logs?', 'This removes all captured errors from memory.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => runtimeErrorMonitor.clearAll() },
      ]);
    }
  }, []);

  const handleAcceptRisk = useCallback((id: string) => {
    haptics.light();
    securityAuditEngine.acceptRisk(id);
  }, []);

  const handleRunSecurityScan = useCallback(async () => {
    haptics.medium();
    setFixing(f => ({ ...f, _scanning: true }));
    await securityAuditEngine.runAudit().catch(() => {});
    await appHealthEngine.runNow().catch(() => {});
    setFixing(f => ({ ...f, _scanning: false }));
  }, []);

  // Badge shows for errors AND security issues
  const showBadge = totalCount > 0 || critCount > 0 || securityCritCount > 0;

  const slideY = slideA.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });

  const renderTab = () => {
    switch (tab) {
      case 'errors': {
        const mainErrors = errors.filter(e => e.category !== 'network' && e.category !== 'auto_fix');
        return mainErrors.length === 0 ? (
          <View style={dash.empty}>
            <MaterialCommunityIcons name="shield-check" size={40} color={C.green} />
            <Text style={dash.emptyTxt}>No errors captured</Text>
            <Text style={dash.emptySub}>All runtime monitors are clean</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 12, gap: 4 }} showsVerticalScrollIndicator={false}>
            {mainErrors.map(e => (
              <ErrorRow key={e.id} error={e} onFix={handleFix} fixing={!!fixing[e.id]} />
            ))}
          </ScrollView>
        );
      }
      case 'network': {
        return netErrors.length === 0 ? (
          <View style={dash.empty}>
            <MaterialCommunityIcons name="wifi-check" size={40} color={C.green} />
            <Text style={dash.emptyTxt}>No network errors</Text>
            <Text style={dash.emptySub}>All requests successful</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 12, gap: 4 }} showsVerticalScrollIndicator={false}>
            {netErrors.map(e => (
              <ErrorRow key={e.id} error={e} onFix={handleFix} fixing={!!fixing[e.id]} />
            ))}
          </ScrollView>
        );
      }
      case 'security': {
        const openFindings = auditReport?.findings.filter(f => f.status === 'open') ?? [];
        const isScanning = !!fixing['_scanning'];
        return (
          <ScrollView contentContainerStyle={{ padding: 12, gap: 6 }} showsVerticalScrollIndicator={false}>
            {/* Scan button + score */}
            <Pressable onPress={handleRunSecurityScan} disabled={isScanning}
              style={({ pressed }) => [sec.scanBtn, { opacity: pressed || isScanning ? 0.8 : 1 }]}>
              {isScanning
                ? <ActivityIndicator size="small" color={C.cyan} />
                : <MaterialCommunityIcons name="shield-search" size={14} color={C.cyan} />}
              <Text style={sec.scanBtnTxt}>{isScanning ? 'SCANNING...' : 'RUN SECURITY SCAN NOW'}</Text>
            </Pressable>

            {auditReport && (
              <SecurityScoreRing
                score={auditReport.score}
                critical={auditReport.critical}
                high={auditReport.high}
                medium={auditReport.medium}
                low={auditReport.low}
              />
            )}

            {/* Code health findings */}
            {appFindings.filter(f => !f.fixed).length > 0 && (
              <>
                <Text style={sec.sectionTitle}>CODE HEALTH</Text>
                {appFindings.filter(f => !f.fixed).map(f => (
                  <Pressable key={f.id}
                    style={[sf.outer, { borderLeftColor: f.severity === 'critical' ? C.red : f.severity === 'high' ? '#FF6644' : C.amber, borderColor: C.amber + '25' }]}>
                    <View style={sf.row}>
                      <View style={[sf.badge, { borderColor: C.amber + '55', backgroundColor: C.amber + '12' }]}>
                        <Text style={[sf.badgeTxt, { color: C.amber }]}>{f.category.replace('_', ' ').toUpperCase().slice(0, 8)}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[sf.title, { color: '#FFF' }]} numberOfLines={2}>{f.title}</Text>
                        <Text style={sf.detailTxt} numberOfLines={2}>{f.detail}</Text>
                      </View>
                      {f.autoFixable && (
                        <Pressable onPress={() => handleFix(f.id, 'health')} disabled={!!fixing[f.id]}
                          style={[sf.fixBtn, { borderColor: C.amber + '55', backgroundColor: C.amber + '10' }]}>
                          {fixing[f.id]
                            ? <ActivityIndicator size="small" color={C.amber} style={{ width: 12 }} />
                            : <MaterialCommunityIcons name="auto-fix" size={10} color={C.amber} />}
                          <Text style={[sf.fixBtnTxt, { color: C.amber }]}>FIX</Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            {/* Security vulnerability findings */}
            {openFindings.length === 0 && appFindings.filter(f => !f.fixed).length === 0 ? (
              <View style={dash.empty}>
                <MaterialCommunityIcons name="shield-check" size={44} color={C.green} />
                <Text style={dash.emptyTxt}>No vulnerabilities found</Text>
                <Text style={dash.emptySub}>Tap scan to run full audit</Text>
              </View>
            ) : (
              <>
                {openFindings.length > 0 && <Text style={[sec.sectionTitle, { marginTop: 8 }]}>VULNERABILITIES ({openFindings.length})</Text>}
                {openFindings.map(f => (
                  <SecurityFindingRow
                    key={f.id}
                    finding={f}
                    onFix={(id) => handleFix(id, 'security')}
                    onAccept={handleAcceptRisk}
                    fixing={!!fixing[f.id]}
                  />
                ))}
              </>
            )}
          </ScrollView>
        );
      }
      case 'health':
        return <HealthPanel health={health} />;
      case 'autofix': {
        const unfixedCount = errors.filter(e => !e.autoFixed && !e.fixAttempted && e.severity !== 'info').length;
        return (
          <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }} showsVerticalScrollIndicator={false}>
            {unfixedCount > 0 && (
              <Pressable onPress={handleFixAll} disabled={fixingAll}
                style={({ pressed }) => [dash.fixAllBtn, { opacity: pressed || fixingAll ? 0.8 : 1 }]}>
                {fixingAll ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="auto-fix" size={15} color="#000" />}
                <Text style={dash.fixAllTxt}>{fixingAll ? 'FIXING...' : `AUTO-FIX ALL (${unfixedCount})`}</Text>
              </Pressable>
            )}
            {fixHistory.length === 0 ? (
              <View style={dash.empty}>
                <MaterialCommunityIcons name="auto-fix" size={40} color={C.mid} />
                <Text style={dash.emptyTxt}>No fix history yet</Text>
                <Text style={dash.emptySub}>Fixes will appear here as errors are detected</Text>
              </View>
            ) : (
              fixHistory.map(e => (
                <View key={e.id} style={[af2.row, { borderLeftColor: e.autoFixed ? C.green : e.fixAttempted ? C.amber : C.mid }]}>
                  <MaterialCommunityIcons
                    name={e.autoFixed ? 'check-circle' : e.fixAttempted ? 'alert-circle' : 'clock-outline'}
                    size={14}
                    color={e.autoFixed ? C.green : e.fixAttempted ? C.amber : C.mid}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={af2.msg} numberOfLines={2}>{e.message}</Text>
                    {e.fixResult && <Text style={[af2.result, { color: e.autoFixed ? C.green : C.amber }]}>{e.fixResult}</Text>}
                    <Text style={af2.time}>{timeAgo(e.ts)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        );
      }
    }
  };

  return (
    <>
      {showBadge && (
        <FloatingBadge count={totalCount + securityOpenCount} critCount={critCount + securityCritCount} onPress={() => setOpen(true)} />
      )}

      <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <Animated.View style={[dash.sheet, { paddingBottom: insets.bottom + 4, transform: [{ translateY: slideY }] }]}>
            {/* Header stripe */}
            <View style={{ height: 3, flexDirection: 'row' }}>
              {[C.red, C.amber, C.cyan, C.green, C.purple].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
            </View>

            {/* Header */}
            <View style={dash.header}>
              <View style={dash.headerLeft}>
                <MaterialCommunityIcons name="bug-check" size={20} color={critCount > 0 ? C.red : C.cyan} />
                <View>
                  <Text style={dash.headerTitle}>RUNTIME DIAGNOSTICS</Text>
                  <Text style={dash.headerSub}>
                    {critCount > 0 ? `${critCount} critical issues detected` : totalCount > 0 ? `${totalCount} events logged` : 'All systems nominal'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={handleClear}
                  style={dash.iconBtn}>
                  <MaterialIcons name="delete-sweep" size={16} color={C.mid} />
                </TouchableOpacity>
                <Pressable onPress={() => setOpen(false)} style={dash.iconBtn}>
                  <MaterialIcons name="close" size={16} color={C.mid} />
                </Pressable>
              </View>
            </View>

            {/* Summary chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 10, gap: 7 }}>
              {[
                { label: 'CRITICAL', count: errors.filter(e => e.severity === 'critical').length, color: C.red },
                { label: 'ERRORS',   count: errors.filter(e => e.severity === 'error').length,    color: '#FF6644' },
                { label: 'WARNINGS', count: errors.filter(e => e.severity === 'warning').length,  color: C.amber },
                { label: 'INFO',     count: errors.filter(e => e.severity === 'info').length,     color: C.cyan },
                { label: 'FIXED',    count: errors.filter(e => e.autoFixed).length,               color: C.green },
              ].map((s, i) => (
                <View key={i} style={[dash.chip, { borderColor: s.color + '45', backgroundColor: s.color + '10' }]}>
                  <Text style={[dash.chipN, { color: s.color }]}>{s.count}</Text>
                  <Text style={[dash.chipL, { color: s.color + '90' }]}>{s.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Tab bar */}
            <TabBar active={tab} onChange={setTab} counts={tabCounts} />

            {/* Tab content */}
            <View style={{ flex: 1 }}>
              {renderTab()}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const dash = StyleSheet.create({
  sheet: {
    backgroundColor: C.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: 'hidden', maxHeight: '92%', minHeight: 400,
    ...Platform.select({ ios: { shadowColor: C.red, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 14 }, android: { elevation: 20 } }),
  },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerTitle:{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  headerSub:  { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 },
  iconBtn:    { width: 32, height: 32, borderRadius: 8, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  chip:       { alignItems: 'center', borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
  chipN:      { fontFamily: MONO, fontSize: 14, fontWeight: '900', lineHeight: 16 },
  chipL:      { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: C.mid },
  emptySub:   { fontFamily: MONO, fontSize: 9, color: C.dim },
  fixAllBtn:  { backgroundColor: C.cyan, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  fixAllTxt:  { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

const af2 = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderLeftWidth: 2.5, paddingLeft: 10, paddingVertical: 8, paddingRight: 8, backgroundColor: C.surf2, borderRadius: 9, marginBottom: 7 },
  msg:    { fontFamily: MONO, fontSize: 9.5, color: C.text, lineHeight: 13 },
  result: { fontFamily: MONO, fontSize: 8.5, marginTop: 3 },
  time:   { fontFamily: MONO, fontSize: 7.5, color: C.mid, marginTop: 2 },
});

const sec = StyleSheet.create({
  scanBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 10, borderColor: C.cyan + '55', backgroundColor: C.cyan + '0A', paddingVertical: 11, marginBottom: 4 },
  scanBtnTxt:  { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.cyan, letterSpacing: 0.5 },
  sectionTitle:{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: C.mid, letterSpacing: 1.5, marginBottom: 4, marginTop: 4 },
});

export default RuntimeDiagnosticsHUD;
