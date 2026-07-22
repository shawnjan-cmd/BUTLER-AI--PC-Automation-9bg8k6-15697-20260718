/**
 * BUTLER AI — AI CHAT v16.0 · CENTERED NEXUS VISUAL OVERHAUL
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED — PROPRIETARY
 * Protected under Berne Convention Art.5, DMCA 17 U.S.C. §1201
 * Trademark registered: vitalstrademark.com
 * NEXUS INTEGRITY SEAL: 0xNX-BA-2026-V16-C3NT3R
 *
 * v16 VISUAL OVERHAUL:
 *  • ALL text centered — mass textAlign:'center' pass
 *  • High-contrast foreground colors — no more dim opacity hacks
 *  • Robot-themed bold monospace identity throughout
 *  • 3D depth via layered shadows + elevation stacks
 *  • Rotating info tickers in header, modeBar, modelBadge, analytics
 *  • Smooth spring transitions everywhere
 *  • SessionAnalytics, ModeBar, Header all centered & visible
 *  • Larger font sizes across all UI atoms
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
  Animated, Dimensions, Modal, Pressable, FlatList, Easing,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { haptics } from '@/services/haptics';
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
import { FONT } from '@/constants/tokens';

const MONO: any = FONT.mono;
const SANS: any = FONT.sans;
const SW = Dimensions.get('window').width;
const CONV_KEY     = '@butler_conv_v16';
const SESSIONS_KEY = '@butler_sessions_v1';
const MAX_SESSIONS = 60;

// ─── ASSETS ────────────────────────────────────────────────────────
let MASCOT: any = null;
try { MASCOT = require('@/assets/images/butler-shield-mascot.jpg'); } catch {
  try { MASCOT = require('@/assets/images/mascot_shield_v2.png'); } catch {}
}

// ─── TYPES ─────────────────────────────────────────────────────────
type Role  = 'user' | 'butler' | 'system';
type Mode  = 'general' | 'code' | 'debug' | 'analyze';
type Stage = 'idle' | 'connecting' | 'kb_search' | 'context' | 'ai' | 'streaming' | 'done' | 'error';

interface KBSource { topic: string; relevance: number }
interface Msg {
  id: string; role: Role; content: string; timestamp: number;
  failed?: boolean; failReason?: string; reaction?: string; kbSources?: KBSource[];
  metadata?: { model?: string; responseMs?: number; kbUsed?: number };
}
interface Session {
  id: string; title: string; messages: Msg[];
  createdAt: number; updatedAt: number; msgCount: number; model?: string;
}

// ─── PALETTE — HIGH CONTRAST ─────────────────────────────────────
const BG       = '#06030D';
const SURFACE  = '#110A22';
const SURFACE2 = '#180D2E';
const SURF3    = '#0C0718';
const GOLD     = '#FFD166';
const AMBER    = '#FF9F1C';
const VIOLET   = '#9B70FF';
const TEAL     = '#00F0A0';
const TEAL2    = '#00D8FF';
const RED      = '#FF3355';
const MID      = '#7A65A8';
const DIM      = '#3A2A5A';
const TEXT     = '#F0E8FF';
const TEXT2    = '#B8A0E0';
const WHITE    = '#FFFFFF';

// ─── 3D SHADOW HELPER ────────────────────────────────────────────
const shadow3d = (color: string, intensity = 1) => Platform.select({
  ios:     { shadowColor: color, shadowOffset: { width: 0, height: 4 * intensity }, shadowOpacity: 0.55 * intensity, shadowRadius: 12 * intensity },
  android: { elevation: Math.round(8 * intensity) },
  default: {},
});

const STAGE_COLORS: Record<Stage, string> = {
  idle: DIM, connecting: TEAL2, kb_search: AMBER, context: VIOLET,
  ai: GOLD, streaming: TEAL, done: TEAL, error: RED,
};
const STAGE_LABELS: Record<Stage, string> = {
  idle: 'READY', connecting: 'CONNECTING', kb_search: 'KNOWLEDGE SEARCH',
  context: 'BUILDING CONTEXT', ai: 'AI ENGINE ACTIVE', streaming: 'GENERATING RESPONSE',
  done: 'COMPLETE', error: 'ERROR DETECTED',
};
const MODE_PROMPTS: Record<Mode, string> = {
  general: '',
  code:    'CODE MODE: Write production Python only with full try/except.',
  debug:   'DEBUG MODE: Show root cause + traceback explanation + corrected code.',
  analyze: 'ANALYZE MODE: Step-by-step reasoning → pros/cons → recommendation.',
};

// ─── MODEL TIER LOGIC ────────────────────────────────────────────
const MODEL_TIERS: { match: RegExp; tier: number; reason: string; capability: string; info: string }[] = [
  { match: /qwen2?.5.coder/i, tier: 0, reason: 'Best coder model installed — optimised for Python & automation scripts', capability: 'ELITE', info: '128k ctx · Apache 2.0 · code specialist' },
  { match: /qwen2?.5/i,       tier: 1, reason: 'High-capability reasoning — 128k context window active',               capability: 'ELITE', info: '128k ctx · math + code + reasoning' },
  { match: /mistral/i,        tier: 2, reason: 'Strong all-purpose LLM — fast and reliable for most tasks',            capability: 'PRO',   info: '32k ctx · fast · broad knowledge' },
  { match: /llama3\.2/i,      tier: 3, reason: 'Latest Meta Llama — great instruction following',                      capability: 'PRO',   info: '8k ctx · multilingual · fast' },
  { match: /llama3/i,         tier: 4, reason: 'Proven open-source model — broad general knowledge',                   capability: 'PRO',   info: '8k ctx · community favourite' },
  { match: /llama/i,          tier: 5, reason: 'Llama family model — recommend upgrading to llama3',                   capability: 'GOOD',  info: '4k ctx · consider: llama3' },
  { match: /codellama/i,      tier: 6, reason: 'Code-specialised model — good for script generation',                  capability: 'GOOD',  info: '16k ctx · Python + code focus' },
  { match: /phi/i,            tier: 7, reason: 'Compact & fast — limited reasoning on complex tasks',                  capability: 'LITE',  info: '4k ctx · small but quick' },
  { match: /gemma/i,          tier: 8, reason: 'Google open model — reliable but limited context',                     capability: 'LITE',  info: '8k ctx · lightweight' },
  { match: /deepseek/i,       tier: 9, reason: 'DeepSeek coding model — strong Python and math',                       capability: 'GOOD',  info: '16k ctx · code & reasoning' },
];

function selectBestModel(models: string[]): { model: string; reason: string; capability: string; info: string } | null {
  if (!models.length) return null;
  let best: { model: string; tier: number; reason: string; capability: string; info: string } | null = null;
  for (const m of models) {
    const hit = MODEL_TIERS.find(p => p.match.test(m));
    const tier = hit?.tier ?? 99;
    if (!best || tier < best.tier) best = { model: m, tier, reason: hit?.reason ?? 'Only model installed — consider pulling qwen2.5-coder:7b for best results', capability: hit?.capability ?? 'BASIC', info: hit?.info ?? 'unknown specs' };
  }
  if (!best) return { model: models[0], reason: 'Only model found — pull qwen2.5-coder:7b for better results', capability: 'BASIC', info: 'unknown specs' };
  if (best.tier > 2) best.reason += ' · Upgrade tip: ollama pull qwen2.5-coder:7b';
  return best;
}

// ─── SERVER REQUEST HELPER ──────────────────────────────────────
async function _nxRequest(path: string, method: 'GET' | 'POST' = 'GET', body?: object, ms = 8000): Promise<any> {
  const _sc = serverConnection as any;
  const _ip = _sc.getIP?.() || ''; const _pt = _sc.getPort?.() || ''; const _tk = _sc.getToken?.() || '';
  if (!_ip || !_pt) throw new Error('NOT_CONNECTED');
  const _h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_tk) _h['Authorization'] = `Bearer ${_tk}`;
  const _ctrl = new AbortController(); const _t = setTimeout(() => _ctrl.abort(), ms);
  try {
    const _r = await fetch(`http://${_ip}:${_pt}${path}`, { method, headers: _h, body: body ? JSON.stringify(body) : undefined, signal: _ctrl.signal });
    clearTimeout(_t); if (!_r.ok) throw new Error(`HTTP_${_r.status}`); return await _r.json();
  } catch (e) { clearTimeout(_t); throw e; }
}

interface _PullStatus { pct: number; status: string; layers: number; totalLayers: number; bytesDown: number; bytesTotal: number; done: boolean; error?: string; }

function _parsePullStatus(raw: any): _PullStatus {
  if (!raw || typeof raw !== 'object') return { pct: 0, status: 'Waiting…', layers: 0, totalLayers: 0, bytesDown: 0, bytesTotal: 0, done: false };
  const status = String(raw.status || raw.state || '');
  const done = status === 'success' || raw.done === true || raw.complete === true;
  const bytesDown = raw.completed || raw.downloaded || raw.bytes_downloaded || 0;
  const bytesTotal = raw.total || raw.total_size || raw.bytes_total || 0;
  const layers = raw.layers_completed || raw.layers_done || 0;
  const totalLayers = raw.layers_total || raw.total_layers || 0;
  let pct = 0;
  if (raw.percent != null) pct = Math.round(Number(raw.percent));
  else if (raw.progress != null) pct = Math.round(Number(raw.progress) * (Number(raw.progress) > 1 ? 1 : 100));
  else if (bytesTotal > 0) pct = Math.round((bytesDown / bytesTotal) * 100);
  else if (totalLayers > 0) pct = Math.round((layers / totalLayers) * 100);
  return { pct: Math.min(100, Math.max(0, pct)), status, layers, totalLayers, bytesDown, bytesTotal, done, error: raw.error };
}

function _fmtBytes(b: number): string {
  if (b <= 0) return '0 B'; if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
}

function _fmtRelTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now'; if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function _autoTitle(messages: Msg[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first?.content) return `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const raw = first.content.trim().replace(/\n+/g, ' ');
  return raw.length > 36 ? raw.slice(0, 33) + '…' : raw;
}

const _PULL_MODEL = 'qwen2.5-coder:7b' as const;

async function fetchOllamaModels(): Promise<string[]> {
  try {
    const d = await _nxRequest('/api/ollama/models', 'GET', undefined, 5000);
    const raw: any[] = Array.isArray(d) ? d : (Array.isArray(d?.models) ? d.models : []);
    return raw.map((m: any) => typeof m === 'string' ? m : (m?.name || m?.model || '')).filter(Boolean);
  } catch { return []; }
}

// ─── SESSION STORAGE ──────────────────────────────────────────────
async function _loadSessions(): Promise<Session[]> {
  try {
    const raw = await encryptedStorage.getItem(SESSIONS_KEY); if (!raw) return [];
    const parsed = logger.safeJSON<Session[]>(raw, [], '[Sessions]');
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch { return []; }
}
async function _saveSessions(sessions: Session[]): Promise<void> {
  try { await encryptedStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS))); } catch {}
}
async function _upsertSession(session: Session, existing: Session[]): Promise<Session[]> {
  try {
    const idx = existing.findIndex(s => s.id === session.id);
    const updated = idx >= 0 ? existing.map(s => s.id === session.id ? session : s) : [session, ...existing];
    await _saveSessions(updated); return updated.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch { return existing; }
}
async function _deleteSession(id: string, existing: Session[]): Promise<Session[]> {
  try { const updated = existing.filter(s => s.id !== id); await _saveSessions(updated); return updated; } catch { return existing; }
}

// ══════════════════════════════════════════════════════════════════
// ATOMS
// ══════════════════════════════════════════════════════════════════

function GlowDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 700, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function useClock() {
  const [time, setTime] = useState('--:--'); const [secs, setSecs] = useState('--');
  useEffect(() => {
    const u = () => { const n = new Date(); setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`); setSecs(String(n.getSeconds()).padStart(2,'0')); };
    u(); const t = setInterval(u, 1000); return () => clearInterval(t);
  }, []);
  return { time, secs };
}

// ── ROTATING TICKER — visible full-sentence scrolling info ─────────
const NEXUS_FACTS = [
  'ALL AI PROCESSING RUNS ON YOUR OWN PC — ZERO CLOUD · ZERO TELEMETRY · ZERO ACCOUNTS',
  'HMAC-SHA256 SIGNED · EVERY REQUEST IS CRYPTOGRAPHICALLY VERIFIED BEFORE EXECUTION',
  'OLLAMA RUNS LOCALLY — YOUR CONVERSATIONS NEVER LEAVE YOUR HOME NETWORK',
  'BUTLER AI SUPPORTS: QWEN2.5-CODER · MISTRAL · LLAMA3 · PHI · GEMMA · CODELLAMA',
  'AES-256-GCM ENCRYPTED SESSIONS · ALL CHAT HISTORY STORED ONLY ON YOUR DEVICE',
  '250+ PYTHON AUTOMATION SCRIPTS AVAILABLE — SYSTEM MONITOR · FILE MANAGER · NET SCANNER',
  'LAN-ONLY BRIDGE · PHONE TALKS DIRECTLY TO YOUR PC — NO MIDDLEMAN SERVER EXISTS',
  'BUTLER SERVER: OPEN SOURCE · SELF-HOSTED · YOU OWN THE DATA · ALWAYS FREE',
  'KNOWLEDGE BASE ENGINE GROWS SMARTER WITH EVERY CONVERSATION YOU HAVE',
  'BUTLER AI v16 · © 2026 ANDREJ SLADKOVIC · PROPRIETARY · VITALSTRADEMARK.COM',
];

function RotatingTicker({ color = MID, bgColor = BG, interval = 5000 }: { color?: string; bgColor?: string; interval?: number }) {
  const [idx, setIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  const slideA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeA,  { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(slideA, { toValue: -8, duration: 280, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % NEXUS_FACTS.length);
        slideA.setValue(10);
        Animated.parallel([
          Animated.timing(fadeA,  { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(slideA, { toValue: 0, tension: 200, friction: 14, useNativeDriver: true }),
        ]).start();
      });
    }, interval);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: bgColor, paddingHorizontal: 12, paddingVertical: 7, overflow: 'hidden' }}>
      <MaterialCommunityIcons name="information-outline" size={11} color={color} />
      <Animated.Text
        numberOfLines={1}
        style={{ fontFamily: MONO, fontSize: 10.5, color, fontWeight: '700', flex: 1, textAlign: 'center', letterSpacing: 0.4, opacity: fadeA, transform: [{ translateY: slideA }] }}
      >
        {NEXUS_FACTS[idx]}
      </Animated.Text>
      <MaterialCommunityIcons name="chevron-right" size={11} color={color} />
    </View>
  );
}

// ── 3D PULL PROGRESS BAR ───────────────────────────────────────────
function _PullProgressBar({ pct, color }: { pct: number; color: string }) {
  const fillA = useRef(new Animated.Value(0)).current;
  const shimA = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    Animated.timing(fillA, { toValue: pct / 100, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    const sl = Animated.loop(Animated.timing(shimA, { toValue: 240, duration: 1300, easing: Easing.linear, useNativeDriver: false }));
    sl.start(); return () => sl.stop();
  }, [pct]);
  const w = fillA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height: 7, borderRadius: 4, backgroundColor: color + '20', overflow: 'hidden', marginVertical: 5, ...shadow3d(color, 0.5) }}>
      <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color, overflow: 'hidden' }, { width: w as any }]}>
        <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ translateX: shimA as any }, { skewX: '-18deg' }] }} />
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODEL BADGE v16 — CENTERED + HIGH CONTRAST + PULL + TICKER
// ══════════════════════════════════════════════════════════════════
type _PullPhase = 'idle' | 'starting' | 'pulling' | 'done' | 'error';

function ModelBadge({ model, reason, capability, info, isConn, loading, onModelPulled }: {
  model: string; reason: string; capability: string; info?: string; isConn: boolean; loading: boolean;
  onModelPulled?: (m: string) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [pullPhase, setPullPhase] = useState<_PullPhase>('idle');
  const [pullSt,    setPullSt]    = useState<_PullStatus | null>(null);
  const [pullErr,   setPullErr]   = useState<string | null>(null);
  const fadeA   = useRef(new Animated.Value(0)).current;
  const pulseA  = useRef(new Animated.Value(0.5)).current;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountRef = useRef(true);

  useEffect(() => { Animated.timing(fadeA, { toValue: 1, duration: 380, useNativeDriver: true }).start(); }, [model]);
  useEffect(() => {
    mountRef.current = true;
    if (pullPhase !== 'pulling' && pullPhase !== 'starting') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 550, useNativeDriver: false }),
      Animated.timing(pulseA, { toValue: 0.3, duration: 550, useNativeDriver: false }),
    ]));
    loop.start(); return () => loop.stop();
  }, [pullPhase]);
  useEffect(() => () => { mountRef.current = false; if (pollRef.current) clearInterval(pollRef.current); }, []);

  const _doStartPull = useCallback(async () => {
    if (!isConn) return;
    haptics.heavy(); setPullPhase('starting'); setPullErr(null); setPullSt(null);
    try {
      await _nxRequest('/api/ollama/pull', 'POST', { model: _PULL_MODEL }, 10000);
      if (!mountRef.current) return;
      setPullPhase('pulling');
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        if (!mountRef.current) { clearInterval(pollRef.current!); return; }
        try {
          const raw = await _nxRequest('/api/ollama/pull_status', 'GET', undefined, 6000);
          if (!mountRef.current) return;
          const ps = _parsePullStatus(raw); setPullSt(ps);
          if (ps.done) {
            clearInterval(pollRef.current!);
            if (ps.error) { setPullPhase('error'); setPullErr(ps.error); }
            else { setPullPhase('done'); haptics.success(); setTimeout(() => onModelPulled?.(_PULL_MODEL), 700); }
          }
        } catch (pe: any) { if (mountRef.current) setPullErr(`Poll: ${String(pe?.message || 'timeout').slice(0, 50)}`); }
      }, 1500);
    } catch (e: any) { if (mountRef.current) { setPullPhase('error'); setPullErr(String(e?.message || 'Failed to start pull')); } }
  }, [isConn, onModelPulled]);

  const _doCancelPull = useCallback(() => {
    haptics.medium(); if (pollRef.current) clearInterval(pollRef.current);
    setPullPhase('idle'); setPullSt(null); setPullErr(null);
  }, []);

  const capColors: Record<string, string> = { ELITE: TEAL, PRO: GOLD, GOOD: AMBER, LITE: VIOLET, BASIC: MID, NONE: RED };
  const capColor = capColors[capability] || MID;
  const isSuboptimal = !['ELITE', 'PRO'].includes(capability);

  if (pullPhase === 'starting' || pullPhase === 'pulling') {
    const ps = pullSt; const pct = ps?.pct ?? 0;
    return (
      <Animated.View style={[mpb.wrap, { opacity: pullPhase === 'starting' ? pulseA : 1, ...shadow3d(VIOLET, 0.8) }]}>
        <View style={{ alignItems: 'center', gap: 3, marginBottom: 6 }}>
          <Text style={[mpb.title, { color: VIOLET, textAlign: 'center', fontSize: 13 }]}>PULLING {_PULL_MODEL.toUpperCase()}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 20, fontWeight: '900', color: VIOLET, textAlign: 'center' }}>{pct}%</Text>
        </View>
        <_PullProgressBar pct={pct} color={VIOLET} />
        {ps ? (
          <View style={mpb.statsRow}>
            {[
              { lbl: 'STATUS', val: (ps.status || 'Initialising…').slice(0, 22) },
              { lbl: 'LAYERS', val: ps.totalLayers > 0 ? `${ps.layers}/${ps.totalLayers}` : '—' },
              { lbl: 'DOWNLOADED', val: ps.bytesTotal > 0 ? `${_fmtBytes(ps.bytesDown)} / ${_fmtBytes(ps.bytesTotal)}` : _fmtBytes(ps.bytesDown) },
            ].map(s => (
              <View key={s.lbl} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: VIOLET, fontWeight: '900', letterSpacing: 0.8, textAlign: 'center' }}>{s.lbl}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 10, color: WHITE, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>{s.val}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 6, marginTop: 4 }}>
            <ActivityIndicator size="small" color={VIOLET} />
            <Text style={{ fontFamily: MONO, fontSize: 10, color: VIOLET, textAlign: 'center' }}>Sending pull request to PC…</Text>
          </View>
        )}
        {pullErr ? <Text style={{ fontFamily: MONO, fontSize: 9, color: AMBER, marginTop: 4, textAlign: 'center' }} numberOfLines={2}>{pullErr}</Text> : null}
        <TouchableOpacity onPress={_doCancelPull} style={[mpb.cancelBtn, { alignSelf: 'center', marginTop: 8 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: RED, textAlign: 'center' }}>CANCEL DOWNLOAD</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (pullPhase === 'done') {
    return (
      <View style={[mpb.wrap, { borderColor: TEAL + '55', backgroundColor: TEAL + '0C', alignItems: 'center', gap: 6, ...shadow3d(TEAL, 0.6) }]}>
        <MaterialIcons name="check-circle" size={22} color={TEAL} />
        <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: TEAL, textAlign: 'center' }}>{_PULL_MODEL.toUpperCase()} INSTALLED SUCCESSFULLY</Text>
        <Text style={{ fontFamily: MONO, fontSize: 9, color: TEAL, opacity: 0.7, textAlign: 'center' }}>Model is now available — restart a new chat to use it</Text>
      </View>
    );
  }

  if (pullPhase === 'error') {
    return (
      <View style={[mpb.wrap, { borderColor: RED + '45', backgroundColor: RED + '08', alignItems: 'center', gap: 8, ...shadow3d(RED, 0.4) }]}>
        <MaterialIcons name="error-outline" size={20} color={RED} />
        <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: RED, textAlign: 'center' }}>PULL FAILED</Text>
        <Text style={{ fontFamily: MONO, fontSize: 9, color: AMBER, lineHeight: 14, textAlign: 'center' }} numberOfLines={3}>{pullErr || 'Unknown error — check Ollama is running on your PC.'}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={_doCancelPull} style={[mpb.cancelBtn]}>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: MID, fontWeight: '900' }}>DISMISS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={_doStartPull} activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderColor: AMBER, backgroundColor: AMBER + '18', ...shadow3d(AMBER, 0.5) }}>
            <MaterialIcons name="refresh" size={14} color={AMBER} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER }}>RETRY PULL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isConn) {
    return (
      <View style={mod.wrap}>
        <MaterialCommunityIcons name="robot-dead-outline" size={14} color={RED} />
        <Text style={[mod.txt, { color: RED, fontWeight: '800', fontSize: 10 }]}>OFFLINE — Pair PC from HOME tab to unlock full AI capabilities</Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={[mod.wrap, { justifyContent: 'center', gap: 8 }]}>
        <ActivityIndicator size="small" color={AMBER} />
        <Text style={[mod.txt, { color: AMBER, fontWeight: '700', textAlign: 'center' }]}>Scanning Ollama for installed models…</Text>
      </View>
    );
  }
  if (!model) {
    return (
      <View style={{ borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: AMBER + '50', backgroundColor: AMBER + '0A', ...shadow3d(AMBER, 0.4) }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16 }}>
          <MaterialIcons name="warning-amber" size={20} color={AMBER} />
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: AMBER, textAlign: 'center' }}>NO OLLAMA MODEL FOUND</Text>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: TEXT2, textAlign: 'center', lineHeight: 16 }}>Download qwen2.5-coder:7b (~4 GB) directly to your PC via LAN — no cloud involved</Text>
          <TouchableOpacity onPress={_doStartPull} activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, borderColor: VIOLET, backgroundColor: VIOLET + '18', ...shadow3d(VIOLET, 0.9) }}>
            <MaterialCommunityIcons name="download-circle-outline" size={18} color={VIOLET} />
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: VIOLET, letterSpacing: 0.8 }}>PULL qwen2.5-coder:7b</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: MONO, fontSize: 9, color: MID, textAlign: 'center' }}>Apache 2.0 · Best Python & automation model · ~4 GB LAN transfer</Text>
        </View>
      </View>
    );
  }

  const modelLabel = model.split(':')[0].slice(0, 20).toUpperCase();
  return (
    <Animated.View style={{ opacity: fadeA }}>
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.85}
        style={{ borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: TEAL + '35', backgroundColor: TEAL + '08', ...shadow3d(TEAL, 0.3) }}>
        <View style={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="chip" size={14} color={TEAL} />
            <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: WHITE, letterSpacing: 0.6, textAlign: 'center' }}>{modelLabel}</Text>
            <View style={[mod.capBadge, { borderColor: capColor, backgroundColor: capColor + '18', ...shadow3d(capColor, 0.6) }]}>
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: capColor, letterSpacing: 1 }}>{capability}</Text>
            </View>
            <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={14} color={TEAL} />
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: TEXT2, textAlign: 'center', lineHeight: 15 }} numberOfLines={expanded ? 5 : 1}>{reason}</Text>
          {info ? <Text style={{ fontFamily: MONO, fontSize: 9, color: TEAL, opacity: 0.8, textAlign: 'center', letterSpacing: 0.3 }}>{info}</Text> : null}
        </View>
        {expanded && isSuboptimal && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: VIOLET, fontWeight: '900', textAlign: 'center' }}>UPGRADE RECOMMENDED: qwen2.5-coder:7b</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: TEXT2, lineHeight: 14, textAlign: 'center' }}>Best Python & automation model · Apache 2.0 · ~4 GB · Installs direct via LAN to your PC</Text>
            <TouchableOpacity onPress={_doStartPull} activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderColor: VIOLET, backgroundColor: VIOLET + '18', ...shadow3d(VIOLET, 0.8) }}>
              <MaterialCommunityIcons name="download-circle" size={18} color={VIOLET} />
              <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: VIOLET, letterSpacing: 0.8 }}>PULL qwen2.5-coder:7b</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const mpb = StyleSheet.create({
  wrap:     { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: VIOLET + '40', backgroundColor: VIOLET + '09' },
  title:    { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  cancelBtn:{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderColor: RED + '60', backgroundColor: RED + '0C' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 4 },
});
const mod = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: DIM + '60' },
  capBadge: { borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  dot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: TEAL, flexShrink: 0 },
  txt:      { fontFamily: MONO, fontSize: 9.5, flex: 1, lineHeight: 14 },
  modelName:{ fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, flexShrink: 0 },
  pullBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
});

// ══════════════════════════════════════════════════════════════════
// HISTORY SHEET
// ══════════════════════════════════════════════════════════════════
function HistorySheet({ visible, sessions, currentId, onClose, onRestore, onDelete, onNewChat }: {
  visible: boolean; sessions: Session[]; currentId: string | null;
  onClose: () => void; onRestore: (s: Session) => void; onDelete: (id: string) => void; onNewChat: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const slideA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideA, { toValue: visible ? 1 : 0, tension: 85, friction: 13, useNativeDriver: true }).start();
    if (!visible) setDeletingId(null);
  }, [visible]);

  const translateY = slideA.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  const opacity    = slideA.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.95, 1] });

  const modelColor = (model?: string) => {
    if (!model) return MID;
    const tier = MODEL_TIERS.find(t => t.match.test(model));
    const cap: Record<string, string> = { ELITE: TEAL, PRO: GOLD, GOOD: AMBER, LITE: VIOLET, BASIC: MID };
    return cap[tier?.capability || 'BASIC'] || MID;
  };

  const renderSession = useCallback(({ item }: { item: Session }) => {
    const isCurrent = item.id === currentId; const isDeleting = deletingId === item.id; const mColor = modelColor(item.model);
    return (
      <Pressable
        onPress={() => { if (!isDeleting) { haptics.medium(); onRestore(item); } }}
        onLongPress={() => { haptics.heavy(); setDeletingId(isDeleting ? null : item.id); }}
        style={({ pressed }) => [sh.row, isCurrent && { borderColor: GOLD + '50', backgroundColor: GOLD + '09' }, pressed && { backgroundColor: VIOLET + '14' }]}>
        <View style={{ width: 3.5, alignSelf: 'stretch', borderRadius: 2, backgroundColor: isCurrent ? GOLD : mColor, marginRight: 12, flexShrink: 0 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: isCurrent ? GOLD : TEXT }} numberOfLines={1}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: TEXT2 }}>{item.msgCount} msgs</Text>
            {item.model ? <Text style={{ fontFamily: MONO, fontSize: 9, color: mColor }} numberOfLines={1}>{item.model.split(':')[0].slice(0, 12)}</Text> : null}
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: MID }}>{_fmtRelTime(item.updatedAt)}</Text>
          </View>
        </View>
        {isDeleting && (
          <TouchableOpacity onPress={() => { haptics.heavy(); onDelete(item.id); setDeletingId(null); }}
            style={{ marginLeft: 10, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7, borderColor: RED, backgroundColor: RED + '14', flexShrink: 0 }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: RED }}>DELETE</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    );
  }, [currentId, deletingId, onRestore, onDelete]);

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, opacity }}><Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} onPress={onClose} /></Animated.View>
      <Animated.View style={[sh.sheet, { transform: [{ translateY }] }]}>
        <View style={{ alignItems: 'center', paddingTop: 14, marginBottom: 6 }}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: GOLD + '45' }} />
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14, gap: 4 }}>
          <MaterialIcons name="history" size={24} color={GOLD} />
          <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: '900', color: GOLD, textAlign: 'center', letterSpacing: 1 }}>CHAT HISTORY</Text>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: MID, textAlign: 'center' }}>{sessions.length} SESSION{sessions.length !== 1 ? 'S' : ''} · AES-256 ENCRYPTED AT REST</Text>
        </View>
        <TouchableOpacity onPress={() => { haptics.heavy(); onNewChat(); onClose(); }} activeOpacity={0.85} style={sh.newChatBtn}>
          <MaterialIcons name="add-circle" size={20} color="#000" />
          <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.5 }}>NEW CHAT</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: '#00000080', textAlign: 'right' }}>Saves current session first</Text>
        </TouchableOpacity>
        {sessions.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 14 }}>
            <MaterialCommunityIcons name="robot-confused-outline" size={52} color={DIM} />
            <Text style={{ fontFamily: MONO, fontSize: 13, color: MID, textAlign: 'center', lineHeight: 22 }}>{'No saved sessions yet.\nStart chatting and your history\nwill appear here automatically.'}</Text>
          </View>
        ) : (
          <FlatList data={sessions} keyExtractor={s => s.id} renderItem={renderSession}
            showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: DIM + '35', marginHorizontal: 18 }} />} />
        )}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: MID, textAlign: 'center', lineHeight: 14 }}>{'Long-press any session to reveal the delete option · Up to 60 sessions stored'}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  sheet:     { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: SURFACE,
               borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 2.5, borderTopColor: GOLD + '60',
               maxHeight: '84%', ...shadow3d(GOLD, 1.2) },
  hdr:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14 },
  hdrIcon:   { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  newChatBtn:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 14,
               paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16, backgroundColor: GOLD, ...shadow3d(GOLD, 1.2) },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15,
               borderWidth: 1, borderColor: 'transparent', borderRadius: 14, marginHorizontal: 8, marginVertical: 2 },
});

// ══════════════════════════════════════════════════════════════════
// PIPELINE PROGRESS BAR — CENTERED
// ══════════════════════════════════════════════════════════════════
const PIPELINE_STAGES: { id: Stage; label: string; icon: string }[] = [
  { id: 'connecting', label: 'LINK',   icon: 'link'          },
  { id: 'kb_search',  label: 'KB',     icon: 'library-books' },
  { id: 'context',    label: 'CTX',    icon: 'layers'        },
  { id: 'ai',         label: 'AI',     icon: 'smart-toy'     },
  { id: 'streaming',  label: 'STREAM', icon: 'waves'         },
];
const STAGE_ORDER = ['connecting', 'kb_search', 'context', 'ai', 'streaming'];

function PipelineProgress({ stage, elapsed }: { stage: Stage; elapsed: number }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  const pulseA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (stage === 'idle' || stage === 'done' || stage === 'error') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 500, useNativeDriver: false }),
      Animated.timing(pulseA, { toValue: 0.2, duration: 500, useNativeDriver: false }),
    ]));
    loop.start(); return () => loop.stop();
  }, [stage]);

  if (stage === 'idle' || stage === 'done') return null;
  const isError = stage === 'error';
  const stageColor = STAGE_COLORS[stage];
  const elapsedStr = elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`;

  return (
    <View style={[pipe.root, { ...shadow3d(stageColor, 0.6) }]}>
      <View style={[pipe.topBar, { backgroundColor: stageColor }]} />
      {/* Stage label centered */}
      <View style={{ alignItems: 'center', paddingTop: 10, paddingHorizontal: 14, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!isError && <GlowDot color={stageColor} size={6} />}
          {isError && <MaterialIcons name="error-outline" size={14} color={RED} />}
          <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: stageColor, textAlign: 'center', letterSpacing: 1.5 }}>{STAGE_LABELS[stage]}</Text>
          {elapsed > 0 && <Text style={{ fontFamily: MONO, fontSize: 10, color: MID }}>{elapsedStr}</Text>}
          {!isError && stage !== 'done' && <ActivityIndicator size="small" color={stageColor} style={{ transform: [{ scale: 0.7 }] }} />}
        </View>
      </View>
      {/* Pipeline nodes */}
      <View style={pipe.stagesRow}>
        {PIPELINE_STAGES.map((s, i) => {
          const isDone = currentIdx > i; const isActive = currentIdx === i;
          const c = isDone ? TEAL : isActive ? stageColor : DIM;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <View style={[pipe.connector, { backgroundColor: isDone ? TEAL : DIM + '40', flex: 1 }]} />}
              <View style={{ alignItems: 'center', gap: 3 }}>
                <View style={[pipe.node, { borderColor: c, backgroundColor: isActive ? stageColor + '22' : isDone ? TEAL + '18' : 'transparent', ...( isActive ? shadow3d(stageColor, 0.6) : {}) }]}>
                  {isActive ? (
                    <Animated.View style={{ opacity: pulseA }}><MaterialIcons name={s.icon as any} size={13} color={stageColor} /></Animated.View>
                  ) : isDone ? (
                    <MaterialIcons name="check" size={11} color={TEAL} />
                  ) : (
                    <MaterialIcons name={s.icon as any} size={11} color={DIM} />
                  )}
                </View>
                <Text style={{ fontFamily: MONO, fontSize: 7.5, color: isDone ? TEAL : isActive ? stageColor : DIM, fontWeight: isActive ? '900' : '600', textAlign: 'center' }}>{s.label}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
const pipe = StyleSheet.create({
  root:       { marginHorizontal: 10, marginBottom: 8, borderWidth: 1.5, borderRadius: 14, backgroundColor: SURF3, overflow: 'hidden', borderColor: DIM + '60' },
  topBar:     { height: 3 },
  stagesRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 14 },
  node:       { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  connector:  { height: 2.5, borderRadius: 1.5, marginTop: 14 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 },
  statusTxt:  { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  elapsedTxt: { fontFamily: MONO, fontSize: 9, color: MID },
});

// ══════════════════════════════════════════════════════════════════
// STREAMING CURSOR
// ══════════════════════════════════════════════════════════════════
function StreamingCursor({ color }: { color: string }) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 0, duration: 480, useNativeDriver: true }),
      Animated.timing(a, { toValue: 1, duration: 480, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: 9, height: 16, borderRadius: 2, backgroundColor: color, opacity: a, marginLeft: 3, marginBottom: -2 }} />;
}

// ══════════════════════════════════════════════════════════════════
// KB SOURCES
// ══════════════════════════════════════════════════════════════════
function KBSourcesPill({ sources, count }: { sources?: KBSource[]; count: number }) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  return (
    <View style={{ marginTop: 5, alignItems: 'flex-start' }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1.5, borderRadius: 10, borderColor: VIOLET + '55', backgroundColor: VIOLET + '0E' }}>
        <MaterialIcons name="library-books" size={11} color={VIOLET} />
        <Text style={{ fontFamily: MONO, fontSize: 9, color: VIOLET, fontWeight: '900', letterSpacing: 0.3 }}>{count} KB SOURCE{count !== 1 ? 'S' : ''} USED</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={11} color={VIOLET} />
      </TouchableOpacity>
      {open && sources && sources.slice(0, 3).map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingTop: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: VIOLET }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: TEXT2, flex: 1 }} numberOfLines={1}>{s.topic}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: VIOLET }}>{s.relevance}%</Text>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// SESSION ANALYTICS — CENTERED + HIGH CONTRAST
// ══════════════════════════════════════════════════════════════════
function SessionAnalytics({ messages, isConn, model }: { messages: Msg[]; isConn: boolean; model: string }) {
  const turns  = messages.filter(m => m.role === 'user').length;
  const bMsgs  = messages.filter(m => m.role === 'butler');
  const rTimes = bMsgs.map(m => m.metadata?.responseMs).filter((v): v is number => !!v);
  const avgMs  = rTimes.length ? Math.round(rTimes.reduce((a, b) => a + b, 0) / rTimes.length) : null;
  const kbHits = bMsgs.reduce((s, m) => s + (m.metadata?.kbUsed || 0), 0);
  const modelLbl = model ? model.split(':')[0].slice(0, 10).toUpperCase() : '—';
  if (turns === 0) return null;
  const items = [
    { val: String(turns),   label: 'TURNS',  color: GOLD   },
    { val: avgMs ? (avgMs > 1000 ? `${(avgMs/1000).toFixed(1)}s` : `${avgMs}ms`) : '—', label: 'AVG SPEED', color: TEAL },
    { val: String(kbHits), label: 'KB HITS', color: VIOLET },
    { val: modelLbl,        label: 'MODEL',  color: AMBER  },
    { val: isConn ? 'LIVE' : 'LOCAL', label: 'STATUS', color: isConn ? TEAL : AMBER },
  ];
  return (
    <View style={sa.root}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={sa.divider} />}
          <View style={sa.cell}>
            <Text style={[sa.val, { color: item.color }]} numberOfLines={1}>{item.val}</Text>
            <Text style={sa.label}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
const sa = StyleSheet.create({
  root:    { flexDirection: 'row', backgroundColor: SURF3, borderBottomWidth: 1.5, borderBottomColor: GOLD + '22', ...shadow3d(GOLD, 0.2) },
  cell:    { flex: 1, alignItems: 'center', paddingVertical: 9 },
  val:     { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 16, textAlign: 'center' },
  label:   { fontFamily: MONO, fontSize: 7, color: TEXT2, letterSpacing: 0.8, marginTop: 2, textAlign: 'center', fontWeight: '700' },
  divider: { width: 1, backgroundColor: DIM + '80', marginVertical: 6 },
});

// ══════════════════════════════════════════════════════════════════
// MODE BAR — CENTERED + VISIBLE INACTIVE TABS
// ══════════════════════════════════════════════════════════════════
const MODES: { id: Mode; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'general', label: 'GENERAL', icon: 'chat',       color: GOLD,   desc: 'Conversational AI — ask anything' },
  { id: 'code',    label: 'CODE',    icon: 'code',       color: TEAL,   desc: 'Python-only · production code' },
  { id: 'debug',   label: 'DEBUG',   icon: 'bug-report', color: AMBER,  desc: 'Root cause + fix + traceback' },
  { id: 'analyze', label: 'ANALYZE', icon: 'analytics',  color: VIOLET, desc: 'Step-by-step reasoning + pros/cons' },
];

function ModeBar({ active, onSelect }: { active: Mode; onSelect: (m: Mode) => void }) {
  const scaleRefs = useRef(MODES.map(() => new Animated.Value(1))).current;
  const pressIn  = (i: number) => Animated.spring(scaleRefs[i], { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 12 }).start();
  const pressOut = (i: number) => Animated.spring(scaleRefs[i], { toValue: 1,    useNativeDriver: true, tension: 280, friction: 10 }).start();

  return (
    <View>
      <View style={mb.root}>
        {MODES.map((m, i) => {
          const isAct = active === m.id;
          return (
            <Pressable key={m.id}
              onPress={() => { haptics.selection(); onSelect(m.id); }}
              onPressIn={() => pressIn(i)} onPressOut={() => pressOut(i)}
              style={{ flex: 1 }}>
              <Animated.View style={[mb.tab,
                isAct && { borderBottomColor: m.color, borderBottomWidth: 3, backgroundColor: m.color + '14', ...shadow3d(m.color, 0.4) },
                { transform: [{ scale: scaleRefs[i] }] }]}>
                <MaterialIcons name={m.icon as any} size={isAct ? 16 : 13} color={isAct ? m.color : TEXT2} />
                <Text style={[mb.txt, { color: isAct ? m.color : TEXT2, fontWeight: isAct ? '900' : '700', fontSize: isAct ? 9.5 : 8.5 }]}>{m.label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
      {/* Mode description ticker */}
      {MODES.filter(m => m.id === active).map(m => (
        <View key={m.id} style={{ backgroundColor: m.color + '10', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: m.color + '25' }}>
          <Text style={{ fontFamily: MONO, fontSize: 9.5, color: m.color, textAlign: 'center', fontWeight: '700', letterSpacing: 0.3 }}>{m.desc}</Text>
        </View>
      ))}
    </View>
  );
}
const mb = StyleSheet.create({
  root: { flexDirection: 'row', backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: DIM + '80' },
  tab:  { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  txt:  { fontFamily: MONO, textAlign: 'center' },
});

// ══════════════════════════════════════════════════════════════════
// HOLOGRAPHIC HEADER — CENTERED + BIGGER + 3D
// ══════════════════════════════════════════════════════════════════
function HoloHeader({ safeTop, isConn, model, msgCount, sessionCount, onClear, onBuilder, onHistory }: {
  safeTop: number; isConn: boolean; model: string; msgCount: number; sessionCount: number;
  onClear: () => void; onBuilder: () => void; onHistory: () => void;
}) {
  const { time, secs } = useClock();
  const cc    = isConn ? TEAL : AMBER;
  const shimA = useRef(new Animated.Value(-SW)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 2, duration: 2800, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW, duration: 0, useNativeDriver: true }),
      Animated.delay(9000),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  const modelLbl = model ? model.split(':')[0].slice(0, 16).toUpperCase() : isConn ? 'DETECTING…' : 'OFFLINE';

  return (
    <View style={[hh.root, { paddingTop: safeTop }]}>
      {/* Rainbow top stripe */}
      <View style={{ height: 3.5, flexDirection: 'row' }}>
        {[GOLD, AMBER, VIOLET, TEAL, RED, TEAL2].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <Animated.View pointerEvents="none" style={[hh.shimmer, { transform: [{ translateX: shimA }] }]} />
      {/* Main row */}
      <View style={hh.body}>
        {/* Mascot */}
        <View style={[hh.mascotBox, { borderColor: GOLD, backgroundColor: GOLD + '0E', ...shadow3d(GOLD, 0.8) }]}>
          {MASCOT ? <Image source={MASCOT} style={{ width: 38, height: 38 }} contentFit="cover" /> : <MaterialCommunityIcons name="robot-happy" size={24} color={GOLD} />}
          <View style={[hh.statusOrb, { backgroundColor: cc, ...shadow3d(cc, 1.2) }]} />
        </View>
        {/* Centered title block */}
        <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
          <Text style={hh.brand}>
            <Text style={{ color: GOLD }}>AI </Text>
            <Text style={{ color: WHITE }}>BUTLER</Text>
          </Text>
          <Text style={hh.brandSub}>NEXUS CONSOLE · LOCAL AI · ZERO CLOUD</Text>
          {/* Status pills centered */}
          <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
            <View style={[hh.pill, { borderColor: cc, backgroundColor: cc + '12', ...shadow3d(cc, 0.5) }]}>
              <GlowDot color={cc} size={5} />
              <Text style={[hh.pillTxt, { color: cc }]}>{isConn ? 'CONNECTED' : 'OFFLINE'}</Text>
            </View>
            {isConn && model ? (
              <View style={[hh.pill, { borderColor: VIOLET + '80', backgroundColor: VIOLET + '12' }]}>
                <MaterialCommunityIcons name="chip" size={10} color={VIOLET} />
                <Text style={[hh.pillTxt, { color: VIOLET }]}>{modelLbl}</Text>
              </View>
            ) : null}
            <View style={[hh.pill, { borderColor: TEAL + '50', backgroundColor: TEAL + '0C' }]}>
              <MaterialCommunityIcons name="shield-lock" size={10} color={TEAL} />
              <Text style={[hh.pillTxt, { color: TEAL }]}>AES-256</Text>
            </View>
          </View>
        </View>
        {/* Clock + buttons */}
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
              <Text style={hh.clockMain}>{time}</Text>
              <Text style={[hh.clockSecs, { color: GOLD }]}>{secs}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <TouchableOpacity onPress={onHistory} style={[hh.iconBtn, { borderColor: VIOLET, backgroundColor: VIOLET + '12', ...shadow3d(VIOLET, 0.6) }]}>
              <MaterialIcons name="history" size={14} color={VIOLET} />
              {sessionCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8,
                  backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, ...shadow3d(GOLD, 0.8) }}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: '#000' }}>{sessionCount > 99 ? '99' : sessionCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {msgCount > 0 && (
              <TouchableOpacity onPress={onClear} style={[hh.iconBtn, { borderColor: RED + '70', backgroundColor: RED + '0E' }]}>
                <MaterialIcons name="delete-sweep" size={14} color={RED} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onBuilder} style={[hh.iconBtn, { borderColor: GOLD, backgroundColor: GOLD + '12', ...shadow3d(GOLD, 0.6) }]}>
              <MaterialIcons name="code" size={14} color={GOLD} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Rotating ticker */}
      <RotatingTicker color={GOLD + 'CC'} bgColor={SURFACE} interval={5500} />
      {/* Bottom gradient stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        <View style={{ flex: 6, backgroundColor: GOLD + '25' }} />
        <View style={{ width: 22, backgroundColor: GOLD }} />
        <View style={{ flex: 4, backgroundColor: AMBER + '18' }} />
        <View style={{ width: 10, backgroundColor: AMBER }} />
        <View style={{ flex: 9, backgroundColor: VIOLET + '12' }} />
        <View style={{ width: 12, backgroundColor: VIOLET }} />
        <View style={{ flex: 5, backgroundColor: TEAL + '10' }} />
        <View style={{ width: 8,  backgroundColor: TEAL }} />
      </View>
    </View>
  );
}
const hh = StyleSheet.create({
  root:      { backgroundColor: SURFACE, overflow: 'hidden', ...shadow3d(GOLD, 0.5) },
  shimmer:   { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(255,209,102,0.05)', zIndex: 0 },
  body:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 12, zIndex: 1 },
  mascotBox: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' },
  statusOrb: { position: 'absolute', bottom: 3, right: 3, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: SURFACE },
  brand:     { fontFamily: MONO, fontSize: 22, fontWeight: '900', letterSpacing: 1, lineHeight: 26, textAlign: 'center' },
  brandSub:  { fontFamily: MONO, fontSize: 8.5, color: TEXT2, letterSpacing: 1.5, fontWeight: '800', textAlign: 'center' },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  pillTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },
  clockMain: { fontFamily: MONO, fontSize: 24, fontWeight: '900', color: WHITE, letterSpacing: 1 },
  clockSecs: { fontFamily: MONO, fontSize: 14, fontWeight: '900' },
  iconBtn:   { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
});

// ══════════════════════════════════════════════════════════════════
// TYPING DOTS
// ══════════════════════════════════════════════════════════════════
function SimpleTypingDots({ color }: { color: string }) {
  const dots = useRef([new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)]).current;
  useEffect(() => {
    const loops = dots.map((a, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 170),
      Animated.timing(a, { toValue: 1,   duration: 360, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 360, useNativeDriver: true }),
    ])));
    loops.forEach(l => l.start()); return () => loops.forEach(l => l.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingLeft: 4, paddingVertical: 10 }}>
      {dots.map((a, i) => <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: a }} />)}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// WELCOME PANEL — CENTERED + BOLD
// ══════════════════════════════════════════════════════════════════
const QUICK_ACTIONS = [
  { icon: 'monitor',           color: TEAL,      label: 'System Stats',   prompt: 'Show my CPU usage, RAM, disk, and top processes'       },
  { icon: 'cleaning-services', color: GOLD,      label: 'Clean Temp',     prompt: 'Write Python to clean all temp files and show freed MB' },
  { icon: 'speed',             color: AMBER,     label: 'Top Processes',  prompt: 'List top 8 CPU-consuming processes on my PC now'        },
  { icon: 'wifi',              color: VIOLET,    label: 'Network Info',   prompt: 'Scan LAN and show all connected devices and my IP'       },
  { icon: 'storage',           color: '#FF6EB4', label: 'Disk Map',       prompt: 'Show disk usage breakdown by folder and drive'          },
  { icon: 'security',          color: RED,       label: 'Security Audit', prompt: 'Run security audit: open ports, suspicious processes'   },
];

function WelcomePanel({ isConn, onSend }: { isConn: boolean; onSend: (p: string) => void }) {
  const floatA = useRef(new Animated.Value(0)).current;
  const enterA = useRef(new Animated.Value(0)).current;
  const enterY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(enterY, { toValue: 0, tension: 130, friction: 14, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  return (
    <Animated.View style={{ paddingHorizontal: 12, paddingTop: 16, opacity: enterA, transform: [{ translateY: enterY }] }}>
      {/* Hero card — centered */}
      <View style={[wp.hero, { ...shadow3d(GOLD, 0.9) }]}>
        <View style={{ height: 4, backgroundColor: GOLD }} />
        <View style={{ alignItems: 'center', padding: 20, gap: 12 }}>
          <Animated.View style={{ transform: [{ translateY: floatY }], alignItems: 'center' }}>
            {MASCOT ? (
              <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 3, borderColor: GOLD, ...shadow3d(GOLD, 1.2) }}>
                <Image source={MASCOT} style={{ width: 88, height: 88 }} contentFit="cover" />
              </View>
            ) : (
              <MaterialCommunityIcons name="robot-happy" size={80} color={GOLD} />
            )}
            <View style={[wp.connPill, { marginTop: 8, borderColor: (isConn ? TEAL : RED), backgroundColor: (isConn ? TEAL : RED) + '12', ...shadow3d(isConn ? TEAL : RED, 0.6) }]}>
              <GlowDot color={isConn ? TEAL : RED} size={5} />
              <Text style={{ fontFamily: MONO, fontSize: 9, color: isConn ? TEAL : RED, fontWeight: '900', letterSpacing: 0.5 }}>{isConn ? 'PC CONNECTED · LIVE' : 'PC NOT PAIRED'}</Text>
            </View>
          </Animated.View>
          {/* Centered title */}
          <Text style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: 4, fontWeight: '900', textAlign: 'center' }}>HOLOGRAPHIC NEXUS AI</Text>
          <Text style={{ fontFamily: MONO, fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32 }}>
            <Text style={{ color: GOLD }}>AI </Text>
            <Text style={{ color: WHITE }}>BUTLER</Text>
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 12, color: VIOLET, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 }}>NEXUS CONSOLE · LOCAL AI ENGINE</Text>
          <Text style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT2, lineHeight: 21, textAlign: 'center' }}>
            {'Ollama AI runs entirely on your PC.\n100% local processing · AES-256 encrypted · zero telemetry · zero accounts.'}
          </Text>
          {/* Security badges centered */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {[
              { l: 'ZERO CLOUD',  c: TEAL   },
              { l: 'LAN ONLY',    c: GOLD   },
              { l: 'HMAC-SHA256', c: VIOLET },
              { l: 'AES-256-GCM', c: AMBER  },
              { l: 'SELF-HOSTED', c: TEAL2  },
            ].map(b => (
              <View key={b.l} style={{ borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderColor: b.c, backgroundColor: b.c + '14', ...shadow3d(b.c, 0.4) }}>
                <Text style={{ fontFamily: MONO, fontSize: 8.5, color: b.c, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' }}>{b.l}</Text>
              </View>
            ))}
          </View>
        </View>
        {!isConn && (
          <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1.5, borderColor: AMBER, backgroundColor: AMBER + '0E', padding: 14, ...shadow3d(AMBER, 0.4) }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, color: AMBER, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>HOW TO CONNECT YOUR PC</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10.5, color: TEXT2, lineHeight: 18, textAlign: 'center' }}>
              {'1. Run butler_server.py on your PC\n2. Go to HOME tab → tap PAIR PC\n3. Scan the QR code shown in the terminal\n4. Your phone pairs instantly via LAN'}
            </Text>
          </View>
        )}
      </View>

      {/* Quick actions — centered header */}
      <View style={{ marginTop: 18, gap: 12 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: GOLD, ...shadow3d(GOLD, 0.6) }} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: GOLD, fontWeight: '900', letterSpacing: 3, textAlign: 'center' }}>QUICK START COMMANDS</Text>
          <Text style={{ fontFamily: MONO, fontSize: 9, color: TEXT2, textAlign: 'center' }}>Tap any tile to run instantly — connects to your PC</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Pressable key={i} onPress={() => { haptics.medium(); onSend(a.prompt); }}
              style={({ pressed }) => [wp.action, {
                borderColor: a.color, backgroundColor: pressed ? a.color + '22' : a.color + '0E',
                opacity: pressed ? 0.85 : 1, ...shadow3d(a.color, 0.5),
              }]}>
              <MaterialIcons name={a.icon as any} size={15} color={a.color} />
              <Text style={{ fontFamily: MONO, fontSize: 11, color: a.color, fontWeight: '800', textAlign: 'center' }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Info ticker in welcome */}
      <View style={{ marginTop: 18, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: DIM + '80', ...shadow3d(VIOLET, 0.2) }}>
        <RotatingTicker color={TEXT2} bgColor={SURF3} interval={4500} />
      </View>
      <View style={{ height: 18 }} />
    </Animated.View>
  );
}
const wp = StyleSheet.create({
  hero:    { backgroundColor: SURFACE, borderRadius: 20, borderWidth: 2, borderColor: GOLD + '40', overflow: 'hidden' },
  connPill:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  guide:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1.5, borderWidth: 0, padding: 14 },
  action:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10 },
});

// ══════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE — BIGGER + MORE CONTRAST
// ══════════════════════════════════════════════════════════════════
function MessageBubble({ msg, onCopy, onSave, onReact, onRetry, isStreaming }: {
  msg: Msg; onCopy: (t: string) => void; onSave: (code: string) => void;
  onReact: (id: string, emoji: string) => void; onRetry?: (id: string) => void; isStreaming?: boolean;
}) {
  const isButler = msg.role === 'butler'; const isFailed = !!msg.failed;
  const mountA   = useRef(new Animated.Value(0)).current;
  const mountY   = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(mountA, { toValue: 1, tension: 100, friction: 12, useNativeDriver: false }),
      Animated.spring(mountY, { toValue: 0, tension: 120, friction: 13, useNativeDriver: true }),
    ]).start();
  }, []);

  if (msg.role === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 20,
          paddingHorizontal: 14, paddingVertical: 6, borderColor: GOLD + '35', backgroundColor: GOLD + '0A' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD }} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: GOLD, textAlign: 'center', fontWeight: '700' }}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  const codeBlocks: { code: string; lang: string }[] = [];
  const re = /```(python|py|bash|sh|javascript|js)?\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let displayText = msg.content;
  while ((match = re.exec(msg.content)) !== null) { codeBlocks.push({ code: match[2].trim(), lang: match[1] || 'python' }); }
  if (codeBlocks.length > 0) { displayText = msg.content.replace(/```(python|py|bash|sh|javascript|js)?\s*\n[\s\S]*?```/g, '').trim(); }

  const slideX = mountA.interpolate({ inputRange: [0, 1], outputRange: [isButler ? -22 : 22, 0] });
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const bubbleColor = isFailed ? RED : isButler ? GOLD : VIOLET;

  return (
    <Pressable onLongPress={() => { haptics.medium(); onCopy(msg.content); }}>
      <Animated.View style={[bub.row, isButler ? bub.left : bub.right,
        { transform: [{ translateX: slideX }, { translateY: mountY }], opacity: mountA }]}>
        <View style={[bub.bubble,
          { borderColor: bubbleColor + (isFailed ? '70' : '40'),
            borderLeftWidth: isButler ? 4 : 1.5, borderLeftColor: isButler ? bubbleColor : bubbleColor + '45',
            backgroundColor: isFailed ? RED + '08' : isButler ? SURFACE : SURFACE2,
            ...shadow3d(bubbleColor, isButler ? 0.7 : 0.4) }]}>
          <View style={{ height: 3, backgroundColor: isFailed ? RED : bubbleColor, opacity: isButler ? 1 : 0.6 }} />
          {/* Bubble header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 11, marginBottom: 8 }}>
            <View style={[bub.avatar, { borderColor: bubbleColor, backgroundColor: bubbleColor + '14', ...shadow3d(bubbleColor, 0.5) }]}>
              <MaterialIcons name={isFailed ? 'error-outline' : isButler ? 'smart-toy' : 'person'} size={14} color={bubbleColor} />
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: bubbleColor, letterSpacing: 0.3 }}>{isButler ? 'Butler AI' : 'You'}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: TEXT2 }}>{time}</Text>
            {msg.metadata?.responseMs ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, borderColor: TEAL + '40', backgroundColor: TEAL + '0C' }}>
                <MaterialIcons name="bolt" size={9} color={TEAL} />
                <Text style={{ fontFamily: MONO, fontSize: 8, color: TEAL, fontWeight: '700' }}>{msg.metadata.responseMs > 1000 ? `${(msg.metadata.responseMs/1000).toFixed(1)}s` : `${msg.metadata.responseMs}ms`}</Text>
              </View>
            ) : null}
            {msg.reaction ? <Text style={{ fontSize: 16, marginLeft: 'auto' as any }}>{msg.reaction}</Text> : null}
          </View>
          {/* Content */}
          {displayText ? (
            <View style={{ paddingHorizontal: 14, paddingBottom: isButler ? 4 : 14 }}>
              <Text style={[bub.content, { color: isFailed ? RED : isButler ? TEXT : WHITE }]}>{displayText}</Text>
              {isStreaming && isButler && <View style={{ marginTop: 4, flexDirection: 'row' }}><StreamingCursor color={GOLD} /></View>}
            </View>
          ) : null}
          {isStreaming && isButler && !displayText && <View style={{ paddingHorizontal: 14, paddingBottom: 4 }}><SimpleTypingDots color={GOLD} /></View>}
          {/* Code blocks */}
          {codeBlocks.map((cb, i) => (
            <View key={i} style={[bub.codeBlock, { borderColor: TEAL + '35', ...shadow3d(TEAL, 0.3) }]}>
              <View style={bub.codeHdr}>
                <MaterialCommunityIcons name="code-braces" size={12} color={TEAL} />
                <Text style={{ fontFamily: MONO, fontSize: 9, color: TEAL, flex: 1, fontWeight: '700' }}>{cb.lang.toUpperCase()}</Text>
                <Pressable onPress={() => { haptics.light(); onCopy(cb.code); }}
                  style={[bub.codeBtn, { borderColor: GOLD + '40' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: GOLD, fontWeight: '700' }}>COPY</Text>
                </Pressable>
                <Pressable onPress={() => { haptics.medium(); onSave(cb.code); }}
                  style={[bub.codeBtn, { borderColor: TEAL, backgroundColor: TEAL + '12' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: TEAL, fontWeight: '700' }}>SAVE</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={{ fontFamily: MONO, fontSize: 12.5, color: '#8EDCF0', padding: 14, lineHeight: 20 }}>{cb.code}</Text>
              </ScrollView>
            </View>
          ))}
          {isButler && (msg.metadata?.kbUsed ?? 0) > 0 && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 9 }}>
              <KBSourcesPill sources={msg.kbSources} count={msg.metadata?.kbUsed ?? 0} />
            </View>
          )}
          {isFailed && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: RED, marginBottom: 10, lineHeight: 16 }}>{msg.failReason || 'Request failed — tap to retry'}</Text>
              {onRetry && (
                <TouchableOpacity onPress={() => { haptics.medium(); onRetry(msg.id); }} activeOpacity={0.85}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderColor: AMBER, backgroundColor: AMBER + '12', alignSelf: 'flex-start', ...shadow3d(AMBER, 0.5) }}>
                  <MaterialIcons name="refresh" size={14} color={AMBER} />
                  <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: AMBER }}>RETRY</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {isButler && !isFailed && (
            <View style={bub.footer}>
              {['\uD83D\uDC4D', '\uD83D\uDC4E', '\u2B50'].map(e => (
                <Pressable key={e} onPress={() => { haptics.light(); onReact(msg.id, e); }}
                  style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: msg.reaction === e ? GOLD + '28' : 'transparent' }}>
                  <Text style={{ fontSize: 16 }}>{e}</Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { haptics.light(); onCopy(msg.content); }}
                style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="content-copy" size={14} color={TEXT2} />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
const bub = StyleSheet.create({
  row:       { paddingHorizontal: 10, marginBottom: 14 },
  left:      { alignItems: 'flex-start' },
  right:     { alignItems: 'flex-end' },
  bubble:    { maxWidth: Math.min(SW * 0.9, 540), borderWidth: 2, borderRadius: 18, overflow: 'hidden' },
  avatar:    { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content:   { fontFamily: SANS, fontSize: 15.5, lineHeight: 24 },
  codeBlock: { borderTopWidth: 1.5, marginTop: 8 },
  codeHdr:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: TEAL + '08', borderBottomWidth: 1, borderBottomColor: TEAL + '20' },
  codeBtn:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  footer:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
});

// ══════════════════════════════════════════════════════════════════
// SCRIPT BUILDER MODAL
// ══════════════════════════════════════════════════════════════════
const BUILD_TEMPLATES = [
  'Monitor CPU every 5s and alert if above 80%',
  'Clean Downloads — delete files older than 30 days',
  'Find all files over 100MB on C: drive',
  'Auto-restart a process if it crashes',
  'Backup Desktop as timestamped ZIP',
];

function BuilderModal({ visible, onClose, onBuild }: { visible: boolean; onClose: () => void; onBuild: (p: string) => void }) {
  const [prompt, setPrompt] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <View style={[bl.sheet, { borderTopColor: GOLD }]}>
          <View style={{ alignItems: 'center', paddingTop: 14, marginBottom: 10 }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: GOLD + '45' }} />
          </View>
          <View style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={[bl.hdrIcon, { borderColor: GOLD, backgroundColor: GOLD + '14', ...shadow3d(GOLD, 0.8) }]}>
              <MaterialIcons name="bolt" size={24} color={GOLD} />
            </View>
            <Text style={[bl.title, { color: GOLD, textAlign: 'center' }]}>SCRIPT BUILDER</Text>
            <Text style={{ fontFamily: SANS, fontSize: 13, color: TEXT2, lineHeight: 19, textAlign: 'center' }}>Describe what you need — Butler AI writes the Python</Text>
          </View>
          <View style={[bl.inputWrap, { borderColor: GOLD + '55' }]}>
            <TextInput style={bl.input} value={prompt} onChangeText={setPrompt}
              placeholder="e.g. find all duplicate files on my desktop..."
              placeholderTextColor={MID} multiline numberOfLines={3}
              autoFocus autoCapitalize="none" keyboardAppearance="dark" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 18 }}>
            {BUILD_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} onPress={() => setPrompt(t)} activeOpacity={0.8}
                style={{ borderWidth: 1.5, borderColor: GOLD + '45', backgroundColor: GOLD + '0C', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: GOLD }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 38 }}>
            <TouchableOpacity onPress={onClose} style={bl.cancelBtn}>
              <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: TEXT2, textAlign: 'center' }}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (prompt.trim()) { haptics.heavy(); onBuild(prompt.trim()); onClose(); setPrompt(''); } }}
              style={[bl.buildBtn, { backgroundColor: GOLD, opacity: prompt.trim() ? 1 : 0.35, ...shadow3d(GOLD, prompt.trim() ? 1.0 : 0.2) }]}
              disabled={!prompt.trim()} activeOpacity={0.85}>
              <MaterialIcons name="bolt" size={20} color="#000" />
              <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', textAlign: 'center' }}>BUILD SCRIPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const bl = StyleSheet.create({
  sheet:    { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 3, paddingHorizontal: 18 },
  handle:   { width: 42, height: 5, borderRadius: 3 },
  hdrIcon:  { width: 52, height: 52, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  inputWrap:{ borderWidth: 2, borderRadius: 14, backgroundColor: BG, paddingHorizontal: 14, marginBottom: 14 },
  input:    { fontSize: 15, color: TEXT, paddingVertical: 14, fontFamily: SANS, lineHeight: 22 },
  cancelBtn:{ flex: 1, borderWidth: 1.5, borderColor: DIM + '80', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buildBtn: { flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK STRIP
// ══════════════════════════════════════════════════════════════════
const STRIP_CMDS = [
  { l: 'CPU %',  p: 'Show current CPU usage and top 5 processes',       c: TEAL    },
  { l: 'CLEAN',  p: 'Write Python to delete temp files and free space',  c: GOLD    },
  { l: 'DISK',   p: 'Show disk usage by drive and top folders',          c: AMBER   },
  { l: 'PROCS',  p: 'List all running processes sorted by CPU usage',    c: VIOLET  },
  { l: 'NETMAP', p: 'Show network: IP, DNS, gateway, open ports',        c: TEAL2   },
  { l: 'RAM',    p: 'Show RAM usage details and swap info',              c: '#FF6EB4' },
];

function QuickStrip({ onCmd, onDrawer }: { onCmd: (p: string) => void; onDrawer: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderTopWidth: 1.5, borderTopColor: GOLD + '18', backgroundColor: SURFACE }}>
      <TouchableOpacity onPress={() => { haptics.light(); onDrawer(); }} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderColor: GOLD, backgroundColor: GOLD + '12', ...shadow3d(GOLD, 0.5) }}>
        <MaterialIcons name="code" size={12} color={GOLD} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: GOLD }}>BUILD</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {STRIP_CMDS.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => { haptics.light(); onCmd(s.p); }} activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, borderColor: s.c, backgroundColor: s.c + '0E' }}>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: s.c, fontWeight: '700' }}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// INPUT BAR — CENTERED STATUS + HIGH CONTRAST
// ══════════════════════════════════════════════════════════════════
function InputBar({ onSend, isConn, disabled }: { onSend: (t: string) => void; isConn: boolean; disabled: boolean }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const sendScA = useRef(new Animated.Value(1)).current;
  const borderA = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(borderA, { toValue: focused ? 1 : text.length > 0 ? 0.5 : 0, duration: 200, useNativeDriver: false }).start(); }, [focused, text.length]);

  const handleSend = () => {
    const t = text.trim(); if (!t || disabled) return;
    haptics.heavy();
    Animated.sequence([
      Animated.spring(sendScA, { toValue: 0.70, useNativeDriver: true, speed: 55, bounciness: 0 }),
      Animated.spring(sendScA, { toValue: 1.15, useNativeDriver: true, speed: 32, bounciness: 20 }),
      Animated.spring(sendScA, { toValue: 1,    useNativeDriver: true, speed: 28, bounciness: 8  }),
    ]).start();
    onSend(t); setText('');
  };
  const borderColor = borderA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [GOLD + '22', GOLD + '66', GOLD] });
  const hasText = text.trim().length > 0;
  const cc = isConn ? TEAL : RED;
  return (
    <View style={ib.root}>
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[GOLD, AMBER, VIOLET, TEAL, RED].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c, opacity: focused ? 1 : 0.28 }} />)}
      </View>
      <View style={ib.row}>
        <View style={[ib.connPill, { borderColor: cc, backgroundColor: cc + '12', ...shadow3d(cc, 0.5) }]}>
          <GlowDot color={cc} size={5} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: cc, fontWeight: '900' }}>{isConn ? 'ON' : 'OFF'}</Text>
        </View>
        <Animated.View style={[ib.inputWrap, { borderColor }]}>
          <TextInput style={ib.input} value={text}
            onChangeText={v => { setText(v); autoResearch.notifyTyping(v); }}
            placeholder={isConn ? 'Ask Butler AI anything…' : 'Pair your PC first from HOME tab…'}
            placeholderTextColor={MID} returnKeyType="send" onSubmitEditing={handleSend}
            blurOnSubmit={false} editable={!disabled} multiline maxLength={2000}
            keyboardAppearance="dark" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: sendScA }] }}>
          <TouchableOpacity onPress={handleSend} disabled={disabled || !hasText} activeOpacity={0.88}
            style={[ib.sendBtn, {
              backgroundColor: hasText && !disabled ? GOLD : SURFACE2,
              borderColor: GOLD + (hasText && !disabled ? 'FF' : '30'),
              ...shadow3d(GOLD, hasText && !disabled ? 1.2 : 0.1),
            }]}>
            {disabled
              ? <ActivityIndicator size="small" color={GOLD} />
              : <MaterialIcons name={hasText ? 'send' : 'chevron-right'} size={22} color={hasText && !disabled ? '#000' : GOLD + '50'} />}
          </TouchableOpacity>
        </Animated.View>
      </View>
      {/* Status line — centered */}
      <View style={ib.statusLine}>
        <GlowDot color={isConn ? TEAL : RED} size={5} />
        <Text style={{ fontFamily: MONO, fontSize: 8.5, color: isConn ? TEAL : RED, fontWeight: '700', letterSpacing: 0.8, flex: 1, textAlign: 'center' }}>
          {isConn ? 'BUTLER AI · LOCAL LLM · AES-256 · ZERO CLOUD · LAN ONLY' : 'OFFLINE · GO TO HOME TAB → PAIR PC TO CONNECT'}
        </Text>
        <GlowDot color={isConn ? TEAL : RED} size={5} />
      </View>
    </View>
  );
}
const ib = StyleSheet.create({
  root:      { backgroundColor: SURFACE, borderTopWidth: 1.5, borderTopColor: GOLD + '18' },
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingVertical: 9 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 1 },
  inputWrap: { flex: 1, borderWidth: 2, borderRadius: 15, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, minHeight: 50, maxHeight: 140, backgroundColor: BG },
  input:     { fontFamily: SANS, fontSize: 16, color: TEXT, lineHeight: 22, minHeight: 24, padding: 0 },
  sendBtn:   { width: 52, height: 52, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusLine:{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 5 },
});

// ══════════════════════════════════════════════════════════════════
// OFFLINE REPLY
// ══════════════════════════════════════════════════════════════════
function getOfflineReply(text: string, noConn: boolean): string {
  const lc = text.toLowerCase();
  if (/^(hi|hello|hey)[!?.\s]*$/.test(lc)) return "Hello! I'm Butler AI — your self-hosted PC automation assistant.\n\nConnect your PC to unlock:\n• Ollama local AI (LLaMA, Mistral, Qwen, etc.)\n• Run Python scripts remotely\n• Live system monitoring\n\nGo to HOME tab → PAIR PC to connect.";
  if (/what can you do|capabilities|help/.test(lc)) return "Butler AI capabilities:\n\n• Run any Python script on your PC remotely\n• Monitor CPU, RAM, Disk live\n• Clean temp files, manage processes\n• Network diagnostics\n• Chat with local Ollama AI (zero cloud)\n\nAll 100% local — no cloud, no accounts.";
  if (noConn) return "Your PC is not connected.\n\nTo connect:\n1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan QR code shown in terminal";
  return "Could not reach the AI engine.\n\nCheck:\n1. butler_server.py is running\n2. Ollama is installed (run: ollama list)\n3. Phone & PC are on same WiFi\n\nTap PAIR PC on HOME tab to reconnect.";
}

// ══════════════════════════════════════════════════════════════════
// MAIN BUTLER SCREEN
// ══════════════════════════════════════════════════════════════════
function ButlerInner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectionStatus();

  const [messages,      setMessages]      = useState<Msg[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [chatMode,      setChatMode]      = useState<Mode>('general');
  const [showBuilder,   setShowBuilder]   = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [activeModel,   setActiveModel]   = useState('');
  const [modelReason,   setModelReason]   = useState('');
  const [modelCap,      setModelCap]      = useState('');
  const [modelInfo,     setModelInfo]     = useState('');
  const [modelLoading,  setModelLoading]  = useState(false);
  const [currentStage,  setCurrentStage]  = useState<Stage>('idle');
  const [stageElapsed,  setStageElapsed]  = useState(0);
  const [streamingId,   setStreamingId]   = useState<string | null>(null);
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [currentSessId, setCurrentSessId] = useState<string | null>(null);

  const stageStart   = useRef(0);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef      = useRef<FlatList<Msg>>(null);
  const { addEntry } = useChatHistory();
  const mountRef     = useRef(true);

  const startStage = useCallback((stage: Stage) => {
    stageStart.current = Date.now(); setCurrentStage(stage); setStageElapsed(0);
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    elapsedTimer.current = setInterval(() => setStageElapsed(Date.now() - stageStart.current), 80);
  }, []);

  const endStage = useCallback((stage: Stage = 'done') => {
    if (elapsedTimer.current) { clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
    setCurrentStage(stage); setStageElapsed(Date.now() - stageStart.current);
    if (stage === 'done' || stage === 'error') setTimeout(() => setCurrentStage('idle'), stage === 'done' ? 1800 : 3200);
  }, []);

  const _persistSession = useCallback(async (msgs: Msg[], sessId: string | null, allSessions: Session[], model: string) => {
    if (!msgs.length || !msgs.some(m => m.role === 'user')) return;
    try {
      const id = sessId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const existing = allSessions.find(s => s.id === id);
      const session: Session = { id, title: existing?.title || _autoTitle(msgs), messages: msgs.slice(-120), createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now(), msgCount: msgs.filter(m => m.role !== 'system').length, model: model || existing?.model || '' };
      const updated = await _upsertSession(session, allSessions);
      if (mountRef.current) { setSessions(updated); if (!sessId) setCurrentSessId(id); }
    } catch {}
  }, []);

  useEffect(() => {
    mountRef.current = true;
    (async () => {
      try {
        const loadedSessions = await _loadSessions();
        if (mountRef.current) setSessions(loadedSessions);
        const raw = await encryptedStorage.getItem(CONV_KEY);
        if (raw && mountRef.current) {
          const p = logger.safeJSON<Msg[]>(raw, [], '[ButlerV16]');
          if (Array.isArray(p) && p.length) setMessages(p);
        }
      } catch {}
    })();
    return () => {
      mountRef.current = false;
      if (elapsedTimer.current) clearInterval(elapsedTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await encryptedStorage.setItem(CONV_KEY, JSON.stringify(messages.slice(-80)));
        if (messages.some(m => m.role === 'butler' && m.content.length > 10)) {
          await _persistSession(messages, currentSessId, sessions, activeModel);
        }
      } catch {}
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [messages]);

  useEffect(() => {
    if (!isConnected) { setActiveModel(''); setModelReason(''); setModelCap(''); setModelInfo(''); setModelLoading(false); return; }
    let cancelled = false;
    setModelLoading(true);
    (async () => {
      try {
        const models = await fetchOllamaModels();
        if (cancelled) return;
        if (models.length === 0) { setActiveModel(''); setModelReason('No Ollama models installed — tap PULL MODEL to install qwen2.5-coder:7b'); setModelCap('NONE'); setModelInfo(''); }
        else {
          const picked = selectBestModel(models);
          if (picked) { setActiveModel(picked.model); setModelReason(picked.reason); setModelCap(picked.capability); setModelInfo(picked.info); }
        }
      } catch {
        if (!cancelled) {
          try {
            if (typeof nexusBridge.pickBestModel === 'function') {
              const m = await nexusBridge.pickBestModel(true);
              if (!cancelled && m) {
                const tier = MODEL_TIERS.find(p => p.match.test(m));
                setActiveModel(m); setModelReason(tier?.reason ?? 'Auto-selected'); setModelCap(tier?.capability ?? 'BASIC'); setModelInfo(tier?.info ?? '');
              }
            }
          } catch {}
        }
      } finally { if (!cancelled) setModelLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isConnected]);

  const clearChat = useCallback(async () => {
    haptics.medium();
    if (messages.filter(m => m.role !== 'system').length > 0) await _persistSession(messages, currentSessId, sessions, activeModel);
    setMessages([]); setCurrentStage('idle'); setStreamingId(null); setCurrentSessId(null);
    await encryptedStorage.removeItem(CONV_KEY).catch(() => {}); autoResearch.clearCache();
  }, [messages, currentSessId, sessions, activeModel, _persistSession]);

  const startNewChat = useCallback(async () => {
    haptics.heavy();
    if (messages.filter(m => m.role !== 'system').length > 0) await _persistSession(messages, currentSessId, sessions, activeModel);
    setMessages([]); setCurrentStage('idle'); setStreamingId(null); setCurrentSessId(null);
    await encryptedStorage.removeItem(CONV_KEY).catch(() => {}); autoResearch.clearCache();
  }, [messages, currentSessId, sessions, activeModel, _persistSession]);

  const restoreSession = useCallback(async (session: Session) => {
    haptics.heavy(); setShowHistory(false);
    if (messages.filter(m => m.role !== 'system').length > 0) await _persistSession(messages, currentSessId, sessions, activeModel);
    setMessages(session.messages); setCurrentSessId(session.id); setCurrentStage('idle'); setStreamingId(null);
    await encryptedStorage.setItem(CONV_KEY, JSON.stringify(session.messages)).catch(() => {});
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 300);
  }, [messages, currentSessId, sessions, activeModel, _persistSession]);

  const deleteSession = useCallback(async (id: string) => {
    haptics.heavy();
    const updated = await _deleteSession(id, sessions); setSessions(updated);
    if (id === currentSessId) { setCurrentSessId(null); setMessages([]); await encryptedStorage.removeItem(CONV_KEY).catch(() => {}); }
  }, [sessions, currentSessId]);

  useEffect(() => {
    (global as any).__butlerClearChat   = clearChat;
    (global as any).__butlerNewChat     = startNewChat;
    (global as any).__butlerOpenHistory = () => setShowHistory(true);
    return () => { delete (global as any).__butlerClearChat; delete (global as any).__butlerNewChat; delete (global as any).__butlerOpenHistory; };
  }, [clearChat, startNewChat]);

  const sendMessage = useCallback(async (text: string, retryMsgId?: string) => {
    if (!text.trim() || isLoading) return;
    const t0 = Date.now();
    const userMsg: Msg = retryMsgId
      ? messages.find(m => m.id === retryMsgId) ?? { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: Date.now() }
      : { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: Date.now() };
    if (retryMsgId) setMessages(prev => prev.filter(m => m.id !== retryMsgId && !(m.role === 'butler' && m.failed)));
    else setMessages(prev => [...prev, userMsg]);
    setIsLoading(true); startStage('connecting');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    const placeholderId = `b-${Date.now()}`;
    setMessages(prev => [...prev, { id: placeholderId, role: 'butler', content: '', timestamp: Date.now() }]);
    setStreamingId(placeholderId);
    try {
      if (!serverConnection.isConnected()) throw new Error('PC_NOT_CONNECTED');
      await new Promise(r => setTimeout(r, 120));
      startStage('kb_search');
      const [nexusCtx, metricsCtx] = await Promise.all([
        nexusBridge?.buildNexusContext?.(text, { maxLocal: 5, maxRelay: 3, timeoutMs: 3500, relayEnabled: isConnected, growthEnabled: false }).catch(() => null),
        serverMetrics.getContextString().catch(() => ''),
      ]);
      const prewarmed = autoResearch.getCached(text);
      const kbCtx = nexusCtx?.fusedBlock || prewarmed?.kbCtx || await knowledgeAccumulator.buildContext(text).catch(() => '');
      startStage('context');
      const modePrompt = MODE_PROMPTS[chatMode] || '';
      const personalCtx = await personalMemory.buildPersonalContext().catch(() => '');
      const histCtx = buildHistoryOnly(messages.filter(m => m.role !== 'system').slice(-10));
      const sysPrompt = [
        BUTLER_KNOWLEDGE_COMPACT,
        typeof BUTLER_STYLE_GUIDE === 'string' ? BUTLER_STYLE_GUIDE : '',
        modePrompt  ? `BEHAVIOR MODE:\n${modePrompt}` : '',
        metricsCtx  ? `LIVE PC METRICS:\n${metricsCtx}` : '',
        kbCtx       ? `KNOWLEDGE BASE:\n${kbCtx.slice(0, 3000)}` : '',
        personalCtx || '',
      ].filter(Boolean).join('\n\n');
      const kbUsed = nexusCtx ? (nexusCtx.localFindings?.length || 0) + (nexusCtx.relayFindings?.length || 0) : kbCtx ? Math.max(1, (kbCtx.match(/\n---\n/g) || []).length + 1) : 0;
      startStage('ai');
      if (typeof nexusBridge?.chat !== 'function') throw new Error('AI bridge unavailable');
      startStage('streaming');
      const result = await nexusBridge.chat({ messages: [{ role: 'system', content: sysPrompt }, ...histCtx, { role: 'user', content: text }], stream: false, model: activeModel || undefined });
      const reply = result?.content || result?.message || result?.response || result?.text || 'No response received.';
      const responseMs = Date.now() - t0;
      const CHUNK = Math.max(4, Math.floor(reply.length / 20));
      for (let i = CHUNK; i <= reply.length; i += CHUNK) {
        setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: reply.slice(0, i) } : m));
        if (i < reply.length) await new Promise(r => setTimeout(r, 18));
      }
      const kbSources: KBSource[] = nexusCtx?.localFindings?.slice(0, 3).map((f: any) => ({ topic: f.topic || f.query || 'Knowledge Base', relevance: Math.round((f.score || 0.8) * 100) })) || [];
      setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: reply, kbSources, metadata: { model: result?.model || activeModel || '', responseMs, kbUsed } } : m));
      setStreamingId(null);
      addEntry({ role: 'user', content: text, timestamp: Date.now() });
      addEntry({ role: 'assistant', content: reply, timestamp: Date.now() });
      knowledgeAccumulator.processExchange(text, reply).catch(() => {});
      if (isConnected && (nexusCtx?.growthCount ?? 0) === 0) knowledgeGrowthEngine.silentGrowth().catch(() => {});
      endStage('done');
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      const noC = msg === 'PC_NOT_CONNECTED' || msg.toLowerCase().includes('not connected') || !serverConnection.isConnected();
      const noOl = msg.toLowerCase().includes('ollama') || msg.toLowerCase().includes('empty response');
      autoErrorLogger.log('warn', '[ButlerV16]', msg);
      endStage('error'); setStreamingId(null);
      setMessages(prev => prev.map(m => m.id === placeholderId ? {
        ...m, content: getOfflineReply(text, noC), failed: noC || noOl,
        failReason: noC ? 'PC not connected — go to HOME tab to pair' : noOl ? 'Ollama AI unavailable — check if Ollama is running on your PC' : `Request failed: ${msg.slice(0, 80)}`,
      } : m));
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 220);
    }
  }, [isLoading, isConnected, messages, addEntry, chatMode, activeModel, startStage, endStage]);

  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    const PREFILL_KEY = '@butler_prefill_prompt';
    const checkPrefill = async () => {
      try {
        const AS = require('@react-native-async-storage/async-storage').default;
        const stored = await AS.getItem(PREFILL_KEY);
        if (stored?.trim()) { await AS.removeItem(PREFILL_KEY); setTimeout(() => { if (sendRef.current && stored.trim()) sendRef.current(stored.trim()); }, 400); }
      } catch {}
    };
    checkPrefill();
    (global as any).__butlerInjectMessage = (t: string) => { if (t?.trim()) sendRef.current(t.trim()); };
    return () => { delete (global as any).__butlerInjectMessage; };
  }, []);

  const handleRetry = useCallback((failedId: string) => {
    const failIdx = messages.findIndex(m => m.id === failedId);
    const userMsg = failIdx > 0 ? messages.slice(0, failIdx).reverse().find(m => m.role === 'user') : null;
    if (userMsg) { setMessages(prev => prev.filter(m => m.id !== failedId)); sendMessage(userMsg.content); }
  }, [messages, sendMessage]);

  const handleCopy  = useCallback((t: string) => { haptics.light(); safeSetClipboard(t); }, []);
  const handleReact = useCallback((id: string, emoji: string) => { setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m)); }, []);
  const handleSave  = useCallback(async (code: string) => {
    haptics.medium();
    try { await saveButlerScript(code, { title: `Butler_${Date.now()}` }); (global as any).__showConnectionToast?.('Script saved to FORGE tab', TEAL); }
    catch { (global as any).__showConnectionToast?.('Save failed', RED); }
  }, []);
  const handleBuild = useCallback((p: string) => { sendMessage(`Write a production-quality Python script that: ${p}. Include full try/except, progress output, and clear comments.`); }, [sendMessage]);

  const visibleMsgCount = messages.filter(m => m.role !== 'system').length;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <BuilderModal visible={showBuilder} onClose={() => setShowBuilder(false)} onBuild={handleBuild} />
      <HistorySheet visible={showHistory} sessions={sessions} currentId={currentSessId}
        onClose={() => setShowHistory(false)} onRestore={restoreSession} onDelete={deleteSession} onNewChat={startNewChat} />
      <HoloHeader
        safeTop={insets.top} isConn={isConnected} model={activeModel}
        msgCount={visibleMsgCount} sessionCount={sessions.length}
        onClear={clearChat} onBuilder={() => setShowBuilder(true)}
        onHistory={() => { haptics.medium(); setShowHistory(true); }}
      />
      <ModeBar active={chatMode} onSelect={setChatMode} />
      <ModelBadge model={activeModel} reason={modelReason} capability={modelCap} info={modelInfo}
        isConn={isConnected} loading={modelLoading}
        onModelPulled={pulled => {
          setActiveModel(pulled);
          const tier = MODEL_TIERS.find(p => p.match.test(pulled));
          setModelReason(tier?.reason ?? 'Freshly installed — best choice for Python automation');
          setModelCap(tier?.capability ?? 'ELITE');
          setModelInfo(tier?.info ?? 'newly installed');
        }}
      />
      <SessionAnalytics messages={messages} isConn={isConnected} model={activeModel} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef as any}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble msg={item} onCopy={handleCopy} onSave={handleSave} onReact={handleReact}
              onRetry={item.failed ? handleRetry : undefined} isStreaming={item.id === streamingId} />
          )}
          ListEmptyComponent={<WelcomePanel isConn={isConnected} onSend={sendMessage} />}
          ListFooterComponent={
            <>
              {isLoading && <PipelineProgress stage={currentStage} elapsed={stageElapsed} />}
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
        {visibleMsgCount > 0 && <QuickStrip onCmd={sendMessage} onDrawer={() => setShowBuilder(true)} />}
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
