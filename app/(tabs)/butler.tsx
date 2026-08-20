/**
 * BUTLER AI — Chat v15 · Fresh Rebuild
 * Clean message bubbles · Mode tabs · Streaming simulation
 * Session management · Suggestions · Voice placeholder
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 */
import { ButlerPageStudioHost } from '@/components/ui/ButlerPageStudioHost';
import ButlerEvidenceStrip from '@/components/ui/ButlerEvidenceStrip';
import ButlerFlowLedgerCard from '@/components/ui/ButlerFlowLedgerCard';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import ButlerMicrocopy from '@/components/ui/ButlerMicrocopy';
import ButlerAtmosphere from '@/components/ui/ButlerAtmosphere';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Animated, Platform, Dimensions, KeyboardAvoidingView,
  ActivityIndicator, Pressable, Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSkin } from '@/hooks/useSkin';
import { SkinHeaderFX } from '@/components/ui/SkinHeaderFX';
import { useFocusEffect } from 'expo-router';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { serverConnection } from '@/services/serverConnection';
import { haptics } from '@/services/haptics';
import { buildScriptConcierge } from '@/services/scriptConcierge';
import { createAutomationPlanPreview, formatAutomationPlan, isAutomationRequest, type AutomationPlan } from '@/services/automationCommandContract';
import { requestServerAutomationPlan } from '@/services/automationRequestService';
import { automationMemoryVault } from '@/services/automationMemoryVault';
import { syncAutomationMemoryManifest } from '@/services/automationMemorySync';
import { automationWorkflowMonitor, type WorkflowSnapshot } from '@/services/automationWorkflowMonitor';
import { navigateButler } from '@/services/safeNavigation';

const BG    = '#0B0F17';
const SURF  = '#0B0F17';
const SURF2 = '#111621';
const PURP  = '#A468FF';
const CYAN  = '#38D9E8';
const GREEN = '#2FE38A';
const AMBER = '#FFB43D';
const RED   = '#FF4D5E';
const BLUE  = '#4A9EFF';
const DIM   = '#4A9EFF';
const MID   = '#4A9EFF';
const TEXT  = '#DCE6F2';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW    = Math.max(320, Dimensions.get('window').width);

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: number;
  automationPlan?: AutomationPlan;
};

const MODES = [
  { key:'chat',   label:'CHAT',   icon:'chat-outline',  color:PURP,  desc:'General assistant' },
  { key:'code',   label:'CODE',   icon:'code-braces',   color:CYAN,  desc:'Python & scripting' },
  { key:'system', label:'SYSTEM', icon:'server',        color:GREEN, desc:'PC diagnostics' },
];

const SUGGESTIONS = [
  { text:'What can you do right now?',    icon:'help-circle-outline' },
  { text:'Scan my LAN for active hosts',  icon:'network-outline'     },
  { text:'Free up disk space safely',     icon:'harddisk'            },
  { text:'Show top CPU processes',        icon:'cpu-64-bit'          },
  { text:'Find or create a Python script', icon:'code-braces'         },
  { text:'Write a backup script',         icon:'code-braces'         },
  { text:'Explain my system specs',       icon:'information-outline'  },
];

// ── PulseDot ─────────────────────────────────────────────────────
const PulseDot = memo(({ color, size = 6 }: { color: string; size?: number }) => {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 700, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
});

// ── Message bubble ────────────────────────────────────────────────
type ChatSkin = { accent:string; accent2:string; accent3:string; ok:string; warn:string; text:string; mid:string; panel2:string; bg:string; mascot:string; bubbleShape:string; fontProfile:string; };

const AutomationPlanCard = memo(({ plan, accent, panel, text }: { plan: AutomationPlan; accent: string; panel: string; text: string }) => {
  const blocked = plan.state === 'blocked';
  const sideEffect = plan.risk === 'external_side_effect';
  const signal = blocked ? RED : sideEffect ? AMBER : accent;
  return (
    <View style={{ marginTop:10, borderWidth:1.5, borderColor:signal+'65', backgroundColor:panel, borderRadius:12, padding:10, gap:8 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
        <MaterialCommunityIcons name={blocked ? 'shield-alert-outline' : sideEffect ? 'shield-account-outline' : 'shield-check-outline'} size={15} color={signal} />
        <Text style={{ fontFamily:MONO, fontSize:9, letterSpacing:0.7, color:signal, fontWeight:'900', flex:1 }}>
          {blocked ? 'AUTOMATION BLOCKED' : 'FLOW LEDGER PLAN'}
        </Text>
        <Text style={{ fontFamily:MONO, fontSize:8, color:signal+'C0', fontWeight:'900' }}>{plan.risk.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>
      <Text style={{ fontFamily:MONO, color:text, fontSize:10.5, lineHeight:16 }}>{plan.summary}</Text>
      {!blocked && <>
        <View style={{ borderTopWidth:1, borderTopColor:signal+'25', paddingTop:7, gap:3 }}>
          {plan.prerequisites.slice(0, 3).map(item => (
            <Text key={item.id} style={{ fontFamily:MONO, fontSize:8.5, color:TEXT+'CC', lineHeight:13 }}>• {item.label}</Text>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => { haptics.medium(); navigateButler('scripts'); }}
          activeOpacity={0.82}
          style={{ minHeight:42, borderRadius:10, borderWidth:1.5, borderColor:signal+'95', backgroundColor:signal+'13', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
          <MaterialCommunityIcons name="script-text-outline" size={15} color={signal} />
          <Text style={{ fontFamily:MONO, color:signal, fontWeight:'900', fontSize:9.5, letterSpacing:0.5 }}>REVIEW IN SCRIPT LIBRARY</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily:MONO, color:MID, fontSize:7.5, lineHeight:11, textAlign:'center' }}>CHAT NEVER EXECUTES A WORKFLOW · LINT → DRY-RUN → EXPLICIT APPROVAL</Text>
      </>}
    </View>
  );
});
const mascotIcon = (mascot: string): keyof typeof MaterialCommunityIcons.glyphMap => mascot === 'atelier' ? 'robot-excited-outline' : mascot === 'guardian' ? 'shield-moon-outline' : mascot === 'neon' ? 'robot-outline' : mascot === 'terminal' ? 'robot-industrial' : mascot === 'orbital' ? 'orbit' : 'robot-happy';
const MsgBubble = memo(({ msg, activeMode, skin }: { msg: Message; activeMode: string; skin: ChatSkin }) => {
  const isUser   = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const modeColor = activeMode === 'code' ? skin.accent : activeMode === 'system' ? skin.ok : skin.accent3;
  const color = isUser ? modeColor : isSystem ? skin.warn : skin.accent3;
  const fade   = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideX,{ toValue: 0, tension: 200, friction: 16, useNativeDriver: true }),
    ]).start();
  }, []);

  const ts = new Date(msg.ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  return (
    <Animated.View style={[
      MB.row,
      isUser && { alignSelf:'flex-end', flexDirection:'row-reverse' },
      { opacity: fade, transform: [{ translateX: slideX }] },
    ]}>
      <View style={[MB.avatar, { borderColor: color + '50', backgroundColor: color + '10' }]}>
        <MaterialCommunityIcons
          name={isUser ? 'account' : isSystem ? 'information' : mascotIcon(skin.mascot)}
          size={12} color={color} />
      </View>
      <View style={{ maxWidth: SW * 0.76, gap: 3 }}>
        {!isUser && (
          <Text style={[MB.role, { color }]}>{isSystem ? 'SYSTEM' : 'BUTLER AI'}</Text>
        )}
        <View style={[MB.bubble, {
          borderColor: color + '28',
          backgroundColor: isUser ? color + '0E' : skin.panel2,
          borderLeftWidth: isUser ? 0 : 3,
          borderRightWidth: isUser ? 3 : 0,
          borderLeftColor: isUser ? undefined : color,
          borderRightColor: isUser ? color : undefined,
          borderRadius: skin.bubbleShape === 'capsule' ? 22 : skin.bubbleShape === 'bracket' ? 6 : skin.bubbleShape === 'terminal' ? 4 : skin.bubbleShape === 'orbital' ? 18 : 14,
        }]}>
          <Text style={[MB.content, { color: isUser ? color + 'EE' : skin.text }]}>
            {msg.content}
          </Text>
          {msg.automationPlan && !isUser && (
            <AutomationPlanCard plan={msg.automationPlan} accent={color} panel={skin.panel2} text={skin.text} />
          )}
        </View>
        <Text style={[MB.ts, { alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>{ts}</Text>
      </View>
    </Animated.View>
  );
});
const MB = StyleSheet.create({
  row:     { flexDirection:'row', alignItems:'flex-end', gap:8, paddingHorizontal:12, marginBottom:10 },
  avatar:  { width:26, height:26, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  role:    { fontFamily:MONO, fontSize:8, fontWeight:'900', letterSpacing:0.8, paddingLeft:2 },
  bubble:  { borderWidth:1.5, borderRadius:14, padding:12, paddingTop:10 },
  content: { fontFamily:MONO, fontSize:13, lineHeight:20 },
  ts:      { fontFamily:MONO, fontSize:8, color:MID },
});

// ── Typing indicator ──────────────────────────────────────────────
const TypingDots = memo(({ color, background, mascot }: { color: string; background: string; mascot: string }) => {
  const a0 = useRef<Animated.Value | null>(null);
  const a1 = useRef<Animated.Value | null>(null);
  const a2 = useRef<Animated.Value | null>(null);
  if (!a0.current) a0.current = new Animated.Value(0.15);
  if (!a1.current) a1.current = new Animated.Value(0.15);
  if (!a2.current) a2.current = new Animated.Value(0.15);
  const anims = [a0.current, a1.current, a2.current];
  useEffect(() => {
    const loops = anims.map((a, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 150),
      Animated.timing(a, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.1, duration: 380, useNativeDriver: true }),
    ])));
    loops.forEach(l => l.start()); return () => loops.forEach(l => l.stop());
  }, []);
  return (
    <View style={{ flexDirection:'row', alignItems:'flex-end', gap:8, paddingHorizontal:12, marginBottom:10 }}>
      <View style={[MB.avatar, { borderColor: color+'50', backgroundColor: color+'10' }]}>
        <MaterialCommunityIcons name={mascotIcon(mascot)} size={12} color={color} />
      </View>
      <View style={[MB.bubble, { borderColor:color+'28', backgroundColor:background, borderLeftWidth:3, borderLeftColor:color }]}>
        <View style={{ flexDirection:'row', gap:5, alignItems:'center', padding:2 }}>
          {anims.map((a, i) => (
            <Animated.View key={i} style={{ width:7, height:7, borderRadius:3.5, backgroundColor:color, opacity:a }} />
          ))}
        </View>
      </View>
    </View>
  );
});

// ── Live draft pipeline ───────────────────────────────────────────
const DraftingPipeline = memo(({ stage, snapshot, accent, panel }: { stage: string; snapshot: WorkflowSnapshot | null; accent: string; panel: string }) => {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const bridge = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 620, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 620, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(bridge, { toValue: 1, duration: 1050, useNativeDriver: true }),
        Animated.timing(bridge, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(340),
      ])),
    ];
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [bridge, pulse]);

  const stageIndex: Record<string, number> = {
    android_intent: 0, pattern_match: 1, pc_preflight: 2, memory_manifest: 2,
    draft_ready: 3, script_library_handoff: 3, dry_run: 3, approval_required: 3, receipt: 3,
  };
  const stages = [
    { label:'INTENT', icon:'cellphone-link', owner:'ANDROID' },
    { label:'MEMORY', icon:'brain', owner:'VAULT' },
    { label:'PC CHECK', icon:'desktop-tower-monitor', owner:'PAIRED PC' },
    { label:'DRAFT', icon:'script-text-outline', owner:'LIBRARY' },
  ];
  const activeIndex = snapshot ? stageIndex[snapshot.stage] ?? 0 : Math.max(0, stages.findIndex(item => stage.includes(item.label)));
  const blocked = snapshot?.state === 'blocked' || snapshot?.state === 'failed';
  const signal = blocked ? RED : accent;
  const latest = snapshot?.events[snapshot.events.length - 1];
  const compactCorrelation = snapshot?.correlationId ? snapshot.correlationId.slice(-8).toUpperCase() : 'LOCAL';

  return (
    <View style={{ marginHorizontal:12, marginBottom:10, borderWidth:1.5, borderColor:signal+'70', backgroundColor:panel, borderRadius:14, padding:11, gap:9 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
        <Animated.View style={{ opacity:pulse }}><MaterialCommunityIcons name="robot-industrial" size={17} color={signal} /></Animated.View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:0.9, color:signal }}>BUTLER CRAFT LINK</Text>
          <Text style={{ fontFamily:MONO, fontSize:7.5, color:MID, letterSpacing:0.4 }}>TRACE {compactCorrelation} · RECEIPT-GUARDED</Text>
        </View>
        <View style={{ borderWidth:1, borderColor:signal+'55', borderRadius:7, paddingHorizontal:6, paddingVertical:4, backgroundColor:signal+'10' }}>
          <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:signal }}>{blocked ? 'HELD' : 'DRAFT ONLY'}</Text>
        </View>
      </View>

      <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
        <View style={{ alignItems:'center', gap:2 }}>
          <MaterialCommunityIcons name="cellphone-link" size={15} color={signal} />
          <Text style={{ fontFamily:MONO, fontSize:6.5, color:signal }}>ANDROID</Text>
        </View>
        <View style={{ height:2, flex:1, backgroundColor:signal+'24', overflow:'hidden', borderRadius:1 }}>
          <Animated.View style={{ width:'35%', height:2, backgroundColor:signal, opacity:pulse, transform:[{ translateX: bridge.interpolate({ inputRange:[0,1], outputRange:[-70, 210] }) }] }} />
        </View>
        <View style={{ alignItems:'center', gap:2 }}>
          <MaterialCommunityIcons name="desktop-tower-monitor" size={15} color={signal} />
          <Text style={{ fontFamily:MONO, fontSize:6.5, color:signal }}>PAIRED PC</Text>
        </View>
      </View>

      <View style={{ flexDirection:'row', gap:4 }}>
        {stages.map((item, index) => {
          const active = index <= activeIndex;
          const current = index === activeIndex;
          return <View key={item.label} style={{ flex:1, minHeight:45, borderWidth:1, borderRadius:7, borderColor:(current ? signal : active ? signal+'65' : MID+'45'), backgroundColor:current ? signal+'14' : active ? signal+'08' : 'transparent', alignItems:'center', justifyContent:'center', gap:2 }}>
            <MaterialCommunityIcons name={item.icon as any} size={12} color={active ? signal : MID} />
            <Text style={{ fontFamily:MONO, fontSize:6.5, color:active ? signal : MID, fontWeight:'900' }}>{item.label}</Text>
            <Text style={{ fontFamily:MONO, fontSize:5.5, color:active ? signal+'AA' : MID+'AA' }}>{item.owner}</Text>
          </View>;
        })}
      </View>

      <View style={{ borderTopWidth:1, borderTopColor:signal+'25', paddingTop:7, flexDirection:'row', alignItems:'center', gap:7 }}>
        <MaterialCommunityIcons name={latest?.source === 'paired_pc' ? 'shield-check-outline' : 'shield-sync-outline'} size={13} color={signal} />
        <Text style={{ fontFamily:MONO, fontSize:8.8, lineHeight:13, color:TEXT+'D0', flex:1 }} numberOfLines={2}>{latest?.detail || stage}</Text>
        <Text style={{ fontFamily:MONO, fontSize:6.5, color:signal }}>{latest?.source === 'paired_pc' ? 'PC' : 'APP'}</Text>
      </View>
    </View>
  );
});

// ── Header ────────────────────────────────────────────────────────
const ButlerHeader = memo(({ safeTop, isConn, model, msgCount, onClear, onHistory }: {
  safeTop:number; isConn:boolean; model:string; msgCount:number;
  onClear:()=>void; onHistory:()=>void;
}) => {
  // ── SKIN WIRING: every colour below resolves from the active pack on the
  // SKINS page, so switching a skin recolours this header instantly. ──
  const S = useSkin();
  const CYAN = S.accent, TEAL = S.accent, BLUE = S.accent2, PURP = S.accent3;
  const AMBER = S.warn, GREEN = S.ok, RED = S.danger;
  const TEXT = S.text, DIM = S.dim, MID = S.mid;
  const SURF = S.panel, SURF2 = S.panel2, SURF3 = S.panel2, BG = S.bg;
  const [hh, setHh] = useState('--:--');
  const [ss, setSs] = useState('--');
  const scanX = useRef(new Animated.Value(-SW)).current;

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setHh(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSs(String(n.getSeconds()).padStart(2,'0'));
    };
    tick();
    const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanX, { toValue:SW+120, duration:2400, useNativeDriver:true }),
      Animated.timing(scanX, { toValue:-SW, duration:0, useNativeDriver:true }),
      Animated.delay(5000),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const cc = isConn ? GREEN : AMBER;

  return (
    <View style={[BH.root, { paddingTop: safeTop, backgroundColor: S.headerBg, borderBottomColor: S.border }]}>
          <SkinHeaderFX accent={S.accent} accent2={S.accent2} accent3={S.accent3} stripe={S.stripe} fxKey="BH" still={!S.headerGlow} />
      <View style={{ height:3, backgroundColor:PURP }} />
      <Animated.View pointerEvents="none" style={[BH.scan, { transform:[{ translateX:scanX }] }]} />
      <View style={BH.body}>
        <View style={{ flex:1, gap:4 }}>
          <Text style={BH.eye}>LOCAL OLLAMA · PRIVATE · ZERO CLOUD</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <MaterialCommunityIcons name="robot-happy" size={18} color={PURP} />
            <Text style={BH.title}>BUTLER <Text style={{ color:PURP }}>AI</Text></Text>
          </View>
          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap' }}>
            <View style={[BH.pill, { borderColor:cc+'70', backgroundColor:cc+'10' }]}>
              <PulseDot color={cc} size={5} />
              <Text style={[BH.pTxt, { color:cc }]}>{isConn ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
            {model ? (
              <View style={[BH.pill, { borderColor:PURP+'50', backgroundColor:PURP+'08' }]}>
                <MaterialCommunityIcons name="brain" size={9} color={PURP} />
                <Text style={[BH.pTxt, { color:PURP }]}>{model.split(':')[0].toUpperCase()}</Text>
              </View>
            ) : null}
            {msgCount > 0 && (
              <View style={[BH.pill, { borderColor:DIM+'60', backgroundColor:DIM+'20' }]}>
                <Text style={[BH.pTxt, { color:MID }]}>{msgCount} MSG</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:6 }}>
          <View style={{ flexDirection:'row', alignItems:'baseline', gap:1 }}>
            <Text style={[BH.cBig, { color:TEXT }]}>{hh}</Text>
            <Text style={[BH.cSec, { color:PURP }]}>{ss}</Text>
          </View>
          <View style={{ flexDirection:'row', gap:8 }}>
            <TouchableOpacity onPress={onHistory} activeOpacity={0.8}
              hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="history" size={18} color={MID} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClear} activeOpacity={0.8}
              hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="delete-sweep" size={18} color={RED + '90'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={{ height:2, backgroundColor:PURP+'30' }} />
    </View>
  );
});
const BH = StyleSheet.create({
  root: { backgroundColor:'#0B0F17', overflow:'hidden' },
  scan: { position:'absolute', top:0, bottom:0, width:80, backgroundColor:PURP+'06' },
  body: { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:14, paddingTop:11, paddingBottom:12, gap:10, zIndex:1 },
  eye:  { fontFamily:MONO, fontSize:7.5, color:PURP+'60', letterSpacing:1.8, fontWeight:'700' },
  title:{ fontSize:22, fontWeight:'900', color:'#FFF' },
  pill: { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:9, paddingVertical:4 },
  pTxt: { fontFamily:MONO, fontSize:9, fontWeight:'900' },
  cBig: { fontFamily:MONO, fontSize:22, fontWeight:'900', letterSpacing:1 },
  cSec: { fontFamily:MONO, fontSize:14, fontWeight:'900' },
});

// ── Mode bar ──────────────────────────────────────────────────────
const ModeBar = memo(({ mode, onChange }: { mode: string; onChange: (m: string) => void }) => {
  const skin = useSkin();
  const modeColor = (key: string) => key === 'code' ? skin.accent : key === 'system' ? skin.ok : skin.accent3;
  return (
  <View style={{ flexDirection:'row', backgroundColor:skin.panel, borderBottomWidth:1, borderBottomColor:skin.border+'50' }}>
    {MODES.map(m => {
      const active = mode === m.key;
      const color = modeColor(m.key);
      return (
        <TouchableOpacity key={m.key} onPress={() => { haptics.light(); onChange(m.key); }} activeOpacity={0.8}
          style={{ flex:1, alignItems:'center', paddingVertical:9, gap:2,
            borderBottomWidth:2, borderBottomColor: active ? color : 'transparent' }}>
          <MaterialCommunityIcons name={m.icon as any} size={14} color={active ? color : skin.mid} />
          <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', color: active ? color : skin.mid, letterSpacing:0.4 }}>
            {m.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
  );
});

// ── Session history modal ─────────────────────────────────────────
const HistoryModal = memo(({ visible, sessions, onSelect, onNew, onClose }: {
  visible:boolean; sessions:{id:string; title:string; count:number; ts:number}[];
  onSelect:(id:string)=>void; onNew:()=>void; onClose:()=>void;
}) => {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor:SURF, borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'70%' }}>
          <View style={{ height:3, backgroundColor:PURP }} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:16 }}>
            <MaterialIcons name="history" size={18} color={PURP} />
            <Text style={{ fontFamily:MONO, fontSize:15, fontWeight:'900', color:TEXT, flex:1 }}>SESSION HISTORY</Text>
            <TouchableOpacity onPress={onNew} activeOpacity={0.8}
              style={{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:10, paddingHorizontal:10, paddingVertical:6, borderColor:GREEN+'60', backgroundColor:GREEN+'10' }}>
              <MaterialIcons name="add" size={14} color={GREEN} />
              <Text style={{ fontFamily:MONO, fontSize:9.5, color:GREEN, fontWeight:'900' }}>NEW</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ padding:4 }}>
              <MaterialIcons name="close" size={20} color={MID} />
            </TouchableOpacity>
          </View>
          {sessions.length === 0 ? (
            <View style={{ alignItems:'center', padding:40, gap:10 }}>
              <MaterialCommunityIcons name="chat-outline" size={40} color={DIM} />
              <Text style={{ fontFamily:MONO, fontSize:12, color:MID }}>No saved sessions yet</Text>
            </View>
          ) : (
            sessions.map((s, i) => {
              const ago = Math.round((Date.now() - s.ts) / 60000);
              const agoStr = ago < 1 ? 'just now' : ago < 60 ? `${ago}m ago` : `${Math.round(ago/60)}h ago`;
              return (
                <TouchableOpacity key={s.id} onPress={() => { onSelect(s.id); onClose(); }} activeOpacity={0.8}
                  style={{ flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:DIM+'50' }}>
                  <View style={{ width:36, height:36, borderRadius:10, borderWidth:1.5, borderColor:PURP+'40', backgroundColor:PURP+'10', alignItems:'center', justifyContent:'center' }}>
                    <MaterialCommunityIcons name="chat-outline" size={16} color={PURP} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'700', color:TEXT }} numberOfLines={1}>{s.title}</Text>
                    <Text style={{ fontFamily:MONO, fontSize:9, color:MID, marginTop:2 }}>{s.count} messages · {agoStr}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={MID} />
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height:20 }} />
        </View>
      </View>
    </Modal>
  );
});

// ── Offline reply generator ───────────────────────────────────────
function offlineReply(text: string, mode: string): string {
  const t = text.toLowerCase();
  if (/hello|hi|hey/.test(t)) return 'Hello! Connect your PC to unlock full local AI via Ollama. Go to PAIR tab.';
  if (/help|what can|capabilities/.test(t)) return 'I can run approved Python scripts, show live PC data when paired, and use the configured local Ollama provider when its runtime status is verified.';
  if (/script|python|code|automat/.test(t)) return 'Tap the FORGE tab to browse 250+ automation scripts. Run them directly on your paired PC with one tap.';
  if (/pair|connect|qr/.test(t)) return 'Run butler_server.py on your PC, then tap PAIR tab and scan the QR code. Auto-setup handles everything.';
  if (/security|safe|private|encrypt/.test(t)) return 'Butler will show encryption and transport status only after the paired PC reports verified runtime evidence. Sensitive local values fail closed when the encryption key is unavailable; no security status is inferred from a label.';
  if (/memory|ram|cpu|disk|performance/.test(t)) return mode === 'system'
    ? 'Pair your PC to get live CPU/RAM/disk data. I can run psutil scripts to analyze performance in detail.'
    : 'Go to HOME to see your PC system metrics in real time once paired.';
  if (/ollama|model|llm|ai/.test(t)) return 'Butler uses the paired PC provider reported by the server. The selected model, local-only state, and availability must be read from the live Ollama health response; Butler will not invent a model or claim a cloud setting it has not verified.';
  return 'Pair your PC first for full Butler AI. I have 250+ scripts, system monitoring, file transfer, and a local AI chat engine ready to go.';
}

// ── Main screen ───────────────────────────────────────────────────
function ButlerInner() {
  const insets = useSafeAreaInsets();
  const skin = useSkin();
  const [messages, setMessages] = useState<Message[]>([
    { id:'sys0', role:'system', content:'Butler AI ready. Pair your PC via QR code to unlock full local AI, script execution, and system monitoring.', ts:Date.now() },
  ]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [isConn, setIsConn]     = useState(false);
  const [model, setModel]       = useState('');
  const [mode, setMode]         = useState('chat');
  const [showHistory, setShowHistory] = useState(false);
  const [draftStage, setDraftStage] = useState('');
  const [workflowSnapshot, setWorkflowSnapshot] = useState<WorkflowSnapshot | null>(null);
  const [sessions] = useState<{id:string; title:string; count:number; ts:number}[]>([]);
  const listRef  = useRef<FlatList<Message>>(null);
  const sendRef  = useRef(false);

  useFocusEffect(useCallback(() => {
    const c = serverConnection.isConnected?.() ?? false;
    setIsConn(c);
    if (c) fetchModel();
  }, []));

  const fetchModel = async () => {
    try {
      if (!serverConnection.isConnected()) return;
      const res = await serverConnection.request('/api/ollama/models');
      if (res.ok) {
        const d = await res.json();
        const list: string[] = Array.isArray(d) ? d : (d.models ?? []);
        const priority = ['qwen2.5-coder','qwen2.5','mistral','llama3.2','llama3','codellama','phi'];
        const best = priority.find(p => list.some(m => m.toLowerCase().includes(p))) || list[0] || '';
        setModel(best);
      }
    } catch {}
  };

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const sendMessage = useCallback(async (content?: string) => {
    const text = (content || input).trim();
    if (!text || sendRef.current) return;
    sendRef.current = true;
    haptics.medium();
    const concierge = mode === 'code' || /\b(script|python|automate|automation|backup|rename|monitor|watch|download|organize)\b/i.test(text)
      ? buildScriptConcierge(text)
      : null;
    const automationRequested = isAutomationRequest(text);
    let automationPlan: AutomationPlan | undefined;
    let workflowId = '';
    setInput('');
    if (automationRequested) setDraftStage('INTENT · parsing the requested automation into a bounded local workflow…');
    const userMsg: Message = { id:Date.now().toString(), role:'user', content:text, ts:Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    scrollToEnd();

    try {
      if (concierge?.risk === 'blocked') {
        setMessages(prev => [...prev, { id:Date.now().toString(), role:'assistant', content:concierge.explanation, ts:Date.now() }]);
        haptics.warning?.();
      } else {
        if (automationRequested) {
          const started = await automationWorkflowMonitor.begin('Android accepted an automation request; no script has run.');
          workflowId = started.correlationId;
          setWorkflowSnapshot(started);
          automationPlan = createAutomationPlanPreview(text);
          setDraftStage('PATTERN · matching reviewed local automation patterns and Script Library candidates…');
          const patternMatches = await automationMemoryVault.findPatterns(text, 5);
          setWorkflowSnapshot(await automationWorkflowMonitor.advance(workflowId, 'pattern_match', `Matched ${patternMatches.length} reviewed local pattern${patternMatches.length === 1 ? '' : 's'}; executable source remains on the PC.`, 'android'));

          if (isConn && automationPlan.state !== 'blocked') {
            try {
              setDraftStage('SAFETY · requesting paired-PC preflight; no script is being executed…');
              setWorkflowSnapshot(await automationWorkflowMonitor.advance(workflowId, 'pc_preflight', 'Paired PC is validating the automation request and its capability boundary.', 'paired_pc'));
              automationPlan = await requestServerAutomationPlan(text);
              const sync = await syncAutomationMemoryManifest();
              if (sync.ok) {
                setWorkflowSnapshot(await automationWorkflowMonitor.advance(workflowId, 'memory_manifest', `Redacted Android memory manifest synced to the paired PC (${sync.acceptedPatterns || 0} patterns).`, 'paired_pc'));
              } else {
                const detail = `Redacted manifest sync deferred: ${String(sync.error || 'unknown error').slice(0, 120)}. No source code, chat text, secret, or approval data was sent.`;
                automationPlan = { ...automationPlan, warnings: [...automationPlan.warnings, detail] };
                setWorkflowSnapshot(await automationWorkflowMonitor.advance(workflowId, 'memory_manifest', detail, 'android'));
              }
            } catch (planError: any) {
              automationPlan = {
                ...automationPlan,
                state: 'failed',
                warnings: [...automationPlan.warnings, `Server plan unavailable: ${String(planError?.message || 'request failed').slice(0, 120)}`],
                nextStep: 'Check the paired server, then retry the request. No script has been created or executed.',
              };
              setWorkflowSnapshot(await automationWorkflowMonitor.fail(workflowId, `Paired-PC preflight failed: ${String(planError?.message || 'request failed').slice(0, 120)}`));
            }
          } else if (!isConn) {
            setWorkflowSnapshot(await automationWorkflowMonitor.fail(workflowId, 'PC is not paired; Butler can discuss a draft but cannot create a server-verified workflow.', true));
          }

          await automationMemoryVault.rememberPlan(automationPlan!, patternMatches.map(pattern => pattern.id));
          if (automationPlan.state !== 'blocked' && automationPlan.state !== 'failed' && isConn) {
            setWorkflowSnapshot(await automationWorkflowMonitor.advance(workflowId, 'draft_ready', 'Server plan is ready for a reviewed draft; no execution authority was created.', 'paired_pc'));
          }
          setDraftStage('DRAFT · plan stored in encrypted automation memory; Script Library review is next…');
          setMessages(prev => [...prev, {
            id: `plan-${Date.now()}`,
            role: 'assistant',
            content: formatAutomationPlan(automationPlan!),
            ts: Date.now(),
            automationPlan,
          }]);
          scrollToEnd();
          if (automationPlan.state === 'blocked' || automationPlan.state === 'failed') {
            haptics.warning?.();
            return;
          }
          if (isConn) {
            setWorkflowSnapshot(await automationWorkflowMonitor.advance(workflowId, 'script_library_handoff', 'Automation plan is ready for Script Library review, AST lint, and dry-run.', 'android', 'completed'));
          }
        }
        if (!isConn) {
        await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
        const reply = concierge
          ? [
              concierge.explanation,
              concierge.matches.length > 0 ? `Closest local matches:\n${concierge.matches.slice(0, 3).map((hit, i) => `${i + 1}. ${hit.script.title} — ${hit.script.description}`).join('\\n')}` : '',
              concierge.questions.length > 0 ? `To make it exact, tell me:\n${concierge.questions.map(q => `• ${q}`).join('\\n')}` : 'Pair the PC when you want me to draft and verify the next step.',
            ].filter(Boolean).join('\\n\\n')
          : offlineReply(text, mode);
        setMessages(prev => [...prev, { id:Date.now().toString(), role:'assistant', content:reply, ts:Date.now() }]);
        haptics.success();
      } else {
        if (automationRequested) setDraftStage('DRAFT · sending the reviewed plan to local Butler for a draft only…');
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 35000);
          const sysPrompt = mode === 'code'
          ? 'You are an expert Python coder and system administrator. Always provide working code. Use the supplied Script Concierge brief as preflight context; answer its clarification questions before drafting, prefer an existing local match, and never execute or claim a successful run without a Flow Ledger receipt. For automation requests, produce only a reviewable draft and state prerequisites; never claim installation, download, account, social, or external actions were performed.'
          : mode === 'system'
          ? 'You are a system administrator AI. Be precise, technical, and include actionable commands.'
          : 'You are Butler AI — a helpful, private, local PC assistant. Be concise and practical.';
        const conversation = messages.slice(-12)
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }));
          const res = await serverConnection.request('/api/butler/chat', {
          method:'POST',
          body: JSON.stringify({ message: text, conversation, systemPrompt: sysPrompt, automationPlan: automationPlan ? {
            planId: automationPlan.planId,
            risk: automationPlan.risk,
            state: automationPlan.state,
            prerequisites: automationPlan.prerequisites.map(item => item.label),
            warnings: automationPlan.warnings,
            requiresExplicitApproval: automationPlan.requiresExplicitApproval,
          } : undefined, scriptConcierge: concierge ? {
            mode: concierge.mode,
            risk: concierge.risk,
            intent: concierge.intent,
            matches: concierge.matches.slice(0, 3).map(hit => ({ id: hit.script.id, title: hit.script.title, description: hit.script.description, category: hit.script.category, reasons: hit.reasons })),
            questions: concierge.questions,
            generationBrief: concierge.generationBrief,
          } : undefined }),
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || d.message || `Server error ${res.status}`);
        const reply = (d.reply || d.content || d.message || '').trim() || 'Done.';
        setMessages(prev => [...prev, { id:Date.now().toString(), role:'assistant', content:reply, ts:Date.now() }]);
        haptics.success();
      }
      }
    } catch (e: any) {
      const err = e?.name==='AbortError' ? 'Request timed out (35s)' : (e?.message?.slice(0,100) || 'Request failed');
      setMessages(prev => [...prev, { id:Date.now().toString(), role:'assistant', content:'Error: ' + err, ts:Date.now() }]);
    } finally {
      setDraftStage('');
      sendRef.current = false;
      setSending(false);
      scrollToEnd();
    }
  }, [input, isConn, mode, messages, scrollToEnd]);

  const clearChat = useCallback(() => {
    haptics.medium();
    setMessages([{ id:'sys'+Date.now(), role:'system', content:'Session cleared. Butler AI ready.', ts:Date.now() }]);
  }, []);

  const activeMode = MODES.find(m => m.key === mode) ?? MODES[0];
  const modeColor = mode === 'code' ? skin.accent : mode === 'system' ? skin.ok : skin.accent3;
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const isEmpty = userMsgCount === 0;
  // Long context warning: Ollama sends the full history on every request.
  // After 15 user turns the context window grows large and responses slow down.
  const isLongContext = userMsgCount >= 15;

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MsgBubble msg={item} activeMode={mode} skin={skin} />
  ), [mode, skin]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <View style={{ flex:1, backgroundColor:skin.bg }}>
      <ButlerAtmosphere accent={skin.accent} intensity={0.12} />
      <ButlerMicrocopy accent={skin.accent} text="The first local-model reply may take longer while the provider warms up." icon="robot-outline" />
      <ButlerHeader
        safeTop={insets.top} isConn={isConn} model={model}
        msgCount={userMsgCount} onClear={clearChat}
        onHistory={() => setShowHistory(true)} />
      <ButlerEvidenceStrip model={model} approvalPending={workflowSnapshot?.stage === 'approval_required'} receiptRecorded={workflowSnapshot?.stage === 'receipt'} />
      <ButlerPageStudioHost pageId="chat" />
      <ModeBar mode={mode} onChange={setMode} />
      <ButlerFlowLedgerCard snapshot={workflowSnapshot} />
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:12, paddingVertical:8, backgroundColor:SURF2, borderBottomWidth:1, borderBottomColor:DIM+'45' }}>
        <View style={{ borderWidth:1.5, borderRadius:20, paddingHorizontal:9, paddingVertical:4, borderColor:modeColor+'55', backgroundColor:modeColor+'10' }}>
          <Text style={{ fontFamily:MONO, fontSize:8.5, color:modeColor, fontWeight:'900', letterSpacing:0.5 }}>
            {activeMode.label} MODE
          </Text>
        </View>
        <Text numberOfLines={1} style={{ flex:1, fontFamily:MONO, fontSize:8.5, color:MID, lineHeight:13 }}>
          {activeMode.desc}
        </Text>
        <TouchableOpacity onPress={() => setShowHistory(true)} activeOpacity={0.8}
          style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:10, paddingHorizontal:8, paddingVertical:6, borderColor:CYAN+'45', backgroundColor:CYAN+'0C' }}>
          <MaterialIcons name="history" size={13} color={CYAN} />
          <Text style={{ fontFamily:MONO, fontSize:8, color:CYAN, fontWeight:'900' }}>HISTORY</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearChat} activeOpacity={0.8}
          style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:10, paddingHorizontal:8, paddingVertical:6, borderColor:RED+'45', backgroundColor:RED+'0A' }}>
          <MaterialIcons name="delete-sweep" size={13} color={RED} />
          <Text style={{ fontFamily:MONO, fontSize:8, color:RED, fontWeight:'900' }}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      {/* Long context warning — shown when conversation history grows large */}
      {isLongContext && (
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:12, paddingVertical:8,
          backgroundColor: AMBER+'12', borderBottomWidth:1.5, borderBottomColor: AMBER+'40' }}>
          <MaterialIcons name="warning" size={14} color={AMBER} />
          <Text style={{ fontFamily:MONO, fontSize:9.5, color:AMBER, flex:1, lineHeight:14 }}>
            {'LONG CONTEXT · '}
            <Text style={{ fontWeight:'900' }}>{userMsgCount} turns</Text>
            {' sent with every request — AI will slow down. Clear chat to speed up.'}
          </Text>
          <TouchableOpacity onPress={clearChat} activeOpacity={0.8}
            style={{ borderWidth:1.5, borderRadius:8, paddingHorizontal:8, paddingVertical:4,
              borderColor:AMBER+'60', backgroundColor:AMBER+'10' }}>
            <Text style={{ fontFamily:MONO, fontSize:8.5, color:AMBER, fontWeight:'900' }}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : 'height'}>
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop:12, paddingBottom:6 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          ListFooterComponent={draftStage
            ? <DraftingPipeline stage={draftStage} snapshot={workflowSnapshot} accent={modeColor} panel={skin.panel2} />
            : sending ? <TypingDots color={modeColor} background={skin.panel2} mascot={skin.mascot} /> : null}
          onContentSizeChange={scrollToEnd}
        />

        {/* Suggestions when empty */}
        {isEmpty && !sending && (
          <View style={{ paddingHorizontal:12, paddingBottom:10 }}>
            <Text style={{ fontFamily:MONO, fontSize:8.5, color:PURP+'60', letterSpacing:1.5, textAlign:'center', marginBottom:10 }}>
              SUGGESTED PROMPTS
            </Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, justifyContent:'center' }}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => sendMessage(s.text)} activeOpacity={0.8}
                  style={{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:11, paddingVertical:7, borderColor:PURP+'35', backgroundColor:PURP+'08' }}>
                  <MaterialCommunityIcons name={s.icon as any} size={11} color={PURP+'80'} />
                  <Text style={{ fontFamily:MONO, fontSize:10, color:PURP+'BB' }}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={[IB.root, { paddingBottom: Math.max(insets.bottom+6, 10), borderTopColor: modeColor+'20' }]}>
          {/* Mode indicator strip */}
          <View style={{ flexDirection:'row', justifyContent:'center', gap:16, marginBottom:7 }}>
            {[
              isConn ? 'PC LINK VERIFIED' : 'PC OFFLINE',
              model ? `OLLAMA · ${model.split(':')[0].toUpperCase()}` : 'OLLAMA UNVERIFIED',
              'LOCAL DATA STATUS IN SETTINGS',
            ].map((label, i) => (
              <Text key={i} numberOfLines={1} style={{ fontFamily:MONO, fontSize:8, color:[isConn ? GREEN : AMBER, model ? PURP : AMBER, CYAN][i]+'70', fontWeight:'900', flexShrink:1 }}>
                {label}
              </Text>
            ))}
          </View>

          <View style={[IB.row, { borderColor: input.trim() ? modeColor+'60' : DIM+'50' }]}>
            {/* Mode icon */}
            <MaterialCommunityIcons name={MODES.find(m => m.key === mode)?.icon as any ?? 'chat'} size={16} color={modeColor+'80'} />

            {/* Input field */}
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={isConn
                ? `[${mode.toUpperCase()}] Ask Butler anything…`
                : 'Pair PC or ask Butler offline…'}
              placeholderTextColor={MID}
              style={IB.input}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
              blurOnSubmit={false}
              editable={!sending}
              multiline
              maxLength={1200}
            />

            {/* Char counter (shows when typing) */}
            {input.length > 100 && (
              <Text style={{ fontFamily:MONO, fontSize:8, color:MID, alignSelf:'flex-end', paddingBottom:2 }}>
                {input.length}
              </Text>
            )}

            {/* Voice button (placeholder) */}
            <TouchableOpacity onPress={() => haptics.light()} activeOpacity={0.8}
              style={{ padding:2 }} disabled={sending}>
              <MaterialIcons name="mic-none" size={18} color={sending ? DIM : modeColor + '60'} />
            </TouchableOpacity>

            {/* Send */}
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!input.trim() || sending}
              activeOpacity={0.85}
              style={[IB.send, {
                backgroundColor: input.trim() && !sending ? modeColor : DIM + '50',
                borderColor: input.trim() && !sending ? modeColor : DIM,
              }]}>
              {sending
                ? <ActivityIndicator size="small" color={modeColor} style={{ transform:[{ scale:0.75 }] }} />
                : <MaterialIcons name="send" size={16} color={input.trim() ? '#000' : MID} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Session history modal */}
      <HistoryModal
        visible={showHistory}
        sessions={sessions}
        onSelect={() => {}}
        onNew={clearChat}
        onClose={() => setShowHistory(false)}
      />
    </View>
  );
}
const IB = StyleSheet.create({
  root:  { backgroundColor:SURF, borderTopWidth:1.5, paddingTop:8, paddingHorizontal:12 },
  row:   { flexDirection:'row', alignItems:'flex-end', gap:8, borderWidth:1.5, borderRadius:16, paddingHorizontal:12, paddingVertical:9, backgroundColor:BG },
  input: { flex:1, fontFamily:MONO, fontSize:13, color:TEXT, padding:0, maxHeight:110, includeFontPadding:false },
  send:  { width:40, height:40, borderRadius:13, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
});

export default function ButlerScreen() {
  return <TabErrorBoundary name="Butler"><ButlerInner /></TabErrorBoundary>;
}
