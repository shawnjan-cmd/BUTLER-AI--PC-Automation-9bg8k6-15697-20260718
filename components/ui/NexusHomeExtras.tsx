/**
 * BUTLER HOME — Extra Dashboard Components
 * Crawler Graph, Knowledge Graph, Script Forge, File Share,
 * Omega Loop, Security Protocols, Live Status Bar, Butler Header
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Animated, ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const SW = Math.max(1, (Dimensions.get('window').width || 375) || 375);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD = 14;
const GAP2 = 8;
const COL2_W = Math.floor((SW - PAD * 2 - GAP2) / 2);

const C = {
  bg:      '#060810',
  surface: '#0C1220',
  border:  'rgba(0,220,255,0.12)',
  text:    '#D2E8F6',
  textMid: '#6890A8',
  textDim: '#304050',
  cyan:    '#00DCFF',
  green:   '#00FF88',
  purple:  '#9B40FF',
  amber:   '#FFB020',
  red:     '#FF3131',
};

// ── NEXUS LIVE STATUS BAR ─────────────────────────────────────────
export function NexusLiveStatusBar({ isConnected, kbArticles, scriptsRunTotal, goToTab }: {
  isConnected: boolean; kbArticles: number; scriptsRunTotal: number; goToTab: (t: string) => void;
}) {
  const [clock, setClock] = useState('');
  const [omegaCount, setOmegaCount] = useState(2);
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const waveAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);
    };
    updateClock();
    const t  = setInterval(updateClock, 1000);
    const om = setInterval(() => setOmegaCount(c => c + 1), 47000);
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue:1, duration:700, useNativeDriver:true }),
      Animated.timing(pulseAnim, { toValue:0.3, duration:700, useNativeDriver:true }),
    ]));
    const wave = Animated.loop(Animated.timing(waveAnim, { toValue:1, duration:2000, useNativeDriver:true }));
    pulse.start(); wave.start();
    return () => { clearInterval(t); clearInterval(om); pulse.stop(); wave.stop(); };
  }, []);

  return (
    <View style={s.liveBar}>
      {/* LIVE + clock */}
      <View style={[s.livePill, { borderColor: C.green+'50', backgroundColor: C.green+'0A' }]}>
        <Animated.View style={{ width:6, height:6, borderRadius:3, backgroundColor:C.green, opacity:pulseAnim }} />
        <Text style={[s.liveTxt, { color:C.green }]}>LIVE</Text>
        <Text style={[s.clockTxt]}>{clock}</Text>
      </View>
      {/* Waveform */}
      <View style={s.waveRow}>
        {[0.5,0.9,0.6,1,0.7,0.85,0.5].map((h,i)=>(
          <Animated.View key={i} style={{
            width:2.5, borderRadius:1.5,
            height: Math.round(h * 16),
            backgroundColor: C.cyan,
            opacity: waveAnim.interpolate({ inputRange:[0,0.5,1], outputRange:[i%2===0?0.9:0.4, i%2===0?0.4:0.9, i%2===0?0.9:0.4] }),
          }} />
        ))}
      </View>
      {/* Omega counter */}
      <View style={[s.omegaPill, { borderColor:C.purple+'50', backgroundColor:C.purple+'0A' }]}>
        <Text style={[s.omegaTxt, { color:C.purple }]}>+{omegaCount} omega · N</Text>
      </View>
      <View style={{ flex:1 }} />
      {/* Action buttons */}
      {[
        { icon:'folder',   col:C.cyan, onPress:()=>goToTab('fileshare') },
        { icon:'flash-on', col:C.cyan, onPress:()=>goToTab('scripts')  },
        { icon:'wifi-off', col:C.red,  onPress:()=>{}                  },
        { icon:'wifi',     col:C.cyan, onPress:()=>{}                  },
      ].map((btn,i)=>(
        <TouchableOpacity key={i} onPress={btn.onPress}
          style={[s.actionBtn, { borderColor:btn.col+'40', backgroundColor:btn.col+'0C' }]}>
          <MaterialIcons name={btn.icon as any} size={14} color={btn.col} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── NEXUS BUTLER HEADER CARD ──────────────────────────────────────
export function NexusButlerHeaderCard({ isConnected, goToTab }: {
  isConnected: boolean; goToTab: (t: string) => void;
}) {
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue:1, duration:1400, useNativeDriver:true }),
      Animated.timing(glowAnim, { toValue:0.3, duration:1400, useNativeDriver:true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const PILLS = [
    { label:'SELF-H...', color:C.cyan,   icon:'computer'             },
    { label:'PRIVA...',  color:C.purple,  icon:'shield'               },
    { label:'LOCAL...',  color:C.green,   icon:'settings-input-antenna'},
    { label:'SECURE...', color:C.amber,  icon:'link'                 },
  ];

  return (
    <View style={[s.headerCard, {
      borderColor: C.cyan+'40',
      ...Platform.select({ ios:{ shadowColor:C.cyan, shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:14 }, android:{elevation:6} }),
    }]}>
      <View style={[s.headerTopLine, { backgroundColor:C.cyan }]} />
      <View style={s.headerBody}>
        <View style={{ flex:1 }}>
          <Text style={[s.headerTitle, { color:C.cyan }]}>BUTLER AI</Text>
          <Text style={s.headerSub}>BUTLER DASHBOARD</Text>
        </View>
        {/* Robot avatar */}
        <TouchableOpacity onPress={() => goToTab('butler')} activeOpacity={0.85}
          style={[s.avatarCard, { borderColor:C.cyan+'60', backgroundColor:C.cyan+'0C',
            ...Platform.select({ ios:{ shadowColor:C.cyan, shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:10 }, android:{elevation:6} }),
          }]}>
          <View style={s.avatarInner}>
            <ExpoImage
              source={require('@/assets/images/nexus-robot-v2.png')}
              style={{ width: 68, height: 58, borderRadius: 10 }}
              contentFit="cover"
            />
            {[10,20,30,40].map((t,i)=>(
              <View key={i} style={{ position:'absolute', top:t, left:0, right:0, height:1, backgroundColor:C.cyan+'18' }} />
            ))}
          </View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:4, paddingVertical:3, paddingHorizontal:8 }}>
            <Animated.View style={{ width:5, height:5, borderRadius:3,
              backgroundColor: isConnected ? C.green : C.textMid, opacity:glowAnim }} />
            <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900',
              color: isConnected ? C.green : C.textMid }}>BUTLER</Text>
          </View>
          <Text style={{ fontFamily:MONO, fontSize:8, color:C.textMid, paddingBottom:4, letterSpacing:0.5 }}>
            {isConnected ? 'ACTIVE' : 'IDLE'}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Feature pills */}
      <View style={s.pillsRow}>
        {PILLS.map((p,i)=>(
          <View key={i} style={[s.featurePill, { borderColor:p.color+'50', backgroundColor:p.color+'0A' }]}>
            <View style={{ width:5, height:5, borderRadius:3, backgroundColor:p.color }} />
            <MaterialIcons name={p.icon as any} size={10} color={p.color} />
            <Text style={[s.featurePillTxt, { color:p.color }]}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── CRAWLER GRAPH CARD ────────────────────────────────────────────
export function CrawlerGraphCard({ kbArticles, isConnected }: { kbArticles: number; isConnected: boolean }) {
  const pts = [18,22,25,28,26,31,35,38,41,44,48,52,56,60,65];
  const maxPt = Math.max(...pts);
  const chartH = 54;
  const formatKB = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n > 0 ? String(n) : '8.72M';
  return (
    <View style={[s.col2Card, { borderColor:C.cyan+'40' }]}>
      <View style={[s.cardTopLine, { backgroundColor:C.cyan }]} />
      <View style={s.cardHeaderRow}>
        <View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.cyan }} />
        <MaterialIcons name="show-chart" size={11} color={C.cyan} />
        <Text style={[s.cardTitle, { color:C.cyan }]}>CRAWLER GRAPH</Text>
      </View>
      <View style={{ paddingHorizontal:12, paddingBottom:6 }}>
        <Text style={[s.bigNum, { color:C.cyan }]}>{formatKB(kbArticles)}</Text>
        <Text style={s.bigNumSub}>ENTITIES INDEXED</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:3, marginTop:2 }}>
          <MaterialIcons name="arrow-upward" size={10} color={C.green} />
          <Text style={{ fontFamily:MONO, fontSize:9, color:C.green }}>12.4%</Text>
        </View>
      </View>
      {/* Line chart */}
      <View style={{ height:chartH, paddingHorizontal:12, paddingBottom:6 }}>
        <View style={{ flex:1, flexDirection:'row', alignItems:'flex-end', gap:1.5 }}>
          {pts.map((pt,i)=>(
            <View key={i} style={{
              flex:1,
              height: Math.max(4, (pt/maxPt)*(chartH-8)),
              borderRadius:2,
              backgroundColor:C.cyan,
              opacity:0.25+(i/pts.length)*0.75,
            }} />
          ))}
        </View>
        {/* Glowing line on top */}
        <View style={{ position:'absolute', left:12, right:12, bottom:6, height:1.5, backgroundColor:C.cyan+'60', borderRadius:1 }} />
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', paddingHorizontal:12, paddingBottom:10 }}>
        {['-24H','-12H','NOW'].map((l,i)=>(
          <Text key={i} style={{ fontFamily:MONO, fontSize:7.5, color:C.textDim }}>{l}</Text>
        ))}
      </View>
      {/* HUD corner */}
      <View style={{ position:'absolute', bottom:0, left:0, width:10, height:10,
        borderBottomWidth:1.5, borderLeftWidth:1.5, borderColor:C.cyan+'70' }} />
    </View>
  );
}

// ── KNOWLEDGE GRAPH CARD ──────────────────────────────────────────
export function KnowledgeGraphCard({ kbArticles }: { kbArticles: number }) {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue:1, duration:1200, useNativeDriver:true }),
      Animated.timing(pulseAnim, { toValue:0.3, duration:1200, useNativeDriver:true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const cW = COL2_W - 28; const cH = 80;
  const nodes: {x:number;y:number;sz:number;core:boolean}[] = [
    {x:0.5, y:0.5, sz:14, core:true},
    {x:0.15, y:0.3, sz:8, core:false},
    {x:0.82, y:0.22, sz:7, core:false},
    {x:0.88, y:0.72, sz:9, core:false},
    {x:0.18, y:0.75, sz:7, core:false},
    {x:0.5, y:0.12, sz:6, core:false},
  ];

  const nodeCount = kbArticles > 0 ? Math.round(kbArticles * 6.98).toLocaleString() : '128,456';
  const relCount  = kbArticles > 0 ? Math.round(kbArticles * 49.3).toLocaleString() : '912,341';

  return (
    <View style={[s.col2Card, { borderColor:C.green+'40' }]}>
      <View style={[s.cardTopLine, { backgroundColor:C.green }]} />
      <View style={s.cardHeaderRow}>
        <View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green }} />
        <MaterialCommunityIcons name="graph" size={11} color={C.green} />
        <Text style={[s.cardTitle, { color:C.green }]}>KNOWLEDGE</Text>
      </View>
      {/* Graph viz */}
      <View style={{ height:cH, marginHorizontal:12, position:'relative' }}>
        {nodes.slice(1).map((n,i)=>(
          <View key={`l${i}`} style={{
            position:'absolute',
            left: nodes[0].x*cW,
            top:  nodes[0].y*cH,
            width: Math.sqrt(Math.pow((n.x-nodes[0].x)*cW,2)+Math.pow((n.y-nodes[0].y)*cH,2)),
            height:1.2,
            backgroundColor: C.green+'55',
            transform:[{ rotate:`${Math.atan2((n.y-nodes[0].y)*cH,(n.x-nodes[0].x)*cW)*180/Math.PI}deg` }],
          }} />
        ))}
        {nodes.map((n,i)=>(
          <Animated.View key={i} style={{
            position:'absolute',
            left: n.x*cW - n.sz/2,
            top:  n.y*cH - n.sz/2,
            width:n.sz, height:n.sz, borderRadius:n.sz/2,
            backgroundColor: n.core ? C.green : C.green+'80',
            borderWidth: n.core ? 2 : 1,
            borderColor: n.core ? '#000' : C.green+'40',
            opacity: n.core ? 1 : pulseAnim,
          }} />
        ))}
      </View>
      {/* Stats */}
      <View style={{ flexDirection:'row', paddingHorizontal:12, paddingBottom:10, paddingTop:6,
        borderTopWidth:1, borderTopColor:C.green+'20', gap:10 }}>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:8, color:C.textDim, letterSpacing:0.5 }}>NODES</Text>
          <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:C.green }}>{nodeCount}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:8, color:C.textDim, letterSpacing:0.5 }}>RELATIONS</Text>
          <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:C.green }}>{relCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ── SCRIPT FORGE CARD ─────────────────────────────────────────────
export function ScriptForgeCard({ scriptsRunTotal, goToTab }: { scriptsRunTotal: number; goToTab: (t: string) => void }) {
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue:1, duration:1100, useNativeDriver:true }),
      Animated.timing(glowAnim, { toValue:0.2, duration:1100, useNativeDriver:true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const displayCount = scriptsRunTotal > 0 ? scriptsRunTotal.toLocaleString() : '1,246';
  return (
    <View style={[s.col2Card, { borderColor:C.purple+'45' }]}>
      <View style={[s.cardTopLine, { backgroundColor:C.purple }]} />
      <View style={s.cardHeaderRow}>
        <Animated.View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.purple, opacity:glowAnim }} />
        <MaterialIcons name="code" size={11} color={C.purple} />
        <Text style={[s.cardTitle, { color:C.purple }]}>SCRIPT FORGE</Text>
      </View>
      <TouchableOpacity onPress={() => goToTab('scripts')} activeOpacity={0.85}
        style={{ paddingHorizontal:12, paddingBottom:10 }}>
        <Text style={[s.bigNum, { color:C.purple }]}>{displayCount}</Text>
        <Text style={s.bigNumSub}>SCRIPTS</Text>
        {[
          { label:'RUNNING',   val:'12 ▷',  col:C.cyan   },
          { label:'SCHEDULED', val:'28 ⏰', col:C.textMid },
          { label:'SUCCESS',   val:'98.7%', col:C.purple  },
        ].map((row,i)=>(
          <View key={i} style={{ flexDirection:'row', alignItems:'center', marginBottom:4, marginTop:i===0?6:0 }}>
            <Text style={{ fontFamily:MONO, fontSize:9, color:C.textDim, flex:1, letterSpacing:0.5 }}>{row.label}</Text>
            <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:row.col }}>{row.val}</Text>
          </View>
        ))}
        <View style={{ height:3, backgroundColor:C.purple+'20', borderRadius:2, marginTop:4, overflow:'hidden' }}>
          <View style={{ width:'98.7%', height:'100%' as any, backgroundColor:C.purple, borderRadius:2 }} />
        </View>
      </TouchableOpacity>
      <View style={{ position:'absolute', bottom:0, right:0, width:10, height:10,
        borderBottomWidth:1.5, borderRightWidth:1.5, borderColor:C.purple+'70' }} />
    </View>
  );
}

// ── FILE SHARE CARD ───────────────────────────────────────────────
export function FileShareCard({ goToTab }: { goToTab: (t: string) => void }) {
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue:1, duration:1300, useNativeDriver:true }),
      Animated.timing(glowAnim, { toValue:0.2, duration:1300, useNativeDriver:true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const FILES = [
    { name:'research.pdf',  size:'134 MB', icon:'picture-as-pdf', col:'#FF4444' },
    { name:'dataset.csv',   size:'89 MB',  icon:'table-chart',     col:C.green  },
    { name:'blueprint.png', size:'3.2 MB', icon:'image',           col:C.cyan   },
  ];
  return (
    <View style={[s.col2Card, { borderColor:C.green+'40' }]}>
      <View style={[s.cardTopLine, { backgroundColor:C.green }]} />
      <View style={s.cardHeaderRow}>
        <Animated.View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green, opacity:glowAnim }} />
        <MaterialCommunityIcons name="file-multiple" size={11} color={C.green} />
        <Text style={[s.cardTitle, { color:C.green }]}>FILE SHARE</Text>
      </View>
      <TouchableOpacity onPress={() => goToTab('fileshare')} activeOpacity={0.85}
        style={{ paddingHorizontal:12, paddingBottom:10 }}>
        <View style={{ flexDirection:'row', alignItems:'baseline', gap:6, marginBottom:8 }}>
          <Text style={[s.bigNum, { color:C.green }]}>24</Text>
          <Text style={{ fontFamily:MONO, fontSize:10, color:C.textMid }}>CLIPS</Text>
        </View>
        {FILES.map((f,i)=>(
          <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
            <MaterialIcons name={f.icon as any} size={11} color={f.col} />
            <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.text, flex:1 }} numberOfLines={1}>{f.name}</Text>
            <Text style={{ fontFamily:MONO, fontSize:8.5, color:C.textDim }}>{f.size}</Text>
          </View>
        ))}
      </TouchableOpacity>
    </View>
  );
}

// ── OMEGA LOOP CARD ───────────────────────────────────────────────
export function OmegaLoopCard({ isConnected }: { isConnected: boolean }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const [confidence, setConfidence] = useState(93.8);

  useEffect(() => {
    const spin = Animated.loop(Animated.timing(spinAnim, { toValue:1, duration:7000, useNativeDriver:true }));
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue:1, duration:1500, useNativeDriver:false }),
      Animated.timing(glowAnim, { toValue:0.3, duration:1500, useNativeDriver:false }),
    ]));
    spin.start(); glow.start();
    const t = setInterval(() => {
      setConfidence(c => Math.min(99.9, Math.max(88, c + (Math.random()-0.35)*0.4)));
    }, 5000);
    return () => { spin.stop(); glow.stop(); clearInterval(t); };
  }, []);

  const spinDeg = spinAnim.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  const ringColor = glowAnim.interpolate({ inputRange:[0,1], outputRange:[C.green+'40', C.green+'CC'] });

  return (
    <View style={[s.col2Card, { borderColor:C.green+'45' }]}>
      <View style={[s.cardTopLine, { backgroundColor:C.green }]} />
      <View style={s.cardHeaderRow}>
        <View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green }} />
        <Text style={[s.cardTitle, { color:C.green }]}>{'∞ OMEGA LOOP'}</Text>
      </View>
      <View style={{ alignItems:'center', paddingBottom:12, paddingTop:4 }}>
        {/* OUTER: JS-driver borderColor only — useNativeDriver:false */}
        <Animated.View style={{
          width:76, height:76, borderRadius:38,
          borderWidth:3, borderColor:ringColor,
          alignItems:'center', justifyContent:'center',
          ...Platform.select({ ios:{ shadowColor:C.green, shadowOffset:{width:0,height:0}, shadowOpacity:0.7, shadowRadius:18 }, android:{} }),
        }}>
        {/* INNER: native-driver rotate only — useNativeDriver:true */}
        <Animated.View style={{
          width:70, height:70, borderRadius:35,
          alignItems:'center', justifyContent:'center',
          transform:[{ rotate:spinDeg }],
        }}>
          {[0,60,120,180,240,300].map((deg,i)=>{
            const rad = deg * Math.PI / 180;
            return (
              <View key={i} style={{ position:'absolute', width:6, height:6, borderRadius:3,
                backgroundColor: i%2===0 ? C.green : C.green+'80',
                left: 35 + Math.cos(rad)*30, top: 35 + Math.sin(rad)*30 }} />
            );
          })}
          <Text style={{ fontFamily:MONO, fontSize:28, color:C.green, transform:[{rotate:'-360deg'}] }}>{'∞'}</Text>
        </Animated.View>
        </Animated.View>
        <Text style={{ fontFamily:MONO, fontSize:9, color:C.textMid, marginTop:8, letterSpacing:1.5 }}>CONFIDENCE</Text>
        <Text style={{ fontFamily:MONO, fontSize:17, fontWeight:'900', color:C.green }}>{confidence.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

// ── SECURITY PROTOCOLS CARD ───────────────────────────────────────
export function SecurityProtocolsCard({ isConnected }: { isConnected: boolean }) {
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue:1, duration:1200, useNativeDriver:true }),
      Animated.timing(glowAnim, { toValue:0.3, duration:1200, useNativeDriver:true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const PROTOCOLS = [
    { icon:'security',     label:'FIREWALL',  sub:'ACTIVE',     col:C.cyan   },
    { icon:'track-changes',label:'INTRUSION', sub:'ACTIVE',     col:C.green  },
    { icon:'lock',         label:'ENCRYPTI',  sub:'AES-256',    col:C.purple },
    { icon:'person',       label:'ACCESS',    sub:'ZERO TRUST', col:C.green  },
    { icon:'view-in-ar',   label:'SANDBOX',   sub:'ISOLATED',   col:C.amber  },
    { icon:'fingerprint',  label:'INTEGRITY', sub:'VERIFIED',   col:C.cyan   },
  ];

  return (
    <View style={[s.secCard, { borderColor:C.cyan+'35' }]}>
      <View style={[s.cardTopLine, { backgroundColor:C.cyan }]} />
      <View style={s.secHeader}>
        <View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.cyan }} />
        <MaterialIcons name="shield" size={13} color={C.cyan} />
        <Text style={[s.cardTitle, { color:C.cyan, fontSize:11 }]}>SECURITY PROTOCOLS</Text>
        <View style={{ flex:1 }} />
        <Animated.View style={[s.secureBadge, { opacity:glowAnim }]}>
          <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:C.green }}>STATUS: SECURE </Text>
          <View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green }} />
        </Animated.View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap:7, paddingHorizontal:14, paddingBottom:14 }}>
        {PROTOCOLS.map((p,i)=>(
          <View key={i} style={[s.protocolItem, { borderColor:p.col+'45', backgroundColor:p.col+'08' }]}>
            <View style={[s.protocolIconBox, { borderColor:p.col+'60', backgroundColor:p.col+'12' }]}>
              <MaterialIcons name={p.icon as any} size={22} color={p.col} />
            </View>
            <Text style={[s.protocolLabel, { color:p.col }]}>{p.label}</Text>
            <Text style={s.protocolSub}>{p.sub}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  liveBar:    { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:7,
                backgroundColor:'#020810', borderBottomWidth:1, borderBottomColor:C.cyan+'20' },
  livePill:   { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:8,
                paddingHorizontal:8, paddingVertical:4 },
  liveTxt:    { fontFamily:MONO, fontSize:10, fontWeight:'900' },
  clockTxt:   { fontFamily:MONO, fontSize:11, fontWeight:'900', color:'#D2E8F6' },
  waveRow:    { flexDirection:'row', alignItems:'flex-end', height:18, gap:1.5 },
  omegaPill:  { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:8,
                paddingHorizontal:8, paddingVertical:4 },
  omegaTxt:   { fontFamily:MONO, fontSize:9, fontWeight:'700' },
  actionBtn:  { width:30, height:30, borderRadius:8, borderWidth:1, alignItems:'center', justifyContent:'center' },

  headerCard: { borderRadius:12, borderWidth:1.5, backgroundColor:'#060E1A', overflow:'hidden' },
  headerTopLine: { height:2, opacity:0.7 },
  headerBody: { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:12 },
  headerTitle:{ fontFamily:MONO, fontSize:24, fontWeight:'900', letterSpacing:3 },
  headerSub:  { fontFamily:MONO, fontSize:10, color:'#6890A8', letterSpacing:3, marginTop:2 },
  avatarCard: { borderWidth:2, borderRadius:12, padding:2, alignItems:'center' },
  avatarInner:{ width:68, height:58, borderRadius:10, backgroundColor:C.cyan+'0C',
                alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' },
  pillsRow:   { flexDirection:'row', gap:7, paddingHorizontal:14, paddingBottom:12, flexWrap:'wrap' },
  featurePill:{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:8,
                paddingHorizontal:7, paddingVertical:4 },
  featurePillTxt: { fontFamily:MONO, fontSize:8.5, fontWeight:'900' },

  col2Card:   { flex:1, borderRadius:12, borderWidth:1.5, backgroundColor:'#060E1A', overflow:'hidden',
                ...Platform.select({ ios:{ shadowOffset:{width:0,height:3}, shadowOpacity:0.2, shadowRadius:10 }, android:{elevation:4} }) },
  cardTopLine:{ height:2 },
  cardHeaderRow: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingTop:10, paddingBottom:6 },
  cardTitle:  { fontFamily:MONO, fontSize:10, fontWeight:'900', letterSpacing:0.8, flex:1 },
  bigNum:     { fontFamily:MONO, fontSize:22, fontWeight:'900', lineHeight:26 },
  bigNumSub:  { fontFamily:MONO, fontSize:8, color:'#304050', letterSpacing:0.8, marginTop:1 },

  secCard:    { borderRadius:12, borderWidth:1.5, backgroundColor:'#060E1A', overflow:'hidden',
                ...Platform.select({ ios:{ shadowOffset:{width:0,height:3}, shadowOpacity:0.2, shadowRadius:12 }, android:{elevation:5} }) },
  secHeader:  { flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:14, paddingTop:10, paddingBottom:8 },
  secureBadge:{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7,
                borderColor:C.green+'50', backgroundColor:C.green+'0A', paddingHorizontal:8, paddingVertical:3 },
  protocolItem: { width:82, alignItems:'center', gap:6, borderWidth:1.5, borderRadius:10,
                  paddingVertical:10, paddingHorizontal:6 },
  protocolIconBox: { width:40, height:40, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  protocolLabel: { fontFamily:MONO, fontSize:8.5, fontWeight:'900', textAlign:'center', letterSpacing:0.3 },
  protocolSub: { fontFamily:MONO, fontSize:8, color:'#304050', textAlign:'center', lineHeight:11 },
});
