/**
 * BUTLER AI — AI CHAT v12.0 · HOLOGRAPHIC TERMINAL
 * Completely different visual from all previous versions.
 * Design: holographic glass panels · amber/gold accent · scan-line overlays
 * · floating message cards with depth shadows · waveform typing indicator
 * All backend logic from v11 preserved exactly — only UI changed.
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
import { FONT, COLOR, glow } from '@/constants/tokens';

const MONO: any = FONT.mono;
const SANS: any = FONT.sans;
const SW = Dimensions.get('window').width;
const CONV_KEY = '@butler_conv_v12';

// ─── ASSET ────────────────────────────────────────────────────────
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

// ─── DESIGN CONSTANTS ─────────────────────────────────────────────
// Holographic amber/gold theme — completely different from cyan
const BG       = '#07040E';      // ultra dark purple-black
const SURFACE  = '#100920';      // deep indigo surface
const SURFACE2 = '#16102E';
const GOLD     = '#FFD166';      // primary accent — warm gold
const AMBER    = '#FF9F1C';      // secondary
const VIOLET   = '#7B4FE9';      // highlight
const TEAL     = '#06D6A0';      // success / connected
const RED      = '#EF233C';
const MID      = '#5A4680';
const DIM      = '#2E1E50';
const TEXT     = '#EDE4FF';
const TEXT2    = '#9580C8';

const MODE_PROMPTS: Record<Mode, string> = {
  general: '',
  code:    'CODE MODE: Write production Python only. Always include full try/except error handling.',
  debug:   'DEBUG MODE: Analyze step-by-step. Show root cause, full traceback explanation, and corrected code.',
  analyze: 'ANALYZE MODE: Break down methodically. Show reasoning, pros/cons, data sources, then recommendations.',
};

// ─── LIVE CLOCK ─────────────────────────────────────────────────
function useClock() {
  const [time, setTime]    = useState('');
  const [secs, setSecs]    = useState('');
  const [dateStr, setDate] = useState('');
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
      setDate(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    update(); const t = setInterval(update, 1000); return () => clearInterval(t);
  }, []);
  return { time, secs, dateStr };
}

// ─── HOLOGRAPHIC SCANLINE OVERLAY ────────────────────────────────
function ScanlineOverlay() {
  const moveA = useRef(new Animated.Value(-200)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(moveA, { toValue: 400, duration: 4000, useNativeDriver: true }),
      Animated.timing(moveA, { toValue: -200, duration: 0,   useNativeDriver: true }),
      Animated.delay(8000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, {
        transform: [{ translateY: moveA }],
        zIndex: 0,
      }]}
    >
      <View style={{
        width: '100%', height: 120,
        background: 'transparent',
        borderTopWidth: 1,
        borderTopColor: GOLD + '14',
        borderBottomWidth: 1,
        borderBottomColor: GOLD + '08',
      } as any} />
    </Animated.View>
  );
}

// ─── GLOWING DOT ─────────────────────────────────────────────────
function GlowDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a,
    ...(Platform.OS === 'ios' ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 } : {}) }} />;
}

// ─── HOLOGRAPHIC HEADER ───────────────────────────────────────────
function HoloHeader({ safeTop, isConn, model, msgCount, onClear, onBuilder, onPalette }: {
  safeTop: number; isConn: boolean; model: string; msgCount: number;
  onClear: () => void; onBuilder: () => void; onPalette: () => void;
}) {
  const { time, secs, dateStr } = useClock();
  const cc = isConn ? TEAL : AMBER;
  const shimA = useRef(new Animated.Value(-SW)).current;
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.8, duration: 2400, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW, duration: 0, useNativeDriver: true }),
      Animated.delay(9000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);

  const modelLbl = model
    ? model.split(':')[0].slice(0, 16).toUpperCase()
    : isConn ? 'LOADING' : 'OFFLINE';

  return (
    <View style={[hh.root, { paddingTop: safeTop }]}>
      {/* Gradient rainbow top stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[GOLD, AMBER, VIOLET, TEAL, RED].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      {/* Shimmer */}
      <Animated.View pointerEvents="none"
        style={[hh.shimmer, { transform: [{ translateX: shimA }] }]} />

      <View style={hh.body}>
        {/* Left brand */}
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={hh.eyebrow}>HOLOGRAPHIC AI · ZERO TELEMETRY · LOCAL ONLY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Mascot thumbnail */}
            <View style={[hh.mascotBox, { borderColor: GOLD + '60', backgroundColor: GOLD + '0D' }]}>
              {MASCOT
                ? <Image source={MASCOT} style={{ width: 26, height: 32 }} contentFit="contain" />
                : <MaterialCommunityIcons name="robot-happy" size={20} color={GOLD} />}
              <GlowDot color={cc} size={5} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={hh.brand}>
                <Text style={{ color: GOLD }}>AI </Text>
                <Text style={{ color: TEXT }}>BUTLER</Text>
              </Text>
              <Text style={hh.brandSub}>NEXUS COMMAND CONSOLE</Text>
            </View>
          </View>
          {/* Status pills */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <View style={[hh.pill, { borderColor: cc + '55', backgroundColor: cc + '0C' }]}>
              <GlowDot color={cc} size={4} />
              <Text style={[hh.pillTxt, { color: cc }]}>{isConn ? 'CONNECTED' : 'OFFLINE'}</Text>
            </View>
            {isConn && (
              <View style={[hh.pill, { borderColor: VIOLET + '50' }]}>
                <MaterialCommunityIcons name="chip" size={9} color={VIOLET} />
                <Text style={[hh.pillTxt, { color: VIOLET }]}>{modelLbl}</Text>
              </View>
            )}
            {msgCount > 0 && (
              <TouchableOpacity onPress={onClear} style={[hh.pill, { borderColor: RED + '45', backgroundColor: RED + '0A' }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="delete-sweep" size={10} color={RED} />
                <Text style={[hh.pillTxt, { color: RED }]}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Right: clock */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={hh.clockMain}>{time}</Text>
            <Text style={[hh.clockSecs, { color: GOLD }]}>{secs}</Text>
          </View>
          <Text style={hh.clockSub}>LOCAL · SECURE</Text>
          <Text style={[hh.dateTxt]}>{dateStr}</Text>
          {/* Action icons */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <TouchableOpacity onPress={onBuilder}
              style={[hh.iconBtn, { borderColor: GOLD + '55', backgroundColor: GOLD + '0E' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="code" size={14} color={GOLD} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onPalette}
              style={[hh.iconBtn, { borderColor: VIOLET + '50', backgroundColor: VIOLET + '0C' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="console" size={13} color={VIOLET} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Diamond-cut bottom border */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        <View style={{ flex: 5, backgroundColor: GOLD + '1A' }} />
        <View style={{ width: 20, backgroundColor: GOLD }} />
        <View style={{ flex: 2, backgroundColor: AMBER + '18' }} />
        <View style={{ width: 8, backgroundColor: AMBER }} />
        <View style={{ flex: 8, backgroundColor: VIOLET + '0C' }} />
        <View style={{ width: 12, backgroundColor: VIOLET }} />
        <View style={{ flex: 4, backgroundColor: VIOLET + '08' }} />
      </View>
    </View>
  );
}
const hh = StyleSheet.create({
  root:      { backgroundColor: SURFACE, overflow: 'hidden' },
  shimmer:   { position: 'absolute', top: 0, bottom: 0, width: 100, backgroundColor: 'rgba(255,209,102,0.035)', zIndex: 0 },
  body:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, zIndex: 1 },
  eyebrow:   { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: GOLD + '44', letterSpacing: 1.8 },
  mascotBox: { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 },
  brand:     { fontFamily: MONO, fontSize: 22, fontWeight: '900', letterSpacing: 0.5, lineHeight: 26 },
  brandSub:  { fontFamily: MONO, fontSize: 7.5, color: MID, letterSpacing: 2, fontWeight: '700' },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  pillTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  clockMain: { fontFamily: MONO, fontSize: 26, fontWeight: '900', color: TEXT, letterSpacing: 1 },
  clockSecs: { fontFamily: MONO, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  clockSub:  { fontFamily: MONO, fontSize: 7.5, color: MID, letterSpacing: 1, fontWeight: '700' },
  dateTxt:   { fontFamily: MONO, fontSize: 7, color: DIM, letterSpacing: 0.5 },
  iconBtn:   { width: 30, height: 30, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

// ─── MODE BAR ─────────────────────────────────────────────────────
const MODES: { id: Mode; label: string; icon: string; color: string }[] = [
  { id: 'general', label: 'GENERAL', icon: 'chat',       color: GOLD    },
  { id: 'code',    label: 'CODE',    icon: 'code',       color: TEAL    },
  { id: 'debug',   label: 'DEBUG',   icon: 'bug-report', color: AMBER   },
  { id: 'analyze', label: 'ANALYZE', icon: 'analytics',  color: VIOLET  },
];

function ModeBar({ active, onSelect }: { active: Mode; onSelect: (m: Mode) => void }) {
  return (
    <View style={mb.root}>
      {MODES.map(m => {
        const isAct = active === m.id;
        return (
          <TouchableOpacity key={m.id} onPress={() => { haptics.selection(); onSelect(m.id); }} activeOpacity={0.8}
            style={[mb.tab, isAct && { borderBottomColor: m.color, borderBottomWidth: 2.5, backgroundColor: m.color + '0D' }]}>
            <MaterialIcons name={m.icon as any} size={isAct ? 13 : 11} color={isAct ? m.color : MID} />
            <Text style={[mb.txt, isAct && { color: m.color, fontWeight: '900' }]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const mb = StyleSheet.create({
  root: { flexDirection: 'row', backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: GOLD + '18' },
  tab:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  txt:  { fontFamily: MONO, fontSize: 9, fontWeight: '600', color: MID },
});

// ─── WELCOME PANEL ────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: 'monitor',        color: TEAL,   label: 'System Stats',    prompt: 'Show my CPU, RAM, and disk usage right now'            },
  { icon: 'cleaning-services', color: GOLD,  label: 'Clean Temp',   prompt: 'Write a Python script to clean all temp files on my PC'  },
  { icon: 'speed',          color: AMBER,  label: 'Top Processes',   prompt: 'Show the top 6 CPU-consuming processes on my PC'        },
  { icon: 'wifi',           color: VIOLET, label: 'Network Scan',    prompt: 'Scan my LAN and show all connected devices'             },
  { icon: 'storage',        color: '#FF6EB4', label: 'Disk Usage',   prompt: 'Show disk usage breakdown by folder and drive'          },
  { icon: 'security',       color: RED,    label: 'Security Audit',  prompt: 'Run a quick security scan: open ports, suspicious processes' },
];

function WelcomePanel({ isConn, onSend }: { isConn: boolean; onSend: (p: string) => void }) {
  const floatA = useRef(new Animated.Value(0)).current;
  const glowA  = useRef(new Animated.Value(0)).current;
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    const l1 = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ]));
    const l2 = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(glowA, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    l1.start(); l2.start();
    return () => { m.current = false; l1.stop(); l2.stop(); };
  }, []);

  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const cc = isConn ? TEAL : RED;

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12 }}>

      {/* ── HERO CARD — holographic glass panel ── */}
      <View style={wp.hero}>
        {/* Diagonal line decoration */}
        <View pointerEvents="none" style={wp.heroDiag1} />
        <View pointerEvents="none" style={wp.heroDiag2} />

        <View style={{ flexDirection: 'row', padding: 18, gap: 14, alignItems: 'center' }}>
          {/* Floating mascot */}
          <Animated.View style={{ transform: [{ translateY: floatY }], alignItems: 'center', gap: 8 }}>
            {MASCOT
              ? <Image source={MASCOT} style={{ width: 80, height: 100 }} contentFit="contain" />
              : <MaterialCommunityIcons name="robot-happy" size={72} color={GOLD} />}
            <View style={[wp.connPill, { borderColor: cc + '55', backgroundColor: cc + '10' }]}>
              <GlowDot color={cc} size={4} />
              <Text style={{ fontFamily: MONO, fontSize: 8, color: cc, fontWeight: '900' }}>
                {isConn ? 'PC LIVE' : 'PAIR PC'}
              </Text>
            </View>
          </Animated.View>

          {/* Copy */}
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: GOLD + '55', letterSpacing: 3, fontWeight: '700' }}>
              HOLOGRAPHIC AI
            </Text>
            <Text style={wp.heroTitle}>
              <Text style={{ color: GOLD }}>AI </Text>
              <Text style={{ color: TEXT }}>BUTLER</Text>
              <Text style={{ color: VIOLET, fontSize: 14 }}>{'\n'}NEXUS</Text>
            </Text>
            <Text style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT2, lineHeight: 19 }}>
              {'Self-hosted AI assistant.\nRuns 100% on your own PC.\nZero cloud, zero telemetry.'}
            </Text>
            {/* Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {[
                { l: 'ZERO CLOUD', c: TEAL    },
                { l: 'LAN ONLY',   c: GOLD    },
                { l: 'AES-256',    c: VIOLET  },
              ].map(b => (
                <View key={b.l} style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: b.c + '40', backgroundColor: b.c + '0C' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 7.5, color: b.c, fontWeight: '900' }}>{b.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Connect guide if offline */}
        {!isConn && (
          <View style={[wp.guide, { borderColor: AMBER + '35', backgroundColor: AMBER + '07' }]}>
            <MaterialIcons name="info-outline" size={14} color={AMBER} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: AMBER, fontWeight: '900', marginBottom: 4 }}>HOW TO CONNECT</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: AMBER + '90', lineHeight: 16 }}>
                {'1. Run butler_server.py on your PC\n2. HOME tab → PAIR PC\n3. Scan the QR code shown in terminal'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── QUICK ACTION GRID ── */}
      <View style={{ marginTop: 18, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: GOLD }} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: GOLD + '70', fontWeight: '900', letterSpacing: 2.5 }}>QUICK START</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: GOLD + '25' }} />
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: MID }}>tap to run</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Pressable key={i} onPress={() => { haptics.medium(); onSend(a.prompt); }}
              style={({ pressed }) => [wp.action, {
                borderColor: a.color + (pressed ? 'AA' : '35'),
                backgroundColor: pressed ? a.color + '18' : a.color + '09',
              }]}>
              <MaterialIcons name={a.icon as any} size={14} color={a.color} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: a.color, fontWeight: '700' }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── COMMAND PALETTE ── */}
      <View style={{ marginTop: 18, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: VIOLET }} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: VIOLET + '70', fontWeight: '900', letterSpacing: 2 }}>SHORTCUTS</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: VIOLET + '20' }} />
        </View>
        {[
          { cmd: 'show cpu',      desc: 'Real-time CPU usage breakdown',   c: TEAL   },
          { cmd: 'clean temp',    desc: 'Remove all temp files + show MB', c: GOLD   },
          { cmd: 'write script',  desc: 'AI generates Python automation',  c: AMBER  },
          { cmd: 'top processes', desc: 'List top CPU + RAM consumers',    c: VIOLET },
        ].map((s, i) => (
          <TouchableOpacity key={i} onPress={() => { haptics.light(); onSend(s.desc); }} activeOpacity={0.82}
            style={[wp.shortcut, { borderLeftColor: s.c }]}>
            <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderColor: s.c + '45', backgroundColor: s.c + '0C' }}>
              <Text style={{ fontFamily: MONO, fontSize: 8.5, color: s.c, fontWeight: '900' }}>{s.cmd}</Text>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: TEXT2, flex: 1 }}>{s.desc}</Text>
            <MaterialIcons name="chevron-right" size={13} color={s.c + '55'} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 16 }} />
    </View>
  );
}

const wp = StyleSheet.create({
  hero:      { backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1.5, borderColor: GOLD + '30', overflow: 'hidden',
               ...Platform.select({ ios: { shadowColor: GOLD, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 8 }, default: {} }) },
  heroDiag1: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderWidth: 1, borderColor: GOLD + '0D', borderRadius: 0, transform: [{ rotate: '45deg' }] },
  heroDiag2: { position: 'absolute', bottom: -30, left: 30, width: 80, height: 80, borderWidth: 1, borderColor: VIOLET + '0D', borderRadius: 0, transform: [{ rotate: '30deg' }] },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  heroTitle: { fontFamily: MONO, fontSize: 26, fontWeight: '900', lineHeight: 30 },
  guide:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 0, padding: 14, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  action:    { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 24, paddingHorizontal: 13, paddingVertical: 9 },
  shortcut:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12,
               backgroundColor: SURFACE, borderRadius: 10, borderWidth: 1, borderLeftWidth: 3, borderColor: GOLD + '18' },
});

// ─── TYPING INDICATOR ────────────────────────────────────────────
const THINK_PHRASES = ['Processing...', 'Consulting AI...', 'One moment...', 'Analyzing...', 'Almost ready...'];

function TypingIndicator() {
  const bars = useRef(Array.from({ length: 12 }, () => new Animated.Value(0.1))).current;
  const [ph, setPh] = useState(0);
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    const loops = bars.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 60),
        Animated.timing(a, { toValue: 1,   duration: 180, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(a, { toValue: 0.1, duration: 180, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.delay(Math.max(0, (12 - i) * 30)),
      ]))
    );
    loops.forEach(l => l.start());
    const t = setInterval(() => { if (m.current) setPh(p => (p + 1) % THINK_PHRASES.length); }, 2800);
    return () => { m.current = false; loops.forEach(l => l.stop()); clearInterval(t); };
  }, []);

  return (
    <View style={ti.wrap}>
      <View style={[ti.topBar, { backgroundColor: GOLD }]} />
      <View style={ti.inner}>
        <View style={[ti.avatar, { borderColor: GOLD + '60', backgroundColor: GOLD + '0E' }]}>
          <MaterialCommunityIcons name="robot-happy" size={18} color={GOLD} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: GOLD }}>
            {THINK_PHRASES[ph]}
          </Text>
          {/* Waveform bars */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 20 }}>
            {bars.map((a, i) => (
              <Animated.View key={i} style={{
                width: 3, borderRadius: 2, backgroundColor: i % 3 === 0 ? GOLD : i % 3 === 1 ? AMBER : VIOLET,
                height: a.interpolate({ inputRange: [0.1, 1], outputRange: [3, 18] }) as any,
                opacity: a.interpolate({ inputRange: [0.1, 1], outputRange: [0.2, 1] }) as any,
              }} />
            ))}
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 9, color: MID }}>Local AI · Zero cloud latency</Text>
        </View>
        <View style={[ti.liveBadge, { borderColor: GOLD + '45', backgroundColor: GOLD + '0C' }]}>
          <GlowDot color={GOLD} size={4} />
          <Text style={{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: GOLD }}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}
const ti = StyleSheet.create({
  wrap:     { marginHorizontal: 12, marginBottom: 14, borderWidth: 1.5, borderRadius: 16, backgroundColor: SURFACE, overflow: 'hidden' },
  topBar:   { height: 2.5 },
  inner:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  avatar:   { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  liveBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
});

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────
function MessageBubble({ msg, onCopy, onSave, onReact }: {
  msg: Msg;
  onCopy: (t: string) => void;
  onSave: (code: string) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const isButler = msg.role === 'butler';
  const mountA   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountA, { toValue: 1, tension: 120, friction: 12, useNativeDriver: false }).start();
  }, []);

  if (msg.role === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20,
          paddingHorizontal: 12, paddingVertical: 5, borderColor: GOLD + '25', backgroundColor: GOLD + '07' }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GOLD + '70' }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: GOLD + '70' }}>{msg.content}</Text>
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
  if (codeBlocks.length > 0) displayText = msg.content.replace(/```(python|py|bash|sh|javascript|js)?\s*\n[\s\S]*?```/g, '').trim();

  const slideX = mountA.interpolate({ inputRange: [0, 1], outputRange: [isButler ? -20 : 20, 0] });
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bubbleColor = isButler ? GOLD : VIOLET;

  return (
    <Pressable onLongPress={() => { haptics.medium(); onCopy(msg.content); }}>
      <Animated.View style={[bub.row, isButler ? bub.left : bub.right,
        { transform: [{ translateX: slideX }], opacity: mountA }]}>
        <View style={[bub.bubble, {
          borderColor: bubbleColor + '35',
          borderLeftWidth: isButler ? 3.5 : 1.5,
          borderLeftColor: isButler ? bubbleColor : bubbleColor + '35',
          backgroundColor: isButler ? SURFACE : SURFACE2,
        }]}>
          {/* Colored top stripe */}
          <View style={{ height: 2.5, backgroundColor: bubbleColor, opacity: isButler ? 0.9 : 0.5 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, marginBottom: 7 }}>
            <View style={[bub.avatar, { borderColor: bubbleColor + '55', backgroundColor: bubbleColor + '0E' }]}>
              <MaterialIcons name={isButler ? 'smart-toy' : 'person'} size={13} color={bubbleColor} />
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: bubbleColor + 'BB' }}>
              {isButler ? 'Butler AI' : 'You'}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: MID }}>{time}</Text>
            {msg.metadata?.responseMs ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5,
                paddingHorizontal: 5, paddingVertical: 2, borderColor: TEAL + '30', backgroundColor: TEAL + '07' }}>
                <MaterialIcons name="bolt" size={8} color={TEAL} />
                <Text style={{ fontFamily: MONO, fontSize: 7, color: TEAL }}>
                  {msg.metadata.responseMs > 1000
                    ? `${(msg.metadata.responseMs / 1000).toFixed(1)}s`
                    : `${msg.metadata.responseMs}ms`}
                </Text>
              </View>
            ) : null}
            {msg.reaction ? <Text style={{ fontSize: 14, marginLeft: 'auto' as any }}>{msg.reaction}</Text> : null}
          </View>

          {/* Text */}
          {displayText ? (
            <Text style={[bub.content, { color: isButler ? TEXT : '#FFF', paddingHorizontal: 12, paddingBottom: isButler ? 0 : 12 }]}>
              {displayText}
            </Text>
          ) : null}

          {/* Code blocks */}
          {codeBlocks.map((cb, i) => (
            <View key={i} style={[bub.codeBlock, { borderColor: TEAL + '28' }]}>
              <View style={bub.codeHdr}>
                <MaterialCommunityIcons name="code-braces" size={10} color={TEAL + '70'} />
                <Text style={{ fontFamily: MONO, fontSize: 8, color: TEAL + '70', flex: 1 }}>{cb.lang.toUpperCase()}</Text>
                <Pressable onPress={() => { haptics.light(); onCopy(cb.code); }}
                  style={bub.codeBtn}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: GOLD + '80' }}>COPY</Text>
                </Pressable>
                <Pressable onPress={() => { haptics.medium(); onSave(cb.code); }}
                  style={[bub.codeBtn, { borderColor: TEAL + '55', backgroundColor: TEAL + '0A' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: TEAL }}>SAVE</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: '#7EC8E3', padding: 12, lineHeight: 18 }}>{cb.code}</Text>
              </ScrollView>
            </View>
          ))}

          {/* Reactions footer */}
          {isButler && (
            <View style={bub.footer}>
              {['\uD83D\uDC4D', '\uD83D\uDC4E', '\u2B50'].map(e => (
                <Pressable key={e} onPress={() => { haptics.light(); onReact(msg.id, e); }}
                  style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: msg.reaction === e ? GOLD + '22' : 'transparent' }}>
                  <Text style={{ fontSize: 14 }}>{e}</Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { haptics.light(); onCopy(msg.content); }}
                style={{ width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="content-copy" size={13} color={MID} />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
const bub = StyleSheet.create({
  row:       { paddingHorizontal: 10, marginBottom: 12 },
  left:      { alignItems: 'flex-start' },
  right:     { alignItems: 'flex-end' },
  bubble:    { maxWidth: Math.min(SW * 0.88, 520), borderWidth: 1.5, borderRadius: 16, overflow: 'hidden' },
  avatar:    { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content:   { fontFamily: SANS, fontSize: 15, lineHeight: 23 },
  codeBlock: { borderTopWidth: 1, marginTop: 6 },
  codeHdr:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7,
               backgroundColor: 'rgba(6,214,160,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(6,214,160,0.12)' },
  codeBtn:   { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, borderColor: GOLD + '30' },
  footer:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 11, paddingVertical: 8,
               borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
});

// ─── COMMAND DRAWER ───────────────────────────────────────────────
const CMD_DRAWER = [
  { icon: 'broom',           lib: 'c', label: 'CLEAN',    color: TEAL,   prompt: 'Write Python to clean all temp files and show freed MB' },
  { icon: 'speedometer',     lib: 'c', label: 'PERF',     color: GOLD,   prompt: 'Show PC: top 5 CPU processes, RAM, disk I/O' },
  { icon: 'shield-search',   lib: 'c', label: 'AUDIT',    color: RED,    prompt: 'Security scan: open ports, suspicious processes, SSL check' },
  { icon: 'backup-restore',  lib: 'c', label: 'BACKUP',   color: AMBER,  prompt: 'Backup Documents to Desktop as timestamped ZIP' },
  { icon: 'wifi-strength-4', lib: 'c', label: 'WIFI',     color: VIOLET, prompt: 'Show all WiFi networks and signal strength' },
  { icon: 'folder-cog',      lib: 'c', label: 'SORT',     color: '#FF6EB4', prompt: 'Organize Downloads folder by file extension' },
];

function CommandDrawer({ visible, onSelect, onClose }: {
  visible: boolean; onSelect: (p: string) => void; onClose: () => void;
}) {
  const slideY = useRef(new Animated.Value(360)).current;
  useEffect(() => {
    Animated.spring(slideY, { toValue: visible ? 0 : 360, tension: 90, friction: 13, useNativeDriver: false }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[cd.root, { transform: [{ translateY: slideY }] }]}>
      <View style={[cd.handle, { backgroundColor: GOLD + '35' }]} />
      <View style={cd.hdr}>
        <MaterialCommunityIcons name="console" size={14} color={GOLD} />
        <Text style={[cd.title, { color: GOLD }]}>COMMAND DRAWER</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={18} color={MID} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 9, paddingBottom: 36 }}>
        {CMD_DRAWER.map((item, i) => {
          const Icon = item.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.medium(); onSelect(item.prompt); onClose(); }}
              activeOpacity={0.82}
              style={[cd.item, { borderTopColor: item.color, borderColor: item.color + '35', width: '31%' as any }]}>
              <View style={[cd.itemIcon, { borderColor: item.color + '55', backgroundColor: item.color + '0E' }]}>
                <Icon name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: item.color }}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
const cd = StyleSheet.create({
  root:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: BG,
              borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 2, borderTopColor: GOLD + '35', zIndex: 300 },
  handle:   { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 12, marginBottom: 4 },
  hdr:      { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, paddingTop: 8, paddingBottom: 10,
              borderBottomWidth: 1, borderBottomColor: GOLD + '18' },
  title:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', flex: 1, letterSpacing: 1 },
  item:     { alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

// ─── SCRIPT BUILDER MODAL ─────────────────────────────────────────
const BUILD_TEMPLATES = [
  'Monitor CPU usage every 5s and alert if above 80%',
  'Clean Downloads — delete files older than 30 days',
  'Find all large files over 100MB on C: drive',
  'Auto-restart a process if it crashes',
  'Backup Desktop as timestamped ZIP file',
];

function BuilderModal({ visible, onClose, onBuild }: {
  visible: boolean; onClose: () => void; onBuild: (p: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <View style={[bl.sheet, { borderTopColor: GOLD }]}>
          <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 8 }}>
            <View style={[bl.handle, { backgroundColor: GOLD + '35' }]} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[bl.hdrIcon, { borderColor: GOLD + '55', backgroundColor: GOLD + '0D' }]}>
              <MaterialIcons name="bolt" size={20} color={GOLD} />
            </View>
            <View>
              <Text style={[bl.title, { color: GOLD }]}>SCRIPT BUILDER</Text>
              <Text style={{ fontFamily: SANS, fontSize: 12, color: TEXT2, lineHeight: 18, marginTop: 2 }}>
                Describe it — Butler AI writes the Python
              </Text>
            </View>
          </View>
          <View style={[bl.inputWrap, { borderColor: GOLD + '45' }]}>
            <TextInput style={bl.input} value={prompt} onChangeText={setPrompt}
              placeholder="e.g. find all duplicate files..." placeholderTextColor={MID}
              multiline numberOfLines={3} autoFocus autoCapitalize="none" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {BUILD_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} onPress={() => setPrompt(t)} activeOpacity={0.8}
                style={{ borderWidth: 1, borderColor: GOLD + '35', backgroundColor: GOLD + '09', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: GOLD + 'CC' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 36 }}>
            <TouchableOpacity onPress={onClose} style={[bl.cancelBtn]}>
              <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: MID }}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (prompt.trim()) { haptics.heavy(); onBuild(prompt.trim()); onClose(); setPrompt(''); } }}
              style={[bl.buildBtn, { backgroundColor: GOLD, opacity: prompt.trim() ? 1 : 0.4 }]}
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
const bl = StyleSheet.create({
  sheet:    { backgroundColor: SURFACE, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 2.5, paddingHorizontal: 18 },
  handle:   { width: 40, height: 4, borderRadius: 2 },
  hdrIcon:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontFamily: MONO, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  inputWrap:{ borderWidth: 1.5, borderRadius: 12, backgroundColor: BG, paddingHorizontal: 13, marginBottom: 12 },
  input:    { fontSize: 14, color: TEXT, paddingVertical: 12, fontFamily: SANS, lineHeight: 20 },
  cancelBtn:{ flex: 1, borderWidth: 1, borderColor: MID + '35', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buildBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});

// ─── INPUT BAR ────────────────────────────────────────────────────
function InputBar({ onSend, isConn, disabled }: {
  onSend: (t: string) => void; isConn: boolean; disabled: boolean;
}) {
  const [text, setText]       = useState('');
  const [focused, setFocused] = useState(false);
  const sendScA = useRef(new Animated.Value(1)).current;
  const borderA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderA, { toValue: focused ? 1 : text.length > 0 ? 0.5 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused, text.length]);

  const handleSend = () => {
    const t = text.trim();
    if (!t || disabled) return;
    haptics.heavy();
    Animated.sequence([
      Animated.spring(sendScA, { toValue: 0.7,  useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(sendScA, { toValue: 1.12, useNativeDriver: true, speed: 30, bounciness: 18 }),
      Animated.spring(sendScA, { toValue: 1,    useNativeDriver: true, speed: 28, bounciness: 8  }),
    ]).start();
    onSend(t);
    setText('');
  };

  const borderCol = borderA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [GOLD + '20', GOLD + '60', GOLD + 'EE'] });
  const hasText   = text.trim().length > 0;
  const cc        = isConn ? TEAL : RED;

  return (
    <View style={ib.root}>
      {/* Gold top stripe on input area */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        {[GOLD, AMBER, VIOLET, TEAL, RED].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c, opacity: focused ? 1 : 0.25 }} />
        ))}
      </View>
      <View style={ib.row}>
        {/* Conn indicator */}
        <View style={[ib.connPill, { borderColor: cc + '45', backgroundColor: cc + '0A' }]}>
          <GlowDot color={cc} size={4} />
          <Text style={{ fontFamily: MONO, fontSize: 8, color: cc, fontWeight: '900' }}>
            {isConn ? 'ON' : 'OFF'}
          </Text>
        </View>

        {/* Input */}
        <Animated.View style={[ib.inputWrap, { borderColor: borderCol }]}>
          <TextInput
            style={ib.input}
            value={text}
            onChangeText={v => { setText(v); autoResearch.notifyTyping(v); }}
            placeholder={isConn ? 'Type a command or question...' : 'Pair PC first from HOME tab...'}
            placeholderTextColor={MID}
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

        {/* Send */}
        <Animated.View style={{ transform: [{ scale: sendScA }] }}>
          <TouchableOpacity onPress={handleSend} disabled={disabled || !hasText} activeOpacity={0.88}
            style={[ib.sendBtn, {
              backgroundColor: hasText && !disabled ? GOLD : SURFACE2,
              borderColor: GOLD + (hasText && !disabled ? 'CC' : '30'),
              ...Platform.select({
                ios: { shadowColor: GOLD, shadowOffset: { width: 0, height: hasText ? 7 : 2 }, shadowOpacity: hasText && !disabled ? 0.9 : 0.12, shadowRadius: hasText ? 14 : 5 },
                android: { elevation: hasText && !disabled ? 10 : 2 },
                default: {},
              }),
            }]}>
            {disabled
              ? <ActivityIndicator size="small" color={GOLD} />
              : <MaterialIcons name={hasText ? 'send' : 'chevron-right'} size={20} color={hasText && !disabled ? '#000' : GOLD + '44'} />}
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={ib.statusLine}>
        <GlowDot color={isConn ? TEAL : RED} size={4} />
        <Text style={{ fontFamily: MONO, fontSize: 7, color: isConn ? TEAL + '60' : RED + '60', letterSpacing: 1 }}>
          {isConn ? 'BUTLER AI · LOCAL LLM · ZERO CLOUD' : 'OFFLINE · PAIR PC FROM HOME TAB'}
        </Text>
      </View>
    </View>
  );
}
const ib = StyleSheet.create({
  root:      { backgroundColor: BG, borderTopWidth: 1, borderTopColor: GOLD + '15' },
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 10, paddingVertical: 8 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 6, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 1 },
  inputWrap: { flex: 1, borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 9, minHeight: 48, maxHeight: 130, backgroundColor: SURFACE, position: 'relative' },
  input:     { fontFamily: SANS, fontSize: 15, color: TEXT, lineHeight: 21, minHeight: 24, padding: 0 },
  sendBtn:   { width: 48, height: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusLine:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 4 },
});

// ─── QUICK STRIP (visible when messages exist) ─────────────────────
function QuickStrip({ onDrawer, onCmd }: { onDrawer: () => void; onCmd: (p: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7,
      borderTopWidth: 1, borderTopColor: GOLD + '12', backgroundColor: BG }}>
      <TouchableOpacity onPress={() => { haptics.light(); onDrawer(); }} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8,
          paddingHorizontal: 8, paddingVertical: 5, borderColor: GOLD + '55', backgroundColor: GOLD + '09' }}>
        <MaterialCommunityIcons name="console" size={11} color={GOLD} />
        <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: GOLD }}>CMDS</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
        {CMD_DRAWER.slice(0, 5).map((item, i) => {
          const Icon = MaterialCommunityIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.light(); onCmd(item.prompt); }} activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7,
                paddingHorizontal: 9, paddingVertical: 5, borderColor: item.color + '40', backgroundColor: item.color + '07' }}>
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
    return "Hello! I'm Butler AI — your self-hosted PC automation assistant.\n\nTo get started:\n1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan the QR code\n\nOnce paired, I can run scripts and chat via local Ollama AI.";
  if (/what can you do|capabilities|help|features/.test(lc))
    return '• Run Python scripts on your PC remotely\n• Monitor CPU, RAM, and disk usage live\n• Clean temp files, manage processes\n• Network diagnostics and WiFi info\n• Chat with local Ollama AI (when PC paired)\n• Build automation scripts on demand\n• 250+ pre-built automation scripts';
  if (noConn)
    return "Your PC is not connected right now.\n\nTo connect:\n1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan the QR code shown in terminal\n\nOnce connected I can run scripts and answer with your local AI.";
  return "Could not reach the AI engine.\n\nMake sure:\n1. butler_server.py is still running on your PC\n2. Ollama is installed (run: ollama list)\n3. Phone and PC are on the same WiFi\n\nTap PAIR PC on HOME tab to reconnect.";
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function ButlerInner() {
  const insets       = useSafeAreaInsets();
  const { T }        = useCosmetic();
  const { isConnected } = useConnectionStatus();

  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [chatMode,    setChatMode]    = useState<Mode>('general');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showDrawer,  setShowDrawer]  = useState(false);
  const [activeModel, setActiveModel] = useState('');

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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const t0       = Date.now();
      const histCtx  = buildHistoryOnly(messages.slice(-10));
      const [nexusCtx, metricsCtx] = await Promise.all([
        nexusBridge?.buildNexusContext?.(text, { maxLocal: 5, maxRelay: 3, timeoutMs: 3500, relayEnabled: isConnected, growthEnabled: false }).catch(() => null),
        serverMetrics.getContextString().catch(() => ''),
      ]);
      const kbCtx       = nexusCtx?.fusedBlock || await knowledgeAccumulator.buildContext(text).catch(() => '');
      const modePrompt  = MODE_PROMPTS[chatMode] || '';
      const personalCtx = await personalMemory.buildPersonalContext().catch(() => '');
      const sysPrompt   = [
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
        model: activeModel || undefined,
      });

      const reply  = result?.content || result?.message || result?.response || result?.text || 'No response received.';
      const rMs    = Date.now() - t0;
      let kbUsed   = nexusCtx ? nexusCtx.localFindings.length + nexusCtx.relayFindings.length : 0;
      if (kbUsed === 0 && kbCtx) kbUsed = (kbCtx.match(/\n---\n/g) || []).length + 1;

      setMessages(prev => [...prev, {
        id: `b-${Date.now()}`, role: 'butler', content: reply,
        timestamp: Date.now(), metadata: { model: result?.model || '', responseMs: rMs, kbUsed },
      }]);
      addEntry({ role: 'user', content: text, timestamp: Date.now() });
      addEntry({ role: 'assistant', content: reply, timestamp: Date.now() });
      knowledgeAccumulator.processExchange(text, reply).catch(() => {});
      knowledgeGrowthEngine.silentGrowth().catch(() => {});
    } catch (err: any) {
      const msg  = err?.message || 'Unknown error';
      const noC  = msg.toLowerCase().includes('not connected') || !serverConnection.isConnected();
      const reply = getOfflineReply(text, noC);
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: 'butler', content: reply, timestamp: Date.now() }]);
      autoErrorLogger.log('warn', '[ButlerV12] sendMessage', msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [isLoading, isConnected, messages, addEntry, chatMode, activeModel]);

  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  // Read prefill from QuickButlerBar (sent when user was on a different tab)
  useEffect(() => {
    const PREFILL_KEY = '@butler_prefill_prompt';
    const checkPrefill = async () => {
      try {
        const AS = require('@react-native-async-storage/async-storage').default;
        const stored = await AS.getItem(PREFILL_KEY);
        if (stored?.trim()) {
          await AS.removeItem(PREFILL_KEY);
          // Small delay to ensure the chat UI is mounted and ready
          setTimeout(() => {
            if (sendRef.current && stored.trim()) sendRef.current(stored.trim());
          }, 400);
        }
      } catch {}
    };
    // Check on mount AND when tab comes into focus via the global listener
    checkPrefill();
    const fn = () => checkPrefill();
    (global as any).__butlerPrefillListeners = (global as any).__butlerPrefillListeners ?? [];
    (global as any).__butlerPrefillListeners.push(fn);
    return () => {
      const arr: any[] = (global as any).__butlerPrefillListeners ?? [];
      const i = arr.indexOf(fn);
      if (i > -1) arr.splice(i, 1);
    };
  }, []);
  useEffect(() => {
    (global as any).__butlerInjectMessage = (t: string) => {
      if (t?.trim()) {
        sendRef.current(t.trim());
        // Also notify prefill listeners (future-proof for tab-based injection)
        const listeners: any[] = (global as any).__butlerPrefillListeners ?? [];
        listeners.forEach((fn: any) => { try { fn(); } catch {} });
      }
    };
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
      (global as any).__showConnectionToast?.('Script saved to FORGE tab', TEAL);
    } catch {
      (global as any).__showConnectionToast?.('Save failed', RED);
    }
  }, []);
  const handleBuild = useCallback((prompt: string) => {
    sendMessage(`Write a production-quality Python script that: ${prompt}. Include full error handling, progress output, and clear comments.`);
  }, [sendMessage]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Holographic scanline overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ScanlineOverlay />
      </View>

      <BuilderModal visible={showBuilder} onClose={() => setShowBuilder(false)} onBuild={handleBuild} />
      <CommandDrawer visible={showDrawer} onSelect={sendMessage} onClose={() => setShowDrawer(false)} />

      {/* Header */}
      <HoloHeader
        safeTop={insets.top}
        isConn={isConnected}
        model={activeModel}
        msgCount={messages.length}
        onClear={clearChat}
        onBuilder={() => setShowBuilder(true)}
        onPalette={() => setShowDrawer(true)}
      />

      {/* Mode bar */}
      <ModeBar active={chatMode} onSelect={setChatMode} />

      {/* Chat + input */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef as any}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble msg={item} onCopy={handleCopy} onSave={handleSave} onReact={handleReact} />
          )}
          ListEmptyComponent={
            <WelcomePanel isConn={isConnected} onSend={sendMessage} />
          }
          ListFooterComponent={
            <>
              {isLoading && <TypingIndicator />}
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

        {messages.length > 0 && (
          <QuickStrip onDrawer={() => setShowDrawer(true)} onCmd={sendMessage} />
        )}

        <InputBar onSend={sendMessage} isConn={isConnected} disabled={isLoading} />
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
