/**
 * BUTLER AI — PC INTEL CENTER v2.0
 * Fresh cyberpunk redesign · token system · crash-proof
 * Live vitals · Quick scripts · Actions · Scan · Undo journal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Animated, ActivityIndicator, Alert, Dimensions,
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
import { useCosmetic } from '@/contexts/CosmeticContext';
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';

const MONO: any = FONT.mono;
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;
const GAP = 8;
const COL3 = Math.floor((SW - PAD * 2 - GAP * 2) / 3);

// ─── QUICK SCRIPTS ────────────────────────────────────────────────
const QUICK_SCRIPTS = [
  { id: 'qs-clean',   label: 'Clean Temp',   icon: 'cleaning-services', color: COLOR.green,
    script: `import os,shutil,tempfile\nr=0;f=0\nfor p in [tempfile.gettempdir()]:\n    for i in os.listdir(p):\n        fp=os.path.join(p,i)\n        try:\n            s=os.path.getsize(fp) if os.path.isfile(fp) else 0\n            (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n            r+=1;f+=s\n        except:pass\nprint(f"Cleared {r} items, freed {f//1024//1024}MB")` },
  { id: 'qs-disk',    label: 'Disk Info',    icon: 'pie-chart',          color: COLOR.blue,
    script: `import psutil\nfor p in psutil.disk_partitions():\n    try:\n        u=psutil.disk_usage(p.mountpoint)\n        print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n    except:pass` },
  { id: 'qs-procs',   label: 'Top Procs',    icon: 'memory',             color: COLOR.magenta,
    script: `import psutil\nps=sorted(psutil.process_iter(['pid','name','cpu_percent','memory_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)\nprint("PID    CPU%  MEM%  NAME")\nfor p in ps[:10]:\n    i=p.info\n    print(f"{i['pid']:<7}{i['cpu_percent']:<6.1f}{i['memory_percent']:<6.2f}{i['name'][:28]}")` },
  { id: 'qs-net',     label: 'Net Test',     icon: 'router',             color: COLOR.amber,
    script: `import socket,time\nfor h,po in [('google.com',80),('8.8.8.8',53),('cloudflare.com',443)]:\n    try:\n        s=socket.socket();s.settimeout(3)\n        t=time.perf_counter();s.connect((h,po));ms=(time.perf_counter()-t)*1000;s.close()\n        print(f"OK  {h}:{po}  {ms:.0f}ms")\n    except Exception as e:\n        print(f"FAIL {h}:{po}  {e}")` },
  { id: 'qs-recycle', label: 'Empty Bin',    icon: 'delete-sweep',       color: COLOR.red,
    script: `import subprocess,sys\nif sys.platform=='win32':\n    subprocess.run(['powershell','-Command','Clear-RecycleBin -Force -ErrorAction SilentlyContinue'],capture_output=True)\n    print("Recycle bin emptied")\nelse:\n    import shutil,os;t=os.path.expanduser('~/.local/share/Trash/files')\n    shutil.rmtree(t,ignore_errors=True);os.makedirs(t,exist_ok=True)\n    print("Trash emptied")` },
  { id: 'qs-ram',     label: 'Free RAM',     icon: 'memory',             color: COLOR.teal,
    script: `import psutil,gc\nvm=psutil.virtual_memory()\nprint(f"Before: {vm.percent}% used")\ncollected=gc.collect()\nprint(f"GC freed: {collected} objects")\nvm2=psutil.virtual_memory()\nprint(f"After: {vm2.percent}% | Freed: {(vm.used-vm2.used)//1024//1024}MB")` },
  { id: 'qs-ip',      label: 'IP + Net',     icon: 'wifi',               color: COLOR.green,
    script: `import socket\nprint(f"Host: {socket.gethostname()}")\ntry:\n    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.connect(("8.8.8.8",80));print(f"LAN IP: {s.getsockname()[0]}");s.close()\nexcept:pass\nimport urllib.request\ntry:\n    p=urllib.request.urlopen("https://api.ipify.org",timeout=5).read().decode()\n    print(f"WAN IP: {p}")\nexcept:pass` },
  { id: 'qs-startup', label: 'Startup Apps', icon: 'launch',             color: COLOR.yellow,
    script: `import sys\nif sys.platform=='win32':\n    import winreg;KEY=r"SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run"\n    with winreg.OpenKey(winreg.HKEY_CURRENT_USER,KEY) as k:\n        i=0\n        while True:\n            try:n,v,_=winreg.EnumValue(k,i);print(f"  {n}: {v[:55]}");i+=1\n            except OSError:break\nelse:\n    import subprocess;r=subprocess.run(["systemctl","list-unit-files","--type=service","--state=enabled","--no-pager"],capture_output=True,text=True);print(r.stdout[:1800])` },
  { id: 'qs-ports',   label: 'Port Audit',   icon: 'radar',              color: COLOR.amber,
    script: `import socket\nfrom concurrent.futures import ThreadPoolExecutor\nH="127.0.0.1"\nPORTS=list(range(1,1025))\ndef scan(p):\n    s=socket.socket();s.settimeout(0.3);r=s.connect_ex((H,p));s.close()\n    return p if r==0 else None\nwith ThreadPoolExecutor(max_workers=150) as ex:\n    open_p=[p for p in ex.map(scan,PORTS) if p]\nprint(f"Open ports ({len(open_p)}): {sorted(open_p)}")` },
];

const ACTIONS = [
  { id: 'full_clean',    icon: 'cleaning-services', label: 'FULL CLEAN',  color: COLOR.green  },
  { id: 'organize',      icon: 'folder-special',    label: 'ORGANIZE',    color: COLOR.amber  },
  { id: 'disk_report',   icon: 'pie-chart',         label: 'DISK REPORT', color: COLOR.blue   },
  { id: 'empty_recycle', icon: 'delete-sweep',      label: 'RECYCLE BIN', color: COLOR.red    },
  { id: 'memory_clean',  icon: 'memory',            label: 'FREE RAM',    color: COLOR.magenta},
  { id: 'privacy_clean', icon: 'security',          label: 'PRIVACY',     color: COLOR.teal   },
];

// ─── MICRO ATOMS ──────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ─── HEADER ───────────────────────────────────────────────────────
const TICKER_LINES = [
  '>> pc.vitals() :: cpu=live :: ram=live :: disk=live',
  '>> scripts.exec() :: python=ready :: 12_quick_scripts',
  '>> scan.health() :: temp · cache · large_files · disk',
  '>> undo.journal() :: 15min_window :: rollback=enabled',
];

function IntelHeader({ safeTop, isConn, accent }: { safeTop: number; isConn: boolean; accent: string }) {
  const [idx, setIdx]   = useState(0);
  const [chars, setChars] = useState(0);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const line = TICKER_LINES[idx];
    if (chars < line.length) {
      const t = setTimeout(() => { if (m.current) setChars(c => c + 1); }, 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { if (m.current) { setIdx(i => (i + 1) % TICKER_LINES.length); setChars(0); } }, 2600);
    return () => clearTimeout(t);
  }, [chars, idx]);

  const scanA = useRef(new Animated.Value(-200)).current;
  const m2 = useRef(true);
  useEffect(() => {
    m2.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 200, duration: 3200, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -200, duration: 0, useNativeDriver: false }),
      Animated.delay(5000),
    ]));
    loop.start();
    return () => { m2.current = false; loop.stop(); };
  }, []);

  const cc = isConn ? COLOR.green : COLOR.red;

  return (
    <View style={[ih.root, { paddingTop: safeTop }]}>
      <Animated.View pointerEvents="none" style={[ih.scan, { transform: [{ translateX: scanA }] }]} />
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[COLOR.green, COLOR.cyan, COLOR.amber, COLOR.magenta, COLOR.teal].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={ih.row}>
        <View style={[ih.iconBox, { borderColor: COLOR.green + '50', backgroundColor: glow(COLOR.green, 8) }]}>
          <MaterialIcons name="monitor-heart" size={20} color={COLOR.green} />
          <View style={{ position: 'absolute', top: -2, right: -2 }}>
            <PulseDot color={isConn ? COLOR.green : COLOR.red} size={5} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ih.brand}>
            <Text style={{ color: COLOR.green }}>{'['}</Text>
            <Text style={{ color: '#FFF' }}>PC</Text>
            <Text style={{ color: COLOR.cyan }}>_INTEL</Text>
            <Text style={{ color: COLOR.green }}>{']'}</Text>
          </Text>
          <Text style={ih.sub}>
            <Text style={{ color: COLOR.green + '55' }}>{'# '}</Text>
            <Text style={{ color: COLOR.mid }}>vitals · scripts · actions · scan · undo</Text>
          </Text>
        </View>
        <View style={[ih.connPill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
          <PulseDot color={cc} size={5} />
          <Text style={[ih.connTxt, { color: cc }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>
      <View style={ih.tickerRow}>
        <MaterialCommunityIcons name="radar" size={9} color={COLOR.green + '80'} />
        <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.green, flex: 1 }} numberOfLines={1}>
          {TICKER_LINES[idx].slice(0, chars)}<Text style={{ color: COLOR.green + '50' }}>▌</Text>
        </Text>
      </View>
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: COLOR.green + '25' }} />
        <View style={{ width: 10, backgroundColor: COLOR.green }} />
        <View style={{ flex: 4, backgroundColor: COLOR.green + '10' }} />
      </View>
    </View>
  );
}
const ih = StyleSheet.create({
  root:    { backgroundColor: '#020609', overflow: 'hidden' },
  scan:    { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(0,255,136,0.025)', zIndex: 0 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 7, zIndex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  brand:   { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 8.5, lineHeight: 13, marginTop: 2 },
  connPill:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  connTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: PAD, paddingVertical: 7, zIndex: 1 },
});

// ─── RING GAUGE ───────────────────────────────────────────────────
function RingGauge({ pct, color, label, size = 76 }: { pct: number; color: string; label: string; size?: number }) {
  const gA = useRef(new Animated.Value(0.5)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(gA, { toValue: 1,   duration: 1300, useNativeDriver: false }),
      Animated.timing(gA, { toValue: 0.3, duration: 1300, useNativeDriver: false }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  const critCol = pct > 85 ? COLOR.red : pct > 70 ? COLOR.amber : color;
  const r25 = pct > 25; const r50 = pct > 50; const r75 = pct > 75;
  return (
    <View style={{ alignItems: 'center', gap: 5, flex: 1 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 6, borderColor: critCol + '18' }} />
        <Animated.View style={{
          position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 6,
          borderColor: 'transparent', borderTopColor: critCol,
          borderRightColor: r25 ? critCol : 'transparent',
          borderBottomColor: r50 ? critCol : 'transparent',
          borderLeftColor: r75 ? critCol : 'transparent',
          opacity: gA,
          ...Platform.select({ ios: { shadowColor: critCol, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 }, android: {} }),
        }} />
        <Text style={{ fontFamily: MONO, fontSize: size * 0.21, fontWeight: '900', color: critCol }}>{pct}%</Text>
      </View>
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: COLOR.mid, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

// ─── H-BAR ────────────────────────────────────────────────────────
function HBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: Math.min(1, pct / 100), duration: 900, useNativeDriver: false }).start();
  }, [pct]);
  const critCol = pct > 85 ? COLOR.red : pct > 70 ? COLOR.amber : color;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: COLOR.mid, width: 38, letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flex: 1, height: 7, backgroundColor: critCol + '15', borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', borderRadius: 4, backgroundColor: critCol, width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any }} />
      </View>
      <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: critCol, width: 38, textAlign: 'right' }}>{pct}%</Text>
    </View>
  );
}

// ─── STAT CELL ─────────────────────────────────────────────────────
function StatCell({ icon, label, value, color, sub }: { icon: string; label: string; value: string; color: string; sub?: string }) {
  return (
    <View style={[stc.cell, { borderTopColor: color, borderColor: color + '30' }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '60' }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color + '35' }} />
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={[stc.val, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{value}</Text>
      <Text style={stc.label}>{label}</Text>
      {sub ? <Text style={stc.sub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}
const stc = StyleSheet.create({
  cell:  { width: COL3, backgroundColor: COLOR.surf2, borderRadius: 10, borderWidth: 1.5, borderTopWidth: 3, padding: 10, gap: 3, alignItems: 'center', position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 3 } }) },
  val:   { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24, textAlign: 'center' },
  label: { fontFamily: MONO, fontSize: 8.5, fontWeight: '700', color: COLOR.dim, letterSpacing: 0.8, textAlign: 'center' },
  sub:   { fontFamily: MONO, fontSize: 8, color: COLOR.dim + '90', textAlign: 'center' },
});

// ─── SECTION LABEL ────────────────────────────────────────────────
function SectionLabel({ icon, label, color, right }: { icon: string; label: string; color: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, marginTop: 4 }}>
      <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: color }} />
      <MaterialIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color, letterSpacing: 1.8 }}>{label}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color + '30', marginLeft: 4 }} />
      {right}
    </View>
  );
}

// ─── ACTION BUTTON ────────────────────────────────────────────────
function ActionBtn({ icon, label, color, onPress, loading, disabled }: {
  icon: string; label: string; color: string; onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[abt.cell, { borderTopColor: color, borderColor: color + '40', backgroundColor: glow(color, 8), opacity: disabled ? 0.45 : 1 }]}
      onPress={() => { haptics.medium(); onPress(); }}
      disabled={disabled || loading} activeOpacity={0.85}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '70' }} />
      {loading ? <ActivityIndicator size="small" color={color} /> : <MaterialIcons name={icon as any} size={20} color={color} />}
      <Text style={[abt.label, { color }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}
const abt = StyleSheet.create({
  cell:  { width: COL3, minHeight: 76, borderWidth: 1.5, borderTopWidth: 3, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 5, gap: 5, position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 3 } }) },
  label: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center', lineHeight: 12 },
});

// ─── QUICK SCRIPT BTN ─────────────────────────────────────────────
function QSBtn({ icon, label, color, onPress, running, disabled }: {
  icon: string; label: string; color: string; onPress: () => void; running: boolean; disabled: boolean;
}) {
  return (
    <TouchableOpacity
      style={[qsb.cell, { borderTopColor: color, borderColor: color + '40', opacity: disabled ? 0.4 : 1 }]}
      onPress={() => { haptics.medium(); onPress(); }}
      disabled={disabled || running} activeOpacity={0.85}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '70' }} />
      <View style={[qsb.led, { backgroundColor: color }]} />
      {running ? <ActivityIndicator size="small" color={color} /> : <MaterialIcons name={icon as any} size={18} color={color} />}
      <Text style={[qsb.label, { color }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}
const qsb = StyleSheet.create({
  cell:  { width: COL3, minHeight: 72, backgroundColor: COLOR.surf2, borderWidth: 1.5, borderTopWidth: 3, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 5, position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 3 } }) },
  label: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center', lineHeight: 12 },
  led:   { position: 'absolute', bottom: 4, left: 5, width: 5, height: 5, borderRadius: 3, opacity: 0.8 },
});

// ─── PANEL CARD ───────────────────────────────────────────────────
function Card({ color, icon, title, children }: { color: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={[card.wrap, { borderColor: color + '30' }]}>
      <View style={[card.bar, { backgroundColor: color }]} />
      <View style={card.hdr}>
        <MaterialIcons name={icon as any} size={13} color={color} />
        <Text style={[card.title, { color: COLOR.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
const card = StyleSheet.create({
  wrap: { backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10 }, android: { elevation: 4 } }) },
  bar:  { height: 3 },
  hdr:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 9 },
  title:{ fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
const PLACEHOLDER_METRICS = { cpu: 0, ram: 0, disk: 0 };
const PLACEHOLDER_SCAN = { tempFiles: { sizeMb: 0 }, browserCache: { sizeMb: 0 }, largeFiles: { count: 0 }, totalRecoverable: 0, lifetimeCleaned: 0, scriptsRun: 0, scriptsUndone: 0 };

function PCIntelInner() {
  const insets = useSafeAreaInsets();
  const { T }  = useCosmetic();
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
  const [lastRef,   setLastRef]   = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    if (!serverConnection.isConnected()) return;
    try {
      const mRes = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/metrics'), {}).catch(() => null);
      if (mRes?.ok) {
        const d = await mRes.json();
        setMetrics({ cpu: d.cpu?.percent ?? 0, ram: d.memory?.percent ?? d.ram?.percent ?? 0, disk: d.disk?.percent ?? 0 });
      }
      const uRes = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/undo/list'), {}).catch(() => null);
      if (uRes?.ok) { const d = await uRes.json(); setUndoList(Array.isArray(d.entries) ? d.entries : []); }
      setLastRef(new Date());
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
      if (d) setScanData({ tempFiles: d.temp_files ?? scanData.tempFiles, browserCache: d.browser_cache ?? scanData.browserCache, largeFiles: d.large_files ?? scanData.largeFiles, totalRecoverable: d.total_recoverable_mb ?? 0, lifetimeCleaned: d.stats?.cleaned ?? 0, scriptsRun: d.stats?.scripts_run ?? 0, scriptsUndone: d.stats?.undone ?? 0 });
      haptics.success();
      Alert.alert('Scan Complete', `${d?.total_recoverable_mb ?? 0}MB recoverable`);
    } catch (e: any) { Alert.alert('Scan Error', e?.message); }
    finally { setScanning(false); }
  }, [isConnected, scanData]);

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
      setQsResult({ label: item.label, output: 'Error: ' + (e?.message || 'Timeout'), color: COLOR.red });
      haptics.warning();
    } finally { setQsRunning(null); }
  }, [isConnected]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg || COLOR.bg }}>
      <TabSwipeOverlay leftRoute="/(tabs)/knowledge" rightRoute="/(tabs)/builder" />
      <IntelHeader safeTop={insets.top} isConn={isConnected} accent={T.primary || COLOR.green} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: PAD, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* ── LIVE VITALS ── */}
        <Card color={COLOR.green} icon="monitor-heart" title="LIVE VITALS">
          <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 12, gap: GAP }}>
            <RingGauge pct={isConnected ? Math.round(metrics.cpu)  : 0} color={COLOR.teal}  label="CPU"  />
            <RingGauge pct={isConnected ? Math.round(metrics.ram)  : 0} color={COLOR.amber} label="RAM"  />
            <RingGauge pct={isConnected ? Math.round(metrics.disk) : 0} color={COLOR.blue}  label="DISK" />
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <HBar label="CPU"  pct={isConnected ? Math.round(metrics.cpu)  : 0} color={COLOR.teal}  />
            <HBar label="RAM"  pct={isConnected ? Math.round(metrics.ram)  : 0} color={COLOR.amber} />
            <HBar label="DISK" pct={isConnected ? Math.round(metrics.disk) : 0} color={COLOR.blue}  />
          </View>
        </Card>

        {/* ── STATS ── */}
        <SectionLabel icon="bar-chart" label="KEY METRICS" color={COLOR.magenta} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {[
            { icon: 'library-books', label: 'KB ENTRIES',  value: String(kbCount),                                                      color: COLOR.cyan    },
            { icon: 'cleaning-services', label: 'CLEANED',  value: isConnected ? String(scanData.lifetimeCleaned) : '—',                color: COLOR.green   },
            { icon: 'code',          label: 'SCRIPTS',     value: isConnected ? String(scanData.scriptsRun) : '—',                      color: COLOR.blue    },
            { icon: 'memory',        label: 'CPU %',       value: isConnected ? `${Math.round(metrics.cpu)}%` : '—',                    color: COLOR.red     },
            { icon: 'storage',       label: 'DISK FREE',   value: isConnected ? `${100 - Math.round(metrics.disk)}%` : '—',             color: COLOR.teal    },
            { icon: 'undo',          label: 'UNDONE',      value: isConnected ? String(scanData.scriptsUndone) : '—',                   color: COLOR.magenta },
          ].map(s => <StatCell key={s.label} {...s} />)}
        </View>

        {/* ── QUICK ACTIONS ── */}
        <SectionLabel icon="flash-on" label="QUICK ACTIONS" color={COLOR.green}
          right={!isConnected ? <View style={[{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderColor: COLOR.red + '45', backgroundColor: glow(COLOR.red, 6) }]}><Text style={{ fontFamily: MONO, fontSize: 7, color: COLOR.red }}>CONNECT PC</Text></View> : null} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {ACTIONS.map(a => (
            <ActionBtn key={a.id} icon={a.icon} label={a.label} color={a.color}
              loading={actionId === a.id} disabled={!isConnected}
              onPress={() => runAction(a.id, a.label)} />
          ))}
        </View>

        {/* ── SCAN RESULTS ── */}
        <Card color={COLOR.blue} icon="search" title="SCAN RESULTS">
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <HBar label="TEMP"  pct={isConnected ? Math.min(99, Math.round(scanData.tempFiles.sizeMb / 100)) : 0}  color={COLOR.red} />
            <HBar label="CACHE" pct={isConnected ? Math.min(99, Math.round(scanData.browserCache.sizeMb / 100)) : 0} color={COLOR.amber} />
            <HBar label="LARGE" pct={isConnected ? Math.min(99, scanData.largeFiles.count) : 0} color={COLOR.magenta} />
            <HBar label="DISK"  pct={isConnected ? Math.round(metrics.disk) : 0} color={COLOR.blue} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: isConnected ? COLOR.green : COLOR.mid }}>
                {isConnected ? `${(scanData.totalRecoverable / 1024).toFixed(1)}GB recoverable` : 'Connect PC to scan'}
              </Text>
              <TouchableOpacity onPress={runScan} disabled={scanning || !isConnected}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderColor: COLOR.blue + '55', backgroundColor: glow(COLOR.blue, 8), opacity: !isConnected ? 0.4 : 1 }]}>
                {scanning ? <ActivityIndicator size="small" color={COLOR.blue} /> : <MaterialIcons name="radar" size={12} color={COLOR.blue} />}
                <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.blue }}>{scanning ? 'SCANNING' : 'SCAN NOW'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* ── QUICK SCRIPTS ── */}
        <Card color={COLOR.magenta} icon="code" title="QUICK PC SCRIPTS">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: 14, paddingBottom: qsResult ? 0 : 14 }}>
            {QUICK_SCRIPTS.map(item => (
              <QSBtn key={item.id} icon={item.icon} label={item.label} color={item.color}
                running={qsRunning === item.id} disabled={!isConnected}
                onPress={() => runQS(item)} />
            ))}
          </View>
          {qsResult ? (
            <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 }}>
              <View style={[{ borderWidth: 1.5, borderRadius: 10, padding: 11, borderColor: qsResult.color + '50', backgroundColor: glow(qsResult.color, 6) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: qsResult.color }} />
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: qsResult.color, letterSpacing: 1 }}>{qsResult.label.toUpperCase()} OUTPUT</Text>
                  <TouchableOpacity onPress={() => setQsResult(null)} style={{ marginLeft: 'auto' as any }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialIcons name="close" size={12} color={COLOR.dim} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: qsResult.color + 'CC', lineHeight: 17 }} selectable>{qsResult.output}</Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* ── AUTOMATION ── */}
        <Card color={COLOR.cyan} icon="smart-toy" title="SMART AUTOMATION">
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 7 }}>
            {[
              { icon: 'schedule',       col: COLOR.teal,   label: 'Auto-clean temp files',   sub: 'Daily 9AM · temp+cache',      id: 'full_clean'    },
              { icon: 'folder-special', col: COLOR.amber,  label: 'Auto-organize Downloads', sub: 'Weekly · by file type',       id: 'organize'      },
              { icon: 'security',       col: COLOR.magenta,label: 'Privacy wipe on idle',    sub: '30min idle · clipboard+docs', id: 'privacy_clean' },
              { icon: 'bar-chart',      col: COLOR.blue,   label: 'Monday disk report',      sub: 'Weekly · full breakdown',     id: 'disk_report'   },
            ].map((item, i) => (
              <TouchableOpacity key={i} onPress={() => isConnected ? runAction(item.id, item.label) : Alert.alert('Offline', 'Connect PC first')}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, borderColor: item.col + '30', backgroundColor: glow(item.col, 6) }]}
                activeOpacity={0.85}>
                <View style={[{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: item.col + '40', backgroundColor: glow(item.col, 14), flexShrink: 0 }]}>
                  <MaterialIcons name={item.icon as any} size={15} color={item.col} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '700', color: isConnected ? item.col : COLOR.mid, marginBottom: 1 }}>{item.label}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.dim }}>{item.sub}</Text>
                </View>
                <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, borderColor: (isConnected ? COLOR.green : COLOR.mid) + '45', backgroundColor: glow(isConnected ? COLOR.green : COLOR.mid, 8) }]}>
                  <PulseDot color={isConnected ? COLOR.green : COLOR.mid} size={4} />
                  <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: isConnected ? COLOR.green : COLOR.mid }}>{isConnected ? 'RUN' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── UNDO JOURNAL ── */}
        <Card color={COLOR.amber} icon="undo" title="UNDO JOURNAL">
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            {undoList.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 18, gap: 7 }}>
                <MaterialIcons name={isConnected ? 'check-circle-outline' : 'wifi-off'} size={28} color={COLOR.dim} />
                <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim }}>
                  {isConnected ? 'No pending rollbacks — all clear' : 'Connect PC to see undo journal'}
                </Text>
              </View>
            ) : undoList.map((entry: any) => (
              <View key={entry.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 2.5, borderLeftColor: COLOR.amber, paddingLeft: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLOR.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '600', color: COLOR.text }} numberOfLines={1}>{entry.userRequest || 'Script execution'}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.amber, marginTop: 2 }}>{entry.remainingMin}</Text>
                </View>
                <TouchableOpacity onPress={() => rollback(entry.id)} disabled={rollingId === entry.id}
                  style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderColor: COLOR.amber + '60', backgroundColor: glow(COLOR.amber, 8) }]}>
                  {rollingId === entry.id ? <ActivityIndicator size="small" color={COLOR.amber} /> : <><MaterialIcons name="undo" size={14} color={COLOR.amber} /><Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.amber }}>UNDO</Text></>}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: 20 }} />
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
