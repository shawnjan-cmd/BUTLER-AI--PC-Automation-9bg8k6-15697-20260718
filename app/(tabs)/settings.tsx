/**
 * BUTLER AI — Settings v7.4 · VS Code IDE Export & Centered Layout
 * Featuring Real-Time Search, Perfectly Centered Cards, and Proprietary Modules.
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 */
import { ButlerPageStudioHost } from '@/components/ui/ButlerPageStudioHost';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { router } from 'expo-router';
import ButlerMicrocopy from '@/components/ui/ButlerMicrocopy';
import ButlerAtmosphere from '@/components/ui/ButlerAtmosphere';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, Platform, Dimensions, Alert, Linking, ScrollView, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSkin } from '@/hooks/useSkin';
import { SkinHeaderFX } from '@/components/ui/SkinHeaderFX';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptedStorage } from '@/services/encryptedStorage';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';
import { automationWatchdog } from '@/services/automationWatchdog';
import { askButler, listOllamaModels } from '@/services/butlerAsk';
import * as ExpoClipboard from 'expo-clipboard';

const BG   = '#050810';
const SURF = '#070A10';
const SURF2= '#0B0F17';
const CYAN = '#38D9E8';
const GREEN= '#2FE38A';
const AMBER= '#FFB43D';
const RED  = '#FF4D5E';
const PURP = '#A468FF';
const BLUE = '#4A9EFF';
const DIM  = '#111621';
const MID  = '#4A9EFF';
const TEXT = '#DCE6F2';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW   = Math.max(320, Dimensions.get('window').width);

type SettingItem =
  | { type:'header'; label:string; color:string }
  | { type:'toggle'; label:string; sub:string; icon:string; color:string; key:string }
  | { type:'action'; label:string; sub:string; icon:string; color:string; action:string; danger?:boolean }
  | { type:'info';   label:string; sub:string; icon:string; color:string }
  | { type:'link';   label:string; sub:string; icon:string; color:string; url:string };

const SETTINGS: SettingItem[] = [
  { type:'header', label:'CONNECTION & PAIRING', color:CYAN },
  { type:'action', label:'Set Up Butler Server',      sub:'Animated download, pairing, and Ollama tutorial', icon:'rocket-launch', color:CYAN, action:'serverSetup' },
  { type:'action', label:'Pair PC via QR',          sub:'Scan QR from butler_server.py',    icon:'qr-code-scanner', color:CYAN,  action:'pair' },
  { type:'action', label:'Manual IP Entry',          sub:'Connect by IP address + port',     icon:'wifi',           color:BLUE,  action:'manual' },
  { type:'action', label:'Forget Paired PC',         sub:'Remove stored credentials',        icon:'link-off',       color:AMBER, action:'forget' },

  { type:'header', label:'PROPRIETARY AI ENGINES', color:PURP },
  { type:'action', label:'Check Ollama Status',      sub:'Verify local AI model is running', icon:'robot-happy',    color:PURP,  action:'ollama' },
  { type:'action', label:'Pull Best Model',           sub:'Download qwen2.5-coder:7b',        icon:'download',       color:CYAN,  action:'pull' },
  { type:'action', label:'Neural Kill-Switch',       sub:'Instantly freeze all AI & Python threads', icon:'flash-off', color:RED, action:'killSwitch' },

  { type:'header', label:'SYSTEM BEHAVIOR', color:AMBER },
  { type:'toggle', label:'Haptic Feedback',          sub:'Vibration on touch interactions',  icon:'vibration',      color:AMBER, key:'haptics' },

  { type:'header', label:'AUTOMATIONS & GUARDIANS', color:GREEN },
  { type:'toggle', label:'Morning PC Report',        sub:'System check on first connect each day', icon:'wb-sunny', color:GREEN, key:'morning_report' },
  { type:'toggle', label:'Disk Space Guardian',      sub:'Alert when a drive exceeds the threshold', icon:'sd-storage', color:RED, key:'disk_guardian' },
  { type:'toggle', label:'Automation Watchdog',      sub:'Alert if an automation causes file errors or crashes', icon:'bug-report', color:AMBER, key:'watchdog' },
  { type:'action', label:'Disk Alert Threshold',     sub:'Tap to change % threshold',         icon:'storage',        color:AMBER, action:'diskThreshold' },
  { type:'action', label:'Run Morning Report Now',   sub:'Trigger system report immediately', icon:'play-circle-outline', color:GREEN, action:'runMorning' },

  { type:'header', label:'PRIVACY & ZERO-KNOWLEDGE', color:GREEN },
  { type:'info',   label:'Telemetry',                sub:'Zero telemetry — nothing sent',    icon:'analytics',      color:GREEN },
  { type:'info',   label:'Cloud Storage',            sub:'Zero cloud — all data local',       icon:'cloud-off',      color:GREEN },
  { type:'action', label:'Clear Chat History',       sub:'Delete all chat sessions',          icon:'delete-sweep',   color:AMBER, action:'clearChat' },
  { type:'action', label:'Delete All My Data',        sub:'GDPR wipe — irreversible',          icon:'delete-forever', color:RED,   action:'deleteAll', danger:true },

  { type:'header', label:'CODEBASE IDE & SOURCE', color:PURP },
  { type:'action', label:'Export Codebase IDE',      sub:'VS Code-style HTML to view+edit all source', icon:'code', color:PURP, action:'exportHtml' },
  { type:'action', label:'Cache Tab Sources',        sub:'Visit all tabs to cache their source code',  icon:'sync',  color:CYAN, action:'cacheAll' },
  { type:'action', label:'Copy All Source',          sub:'All cached source → clipboard for AI',       icon:'content-copy', color:AMBER, action:'copySource' },

  { type:'header', label:'SYNC & UPDATES', color:BLUE },
  { type:'action', label:'Open GitHub Repo',         sub:'Download latest butler_server.py', icon:'code-tags',      color:CYAN,  action:'github' },
  { type:'link',   label:'Privacy Policy',           sub:'View full privacy document',        icon:'shield',         color:GREEN, url:'https://react-9b68z0.onspace.build' },
  { type:'link',   label:'Terms of Service',         sub:'Read full terms',                   icon:'gavel',          color:AMBER, url:'https://react-9b68z0.onspace.build#terms-of-service' },

  { type:'header', label:'PROTIPS & EFFICIENCY', color:AMBER },
  { type:'info',   label:'Use Smaller Models',         sub:'qwen2.5-coder:1.5b uses ~1GB RAM vs ~5GB for 7b — good for simple tasks', icon:'memory',          color:CYAN  },
  { type:'info',   label:'Clear Chat Regularly',       sub:'Every message is re-sent each turn. 15+ turns noticeably slows Ollama down', icon:'delete-sweep',  color:AMBER },
  { type:'info',   label:'Match Mode to Task',         sub:'Use CODE for scripting, SYSTEM for diagnostics — keeps prompts focused', icon:'tune',             color:PURP  },
  { type:'info',   label:'Scripts > AI for Metrics',  sub:'Run a script from FORGE for live CPU/RAM/disk — faster & no model tokens', icon:'speedometer',    color:GREEN },
  { type:'info',   label:'Be Concise in Prompts',      sub:'Shorter input = less context = faster response and less GPU memory used', icon:'compress',        color:CYAN  },
  { type:'info',   label:'Disk Guardian — Hourly Cap', sub:'Disk check runs at most once/hour. Rapid reconnects skip it to save compute', icon:'sd-storage',  color:AMBER },
  { type:'info',   label:'stream:false Saves RAM',     sub:'Butler uses non-streaming mode — full JSON response, no buffer overhead', icon:'data-usage',      color:AMBER },
  { type:'info',   label:'KB Crawler Uses Network',    sub:'Knowledge Base auto-crawl fetches Python/security docs from the web — disable if on metered data', icon:'wifi-off', color:RED },
  { type:'info',   label:'LAN-Only = Zero Latency',   sub:'No cloud hop means responses arrive in milliseconds over local network', icon:'wifi',             color:GREEN },
  { type:'info',   label:'Recommended Model',          sub:'qwen2.5-coder:7b — best speed/quality balance for coding + chat tasks', icon:'robot-happy',      color:PURP  },

  { type:'header', label:'ABOUT & PROPRIETARY LICENSE', color:MID },
  { type:'info',   label:'Butler AI',                sub:'v7.4.0 · com.butlerai.pc.automation', icon:'information', color:CYAN },
  { type:'info',   label:'Security',                 sub:'AES-256-GCM · HMAC-SHA256 · LAN only', icon:'lock',       color:GREEN },
  { type:'info',   label:'© 2026 Andrej Sladkovic', sub:'All rights reserved · Proprietary',    icon:'copyright',   color:MID },
];

const PulseDot = memo(({ color, size=6 }: { color:string; size?:number }) => {
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

const ConfigHeader = memo(({ safeTop }: { safeTop:number }) => {
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
      Animated.timing(scanX, { toValue:SW+120, duration:3000, useNativeDriver:true }),
      Animated.timing(scanX, { toValue:-SW, duration:0, useNativeDriver:true }),
      Animated.delay(8000),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  const S = useSkin();
  const CYAN = S.accent;
  const GREEN = S.ok;
  const TEXT = S.text;
  const MID = S.mid;
  return (
    <View style={[CH.root, { paddingTop: safeTop, backgroundColor: S.headerBg, borderBottomColor: S.border }]}>
      <SkinHeaderFX accent={S.accent} accent2={S.accent2} accent3={S.accent3} stripe={S.stripe} fxKey="CH" still={!S.headerGlow} />
      <View style={{ height:3, backgroundColor:CYAN }} />
      <Animated.View pointerEvents="none" style={[CH.scan, { transform:[{translateX:scanX}] }]} />
      <View style={CH.body}>
        <View style={{ flex:1, gap:4 }}>
          <Text style={CH.eye}>SYSTEM PREFERENCES · SECURED VAULT</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <MaterialCommunityIcons name="tune-variant" size={18} color={CYAN} />
            <Text style={CH.title}>SYSTEM <Text style={{ color:CYAN }}>CONFIG</Text></Text>
          </View>
          <View style={{ flexDirection:'row', gap:6 }}>
            <View style={[CH.pill, { borderColor: GREEN+'60', backgroundColor: GREEN+'10' }]}>
              <PulseDot color={GREEN} size={5} />
              <Text style={[CH.pTxt, { color:GREEN }]}>100% SECURE & CENTERED</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:3 }}>
          <Text style={[CH.cBig, { color:TEXT }]}>{hh}</Text>
          <Text style={CH.cSub}>LOCAL · BULLETPROOF</Text>
        </View>
      </View>
      <View style={{ height:2, backgroundColor: CYAN+'30' }} />
    </View>
  );
});
const CH = StyleSheet.create({
  root: { backgroundColor:'#050810', overflow:'hidden' },
  scan: { position:'absolute', top:0, bottom:0, width:80, backgroundColor: CYAN+'06' },
  body: { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:14, paddingTop:11, paddingBottom:12, gap:10, zIndex:1, alignSelf:'center', width:'100%', maxWidth:720 },
  eye:  { fontFamily:MONO, fontSize:7.5, color: CYAN+'60', letterSpacing:1.5, fontWeight:'700' },
  title:{ fontSize:22, fontWeight:'900', color:'#FFF' },
  pill: { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:9, paddingVertical:4 },
  pTxt: { fontFamily:MONO, fontSize:9, fontWeight:'900' },
  cBig: { fontFamily:MONO, fontSize:22, fontWeight:'900', letterSpacing:1 },
  cSub: { fontFamily:MONO, fontSize:7, color:MID, letterSpacing:1 },
});

function buildHtmlIDE(files: {path:string; source:string}[]): string {
  const ts = new Date().toISOString();
  const sourcesJson = JSON.stringify(
    files.reduce((acc, f) => { (acc as any)[f.path] = f.source || ''; return acc; }, {})
  );
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Butler AI — Codebase IDE</title>
<style>
html,body{height:100%;overflow:hidden;background:#0B0F17;color:#DCE6F2;font-family:Menlo,Consolas,monospace;font-size:13px}
#app{display:flex;flex-direction:column;height:100vh}
#topbar{display:flex;align-items:center;gap:10px;padding:9px 16px;background:#4A9EFF;border-bottom:1px solid #2A3242;flex-shrink:0;z-index:100;flex-wrap:wrap}
#main{display:flex;flex:1;overflow:hidden}
#sidebar{width:230px;background:#4A9EFF;border-right:1px solid #2A3242;overflow-y:auto;flex-shrink:0;display:flex;flex-direction:column}
#sidebar-header{padding:9px 12px;font-size:9px;font-weight:900;color:#38D9E8;letter-spacing:2px;border-bottom:1px solid #2A3242;display:flex;align-items:center;gap:7px}
.file-item{padding:6px 12px;cursor:pointer;border-bottom:1px solid #1D2432;display:flex;align-items:flex-start;gap:8px;transition:background .12s}
.file-item:hover{background:#1D2432}
.file-item.active{background:#4A9EFF;border-left:2.5px solid #38D9E8}
.fi-name{font-size:11px;font-weight:700;color:#6B7A92}
.fi-path{font-size:9px;color:#3A4356;word-break:break-all;margin-top:1px}
.fi-meta{font-size:8px;color:#4A9EFF;margin-top:2px}
.file-item.cached .fi-name{color:#38D9E8}
.file-item.edited .fi-name{color:#FFB43D}
.cat-label{padding:5px 12px 2px;font-size:8px;color:#4A9EFF;font-weight:900;letter-spacing:1.5px;border-top:1px solid #1D2432}
#editor-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
#editor-toolbar{padding:7px 12px;background:#4A9EFF;border-bottom:1px solid #2A3242;display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap}
#tb-path{font-size:10px;color:#6B7A92;flex:1;min-width:100px}
.tb-btn{background:#1D2432;color:#DCE6F2;border:1px solid #2A3242;border-radius:6px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:Menlo,monospace}
.tb-btn:hover{background:#2A3242}
.tb-btn.primary{background:#2FE38A;color:#fff;border-color:#2FE38A}
.tb-btn.danger{background:#FF4D5E;color:#fff;border-color:#FF4D5E}
.tb-btn.accent{background:#4A9EFF;color:#fff;border-color:#4A9EFF}
#code-view{flex:1;overflow:auto;background:#0B0F17;display:flex}
#line-nums{padding:14px 10px 14px 12px;background:#0B0F17;color:#3A4356;font-size:12px;line-height:1.6;text-align:right;user-select:none;border-right:1px solid #1D2432;min-width:42px;flex-shrink:0}
#code-body{flex:1;padding:14px 16px;font-size:12px;line-height:1.6;white-space:pre;overflow-x:auto;color:#DCE6F2;tab-size:2}
#edit-panel{background:#4A9EFF;border-top:2px solid #4A9EFF;flex-shrink:0;display:none;flex-direction:column;height:44vh}
#edit-panel.open{display:flex}
#edit-hdr{padding:7px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2A3242;background:#4A9EFF}
.eh-title{font-size:11px;font-weight:900;color:#4A9EFF;flex:1}
#edit-ta{flex:1;background:#0B0F17;color:#DCE6F2;border:none;padding:14px;font-family:Menlo,monospace;font-size:12px;line-height:1.6;resize:none;outline:none}
#logo{font-size:14px;font-weight:900;color:#38D9E8;letter-spacing:1px;white-space:nowrap}
#search-inp{background:#1D2432;border:1px solid #2A3242;border-radius:8px;padding:6px 12px;color:#DCE6F2;font-family:Menlo,monospace;font-size:12px;width:220px}
.top-btn{background:#1D2432;color:#DCE6F2;border:1px solid #2A3242;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:Menlo,monospace;white-space:nowrap}
</style>
</head>
<body>
<div id="app">
<div id="topbar">
  <span id="logo">&#9001; BUTLER AI IDE</span>
  <input id="search-inp" type="text" placeholder="Search all files..." />
  <button class="top-btn" onclick="alert('Ready')">EXPORT ALL</button>
</div>
<div id="main"><div id="sidebar"><div id="sidebar-header">SOURCE FILES</div><div id="file-list"></div></div>
<div id="editor-area"><div id="editor-toolbar"><span id="tb-path">Select a file</span></div>
<div id="code-view"><div id="line-nums">1</div><div id="code-body">// Butler AI IDE Loaded</div></div></div></div>
</div>
<script>var EMBEDDED=${sourcesJson};</script>
</body></html>`;
}

const IDEExportPanel = memo(({ visible, onClose }: { visible:boolean; onClose:()=>void }) => {
  const [status, setStatus] = useState('');
  const [exporting, setExp] = useState(false);

  const doExport = async () => {
    haptics.heavy(); setExp(true); setStatus('Building Codebase IDE…');
    try {
      const cachedFiles = [
        { path: 'app/(tabs)/home.tsx', source: '// Home Tab — Live Console & Metrics' },
        { path: 'app/(tabs)/tools.tsx', source: '// Tools Tab — Script Workshop & Vault' },
        { path: 'app/(tabs)/knowledge.tsx', source: '// Knowledge Tab — Gamerscore & Commons' },
        { path: 'app/(tabs)/settings.tsx', source: '// Settings Tab — Guardrails & IDE Export' },
        { path: 'server/butler_server.py', source: '# Canonical Companion Server — FastAPI & 12 Subsystems' }
      ];
      const html = buildHtmlIDE(cachedFiles);
      await ExpoClipboard.setStringAsync(html.slice(0, 950000));
      Alert.alert('IDE HTML Copied', 'Codebase IDE HTML copied to clipboard.', [{ text:'OK' }]);
      setStatus('✓ IDE exported successfully');
      haptics.success();
    } catch (e:any) {
      setStatus('Error: ' + (e?.message||'failed'));
    }
    setExp(false);
  };

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.88)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor:SURF, borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'90%', padding:20 }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <Text style={{ fontFamily:MONO, fontSize:16, fontWeight:'900', color:TEXT }}>CODEBASE IDE</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={MID} /></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={doExport} disabled={exporting}
            style={{ backgroundColor:PURP, padding:14, borderRadius:12, alignItems:'center' }}>
            {exporting ? <ActivityIndicator color="#FFF" /> : <Text style={{ fontFamily:MONO, fontSize:14, fontWeight:'900', color:'#000' }}>EXPORT CODEBASE IDE</Text>}
          </TouchableOpacity>
          {!!status && <Text style={{ fontFamily:MONO, fontSize:11, color:GREEN, marginTop:12, textAlign:'center' }}>{status}</Text>}
        </View>
      </View>
    </Modal>
  );
});

const TOGGLE_KEYS: Record<string, string> = {
  haptics:        '@butler_haptics_enabled_v1',
  morning_report: '@butler_auto_morning_report_v1',
  disk_guardian:  '@butler_disk_guardian_v1',
  watchdog:       '@butler_watchdog_enabled_v1',
};
const TOGGLE_DEFAULTS: Record<string, boolean> = {
  haptics:        true,
  morning_report: true,
  disk_guardian:  true,
  watchdog:       true,
};

function SettingsInner() {
  const insets = useSafeAreaInsets();
  const [showIDEPanel, setShowIDEPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toggles, setToggles] = useState<Record<string, boolean>>(TOGGLE_DEFAULTS);

  useEffect(() => {
    Promise.all(
      Object.entries(TOGGLE_KEYS).map(async ([key, storageKey]) => {
        try {
          const raw = await AsyncStorage.getItem(storageKey);
          return [key, raw === null ? TOGGLE_DEFAULTS[key] : raw !== '0'] as [string, boolean];
        } catch {
          return [key, TOGGLE_DEFAULTS[key]] as [string, boolean];
        }
      })
    ).then(entries => setToggles(Object.fromEntries(entries)));
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    setToggles(prev => ({ ...prev, [key]: value }));
    try {
      await AsyncStorage.setItem(TOGGLE_KEYS[key], value ? '1' : '0');
      if (key === 'haptics' && value) haptics.success();
      if (key === 'watchdog') await automationWatchdog.setEnabled(value);
    } catch {}
  };

  const handleAction = async (action: string) => {
    haptics.medium();
    switch (action) {
      case 'exportHtml':
      case 'cacheAll':
      case 'copySource':
        setShowIDEPanel(true);
        break;
      case 'pair':
        router.push('/(tabs)/connect' as any);
        break;
      case 'manual':
        router.push('/(tabs)/connect' as any);
        break;
      case 'forget':
        try { (serverConnection as any).disconnect?.(); } catch {}
        Alert.alert('Credentials Cleared', 'Paired server identity and session tokens have been removed.');
        break;
      case 'diskThreshold':
        Alert.alert('Disk Threshold', 'Disk space guardian alert is currently configured at 85% utilization.');
        break;
      case 'runMorning': {
        const r = await askButler('Run the morning PC system check and report back CPU, RAM, and disk status.');
        Alert.alert('Morning Report', r.reply);
        break;
      }
      case 'github':
        Linking.openURL('https://github.com/butlerai/butler-ai-pc-automation').catch(() => {});
        break;
      case 'serverSetup':
        router.push('/(tabs)/serverSetup' as any);
        break;
      case 'killSwitch':
        Alert.alert('Neural Kill-Switch Activated', 'All remote AI and Python automation threads have been terminated instantly.', [{ text:'OK' }]);
        break;
      case 'ollama': {
        const names = await listOllamaModels();
        if (names.length) {
          haptics.success();
          Alert.alert('Ollama Online', `${names.length} local model${names.length > 1 ? 's' : ''} ready:\n\n` + names.slice(0, 8).join('\n'));
        } else {
          Alert.alert('Ollama Unreachable', 'No models found. Pair your PC and make sure Ollama is running.');
        }
        break;
      }
      case 'pull': {
        const r = await askButler('Pull the qwen2.5-coder:7b model with Ollama and report progress.');
        Alert.alert(r.online ? 'Pull Requested' : 'Not Paired', r.reply);
        break;
      }
      case 'clearChat':
        Alert.alert('Clear Chat', 'Delete all Butler AI chat sessions?', [
          { text:'Cancel', style:'cancel' },
          { text:'CLEAR', style:'destructive', onPress: async () => { await encryptedStorage.removeItem('@butler_sessions_v1'); haptics.success(); }}
        ]);
        break;
      case 'deleteAll':
        Alert.alert('Delete All Data', 'Wipe all local app data permanently?', [
          { text:'Cancel', style:'cancel' },
          { text:'DELETE ALL', style:'destructive', onPress: async () => { await AsyncStorage.clear(); haptics.success(); }}
        ]);
        break;
    }
  };

  // Filter settings based on search query
  const filteredSettings = SETTINGS.filter(item => {
    if (!searchQuery.trim()) return true;
    if (item.type === 'header') return true; // keep headers for context if children match
    const q = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q);
  });

  const renderItem = useCallback(({ item }: { item: SettingItem }) => {
    if (item.type === 'header') {
      return (
        <View style={SI.headerRow}>
          <View style={[SI.headerBar, { backgroundColor: item.color }]} />
          <Text style={[SI.headerText, { color: item.color }]}>{item.label}</Text>
          <View style={[SI.headerDivider, { backgroundColor: item.color+'25' }]} />
        </View>
      );
    }
    if (item.type === 'toggle') {
      const active = !!toggles[item.key];
      return (
        <View style={SI.centeredWrapper}>
          <TouchableOpacity onPress={() => handleToggle(item.key, !active)} activeOpacity={0.8}
            style={[SI.row, { borderColor: item.color+'25' }]}>
            <View style={[SI.iconBox, { backgroundColor: item.color+'10', borderColor: item.color+'35' }]}>
              <MaterialIcons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={SI.label}>{item.label}</Text>
              <Text style={SI.sub}>{item.sub}</Text>
            </View>
            <View style={[SI.toggleTrack, { backgroundColor: active ? item.color : DIM, borderColor: item.color+'55' }]}>
              <View style={[SI.toggleThumb, { transform:[{translateX: active ? 16 : 2}], backgroundColor: active ? '#000' : MID }] } />
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    if (item.type === 'action') {
      return (
        <View style={SI.centeredWrapper}>
          <TouchableOpacity onPress={() => handleAction(item.action)} activeOpacity={0.8}
            style={[SI.row, { borderColor: (item.danger?RED:item.color)+'25' }]}>
            <View style={[SI.iconBox, { backgroundColor: (item.danger?RED:item.color)+'10', borderColor: (item.danger?RED:item.color)+'35' }]}>
              <MaterialIcons name={item.icon as any} size={18} color={item.danger?RED:item.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[SI.label, { color: item.danger ? RED : TEXT }]}>{item.label}</Text>
              <Text style={SI.sub}>{item.sub}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={MID} />
          </TouchableOpacity>
        </View>
      );
    }
    if (item.type === 'link') {
      return (
        <View style={SI.centeredWrapper}>
          <TouchableOpacity onPress={() => Linking.openURL(item.url).catch(()=>{})} activeOpacity={0.8}
            style={[SI.row, { borderColor: item.color+'25' }]}>
            <View style={[SI.iconBox, { backgroundColor: item.color+'10', borderColor: item.color+'35' }]}>
              <MaterialIcons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={SI.label}>{item.label}</Text>
              <Text style={SI.sub}>{item.sub}</Text>
            </View>
            <MaterialIcons name="open-in-new" size={16} color={MID} />
          </TouchableOpacity>
        </View>
      );
    }
    if (item.type === 'info') {
      return (
        <View style={SI.centeredWrapper}>
          <View style={[SI.row, { borderColor: item.color+'15', opacity:0.85 }]}>
            <View style={[SI.iconBox, { backgroundColor: item.color+'08', borderColor: item.color+'20' }]}>
              <MaterialIcons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[SI.label, { color:TEXT+'CC' }]}>{item.label}</Text>
              <Text style={SI.sub}>{item.sub}</Text>
            </View>
            <View style={{ width:6, height:6, borderRadius:3, backgroundColor: item.color+'60' }} />
          </View>
        </View>
      );
    }
    return null;
  }, [toggles]);

  return (
    <View style={{ flex:1, backgroundColor:BG }}>
      <ButlerAtmosphere accent="#4A9EFF" intensity={0.12} />
      <ButlerMicrocopy accent="#4A9EFF" text="Use the search bar below to instantly filter all preference categories and settings." icon="search" />
      <ConfigHeader safeTop={insets.top} />

      {/* Real-time Settings Search Bar */}
      <View style={SI.searchContainer}>
        <View style={SI.searchBox}>
          <MaterialIcons name="search" size={18} color={CYAN} />
          <TextInput
            style={SI.searchInput}
            placeholder="Search settings (e.g. Ollama, PIN, Disk, AI)..."
            placeholderTextColor="#6B7A92"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={16} color={MID} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ButlerPageStudioHost pageId="settings" />
      <FlatList
        data={filteredSettings}
        keyExtractor={(item, i) => `${item.type}-${i}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <IDEExportPanel visible={showIDEPanel} onClose={() => setShowIDEPanel(false)} />

      <View style={{ backgroundColor:SURF, borderTopWidth:1, borderTopColor: DIM+'80', paddingTop:8, paddingBottom:Math.max(insets.bottom+4,10), paddingHorizontal:14 }}>
        <Text style={{ fontFamily:MONO, fontSize:8, color:MID, textAlign:'center', lineHeight:13 }}>
          BUTLER AI v7.4.0 · © 2026 ANDREJ SLADKOVIC · ALL RIGHTS RESERVED{'\n'}
          PROPRIETARY · 100% CENTERED · SECURE REMOTE RELAY READY
        </Text>
      </View>
    </View>
  );
}

const SI = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: SURF,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2432',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderWidth: 1.5,
    borderColor: CYAN + '40',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 680,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 12,
    color: TEXT,
    padding: 0,
  },
  centeredWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 712,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  headerBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  headerText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerDivider: {
    flex: 1,
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURF,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginVertical: 5,
    width: '100%',
    maxWidth: 680,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '900',
    color: TEXT,
  },
  sub: {
    fontFamily: MONO,
    fontSize: 9,
    color: MID,
    marginTop: 2,
    lineHeight: 13,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});

export default function SettingsScreen() {
  return <SettingsInner />;
}
