/**
 * BUTLER AI — Script Library v6 · FORGE Upgrade
 * Undo stack · Favorites · Output copy · History
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 */
import { ButlerPageStudioHost } from '@/components/ui/ButlerPageStudioHost';
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import ButlerMicrocopy from '@/components/ui/ButlerMicrocopy';
import ButlerAtmosphere from '@/components/ui/ButlerAtmosphere';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Animated, Platform, Dimensions, ScrollView, ActivityIndicator,
  Modal, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSkin } from '@/hooks/useSkin';
import { SkinHeaderFX } from '@/components/ui/SkinHeaderFX';
import { useFocusEffect } from 'expo-router';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { serverConnection } from '@/services/serverConnection';
import { scriptExecutor } from '@/services/scriptExecutor';
import { haptics } from '@/services/haptics';
import { scanScriptTrust, type TrustReport } from '@/services/trustLabClient';

const BG   = '#0B0F17';
const SURF = '#0B0F17';
const SURF2= '#111621';
const BLUE = '#4A9EFF';
const CYAN = '#38D9E8';
const GREEN= '#2FE38A';
const AMBER= '#FFB43D';
const RED  = '#FF4D5E';
const PURP = '#A468FF';
const TEAL = '#38D9E8';
const DIM  = '#4A9EFF';
const MID  = '#4A9EFF';
const TEXT = '#DCE6F2';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW   = Math.max(320, Dimensions.get('window').width);
const CARD_W = (SW - 32 - 8) / 2;

// ── Script data ─────────────────────────────────────────────────
const CATEGORIES = [
  { id:'all',      label:'ALL',       icon:'apps',                 color:CYAN  },
  { id:'system',   label:'SYSTEM',    icon:'monitor-dashboard',    color:BLUE  },
  { id:'security', label:'SECURITY',  icon:'shield-check-outline', color:RED   },
  { id:'files',    label:'FILES',     icon:'folder-check-outline', color:AMBER },
  { id:'network',  label:'NETWORK',   icon:'network-outline',      color:GREEN },
  { id:'cleanup',  label:'CLEANUP',   icon:'broom',                color:TEAL  },
  { id:'perf',     label:'PERF',      icon:'speedometer',          color:PURP  },
  { id:'ai',       label:'AI',        icon:'robot-happy-outline',  color:PURP  },
];

type Script = {
  id:string; name:string; desc:string; cat:string;
  color:string; icon:string; script:string; tags:string[];
  danger?: boolean;
};

const SCRIPTS: Script[] = [
  { id:'s1',  name:'SYSTEM INFO',      desc:'Full OS, CPU, RAM, disk report',       cat:'system',   color:BLUE,  icon:'monitor-dashboard',   tags:['cpu','ram','disk'],   script:`import platform,psutil\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"CPU: {psutil.cpu_percent(1)}%  RAM: {psutil.virtual_memory().percent}%")` },
  { id:'s2',  name:'CLEAN TEMPS',      desc:'Remove temp files and free space',     cat:'cleanup',  color:TEAL,  icon:'broom',               tags:['clean','temp'],       script:`import shutil,os,tempfile\ntd=tempfile.gettempdir();freed=0;n=0\nfor f in os.listdir(td):\n p=os.path.join(td,f)\n try:\n  sz=os.path.getsize(p) if os.path.isfile(p) else 0\n  (os.unlink if os.path.isfile(p) else shutil.rmtree)(p)\n  freed+=sz;n+=1\n except:pass\nprint(f"Freed {freed//1024//1024}MB from {n} items")` },
  { id:'s3',  name:'NETWORK SCAN',     desc:'Show all network interfaces & IPs',    cat:'network',  color:GREEN, icon:'network-outline',     tags:['lan','ip','scan'],    script:`import socket,psutil\nnet=psutil.net_if_addrs()\nfor k,v in list(net.items())[:4]:\n for a in v:\n  if a.family==socket.AF_INET: print(f"{k}: {a.address}")` },
  { id:'s4',  name:'TOP PROCESSES',    desc:'Heaviest CPU processes with PID',      cat:'system',   color:BLUE,  icon:'cpu-64-bit',          tags:['cpu','processes'],    script:`import psutil\nfor p in sorted(psutil.process_iter(['name','cpu_percent']),key=lambda x:x.info['cpu_percent'] or 0,reverse=True)[:8]:\n print(f"{p.info['name'][:22]:22} {p.info['cpu_percent']:.1f}%")` },
  { id:'s5',  name:'DISK USAGE',       desc:'Drive usage breakdown by partition',   cat:'system',   color:AMBER, icon:'harddisk',            tags:['disk','storage'],     script:`import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { id:'s6',  name:'SECURITY AUDIT',   desc:'Quick Windows security check',         cat:'security', color:RED,   icon:'shield-alert-outline', tags:['security','audit'],   script:`import subprocess\nr=subprocess.run(['powershell','-Command','Get-WindowsUpdateLog'],capture_output=True,text=True)\nprint(r.stdout[:600] or 'Security check complete')`, danger:true },
  { id:'s7',  name:'OPEN PORTS',       desc:'List all listening network ports',     cat:'network',  color:GREEN, icon:'lan-pending',         tags:['ports','network'],    script:`import psutil\nfor c in psutil.net_connections():\n if c.status=='LISTEN' and c.laddr:\n  print(f"Port {c.laddr.port}")` },
  { id:'s8',  name:'MEMORY USAGE',     desc:'RAM breakdown by top consumers',       cat:'system',   color:PURP,  icon:'memory',              tags:['ram','memory'],       script:`import psutil\nvm=psutil.virtual_memory()\nprint(f"Total: {vm.total//1024**3}GB  Used: {vm.percent}%  Free: {vm.available//1024**3}GB")` },
  { id:'s9',  name:'FILE ORGANIZER',   desc:'Sort desktop files by extension',      cat:'files',    color:AMBER, icon:'folder-cog-outline',  tags:['files','organize'],   script:`from pathlib import Path\nd=Path.home()/'Desktop'\nfor f in d.glob('*'):\n if f.is_file():\n  ext=f.suffix.lstrip('.').upper() or 'OTHER'\n  (d/ext).mkdir(exist_ok=True)\n  print(f"Would move {f.name} -> {ext}/")` },
  { id:'s10', name:'STARTUP ITEMS',    desc:'List all Windows startup programs',    cat:'system',   color:BLUE,  icon:'rocket-launch-outline',tags:['startup','boot'],    script:`import subprocess\nr=subprocess.run(['powershell','-Command','Get-CimInstance Win32_StartupCommand | Select-Object Name,Command | Format-List'],capture_output=True,text=True)\nprint(r.stdout[:500])` },
  { id:'s11', name:'WIFI SCANNER',     desc:'Nearby WiFi networks & signal',        cat:'network',  color:GREEN, icon:'wifi-marker',         tags:['wifi','scan'],        script:`import subprocess\nr=subprocess.run(['netsh','wlan','show','networks','mode=bssid'],capture_output=True,text=True)\nprint(r.stdout[:800])` },
  { id:'s12', name:'FIND LARGE FILES', desc:'Top 10 largest files in home dir',     cat:'files',    color:AMBER, icon:'file-search-outline', tags:['files','disk'],       script:`from pathlib import Path\nfiles=sorted(Path.home().rglob('*'),key=lambda p:p.stat().st_size if p.is_file() else 0,reverse=True)[:10]\nfor f in files:\n try: print(f"{f.stat().st_size//1024//1024}MB  {f.name}")\n except:pass` },
  { id:'s13', name:'CPU BENCHMARK',    desc:'Quick CPU performance benchmark',      cat:'perf',     color:PURP,  icon:'speedometer',         tags:['cpu','perf','bench'], script:`import time,math\nstart=time.perf_counter()\nfor i in range(1_000_000):math.sqrt(i)\nend=time.perf_counter()\nprint(f"1M sqrt ops: {(end-start)*1000:.1f}ms")` },
  { id:'s14', name:'ENV VARIABLES',    desc:'Show all environment variables',       cat:'system',   color:BLUE,  icon:'variable',            tags:['env','system'],       script:`import os\nfor k,v in list(os.environ.items())[:20]: print(f"{k}: {v[:50]}")` },
  { id:'s15', name:'KILL PROCESS',     desc:'Kill a process by name — careful!',   cat:'system',   color:RED,   icon:'close-circle-outline', tags:['process','kill'],     script:`import psutil,sys\nname=sys.argv[1] if len(sys.argv)>1 else 'notepad'\nfor p in psutil.process_iter(['name']):\n if p.info['name'].lower()==name.lower():\n  p.terminate()\n  print(f"Terminated {p.info['name']}")`, danger:true },
  { id:'s16', name:'SYSTEM UPTIME',    desc:'How long the PC has been running',     cat:'system',   color:CYAN,  icon:'clock-check-outline',  tags:['uptime','time'],      script:`import psutil,datetime\nbt=datetime.datetime.fromtimestamp(psutil.boot_time())\nuptime=datetime.datetime.now()-bt\nprint(f"Boot: {bt.strftime('%Y-%m-%d %H:%M')}\nUptime: {str(uptime).split('.')[0]}")` },
];

// ── History entry ───────────────────────────────────────────────
type HistoryEntry = {
  script: Script;
  result: string;
  ts: number;
  ok: boolean;
  undoId?: string;
  receipt?: { event_hash?: string; outcome?: string; deletion_status?: string; payload?: { resource_summary?: Record<string, unknown> } };
};

// ── Pulse dot ───────────────────────────────────────────────────
const PulseDot = memo(({ color, size = 6 }: { color: string; size?: number }) => {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue:1, duration:700, useNativeDriver:true }),
      Animated.timing(a, { toValue:0.2, duration:700, useNativeDriver:true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:color, opacity:a }} />;
});

// ── Script card with RUN + FAVORITE + INFO ─────────────────────
const ScriptCard = memo(({ script, onRun, onFav, running, isFav, trust, onTrust, scanning }: {
  script: Script; onRun: (s: Script) => void; onFav: (id: string) => void;
  running: boolean; isFav: boolean; trust?: TrustReport; onTrust: (s: Script) => void; scanning: boolean;
}) => {
  const scaleA = useRef(new Animated.Value(1)).current;
  const press  = () => {
    Animated.sequence([
      Animated.timing(scaleA, { toValue:0.93, duration:60, useNativeDriver:true }),
      Animated.spring(scaleA,  { toValue:1, tension:280, friction:10, useNativeDriver:true }),
    ]).start();
  };
  return (
    <Animated.View style={[SC.card, {
      borderTopColor: script.color,
      borderColor: script.color + (script.danger ? '50' : '28'),
      transform: [{ scale: scaleA }],
    }]}>
      {/* Danger indicator */}
      {script.danger && (
        <View style={[SC.dangerBadge, { borderColor: RED + '55', backgroundColor: RED + '10' }]}>
          <MaterialIcons name="warning" size={8} color={RED} />
          <Text style={{ fontFamily:MONO, fontSize:7, color:RED, fontWeight:'900' }}>CAUTION</Text>
        </View>
      )}
      {/* Top row: icon + fav */}
      <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between' }}>
        <View style={[SC.iconBox, { backgroundColor: script.color+'12', borderColor: script.color+'40' }]}>
          <MaterialCommunityIcons name={script.icon as any} size={22} color={script.color} />
        </View>
        <TouchableOpacity onPress={() => { haptics.light(); onFav(script.id); }}
          hitSlop={{top:6,bottom:6,left:6,right:6}} activeOpacity={0.8}>
          <MaterialIcons name={isFav ? 'star' : 'star-border'} size={16}
            color={isFav ? AMBER : MID} />
        </TouchableOpacity>
      </View>
      <Text style={[SC.name, { color: script.color }]} numberOfLines={2}>{script.name}</Text>
      <Text style={SC.desc} numberOfLines={2}>{script.desc}</Text>
      {/* Tags */}
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:3, marginTop:3 }}>
        {script.tags.slice(0,2).map(t => (
          <View key={t} style={{ borderWidth:1, borderRadius:4, paddingHorizontal:4, paddingVertical:1, borderColor: script.color+'28' }}>
            <Text style={{ fontFamily:MONO, fontSize:7, color: script.color+'80' }}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={SC.trustRow}>
        <View style={[SC.trustBadge, { borderColor: trust?.status === 'verified' ? GREEN+'70' : trust?.status === 'blocked' ? RED+'70' : trust ? AMBER+'70' : MID+'55' }]}>
          <MaterialCommunityIcons name={trust?.status === 'verified' ? 'check-decagram' : trust?.status === 'blocked' ? 'alert-octagon-outline' : trust ? 'alert-outline' : 'shield-search'} size={13} color={trust?.status === 'verified' ? GREEN : trust?.status === 'blocked' ? RED : trust ? AMBER : MID} />
          <Text style={[SC.trustText, { color: trust?.status === 'verified' ? GREEN : trust?.status === 'blocked' ? RED : trust ? AMBER : MID }]}>{scanning ? 'SCANNING' : trust?.status?.toUpperCase() || 'UNSCANNED'}</Text>
        </View>
        <TouchableOpacity style={SC.logBtn} onPress={() => onTrust(script)} disabled={scanning} activeOpacity={0.8}>
          <MaterialCommunityIcons name="text-box-search-outline" size={13} color={AMBER} /><Text style={SC.logTxt}>LOG</Text>
        </TouchableOpacity>
      </View>
      {/* RUN button */}
      <TouchableOpacity onPressIn={press} onPress={() => { haptics.heavy(); onRun(script); }}
        activeOpacity={0.85}
        style={[SC.runBtn, { backgroundColor: script.danger ? RED : script.color, opacity: running ? 0.5 : 1 }]}
        disabled={running}>
        {running
          ? <ActivityIndicator size="small" color="#000" />
          : <>
              <MaterialIcons name="play-arrow" size={14} color="#000" />
              <Text style={SC.runTxt}>{script.danger ? 'RUN ⚠' : 'RUN'}</Text>
            </>}
      </TouchableOpacity>
    </Animated.View>
  );
});
const SC = StyleSheet.create({
  card:       { width:CARD_W, backgroundColor:SURF, borderRadius:14, borderWidth:1.5, borderTopWidth:3, padding:11, gap:5,
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:0.4,shadowRadius:8}, android:{elevation:4} }) },
  dangerBadge:{ flexDirection:'row', alignItems:'center', gap:3, alignSelf:'flex-start', borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:2 },
  iconBox:    { width:42, height:42, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  name:       { fontFamily:MONO, fontSize:10.5, fontWeight:'900', letterSpacing:0.3, lineHeight:14 },
  desc:       { fontFamily:MONO, fontSize:9, color:MID, lineHeight:13 },
  runBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:4, borderRadius:9, paddingVertical:9, marginTop:3 },
  runTxt:     { fontFamily:MONO, fontSize:10, fontWeight:'900', color:'#000' },
  trustRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:3, minHeight:24 },
  trustBadge: { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:3 },
  trustText:  { fontFamily:MONO, fontSize:7, fontWeight:'900', letterSpacing:0.4 },
  logBtn:     { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderColor:AMBER+'55', borderRadius:5, paddingHorizontal:6, paddingVertical:3 },
  logTxt:     { fontFamily:MONO, fontSize:7, color:AMBER, fontWeight:'900', letterSpacing:0.6 },
});

// ── Header with UNDO button ────────────────────────────────────
const ForgeHeader = memo(({ safeTop, count, total }: {
  safeTop:number; count:number; total:number;
}) => {
  const [hh, setHh] = useState('--:--');
  const scanX = useRef(new Animated.Value(-SW)).current;
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setHh(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanX, { toValue:SW+120, duration:2400, useNativeDriver:true }),
      Animated.timing(scanX, { toValue:-SW, duration:0, useNativeDriver:true }),
      Animated.delay(5500),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  // ── SKIN WIRING: every colour below resolves from the active pack on the
  // SKINS page, so switching a skin recolours this header instantly. ──
  const S = useSkin();
  const CYAN = S.accent, TEAL = S.accent, BLUE = S.accent2, PURP = S.accent3;
  const AMBER = S.warn, GREEN = S.ok, RED = S.danger;
  const TEXT = S.text, DIM = S.dim, MID = S.mid;
  const SURF = S.panel, SURF2 = S.panel2, SURF3 = S.panel2, BG = S.bg;
  return (
    <View style={[FH.root, { paddingTop: safeTop, backgroundColor: S.headerBg, borderBottomColor: S.border }]}>
          <SkinHeaderFX accent={S.accent} accent2={S.accent2} accent3={S.accent3} stripe={S.stripe} fxKey="FH" still={!S.headerGlow} />
      <View style={{ height:3, backgroundColor:BLUE }} />
      <Animated.View pointerEvents="none" style={[FH.scan, { transform:[{ translateX:scanX }] }]} />
      <View style={FH.body}>
        <View style={{ flex:1, gap:4 }}>
          <Text style={FH.eye}>AUTOMATION LIBRARY · {total} SCRIPTS</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <MaterialCommunityIcons name="code-braces-box" size={18} color={BLUE} />
            <Text style={FH.title}>SCRIPT <Text style={{ color:BLUE }}>LIBRARY</Text></Text>
          </View>
          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap' }}>
            <View style={[FH.pill, { borderColor:BLUE+'60', backgroundColor:BLUE+'10' }]}>
              <Text style={[FH.pTxt, { color:BLUE }]}>{count} RESULTS</Text>
            </View>

          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:3 }}>
          <Text style={[FH.cBig, { color:TEXT }]}>{hh}</Text>
          <Text style={FH.cSub}>LOCAL · SECURE</Text>
        </View>
      </View>
      <View style={{ height:2, backgroundColor:BLUE+'35' }} />
    </View>
  );
});
const FH = StyleSheet.create({
  root:  { backgroundColor:'#0B0F17', overflow:'hidden' },
  scan:  { position:'absolute', top:0, bottom:0, width:80, backgroundColor:BLUE+'07' },
  body:  { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:14, paddingTop:11, paddingBottom:12, gap:10, zIndex:1 },
  eye:   { fontFamily:MONO, fontSize:7.5, color:BLUE+'60', letterSpacing:1.5, fontWeight:'700' },
  title: { fontSize:22, fontWeight:'900', color:'#FFF' },
  pill:  { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:9, paddingVertical:4 },
  pTxt:  { fontFamily:MONO, fontSize:9, fontWeight:'900' },
  cBig:  { fontFamily:MONO, fontSize:22, fontWeight:'900', letterSpacing:1 },
  cSub:  { fontFamily:MONO, fontSize:7, color:MID, letterSpacing:1 },
});

// ── Run result modal with COPY + CODE PREVIEW ──────────────────
const RunModal = memo(({ visible, script, result, running, receipt, undoBusy, onUndo, onClose, onCopy }: {
  visible:boolean; script:Script|null; result:string; running:boolean;
  receipt?: HistoryEntry['receipt']; undoBusy:boolean; onUndo:()=>void;
  onClose:()=>void; onCopy:()=>void;
}) => {
  if (!visible || !script) return null;
  const ok     = !result.toLowerCase().includes('error') && !result.toLowerCase().includes('traceback');
  const color  = running ? AMBER : ok ? GREEN : RED;
  const statusLabel = running ? 'EXECUTING…' : ok ? 'COMPLETED ✓' : 'ERROR';
  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.88)', justifyContent:'flex-end' }}>
        <View style={RM.sheet}>
          <View style={{ height:3, backgroundColor:color }} />
          {/* Header */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:14 }}>
            <View style={[RM.iconBox, { backgroundColor:script.color+'14', borderColor:script.color+'50' }]}>
              <MaterialCommunityIcons name={script.icon as any} size={20} color={script.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[RM.title, { color:script.color }]}>{script.name}</Text>
              <Text style={[RM.sub, { color }]}>{statusLabel}</Text>
            </View>
            {/* Copy button */}
            {!running && result && (
              <TouchableOpacity onPress={onCopy} activeOpacity={0.8}
                style={[RM.copyBtn, { borderColor:CYAN+'40', backgroundColor:CYAN+'0C' }]}>
                <MaterialIcons name="content-copy" size={14} color={CYAN} />
                <Text style={{ fontFamily:MONO, fontSize:8.5, color:CYAN, fontWeight:'900' }}>COPY</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ padding:4 }}>
              <MaterialIcons name="close" size={20} color={MID} />
            </TouchableOpacity>
          </View>

          {/* Output box */}
          <View style={[RM.outputBox, { borderColor:color+'30', backgroundColor:color+'05' }]}>
            {running
              ? <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:10 }}>
                  <ActivityIndicator color={color} size="large" />
                  <Text style={{ fontFamily:MONO, fontSize:11, color:AMBER }}>Executing on PC…</Text>
                </View>
              : <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[RM.output, { color: ok ? '#2FE38A' : '#FF4D5E' }]} selectable>{result || 'No output'}</Text>
                </ScrollView>
            }
          </View>

          {!running && receipt && (
            <View style={{ marginHorizontal:14, marginBottom:6, borderWidth:1.5, borderRadius:10, padding:10, borderColor:CYAN+'35', backgroundColor:CYAN+'07' }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <MaterialIcons name="verified" size={14} color={CYAN} />
                <Text style={{ fontFamily:MONO, fontSize:8.5, color:CYAN, fontWeight:'900', letterSpacing:0.5, flex:1 }}>FLOW LEDGER RECEIPT</Text>
                <Text style={{ fontFamily:MONO, fontSize:8, color:GREEN, fontWeight:'900' }}>{String(receipt.outcome || 'recorded').toUpperCase()}</Text>
              </View>
              <Text numberOfLines={2} style={{ fontFamily:MONO, fontSize:8, color:MID, marginTop:5 }}>
                {receipt.event_hash ? `Receipt ${receipt.event_hash.slice(0, 12)}…` : 'Server receipt recorded'}
              </Text>
            </View>
          )}

          {/* Script preview panel */}
          {!running && (
            <View style={[RM.codeBox, { borderColor:BLUE+'25' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 }}>
                <View style={{ width:6, height:6, borderRadius:3, backgroundColor:BLUE }} />
                <Text style={{ fontFamily:MONO, fontSize:8, color:BLUE+'80', fontWeight:'900', letterSpacing:0.5 }}>SCRIPT SOURCE</Text>
              </View>
              <Text style={RM.codeText} numberOfLines={4} selectable>{script.script}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection:'row', gap:8, padding:12, paddingTop:8 }}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}
              style={{ flex:1, alignItems:'center', justifyContent:'center', borderRadius:12, paddingVertical:12,
                borderWidth:1.5, borderColor:DIM+'80', backgroundColor:SURF2 }}>
              <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:MID }}>CLOSE</Text>
            </TouchableOpacity>
            {receipt?.outcome === 'succeeded' && (
              <TouchableOpacity onPress={onUndo} activeOpacity={0.85} disabled={undoBusy || !receipt}
                style={{ flex:1.3, alignItems:'center', justifyContent:'center', borderRadius:12, paddingVertical:12, backgroundColor:AMBER, opacity:undoBusy ? 0.6 : 1 }}>
                <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:'#000' }}>{undoBusy ? 'UNDO…' : 'UNDO'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}
              style={{ flex:2, alignItems:'center', justifyContent:'center', borderRadius:12, paddingVertical:12, backgroundColor:color }}>
              <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:'#000' }}>
                {running ? 'RUNNING…' : 'DONE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});
const RM = StyleSheet.create({
  sheet:    { backgroundColor:SURF, borderTopLeftRadius:24, borderTopRightRadius:24, overflow:'hidden', maxHeight:'85%' },
  iconBox:  { width:44, height:44, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:    { fontFamily:MONO, fontSize:14, fontWeight:'900', color:TEXT },
  sub:      { fontFamily:MONO, fontSize:9, marginTop:2, fontWeight:'900' },
  copyBtn:  { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:9, paddingHorizontal:8, paddingVertical:6 },
  outputBox:{ marginHorizontal:14, marginBottom:6, borderWidth:1.5, borderRadius:12, padding:14, height:150 },
  output:   { fontFamily:MONO, fontSize:12, lineHeight:18 },
  codeBox:  { marginHorizontal:14, marginBottom:4, borderWidth:1.5, borderRadius:10, padding:10, backgroundColor:BG },
  codeText: { fontFamily:MONO, fontSize:10, color:BLUE+'90', lineHeight:15 },
});

// ── History panel ───────────────────────────────────────────────
const HistoryRow = memo(({ entry, onRerun }: { entry: HistoryEntry; onRerun: (s: Script) => void }) => {
  const ago = Math.round((Date.now() - entry.ts) / 60000);
  const agoStr = ago < 1 ? 'now' : ago < 60 ? `${ago}m` : `${Math.round(ago/60)}h`;
  return (
    <TouchableOpacity onPress={() => { haptics.light(); onRerun(entry.script); }} activeOpacity={0.8}
      style={HI.row}>
      <View style={[HI.dot, { backgroundColor: entry.ok ? GREEN : RED }]} />
      <View style={{ flex:1 }}>
        <Text style={HI.name} numberOfLines={1}>{entry.script.name}</Text>
        <Text style={HI.result} numberOfLines={1}>{entry.result.slice(0,50)}</Text>
      </View>
      <Text style={HI.ago}>{agoStr}</Text>
      <MaterialCommunityIcons name="replay" size={14} color={MID} />
    </TouchableOpacity>
  );
});
const HI = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:9, paddingHorizontal:14, paddingVertical:9, borderBottomWidth:1, borderBottomColor:DIM+'40' },
  dot:    { width:6, height:6, borderRadius:3, flexShrink:0 },
  name:   { fontFamily:MONO, fontSize:11, color:TEXT, fontWeight:'700' },
  result: { fontFamily:MONO, fontSize:9, color:MID, marginTop:2 },
  ago:    { fontFamily:MONO, fontSize:8.5, color:MID, flexShrink:0 },
});

// ── Main screen ─────────────────────────────────────────────────
function ScriptsInner() {
  const insets = useSafeAreaInsets();
  const [cat, setCat]             = useState('all');
  const [query, setQuery]         = useState('');
  const [isConn, setIsConn]       = useState(false);
  const [running, setRunning]     = useState<string|null>(null);
  const [result, setResult]       = useState('');
  const [selScript, setSelScript] = useState<Script|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavs, setShowFavs]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HistoryEntry[]>([]);
  const [historyLen, setHistoryLen] = useState(0);
  const [undoBusy, setUndoBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<HistoryEntry['receipt']>();
  const [copied, setCopied]       = useState(false);
  const [trustReports, setTrustReports] = useState<Record<string, TrustReport>>({});
  const [trustScanning, setTrustScanning] = useState<Set<string>>(new Set());

  const scanTrust = useCallback(async (s: Script) => {
    if (!serverConnection.isConnected?.()) {
      Alert.alert('Trust Lab offline', 'Pair the PC before requesting a real verification report. Butler will not show a green checkmark from local guesswork.', [{ text: 'OK' }]);
      return;
    }
    setTrustScanning(prev => new Set(prev).add(s.id));
    try {
      const report = await scanScriptTrust(s.id, s.script);
      setTrustReports(prev => ({ ...prev, [s.id]: report }));
      const evidence = report.findings.length ? report.findings.map(f => `${f.severity.toUpperCase()} · line ${f.line ?? 'n/a'} · ${f.message}`).join('\\n') : 'No findings recorded.';
      Alert.alert(`${s.name} · ${report.status.toUpperCase()}`, `Digest: ${report.digest.slice(0, 20)}…\\nOrigin: ${report.origin}\\n\\n${evidence}`, [{ text: 'CLOSE' }]);
    } catch (e: any) {
      Alert.alert('Trust Lab unavailable', e?.message || 'The paired server did not return evidence. No verification badge was added.', [{ text: 'OK' }]);
    } finally {
      setTrustScanning(prev => { const n = new Set(prev); n.delete(s.id); return n; });
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const connected = serverConnection.isConnected?.() ?? false;
    setIsConn(connected);
    if (connected && Object.keys(trustReports).length === 0) {
      Promise.all(SCRIPTS.map(s => scanScriptTrust(s.id, s.script).then(report => [s.id, report] as const).catch(() => null))).then(rows => {
        const next: Record<string, TrustReport> = {};
        rows.forEach(row => { if (row) next[row[0]] = row[1]; });
        if (Object.keys(next).length) setTrustReports(next);
      }).catch(() => {});
    }
  }, [trustReports]));

  const filtered = useMemo(() => {
    let list = SCRIPTS;
    if (showFavs) list = list.filter(s => favorites.has(s.id));
    if (cat !== 'all') list = list.filter(s => s.cat === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }
    return list;
  }, [cat, query, showFavs, favorites]);

  const toggleFav = useCallback((id: string) => {
    setFavorites(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const undoLast = useCallback(async () => {
    const last = historyRef.current[0];
    if (!last) return;
    if (!last.undoId) {
      Alert.alert('Undo unavailable', 'This run has no verified server rollback receipt. Butler will not pretend it was undone.', [{ text: 'OK' }]);
      return;
    }
    if (!serverConnection.isConnected()) {
      Alert.alert('PC offline', 'Reconnect the paired PC before requesting a real undo.', [{ text: 'OK' }]);
      return;
    }
    setUndoBusy(true);
    try {
      const res = await serverConnection.request('/api/undo/rollback', {
        method: 'POST', body: JSON.stringify({ id: Number(last.undoId) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) throw new Error(body.error || `Undo rejected (${res.status})`);
      historyRef.current = historyRef.current.slice(1);
      setHistoryLen(historyRef.current.length);
      haptics.success();
      Alert.alert('Undo complete', body.message || `Butler reverted ${last.script.name} using the PC receipt.`, [{ text: 'OK' }]);
    } catch (e: any) {
      haptics.warning?.();
      Alert.alert('Undo not completed', e?.message || 'The PC did not confirm rollback. No local history was discarded.', [{ text: 'OK' }]);
    } finally {
      setUndoBusy(false);
    }
  }, []);

  const runScript = useCallback(async (s: Script) => {
    if (s.danger) {
      // Give a clear, specific warning before running dangerous scripts
      const riskDetail = s.id === 's15'
        ? 'This will immediately terminate a running process. Killing the wrong process can cause data loss or system instability.'
        : s.id === 's6'
        ? 'This reads Windows Security logs. Requires elevated privileges and may trigger UAC on some systems.'
        : 'This script can modify system files or settings. Running it incorrectly could cause data loss or instability.';
      let confirmed = false;
      await new Promise<void>(res => {
        Alert.alert(
          '⚠ WARNING — POTENTIALLY DESTRUCTIVE',
          `"${s.name}"\n\n${riskDetail}\n\nOnly proceed if you understand what this script does.`,
          [
            { text: 'Cancel — Go Back', style: 'cancel', onPress: () => res() },
            { text: 'I Understand — RUN', style: 'destructive', onPress: () => { confirmed = true; res(); } },
          ]
        );
      });
      if (!confirmed) return;
    }
    setSelScript(s); setResult(''); setLastReceipt(undefined); setShowModal(true); setRunning(s.id);

    if (!isConn) {
      await new Promise(r => setTimeout(r, 700));
      const preview = `PC not connected — pair first.\n\nPreview:\n${s.script.split('\n').slice(0,4).join('\n')}…`;
      setResult(preview);
      setRunning(null);
      return;
    }

    try {
      const exec = await scriptExecutor.executeSavedScript(s.id, { timeout: 25000 });
      const out = (exec.output || exec.error || 'Done').trim().slice(0, 800);
      setResult(out);
      const ok = exec.success;
      setLastReceipt(exec.receipt as HistoryEntry['receipt']);
      // Push only the server-backed execution record. A failed or unreceipted run is not presented as undoable.
      historyRef.current = [{ script:s, result:out, ts:Date.now(), ok, undoId:exec.undoId, receipt:exec.receipt as HistoryEntry['receipt'] }, ...historyRef.current].slice(0,10);
      setHistoryLen(historyRef.current.length);
      haptics.success();
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? 'Timed out (25s)' : (e?.message || 'Flow Ledger execution failed');
      setResult('Error: ' + msg);
    }
    setRunning(null);
  }, [isConn]);

  const copyOutput = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(result);
      setCopied(true);
      haptics.success();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [result]);

  const renderScript = useCallback(({ item, index }: { item:Script; index:number }) => (
    <View style={{ width:CARD_W, marginLeft: index%2===0 ? 0 : 8 }}>
      <ScriptCard
        script={item}
        onRun={runScript}
        onFav={toggleFav}
        running={running === item.id}
        isFav={favorites.has(item.id)}
        trust={trustReports[item.id]}
        onTrust={scanTrust}
        scanning={trustScanning.has(item.id)}
      />
    </View>
  ), [running, favorites, runScript, toggleFav, trustReports, trustScanning, scanTrust]);

  return (
    <View style={{ flex:1, backgroundColor:BG }}>
      <ButlerAtmosphere accent="#A468FF" intensity={0.12} />
      <ButlerMicrocopy accent="#A468FF" text="Preview, guard, and confirm a script before it reaches the PC." icon="shield-check-outline" />
      <ForgeHeader
        safeTop={insets.top}
        count={filtered.length}
        total={SCRIPTS.length}
      />

      {/* Search bar */}
      <View style={SR.searchRow}>
        <View style={[SR.search, { borderColor: query ? BLUE+'60' : DIM+'50', flex:1 }]}>
          <MaterialIcons name="search" size={16} color={MID} />
          <TextInput value={query} onChangeText={setQuery}
            placeholder="Search scripts, tags, categories…"
            placeholderTextColor={MID} style={SR.input} />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="close" size={14} color={MID} />
            </TouchableOpacity>
          ) : null}
        </View>
        {/* Favorites toggle */}
        <TouchableOpacity onPress={() => { haptics.light(); setShowFavs(p => !p); }} activeOpacity={0.8}
          style={[SR.iconBtn, { borderColor: showFavs ? AMBER+'70' : DIM+'50', backgroundColor: showFavs ? AMBER+'12' : DIM+'20' }]}>
          <MaterialIcons name={showFavs ? 'star' : 'star-border'} size={18} color={showFavs ? AMBER : MID} />
        </TouchableOpacity>
        {/* History toggle */}
        <TouchableOpacity onPress={() => { haptics.light(); setShowHistory(p => !p); }} activeOpacity={0.8}
          style={[SR.iconBtn, { borderColor: showHistory ? CYAN+'70' : DIM+'50', backgroundColor: showHistory ? CYAN+'12' : DIM+'20' }]}>
          <MaterialIcons name="history" size={18} color={showHistory ? CYAN : MID} />
          {historyLen > 0 && !showHistory && (
            <View style={{ position:'absolute', top:-3, right:-3, width:10, height:10, borderRadius:5, backgroundColor:AMBER, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:6, color:'#000', fontWeight:'900' }}>{historyLen}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={undoLast} activeOpacity={0.8} disabled={historyLen === 0 || undoBusy}
          style={[SR.iconBtn, { borderColor: historyLen > 0 ? AMBER+'70' : DIM+'40', backgroundColor: historyLen > 0 ? AMBER+'12' : DIM+'16', opacity: historyLen > 0 ? 1 : 0.55 }]}>
          <MaterialIcons name="undo" size={18} color={historyLen > 0 ? AMBER : MID} />
        </TouchableOpacity>
      </View>

      {/* History panel */}
      {showHistory && historyRef.current.length > 0 && (
        <View style={{ backgroundColor:SURF2, borderBottomWidth:1, borderBottomColor:DIM+'60' }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:14, paddingTop:10, paddingBottom:6 }}>
            <View style={{ width:3, height:12, borderRadius:1.5, backgroundColor:CYAN }} />
            <Text style={{ fontFamily:MONO, fontSize:9, color:CYAN+'90', fontWeight:'900', letterSpacing:1.5, flex:1 }}>RUN HISTORY</Text>
            <TouchableOpacity onPress={() => { historyRef.current=[]; setHistoryLen(0); haptics.medium(); }} activeOpacity={0.8}>
              <Text style={{ fontFamily:MONO, fontSize:8.5, color:RED+'80', fontWeight:'900' }}>CLEAR ALL</Text>
            </TouchableOpacity>
          </View>
          {historyRef.current.slice(0,4).map((e,i) => (
            <HistoryRow key={i} entry={e} onRerun={runScript} />
          ))}
        </View>
      )}

      {/* Categories */}
      <View style={{ height:52, backgroundColor:SURF2, borderBottomWidth:1, borderBottomColor:DIM+'40' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap:7, paddingHorizontal:12, alignItems:'center', height:'100%' }}>
          {CATEGORIES.map(c => {
            const active = cat === c.id;
            return (
              <TouchableOpacity key={c.id} onPress={() => { haptics.light(); setCat(c.id); }} activeOpacity={0.8}
                style={[SR.chip, { borderColor: active ? c.color+'80' : DIM+'50', backgroundColor: active ? c.color+'15' : DIM+'20' }]}>
                <MaterialCommunityIcons name={c.icon as any} size={11} color={active ? c.color : MID} />
                <Text style={[SR.chipTxt, { color: active ? c.color : MID }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ButlerPageStudioHost pageId="scripts" />
      {/* Script grid */}
      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        renderItem={renderScript}
        numColumns={2}
        contentContainerStyle={{ padding:12, gap:8, paddingBottom: insets.bottom + 80 }}
        columnWrapperStyle={{ gap:8 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <View style={{ alignItems:'center', paddingTop:60, gap:10 }}>
            <MaterialCommunityIcons name="code-braces-box" size={48} color={DIM} />
            <Text style={{ fontFamily:MONO, fontSize:12, color:MID }}>
              {showFavs ? 'No favorites yet — tap ★ on a script' : 'No scripts match'}
            </Text>
          </View>
        }
      />

      {/* Status bar */}
      <View style={[SR.statusBar, { paddingBottom: Math.max(insets.bottom+4, 10) }]}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
          <View style={{ width:7, height:7, borderRadius:3.5, backgroundColor: isConn ? GREEN : AMBER }} />
          <Text style={{ fontFamily:MONO, fontSize:9, color: isConn ? GREEN : AMBER, fontWeight:'900' }}>
            {isConn ? 'PC CONNECTED · READY' : 'OFFLINE · PAIR PC'}
          </Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>

          <Text style={{ fontFamily:MONO, fontSize:9, color:MID }}>{filtered.length}/{SCRIPTS.length}</Text>
        </View>
      </View>

      <RunModal
        visible={showModal}
        script={selScript}
        result={result}
        running={!!running}
        receipt={lastReceipt}
        undoBusy={undoBusy}
        onUndo={undoLast}
        onClose={() => { setShowModal(false); setRunning(null); }}
        onCopy={copyOutput}
      />
    </View>
  );
}
const SR = StyleSheet.create({
  searchRow: { backgroundColor:SURF, paddingHorizontal:10, paddingVertical:8, borderBottomWidth:1, borderBottomColor:DIM+'40', flexDirection:'row', gap:8, alignItems:'center' },
  search:    { flexDirection:'row', alignItems:'center', gap:8, borderWidth:1.5, borderRadius:12, paddingHorizontal:11, paddingVertical:8, backgroundColor:BG },
  input:     { flex:1, fontFamily:MONO, fontSize:13, color:TEXT, padding:0, includeFontPadding:false },
  iconBtn:   { width:44, height:44, borderWidth:1.5, borderRadius:12, alignItems:'center', justifyContent:'center' },
  chip:      { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:10, paddingVertical:6 },
  chipTxt:   { fontFamily:MONO, fontSize:9.5, fontWeight:'900' },
  statusBar: { backgroundColor:SURF, borderTopWidth:1, borderTopColor:DIM+'40', paddingTop:9, paddingHorizontal:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
});

export default function ScriptsScreen() {
  return <TabErrorBoundary name="Script Library"><ScriptsInner /></TabErrorBoundary>;
}
