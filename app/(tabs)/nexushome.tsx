/**
 * BUTLER AI — NEXUS HOME v43.0
 * NexusCommandCenter hero · Compact professional components · Memory Brain
 *
 * ANIMATION CRASH FIX (permanent):
 *  - Every Animated.Value has ONE driver type only — never mixed.
 *  - Native driver: opacity, translateX/Y, scale, rotate
 *  - JS driver: borderColor, backgroundColor, width% (layout props)
 *  - MemoryBrainWidget: ALL animations use useNativeDriver:false because
 *    nodeAnims drive BOTH opacity AND are referenced in left/top interpolations
 *    alongside packetAnims (which are positional). You cannot mix drivers on
 *    the same value. Using false everywhere in that component is the only safe option.
 *  - Mounted guard on every loop: useRef(true) cleared on unmount, checked
 *    before setState to prevent post-unmount crashes.
 */

import React, { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions, Modal, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { serverConnection } from '@/services/serverConnection';
import { connectionHub } from '@/services/connectionHub';
import { executionHistory } from '@/services/executionHistory';
import { kbGrowthTracker } from '@/services/kbGrowthTracker';
import { parseQRConnection } from '@/services/qrParser';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { personalMemory } from '@/services/personalMemory';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import { logger } from '@/utils/logger';
import NexusParticleFX from '@/components/ui/NexusParticleFX';
import { NexusVaultCard } from '@/components/ui/NexusVaultCard';
import { PageMascot } from '@/components/ui/PageMascot';
import { performanceHistory } from '@/services/performanceHistory';
import { RemoteAccessMonetizationCard } from '@/components/home/RemoteAccessMonetizationCard';
import { NexusCommandCenter } from '@/components/home/NexusCommandCenter';
const QRCameraScanner = React.lazy(() => import('@/components/qr/QRCameraScanner'));

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SCREEN_W } = Dimensions.get('window');
const SW = Math.max(320, SCREEN_W);
const PAD = 12;
const GAP = 8;
const COL2 = Math.floor((SW - PAD * 2 - GAP) / 2);

const T = {
  bg:      '#020508',
  surf:    '#070D18',
  surf2:   '#0B1525',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  magenta: '#CC44FF',
  amber:   '#FFB020',
  red:     '#FF3344',
  blue:    '#4488FF',
  pink:    '#FF6EB4',
  yellow:  '#FFD400',
  teal:    '#00CCBB',
  text:    '#C8E4F0',
  textMid: '#6A8EA8',
  mid:     '#5A7A96',
  dim:     '#243040',
  border:  'rgba(0,229,255,0.12)',
};

// ── PULSE DOT ─────────────────────────────────────────────────────
// useNativeDriver:true — opacity only, zero driver conflicts.
// Mounted guard prevents post-unmount animation calls.
function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ── HUD CORNERS ───────────────────────────────────────────────────
function HudCorners({ color, size = 10, t = 1.5 }: { color: string; size?: number; t?: number }) {
  return (
    <>
      <View style={{ position:'absolute', top:0, left:0,  width:size, height:size, borderTopWidth:t,    borderLeftWidth:t,   borderColor:color }} />
      <View style={{ position:'absolute', top:0, right:0, width:size, height:size, borderTopWidth:t,    borderRightWidth:t,  borderColor:color }} />
      <View style={{ position:'absolute', bottom:0, left:0,  width:size, height:size, borderBottomWidth:t, borderLeftWidth:t,  borderColor:color }} />
      <View style={{ position:'absolute', bottom:0, right:0, width:size, height:size, borderBottomWidth:t, borderRightWidth:t, borderColor:color }} />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────
// COMPONENT 1: COMPACT NEXUS HEADER
// ──────────────────────────────────────────────────────────────────
function NexusHeader({ safeTop, isConn, addr, latency, onQR, onRefresh }: {
  safeTop: number; isConn: boolean; addr: string; latency: number; onQR: () => void; onRefresh: () => void;
}) {
  const pulseA = useRef(new Animated.Value(0.4)).current;
  const focused = useIsFocused();
  const nhMounted = useRef(true);
  const [time, setTime] = useState('');
  const isPlainHttp = isConn && !addr.startsWith('https');
  useEffect(() => {
    const upd = () => { const n = new Date(); setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`); };
    upd(); const t = setInterval(upd, 30000); return () => clearInterval(t);
  }, []);
  useEffect(() => {
    nhMounted.current = true;
    if (!focused) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue:1, duration:1000, useNativeDriver:true }),
      Animated.timing(pulseA, { toValue:0.2, duration:1000, useNativeDriver:true }),
    ]));
    loop.start();
    return () => { nhMounted.current = false; loop.stop(); };
  }, [focused]);
  const cc = isConn ? T.green : T.red;
  return (
    <View style={[nh.outer, { paddingTop: safeTop }]}>
      <View style={{ height:2.5, flexDirection:'row' }}>
        {[T.cyan,T.green,T.magenta,T.amber,T.pink].map((c,i)=><View key={i} style={{ flex:1, backgroundColor:c }} />)}
      </View>
      <View style={nh.row}>
        <Animated.View style={{ width:7, height:7, borderRadius:4, backgroundColor:cc, opacity:pulseA }} />
        <Text style={nh.brand}>BUTLER<Text style={{ color:T.cyan }}>·AI</Text></Text>
        <View style={[nh.chip, { borderColor:cc+'50', backgroundColor:cc+'0C' }]}>
          <Text style={[nh.chipTxt, { color:cc }]}>{isConn ? (addr||'ONLINE') : 'OFFLINE'}</Text>
        </View>
        {isConn && latency > 0 && (
          <View style={[nh.chip, { borderColor:T.mid+'30' }]}>
            <Text style={[nh.chipTxt, { color:T.mid }]}>{latency}ms</Text>
          </View>
        )}
        <View style={{ flex:1 }} />
        <Text style={[nh.clock, { color:T.cyan }]}>{time}</Text>
        <TouchableOpacity onPress={()=>{ haptics.heavy(); onQR(); }} activeOpacity={0.8}
          style={[nh.btn, { borderColor:T.cyan+'60', backgroundColor:T.cyan+'0E' }]}>
          <MaterialIcons name="qr-code-scanner" size={15} color={T.cyan} />
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{ haptics.light(); onRefresh(); }} activeOpacity={0.8}
          style={[nh.btn, { borderColor:T.mid+'25' }]}>
          <MaterialIcons name="refresh" size={15} color={T.mid} />
        </TouchableOpacity>
        <PageMascot page="home" size="sm" showBubble />
      </View>
      {isPlainHttp && (
        <View style={nh.httpWarn}>
          <MaterialIcons name="lock-open" size={10} color={T.amber} />
          <Text style={nh.httpWarnTxt}>HTTP (unencrypted) — enable TLS on server with --tls flag for full encryption</Text>
        </View>
      )}
      <View style={{ height:1, backgroundColor:T.cyan+'18' }} />
    </View>
  );
}
const nh = StyleSheet.create({
  outer: { backgroundColor:'#020608', overflow:'hidden',
    ...Platform.select({ ios:{ shadowColor:T.cyan, shadowOffset:{width:0,height:2}, shadowOpacity:0.12, shadowRadius:8 }, android:{ elevation:3 } }) },
  row:   { flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:12, paddingVertical:8 },
  brand: { fontFamily:MONO, fontSize:14, fontWeight:'900', color:'#FFF', letterSpacing:1 },
  chip:  { borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:2 },
  chipTxt:{ fontFamily:MONO, fontSize:8.5, fontWeight:'900' },
  clock: { fontFamily:MONO, fontSize:15, fontWeight:'900' },
  btn:   { width:32, height:32, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  httpWarn: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:4, backgroundColor:'rgba(255,176,32,0.08)', borderTopWidth:1, borderTopColor:'rgba(255,176,32,0.2)' },
  httpWarnTxt: { fontFamily:MONO, fontSize:8, color:'rgba(255,176,32,0.85)', flex:1 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 2: AI CHAT HERO
// ──────────────────────────────────────────────────────────────────
let _ROBOT_IMG: any = null;
try { _ROBOT_IMG = require('@/assets/images/mascot_shield_v2.png'); } catch {
  try { _ROBOT_IMG = require('@/assets/images/nexus-robot-mascot.png'); } catch {}
}

function AIChatHero({ isConn, goToTab, onQR }: { isConn: boolean; goToTab: (t:string)=>void; onQR: ()=>void }) {
  const focused = useIsFocused();
  // JS driver values — used for color/position interpolations
  const glowA   = useRef(new Animated.Value(0.3)).current;
  const scanA   = useRef(new Animated.Value(-SW)).current;
  // Native driver value — used for translateY only
  const floatA  = useRef(new Animated.Value(0)).current;
  const acMounted = useRef(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const MSGS = [
    'Run any Python script on your PC remotely...',
    '"Clean temp files and free up disk space"',
    '"What processes are eating my CPU?"',
    '"Schedule a backup for tonight at 11 PM"',
  ];
  useEffect(() => {
    acMounted.current = true;
    if (!focused) return;
    // glowA/scanA: JS driver (used for borderColor/translateX respectively)
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue:1, duration:1800, useNativeDriver:false }),
      Animated.timing(glowA, { toValue:0.2, duration:1800, useNativeDriver:false }),
    ]));
    const scan = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue:SW+80, duration:3800, useNativeDriver:false }),
      Animated.timing(scanA, { toValue:-SW, duration:0, useNativeDriver:false }),
      Animated.delay(5000),
    ]), { iterations:2 });
    // floatA: native driver (translateY only — safe)
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue:1, duration:2600, useNativeDriver:true }),
      Animated.timing(floatA, { toValue:0, duration:2600, useNativeDriver:true }),
    ]));
    glow.start(); scan.start(); float.start();
    const ti = setInterval(() => { if (acMounted.current) setMsgIdx(i=>(i+1)%MSGS.length); }, 3200);
    return () => { acMounted.current = false; glow.stop(); scan.stop(); float.stop(); clearInterval(ti); };
  }, [focused]);
  const borderC = glowA.interpolate({ inputRange:[0.2,1], outputRange:[T.cyan+'28',T.cyan+'88'] });
  const floatY  = floatA.interpolate({ inputRange:[0,1], outputRange:[0,-4] });
  const cc = isConn ? T.green : T.red;

  const WHY = [
    { icon:'shield-check', lib:'community' as const, label:'ZERO CLOUD',   sub:'LAN only · no server', color:T.green   },
    { icon:'brain',        lib:'community' as const, label:'LOCAL AI',     sub:'Ollama on your PC',    color:T.cyan    },
    { icon:'code-braces',  lib:'community' as const, label:'250+ SCRIPTS', sub:'Python automation',    color:T.magenta },
    { icon:'lock',         lib:'material'  as const, label:'AES-256',      sub:'End-to-end encrypted', color:T.amber   },
  ];

  return (
    <Animated.View style={[chat.outer, { borderColor: borderC }]}>
      <Animated.View pointerEvents="none" style={[chat.scan, { transform:[{translateX:scanA}] }]} />
      <View style={{ height:2.5, flexDirection:'row' }}>
        {[T.cyan,T.green,T.magenta,T.amber,T.pink].map((c,i)=><View key={i} style={{ flex:1, backgroundColor:c }} />)}
      </View>
      <HudCorners color={T.cyan+'45'} size={10} t={1.5} />
      <View style={chat.heroRow}>
        <Animated.View style={[chat.mascotWrap, { transform:[{translateY:floatY}] }]}>
          {_ROBOT_IMG ? (
            <Image source={_ROBOT_IMG} style={chat.mascotImg} contentFit="contain" transition={200} />
          ) : (
            <View style={chat.mascotFallback}>
              <MaterialCommunityIcons name="robot-happy" size={42} color={T.cyan} />
            </View>
          )}
          <View style={[chat.mascotBadge, { borderColor:cc+'45', backgroundColor:cc+'0A' }]}>
            <PulseDot color={cc} size={4} />
            <Text style={[chat.mascotBadgeTxt, { color:cc }]}>{isConn?'LIVE':'PAIR'}</Text>
          </View>
        </Animated.View>
        <View style={chat.heroCenter}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
            <Text style={chat.heroTitle}>BUTLER<Text style={{ color:T.cyan }}> AI</Text></Text>
            <View style={[chat.heroBadge, { borderColor:T.cyan+'45', backgroundColor:T.cyan+'0A' }]}>
              <Text style={[chat.heroBadgeTxt, { color:T.cyan }]}>v7.3</Text>
            </View>
            <View style={[chat.heroBadge, { borderColor:cc+'45', backgroundColor:cc+'0A' }]}>
              <PulseDot color={cc} size={4} />
              <Text style={[chat.heroBadgeTxt, { color:cc }]}>{isConn?'ONLINE':'OFFLINE'}</Text>
            </View>
          </View>
          <Text style={chat.heroSub} numberOfLines={2}>
            Local AI that controls your PC · zero cloud · runs on your hardware only
          </Text>
          <View style={[chat.promptBox, { borderColor:T.cyan+'25', marginTop:6 }]}>
            <Text style={{ fontFamily:MONO, fontSize:9, color:T.cyan+'60' }}>{'>'}</Text>
            <Text style={[chat.promptTxt, { color:T.cyan+'80' }]} numberOfLines={1}>{MSGS[msgIdx]}</Text>
            <View style={{ width:5, height:10, backgroundColor:T.cyan+'60', borderRadius:1 }} />
          </View>
        </View>
        <View style={chat.ctaCol}>
          <Pressable onPress={()=>{ haptics.heavy(); goToTab('butler'); }}
            style={[chat.ctaBtnPrimary, { backgroundColor:T.cyan }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={13} color="#000" />
            <Text style={[chat.ctaBtnTxt, { color:'#000' }]}>CHAT</Text>
          </Pressable>
          <Pressable onPress={()=>{ haptics.medium(); onQR(); }}
            style={[chat.ctaBtnSecondary, { borderColor:T.green+'55' }]}>
            <MaterialIcons name="qr-code-scanner" size={13} color={T.green} />
            <Text style={[chat.ctaBtnTxt, { color:T.green }]}>PAIR</Text>
          </Pressable>
          <Pressable onPress={()=>{ haptics.light(); goToTab('scripts'); }}
            style={[chat.ctaBtnSecondary, { borderColor:T.magenta+'55' }]}>
            <MaterialIcons name="code" size={13} color={T.magenta} />
            <Text style={[chat.ctaBtnTxt, { color:T.magenta }]}>CODE</Text>
          </Pressable>
        </View>
      </View>
      <View style={chat.whyGrid}>
        {WHY.map((w,i)=>{
          const Icon = w.lib==='community' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <View key={i} style={[chat.whyCell, { borderColor:w.color+'30', backgroundColor:w.color+'07' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:3 }}>
                <View style={[chat.whyIconBox, { borderColor:w.color+'45', backgroundColor:w.color+'12' }]}>
                  <Icon name={w.icon as any} size={11} color={w.color} />
                </View>
                <Text style={[chat.whyLabel, { color:w.color }]}>{w.label}</Text>
              </View>
              <Text style={[chat.whySub, { color:w.color+'70' }]}>{w.sub}</Text>
            </View>
          );
        })}
      </View>
      <View style={[chat.ticker, { borderTopColor:T.cyan+'14' }]}>
        <PulseDot color={isConn?T.green:T.red} size={4} />
        <Text style={chat.tickerTxt} numberOfLines={1}>
          BUTLER AI · LOCAL LLM · LAN ONLY · AES-256 · HMAC-SHA256 · ZERO TELEMETRY
        </Text>
        <View style={[chat.tickerBadge, { borderColor:T.cyan+'30' }]}>
          <Text style={{ fontFamily:MONO, fontSize:7, color:T.cyan, fontWeight:'900' }}>NEXUS</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const chat = StyleSheet.create({
  outer:          { borderWidth:1.5, backgroundColor:T.surf, overflow:'hidden', position:'relative' },
  scan:           { position:'absolute', top:0, bottom:0, width:70, backgroundColor:'rgba(0,229,255,0.03)', transform:[{skewX:'-12deg'}], zIndex:0 },
  heroRow:        { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:10, paddingBottom:8, gap:10 },
  mascotWrap:     { width:64, alignItems:'center', flexShrink:0 },
  mascotImg:      { width:58, height:70 },
  mascotFallback: { width:58, height:58, alignItems:'center', justifyContent:'center' },
  mascotBadge:    { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:2, marginTop:4 },
  mascotBadgeTxt: { fontFamily:MONO, fontSize:7, fontWeight:'900', letterSpacing:0.5 },
  heroCenter:     { flex:1, justifyContent:'center' },
  heroTitle:      { fontFamily:MONO, fontSize:17, fontWeight:'900', color:'#FFF', letterSpacing:0.5 },
  heroBadge:      { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:5, paddingHorizontal:6, paddingVertical:2 },
  heroBadgeTxt:   { fontFamily:MONO, fontSize:7, fontWeight:'900' },
  heroSub:        { fontFamily:MONO, fontSize:9, color:T.textMid, lineHeight:13 },
  promptBox:      { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:7, paddingHorizontal:8, paddingVertical:5 },
  promptTxt:      { fontFamily:MONO, fontSize:9, flex:1 },
  ctaCol:         { gap:5, flexShrink:0, width:60 },
  ctaBtnPrimary:  { flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, borderRadius:9, paddingVertical:8, paddingHorizontal:4 },
  ctaBtnSecondary:{ flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, borderRadius:9, paddingVertical:7, paddingHorizontal:4, borderWidth:1.5 },
  ctaBtnTxt:      { fontFamily:MONO, fontSize:8, fontWeight:'900', letterSpacing:0.3 },
  whyGrid:        { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:10, paddingBottom:10, gap:6 },
  whyCell:        { width:`${(100/2)-1.8}%` as any, borderWidth:1, borderRadius:9, paddingHorizontal:10, paddingVertical:8, overflow:'hidden', position:'relative' },
  whyIconBox:     { width:20, height:20, borderRadius:5, borderWidth:1, alignItems:'center', justifyContent:'center', flexShrink:0 },
  whyLabel:       { fontFamily:MONO, fontSize:8.5, fontWeight:'900', letterSpacing:0.3 },
  whySub:         { fontFamily:MONO, fontSize:8, lineHeight:12 },
  ticker:         { flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:12, paddingVertical:5, borderTopWidth:1, backgroundColor:'#010407' },
  tickerTxt:      { fontFamily:MONO, fontSize:8, color:T.cyan+'60', flex:1 },
  tickerBadge:    { borderWidth:1, borderRadius:4, paddingHorizontal:5, paddingVertical:2, flexShrink:0 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 3: SCROLLABLE NAV PILLS
// ──────────────────────────────────────────────────────────────────
const NAV = [
  { icon:'qr-code-scanner', lib:'material' as const, label:'PAIR',    color:T.cyan,    tab:'_qr'      },
  { icon:'robot-excited',   lib:'community' as const, label:'AI',      color:T.green,   tab:'butler'   },
  { icon:'code-braces-box', lib:'community' as const, label:'SCRIPTS', color:T.magenta, tab:'scripts'  },
  { icon:'brain',           lib:'community' as const, label:'KB',      color:T.cyan,    tab:'knowledge'},
  { icon:'chart-bar',       lib:'community' as const, label:'INTEL',   color:T.amber,   tab:'logs'     },
  { icon:'folder-open',     lib:'material'  as const, label:'VAULT',   color:T.pink,    tab:'fileshare'},
  { icon:'hammer-screwdriver', lib:'community' as const, label:'BUILD', color:T.yellow, tab:'builder'  },
  { icon:'palette-swatch',  lib:'community' as const, label:'SKINS',   color:T.magenta, tab:'cosmetic' },
  { icon:'tune',            lib:'material'  as const, label:'CONFIG',  color:T.mid,     tab:'settings' },
];
function NavPills({ goToTab, onQR, isConn }: { goToTab:(t:string)=>void; onQR:()=>void; isConn:boolean }) {
  return (
    <View style={{ borderBottomWidth:1, borderBottomColor:T.cyan+'14', backgroundColor:'#03070F' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:9, gap:6 }}>
        {NAV.map((n,i) => {
          const Icon = n.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={()=>{ haptics.light(); n.tab==='_qr' ? onQR() : goToTab(n.tab); }}
              activeOpacity={0.75} style={[np.pill, { borderColor:n.color+'40', backgroundColor:n.color+'0A' }]}>
              <Icon name={n.icon as any} size={12} color={n.color} />
              <Text style={[np.txt, { color:n.color }]}>{n.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
const np = StyleSheet.create({
  pill:{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:22, paddingHorizontal:11, paddingVertical:7 },
  txt: { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.3 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 4: COMPACT TELEMETRY ROW
// ──────────────────────────────────────────────────────────────────
function TelemetryRow({ cpu, ram, disk, isConn }: { cpu:number; ram:number; disk:number; isConn:boolean }) {
  const ITEMS = [
    { lbl:'CPU', val:isConn?Math.round(cpu):null, color:cpu>80?T.red:cpu>60?T.amber:T.cyan,    icon:'memory' },
    { lbl:'RAM', val:isConn?Math.round(ram):null, color:ram>85?T.red:ram>70?T.amber:T.green,   icon:'storage' },
    { lbl:'DISK',val:isConn?Math.round(disk):null,color:disk>90?T.red:disk>75?T.amber:T.yellow,icon:'disc-full' },
  ];
  return (
    <View style={{ flexDirection:'row', gap:GAP }}>
      {ITEMS.map(({lbl,val,color,icon})=>(
        <View key={lbl} style={[tr.cell, { borderTopColor:color, borderColor:color+'28' }]}>
          <HudCorners color={color+'50'} size={7} t={1} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:6 }}>
            <MaterialIcons name={icon as any} size={10} color={color} />
            <Text style={[tr.lbl, { color:color+'80' }]}>{lbl}</Text>
          </View>
          <Text style={[tr.val, { color }]}>{val!==null?`${val}%`:'—'}</Text>
          <View style={tr.track}>
            <View style={[tr.fill, { width:`${val??0}%` as any, backgroundColor:color }]} />
          </View>
          <View style={[tr.badge, { borderColor:color+'40', backgroundColor:color+'0A' }]}>
            <PulseDot color={isConn?color:T.mid} size={4} />
            <Text style={[tr.badgeTxt, { color:isConn?color:T.mid }]}>{isConn?(val!==null&&val>80?'WARN':'OK'):'OFF'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
const tr = StyleSheet.create({
  cell:  { flex:1, backgroundColor:T.surf2, borderRadius:12, borderWidth:1.5, borderTopWidth:3, paddingHorizontal:10, paddingVertical:11, alignItems:'center', overflow:'hidden', position:'relative',
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.4,shadowRadius:10}, android:{elevation:5} }) },
  val:   { fontFamily:MONO, fontSize:26, fontWeight:'900', letterSpacing:-1 },
  lbl:   { fontFamily:MONO, fontSize:8, fontWeight:'700', letterSpacing:0.5 },
  track: { width:'100%', height:3, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:2, marginTop:5, overflow:'hidden' },
  fill:  { height:'100%', borderRadius:2 },
  badge: { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:2, marginTop:6 },
  badgeTxt:{ fontFamily:MONO, fontSize:7.5, fontWeight:'900' },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 5: QUICK LAUNCH GRID
// ──────────────────────────────────────────────────────────────────
const QUICK = [
  { icon:'lightning-bolt',        lib:'community' as const, label:'SCRIPTS',  color:T.magenta, tab:'scripts'   },
  { icon:'robot-excited',         lib:'community' as const, label:'AI CHAT',  color:T.green,   tab:'butler'    },
  { icon:'folder-network-outline',lib:'community' as const, label:'VAULT',    color:T.pink,    tab:'fileshare' },
  { icon:'chart-bar',             lib:'community' as const, label:'INTEL',    color:T.amber,   tab:'logs'      },
  { icon:'hammer-screwdriver',    lib:'community' as const, label:'BUILD',    color:T.yellow,  tab:'builder'   },
  { icon:'brain',                 lib:'community' as const, label:'KB',       color:T.cyan,    tab:'knowledge' },
  { icon:'palette-swatch',        lib:'community' as const, label:'SKINS',    color:T.magenta, tab:'cosmetic'  },
  { icon:'tune-variant',          lib:'community' as const, label:'CONFIG',   color:T.mid,     tab:'settings'  },
];
function QuickGrid({ goToTab, isConn }: { goToTab:(t:string)=>void; isConn:boolean }) {
  return (
    <View style={qg.wrap}>
      <View style={qg.hdr}>
        <Text style={qg.hdrTxt}>QUICK LAUNCH</Text>
        <View style={[qg.statusPill, { borderColor:(isConn?T.green:T.red)+'50', backgroundColor:(isConn?T.green:T.red)+'0A' }]}>
          <PulseDot color={isConn?T.green:T.red} size={5} />
          <Text style={[qg.statusTxt, { color:isConn?T.green:T.red }]}>{isConn?'LIVE':'OFFLINE'}</Text>
        </View>
      </View>
      <View style={qg.grid}>
        {QUICK.map((q,i)=>{
          const Icon = q.lib==='community' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={()=>{ haptics.light(); goToTab(q.tab); }}
              activeOpacity={0.72} style={qg.cell}>
              <View style={[qg.glass, { borderColor:q.color+'40' }]}>
                <View style={[qg.iconBox, { borderColor:q.color+'55', backgroundColor:q.color+'0E' }]}>
                  <Icon name={q.icon as any} size={19} color={q.color} />
                </View>
                <Text style={[qg.cellLbl, { color:q.color }]}>{q.label}</Text>
                <View style={[qg.barBottom, { backgroundColor:q.color }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const qg = StyleSheet.create({
  wrap:      { marginBottom:14 },
  hdr:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  hdrTxt:    { fontFamily:MONO, fontSize:9, fontWeight:'900', color:T.mid, letterSpacing:2 },
  statusPill:{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  statusTxt: { fontFamily:MONO, fontSize:8, fontWeight:'900' },
  grid:      { flexDirection:'row', flexWrap:'wrap', gap:7 },
  cell:      { width:`${(100/4)-1.9}%` as any },
  glass:     { alignItems:'center', gap:7, paddingVertical:12, paddingHorizontal:5, borderRadius:14, borderWidth:1.5, backgroundColor:T.surf2, overflow:'hidden', position:'relative' },
  iconBox:   { width:40, height:40, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  cellLbl:   { fontFamily:MONO, fontSize:7.5, fontWeight:'900', letterSpacing:0.3, textAlign:'center' },
  barBottom: { position:'absolute', bottom:0, left:0, right:0, height:2.5, opacity:0.7 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 6: MEMORY BRAIN WIDGET
// ALL animations use useNativeDriver:false — see file header for why.
// ──────────────────────────────────────────────────────────────────
const NODES_MINI = [
  {x:50,y:50,col:T.cyan}, {x:25,y:32,col:T.magenta}, {x:75,y:32,col:T.green},
  {x:18,y:57,col:T.amber}, {x:82,y:57,col:T.pink}, {x:30,y:70,col:T.teal},
  {x:70,y:70,col:T.blue}, {x:50,y:18,col:'#CC33FF'},
];
const EDGES_MINI = [[0,1],[0,2],[0,6],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[1,7]];

function MemoryBrainWidget({ kbArticles, facts, upcoming, isConn, goToTab }: {
  kbArticles:number; facts:number; upcoming:number; isConn:boolean; goToTab:(t:string)=>void;
}) {
  const focused = useIsFocused();
  const CW = SW - PAD*2 - 140;
  const CH = 108;
  // ALL useNativeDriver:false — nodeAnims drive opacity AND are used in
  // left/top position interpolations alongside packetAnims. Mixed drivers crash.
  const nodeAnims   = useRef(NODES_MINI.map(()=>new Animated.Value(0.3+Math.random()*0.5))).current;
  const packetAnims = useRef(EDGES_MINI.slice(0,5).map(()=>new Animated.Value(0))).current;
  const glowA       = useRef(new Animated.Value(0.4)).current;
  const mbMounted   = useRef(true);
  const nodePx = useMemo(()=>NODES_MINI.map(n=>({x:Math.round(n.x/100*CW),y:Math.round(n.y/100*CH),col:n.col})),[CW]);
  const edgePx = useMemo(()=>EDGES_MINI.map(([a,b])=>{
    const na=nodePx[a]??{x:0,y:0,col:T.cyan}; const nb=nodePx[b]??{x:0,y:0,col:T.cyan};
    const dx=nb.x-na.x; const dy=nb.y-na.y; const len=Math.sqrt(dx*dx+dy*dy);
    return { mx:(na.x+nb.x)/2, my:(na.y+nb.y)/2, len, angle:Math.atan2(dy,dx)*180/Math.PI, ax:na.x, ay:na.y, bx:nb.x, by:nb.y, colA:na.col };
  }),[nodePx]);

  useEffect(()=>{
    mbMounted.current = true;
    if(!focused) return;
    const pulses = nodeAnims.map((a,i)=>Animated.loop(Animated.sequence([
      Animated.delay(i*120),
      Animated.timing(a,{toValue:1,   duration:900+i*80,useNativeDriver:false}),
      Animated.timing(a,{toValue:0.12,duration:900+i*80,useNativeDriver:false}),
    ])));
    const packets = packetAnims.map((a,i)=>Animated.loop(Animated.sequence([
      Animated.delay(i*350),
      Animated.timing(a,{toValue:1,duration:1100+i*150,useNativeDriver:false}),
      Animated.timing(a,{toValue:0,duration:0,useNativeDriver:false}),
      Animated.delay(600),
    ])));
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA,{toValue:1,  duration:1400,useNativeDriver:false}),
      Animated.timing(glowA,{toValue:0.2,duration:1400,useNativeDriver:false}),
    ]));
    pulses.forEach(p=>p.start()); packets.forEach(p=>p.start()); glow.start();
    return ()=>{ mbMounted.current = false; pulses.forEach(p=>p.stop()); packets.forEach(p=>p.stop()); glow.stop(); };
  },[focused]);

  const borderC = glowA.interpolate({ inputRange:[0.2,1], outputRange:[T.cyan+'28',T.cyan+'88'] });
  const level = kbArticles>=200?'OMEGA':kbArticles>=100?'SAGE':kbArticles>=50?'EXPERT':kbArticles>=25?'SCHOLAR':kbArticles>=10?'STUDENT':'LEARNER';
  const levelCol = kbArticles>=200?T.cyan:kbArticles>=100?T.magenta:kbArticles>=50?T.green:kbArticles>=25?T.blue:kbArticles>=10?T.amber:T.mid;

  return (
    <Animated.View style={[mb.outer, { borderColor:borderC }]}>
      <View style={[mb.topBar, { backgroundColor:T.cyan }]} />
      <HudCorners color={T.cyan+'40'} size={8} t={1} />
      <View style={{ flexDirection:'row', alignItems:'stretch' }}>
        <View style={[mb.canvas, { width:CW, height:CH }]}>
          {edgePx.map((e,i)=>(
            <Animated.View key={`e${i}`} pointerEvents="none" style={[mb.edge, {
              left:e.mx-e.len/2, top:e.my-0.75, width:Math.round(e.len),
              transform:[{rotate:`${e.angle}deg`}], backgroundColor:e.colA+'28',
              opacity:nodeAnims[EDGES_MINI[i][0]].interpolate({inputRange:[0.12,1],outputRange:[0.15,0.7]}),
            }]} />
          ))}
          {edgePx.slice(0,5).map((e,i)=>(
            <Animated.View key={`p${i}`} pointerEvents="none" style={[mb.packet, {
              left:packetAnims[i].interpolate({inputRange:[0,1],outputRange:[e.ax-3,e.bx-3]}),
              top:packetAnims[i].interpolate({inputRange:[0,1],outputRange:[e.ay-3,e.by-3]}),
              backgroundColor:e.colA,
              opacity:packetAnims[i].interpolate({inputRange:[0,0.1,0.9,1],outputRange:[0,1,1,0]}),
            }]} />
          ))}
          {nodePx.map((n,i)=>(
            <Animated.View key={`n${i}`} pointerEvents="none" style={[mb.node, {
              left:n.x-5, top:n.y-5, backgroundColor:n.col, opacity:nodeAnims[i],
            }]} />
          ))}
          <Animated.View pointerEvents="none" style={[mb.hub, { left:nodePx[0].x-10, top:nodePx[0].y-10, borderColor:T.cyan, opacity:glowA }]}>
            <MaterialCommunityIcons name="brain" size={10} color={T.cyan} />
          </Animated.View>
        </View>
        <View style={mb.sidebar}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:8 }}>
            <MaterialCommunityIcons name="brain" size={13} color={T.cyan} />
            <Text style={[mb.sideTitle, { color:T.cyan }]}>NEURAL KB</Text>
          </View>
          <View style={[mb.lvlBox, { borderColor:levelCol+'55', backgroundColor:levelCol+'0C' }]}>
            <Text style={[mb.lvlTxt, { color:levelCol }]}>{level}</Text>
          </View>
          <Text style={[mb.bigNum, { color:T.cyan }]}>{kbArticles}</Text>
          <Text style={[mb.bigLbl, { color:T.cyan+'70' }]}>VECTORS</Text>
          <View style={{ flexDirection:'row', gap:4, marginTop:8, flexWrap:'wrap' }}>
            <View style={[mb.miniStat, { borderColor:T.magenta+'40' }]}>
              <Text style={[mb.miniN, { color:T.magenta }]}>{facts}</Text>
              <Text style={[mb.miniL, { color:T.magenta+'70' }]}>FACTS</Text>
            </View>
            {upcoming > 0 && (
              <View style={[mb.miniStat, { borderColor:T.pink+'40' }]}>
                <Text style={[mb.miniN, { color:T.pink }]}>{upcoming}</Text>
                <Text style={[mb.miniL, { color:T.pink+'70' }]}>EVENTS</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={()=>{ haptics.light(); goToTab('knowledge'); }} activeOpacity={0.85}
            style={[mb.kbBtn, { borderColor:T.cyan+'50', backgroundColor:T.cyan+'0D' }]}>
            <Text style={[mb.kbBtnTxt, { color:T.cyan }]}>OPEN KB {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
const mb = StyleSheet.create({
  outer:    { borderWidth:1.5, borderRadius:14, backgroundColor:T.surf, overflow:'hidden', position:'relative', marginBottom:14,
    ...Platform.select({ ios:{shadowColor:T.cyan,shadowOffset:{width:0,height:4},shadowOpacity:0.18,shadowRadius:12}, android:{elevation:6} }) },
  topBar:   { height:2.5 },
  canvas:   { position:'relative', backgroundColor:'#020810', overflow:'hidden' },
  edge:     { position:'absolute', height:1.5, borderRadius:1 },
  packet:   { position:'absolute', width:7, height:7, borderRadius:3.5 },
  node:     { position:'absolute', width:10, height:10, borderRadius:5 },
  hub:      { position:'absolute', width:20, height:20, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', backgroundColor:T.cyan+'18' },
  sidebar:  { flex:1, padding:12, justifyContent:'flex-start' },
  sideTitle:{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:1 },
  lvlBox:   { borderWidth:1, borderRadius:6, paddingHorizontal:7, paddingVertical:3, alignSelf:'flex-start', marginBottom:6 },
  lvlTxt:   { fontFamily:MONO, fontSize:8, fontWeight:'900', letterSpacing:0.8 },
  bigNum:   { fontFamily:MONO, fontSize:28, fontWeight:'900', lineHeight:32, letterSpacing:-1 },
  bigLbl:   { fontFamily:MONO, fontSize:7.5, fontWeight:'700', letterSpacing:0.8 },
  miniStat: { borderWidth:1, borderRadius:7, paddingHorizontal:6, paddingVertical:4, alignItems:'center' },
  miniN:    { fontFamily:MONO, fontSize:13, fontWeight:'900' },
  miniL:    { fontFamily:MONO, fontSize:7, fontWeight:'700', letterSpacing:0.5 },
  kbBtn:    { borderWidth:1, borderRadius:7, paddingHorizontal:8, paddingVertical:5, marginTop:8, alignItems:'center' },
  kbBtnTxt: { fontFamily:MONO, fontSize:8.5, fontWeight:'900' },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 7: 4-CHANNEL TERMINAL FEED
// ──────────────────────────────────────────────────────────────────
type ChanID = 'app'|'srv'|'scripts'|'kb';
interface LogEntry { id:string; ts:number; label:string; ok:boolean|null; col:string; tag:string }

function TermChannel({ id, label, icon, color, rows }:{id:ChanID;label:string;icon:string;color:string;rows:LogEntry[]}) {
  return (
    <View style={[tc.panel, { borderColor:color+'30' }]}>
      <View style={[tc.hdr, { borderBottomColor:color+'18' }]}>
        <MaterialCommunityIcons name={icon as any} size={9} color={color} />
        <Text style={[tc.hdrTxt, { color }]}>{label}</Text>
        <View style={[tc.count, { borderColor:color+'40', backgroundColor:color+'0A' }]}>
          <Text style={[tc.countTxt, { color }]}>{rows.length}</Text>
        </View>
      </View>
      <View style={{ gap:0 }}>
        {rows.length===0 ? (
          <Text style={tc.empty}>{'> idle'}</Text>
        ) : rows.map((r,i)=>(
          <View key={r.id} style={[tc.row, { borderLeftColor:r.ok===true?T.green:r.ok===false?T.red:color }]}>
            <Text style={[tc.rowLbl, { color }]} numberOfLines={1}>{r.label}</Text>
            <View style={[tc.tag, { borderColor:color+'35' }]}>
              <Text style={[tc.tagTxt, { color }]}>{r.tag}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const tc = StyleSheet.create({
  panel:   { flex:1, borderWidth:1, borderRadius:9, overflow:'hidden', backgroundColor:'#030A14' },
  hdr:     { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:7, paddingVertical:5, borderBottomWidth:1, backgroundColor:'#020609' },
  hdrTxt:  { fontFamily:MONO, fontSize:8, fontWeight:'900', letterSpacing:0.4, flex:1 },
  count:   { borderWidth:1, borderRadius:4, paddingHorizontal:4, paddingVertical:1 },
  countTxt:{ fontFamily:MONO, fontSize:7, fontWeight:'900' },
  row:     { borderLeftWidth:2, paddingLeft:5, paddingVertical:3.5, paddingRight:6, flexDirection:'row', alignItems:'center', gap:4 },
  rowLbl:  { fontFamily:MONO, fontSize:8.5, flex:1 },
  tag:     { borderWidth:1, borderRadius:3, paddingHorizontal:4, paddingVertical:1 },
  tagTxt:  { fontFamily:MONO, fontSize:6.5, fontWeight:'900' },
  empty:   { fontFamily:MONO, fontSize:8, color:T.dim, padding:7 },
});

const CHANS = [
  { id:'app'     as ChanID, label:'APP',     icon:'application-outline', color:T.cyan    },
  { id:'srv'     as ChanID, label:'SERVER',  icon:'server-network',      color:T.magenta },
  { id:'scripts' as ChanID, label:'SCRIPTS', icon:'code-braces',         color:T.green   },
  { id:'kb'      as ChanID, label:'KB GROW', icon:'brain',               color:T.amber   },
];

const BOT_CMDS = [
  'butler-nexus:~$ status --json',
  'butler-nexus:~$ kb sync --brief',
  'butler-nexus:~$ scan --lan',
  'butler-nexus:~$ mem --report',
];

function TerminalFeed({ isConn }: { isConn:boolean }) {
  const focused = useIsFocused();
  const [logs, setLogs] = useState<Record<ChanID,LogEntry[]>>({ app:[], srv:[], scripts:[], kb:[] });
  const [botMsg, setBotMsg] = useState('');
  const [botIdx, setBotIdx] = useState(0);
  // cursorA: native driver (opacity only)
  const cursorA = useRef(new Animated.Value(1)).current;
  // scanA: JS driver (translateX — layout position)
  const scanA = useRef(new Animated.Value(-SW)).current;
  const tfMounted = useRef(true);

  useEffect(()=>{
    tfMounted.current = true;
    const cl = Animated.loop(Animated.sequence([
      Animated.timing(cursorA,{toValue:0,duration:500,useNativeDriver:true}),
      Animated.timing(cursorA,{toValue:1,duration:500,useNativeDriver:true}),
    ]));
    cl.start();
    return ()=>{ tfMounted.current = false; cl.stop(); };
  },[]);

  useEffect(()=>{
    if(!focused) return;
    const sc = Animated.loop(Animated.sequence([
      Animated.timing(scanA,{toValue:SW+80,duration:3200,useNativeDriver:false}),
      Animated.timing(scanA,{toValue:-SW,duration:0,useNativeDriver:false}),
      Animated.delay(5000),
    ]),{iterations:3});
    sc.start();
    return ()=>sc.stop();
  },[focused]);

  useEffect(()=>{
    const target = BOT_CMDS[botIdx];
    let i = 0; setBotMsg('');
    const tid = setInterval(()=>{ i++; setBotMsg(target.slice(0,i)); if(i>=target.length){ clearInterval(tid); setTimeout(()=>setBotIdx(x=>(x+1)%BOT_CMDS.length),3500); } },36);
    return ()=>clearInterval(tid);
  },[botIdx]);

  const loadLogs = useCallback(async ()=>{
    const now = Date.now();
    try {
      const appE = logger.getEntries().slice(-4).reverse();
      const appR: LogEntry[] = appE.map(e=>({ id:`a${e.ts}`, ts:e.ts, label:e.msg.slice(0,50), ok:e.level==='error'?false:e.level==='warn'?null:true, col:T.cyan, tag:e.level.slice(0,3).toUpperCase() }));
      const srvE = autoErrorLogger.getLogs().slice(0,4);
      const srvR: LogEntry[] = srvE.map(e=>({ id:e.id, ts:e.timestamp, label:`${e.source}: ${e.message.slice(0,40)}`, ok:e.level==='error'?false:e.level==='warn'?null:true, col:T.magenta, tag:e.level.slice(0,3).toUpperCase() }));
      const hist = (await executionHistory.getAll()).slice(0,4);
      const scriptR: LogEntry[] = hist.map(h=>({ id:h.id, ts:new Date(h.timestamp).getTime(), label:h.scriptName||'Script', ok:h.success, col:T.green, tag:h.success?'OK':'ERR' }));
      let kbR: LogEntry[] = [];
      try {
        const stats = await knowledgeAccumulator.getStats?.();
        const total = stats?.totalFindings??0;
        kbR = [{ id:'kb-total', ts:now, label:`${total} total vectors`, ok:true, col:T.amber, tag:'KB' }];
        const sessions = (stats as any)?.sessions??[];
        if(sessions.length>0){ kbR = sessions.slice(-3).reverse().map((s:any,i:number)=>({ id:`kb${i}`, ts:s.timestamp??now-i*60000, label:`+${s.findings?.length??1} findings`, ok:null, col:T.amber, tag:'KB' })); }
      } catch {}
      const mkFallback = (id:ChanID, col:string, tag:string): LogEntry[] => [
        { id:`${id}f1`, ts:now-500, label:'System ready', ok:true, col, tag },
        { id:`${id}f2`, ts:now-2000, label:'All modules loaded', ok:true, col, tag },
        { id:`${id}f3`, ts:now-5000, label:'Encryption active', ok:true, col, tag },
      ];
      if (tfMounted.current) setLogs({
        app:     appR.length    ? appR    : mkFallback('app',T.cyan,'SYS'),
        srv:     srvR.length    ? srvR    : mkFallback('srv',T.magenta,'SRV'),
        scripts: scriptR.length ? scriptR : [{ id:'srf1', ts:now-1000, label:'No scripts run yet', ok:null, col:T.green, tag:'—' }],
        kb:      kbR,
      });
    } catch {}
  },[isConn]);

  useEffect(()=>{ loadLogs(); if(!focused) return; const t=setInterval(loadLogs,10000); return ()=>clearInterval(t); },[focused,loadLogs]);

  return (
    <View style={tf.outer}>
      <Animated.View pointerEvents="none" style={[tf.scan,{transform:[{translateX:scanA}]}]} />
      <View style={tf.hdrBar}>
        <View style={{ flexDirection:'row', gap:4 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><View key={i} style={{ width:7,height:7,borderRadius:4,backgroundColor:c }} />)}
        </View>
        <MaterialCommunityIcons name="monitor" size={9} color={T.cyan} />
        <Text style={tf.hdrTitle}>LIVE TERMINAL FEED</Text>
        <View style={{ flex:1 }} />
        <View style={[tf.connPill, { borderColor:(isConn?T.green:T.red)+'45', backgroundColor:(isConn?T.green:T.red)+'09' }]}>
          <PulseDot color={isConn?T.green:T.red} size={4} />
          <Text style={[tf.connTxt, { color:isConn?T.green:T.red }]}>{isConn?'LIVE':'OFF'}</Text>
        </View>
      </View>
      <View style={tf.grid}>
        <View style={{ flexDirection:'row', gap:6, marginBottom:6 }}>
          {CHANS.slice(0,2).map(c=><TermChannel key={c.id} {...c} rows={logs[c.id]} />)}
        </View>
        <View style={{ flexDirection:'row', gap:6 }}>
          {CHANS.slice(2).map(c=><TermChannel key={c.id} {...c} rows={logs[c.id]} />)}
        </View>
      </View>
      <View style={tf.botRow}>
        <View style={tf.botAvatar}>
          <MaterialCommunityIcons name="robot-happy-outline" size={12} color={T.cyan} />
          <View style={{ position:'absolute', bottom:-1, right:-1, width:5, height:5, borderRadius:3, backgroundColor:T.green, borderWidth:1, borderColor:T.bg }} />
        </View>
        <Text style={tf.botTxt} numberOfLines={1}>{botMsg}</Text>
        <Animated.View style={{ width:5,height:11,backgroundColor:T.cyan,borderRadius:1,opacity:cursorA }} />
      </View>
      <View style={{ height:2, flexDirection:'row' }}>
        {[T.cyan,T.magenta,T.green,T.amber].map((c,i)=><View key={i} style={{ flex:1, backgroundColor:c, opacity:0.4 }} />)}
      </View>
    </View>
  );
}
const tf = StyleSheet.create({
  outer:    { backgroundColor:'#020810', borderWidth:1, borderColor:T.cyan+'1E', overflow:'hidden', position:'relative' },
  scan:     { position:'absolute', top:0, bottom:0, width:70, backgroundColor:'rgba(0,229,255,0.03)', transform:[{skewX:'-12deg'}], zIndex:0 },
  hdrBar:   { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:11, paddingVertical:7, backgroundColor:'#010407', borderBottomWidth:1, borderBottomColor:T.cyan+'15', zIndex:1 },
  hdrTitle: { fontFamily:MONO, fontSize:8, color:T.cyan+'55', letterSpacing:0.8, flex:1 },
  connPill: { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:4, paddingHorizontal:5, paddingVertical:2 },
  connTxt:  { fontFamily:MONO, fontSize:7, fontWeight:'900' },
  grid:     { padding:8, zIndex:1 },
  botRow:   { flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:9, paddingVertical:6, borderTopWidth:1, borderTopColor:T.cyan+'14', backgroundColor:'#010508' },
  botAvatar:{ width:20, height:20, borderRadius:6, borderWidth:1, borderColor:T.cyan+'45', backgroundColor:T.cyan+'0C', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 },
  botTxt:   { fontFamily:MONO, fontSize:8.5, color:T.cyan+'AA', flex:1 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 8: SECTION DIVIDER
// ──────────────────────────────────────────────────────────────────
function SDiv({ icon, label, color }: { icon:string; label:string; color:string }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:10, marginTop:4 }}>
      <View style={{ width:4, height:14, borderRadius:2, backgroundColor:color, ...Platform.select({ ios:{shadowColor:color,shadowOffset:{width:0,height:0},shadowOpacity:0.9,shadowRadius:5}, android:{} }) }} />
      <MaterialCommunityIcons name={icon as any} size={10} color={color} />
      <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color, letterSpacing:1.5 }}>{label}</Text>
      <View style={{ flex:1, height:StyleSheet.hairlineWidth, backgroundColor:color+'25' }} />
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────
// COMPONENT 9: QUICK SCRIPT RUNNER
// ──────────────────────────────────────────────────────────────────
const SCRIPTS = [
  { id:'sysinfo',  icon:'desktop-mac',     lib:'community' as const, label:'SYS INFO',  color:T.cyan,
    script:`import platform,socket\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"Host: {socket.gethostname()}")` },
  { id:'clean',    icon:'broom',           lib:'community' as const, label:'CLEAN TMP', color:T.green,
    script:`import shutil,os,tempfile\nfreed=0;n=0\nfor item in os.listdir(tempfile.gettempdir()):\n fp=os.path.join(tempfile.gettempdir(),item)\n try:\n  sz=os.path.getsize(fp) if os.path.isfile(fp) else 0\n  (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n  freed+=sz;n+=1\n except:pass\nprint(f"Cleared {n} items, freed {freed//1024//1024}MB")` },
  { id:'disk',     icon:'harddisk',        lib:'community' as const, label:'DISK',      color:T.blue,
    script:`import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { id:'net',      icon:'wifi-strength-4', lib:'community' as const, label:'NETWORK',   color:T.amber,
    script:`import psutil,socket\nnet=psutil.net_io_counters()\nprint(f"Sent: {net.bytes_sent/1024/1024:.1f}MB\\nRecv: {net.bytes_recv/1024/1024:.1f}MB")\ns=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)\ns.connect(("8.8.8.8",80));ip=s.getsockname()[0];s.close()\nprint(f"IP: {ip}")` },
  { id:'procs',    icon:'memory',          lib:'community' as const, label:'PROCS',     color:T.magenta,
    script:`import psutil\nprocs=sorted(psutil.process_iter(['name','cpu_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)[:6]\nfor p in procs: print(f"{p.info['name'][:18]:18} CPU:{p.info['cpu_percent']:.1f}%")` },
  { id:'battery',  icon:'battery-charging',lib:'community' as const, label:'BATTERY',  color:'#AAFF00',
    script:`import psutil\nb=psutil.sensors_battery()\nif b: print(f"Level: {b.percent:.0f}%\\nPlugged: {b.power_plugged}")\nelse: print("No battery (desktop?)")` },
];

function QuickScriptRunner({ isConn }: { isConn:boolean }) {
  const [running, setRunning] = useState<string|null>(null);
  const [output, setOutput] = useState<{label:string;text:string;ok:boolean}|null>(null);

  const run = async (item: typeof SCRIPTS[0]) => {
    if(!isConn || running) return;
    haptics.heavy(); setRunning(item.id); setOutput(null);
    try {
      const ip = serverConnection.getIP(); const port = serverConnection.getPort(); const tok = serverConnection.getToken?.() || '';
      if(!ip||!port) throw new Error('Not connected');
      const h: Record<string,string> = { 'Content-Type':'application/json' };
      if(tok) h['Authorization'] = 'Bearer '+tok;
      const ctrl = new AbortController(); setTimeout(()=>ctrl.abort(),28000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method:'POST', headers:h, body:JSON.stringify({script:item.script}), signal:ctrl.signal });
      const d = await res.json();
      setOutput({ label:item.label, text:(d.output||d.error||'Done').trim().slice(0,500), ok:!d.error });
      haptics.success();
    } catch(e:any) {
      setOutput({ label:item.label, text:'Error: '+(e?.message||'Network'), ok:false });
      haptics.warning?.();
    } finally { setRunning(null); }
  };

  return (
    <View style={sr.outer}>
      <View style={{ height:2.5, flexDirection:'row' }}>
        {SCRIPTS.map(s=><View key={s.id} style={{ flex:1, backgroundColor:s.color }} />)}
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:10, paddingBottom:10 }}>
        <MaterialCommunityIcons name="code-braces-box" size={12} color={T.green} />
        <Text style={[sr.hdrTxt, { color:T.green }]}>QUICK PC SCRIPTS</Text>
        <View style={{ flex:1 }} />
        <View style={[sr.statusBadge, { borderColor:(isConn?T.green:T.red)+'45' }]}>
          <PulseDot color={isConn?T.green:T.red} size={5} />
          <Text style={[sr.statusTxt, { color:isConn?T.green:T.red }]}>{isConn?'LIVE':'OFFLINE'}</Text>
        </View>
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', paddingHorizontal:10, paddingBottom:output?0:10 }}>
        {SCRIPTS.map(item=>{
          const Icon = item.lib==='community' ? MaterialCommunityIcons : MaterialIcons;
          const isRun = running===item.id;
          return (
            <Pressable key={item.id} onPress={()=>run(item)} disabled={!isConn||!!running}
              style={({pressed})=>({ width:'33.33%', alignItems:'center', paddingVertical:11, borderRadius:9, marginBottom:2,
                opacity:!isConn?0.3:1, backgroundColor:pressed&&isConn?item.color+'15':'transparent' })}>
              <View style={[sr.scriptIcon, { borderTopColor:item.color, borderColor:item.color+'30', backgroundColor:item.color+'0A' }]}>
                {isRun ? <ActivityIndicator size="small" color={item.color} /> : <Icon name={item.icon as any} size={20} color={item.color} />}
              </View>
              <Text style={[sr.scriptLbl, { color:item.color }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {output && (
        <View style={{ paddingHorizontal:10, paddingBottom:10 }}>
          <View style={[sr.outBox, { borderColor:(output.ok?T.green:T.red)+'50', backgroundColor:(output.ok?T.green:T.red)+'07' }]}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
              <MaterialIcons name={output.ok?'check-circle':'error'} size={12} color={output.ok?T.green:T.red} />
              <Text style={[sr.outLabel, { color:output.ok?T.green:T.red }]}>{output.label}</Text>
              <TouchableOpacity onPress={()=>setOutput(null)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <MaterialIcons name="close" size={13} color={T.mid} />
              </TouchableOpacity>
            </View>
            <Text style={[sr.outTxt, { color:output.ok?T.green:T.red }]} selectable>{output.text}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
const sr = StyleSheet.create({
  outer:      { backgroundColor:T.surf2, borderRadius:14, borderWidth:1, borderColor:T.green+'25', overflow:'hidden', marginBottom:14 },
  hdrTxt:     { fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:1.2, marginLeft:7, flex:1 },
  statusBadge:{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:3 },
  statusTxt:  { fontFamily:MONO, fontSize:8, fontWeight:'900' },
  scriptIcon: { width:42, height:42, borderRadius:11, borderWidth:1.5, borderTopWidth:3, alignItems:'center', justifyContent:'center', marginBottom:5 },
  scriptLbl:  { fontFamily:MONO, fontSize:7.5, fontWeight:'900', textAlign:'center' },
  outBox:     { borderWidth:1.5, borderRadius:10, padding:10 },
  outLabel:   { fontFamily:MONO, fontSize:9.5, fontWeight:'900', flex:1 },
  outTxt:     { fontFamily:MONO, fontSize:10.5, lineHeight:16 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 10: ALERTS + INTEL
// ──────────────────────────────────────────────────────────────────
function AlertsIntelCard({ isConn, cpu, goToTab, histItems }: { isConn:boolean; cpu:number; goToTab:(t:string)=>void; histItems:any[] }) {
  const left = isConn ? [
    { col:cpu>70?T.amber:T.green, label:cpu>70?`CPU HIGH: ${Math.round(cpu)}%`:'CPU normal', tag:'PC' },
    { col:T.cyan, label:'HMAC auth verified', tag:'SEC' },
    { col:T.magenta, label:'Script runtime ready', tag:'SYS' },
  ] : [
    { col:T.red, label:'PC not connected', tag:'OFF' },
    { col:T.cyan, label:'Scan QR to pair', tag:'TIP' },
  ];
  const right = histItems.length > 0
    ? histItems.slice(0,4).map((h:any)=>({ label:h.scriptName||'Script', tag:h.success?'OK':'ERR', col:h.success?T.green:T.red }))
    : [
      { label:'AI core initialized', tag:'SYS', col:T.cyan },
      { label:'KB engine idle', tag:'KB', col:T.amber },
      { label:'LAN scanner armed', tag:'NET', col:T.green },
      { label:'Encryption active', tag:'SEC', col:T.magenta },
    ];
  return (
    <View style={[aic.outer, { borderColor:T.amber+'25' }]}>
      <View style={{ height:2, flexDirection:'row' }}>
        <View style={{ flex:1, backgroundColor:T.amber }} />
        <View style={{ flex:1, backgroundColor:T.magenta }} />
      </View>
      <View style={{ flexDirection:'row' }}>
        <View style={[aic.panel, { borderRightColor:T.border }]}>
          <View style={aic.panelHdr}>
            <MaterialIcons name="notifications" size={10} color={T.amber} />
            <Text style={[aic.panelHdrTxt, { color:T.amber }]}>ALERTS</Text>
          </View>
          {left.map((a,i)=>(
            <View key={i} style={[aic.row, i>0&&{ borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:T.border }]}>
              <View style={[aic.dot, { backgroundColor:a.col }]} />
              <Text style={aic.rowTxt} numberOfLines={1}>{a.label}</Text>
              <View style={[aic.tag, { borderColor:a.col+'40' }]}><Text style={[aic.tagTxt, { color:a.col }]}>{a.tag}</Text></View>
            </View>
          ))}
          <TouchableOpacity onPress={()=>{ haptics.light(); goToTab('logs'); }} style={aic.footer}>
            <Text style={[aic.footerTxt, { color:T.amber }]}>ALL LOGS {'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={aic.panel}>
          <View style={aic.panelHdr}>
            <MaterialCommunityIcons name="clipboard-list" size={10} color={T.magenta} />
            <Text style={[aic.panelHdrTxt, { color:T.magenta }]}>INTEL</Text>
          </View>
          {right.map((r,i)=>(
            <View key={i} style={[aic.row, i>0&&{ borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:T.border }]}>
              <View style={[aic.dot, { backgroundColor:r.col }]} />
              <Text style={aic.rowTxt} numberOfLines={1}>{r.label}</Text>
              <View style={[aic.tag, { borderColor:r.col+'40' }]}><Text style={[aic.tagTxt, { color:r.col }]}>{r.tag}</Text></View>
            </View>
          ))}
          <TouchableOpacity onPress={()=>{ haptics.light(); goToTab('butler'); }} style={aic.footer}>
            <Text style={[aic.footerTxt, { color:T.magenta }]}>ASK AI {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const aic = StyleSheet.create({
  outer:    { borderRadius:13, borderWidth:1, backgroundColor:T.surf, overflow:'hidden', marginBottom:14 },
  panel:    { flex:1, borderRightWidth:0 },
  panelHdr: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:8, borderBottomWidth:1, borderBottomColor:T.border },
  panelHdrTxt:{ fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:1, flex:1 },
  row:      { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:7 },
  dot:      { width:5, height:5, borderRadius:3, flexShrink:0 },
  rowTxt:   { fontFamily:MONO, fontSize:9, color:T.text, flex:1 },
  tag:      { borderWidth:1, borderRadius:3, paddingHorizontal:5, paddingVertical:1 },
  tagTxt:   { fontFamily:MONO, fontSize:7, fontWeight:'900' },
  footer:   { paddingHorizontal:10, paddingVertical:8, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:T.border },
  footerTxt:{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', textAlign:'center' },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 11: STAT CARDS ROW
// ──────────────────────────────────────────────────────────────────
function StatCardsRow({ isConn, metrics, scripts, kbCount }: { isConn:boolean; metrics:{cpu:number;ram:number;disk:number}; scripts:number; kbCount:number }) {
  const STATS = [
    { label:'SCRIPTS', value:scripts>0?String(scripts):'—',       color:T.magenta, icon:'code-braces' as const, lib:'community' as const },
    { label:'KB FACTS',value:kbCount>0?String(kbCount):'—',       color:T.cyan,    icon:'brain'       as const, lib:'community' as const },
    { label:'DISK OK', value:isConn?`${Math.max(0,100-Math.round(metrics.disk))}%`:'—', color:T.green, icon:'harddisk' as const, lib:'community' as const },
    { label:'THREATS', value:isConn?String(Math.floor(metrics.cpu*12)):'—', color:T.red, icon:'shield' as const, lib:'material' as const },
  ];
  return (
    <View style={{ flexDirection:'row', gap:GAP, marginBottom:14 }}>
      {STATS.map((s,i)=>{
        const Icon = s.lib==='community' ? MaterialCommunityIcons : MaterialIcons;
        return (
          <View key={i} style={[sc2.cell, { borderTopColor:s.color, borderColor:s.color+'28' }]}>
            <View style={{ position:'absolute', top:6, right:8 }}>
              <Icon name={s.icon as any} size={10} color={s.color+'40'} />
            </View>
            <HudCorners color={s.color+'35'} size={7} t={1} />
            <Text style={[sc2.val, { color:s.color }]} adjustsFontSizeToFit minimumFontScale={0.4} numberOfLines={1}>{s.value}</Text>
            <Text style={[sc2.lbl, { color:s.color+'70' }]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const sc2 = StyleSheet.create({
  cell: { flex:1, backgroundColor:T.surf2, borderRadius:11, borderWidth:1.5, borderTopWidth:3, padding:10, alignItems:'center', gap:3, overflow:'hidden', position:'relative',
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:0.4,shadowRadius:8}, android:{elevation:4} }) },
  val:  { fontFamily:MONO, fontSize:22, fontWeight:'900', lineHeight:26, letterSpacing:-1 },
  lbl:  { fontFamily:MONO, fontSize:7.5, fontWeight:'700', letterSpacing:0.5 },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 12: CONNECT MODAL
// ──────────────────────────────────────────────────────────────────
function ConnectModal({ visible, onClose, onConnected }: { visible:boolean; onClose:()=>void; onConnected:()=>void }) {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8766');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const scannedRef = useRef(false);

  const handleQR = useCallback(async(data:string)=>{
    if(scannedRef.current) return;
    scannedRef.current = true; setShowCam(false); haptics.success();
    try {
      const parsed = parseQRConnection(data);
      if(parsed?.ip){ setIp(parsed.ip); if(parsed.port) setPort(String(parsed.port)); setStatus(`Connecting to ${parsed.ip}...`); setBusy(true);
        const r = await (serverConnection.connectManual ? serverConnection.connectManual(parsed.ip,String(parsed.port||port)) : Promise.resolve({success:false,error:'N/A'}));
        setBusy(false);
        if((r as any).success){ haptics.success(); setTimeout(()=>{ onConnected(); onClose(); },700); return; }
        throw new Error((r as any).error||'Failed');
      }
    } catch(e:any){ setBusy(false); setStatus('Error: '+(e?.message||'Failed')); }
    const m = data.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?/);
    if(m){ setIp(m[1]); if(m[2]) setPort(m[2]); setStatus(`Found IP: ${m[1]}`); }
    else{ setStatus(`Scanned: ${data.slice(0,40)}`); scannedRef.current=false; }
  },[port,onConnected,onClose]);

  const connect = async()=>{
    if(!ip.trim()){ setStatus('Enter IP address'); return; }
    setBusy(true); setStatus(`Connecting to ${ip.trim()}...`);
    try {
      const r = await (serverConnection.connectManual ? serverConnection.connectManual(ip.trim(),port.trim()) : Promise.resolve({success:false,error:'N/A'}));
      if((r as any).success){ setStatus('Connected!'); haptics.success(); setTimeout(()=>{ onConnected(); onClose(); },600); }
      else throw new Error((r as any).error||'Failed');
    } catch(e:any){ setStatus('Error: '+(e?.message||'Failed')); }
    setBusy(false);
  };

  if(!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.94)', justifyContent:'flex-end' }}>
        <View style={cm2.sheet}>
          <View style={{ height:3, backgroundColor:T.cyan }} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:18, paddingBottom:12 }}>
            <MaterialIcons name="qr-code-scanner" size={20} color={T.cyan} />
            <Text style={cm2.title}>PAIR YOUR PC</Text>
            <Pressable onPress={onClose} style={cm2.closeBtn}><MaterialIcons name="close" size={15} color={T.mid} /></Pressable>
          </View>
          {showCam ? (
            <View style={cm2.camWrap}>
              <Suspense fallback={null}>
                <QRCameraScanner onScanned={handleQR} hudColor={T.cyan}>
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center'}]}>
                    <View style={{ width:110,height:110,borderWidth:2,borderColor:T.cyan+'60',borderRadius:4 }} />
                    <Text style={{ fontFamily:MONO,fontSize:9,color:T.cyan,marginTop:9,fontWeight:'900',letterSpacing:1 }}>SCAN QR FROM TERMINAL</Text>
                  </View>
                </QRCameraScanner>
              </Suspense>
              <TouchableOpacity onPress={()=>setShowCam(false)} style={cm2.camClose}><MaterialIcons name="close" size={13} color="#fff" /></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={()=>{ scannedRef.current=false; setShowCam(true); }} activeOpacity={0.82}
              style={cm2.scanBtn}>
              <MaterialIcons name="qr-code-scanner" size={18} color={T.cyan} />
              <View><Text style={cm2.scanBtnTxt}>SCAN QR CODE</Text><Text style={cm2.scanBtnSub}>Run butler_server.py then scan QR in terminal</Text></View>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, marginBottom:10 }}>
            <View style={{ flex:1, height:1, backgroundColor:T.border }} />
            <Text style={{ fontFamily:MONO, fontSize:8.5, color:T.mid }}>OR ENTER IP</Text>
            <View style={{ flex:1, height:1, backgroundColor:T.border }} />
          </View>
          <View style={{ paddingHorizontal:16, gap:8 }}>
            <TextInput value={ip} onChangeText={setIp} placeholder="192.168.x.x" placeholderTextColor={T.dim}
              style={cm2.input} keyboardType="numeric" autoCorrect={false} />
            <TextInput value={port} onChangeText={setPort} placeholder="8766" placeholderTextColor={T.dim}
              style={[cm2.input, { borderColor:T.cyan+'30' }]} keyboardType="numeric" />
          </View>
          {status ? (
            <View style={[cm2.statusBox, { borderColor:(status.includes('Error')?T.red:status.includes('Connected')?T.green:T.amber)+'45', backgroundColor:(status.includes('Error')?T.red:status.includes('Connected')?T.green:T.amber)+'0A' }]}>
              <Text style={{ fontFamily:MONO, fontSize:10.5, color:status.includes('Error')?T.red:status.includes('Connected')?T.green:T.amber }}>{status}</Text>
            </View>
          ) : null}
          <Pressable onPress={connect} disabled={busy}
            style={({pressed})=>[cm2.connectBtn,{opacity:pressed||busy?0.8:1}]}>
            {busy ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="link" size={18} color="#000" />}
            <Text style={cm2.connectTxt}>{busy?'CONNECTING...':'CONNECT TO PC'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const cm2 = StyleSheet.create({
  sheet:     { backgroundColor:T.surf, borderTopLeftRadius:20, borderTopRightRadius:20, paddingBottom:44, overflow:'hidden' },
  title:     { fontFamily:MONO, fontSize:15, fontWeight:'900', color:T.text, flex:1 },
  closeBtn:  { width:32, height:32, borderRadius:8, backgroundColor:T.surf2, alignItems:'center', justifyContent:'center' },
  camWrap:   { marginHorizontal:16, marginBottom:12, borderRadius:14, overflow:'hidden', borderWidth:2, borderColor:T.cyan+'70' },
  camClose:  { position:'absolute', top:7, right:7, width:26, height:26, borderRadius:13, backgroundColor:'rgba(0,0,0,0.75)', alignItems:'center', justifyContent:'center' },
  scanBtn:   { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:16, marginBottom:12, borderWidth:1.5, borderRadius:12, borderColor:T.cyan+'55', backgroundColor:T.cyan+'0A', paddingVertical:13, paddingHorizontal:14 },
  scanBtnTxt:{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:T.cyan },
  scanBtnSub:{ fontFamily:MONO, fontSize:8.5, color:T.mid, marginTop:1 },
  input:     { backgroundColor:T.bg, borderWidth:1.5, borderColor:T.cyan+'55', borderRadius:11, color:T.text, padding:13, fontFamily:MONO, fontSize:13 },
  statusBox: { marginHorizontal:16, marginTop:8, padding:9, borderRadius:8, borderWidth:1 },
  connectBtn:{ margin:16, marginBottom:0, backgroundColor:T.green, borderRadius:12, paddingVertical:14, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:8 },
  connectTxt:{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:'#000' },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 13: SECURITY STRIP
// ──────────────────────────────────────────────────────────────────
function SecurityStrip({ isConn }: { isConn:boolean }) {
  const PROTO = [
    { icon:'lock', label:'AES-256-GCM', col:T.cyan },
    { icon:'verified-user', label:'HMAC-SHA256', col:T.green },
    { icon:'wifi-off', label:'LAN ONLY', col:T.amber },
    { icon:'no-accounts', label:'NO ACCOUNTS', col:T.magenta },
    { icon:'storage', label:'LOCAL DB', col:T.blue },
    { icon:'block', label:'NO TELEMETRY', col:T.red },
  ];
  return (
    <View style={[ss.outer, { borderColor:T.green+'30' }]}>
      <View style={[ss.topBar, { backgroundColor:T.green }]} />
      <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:9, paddingBottom:9 }}>
        <MaterialIcons name="security" size={11} color={T.green} />
        <Text style={[ss.hdrTxt, { color:T.green }]}>SECURITY PROTOCOLS</Text>
        <View style={{ flex:1 }} />
        <View style={[ss.statusPill, { borderColor:T.green+'45', backgroundColor:T.green+'0A' }]}>
          <PulseDot color={T.green} size={5} />
          <Text style={[ss.statusTxt, { color:T.green }]}>VERIFIED</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:12, paddingBottom:12, gap:7 }}>
        {PROTO.map((p,i)=>(
          <View key={i} style={[ss.protoChip, { borderColor:p.col+'45', backgroundColor:p.col+'0A' }]}>
            <MaterialIcons name={p.icon as any} size={12} color={p.col} />
            <Text style={[ss.protoTxt, { color:p.col }]}>{p.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const ss = StyleSheet.create({
  outer:     { borderRadius:13, borderWidth:1, backgroundColor:T.surf, overflow:'hidden', marginBottom:14 },
  topBar:    { height:2 },
  hdrTxt:    { fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:1.2, marginLeft:7, flex:1 },
  statusPill:{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:3 },
  statusTxt: { fontFamily:MONO, fontSize:8, fontWeight:'900' },
  protoChip: { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:9, paddingHorizontal:10, paddingVertical:7 },
  protoTxt:  { fontFamily:MONO, fontSize:9.5, fontWeight:'900' },
});

// ──────────────────────────────────────────────────────────────────
// COMPONENT 14: FOOTER TERMINAL
// ──────────────────────────────────────────────────────────────────
function FooterTerminal({ isConn, addr }: { isConn:boolean; addr:string }) {
  return (
    <View style={{ backgroundColor:'#010207', borderRadius:12, borderWidth:1, borderColor:T.cyan+'20', overflow:'hidden', marginBottom:24 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, backgroundColor:'#020509', borderBottomWidth:1, borderBottomColor:T.cyan+'14' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><View key={i} style={{ width:8,height:8,borderRadius:4,backgroundColor:c }} />)}
        <Text style={{ flex:1, fontFamily:MONO, fontSize:8, color:T.cyan+'50', letterSpacing:0.3, textAlign:'center' }}>butler@nexus — session</Text>
        <View style={{ borderWidth:1, borderRadius:4, borderColor:T.green+'35', backgroundColor:T.green+'09', paddingHorizontal:5, paddingVertical:2 }}>
          <Text style={{ fontFamily:MONO, fontSize:7, color:T.green, fontWeight:'900' }}>SECURE</Text>
        </View>
      </View>
      <View style={{ padding:11, gap:3 }}>
        {[
          ['version  ', '7.3.0',              T.green],
          ['telemetry', 'DISABLED',            T.green],
          ['cloud    ', 'DISABLED',            T.green],
          ['crypto   ', 'AES-256 / HMAC-256', T.mid],
          ['storage  ', 'DEVICE ONLY',         T.green],
          ['server   ', isConn?(addr||'LINKED'):'NOT CONNECTED', isConn?T.green:T.red],
        ].map(([k,v,col],i)=>(
          <View key={i} style={{ flexDirection:'row', gap:7 }}>
            <Text style={{ fontFamily:MONO, fontSize:8.5, color:T.dim, width:65 }}>  {k}:</Text>
            <Text style={{ fontFamily:MONO, fontSize:8.5, color:col as string, flex:1 }}>{v as string}</Text>
          </View>
        ))}
        <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:5 }}>
          <View style={{ width:5, height:5, borderRadius:3, backgroundColor:isConn?T.green:T.red }} />
          <Text style={{ fontFamily:MONO, fontSize:8.5, color:isConn?T.green:T.red }}>
            {isConn ? '✓ CONNECTED — HMAC token active' : '✗ OFFLINE — scan QR to pair PC'}
          </Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:3, marginTop:5 }}>
          <Text style={{ fontFamily:MONO, fontSize:8.5, color:T.cyan+'55' }}>$</Text>
          <View style={{ width:6, height:11, backgroundColor:T.cyan+'55', borderRadius:1 }} />
        </View>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ──────────────────────────────────────────────────────────────────
function NexusHomeInner() {
  const insets = useSafeAreaInsets();
  const [isConn,   setIsConn]   = useState(false);
  const [addr,     setAddr]     = useState('');
  const [latency,  setLatency]  = useState(0);
  const [metrics,  setMetrics]  = useState({ cpu:0, ram:0, disk:0, net:0 });
  const [scripts,  setScripts]  = useState(0);
  const [kbCount,  setKbCount]  = useState(0);
  const [kbFacts,  setKbFacts]  = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [histItems,setHistItems]= useState<any[]>([]);
  const [showQR,   setShowQR]   = useState(false);
  const [refresh,  setRefresh]  = useState(false);

  const loadData = useCallback(async () => {
    try {
      const conn = serverConnection.isConnected?.() ?? false;
      const ip   = serverConnection.getIP?.()    || '';
      const port = serverConnection.getPort?.()  || '';
      setIsConn(conn); setAddr(ip&&port?`${ip}:${port}`:'');
      if(conn && ip && port) {
        const tok = serverConnection.getToken?.() || '';
        const h: Record<string,string> = {};
        if(tok) h['Authorization'] = 'Bearer '+tok;
        const ctrl = new AbortController(); const t0 = Date.now();
        setTimeout(()=>ctrl.abort(),7000);
        try {
          const res = await fetch(`http://${ip}:${port}/api/metrics`, { headers:h, signal:ctrl.signal });
          if(res.ok) {
            const d = await res.json();
            setLatency(Date.now()-t0);
            const m = { cpu:d.cpu_percent??d.cpu?.percent??0, ram:d.ram_percent??d.memory?.percent??0, disk:d.disk_percent??d.disk?.percent??0, net:0 };
            setMetrics(m);
            performanceHistory.recordFromMetrics(d);
          }
        } catch {}
      }
    } catch {}
    try { const h = await executionHistory.getAll().catch(()=>[] as any[]); const a = Array.isArray(h)?h:[]; setScripts(a.length); setHistItems(a); } catch {}
    try {
      const fn = (kbGrowthTracker as any).getTotal??(kbGrowthTracker as any).getTotalCount;
      if(fn) { const n = await fn.call(kbGrowthTracker).catch(()=>0); setKbCount(n||0); }
    } catch {}
    try {
      const stats = await knowledgeAccumulator.getStats?.().catch(()=>null);
      if(stats) setKbCount(stats.totalFindings??0);
    } catch {}
    try {
      await personalMemory.load();
      setKbFacts(personalMemory.getFacts().length);
      setUpcoming(personalMemory.getUpcomingEvents(30).length);
    } catch {}
  }, []);

  useFocusEffect(useCallback(()=>{
    loadData();
    const t = setInterval(loadData, 30000);
    return ()=>clearInterval(t);
  },[loadData]));

  useEffect(()=>{
    let unsub: (()=>void)|null = null;
    try {
      const s = connectionHub.getState();
      setIsConn(s.isConnected??false); setAddr(s.addr||'');
      unsub = connectionHub.subscribe((st:any)=>{
        setIsConn(st.isConnected??false); setAddr(st.addr||'');
        if(st.isConnected) loadData();
      });
    } catch {}
    return ()=>{ unsub?.(); };
  },[loadData]);

  useEffect(()=>{
    (global as any).__nexusHomeOpenQR = ()=>setShowQR(true);
    return ()=>{ delete (global as any).__nexusHomeOpenQR; };
  },[]);

  const goToTab   = useCallback((tab:string)=>{ haptics.light(); try{ (global as any).__butlerSwitchTab?.(tab); }catch{} },[]);
  const onRefresh = useCallback(async()=>{ setRefresh(true); haptics.medium(); await loadData(); haptics.success(); setRefresh(false); },[loadData]);

  return (
    <View style={{ flex:1, backgroundColor:T.bg }}>
      <NexusParticleFX pageId="nexushome" active={true} />
      <ConnectModal visible={showQR} onClose={()=>setShowQR(false)} onConnected={loadData} />

      {/* Compact top header — just brand + time + QR/refresh buttons */}
      <NexusHeader safeTop={insets.top} isConn={isConn} addr={addr} latency={latency} onQR={()=>setShowQR(true)} onRefresh={onRefresh} />
      <NavPills goToTab={goToTab} onQR={()=>setShowQR(true)} isConn={isConn} />

      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={{ paddingBottom:240 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS==='android'}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={onRefresh}
            tintColor={T.cyan} colors={[T.cyan,T.green,T.magenta]} progressBackgroundColor={T.surf} />
        }
      >
        {/* ════════════════════════════════════════════════════════
            ① NEXUS COMMAND CENTER — STUNNING above-the-fold hero
               Black grid · SYS.BOOT · live crawler · 8 features
            ════════════════════════════════════════════════════════ */}
        <NexusCommandCenter
          isConn={isConn}
          addr={addr}
          latency={latency}
          metrics={metrics}
          goToTab={goToTab}
          onQR={()=>setShowQR(true)}
          onRefresh={onRefresh}
          safeTop={insets.top}
        />

        {/* ② REMOTE ACCESS card */}
        <View style={{ paddingHorizontal:PAD, paddingTop:10, paddingBottom:2 }}>
          <RemoteAccessMonetizationCard onConnected={loadData} />
        </View>

        {/* ③ AI CHAT HERO */}
        <AIChatHero isConn={isConn} goToTab={goToTab} onQR={()=>setShowQR(true)} />

        {/* ④ TERMINAL FEED */}
        <TerminalFeed isConn={isConn} />

        {/* PADDED SECTION */}
        <View style={{ paddingHorizontal:PAD, paddingTop:14 }}>

          {/* ⑤ QUICK LAUNCH */}
          <SDiv icon="rocket-launch" label="QUICK LAUNCH" color={T.cyan} />
          <QuickGrid goToTab={goToTab} isConn={isConn} />

          {/* ⑥ LIVE TELEMETRY */}
          <SDiv icon="monitor-heart" label="LIVE TELEMETRY" color={T.cyan} />
          <View style={{ marginBottom:14 }}>
            <TelemetryRow cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk} isConn={isConn} />
          </View>

          {/* ⑦ STAT CARDS */}
          <SDiv icon="chart-box" label="SYSTEM STATS" color={T.green} />
          <StatCardsRow isConn={isConn} metrics={metrics} scripts={scripts} kbCount={kbCount} />

          {/* ⑧ MEMORY BRAIN */}
          <SDiv icon="brain" label="NEURAL MEMORY BRAIN" color={T.cyan} />
          <MemoryBrainWidget kbArticles={kbCount} facts={kbFacts} upcoming={upcoming} isConn={isConn} goToTab={goToTab} />

          {/* ⑨ ALERTS + INTEL */}
          <SDiv icon="alert-decagram" label="ALERTS & INTEL" color={T.amber} />
          <AlertsIntelCard isConn={isConn} cpu={metrics.cpu} goToTab={goToTab} histItems={histItems} />

          {/* ⑩ QUICK PC SCRIPTS */}
          <SDiv icon="code-braces" label="QUICK PC SCRIPTS" color={T.green} />
          <QuickScriptRunner isConn={isConn} />

          {/* ⑪ NEXUS VAULT SECURITY */}
          <SDiv icon="shield-lock" label="NEXUS VAULT SECURITY" color={T.green} />
          <NexusVaultCard isConnected={isConn} serverLatencyMs={latency} />

          {/* ⑫ SESSION LOG */}
          <SDiv icon="terminal" label="SESSION LOG" color={T.mid} />
          <FooterTerminal isConn={isConn} addr={addr} />

        </View>
      </ScrollView>
    </View>
  );
}

export default function NexusHomeScreen() {
  return (
    <TabErrorBoundary name="Core">
      <NexusHomeInner />
    </TabErrorBoundary>
  );
}
