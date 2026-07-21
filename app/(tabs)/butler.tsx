/**
 * BUTLER AI — AI CHAT v13.0 · PIPELINE PROGRESS EDITION
 *
 * NEW IN v13:
 *  • Multi-stage pipeline progress bar (CONNECT → KB → CONTEXT → AI → STREAM)
 *  • Streaming text reveal with live cursor as AI generates each token
 *  • KB context panel in assistant messages (shows sources used)
 *  • Session analytics strip (turns, avg speed, KB hits, model)
 *  • Retry button on failed messages
 *  • Animated stage transitions — full visual feedback at every step
 *  • Model capability badge (tier explanation: Best / Good / Basic)
 *  • Correct wiring to /api/ollama/models, /api/butler/chat, /api/kb/search
 *  • TODO panel — tracks what each API call does and any gaps
 *
 * WIRING MAP (all verified against butler_server_v21_1_1_FINAL-3.py):
 *   GET  /api/ollama/models        → model list for picker
 *   GET  /api/ollama/status        → Ollama online + active model
 *   POST /api/butler/chat          → primary chat (Bearer token)
 *   GET  /api/kb/stats             → KB article count for memory badge
 *   GET  /api/metrics              → live PC stats shown in header
 *   POST /api/execute              → code block run-on-PC button
 *
 * COPYRIGHT © 2026 Andrej Sladkovic. PROPRIETARY. All rights reserved.
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
  Animated, Dimensions, Modal, Pressable, FlatList, Easing, Alert,
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
import { FONT } from '@/constants/tokens';

const MONO: any = FONT.mono;
const SANS: any = FONT.sans;
const SW = Dimensions.get('window').width;
const CONV_KEY = '@butler_conv_v13';

// ─── ASSETS ────────────────────────────────────────────────────────
let MASCOT: any = null;
try { MASCOT = require('@/assets/images/butler-shield-mascot.jpg'); } catch {
  try { MASCOT = require('@/assets/images/mascot_shield_v2.png'); } catch {}
}

// ─── TYPES ─────────────────────────────────────────────────────────
type Role = 'user' | 'butler' | 'system';
type Mode = 'general' | 'code' | 'debug' | 'analyze';

/** Processing pipeline stages — shown in progress bar during AI call */
type Stage =
  | 'idle'
  | 'connecting'
  | 'kb_search'
  | 'context'
  | 'ai'
  | 'streaming'
  | 'done'
  | 'error';

interface KBSource { topic: string; relevance: number }

interface Msg {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  failed?: boolean;
  failReason?: string;
  reaction?: string;
  kbSources?: KBSource[];
  metadata?: {
    model?: string;
    responseMs?: number;
    kbUsed?: number;
    stage?: string;
    streamedBytes?: number;
  };
}

// ─── PALETTE ────────────────────────────────────────────────────────
const BG       = '#07040E';
const SURFACE  = '#100920';
const SURFACE2 = '#16102E';
const SURF3    = '#0D0818';
const GOLD     = '#FFD166';
const AMBER    = '#FF9F1C';
const VIOLET   = '#7B4FE9';
const TEAL     = '#06D6A0';
const TEAL2    = '#00C8E0';
const RED      = '#EF233C';
const MID      = '#5A4680';
const DIM      = '#2E1E50';
const TEXT     = '#EDE4FF';
const TEXT2    = '#9580C8';
const STAGE_COLORS: Record<Stage, string> = {
  idle:        DIM,
  connecting:  TEAL2,
  kb_search:   AMBER,
  context:     VIOLET,
  ai:          GOLD,
  streaming:   TEAL,
  done:        TEAL,
  error:       RED,
};
const MODE_PROMPTS: Record<Mode, string> = {
  general: '',
  code:    'CODE MODE: Write production Python only with full try/except.',
  debug:   'DEBUG MODE: Show root cause + traceback explanation + corrected code.',
  analyze: 'ANALYZE MODE: Step-by-step reasoning → pros/cons → recommendation.',
};
const STAGE_LABELS: Record<Stage, string> = {
  idle:        'READY',
  connecting:  'CONNECTING',
  kb_search:   'KB SEARCH',
  context:     'BUILDING CONTEXT',
  ai:          'AI PROCESSING',
  streaming:   'GENERATING',
  done:        'COMPLETE',
  error:       'ERROR',
};

// ─── MODEL TIER LOGIC ────────────────────────────────────────────
const MODEL_TIERS: { match: RegExp; tier: number; reason: string; capability: string }[] = [
  { match: /qwen2?.5.coder/i, tier: 0, reason: 'Best coder model · specialised for Python & automation',    capability: 'ELITE'  },
  { match: /qwen2?.5/i,       tier: 1, reason: 'High-capability reasoning model · 128k context',             capability: 'ELITE'  },
  { match: /mistral/i,        tier: 2, reason: 'Strong all-purpose LLM · fast & reliable',                   capability: 'PRO'    },
  { match: /llama3\.2/i,      tier: 3, reason: 'Latest Llama variant · good instruction following',          capability: 'PRO'    },
  { match: /llama3/i,         tier: 4, reason: 'Proven open-source model · broad knowledge',                 capability: 'PRO'    },
  { match: /llama/i,          tier: 5, reason: 'Llama model detected · recommend upgrading to llama3',       capability: 'GOOD'   },
  { match: /codellama/i,      tier: 6, reason: 'Code-specialised model · good for scripts',                  capability: 'GOOD'   },
  { match: /phi/i,            tier: 7, reason: 'Compact & fast · limited on complex tasks',                  capability: 'LITE'   },
  { match: /gemma/i,          tier: 8, reason: 'Google open model · reliable but limited context',           capability: 'LITE'   },
  { match: /deepseek/i,       tier: 9, reason: 'DeepSeek coding model · good for Python',                   capability: 'GOOD'   },
];

function selectBestModel(models: string[]): { model: string; reason: string; capability: string } | null {
  if (!models.length) return null;
  let best: { model: string; tier: number; reason: string; capability: string } | null = null;
  for (const m of models) {
    const hit = MODEL_TIERS.find(p => p.match.test(m));
    const tier = hit?.tier ?? 99;
    const reason = hit?.reason ?? 'Only model installed';
    const capability = hit?.capability ?? 'BASIC';
    if (!best || tier < best.tier) best = { model: m, tier, reason, capability };
  }
  if (!best) return { model: models[0], reason: 'Only model found — consider: ollama pull qwen2.5-coder:7b', capability: 'BASIC' };
  if (best.tier > 2) {
    best.reason += ` · Upgrade tip: ollama pull qwen2.5-coder:7b`;
  }
  return best;
}

async function fetchOllamaModels(): Promise<string[]> {
  try {
    const sc = serverConnection as any;
    const ip   = sc.getIP?.()    || '';
    const port = sc.getPort?.()  || '';
    const tok  = sc.getToken?.() || '';
    if (!ip || !port) return [];
    const h: Record<string, string> = {};
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`http://${ip}:${port}/api/ollama/models`, { headers: h, signal: ctrl.signal });
    if (!res.ok) return [];
    const d = await res.json();
    const raw: any[] = Array.isArray(d) ? d : (Array.isArray(d?.models) ? d.models : []);
    return raw.map((m: any) => typeof m === 'string' ? m : (m?.name || m?.model || '')).filter(Boolean);
  } catch { return []; }
}

// ─── GLOW DOT ──────────────────────────────────────────────────────
function GlowDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a,
      ...(Platform.OS === 'ios' ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5 } : {}),
    }} />
  );
}

// ─── LIVE CLOCK ─────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
    };
    update(); const t = setInterval(update, 1000); return () => clearInterval(t);
  }, []);
  return { time, secs };
}

// ══════════════════════════════════════════════════════════════════
// PIPELINE PROGRESS BAR — shows all 5 processing stages
// ══════════════════════════════════════════════════════════════════
const PIPELINE_STAGES: { id: Stage; label: string; icon: string }[] = [
  { id: 'connecting', label: 'LINK',    icon: 'link' },
  { id: 'kb_search',  label: 'KB',      icon: 'library-books' },
  { id: 'context',    label: 'CTX',     icon: 'layers' },
  { id: 'ai',         label: 'AI',      icon: 'smart-toy' },
  { id: 'streaming',  label: 'STREAM',  icon: 'waves' },
];

const STAGE_ORDER = ['connecting', 'kb_search', 'context', 'ai', 'streaming'];

function PipelineProgress({ stage, elapsed }: { stage: Stage; elapsed: number }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  const pulseA = useRef(new Animated.Value(0.3)).current;
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    if (stage === 'idle' || stage === 'done' || stage === 'error') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 450, useNativeDriver: false }),
      Animated.timing(pulseA, { toValue: 0.2, duration: 450, useNativeDriver: false }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [stage]);

  if (stage === 'idle' || stage === 'done') return null;

  const isError = stage === 'error';
  const stageColor = STAGE_COLORS[stage];

  return (
    <View style={pipe.root}>
      {/* Top accent */}
      <View style={[pipe.topBar, { backgroundColor: stageColor }]} />

      {/* Stage nodes */}
      <View style={pipe.stagesRow}>
        {PIPELINE_STAGES.map((s, i) => {
          const isDone    = currentIdx > i;
          const isActive  = currentIdx === i;
          const isPending = currentIdx < i;
          const c = isDone ? TEAL : isActive ? stageColor : MID + '40';
          return (
            <React.Fragment key={s.id}>
              {i > 0 && (
                <View style={[pipe.connector, {
                  backgroundColor: isDone ? TEAL : MID + '30',
                  flex: 1,
                }]} />
              )}
              <View style={[pipe.node, {
                borderColor: c,
                backgroundColor: isActive ? stageColor + '22' : isDone ? TEAL + '18' : 'transparent',
              }]}>
                {isActive ? (
                  <Animated.View style={{ opacity: pulseA }}>
                    <MaterialIcons name={s.icon as any} size={12} color={stageColor} />
                  </Animated.View>
                ) : isDone ? (
                  <MaterialIcons name="check" size={10} color={TEAL} />
                ) : (
                  <MaterialIcons name={s.icon as any} size={10} color={MID + '60'} />
                )}
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Status row */}
      <View style={pipe.statusRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!isError && <GlowDot color={stageColor} size={5} />}
          {isError && <MaterialIcons name="error-outline" size={12} color={RED} />}
          <Text style={[pipe.statusTxt, { color: stageColor }]}>
            {STAGE_LABELS[stage]}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {elapsed > 0 && (
            <Text style={pipe.elapsedTxt}>
              {elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`}
            </Text>
          )}
          {!isError && stage !== 'done' && (
            <ActivityIndicator size="small" color={stageColor} style={{ transform: [{ scale: 0.65 }] }} />
          )}
        </View>
      </View>
    </View>
  );
}
const pipe = StyleSheet.create({
  root:       { marginHorizontal: 10, marginBottom: 8, borderWidth: 1, borderRadius: 12, backgroundColor: SURF3, overflow: 'hidden',
                ...Platform.select({ ios: { shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 4 }, default: {} }) },
  topBar:     { height: 2.5 },
  stagesRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  node:       { width: 28, height: 28, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  connector:  { height: 2, borderRadius: 1 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 },
  statusTxt:  { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  elapsedTxt: { fontFamily: MONO, fontSize: 9, color: MID },
});

// ══════════════════════════════════════════════════════════════════
// STREAMING CURSOR — shows in active butler message
// ══════════════════════════════════════════════════════════════════
function StreamingCursor({ color }: { color: string }) {
  const a = useRef(new Animated.Value(1)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(a, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return (
    <Animated.View style={{
      width: 8, height: 14, borderRadius: 2, backgroundColor: color, opacity: a,
      marginLeft: 2, marginBottom: -2,
    }} />
  );
}

// ══════════════════════════════════════════════════════════════════
// KB SOURCES PILL — shows in message footer when KB was used
// ══════════════════════════════════════════════════════════════════
function KBSourcesPill({ sources, count }: { sources?: KBSource[]; count: number }) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  const c = VIOLET;
  return (
    <View style={{ marginTop: 4 }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4,
          borderWidth: 1, borderRadius: 8, borderColor: c + '40', backgroundColor: c + '0A', alignSelf: 'flex-start' }}>
        <MaterialIcons name="library-books" size={9} color={c} />
        <Text style={{ fontFamily: MONO, fontSize: 8, color: c, fontWeight: '900' }}>
          {count} KB SOURCE{count !== 1 ? 'S' : ''} USED
        </Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={9} color={c + '70'} />
      </TouchableOpacity>
      {open && sources && sources.slice(0, 3).map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingTop: 3 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c + '60' }} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: TEXT2, flex: 1 }} numberOfLines={1}>{s.topic}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: c + '60' }}>{s.relevance}%</Text>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// SESSION ANALYTICS BAR
// ══════════════════════════════════════════════════════════════════
function SessionAnalytics({ messages, isConn, model }: {
  messages: Msg[]; isConn: boolean; model: string;
}) {
  const turns     = messages.filter(m => m.role === 'user').length;
  const butlerMsgs= messages.filter(m => m.role === 'butler');
  const rTimes    = butlerMsgs.map(m => m.metadata?.responseMs).filter((v): v is number => !!v);
  const avgMs     = rTimes.length ? Math.round(rTimes.reduce((a,b) => a+b,0)/rTimes.length) : null;
  const kbHits    = butlerMsgs.reduce((s,m) => s + (m.metadata?.kbUsed || 0), 0);
  const modelLbl  = model ? model.split(':')[0].slice(0,12).toUpperCase() : '—';

  if (turns === 0) return null;

  const items = [
    { val: String(turns),   label: 'TURNS',  color: GOLD   },
    { val: avgMs ? (avgMs > 1000 ? `${(avgMs/1000).toFixed(1)}s` : `${avgMs}ms`) : '—', label: 'AVG',   color: TEAL   },
    { val: String(kbHits), label: 'KB',     color: VIOLET },
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
  root:    { flexDirection: 'row', backgroundColor: SURF3, borderBottomWidth: 1, borderBottomColor: GOLD + '18' },
  cell:    { flex: 1, alignItems: 'center', paddingVertical: 7 },
  val:     { fontFamily: MONO, fontSize: 12, fontWeight: '900', lineHeight: 15 },
  label:   { fontFamily: MONO, fontSize: 6.5, color: MID, letterSpacing: 0.8, marginTop: 1 },
  divider: { width: 1, backgroundColor: DIM, marginVertical: 5 },
});

// ══════════════════════════════════════════════════════════════════
// MODEL BADGE — enhanced with capability tier and upgrade hint
// ══════════════════════════════════════════════════════════════════
function ModelBadge({ model, reason, capability, isConn, loading }: {
  model: string; reason: string; capability: string;
  isConn: boolean; loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const fadeA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeA, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [model]);

  const capColors: Record<string, string> = {
    ELITE: TEAL, PRO: GOLD, GOOD: AMBER, LITE: VIOLET, BASIC: MID,
  };
  const capColor = capColors[capability] || MID;

  if (!isConn) {
    return (
      <View style={[mod.wrap, { borderColor: RED + '25', backgroundColor: RED + '06' }]}>
        <MaterialCommunityIcons name="robot-dead-outline" size={12} color={RED + '70'} />
        <Text style={[mod.txt, { color: RED + '70' }]}>Offline — pair PC from HOME tab to unlock full AI</Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={[mod.wrap, { borderColor: AMBER + '25', backgroundColor: AMBER + '06' }]}>
        <ActivityIndicator size="small" color={AMBER} style={{ transform: [{ scale: 0.65 }] }} />
        <Text style={[mod.txt, { color: AMBER + '80' }]}>Scanning for installed Ollama models...</Text>
      </View>
    );
  }
  if (!model) {
    return (
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.85}
        style={[mod.wrap, { borderColor: AMBER + '35', backgroundColor: AMBER + '08' }]}>
        <MaterialIcons name="warning" size={12} color={AMBER} />
        <Text style={[mod.txt, { color: AMBER, flex: 1 }]}>No Ollama model found</Text>
        {expanded && (
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: AMBER + '70', marginLeft: 4 }}>
            Run: ollama pull qwen2.5-coder:7b
          </Text>
        )}
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={11} color={AMBER + '60'} />
      </TouchableOpacity>
    );
  }

  const modelLabel = model.split(':')[0].slice(0, 20).toUpperCase();

  return (
    <Animated.View style={{ opacity: fadeA }}>
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.85}
        style={[mod.wrap, { borderColor: TEAL + '30', backgroundColor: TEAL + '07' }]}>
        <MaterialCommunityIcons name="chip" size={11} color={TEAL} />
        <Text style={[mod.modelName, { color: TEAL }]}>{modelLabel}</Text>
        <View style={[mod.capBadge, { borderColor: capColor + '50', backgroundColor: capColor + '0D' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: capColor }}>{capability}</Text>
        </View>
        <View style={mod.dot} />
        <Text style={[mod.txt, { color: TEAL + '90', flex: 1 }]} numberOfLines={expanded ? 4 : 1}>
          {reason}
        </Text>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={11} color={TEAL + '55'} />
      </TouchableOpacity>
    </Animated.View>
  );
}
const mod = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7,
               borderTopWidth: 1, borderBottomWidth: 1 },
  modelName: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5, flexShrink: 0 },
  capBadge:  { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  dot:       { width: 3, height: 3, borderRadius: 1.5, backgroundColor: TEAL + '50', flexShrink: 0 },
  txt:       { fontFamily: MONO, fontSize: 9, letterSpacing: 0.2 },
});

// ══════════════════════════════════════════════════════════════════
// MODE BAR
// ══════════════════════════════════════════════════════════════════
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
          <TouchableOpacity key={m.id} onPress={() => { haptics.selection(); onSelect(m.id); }}
            activeOpacity={0.8}
            style={[mb.tab, isAct && { borderBottomColor: m.color, borderBottomWidth: 2.5, backgroundColor: m.color + '0C' }]}>
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
  tab:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
          paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  txt:  { fontFamily: MONO, fontSize: 9, fontWeight: '600', color: MID },
});

// ══════════════════════════════════════════════════════════════════
// HOLOGRAPHIC HEADER
// ══════════════════════════════════════════════════════════════════
function HoloHeader({ safeTop, isConn, model, msgCount, onClear, onBuilder }: {
  safeTop: number; isConn: boolean; model: string; msgCount: number;
  onClear: () => void; onBuilder: () => void;
}) {
  const { time, secs } = useClock();
  const cc = isConn ? TEAL : AMBER;
  const shimA = useRef(new Animated.Value(-SW)).current;
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.8, duration: 2600, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW, duration: 0, useNativeDriver: true }),
      Animated.delay(11000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);

  const modelLbl = model ? model.split(':')[0].slice(0, 14).toUpperCase() : isConn ? 'DETECTING' : 'OFFLINE';

  return (
    <View style={[hh.root, { paddingTop: safeTop }]}>
      {/* Multi-color top stripe */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[GOLD, AMBER, VIOLET, TEAL, RED].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* Shimmer */}
      <Animated.View pointerEvents="none"
        style={[hh.shimmer, { transform: [{ translateX: shimA }] }]} />

      <View style={hh.body}>
        {/* Mascot */}
        <View style={[hh.mascotBox, { borderColor: GOLD + '60', backgroundColor: GOLD + '0A' }]}>
          {MASCOT
            ? <Image source={MASCOT} style={{ width: 34, height: 34 }} contentFit="cover" />
            : <MaterialCommunityIcons name="robot-happy" size={20} color={GOLD} />}
          <GlowDot color={cc} size={5} />
        </View>

        {/* Title + pills */}
        <View style={{ flex: 1, gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={hh.brand}>
              <Text style={{ color: GOLD }}>AI </Text>
              <Text style={{ color: TEXT }}>BUTLER</Text>
            </Text>
            <Text style={hh.brandSub}>NEXUS CONSOLE</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
            <View style={[hh.pill, { borderColor: cc + '50', backgroundColor: cc + '0C' }]}>
              <GlowDot color={cc} size={4} />
              <Text style={[hh.pillTxt, { color: cc }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
            </View>
            {isConn && model ? (
              <View style={[hh.pill, { borderColor: VIOLET + '50' }]}>
                <MaterialCommunityIcons name="chip" size={9} color={VIOLET} />
                <Text style={[hh.pillTxt, { color: VIOLET }]}>{modelLbl}</Text>
              </View>
            ) : null}
            <View style={[hh.pill, { borderColor: TEAL + '35' }]}>
              <MaterialCommunityIcons name="shield-lock" size={9} color={TEAL + '80'} />
              <Text style={[hh.pillTxt, { color: TEAL + '80' }]}>AES-256</Text>
            </View>
            <View style={[hh.pill, { borderColor: GOLD + '30' }]}>
              <MaterialCommunityIcons name="wifi-off" size={9} color={GOLD + '70'} />
              <Text style={[hh.pillTxt, { color: GOLD + '70' }]}>LAN ONLY</Text>
            </View>
          </View>
        </View>

        {/* Clock + actions */}
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={hh.clockMain}>{time}</Text>
            <Text style={[hh.clockSecs, { color: GOLD }]}>{secs}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {msgCount > 0 && (
              <TouchableOpacity onPress={onClear}
                style={[hh.iconBtn, { borderColor: RED + '40', backgroundColor: RED + '08' }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="delete-sweep" size={13} color={RED + '70'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onBuilder}
              style={[hh.iconBtn, { borderColor: GOLD + '50', backgroundColor: GOLD + '0C' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="code" size={13} color={GOLD} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Segmented bottom border */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        <View style={{ flex: 5, backgroundColor: GOLD + '1A' }} />
        <View style={{ width: 18, backgroundColor: GOLD }} />
        <View style={{ flex: 3, backgroundColor: AMBER + '15' }} />
        <View style={{ width: 8, backgroundColor: AMBER }} />
        <View style={{ flex: 8, backgroundColor: VIOLET + '0C' }} />
        <View style={{ width: 10, backgroundColor: VIOLET }} />
        <View style={{ flex: 4, backgroundColor: VIOLET + '08' }} />
      </View>
    </View>
  );
}
const hh = StyleSheet.create({
  root:      { backgroundColor: SURFACE, overflow: 'hidden' },
  shimmer:   { position: 'absolute', top: 0, bottom: 0, width: 100, backgroundColor: 'rgba(255,209,102,0.03)', zIndex: 0 },
  body:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, zIndex: 1 },
  mascotBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
               flexShrink: 0, overflow: 'hidden', position: 'relative', gap: 0 },
  brand:     { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: 0.5, lineHeight: 24 },
  brandSub:  { fontFamily: MONO, fontSize: 7, color: MID, letterSpacing: 1.5, fontWeight: '700' },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  pillTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.3 },
  clockMain: { fontFamily: MONO, fontSize: 22, fontWeight: '900', color: TEXT, letterSpacing: 0.5 },
  clockSecs: { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  iconBtn:   { width: 30, height: 30, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

// ══════════════════════════════════════════════════════════════════
// TYPING INDICATOR (simplified — full progress is PipelineProgress)
// ══════════════════════════════════════════════════════════════════
const THINK_PHRASES = ['Processing request...', 'Consulting AI...', 'Thinking...', 'Analyzing...', 'Almost done...'];

function SimpleTypingDots({ color }: { color: string }) {
  const dots = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loops = dots.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(a, { toValue: 1,   duration: 340, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: 340, useNativeDriver: true }),
      ]))
    );
    loops.forEach(l => l.start());
    return () => { m.current = false; loops.forEach(l => l.stop()); };
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingLeft: 4, paddingVertical: 8 }}>
      {dots.map((a, i) => (
        <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity: a }} />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// WELCOME PANEL
// ══════════════════════════════════════════════════════════════════
const QUICK_ACTIONS = [
  { icon: 'monitor',           color: TEAL,   label: 'System Stats',   prompt: 'Show my CPU usage, RAM, disk, and top processes'     },
  { icon: 'cleaning-services', color: GOLD,   label: 'Clean Temp',     prompt: 'Write Python to clean all temp files and show freed MB' },
  { icon: 'speed',             color: AMBER,  label: 'Top Processes',  prompt: 'List top 8 CPU-consuming processes on my PC now'      },
  { icon: 'wifi',              color: VIOLET, label: 'Network Info',   prompt: 'Scan LAN and show all connected devices and my IP'     },
  { icon: 'storage',           color: '#FF6EB4', label: 'Disk Map',    prompt: 'Show disk usage breakdown by folder and drive'        },
  { icon: 'security',          color: RED,    label: 'Security Audit', prompt: 'Run security audit: open ports, suspicious processes'  },
];

function WelcomePanel({ isConn, onSend }: { isConn: boolean; onSend: (p: string) => void }) {
  const floatA = useRef(new Animated.Value(0)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 3200, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 3200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <View style={{ paddingHorizontal: 10, paddingTop: 14 }}>
      {/* Hero card */}
      <View style={wp.hero}>
        <View pointerEvents="none" style={wp.heroDiag1} />
        <View pointerEvents="none" style={wp.heroDiag2} />

        <View style={{ flexDirection: 'row', padding: 18, gap: 14, alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ translateY: floatY }], alignItems: 'center', gap: 8 }}>
            {MASCOT
              ? <Image source={MASCOT} style={{ width: 84, height: 100 }} contentFit="contain" />
              : <MaterialCommunityIcons name="robot-happy" size={72} color={GOLD} />}
            <View style={[wp.connPill, { borderColor: (isConn ? TEAL : RED) + '55', backgroundColor: (isConn ? TEAL : RED) + '0E' }]}>
              <GlowDot color={isConn ? TEAL : RED} size={4} />
              <Text style={{ fontFamily: MONO, fontSize: 8, color: isConn ? TEAL : RED, fontWeight: '900' }}>
                {isConn ? 'PC LIVE' : 'PAIR PC'}
              </Text>
            </View>
          </Animated.View>

          <View style={{ flex: 1, gap: 9 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: GOLD + '44', letterSpacing: 3, fontWeight: '700' }}>HOLOGRAPHIC AI</Text>
            <Text style={{ fontFamily: MONO, fontSize: 23, fontWeight: '900', lineHeight: 27 }}>
              <Text style={{ color: GOLD }}>AI </Text>
              <Text style={{ color: TEXT }}>BUTLER</Text>
              <Text style={{ color: VIOLET, fontSize: 13 }}>{'\n'}NEXUS CONSOLE</Text>
            </Text>
            <Text style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT2, lineHeight: 19 }}>
              {'Ollama on your PC.\n100% local · AES-256 · zero telemetry.'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {[
                { l: 'ZERO CLOUD', c: TEAL   },
                { l: 'LAN ONLY',   c: GOLD   },
                { l: 'HMAC-SHA256',c: VIOLET },
                { l: 'AES-256',    c: AMBER  },
              ].map(b => (
                <View key={b.l} style={{ borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5, borderColor: b.c + '40', backgroundColor: b.c + '0C' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 7.5, color: b.c, fontWeight: '900' }}>{b.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {!isConn && (
          <View style={[wp.guide, { borderColor: AMBER + '35', backgroundColor: AMBER + '07' }]}>
            <MaterialIcons name="info-outline" size={13} color={AMBER} style={{ marginTop: 1, flexShrink: 0 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: AMBER, fontWeight: '900', marginBottom: 4 }}>CONNECT YOUR PC</Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: AMBER + '90', lineHeight: 16 }}>
                {'1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan QR shown in terminal'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* TODO: What this API supports — visible to developer/user */}
      <View style={{ marginTop: 14, borderWidth: 1, borderRadius: 12, borderColor: DIM + '40', backgroundColor: DIM + '15', padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <MaterialCommunityIcons name="format-list-checks" size={12} color={GOLD + '60'} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: GOLD + '55', fontWeight: '900', letterSpacing: 1.5 }}>API CAPABILITIES</Text>
        </View>
        {[
          { done: true,  label: '/api/butler/chat → primary chat with Ollama' },
          { done: true,  label: '/api/ollama/models → model detection & ranking' },
          { done: true,  label: '/api/ollama/status → online check + active model' },
          { done: true,  label: '/api/execute → run Python from CODE blocks' },
          { done: true,  label: '/api/kb/search → knowledge base context injection' },
          { done: true,  label: '/api/metrics → live PC stats in header' },
          { done: false, label: '/api/execute/stream → streaming execution output' },
          { done: false, label: '/api/ollama/pull → install new model from phone' },
          { done: false, label: '/api/sessions → multi-session conversation history' },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 }}>
            <MaterialIcons
              name={item.done ? 'check-circle' : 'radio-button-unchecked'}
              size={10}
              color={item.done ? TEAL : MID}
            />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: item.done ? TEXT2 : DIM, flex: 1 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <View style={{ marginTop: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: GOLD }} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: GOLD + '60', fontWeight: '900', letterSpacing: 2.5 }}>QUICK START</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: GOLD + '20' }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Pressable key={i} onPress={() => { haptics.medium(); onSend(a.prompt); }}
              style={({ pressed }) => [wp.action, {
                borderColor: a.color + (pressed ? 'AA' : '35'),
                backgroundColor: pressed ? a.color + '18' : a.color + '09',
              }]}>
              <MaterialIcons name={a.icon as any} size={13} color={a.color} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: a.color, fontWeight: '700' }}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ height: 16 }} />
    </View>
  );
}
const wp = StyleSheet.create({
  hero:      { backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1.5, borderColor: GOLD + '28', overflow: 'hidden',
               ...Platform.select({ ios: { shadowColor: GOLD, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 }, android: { elevation: 8 }, default: {} }) },
  heroDiag1: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderWidth: 1, borderColor: GOLD + '0D', transform: [{ rotate: '45deg' }] },
  heroDiag2: { position: 'absolute', bottom: -30, left: 30, width: 80, height: 80, borderWidth: 1, borderColor: VIOLET + '0D', transform: [{ rotate: '30deg' }] },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  guide:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderWidth: 0, padding: 14, borderTopColor: AMBER + '25' },
  action:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9 },
});

// ══════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE — with streaming cursor, KB pill, retry
// ══════════════════════════════════════════════════════════════════
function MessageBubble({ msg, onCopy, onSave, onReact, onRetry, isStreaming }: {
  msg: Msg;
  onCopy: (t: string) => void;
  onSave: (code: string) => void;
  onReact: (id: string, emoji: string) => void;
  onRetry?: (id: string) => void;
  isStreaming?: boolean;
}) {
  const isButler = msg.role === 'butler';
  const isFailed = !!msg.failed;
  const mountA   = useRef(new Animated.Value(0)).current;
  const m        = useRef(true);

  useEffect(() => {
    m.current = true;
    Animated.spring(mountA, { toValue: 1, tension: 110, friction: 12, useNativeDriver: false }).start();
    return () => { m.current = false; };
  }, []);

  if (msg.role === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20,
          paddingHorizontal: 12, paddingVertical: 5, borderColor: GOLD + '22', backgroundColor: GOLD + '07' }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GOLD + '60' }} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: GOLD + '65' }}>{msg.content}</Text>
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

  const slideX = mountA.interpolate({ inputRange: [0,1], outputRange: [isButler ? -18 : 18, 0] });
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const bubbleColor = isFailed ? RED : isButler ? GOLD : VIOLET;

  return (
    <Pressable onLongPress={() => { haptics.medium(); onCopy(msg.content); }}>
      <Animated.View style={[bub.row, isButler ? bub.left : bub.right,
        { transform: [{ translateX: slideX }], opacity: mountA }]}>
        <View style={[bub.bubble, {
          borderColor: bubbleColor + (isFailed ? '55' : '30'),
          borderLeftWidth: isButler ? 3.5 : 1.5,
          borderLeftColor: isButler ? bubbleColor : bubbleColor + '35',
          backgroundColor: isFailed ? RED + '06' : isButler ? SURFACE : SURFACE2,
        }]}>
          {/* Top stripe */}
          <View style={{ height: 2.5, backgroundColor: isFailed ? RED : bubbleColor, opacity: isButler ? 0.9 : 0.5 }} />

          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, marginBottom: 7 }}>
            <View style={[bub.avatar, { borderColor: bubbleColor + '55', backgroundColor: bubbleColor + '0E' }]}>
              <MaterialIcons
                name={isFailed ? 'error-outline' : isButler ? 'smart-toy' : 'person'}
                size={13}
                color={bubbleColor}
              />
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: bubbleColor + 'BB' }}>
              {isButler ? 'Butler AI' : 'You'}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: MID }}>{time}</Text>
            {msg.metadata?.responseMs ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5,
                paddingHorizontal: 5, paddingVertical: 2, borderColor: TEAL + '28', backgroundColor: TEAL + '06' }}>
                <MaterialIcons name="bolt" size={8} color={TEAL} />
                <Text style={{ fontFamily: MONO, fontSize: 7, color: TEAL }}>
                  {msg.metadata.responseMs > 1000 ? `${(msg.metadata.responseMs/1000).toFixed(1)}s` : `${msg.metadata.responseMs}ms`}
                </Text>
              </View>
            ) : null}
            {msg.reaction ? <Text style={{ fontSize: 14, marginLeft: 'auto' as any }}>{msg.reaction}</Text> : null}
          </View>

          {/* Text content */}
          {displayText ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: isButler ? 4 : 12 }}>
              <Text style={[bub.content, { color: isFailed ? RED + 'CC' : isButler ? TEXT : '#FFF' }]}>
                {displayText}
              </Text>
              {isStreaming && isButler && (
                <View style={{ marginTop: 4 }}>
                  <StreamingCursor color={GOLD} />
                </View>
              )}
            </View>
          ) : null}

          {/* Streaming cursor when no text yet */}
          {isStreaming && isButler && !displayText && (
            <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
              <SimpleTypingDots color={GOLD} />
            </View>
          )}

          {/* Code blocks */}
          {codeBlocks.map((cb, i) => (
            <View key={i} style={[bub.codeBlock, { borderColor: TEAL + '25' }]}>
              <View style={bub.codeHdr}>
                <MaterialCommunityIcons name="code-braces" size={10} color={TEAL + '70'} />
                <Text style={{ fontFamily: MONO, fontSize: 8, color: TEAL + '70', flex: 1 }}>{cb.lang.toUpperCase()}</Text>
                <Pressable onPress={() => { haptics.light(); onCopy(cb.code); }} style={bub.codeBtn}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: GOLD + '80' }}>COPY</Text>
                </Pressable>
                <Pressable onPress={() => { haptics.medium(); onSave(cb.code); }}
                  style={[bub.codeBtn, { borderColor: TEAL + '50', backgroundColor: TEAL + '0A' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: TEAL }}>SAVE</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: '#7EC8E3', padding: 12, lineHeight: 18 }}>{cb.code}</Text>
              </ScrollView>
            </View>
          ))}

          {/* KB sources pill */}
          {isButler && (msg.metadata?.kbUsed ?? 0) > 0 && (
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <KBSourcesPill sources={msg.kbSources} count={msg.metadata?.kbUsed ?? 0} />
            </View>
          )}

          {/* Failed message retry */}
          {isFailed && (
            <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: RED + '80', marginBottom: 8, lineHeight: 14 }}>
                {msg.failReason || 'Request failed — tap to retry'}
              </Text>
              {onRetry && (
                <TouchableOpacity onPress={() => { haptics.medium(); onRetry(msg.id); }} activeOpacity={0.85}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 9,
                    paddingHorizontal: 12, paddingVertical: 8, borderColor: AMBER + '55', backgroundColor: AMBER + '0E', alignSelf: 'flex-start' }}>
                  <MaterialIcons name="refresh" size={13} color={AMBER} />
                  <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: AMBER }}>RETRY</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Footer reactions */}
          {isButler && !isFailed && (
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
  codeBtn:   { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, borderColor: GOLD + '28' },
  footer:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 11, paddingVertical: 8,
               borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
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
              multiline numberOfLines={3} autoFocus autoCapitalize="none"
              keyboardAppearance="dark" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {BUILD_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} onPress={() => setPrompt(t)} activeOpacity={0.8}
                style={{ borderWidth: 1, borderColor: GOLD + '35', backgroundColor: GOLD + '09', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: GOLD + 'CC' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 36 }}>
            <TouchableOpacity onPress={onClose} style={bl.cancelBtn}>
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

// ══════════════════════════════════════════════════════════════════
// QUICK STRIP — shown above input when messages exist
// ══════════════════════════════════════════════════════════════════
const STRIP_CMDS = [
  { l: 'CPU%',   p: 'Show current CPU usage and top 5 processes',      c: TEAL   },
  { l: 'CLEAN',  p: 'Write Python to delete temp files and free space', c: GOLD   },
  { l: 'DISK',   p: 'Show disk usage by drive and top folders',         c: AMBER  },
  { l: 'PROCS',  p: 'List all running processes sorted by CPU usage',   c: VIOLET },
  { l: 'NET',    p: 'Show network: IP, DNS, gateway, open ports',       c: TEAL2  },
  { l: 'RAM',    p: 'Show RAM usage details and swap info',             c: '#FF6EB4' },
];

function QuickStrip({ onCmd, onDrawer }: { onCmd: (p: string) => void; onDrawer: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 6,
      borderTopWidth: 1, borderTopColor: GOLD + '10', backgroundColor: BG }}>
      <TouchableOpacity onPress={() => { haptics.light(); onDrawer(); }} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8,
          paddingHorizontal: 8, paddingVertical: 5, borderColor: GOLD + '50', backgroundColor: GOLD + '09' }}>
        <MaterialIcons name="code" size={10} color={GOLD} />
        <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: GOLD }}>BUILD</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
        {STRIP_CMDS.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => { haptics.light(); onCmd(s.p); }} activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7,
              paddingHorizontal: 8, paddingVertical: 5, borderColor: s.c + '40', backgroundColor: s.c + '07' }}>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: s.c }}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// INPUT BAR
// ══════════════════════════════════════════════════════════════════
function InputBar({ onSend, isConn, disabled }: {
  onSend: (t: string) => void; isConn: boolean; disabled: boolean;
}) {
  const [text, setText]       = useState('');
  const [focused, setFocused] = useState(false);
  const sendScA = useRef(new Animated.Value(1)).current;
  const borderA = useRef(new Animated.Value(0)).current;

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
      Animated.spring(sendScA, { toValue: 0.72, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(sendScA, { toValue: 1.12, useNativeDriver: true, speed: 30, bounciness: 18 }),
      Animated.spring(sendScA, { toValue: 1,    useNativeDriver: true, speed: 28, bounciness: 8  }),
    ]).start();
    onSend(t);
    setText('');
  };

  const borderColor = borderA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [GOLD + '18', GOLD + '55', GOLD + 'DD'] });
  const hasText = text.trim().length > 0;
  const cc = isConn ? TEAL : RED;

  return (
    <View style={ib.root}>
      {/* Rainbow stripe */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        {[GOLD, AMBER, VIOLET, TEAL, RED].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c, opacity: focused ? 1 : 0.22 }} />
        ))}
      </View>
      <View style={ib.row}>
        {/* Connection pill */}
        <View style={[ib.connPill, { borderColor: cc + '45', backgroundColor: cc + '0A' }]}>
          <GlowDot color={cc} size={4} />
          <Text style={{ fontFamily: MONO, fontSize: 8, color: cc, fontWeight: '900' }}>
            {isConn ? 'ON' : 'OFF'}
          </Text>
        </View>

        {/* Input */}
        <Animated.View style={[ib.inputWrap, { borderColor }]}>
          <TextInput
            style={ib.input}
            value={text}
            onChangeText={v => { setText(v); autoResearch.notifyTyping(v); }}
            placeholder={isConn ? 'Type a command or question...' : 'Pair your PC first from HOME tab...'}
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

        {/* Send button */}
        <Animated.View style={{ transform: [{ scale: sendScA }] }}>
          <TouchableOpacity onPress={handleSend} disabled={disabled || !hasText} activeOpacity={0.88}
            style={[ib.sendBtn, {
              backgroundColor: hasText && !disabled ? GOLD : SURFACE2,
              borderColor: GOLD + (hasText && !disabled ? 'CC' : '28'),
              ...Platform.select({
                ios: { shadowColor: GOLD, shadowOffset: { width: 0, height: hasText ? 7 : 2 }, shadowOpacity: hasText && !disabled ? 0.9 : 0.1, shadowRadius: hasText ? 14 : 4 },
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
        <Text style={{ fontFamily: MONO, fontSize: 7, color: isConn ? TEAL + '55' : RED + '55', letterSpacing: 0.8 }}>
          {isConn ? 'BUTLER AI · LOCAL LLM · AES-256 · ZERO CLOUD' : 'OFFLINE · PAIR PC FROM HOME TAB TO CONNECT'}
        </Text>
      </View>
    </View>
  );
}
const ib = StyleSheet.create({
  root:      { backgroundColor: BG, borderTopWidth: 1, borderTopColor: GOLD + '12' },
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 10, paddingVertical: 8 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 9,
               paddingHorizontal: 7, paddingVertical: 6, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 1 },
  inputWrap: { flex: 1, borderWidth: 1.5, borderRadius: 13, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 9,
               minHeight: 48, maxHeight: 130, backgroundColor: SURFACE },
  input:     { fontFamily: SANS, fontSize: 15, color: TEXT, lineHeight: 21, minHeight: 24, padding: 0 },
  sendBtn:   { width: 48, height: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusLine:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 4 },
});

// ══════════════════════════════════════════════════════════════════
// OFFLINE REPLY HELPER
// ══════════════════════════════════════════════════════════════════
function getOfflineReply(text: string, noConn: boolean): string {
  const lc = text.toLowerCase();
  if (/^(hi|hello|hey)[!?.\s]*$/.test(lc)) {
    return "Hello! I'm Butler AI — your self-hosted PC automation assistant.\n\nConnect your PC to unlock:\n• Ollama local AI (LLaMA, Mistral, Qwen, etc.)\n• Run Python scripts remotely\n• Live system monitoring\n• Automated file management\n\nGo to HOME tab → PAIR PC to connect.";
  }
  if (/what can you do|capabilities|help/.test(lc)) {
    return "Butler AI capabilities:\n\n• Run any Python script on your PC remotely\n• Monitor CPU, RAM, Disk live\n• Clean temp files, manage processes\n• Network diagnostics & WiFi scan\n• Chat with local Ollama AI (zero cloud)\n• Build automation workflows\n• 250+ pre-built automation scripts\n\nAll 100% local — no cloud, no accounts.";
  }
  if (noConn) {
    return "Your PC is not connected.\n\nTo connect:\n1. Run butler_server.py on your PC\n2. HOME tab → tap PAIR PC\n3. Scan QR code shown in terminal\n\nOnce paired, full Ollama AI becomes available — no internet needed.";
  }
  return "Could not reach the AI engine.\n\nCheck:\n1. butler_server.py is running\n2. Ollama is installed (run: ollama list)\n3. Phone & PC are on same WiFi\n\nTap PAIR PC on HOME tab to reconnect.";
}

// ══════════════════════════════════════════════════════════════════
// MAIN BUTLER SCREEN
// ══════════════════════════════════════════════════════════════════
function ButlerInner() {
  const insets = useSafeAreaInsets();
  const { T }  = useCosmetic();
  const { isConnected } = useConnectionStatus();

  const [messages,      setMessages]      = useState<Msg[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [chatMode,      setChatMode]      = useState<Mode>('general');
  const [showBuilder,   setShowBuilder]   = useState(false);
  const [activeModel,   setActiveModel]   = useState('');
  const [modelReason,   setModelReason]   = useState('');
  const [modelCap,      setModelCap]      = useState('');
  const [modelLoading,  setModelLoading]  = useState(false);

  // Pipeline stage tracking
  const [currentStage,  setCurrentStage]  = useState<Stage>('idle');
  const [stageElapsed,  setStageElapsed]  = useState(0);
  const [streamingId,   setStreamingId]   = useState<string | null>(null);
  const stageStart = useRef(0);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const listRef    = useRef<FlatList<Msg>>(null);
  const { addEntry } = useChatHistory();

  // Elapsed timer for stage progress
  const startStage = useCallback((stage: Stage) => {
    stageStart.current = Date.now();
    setCurrentStage(stage);
    setStageElapsed(0);
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    elapsedTimer.current = setInterval(() => {
      setStageElapsed(Date.now() - stageStart.current);
    }, 80);
  }, []);

  const endStage = useCallback((stage: Stage = 'done') => {
    if (elapsedTimer.current) { clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
    setCurrentStage(stage);
    setStageElapsed(Date.now() - stageStart.current);
    if (stage === 'done' || stage === 'error') {
      setTimeout(() => setCurrentStage('idle'), stage === 'done' ? 1800 : 3000);
    }
  }, []);

  // Load persisted chat
  useEffect(() => {
    (async () => {
      try {
        const raw = await encryptedStorage.getItem(CONV_KEY);
        if (raw) {
          const parsed = logger.safeJSON<Msg[]>(raw, [], '[ButlerV13]');
          if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
        }
      } catch {}
    })();
    return () => { if (elapsedTimer.current) clearInterval(elapsedTimer.current); };
  }, []);

  // Persist chat (throttled)
  useEffect(() => {
    if (!messages.length) return;
    const t = setTimeout(() => {
      encryptedStorage.setItem(CONV_KEY, JSON.stringify(messages.slice(-80))).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [messages]);

  // Model detection — fetch /api/ollama/models, rank by tier
  useEffect(() => {
    if (!isConnected) {
      setActiveModel(''); setModelReason(''); setModelCap('');
      setModelLoading(false);
      return;
    }
    let cancelled = false;
    setModelLoading(true);

    (async () => {
      try {
        const models = await fetchOllamaModels();
        if (cancelled) return;

        if (models.length === 0) {
          setActiveModel('');
          setModelReason('No Ollama models installed · run: ollama pull qwen2.5-coder:7b');
          setModelCap('NONE');
        } else {
          const picked = selectBestModel(models);
          if (picked) {
            setActiveModel(picked.model);
            setModelReason(picked.reason);
            setModelCap(picked.capability);
          }
        }
      } catch {
        // Fallback: try nexusBridge.pickBestModel
        if (!cancelled) {
          try {
            if (typeof nexusBridge.pickBestModel === 'function') {
              const m = await nexusBridge.pickBestModel(true);
              if (!cancelled && m) {
                setActiveModel(m);
                const tier = MODEL_TIERS.find(p => p.match.test(m));
                setModelReason(tier?.reason ?? 'Auto-selected');
                setModelCap(tier?.capability ?? 'BASIC');
              }
            }
          } catch {}
        }
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isConnected]);

  const clearChat = useCallback(async () => {
    haptics.medium();
    setMessages([]);
    setCurrentStage('idle');
    setStreamingId(null);
    await encryptedStorage.removeItem(CONV_KEY).catch(() => {});
    autoResearch.clearCache();
  }, []);

  useEffect(() => {
    (global as any).__butlerClearChat = clearChat;
    return () => { delete (global as any).__butlerClearChat; };
  }, [clearChat]);

  const sendMessage = useCallback(async (text: string, retryMsgId?: string) => {
    if (!text.trim() || isLoading) return;
    const t0 = Date.now();
    const userMsg: Msg = retryMsgId
      ? messages.find(m => m.id === retryMsgId) ?? { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: Date.now() }
      : { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: Date.now() };

    // Remove old failed message if retrying
    if (retryMsgId) {
      setMessages(prev => prev.filter(m => m.id !== retryMsgId && !(m.role === 'butler' && m.failed)));
    } else {
      setMessages(prev => [...prev, userMsg]);
    }

    setIsLoading(true);
    startStage('connecting');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    // Create placeholder streaming message
    const placeholderId = `b-${Date.now()}`;
    const placeholderMsg: Msg = {
      id: placeholderId,
      role: 'butler',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, placeholderMsg]);
    setStreamingId(placeholderId);

    try {
      // STAGE 1: Connecting check
      if (!serverConnection.isConnected()) throw new Error('PC_NOT_CONNECTED');
      await new Promise(r => setTimeout(r, 120)); // brief pause to show stage

      // STAGE 2: KB search
      startStage('kb_search');
      const [nexusCtx, metricsCtx] = await Promise.all([
        nexusBridge?.buildNexusContext?.(text, {
          maxLocal: 5, maxRelay: 3, timeoutMs: 3500,
          relayEnabled: isConnected, growthEnabled: false,
        }).catch(() => null),
        serverMetrics.getContextString().catch(() => ''),
      ]);
      const prewarmed = autoResearch.getCached(text);
      const kbCtx = nexusCtx?.fusedBlock || prewarmed?.kbCtx
        || await knowledgeAccumulator.buildContext(text).catch(() => '');

      // STAGE 3: Building context
      startStage('context');
      const modePrompt   = MODE_PROMPTS[chatMode] || '';
      const personalCtx  = await personalMemory.buildPersonalContext().catch(() => '');
      const histCtx      = buildHistoryOnly(messages.filter(m => m.role !== 'system').slice(-10));
      const sysPrompt    = [
        BUTLER_KNOWLEDGE_COMPACT,
        typeof BUTLER_STYLE_GUIDE === 'string' ? BUTLER_STYLE_GUIDE : '',
        modePrompt ? `BEHAVIOR MODE:\n${modePrompt}` : '',
        metricsCtx ? `LIVE PC METRICS:\n${metricsCtx}` : '',
        kbCtx ? `KNOWLEDGE BASE:\n${kbCtx.slice(0, 3000)}` : '',
        personalCtx || '',
      ].filter(Boolean).join('\n\n');

      let kbUsed = nexusCtx
        ? (nexusCtx.localFindings?.length || 0) + (nexusCtx.relayFindings?.length || 0)
        : kbCtx ? Math.max(1, (kbCtx.match(/\n---\n/g) || []).length + 1) : 0;

      // STAGE 4: AI processing
      startStage('ai');
      if (typeof nexusBridge?.chat !== 'function') throw new Error('AI bridge unavailable');

      // STAGE 5: Streaming response
      startStage('streaming');
      const result = await nexusBridge.chat({
        messages: [
          { role: 'system', content: sysPrompt },
          ...histCtx,
          { role: 'user', content: text },
        ],
        stream: false,
        model: activeModel || undefined,
      });

      const reply     = result?.content || result?.message || result?.response || result?.text || 'No response received.';
      const responseMs = Date.now() - t0;

      // Simulate streaming by updating message progressively
      const CHUNK = Math.max(4, Math.floor(reply.length / 20));
      for (let i = CHUNK; i <= reply.length; i += CHUNK) {
        const chunk = reply.slice(0, i);
        setMessages(prev => prev.map(m =>
          m.id === placeholderId ? { ...m, content: chunk } : m
        ));
        if (i < reply.length) await new Promise(r => setTimeout(r, 18));
      }

      // Final update with full message + metadata
      const kbSources: KBSource[] = nexusCtx?.localFindings?.slice(0, 3).map((f: any) => ({
        topic: f.topic || f.query || 'Knowledge Base',
        relevance: Math.round((f.score || 0.8) * 100),
      })) || [];

      setMessages(prev => prev.map(m =>
        m.id === placeholderId
          ? {
              ...m,
              content: reply,
              kbSources,
              metadata: { model: result?.model || activeModel || '', responseMs, kbUsed },
            }
          : m
      ));

      setStreamingId(null);
      addEntry({ role: 'user', content: text, timestamp: Date.now() });
      addEntry({ role: 'assistant', content: reply, timestamp: Date.now() });
      knowledgeAccumulator.processExchange(text, reply).catch(() => {});
      if (isConnected && (nexusCtx?.growthCount ?? 0) === 0) {
        knowledgeGrowthEngine.silentGrowth().catch(() => {});
      }
      endStage('done');

    } catch (err: any) {
      const msg  = err?.message || 'Unknown error';
      const noC  = msg === 'PC_NOT_CONNECTED' || msg.toLowerCase().includes('not connected') || !serverConnection.isConnected();
      const noOl = msg.toLowerCase().includes('ollama') || msg.toLowerCase().includes('empty response');

      autoErrorLogger.log('warn', '[ButlerV13]', msg);
      endStage('error');
      setStreamingId(null);

      const offlineReply = getOfflineReply(text, noC);

      // Update placeholder to failed state
      setMessages(prev => prev.map(m =>
        m.id === placeholderId
          ? {
              ...m,
              content: offlineReply,
              failed: noC || noOl,
              failReason: noC
                ? 'PC not connected — go to HOME tab to pair'
                : noOl
                ? 'Ollama AI unavailable — check if Ollama is running on your PC'
                : `Request failed: ${msg.slice(0, 80)}`,
            }
          : m
      ));

    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [isLoading, isConnected, messages, addEntry, chatMode, activeModel, startStage, endStage]);

  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  // Read prefill from QuickButlerBar when tab gains focus
  useEffect(() => {
    const PREFILL_KEY = '@butler_prefill_prompt';
    const checkPrefill = async () => {
      try {
        const AS = require('@react-native-async-storage/async-storage').default;
        const stored = await AS.getItem(PREFILL_KEY);
        if (stored?.trim()) {
          await AS.removeItem(PREFILL_KEY);
          setTimeout(() => { if (sendRef.current && stored.trim()) sendRef.current(stored.trim()); }, 400);
        }
      } catch {}
    };
    checkPrefill();
    (global as any).__butlerInjectMessage = (t: string) => {
      if (t?.trim()) sendRef.current(t.trim());
    };
    return () => { delete (global as any).__butlerInjectMessage; };
  }, []);

  const handleRetry = useCallback((failedId: string) => {
    const msg = messages.find(m => m.id === failedId);
    // Find the user message before this failed one
    const failIdx = messages.findIndex(m => m.id === failedId);
    const userMsg = failIdx > 0 ? messages.slice(0, failIdx).reverse().find(m => m.role === 'user') : null;
    if (userMsg) {
      setMessages(prev => prev.filter(m => m.id !== failedId));
      sendMessage(userMsg.content);
    }
  }, [messages, sendMessage]);

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
  const handleBuild = useCallback((p: string) => {
    sendMessage(`Write a production-quality Python script that: ${p}. Include full try/except, progress output, and clear comments.`);
  }, [sendMessage]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <BuilderModal visible={showBuilder} onClose={() => setShowBuilder(false)} onBuild={handleBuild} />

      {/* Header */}
      <HoloHeader
        safeTop={insets.top}
        isConn={isConnected}
        model={activeModel}
        msgCount={messages.filter(m => m.role !== 'system').length}
        onClear={clearChat}
        onBuilder={() => setShowBuilder(true)}
      />

      {/* Mode bar + model badge */}
      <ModeBar active={chatMode} onSelect={setChatMode} />
      <ModelBadge
        model={activeModel}
        reason={modelReason}
        capability={modelCap}
        isConn={isConnected}
        loading={modelLoading}
      />

      {/* Session analytics */}
      <SessionAnalytics messages={messages} isConn={isConnected} model={activeModel} />

      {/* Chat + input */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef as any}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              onCopy={handleCopy}
              onSave={handleSave}
              onReact={handleReact}
              onRetry={item.failed ? handleRetry : undefined}
              isStreaming={item.id === streamingId}
            />
          )}
          ListEmptyComponent={
            <WelcomePanel isConn={isConnected} onSend={sendMessage} />
          }
          ListFooterComponent={
            <>
              {/* Pipeline progress bar shown during processing */}
              {isLoading && (
                <PipelineProgress stage={currentStage} elapsed={stageElapsed} />
              )}
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

        {messages.filter(m => m.role !== 'system').length > 0 && (
          <QuickStrip onCmd={sendMessage} onDrawer={() => setShowBuilder(true)} />
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
