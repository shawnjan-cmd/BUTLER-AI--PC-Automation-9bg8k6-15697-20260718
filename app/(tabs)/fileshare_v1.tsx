/**
 * ⚡ NET OPS — Butler AI Network Operations Center
 * Surfaces: LAN scanner, port audit, ping tester, clipboard bridge, network info
 * Layout law: 3-col stats grid, full phone width, no 1-item rows
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Animated, ActivityIndicator, Dimensions, RefreshControl,
  TextInput, Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { useConnectionStatus } from '@/hooks/useConnection';
import { serverConnection } from '@/services/serverConnection';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import {
  quickScan, diagnosePeer, FoundServer, ScanProgress,
} from '@/services/lanScanner';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD   = 14;
const GAP3  = 8;
const GAP2  = 10;
const COL3_W = Math.floor((SW - PAD * 2 - GAP3 * 2) / 3);
const COL2_W = Math.floor((SW - PAD * 2 - GAP2) / 2);

// ── Palette — matched to nexushome.tsx design tokens ────────────
const C = {
  bg:        '#06080d',
  surface:   '#0d1117',
  surfaceHi: '#141a23',
  surfaceMd: '#0a0d13',
  border:    'rgba(0,243,255,0.15)',
  text:      '#d8f7ff',
  textMid:   '#6c8194',
  textDim:   '#2A3A4A',
  green:     '#00ff9d',
  teal:      '#10d9a0',
  cyan:      '#00CCDD',
  amber:     '#f59e0b',
  red:       '#ef4444',
  purple:    '#8b5cf6',
  blue:      '#4488FF',
  lime:      '#a3e635',
};

// ── Well-known ports with risk metadata ──────────────────────────
interface WellKnownPort {
  port:    number;
  service: string;
  risk:    'critical' | 'high' | 'medium' | 'low';
  note:    string;
  icon:    string;
}

const WELL_KNOWN_PORTS: WellKnownPort[] = [
  { port: 22,   service: 'SSH',       risk: 'high',     note: 'Remote shell access',       icon: 'terminal'      },
  { port: 23,   service: 'Telnet',    risk: 'critical', note: 'Unencrypted legacy shell',   icon: 'warning'       },
  { port: 25,   service: 'SMTP',      risk: 'medium',   note: 'Mail relay — spam risk',     icon: 'email'         },
  { port: 80,   service: 'HTTP',      risk: 'low',      note: 'Web server (unencrypted)',   icon: 'language'      },
  { port: 135,  service: 'RPC',       risk: 'high',     note: 'Windows RPC endpoint',       icon: 'settings'      },
  { port: 139,  service: 'NetBIOS',   risk: 'high',     note: 'Windows file share',         icon: 'folder-shared' },
  { port: 443,  service: 'HTTPS',     risk: 'low',      note: 'Encrypted web traffic',      icon: 'lock'          },
  { port: 445,  service: 'SMB',       risk: 'critical', note: 'Windows shares (EternalBlue)', icon: 'folder-network' },
  { port: 3306, service: 'MySQL',     risk: 'critical', note: 'Database exposed to network',icon: 'storage'       },
  { port: 3389, service: 'RDP',       risk: 'high',     note: 'Remote desktop access',      icon: 'desktop-windows'},
  { port: 5900, service: 'VNC',       risk: 'high',     note: 'Remote desktop (unencrypted)', icon: 'monitor'     },
  { port: 8080, service: 'HTTP-Alt',  risk: 'low',      note: 'Alternative web port',       icon: 'http'          },
  { port: 11434,service: 'Ollama',    risk: 'low',      note: 'Local AI model server',      icon: 'psychology'    },
];

const RISK_COLOR: Record<string, string> = {
  critical: C.red,
  high:     C.amber,
  medium:   C.cyan,
  low:      C.green,
};

// ── Helpers ──────────────────────────────────────────────────────
function fmtMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}
function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 5000) return 'just now';
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  return `${Math.floor(d / 3600000)}h ago`;
}

// ── Animated pulse dot ───────────────────────────────────────────
function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(a, { toValue: 0.2, duration: 900, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a,
      ...Platform.select({ ios: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 }, android: {} }),
    }} />
  );
}

// ── Section divider — homepage chip style ────────────────────────
function SectionDiv({ icon, label, color, right }: {
  icon: string; label: string; color: string; right?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:11, marginTop:4 }}>
      <View style={{ height:1, width:10, backgroundColor:color+'50', borderRadius:1 }} />
      <View style={[
        {
          flexDirection:'row', alignItems:'center',
          borderTopLeftRadius:14, borderBottomRightRadius:14,
          borderTopRightRadius:2, borderBottomLeftRadius:2,
          borderWidth:1, borderColor:color+'45',
          backgroundColor:color+'0C',
          paddingHorizontal:10, paddingVertical:5, marginHorizontal:8, gap:5,
        }
      ]}>
        <MaterialIcons name={icon as any} size={10} color={color} />
        <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', color, letterSpacing:1.8 }}>{label}</Text>
      </View>
      <View style={{ flex:1, height:1, backgroundColor:color+'50', borderRadius:1 }} />
      {right ? <View style={{ marginLeft:8 }}>{right}</View> : null}
    </View>
  );
}

// ── 3-col stat cell — cyberpunk HUD panel (homepage style) ─────
function StatCell({ icon, label, value, color, sub, iconLib }: {
  icon: string; label: string; value: string; color: string;
  sub?: string; iconLib?: 'material' | 'community';
}) {
  const IconComp = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <View style={[sc.cell, { borderColor: color + '30', borderTopColor: color }]}>
      {/* Corner brackets for HUD feel */}
      <View style={{ position:'absolute', top:0, left:0, width:9, height:9, borderTopWidth:2, borderLeftWidth:2, borderColor:color+'70' }} />
      <View style={{ position:'absolute', bottom:0, right:0, width:9, height:9, borderBottomWidth:2, borderRightWidth:2, borderColor:color+'40' }} />
      <IconComp name={icon as any} size={16} color={color} />
      <Text style={[sc.val, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {sub ? <Text style={sc.sub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}
const sc = StyleSheet.create({
  cell: {
    width: COL3_W,
    backgroundColor: '#060F18',
    // Cyberpunk asymmetric border radius — angular HUD panel
    borderTopLeftRadius: 12, borderBottomRightRadius: 12,
    borderTopRightRadius: 3, borderBottomLeftRadius: 3,
    borderWidth: 1.5, borderTopWidth: 3, padding: 10, gap: 3,
    alignItems: 'center', position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios:{ shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:0.35,shadowRadius:8 }, android:{elevation:4} }),
  },
  val:   { fontFamily: MONO, fontSize: 24, fontWeight: '900', lineHeight: 28, textAlign: 'center' },
  label: { fontSize: 9, fontWeight: '700', color: C.textDim, fontFamily: MONO, letterSpacing: 0.8, textAlign: 'center' },
  sub:   { fontSize: 8, color: C.textDim, fontFamily: MONO, textAlign: 'center' },
});

// ── HUD Header ───────────────────────────────────────────────────
function NetOpsHeader({
  safeTop, isConnected, activeTab, onTabChange,
}: {
  safeTop: number; isConnected: boolean; activeTab: string;
  onTabChange: (t: string) => void;
}) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(scanAnim, {
      toValue: 1, duration: 2400, useNativeDriver: false,
    }));
    loop.start();
    return () => loop.stop();
  }, []);
  const scanX = scanAnim.interpolate({ inputRange:[0,1], outputRange:[0, SW - 40] });
  const TABS = [
    { key: 'scanner', label: 'LAN',    icon: 'radar',          color: C.teal   },
    { key: 'ports',   label: 'PORTS',  icon: 'security',       color: C.amber  },
    { key: 'ping',    label: 'PING',   icon: 'network-ping',   color: C.cyan   },
    { key: 'clip',    label: 'BRIDGE', icon: 'content-paste',  color: C.purple },
  ] as const;

  return (
    <View style={{ backgroundColor: C.bg, borderBottomWidth: 1.5, borderBottomColor: C.teal + '28' }}>
      {/* Scan line animation */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 20,
        transform: [{ translateX: scanX }],
        width: 40, backgroundColor: C.teal,
        opacity: 0.7,
        ...Platform.select({ ios: { shadowColor: C.teal, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 }, android: {} }),
      }} />

      {/* 5-color accent strip — matches homepage */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[C.teal, C.cyan, C.amber, C.green, C.purple].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      {/* Top row: title + status */}
      <View style={{
        flexDirection:'row', alignItems:'flex-start', gap:10,
        paddingTop: safeTop + 12, paddingBottom:10, paddingHorizontal:PAD,
      }}>
        {/* Icon orb */}
        <View style={[
          hdr.orbOuter,
          { borderColor: C.teal + '60',
            ...Platform.select({ ios:{shadowColor:C.teal,shadowOffset:{width:0,height:0},shadowOpacity:0.55,shadowRadius:14}, android:{elevation:8} }) },
        ]}>
          <View style={[hdr.orbInner, { backgroundColor: C.teal + '12', borderColor: C.teal + '50' }]}>
            <MaterialCommunityIcons name="radar" size={28} color={C.teal} />
          </View>
        </View>

        {/* Title block */}
        <View style={{ flex: 1, paddingTop: 2 }}>
          <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'700', color:C.teal+'80', letterSpacing:3, marginBottom:3 }}>NETWORK OPS CENTER</Text>
          <Text style={{ fontFamily:MONO, fontSize:24, fontWeight:'900', color:'#FFFFFF', letterSpacing:1.5, lineHeight:28 }}>
            NET <Text style={{ color: C.teal }}>OPS</Text>
          </Text>
          <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.textMid, marginTop:2 }}>LAN scanner · port audit · ping · bridge</Text>
        </View>

        {/* Connection badge */}
        <View style={[hdr.connBadge, {
          borderColor: (isConnected ? C.green : C.amber) + '55',
          backgroundColor: (isConnected ? C.green : C.amber) + '0C',
        }]}>
          <PulseDot color={isConnected ? C.green : C.amber} size={5} />
          <Text style={[hdr.connTxt, { color: isConnected ? C.green : C.amber }]}>
            {isConnected ? 'ONLINE' : 'LOCAL'}
          </Text>
        </View>
      </View>

      {/* HUD data strip */}
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:PAD, paddingBottom:9, gap:3 }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const w = [3,6,2,8,4,5,2,9,3,4,7,2,5,8,3,4,6,2,5,3][i] || 4;
          return <View key={i} style={{ width:w, height:3, borderRadius:2,
            backgroundColor: i%4===0 ? C.teal+'60' : i%3===0 ? C.green+'35' : C.teal+'20' }} />;
        })}
        <View style={{ flex:1 }} />
        {[C.teal,C.green,C.amber].map((col,i) => (
          <View key={i} style={{ width:5,height:5,borderRadius:3,backgroundColor:col+'50' }} />
        ))}
      </View>

      {/* Inner tab bar */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.teal + '18' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { haptics.selection(); onTabChange(tab.key); }}
              style={[hdr.tab, isActive && { backgroundColor: tab.color + '10', borderBottomColor: tab.color }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name={tab.icon as any} size={12} color={isActive ? tab.color : C.textMid} />
              <Text style={[hdr.tabTxt, { color: isActive ? tab.color : C.textMid }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const hdr = StyleSheet.create({
  orbOuter:  { width:60, height:60, borderRadius:30, borderWidth:2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  orbInner:  { width:50, height:50, borderRadius:25, borderWidth:2, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  connBadge: { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:10, paddingHorizontal:9, paddingVertical:6, flexShrink:0 },
  connTxt:   { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.8 },
  tab:       { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:10, borderBottomWidth:3, borderBottomColor:'transparent' },
  tabTxt:    { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.5 },
});

// ─────────────────────────────────────────────────────────────────
// ── LAN SCANNER TAB ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
function LANScannerTab({ isConnected }: { isConnected: boolean }) {
  const [scanning,  setScanning]  = useState(false);
  const [progress,  setProgress]  = useState<ScanProgress | null>(null);
  const [servers,   setServers]   = useState<FoundServer[]>([]);
  const [lastScan,  setLastScan]  = useState(0);
  // Auto-scan once on focus if we've never scanned
  const hasAutoScanned = React.useRef(false);
  useFocusEffect(useCallback(() => {
    if (!hasAutoScanned.current) { hasAutoScanned.current = true; startScan(); }
  }, []));
  const abortRef = useRef({ aborted: false });
  const barAnim  = useRef(new Animated.Value(0)).current;

  const progressPct = progress 
    ? Math.round((progress.scanned / Math.max(progress.total, 1)) * 100)
    : 0;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: progressPct / 100, duration: 300, useNativeDriver: false,
    }).start();
  }, [progressPct]);

  const startScan = useCallback(async () => {
    haptics.medium();
    abortRef.current = { aborted: false };
    setScanning(true);
    setServers([]);
    setProgress(null);
    try {
      const found = await quickScan(p => setProgress(p), abortRef.current);
      setServers(found);
      setLastScan(Date.now());
      haptics.success();
    } catch (e: any) {
      autoErrorLogger.log('warn', 'NetOps', `Scan failed: ${e?.message}`);
    } finally {
      setScanning(false);
    }
  }, []);

  const stopScan = () => {
    abortRef.current.aborted = true;
    setScanning(false);
    haptics.light();
  };

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: GAP3 }}>
        <StatCell icon="router" label="FOUND"   value={String(servers.length)}                      color={servers.length > 0 ? C.green : C.textMid} />
        <StatCell icon="wifi"   label="PROGRESS" value={scanning ? `${progressPct}%` : lastScan > 0 ? '100%' : '--'} color={C.teal} />
        <StatCell icon="access-time" label="LAST SCAN" value={lastScan > 0 ? timeAgo(lastScan) : 'never'} color={C.amber} />
      </View>

      {/* Scan progress bar */}
      {(scanning || progress) ? (
        <View style={ls.progressWrap}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[ls.progressLabel, { color: C.teal }]}>
              {scanning ? `SCANNING ${progress?.currentSubnet || '…'}` : 'SCAN COMPLETE'}
            </Text>
            <Text style={ls.progressLabel}>{progress?.scanned || 0} / {progress?.total || 0} hosts</Text>
          </View>
          <View style={ls.progressTrack}>
            <Animated.View style={[ls.progressBar, { width: barWidth, backgroundColor: scanning ? C.teal : C.green }]} />
          </View>
        </View>
      ) : null}

      {/* Scan button */}
      <TouchableOpacity
        onPress={scanning ? stopScan : startScan}
        activeOpacity={0.85}
        style={[ls.scanBtn, {
          backgroundColor: scanning ? C.red : C.teal,
        }]}
      >
        {scanning ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <MaterialCommunityIcons name="radar" size={18} color="#000" />
        )}
        <Text style={[ls.scanBtnTxt, { color: '#000' }]}>
          {scanning ? 'STOP SCAN' : 'QUICK SCAN LAN'}
        </Text>
        {!scanning && (
          <View style={{ borderWidth:1, borderRadius:6, borderColor:'#00000030', paddingHorizontal:7, paddingVertical:2, backgroundColor:'#00000018' }}>
            <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:'#000', letterSpacing:0.5 }}>AUTO</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Results */}
      {servers.length > 0 ? (
        <>
          <SectionDiv icon="devices" label={`SERVERS FOUND (${servers.length})`} color={C.green} />
          <View style={{ gap: 8 }}>
            {servers.map((s, i) => (
              <ServerCard key={i} server={s} />
            ))}
          </View>
        </>
      ) : !scanning && lastScan > 0 ? (
        <View style={ls.emptyBox}>
          <MaterialCommunityIcons name="lan-disconnect" size={44} color={C.textMid} />
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: C.textMid, marginTop: 10 }}>NO SERVERS FOUND</Text>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, textAlign: 'center', maxWidth: 260, marginTop: 4, lineHeight: 15 }}>
            Ensure your PC server is running and both devices are on the same Wi-Fi network.
          </Text>
        </View>
      ) : !scanning ? (
        <View style={ls.emptyBox}>
          <MaterialCommunityIcons name="radar" size={48} color={C.textDim} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.textDim, marginTop: 12, letterSpacing: 0.8 }}>
            TAP SCAN TO DISCOVER SERVERS
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function ServerCard({ server }: { server: FoundServer }) {
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult]   = useState<string>('');
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const runDiag = async () => {
    haptics.light();
    setDiagLoading(true);
    const result = await diagnosePeer(server.ip, server.port);
    setDiagResult(result.ok ? `✓ Reachable · ${result.latencyMs}ms` : `✗ ${result.message}`);
    setDiagLoading(false);
  };

  const isButler = server.info?.status || server.info?.version;
  const color = isButler ? C.green : C.teal;

  return (
    <Animated.View style={[svc.card, { borderColor: glowAnim.interpolate({ inputRange: [0.2, 1], outputRange: [color + '28', color + '88'] }) }]}>
      <View style={[svc.topBar, { backgroundColor: color }]} />
      <View style={svc.row}>
        <View style={[svc.iconBox, { borderColor: color + '50', backgroundColor: color + '10' }]}>
          <MaterialCommunityIcons name={isButler ? 'robot-happy' : 'server-network'} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[svc.ip, { color }]}>{server.ip}</Text>
            <View style={[svc.portBadge, { borderColor: color + '55', backgroundColor: color + '10' }]}>
              <Text style={[svc.portTxt, { color }]}>:{server.port}</Text>
            </View>
            {isButler && (
              <View style={[svc.butlerBadge, { borderColor: C.green + '60' }]}>
                <Text style={[svc.butlerTxt, { color: C.green }]}>BUTLER</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={svc.meta}>Latency: <Text style={{ color }}>{server.latencyMs}ms</Text></Text>
            {server.info?.version ? (
              <Text style={svc.meta}>v<Text style={{ color }}>{server.info.version}</Text></Text>
            ) : null}
            {server.info?.ollama ? (
              <Text style={{ fontFamily: MONO, fontSize: 9, color: C.purple }}>● OLLAMA</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          onPress={runDiag}
          disabled={diagLoading}
          style={[svc.diagBtn, { borderColor: color + '50' }]}
          activeOpacity={0.8}
        >
          {diagLoading
            ? <ActivityIndicator size="small" color={color} />
            : <MaterialIcons name="network-check" size={16} color={color} />
          }
        </TouchableOpacity>
      </View>
      {diagResult ? (
        <View style={[svc.diagResult, { borderTopColor: color + '20', backgroundColor: color + '06' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: diagResult.startsWith('✓') ? C.green : C.red }}>{diagResult}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const ls = StyleSheet.create({
  progressWrap: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, gap: 0 },
  progressLabel:{ fontFamily: MONO, fontSize: 8.5, fontWeight: '700', color: C.textMid, letterSpacing: 0.5 },
  progressTrack:{ height: 6, backgroundColor: C.teal + '18', borderRadius: 4, overflow: 'hidden' },
  progressBar:  { height: '100%', borderRadius: 4 },
  scanBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, borderRadius:14, paddingVertical:16, paddingHorizontal:20,
    ...Platform.select({ ios:{shadowColor:C.teal,shadowOffset:{width:0,height:4},shadowOpacity:0.6,shadowRadius:14}, android:{elevation:8} }) },
  scanBtnTxt:   { fontFamily:MONO, fontSize:14, fontWeight:'900', letterSpacing:1 },
  emptyBox:     { alignItems: 'center', paddingVertical: 40, gap: 4 },
});

const svc = StyleSheet.create({
  card:      { backgroundColor: C.surface,
    borderTopLeftRadius:16, borderBottomRightRadius:16, borderTopRightRadius:4, borderBottomLeftRadius:4,
    borderWidth: 1.5, overflow: 'hidden',
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:10}, android:{elevation:5} }) },
  topBar:    { height: 2.5 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  iconBox:   { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ip:        { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  portBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  portTxt:   { fontFamily: MONO, fontSize: 10, fontWeight: '900' },
  butlerBadge:{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderColor: C.green + '60', backgroundColor: C.green + '10' },
  butlerTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  meta:      { fontFamily: MONO, fontSize: 10, color: C.textMid },
  diagBtn:   { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  diagResult:{ paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1 },
});

// ─────────────────────────────────────────────────────────────────
// ── PORT AUDIT TAB ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
interface PortStatus { port: number; open: boolean; latencyMs: number; }

function PortAuditTab({ isConnected }: { isConnected: boolean }) {
  const [scanning,   setScanning]   = useState(false);
  const [results,    setResults]    = useState<PortStatus[]>([]);
  const [targetIP,   setTargetIP]   = useState('');
  const [lastScanTs, setLastScanTs] = useState(0);

  const openPorts   = results.filter(r => r.open);
  const critCount   = openPorts.filter(r => {
    const p = WELL_KNOWN_PORTS.find(wp => wp.port === r.port);
    return p?.risk === 'critical';
  }).length;
  const highCount   = openPorts.filter(r => {
    const p = WELL_KNOWN_PORTS.find(wp => wp.port === r.port);
    return p?.risk === 'high';
  }).length;

  const seedTarget = useCallback(() => {
    try {
      const ip = serverConnection.getIP();
      if (ip) setTargetIP(ip);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { seedTarget(); }, [seedTarget]));

  const runAudit = useCallback(async () => {
    const ip = targetIP.trim() || serverConnection.getIP() || '127.0.0.1';
    haptics.medium();
    setScanning(true);
    setResults([]);

    const probes = WELL_KNOWN_PORTS.map(async wp => {
      const t0 = Date.now();
      try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 1500);
        const res  = await fetch(`http://${ip}:${wp.port}`, { signal: ctrl.signal });
        clearTimeout(tid);
        // any HTTP response = port open
        return { port: wp.port, open: res.status < 600, latencyMs: Date.now() - t0 };
      } catch (e: any) {
        const ms = Date.now() - t0;
        // AbortError = timeout = closed; network error = closed
        return { port: wp.port, open: false, latencyMs: ms };
      }
    });

    const all = await Promise.all(probes);
    setResults(all);
    setLastScanTs(Date.now());
    haptics.success();
    setScanning(false);
  }, [targetIP]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: GAP3 }}>
        <StatCell icon="lock-open" label="OPEN"     value={String(openPorts.length)}  color={openPorts.length > 0 ? C.amber : C.green} />
        <StatCell icon="warning"   label="CRITICAL"  value={String(critCount)}         color={critCount > 0 ? C.red : C.textMid} />
        <StatCell icon="gpp-bad"   label="HIGH RISK" value={String(highCount)}         color={highCount > 0 ? C.amber : C.textMid} />
      </View>

      {/* Target IP input */}
      <View style={pa.inputRow}>
        <MaterialIcons name="language" size={14} color={C.teal} />
        <TextInput
          style={pa.input}
          value={targetIP}
          onChangeText={setTargetIP}
          placeholder="Target IP (blank = PC server)"
          placeholderTextColor={C.textDim}
          autoCapitalize="none" autoCorrect={false}
          keyboardType="decimal-pad"
        />
        {targetIP ? (
          <TouchableOpacity onPress={() => setTargetIP('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={12} color={C.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Run button */}
      <TouchableOpacity
        onPress={runAudit}
        disabled={scanning || (!isConnected && !targetIP)}
        activeOpacity={0.85}
        style={[pa.auditBtn, { opacity: scanning || (!isConnected && !targetIP) ? 0.45 : 1 }]}
      >
        {scanning ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <MaterialIcons name="security" size={17} color="#000" />
        )}
        <Text style={pa.auditBtnTxt}>{scanning ? 'SCANNING PORTS...' : 'RUN PORT AUDIT'}</Text>
        <View style={{ borderWidth:1, borderRadius:6, borderColor:'#00000030', paddingHorizontal:7, paddingVertical:2, backgroundColor:'#00000018' }}>
          <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:'#000' }}>{WELL_KNOWN_PORTS.length}P</Text>
        </View>
      </TouchableOpacity>

      {/* Port results grid */}
      {results.length > 0 ? (
        <>
          <SectionDiv icon="security" label="PORT AUDIT RESULTS" color={C.amber}
            right={<Text style={{ fontFamily: MONO, fontSize: 8, color: C.textMid }}>{timeAgo(lastScanTs)}</Text>}
          />
          <View style={{ gap: 6 }}>
            {WELL_KNOWN_PORTS.map(wp => {
              const status = results.find(r => r.port === wp.port);
              const isOpen = status?.open ?? false;
              const riskColor = RISK_COLOR[wp.risk] || C.textMid;
              return (
                <View key={wp.port} style={[pa.portRow, { borderLeftColor: isOpen ? riskColor : C.textDim + '40' }]}>
                  <View style={[pa.portNumBox, { borderColor: (isOpen ? riskColor : C.textDim) + '50', backgroundColor: (isOpen ? riskColor : C.textDim) + '0A' }]}>
                    <Text style={[pa.portNum, { color: isOpen ? riskColor : C.textDim }]}>{wp.port}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[pa.svcName, { color: isOpen ? C.text : C.textMid }]}>{wp.service}</Text>
                      {isOpen && (
                        <View style={[pa.riskPill, { borderColor: riskColor + '60', backgroundColor: riskColor + '12' }]}>
                          <Text style={[pa.riskTxt, { color: riskColor }]}>{wp.risk.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={pa.portNote} numberOfLines={1}>{wp.note}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <View style={[pa.statusDot, { backgroundColor: isOpen ? riskColor : C.textDim + '40' }]} />
                    {status ? (
                      <Text style={[pa.latency, { color: isOpen ? riskColor : C.textDim }]}>
                        {isOpen ? `${status.latencyMs}ms` : 'closed'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Risk summary */}
          {openPorts.length > 0 && (
            <View style={[pa.summaryBox, { borderColor: critCount > 0 ? C.red + '40' : C.amber + '40', backgroundColor: critCount > 0 ? C.red + '06' : C.amber + '06' }]}>
              <MaterialIcons name={critCount > 0 ? 'warning' : 'info-outline'} size={14} color={critCount > 0 ? C.red : C.amber} />
              <Text style={[pa.summaryTxt, { color: critCount > 0 ? C.red : C.amber }]}>
                {critCount > 0
                  ? `${critCount} critical port${critCount > 1 ? 's' : ''} exposed — check firewall rules`
                  : `${openPorts.length} port${openPorts.length > 1 ? 's' : ''} open — review if expected`}
              </Text>
            </View>
          )}
        </>
      ) : !scanning ? (
        <View style={ls.emptyBox}>
          <MaterialIcons name="security" size={44} color={C.textDim} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.textDim, marginTop: 10, letterSpacing: 0.8 }}>
            TAP RUN PORT AUDIT TO START
          </Text>
        </View>
      ) : (
        <View style={[ls.emptyBox, { paddingVertical: 24 }]}>
          <ActivityIndicator size="large" color={C.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: C.textMid, marginTop: 12 }}>
            PROBING {WELL_KNOWN_PORTS.length} PORTS...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
const pa = StyleSheet.create({
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.teal + '40', paddingHorizontal: 12, paddingVertical: 10 },
  input:      { flex: 1, fontFamily: MONO, fontSize: 13, color: C.text },
  auditBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.amber, borderRadius: 14, paddingVertical: 14,
    ...Platform.select({ ios: { shadowColor: C.amber, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 10 }, android: { elevation: 6 } }) },
  auditBtnTxt:{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.8 },
  portCount:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: '#00000070', backgroundColor: '#00000020', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  portRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 3, paddingLeft: 10, paddingRight: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  portNumBox: { width: 50, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  portNum:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  svcName:    { fontFamily: MONO, fontSize: 12, fontWeight: '700' },
  portNote:   { fontFamily: MONO, fontSize: 9, color: C.textMid, marginTop: 2 },
  riskPill:   { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  riskTxt:    { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
  statusDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  latency:    { fontFamily: MONO, fontSize: 9 },
  summaryBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  summaryTxt: { flex: 1, fontFamily: MONO, fontSize: 11, lineHeight: 16 },
});

// ─────────────────────────────────────────────────────────────────
// ── PING TESTER TAB ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
interface PingResult { ts: number; latency: number; ok: boolean; }

function PingTesterTab({ isConnected }: { isConnected: boolean }) {
  const [target,    setTarget]    = useState('');
  const [pinging,   setPinging]   = useState(false);
  const [results,   setResults]   = useState<PingResult[]>([]);
  const [autoMode,  setAutoMode]  = useState(false);
  const autoRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxBars  = 20;

  const seedTarget = useCallback(() => {
    try {
      const ip = serverConnection.getIP();
      const pt = serverConnection.getPort();
      if (ip && pt) setTarget(`${ip}:${pt}`);
      else if (ip) setTarget(ip);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { seedTarget(); return () => { if (autoRef.current) clearInterval(autoRef.current); }; }, [seedTarget]));

  const doPing = useCallback(async (host: string): Promise<PingResult> => {
    const [ip, portStr] = host.includes(':') ? host.split(':') : [host, '80'];
    const port = parseInt(portStr, 10) || 80;
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      await fetch(`http://${ip}:${port}/api/ping`, { signal: ctrl.signal });
      clearTimeout(tid);
      return { ts: Date.now(), latency: Date.now() - t0, ok: true };
    } catch {
      // try fallback path
      try {
        const ctrl2 = new AbortController();
        const tid2 = setTimeout(() => ctrl2.abort(), 2000);
        await fetch(`http://${ip}:${port}/`, { signal: ctrl2.signal });
        clearTimeout(tid2);
        return { ts: Date.now(), latency: Date.now() - t0, ok: true };
      } catch {
        return { ts: Date.now(), latency: Date.now() - t0, ok: false };
      }
    }
  }, []);

  const ping = useCallback(async () => {
    const host = target.trim();
    if (!host) return;
    haptics.light();
    setPinging(true);
    const r = await doPing(host);
    setResults(prev => [r, ...prev].slice(0, maxBars));
    setPinging(false);
    if (r.ok) haptics.light(); else haptics.warning();
  }, [target, doPing]);

  useEffect(() => {
    if (autoMode) {
      autoRef.current = setInterval(() => ping(), 3000);
    } else {
      if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoMode, ping]);

  const latencies = results.filter(r => r.ok).map(r => r.latency);
  const avg = latencies.length ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length) : 0;
  const maxLat = Math.max(...latencies, 1);
  const minLat = Math.min(...latencies, 9999);
  const lossCount = results.filter(r => !r.ok).length;
  const lossPct = results.length ? Math.round((lossCount / results.length) * 100) : 0;

  const qualColor = avg === 0 ? C.textMid : avg < 50 ? C.green : avg < 150 ? C.amber : C.red;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: GAP3 }}>
        <StatCell icon="timer"      label="AVG"    value={avg > 0 ? `${avg}ms` : '--'} color={qualColor} />
        <StatCell icon="flash-on"   label="MIN"    value={minLat < 9999 ? `${minLat}ms` : '--'} color={C.green} />
        <StatCell icon="signal-wifi-bad" label="LOSS" value={results.length ? `${lossPct}%` : '--'} color={lossPct > 10 ? C.red : C.textMid} />
      </View>

      {/* Target input + ping button */}
      <View style={pt.inputRow}>
        <MaterialIcons name="language" size={14} color={C.cyan} />
        <TextInput
          style={pt.input}
          value={target} onChangeText={setTarget}
          placeholder="IP:port or IP"
          placeholderTextColor={C.textDim}
          autoCapitalize="none" autoCorrect={false} keyboardType="decimal-pad"
        />
        {/* Auto-ping toggle */}
        <TouchableOpacity
          onPress={() => { haptics.selection(); setAutoMode(v => !v); }}
          style={[pt.autoToggle, { borderColor: (autoMode ? C.cyan : C.textDim) + '50', backgroundColor: (autoMode ? C.cyan : C.textDim) + '0C' }]}
          activeOpacity={0.8}
        >
          <Text style={[pt.autoTxt, { color: autoMode ? C.cyan : C.textDim }]}>AUTO</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={ping}
        disabled={pinging || !target.trim()}
        activeOpacity={0.85}
        style={[pt.pingBtn, { opacity: pinging || !target.trim() ? 0.45 : 1 }]}
      >
        {pinging
          ? <ActivityIndicator size="small" color="#000" />
          : <MaterialIcons name="network-ping" size={17} color="#000" />
        }
        <Text style={pt.pingBtnTxt}>{pinging ? 'PINGING...' : 'SEND PING'}</Text>
      </TouchableOpacity>

      {/* Latency bar chart */}
      {results.length > 0 ? (
        <>
          <SectionDiv icon="bar-chart" label={`LATENCY HISTORY (${results.length} pings)`} color={C.cyan} />
          <View style={pt.chartContainer}>
            {/* Y-axis hint */}
            <View style={{ position: 'absolute', right: 8, top: 4, bottom: 14 }}>
              <Text style={pt.yAxisTxt}>{maxLat}ms</Text>
              <View style={{ flex: 1 }} />
              <Text style={pt.yAxisTxt}>0</Text>
            </View>
            {/* Bars */}
            <View style={pt.barsRow}>
              {results.slice(0, maxBars).reverse().map((r, i) => {
                const h = r.ok ? Math.max(4, (r.latency / maxLat) * 60) : 60;
                const col = !r.ok ? C.red : r.latency < 50 ? C.green : r.latency < 150 ? C.amber : C.red;
                const isLatest = i === results.length - 1;
                return (
                  <View key={i} style={pt.barWrap}>
                    {!r.ok && (
                      <View style={{ position: 'absolute', top: 0, alignSelf: 'center' }}>
                        <Text style={{ fontFamily: MONO, fontSize: 7, color: C.red }}>✗</Text>
                      </View>
                    )}
                    <View style={[pt.bar, {
                      height: h, backgroundColor: col,
                      opacity: 0.4 + i / results.length * 0.6,
                      ...Platform.select({ ios: isLatest ? { shadowColor: col, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 } : {}, android: {} }),
                    }]} />
                  </View>
                );
              })}
            </View>
            {/* Horizontal guide lines */}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <View key={i} style={[pt.guideLine, { bottom: frac * 60 + 14 }]} />
            ))}
          </View>

          {/* Recent ping list */}
          <View style={pt.recentList}>
            {results.slice(0, 6).map((r, i) => {
              const col = !r.ok ? C.red : r.latency < 50 ? C.green : r.latency < 150 ? C.amber : C.red;
              return (
                <View key={i} style={[pt.recentRow, { borderLeftColor: col }]}>
                  <View style={[pt.statusDot, { backgroundColor: col }]} />
                  <Text style={[pt.recentLatency, { color: col }]}>{r.ok ? `${r.latency}ms` : 'TIMEOUT'}</Text>
                  <Text style={pt.recentTime}>{new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                  <View style={{ flex: 1 }} />
                  <View style={[pt.qualPill, { borderColor: col + '50', backgroundColor: col + '10' }]}>
                    <Text style={[pt.qualTxt, { color: col }]}>
                      {!r.ok ? 'FAIL' : r.latency < 50 ? 'GREAT' : r.latency < 150 ? 'OK' : 'SLOW'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={ls.emptyBox}>
          <MaterialIcons name="network-ping" size={44} color={C.textDim} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.textDim, marginTop: 10, letterSpacing: 0.8 }}>
            {autoMode ? 'AUTO-PING STARTING...' : 'TAP SEND PING TO BEGIN'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
const pt = StyleSheet.create({
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.cyan + '40', paddingHorizontal: 12, paddingVertical: 10 },
  input:      { flex: 1, fontFamily: MONO, fontSize: 13, color: C.text },
  autoToggle: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  autoTxt:    { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  pingBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor:C.cyan, borderRadius:14, paddingVertical:16,
    ...Platform.select({ ios:{shadowColor:C.cyan,shadowOffset:{width:0,height:4},shadowOpacity:0.6,shadowRadius:14}, android:{elevation:8} }) },
  pingBtnTxt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.8 },
  chartContainer: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, paddingBottom: 14, height: 100, overflow: 'hidden', position: 'relative' },
  barsRow:    { position: 'absolute', bottom: 14, left: 12, right: 32, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barWrap:    { flex: 1, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bar:        { width: '75%', borderRadius: 2 },
  yAxisTxt:   { fontFamily: MONO, fontSize: 7, color: C.textDim },
  guideLine:  { position: 'absolute', left: 12, right: 32, height: 1, backgroundColor: C.teal + '15' },
  recentList: { gap: 4 },
  recentRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 2.5, paddingLeft: 10, paddingRight: 12, paddingVertical: 9, backgroundColor: C.surface, borderRadius: 8 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  recentLatency:{ fontFamily: MONO, fontSize: 13, fontWeight: '900', width: 72 },
  recentTime: { fontFamily: MONO, fontSize: 9, color: C.textDim },
  qualPill:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  qualTxt:    { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
});

// ─────────────────────────────────────────────────────────────────
// ── CLIPBOARD BRIDGE TAB ─────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
function ClipboardBridgeTab({ isConnected }: { isConnected: boolean }) {
  const [clipText,    setClipText]    = useState('');
  const [sending,     setSending]     = useState(false);
  const [autoSync,    setAutoSync]    = useState(false);
  const [lastResult,  setLastResult]  = useState('');
  const [history,     setHistory]     = useState<{ text: string; type: string; ts: number }[]>([]);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevClip = useRef('');

  useEffect(() => {
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  useEffect(() => {
    if (autoSync && isConnected) {
      autoRef.current = setInterval(async () => {
        try {
          const txt: string = await new Promise((res) => { try { require('react-native').Clipboard.getString().then(res).catch(() => res('')); } catch { res(''); } });
          if (txt && txt !== prevClip.current) {
            prevClip.current = txt;
            setClipText(txt);
            await sendToPC(txt);
          }
        } catch {}
      }, 4000);
    } else {
      if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoSync, isConnected]);

  const pasteFromDevice = async () => {
    try {
      const txt: string = await new Promise((res) => { try { require('react-native').Clipboard.getString().then(res).catch(() => res('')); } catch { res(''); } });
      if (txt) { setClipText(txt); haptics.light(); }
    } catch {}
  };

  const sendToPC = useCallback(async (text?: string) => {
    const toSend = (text || clipText).trim();
    if (!toSend) { Alert.alert('Empty', 'Paste or type something first.'); return; }
    if (!isConnected) { Alert.alert('Offline', 'Connect to PC first.'); return; }
    setSending(true); setLastResult('');
    try {
      const ip = serverConnection.getIP();
      const port = serverConnection.getPort();
      const tok = serverConnection.getToken();
      const escaped = JSON.stringify(toSend);
      const script = `import subprocess,sys\ntry:\n    if sys.platform=='win32':\n        subprocess.run(['clip'],input=${escaped}.encode(),check=True)\n    elif sys.platform=='darwin':\n        subprocess.run(['pbcopy'],input=${escaped}.encode(),check=True)\n    else:\n        subprocess.run(['xclip','-selection','clipboard'],input=${escaped}.encode(),check=True)\n    print('Clipboard synced to PC')\nexcept Exception as e:\n    print(f'Error: {e}')`;
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 8000);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) headers['Authorization'] = `Bearer ${tok}`;
      const res = await fetch(`http://${ip}:${port}/api/execute`, {
        method: 'POST', headers, body: JSON.stringify({ script }), signal: ctrl.signal,
      });
      const data = await res.json();
      const msg = (data.output || '').trim() || 'Sent';
      setLastResult(msg);
      haptics.success();
      const type = toSend.startsWith('http') ? 'URL' : /\d{1,3}\.\d{1,3}/.test(toSend) ? 'IP' : toSend.includes('\n') ? 'CODE' : 'TEXT';
      setHistory(prev => [{ text: toSend.slice(0, 100), type, ts: Date.now() }, ...prev].slice(0, 15));
    } catch (e: any) {
      setLastResult('Error: ' + (e?.message || 'Failed'));
      haptics.warning();
    } finally { setSending(false); }
  }, [clipText, isConnected]);

  const HIST_COLOR: Record<string, string> = { URL: C.cyan, IP: C.teal, CODE: C.amber, TEXT: C.textMid };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: PAD, paddingBottom: 160, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: GAP3 }}>
        <StatCell icon="content-paste" label="SYNCED"  value={String(history.length)} color={C.purple} />
        <StatCell icon="wifi"          label="STATUS"   value={isConnected ? 'LIVE' : 'OFF'}  color={isConnected ? C.green : C.textMid} />
        <StatCell icon="timer"         label="AUTO"     value={autoSync ? 'ON' : 'OFF'} color={autoSync ? C.cyan : C.textMid} />
      </View>

      {/* Connection banner */}
      <View style={[cb.statusBanner, {
        borderColor: (isConnected ? C.green : C.amber) + '45',
        backgroundColor: (isConnected ? C.green : C.amber) + '07',
      }]}>
        <PulseDot color={isConnected ? C.green : C.amber} size={7} />
        <View style={{ flex: 1 }}>
          <Text style={[cb.bannerTitle, { color: isConnected ? C.green : C.amber }]}>
            {isConnected ? 'CLIPBOARD BRIDGE ACTIVE' : 'PC OFFLINE — LOCAL ONLY'}
          </Text>
          <Text style={cb.bannerSub}>
            {isConnected
              ? 'Text syncs directly to your PC clipboard via the server'
              : 'Connect your PC to enable real-time clipboard sync'}
          </Text>
        </View>
        {/* Auto-sync toggle */}
        <TouchableOpacity
          onPress={() => { haptics.selection(); setAutoSync(v => !v); }}
          style={[cb.autoToggle, {
            borderColor: (autoSync ? C.cyan : C.textDim) + '55',
            backgroundColor: (autoSync ? C.cyan : C.textDim) + '10',
          }]}
          activeOpacity={0.8}
        >
          <MaterialIcons name={autoSync ? 'sync' : 'sync-disabled'} size={14} color={autoSync ? C.cyan : C.textDim} />
          <Text style={[cb.autoTxt, { color: autoSync ? C.cyan : C.textDim }]}>{autoSync ? 'AUTO ON' : 'AUTO OFF'}</Text>
        </TouchableOpacity>
      </View>

      {/* Text input */}
      <View style={cb.inputCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 }}>
          <MaterialIcons name="edit" size={11} color={C.purple} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: C.purple, letterSpacing: 1 }}>
            TEXT TO SEND TO PC
          </Text>
        </View>
        <TextInput
          style={cb.textArea}
          value={clipText}
          onChangeText={setClipText}
          multiline
          placeholder="Type or paste text here..."
          placeholderTextColor={C.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />
        {/* Action buttons — 3 per row */}
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 9 }}>
          <TouchableOpacity
            style={[cb.btn, { backgroundColor: C.purple, flex: 2 }]}
            onPress={() => sendToPC()} disabled={sending} activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FFF" style={{ transform: [{ scale: 0.75 }] }} />
              : <MaterialIcons name="send" size={12} color="#FFF" />
            }
            <Text style={cb.btnTxt}>{sending ? '...' : 'SEND TO PC'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[cb.btn, { flex: 1, borderWidth: 1, borderColor: C.purple + '50', backgroundColor: C.surfaceHi }]} onPress={pasteFromDevice} activeOpacity={0.85}>
            <MaterialIcons name="content-paste" size={12} color={C.purple} />
            <Text style={[cb.btnTxt, { color: C.purple }]}>PASTE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[cb.btn, { flex: 1, borderWidth: 1, borderColor: C.red + '40', backgroundColor: C.surfaceHi }]} onPress={() => { setClipText(''); setLastResult(''); }} activeOpacity={0.85}>
            <MaterialIcons name="clear" size={12} color={C.red} />
            <Text style={[cb.btnTxt, { color: C.red }]}>CLR</Text>
          </TouchableOpacity>
        </View>

        {/* Result */}
        {lastResult ? (
          <View style={[cb.resultRow, { borderColor: (lastResult.includes('Error') ? C.red : C.green) + '40', backgroundColor: (lastResult.includes('Error') ? C.red : C.green) + '07' }]}>
            <MaterialIcons name={lastResult.includes('Error') ? 'error-outline' : 'check-circle-outline'} size={12} color={lastResult.includes('Error') ? C.red : C.green} />
            <Text style={[cb.resultTxt, { color: lastResult.includes('Error') ? C.red : C.green }]}>{lastResult}</Text>
          </View>
        ) : null}
      </View>

      {/* Sync history */}
      {history.length > 0 ? (
        <>
          <SectionDiv icon="history" label={`SYNC HISTORY (${history.length})`} color={C.cyan}
            right={
              <TouchableOpacity onPress={() => setHistory([])} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.red }}>CLEAR</Text>
              </TouchableOpacity>
            }
          />
          <View style={{ gap: 5 }}>
            {history.map((item, i) => {
              const col = HIST_COLOR[item.type] || C.textMid;
              return (
                <View key={i} style={[cb.histRow, { borderLeftColor: col }]}>
                  <View style={[cb.typePill, { borderColor: col + '50', backgroundColor: col + '12' }]}>
                    <Text style={[cb.typeTxt, { color: col }]}>{item.type}</Text>
                  </View>
                  <Text style={cb.histText} numberOfLines={1}>{item.text}</Text>
                  <Text style={cb.histTime}>{timeAgo(item.ts)}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const cb = StyleSheet.create({
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  bannerTitle:  { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  bannerSub:    { fontFamily: MONO, fontSize: 9, color: C.textMid, marginTop: 2, lineHeight: 13 },
  autoToggle:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, flexShrink: 0 },
  autoTxt:      { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  inputCard:    { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.purple + '40', padding: 12 },
  textArea:     { height: 100, fontFamily: MONO, fontSize: 13, color: C.text, lineHeight: 20, backgroundColor: C.surfaceHi, borderRadius: 9, borderWidth: 1, borderColor: C.purple + '28', padding: 10 },
  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9, paddingVertical: 11 },
  btnTxt:       { fontFamily: MONO, fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
  resultRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 9, marginTop: 8 },
  resultTxt:    { fontFamily: MONO, fontSize: 10, flex: 1 },
  histRow:      { flexDirection: 'row', alignItems: 'center', gap: 9, borderLeftWidth: 2.5, paddingLeft: 10, paddingRight: 12, paddingVertical: 9, backgroundColor: C.surface, borderRadius: 8 },
  typePill:     { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, flexShrink: 0 },
  typeTxt:      { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
  histText:     { flex: 1, fontFamily: MONO, fontSize: 11, color: C.text },
  histTime:     { fontFamily: MONO, fontSize: 8.5, color: C.textDim, flexShrink: 0 },
});

export default function NetOpsScreen() {
  return (
    <TabErrorBoundary name="Net Ops">
      <NetOpsScreenInner />
    </TabErrorBoundary>
  );
}


// ─────────────────────────────────────────────────────────────────
// ── MAIN SCREEN ──────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
function NetOpsScreenInner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectionStatus();
  const [activeTab, setActiveTab] = useState<'scanner' | 'ports' | 'ping' | 'clip'>('scanner');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TabSwipeOverlay leftRoute="/(tabs)/knowledge" rightRoute="/(tabs)/logs" />

      <NetOpsHeader
        safeTop={insets.top}
        isConnected={isConnected}
        activeTab={activeTab}
        onTabChange={t => setActiveTab(t as any)}
      />

      {activeTab === 'scanner' && <LANScannerTab isConnected={isConnected} />}
      {activeTab === 'ports'   && <PortAuditTab  isConnected={isConnected} />}
      {activeTab === 'ping'    && <PingTesterTab  isConnected={isConnected} />}
      {activeTab === 'clip'    && <ClipboardBridgeTab isConnected={isConnected} />}
    </View>
  );
}
