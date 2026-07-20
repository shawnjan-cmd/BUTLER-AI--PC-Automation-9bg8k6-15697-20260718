/**
 * BUTLER AI — SCRIPT FORGE v2.0
 * Fresh cyberpunk redesign · token system
 * Node pipeline builder with palette + canvas + execute
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Animated, Alert, ActivityIndicator, TextInput, Dimensions, FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import { serverConnection } from '@/services/serverConnection';
import { autoConnectEngine } from '@/services/autoConnectEngine';
import { saveButlerScript } from '@/services/butlerScripts';
import { useCosmetic } from '@/contexts/CosmeticContext';

const MONO: any = FONT.mono;
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;
const GAP = 7;
const COL3 = Math.floor((SW - PAD * 2 - GAP * 2) / 3);

// ─── NODE TYPES ───────────────────────────────────────────────────
type NodeType = 'TRIGGER' | 'ACTION' | 'OUTPUT';
interface NodeDef { id: string; name: string; desc: string; type: NodeType; icon: string; lib: 'material' | 'community'; color: string; code: string; }

const TYPE_CFG: Record<NodeType, { color: string; label: string }> = {
  TRIGGER: { color: COLOR.teal,    label: 'TRIGGER' },
  ACTION:  { color: COLOR.green,   label: 'ACTION'  },
  OUTPUT:  { color: COLOR.magenta, label: 'OUTPUT'  },
};

const PALETTE: NodeDef[] = [
  { id:'t_time',     name:'Schedule Trigger', desc:'Timestamp current run',        type:'TRIGGER', icon:'schedule',         lib:'material',  color:COLOR.teal,    code:`import time\nprint(f"Triggered at: {time.strftime('%H:%M:%S on %Y-%m-%d')}")` },
  { id:'t_cpu',      name:'CPU Alert',        desc:'Alert when CPU > 80%',         type:'TRIGGER', icon:'memory',           lib:'material',  color:COLOR.teal,    code:`import psutil\ncpu=psutil.cpu_percent(interval=2)\nprint(f"CPU: {cpu}%")\nif cpu>80: print(f"ALERT: CPU high at {cpu}%")\nelse: print("CPU normal")` },
  { id:'t_disk',     name:'Disk Full Alert',  desc:'Alert when disk > 85%',        type:'TRIGGER', icon:'storage',          lib:'material',  color:COLOR.teal,    code:`import psutil\nfor d in psutil.disk_partitions():\n    try:\n        u=psutil.disk_usage(d.mountpoint)\n        if u.percent>85: print(f"ALERT: {d.mountpoint} is {u.percent}% full")\n        else: print(f"{d.mountpoint}: {u.percent}% - OK")\n    except: pass` },
  { id:'t_file',     name:'File Watch',       desc:'Detect new files in folder',   type:'TRIGGER', icon:'folder-open',      lib:'material',  color:COLOR.teal,    code:`import os,time\nw=os.path.expanduser('~/Desktop')\nb=set(os.listdir(w))\ntime.sleep(3)\na=set(os.listdir(w))\nnew=a-b\nprint(f"New files: {new or 'none'}")` },
  { id:'t_notify',   name:'Notify Trigger',   desc:'Windows toast notification',   type:'TRIGGER', icon:'notifications',    lib:'material',  color:COLOR.teal,    code:`import subprocess\nsubprocess.run(['powershell','-command','Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show("NEXUS triggered!", "Butler AI", 0, 64)'],capture_output=True)\nprint("Notification sent")` },
  { id:'a_clean',    name:'Clean Temp',       desc:'Delete temp files',            type:'ACTION',  icon:'cleaning-services',lib:'material',  color:COLOR.green,   code:`import os,shutil,tempfile\nr=0;f=0\nfor p in [tempfile.gettempdir()]:\n    for i in os.listdir(p):\n        fp=os.path.join(p,i)\n        try:\n            s=os.path.getsize(fp) if os.path.isfile(fp) else 0\n            (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n            r+=1;f+=s\n        except:pass\nprint(f"Cleared {r} items, freed {f//1024//1024}MB")` },
  { id:'a_recycle',  name:'Empty Recycle',    desc:'Clear the recycle bin',        type:'ACTION',  icon:'delete-sweep',     lib:'material',  color:COLOR.green,   code:`import subprocess\nsubprocess.run(['powershell','-Command','Clear-RecycleBin -Force -ErrorAction SilentlyContinue'],capture_output=True)\nprint("Recycle bin emptied")` },
  { id:'a_sort_dl',  name:'Sort Downloads',   desc:'Organize by file type',        type:'ACTION',  icon:'sort',             lib:'material',  color:COLOR.amber,   code:`import os,shutil\nd=os.path.expanduser('~/Downloads')\ncats={'Images':['.jpg','.png','.gif','.webp','.jpeg'],'Videos':['.mp4','.mkv','.avi','.mov'],'Documents':['.pdf','.doc','.docx','.txt','.xlsx','.csv'],'Archives':['.zip','.rar','.7z','.tar'],'Installers':['.exe','.msi'],'Code':['.py','.js','.ts','.html','.css','.json']}\nm=0\nfor f in os.listdir(d):\n    fp=os.path.join(d,f)\n    if not os.path.isfile(fp): continue\n    ext=os.path.splitext(f)[1].lower()\n    for cat,exts in cats.items():\n        if ext in exts:\n            os.makedirs(os.path.join(d,cat),exist_ok=True)\n            shutil.move(fp,os.path.join(d,cat,f));m+=1;break\nprint(f"Downloads sorted: {m} files")` },
  { id:'a_disk',     name:'Disk Report',      desc:'Full disk usage report',       type:'ACTION',  icon:'pie-chart',        lib:'material',  color:COLOR.blue,    code:`import psutil\nfor d in psutil.disk_partitions():\n    try:\n        u=psutil.disk_usage(d.mountpoint)\n        print(f"Drive {d.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n    except: pass` },
  { id:'a_sysinfo',  name:'System Info',      desc:'Full OS/hardware report',      type:'ACTION',  icon:'info',             lib:'material',  color:COLOR.blue,    code:`import platform,psutil,datetime\no=platform.uname();b=datetime.datetime.fromtimestamp(psutil.boot_time())\nu=datetime.datetime.now()-b;r=psutil.virtual_memory()\nprint(f"OS: {o.system} {o.release}\\nHost: {o.node}\\nCPU: {o.processor[:40]}\\nRAM: {r.total/1024**3:.1f}GB ({r.percent}% used)\\nUptime: {str(u).split('.')[0]}")` },
  { id:'a_topproc',  name:'Top Processes',    desc:'Top CPU processes',            type:'ACTION',  icon:'apps',             lib:'material',  color:COLOR.magenta, code:`import psutil\nps=sorted([p.info for p in psutil.process_iter(['pid','name','cpu_percent','memory_percent']) if p.info],key=lambda x:x.get('cpu_percent',0) or 0,reverse=True)\nprint("TOP 10 BY CPU:")\nfor p in ps[:10]:\n    print(f"  [{p['pid']}] {p['name']:<24} CPU:{p.get('cpu_percent',0):.1f}%  MEM:{p.get('memory_percent',0):.1f}%")` },
  { id:'a_net',      name:'Network Check',    desc:'IP, ping, bandwidth stats',    type:'ACTION',  icon:'wifi',             lib:'material',  color:COLOR.blue,    code:`import socket,subprocess,psutil\nhn=socket.gethostname();ip=socket.gethostbyname(hn)\npg=subprocess.run(['ping','-n','2','8.8.8.8'],capture_output=True,text=True)\nn=psutil.net_io_counters()\nprint(f"Host: {hn} | IP: {ip}")\nprint(f"Sent: {n.bytes_sent/1024/1024:.1f}MB | Recv: {n.bytes_recv/1024/1024:.1f}MB")\nlines=[l for l in pg.stdout.split('\\n') if 'Average' in l]\nif lines: print(f"Ping: {lines[0].strip()}")` },
  { id:'a_backup',   name:'Backup Docs',      desc:'ZIP Documents to Desktop',     type:'ACTION',  icon:'backup',           lib:'material',  color:COLOR.blue,    code:`import shutil,os,datetime\nsrc=os.path.expanduser('~/Documents')\nts=datetime.datetime.now().strftime('%Y%m%d_%H%M')\ndst=os.path.expanduser(f'~/Desktop/Backup_Documents_{ts}')\nprint(f"Backing up to {dst}...")\nshutil.copytree(src,dst,ignore=shutil.ignore_patterns('*.tmp','~*'))\nsize=sum(f.stat().st_size for f in os.scandir(dst) if f.is_file())\nprint(f"Done: {size/1024/1024:.1f}MB")` },
  { id:'a_privacy',  name:'Privacy Clean',    desc:'Clear clipboard + recent docs',type:'ACTION',  icon:'security',         lib:'material',  color:COLOR.red,     code:`import subprocess,os\nsubprocess.run(['powershell','-command','Set-Clipboard -Value ""'],capture_output=True)\nr=os.path.expandvars(r'%APPDATA%\\Microsoft\\Windows\\Recent')\nif os.path.exists(r):\n    for f in os.listdir(r):\n        try: os.remove(os.path.join(r,f))\n        except: pass\nprint("Clipboard cleared - Recent docs cleared")` },
  { id:'o_log',      name:'Log to Console',   desc:'Print pipeline completion',    type:'OUTPUT',  icon:'terminal',         lib:'material',  color:COLOR.magenta, code:`import datetime\nprint("="*44)\nprint("PIPELINE COMPLETE")\nprint(f"Time: {datetime.datetime.now().strftime('%H:%M:%S')}")\nprint("="*44)` },
  { id:'o_perf',     name:'Perf Report',      desc:'Full performance snapshot',    type:'OUTPUT',  icon:'bar-chart',        lib:'material',  color:COLOR.magenta, code:`import psutil,datetime\nprint(f"PERF @ {datetime.datetime.now().strftime('%H:%M:%S')}")\nprint(f"CPU: {psutil.cpu_percent(interval=1)}%")\nm=psutil.virtual_memory()\nprint(f"RAM: {m.used/1024**3:.1f}/{m.total/1024**3:.1f}GB ({m.percent}%)")` },
  { id:'o_notify',   name:'Desktop Notify',   desc:'Windows toast on completion',  type:'OUTPUT',  icon:'notifications-active', lib:'material', color:COLOR.teal, code:`import subprocess\nsubprocess.run(['powershell','-command','Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show("Pipeline Complete!", "Butler AI", 0, 64)'],capture_output=True)\nprint("Desktop notification sent")` },
  { id:'o_save',     name:'Save to File',     desc:'Write results to Desktop txt', type:'OUTPUT',  icon:'save',             lib:'material',  color:COLOR.magenta, code:`import os,datetime\nd=os.path.expanduser('~/Desktop')\nts=datetime.datetime.now().strftime('%Y%m%d_%H%M%S')\nfp=os.path.join(d,f'pipeline_output_{ts}.txt')\nwith open(fp,'w') as f:\n    f.write(f"Butler AI Pipeline\\nGenerated: {datetime.datetime.now().isoformat()}\\nComplete.\\n")\nprint(f"Saved: {fp}")` },
];

// ─── PULSE DOT ────────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
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
function ForgeHeader({ safeTop, isConn, nodeCount, accent }: { safeTop: number; isConn: boolean; nodeCount: number; accent: string }) {
  return (
    <View style={[fh.root, { paddingTop: safeTop }]}>
      <View style={{ height: 3, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <View style={fh.row}>
        <View style={[fh.iconBox, { borderColor: COLOR.magenta + '50', backgroundColor: glow(COLOR.magenta, 8) }]}>
          <MaterialCommunityIcons name="hammer-screwdriver" size={20} color={COLOR.magenta} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fh.brand}>
            <Text style={{ color: COLOR.magenta }}>{'{'}</Text>
            <Text style={{ color: '#FFF' }}>SCRIPT</Text>
            <Text style={{ color: COLOR.cyan }}>_FORGE</Text>
            <Text style={{ color: COLOR.magenta }}>{'}'}</Text>
          </Text>
          <Text style={fh.sub}>
            <Text style={{ color: COLOR.magenta + '55' }}>{'# '}</Text>
            <Text style={{ color: COLOR.mid }}>node pipeline · {PALETTE.filter(n => n.type === 'TRIGGER').length}T / {PALETTE.filter(n => n.type === 'ACTION').length}A / {PALETTE.filter(n => n.type === 'OUTPUT').length}O</Text>
          </Text>
        </View>
        <View style={[fh.pill, { borderColor: (isConn ? COLOR.green : COLOR.red) + '55', backgroundColor: (isConn ? COLOR.green : COLOR.red) + '0A' }]}>
          <PulseDot color={isConn ? COLOR.green : COLOR.red} size={5} />
          <Text style={[fh.pillTxt, { color: isConn ? COLOR.green : COLOR.red }]}>{isConn ? 'PC LIVE' : 'OFFLINE'}</Text>
        </View>
        {nodeCount > 0 && (
          <View style={[fh.pill, { borderColor: COLOR.magenta + '40', backgroundColor: glow(COLOR.magenta, 8) }]}>
            <Text style={[fh.pillTxt, { color: COLOR.magenta }]}>{nodeCount} NODES</Text>
          </View>
        )}
      </View>
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: COLOR.magenta + '25' }} />
        <View style={{ width: 10, backgroundColor: COLOR.magenta }} />
        <View style={{ flex: 4, backgroundColor: COLOR.magenta + '10' }} />
      </View>
    </View>
  );
}
const fh = StyleSheet.create({
  root:    { backgroundColor: '#020609', ...SHADOW.dark },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 7 },
  iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:   { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 8.5, lineHeight: 13, marginTop: 2 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  pillTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
});

// ─── PALETTE CARD ─────────────────────────────────────────────────
function PaletteCard({ node, onAdd, inCanvas }: { node: NodeDef; onAdd: (n: NodeDef) => void; inCanvas: boolean }) {
  const cfg = TYPE_CFG[node.type];
  const Icon = node.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    haptics.medium();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 55, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }),
    ]).start();
    onAdd(node);
  };
  return (
    <Animated.View style={{ transform: [{ scale }], width: COL3 }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.88}
        style={[pc2.card, { borderTopColor: cfg.color, borderColor: inCanvas ? cfg.color + '55' : COLOR.border, backgroundColor: inCanvas ? glow(cfg.color, 10) : COLOR.surf }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: cfg.color + '70' }} />
        <View style={[pc2.iconBox, { borderColor: cfg.color + '40', backgroundColor: glow(cfg.color, 12) }]}>
          <Icon name={node.icon as any} size={16} color={cfg.color} />
        </View>
        <Text style={[pc2.name, { color: inCanvas ? cfg.color : COLOR.text }]} numberOfLines={2}>{node.name}</Text>
        <Text style={pc2.desc} numberOfLines={1}>{node.desc}</Text>
        <View style={[pc2.typeBadge, { borderColor: cfg.color + '50', backgroundColor: glow(cfg.color, 8) }]}>
          <Text style={[pc2.typeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const pc2 = StyleSheet.create({
  card:     { borderWidth: 1, borderTopWidth: 3, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, minHeight: 95, position: 'relative', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 }, android: { elevation: 3 } }) },
  iconBox:  { width: 32, height: 32, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  name:     { fontFamily: MONO, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.1, lineHeight: 13 },
  desc:     { fontFamily: MONO, fontSize: 8, color: COLOR.dim, lineHeight: 11 },
  typeBadge:{ alignSelf: 'flex-start', borderWidth: 1, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1.5, marginTop: 4 },
  typeTxt:  { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
});

// ─── CANVAS NODE ──────────────────────────────────────────────────
interface CanvasNode { uid: string; def: NodeDef; }

function CanvasNodeCard({ cnode, index, total, onRemove }: { cnode: CanvasNode; index: number; total: number; onRemove: () => void }) {
  const cfg = TYPE_CFG[cnode.def.type];
  const Icon = cnode.def.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const slideA = useRef(new Animated.Value(-20)).current;
  const fadeA  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideA, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
      Animated.timing(fadeA, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeA, transform: [{ translateX: slideA }] }}>
      <View style={[cnc.card, { borderColor: cfg.color + '50', backgroundColor: glow(cfg.color, 8) }]}>
        <View style={[cnc.bar, { backgroundColor: cfg.color }]} />
        <View style={cnc.row}>
          <View style={[cnc.step, { borderColor: cfg.color + '60', backgroundColor: glow(cfg.color, 15) }]}>
            <Text style={[cnc.stepTxt, { color: cfg.color }]}>{index + 1}</Text>
          </View>
          <View style={[cnc.iconBox, { borderColor: cfg.color + '40', backgroundColor: glow(cfg.color, 12) }]}>
            <Icon name={cnode.def.icon as any} size={16} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cnc.name, { color: cfg.color }]} numberOfLines={1}>{cnode.def.name}</Text>
            <Text style={cnc.desc} numberOfLines={1}>{cnode.def.desc}</Text>
          </View>
          <View style={[cnc.typePill, { borderColor: cfg.color + '50', backgroundColor: glow(cfg.color, 10) }]}>
            <Text style={[cnc.typeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <TouchableOpacity onPress={() => { haptics.medium(); onRemove(); }} style={cnc.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={14} color={COLOR.dim} />
          </TouchableOpacity>
        </View>
      </View>
      {index < total - 1 && (
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <View style={{ width: 2, height: 12, backgroundColor: cfg.color + '40', borderRadius: 1 }} />
          <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: cfg.color + '50' }} />
        </View>
      )}
    </Animated.View>
  );
}
const cnc = StyleSheet.create({
  card:    { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  bar:     { height: 2.5 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 11 },
  step:    { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900' },
  iconBox: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:    { fontFamily: MONO, fontSize: 12, fontWeight: '700' },
  desc:    { fontFamily: MONO, fontSize: 9, color: COLOR.dim, marginTop: 2 },
  typePill:{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0 },
  typeTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLOR.surf2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── SECTION LABEL ────────────────────────────────────────────────
function SectionLabel({ icon, label, color, count }: { icon: string; label: string; color: string; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 4 }}>
      <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: color }} />
      <MaterialIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color, letterSpacing: 1.8 }}>{label}</Text>
      {count !== undefined && (
        <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderColor: color + '45', backgroundColor: glow(color, 8) }}>
          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color }}>{count}</Text>
        </View>
      )}
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color + '30' }} />
    </View>
  );
}

// ─── EXECUTE RESULT ───────────────────────────────────────────────
function ExecResult({ output, error, running, onClose }: { output: string; error: string; running: boolean; onClose: () => void }) {
  const col = running ? COLOR.amber : error ? COLOR.red : COLOR.green;
  return (
    <View style={[er.wrap, { borderTopColor: col }]}>
      <View style={[er.hdr, { borderBottomColor: col + '30' }]}>
        <PulseDot color={col} size={6} />
        <Text style={[er.title, { color: col }]}>{running ? 'EXECUTING PIPELINE...' : error ? 'PIPELINE FAILED' : 'PIPELINE COMPLETE'}</Text>
        {!running && <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><MaterialIcons name="close" size={16} color={COLOR.mid} /></TouchableOpacity>}
      </View>
      <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
        {running ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={COLOR.amber} size="small" />
            <Text style={{ fontFamily: MONO, fontSize: 12, color: COLOR.amber }}>Running nodes...</Text>
          </View>
        ) : (
          <Text style={{ fontFamily: MONO, fontSize: 12, color: error ? '#FF8888' : '#88FF99', lineHeight: 18 }} selectable>{output || error || 'No output'}</Text>
        )}
      </ScrollView>
    </View>
  );
}
const er = StyleSheet.create({
  wrap:  { backgroundColor: '#050D10', borderTopWidth: 1.5 },
  hdr:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  title: { flex: 1, fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function ForgeInner() {
  const insets = useSafeAreaInsets();
  const { T }  = useCosmetic();
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [pane,        setPane]        = useState<'palette' | 'canvas'>('palette');
  const [filter,      setFilter]      = useState<'ALL' | NodeType>('ALL');
  const [search,      setSearch]      = useState('');
  const [isConn,      setIsConn]      = useState(false);
  const [executing,   setExecuting]   = useState(false);
  const [execOut,     setExecOut]     = useState('');
  const [execErr,     setExecErr]     = useState('');
  const [showResult,  setShowResult]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [pipelineName, setPipelineName] = useState('My Pipeline');
  const canvasRef = useRef<ScrollView>(null);

  useEffect(() => {
    const seed = autoConnectEngine.getCurrentConnection();
    setIsConn(seed.connected);
    const unsub = autoConnectEngine.onEvent(evt => setIsConn(evt.status === 'connected'));
    return () => unsub();
  }, []);

  const filteredPalette = useMemo(() => {
    let nodes = PALETTE;
    if (filter !== 'ALL') nodes = nodes.filter(n => n.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      nodes = nodes.filter(n => n.name.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));
    }
    return nodes;
  }, [filter, search]);

  const canvasIds = useMemo(() => new Set(canvasNodes.map(c => c.def.id)), [canvasNodes]);

  const addNode = useCallback((def: NodeDef) => {
    const uid = `${def.id}_${Date.now()}`;
    setCanvasNodes(prev => [...prev, { uid, def }]);
    setTimeout(() => canvasRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const removeNode = useCallback((uid: string) => {
    haptics.medium();
    setCanvasNodes(prev => prev.filter(n => n.uid !== uid));
  }, []);

  const clearCanvas = () => {
    if (!canvasNodes.length) return;
    Alert.alert('Clear Pipeline', 'Remove all nodes?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { haptics.heavy(); setCanvasNodes([]); setShowResult(false); } },
    ]);
  };

  const buildScript = useCallback(() => {
    if (!canvasNodes.length) return null;
    const lines: string[] = ['# BUTLER AI FORGE — AUTO-GENERATED PIPELINE', `# Nodes: ${canvasNodes.length}`, '', 'import sys', ''];
    canvasNodes.forEach((cn, i) => {
      lines.push(`# ── STEP ${i + 1}: ${cn.def.name.toUpperCase()} ──`);
      lines.push(`print("Step ${i + 1}: ${cn.def.name}")`);
      lines.push(cn.def.code); lines.push('');
    });
    lines.push('print("Pipeline complete")');
    return lines.join('\n');
  }, [canvasNodes]);

  const execute = useCallback(async () => {
    if (!canvasNodes.length) { Alert.alert('Empty Pipeline', 'Add nodes first.'); return; }
    if (!isConn) { Alert.alert('Offline', 'Connect PC from HOME tab.'); return; }
    const script = buildScript();
    if (!script) return;
    haptics.heavy();
    setExecuting(true); setExecOut(''); setExecErr(''); setShowResult(true);
    setPane('canvas');
    try {
      const ip = serverConnection.getIP()!;
      const port = serverConnection.getPort()!;
      const token = serverConnection.getToken();
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ script }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      const raw = (data.output || '').trim();
      if (raw.toLowerCase().includes('traceback') || raw.toLowerCase().includes('error:')) {
        setExecErr(raw);
      } else {
        setExecOut(raw || 'Pipeline executed successfully');
      }
      haptics.success();
    } catch (e: any) {
      setExecErr(e?.message || 'Execution failed'); haptics.warning();
    } finally { setExecuting(false); }
  }, [canvasNodes, isConn, buildScript]);

  const saveToScripts = useCallback(async () => {
    const script = buildScript();
    if (!script) { Alert.alert('Empty Pipeline', 'Add nodes first.'); return; }
    const name = pipelineName.trim() || 'FORGE Pipeline';
    setSaving(true); haptics.medium();
    try {
      await saveButlerScript(script, { title: name, description: `Built with FORGE · ${canvasNodes.length} nodes`, category: 'AI Generated' });
      haptics.success(); Alert.alert('Saved!', `"${name}" added to Scripts.`);
    } catch (e: any) { Alert.alert('Save failed', e?.message); }
    finally { setSaving(false); }
  }, [buildScript, pipelineName, canvasNodes.length]);

  const TRIGGER_COUNT = PALETTE.filter(n => n.type === 'TRIGGER').length;
  const ACTION_COUNT  = PALETTE.filter(n => n.type === 'ACTION').length;
  const OUTPUT_COUNT  = PALETTE.filter(n => n.type === 'OUTPUT').length;

  // Grouped palette
  const triggerNodes = useMemo(() => filteredPalette.filter(n => n.type === 'TRIGGER'), [filteredPalette]);
  const actionNodes  = useMemo(() => filteredPalette.filter(n => n.type === 'ACTION'),  [filteredPalette]);
  const outputNodes  = useMemo(() => filteredPalette.filter(n => n.type === 'OUTPUT'),  [filteredPalette]);

  const renderNodeGrid = (nodes: NodeDef[]) => {
    const rows: NodeDef[][] = [];
    for (let i = 0; i < nodes.length; i += 3) rows.push(nodes.slice(i, i + 3));
    return rows.map((row, ri) => (
      <View key={ri} style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
        {row.map(node => <PaletteCard key={node.id} node={node} onAdd={addNode} inCanvas={canvasIds.has(node.id)} />)}
        {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, k) => <View key={k} style={{ width: COL3 }} />)}
      </View>
    ));
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg || COLOR.bg }}>
      <TabSwipeOverlay leftRoute="/(tabs)/logs" rightRoute="/(tabs)/settings" />
      <ForgeHeader safeTop={insets.top} isConn={isConn} nodeCount={canvasNodes.length} accent={T.primary || COLOR.magenta} />

      {/* Stats strip */}
      <View style={{ flexDirection: 'row', gap: GAP, paddingHorizontal: PAD, paddingVertical: 9, backgroundColor: COLOR.surf, borderBottomWidth: 1, borderBottomColor: COLOR.border }}>
        {[
          { label: 'TRIGGERS', count: TRIGGER_COUNT, color: COLOR.teal    },
          { label: 'ACTIONS',  count: ACTION_COUNT,  color: COLOR.green   },
          { label: 'OUTPUTS',  count: OUTPUT_COUNT,  color: COLOR.magenta },
          { label: 'PIPELINE', count: canvasNodes.length, color: COLOR.amber },
        ].map(s => (
          <View key={s.label} style={[{ flex: 1, backgroundColor: COLOR.surf2, borderRadius: 9, borderWidth: 1.5, borderTopWidth: 3, borderTopColor: s.color, borderColor: s.color + '30', paddingVertical: 7, alignItems: 'center', gap: 2 }]}>
            <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: s.color }}>{s.count}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 7, color: s.color + '80', letterSpacing: 0.8 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Mode toggle */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: COLOR.magenta + '20', backgroundColor: '#030810' }}>
        {([
          { key: 'palette', icon: 'view-module',  label: `NODES (${filteredPalette.length})`, color: COLOR.teal    },
          { key: 'canvas',  icon: 'account-tree', label: `PIPELINE (${canvasNodes.length})`,  color: COLOR.magenta },
        ] as const).map(tab => {
          const isActive = pane === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => { haptics.selection(); setPane(tab.key); }} activeOpacity={0.8}
              style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderBottomWidth: 3, borderBottomColor: isActive ? tab.color : 'transparent', backgroundColor: isActive ? glow(tab.color, 10) : 'transparent' }]}>
              <MaterialIcons name={tab.icon as any} size={13} color={isActive ? tab.color : COLOR.dim} />
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: isActive ? tab.color : COLOR.dim }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* PALETTE PANE */}
      {pane === 'palette' && (
        <View style={{ flex: 1 }}>
          {/* Filter + search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingVertical: 7, backgroundColor: COLOR.surf, borderBottomWidth: 1, borderBottomColor: COLOR.border }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
              {(['ALL', 'TRIGGER', 'ACTION', 'OUTPUT'] as const).map(f => {
                const col = f === 'TRIGGER' ? COLOR.teal : f === 'ACTION' ? COLOR.green : f === 'OUTPUT' ? COLOR.magenta : COLOR.mid;
                const active = filter === f;
                return (
                  <TouchableOpacity key={f} onPress={() => { haptics.selection(); setFilter(f); }} activeOpacity={0.8}
                    style={[{ borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5, borderColor: active ? col : COLOR.border, backgroundColor: active ? glow(col, 18) : 'transparent' }]}>
                    <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: active ? col : COLOR.dim }}>{f}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLOR.bg, borderWidth: 1, borderColor: COLOR.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, minWidth: 100 }}>
              <MaterialIcons name="search" size={12} color={COLOR.dim} />
              <TextInput style={{ fontFamily: MONO, fontSize: 11, color: COLOR.text, flex: 1 }}
                value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor={COLOR.dim} autoCapitalize="none" />
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 130, paddingTop: 8 }} showsVerticalScrollIndicator={false} removeClippedSubviews>
            {filteredPalette.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
                <MaterialIcons name="search-off" size={36} color={COLOR.dim} />
                <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim }}>No nodes match</Text>
              </View>
            ) : (
              <>
                {triggerNodes.length > 0 && (<><View style={{ marginTop: 8 }}><SectionLabel icon="bolt" label="TRIGGERS" color={COLOR.teal} count={triggerNodes.length} /></View>{renderNodeGrid(triggerNodes)}</>)}
                {actionNodes.length  > 0 && (<><View style={{ marginTop: 12 }}><SectionLabel icon="build" label="ACTIONS" color={COLOR.green} count={actionNodes.length} /></View>{renderNodeGrid(actionNodes)}</>)}
                {outputNodes.length  > 0 && (<><View style={{ marginTop: 12 }}><SectionLabel icon="output" label="OUTPUTS" color={COLOR.magenta} count={outputNodes.length} /></View>{renderNodeGrid(outputNodes)}</>)}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* CANVAS PANE */}
      {pane === 'canvas' && (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingVertical: 9, backgroundColor: COLOR.surf, borderBottomWidth: 1, borderBottomColor: COLOR.magenta + '35' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <MaterialIcons name="account-tree" size={13} color={COLOR.magenta} />
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.magenta }}>PIPELINE</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.magenta + '80' }}>({canvasNodes.length} nodes)</Text>
            </View>
            {canvasNodes.length > 0 && (
              <TouchableOpacity onPress={clearCanvas} style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6, borderColor: COLOR.red + '50', backgroundColor: glow(COLOR.red, 7) }]}>
                <MaterialIcons name="delete-sweep" size={12} color={COLOR.red} />
                <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.red }}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>

          {canvasNodes.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
              <MaterialIcons name="account-tree" size={48} color={COLOR.dim} />
              <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.dim, letterSpacing: 1 }}>PIPELINE EMPTY</Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.dim, textAlign: 'center', lineHeight: 16 }}>{'Go to NODES tab\nand tap any node to add it'}</Text>
              <TouchableOpacity onPress={() => setPane('palette')} activeOpacity={0.85}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderColor: COLOR.teal + '60', backgroundColor: glow(COLOR.teal, 10) }]}>
                <MaterialIcons name="add" size={16} color={COLOR.teal} />
                <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.teal }}>BROWSE NODES</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView ref={canvasRef} style={{ flex: 1 }} contentContainerStyle={{ padding: PAD, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {canvasNodes.map((cn, i) => (
                <CanvasNodeCard key={cn.uid} cnode={cn} index={i} total={canvasNodes.length} onRemove={() => removeNode(cn.uid)} />
              ))}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <TextInput style={[{ flex: 1, backgroundColor: COLOR.surf, borderWidth: 1.5, borderColor: COLOR.magenta + '50', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, fontFamily: MONO, fontSize: 12, color: COLOR.text }]}
                  value={pipelineName} onChangeText={setPipelineName} placeholder="Pipeline name..." placeholderTextColor={COLOR.dim} maxLength={48} />
                <TouchableOpacity onPress={saveToScripts} disabled={saving}
                  style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLOR.magenta, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10, opacity: saving ? 0.5 : 1 }]}>
                  {saving ? <ActivityIndicator size="small" color="#000" style={{ transform: [{ scale: 0.7 }] }} /> : <MaterialIcons name="save" size={13} color="#000" />}
                  <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000' }}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {showResult && (
            <ExecResult output={execOut} error={execErr} running={executing} onClose={() => setShowResult(false)} />
          )}
        </View>
      )}

      {/* Execute CTA */}
      {canvasNodes.length > 0 && (
        <TouchableOpacity onPress={() => { if (pane !== 'canvas') setPane('canvas'); execute(); }}
          disabled={executing}
          style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLOR.magenta, paddingVertical: 14, paddingHorizontal: 16, opacity: executing ? 0.6 : 1 }]}>
          {executing ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="play-arrow" size={20} color="#000" />}
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.8 }}>
            {executing ? 'EXECUTING PIPELINE...' : `▶ EXECUTE ${canvasNodes.length}-NODE PIPELINE`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BuilderScreen() {
  return (
    <TabErrorBoundary name="Script Forge">
      <ForgeInner />
    </TabErrorBoundary>
  );
}
