/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NEXUS COMMAND PROMPT v3.0 — TERMINAL GLASS EDITION             ║
 * ║  ©2026 Butler AI — PROPRIETARY, ALL RIGHTS RESERVED             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Sits ABOVE the dock. Never overlaps. Clean edge-to-edge strip.
 *
 * WIRE MAP:
 *   → AsyncStorage '@butler_prefill_prompt'  → butler.tsx reads on focus
 *   → global.__butlerInjectMessage(text)      → butler.tsx live inject
 *   → services/haptics.ts                     → all tap feedback
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  Keyboard, Animated, Dimensions, Pressable, ScrollView,
} from 'react-native';
import Svg, {
  Path, Circle, Line, G, Defs, LinearGradient as SvgGrad, Stop,
  Rect, Polygon,
} from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';
import { FontFamily } from '@/constants/typography';

// ── PUBLIC KEY — butler.tsx reads this ───────────────────────────
export const BUTLER_PREFILL_KEY = '@butler_prefill_prompt';

const SW   = Math.max(320, Dimensions.get('window').width);
const MONO: any = FontFamily.mono;

// ── PALETTE ───────────────────────────────────────────────────────
const C = {
  bg:       '#010A04',
  bar:      '#020F08',
  green:    '#00FF41',
  dim:      '#0D2210',
  mid:      '#1A4A1F',
  dimGreen: '#00AA2A',
  amber:    '#FFB020',
  cyan:     '#00E5FF',
  purple:   '#CC44FF',
  text:     '#C0F0C8',
  border:   'rgba(0,255,65,0.20)',
  red:      '#FF3344',
  teal:     '#00CCBB',
} as const;

// ── INTENT CLASSIFIER ─────────────────────────────────────────────
type Intent = 'ACTION' | 'QUERY' | 'SCRIPT' | 'SEARCH' | 'IDLE';

function classifyIntent(text: string): { type: Intent; score: number; color: string } {
  if (!text.trim()) return { type: 'IDLE', score: 0, color: C.dimGreen };
  const t = text.toLowerCase();
  const scoreMap: Record<string, string[]> = {
    ACTION: ['run','exec','execute','start','stop','kill','clean','clear','delete','free','restart','open','launch','reboot','shutdown'],
    SCRIPT: ['python','import','def ','for ','while ','print','psutil','os.','sys.','subprocess','automate','pip'],
    QUERY:  ['what','how','why','show','list','which','can you','help','explain','find','get','check','status','info'],
    SEARCH: ['search','find','scan','where','locate','look up'],
  };
  const counts: Record<string, number> = {};
  for (const [k, words] of Object.entries(scoreMap)) {
    counts[k] = words.filter(w => t.includes(w)).length;
  }
  const max = Math.max(...Object.values(counts));
  if (max === 0) return { type: 'IDLE', score: 28, color: C.dimGreen };
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const score = Math.min(99, Math.round((max / total) * 100));
  const winner = (Object.entries(counts).find(([, v]) => v === max)![0]) as Intent;
  const colors: Record<Intent, string> = {
    ACTION: C.cyan, SCRIPT: C.purple, QUERY: C.green, SEARCH: C.amber, IDLE: C.dimGreen,
  };
  return { type: winner, score, color: colors[winner] };
}

// ── PHONEME HAPTICS ───────────────────────────────────────────────
function phonemeHaptic(char: string) {
  if (!char || char.length !== 1) return;
  const c = char.toLowerCase();
  if ('aeiou'.includes(c)) { (haptics as any).light?.(); return; }
  if ('bcdfghjklmnpqrstvwxyz'.includes(c)) { (haptics as any).selection?.(); }
}

// ── UNIQUE GRADIENT ID COUNTER — prevents collisions when multiple instances mount ──
let _waveGradCounter = 0;

// ── ENTROPY WAVEFORM — full width ─────────────────────────────────
function entropyWave(text: string, W: number, H: number): string {
  if (!text) return `M 0 ${H / 2} L ${W} ${H / 2}`;
  const N = 20;
  const pts: [number, number][] = [];
  const midY = H / 2;
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * W;
    let y = midY;
    for (let j = 0; j < Math.min(text.length, 10); j++) {
      const code = text.charCodeAt(j);
      // Guard: skip NaN (can happen with certain Unicode chars)
      if (!Number.isFinite(code)) continue;
      const freq = ((code % 5) + 1);
      const amp  = H * 0.22 * (1 - j / text.length);
      const wave = amp * Math.sin((i / N) * Math.PI * 2 * freq + j * 0.7);
      if (Number.isFinite(wave)) y += wave;
    }
    pts.push([x, Math.max(1, Math.min(H - 1, y))]);
  }
  if (pts.length === 0) return `M 0 ${midY} L ${W} ${midY}`;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [nx, ny] = pts[i];
    const mpx = ((px + nx) / 2).toFixed(1);
    d += ` C ${mpx} ${py.toFixed(1)}, ${mpx} ${ny.toFixed(1)}, ${nx.toFixed(1)} ${ny.toFixed(1)}`;
  }
  return d;
}

function AmbientWave({ text, color }: { text: string; color: string }) {
  const W = Math.max(280, SW - 12);
  const H = 28;
  const d = useMemo(() => entropyWave(text, W, H), [text]);
  // Stable unique gradient ID per component instance — prevents SVG defs collision
  // when two instances of QuickButlerBar ever render simultaneously.
  const gradId = useRef(`qbb_wg_${++_waveGradCounter}`).current;
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGrad id={gradId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"    stopColor={color} stopOpacity="0"    />
          <Stop offset="0.3"  stopColor={color} stopOpacity="0.25" />
          <Stop offset="0.7"  stopColor={color} stopOpacity="0.18" />
          <Stop offset="1"    stopColor={color} stopOpacity="0"    />
        </SvgGrad>
      </Defs>
      <Path d={d} stroke={`url(#${gradId})`} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

// ── ROBOT SVG ICON — butler themed ───────────────────────────────
function ButlerRobotIcon({ color, size = 18, chips = false }: { color: string; size?: number; chips?: boolean }) {
  const s = size;
  const cx = s / 2, cy = s / 2 + s * 0.03;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Antenna */}
      <Line x1={cx} y1={cy - s*0.36} x2={cx} y2={cy - s*0.46} stroke={color} strokeWidth={s*0.06} strokeLinecap="round" />
      <Circle cx={cx} cy={cy - s*0.50} r={s*0.07} fill={color} />
      {chips && <Circle cx={cx} cy={cy - s*0.50} r={s*0.12} fill="none" stroke={color} strokeWidth={s*0.035} opacity={0.5} />}
      {/* Head */}
      <Rect x={cx - s*0.32} y={cy - s*0.34} width={s*0.64} height={s*0.52} rx={s*0.1} fill="none" stroke={color} strokeWidth={s*0.055} />
      {/* Visor */}
      <Rect x={cx - s*0.22} y={cy - s*0.18} width={s*0.44} height={s*0.15} rx={s*0.04} fill={color} opacity={0.8} />
      {/* Eye pupils */}
      <Rect x={cx - s*0.16} y={cy - s*0.16} width={s*0.09} height={s*0.09} rx={s*0.02} fill="#000" />
      <Rect x={cx + s*0.07} y={cy - s*0.16} width={s*0.09} height={s*0.09} rx={s*0.02} fill="#000" />
      {/* Smile */}
      <Path d={`M${cx - s*0.13} ${cy + s*0.1} Q${cx} ${cy + s*0.2} ${cx + s*0.13} ${cy + s*0.1}`}
        stroke={color} strokeWidth={s*0.05} fill="none" strokeLinecap="round" />
      {/* Ear receivers */}
      <Rect x={cx - s*0.44} y={cy - s*0.06} width={s*0.12} height={s*0.14} rx={s*0.03} fill={color} opacity={0.55} />
      <Rect x={cx + s*0.32} y={cy - s*0.06} width={s*0.12} height={s*0.14} rx={s*0.03} fill={color} opacity={0.55} />
    </Svg>
  );
}

// ── INTENT BAR ────────────────────────────────────────────────────
function IntentBar({ intent }: { intent: { type: Intent; score: number; color: string } }) {
  const pct = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pct, { toValue: intent.score / 100, tension: 160, friction: 14, useNativeDriver: false }).start();
  }, [intent.score, intent.type]);
  const barW = pct.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={ib.row}>
      <View style={[ib.badge, { borderColor: intent.color + '55', backgroundColor: intent.color + '12' }]}>
        <Text style={[ib.badgeTxt, { color: intent.color }]}>{intent.type}</Text>
      </View>
      <View style={ib.track}>
        <Animated.View style={[ib.fill, { width: barW as any, backgroundColor: intent.color }]} />
      </View>
      <Text style={[ib.score, { color: intent.color }]}>{intent.score}%</Text>
    </View>
  );
}
const ib = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badge:    { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  track:    { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 2 },
  score:    { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', width: 24, textAlign: 'right' },
});

// ── CHIP DRAWER ───────────────────────────────────────────────────
const CHIPS = [
  { icon: 'monitor', label: 'PC Health', msg: 'Show full PC health report: CPU, RAM, disk, temperature, processes' },
  { icon: 'cleaning-services', label: 'Clean', msg: 'Write Python to clean all temp files and show freed MB' },
  { icon: 'code', label: 'Script', msg: 'Write a Python script to automate: ' },
  { icon: 'wifi', label: 'LAN Scan', msg: 'Scan my local network and list all connected devices' },
  { icon: 'memory', label: 'Processes', msg: 'Show top 8 CPU-consuming processes right now' },
  { icon: 'storage', label: 'Disk Map', msg: 'Show disk usage breakdown by folder' },
  { icon: 'security', label: 'Security', msg: 'Run a security audit: open ports, firewall, vulnerabilities' },
  { icon: 'battery-charging-full', label: 'Battery', msg: 'Check battery level, health and charging status' },
  { icon: 'app-settings-alt', label: 'Startup', msg: 'List and manage all Windows startup programs' },
  { icon: 'network-check', label: 'Network', msg: 'Show my IP, DNS, gateway, and connection speed test' },
];

// ── COMMAND ECHO BADGE ────────────────────────────────────────────
function CommandEcho({ text, color, onDone }: { text: string; color: string; onDone: () => void }) {
  const [display, setDisplay] = useState(text);
  const opA = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    let eraseId: ReturnType<typeof setInterval> | null = null;
    const holdId = setTimeout(() => {
      Animated.timing(opA, { toValue: 0, duration: text.length * 16 + 100, useNativeDriver: true }).start();
      let i = text.length;
      eraseId = setInterval(() => {
        i -= 2;
        if (i <= 0) {
          if (eraseId) clearInterval(eraseId);
          if (mountedRef.current) onDone();
          return;
        }
        if (mountedRef.current) setDisplay(text.slice(0, i) + '▌');
      }, 30);
    }, 2000);
    return () => {
      mountedRef.current = false;
      clearTimeout(holdId);
      if (eraseId) clearInterval(eraseId);
    };
  }, []);
  return (
    <Animated.View style={[ce.wrap, { borderColor: color + '55', opacity: opA }]}>
      <MaterialIcons name="check-circle-outline" size={9} color={color} />
      <Text style={[ce.txt, { color }]} numberOfLines={1}>{display}</Text>
    </Animated.View>
  );
}
const ce = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.88)',
    alignSelf: 'center', marginBottom: 4, marginHorizontal: 10,
  },
  txt: { fontFamily: MONO, fontSize: 10, fontWeight: '700', maxWidth: SW - 100, letterSpacing: 0.3 },
});

// ── SEED COMPLETIONS ──────────────────────────────────────────────
const SEEDS: [string, string][] = [
  ['cpu',      'Show CPU usage and top processes'],
  ['disk',     'Show disk usage breakdown by folder'],
  ['clean',    'Clean all temp files and show freed space'],
  ['network',  'Scan LAN and list all connected devices'],
  ['ram',      'Show RAM usage and free up memory'],
  ['security', 'Run security audit and check open ports'],
  ['battery',  'Check battery level and power status'],
  ['startup',  'List all startup programs on this PC'],
  ['python',   'Write a Python script to automate: '],
  ['write',    'Write a Python script that: '],
  ['run',      'Run a script to: '],
  ['show',     'Show me the current status of: '],
  ['check',    'Check and report on: '],
  ['list',     'List all '],
  ['kill',     'Kill the process named: '],
  ['monitor',  'Monitor and alert when '],
];

function getGhost(text: string): string {
  if (!text.trim()) return '';
  const t = text.toLowerCase().trim();
  const last = t.split(' ').pop() ?? '';
  if (last.length < 2) return '';
  for (const [seed, full] of SEEDS) {
    if (seed.startsWith(last) && seed !== last) {
      return seed.slice(last.length) + ' → ' + full.slice(0, 22);
    }
  }
  return '';
}

// ── VOCAB ─────────────────────────────────────────────────────────
const VOCAB_KEY = '@qbb_vocab_v3';
let _vocab: [string, number][] = [];
let _vocabLoaded = false;
let _vocabLoading = false;  // prevents concurrent load races
async function loadVocab() {
  if (_vocabLoaded || _vocabLoading) return;
  _vocabLoading = true;
  try {
    const r = await AsyncStorage.getItem(VOCAB_KEY);
    if (r) {
      const parsed = JSON.parse(r);
      // Validate shape: must be an array of [string, number] pairs
      if (Array.isArray(parsed)) {
        _vocab = parsed.filter(
          (e): e is [string, number] =>
            Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'number'
        );
      }
    }
  } catch {
    // Corrupt storage — silently reset vocab to empty
    _vocab = [];
  } finally {
    _vocabLoaded = true;
    _vocabLoading = false;
  }
}
async function recordVocab(text: string) {
  await loadVocab();
  const words = text.toLowerCase().trim().split(/\s+/).filter(w => w.length > 3);
  // Snapshot _vocab to avoid mutation-during-iteration issues
  const snapshot = [..._vocab];
  for (const word of words) {
    const ex = snapshot.find(([k]) => k === word);
    if (ex) {
      ex[1]++;
    } else {
      snapshot.push([word, 1]);
    }
  }
  _vocab = snapshot.sort((a, b) => b[1] - a[1]).slice(0, 120);
  try {
    await AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(_vocab));
  } catch {
    // Non-critical — vocab persistence failure should never crash the bar
  }
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function QuickButlerBar() {
  const router = useRouter();

  const [text,       setText]       = useState('');
  const [focused,    setFocused]    = useState(false);
  const [showChips,  setShowChips]  = useState(false);
  const [echo,       setEcho]       = useState<string | null>(null);
  const [showIntent, setShowIntent] = useState(false);
  const [stableText, setStableText] = useState('');

  const inputRef       = useRef<TextInput>(null);
  const intentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLenRef     = useRef(0);
  const mountedRef     = useRef(true);

  const sendScA     = useRef(new Animated.Value(1)).current;
  const blinkA      = useRef(new Animated.Value(1)).current;
  const chipHeightA = useRef(new Animated.Value(0)).current;
  const barGlowA    = useRef(new Animated.Value(0)).current;

  const intent  = useMemo(() => classifyIntent(text), [text]);
  const ghost   = useMemo(() => getGhost(text), [text]);
  const intentC = intent.type !== 'IDLE' ? intent.color : C.dimGreen;
  const ready   = text.trim().length > 0;
  const sym     = intent.type === 'SCRIPT' ? '#!/' : intent.type === 'QUERY' ? '?>' : '$>';

  useEffect(() => {
    mountedRef.current = true;
    loadVocab();

    const blink = Animated.loop(Animated.sequence([
      Animated.timing(blinkA, { toValue: 0, duration: 530, useNativeDriver: true }),
      Animated.timing(blinkA, { toValue: 1, duration: 530, useNativeDriver: true }),
    ]));
    blink.start();

    return () => { mountedRef.current = false; blink.stop(); };
  }, []);

  // Glow on focus
  useEffect(() => {
    Animated.timing(barGlowA, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);

  // Intent debounce
  useEffect(() => {
    if (intentTimerRef.current) clearTimeout(intentTimerRef.current);
    if (text.length > 3) {
      intentTimerRef.current = setTimeout(() => { if (mountedRef.current) setShowIntent(true); }, 260);
    } else {
      setShowIntent(false);
    }
    return () => { if (intentTimerRef.current) clearTimeout(intentTimerRef.current); };
  }, [text]);

  // Wave update every 4 chars
  useEffect(() => {
    if (Math.abs(text.length - prevLenRef.current) >= 4 || text === '') {
      prevLenRef.current = text.length;
      setStableText(text);
    }
  }, [text]);

  const handleChange = useCallback((val: string) => {
    const added = val.slice(text.length);
    if (added.length === 1) phonemeHaptic(added);
    setText(val);
  }, [text]);

  const toggleChips = useCallback(() => {
    (haptics as any).light?.();
    const next = !showChips;
    setShowChips(next);
    if (next) Keyboard.dismiss();
    Animated.spring(chipHeightA, { toValue: next ? 1 : 0, tension: 80, friction: 11, useNativeDriver: false }).start();
  }, [showChips]);

  const acceptGhost = useCallback(() => {
    if (!ghost) return;
    const comp = ghost.split(' → ')[0].replace(/^ +/, '');
    setText(text + comp);
    (haptics as any).soft?.();
  }, [ghost, text]);

  const handleSend = useCallback(async () => {
    const prompt = text.trim();
    if (!prompt) {
      (haptics as any).medium?.();
      try { router.push('/(tabs)/butler' as any); } catch {}
      return;
    }
    (haptics as any).heavy?.();

    Animated.sequence([
      Animated.spring(sendScA, { toValue: 0.72, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(sendScA, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 18 }),
    ]).start();

    recordVocab(prompt);

    try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, prompt); } catch {}
    try { (global as any).__butlerInjectMessage?.(prompt); } catch {}

    setEcho(prompt);
    setText('');
    Keyboard.dismiss();
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, [text]);

  const handleChip = useCallback(async (msg: string) => {
    (haptics as any).medium?.();
    setShowChips(false);
    Animated.spring(chipHeightA, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }).start();
    try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, msg); } catch {}
    try { (global as any).__butlerInjectMessage?.(msg); } catch {}
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, []);

  const chipH  = chipHeightA.interpolate({ inputRange: [0, 1], outputRange: [0, 116] });
  const borderColor = barGlowA.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,255,65,0.18)', intentC + 'AA'],
  });

  return (
    <View style={s.outerContainer} pointerEvents="box-none">

      {/* CHIP SHEET — expands upward above bar */}
      <Animated.View style={[s.chipSheet, { maxHeight: chipH, overflow: 'hidden' }]}>
        <Text style={s.chipHdr}>{'// QUICK_COMMANDS'}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingBottom: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          {CHIPS.map((c, i) => (
            <Pressable
              key={i}
              onPress={() => handleChip(c.msg)}
              style={({ pressed }) => [s.chip, { opacity: pressed ? 0.7 : 1 }]}
            >
              <MaterialIcons name={c.icon as any} size={11} color={C.green} />
              <Text style={s.chipTxt}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ECHO BADGE */}
      {echo ? (
        <CommandEcho text={echo} color={intentC} onDone={() => setEcho(null)} />
      ) : null}

      {/* MAIN BAR */}
      <Animated.View style={[s.bar as any, { borderColor }]}>
        {/* Top intent stripe — full width */}
        <View style={[s.topStripe, { backgroundColor: intentC }]} />

        {/* Ambient wave behind content */}
        <AmbientWave text={stableText} color={intentC} />

        {/* === PROMPT ROW === */}
        <View style={s.promptRow}>

          {/* Butler robot icon — opens chip drawer */}
          <TouchableOpacity
            onPress={toggleChips}
            activeOpacity={0.8}
            style={[s.robotBtn, showChips && { backgroundColor: C.green + '15' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
          >
            <ButlerRobotIcon color={showChips ? C.green : C.dimGreen} size={18} chips={showChips} />
          </TouchableOpacity>

          {/* Dynamic prompt symbol */}
          <Text style={[s.sym, { color: intentC }]}>{sym}</Text>

          {/* Input + ghost composite */}
          <View style={s.inputArea}>
            {/* Ghost completion layer */}
            {ghost && focused ? (
              <Text style={s.ghostLayer} pointerEvents="none" numberOfLines={1}>
                {text}
                <Text style={s.ghostSuffix}>{ghost}</Text>
              </Text>
            ) : null}

            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={focused ? '' : 'run command or ask butler...'}
              placeholderTextColor={C.mid}
              style={[s.input, ghost && focused && { color: 'transparent' }]}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              maxLength={800}
              underlineColorAndroid="transparent"
              selectionColor={C.green}
              keyboardAppearance="dark"
            />

            {/* Idle blinking cursor */}
            {!focused && !text ? (
              <Animated.View style={[s.cursor, { opacity: blinkA }]} />
            ) : null}
          </View>

          {/* TAB to accept ghost */}
          {ghost && focused ? (
            <TouchableOpacity
              onPress={acceptGhost}
              style={s.tabBtn}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <View style={s.tabBtnInner}>
                <Text style={s.tabBtnTxt}>TAB</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Send button */}
          <Animated.View style={{ transform: [{ scale: sendScA }] }}>
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              style={[
                s.sendBtn,
                ready
                  ? [s.sendActive, {
                      backgroundColor: intentC,
                      ...(Platform.OS === 'ios'
                        ? { shadowColor: intentC, shadowOpacity: 0.85, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
                        : { elevation: 8 }),
                    }]
                  : s.sendIdle,
              ]}
            >
              <MaterialIcons
                name={ready ? 'send' : 'keyboard-arrow-right'}
                size={15}
                color={ready ? '#000' : C.dimGreen}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* === STATUS / INTENT STRIP === */}
        <View style={s.statusRow}>
          {showIntent && intent.type !== 'IDLE' ? (
            <IntentBar intent={intent} />
          ) : (
            <View style={s.statusDefault}>
              <View style={[s.statusDot, { backgroundColor: C.dimGreen }]} />
              <Text style={s.statusTxt} numberOfLines={1}>
                BUTLER_AI · LOCAL_LLM · ZERO_CLOUD
              </Text>
              <TouchableOpacity
                onPress={() => {
                  (haptics as any).light?.();
                  try { router.push('/(tabs)/butler' as any); } catch {}
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={s.openChatTxt}>OPEN CHAT ›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // outerContainer must NOT be absolute — it is rendered above the dock
  // by the FuturisticTabBar as a normal View child
  outerContainer: {
    width: '100%',
    paddingHorizontal: 6,
    paddingBottom: 3,
  },

  chipSheet: {
    backgroundColor: '#010D04',
    borderTopLeftRadius: 11, borderTopRightRadius: 11,
    borderWidth: 1, borderBottomWidth: 0,
    borderColor: 'rgba(0,255,65,0.22)',
  },
  chipHdr: {
    fontFamily: MONO, fontSize: 7.5, fontWeight: '900',
    color: 'rgba(0,170,42,0.65)', letterSpacing: 1.2,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 6,
    borderColor: 'rgba(0,255,65,0.28)',
    backgroundColor: '#0D2210',
  },
  chipTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: '#00FF41' },

  bar: {
    borderRadius: 11, overflow: 'hidden',
    backgroundColor: '#020F08',
    borderWidth: 1.5,
    position: 'relative',
    ...Platform.select({ android: { elevation: 8 }, default: {} }),
  },
  topStripe: { height: 2.5 },

  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10, paddingRight: 8,
    height: 38,
    gap: 6,
    marginTop: 1,
  },

  robotBtn: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderRadius: 8,
  },

  sym: {
    fontFamily: MONO, fontSize: 12, fontWeight: '900',
    letterSpacing: -0.5, flexShrink: 0,
  },

  inputArea: { flex: 1, position: 'relative', justifyContent: 'center', height: 32 },
  input: {
    fontFamily: MONO, fontSize: 12.5, fontWeight: '700',
    color: '#C0F0C8', padding: 0, height: 32,
    includeFontPadding: false, backgroundColor: 'transparent',
  },
  ghostLayer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 32,
    fontFamily: MONO, fontSize: 12.5, fontWeight: '700',
    color: '#C0F0C8', includeFontPadding: false, textAlignVertical: 'center',
  },
  ghostSuffix: { color: 'rgba(0,170,42,0.45)' },
  cursor: {
    position: 'absolute', left: 0, top: 9,
    width: 6, height: 13, borderRadius: 1, backgroundColor: '#00FF41',
  },

  tabBtn: { flexShrink: 0 },
  tabBtnInner: {
    borderWidth: 1, borderRadius: 5,
    borderColor: 'rgba(0,170,42,0.40)',
    paddingHorizontal: 5, paddingVertical: 2,
    backgroundColor: 'rgba(0,30,10,0.6)',
  },
  tabBtnTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: '#00AA2A', letterSpacing: 0.4 },

  sendBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendActive: {},
  sendIdle: {
    backgroundColor: '#0D2210',
    borderWidth: 1, borderColor: 'rgba(0,255,65,0.22)',
  },

  statusRow: { minHeight: 22 },
  statusDefault: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingBottom: 5, paddingTop: 1,
  },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusTxt: {
    fontFamily: MONO, fontSize: 6.5, fontWeight: '900',
    color: 'rgba(0,170,42,0.50)', letterSpacing: 1, flex: 1,
  },
  openChatTxt: {
    fontFamily: MONO, fontSize: 6.5, fontWeight: '900',
    color: 'rgba(0,255,65,0.70)', letterSpacing: 0.8,
  },
});
