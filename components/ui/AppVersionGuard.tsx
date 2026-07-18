/**
 * AppVersionGuard — Version management, forced update prompts, changelog display
 * Inspired by AppVersionGuard app. Checks version against server, shows
 * upgrade banners, build metadata, and release notes. Fully Butler AI styled.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  Animated, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const C = {
  bg:       '#010306',
  surface:  '#070D16',
  surfHi:   '#0A1522',
  cyan:     '#00E5FF',
  green:    '#00FF88',
  amber:    '#FFB020',
  red:      '#FF3131',
  purple:   '#CC44FF',
  text:     '#C8E4F0',
  textMid:  '#6A8EA8',
  textDim:  '#304558',
  border:   'rgba(0,229,255,0.18)',
};

// ─── APP VERSION CONFIG ─────────────────────────────────────────
export const APP_VERSION = {
  major: 7,
  minor: 3,
  patch: 0,
  build: 2026062301,
  display: '7.3.0',
  codename: 'NEXUS',
  releaseDate: '2026-06-23',
  minServerVersion: '20.0.0',
  packageName: 'com.butlerai.pc.automation',
};

const CHANGELOG: { version: string; date: string; color: string; changes: { type: 'feat' | 'fix' | 'perf' | 'security'; text: string }[] }[] = [
  {
    version: '7.3.0',
    date: '2026-06-23',
    color: C.cyan,
    changes: [
      { type: 'feat', text: 'Activity Logs page — unified feed from all 7 previously silent services' },
      { type: 'feat', text: 'NET OPS page — LAN scanner, port audit, ping tester, clipboard bridge' },
      { type: 'feat', text: 'AppVersionGuard — version management, forced update, changelog' },
      { type: 'feat', text: 'Titan Protocol security card — HMAC health, session scoring' },
      { type: 'perf', text: 'Startup optimized — onboarding defaults to true, no blocking gates' },
      { type: 'fix',  text: 'RemoteAccessHomeBanner — URL() crash on Hermes/React Native fixed' },
      { type: 'fix',  text: 'CategoryBars hooks-in-map violation fixed via CategoryBarRow component' },
      { type: 'security', text: 'Auth header always sent in executeOnServer multi-port fallback loop' },
    ],
  },
  {
    version: '7.2.0',
    date: '2026-06-20',
    color: C.green,
    changes: [
      { type: 'feat', text: 'Omega Scanner — full self-healing intelligence panel with fix log' },
      { type: 'feat', text: 'Startup Audit Tool — auto-detects all crash-causing code patterns' },
      { type: 'feat', text: 'MasterJsonPanel — 2-button EXPORT/IMPORT with full AI system prompt' },
      { type: 'perf', text: '3-col grid law applied to all pages — nexushome, builder, scripts' },
      { type: 'fix',  text: 'QR modal LAN ONLY button AnimatedBorderColor crash on Android fixed' },
    ],
  },
  {
    version: '7.1.0',
    date: '2026-06-15',
    color: C.amber,
    changes: [
      { type: 'feat', text: 'Script Streak Tracker — daily execution streak with best score badge' },
      { type: 'feat', text: 'PC Library integration — browse and run scripts directly from server' },
      { type: 'feat', text: 'AI Script Builder — describe in English, Ollama writes the Python' },
      { type: 'perf', text: 'ScriptsDashStrip — live connection, success rate, sparkline, streak' },
      { type: 'security', text: 'Token auto-refresh on 401 — reconnects and retries transparently' },
    ],
  },
];

const VERSION_CHECK_KEY = '@butler_version_last_check_v1';
const DISMISSED_VERSION_KEY = '@butler_version_dismissed_v1';

export type VersionStatus = 'current' | 'update_available' | 'force_update' | 'server_mismatch' | 'unknown';

export interface VersionCheckResult {
  status: VersionStatus;
  currentVersion: string;
  latestVersion?: string;
  serverVersion?: string;
  message?: string;
  forceUpdate?: boolean;
  playStoreUrl?: string;
  checkedAt: number;
}

// ─── VERSION UTILS ──────────────────────────────────────────────
function parseVersion(v: string): [number, number, number] {
  const parts = (v || '0.0.0').split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function compareVersions(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = parseVersion(a);
  const [bMaj, bMin, bPatch] = parseVersion(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}

export async function checkServerVersion(): Promise<VersionCheckResult> {
  try {
    const ip = serverConnection.getIP();
    const port = serverConnection.getPort();
    const token = serverConnection.getToken();
    const now = Date.now();

    if (!ip || !port) {
      return { status: 'unknown', currentVersion: APP_VERSION.display, checkedAt: now };
    }

    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 6000);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`http://${ip}:${port}/api/version`, { headers, signal: ctrl.signal });
    if (!res.ok) return { status: 'unknown', currentVersion: APP_VERSION.display, checkedAt: now };

    const data = await res.json();
    const serverVer: string = data.version || data.server_version || '0.0.0';
    const requiredApp: string = data.min_app_version || '0.0.0';

    await AsyncStorage.setItem(VERSION_CHECK_KEY, JSON.stringify({ ts: now, serverVersion: serverVer }));

    // Check if server requires a newer app version
    if (compareVersions(APP_VERSION.display, requiredApp) < 0) {
      return {
        status: 'force_update',
        currentVersion: APP_VERSION.display,
        latestVersion: requiredApp,
        serverVersion: serverVer,
        message: `Server requires app v${requiredApp}+. Please update to continue.`,
        forceUpdate: true,
        checkedAt: now,
      };
    }

    // Check if server is older than minimum required
    if (compareVersions(serverVer, APP_VERSION.minServerVersion) < 0) {
      return {
        status: 'server_mismatch',
        currentVersion: APP_VERSION.display,
        serverVersion: serverVer,
        message: `Server v${serverVer} is outdated. Minimum required: v${APP_VERSION.minServerVersion}. Update butler_server.py.`,
        checkedAt: now,
      };
    }

    return {
      status: 'current',
      currentVersion: APP_VERSION.display,
      serverVersion: serverVer,
      checkedAt: now,
    };
  } catch {
    return {
      status: 'unknown',
      currentVersion: APP_VERSION.display,
      checkedAt: Date.now(),
    };
  }
}

// ─── CHANGELOG MODAL ────────────────────────────────────────────
function ChangelogModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const TYPE_CONFIG = {
    feat:     { color: C.cyan,   label: 'FEAT',     icon: 'auto-awesome' },
    fix:      { color: C.green,  label: 'FIX',      icon: 'check-circle-outline' },
    perf:     { color: C.amber,  label: 'PERF',     icon: 'speed' },
    security: { color: C.red,    label: 'SEC',      icon: 'security' },
  } as const;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={cls.header}>
          <TouchableOpacity onPress={onClose} style={cls.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color={C.cyan} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={cls.title}>RELEASE <Text style={{ color: C.cyan }}>NOTES</Text></Text>
            <Text style={cls.subtitle}>Butler AI v{APP_VERSION.display} · {APP_VERSION.codename}</Text>
          </View>
          <View style={cls.buildBadge}>
            <Text style={cls.buildTxt}>BUILD {APP_VERSION.build}</Text>
          </View>
        </View>

        {/* Version stats strip */}
        <View style={cls.statsStrip}>
          {[
            { label: 'VERSION',  value: APP_VERSION.display, color: C.cyan   },
            { label: 'CODENAME', value: APP_VERSION.codename, color: C.purple },
            { label: 'RELEASED', value: APP_VERSION.releaseDate, color: C.amber },
            { label: 'MIN SRV',  value: APP_VERSION.minServerVersion, color: C.green },
          ].map((s, i) => (
            <View key={i} style={[cls.statCell, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={[cls.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={cls.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {CHANGELOG.map((release, ri) => (
            <View key={ri} style={[cls.releaseCard, { borderTopColor: release.color }]}>
              {/* Release header */}
              <View style={cls.releaseHeader}>
                <View style={[cls.versionBadge, { borderColor: release.color + '60', backgroundColor: release.color + '12' }]}>
                  <Text style={[cls.versionTxt, { color: release.color }]}>v{release.version}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[cls.releaseDate, { color: release.color }]}>{release.date}</Text>
                  {ri === 0 && (
                    <View style={[cls.latestBadge, { borderColor: C.green + '50', backgroundColor: C.green + '10' }]}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.green }} />
                      <Text style={[cls.latestTxt, { color: C.green }]}>CURRENT</Text>
                    </View>
                  )}
                </View>
                <Text style={cls.changeCount}>{release.changes.length} changes</Text>
              </View>

              {/* Changes list */}
              <View style={{ gap: 6 }}>
                {release.changes.map((change, ci) => {
                  const cfg = TYPE_CONFIG[change.type];
                  return (
                    <View key={ci} style={[cls.changeRow, { borderLeftColor: cfg.color }]}>
                      <View style={[cls.typeBadge, { borderColor: cfg.color + '55', backgroundColor: cfg.color + '10' }]}>
                        <MaterialIcons name={cfg.icon as any} size={9} color={cfg.color} />
                        <Text style={[cls.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      <Text style={cls.changeText}>{change.text}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Package info */}
          <View style={[cls.releaseCard, { borderTopColor: C.textDim }]}>
            <View style={cls.releaseHeader}>
              <MaterialIcons name="info-outline" size={16} color={C.textMid} />
              <Text style={[cls.releaseDate, { color: C.textMid }]}>BUILD INFO</Text>
            </View>
            {[
              ['Package',      APP_VERSION.packageName],
              ['Build Number', String(APP_VERSION.build)],
              ['Platform',     Platform.OS + ' ' + Platform.Version],
              ['JS Engine',    (global as any).HermesInternal ? 'Hermes' : 'JSC'],
            ].map(([k, v], i) => (
              <View key={i} style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: C.border }}>
                <Text style={{ width: 100, fontSize: 10, color: C.textMid, fontFamily: MONO }}>{k}</Text>
                <Text style={{ flex: 1, fontSize: 10, color: C.text, fontFamily: MONO }}>{v}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const cls = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 32, paddingBottom: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 18, fontWeight: '900', color: C.text, fontFamily: MONO },
  subtitle:     { fontSize: 9, color: C.textMid, fontFamily: MONO, marginTop: 2 },
  buildBadge:   { borderWidth: 1, borderRadius: 8, borderColor: C.border, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: C.surfHi },
  buildTxt:     { fontSize: 8, fontWeight: '900', color: C.textMid, fontFamily: MONO, letterSpacing: 0.5 },
  statsStrip:   { flexDirection: 'row', backgroundColor: C.surfHi, borderBottomWidth: 1, borderBottomColor: C.border },
  statCell:     { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statVal:      { fontSize: 11, fontWeight: '900', fontFamily: MONO },
  statLabel:    { fontSize: 7, color: C.textDim, fontFamily: MONO, letterSpacing: 0.8, marginTop: 2 },
  releaseCard:  { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderTopWidth: 3, borderColor: C.border, padding: 14 },
  releaseHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  versionBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  versionTxt:   { fontSize: 13, fontWeight: '900', fontFamily: MONO },
  releaseDate:  { fontSize: 10, fontFamily: MONO, flex: 1 },
  changeCount:  { fontSize: 9, color: C.textDim, fontFamily: MONO },
  latestBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, alignSelf: 'flex-start' },
  latestTxt:    { fontSize: 8, fontWeight: '900', fontFamily: MONO },
  changeRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderLeftWidth: 2, paddingLeft: 8, paddingVertical: 4 },
  typeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, flexShrink: 0 },
  typeLabel:    { fontSize: 7.5, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.5 },
  changeText:   { flex: 1, fontSize: 10, color: C.textMid, fontFamily: MONO, lineHeight: 15 },
});

// ─── VERSION BANNER (compact, inline) ───────────────────────────
export function AppVersionBanner() {
  const [result, setResult] = useState<VersionCheckResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkServerVersion().then(r => {
      setResult(r);
      if (r.status !== 'current' && r.status !== 'unknown') {
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
          Animated.timing(opacAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    });
  }, []);

  if (!result || result.status === 'current' || result.status === 'unknown' || dismissed) {
    return null;
  }

  const isForce = result.forceUpdate;
  const color = isForce ? C.red : result.status === 'server_mismatch' ? C.amber : C.cyan;
  const icon = isForce ? 'system-update' : 'update';

  return (
    <>
      <ChangelogModal visible={showChangelog} onClose={() => setShowChangelog(false)} />
      <Animated.View style={[vb.wrap, { borderColor: color + '60', backgroundColor: color + '08', transform: [{ translateY: slideAnim }], opacity: opacAnim }]}>
        <View style={[vb.iconBox, { borderColor: color + '50', backgroundColor: color + '12' }]}>
          <MaterialIcons name={icon as any} size={18} color={color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[vb.title, { color }]}>
            {isForce ? 'UPDATE REQUIRED' : result.status === 'server_mismatch' ? 'SERVER OUTDATED' : 'UPDATE AVAILABLE'}
          </Text>
          <Text style={vb.msg} numberOfLines={2}>{result.message || `v${APP_VERSION.display} installed · ${result.latestVersion ? `v${result.latestVersion} available` : ''}`}</Text>
        </View>
        {isForce ? (
          <TouchableOpacity
            style={[vb.actionBtn, { backgroundColor: color }]}
            onPress={() => { haptics.heavy(); Linking.openURL('https://play.google.com/store/apps/details?id=com.butlerai.pc.automation').catch(() => {}); }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="download" size={14} color="#000" />
            <Text style={[vb.actionTxt, { color: '#000' }]}>UPDATE</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => { haptics.light(); setShowChangelog(true); }}
              style={[vb.actionBtn, { borderColor: color + '60', backgroundColor: color + '12', borderWidth: 1 }]}
              activeOpacity={0.8}
            >
              <Text style={[vb.actionTxt, { color }]}>NOTES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { haptics.light(); setDismissed(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={16} color={C.textDim} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const vb = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 5 } }) },
  iconBox:   { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:     { fontSize: 11, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.8 },
  msg:       { fontSize: 9, color: C.textMid, fontFamily: MONO, lineHeight: 13 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0 },
  actionTxt: { fontSize: 10, fontWeight: '900', fontFamily: MONO },
});

// ─── VERSION INFO CARD (for settings page) ──────────────────────
export function AppVersionCard() {
  const [showChangelog, setShowChangelog] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VersionCheckResult | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 1100, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  const handleCheck = useCallback(async () => {
    haptics.medium();
    setChecking(true);
    const r = await checkServerVersion();
    setResult(r);
    setChecking(false);
    haptics[r.status === 'current' ? 'success' : 'warning']();
  }, []);

  const statusColor = !result ? C.textDim
    : result.status === 'current' ? C.green
    : result.status === 'force_update' ? C.red
    : result.status === 'server_mismatch' ? C.amber
    : C.textDim;

  const statusLabel = !result ? 'TAP CHECK'
    : result.status === 'current' ? '✓ UP TO DATE'
    : result.status === 'force_update' ? '⚠ UPDATE REQUIRED'
    : result.status === 'server_mismatch' ? '⚠ SERVER OUTDATED'
    : '— UNKNOWN';

  return (
    <>
      <ChangelogModal visible={showChangelog} onClose={() => setShowChangelog(false)} />
      <View style={vc.card}>
        {/* Top bar */}
        <View style={[vc.topBar, { backgroundColor: C.cyan }]} />
        {/* Header */}
        <View style={vc.header}>
          <View style={[vc.iconBox, { borderColor: C.cyan + '60', backgroundColor: C.cyan + '10' }]}>
            <MaterialCommunityIcons name="application-cog" size={22} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[vc.title, { color: C.cyan }]}>APP VERSION GUARD</Text>
            <Text style={vc.sub}>v{APP_VERSION.display} · {APP_VERSION.codename} · Build {APP_VERSION.build}</Text>
          </View>
          {/* Status pill */}
          <Animated.View style={[vc.statusPill, { borderColor: statusColor + '50', backgroundColor: statusColor + '10', opacity: result ? 1 : pulseAnim }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            <Text style={[vc.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
          </Animated.View>
        </View>

        {/* Version matrix */}
        <View style={vc.matrix}>
          {[
            { label: 'APP',       value: APP_VERSION.display,           color: C.cyan   },
            { label: 'SERVER',    value: result?.serverVersion || '—',  color: result?.status === 'server_mismatch' ? C.amber : C.green },
            { label: 'MIN SRV',  value: APP_VERSION.minServerVersion,   color: C.textMid },
            { label: 'BUILD',    value: String(APP_VERSION.build).slice(-6), color: C.textMid },
          ].map((m, i) => (
            <View key={i} style={[vc.matrixCell, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={[vc.matrixVal, { color: m.color }]}>{m.value}</Text>
              <Text style={vc.matrixLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Server mismatch warning */}
        {result?.status === 'server_mismatch' && (
          <View style={[vc.warnBanner, { borderColor: C.amber + '40', backgroundColor: C.amber + '08' }]}>
            <MaterialIcons name="warning" size={13} color={C.amber} />
            <Text style={[vc.warnText, { color: C.amber }]}>{result.message}</Text>
          </View>
        )}
        {result?.status === 'force_update' && (
          <View style={[vc.warnBanner, { borderColor: C.red + '40', backgroundColor: C.red + '08' }]}>
            <MaterialIcons name="error" size={13} color={C.red} />
            <Text style={[vc.warnText, { color: C.red }]}>{result.message}</Text>
          </View>
        )}
        {result?.status === 'current' && (
          <View style={[vc.warnBanner, { borderColor: C.green + '30', backgroundColor: C.green + '06' }]}>
            <MaterialIcons name="check-circle" size={13} color={C.green} />
            <Text style={[vc.warnText, { color: C.green }]}>All version requirements satisfied.</Text>
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[vc.btn, { borderColor: C.cyan + '50', backgroundColor: C.cyan + '0A', flex: 2 }]}
            onPress={handleCheck} disabled={checking} activeOpacity={0.8}
          >
            {checking
              ? <ActivityIndicator size="small" color={C.cyan} style={{ transform: [{ scale: 0.75 }] }} />
              : <MaterialIcons name="sync" size={14} color={C.cyan} />}
            <Text style={[vc.btnTxt, { color: C.cyan }]}>{checking ? 'CHECKING...' : 'CHECK SERVER'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[vc.btn, { borderColor: C.purple + '50', backgroundColor: C.purple + '0A', flex: 2 }]}
            onPress={() => { haptics.light(); setShowChangelog(true); }} activeOpacity={0.8}
          >
            <MaterialIcons name="list-alt" size={14} color={C.purple} />
            <Text style={[vc.btnTxt, { color: C.purple }]}>CHANGELOG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[vc.btn, { borderColor: C.amber + '40', backgroundColor: C.amber + '08', flex: 1 }]}
            onPress={() => { haptics.medium(); Linking.openURL('https://github.com/shawnjan-cmd/CommandCube').catch(() => {}); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="github" size={14} color={C.amber} />
            <Text style={[vc.btnTxt, { color: C.amber }]}>SRV</Text>
          </TouchableOpacity>
        </View>

        {/* Last checked */}
        {result?.checkedAt ? (
          <Text style={vc.checkedAt}>
            Last checked: {new Date(result.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        ) : null}
      </View>
    </>
  );
}

const vc = StyleSheet.create({
  card:        { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden', marginBottom: 14,
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 14 }, android: { elevation: 6 } }) },
  topBar:      { height: 3 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox:     { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontSize: 11, fontWeight: '900', fontFamily: MONO, letterSpacing: 1.5 },
  sub:         { fontSize: 9, color: C.textMid, fontFamily: MONO, marginTop: 2 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flexShrink: 0 },
  statusTxt:   { fontSize: 8, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.5 },
  matrix:      { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  matrixCell:  { flex: 1, alignItems: 'center', paddingVertical: 10 },
  matrixVal:   { fontSize: 12, fontWeight: '900', fontFamily: MONO },
  matrixLabel: { fontSize: 7, color: C.textDim, fontFamily: MONO, letterSpacing: 0.8, marginTop: 2 },
  warnBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, margin: 12, marginTop: 10, marginBottom: 4, padding: 10 },
  warnText:    { flex: 1, fontSize: 10, fontFamily: MONO, lineHeight: 15 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingVertical: 10, marginHorizontal: 12, marginBottom: 4 },
  btnTxt:      { fontSize: 10, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.3 },
  checkedAt:   { fontSize: 8, color: C.textDim, fontFamily: MONO, textAlign: 'center', paddingBottom: 10 },
});
