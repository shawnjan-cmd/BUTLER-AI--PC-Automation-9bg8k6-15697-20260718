/**
 * BUTLER AI — NEXUS COMMAND CONSOLE v8.0
 * Complete redesign: hero header, clean bubbles, no auto-focus zoom,
 * rich subtext throughout, consistent NCX design language.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
  Animated, Dimensions, Modal, Pressable, Easing, FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeSetClipboard } from '@/services/safeClipboard';
import ButlerWelcomeHub from '@/components/ui/ButlerWelcomeHub';
import NexusQuickChipsComponent, { BUTLER_DEFAULT_CHIPS } from '@/components/butler/NexusQuickChips';
import { Image } from 'expo-image';
import ButlerLogo from '@/components/ButlerLogo';
import { PageMascot } from '@/components/ui/PageMascot';
import { encryptedStorage } from '@/services/encryptedStorage';
import { haptics } from '@/services/haptics';
import { logger } from '@/utils/logger';
import { useCosmetic } from '@/contexts/CosmeticContext';
import { useChatHistory } from '@/hooks/useChatHistory';
import { buildHistoryOnly } from '@/utils/contextManager';
import { BUTLER_KNOWLEDGE_COMPACT, BUTLER_STYLE_GUIDE } from '@/constants/butlerKnowledge';
import { serverConnection } from '@/services/serverConnection';
import { serverMetrics } from '@/services/serverMetrics';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { saveButlerScript } from '@/services/butlerScripts';
import { nexusBridge } from '@/services/nexusBridge';
import { autoResearch } from '@/services/autoResearch';
import { knowledgeGrowthEngine } from '@/services/knowledgeGrowthEngine';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { useConnectionStatus } from '@/hooks/useConnection';
import { PerformanceMonitorWidget } from '@/components/ui/PerformanceMonitorWidget';
import AutomationFeed from '@/components/home/AutomationFeed';
import { personalMemory } from '@/services/personalMemory';
import { useIsFocused } from '@react-navigation/native';
import { useResponsive } from '@/utils/responsive';

const { width: SW } = Dimensions.get('window');
const MONO: any    = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any    = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ── ASSET GUARDS ─────────────────────────────────────────────────────────────
let MASCOT_IMG: any = null;
try { MASCOT_IMG = require('@/assets/images/mascot_shield_v2.png'); } catch {
  try { MASCOT_IMG = require('@/assets/images/mascot_shield.png'); } catch {}
}
let BG_GRID: any = null;
try { BG_GRID = require('@/assets/images/nexus-circuit-grid.jpg'); } catch {}

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg:          '#020810',
  surface:     '#060F1C',
  card:        '#09142A',
  cyan:        '#00E5FF',
  cyanDim:     'rgba(0,229,255,0.08)',
  green:       '#00FF88',
  greenDim:    'rgba(0,255,136,0.08)',
  amber:       '#FFB020',
  amberDim:    'rgba(255,176,32,0.08)',
  purple:      '#CC44FF',
  purpleDim:   'rgba(204,68,255,0.08)',
  red:         '#FF3344',
  blue:        '#4499FF',
  teal:        '#00CCBB',
  text:        '#D4E8F6',
  textBright:  '#EEF4FF',
  textMid:     '#6A8EA8',
  textDim:     '#2A4060',
  border:      'rgba(0,229,255,0.12)',
  borderHi:    'rgba(0,229,255,0.28)',
};

// ── SHARED MICRO-COMPONENTS ───────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isFocused]);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function Pill({ label, color, icon, iconLib = 'material' }: {
  label: string; color: string; icon?: string; iconLib?: 'material' | 'community';
}) {
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3, borderColor: color + '40', backgroundColor: color + '0A' }}>
      {icon && <Icon name={icon as any} size={9} color={color} />}
      <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color, letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

// ── HERO HEADER ───────────────────────────────────────────────────────────────
function ButlerHeroHeader({
  isConnected, safeTop, accentColor, memoryCount, activeModel,
  onClear, onBuildScript, onCommandPalette,
}: {
  isConnected: boolean; safeTop: number; accentColor: string;
  memoryCount: number; activeModel: string;
  onClear: () => void; onBuildScript: () => void; onCommandPalette: () => void;
}) {
  const pr = accentColor;
  const connCol = isConnected ? C.green : C.red;
  const glowA   = useRef(new Animated.Value(0.4)).current;
  const shimX   = useRef(new Animated.Value(-80)).current;
  const isFocusedHero = useIsFocused();
  const { rf, rs, isSmall, isCompactHeight } = useResponsive();

  useEffect(() => {
    if (!isFocusedHero) return;
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(glowA, { toValue: 1,   duration: 1600, useNativeDriver: false }),
        Animated.timing(glowA, { toValue: 0.2, duration: 1600, useNativeDriver: false }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(shimX, { toValue: SW + 80, duration: 2800, useNativeDriver: false }),
        Animated.timing(shimX, { toValue: -80,     duration: 0,    useNativeDriver: false }),
        Animated.delay(4000),
      ]), { iterations: 3 }),
    ];
    loops.forEach(l => l.start());
    return () => { loops.forEach(l => l.stop()); };
  }, [isFocusedHero]);

  const borderC = glowA.interpolate({ inputRange: [0, 1], outputRange: [pr + '30', pr + '90'] });
  const modelLbl = activeModel
    ? activeModel.split(':')[0].slice(0, 12).toUpperCase()
    : (isConnected ? '...' : 'OFFLINE');

  return (
    <Animated.View style={[hero.outer, { borderColor: borderC, paddingTop: safeTop }]}>
      {/* Shimmer sweep */}
      <Animated.View pointerEvents="none"
        style={[hero.shimmer, { transform: [{ translateX: shimX }, { skewX: '-14deg' }] }]} />

      {/* 5-color accent strip */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[C.cyan, C.purple, C.amber, C.green, '#FF6EB4'].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      {/* COMPACT single-row layout */}
      <View style={hero.topRow}>
        {/* Robot-love mascot — themed green · floats beside avatar */}
        <PageMascot page="butler" size="sm" showBubble />
        {/* Small robot avatar */}
        <View style={[hero.avatarBox, { width: isSmall ? 30 : 36, height: isSmall ? 30 : 36 }]}>
          <ButlerLogo size={isSmall ? 30 : 36} animated={false} showText={false} glowColor={pr} />
          <View style={{ position:'absolute', bottom:0, right:0 }}>
            <PulseDot color={connCol} size={6} />
          </View>
        </View>

        {/* Title + subtitle — single line */}
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[hero.titleText, { fontSize: rf(isSmall ? 13 : 16) }]} numberOfLines={1}>
              BUTLER <Text style={{ color: pr }}>AI</Text>
            </Text>
            <View style={[hero.connPill, { borderColor: connCol + '55', backgroundColor: connCol + '0C' }]}>
              <PulseDot color={connCol} size={5} />
              <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: connCol }}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            {modelLbl !== 'OFFLINE' && modelLbl !== '...' ? (
              <View style={[hero.modelPill, { borderColor: pr + '40', backgroundColor: pr + '08' }]}>
                <MaterialCommunityIcons name="brain" size={8} color={pr} />
                <Text style={{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: pr + 'CC' }}
                  numberOfLines={1}>{modelLbl}</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontFamily: MONO, fontSize: rf(8), color: C.textDim, letterSpacing: 0.8 }} numberOfLines={1}>
            {isConnected ? `AI CMD CTR · LAN ONLY · ZERO CLOUD` : `PAIR PC FROM HOME · OLLAMA · NO CLOUD`}
          </Text>
        </View>

        {/* Action buttons — compact column */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <TouchableOpacity onPress={() => { haptics.light(); onBuildScript(); }}
            style={[hero.iconBtn, { borderColor: pr + '55', backgroundColor: pr + '10' }]}
            hitSlop={{top:8,bottom:8,left:8,right:8}} activeOpacity={0.78}>
            <MaterialIcons name="code" size={14} color={pr} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptics.light(); onCommandPalette(); }}
            style={[hero.iconBtn, { borderColor: C.amber + '55', backgroundColor: C.amber + '08' }]}
            hitSlop={{top:8,bottom:8,left:8,right:8}} activeOpacity={0.78}>
            <MaterialCommunityIcons name="console" size={13} color={C.amber} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptics.heavy(); onClear(); }}
            style={[hero.iconBtn, { borderColor: C.red + '40', backgroundColor: C.red + '07' }]}
            hitSlop={{top:8,bottom:8,left:8,right:8}} activeOpacity={0.78}>
            <MaterialIcons name="delete-sweep" size={14} color={C.red + '80'} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const hero = StyleSheet.create({
  outer: {
    borderBottomWidth: 1.5, backgroundColor: '#030A18', overflow: 'hidden',
    ...Platform.select({ ios:{ shadowColor:'#00E5FF',shadowOffset:{width:0,height:3},shadowOpacity:0.15,shadowRadius:10 }, android:{elevation:6} }),
  },
  shimmer:   { position:'absolute', left:0, right:0, top:0, bottom:0, width:90, backgroundColor:'rgba(255,255,255,0.025)', zIndex:4 },
  topRow:    { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:9, gap:9 },
  avatarBox: { width:36, height:36, position:'relative', flexShrink:0 },
  titleText: { fontFamily:MONO, fontSize:16, fontWeight:'900', color:'#FFFFFF', letterSpacing:1 },
  iconBtn:   { width:30, height:30, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  connPill:  { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:8, paddingHorizontal:7, paddingVertical:3 },
  modelPill: { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:2, maxWidth:90 },
});

// ── CHAT MODE BAR ─────────────────────────────────────────────────────────────
const MODES = [
  { id: 'general' as const, label: 'GENERAL',  sub: 'All-round helper',      icon: 'chat',        color: C.cyan   },
  { id: 'code'    as const, label: 'CODE',      sub: 'Python scripting',      icon: 'code',        color: C.green  },
  { id: 'debug'   as const, label: 'DEBUG',     sub: 'Error analysis',        icon: 'bug-report',  color: C.amber  },
  { id: 'analyze' as const, label: 'ANALYZE',   sub: 'Deep reasoning',        icon: 'analytics',   color: C.purple },
];
const MODE_PROMPTS: Record<string, string> = {
  general: '',
  code:    'CODE MODE: Respond with clean, production-ready Python only. Always include try/except error handling.',
  debug:   'DEBUG MODE: Analyze errors step-by-step. Show root cause, traceback explanation, and corrected code.',
  analyze: 'ANALYZE MODE: Break down requests methodically. Show reasoning, data sources, pros/cons, then recommendations.',
};

function ModeBar({ activeMode, onSelect }: {
  activeMode: typeof MODES[number]['id'];
  onSelect: (m: typeof MODES[number]['id']) => void;
}) {
  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, backgroundColor: C.surface }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection:'row', paddingHorizontal:10, paddingVertical:5, gap:5 }}>
        {MODES.map(m => {
          const active = activeMode === m.id;
          const scaleA = new Animated.Value(1);
          const flashA = new Animated.Value(0);
          return (
            <Pressable key={m.id}
              onPressIn={() => Animated.spring(scaleA, { toValue:0.90, tension:400, friction:10, useNativeDriver:true }).start()}
              onPressOut={() => Animated.spring(scaleA, { toValue:1, tension:280, friction:10, useNativeDriver:true }).start()}
              onPress={() => {
                haptics.selection();
                onSelect(m.id);
                flashA.setValue(1);
                Animated.timing(flashA, { toValue:0, duration:300, useNativeDriver:true }).start();
              }}
            >
              <Animated.View style={[{
                flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:16,
                paddingHorizontal:9, paddingVertical:5,
                transform:[{scale:scaleA}],
                borderColor: active ? m.color : m.color + '30',
                backgroundColor: active ? m.color + '15' : 'transparent',
              }]}>
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
                  borderRadius:16, backgroundColor:m.color, opacity:flashA,
                }]} />
                <MaterialIcons name={m.icon as any} size={10} color={active ? m.color : m.color + '55'} />
                <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.5,
                  color: active ? m.color : m.color + '55' }}>{m.label}</Text>
                {active && <View style={{ width:3, height:3, borderRadius:2, backgroundColor:m.color }} />}
              </Animated.View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── EMPTY STATE HERO ─────────────────────────────────────────────────────────
function PrivacyWhy({ accent }: { accent: string }) {
  const items = [
    { icon:'visibility-off', label:'Zero Telemetry',   sub:'No analytics, no crash reports, no usage data collected ever',  color:'#00FF88'  },
    { icon:'wifi',           label:'LAN Only',          sub:'Your phone talks only to your PC — never to any internet server', color:'#00CCBB'  },
    { icon:'memory',         label:'Your Hardware',     sub:'Ollama AI model runs on your own CPU/GPU — no cloud needed',     color:'#CC44FF'  },
    { icon:'gpp-good',       label:'No Subscriptions',  sub:'Free forever — no API keys, no monthly fees, no lock-in',       color: accent    },
  ];
  return (
    <View style={{ marginHorizontal:14, marginBottom:12 }}>
      <View style={{ borderWidth:2, borderRadius:16, borderColor:'#00FF8840', backgroundColor:'rgba(0,255,136,0.03)', overflow:'hidden' }}>
        <View style={{ height:2.5, backgroundColor:'#00FF88' }} />
        <View style={{ padding:14, gap:12 }}>
          <View style={{ gap:4 }}>
            <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:'#00FF88', letterSpacing:2 }}>PRIVACY FIRST</Text>
            <Text style={{ fontFamily:SANS, fontSize:15, fontWeight:'700', color:'#FFFFFF', lineHeight:22 }}>
              Your data stays <Text style={{ color:accent, fontWeight:'900' }}>100% on your device</Text>.
            </Text>
            <Text style={{ fontFamily:SANS, fontSize:12, color:'#6A8EA8', lineHeight:18 }}>
              {'Unlike ChatGPT, Gemini, or Copilot — Butler AI never uploads your conversations, files, or PC data anywhere. There is no company server to breach because nothing leaves your home.'}
            </Text>
          </View>
          <View style={{ height:1, backgroundColor:'rgba(0,255,136,0.12)' }} />
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
            {items.map(({ icon, label, sub, color }) => (
              <View key={label} style={{ flexDirection:'row', alignItems:'flex-start', gap:8, width:'47%',
                borderWidth:1, borderRadius:10, padding:9, borderColor:color + '35', backgroundColor:color + '07' }}>
                <MaterialIcons name={icon as any} size={14} color={color} style={{ marginTop:1 }} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color, letterSpacing:0.3 }}>{label}</Text>
                  <Text style={{ fontFamily:SANS, fontSize:10, color:'#6A8EA8', lineHeight:14, marginTop:1 }}>{sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyHero({ accent, memoryCount, isConnected, onSendPrompt }: {
  accent: string; memoryCount: number; isConnected: boolean;
  onSendPrompt: (text: string) => void;
}) {
  const pr     = accent;
  const floatA = useRef(new Animated.Value(0)).current;
  const glowA  = useRef(new Animated.Value(0.3)).current;
  const scanA  = useRef(new Animated.Value(0)).current;

  const isFocusedEmpty = useIsFocused();
  useEffect(() => {
    if (!isFocusedEmpty) return;
    const l1 = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ]));
    const l2 = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
    ]));
    l1.start(); l2.start();
    const l3 = Animated.loop(Animated.timing(new Animated.Value(0), { toValue: 1, duration: 100, useNativeDriver: true }));
    return () => { l1.stop(); l2.stop(); };
  }, [isFocusedEmpty]);

  const floatY  = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const borderC = glowA.interpolate({ inputRange: [0, 1], outputRange: [pr + '30', pr + '90'] });

  return (
    <View style={{ paddingBottom: 8 }}>
      {/* BIG HERO WELCOME CARD */}
      <View style={{ marginHorizontal:14, marginTop:14, marginBottom:12,
        backgroundColor:'#030A18', borderRadius:20, borderWidth:2, overflow:'hidden',
        borderColor: pr + '40',
        ...Platform.select({ ios:{ shadowColor:pr, shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:24 }, android:{elevation:12} }) }}>
        <View style={{ height:3, flexDirection:'row' }}>
          {[pr, C.green, C.purple, C.amber, C.teal].map((c,i) => (
            <View key={i} style={{ flex:1, backgroundColor:c }} />
          ))}
        </View>
        {/* Header row: robot + title */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:14, padding:18, paddingBottom:14 }}>
          <Animated.View style={{ transform:[{translateY:floatY}], flexShrink:0 }}>
            <ButlerLogo size={86} animated={true} showText={false} glowColor={pr} />
          </Animated.View>
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'700', color:pr + '70', letterSpacing:3, marginBottom:4 }}>AI COMMAND CENTER</Text>
            <Text style={{ fontFamily:MONO, fontSize:24, fontWeight:'900', color:'#FFFFFF', letterSpacing:1, lineHeight:28 }}>
              BUTLER{' '}<Text style={{ color:pr }}>AI</Text>
            </Text>
            <Text style={{ fontFamily:SANS, fontSize:13, color:C.textMid, lineHeight:19, marginTop:4 }}>
              AI automation that runs on your machine. Never in the cloud.
            </Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:20,
                paddingHorizontal:9, paddingVertical:5, borderColor:(isConnected ? C.green : C.red) + '55',
                backgroundColor:(isConnected ? C.green : C.red) + '0C' }}>
                <View style={{ width:5, height:5, borderRadius:3, backgroundColor:isConnected ? C.green : C.red }} />
                <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:isConnected ? C.green : C.red }}>{isConnected ? 'PC ONLINE' : 'PC OFFLINE'}</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:20,
                paddingHorizontal:9, paddingVertical:5, borderColor:C.green + '55', backgroundColor:C.green + '0C' }}>
                <MaterialIcons name="lock" size={9} color={C.green} />
                <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:C.green }}>PRIVATE</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:20,
                paddingHorizontal:9, paddingVertical:5, borderColor:C.amber + '55', backgroundColor:C.amber + '0C' }}>
                <MaterialIcons name="bolt" size={9} color={C.amber} />
                <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:C.amber }}>250+ SCRIPTS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Why Butler value prop */}
        <View style={{ marginHorizontal:18, marginBottom:16, padding:14, borderRadius:12,
          borderWidth:1.5, borderColor:C.green + '35', backgroundColor:C.green + '05' }}>
          <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'700', color:C.green + '80', letterSpacing:2, marginBottom:6 }}>WHY BUTLER AI?</Text>
          <Text style={{ fontFamily:SANS, fontSize:15, fontWeight:'700', color:'#FFFFFF', lineHeight:22 }}>
            Your <Text style={{ color:pr, fontWeight:'900' }}>self-hosted AI</Text>{' '}that controls your PC, and{' '}
            <Text style={{ color:C.green, fontWeight:'900' }}>never sends your data anywhere.</Text>
          </Text>
          <Text style={{ fontFamily:SANS, fontSize:12, color:C.textMid, lineHeight:18, marginTop:8 }}>
            {'Unlike ChatGPT or Gemini, nothing leaves your home network. No API keys. No subscriptions. No surveillance. Your conversations and scripts stay on-device forever.'}
          </Text>
        </View>

        {/* Capabilities 2x3 grid */}
        <View style={{ paddingHorizontal:14, marginBottom:14 }}>
          <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'700', color:pr + '70', letterSpacing:2, marginBottom:10 }}>WHAT I CAN DO FOR YOU</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
            {[
              { icon:'terminal',    label:'Run Python Scripts', sub:'Execute automation code on your PC remotely',       color:C.cyan   },
              { icon:'memory',      label:'Monitor Your PC',    sub:'CPU, RAM, disk and process stats in real time',     color:C.green  },
              { icon:'folder-open', label:'Organize Files',     sub:'Sort, clean and manage files via commands',         color:C.amber  },
              { icon:'wifi',        label:'Network Tools',      sub:'Scan LAN, check ports, clipboard sync',             color:C.purple },
              { icon:'psychology',  label:'Local AI Chat',      sub:'Powered by Ollama on your hardware, zero cloud',   color:pr       },
              { icon:'bolt',        label:'Auto on WiFi',       sub:'Scripts auto-run when you arrive home network',    color:'#FF6EB4' },
            ].map(({ icon, label, sub, color }) => (
              <View key={label} style={{ width:'47%', flexDirection:'row', alignItems:'flex-start', gap:8,
                borderWidth:1, borderRadius:10, padding:10, borderColor:color + '35', backgroundColor:color + '07' }}>
                <MaterialIcons name={icon as any} size={15} color={color} style={{ marginTop:1 }} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color, letterSpacing:0.3 }}>{label}</Text>
                  <Text style={{ fontFamily:SANS, fontSize:10, color:C.textMid, lineHeight:14, marginTop:2 }}>{sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {memoryCount > 0 && (
          <View style={{ marginHorizontal:14, marginBottom:14, flexDirection:'row', alignItems:'center',
            gap:10, borderWidth:1.5, borderRadius:12, padding:12,
            borderColor:C.purple + '50', backgroundColor:C.purple + '0A' }}>
            <View style={{ width:36, height:36, borderRadius:10, borderWidth:1.5, borderColor:C.purple + '60',
              backgroundColor:C.purple + '15', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MaterialIcons name="psychology" size={18} color={C.purple} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:C.purple, letterSpacing:0.5 }}>
                MEMORY ACTIVE — {memoryCount} entries
              </Text>
              <Text style={{ fontFamily:SANS, fontSize:11, color:C.textMid, marginTop:2, lineHeight:16 }}>
                Butler remembers your preferences from past sessions (stored encrypted on-device only)
              </Text>
            </View>
          </View>
        )}

        {/* Quick-start prompt chips */}
        <View style={{ paddingHorizontal:14, paddingBottom:16 }}>
          <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'700', color:pr + '70', letterSpacing:2, marginBottom:10 }}>TAP TO START</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7 }}>
            {[
              { label:'PC Stats',       prompt:'Show my PC CPU, RAM, and disk usage right now' },
              { label:'Clean Temp',     prompt:'Write a Python script to clean all temp files on my PC' },
              { label:'What can you do?', prompt:'Tell me everything you can help me automate on my PC' },
              { label:'Top Processes',  prompt:'Show the top 6 CPU-consuming processes on my PC' },
            ].map(({ label, prompt }) => (
              <Pressable key={label}
                onPress={() => { haptics.medium(); onSendPrompt(prompt); }}
                style={({ pressed }) => [{ flexDirection:'row', alignItems:'center', gap:6, borderWidth:1.5,
                  borderRadius:20, paddingHorizontal:13, paddingVertical:9, borderColor:pr + '55',
                  backgroundColor:pressed ? pr + '18' : pr + '0C' }]}>
                <MaterialIcons name="send" size={11} color={pr} />
                <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'700', color:pr }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <PrivacyWhy accent={pr} />
      <View style={{ marginHorizontal:14, height:1, backgroundColor:C.border }} />
    </View>
  );
}

// ── WAVEFORM TYPING INDICATOR ─────────────────────────────────────────────────
const THINKING = [
  'Attending to your request\u2026',
  'Allow me to think about that\u2026',
  'One moment, sir\u2026',
  'Looking into that now\u2026',
  'Right away\u2026',
];

function TypingIndicator({ accent }: { accent: string }) {
  const bars    = useRef(Array.from({ length: 10 }, () => new Animated.Value(0.15))).current;
  const [phrase, setPhrase] = useState(0);

  useEffect(() => {
    const loops = bars.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 65),
        Animated.timing(a, { toValue: 1,    duration: 260, useNativeDriver:false, easing:Easing.inOut(Easing.sin) }),
        Animated.timing(a, { toValue: 0.15, duration: 260, useNativeDriver:false, easing:Easing.inOut(Easing.sin) }),
        Animated.delay(Math.max(0, (10 - i) * 35)),
      ]))
    );
    loops.forEach(l => l.start());
    const pt = setInterval(() => setPhrase(p => (p + 1) % THINKING.length), 2800);
    return () => { loops.forEach(l => l.stop()); clearInterval(pt); };
  }, []);

  return (
    <View style={[typing.wrap, { borderColor:accent + '40', borderLeftColor:accent,
      ...Platform.select({ ios:{ shadowColor:accent,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:14 }, android:{elevation:8} }) }]}>
      <View style={[typing.topBar, { backgroundColor:accent }]} />
      <View style={typing.inner}>
        <View style={[typing.avatar, { borderColor:accent + '60', backgroundColor:accent + '12' }]}>
          <MaterialIcons name="smart-toy" size={16} color={accent} />
        </View>
        <View style={{ flex:1, gap:5 }}>
          <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:accent, letterSpacing:0.8 }}>
            {THINKING[phrase]}
          </Text>
          <Text style={{ fontFamily:SANS, fontSize:11, color:C.textMid }}>
            Processing with local AI \u2014 no cloud involved
          </Text>
          <View style={{ flexDirection:'row', alignItems:'flex-end', gap:2, height:18 }}>
            {bars.map((a, i) => (
              <Animated.View key={i} style={{
                width:3, borderRadius:2,
                backgroundColor:accent,
                height:a.interpolate({ inputRange:[0.15,1], outputRange:[3,16] }) as any,
                opacity:a.interpolate({ inputRange:[0.15,1], outputRange:[0.3,1] }) as any,
              }} />
            ))}
          </View>
        </View>
        <View style={[typing.badge, { borderColor:accent + '45', backgroundColor:accent + '10' }]}>
          <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:accent }}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}

const typing = StyleSheet.create({
  wrap:   { marginHorizontal:14, marginBottom:12, borderWidth:1.5, borderLeftWidth:4, borderRadius:14,
    backgroundColor:C.card, overflow:'hidden' },
  topBar: { height:2 },
  inner:  { flexDirection:'row', alignItems:'flex-start', gap:10, padding:12 },
  avatar: { width:36, height:36, borderRadius:10, borderWidth:2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  badge:  { borderWidth:1.5, borderRadius:7, paddingHorizontal:7, paddingVertical:4, alignSelf:'flex-start' },
});

// ── MESSAGE BUBBLE ────────────────────────────────────────────────────────────
type Role = 'user' | 'butler' | 'system';
interface Msg {
  id: string; role: Role; content: string; timestamp: number;
  reaction?: string;
  metadata?: { model?: string; responseMs?: number; kbUsed?: number };
}

function MessageBubble({ msg, onCopy, onReact, onSave, isLast, accent, secondary }: {
  msg: Msg; onCopy: (t:string) => void; onReact: (id:string,e:string) => void;
  onSave: (code:string) => void; isLast: boolean; accent: string; secondary: string;
}) {
  const isButler = msg.role === 'butler';
  const isSystem = msg.role === 'system';
  const mountA      = useRef(new Animated.Value(0)).current;
  const glowA       = useRef(new Animated.Value(0.3)).current;
  const bubblePressA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slide + scale in from side
    Animated.spring(mountA, { toValue:1, tension:140, friction:12, useNativeDriver:false }).start();
    if (isLast && isButler) {
      const g = Animated.loop(Animated.sequence([
        Animated.timing(glowA, { toValue:1,   duration:1600, useNativeDriver:false }),
        Animated.timing(glowA, { toValue:0.2, duration:1600, useNativeDriver:false }),
      ]));
      g.start();
      const t = setTimeout(() => g.stop(), 9000);
      return () => clearTimeout(t);
    }
  }, []);

  const codeBlocks = useMemo(() => {
    const blocks: { code: string; lang: string; raw: string }[] = [];
    const re = /```(python|py|bash|sh|javascript|js)?\s*\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(msg.content)) !== null) {
      const code = m[2].trim();
      if (code.length > 5) blocks.push({ code, lang: m[1] || 'python', raw: m[0] });
    }
    return blocks;
  }, [msg.content]);

  const displayText = useMemo(() => {
    let t = msg.content;
    codeBlocks.forEach(b => { t = t.replace(b.raw, '').trim(); });
    return t;
  }, [msg.content, codeBlocks]);

  if (isSystem) {
    return (
      <View style={{ alignItems:'center', paddingVertical:6, paddingHorizontal:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:6, borderWidth:1, borderRadius:20,
          paddingHorizontal:14, paddingVertical:6, borderColor:accent + '25', backgroundColor:accent + '07' }}>
          <View style={{ width:4, height:4, borderRadius:2, backgroundColor:accent + '80' }} />
          <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'700', color:accent + '80' }}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  const sc      = mountA.interpolate({ inputRange:[0,1], outputRange:[0.94,1] });
  const op      = mountA;
  const slideX  = mountA.interpolate({ inputRange:[0,1], outputRange:[isButler ? -20 : 20, 0] });
  const borderC = isLast && isButler
    ? glowA.interpolate({ inputRange:[0,1], outputRange:[accent + '30', accent + '90'] })
    : accent + (isButler ? '35' : '40');

  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  return (
    <Pressable
      onPressIn={() => Animated.spring(bubblePressA, { toValue:0.972, tension:400, friction:10, useNativeDriver:true }).start()}
      onPressOut={() => Animated.spring(bubblePressA, { toValue:1, tension:280, friction:10, useNativeDriver:true }).start()}
      onLongPress={() => { haptics.medium(); onCopy(msg.content); }}
    >
      <Animated.View style={[bub.row, isButler ? bub.leftRow : bub.rightRow, {
        transform:[{scale:sc},{translateX:slideX},{scale:bubblePressA}], opacity:op,
      }]}>
        {isButler && (
          <>
            <View style={[bub.d3, { borderColor:accent + '14', left:14, right:14 }]} />
            <View style={[bub.d2, { borderColor:accent + '25', left:14, right:14 }]} />
            <View style={[bub.d1, { borderColor:accent + '38', left:14, right:14 }]} />
          </>
        )}

        <Animated.View style={[
          bub.bubble,
          isButler
            ? { borderColor:borderC, borderLeftColor:accent, borderLeftWidth:4, borderTopLeftRadius:6,
                backgroundColor:C.card,
                ...Platform.select({ ios:{ shadowColor:accent,shadowOffset:{width:0,height:6},shadowOpacity:isLast?0.45:0.18,shadowRadius:18 }, android:{elevation:isLast?10:5} }) }
            : { backgroundColor:secondary + '12', borderColor:secondary + '40', borderTopRightRadius:6,
                padding:14,
                ...Platform.select({ ios:{ shadowColor:secondary,shadowOffset:{width:0,height:3},shadowOpacity:0.28,shadowRadius:10 }, android:{elevation:5} }) },
        ]}>
          {isButler && <View style={{ height:2, backgroundColor:accent }} />}

          <View style={{ flexDirection:'row', alignItems:'center', gap:7,
            paddingHorizontal: isButler ? 14 : 0, paddingTop: isButler ? 10 : 0, marginBottom:8 }}>
            <View style={{ width:22, height:22, borderRadius:7, borderWidth:1.5,
              borderColor:(isButler ? accent : secondary) + '55',
              backgroundColor:(isButler ? accent : secondary) + '12',
              alignItems:'center', justifyContent:'center' }}>
              <MaterialIcons name={isButler ? 'smart-toy' : 'person'} size={12} color={isButler ? accent : secondary} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900',
                color:(isButler ? accent : secondary) + 'BB', letterSpacing:0.3 }}>
                {isButler ? 'Butler AI' : 'You'}
              </Text>
              <Text style={{ fontFamily:MONO, fontSize:8, color:C.textDim }}>{time}</Text>
            </View>
            {msg.reaction && <Text style={{ fontSize:14 }}>{msg.reaction}</Text>}
            <Text style={{ fontFamily:MONO, fontSize:7, color:C.textDim + '50' }}>hold to copy</Text>
          </View>

          {displayText ? (
            <Text style={[bub.content, { color:isButler ? C.text : C.textBright,
              paddingHorizontal: isButler ? 14 : 0, paddingBottom: isButler ? 8 : 0 }]}>
              {displayText}
            </Text>
          ) : null}

          {codeBlocks.map((cb, i) => (
            <View key={i} style={[bub.code, { borderColor:C.cyan + '25' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8,
                backgroundColor:'rgba(0,229,255,0.04)', borderBottomWidth:1, borderBottomColor:C.cyan + '18' }}>
                <MaterialCommunityIcons name="code-braces" size={10} color={C.cyan + '70'} />
                <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:C.cyan + '70', letterSpacing:1, flex:1 }}>
                  {cb.lang.toUpperCase()}
                </Text>
                <Pressable onPress={() => { haptics.light(); onCopy(cb.code); }}
                  style={({ pressed }) => [{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:6,
                    borderColor:C.cyan + '35', paddingHorizontal:7, paddingVertical:3,
                    backgroundColor: pressed ? C.cyan + '20' : 'transparent',
                    transform:[{scale: pressed ? 0.91 : 1}] }]}>
                  <MaterialIcons name="content-copy" size={10} color={C.cyan + '80'} />
                  <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.cyan + '80' }}>COPY</Text>
                </Pressable>
                <Pressable onPress={() => { haptics.medium(); onSave(cb.code); }}
                  style={({ pressed }) => [{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:6,
                    borderColor:C.green + '50', paddingHorizontal:7, paddingVertical:3,
                    backgroundColor: pressed ? C.green + '30' : C.green + '0C',
                    transform:[{scale: pressed ? 0.91 : 1}] }]}>
                  <MaterialIcons name="save" size={10} color={C.green} />
                  <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.green }}>SAVE</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={{ fontFamily:MONO, fontSize:12, color:'#7EC8E3', padding:12, lineHeight:19 }}>
                  {cb.code}
                </Text>
              </ScrollView>
            </View>
          ))}

          {isButler && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:14, paddingBottom:10,
              paddingTop:8, borderTopWidth:1, borderTopColor:accent + '12' }}>
              {msg.metadata?.responseMs ? (
                <View style={{ flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:6,
                  paddingHorizontal:7, paddingVertical:3, borderColor:C.green + '30', backgroundColor:C.green + '07' }}>
                  <MaterialIcons name="bolt" size={9} color={C.green + '80'} />
                  <Text style={{ fontFamily:MONO, fontSize:8, color:C.green + '80' }}>
                    {msg.metadata.responseMs > 1000
                      ? `${(msg.metadata.responseMs / 1000).toFixed(1)}s`
                      : `${msg.metadata.responseMs}ms`}
                  </Text>
                </View>
              ) : null}
              {msg.metadata?.kbUsed && msg.metadata.kbUsed > 0 ? (
                <View style={{ flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:6,
                  paddingHorizontal:7, paddingVertical:3, borderColor:C.purple + '30', backgroundColor:C.purple + '07' }}>
                  <MaterialIcons name="library-books" size={9} color={C.purple + '80'} />
                  <Text style={{ fontFamily:MONO, fontSize:8, color:C.purple + '80' }}>{msg.metadata.kbUsed} src</Text>
                </View>
              ) : null}
              <View style={{ flex:1 }} />
              <Pressable onPress={() => { haptics.light(); onCopy(msg.content); }}
                style={({ pressed }) => [{ width:30, height:30, borderRadius:8, alignItems:'center', justifyContent:'center',
                  backgroundColor: pressed ? accent + '20' : 'transparent',
                  transform:[{scale: pressed ? 0.85 : 1}] }]}
                hitSlop={{top:7,bottom:7,left:7,right:7}}>
                <MaterialIcons name="content-copy" size={13} color={C.textDim} />
              </Pressable>
              {['\ud83d\udc4d','\ud83d\udc4e','\u2b50'].map(e => (
                <Pressable key={e} onPress={() => { haptics.light(); onReact(msg.id, e); }}
                  style={({ pressed }) => [{ width:30, height:30, borderRadius:8, alignItems:'center', justifyContent:'center',
                    backgroundColor: msg.reaction === e ? accent + '22' : pressed ? accent + '14' : 'transparent',
                    transform:[{scale: pressed ? 0.78 : msg.reaction === e ? 1.18 : 1}] }]}
                  hitSlop={{top:7,bottom:7,left:7,right:7}}>
                  <Text style={{ fontSize:14 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const bub = StyleSheet.create({
  row:     { paddingHorizontal:14, marginBottom:14, position:'relative' },
  leftRow: { alignItems:'flex-start' },
  rightRow:{ alignItems:'flex-end' },
  d3:      { position:'absolute', top:0, bottom:0, borderRadius:18, borderWidth:1, transform:[{translateY:9},{translateX:7}] },
  d2:      { position:'absolute', top:0, bottom:0, borderRadius:17, borderWidth:1.5, transform:[{translateY:5},{translateX:3.5}] },
  d1:      { position:'absolute', top:0, bottom:0, borderRadius:16, borderWidth:2, transform:[{translateY:2},{translateX:1.5}] },
  bubble:  { maxWidth: Math.min(SW * 0.86, 480), borderWidth:1.5, borderRadius:16, overflow:'hidden' },
  content: { fontFamily:SANS, fontSize:14.5, lineHeight:23 },
  code:    { borderWidth:1, borderRadius:10, overflow:'hidden', marginHorizontal:14, marginBottom:10, backgroundColor:'#010204' },
});

// ── CONTEXT SUGGESTION RAIL ───────────────────────────────────────────────────
const CTX_SUGGEST: Record<string, { icon:string; label:string; cmd:string }[]> = {
  script: [
    { icon:'save',        label:'Save script',  cmd:'Save this script to my library' },
    { icon:'play-arrow',  label:'Run it now',   cmd:'Run this script on my PC right now' },
    { icon:'bug-report',  label:'Debug it',     cmd:'Debug and fix any issues in this script' },
  ],
  cpu: [
    { icon:'memory',               label:'CPU breakdown', cmd:'Show detailed CPU usage by process' },
    { icon:'cleaning-services',    label:'Free RAM',      cmd:'Write a script to free up RAM and kill background tasks' },
  ],
  file: [
    { icon:'folder-special',  label:'Sort files',   cmd:'Write a script to organize all files in Downloads by type' },
    { icon:'find-in-page',    label:'Find dupes',   cmd:'Find all duplicate files using MD5 hash comparison' },
  ],
  default: [
    { icon:'psychology',  label:'Tell me more',  cmd:'Tell me more about that' },
    { icon:'code',        label:'Write script',  cmd:'Write a Python script for this task' },
    { icon:'help-outline',label:'Explain',       cmd:'Explain that in simpler terms' },
    { icon:'arrow-forward',label:'Next step',    cmd:'What should I do next?' },
  ],
};

function getCtxKey(text: string): string {
  if (/script|python|code/i.test(text))        return 'script';
  if (/cpu|ram|memory|process|performance/i.test(text)) return 'cpu';
  if (/file|folder|disk|storage/i.test(text))  return 'file';
  return 'default';
}

function ContextRail({ lastReply, onTap, accent }: { lastReply:string; onTap:(c:string)=>void; accent:string }) {
  const key  = getCtxKey(lastReply);
  const sug  = CTX_SUGGEST[key] || CTX_SUGGEST.default;
  const fadeA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeA, { toValue:1, duration:350, useNativeDriver:true }).start();
  }, [lastReply]);

  return (
    <Animated.View style={{ opacity:fadeA, paddingBottom:10 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:16, paddingVertical:7 }}>
        <View style={{ width:5, height:5, borderRadius:3, backgroundColor:accent }} />
        <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', color:accent + '70', letterSpacing:1.8 }}>
          SUGGESTED FOLLOW-UPS
        </Text>
        <View style={{ flex:1, height:1, backgroundColor:accent + '18' }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:14, gap:8 }}>
        {sug.map((s, i) => {
          const scA = new Animated.Value(1);
          return (
            <Pressable key={i}
              onPressIn={() => Animated.spring(scA, { toValue:0.90, tension:400, friction:10, useNativeDriver:true }).start()}
              onPressOut={() => Animated.spring(scA, { toValue:1, tension:280, friction:10, useNativeDriver:true }).start()}
              onPress={() => { haptics.medium(); onTap(s.cmd); }}
            >
              <Animated.View style={[{ transform:[{scale:scA}] }, {
                flexDirection:'row', alignItems:'center', gap:6, borderWidth:1.5, borderRadius:20,
                paddingHorizontal:13, paddingVertical:8, borderColor:accent + '45', backgroundColor:accent + '0C',
                ...(Platform.OS === 'ios' ? { shadowColor:accent, shadowOffset:{width:0,height:2}, shadowOpacity:0.25, shadowRadius:6 } : {}),
              }]}>
                <MaterialIcons name={s.icon as any} size={13} color={accent + 'CC'} />
                <Text style={{ fontFamily:SANS, fontSize:12, fontWeight:'600', color:accent + 'CC' }}>{s.label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ── SESSION STATS STRIP ───────────────────────────────────────────────────────
function SessionStrip({ messages, isConnected, accent }: {
  messages:Msg[]; isConnected:boolean; accent:string;
}) {
  const turns   = messages.filter(m => m.role === 'user').length;
  const replies = messages.filter(m => m.role === 'butler').length;
  const times   = messages.filter(m => m.metadata?.responseMs).map(m => m.metadata!.responseMs!);
  const avgMs   = times.length ? Math.round(times.reduce((a,b) => a+b,0) / times.length) : 0;
  if (!turns) return null;
  return (
    <View style={{ flexDirection:'row', marginHorizontal:14, marginTop:2, marginBottom:10,
      borderWidth:1, borderRadius:12, borderColor:accent + '20', backgroundColor:accent + '05',
      overflow:'hidden' }}>
      {[
        { label:'TURNS',     val:String(turns),    color:accent   },
        { label:'REPLIES',   val:String(replies),  color:C.green  },
        { label:'AVG SPEED', val:avgMs > 0 ? (avgMs>1000?`${(avgMs/1000).toFixed(1)}s`:`${avgMs}ms`) : '--', color:C.amber },
        { label:'AI STATUS', val:isConnected?'LIVE':'LOCAL', color:isConnected?C.green:C.textDim },
      ].map((item,i,arr) => (
        <View key={i} style={[{ flex:1, alignItems:'center', paddingVertical:9 },
          i < arr.length-1 && { borderRightWidth:1, borderRightColor:accent + '18' }]}>
          <Text style={{ fontFamily:MONO, fontSize:14, fontWeight:'900', color:item.color, lineHeight:17 }}>{item.val}</Text>
          <Text style={{ fontFamily:MONO, fontSize:7, color:C.textDim, letterSpacing:0.8, marginTop:2 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── AI DISCLOSURE MODAL ───────────────────────────────────────────────────────
function DisclosureModal({ visible, onAccept }: { visible:boolean; onAccept:()=>void }) {
  const ITEMS = [
    { icon:'lock',         color:C.green,  title:'ZERO CLOUD',    sub:'All conversations stay on your local network \u2014 never transmitted anywhere.' },
    { icon:'psychology',   color:C.cyan,   title:'LEARNING AI',   sub:'Butler learns from your conversations on-device only to improve responses.' },
    { icon:'delete-sweep', color:C.teal,   title:'FULL CONTROL',  sub:'Delete all stored data anytime in Settings \u2192 Knowledge Base.' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.95)', justifyContent:'center', padding:20 }}>
        <View style={{ backgroundColor:C.surface, borderRadius:16, borderWidth:1.5, borderColor:C.cyan + '30', overflow:'hidden' }}>
          <View style={{ height:3, backgroundColor:C.cyan }} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:14, padding:20, paddingBottom:14 }}>
            <View style={{ width:56, height:56, borderRadius:14, borderWidth:1.5, borderColor:C.cyan + '40',
              backgroundColor:C.cyan + '0C', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MaterialIcons name="psychology" size={28} color={C.cyan} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:20, fontWeight:'900', color:'#FFF', letterSpacing:1.5 }}>
                BUTLER <Text style={{ color:C.cyan }}>AI</Text>
              </Text>
              <Text style={{ fontFamily:MONO, fontSize:9, color:C.textDim, letterSpacing:1, marginTop:3 }}>
                LOCAL AI BEHAVIORAL NOTICE
              </Text>
            </View>
          </View>
          <View style={{ height:1, backgroundColor:C.cyan + '18', marginHorizontal:20 }} />
          <View style={{ padding:20, gap:12 }}>
            {ITEMS.map(it => (
              <View key={it.title} style={{ flexDirection:'row', alignItems:'flex-start', gap:12,
                borderLeftWidth:2, borderLeftColor:it.color, paddingLeft:12, paddingVertical:4 }}>
                <MaterialIcons name={it.icon as any} size={16} color={it.color} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:it.color, letterSpacing:0.8, marginBottom:3 }}>
                    {it.title}
                  </Text>
                  <Text style={{ fontFamily:SANS, fontSize:12, color:C.textMid, lineHeight:18 }}>{it.sub}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={onAccept} activeOpacity={0.85}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10,
              margin:20, marginTop:4, backgroundColor:C.cyan, borderRadius:12, paddingVertical:15 }}>
            <MaterialIcons name="check-circle" size={18} color="#000" />
            <Text style={{ fontFamily:MONO, fontSize:14, fontWeight:'900', color:'#000', letterSpacing:1.5 }}>
              ENTER BUTLER AI
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── SCRIPT BUILDER MODAL ──────────────────────────────────────────────────────
const TEMPLATES = [
  'Monitor CPU and send desktop alert if above 80%',
  'Clean Downloads folder \u2014 delete files older than 30 days',
  'Find all large files (>100MB) on C: drive',
  'Backup Desktop folder to external drive with timestamp',
  'Auto-restart a process if it crashes',
];

function BuilderModal({ visible, onClose, onBuild, accent }: {
  visible:boolean; onClose:()=>void; onBuild:(p:string)=>void; accent:string;
}) {
  const [prompt, setPrompt] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.92)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor:C.surface, borderTopLeftRadius:20, borderTopRightRadius:20,
          borderTopWidth:2.5, borderTopColor:accent, paddingBottom:36 }}>
          <View style={{ alignItems:'center', padding:14 }}>
            <View style={{ width:38, height:4, borderRadius:2, backgroundColor:accent + '40' }} />
          </View>
          <View style={{ paddingHorizontal:20 }}>
            <Text style={{ fontFamily:MONO, fontSize:14, fontWeight:'900', color:accent, letterSpacing:1.5, marginBottom:4 }}>
              \u26A1 SCRIPT BUILDER
            </Text>
            <Text style={{ fontFamily:SANS, fontSize:13, color:C.textMid, marginBottom:14, lineHeight:19 }}>
              Describe what you want to automate \u2014 Butler AI will write the Python script.
            </Text>
          </View>
          <View style={{ flexDirection:'row', alignItems:'flex-start', marginHorizontal:16, marginBottom:12,
            borderWidth:1.5, borderColor:accent + '40', borderRadius:12, backgroundColor:C.bg, paddingHorizontal:12 }}>
            <TextInput style={{ flex:1, fontSize:14, color:C.textBright, paddingVertical:12, fontFamily:SANS, lineHeight:20 }}
              value={prompt} onChangeText={setPrompt}
              placeholder="e.g. find all duplicate files..." placeholderTextColor={C.textDim}
              multiline numberOfLines={3} autoFocus />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap:8, paddingHorizontal:16, marginBottom:16 }}>
            {TEMPLATES.map((t,i) => (
              <TouchableOpacity key={i} onPress={() => setPrompt(t)} activeOpacity={0.78}
                style={{ borderWidth:1, borderColor:accent + '35', backgroundColor:accent + '08',
                  borderRadius:10, paddingHorizontal:12, paddingVertical:8 }}>
                <Text style={{ fontFamily:MONO, fontSize:11, color:accent + 'CC' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection:'row', gap:10, paddingHorizontal:16 }}>
            <TouchableOpacity onPress={onClose}
              style={{ flex:1, borderWidth:1, borderColor:C.textDim + '40', borderRadius:12, paddingVertical:14, alignItems:'center' }} activeOpacity={0.8}>
              <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:C.textDim }}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (prompt.trim()) { haptics.heavy(); onBuild(prompt.trim()); onClose(); setPrompt(''); } }}
              style={{ flex:2, backgroundColor:accent, borderRadius:12, paddingVertical:14,
                alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, opacity:prompt.trim()?1:0.5 }}
              activeOpacity={0.85} disabled={!prompt.trim()}>
              <MaterialIcons name="bolt" size={18} color="#000" />
              <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:'#000' }}>BUILD SCRIPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── COMMAND PALETTE ───────────────────────────────────────────────────────────
const CMD_PALETTE = [
  { icon:'broom',              lib:'community', label:'Clean Temp',    sub:'Delete temp files',     color:C.green,  prompt:'Write a Python script to clean all temp files and show freed MB' },
  { icon:'shield-search',      lib:'community', label:'Security Scan', sub:'Ports & processes',     color:C.red,    prompt:'Run a Python security scan: open ports, suspicious processes' },
  { icon:'backup-restore',     lib:'community', label:'Backup Docs',   sub:'ZIP to Desktop',        color:C.amber,  prompt:'Write a Python script to backup Documents folder to Desktop as timestamped ZIP' },
  { icon:'speedometer',        lib:'community', label:'Performance',   sub:'Top CPU processes',     color:C.cyan,   prompt:'Show live PC performance: top 5 CPU processes, RAM usage, disk speeds' },
  { icon:'wifi-strength-4',    lib:'community', label:'WiFi Info',     sub:'Networks & signal',     color:C.purple, prompt:'Show all WiFi networks, signal strength, current connection details' },
  { icon:'folder-cog-outline', lib:'community', label:'Sort Files',    sub:'By extension',          color:'#FF7022', prompt:'Write Python to organize Downloads folder by file extension into subfolders' },
];

function CommandPalette({ visible, onSelect, onClose, accent }: {
  visible:boolean; onSelect:(p:string)=>void; onClose:()=>void; accent:string;
}) {
  const slideY = useRef(new Animated.Value(340)).current;
  useEffect(() => {
    Animated.spring(slideY, { toValue:visible?0:340, tension:100, friction:13, useNativeDriver:false }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:300,
      backgroundColor:C.bg, borderTopLeftRadius:18, borderTopRightRadius:18,
      borderTopWidth:2.5, borderTopColor:accent, transform:[{translateY:slideY}] }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:9, padding:16,
        borderBottomWidth:1, borderBottomColor:accent + '20' }}>
        <MaterialCommunityIcons name="console" size={14} color={accent} />
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:accent, letterSpacing:1 }}>COMMAND PALETTE</Text>
          <Text style={{ fontFamily:SANS, fontSize:11, color:C.textMid, marginTop:1 }}>
            Quick-fire PC automation commands
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <MaterialIcons name="close" size={18} color={C.textDim} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', padding:12, gap:8, paddingBottom:32 }}>
        {CMD_PALETTE.map((item,i) => {
          const Icon = item.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.medium(); onSelect(item.prompt); onClose(); }} activeOpacity={0.82}
              style={{ width:'30.5%', borderWidth:1.5, borderRadius:14, borderTopWidth:3,
                borderColor:item.color + '45', borderTopColor:item.color,
                backgroundColor:item.color + '09', alignItems:'center', paddingVertical:14, gap:7 }}>
              <View style={{ width:44, height:44, borderRadius:12, borderWidth:1.5,
                borderColor:item.color + '55', backgroundColor:item.color + '12',
                alignItems:'center', justifyContent:'center' }}>
                <Icon name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:item.color, textAlign:'center' }}>{item.label}</Text>
              <Text style={{ fontFamily:MONO, fontSize:8, color:C.textDim, textAlign:'center' }}>{item.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── INPUT BAR — v3 PREMIUM NEXUS COMMAND INPUT ──────────────────────────────────
function InputBar({ onSend, isConnected, disabled, accent }: {
  onSend:(t:string)=>void; isConnected:boolean; disabled:boolean; accent:string;
}) {
  const [text, setText]           = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef  = useRef<TextInput>(null);
  const sendRef   = useRef(onSend);
  useEffect(() => { sendRef.current = onSend; }, [onSend]);

  // ── Native-driver animations (transform / opacity only) ──────────────────
  const sendScaleA = useRef(new Animated.Value(1)).current; // send button squish
  const sendRipA   = useRef(new Animated.Value(0)).current; // ripple ring
  const cursorA    = useRef(new Animated.Value(1)).current; // blinking cursor
  const micPulseA  = useRef(new Animated.Value(1)).current; // mic idle breathe

  // ── JS-driver animations (colour / opacity non-transform) ────────────────
  const borderA    = useRef(new Animated.Value(0)).current; // input box glow
  const sendGlowA  = useRef(new Animated.Value(0)).current; // send glow flash

  // Blinking cursor when focused
  useEffect(() => {
    if (!isFocused) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 520, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 520, useNativeDriver: true }),
    ])); l.start(); return () => l.stop();
  }, [isFocused]);

  // Mic idle breathe when empty
  useEffect(() => {
    if (text.length > 0) { micPulseA.setValue(1); return; }
    const l = Animated.loop(Animated.sequence([
      Animated.timing(micPulseA, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      Animated.timing(micPulseA, { toValue: 1,   duration: 1200, useNativeDriver: true }),
    ])); l.start(); return () => l.stop();
  }, [text.length === 0]);

  // Border glow reactive to text/focus
  useEffect(() => {
    Animated.timing(borderA, {
      toValue: isFocused ? 1 : text.length > 0 ? 0.6 : 0,
      duration: 200, useNativeDriver: false,
    }).start();
  }, [isFocused, text.length]);

  const handleSend = useCallback(() => {
    const t = text.trim();
    if (!t || disabled) return;
    haptics.heavy();
    // Satisfying squish → spring → settle
    Animated.sequence([
      Animated.timing(sendScaleA, { toValue: 0.72, duration: 75, useNativeDriver: true }),
      Animated.spring(sendScaleA,  { toValue: 1.18, tension: 450, friction: 5,  useNativeDriver: true }),
      Animated.spring(sendScaleA,  { toValue: 1,    tension: 300, friction: 12, useNativeDriver: true }),
    ]).start();
    sendRipA.setValue(0);
    sendGlowA.setValue(1);
    Animated.parallel([
      Animated.timing(sendRipA,   { toValue: 1, duration: 440, useNativeDriver: true }),
      Animated.timing(sendGlowA,  { toValue: 0, duration: 520, useNativeDriver: false }),
    ]).start();
    sendRef.current(t);
    setText('');
  }, [text, disabled]);

  const connCol       = isConnected ? C.green : C.red;
  const hasText       = text.trim().length > 0;
  const charCount     = text.length;
  const borderCol     = borderA.interpolate({ inputRange:[0,0.6,1], outputRange:[accent+'28', accent+'80', accent+'EE'] });
  const sendRipScale  = sendRipA.interpolate({ inputRange:[0,1], outputRange:[0.75, 2.1] });
  const sendRipOp     = sendRipA.interpolate({ inputRange:[0,0.3,1], outputRange:[0.65, 0.3, 0] });

  return (
    <View style={[ib.root, { backgroundColor: C.bg }]}>
      {/* Top accent bar — same 5-colour signature as hero */}
      <View style={ib.topStripe}>
        {[accent, C.green, C.purple, C.amber, '#FF6EB4'].map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:c, opacity: isFocused ? 1 : 0.35 }} />
        ))}
      </View>

      <View style={ib.wrap}>
        {/* Connection status pill — left anchor */}
        <View style={[ib.connPill, { borderColor: connCol+'45', backgroundColor: connCol+'0A' }]}>
          <View style={{ width:6, height:6, borderRadius:3, backgroundColor:connCol,
            ...(Platform.OS==='ios'?{shadowColor:connCol,shadowOffset:{width:0,height:0},shadowOpacity:0.9,shadowRadius:5}:{}) }} />
          <Text style={[ib.connTxt, { color: connCol }]}>{isConnected ? 'PC' : 'OFF'}</Text>
        </View>

        {/* Main input area — animated border frame */}
        <Animated.View style={[ib.inputFrame, {
          borderColor: borderCol,
          ...(Platform.OS==='ios' && isFocused ? {
            shadowColor: accent, shadowOffset:{width:0,height:0}, shadowOpacity:0.55, shadowRadius:12,
          } : {}),
        }]}>
          {/* HUD corner brackets — visible when focused */}
          {isFocused && (
            <>
              <View style={[ib.corner, { top:2, left:2, borderTopWidth:1.5, borderLeftWidth:1.5, borderColor:accent }]} />
              <View style={[ib.corner, { top:2, right:2, borderTopWidth:1.5, borderRightWidth:1.5, borderColor:accent }]} />
              <View style={[ib.corner, { bottom:2, left:2, borderBottomWidth:1.5, borderLeftWidth:1.5, borderColor:accent }]} />
              <View style={[ib.corner, { bottom:2, right:2, borderBottomWidth:1.5, borderRightWidth:1.5, borderColor:accent }]} />
            </>
          )}

          {/* Prompt prefix */}
          {isFocused && (
            <View style={ib.promptPfx}>
              <Text style={[ib.pfxTxt, { color:accent }]}>{'>'}</Text>
              <Animated.View style={[ib.cursor, { backgroundColor:accent, opacity:cursorA }]} />
            </View>
          )}

          <TextInput
            ref={inputRef}
            style={[ib.input, { color: C.textBright }]}
            value={text}
            onChangeText={(v) => { setText(v); autoResearch.notifyTyping(v); }}
            placeholder={isConnected
              ? 'How may I assist you, sir\u2026'
              : 'Connect PC from HOME tab\u2026'}
            placeholderTextColor={C.textDim}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!disabled}
            multiline
            maxLength={2000}
            keyboardAppearance="dark"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {/* Char count badge — only when near limit */}
          {charCount > 1800 && (
            <Text style={[ib.charCount, { color: charCount > 1950 ? C.red : accent }]}>
              {2000 - charCount}
            </Text>
          )}
        </Animated.View>

        {/* Send button cluster */}
        <View style={ib.sendCluster}>
          {/* Ripple ring (native driver) */}
          <Animated.View pointerEvents="none" style={[ib.sendRipple, {
            borderColor: accent,
            transform: [{ scale: sendRipScale }],
            opacity: sendRipOp,
          }]} />

          {/* Send button with squish (native driver scale) */}
          <Animated.View style={{ transform: [{ scale: sendScaleA }] }}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={disabled || !hasText}
              activeOpacity={0.88}
              style={[ib.sendBtn, {
                backgroundColor: hasText && !disabled ? accent : C.card,
                borderColor: accent + (hasText && !disabled ? 'CC' : '35'),
                ...(Platform.OS==='ios' ? {
                  shadowColor: accent,
                  shadowOffset: { width:0, height: hasText?8:2 },
                  shadowOpacity: hasText && !disabled ? 0.95 : 0.18,
                  shadowRadius: hasText && !disabled ? 18 : 6,
                } : { elevation: hasText && !disabled ? 12 : 2 }),
              }]}>
              {/* Glow flash overlay (JS driver — separate view, no transform) */}
              <Animated.View pointerEvents="none"
                style={[StyleSheet.absoluteFill, {
                  borderRadius:14, backgroundColor:accent, opacity:sendGlowA,
                }]} />
              {/* Corner accents on active */}
              {hasText && (
                <>
                  <View style={[ib.sendCorner, { top:2,  left:2,  borderTopWidth:1.5, borderLeftWidth:1.5,  borderColor:'#000' }]} />
                  <View style={[ib.sendCorner, { top:2,  right:2, borderTopWidth:1.5, borderRightWidth:1.5, borderColor:'#000' }]} />
                </>
              )}
              {disabled
                ? <ActivityIndicator size="small" color={accent} />
                : <MaterialIcons
                    name={hasText ? 'send' : 'chevron-right'}
                    size={19}
                    color={hasText && !disabled ? '#000' : accent+'55'}
                  />
              }
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Bottom status bar */}
      <View style={[ib.statusBar, { borderTopColor: accent+'16' }]}>
        <View style={{ width:4, height:4, borderRadius:2, backgroundColor: isConnected ? C.green : C.red }} />
        <Text style={[ib.statusTxt, { color: isConnected ? C.green+'80' : C.red+'80' }]}>
          {isConnected ? `BUTLER AI \u00b7 LOCAL LLM \u00b7 ZERO CLOUD` : `OFFLINE \u00b7 PAIR PC FROM HOME TAB`}
        </Text>
        {charCount > 0 && (
          <Text style={[ib.statusTxt, { color: accent+'55', marginLeft:'auto' }]}>
            {charCount}/2000
          </Text>
        )}
      </View>
    </View>
  );
}

const ib = StyleSheet.create({
  root:       { backgroundColor:'#020810', borderTopWidth:2, borderTopColor:'rgba(0,229,255,0.18)' },
  topStripe:  { height:2.5, flexDirection:'row' },
  wrap:       { flexDirection:'row', alignItems:'flex-end', gap:8, paddingHorizontal:12, paddingVertical:9 },
  // Connection pill
  connPill:   { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:10,
                paddingHorizontal:8, paddingVertical:7, flexShrink:0, alignSelf:'flex-end', marginBottom:1 },
  connTxt:    { fontFamily:MONO, fontSize:8, fontWeight:'900', letterSpacing:0.4 },
  // Input frame
  inputFrame: { flex:1, borderWidth:1.5, borderRadius:14, paddingHorizontal:12, paddingTop:9,
                paddingBottom:9, minHeight:48, maxHeight:124, backgroundColor:C.card,
                position:'relative', overflow:'hidden' },
  corner:     { position:'absolute', width:7, height:7 },
  promptPfx:  { flexDirection:'row', alignItems:'center', gap:3, marginBottom:3 },
  pfxTxt:     { fontFamily:MONO, fontSize:10, fontWeight:'900' },
  cursor:     { width:6, height:11, borderRadius:1 },
  input:      { fontFamily:SANS, fontSize:14.5, lineHeight:21, minHeight:22, padding:0 },
  charCount:  { fontFamily:MONO, fontSize:8, alignSelf:'flex-end', marginTop:2 },
  // Send cluster
  sendCluster:{ position:'relative', flexShrink:0, alignSelf:'flex-end' },
  sendRipple: { position:'absolute', width:46, height:46, borderRadius:23, borderWidth:1.5, top:0, left:0 },
  sendBtn:    { width:46, height:46, borderRadius:14, borderWidth:2, alignItems:'center',
                justifyContent:'center', overflow:'hidden', position:'relative' },
  sendCorner: { position:'absolute', width:5, height:5 },
  // Status bar
  statusBar:  { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14,
                paddingVertical:5, borderTopWidth:1 },
  statusTxt:  { fontFamily:MONO, fontSize:7.5, fontWeight:'700', letterSpacing:1.2 },
});
// ── END INPUT BAR ─────────────────────────────────────────────────────────────

// ── SCROLL TO BOTTOM BUTTON ───────────────────────────────────────────────────
function ScrollToBottom({ visible, onPress, accent, unread }: {
  visible:boolean; onPress:()=>void; accent:string; unread:number;
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue:visible?1:0, tension:180, friction:14, useNativeDriver:true }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={{ position:'absolute', right:14, bottom:14, zIndex:50, transform:[{scale:a}], opacity:a }}>
      <TouchableOpacity onPress={onPress}
        style={{ width:44, height:44, borderRadius:22, borderWidth:1.5, borderColor:accent + '70',
          backgroundColor:C.card, alignItems:'center', justifyContent:'center',
          ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.4,shadowRadius:10}, android:{elevation:8} }) }}
        activeOpacity={0.85}>
        {unread > 0 && (
          <View style={{ position:'absolute', top:-5, right:-5, minWidth:18, height:18, borderRadius:9,
            backgroundColor:accent, alignItems:'center', justifyContent:'center',
            paddingHorizontal:3, borderWidth:1.5, borderColor:C.bg }}>
            <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:'#000' }}>
              {unread > 9 ? '9+' : String(unread)}
            </Text>
          </View>
        )}
        <MaterialIcons name="keyboard-arrow-down" size={22} color={accent} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── OFFLINE SMART REPLY ───────────────────────────────────────────────────────
function getOfflineReply(text: string, noConn: boolean, noOllama: boolean): string {
  const lc = text.toLowerCase();
  if (/^(hi|hello|hey|good morning)[!?.\s]*$/.test(lc))
    return 'Hello! I\'m Butler AI \u2014 your local PC automation assistant.\n\nConnect your PC from the HOME tab to unlock full AI responses powered by Ollama running locally.';
  if (/^(how are you|how r u)[?!.\s]*$/.test(lc))
    return 'Functioning well, thank you for asking. Ready to help with PC automation whenever you connect your PC.';
  if (/^(thanks?|thank you|ty)[!.\s]*$/.test(lc))
    return 'You\'re most welcome!';
  if (/^(bye|goodbye|cya)[!.\s]*$/.test(lc))
    return 'Goodbye! Come back anytime you need PC automation help.';
  if (/what can you do|capabilities|help|features/.test(lc))
    return 'I can help you with:\n\n\u2022 Running Python scripts on your PC\n\u2022 Monitoring CPU, RAM and disk usage\n\u2022 File management and cleanup\n\u2022 Network diagnostics\n\u2022 Chatting with local Ollama AI (when PC is paired)\n\u2022 Building automation scripts\n\nConnect your PC from the HOME tab to unlock everything!';
  if (noConn)
    return 'Your PC isn\'t connected right now.\n\nTo connect:\n1. Run butler_server.py on your PC\n2. Go to HOME tab \u2192 tap PAIR PC\n3. Scan the QR code shown in your PC terminal\n\nOnce paired, I can run scripts, answer questions with Ollama, and monitor your PC live.';
  if (noOllama)
    return 'Your PC is connected but Ollama isn\'t responding.\n\nTo fix:\n1. Install Ollama: ollama.com/download\n2. Run: ollama pull qwen2.5-coder:7b\n3. Restart butler_server.py\n\nOllama runs 100% locally \u2014 no cloud, no API key needed!';
  return 'I couldn\'t reach the AI engine right now.\n\nMake sure:\n1. butler_server.py is running on your PC\n2. Ollama is installed with a model loaded (run: ollama list)\n3. Your phone and PC are on the same Wi-Fi\n\nTap PAIR PC on the HOME tab to reconnect.';
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
const CONV_KEY      = '@butler_conv_nexus_v1';
const DISCLOSE_KEY  = '@butler_ai_disclosure_v1';

function ButlerInner() {
  const insets        = useSafeAreaInsets();
  const { T }         = useCosmetic();
  const accent        = T.primary   || C.cyan;
  const secondary     = T.secondary || C.green;
  const { isConnected } = useConnectionStatus();

  const [messages,       setMessages]       = useState<Msg[]>([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [showDisclose,   setShowDisclose]   = useState(false);
  const [chatMode,       setChatMode]       = useState<'general'|'code'|'debug'|'analyze'>('general');
  const [lastReply,      setLastReply]      = useState('');
  const [showCtxRail,    setShowCtxRail]    = useState(false);
  const [showBuilder,    setShowBuilder]    = useState(false);
  const [showPalette,    setShowPalette]    = useState(false);
  const [memoryCount,    setMemoryCount]    = useState(0);
  const [activeModel,    setActiveModel]    = useState('');
  const [showScrollBtn,  setShowScrollBtn]  = useState(false);
  const [unread,         setUnread]         = useState(0);

  const scrollRef     = useRef<FlatList<Msg>>(null);
  const isAtBottom    = useRef(true);
  const prevCount     = useRef(0);
  const { addEntry }  = useChatHistory();

  useEffect(() => {
    (async () => {
      try {
        const raw  = await encryptedStorage.getItem(CONV_KEY);
        if (raw) {
          const parsed = logger.safeJSON<Msg[]>(raw, [], '[Butler]');
          if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
        }
        const seen = await AsyncStorage.getItem(DISCLOSE_KEY);
        if (seen !== '1') setShowDisclose(true);
        const stats = await knowledgeAccumulator.getStats?.().catch(() => ({ totalFindings:0 }));
        setMemoryCount(stats?.totalFindings ?? 0);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    encryptedStorage.setItem(CONV_KEY, JSON.stringify(messages.slice(-80))).catch(() => {});
  }, [messages]);

  useEffect(() => {
    if (!isConnected) { setActiveModel(''); return; }
    try {
      if (typeof nexusBridge.pickBestModel === 'function') {
        nexusBridge.pickBestModel(true).then((m: string) => { if (m) setActiveModel(m); }).catch(() => {});
      }
    } catch {}
  }, [isConnected]);

  useEffect(() => {
    const diff = messages.length - prevCount.current;
    if (diff > 0 && !isAtBottom.current) setUnread(c => c + diff);
    prevCount.current = messages.length;
  }, [messages.length]);

  const clearChat = useCallback(async () => {
    haptics.medium();
    setMessages([]); setLastReply(''); setShowCtxRail(false); setUnread(0); setShowScrollBtn(false);
    await encryptedStorage.removeItem(CONV_KEY).catch(() => {});
    autoResearch.clearCache();
  }, []);

  useEffect(() => {
    (global as any).__butlerClearChat = clearChat;
    return () => { delete (global as any).__butlerClearChat; };
  }, [clearChat]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { id:`u-${Date.now()}`, role:'user', content:text.trim(), timestamp:Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setShowCtxRail(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated:true }), 100);

    try {
      const t0 = Date.now();
      const histCtx = buildHistoryOnly(messages.slice(-10));
      const [nexusCtx, metricsCtx] = await Promise.all([
        nexusBridge?.buildNexusContext?.(text, {
          maxLocal:5, maxRelay:3, timeoutMs:3500,
          relayEnabled:isConnected, growthEnabled:false,
        }).catch(() => null),
        serverMetrics.getContextString().catch(() => ''),
      ]);
      const prewarmed = autoResearch.getCached(text);
      const kbCtx = nexusCtx?.fusedBlock
        || prewarmed?.kbCtx
        || await knowledgeAccumulator.buildContext(text).catch(() => '');
      const modePrompt = MODE_PROMPTS[chatMode] || '';
      const personalCtx = await personalMemory.buildPersonalContext().catch(() => '');
      const sysPrompt  = [
        BUTLER_KNOWLEDGE_COMPACT,
        typeof BUTLER_STYLE_GUIDE === 'string' ? BUTLER_STYLE_GUIDE : '',
        modePrompt ? `BEHAVIOR MODE:\n${modePrompt}` : '',
        metricsCtx ? `LIVE PC METRICS:\n${metricsCtx}` : '',
        kbCtx ? `KNOWLEDGE:\n${kbCtx.slice(0, 3000)}` : '',
        personalCtx || '',
        'REMINDER INSTRUCTION: You have access to personal facts and events about this user. Proactively remind them of upcoming events when relevant. Use any stored name to address them personally.',
      ].filter(Boolean).join('\n\n');

      if (!serverConnection.isConnected()) throw new Error('PC not connected');
      if (typeof nexusBridge?.chat !== 'function') throw new Error('AI bridge unavailable');

      const result = await nexusBridge.chat({
        messages:[
          { role:'system', content:sysPrompt },
          ...histCtx,
          { role:'user', content:text },
        ],
        stream:false,
        model:activeModel || undefined,
      });

      const reply   = result?.content || result?.message || result?.response || result?.text || 'No response received.';
      const rMs     = Date.now() - t0;
      let kbUsed    = nexusCtx ? nexusCtx.localFindings.length + nexusCtx.relayFindings.length : 0;
      if (kbUsed === 0 && kbCtx) kbUsed = (kbCtx.match(/\n---\n/g) || []).length + 1;

      const butlerMsg: Msg = {
        id:`b-${Date.now()}`, role:'butler', content:reply, timestamp:Date.now(),
        metadata:{ model:result?.model || '', responseMs:rMs, kbUsed },
      };
      setMessages(prev => [...prev, butlerMsg]);
      setLastReply(reply); setShowCtxRail(true);
      try { (global as any).__notifyButlerNewMessage?.(); } catch {}
      addEntry({ role:'user', content:text, timestamp:Date.now() });
      addEntry({ role:'assistant', content:reply, timestamp:Date.now() });
      knowledgeAccumulator.processExchange(text, reply).catch(() => {});
      if (isConnected && (nexusCtx?.growthCount ?? 0) === 0) {
        knowledgeGrowthEngine.silentGrowth().catch(() => {});
      }
    } catch (err: any) {
      const msg  = err?.message || 'Unknown error';
      autoErrorLogger.log('error', '[Butler] sendMessage', msg);
      const lc   = msg.toLowerCase();
      const noC  = lc.includes('not connected') || lc.includes('refused') || lc.includes('failed to fetch')
                   || !serverConnection.isConnected();
      const noO  = lc.includes('ollama') || lc.includes('empty response');
      const reply = getOfflineReply(text, noC, noO);
      setMessages(prev => [...prev, { id:`b-${Date.now()}`, role:'butler', content:reply, timestamp:Date.now() }]);
      setLastReply(reply); setShowCtxRail(true);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated:true }), 200);
    }
  }, [isLoading, isConnected, messages, addEntry, chatMode, activeModel]);

  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    (global as any).__butlerInjectMessage = (t: string) => { if (t?.trim()) sendRef.current(t.trim()); };
    return () => { delete (global as any).__butlerInjectMessage; };
  }, []);

  const handleCopy  = useCallback((t: string) => { haptics.light(); safeSetClipboard(t); }, []);
  const handleReact = useCallback((id: string, e: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction:m.reaction === e ? undefined : e } : m));
  }, []);
  const handleSave  = useCallback(async (code: string) => {
    haptics.medium();
    try {
      await saveButlerScript(code, { title:`Butler_${Date.now()}` });
      (global as any).__showConnectionToast?.('Script saved to Scripts tab', C.green);
    } catch { (global as any).__showConnectionToast?.('Save failed', C.red); }
  }, []);
  const handleBuild = useCallback((prompt: string) => {
    sendMessage(`Please write a production-quality Python script that: ${prompt}. Include full error handling and progress output.`);
  }, [sendMessage]);

  return (
    <TabErrorBoundary name="Butler AI">
      <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>

        {BG_GRID && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image source={BG_GRID} style={{ flex:1, opacity:0.04 }} contentFit="cover" />
          </View>
        )}

        <DisclosureModal visible={showDisclose} onAccept={async () => {
          await AsyncStorage.setItem(DISCLOSE_KEY, '1').catch(() => {});
          setShowDisclose(false);
        }} />

        <BuilderModal visible={showBuilder} onClose={() => setShowBuilder(false)}
          onBuild={handleBuild} accent={accent} />

        <CommandPalette visible={showPalette} onSelect={sendMessage}
          onClose={() => setShowPalette(false)} accent={accent} />

        <ButlerHeroHeader
          isConnected={isConnected}
          safeTop={insets.top}
          accentColor={accent}
          memoryCount={memoryCount}
          activeModel={activeModel}
          onClear={clearChat}
          onBuildScript={() => setShowBuilder(true)}
          onCommandPalette={() => setShowPalette(true)}
        />

        <ModeBar activeMode={chatMode} onSelect={setChatMode} />

        <FlatList
          style={{ flex: 1 }}
          ref={scrollRef as any}
          data={messages.length > 0 ? messages : []}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              msg={item}
              onCopy={handleCopy} onReact={handleReact} onSave={handleSave}
              isLast={index === messages.length - 1}
              accent={accent} secondary={secondary}
            />
          )}
          ListHeaderComponent={messages.length === 0 ? (
            <>
              <EmptyHero accent={accent} memoryCount={memoryCount} isConnected={isConnected} onSendPrompt={sendMessage} />
              <NexusQuickChipsComponent
                chips={BUTLER_DEFAULT_CHIPS}
                onPick={sendMessage}
                header="Quick commands"
                disabled={isLoading}
              />
              <ButlerWelcomeHub
                accentColor={accent}
                isConnected={isConnected}
                modelName={activeModel || null}
                onSendPrompt={sendMessage}
                onBuildScript={() => setShowBuilder(true)}
              />
              <View style={{ paddingHorizontal: 2 }}>
                <AutomationFeed isConnected={isConnected} />
              </View>
              <PerformanceMonitorWidget
                isConnected={isConnected}
                compact={true}
                onExpand={() => (global as any).__butlerSwitchTab?.('logs')}
              />
            </>
          ) : null}
          ListFooterComponent={
            <>
              {messages.length > 0 && <SessionStrip messages={messages} isConnected={isConnected} accent={accent} />}
              {messages.length > 0 && showCtxRail && !isLoading && lastReply && (
                <ContextRail lastReply={lastReply} onTap={sendMessage} accent={accent} />
              )}
              {isLoading && <TypingIndicator accent={accent} />}
            </>
          }
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
            isAtBottom.current = atBottom;
            setShowScrollBtn(!atBottom && messages.length > 3);
            if (atBottom) setUnread(0);
          }}
          scrollEventThrottle={120}
          keyboardDismissMode="on-drag"
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        <ScrollToBottom visible={showScrollBtn}
          onPress={() => { scrollRef.current?.scrollToEnd({ animated:true }); setUnread(0); setShowScrollBtn(false); }}
          accent={accent} unread={unread} />

        {messages.length > 0 && (
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:6,
            borderTopWidth:1, borderTopColor:accent + '14', backgroundColor:C.bg }}>
            <TouchableOpacity onPress={() => { haptics.light(); setShowPalette(true); }} activeOpacity={0.8}
              style={{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:9,
                paddingHorizontal:9, paddingVertical:5, borderColor:C.amber + '55', backgroundColor:C.amber + '08' }}>
              <MaterialCommunityIcons name="console" size={11} color={C.amber} />
              <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', color:C.amber, letterSpacing:0.5 }}>COMMANDS</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:5 }}>
              {CMD_PALETTE.slice(0, 4).map((item, i) => {
                const Icon = item.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
                return (
                  <TouchableOpacity key={i} onPress={() => { haptics.light(); sendMessage(item.prompt); }} activeOpacity={0.8}
                    style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7,
                      paddingHorizontal:8, paddingVertical:4, borderColor:item.color + '40', backgroundColor:item.color + '08' }}>
                    <Icon name={item.icon as any} size={9} color={item.color} />
                    <Text style={{ fontFamily:MONO, fontSize:8, color:item.color }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <InputBar onSend={sendMessage} isConnected={isConnected} disabled={isLoading} accent={accent} />
      </KeyboardAvoidingView>
    </TabErrorBoundary>
  );
}

export default function ButlerScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ButlerInner />
    </View>
  );
}
