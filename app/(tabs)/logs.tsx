
/**
 * ⚡ PC HEALTH — Compact Grid Layout
 * LAYOUT LAW: 3-col grids everywhere, full phone width, no 1-item rows, no "How it Works"
 * Sections: Live Vitals → CPU/RAM/Disk rings → Quick Scripts (3-col) → Actions (3-col) →
 *           Scan Results → Stats (3-col) → Charts → Smart Automation → Undo Journal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ExpoImage } from 'expo-image';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity,
  ScrollView, Animated, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { serverConnection } from '@/services/serverConnection';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { PC_ACTION_SCRIPTS, PC_SCAN_SCRIPT } from '@/services/pcActionScripts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnectionStatus } from '@/hooks/useConnection';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { CompactPageHeader } from '@/components/ui/CompactPageHeader';
import { PageMascot } from '@/components/ui/PageMascot';
import { useFocusEffect } from 'expo-router';
import { useCosmetic } from '@/contexts/CosmeticContext';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

// ── Layout constants — LAYOUT LAW ────────────────────────────────
const PAD = 14;
const GAP3 = 8;
const COL3_W = Math.floor((SW - PAD * 2 - GAP3 * 2) / 3);
const COL2_W = Math.floor((SW - PAD * 2 - GAP3) / 2);

const C = {
  bg:       '#020407',
  surface:  '#070D16',
  surfaceHi:'#0C1420',
  border:   'rgba(0,255,255,0.12)',
  text:     '#D8E8F4',
  textMid:  '#7A9AB8',
  textDim:  '#3A5068',
  teal:     '#00FFFF',
  green:    '#00FF88',
  amber:    '#F5A623',
  red:      '#FF3131',
  blue:     '#4A9EFF',
  purple:   '#BF00FF',
  cyan:     '#00BFFF',
};

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

// ── ANIMATED RING GAUGE ───────────────────────────────────────────
function RingGauge({ pct, color, label, size = 76 }: {
  pct: number; color: string; label: string; size?: number;
}) {
  const glow = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1,   duration: 1200, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver: false }),
    ]));
    a.start();
    return () => a.stop();
  }, []);
  const r25 = pct > 25; const r50 = pct > 50; const r75 = pct > 75;
  const critColor = pct > 85 ? C.red : pct > 70 ? C.amber : color;
  return (
    <View style={{ alignItems: 'center', gap: 5, flex: 1 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 6, borderColor: critColor + '18' }} />
        <Animated.View style={{
          position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 6,
          borderColor: 'transparent', borderTopColor: critColor,
          borderRightColor: r25 ? critColor : 'transparent',
          borderBottomColor: r50 ? critColor : 'transparent',
          borderLeftColor: r75 ? critColor : 'transparent',
          opacity: glow,
          ...Platform.select({ ios: { shadowColor: critColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 }, android: {} }),
        }} />
        <Text style={{ fontSize: size * 0.21, fontWeight: '900', color: critColor, fontFamily: MONO }}>{pct}%</Text>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '700', color: C.textMid, fontFamily: MONO, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

// ── COMPACT STAT CELL (3-col) ─────────────────────────────────────
function StatCell({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <View style={[g3.cell, { borderColor: color + '35', borderTopColor: color }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '60' }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color + '35' }} />
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={[g3.cellVal, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</Text>
      <Text style={g3.cellLabel} numberOfLines={1}>{label}</Text>
      {sub ? <Text style={g3.cellSub} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

// ── ACTION BUTTON (3-col) ─────────────────────────────────────────
function ActionBtn3({ icon, label, sub, color, onPress, loading = false, disabled = false }: {
  icon: string; label: string; sub?: string; color: string;
  onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[g3.actionCell, { borderColor: color + '45', borderTopColor: color, backgroundColor: color + '08', opacity: disabled ? 0.4 : 1 }]}
      onPress={() => { haptics.medium(); onPress(); }}
      disabled={disabled || loading} activeOpacity={0.85}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '70' }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color + '40' }} />
      {loading
        ? <ActivityIndicator size="small" color={color} />
        : <MaterialIcons name={icon as any} size={20} color={color}
            style={Platform.OS === 'ios' ? { textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 } : {}} />
      }
      <Text style={[g3.actionLabel, { color }]} numberOfLines={2}>{label}</Text>
      {sub ? <Text style={g3.actionSub} numberOfLines={1}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

// ── QUICK SCRIPT BUTTON (3-col) ────────────────────────────────────
function QuickScriptBtn({ icon, label, color, onPress, isRunning, disabled }: {
  icon: string; label: string; color: string;
  onPress: () => void; isRunning: boolean; disabled: boolean;
}) {
  return (
    <TouchableOpacity
      style={[g3.scriptCell, { borderColor: color + '45', borderTopColor: color, opacity: disabled ? 0.4 : 1 }]}
      onPress={() => { haptics.medium(); onPress(); }}
      disabled={disabled || isRunning} activeOpacity={0.85}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '70' }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: color + '40' }} />
      <View style={[g3.scriptLed, { backgroundColor: color }]} />
      {isRunning
        ? <ActivityIndicator size="small" color={color} />
        : <MaterialIcons name={icon as any} size={18} color={color}
            style={Platform.OS === 'ios' ? { textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 5 } : {}} />
      }
      <Text style={[g3.scriptLabel, { color }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const g3 = StyleSheet.create({
  cell: {
    width: COL3_W, backgroundColor: '#070E1A', borderRadius: 10,
    borderWidth: 1.5, borderTopWidth: 3, padding: 10, gap: 3, alignItems: 'center',
    position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  cellVal:   { fontSize: 20, fontWeight: '900', fontFamily: MONO, lineHeight: 24, textAlign: 'center' },
  cellLabel: { fontSize: 9, fontWeight: '700', color: '#4A6878', fontFamily: MONO, letterSpacing: 0.8, textAlign: 'center' },
  cellSub:   { fontSize: 8, color: '#3A4E5A', fontFamily: MONO, textAlign: 'center' },
  actionCell: {
    width: COL3_W, minHeight: 76, borderWidth: 1.5, borderTopWidth: 3, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 5, gap: 5,
    position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  actionLabel: { fontSize: 9, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.2, textAlign: 'center' },
  actionSub:   { fontSize: 7.5, color: C.textDim, fontFamily: MONO, textAlign: 'center' },
  scriptCell: {
    width: COL3_W, minHeight: 72, backgroundColor: '#080F12',
    borderWidth: 1.5, borderTopWidth: 3, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 5, position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 3 } }),
  },
  scriptLabel: { fontSize: 8.5, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.2, textAlign: 'center', lineHeight: 12 },
  scriptLed:   { position: 'absolute', bottom: 4, left: 5, width: 5, height: 5, borderRadius: 3, opacity: 0.8 },
});

// ── HBAR ─────────────────────────────────────────────────────────
function HBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(1, pct / 100), duration: 900, useNativeDriver: false }).start();
  }, [pct]);
  const critColor = pct > 85 ? C.red : pct > 70 ? C.amber : color;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: C.textMid, fontFamily: MONO, width: 42, letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flex: 1, height: 8, backgroundColor: 'rgba(0,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{
          height: '100%', borderRadius: 4, backgroundColor: critColor,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any,
          ...Platform.select({ ios: { shadowColor: critColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 }, android: {} }),
        }} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '900', color: critColor, fontFamily: MONO, width: 38, textAlign: 'right' }}>{pct}%</Text>
    </View>
  );
}

// ── MINI BAR CHART ────────────────────────────────────────────────
function MiniBar({ value, maxVal, color, delay, day, total }: {
  value: number; maxVal: number; color: string; delay: number; day: string; total: number;
}) {
  const h = Math.max(4, (value / maxVal) * 48);
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: h, duration: 600 + delay, useNativeDriver: false }).start();
  }, [h]);
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
        <Animated.View style={{ width: '85%', backgroundColor: color, borderRadius: 3, opacity: 0.65 + (delay / 80 / Math.max(1, total)) * 0.35, height: barAnim }} />
      </View>
      <Text style={{ fontSize: 7, color: C.textDim, fontFamily: MONO }}>{day}</Text>
    </View>
  );
}

function MiniBarChart({ data, color, label }: { data: { day: string; value: number }[]; color: string; label: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ fontSize: 8, color: C.textDim, fontFamily: MONO, letterSpacing: 0.8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 50 }}>
        {data.map((d, i) => (
          <MiniBar key={i} value={d.value} maxVal={maxVal} color={color} delay={i * 80} day={d.day} total={data.length} />
        ))}
      </View>
    </View>
  );
}

// ── UNDO JOURNAL ENTRY ────────────────────────────────────────────
function UndoEntry({ entry, onRollback, rolling }: {
  entry: { id: number; userRequest: string; remainingMin: string };
  onRollback: (id: number) => void; rolling: boolean;
}) {
  const amber = '#FF9900';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 2.5, borderLeftColor: amber, paddingLeft: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: C.text, fontFamily: MONO }} numberOfLines={1}>{entry.userRequest || 'Script execution'}</Text>
        <Text style={{ fontSize: 9, color: amber, fontFamily: MONO, marginTop: 2 }}>{entry.remainingMin}</Text>
      </View>
      <TouchableOpacity onPress={() => { haptics.medium(); onRollback(entry.id); }} disabled={rolling}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderColor: amber + '60', backgroundColor: amber + '12' }}
        activeOpacity={0.85}>
        {rolling ? <ActivityIndicator size="small" color={amber} style={{ transform: [{ scale: 0.7 }] }} /> : <><MaterialIcons name="undo" size={14} color={amber} /><Text style={{ fontSize: 10, fontWeight: '900', fontFamily: MONO, color: amber }}>UNDO</Text></>}
      </TouchableOpacity>
    </View>
  );
}

// ── PLACEHOLDER DATA ──────────────────────────────────────────────
const PLACEHOLDER_SCAN = { tempFiles: { sizeMb: 0 }, browserCache: { sizeMb: 0 }, largeFiles: { count: 0 }, totalRecoverable: 0, lifetimeCleaned: 0, lifetimeOrganized: 0, scriptsRun: 0, scriptsUndone: 0 };
const PLACEHOLDER_METRICS = { cpu: 0, ram: 0, disk: 0, diskTotal: 500, diskUsed: 0 };
const PLACEHOLDER_GROWTH = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({ day, cleaned: 0, recovered_mb: 0 }));

// ── INTEL STRIP — KB / Scripts / Disk compact 3-col ───────────────
// KB ENTRIES: real count from knowledgeAccumulator.getStats() (local AsyncStorage).
// SCRIPTS RUN: real count from server scan data (only when connected).
// DISK USED: real disk % from live server metrics (only when connected).
function IntelStrip({ isConnected, metrics, scanData, kbCount }: {
  isConnected: boolean;
  metrics: typeof PLACEHOLDER_METRICS;
  scanData: typeof PLACEHOLDER_SCAN;
  kbCount: number;
}) {
  const items = [
    { icon: 'library-books', label: 'KB ENTRIES',  value: String(kbCount),                                                  color: C.cyan   },
    { icon: 'code',          label: 'SCRIPTS RUN', value: isConnected ? String(scanData.scriptsRun) : '—',                   color: C.purple },
    { icon: 'storage',       label: 'DISK USED',   value: isConnected ? `${Math.round(metrics.disk)}%` : '—',               color: C.green  },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: GAP3 }}>
      {items.map(item => (
        <StatCell key={item.label} icon={item.icon} label={item.label} value={item.value} color={item.color} />
      ))}
    </View>
  );
}

// ── SCAN RESULT CARD ───────────────────────────────────────────────
function ScanResultCard({ isConnected, scanData, metrics, onScan, scanning }: {
  isConnected: boolean;
  scanData: typeof PLACEHOLDER_SCAN;
  metrics: typeof PLACEHOLDER_METRICS;
  onScan: () => void;
  scanning: boolean;
}) {
  return (
    <View style={[card.wrap, { borderColor: C.blue + '35' }]}>
      <View style={[card.topBar, { backgroundColor: C.blue }]} />
      <View style={card.header}>
        <MaterialIcons name="search" size={14} color={C.blue} />
        <Text style={[card.title, { color: C.text }]}>SCAN RESULTS</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onScan} disabled={scanning}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderColor: C.blue + '60', backgroundColor: C.blue + '12' }}>
          {scanning ? <ActivityIndicator size="small" color={C.blue} style={{ transform: [{ scale: 0.65 }] }} /> : <MaterialIcons name="radar" size={11} color={C.blue} />}
          <Text style={{ fontSize: 9, fontWeight: '900', fontFamily: MONO, color: C.blue }}>{scanning ? 'SCANNING' : 'SCAN NOW'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 0 }}>
        <HBar label="TEMP"  pct={isConnected ? Math.min(99, Math.round(scanData.tempFiles.sizeMb / 100)) : 0}  color={C.red} />
        <HBar label="CACHE" pct={isConnected ? Math.min(99, Math.round(scanData.browserCache.sizeMb / 100)) : 0} color={C.amber} />
        <HBar label="LARGE" pct={isConnected ? Math.min(99, Math.round(scanData.largeFiles.count)) : 0} color={C.purple} />
        <HBar label="DISK"  pct={isConnected ? Math.round(metrics.disk) : 0} color={C.blue} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, borderColor: C.green + '40', backgroundColor: C.green + '08' }}>
          <MaterialIcons name="storage" size={12} color={C.green} />
          <Text style={{ flex: 1, fontSize: 10, fontFamily: MONO, color: C.green, lineHeight: 15 }}>
            {isConnected ? `${(scanData.totalRecoverable / 1024).toFixed(1)}GB recoverable — run FULL CLEAN to free it` : 'Connect PC to scan for recoverable space'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap:   { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10 }, android: { elevation: 4 } }) },
  topBar: { height: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  title:  { fontSize: 12, fontWeight: '900', fontFamily: MONO, letterSpacing: 1 },
});

// ── QUICK PC SCRIPTS DATA ─────────────────────────────────────────
const PC_QUICK_SCRIPTS = [
  { id: 'pcs-clean-temp',    label: 'Clean Temp',    icon: 'cleaning-services', color: '#00FF88',
    script: `import shutil,os,tempfile\nfreed=0;removed=0\nfor p in [tempfile.gettempdir()]:\n    for item in os.listdir(p):\n        fp=os.path.join(p,item)\n        try:\n            sz=os.path.getsize(fp) if os.path.isfile(fp) else 0\n            (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n            freed+=sz;removed+=1\n        except:pass\nprint(f"Cleared {removed} items, freed {freed//1024//1024}MB")` },
  { id: 'pcs-disk-info',     label: 'Disk Info',     icon: 'pie-chart',         color: '#3D7FFF',
    script: `import psutil\nfor p in psutil.disk_partitions():\n    try:\n        u=psutil.disk_usage(p.mountpoint)\n        print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n    except:pass` },
  { id: 'pcs-top-proc',      label: 'Top Procs',     icon: 'memory',            color: '#BB33FF',
    script: `import psutil\nprocs=sorted(psutil.process_iter(['pid','name','cpu_percent','memory_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)\nprint("PID    CPU%   MEM%   NAME")\nfor p in procs[:12]:\n    i=p.info\n    print(f"{i['pid']:<7}{i['cpu_percent']:<7.1f}{i['memory_percent']:<7.2f}{i['name'][:30]}")` },
  { id: 'pcs-network-test',  label: 'Net Test',      icon: 'router',            color: '#FF9900',
    script: `import socket,time\nHOSTS=[('google.com',80),('8.8.8.8',53),('cloudflare.com',443)]\nfor host,port in HOSTS:\n    try:\n        s=socket.socket()\n        s.settimeout(3)\n        t=time.perf_counter()\n        s.connect((host,port))\n        ms=(time.perf_counter()-t)*1000\n        s.close()\n        print(f"OK  {host}:{port}  {ms:.0f}ms")\n    except Exception as e:\n        print(f"FAIL {host}:{port}  {e}")` },
  { id: 'pcs-recycle-bin',   label: 'Empty Recycle', icon: 'delete-sweep',      color: '#FF3344',
    script: `import subprocess,sys\nif sys.platform=='win32':\n    subprocess.run(['powershell','-Command','Clear-RecycleBin -Force -ErrorAction SilentlyContinue'],capture_output=True)\n    print("Recycle bin emptied")\nelse:\n    import shutil,os\n    trash=os.path.expanduser('~/.local/share/Trash/files')\n    if os.path.exists(trash):\n        shutil.rmtree(trash,ignore_errors=True)\n        os.makedirs(trash,exist_ok=True)\n        print("Trash emptied")\n    else:\n        print("No trash folder found")` },
  { id: 'pcs-free-ram',      label: 'Free RAM',      icon: 'memory',            color: '#00DDEE',
    script: `import psutil,gc\nvm=psutil.virtual_memory()\nprint(f"Before: {vm.percent}% used")\ncollected=gc.collect()\nprint(f"GC freed: {collected} objects")\nvm2=psutil.virtual_memory()\nprint(f"After: {vm2.percent}% | Freed: {(vm.used-vm2.used)//1024//1024}MB")` },
  { id: 'pcs-defender-scan', label: 'Virus Scan',    icon: 'security',          color: '#FF6622',
    script: `import subprocess,sys\nif sys.platform=='win32':\n    MPC=r"C:\\Program Files\\Windows Defender\\MpCmdRun.exe"\n    r=subprocess.run([MPC,'-ScanType','1'],capture_output=True,text=True,timeout=120)\n    print(r.stdout or "Quick scan complete")\nelse:\n    print("Run clamscan on Linux/Mac")` },
  { id: 'pcs-startup-list',  label: 'Startup Apps',  icon: 'play-circle-outline', color: '#FFD700',
    script: `import sys\nif sys.platform=='win32':\n    import winreg\n    KEY=r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"\n    with winreg.OpenKey(winreg.HKEY_CURRENT_USER,KEY) as k:\n        i=0\n        while True:\n            try:\n                name,val,_=winreg.EnumValue(k,i)\n                print(f"  {name}: {val[:60]}")\n                i+=1\n            except OSError:break\nelse:\n    import subprocess\n    r=subprocess.run(["systemctl","list-unit-files","--type=service","--state=enabled","--no-pager"],capture_output=True,text=True)\n    print(r.stdout[:2000])` },
  { id: 'pcs-ip-info',       label: 'IP + Net',      icon: 'wifi',              color: '#00FF88',
    script: `import socket\nprint(f"Hostname: {socket.gethostname()}")\ntry:\n    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)\n    s.connect(("8.8.8.8",80))\n    print(f"Local IP: {s.getsockname()[0]}")\n    s.close()\nexcept:pass\nimport urllib.request\ntry:\n    pub=urllib.request.urlopen("https://api.ipify.org",timeout=5).read().decode()\n    print(f"Public IP: {pub}")\nexcept:pass` },
  { id: 'pcs-update-check',  label: 'Check Updates', icon: 'system-update',     color: '#00DDEE',
    script: `import subprocess,sys\nif sys.platform=='win32':\n    r=subprocess.run(["powershell","-Command","(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search('IsInstalled=0').Updates.Count"],capture_output=True,text=True,timeout=30)\n    print(f"Pending updates: {r.stdout.strip()}")\nelse:\n    r=subprocess.run(["apt","list","--upgradable"],capture_output=True,text=True,shell=True)\n    print(r.stdout[:2000] or "No updates found")` },
  { id: 'pcs-event-log',     label: 'Error Events',  icon: 'error-outline',     color: '#FF3344',
    script: `import subprocess,sys\nif sys.platform=='win32':\n    r=subprocess.run(["powershell","-Command","Get-EventLog -LogName System -EntryType Error -Newest 8 | Format-Table TimeGenerated,Source,Message -AutoSize"],capture_output=True,text=True,timeout=30)\n    print(r.stdout[:2000] or "No errors found")\nelse:\n    r=subprocess.run(["journalctl","-p","err","-n","10","--no-pager","--output=short"],capture_output=True,text=True,timeout=10)\n    print(r.stdout[:2000])` },
  { id: 'pcs-port-audit',    label: 'Port Audit',    icon: 'radar',             color: '#FF9900',
    script: `import socket\nfrom concurrent.futures import ThreadPoolExecutor\nHOST="127.0.0.1"\nWELL_KNOWN={21:'FTP',22:'SSH',80:'HTTP',443:'HTTPS',445:'SMB',3389:'RDP',5432:'Postgres',6379:'Redis',8080:'HTTP-Alt'}\nPORTS=list(range(1,1025))+list(WELL_KNOWN.keys())\nPORTS=list(set(PORTS))\ndef scan(p):\n    s=socket.socket();s.settimeout(0.4)\n    r=s.connect_ex((HOST,p));s.close()\n    return p if r==0 else None\nwith ThreadPoolExecutor(max_workers=150) as ex:\n    open_ports=[p for p in ex.map(scan,PORTS) if p]\nprint(f"Open ports: {len(open_ports)}")\nfor port in sorted(open_ports):\n    flag=" RISKY" if port in [21,445,3389] else ""\n    print(f"  {port:5} {WELL_KNOWN.get(port,'Unknown')}{flag}")` },
];

// ── MAIN SCREEN ───────────────────────────────────────────────────
function PCCheckScreenInner() {
  const { T } = useCosmetic();
  const { isConnected, addr: serverAddr } = useConnectionStatus();
  const insets = useSafeAreaInsets();

  const [qpsRunning,  setQpsRunning]  = useState<string | null>(null);
  const [qpsResult,   setQpsResult]   = useState<{ label: string; output: string; color: string } | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [scanning,    setScanning]    = useState(false);
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [rollingId,   setRollingId]   = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [metrics,     setMetrics]     = useState(PLACEHOLDER_METRICS);
  const [scanData,    setScanData]    = useState(PLACEHOLDER_SCAN);
  const [growth,      setGrowth]      = useState(PLACEHOLDER_GROWTH);
  const [undoList,    setUndoList]    = useState<any[]>([]);
  // Real KB count — read from knowledgeAccumulator (local + server-synced)
  const [kbCount,     setKbCount]     = useState<number>(0);

  // Fetch real KB count independently — works offline too (reads AsyncStorage)
  const fetchKbCount = useCallback(async () => {
    try {
      const stats = await knowledgeAccumulator.getStats();
      setKbCount(stats.totalFindings ?? 0);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    if (!serverConnection.isConnected()) return;
    setLoading(true);
    try {
      const withTimeout = (ms: number) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

      const mRes = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/metrics'), { signal: withTimeout(6000) }).catch(() => null);
      if (mRes?.ok) {
        const d = await mRes.json();
        setMetrics({ cpu: d.cpu?.percent ?? 0, ram: d.memory?.percent ?? d.ram?.percent ?? 0, disk: d.disk?.percent ?? 0, diskTotal: d.disk?.total_gb ?? 500, diskUsed: d.disk?.used_gb ?? 0 });
      }

      const scanRes = await serverConnection.fetchWithAuth(
        serverConnection.buildUrl('/api/execute'),
        { method: 'POST', body: JSON.stringify({ script: PC_SCAN_SCRIPT }), signal: withTimeout(12000) }
      ).catch(() => null);
      if (scanRes?.ok) {
        const raw = await scanRes.json();
        try {
          const d = raw.output ? JSON.parse(raw.output.trim()) : raw;
          setScanData({
            tempFiles:        d.temp_files    ?? scanData.tempFiles,
            browserCache:     d.browser_cache ?? scanData.browserCache,
            largeFiles:       d.large_files   ?? scanData.largeFiles,
            totalRecoverable: d.total_recoverable_mb ?? scanData.totalRecoverable,
            lifetimeCleaned:  d.stats?.cleaned    ?? 0,
            lifetimeOrganized:d.stats?.organized   ?? 0,
            scriptsRun:       d.stats?.scripts_run ?? 0,
            scriptsUndone:    d.stats?.undone       ?? 0,
          });
        } catch {}
      }

      const uRes = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/undo/list'), { signal: withTimeout(6000) }).catch(() => null);
      if (uRes?.ok) { const d = await uRes.json(); setUndoList(Array.isArray(d.entries) ? d.entries : []); }

      setLastRefresh(new Date());
    } catch {}
    finally {
      setLoading(false);
      // Always refresh KB count after a full fetch cycle
      fetchKbCount().catch(() => {});
    }
  }, [scanData]); // Added scanData to dependency array for clarity, though it's used for default values

  const runAction = useCallback(async (action: string, label: string) => {
    if (!serverConnection.isConnected()) { Alert.alert('Offline', 'Connect to PC from HOME tab first.'); return; }
    const script = PC_ACTION_SCRIPTS[action];
    if (!script) { Alert.alert(label, `${label} is not supported on this server version.`); return; }
    haptics.heavy(); setActionId(action);
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 30000);
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/execute'),
        { method: 'POST', body: JSON.stringify({ script }), signal: ctrl.signal });
      const d = await res.json(); haptics.success();
      Alert.alert(label, d.output || d.error || 'Done'); fetchAll();
    } catch (e: any) { haptics.warning(); Alert.alert('Error', e?.message || 'Action failed'); }
    finally { setActionId(null); }
  }, [fetchAll]);

  const rollback = useCallback(async (id: number) => {
    if (!serverConnection.isConnected()) return;
    setRollingId(id);
    try {
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/undo/rollback'), { method: 'POST', body: JSON.stringify({ id }) });
      const d = await res.json(); haptics.success();
      Alert.alert('Rollback', d.message || 'Restored successfully');
      setUndoList(prev => prev.filter(e => e.id !== id));
    } catch (e: any) { Alert.alert('Error', e?.message); }
    finally { setRollingId(null); }
  }, []);

  const runScan = useCallback(async () => {
    if (!serverConnection.isConnected()) { Alert.alert('Offline', 'Connect to PC from HOME tab first.'); return; }
    haptics.heavy(); setScanning(true);
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 30000);
      const res = await serverConnection.fetchWithAuth(serverConnection.buildUrl('/api/execute'),
        { method: 'POST', body: JSON.stringify({ script: PC_SCAN_SCRIPT }), signal: ctrl.signal });
      const raw = await res.json();
      const d = raw.output ? JSON.parse(raw.output.trim()) : null;
      if (d) setScanData({ tempFiles: d.temp_files ?? scanData.tempFiles, browserCache: d.browser_cache ?? scanData.browserCache, largeFiles: d.large_files ?? scanData.largeFiles, totalRecoverable: d.total_recoverable_mb ?? 0, lifetimeCleaned: d.stats?.cleaned ?? 0, lifetimeOrganized: d.stats?.organized ?? 0, scriptsRun: d.stats?.scripts_run ?? 0, scriptsUndone: d.stats?.undone ?? 0 });
      haptics.success();
      Alert.alert('Scan Complete', `Found ${d?.total_recoverable_mb ?? 0}MB recoverable space`);
    } catch (e: any) { Alert.alert('Scan Error', e?.message); }
    finally { setScanning(false); }
  }, [scanData]);

  // Load KB count on focus regardless of connection state (it's local AsyncStorage)
  useFocusEffect(useCallback(() => {
    fetchKbCount();
    if (isConnected) fetchAll();
  }, [isConnected, fetchAll, fetchKbCount]));

  useEffect(() => {
    if (!isConnected) return;
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [isConnected, fetchAll]);

  // Keep KB count fresh every 60s independently (AsyncStorage, no server needed)
  useEffect(() => {
    fetchKbCount();
    const t = setInterval(fetchKbCount, 60_000);
    return () => clearInterval(t);
  }, [fetchKbCount]);

  const connCol = isConnected ? C.green : C.red;
  const dotPulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(dotPulse, { toValue: 1,   duration: 900, useNativeDriver: false }),
      Animated.timing(dotPulse, { toValue: 0.2, duration: 900, useNativeDriver: false }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  const ACTIONS = [
    { id: 'full_clean',    icon: 'cleaning-services', label: 'FULL CLEAN',  sub: 'temp+cache', color: C.green  },
    { id: 'organize',      icon: 'folder-special',    label: 'ORGANIZE',    sub: 'files+docs', color: C.amber  },
    { id: 'disk_report',   icon: 'pie-chart',         label: 'DISK REPORT', sub: 'detailed',   color: C.blue   },
    { id: 'empty_recycle', icon: 'delete-sweep',      label: 'RECYCLE BIN', sub: 'empty',      color: C.red    },
    { id: 'memory_clean',  icon: 'memory',            label: 'FREE RAM',    sub: 'clear idle', color: C.purple },
    { id: 'privacy_clean', icon: 'security',          label: 'PRIVACY',     sub: 'wipe',       color: C.teal   },
  ];

  return (
    <View style={[s.root, { backgroundColor: T.bg || C.bg }]}>
      {/* ── NEXUS circuit grid background ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ExpoImage
          source={require('@/assets/images/nexus-circuit-grid.jpg')}
          style={{ flex: 1, opacity: 0.05 }}
          contentFit="cover"
        />
      </View>
      <TabSwipeOverlay leftRoute="/(tabs)/knowledge" rightRoute="/(tabs)/builder" />

      <CompactPageHeader
        accent="#00FF88"
        icon="desktop-tower-monitor"
        iconLib="community"
        title="PC HEALTH"
        badge={isConnected ? 'LIVE' : 'OFF'}
        badgeColor={isConnected ? '#00FF88' : '#FF3131'}
        isConnected={isConnected}
        safeTop={insets.top || 0}
        rightAction={{ icon: 'refresh', onPress: () => { haptics.light(); fetchAll(); }, color: '#00DCFF' }}
        extraRow={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, flexWrap: 'nowrap' }}>
            <PageMascot page="logs" size="sm" showBubble />
            <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connCol, opacity: dotPulse, flexShrink: 0 }} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: connCol + 'AA', letterSpacing: 0.8, flex: 1 }} numberOfLines={1}>
              {isConnected ? (serverAddr || 'LINKED') : 'OFFLINE — TAP HOME TO PAIR'}
            </Text>
            {lastRefresh ? (
              <Text style={{ fontSize: 8, color: C.textDim, fontFamily: MONO, flexShrink: 0 }}>
                {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
            {!isConnected ? (
              <TouchableOpacity onPress={() => (global as any).__butlerSwitchTab?.('nexushome')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: C.amber + '60', backgroundColor: C.amber + '12', flexShrink: 0 }}>
                <MaterialIcons name="home" size={10} color={C.amber} />
                <Text style={{ fontSize: 8, fontWeight: '900', fontFamily: MONO, color: C.amber }}>PAIR</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 1. LIVE VITALS — 3 rings side by side ── */}
        <View style={[s.card, { borderColor: C.green + '30' }]}>
          <View style={[s.cardTop, { backgroundColor: C.green }]} />
          <View style={s.cardHeader}>
            <MaterialIcons name="monitor-heart" size={13} color={C.green} />
            <Text style={[s.cardTitle, { color: C.text }]}>LIVE VITALS</Text>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, borderColor: (isConnected ? C.green : C.textDim) + '50', backgroundColor: (isConnected ? C.green : C.textDim) + '0C' }}>
              <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isConnected ? C.green : C.textDim, opacity: dotPulse }} />
              <Text style={{ fontSize: 8, fontWeight: '900', fontFamily: MONO, color: isConnected ? C.green : C.textDim }}>{isConnected ? 'LIVE' : 'OFF'}</Text>
            </View>
          </View>
          {/* 3 rings */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 14, gap: GAP3 }}>
            <RingGauge pct={isConnected ? Math.round(metrics.cpu)  : 0} color={C.teal}  label="CPU"  />
            <RingGauge pct={isConnected ? Math.round(metrics.ram)  : 0} color={C.amber} label="RAM"  />
            <RingGauge pct={isConnected ? Math.round(metrics.disk) : 0} color={C.blue}  label="DISK" />
          </View>
          {/* Horizontal bars below rings */}
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <HBar label="CPU"  pct={isConnected ? Math.round(metrics.cpu)  : 0} color={C.teal}  />
            <HBar label="RAM"  pct={isConnected ? Math.round(metrics.ram)  : 0} color={C.amber} />
            <HBar label="DISK" pct={isConnected ? Math.round(metrics.disk) : 0} color={C.blue}  />
          </View>
        </View>

        {/* ── 2. SIGMA-NET INTEL — 3 compact cells ── */}
        <SectionDiv icon="radar" label="SIGMA-NET INTELLIGENCE" color={C.cyan} />
        <IntelStrip isConnected={isConnected} metrics={metrics} scanData={scanData} kbCount={kbCount} />

        {/* ── 3. KEY METRICS — 3-col grid, 2 rows ── */}
        <SectionDiv icon="bar-chart" label="KEY METRICS" color={C.purple} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP3 }}>
          {[
            { icon: 'cleaning-services', label: 'CLEANED',    value: isConnected ? String(scanData.lifetimeCleaned)    : '—', color: C.green,  sub: 'ops'       },
            { icon: 'folder-special',    label: 'ORGANIZED',  value: isConnected ? String(scanData.lifetimeOrganized)   : '—', color: C.amber,  sub: 'files'     },
            { icon: 'code',              label: 'SCRIPTS',    value: isConnected ? String(scanData.scriptsRun)          : '—', color: C.blue,   sub: 'executed'  },
            { icon: 'undo',              label: 'UNDONE',     value: isConnected ? String(scanData.scriptsUndone)       : '—', color: C.purple, sub: 'rollbacks' },
            { icon: 'memory',            label: 'CPU PEAK',   value: isConnected ? `${metrics.cpu}%` : '—',                   color: C.red,    sub: 'current'   },
            { icon: 'storage',           label: 'DISK FREE',  value: isConnected ? `${Math.max(0,100-Math.round(metrics.disk))}%` : '—', color: C.teal, sub: 'available' },
          ].map(item => (
            <StatCell key={item.label} icon={item.icon} label={item.label} value={item.value} color={item.color} sub={item.sub} />
          ))}
        </View>

        {/* ── 4. QUICK ACTIONS — 3-col grid ── */}
        <SectionDiv icon="flash-on" label="QUICK ACTIONS" color={C.green} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP3 }}>
          {ACTIONS.map(a => (
            <ActionBtn3
              key={a.id}
              icon={a.icon} label={a.label} sub={a.sub} color={a.color}
              loading={actionId === a.id}
              disabled={!isConnected}
              onPress={() => isConnected ? runAction(a.id, a.label) : Alert.alert('Offline', 'Connect PC from HOME tab first')}
            />
          ))}
        </View>

        {/* ── 5. SCAN RESULTS ── */}
        <ScanResultCard isConnected={isConnected} scanData={scanData} metrics={metrics} onScan={runScan} scanning={scanning} />

        {/* ── 6. QUICK PC SCRIPTS — 3-col grid ── */}
        <View style={[s.card, { borderColor: C.purple + '30' }]}>
          <View style={[s.cardTop, { backgroundColor: C.purple }]} />
          <View style={s.cardHeader}>
            <MaterialIcons name="code" size={13} color={C.purple} />
            <Text style={[s.cardTitle, { color: C.text }]}>QUICK PC SCRIPTS</Text>
            <View style={{ flex: 1 }} />
            {!isConnected && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="wifi-off" size={10} color={C.textDim} />
                <Text style={{ fontSize: 8, fontFamily: MONO, color: C.textDim }}>CONNECT PC TO RUN</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP3, paddingHorizontal: 14, paddingBottom: qpsResult ? 0 : 14 }}>
            {PC_QUICK_SCRIPTS.map(item => (
              <QuickScriptBtn
                key={item.id}
                icon={item.icon} label={item.label} color={item.color}
                isRunning={qpsRunning === item.id}
                disabled={!isConnected}
                onPress={async () => {
                  setQpsRunning(item.id);
                  setQpsResult(null);
                  if (!serverConnection.isConnected()) { setQpsRunning(null); return; }
                  try {
                    const ctrl = new AbortController();
                    setTimeout(() => ctrl.abort(), 30000);
                    const res = await serverConnection.fetchWithAuth(
                      serverConnection.buildUrl('/api/execute'),
                      { method: 'POST', body: JSON.stringify({ script: item.script }), signal: ctrl.signal }
                    );
                    const data = await res.json();
                    setQpsResult({ label: item.label, output: (data.output || data.error || 'No output').slice(0, 1200), color: item.color });
                    haptics.success();
                  } catch (e: any) {
                    setQpsResult({ label: item.label, output: 'Error: ' + (e?.message || 'Network timeout'), color: C.red });
                    haptics.warning();
                  } finally { setQpsRunning(null); }
                }}
              />
            ))}
          </View>
          {qpsResult ? (
            <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 }}>
              <View style={[s.qpsOutput, { borderColor: qpsResult.color + '50', backgroundColor: qpsResult.color + '06' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: qpsResult.color }} />
                  <Text style={{ fontSize: 9, fontWeight: '900', fontFamily: MONO, color: qpsResult.color, letterSpacing: 1 }}>{qpsResult.label.toUpperCase()} OUTPUT</Text>
                  <TouchableOpacity onPress={() => setQpsResult(null)} style={{ marginLeft: 'auto' as any }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialIcons name="close" size={12} color={C.textDim} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, fontFamily: MONO, lineHeight: 17, color: qpsResult.color + 'CC' }} selectable>{qpsResult.output}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── 7. SMART AUTOMATION — compact rows ── */}
        <View style={[s.card, { borderColor: C.cyan + '25' }]}>
          <View style={[s.cardTop, { backgroundColor: C.cyan }]} />
          <View style={s.cardHeader}>
            <MaterialIcons name="smart-toy" size={13} color={C.cyan} />
            <Text style={[s.cardTitle, { color: C.text }]}>SMART AUTOMATION</Text>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 7 }}>
            {[
              { icon: 'schedule',       col: C.teal,   label: 'Auto-clean temp files',   sub: 'Daily 9AM · temp+cache',      canRun: 'full_clean'    },
              { icon: 'folder-special', col: C.amber,  label: 'Auto-organize Downloads', sub: 'Weekly · by file type',       canRun: 'organize'      },
              { icon: 'security',       col: C.purple, label: 'Privacy wipe on idle',    sub: '30min idle · clipboard+docs', canRun: 'privacy_clean' },
              { icon: 'bar-chart',      col: C.blue,   label: 'Monday disk report',      sub: 'Weekly · full breakdown',     canRun: 'disk_report'   },
            ].map((item, i) => (
              <TouchableOpacity key={i}
                onPress={() => isConnected ? runAction(item.canRun, item.label) : Alert.alert('Offline', 'Connect PC to trigger automations')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, borderColor: item.col + '30', backgroundColor: item.col + '06' }}
                activeOpacity={0.85}>
                <View style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: item.col + '18', borderColor: item.col + '40', flexShrink: 0 }}>
                  <MaterialIcons name={item.icon as any} size={15} color={item.col} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', fontFamily: MONO, color: isConnected ? item.col : C.textMid, marginBottom: 1 }}>{item.label}</Text>
                  <Text style={{ fontSize: 9, color: C.textDim, fontFamily: MONO }}>{item.sub}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, borderColor: (isConnected ? C.green : C.textDim) + '45', backgroundColor: (isConnected ? C.green : C.textDim) + '08' }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isConnected ? C.green : C.textDim }} />
                  <Text style={{ fontSize: 7.5, fontWeight: '900', fontFamily: MONO, color: isConnected ? C.green : C.textDim }}>{isConnected ? 'RUN' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 8. 7-DAY ACTIVITY CHARTS — side by side ── */}
        <View style={[s.card, { borderColor: C.teal + '25' }]}>
          <View style={[s.cardTop, { backgroundColor: C.teal }]} />
          <View style={s.cardHeader}>
            <MaterialIcons name="show-chart" size={13} color={C.teal} />
            <Text style={[s.cardTitle, { color: C.text }]}>7-DAY ACTIVITY</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <MiniBarChart data={growth.map(g => ({ day: g.day, value: g.cleaned }))} color={C.green} label="CLEAN OPERATIONS" />
            </View>
            <View style={{ width: 1, backgroundColor: C.border }} />
            <View style={{ flex: 1 }}>
              <MiniBarChart data={growth.map(g => ({ day: g.day, value: Math.round(g.recovered_mb / 100) }))} color={C.amber} label="SPACE RECOVERED" />
            </View>
          </View>
          {!isConnected && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginHorizontal: 14, marginBottom: 12, backgroundColor: C.amber + '08', borderWidth: 1, borderColor: C.amber + '25', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 }}>
              <MaterialIcons name="info-outline" size={10} color={C.textDim} />
              <Text style={{ fontSize: 9, fontFamily: MONO, color: C.textDim }}>Charts populate after connecting and running scripts</Text>
            </View>
          )}
        </View>

        {/* ── 9. UNDO JOURNAL ── */}
        <View style={[s.card, { borderColor: C.amber + '30' }]}>
          <View style={[s.cardTop, { backgroundColor: C.amber }]} />
          <View style={s.cardHeader}>
            <MaterialIcons name="undo" size={13} color={C.amber} />
            <Text style={[s.cardTitle, { color: C.text }]}>UNDO JOURNAL</Text>
            <View style={{ flex: 1 }} />
            <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderColor: C.amber + '45', backgroundColor: C.amber + '0C' }}>
              <Text style={{ fontSize: 8, fontWeight: '900', fontFamily: MONO, color: C.amber }}>15 MIN WINDOW</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            {undoList.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 7 }}>
                <MaterialIcons name={isConnected ? 'check-circle-outline' : 'wifi-off'} size={30} color={C.textDim} />
                <Text style={{ fontSize: 11, color: C.textDim, fontFamily: MONO }}>
                  {isConnected ? 'No pending rollbacks — all clear' : 'Connect PC to see undo journal'}
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: C.surfaceHi, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
                {undoList.map(entry => (
                  <UndoEntry key={entry.id} entry={entry} onRollback={rollback} rolling={rollingId === entry.id} />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#020407' },
  scroll:    { padding: PAD, paddingBottom: 150, gap: 12 },
  card:      { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10 }, android: { elevation: 4 } }) },
  cardTop:   { height: 3 },
  cardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 9 },
  cardTitle: { fontSize: 12, fontWeight: '900', fontFamily: MONO, letterSpacing: 1 },
  qpsOutput: { borderWidth: 1.5, borderRadius: 10, padding: 11 },
});

export default function PCCheckScreen() {
  return (
    <TabErrorBoundary name="PC Health">
      <PCCheckScreenInner />
    </TabErrorBoundary>
  );
}

