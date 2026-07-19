/**
 * BUTLER AI — NET OPS CENTER v2.0
 * Fresh cyberpunk redesign · token system
 * LAN scanner · Port audit · Ping tester · Clipboard bridge
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Animated, ActivityIndicator, Dimensions, TextInput, Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { useConnectionStatus } from '@/hooks/useConnection';
import { serverConnection } from '@/services/serverConnection';
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import { quickScan, diagnosePeer, FoundServer, ScanProgress } from '@/services/lanScanner';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import { useCosmetic } from '@/contexts/CosmeticContext';

const MONO: any = FONT.mono;
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;
const GAP = 8;
const COL3 = Math.floor((SW - PAD * 2 - GAP * 2) / 3);

// ─── PORT DEFINITIONS ─────────────────────────────────────────────
const WELL_KNOWN_PORTS = [
  { port: 22,   service: 'SSH',      risk: 'high',     note: 'Remote shell access'            },
  { port: 23,   service: 'Telnet',   risk: 'critical', note: 'Unencrypted legacy shell'       },
  { port: 80,   service: 'HTTP',     risk: 'low',      note: 'Web server (unencrypted)'       },
  { port: 135,  service: 'RPC',      risk: 'high',     note: 'Windows RPC endpoint'           },
  { port: 443,  service: 'HTTPS',    risk: 'low',      note: 'Encrypted web traffic'          },
  { port: 445,  service: 'SMB',      risk: 'critical', note: 'Windows shares (EternalBlue)'   },
  { port: 3306, service: 'MySQL',    risk: 'critical', note: 'Database exposed to network'    },
  { port: 3389, service: 'RDP',      risk: 'high',     note: 'Remote desktop access'          },
  { port: 5900, service: 'VNC',      risk: 'high',     note: 'Remote desktop (unencrypted)'   },
  { port: 8080, service: 'HTTP-Alt', risk: 'low',      note: 'Alternative web port'           },
  { port: 11434,service: 'Ollama',   risk: 'low',      note: 'Local AI model server'          },
];

const RISK_COLOR: Record<string, string> = { critical: COLOR.red, high: COLOR.amber, medium: COLOR.cyan, low: COLOR.green };

// ─── MICRO ATOMS ──────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 5000) return 'just now';
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  return `${Math.floor(d / 3600000)}h ago`;
}

// ─── HEADER ───────────────────────────────────────────────────────
const TABS_CFG = [
  { key: 'scanner', label: 'LAN',   icon: 'radar',          color: COLOR.teal    },
  { key: 'ports',   label: 'PORTS', icon: 'security',       color: COLOR.amber   },
  { key: 'ping',    label: 'PING',  icon: 'network-ping',   color: COLOR.cyan    },
  { key: 'clip',    label: 'BRIDGE',icon: 'content-paste',  color: COLOR.magenta },
] as const;
type TabKey = typeof TABS_CFG[number]['key'];

function NetOpsHeader({ safeTop, isConn, activeTab, onTabChange }: { safeTop: number; isConn: boolean; activeTab: TabKey; onTabChange: (t: TabKey) => void }) {
  const scanA = useRef(new Animated.Value(-200)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 200, duration: 3200, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -200, duration: 0, useNativeDriver: false }),
      Animated.delay(5000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  const cc = isConn ? COLOR.green : COLOR.amber;
  return (
    <View style={[noh.root, { paddingTop: safeTop }]}>
      <Animated.View pointerEvents="none" style={[noh.scan, { transform: [{ translateX: scanA }] }]} />
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[COLOR.teal, COLOR.cyan, COLOR.amber, COLOR.green, COLOR.magenta].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <View style={noh.row}>
        <View style={[noh.orbOuter, { borderColor: COLOR.teal + '60', backgroundColor: glow(COLOR.teal, 8) }]}>
          <MaterialCommunityIcons name="radar" size={22} color={COLOR.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={noh.eyebrow}>NETWORK OPS CENTER</Text>
          <Text style={noh.brand}>
            <Text style={{ color: COLOR.teal }}>NET</Text>
            <Text style={{ color: '#FFF' }}> OPS</Text>
          </Text>
          <Text style={noh.sub}>LAN · ports · ping · clipboard bridge</Text>
        </View>
        <View style={[noh.connPill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
          <PulseDot color={cc} size={5} />
          <Text style={[noh.connTxt, { color: cc }]}>{isConn ? 'ONLINE' : 'LOCAL'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLOR.teal + '18' }}>
        {TABS_CFG.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity key={tab.key} onPress={() => { haptics.selection(); onTabChange(tab.key); }} activeOpacity={0.8}
              style={[noh.tab, isActive && { backgroundColor: glow(tab.color, 10), borderBottomColor: tab.color }]}>
              <MaterialIcons name={tab.icon as any} size={12} color={isActive ? tab.color : COLOR.dim} />
              <Text style={[noh.tabTxt, { color: isActive ? tab.color : COLOR.dim }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const noh = StyleSheet.create({
  root:     { backgroundColor: '#06080D', overflow: 'hidden' },
  scan:     { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(16,217,160,0.025)', zIndex: 0 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 10, zIndex: 1 },
  orbOuter: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eyebrow:  { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', color: COLOR.teal + '80', letterSpacing: 2, marginBottom: 2 },
  brand:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  sub:      { fontFamily: MONO, fontSize: 9.5, color: COLOR.mid, marginTop: 2 },
  connPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, flexShrink: 0 },
  connTxt:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  tab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabTxt:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});

// ─── STAT CELL ─────────────────────────────────────────────────────
function StatCell({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[sc.cell, { borderTopColor: color, borderColor: color + '30' }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '70' }} />
      <MaterialIcons name={icon as any} size={15} color={color} />
      <Text style={[sc.val, { color }]} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  cell:  { width: COL3, backgroundColor: COLOR.surf2, borderRadius: 10, borderWidth: 1.5, borderTopWidth: 3, padding: 10, gap: 3, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  val:   { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24, textAlign: 'center' },
  label: { fontFamily: MONO, fontSize: 8.5, fontWeight: '700', color: COLOR.dim, letterSpacing: 0.8, textAlign: 'center' },
});

// ─── LAN SCANNER ─────────────────────────────────────────────────
function LANTab({ isConn }: { isConn: boolean }) {
  const [scanning,  setScanning]  = useState(false);
  const [progress,  setProgress]  = useState<ScanProgress | null>(null);
  const [servers,   setServers]   = useState<FoundServer[]>([]);
  const [lastScan,  setLastScan]  = useState(0);
  const abortRef = useRef({ aborted: false });
  const hasAutoScanned = useRef(false);

  useFocusEffect(useCallback(() => {
    if (!hasAutoScanned.current) { hasAutoScanned.current = true; startScan(); }
  }, []));

  const startScan = useCallback(async () => {
    haptics.medium();
    abortRef.current = { aborted: false };
    setScanning(true); setServers([]); setProgress(null);
    try {
      const found = await quickScan(p => setProgress(p), abortRef.current);
      setServers(found); setLastScan(Date.now()); haptics.success();
    } catch (e: any) { autoErrorLogger.log('warn', 'NetOps', `Scan failed: ${e?.message}`); }
    finally { setScanning(false); }
  }, []);

  const progressPct = progress ? Math.round((progress.scanned / Math.max(progress.total, 1)) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <StatCell icon="router"      label="FOUND"    value={String(servers.length)}                                              color={servers.length > 0 ? COLOR.green : COLOR.mid} />
        <StatCell icon="wifi"        label="PROGRESS" value={scanning ? `${progressPct}%` : lastScan > 0 ? '100%' : '--'}        color={COLOR.teal}  />
        <StatCell icon="access-time" label="LAST SCAN" value={lastScan > 0 ? timeAgo(lastScan) : 'never'}                        color={COLOR.amber} />
      </View>
      {(scanning || progress) ? (
        <View style={[lst.progressWrap, { borderColor: COLOR.teal + '35' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '700', color: COLOR.teal, marginBottom: 6 }}>
            {scanning ? `SCANNING ${progress?.currentSubnet || '…'}` : 'SCAN COMPLETE'} · {progress?.scanned || 0}/{progress?.total || 0}
          </Text>
          <View style={{ height: 6, backgroundColor: COLOR.teal + '18', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', borderRadius: 4, backgroundColor: scanning ? COLOR.teal : COLOR.green, width: `${progressPct}%` as any }} />
          </View>
        </View>
      ) : null}
      <TouchableOpacity onPress={scanning ? () => { abortRef.current.aborted = true; setScanning(false); } : startScan} activeOpacity={0.85}
        style={[lst.scanBtn, { backgroundColor: scanning ? COLOR.red : COLOR.teal }]}>
        {scanning ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="radar" size={18} color="#000" />}
        <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.8 }}>{scanning ? 'STOP SCAN' : 'QUICK SCAN LAN'}</Text>
      </TouchableOpacity>
      {servers.length > 0 ? (
        <View style={{ gap: 8 }}>
          {servers.map((s, i) => {
            const isButler = s.info?.status || s.info?.version;
            const col = isButler ? COLOR.green : COLOR.teal;
            return (
              <View key={i} style={[lst.srvCard, { borderColor: col + '45' }]}>
                <View style={[{ height: 3, backgroundColor: col }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
                  <View style={[lst.srvIcon, { borderColor: col + '50', backgroundColor: glow(col, 10) }]}>
                    <MaterialCommunityIcons name={isButler ? 'robot-happy' : 'server-network'} size={20} color={col} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontFamily: MONO, fontSize: 15, fontWeight: '900', color: col }}>{s.ip}</Text>
                      <View style={[{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderColor: col + '55', backgroundColor: glow(col, 10) }]}>
                        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: col }}>:{s.port}</Text>
                      </View>
                      {isButler && <View style={[{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderColor: COLOR.green + '60', backgroundColor: glow(COLOR.green, 10) }]}><Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.green }}>BUTLER</Text></View>}
                    </View>
                    <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.mid, marginTop: 3 }}>Latency: <Text style={{ color: col }}>{s.latencyMs}ms</Text></Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : !scanning && lastScan > 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <MaterialCommunityIcons name="lan-disconnect" size={40} color={COLOR.dim} />
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.mid }}>NO SERVERS FOUND</Text>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.dim, textAlign: 'center', lineHeight: 15, maxWidth: 260 }}>Ensure butler_server.py is running and both devices are on the same Wi-Fi</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
const lst = StyleSheet.create({
  progressWrap: { backgroundColor: COLOR.surf, borderRadius: 10, borderWidth: 1, padding: 12 },
  scanBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 16,
    ...Platform.select({ ios: { shadowColor: COLOR.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 14 }, android: { elevation: 8 } }) },
  srvCard:      { backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
  srvIcon:      { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── PORT AUDIT ───────────────────────────────────────────────────
function PortTab({ isConn }: { isConn: boolean }) {
  const [scanning,   setScanning]   = useState(false);
  const [results,    setResults]    = useState<{ port: number; open: boolean; latencyMs: number }[]>([]);
  const [targetIP,   setTargetIP]   = useState('');
  const [lastScanTs, setLastScanTs] = useState(0);

  useFocusEffect(useCallback(() => {
    try { const ip = serverConnection.getIP(); if (ip) setTargetIP(ip); } catch {}
  }, []));

  const openPorts = results.filter(r => r.open);
  const critCount = openPorts.filter(r => WELL_KNOWN_PORTS.find(wp => wp.port === r.port)?.risk === 'critical').length;

  const runAudit = useCallback(async () => {
    const ip = targetIP.trim() || serverConnection.getIP() || '127.0.0.1';
    haptics.medium(); setScanning(true); setResults([]);
    const probes = WELL_KNOWN_PORTS.map(async wp => {
      const t0 = Date.now();
      try {
        const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 1500);
        const res  = await fetch(`http://${ip}:${wp.port}`, { signal: ctrl.signal });
        clearTimeout(tid);
        return { port: wp.port, open: res.status < 600, latencyMs: Date.now() - t0 };
      } catch { return { port: wp.port, open: false, latencyMs: Date.now() - t0 }; }
    });
    const all = await Promise.all(probes);
    setResults(all); setLastScanTs(Date.now()); haptics.success(); setScanning(false);
  }, [targetIP]);

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <StatCell icon="lock-open" label="OPEN"     value={String(openPorts.length)}  color={openPorts.length > 0 ? COLOR.amber : COLOR.green} />
        <StatCell icon="warning"   label="CRITICAL" value={String(critCount)}         color={critCount > 0 ? COLOR.red : COLOR.mid} />
        <StatCell icon="security"  label="STATUS"   value={results.length > 0 ? 'DONE' : '--'} color={COLOR.teal} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLOR.surf, borderRadius: 10, borderWidth: 1, borderColor: COLOR.teal + '40', paddingHorizontal: 12, paddingVertical: 10 }}>
        <MaterialIcons name="language" size={14} color={COLOR.teal} />
        <TextInput style={{ flex: 1, fontFamily: MONO, fontSize: 13, color: COLOR.text }} value={targetIP} onChangeText={setTargetIP} placeholder="Target IP (blank = PC server)" placeholderTextColor={COLOR.dim} autoCapitalize="none" autoCorrect={false} />
      </View>
      <TouchableOpacity onPress={runAudit} disabled={scanning || (!isConn && !targetIP)} activeOpacity={0.85}
        style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLOR.amber, borderRadius: 14, paddingVertical: 14, opacity: scanning || (!isConn && !targetIP) ? 0.45 : 1 }]}>
        {scanning ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="security" size={17} color="#000" />}
        <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.8 }}>{scanning ? 'SCANNING...' : 'RUN PORT AUDIT'}</Text>
      </TouchableOpacity>
      {results.length > 0 ? (
        <View style={{ gap: 5 }}>
          {WELL_KNOWN_PORTS.map(wp => {
            const status = results.find(r => r.port === wp.port);
            const isOpen = status?.open ?? false;
            const riskCol = RISK_COLOR[wp.risk] || COLOR.mid;
            return (
              <View key={wp.port} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 3, borderLeftColor: isOpen ? riskCol : COLOR.border, paddingLeft: 10, paddingRight: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLOR.border, backgroundColor: COLOR.surf }]}>
                <View style={[{ width: 50, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderColor: (isOpen ? riskCol : COLOR.mid) + '50', backgroundColor: glow(isOpen ? riskCol : COLOR.mid, 8) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: isOpen ? riskCol : COLOR.mid }}>{wp.port}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: isOpen ? COLOR.text : COLOR.mid }}>{wp.service}</Text>
                    {isOpen && <View style={[{ borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, borderColor: riskCol + '60', backgroundColor: glow(riskCol, 12) }]}><Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: riskCol }}>{wp.risk.toUpperCase()}</Text></View>}
                  </View>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.dim, marginTop: 2 }} numberOfLines={1}>{wp.note}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOpen ? riskCol : COLOR.dim + '40' }} />
                  {status ? <Text style={{ fontFamily: MONO, fontSize: 9, color: isOpen ? riskCol : COLOR.dim }}>{isOpen ? `${status.latencyMs}ms` : 'closed'}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : !scanning ? (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <MaterialIcons name="security" size={40} color={COLOR.dim} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim, letterSpacing: 0.8 }}>TAP RUN PORT AUDIT TO START</Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <ActivityIndicator size="large" color={COLOR.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.mid }}>PROBING {WELL_KNOWN_PORTS.length} PORTS...</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── PING TESTER ─────────────────────────────────────────────────
function PingTab({ isConn }: { isConn: boolean }) {
  const [target,  setTarget]  = useState('');
  const [pinging, setPinging] = useState(false);
  const [results, setResults] = useState<{ ts: number; latency: number; ok: boolean }[]>([]);
  const [autoMode, setAutoMode] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(useCallback(() => {
    try {
      const ip = serverConnection.getIP(); const pt = serverConnection.getPort();
      if (ip && pt) setTarget(`${ip}:${pt}`); else if (ip) setTarget(ip);
    } catch {}
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []));

  const doPing = useCallback(async (host: string) => {
    const [ip, portStr] = host.includes(':') ? host.split(':') : [host, '80'];
    const port = parseInt(portStr, 10) || 80;
    const t0 = Date.now();
    try {
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 4000);
      await fetch(`http://${ip}:${port}/api/ping`, { signal: ctrl.signal });
      clearTimeout(tid);
      return { ts: Date.now(), latency: Date.now() - t0, ok: true };
    } catch {
      try {
        const ctrl2 = new AbortController(); const tid2 = setTimeout(() => ctrl2.abort(), 2000);
        await fetch(`http://${ip}:${port}/`, { signal: ctrl2.signal });
        clearTimeout(tid2);
        return { ts: Date.now(), latency: Date.now() - t0, ok: true };
      } catch { return { ts: Date.now(), latency: Date.now() - t0, ok: false }; }
    }
  }, []);

  const ping = useCallback(async () => {
    const host = target.trim();
    if (!host) return;
    haptics.light(); setPinging(true);
    const r = await doPing(host);
    setResults(prev => [r, ...prev].slice(0, 20));
    setPinging(false);
    if (r.ok) haptics.light(); else haptics.warning();
  }, [target, doPing]);

  useEffect(() => {
    if (autoMode) { autoRef.current = setInterval(() => ping(), 3000); }
    else { if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; } }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoMode, ping]);

  const latencies = results.filter(r => r.ok).map(r => r.latency);
  const avg = latencies.length ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length) : 0;
  const maxLat = Math.max(...latencies, 1);
  const lossCount = results.filter(r => !r.ok).length;
  const lossPct = results.length ? Math.round((lossCount / results.length) * 100) : 0;
  const qualColor = avg === 0 ? COLOR.mid : avg < 50 ? COLOR.green : avg < 150 ? COLOR.amber : COLOR.red;

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <StatCell icon="timer"           label="AVG"  value={avg > 0 ? `${avg}ms` : '--'}                       color={qualColor} />
        <StatCell icon="flash-on"        label="MIN"  value={latencies.length > 0 ? `${Math.min(...latencies)}ms` : '--'} color={COLOR.green} />
        <StatCell icon="signal-wifi-bad" label="LOSS" value={results.length ? `${lossPct}%` : '--'}               color={lossPct > 10 ? COLOR.red : COLOR.mid} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLOR.surf, borderRadius: 10, borderWidth: 1, borderColor: COLOR.cyan + '40', paddingHorizontal: 12, paddingVertical: 10 }}>
        <MaterialIcons name="language" size={14} color={COLOR.cyan} />
        <TextInput style={{ flex: 1, fontFamily: MONO, fontSize: 13, color: COLOR.text }} value={target} onChangeText={setTarget} placeholder="IP:port or IP" placeholderTextColor={COLOR.dim} autoCapitalize="none" autoCorrect={false} />
        <TouchableOpacity onPress={() => { haptics.selection(); setAutoMode(v => !v); }}
          style={[{ borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, borderColor: (autoMode ? COLOR.cyan : COLOR.mid) + '50', backgroundColor: glow(autoMode ? COLOR.cyan : COLOR.mid, 10) }]}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: autoMode ? COLOR.cyan : COLOR.mid }}>AUTO</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={ping} disabled={pinging || !target.trim()} activeOpacity={0.85}
        style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLOR.cyan, borderRadius: 14, paddingVertical: 16, opacity: pinging || !target.trim() ? 0.45 : 1 }]}>
        {pinging ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="network-ping" size={17} color="#000" />}
        <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.8 }}>{pinging ? 'PINGING...' : 'SEND PING'}</Text>
      </TouchableOpacity>
      {results.length > 0 ? (
        <>
          {/* Chart */}
          <View style={{ backgroundColor: COLOR.surf, borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, height: 90, overflow: 'hidden', padding: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 70, paddingBottom: 4 }}>
              {results.slice(0, 20).reverse().map((r, i) => {
                const h = r.ok ? Math.max(4, (r.latency / maxLat) * 60) : 60;
                const col = !r.ok ? COLOR.red : r.latency < 50 ? COLOR.green : r.latency < 150 ? COLOR.amber : COLOR.red;
                return (
                  <View key={i} style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <View style={{ width: '75%', height: h, borderRadius: 2, backgroundColor: col, opacity: 0.4 + (i / results.length) * 0.6 }} />
                  </View>
                );
              })}
            </View>
          </View>
          {/* Recent list */}
          <View style={{ gap: 4 }}>
            {results.slice(0, 6).map((r, i) => {
              const col = !r.ok ? COLOR.red : r.latency < 50 ? COLOR.green : r.latency < 150 ? COLOR.amber : COLOR.red;
              return (
                <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 2.5, borderLeftColor: col, paddingLeft: 10, paddingRight: 12, paddingVertical: 9, backgroundColor: COLOR.surf, borderRadius: 8 }]}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: col }} />
                  <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: col, width: 72 }}>{r.ok ? `${r.latency}ms` : 'TIMEOUT'}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.dim }}>{new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                  <View style={{ flex: 1 }} />
                  <View style={[{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, borderColor: col + '50', backgroundColor: glow(col, 10) }]}>
                    <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: col }}>{!r.ok ? 'FAIL' : r.latency < 50 ? 'GREAT' : r.latency < 150 ? 'OK' : 'SLOW'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <MaterialIcons name="network-ping" size={40} color={COLOR.dim} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim, letterSpacing: 0.8 }}>{autoMode ? 'AUTO-PING STARTING...' : 'TAP SEND PING TO BEGIN'}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── CLIPBOARD BRIDGE ─────────────────────────────────────────────
function ClipTab({ isConn }: { isConn: boolean }) {
  const [clipText,   setClipText]   = useState('');
  const [sending,    setSending]    = useState(false);
  const [autoSync,   setAutoSync]   = useState(false);
  const [lastResult, setLastResult] = useState('');
  const [history,    setHistory]    = useState<{ text: string; type: string; ts: number }[]>([]);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevClip = useRef('');

  useEffect(() => { return () => { if (autoRef.current) clearInterval(autoRef.current); }; }, []);

  useEffect(() => {
    if (autoSync && isConn) {
      autoRef.current = setInterval(async () => {
        try {
          const txt: string = await new Promise((res) => { try { require('react-native').Clipboard.getString().then(res).catch(() => res('')); } catch { res(''); } });
          if (txt && txt !== prevClip.current) { prevClip.current = txt; setClipText(txt); await sendToPC(txt); }
        } catch {}
      }, 4000);
    } else { if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; } }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoSync, isConn]);

  const sendToPC = useCallback(async (text?: string) => {
    const toSend = (text || clipText).trim();
    if (!toSend) { Alert.alert('Empty', 'Paste or type something first.'); return; }
    if (!isConn) { Alert.alert('Offline', 'Connect to PC first.'); return; }
    setSending(true); setLastResult('');
    try {
      const ip = serverConnection.getIP(); const port = serverConnection.getPort(); const tok = serverConnection.getToken();
      const escaped = JSON.stringify(toSend);
      const script = `import subprocess,sys\ntry:\n    if sys.platform=='win32':\n        subprocess.run(['clip'],input=${escaped}.encode(),check=True)\n    elif sys.platform=='darwin':\n        subprocess.run(['pbcopy'],input=${escaped}.encode(),check=True)\n    else:\n        subprocess.run(['xclip','-selection','clipboard'],input=${escaped}.encode(),check=True)\n    print('Clipboard synced to PC')\nexcept Exception as e:\n    print(f'Error: {e}')`;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 8000);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) headers['Authorization'] = `Bearer ${tok}`;
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method: 'POST', headers, body: JSON.stringify({ script }), signal: ctrl.signal });
      const data = await res.json();
      const msg = (data.output || '').trim() || 'Sent';
      setLastResult(msg); haptics.success();
      const type = toSend.startsWith('http') ? 'URL' : /\d{1,3}\.\d{1,3}/.test(toSend) ? 'IP' : toSend.includes('\n') ? 'CODE' : 'TEXT';
      setHistory(prev => [{ text: toSend.slice(0, 100), type, ts: Date.now() }, ...prev].slice(0, 15));
    } catch (e: any) { setLastResult('Error: ' + (e?.message || 'Failed')); haptics.warning(); }
    finally { setSending(false); }
  }, [clipText, isConn]);

  const HIST_COLOR: Record<string, string> = { URL: COLOR.cyan, IP: COLOR.teal, CODE: COLOR.amber, TEXT: COLOR.mid };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <StatCell icon="content-paste" label="SYNCED"  value={String(history.length)} color={COLOR.magenta} />
        <StatCell icon="wifi"          label="STATUS"  value={isConn ? 'LIVE' : 'OFF'} color={isConn ? COLOR.green : COLOR.mid} />
        <StatCell icon="timer"         label="AUTO"    value={autoSync ? 'ON' : 'OFF'} color={autoSync ? COLOR.cyan : COLOR.mid} />
      </View>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12, borderColor: (isConn ? COLOR.green : COLOR.amber) + '35', backgroundColor: glow(isConn ? COLOR.green : COLOR.amber, 6) }]}>
        <PulseDot color={isConn ? COLOR.green : COLOR.amber} size={7} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: isConn ? COLOR.green : COLOR.amber }}>
            {isConn ? 'CLIPBOARD BRIDGE ACTIVE' : 'PC OFFLINE — LOCAL ONLY'}
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.mid, marginTop: 2 }}>
            {isConn ? 'Text syncs to your PC clipboard via server' : 'Connect PC to enable real-time sync'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => { haptics.selection(); setAutoSync(v => !v); }}
          style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, borderColor: (autoSync ? COLOR.cyan : COLOR.dim) + '55', backgroundColor: glow(autoSync ? COLOR.cyan : COLOR.dim, 10) }]}>
          <MaterialIcons name={autoSync ? 'sync' : 'sync-disabled'} size={14} color={autoSync ? COLOR.cyan : COLOR.dim} />
          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: autoSync ? COLOR.cyan : COLOR.dim }}>{autoSync ? 'AUTO ON' : 'AUTO'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[{ backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1.5, borderColor: COLOR.magenta + '40', padding: 12, gap: 10 }]}>
        <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: COLOR.magenta, letterSpacing: 1 }}>TEXT TO SEND TO PC</Text>
        <TextInput style={[{ height: 90, fontFamily: MONO, fontSize: 13, color: COLOR.text, lineHeight: 20, backgroundColor: COLOR.surf2, borderRadius: 9, borderWidth: 1, borderColor: COLOR.magenta + '28', padding: 10 }]}
          value={clipText} onChangeText={setClipText} multiline placeholder="Type or paste text here..." placeholderTextColor={COLOR.dim} autoCapitalize="none" autoCorrect={false} textAlignVertical="top" />
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <TouchableOpacity style={[{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9, paddingVertical: 11, backgroundColor: COLOR.magenta }]}
            onPress={() => sendToPC()} disabled={sending} activeOpacity={0.85}>
            {sending ? <ActivityIndicator size="small" color="#FFF" style={{ transform: [{ scale: 0.7 }] }} /> : <MaterialIcons name="send" size={12} color="#FFF" />}
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: '#FFF' }}>{sending ? '...' : 'SEND TO PC'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9, paddingVertical: 11, borderWidth: 1, borderColor: COLOR.magenta + '50', backgroundColor: COLOR.surf2 }]}
            onPress={async () => { try { const t: string = await new Promise(r => { require('react-native').Clipboard.getString().then(r).catch(() => r('')); }); if (t) { setClipText(t); haptics.light(); } } catch {} }}>
            <MaterialIcons name="content-paste" size={12} color={COLOR.magenta} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.magenta }}>PASTE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9, paddingVertical: 11, borderWidth: 1, borderColor: COLOR.red + '40', backgroundColor: COLOR.surf2 }]}
            onPress={() => { setClipText(''); setLastResult(''); }}>
            <MaterialIcons name="clear" size={12} color={COLOR.red} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.red }}>CLR</Text>
          </TouchableOpacity>
        </View>
        {lastResult ? (
          <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 9, borderColor: (lastResult.includes('Error') ? COLOR.red : COLOR.green) + '40', backgroundColor: glow(lastResult.includes('Error') ? COLOR.red : COLOR.green, 6) }]}>
            <MaterialIcons name={lastResult.includes('Error') ? 'error-outline' : 'check-circle-outline'} size={12} color={lastResult.includes('Error') ? COLOR.red : COLOR.green} />
            <Text style={{ fontFamily: MONO, fontSize: 10, flex: 1, color: lastResult.includes('Error') ? COLOR.red : COLOR.green }}>{lastResult}</Text>
          </View>
        ) : null}
      </View>
      {history.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: COLOR.cyan }} />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.cyan + '80', letterSpacing: 1.5 }}>SYNC HISTORY ({history.length})</Text>
            <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLOR.cyan + '25' }} />
            <TouchableOpacity onPress={() => setHistory([])} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.red }}>CLEAR</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 5 }}>
            {history.map((item, i) => {
              const col = HIST_COLOR[item.type] || COLOR.mid;
              return (
                <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 9, borderLeftWidth: 2.5, borderLeftColor: col, paddingLeft: 10, paddingRight: 12, paddingVertical: 9, backgroundColor: COLOR.surf, borderRadius: 8 }]}>
                  <View style={[{ borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, flexShrink: 0, borderColor: col + '50', backgroundColor: glow(col, 12) }]}>
                    <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: col }}>{item.type}</Text>
                  </View>
                  <Text style={{ flex: 1, fontFamily: MONO, fontSize: 11, color: COLOR.text }} numberOfLines={1}>{item.text}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.dim, flexShrink: 0 }}>{timeAgo(item.ts)}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function NetOpsInner() {
  const insets = useSafeAreaInsets();
  const { T }  = useCosmetic();
  const { isConnected } = useConnectionStatus();
  const [activeTab, setActiveTab] = useState<TabKey>('scanner');

  return (
    <View style={{ flex: 1, backgroundColor: T.bg || '#06080D' }}>
      <TabSwipeOverlay leftRoute="/(tabs)/knowledge" rightRoute="/(tabs)/logs" />
      <NetOpsHeader safeTop={insets.top} isConn={isConnected} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'scanner' && <LANTab isConn={isConnected} />}
      {activeTab === 'ports'   && <PortTab isConn={isConnected} />}
      {activeTab === 'ping'    && <PingTab isConn={isConnected} />}
      {activeTab === 'clip'    && <ClipTab isConn={isConnected} />}
    </View>
  );
}

export default function NetOpsScreen() {
  return (
    <TabErrorBoundary name="Net Ops">
      <NetOpsInner />
    </TabErrorBoundary>
  );
}
