/**
 * BUTLER AI — COMMAND CONSOLE v9.0 NEW
 * Fresh cyberpunk terminal theme using shared token system.
 * Full AI chat with streaming, command palette, script builder.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
  Animated, Dimensions, Modal, Pressable, FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeSetClipboard } from '@/services/safeClipboard';
import { haptics } from '@/services/haptics';
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
import { personalMemory } from '@/services/personalMemory';
import { COLOR, FONT, SHADOW, glow } from '@/constants/tokens';
import { encryptedStorage } from '@/services/encryptedStorage';
import { logger } from '@/utils/logger';
import { Image } from 'expo-image';

const MONO: any = FONT.mono;
const SW = Dimensions.get('window').width;

// ─── ROBOT 3D MASCOT ─────────────────────────────────────────────
let MASCOT_IMG: any = null;
try { MASCOT_IMG = require('@/assets/images/butler-robot-3d.png'); } catch {
  try { MASCOT_IMG = require('@/assets/images/mascot_shield_v2.png'); } catch {}
}

// ─── MICRO ATOMS ─────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ─── HEADER ──────────────────────────────────────────────────────
const TICKER_CMDS = [
  '>> butler.chat() :: model=qwen2.5 :: local=true',
  '>> memory.load() :: 0_cloud :: aes256=active',
  '>> ollama.status :: temperature=0.7 :: ctx=8k',
  '>> llm.infer() :: zero_telemetry :: lan_only',
  '>> butler.ready() :: pair_pc_to_unlock',
];

function Ticker() {
  const [idx, setIdx]     = useState(0);
  const [chars, setChars] = useState(0);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const line = TICKER_CMDS[idx];
    if (chars < line.length) {
      const t = setTimeout(() => { if (m.current) setChars(c => c + 1); }, 24);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { if (m.current) { setIdx(i => (i + 1) % TICKER_CMDS.length); setChars(0); } }, 2600);
    return () => clearTimeout(t);
  }, [chars, idx]);
  return (
    <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.green, flex: 1 }} numberOfLines={1}>
      {TICKER_CMDS[idx].slice(0, chars)}<Text style={{ color: COLOR.cyan + '60' }}>▌</Text>
    </Text>
  );
}

interface HeaderProps {
  safeTop: number; isConn: boolean; model: string;
  msgCount: number; onClear: () => void; onBuilder: () => void; onPalette: () => void;
}
function ButlerHeader({ safeTop, isConn, model, msgCount, onClear, onBuilder, onPalette }: HeaderProps) {
  const scanA = useRef(new Animated.Value(-200)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 200, duration: 3200, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -200,     duration: 0,    useNativeDriver: false }),
      Animated.delay(7000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);

  const cc = isConn ? COLOR.green : COLOR.red;
  const modelLbl = model ? model.split(':')[0].slice(0, 14).toUpperCase() : (isConn ? '...' : 'OFFLINE');

  return (
    <View style={[hdr.root, { paddingTop: safeTop }]}>
      {/* JS-driver scanline */}
      <Animated.View pointerEvents="none" style={[hdr.scanline, { transform: [{ translateX: scanA }] }]} />
      {/* 5-color stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* Brand row */}
      <View style={hdr.brandRow}>
        {/* Robot mascot */}
        <View style={[hdr.mascotBox, { borderColor: COLOR.cyan + '40', backgroundColor: glow(COLOR.cyan, 6) }]}>
          {MASCOT_IMG ? (
            <Image source={MASCOT_IMG} style={{ width: 38, height: 48 }} contentFit="contain" />
          ) : (
            <MaterialCommunityIcons name="robot-happy" size={24} color={COLOR.cyan} />
          )}
          <View style={{ position: 'absolute', bottom: 2, right: 2 }}>
            <PulseDot color={cc} size={5} />
          </View>
        </View>

        {/* Title */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={hdr.brand}>
              <Text style={{ color: COLOR.cyan }}>{'{'}</Text>
              <Text style={{ color: '#FFF' }}>BUTLER</Text>
              <Text style={{ color: COLOR.green }}>_AI</Text>
              <Text style={{ color: COLOR.cyan }}>{'}'}</Text>
            </Text>
            <View style={[hdr.connPill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
              <PulseDot color={cc} size={5} />
              <Text style={[hdr.connTxt, { color: cc }]}>{isConn ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
          </View>
          {modelLbl !== 'OFFLINE' && modelLbl !== '...' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <MaterialCommunityIcons name="brain" size={9} color={COLOR.magenta} />
              <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.magenta }}>{modelLbl}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.dim }}>· LOCAL LLM</Text>
            </View>
          ) : (
            <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.dim, marginTop: 3 }}>
              {isConn ? 'LOADING MODEL...' : 'PAIR PC FROM HOME TAB'}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity onPress={onBuilder} style={[hdr.iconBtn, { borderColor: COLOR.cyan + '55', backgroundColor: glow(COLOR.cyan, 8) }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="code" size={14} color={COLOR.cyan} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPalette} style={[hdr.iconBtn, { borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 6) }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="console" size={13} color={COLOR.amber} />
          </TouchableOpacity>
          {msgCount > 0 && (
            <TouchableOpacity onPress={onClear} style={[hdr.iconBtn, { borderColor: COLOR.red + '40', backgroundColor: glow(COLOR.red, 5) }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="delete-sweep" size={14} color={COLOR.red + '90'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Ticker row */}
      <View style={hdr.tickerRow}>
        <View style={[hdr.msgCount, { borderColor: COLOR.cyan + '30', backgroundColor: glow(COLOR.cyan, 6) }]}>
          <MaterialIcons name="chat-bubble" size={8} color={COLOR.cyan} />
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: COLOR.cyan, fontWeight: '900' }}>{msgCount}</Text>
        </View>
        <Ticker />
      </View>

      {/* Circuit border */}
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: COLOR.cyan + '25' }} />
        <View style={{ width: 10, backgroundColor: COLOR.cyan }} />
        <View style={{ flex: 4, backgroundColor: COLOR.cyan + '10' }} />
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  root:      { backgroundColor: '#020609', overflow: 'hidden', ...SHADOW.dark },
  scanline:  { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(0,229,255,0.02)', transform: [{ skewX: '-8deg' }], zIndex: 0 },
  brandRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7, zIndex: 1 },
  mascotBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' },
  brand:     { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  connTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  iconBtn:   { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 7, zIndex: 1 },
  msgCount:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2.5 },
});

// ─── MODE BAR ────────────────────────────────────────────────────
const MODES = [
  { id: 'general',  lbl: 'GENERAL',  icon: 'chat',       color: COLOR.cyan    },
  { id: 'code',     lbl: 'CODE',     icon: 'code',       color: COLOR.green   },
  { id: 'debug',    lbl: 'DEBUG',    icon: 'bug-report', color: COLOR.amber   },
  { id: 'analyze',  lbl: 'ANALYZE',  icon: 'analytics',  color: COLOR.magenta },
] as const;
type Mode = typeof MODES[number]['id'];

const MODE_PROMPTS: Record<Mode, string> = {
  general: '',
  code:    'CODE MODE: Write production-quality Python only. Include error handling.',
  debug:   'DEBUG MODE: Analyze step-by-step. Show root cause, traceback, fixed code.',
  analyze: 'ANALYZE MODE: Break down methodically. Show reasoning, pros/cons, recommendations.',
};

function ModeBar({ active, onSelect }: { active: Mode; onSelect: (m: Mode) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#040810', borderBottomWidth: 1, borderBottomColor: COLOR.border }}>
      {MODES.map(m => {
        const isActive = active === m.id;
        return (
          <TouchableOpacity key={m.id} onPress={() => { haptics.selection(); onSelect(m.id); }} activeOpacity={0.8}
            style={[modebar.tab, isActive && { borderBottomWidth: 2.5, borderBottomColor: m.color, backgroundColor: glow(m.color, 8) }]}>
            <MaterialIcons name={m.icon as any} size={11} color={isActive ? m.color : COLOR.dim} />
            <Text style={[modebar.txt, isActive && { color: m.color, fontWeight: '900' }]}>{m.lbl}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const modebar = StyleSheet.create({
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  txt: { fontFamily: MONO, fontSize: 9, fontWeight: '600', color: COLOR.dim },
});

// ─── EMPTY STATE ──────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: 'System Stats',    prompt: 'Show CPU, RAM, and disk usage right now' },
  { label: 'Clean Temp',      prompt: 'Write a script to clean all temp files' },
  { label: 'Top Processes',   prompt: 'Show top 6 CPU-consuming processes' },
  { label: 'Disk Usage',      prompt: 'Show disk usage breakdown by folder on C:' },
  { label: 'Network Info',    prompt: 'Show my local IP and network interfaces' },
  { label: 'What can you do?',prompt: 'Tell me everything you can help automate on my PC' },
];

function EmptyState({ isConn, accent, onSend }: { isConn: boolean; accent: string; onSend: (t: string) => void }) {
  const floatA = useRef(new Animated.Value(0)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      {/* Hero card */}
      <View style={[es.card, { borderColor: accent + '35' }]}>
        <View style={{ height: 3, flexDirection: 'row' }}>
          {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        <View style={es.cardInner}>
          <Animated.View style={{ transform: [{ translateY: floatY }], flexShrink: 0 }}>
            {MASCOT_IMG ? (
              <Image source={MASCOT_IMG} style={{ width: 72, height: 90 }} contentFit="contain" />
            ) : (
              <MaterialCommunityIcons name="robot-happy" size={60} color={accent} />
            )}
            <View style={[es.badge, { borderColor: (isConn ? COLOR.green : COLOR.red) + '55', backgroundColor: (isConn ? COLOR.green : COLOR.red) + '0A' }]}>
              <PulseDot color={isConn ? COLOR.green : COLOR.red} size={4} />
              <Text style={[es.badgeTxt, { color: isConn ? COLOR.green : COLOR.red }]}>{isConn ? 'LIVE' : 'PAIR'}</Text>
            </View>
          </Animated.View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: accent + '70', letterSpacing: 2, marginBottom: 5 }}>
              AI COMMAND CENTER
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 22, fontWeight: '900', color: '#FFF' }}>
              BUTLER<Text style={{ color: accent }}> AI</Text>
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: COLOR.mid, lineHeight: 15, marginTop: 5 }}>
              {'Local AI · runs on your PC\nZero cloud · Ollama powered\nControls your machine entirely'}
            </Text>
          </View>
        </View>

        {/* Capability grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 8 }}>
          {[
            { icon: 'code',         lib: 'm', label: 'RUN SCRIPTS',  sub: 'Python on PC',     color: COLOR.cyan    },
            { icon: 'monitor-heart',lib: 'm', label: 'MONITOR PC',   sub: 'CPU · RAM · Disk', color: COLOR.green   },
            { icon: 'lock',         lib: 'm', label: 'ZERO CLOUD',   sub: 'LAN only',          color: COLOR.amber   },
            { icon: 'brain',        lib: 'c', label: 'LOCAL LLM',    sub: 'Ollama private',    color: COLOR.magenta },
          ].map((f, i) => {
            const Icon = f.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <View key={i} style={[es.featureChip, { borderColor: f.color + '35', backgroundColor: glow(f.color, 8), width: `${50 - 3}%` as any }]}>
                <View style={[es.featureIcon, { borderColor: f.color + '50', backgroundColor: glow(f.color, 12) }]}>
                  <Icon name={f.icon as any} size={14} color={f.color} />
                </View>
                <View>
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: f.color }}>{f.label}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 7.5, color: f.color + '70' }}>{f.sub}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick chips */}
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: accent }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: accent + '80', letterSpacing: 2 }}>TAP TO START</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_CHIPS.map(c => (
            <Pressable key={c.label} onPress={() => { haptics.medium(); onSend(c.prompt); }}
              style={({ pressed }) => [es.chip, { borderColor: accent + '50', backgroundColor: pressed ? glow(accent, 18) : glow(accent, 10) }]}>
              <MaterialIcons name="send" size={10} color={accent} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: accent, fontWeight: '700' }}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const es = StyleSheet.create({
  card:       { backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 }, android: { elevation: 8 } }) },
  cardInner:  { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5, marginTop: 6, alignSelf: 'center' },
  badgeTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  featureChip:{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 9 },
  featureIcon:{ width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
});

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
type Role = 'user' | 'butler' | 'system';
interface Msg {
  id: string; role: Role; content: string; timestamp: number;
  metadata?: { model?: string; responseMs?: number };
}

function MessageBubble({ msg, accent, secondary, onCopy, onSave, isLast }: {
  msg: Msg; accent: string; secondary: string;
  onCopy: (t: string) => void; onSave: (code: string) => void; isLast: boolean;
}) {
  const isButler = msg.role === 'butler';
  const mountA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(mountA, { toValue: 1, tension: 130, friction: 12, useNativeDriver: true }).start();
  }, []);

  if (msg.role === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 5, paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderColor: accent + '25', backgroundColor: glow(accent, 6) }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent + '80' }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: accent + '80' }}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  // Extract code blocks
  const codeBlocks: { code: string; lang: string }[] = [];
  const re = /```(python|py|bash|sh)?\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let displayText = msg.content;
  while ((match = re.exec(msg.content)) !== null) {
    codeBlocks.push({ code: match[2].trim(), lang: match[1] || 'python' });
  }
  if (codeBlocks.length > 0) {
    displayText = msg.content.replace(/```(python|py|bash|sh)?\s*\n[\s\S]*?```/g, '').trim();
  }

  const sc = mountA.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] });
  const slideX = mountA.interpolate({ inputRange: [0, 1], outputRange: [isButler ? -18 : 18, 0] });
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const cc = isButler ? accent : secondary;

  return (
    <Pressable onLongPress={() => { haptics.medium(); onCopy(msg.content); }}>
      <Animated.View style={[bub.row, isButler ? bub.left : bub.right, { transform: [{ scale: sc }, { translateX: slideX }], opacity: mountA }]}>
        <View style={[bub.bubble, {
          borderColor: cc + (isButler ? '40' : '35'),
          borderLeftWidth: isButler ? 4 : 1.5,
          borderLeftColor: isButler ? cc : cc + '35',
          backgroundColor: isButler ? '#040A14' : glow(secondary, 10),
        }]}>
          {isButler && <View style={{ height: 2.5, backgroundColor: cc }} />}
          {/* Bubble header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingTop: isButler ? 10 : 12, marginBottom: 7 }}>
            <View style={[bub.avatar, { borderColor: cc + '50', backgroundColor: glow(cc, 10) }]}>
              <MaterialIcons name={isButler ? 'smart-toy' : 'person'} size={12} color={cc} />
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: cc + 'BB' }}>{isButler ? 'Butler AI' : 'You'}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 7.5, color: COLOR.dim }}>{time}</Text>
            {msg.metadata?.responseMs ? (
              <View style={[bub.metaPill, { borderColor: COLOR.green + '25', backgroundColor: glow(COLOR.green, 5) }]}>
                <MaterialIcons name="bolt" size={8} color={COLOR.green} />
                <Text style={{ fontFamily: MONO, fontSize: 7, color: COLOR.green }}>
                  {msg.metadata.responseMs > 1000 ? `${(msg.metadata.responseMs / 1000).toFixed(1)}s` : `${msg.metadata.responseMs}ms`}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Text content */}
          {displayText ? (
            <Text style={[bub.content, { color: isButler ? COLOR.text : '#FFF', paddingHorizontal: 13, paddingBottom: isButler ? 0 : 12 }]}>
              {displayText}
            </Text>
          ) : null}

          {/* Code blocks */}
          {codeBlocks.map((cb, i) => (
            <View key={i} style={[bub.codeWrap, { borderColor: COLOR.cyan + '25' }]}>
              <View style={bub.codeHdr}>
                <MaterialCommunityIcons name="code-braces" size={10} color={COLOR.cyan + '70'} />
                <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.cyan + '70', flex: 1, letterSpacing: 0.5 }}>{cb.lang.toUpperCase()}</Text>
                <Pressable onPress={() => { haptics.light(); onCopy(cb.code); }}
                  style={({ pressed }) => [bub.codeBtn, { borderColor: COLOR.cyan + '35', backgroundColor: pressed ? glow(COLOR.cyan, 20) : 'transparent' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.cyan + '80' }}>COPY</Text>
                </Pressable>
                <Pressable onPress={() => { haptics.medium(); onSave(cb.code); }}
                  style={({ pressed }) => [bub.codeBtn, { borderColor: COLOR.green + '50', backgroundColor: pressed ? glow(COLOR.green, 20) : glow(COLOR.green, 8) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.green }}>SAVE</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: '#7EC8E3', padding: 12, lineHeight: 19 }}>{cb.code}</Text>
              </ScrollView>
            </View>
          ))}

          {/* Copy action */}
          {isButler && (
            <View style={bub.footer}>
              <Pressable onPress={() => { haptics.light(); onCopy(msg.content); }}
                style={({ pressed }) => [bub.footerBtn, { backgroundColor: pressed ? glow(COLOR.mid, 15) : 'transparent' }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="content-copy" size={12} color={COLOR.dim} />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const bub = StyleSheet.create({
  row:     { paddingHorizontal: 14, marginBottom: 12 },
  left:    { alignItems: 'flex-start' },
  right:   { alignItems: 'flex-end' },
  bubble:  { maxWidth: Math.min(SW * 0.88, 500), borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' },
  avatar:  { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, lineHeight: 22 },
  metaPill:{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, marginLeft: 'auto' },
  codeWrap:{ borderTopWidth: 1, marginTop: 8 },
  codeHdr: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,229,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.12)' },
  codeBtn: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  footer:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  footerBtn:{ width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});

// ─── TYPING INDICATOR ─────────────────────────────────────────────
function TypingIndicator({ accent }: { accent: string }) {
  const bars = useRef(Array.from({ length: 8 }, () => new Animated.Value(0.15))).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loops = bars.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 80),
        Animated.timing(a, { toValue: 1,    duration: 220, useNativeDriver: false }),
        Animated.timing(a, { toValue: 0.15, duration: 220, useNativeDriver: false }),
        Animated.delay(Math.max(0, (8 - i) * 40)),
      ]))
    );
    loops.forEach(l => l.start());
    return () => { m.current = false; loops.forEach(l => l.stop()); };
  }, []);
  return (
    <View style={[tind.wrap, { borderColor: accent + '35', borderLeftColor: accent }]}>
      <View style={[tind.bar, { backgroundColor: accent }]} />
      <View style={tind.inner}>
        <View style={[tind.avatar, { borderColor: accent + '55', backgroundColor: glow(accent, 10) }]}>
          <MaterialIcons name="smart-toy" size={14} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: accent }}>Thinking...</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 }}>
            {bars.map((a, i) => (
              <Animated.View key={i} style={{
                width: 2.5, borderRadius: 2,
                backgroundColor: accent,
                height: a.interpolate({ inputRange: [0.15, 1], outputRange: [3, 14] }) as any,
                opacity: a,
              }} />
            ))}
          </View>
        </View>
        <View style={[tind.livePill, { borderColor: accent + '40', backgroundColor: glow(accent, 8) }]}>
          <Text style={{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: accent }}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}
const tind = StyleSheet.create({
  wrap:    { marginHorizontal: 14, marginBottom: 12, borderWidth: 1.5, borderLeftWidth: 4, borderRadius: 12, backgroundColor: COLOR.surf, overflow: 'hidden' },
  bar:     { height: 2 },
  inner:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  avatar:  { width: 32, height: 32, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  livePill:{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
});

// ─── INPUT BAR ────────────────────────────────────────────────────
function InputBar({ onSend, isConn, disabled, accent }: {
  onSend: (t: string) => void; isConn: boolean; disabled: boolean; accent: string;
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const sendScaleA = useRef(new Animated.Value(1)).current;
  const borderA    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderA, { toValue: focused ? 1 : text.length > 0 ? 0.5 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused, text.length]);

  const handleSend = () => {
    const t = text.trim();
    if (!t || disabled) return;
    haptics.heavy();
    Animated.sequence([
      Animated.timing(sendScaleA, { toValue: 0.74, duration: 70, useNativeDriver: true }),
      Animated.spring(sendScaleA, { toValue: 1.15, tension: 450, friction: 5, useNativeDriver: true }),
      Animated.spring(sendScaleA, { toValue: 1, tension: 300, friction: 12, useNativeDriver: true }),
    ]).start();
    onSend(t); setText('');
  };

  const hasText = text.trim().length > 0;
  const cc = isConn ? COLOR.green : COLOR.red;
  const borderColor = borderA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [accent + '25', accent + '70', accent + 'EE'] });

  return (
    <View style={[ib.root, { borderTopColor: accent + '18' }]}>
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c, opacity: focused ? 1 : 0.3 }} />)}
      </View>
      <View style={ib.row}>
        <View style={[ib.connPill, { borderColor: cc + '45', backgroundColor: cc + '0A' }]}>
          <PulseDot color={cc} size={5} />
          <Text style={[ib.connTxt, { color: cc }]}>{isConn ? 'PC' : 'OFF'}</Text>
        </View>
        <Animated.View style={[ib.inputWrap, {
          borderColor: borderColor,
          ...(Platform.OS === 'ios' && focused ? { shadowColor: accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 } : {}),
        }]}>
          {focused && (
            <>
              <View style={[ib.corner, { top: 2, left: 2, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: accent }]} />
              <View style={[ib.corner, { top: 2, right: 2, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: accent }]} />
              <View style={[ib.corner, { bottom: 2, left: 2, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: accent }]} />
              <View style={[ib.corner, { bottom: 2, right: 2, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: accent }]} />
            </>
          )}
          <TextInput
            style={ib.input}
            value={text}
            onChangeText={(v) => { setText(v); autoResearch.notifyTyping(v); }}
            placeholder={isConn ? 'How may I assist you, sir...' : 'Connect PC from HOME tab...'}
            placeholderTextColor={COLOR.dim}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!disabled}
            multiline
            maxLength={2000}
            keyboardAppearance="dark"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: sendScaleA }] }}>
          <TouchableOpacity onPress={handleSend} disabled={disabled || !hasText} activeOpacity={0.88}
            style={[ib.sendBtn, {
              backgroundColor: hasText && !disabled ? accent : COLOR.surf,
              borderColor: accent + (hasText && !disabled ? 'CC' : '30'),
              ...(Platform.OS === 'ios' ? { shadowColor: accent, shadowOffset: { width: 0, height: hasText ? 6 : 2 }, shadowOpacity: hasText && !disabled ? 0.9 : 0.15, shadowRadius: hasText ? 14 : 4 } : { elevation: hasText ? 10 : 2 }),
            }]}>
            {disabled
              ? <ActivityIndicator size="small" color={accent} />
              : <MaterialIcons name={hasText ? 'send' : 'chevron-right'} size={19} color={hasText && !disabled ? '#000' : accent + '55'} />
            }
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={[ib.status, { borderTopColor: accent + '12' }]}>
        <PulseDot color={isConn ? COLOR.green : COLOR.red} size={4} />
        <Text style={[ib.statusTxt, { color: isConn ? COLOR.green + '70' : COLOR.red + '70' }]}>
          {isConn ? 'BUTLER AI · LOCAL LLM · ZERO CLOUD' : 'OFFLINE · PAIR PC FROM HOME TAB'}
        </Text>
        {text.length > 0 && <Text style={[ib.statusTxt, { color: accent + '55', marginLeft: 'auto' }]}>{text.length}/2000</Text>}
      </View>
    </View>
  );
}
const ib = StyleSheet.create({
  root:      { backgroundColor: COLOR.bg, borderTopWidth: 1.5 },
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 12, paddingVertical: 8 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 6, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 1 },
  connTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  inputWrap: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 11, paddingTop: 8, paddingBottom: 8, minHeight: 46, maxHeight: 120, backgroundColor: COLOR.surf, position: 'relative', overflow: 'hidden' },
  corner:    { position: 'absolute', width: 7, height: 7 },
  input:     { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, color: '#EEF4FF', lineHeight: 20, minHeight: 22, padding: 0 },
  sendBtn:   { width: 46, height: 46, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  status:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, borderTopWidth: 1 },
  statusTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', letterSpacing: 1 },
});

// ─── COMMAND PALETTE ─────────────────────────────────────────────
const CMD_ITEMS = [
  { icon: 'broom',          lib: 'c', label: 'Clean Temp',   sub: 'Delete temp files',   color: COLOR.green,   prompt: 'Write a Python script to clean all temp files and show freed MB' },
  { icon: 'speedometer',    lib: 'c', label: 'Performance',  sub: 'Top CPU processes',   color: COLOR.cyan,    prompt: 'Show PC performance: top 5 CPU processes, RAM, disk speeds' },
  { icon: 'shield-search',  lib: 'c', label: 'Security',     sub: 'Ports & processes',   color: COLOR.red,     prompt: 'Run a security scan: open ports, suspicious processes' },
  { icon: 'backup-restore', lib: 'c', label: 'Backup',       sub: 'ZIP to Desktop',      color: COLOR.amber,   prompt: 'Write script to backup Documents to Desktop as timestamped ZIP' },
  { icon: 'wifi-strength-4',lib: 'c', label: 'WiFi Info',    sub: 'Networks & signal',   color: COLOR.magenta, prompt: 'Show all WiFi networks, signal strength, current connection' },
  { icon: 'folder-cog',     lib: 'c', label: 'Sort Files',   sub: 'By extension',        color: COLOR.yellow,  prompt: 'Write Python to organize Downloads folder by file extension' },
];

function CommandPalette({ visible, accent, onSelect, onClose }: {
  visible: boolean; accent: string; onSelect: (p: string) => void; onClose: () => void;
}) {
  const slideY = useRef(new Animated.Value(360)).current;
  useEffect(() => {
    Animated.spring(slideY, { toValue: visible ? 0 : 360, tension: 100, friction: 14, useNativeDriver: false }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[cp.root, { transform: [{ translateY: slideY }] }]}>
      <View style={[cp.handle, { backgroundColor: accent + '35' }]} />
      <View style={cp.header}>
        <MaterialCommunityIcons name="console" size={13} color={accent} />
        <Text style={[cp.title, { color: accent }]}>COMMAND PALETTE</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={17} color={COLOR.mid} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingTop: 6, gap: 9, paddingBottom: 36 }}>
        {CMD_ITEMS.map((item, i) => {
          const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.medium(); onSelect(item.prompt); onClose(); }} activeOpacity={0.82}
              style={[cp.item, { borderColor: item.color + '40', borderTopColor: item.color, backgroundColor: glow(item.color, 7), width: `${33 - 1.5}%` as any }]}>
              <View style={[cp.itemIcon, { borderColor: item.color + '50', backgroundColor: glow(item.color, 12) }]}>
                <Icon name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={[cp.itemLabel, { color: item.color }]}>{item.label}</Text>
              <Text style={[cp.itemSub, { color: COLOR.dim }]}>{item.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
const cp = StyleSheet.create({
  root:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOR.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderTopWidth: 2, borderTopColor: COLOR.cyan + '35', zIndex: 300 },
  handle:   { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  title:    { fontFamily: MONO, fontSize: 12, fontWeight: '900', flex: 1, letterSpacing: 1 },
  item:     { alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, overflow: 'hidden' },
  itemIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  itemLabel:{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center' },
  itemSub:  { fontFamily: MONO, fontSize: 7.5, textAlign: 'center' },
});

// ─── SCRIPT BUILDER MODAL ────────────────────────────────────────
const BUILD_TEMPLATES = [
  'Monitor CPU usage and alert when above 80%',
  'Clean Downloads folder — delete files older than 30 days',
  'Find all large files (>100MB) on C: drive',
  'Auto-restart a process if it crashes',
  'Backup Desktop folder as timestamped ZIP',
];

function BuilderModal({ visible, accent, onClose, onBuild }: {
  visible: boolean; accent: string; onClose: () => void; onBuild: (p: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' }}>
        <View style={[bm.sheet, { borderTopColor: accent }]}>
          <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 6 }}>
            <View style={[bm.handle, { backgroundColor: accent + '35' }]} />
          </View>
          <Text style={[bm.title, { color: accent }]}>⚡ SCRIPT BUILDER</Text>
          <Text style={bm.sub}>Describe what you want to automate — Butler AI writes the Python script.</Text>
          <View style={[bm.inputWrap, { borderColor: accent + '40' }]}>
            <TextInput style={bm.input} value={prompt} onChangeText={setPrompt}
              placeholder="e.g. find all duplicate files..." placeholderTextColor={COLOR.dim}
              multiline numberOfLines={3} autoFocus autoCapitalize="none" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 14 }}>
            {BUILD_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} onPress={() => setPrompt(t)} activeOpacity={0.8}
                style={{ borderWidth: 1, borderColor: accent + '35', backgroundColor: glow(accent, 8), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: accent + 'CC' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 36 }}>
            <TouchableOpacity onPress={onClose} style={bm.cancelBtn} activeOpacity={0.8}>
              <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.mid }}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (prompt.trim()) { haptics.heavy(); onBuild(prompt.trim()); onClose(); setPrompt(''); } }}
              style={[bm.buildBtn, { backgroundColor: accent, opacity: prompt.trim() ? 1 : 0.4 }]}
              disabled={!prompt.trim()} activeOpacity={0.85}>
              <MaterialIcons name="bolt" size={18} color="#000" />
              <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' }}>BUILD SCRIPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const bm = StyleSheet.create({
  sheet:    { backgroundColor: COLOR.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 2.5, paddingHorizontal: 16 },
  handle:   { width: 38, height: 4, borderRadius: 2 },
  title:    { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  sub:      { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 13, color: COLOR.mid, marginBottom: 14, lineHeight: 19 },
  inputWrap:{ borderWidth: 1.5, borderRadius: 12, backgroundColor: COLOR.bg, paddingHorizontal: 12, marginBottom: 10 },
  input:    { fontSize: 14, color: '#EEF4FF', paddingVertical: 12, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', lineHeight: 20 },
  cancelBtn:{ flex: 1, borderWidth: 1, borderColor: COLOR.mid + '35', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buildBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});

// ─── OFFLINE QUICK REPLY ──────────────────────────────────────────
function getOfflineReply(text: string, noConn: boolean): string {
  const lc = text.toLowerCase();
  if (/^(hi|hello|hey)[!?.\s]*$/.test(lc)) return "Hello! I'm Butler AI — your local PC automation assistant.\n\nConnect your PC from HOME tab to unlock full AI powered by Ollama.";
  if (/what can you do|capabilities|help/.test(lc)) return 'I can:\n\n• Run Python scripts on your PC remotely\n• Monitor CPU, RAM, disk live\n• Clean files, manage processes\n• Chat with local Ollama AI (when PC is paired)\n• Build automation scripts\n\nConnect PC from HOME tab to start!';
  if (noConn) return "Your PC isn't connected.\n\nTo connect:\n1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan the QR code\n\nOnce paired, I can run scripts and answer with local AI.";
  return "Couldn't reach the AI engine.\n\nMake sure:\n1. butler_server.py is running\n2. Ollama is installed with a model loaded\n3. Same WiFi network\n\nTap PAIR PC on HOME tab to reconnect.";
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
const CONV_KEY = '@butler_conv_v9';

function ButlerInner() {
  const insets      = useSafeAreaInsets();
  const { T }       = useCosmetic();
  const accent      = T.primary   || COLOR.cyan;
  const secondary   = T.secondary || COLOR.green;
  const { isConnected } = useConnectionStatus();

  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [chatMode,    setChatMode]    = useState<Mode>('general');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [activeModel, setActiveModel] = useState('');

  const scrollRef  = useRef<FlatList<Msg>>(null);
  const { addEntry } = useChatHistory();

  // Load persisted chat
  useEffect(() => {
    (async () => {
      try {
        const raw = await encryptedStorage.getItem(CONV_KEY);
        if (raw) {
          const parsed = logger.safeJSON<Msg[]>(raw, [], '[Butler]');
          if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
        }
      } catch {}
    })();
  }, []);

  // Persist chat
  useEffect(() => {
    if (!messages.length) return;
    encryptedStorage.setItem(CONV_KEY, JSON.stringify(messages.slice(-80))).catch(() => {});
  }, [messages]);

  // Model detection
  useEffect(() => {
    if (!isConnected) { setActiveModel(''); return; }
    try {
      if (typeof nexusBridge.pickBestModel === 'function') {
        nexusBridge.pickBestModel(true).then((m: string) => { if (m) setActiveModel(m); }).catch(() => {});
      }
    } catch {}
  }, [isConnected]);

  const clearChat = useCallback(async () => {
    haptics.medium();
    setMessages([]);
    await encryptedStorage.removeItem(CONV_KEY).catch(() => {});
    autoResearch.clearCache();
  }, []);

  useEffect(() => {
    (global as any).__butlerClearChat = clearChat;
    return () => { delete (global as any).__butlerClearChat; };
  }, [clearChat]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const t0 = Date.now();
      const histCtx = buildHistoryOnly(messages.slice(-10));
      const [nexusCtx, metricsCtx] = await Promise.all([
        nexusBridge?.buildNexusContext?.(text, { maxLocal: 5, maxRelay: 3, timeoutMs: 3500, relayEnabled: isConnected, growthEnabled: false }).catch(() => null),
        serverMetrics.getContextString().catch(() => ''),
      ]);
      const kbCtx = nexusCtx?.fusedBlock || await knowledgeAccumulator.buildContext(text).catch(() => '');
      const modePrompt = MODE_PROMPTS[chatMode] || '';
      const personalCtx = await personalMemory.buildPersonalContext().catch(() => '');
      const sysPrompt = [
        BUTLER_KNOWLEDGE_COMPACT,
        typeof BUTLER_STYLE_GUIDE === 'string' ? BUTLER_STYLE_GUIDE : '',
        modePrompt ? `BEHAVIOR MODE:\n${modePrompt}` : '',
        metricsCtx ? `LIVE PC METRICS:\n${metricsCtx}` : '',
        kbCtx ? `KNOWLEDGE:\n${kbCtx.slice(0, 3000)}` : '',
        personalCtx || '',
      ].filter(Boolean).join('\n\n');

      if (!serverConnection.isConnected()) throw new Error('PC not connected');
      if (typeof nexusBridge?.chat !== 'function') throw new Error('AI bridge unavailable');

      const result = await nexusBridge.chat({
        messages: [{ role: 'system', content: sysPrompt }, ...histCtx, { role: 'user', content: text }],
        stream: false, model: activeModel || undefined,
      });
      const reply = result?.content || result?.message || result?.response || result?.text || 'No response received.';
      const rMs   = Date.now() - t0;
      const butlerMsg: Msg = { id: `b-${Date.now()}`, role: 'butler', content: reply, timestamp: Date.now(), metadata: { model: result?.model || '', responseMs: rMs } };
      setMessages(prev => [...prev, butlerMsg]);
      addEntry({ role: 'user',      content: text,  timestamp: Date.now() });
      addEntry({ role: 'assistant', content: reply, timestamp: Date.now() });
      knowledgeAccumulator.processExchange(text, reply).catch(() => {});
      knowledgeGrowthEngine.silentGrowth().catch(() => {});
    } catch (err: any) {
      const msg   = err?.message || 'Unknown error';
      const noC   = msg.toLowerCase().includes('not connected') || !serverConnection.isConnected();
      const reply = getOfflineReply(text, noC);
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: 'butler', content: reply, timestamp: Date.now() }]);
      autoErrorLogger.log('warn', '[ButlerV9] sendMessage', msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [isLoading, isConnected, messages, addEntry, chatMode, activeModel]);

  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    (global as any).__butlerInjectMessage = (t: string) => { if (t?.trim()) sendRef.current(t.trim()); };
    return () => { delete (global as any).__butlerInjectMessage; };
  }, []);

  const handleCopy = useCallback((t: string) => { haptics.light(); safeSetClipboard(t); }, []);
  const handleSave = useCallback(async (code: string) => {
    haptics.medium();
    try {
      await saveButlerScript(code, { title: `Butler_${Date.now()}` });
      (global as any).__showConnectionToast?.('Script saved to Scripts tab', COLOR.green);
    } catch { (global as any).__showConnectionToast?.('Save failed', COLOR.red); }
  }, []);
  const handleBuild = useCallback((prompt: string) => {
    sendMessage(`Write a production-quality Python script that: ${prompt}. Include full error handling and progress output.`);
  }, [sendMessage]);

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
      <BuilderModal visible={showBuilder} accent={accent} onClose={() => setShowBuilder(false)} onBuild={handleBuild} />
      <CommandPalette visible={showPalette} accent={accent} onSelect={sendMessage} onClose={() => setShowPalette(false)} />

      <ButlerHeader
        safeTop={insets.top} isConn={isConnected} model={activeModel}
        msgCount={messages.length}
        onClear={clearChat}
        onBuilder={() => setShowBuilder(true)}
        onPalette={() => setShowPalette(true)}
      />
      <ModeBar active={chatMode} onSelect={setChatMode} />

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

        <FlatList
          ref={scrollRef as any}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              msg={item} accent={accent} secondary={secondary}
              onCopy={handleCopy} onSave={handleSave}
              isLast={index === messages.length - 1}
            />
          )}
          ListEmptyComponent={
            <EmptyState isConn={isConnected} accent={accent} onSend={sendMessage} />
          }
          ListFooterComponent={
            isLoading ? <TypingIndicator accent={accent} /> : null
          }
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        {/* Quick commands strip */}
        {messages.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: accent + '12', backgroundColor: COLOR.bg }}>
            <TouchableOpacity onPress={() => { haptics.light(); setShowPalette(true); }} activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 7) }}>
              <MaterialCommunityIcons name="console" size={11} color={COLOR.amber} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.amber }}>CMDS</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
              {CMD_ITEMS.slice(0, 4).map((item, i) => {
                const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
                return (
                  <TouchableOpacity key={i} onPress={() => { haptics.light(); sendMessage(item.prompt); }} activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderColor: item.color + '40', backgroundColor: glow(item.color, 6) }}>
                    <Icon name={item.icon as any} size={9} color={item.color} />
                    <Text style={{ fontFamily: MONO, fontSize: 8, color: item.color }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <InputBar onSend={sendMessage} isConn={isConnected} disabled={isLoading} accent={accent} />
      </KeyboardAvoidingView>
    </View>
  );
}

export default function ButlerScreen() {
  return (
    <TabErrorBoundary name="Butler AI">
      <ButlerInner />
    </TabErrorBoundary>
  );
}
