/**
 * BUTLER AI — NEXUS COMMAND CONSOLE v11.0
 * Permanent big chat · welcome hero · rich shortcuts · cyberpunk neon design
 * Always shows welcome state with mascot, shortcuts, feature grid
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
  Animated, Dimensions, Modal, Pressable, FlatList, Easing,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
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
import { encryptedStorage } from '@/services/encryptedStorage';
import { logger } from '@/utils/logger';
import { safeSetClipboard } from '@/services/safeClipboard';
import { COLOR, FONT, SHADOW, glow } from '@/constants/tokens';

const MONO: any = FONT.mono;
const SANS: any = FONT.sans;
const SW = Dimensions.get('window').width;
const CONV_KEY = '@butler_conv_v11';

// ─── ASSETS ───────────────────────────────────────────────────────
let MASCOT: any = null;
try { MASCOT = require('@/assets/images/butler-robot-3d.png'); } catch {
  try { MASCOT = require('@/assets/images/mascot_shield_v2.png'); } catch {}
}

// ─── TYPES ────────────────────────────────────────────────────────
type Role = 'user' | 'butler' | 'system';
type Mode = 'general' | 'code' | 'debug' | 'analyze';

interface Msg {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  reaction?: string;
  metadata?: { model?: string; responseMs?: number; kbUsed?: number };
}

// ─── DESIGN CONSTANTS ────────────────────────────────────────────
const ACCENT_DEFAULT = COLOR.cyan;
const STRIPE = COLOR.stripe5;

// ─── PULSE DOT ────────────────────────────────────────────────────
function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { mounted.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ─── TYPEWRITER ───────────────────────────────────────────────────
const TICKER_LINES = [
  '>> butler.init() :: local_llm=ollama :: zero_cloud=true',
  '>> memory.load() :: aes256=active :: no_telemetry',
  '>> ollama.status :: ctx=8192 :: temperature=0.7',
  '>> knowledge.ready() :: 250_scripts :: lan_only=true',
  '>> butler.ready() :: pair_pc_to_unlock_live_ai',
];
function Ticker({ accent }: { accent: string }) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const line = TICKER_LINES[idx];
    if (chars < line.length) {
      const t = setTimeout(() => { if (mounted.current) setChars(c => c + 1); }, 20);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (mounted.current) { setIdx(i => (i + 1) % TICKER_LINES.length); setChars(0); }
    }, 2800);
    return () => clearTimeout(t);
  }, [chars, idx]);
  return (
    <Text style={{ fontFamily: MONO, fontSize: 9, color: accent + '90', flex: 1 }} numberOfLines={1}>
      {TICKER_LINES[idx].slice(0, chars)}
      <Text style={{ color: accent + '50' }}>▌</Text>
    </Text>
  );
}

// ─── MODE BAR ─────────────────────────────────────────────────────
const MODES: { id: Mode; label: string; icon: string; sub: string; color: string }[] = [
  { id: 'general', label: 'GENERAL',  icon: 'chat',       sub: 'All-round',    color: COLOR.cyan    },
  { id: 'code',    label: 'CODE',     icon: 'code',       sub: 'Python only',  color: COLOR.green   },
  { id: 'debug',   label: 'DEBUG',    icon: 'bug-report', sub: 'Fix errors',   color: COLOR.amber   },
  { id: 'analyze', label: 'ANALYZE',  icon: 'analytics',  sub: 'Deep logic',   color: COLOR.magenta },
];
const MODE_PROMPTS: Record<Mode, string> = {
  general: '',
  code:    'CODE MODE: Write production Python only. Always include full try/except error handling.',
  debug:   'DEBUG MODE: Analyze step-by-step. Show root cause, full traceback explanation, and corrected code.',
  analyze: 'ANALYZE MODE: Break down methodically. Show reasoning, pros/cons, data sources, then recommendations.',
};

function ModeBar({ active, onSelect, accent }: { active: Mode; onSelect: (m: Mode) => void; accent: string }) {
  return (
    <View style={modeBar.root}>
      {MODES.map(m => {
        const isAct = active === m.id;
        return (
          <TouchableOpacity key={m.id} onPress={() => { haptics.selection(); onSelect(m.id); }} activeOpacity={0.8}
            style={[modeBar.tab, isAct && { borderBottomWidth: 2.5, borderBottomColor: m.color, backgroundColor: glow(m.color, 9) }]}>
            <MaterialIcons name={m.icon as any} size={isAct ? 13 : 11} color={isAct ? m.color : COLOR.dim} />
            <Text style={[modeBar.txt, isAct && { color: m.color, fontWeight: '900' }]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const modeBar = StyleSheet.create({
  root: { flexDirection: 'row', backgroundColor: '#030A14', borderBottomWidth: 1, borderBottomColor: COLOR.border },
  tab:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  txt:  { fontFamily: MONO, fontSize: 9, fontWeight: '600', color: COLOR.dim },
});

// ─── HERO HEADER ──────────────────────────────────────────────────
function HeroHeader({ safeTop, isConn, model, msgCount, accent, onClear, onBuilder, onPalette }: {
  safeTop: number; isConn: boolean; model: string; msgCount: number; accent: string;
  onClear: () => void; onBuilder: () => void; onPalette: () => void;
}) {
  const cc = isConn ? COLOR.green : COLOR.red;
  const modelLbl = model
    ? model.split(':')[0].slice(0, 14).toUpperCase()
    : isConn ? '...' : 'OFFLINE';
  const scanX = useRef(new Animated.Value(-220)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanX, { toValue: SW + 220, duration: 3400, useNativeDriver: false }),
      Animated.timing(scanX, { toValue: -220, duration: 0, useNativeDriver: false }),
      Animated.delay(7000),
    ]));
    loop.start();
    return () => { mounted.current = false; loop.stop(); };
  }, []);

  return (
    <View style={[hh.root, { paddingTop: safeTop }]}>
      <Animated.View pointerEvents="none" style={[hh.scan, { transform: [{ translateX: scanX }] }]} />
      {/* 5-stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {STRIPE.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      {/* Brand row */}
      <View style={hh.brand}>
        <View style={[hh.mascotFrame, { borderColor: accent + '50', backgroundColor: glow(accent, 8) }]}>
          {MASCOT
            ? <Image source={MASCOT} style={{ width: 40, height: 50 }} contentFit="contain" />
            : <MaterialCommunityIcons name="robot-happy" size={24} color={accent} />}
          <View style={{ position: 'absolute', bottom: 2, right: 2 }}>
            <PulseDot color={cc} size={6} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={hh.brand_title}>
              <Text style={{ color: accent }}>{'{ '}</Text>
              <Text style={{ color: '#FFF' }}>BUTLER</Text>
              <Text style={{ color: COLOR.green }}>_AI</Text>
              <Text style={{ color: accent }}>{' }'}</Text>
            </Text>
            <View style={[hh.pill, { borderColor: cc + '55', backgroundColor: cc + '0C' }]}>
              <PulseDot color={cc} size={5} />
              <Text style={[hh.pillTxt, { color: cc }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
            </View>
            {modelLbl !== 'OFFLINE' && modelLbl !== '...' && (
              <View style={[hh.pill, { borderColor: COLOR.magenta + '45', backgroundColor: glow(COLOR.magenta, 7) }]}>
                <MaterialCommunityIcons name="brain" size={8} color={COLOR.magenta} />
                <Text style={[hh.pillTxt, { color: COLOR.magenta }]}>{modelLbl}</Text>
              </View>
            )}
          </View>
          <Text style={hh.sub}>
            {isConn ? '# local-ollama · lan-only · zero-cloud' : '# pair-pc-from-home · private-ai-chat'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={onBuilder} style={[hh.iconBtn, { borderColor: accent + '55', backgroundColor: glow(accent, 8) }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="code" size={14} color={accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPalette} style={[hh.iconBtn, { borderColor: COLOR.amber + '50', backgroundColor: glow(COLOR.amber, 7) }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="console" size={13} color={COLOR.amber} />
          </TouchableOpacity>
          {msgCount > 0 && (
            <TouchableOpacity onPress={onClear} style={[hh.iconBtn, { borderColor: COLOR.red + '40', backgroundColor: glow(COLOR.red, 6) }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="delete-sweep" size={14} color={COLOR.red + '80'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Ticker + counts */}
      <View style={hh.tickerRow}>
        <MaterialCommunityIcons name="radar" size={9} color={accent + '60'} />
        <Ticker accent={accent} />
        {msgCount > 0 && (
          <View style={[hh.pill, { borderColor: accent + '30', backgroundColor: glow(accent, 6) }]}>
            <MaterialIcons name="forum" size={8} color={accent} />
            <Text style={[hh.pillTxt, { color: accent }]}>{msgCount} MSG</Text>
          </View>
        )}
      </View>
      {/* Circuit bottom */}
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: accent + '20' }} />
        <View style={{ width: 12, backgroundColor: accent }} />
        <View style={{ flex: 4, backgroundColor: accent + '0A' }} />
      </View>
    </View>
  );
}
const hh = StyleSheet.create({
  root:         { backgroundColor: '#020609', overflow: 'hidden', ...SHADOW.dark },
  scan:         { position: 'absolute', top: 0, bottom: 0, width: 140, backgroundColor: 'rgba(0,229,255,0.02)', transform: [{ skewX: '-8deg' }], zIndex: 0 },
  brand:        { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7, zIndex: 1 },
  mascotFrame:  { width: 48, height: 58, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' },
  brand_title:  { fontFamily: MONO, fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },
  pill:         { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  pillTxt:      { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  sub:          { fontFamily: MONO, fontSize: 8.5, color: COLOR.mid, marginTop: 3, letterSpacing: 0.3 },
  iconBtn:      { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tickerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, zIndex: 1 },
});

// ─── WELCOME CARD (always visible when chat empty) ────────────────
const QUICK_CHIPS = [
  { icon: 'memory',            label: 'System Stats',      prompt: 'Show my CPU, RAM, and disk usage right now', color: COLOR.cyan    },
  { icon: 'cleaning-services', label: 'Clean Temp Files',  prompt: 'Write a Python script to clean all temp files on my PC', color: COLOR.green  },
  { icon: 'speed',             label: 'Top Processes',     prompt: 'Show the top 6 CPU-consuming processes on my PC', color: COLOR.amber   },
  { icon: 'wifi',              label: 'Network Info',      prompt: 'Show my local IP and all network interfaces', color: COLOR.magenta },
  { icon: 'storage',           label: 'Disk Usage',        prompt: 'Show disk usage breakdown by folder', color: COLOR.teal    },
  { icon: 'security',          label: 'Security Scan',     prompt: 'Run a quick security scan: open ports, suspicious processes', color: COLOR.red     },
  { icon: 'folder-special',    label: 'Sort Downloads',    prompt: 'Write Python to organize Downloads folder by file extension', color: COLOR.yellow  },
  { icon: 'help-outline',      label: 'What can you do?',  prompt: 'Tell me everything you can help me automate on my PC', color: COLOR.blue    },
];

const CAPABILITY_CARDS = [
  { icon: 'terminal',    lib: 'm', label: 'RUN SCRIPTS',  sub: 'Python on PC',       color: COLOR.cyan,    detail: 'Execute Python automation scripts remotely on your PC' },
  { icon: 'monitor',     lib: 'm', label: 'MONITOR PC',   sub: 'CPU · RAM · Disk',   color: COLOR.green,   detail: 'Live system metrics, process management, performance graphs' },
  { icon: 'lock',        lib: 'm', label: 'ZERO CLOUD',   sub: 'LAN only, private',  color: COLOR.amber,   detail: '100% local — no data ever leaves your home network' },
  { icon: 'brain',       lib: 'c', label: 'LOCAL LLM',    sub: 'Ollama powered',     color: COLOR.magenta, detail: 'Your own AI model runs on your hardware, zero subscriptions' },
  { icon: 'folder-open', lib: 'm', label: 'FILE OPS',     sub: 'Organize, backup',   color: COLOR.teal,    detail: 'Sort, clean, backup and manage files via automation scripts' },
  { icon: 'bolt',        lib: 'm', label: '250+ SCRIPTS', sub: 'Ready to run',       color: COLOR.yellow,  detail: 'Pre-built automation library covering every PC task' },
];

function WelcomeCard({ isConn, accent, onSend }: { isConn: boolean; accent: string; onSend: (p: string) => void }) {
  const floatA  = useRef(new Animated.Value(0)).current;
  const glowA   = useRef(new Animated.Value(0.3)).current;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const l1 = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ]));
    const l2 = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1600, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1600, useNativeDriver: false }),
    ]));
    l1.start(); l2.start();
    return () => { mounted.current = false; l1.stop(); l2.stop(); };
  }, []);

  const floatY  = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const borderC = glowA.interpolate({ inputRange: [0, 1], outputRange: [accent + '35', accent + '90'] });
  const cc = isConn ? COLOR.green : COLOR.red;

  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 }}>

      {/* ── MAIN HERO CARD ── */}
      <Animated.View style={[wc.heroCard, { borderColor: borderC,
        ...Platform.select({ ios: { shadowColor: accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20 }, android: { elevation: 10 } }) }]}>
        {/* Stripe top */}
        <View style={{ height: 3, flexDirection: 'row', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
          {STRIPE.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>

        {/* Mascot + Title row */}
        <View style={wc.heroInner}>
          <Animated.View style={{ transform: [{ translateY: floatY }], alignItems: 'center' }}>
            {MASCOT
              ? <Image source={MASCOT} style={{ width: 88, height: 110 }} contentFit="contain" />
              : <MaterialCommunityIcons name="robot-happy" size={80} color={accent} />}
            <View style={[wc.connBadge, { borderColor: cc + '55', backgroundColor: cc + '0B' }]}>
              <PulseDot color={cc} size={5} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: cc }}>
                {isConn ? 'PC ONLINE' : 'PAIR PC'}
              </Text>
            </View>
          </Animated.View>

          <View style={{ flex: 1, paddingLeft: 8, gap: 6 }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: accent + '70', letterSpacing: 2.5, fontWeight: '700' }}>
              AI COMMAND CENTER
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 26, fontWeight: '900', color: '#FFF', lineHeight: 30 }}>
              BUTLER<Text style={{ color: accent }}> AI</Text>
            </Text>
            <Text style={{ fontFamily: SANS, fontSize: 13, color: COLOR.mid, lineHeight: 20 }}>
              {'Your self-hosted AI\nassistant. Runs entirely\non your own PC.'}
            </Text>
            {/* Privacy badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
              {[
                { label: 'ZERO CLOUD',  col: COLOR.green,   icon: 'lock'      },
                { label: 'LAN ONLY',    col: COLOR.cyan,    icon: 'wifi'      },
                { label: 'OLLAMA AI',   col: COLOR.magenta, icon: 'psychology'},
              ].map(b => (
                <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: b.col + '45', backgroundColor: glow(b.col, 7) }}>
                  <MaterialIcons name={b.icon as any} size={8} color={b.col} />
                  <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: b.col }}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* How to connect banner (shown when offline) */}
        {!isConn && (
          <View style={[wc.connectBanner, { borderColor: COLOR.amber + '40', backgroundColor: glow(COLOR.amber, 7) }]}>
            <MaterialIcons name="info-outline" size={15} color={COLOR.amber} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.amber, marginBottom: 3 }}>HOW TO CONNECT</Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.amber + '90', lineHeight: 15 }}>
                {'1. Run butler_server.py on your PC\n2. Go to HOME tab → tap PAIR PC\n3. Scan the QR code shown in terminal'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── QUICK START CHIPS ── */}
      <View style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: accent }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: accent + '80', letterSpacing: 2 }}>QUICK START</Text>
          <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: accent + '30' }} />
          <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.dim }}>tap to send</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_CHIPS.map((chip, i) => (
            <Pressable key={i} onPress={() => { haptics.medium(); onSend(chip.prompt); }}
              style={({ pressed }) => [wc.chip, { borderColor: chip.color + '55', backgroundColor: pressed ? glow(chip.color, 22) : glow(chip.color, 10) }]}>
              <MaterialIcons name={chip.icon as any} size={11} color={chip.color} />
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: chip.color, fontWeight: '700' }}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── CAPABILITY GRID ── */}
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: COLOR.green }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.green + '80', letterSpacing: 2 }}>CAPABILITIES</Text>
          <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLOR.green + '30' }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CAPABILITY_CARDS.map((cap, i) => {
            const Icon = cap.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <View key={i} style={[wc.capCard, { borderColor: cap.color + '30', borderTopColor: cap.color, width: '47%' as any }]}>
                <View style={[wc.capIcon, { borderColor: cap.color + '55', backgroundColor: glow(cap.color, 12) }]}>
                  <Icon name={cap.icon as any} size={18} color={cap.color} />
                </View>
                <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: cap.color, marginBottom: 2 }}>{cap.label}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.mid }}>{cap.sub}</Text>
                <Text style={{ fontFamily: SANS, fontSize: 10, color: COLOR.dim, lineHeight: 14, marginTop: 5 }}>{cap.detail}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── PRIVACY CARD ── */}
      <View style={[wc.privCard, { borderColor: COLOR.green + '35', backgroundColor: glow(COLOR.green, 5) }]}>
        <View style={[wc.privIcon, { borderColor: COLOR.green + '50', backgroundColor: glow(COLOR.green, 12) }]}>
          <MaterialIcons name="verified-user" size={22} color={COLOR.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.green, marginBottom: 4 }}>PRIVACY FIRST — ZERO TELEMETRY</Text>
          <Text style={{ fontFamily: SANS, fontSize: 12, color: COLOR.mid, lineHeight: 18 }}>
            {'Unlike ChatGPT or Gemini, Butler AI never uploads your conversations, commands, or PC data anywhere. Everything stays on your home network forever. No API keys. No subscriptions. No surveillance.'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[
              { icon: 'visibility-off',    label: 'No Telemetry',   col: COLOR.green  },
              { icon: 'cloud-off',         label: 'No Cloud',       col: COLOR.cyan   },
              { icon: 'credit-card-off',   label: 'Free Forever',   col: COLOR.amber  },
              { icon: 'lock-outline',      label: 'AES-256',        col: COLOR.magenta},
            ].map(p => (
              <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderColor: p.col + '40', backgroundColor: glow(p.col, 7) }}>
                <MaterialIcons name={p.icon as any} size={10} color={p.col} />
                <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '700', color: p.col }}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── COMMAND SHORTCUTS ── */}
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: COLOR.amber }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.amber + '80', letterSpacing: 2 }}>COMMAND SHORTCUTS</Text>
          <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLOR.amber + '30' }} />
        </View>
        {[
          { cmd: 'show cpu',      desc: 'Real-time CPU usage',        col: COLOR.cyan   },
          { cmd: 'clean temp',    desc: 'Remove temp files',           col: COLOR.green  },
          { cmd: 'top processes', desc: 'List top CPU processes',      col: COLOR.amber  },
          { cmd: 'ip info',       desc: 'Network configuration',       col: COLOR.magenta},
          { cmd: 'disk usage',    desc: 'Storage breakdown by folder', col: COLOR.teal   },
          { cmd: 'write script',  desc: 'AI generates Python code',    col: COLOR.yellow },
        ].map((sh, i) => (
          <TouchableOpacity key={i} onPress={() => { haptics.light(); onSend(sh.desc); }} activeOpacity={0.8}
            style={[wc.shortcut, { borderLeftColor: sh.col }]}>
            <View style={[wc.shortcutTag, { borderColor: sh.col + '50', backgroundColor: glow(sh.col, 10) }]}>
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: sh.col }}>{sh.cmd}</Text>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid, flex: 1 }}>{sh.desc}</Text>
            <MaterialIcons name="arrow-forward" size={12} color={sh.col + '60'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── BOTTOM SPACER ── */}
      <View style={{ height: 20 }} />
    </View>
  );
}

const wc = StyleSheet.create({
  heroCard:    { backgroundColor: '#050D18', borderRadius: 16, borderWidth: 2, overflow: 'hidden' },
  heroInner:   { flexDirection: 'row', padding: 18, gap: 12, alignItems: 'flex-start' },
  connBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 10, alignSelf: 'center' },
  connectBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, margin: 14, marginTop: 0, borderWidth: 1, borderRadius: 10, padding: 13 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 24, paddingHorizontal: 13, paddingVertical: 9 },
  capCard:     { backgroundColor: '#040A14', borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, padding: 12, gap: 3, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  capIcon:     { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  privCard:    { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1.5, borderRadius: 14, padding: 16 },
  privIcon:    { width: 48, height: 48, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  shortcut:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 6, backgroundColor: '#040A14', borderRadius: 10, borderWidth: 1, borderLeftWidth: 3, borderColor: COLOR.border },
  shortcutTag: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
});

// ─── SESSION STATS BAR ─────────────────────────────────────────────
function SessionStats({ messages, accent }: { messages: Msg[]; accent: string }) {
  const turns   = messages.filter(m => m.role === 'user').length;
  const replies = messages.filter(m => m.role === 'butler').length;
  const times   = messages.filter(m => m.metadata?.responseMs).map(m => m.metadata!.responseMs!);
  const avgMs   = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  return (
    <View style={ss.root}>
      {[
        { label: 'MSGS',   val: String(turns),   col: accent       },
        { label: 'REPLIES',val: String(replies), col: COLOR.green  },
        { label: 'AVG',    val: avgMs > 0 ? (avgMs > 1000 ? `${(avgMs/1000).toFixed(1)}s` : `${avgMs}ms`) : '--', col: COLOR.amber },
        { label: 'MODE',   val: 'LAN',           col: COLOR.teal   },
      ].map((s, i, arr) => (
        <View key={i} style={[ss.cell, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: accent + '18' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: s.col }}>{s.val}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 7, color: COLOR.dim, letterSpacing: 0.8 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
const ss = StyleSheet.create({
  root: { flexDirection: 'row', marginHorizontal: 14, marginBottom: 10, borderWidth: 1, borderRadius: 12, borderColor: COLOR.border, backgroundColor: COLOR.surf, overflow: 'hidden' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
});

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubble({ msg, accent, secondary, onCopy, onSave, onReact }: {
  msg: Msg; accent: string; secondary: string;
  onCopy: (t: string) => void; onSave: (code: string) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const isButler = msg.role === 'butler';
  const mountA   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountA, { toValue: 1, tension: 130, friction: 12, useNativeDriver: false }).start();
  }, []);

  if (msg.role === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderColor: accent + '25', backgroundColor: glow(accent, 6) }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent + '80' }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: accent + '80' }}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  // Extract code blocks
  const codeBlocks: { code: string; lang: string }[] = [];
  const re = /```(python|py|bash|sh|javascript|js)?\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let displayText = msg.content;
  while ((match = re.exec(msg.content)) !== null) {
    codeBlocks.push({ code: match[2].trim(), lang: match[1] || 'python' });
  }
  if (codeBlocks.length > 0) {
    displayText = msg.content.replace(/```(python|py|bash|sh|javascript|js)?\s*\n[\s\S]*?```/g, '').trim();
  }

  const sc     = mountA.interpolate({ inputRange: [0, 1], outputRange: [0.91, 1] });
  const slideX = mountA.interpolate({ inputRange: [0, 1], outputRange: [isButler ? -24 : 24, 0] });
  const op     = mountA;
  const cc     = isButler ? accent : secondary;
  const time   = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable onLongPress={() => { haptics.medium(); onCopy(msg.content); }}>
      <Animated.View style={[bub.row, isButler ? bub.left : bub.right, { transform: [{ scale: sc }, { translateX: slideX }], opacity: op }]}>
        <View style={[bub.bubble, {
          borderColor: cc + (isButler ? '45' : '35'),
          borderLeftWidth: isButler ? 4 : 1.5,
          borderLeftColor: isButler ? cc : cc + '35',
          backgroundColor: isButler ? '#040A14' : glow(secondary, 11),
        }]}>
          {isButler && <View style={{ height: 2.5, backgroundColor: cc }} />}
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingTop: isButler ? 10 : 12, marginBottom: 8 }}>
            <View style={[bub.avatar, { borderColor: cc + '55', backgroundColor: glow(cc, 11) }]}>
              <MaterialIcons name={isButler ? 'smart-toy' : 'person'} size={13} color={cc} />
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: cc + 'BB' }}>
              {isButler ? 'Butler AI' : 'You'}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.dim }}>{time}</Text>
            {msg.metadata?.responseMs ? (
              <View style={[bub.speedPill, { borderColor: COLOR.green + '25', backgroundColor: glow(COLOR.green, 5) }]}>
                <MaterialIcons name="bolt" size={8} color={COLOR.green} />
                <Text style={{ fontFamily: MONO, fontSize: 7, color: COLOR.green }}>
                  {msg.metadata.responseMs > 1000
                    ? `${(msg.metadata.responseMs / 1000).toFixed(1)}s`
                    : `${msg.metadata.responseMs}ms`}
                </Text>
              </View>
            ) : null}
            {msg.reaction ? <Text style={{ fontSize: 14, marginLeft: 'auto' as any }}>{msg.reaction}</Text> : null}
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
                <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.cyan + '70', flex: 1, letterSpacing: 0.5 }}>
                  {cb.lang.toUpperCase()}
                </Text>
                <Pressable onPress={() => { haptics.light(); onCopy(cb.code); }}
                  style={({ pressed }) => [bub.codeBtn, { borderColor: COLOR.cyan + '35', backgroundColor: pressed ? glow(COLOR.cyan, 22) : 'transparent' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.cyan + '80' }}>COPY</Text>
                </Pressable>
                <Pressable onPress={() => { haptics.medium(); onSave(cb.code); }}
                  style={({ pressed }) => [bub.codeBtn, { borderColor: COLOR.green + '55', backgroundColor: pressed ? glow(COLOR.green, 22) : glow(COLOR.green, 9) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.green }}>SAVE</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={{ fontFamily: MONO, fontSize: 12.5, color: '#7EC8E3', padding: 13, lineHeight: 19 }}>{cb.code}</Text>
              </ScrollView>
            </View>
          ))}
          {/* Footer */}
          {isButler && (
            <View style={bub.footer}>
              {['\uD83D\uDC4D', '\uD83D\uDC4E', '\u2B50'].map(e => (
                <Pressable key={e} onPress={() => { haptics.light(); onReact(msg.id, e); }}
                  style={({ pressed }) => [bub.reactionBtn, {
                    backgroundColor: msg.reaction === e ? accent + '22' : pressed ? accent + '15' : 'transparent',
                    transform: [{ scale: msg.reaction === e ? 1.2 : pressed ? 0.8 : 1 }],
                  }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 14 }}>{e}</Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { haptics.light(); onCopy(msg.content); }}
                style={({ pressed }) => [bub.footerIconBtn, { backgroundColor: pressed ? glow(COLOR.mid, 15) : 'transparent' }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="content-copy" size={13} color={COLOR.dim} />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
const bub = StyleSheet.create({
  row:         { paddingHorizontal: 12, marginBottom: 14 },
  left:        { alignItems: 'flex-start' },
  right:       { alignItems: 'flex-end' },
  bubble:      { maxWidth: Math.min(SW * 0.90, 520), borderWidth: 1.5, borderRadius: 16, overflow: 'hidden' },
  avatar:      { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content:     { fontFamily: SANS, fontSize: 15, lineHeight: 23 },
  speedPill:   { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  codeWrap:    { borderTopWidth: 1, marginTop: 8 },
  codeHdr:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,229,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.12)' },
  codeBtn:     { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  footer:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  reactionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  footerIconBtn:{ width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});

// ─── TYPING INDICATOR ─────────────────────────────────────────────
const THINK = ['Thinking...', 'Allow me...', 'One moment...', 'Processing...', 'Right away...'];
function TypingIndicator({ accent }: { accent: string }) {
  const bars    = useRef(Array.from({ length: 9 }, () => new Animated.Value(0.15))).current;
  const [ph, setPh] = useState(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const loops = bars.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 70),
        Animated.timing(a, { toValue: 1,    duration: 240, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(a, { toValue: 0.15, duration: 240, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.delay(Math.max(0, (9 - i) * 40)),
      ]))
    );
    loops.forEach(l => l.start());
    const t = setInterval(() => { if (mounted.current) setPh(p => (p + 1) % THINK.length); }, 2600);
    return () => { mounted.current = false; loops.forEach(l => l.stop()); clearInterval(t); };
  }, []);

  return (
    <View style={[typ.wrap, { borderColor: accent + '40', borderLeftColor: accent }]}>
      <View style={[typ.bar, { backgroundColor: accent }]} />
      <View style={typ.inner}>
        <View style={[typ.avatar, { borderColor: accent + '60', backgroundColor: glow(accent, 12) }]}>
          <MaterialIcons name="smart-toy" size={16} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: accent, letterSpacing: 0.5 }}>
            {THINK[ph]}
          </Text>
          <Text style={{ fontFamily: SANS, fontSize: 11, color: COLOR.mid }}>Local AI — zero cloud</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 18 }}>
            {bars.map((a, i) => (
              <Animated.View key={i} style={{
                width: 3, borderRadius: 2, backgroundColor: accent,
                height: a.interpolate({ inputRange: [0.15, 1], outputRange: [3, 15] }) as any,
                opacity: a.interpolate({ inputRange: [0.15, 1], outputRange: [0.3, 1] }) as any,
              }} />
            ))}
          </View>
        </View>
        <View style={[typ.live, { borderColor: accent + '40', backgroundColor: glow(accent, 8) }]}>
          <Text style={{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: accent }}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}
const typ = StyleSheet.create({
  wrap:   { marginHorizontal: 12, marginBottom: 14, borderWidth: 1.5, borderLeftWidth: 4, borderRadius: 13, backgroundColor: COLOR.surf, overflow: 'hidden' },
  bar:    { height: 2 },
  inner:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  avatar: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  live:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
});

// ─── CONTEXT SUGGESTION RAIL ──────────────────────────────────────
const CTX_SUGG: Record<string, { icon: string; label: string; prompt: string }[]> = {
  script: [
    { icon: 'save',       label: 'Save script',  prompt: 'Save this script to my library' },
    { icon: 'play-arrow', label: 'Run it now',   prompt: 'Run this script on my PC right now' },
    { icon: 'bug-report', label: 'Debug it',     prompt: 'Debug and fix any issues in this script' },
  ],
  cpu: [
    { icon: 'memory',             label: 'CPU breakdown',  prompt: 'Show detailed CPU usage by each process' },
    { icon: 'cleaning-services',  label: 'Free RAM',       prompt: 'Write a script to free up RAM by killing background tasks' },
  ],
  file: [
    { icon: 'folder-special', label: 'Sort files',  prompt: 'Write a script to organize all files in Downloads by type' },
    { icon: 'find-in-page',   label: 'Find dupes',  prompt: 'Find all duplicate files using MD5 hash comparison' },
  ],
  default: [
    { icon: 'psychology',    label: 'Tell me more', prompt: 'Tell me more about that' },
    { icon: 'code',          label: 'Write script', prompt: 'Write a Python script for this' },
    { icon: 'help-outline',  label: 'Explain',      prompt: 'Explain that in simpler terms' },
    { icon: 'arrow-forward', label: 'Next step',    prompt: 'What should I do next?' },
  ],
};
function getCtxKey(txt: string): string {
  if (/script|python|code/i.test(txt))  return 'script';
  if (/cpu|ram|memory|process/i.test(txt)) return 'cpu';
  if (/file|folder|disk|storage/i.test(txt)) return 'file';
  return 'default';
}

function ContextRail({ lastReply, accent, onTap }: { lastReply: string; accent: string; onTap: (p: string) => void }) {
  const key  = getCtxKey(lastReply);
  const sugg = CTX_SUGG[key] || CTX_SUGG.default;
  const fadeA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeA, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [lastReply]);
  return (
    <Animated.View style={{ opacity: fadeA, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 6 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent }} />
        <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: accent + '70', letterSpacing: 1.8 }}>FOLLOW-UPS</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: accent + '18' }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
        {sugg.map((s, i) => (
          <Pressable key={i} onPress={() => { haptics.medium(); onTap(s.prompt); }}
            style={({ pressed }) => [cr.chip, { borderColor: accent + '45', backgroundColor: pressed ? glow(accent, 20) : glow(accent, 10) }]}>
            <MaterialIcons name={s.icon as any} size={13} color={accent + 'CC'} />
            <Text style={{ fontFamily: SANS, fontSize: 12, fontWeight: '600', color: accent + 'CC' }}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
const cr = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 },
});

// ─── COMMAND PALETTE ──────────────────────────────────────────────
const CMD_ITEMS = [
  { icon: 'broom',           lib: 'c', label: 'Clean Temp',  sub: 'Temp purge',      color: COLOR.green,   prompt: 'Write Python to clean all temp files and show freed MB' },
  { icon: 'speedometer',     lib: 'c', label: 'Performance', sub: 'CPU & RAM',       color: COLOR.cyan,    prompt: 'Show PC: top 5 CPU processes, RAM usage, disk speeds' },
  { icon: 'shield-search',   lib: 'c', label: 'Security',    sub: 'Ports & threats', color: COLOR.red,     prompt: 'Security scan: open ports, suspicious processes, SSL check' },
  { icon: 'backup-restore',  lib: 'c', label: 'Backup',      sub: 'ZIP to Desktop',  color: COLOR.amber,   prompt: 'Backup Documents to Desktop as timestamped ZIP' },
  { icon: 'wifi-strength-4', lib: 'c', label: 'WiFi',        sub: 'Signal & nets',   color: COLOR.magenta, prompt: 'Show all WiFi networks, signal strength, current connection' },
  { icon: 'folder-cog',      lib: 'c', label: 'Sort Files',  sub: 'By extension',    color: COLOR.yellow,  prompt: 'Organize Downloads folder by file extension into subfolders' },
];

function CommandPalette({ visible, accent, onSelect, onClose }: {
  visible: boolean; accent: string; onSelect: (p: string) => void; onClose: () => void;
}) {
  const slideY = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    Animated.spring(slideY, { toValue: visible ? 0 : 400, tension: 100, friction: 14, useNativeDriver: false }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[pal.root, { transform: [{ translateY: slideY }] }]}>
      <View style={[pal.handle, { backgroundColor: accent + '35' }]} />
      <View style={pal.hdr}>
        <MaterialCommunityIcons name="console" size={14} color={accent} />
        <Text style={[pal.title, { color: accent }]}>COMMAND PALETTE</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={18} color={COLOR.mid} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingTop: 6, gap: 9, paddingBottom: 36 }}>
        {CMD_ITEMS.map((item, i) => {
          const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.medium(); onSelect(item.prompt); onClose(); }} activeOpacity={0.82}
              style={[pal.item, { borderColor: item.color + '40', borderTopColor: item.color, backgroundColor: glow(item.color, 7), width: '31%' as any }]}>
              <View style={[pal.itemIcon, { borderColor: item.color + '50', backgroundColor: glow(item.color, 12) }]}>
                <Icon name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[pal.itemLbl, { color: item.color }]}>{item.label}</Text>
              <Text style={[pal.itemSub, { color: COLOR.dim }]}>{item.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
const pal = StyleSheet.create({
  root:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOR.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 2, borderTopColor: COLOR.cyan + '35', zIndex: 300 },
  handle:  { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 12, marginBottom: 4 },
  hdr:     { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  title:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', flex: 1, letterSpacing: 1 },
  item:    { alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, overflow: 'hidden' },
  itemIcon:{ width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  itemLbl: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', textAlign: 'center' },
  itemSub: { fontFamily: MONO, fontSize: 7.5, textAlign: 'center' },
});

// ─── SCRIPT BUILDER MODAL ─────────────────────────────────────────
const BUILD_TEMPLATES = [
  'Monitor CPU usage every 5s, alert if above 80%',
  'Clean Downloads — delete files older than 30 days',
  'Find all large files over 100MB on C: drive',
  'Auto-restart a process if it crashes',
  'Backup Desktop as timestamped ZIP file',
  'Watch a folder and log new files automatically',
];

function BuilderModal({ visible, accent, onClose, onBuild }: {
  visible: boolean; accent: string; onClose: () => void; onBuild: (p: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <View style={[bld.sheet, { borderTopColor: accent }]}>
          <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 8 }}>
            <View style={[bld.handle, { backgroundColor: accent + '35' }]} />
          </View>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <View style={[bld.headerIcon, { borderColor: accent + '55', backgroundColor: glow(accent, 10) }]}>
              <MaterialIcons name="bolt" size={20} color={accent} />
            </View>
            <View>
              <Text style={[bld.title, { color: accent }]}>SCRIPT BUILDER</Text>
              <Text style={bld.sub}>Describe it — Butler AI writes the Python script</Text>
            </View>
          </View>
          <View style={[bld.inputWrap, { borderColor: accent + '45' }]}>
            <TextInput style={bld.input} value={prompt} onChangeText={setPrompt}
              placeholder="e.g. find all duplicate files and list them..." placeholderTextColor={COLOR.dim}
              multiline numberOfLines={3} autoFocus autoCapitalize="none" />
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.dim, marginBottom: 8, paddingHorizontal: 1 }}>
            TEMPLATES — TAP TO USE
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {BUILD_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} onPress={() => setPrompt(t)} activeOpacity={0.8}
                style={{ borderWidth: 1, borderColor: accent + '35', backgroundColor: glow(accent, 8), borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: accent + 'CC' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 36 }}>
            <TouchableOpacity onPress={onClose} style={bld.cancelBtn} activeOpacity={0.8}>
              <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.mid }}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (prompt.trim()) { haptics.heavy(); onBuild(prompt.trim()); onClose(); setPrompt(''); } }}
              style={[bld.buildBtn, { backgroundColor: accent, opacity: prompt.trim() ? 1 : 0.4 }]}
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
const bld = StyleSheet.create({
  sheet:      { backgroundColor: COLOR.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 2.5, paddingHorizontal: 18 },
  handle:     { width: 40, height: 4, borderRadius: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontFamily: MONO, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  sub:        { fontFamily: SANS, fontSize: 12, color: COLOR.mid, lineHeight: 18, marginTop: 2 },
  inputWrap:  { borderWidth: 1.5, borderRadius: 12, backgroundColor: COLOR.bg, paddingHorizontal: 13, marginBottom: 12 },
  input:      { fontSize: 14, color: '#EEF4FF', paddingVertical: 12, fontFamily: SANS, lineHeight: 20 },
  cancelBtn:  { flex: 1, borderWidth: 1, borderColor: COLOR.mid + '35', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buildBtn:   { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});

// ─── INPUT BAR ────────────────────────────────────────────────────
function InputBar({ onSend, isConn, disabled, accent }: {
  onSend: (t: string) => void; isConn: boolean; disabled: boolean; accent: string;
}) {
  const [text, setText]     = useState('');
  const [focused, setFocused] = useState(false);
  const sendScaleA = useRef(new Animated.Value(1)).current;
  const borderA    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderA, {
      toValue: focused ? 1 : text.length > 0 ? 0.5 : 0,
      duration: 180, useNativeDriver: false,
    }).start();
  }, [focused, text.length]);

  const handleSend = () => {
    const t = text.trim();
    if (!t || disabled) return;
    haptics.heavy();
    Animated.sequence([
      Animated.timing(sendScaleA,  { toValue: 0.68, duration: 70,  useNativeDriver: true }),
      Animated.spring(sendScaleA,  { toValue: 1.15, tension: 460, friction: 5,  useNativeDriver: true }),
      Animated.spring(sendScaleA,  { toValue: 1,    tension: 300, friction: 12, useNativeDriver: true }),
    ]).start();
    onSend(t);
    setText('');
  };

  const hasText  = text.trim().length > 0;
  const cc       = isConn ? COLOR.green : COLOR.red;
  const borderCol = borderA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [accent + '25', accent + '70', accent + 'EE'] });

  return (
    <View style={[inp.root, { borderTopColor: accent + '18' }]}>
      {/* 5-color stripe — dimmed when unfocused */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {STRIPE.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c, opacity: focused ? 1 : 0.3 }} />)}
      </View>
      <View style={inp.row}>
        {/* PC status pill */}
        <View style={[inp.connPill, { borderColor: cc + '45', backgroundColor: cc + '0A' }]}>
          <PulseDot color={cc} size={5} />
          <Text style={[inp.connTxt, { color: cc }]}>{isConn ? 'PC' : 'OFF'}</Text>
        </View>
        {/* Input area */}
        <Animated.View style={[inp.inputWrap, { borderColor: borderCol,
          ...(Platform.OS === 'ios' && focused ? { shadowColor: accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 12 } : {}) }]}>
          {focused && (
            <>
              <View style={[inp.corner, { top: 2, left: 2,  borderTopWidth: 1.5,    borderLeftWidth: 1.5,  borderColor: accent }]} />
              <View style={[inp.corner, { top: 2, right: 2, borderTopWidth: 1.5,    borderRightWidth: 1.5, borderColor: accent }]} />
              <View style={[inp.corner, { bottom: 2, left: 2,  borderBottomWidth: 1.5, borderLeftWidth: 1.5,  borderColor: accent }]} />
              <View style={[inp.corner, { bottom: 2, right: 2, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: accent }]} />
            </>
          )}
          <TextInput
            style={inp.input}
            value={text}
            onChangeText={v => { setText(v); autoResearch.notifyTyping(v); }}
            placeholder={isConn ? 'Ask Butler anything about your PC...' : 'Pair your PC from HOME tab to start...'}
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
          {text.length > 1800 && (
            <Text style={{ fontFamily: MONO, fontSize: 8, color: text.length > 1950 ? COLOR.red : accent + '70', alignSelf: 'flex-end', paddingBottom: 4 }}>
              {2000 - text.length}
            </Text>
          )}
        </Animated.View>
        {/* Send button */}
        <Animated.View style={{ transform: [{ scale: sendScaleA }] }}>
          <TouchableOpacity onPress={handleSend} disabled={disabled || !hasText} activeOpacity={0.88}
            style={[inp.sendBtn, {
              backgroundColor: hasText && !disabled ? accent : COLOR.surf,
              borderColor: accent + (hasText && !disabled ? 'CC' : '30'),
              ...(Platform.OS === 'ios' ? {
                shadowColor: accent,
                shadowOffset: { width: 0, height: hasText ? 7 : 2 },
                shadowOpacity: hasText && !disabled ? 0.95 : 0.15,
                shadowRadius: hasText ? 16 : 5,
              } : { elevation: hasText && !disabled ? 12 : 2 }),
            }]}>
            {disabled
              ? <ActivityIndicator size="small" color={accent} />
              : <MaterialIcons name={hasText ? 'send' : 'chevron-right'} size={20} color={hasText && !disabled ? '#000' : accent + '55'} />}
          </TouchableOpacity>
        </Animated.View>
      </View>
      {/* Status bar */}
      <View style={[inp.statusBar, { borderTopColor: accent + '12' }]}>
        <PulseDot color={isConn ? COLOR.green : COLOR.red} size={4} />
        <Text style={[inp.statusTxt, { color: isConn ? COLOR.green + '70' : COLOR.red + '70' }]}>
          {isConn ? 'BUTLER AI · LOCAL LLM · ZERO CLOUD' : 'OFFLINE · PAIR PC FROM HOME TAB'}
        </Text>
        {text.length > 0 && (
          <Text style={[inp.statusTxt, { color: accent + '55', marginLeft: 'auto' as any }]}>{text.length}/2000</Text>
        )}
      </View>
    </View>
  );
}
const inp = StyleSheet.create({
  root:      { backgroundColor: COLOR.bg, borderTopWidth: 1.5 },
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 11, paddingVertical: 8 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 7, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 1 },
  connTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  inputWrap: { flex: 1, borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 9, minHeight: 48, maxHeight: 130, backgroundColor: COLOR.surf, position: 'relative', overflow: 'hidden' },
  corner:    { position: 'absolute', width: 7, height: 7 },
  input:     { fontFamily: SANS, fontSize: 15, color: '#EEF4FF', lineHeight: 21, minHeight: 24, padding: 0 },
  sendBtn:   { width: 48, height: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, borderTopWidth: 1 },
  statusTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', letterSpacing: 1 },
});

// ─── QUICK COMMAND STRIP (shown when messages exist) ──────────────
function QuickStrip({ accent, onPalette, onCmd }: { accent: string; onPalette: () => void; onCmd: (p: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: accent + '12', backgroundColor: COLOR.bg }}>
      <TouchableOpacity onPress={() => { haptics.light(); onPalette(); }} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 7) }}>
        <MaterialCommunityIcons name="console" size={11} color={COLOR.amber} />
        <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.amber }}>CMDS</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
        {CMD_ITEMS.slice(0, 5).map((item, i) => {
          const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.light(); onCmd(item.prompt); }} activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5, borderColor: item.color + '40', backgroundColor: glow(item.color, 6) }}>
              <Icon name={item.icon as any} size={9} color={item.color} />
              <Text style={{ fontFamily: MONO, fontSize: 8.5, color: item.color }}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── OFFLINE REPLY ────────────────────────────────────────────────
function getOfflineReply(text: string, noConn: boolean): string {
  const lc = text.toLowerCase();
  if (/^(hi|hello|hey)[!?.\s]*$/.test(lc))
    return "Hello! I'm Butler AI — your local PC automation assistant.\n\nTo get started:\n1. Run butler_server.py on your PC\n2. Go to HOME tab → tap PAIR PC\n3. Scan the QR code\n\nOnce paired, I can run scripts, answer questions with local AI (Ollama), and monitor your PC live.";
  if (/what can you do|capabilities|help|features/.test(lc))
    return '• Run Python scripts on your PC remotely\n• Monitor CPU, RAM, and disk usage live\n• Clean temp files, manage processes\n• Network diagnostics and WiFi info\n• Chat with local Ollama AI (when PC paired)\n• Build automation scripts on demand\n• 250+ pre-built automation scripts ready to run';
  if (noConn)
    return "Your PC isn't connected right now.\n\nTo connect:\n1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan the QR code shown in terminal\n\nOnce connected, I can run scripts and answer with your local AI.";
  return "Couldn't reach the AI engine.\n\nMake sure:\n1. butler_server.py is still running\n2. Ollama is installed (run: ollama list)\n3. Your phone and PC are on the same WiFi\n\nTap PAIR PC on HOME tab to reconnect.";
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function ButlerInner() {
  const insets      = useSafeAreaInsets();
  const { T }       = useCosmetic();
  const accent      = T.primary   || ACCENT_DEFAULT;
  const secondary   = T.secondary || COLOR.green;
  const { isConnected } = useConnectionStatus();

  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [chatMode,    setChatMode]    = useState<Mode>('general');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [activeModel, setActiveModel] = useState('');
  const [lastReply,   setLastReply]   = useState('');
  const [showCtxRail, setShowCtxRail] = useState(false);

  const listRef    = useRef<FlatList<Msg>>(null);
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
    setLastReply('');
    setShowCtxRail(false);
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
    setShowCtxRail(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const t0      = Date.now();
      const histCtx = buildHistoryOnly(messages.slice(-10));
      const [nexusCtx, metricsCtx] = await Promise.all([
        nexusBridge?.buildNexusContext?.(text, { maxLocal: 5, maxRelay: 3, timeoutMs: 3500, relayEnabled: isConnected, growthEnabled: false }).catch(() => null),
        serverMetrics.getContextString().catch(() => ''),
      ]);
      const kbCtx      = nexusCtx?.fusedBlock || await knowledgeAccumulator.buildContext(text).catch(() => '');
      const modePrompt = MODE_PROMPTS[chatMode] || '';
      const personalCtx = await personalMemory.buildPersonalContext().catch(() => '');
      const sysPrompt  = [
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
        messages: [
          { role: 'system', content: sysPrompt },
          ...histCtx,
          { role: 'user', content: text },
        ],
        stream: false,
        model:  activeModel || undefined,
      });

      const reply = result?.content || result?.message || result?.response || result?.text || 'No response received.';
      const rMs   = Date.now() - t0;
      let kbUsed  = nexusCtx ? nexusCtx.localFindings.length + nexusCtx.relayFindings.length : 0;
      if (kbUsed === 0 && kbCtx) kbUsed = (kbCtx.match(/\n---\n/g) || []).length + 1;

      const butlerMsg: Msg = {
        id: `b-${Date.now()}`, role: 'butler', content: reply,
        timestamp: Date.now(), metadata: { model: result?.model || '', responseMs: rMs, kbUsed },
      };
      setMessages(prev => [...prev, butlerMsg]);
      setLastReply(reply);
      setShowCtxRail(true);
      addEntry({ role: 'user',      content: text,  timestamp: Date.now() });
      addEntry({ role: 'assistant', content: reply, timestamp: Date.now() });
      knowledgeAccumulator.processExchange(text, reply).catch(() => {});
      knowledgeGrowthEngine.silentGrowth().catch(() => {});
    } catch (err: any) {
      const msg  = err?.message || 'Unknown error';
      const noC  = msg.toLowerCase().includes('not connected') || !serverConnection.isConnected();
      const reply = getOfflineReply(text, noC);
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: 'butler', content: reply, timestamp: Date.now() }]);
      setLastReply(reply);
      setShowCtxRail(true);
      autoErrorLogger.log('warn', '[ButlerV11] sendMessage', msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [isLoading, isConnected, messages, addEntry, chatMode, activeModel]);

  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);
  useEffect(() => {
    (global as any).__butlerInjectMessage = (t: string) => { if (t?.trim()) sendRef.current(t.trim()); };
    return () => { delete (global as any).__butlerInjectMessage; };
  }, []);

  const handleCopy  = useCallback((t: string) => { haptics.light(); safeSetClipboard(t); }, []);
  const handleReact = useCallback((id: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m));
  }, []);
  const handleSave  = useCallback(async (code: string) => {
    haptics.medium();
    try {
      await saveButlerScript(code, { title: `Butler_${Date.now()}` });
      (global as any).__showConnectionToast?.('Script saved to FORGE tab', COLOR.green);
    } catch {
      (global as any).__showConnectionToast?.('Save failed', COLOR.red);
    }
  }, []);
  const handleBuild = useCallback((prompt: string) => {
    sendMessage(`Write a production-quality Python script that: ${prompt}. Include full error handling, progress output, and clear comments.`);
  }, [sendMessage]);

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
      <BuilderModal visible={showBuilder} accent={accent} onClose={() => setShowBuilder(false)} onBuild={handleBuild} />
      <CommandPalette visible={showPalette} accent={accent} onSelect={sendMessage} onClose={() => setShowPalette(false)} />

      {/* ── HEADER ── */}
      <HeroHeader
        safeTop={insets.top}
        isConn={isConnected}
        model={activeModel}
        msgCount={messages.length}
        accent={accent}
        onClear={clearChat}
        onBuilder={() => setShowBuilder(true)}
        onPalette={() => setShowPalette(true)}
      />

      {/* ── MODE BAR ── */}
      <ModeBar active={chatMode} onSelect={setChatMode} accent={accent} />

      {/* ── MAIN CHAT ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef as any}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item} accent={accent} secondary={secondary}
              onCopy={handleCopy} onSave={handleSave} onReact={handleReact}
            />
          )}
          // ── ALWAYS show welcome / empty state ──
          ListEmptyComponent={
            <WelcomeCard isConn={isConnected} accent={accent} onSend={sendMessage} />
          }
          ListHeaderComponent={messages.length > 0 ? (
            <SessionStats messages={messages} accent={accent} />
          ) : null}
          ListFooterComponent={
            <>
              {messages.length > 0 && showCtxRail && !isLoading && lastReply && (
                <ContextRail lastReply={lastReply} accent={accent} onTap={sendMessage} />
              )}
              {isLoading && <TypingIndicator accent={accent} />}
              <View style={{ height: 10 }} />
            </>
          }
          contentContainerStyle={{ paddingTop: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          initialNumToRender={14}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        {/* ── QUICK COMMANDS (when chat has messages) ── */}
        {messages.length > 0 && (
          <QuickStrip accent={accent} onPalette={() => setShowPalette(true)} onCmd={sendMessage} />
        )}

        {/* ── INPUT BAR ── */}
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
