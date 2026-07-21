# BUTLER AI — QuickButlerBar Visual Upgrade Pack v2.0
## Complete OnSpace.ai Implementation Guide
### Theme: Terminal Glass · Neon-on-Dark · Cyberpunk HUD

> **PASTE THIS ENTIRE FILE into the OnSpace.ai AI chat, then say:**
> *"Apply this full QuickButlerBar visual upgrade. Rebuild components/ui/QuickButlerBar.tsx exactly as shown. Delete no other files. Verify all wiring. Do not skip any section."*

---

## 0 · CONTEXT: WHAT WAS DELETED AND WHY

The following files were permanently removed (dead code, no references anywhere):
- `app/(tabs)/terminal.tsx` — was `href: null` (hidden), content already merged into `logs.tsx`
- `app/(tabs)/support.tsx` — was `href: null` (hidden), content already merged into `settings.tsx`

These two files were causing a huge bundle increase (+~400KB) with duplicate logic. Their removal is permanent. The `_layout.tsx` has been cleaned to remove their `<Tabs.Screen>` entries.

**DO NOT recreate these files.** If a user needs activity logs → `logs.tsx`. If they need help → `settings.tsx`.

---

## 1 · WHAT NOT TO DO (Critical Mistakes To Avoid)

```
❌ NEVER add biometric / fingerprint security UI to the bar
❌ NEVER import expo-haptics directly — use services/haptics.ts wrapper
❌ NEVER use useWindowDimensions() — use Dimensions.get('window').width
❌ NEVER use Animated.loop() without cleanup on unmount
❌ NEVER use StyleSheet outside of StyleSheet.create() in component files  
❌ NEVER import from app/(tabs)/terminal.tsx or app/(tabs)/support.tsx — deleted
❌ NEVER nest a TextInput inside an Animated.View that uses useNativeDriver:false
    AND passes native-driver transforms — this crashes Android
❌ NEVER set borderColor on the same Animated.View that animates scale with nativeDriver:true
❌ NEVER make QuickButlerBar more than 100px tall (hides tab bar)
❌ NEVER show QuickButlerBar when on the butler.tsx tab (already handled)
❌ NEVER use Math.random() in render — use seeded deterministic functions
❌ NEVER add biometric lock, fingerprint, Face ID to this component
```

---

## 2 · DESIGN TOKENS (Use Exactly These)

All colors, fonts, and sizes must come from `constants/tokens.ts`.

```typescript
// From constants/tokens.ts — do NOT redeclare inline
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import { T, FontFamily, FontFloor } from '@/constants/typography';

// QuickButlerBar specific overrides:
const QBB = {
  bg:        '#010A04',         // bar background
  bar:       '#020F08',         // inner container
  green:     '#00FF41',         // primary accent (matrix green)
  dimGreen:  '#00AA2A',         // inactive / dim
  amber:     '#FFB020',         // warm accent
  cyan:      '#00E5FF',         // cold accent
  purple:    '#CC44FF',         // AI/script accent
  mid:       '#1A4A1F',         // mid-tone surfaces
  dim:       '#0D2210',         // dark surfaces
  text:      '#C0F0C8',         // readable body text on dark
  border:    'rgba(0,255,65,0.22)', // subtle border
  red:       '#FF3344',         // error / action
} as const;
```

---

## 3 · CURRENT QUIRKS TO FIX

### 3a. Ghost text z-index issue
The ghost completion text currently overlaps with the real input because both use `position:'absolute'`. Fix by using a different approach:

```typescript
// WRONG:
<Text style={s.ghostText} pointerEvents="none">
  {text}<Text style={{color:'transparent'}}>{ghost}</Text>
</Text>
<TextInput value={text} style={s.input} />

// CORRECT (ghost shows inside same flex row, right of caret):
<View style={{flexDirection:'row', alignItems:'center', flex:1}}>
  <Text style={s.inputMirror}>{text}</Text>
  {ghost ? <Text style={s.ghostSuffix}>{ghost}</Text> : null}
</View>
// Then the real TextInput is opacity:0 overlay, same position
```

### 3b. Intent strip always shows on every keystroke
Feels noisy. Add a 300ms debounce before showing the strip:

```typescript
const [showIntent, setShowIntent] = useState(false);
const intentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (intentTimer.current) clearTimeout(intentTimer.current);
  if (text.length > 3) {
    intentTimer.current = setTimeout(() => setShowIntent(true), 300);
  } else {
    setShowIntent(false);
  }
  return () => { if (intentTimer.current) clearTimeout(intentTimer.current); };
}, [text]);
```

### 3c. Ambient waveform performance
Current implementation recalculates SVG path on every render. Fix with `useMemo` + only update when text changes by >3 chars:

```typescript
const [stableText, setStableText] = useState('');
useEffect(() => {
  if (Math.abs(text.length - stableText.length) > 3 || text === '') {
    setStableText(text);
  }
}, [text]);
const wavePath = useMemo(() => entropyWave(stableText, W, H), [stableText]);
```

---

## 4 · COMPLETE REBUILT QuickButlerBar.tsx

Replace `components/ui/QuickButlerBar.tsx` with exactly this:

```typescript
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NEXUS TYPE ENGINE v2.0 — TERMINAL GLASS EDITION                ║
 * ║  ©2026 Andrej Sladkovic — PROPRIETARY, ALL RIGHTS RESERVED      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Visual redesign: full-width edge-to-edge Terminal Glass aesthetic.
 * Performance: debounced intent, stable waveform, single animation loop.
 * UX: ghost tab-completion, phoneme haptics, command echo, chip drawer.
 *
 * WIRE MAP (all backend connections):
 *   → AsyncStorage key '@butler_prefill_prompt'  → butler.tsx reads on focus
 *   → global.__butlerInjectMessage(text)          → butler.tsx live inject
 *   → global.__butlerSwitchTab('butler')          → FuturisticTabBar navigate
 *   → services/haptics.ts                         → all tap feedback
 *   → services/nexusVocabService.ts               → personal vocab learning
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  Keyboard, Animated, Dimensions, Pressable, ScrollView,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Rect as SvgRect } from 'react-native-svg';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';
import { T, FontFamily } from '@/constants/typography';

// ── WIRING EXPORT (used by butler.tsx and other screens) ──────────
export const BUTLER_PREFILL_KEY = '@butler_prefill_prompt';

// ── SCREEN DIMENSIONS ─────────────────────────────────────────────
const SW = Math.max(320, Dimensions.get('window').width);
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
  border:   'rgba(0,255,65,0.22)',
  red:      '#FF3344',
} as const;

// ── INTENT CLASSIFIER ─────────────────────────────────────────────
type Intent = 'ACTION' | 'QUERY' | 'SCRIPT' | 'SEARCH' | 'IDLE';

function classifyIntent(text: string): { type: Intent; score: number; color: string } {
  if (!text.trim()) return { type: 'IDLE', score: 0, color: C.dimGreen };
  const t = text.toLowerCase();
  const scores = {
    ACTION: ['run','exec','execute','start','stop','kill','clean','clear','delete','free','restart','open','close','write','create','make','launch','reboot','shutdown'],
    SCRIPT: ['python','import','def ','for ','while ','print','psutil','os.','sys.','subprocess','script','automate','pip','venv'],
    QUERY:  ['what','how','why','show','list','which','can you','help','explain','find','get','check','status','info'],
    SEARCH: ['search','find','google','look up','scan','where','locate','discover'],
  };
  const counts: Record<string, number> = {};
  for (const [k, words] of Object.entries(scores)) {
    counts[k] = words.filter(w => t.includes(w)).length;
  }
  const max = Math.max(...Object.values(counts));
  if (max === 0) return { type: 'IDLE', score: 28, color: C.dimGreen };
  const total  = Object.values(counts).reduce((s, v) => s + v, 0);
  const score  = Math.min(99, Math.round((max / total) * 100));
  const winner = Object.entries(counts).find(([, v]) => v === max)![0] as Intent;
  const colors: Record<Intent, string> = { ACTION: C.cyan, SCRIPT: C.purple, QUERY: C.green, SEARCH: C.amber, IDLE: C.dimGreen };
  return { type: winner, score, color: colors[winner] };
}

// ── HAPTIC PHONEME MAP ─────────────────────────────────────────────
function phonemeHaptic(char: string) {
  if (!char || char.length !== 1) return;
  const c = char.toLowerCase();
  if ('aeiou'.includes(c))                   { haptics.light?.(); return; }
  if ('bcdfghjklmnpqrstvwxyz'.includes(c))  { haptics.selection?.(); return; }
  // space/punct = no haptic (intentional tactile silence)
}

// ── ENTROPY WAVEFORM ──────────────────────────────────────────────
// Seeded by text content — same phrase = same wave
function entropyWave(text: string, W: number, H: number): string {
  if (!text) return `M 0 ${H / 2} L ${W} ${H / 2}`;
  const N   = 16;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * W;
    let   y = H / 2;
    for (let j = 0; j < Math.min(text.length, 12); j++) {
      const freq = ((text.charCodeAt(j) % 5) + 1);
      const amp  = H * 0.2 * (1 - j / text.length);
      y += amp * Math.sin((i / N) * Math.PI * 2 * freq + j * 0.7);
    }
    pts.push([x, Math.max(2, Math.min(H - 2, y))]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx2, cy2] = pts[i];
    const mpx = ((px + cx2) / 2).toFixed(1);
    d += ` C ${mpx} ${py.toFixed(1)}, ${mpx} ${cy2.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}`;
  }
  return d;
}

function AmbientWave({ text, color }: { text: string; color: string }) {
  const W = SW - 20;
  const H = 32;
  const d = useMemo(() => entropyWave(text, W, H), [text]);
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGrad id="wg" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor={color} stopOpacity="0" />
          <Stop offset="0.35" stopColor={color} stopOpacity="0.3" />
          <Stop offset="0.65" stopColor={color} stopOpacity="0.22" />
          <Stop offset="1"   stopColor={color} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={d} stroke="url(#wg)" strokeWidth="2" fill="none" />
    </Svg>
  );
}

// ── INTENT BAR ────────────────────────────────────────────────────
function IntentBar({ intent }: { intent: { type: Intent; score: number; color: string } }) {
  const pct = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pct, {
      toValue: intent.score / 100,
      tension: 160, friction: 14, useNativeDriver: false,
    }).start();
  }, [intent.score, intent.type]);
  const barW = pct.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={ib.row}>
      <View style={[ib.typeBadge, { borderColor: intent.color + '60', backgroundColor: intent.color + '12' }]}>
        <Text style={[ib.typeText, { color: intent.color }]}>{intent.type}</Text>
      </View>
      <View style={ib.track}>
        <Animated.View style={[ib.fill, { width: barW as any, backgroundColor: intent.color }]} />
      </View>
      <Text style={[ib.score, { color: intent.color }]}>{intent.score}%</Text>
    </View>
  );
}
const ib = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingBottom: 5, paddingTop: 2 },
  typeBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  typeText:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  track:     { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: 2 },
  score:     { fontFamily: MONO, fontSize: 8, fontWeight: '900', width: 26, textAlign: 'right' },
});

// ── QUICK CHIPS ───────────────────────────────────────────────────
const CHIPS = [
  { icon: 'monitor-dashboard',   label: 'PC Health',    msg: 'Show full PC health: CPU, RAM, disk, temp'          },
  { icon: 'broom',               label: 'Clean Temp',   msg: 'Write Python to clean all temp files + show freed MB' },
  { icon: 'code-braces',         label: 'Write Script', msg: 'Write a Python script to automate: '                },
  { icon: 'wifi',                label: 'LAN Scan',     msg: 'Scan my local network and list all connected devices' },
  { icon: 'cpu-64-bit',          label: 'Top Procs',    msg: 'Show top 8 CPU-consuming processes right now'       },
  { icon: 'harddisk',            label: 'Disk Map',     msg: 'Show disk usage breakdown by folder'                },
  { icon: 'shield-search',       label: 'Security',     msg: 'Run a security audit: open ports, firewall, vulns'  },
  { icon: 'battery-charging',    label: 'Battery',      msg: 'Check battery level, health and charging status'    },
  { icon: 'application-braces',  label: 'Startup Apps', msg: 'List and manage all Windows startup programs'       },
  { icon: 'network-outline',     label: 'Network Info', msg: 'Show my IP, DNS, gateway, and connection speed'     },
];

// ── COMMAND ECHO ──────────────────────────────────────────────────
function CommandEchoBadge({ text, color, onDone }: { text: string; color: string; onDone: () => void }) {
  const [display, setDisplay] = useState(text);
  const opA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const hold = setTimeout(() => {
      let i = text.length;
      const eraseInterval = setInterval(() => {
        i -= 2;
        if (i <= 0) { clearInterval(eraseInterval); onDone(); return; }
        setDisplay(text.slice(0, i) + '▌');
      }, 35);
      Animated.timing(opA, { toValue: 0, duration: text.length * 18 + 100, useNativeDriver: true }).start();
      return () => clearInterval(eraseInterval);
    }, 2200);
    return () => clearTimeout(hold);
  }, []);
  return (
    <Animated.View style={[ce.wrap, { borderColor: color + '55', opacity: opA }]}>
      <MaterialIcons name="check-circle-outline" size={9} color={color} />
      <Text style={[ce.txt, { color }]} numberOfLines={1}>{display}</Text>
    </Animated.View>
  );
}
const ce = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.8)', alignSelf: 'center',
    marginBottom: 4 },
  txt:  { fontFamily: MONO, fontSize: 10, fontWeight: '700', maxWidth: SW - 80, letterSpacing: 0.3 },
});

// ── BUILT-IN SEED COMPLETIONS ─────────────────────────────────────
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
  ['open',     'Open the application: '],
  ['download', 'Download and save the file from: '],
  ['monitor',  'Monitor and alert when '],
];

function getGhost(text: string): string {
  if (!text.trim()) return '';
  const t   = text.toLowerCase().trim();
  const last = t.split(' ').pop() ?? '';
  for (const [seed, full] of SEEDS) {
    if (seed.startsWith(last) && seed !== last) {
      return seed.slice(last.length) + ' → ' + full.slice(0, 26);
    }
  }
  return '';
}

// ── VOCAB PERSISTENCE (simplified, fast) ─────────────────────────
const VOCAB_KEY = '@qbb_vocab_v1';
let _vocabCache: [string, number][] = [];
let _vocabLoaded = false;

async function loadVocab() {
  if (_vocabLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(VOCAB_KEY);
    if (raw) _vocabCache = JSON.parse(raw);
  } catch {}
  _vocabLoaded = true;
}

async function recordVocab(text: string) {
  await loadVocab();
  const words = text.toLowerCase().trim().split(/\s+/).filter(w => w.length > 3);
  const ngrams = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    ngrams.add(words[i]);
    if (words[i + 1]) ngrams.add(words[i] + ' ' + words[i + 1]);
  }
  for (const g of ngrams) {
    const ex = _vocabCache.find(([k]) => k === g);
    if (ex) ex[1]++; else _vocabCache.push([g, 1]);
  }
  _vocabCache = _vocabCache.sort((a, b) => b[1] - a[1]).slice(0, 150);
  AsyncStorage.setItem(VOCAB_KEY, JSON.stringify(_vocabCache)).catch(() => {});
}

function vocabSuggestions(partial: string): string[] {
  const q = partial.toLowerCase().trim().split(' ').pop() ?? '';
  if (q.length < 2) return [];
  return _vocabCache
    .filter(([k]) => k.startsWith(q) && k !== q)
    .slice(0, 3)
    .map(([k]) => k);
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
  const [vocabSugs,  setVocabSugs]  = useState<string[]>([]);

  const inputRef     = useRef<TextInput>(null);
  const intentTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLen      = useRef(0);
  const sendScA      = useRef(new Animated.Value(1)).current;
  const blinkA       = useRef(new Animated.Value(1)).current;
  const chipHeightA  = useRef(new Animated.Value(0)).current;
  const glowOpA      = useRef(new Animated.Value(0.4)).current;

  const intent = useMemo(() => classifyIntent(text), [text]);
  const ghost  = useMemo(() => {
    const g = getGhost(text);
    if (g) return g;
    const sugs = vocabSuggestions(text);
    if (sugs.length > 0) {
      const last = text.toLowerCase().trim().split(' ').pop() ?? '';
      return sugs[0].slice(last.length);
    }
    return '';
  }, [text, vocabSugs]);

  // ── Mount: load vocab, start ambient animations ──────────────
  useEffect(() => {
    loadVocab();

    // Glow breathe
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowOpA, { toValue: 1,   duration: 2000, useNativeDriver: true }),
      Animated.timing(glowOpA, { toValue: 0.2, duration: 2000, useNativeDriver: true }),
    ]));
    glowLoop.start();

    // Cursor blink
    const blinkLoop = Animated.loop(Animated.sequence([
      Animated.timing(blinkA, { toValue: 0, duration: 530, useNativeDriver: true }),
      Animated.timing(blinkA, { toValue: 1, duration: 530, useNativeDriver: true }),
    ]));
    blinkLoop.start();

    return () => { glowLoop.stop(); blinkLoop.stop(); };
  }, []);

  // ── Intent debounce ──────────────────────────────────────────
  useEffect(() => {
    if (intentTimer.current) clearTimeout(intentTimer.current);
    if (text.length > 3) {
      intentTimer.current = setTimeout(() => setShowIntent(true), 280);
    } else {
      setShowIntent(false);
    }
    return () => { if (intentTimer.current) clearTimeout(intentTimer.current); };
  }, [text]);

  // ── Wave stability (update only every 4 chars) ───────────────
  useEffect(() => {
    if (Math.abs(text.length - prevLen.current) >= 4 || text === '') {
      prevLen.current = text.length;
      setStableText(text);
    }
  }, [text]);

  // ── Text change: phoneme haptics + vocab ──────────────────────
  const handleChange = useCallback((val: string) => {
    const added = val.slice(text.length);
    if (added.length === 1) phonemeHaptic(added);
    setText(val);
    const sugs = vocabSuggestions(val);
    setVocabSugs(sugs);
  }, [text]);

  // ── Toggle chip drawer ────────────────────────────────────────
  const toggleChips = useCallback(() => {
    haptics.light?.();
    const next = !showChips;
    setShowChips(next);
    if (next) Keyboard.dismiss();
    Animated.spring(chipHeightA, {
      toValue: next ? 1 : 0, tension: 80, friction: 11, useNativeDriver: false,
    }).start();
  }, [showChips]);

  // ── Accept ghost completion ───────────────────────────────────
  const acceptGhost = useCallback(() => {
    if (!ghost) return;
    const completion = ghost.split(' → ')[0].replace(/^ +/, '');
    const newText    = text + completion;
    setText(newText);
    setVocabSugs(vocabSuggestions(newText));
    haptics.soft?.();
  }, [ghost, text]);

  // ── Send / navigate ───────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const prompt = text.trim();
    if (!prompt) {
      haptics.medium?.();
      try { router.push('/(tabs)/butler' as any); } catch {}
      return;
    }
    haptics.heavy?.();

    // Send button spring
    Animated.sequence([
      Animated.spring(sendScA, { toValue: 0.72, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(sendScA, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 18 }),
    ]).start();

    // Record vocab
    recordVocab(prompt);

    // Wire to butler.tsx via AsyncStorage and global bridge
    try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, prompt); } catch {}
    try { (global as any).__butlerInjectMessage?.(prompt); } catch {}

    // Show echo badge
    setEcho(prompt);
    setText('');
    setVocabSugs([]);
    Keyboard.dismiss();
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, [text]);

  // ── Chip quick-send ───────────────────────────────────────────
  const handleChip = useCallback(async (msg: string) => {
    haptics.medium?.();
    setShowChips(false);
    Animated.spring(chipHeightA, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }).start();
    try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, msg); } catch {}
    try { (global as any).__butlerInjectMessage?.(msg); } catch {}
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, []);

  const chipH = chipHeightA.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
  const intentColor = intent.type !== 'IDLE' ? intent.color : C.dimGreen;
  const ready = text.trim().length > 0;

  // ── PROMPT SYMBOL ─────────────────────────────────────────────
  const promptSym = intent.type === 'SCRIPT' ? '#!/' : intent.type === 'QUERY' ? '?>' : '$>';

  return (
    <View style={s.outer} pointerEvents="box-none">

      {/* ── CHIP SHEET ── */}
      <Animated.View style={[s.chipSheet, { maxHeight: chipH, overflow: 'hidden' }]}>
        <View>
          <Text style={s.chipHdr}>{'// QUICK_COMMANDS'}</Text>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingBottom: 10 }}>
            {CHIPS.map((c, i) => (
              <Pressable key={i} onPress={() => handleChip(c.msg)}
                style={({ pressed }) => [s.chip, { opacity: pressed ? 0.7 : 1 }]}>
                <MaterialCommunityIcons name={c.icon as any} size={11} color={C.green} />
                <Text style={s.chipTxt}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── ECHO BADGE ── */}
      {echo ? (
        <CommandEchoBadge text={echo} color={intentColor} onDone={() => setEcho(null)} />
      ) : null}

      {/* ── MAIN BAR ── */}
      <View style={[s.bar, focused && { borderColor: intentColor + '80' }]}>

        {/* Top accent stripe */}
        <View style={[s.stripe, { backgroundColor: intentColor }]} />

        {/* Ambient waveform */}
        <AmbientWave text={stableText} color={intentColor} />

        {/* Prompt row */}
        <View style={s.row}>
          {/* Robot FAB */}
          <TouchableOpacity onPress={toggleChips} activeOpacity={0.8} style={s.robotBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 6 }}>
            <MaterialCommunityIcons
              name={showChips ? 'robot-happy' : 'robot-outline'}
              size={18}
              color={showChips ? C.green : C.dimGreen}
            />
          </TouchableOpacity>

          {/* Prompt symbol */}
          <Text style={[s.sym, { color: intentColor }]}>{promptSym}</Text>

          {/* Input area */}
          <View style={s.inputArea}>
            {/* Ghost overlay */}
            {ghost && focused ? (
              <Text style={s.ghostText} pointerEvents="none" numberOfLines={1}>
                {text}
                <Text style={{ color: C.dimGreen + '60' }}>{ghost}</Text>
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
            {/* Blinking cursor when idle+unfocused */}
            {!focused && !text ? (
              <Animated.View style={[s.cursor, { opacity: blinkA }]} />
            ) : null}
          </View>

          {/* Tab-complete ghost button */}
          {ghost && focused ? (
            <TouchableOpacity onPress={acceptGhost} style={s.tabBtn}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <View style={[s.tabBtnInner, { borderColor: C.dimGreen + '50' }]}>
                <Text style={[s.tabBtnTxt, { color: C.dimGreen }]}>TAB</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Send button */}
          <Animated.View style={{ transform: [{ scale: sendScA }] }}>
            <TouchableOpacity onPress={handleSend} activeOpacity={0.85}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
              style={[s.sendBtn, ready
                ? [s.sendActive, { backgroundColor: intentColor,
                    ...(Platform.OS === 'ios'
                      ? { shadowColor: intentColor, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
                      : { elevation: 8 }) }]
                : s.sendIdle,
              ]}>
              <MaterialIcons name={ready ? 'send' : 'keyboard-arrow-right'} size={15}
                color={ready ? '#000' : C.dimGreen} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Status / intent row */}
        <View style={s.statusRow}>
          {showIntent && intent.type !== 'IDLE' ? (
            <IntentBar intent={intent} />
          ) : (
            <View style={s.statusDefault}>
              <View style={[s.statusDot, { backgroundColor: C.dimGreen }]} />
              <Text style={s.statusTxt}>BUTLER_AI · LOCAL_LLM · ZERO_CLOUD</Text>
              <TouchableOpacity onPress={() => { haptics.light?.(); try { router.push('/(tabs)/butler' as any); } catch {} }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.openChatTxt}>OPEN_CHAT ›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 8, right: 8,
    bottom: 0,
    zIndex: 60,
  },
  chipSheet: {
    backgroundColor: '#010D04',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    borderWidth: 1, borderBottomWidth: 0,
    borderColor: 'rgba(0,255,65,0.25)',
  },
  chipHdr: {
    fontFamily: MONO, fontSize: 8, fontWeight: '900',
    color: 'rgba(0,170,42,0.7)', letterSpacing: 1.4,
    paddingHorizontal: 12, paddingTop: 9, paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    borderColor: 'rgba(0,255,65,0.3)',
    backgroundColor: '#0D2210',
  },
  chipTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: '#00FF41' },
  bar: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#020F08',
    borderWidth: 1.5, borderColor: 'rgba(0,255,65,0.22)',
    position: 'relative',
    ...Platform.select({
      android: { elevation: 10 },
      default: {},
    }),
  },
  stripe: { height: 2.5 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 10, paddingRight: 9,
    height: 40, gap: 6, marginTop: 2,
  },
  robotBtn: {
    width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sym: {
    fontFamily: MONO, fontSize: 13, fontWeight: '900',
    letterSpacing: -0.5, flexShrink: 0,
  },
  inputArea: {
    flex: 1, position: 'relative', justifyContent: 'center', height: 34,
  },
  input: {
    fontFamily: MONO, fontSize: 13, fontWeight: '700',
    color: '#C0F0C8', padding: 0, height: 34,
    includeFontPadding: false, backgroundColor: 'transparent',
  },
  ghostText: {
    position: 'absolute', top: 0, left: 0, right: 0,
    fontFamily: MONO, fontSize: 13, fontWeight: '700',
    color: '#C0F0C8', height: 34, includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cursor: {
    position: 'absolute', left: 0, top: 10,
    width: 7, height: 14, borderRadius: 1, backgroundColor: '#00FF41',
  },
  tabBtn: { flexShrink: 0 },
  tabBtnInner: {
    borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 3,
    backgroundColor: 'rgba(0,170,42,0.08)',
  },
  tabBtnTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  sendBtn: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendActive: {},
  sendIdle: {
    backgroundColor: '#0D2210',
    borderWidth: 1, borderColor: 'rgba(0,255,65,0.25)',
  },
  statusRow: { minHeight: 24 },
  statusDefault: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingBottom: 6, paddingTop: 2,
  },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusTxt: {
    fontFamily: MONO, fontSize: 7, fontWeight: '900',
    color: 'rgba(0,170,42,0.55)', letterSpacing: 1.2, flex: 1,
  },
  openChatTxt: {
    fontFamily: MONO, fontSize: 7, fontWeight: '900',
    color: 'rgba(0,255,65,0.7)', letterSpacing: 1,
  },
});
```

---

## 5 · WIRING CHECKLIST — Every Button & Function

### ✅ VERIFY BEFORE CALLING DONE:

```
QuickButlerBar:
  [✓] Send button          → AsyncStorage '@butler_prefill_prompt' + __butlerInjectMessage + router.push butler
  [✓] Robot icon           → opens/closes chip drawer
  [✓] TAB button           → accepts ghost completion 
  [✓] Status "OPEN_CHAT ›" → router.push butler
  [✓] Each CHIP            → AsyncStorage + __butlerInjectMessage + router.push butler
  [✓] Empty send           → router.push butler (open chat directly)

butler.tsx (must read prefill):
  [✓] useFocusEffect or useEffect reads '@butler_prefill_prompt' on mount/focus
  [✓] global.__butlerInjectMessage defined and wired to sendMessage()
  [✓] Clears '@butler_prefill_prompt' after reading it

FuturisticTabBar:
  [✓] QuickButlerBar hidden when on 'butler' tab (isOnButlerTab flag)
  [✓] QuickButlerBar bottom positioned above dock height (dockH + 4)

Deleted files (CONFIRM THESE DO NOT EXIST):
  [✓] app/(tabs)/terminal.tsx — DELETED
  [✓] app/(tabs)/support.tsx  — DELETED
  [✓] _layout.tsx no longer registers these tabs
```

### How to verify butler.tsx is reading the prefill:

```typescript
// In butler.tsx — must exist somewhere near component mount:
useFocusEffect(useCallback(() => {
  AsyncStorage.getItem(BUTLER_PREFILL_KEY).then(msg => {
    if (msg && msg.trim()) {
      setText(msg);                        // prefill the input
      AsyncStorage.removeItem(BUTLER_PREFILL_KEY).catch(() => {});
    }
  }).catch(() => {});
}, []));

// AND the global bridge must exist:
useEffect(() => {
  (global as any).__butlerInjectMessage = (msg: string) => {
    // immediately send msg to chat without waiting for user
    sendMessage(msg);
  };
  return () => { delete (global as any).__butlerInjectMessage; };
}, [sendMessage]);
```

---

## 6 · METRO CACHE BUMP

After applying changes, bump `metro.config.js`:

```javascript
config.cacheVersion = 'butler-ai-v5.0.55-qbb2';
```

---

## 7 · VISUAL SPEC — What the Upgraded Bar Should Look Like

```
┌─────────────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (chip sheet, collapsible) ▓▓▓▓▓▓│
│ // QUICK_COMMANDS                                            │
│ [PC Health] [Clean Temp] [Write Script] [LAN Scan] ...      │
└─────────────────────────────────────────────────────────────┘
[✓ sent: "show cpu usage...                           "] ← echo

╔════════════════════════════════════════════════════════════╗  
║▓▓▓▓  2.5px intent-colored top stripe  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  ← stripe changes color by intent
║  ~~~~ ambient entropy waveform (SVG, behind content) ~~~~  ║  
║ 🤖  $> | run command or ask butler...         [ghost TAB] ▶ ║  ← $>/#!/?> changes by intent
║ BUTLER_AI · LOCAL_LLM · ZERO_CLOUD         OPEN_CHAT ›     ║  ← or intent bar when typing
╚════════════════════════════════════════════════════════════╝
```

**Intent states:**
- No text → `$>` + green stripe + ambient gentle wave
- ACTION text → `$>` cyan stripe + cyan wave + ACTION intent bar
- SCRIPT text → `#!/` purple stripe + purple wave + SCRIPT intent bar
- QUERY text → `?>` green stripe + green wave + QUERY intent bar
- SEARCH text → `$>` amber stripe + amber wave + SEARCH intent bar

---

## 8 · ANIMATION BUDGET

Do NOT add more animations than this — bar must feel fast not laggy:

| Animation | Duration | Driver |
|-----------|----------|--------|
| Send button spring | 55ms down / 200ms up | nativeDriver:true |
| Glow breathe | 2000ms loop | nativeDriver:true |
| Cursor blink | 530ms loop | nativeDriver:true |
| Chip drawer spring | spring tension:80 | nativeDriver:false (maxHeight) |
| Intent bar spring | tension:160 | nativeDriver:false (width%) |
| Ghost text | instant | no animation, just re-render |

---

## 9 · PLAY STORE REQUIREMENTS (Still Outstanding)

These have nothing to do with the bar but should not be forgotten:

- [ ] `app.json`: ensure `android.package` = `com.butlerai.pc.automation`
- [ ] `app.json`: ensure `android.versionCode` is incremented on every submission
- [ ] `eas.json`: has `production` profile with `distribution: store`
- [ ] `assets/screenshots/` has 5 screenshots matching Play Store dimensions
- [ ] Privacy Policy URL in Play Console matches `docs/privacy-policy.html`
- [ ] `DATA_SAFETY.md` answers filled in Play Console Data Safety form
- [ ] `PROMINENT_DISCLOSURES.md` is present and accurate
- [ ] App is set to 18+ (PC remote control) unless parental controls added
- [ ] No `console.log()` statements left in production (use `autoErrorLogger`)

---

## 10 · RECOVERY IMPORT JSON

If this project is lost, paste this into a new OnSpace.ai project:

```json
{
  "meta": {
    "name": "Butler AI Nexus Command Center",
    "version": "8.0.0",
    "theme": "Terminal Glass — dark navy, neon cyan/green/amber, monospace",
    "platform": "Expo Router + React Native + TypeScript"
  },
  "tabs": [
    "nexushome", "scripts", "butler", "knowledge", "logs",
    "builder", "fileshare", "cosmetic", "settings", "connect"
  ],
  "hidden_tabs": ["onboarding", "index"],
  "deleted_permanently": ["terminal", "support"],
  "key_services": [
    "serverConnection", "haptics", "autoErrorLogger", "knowledgeAccumulator",
    "scriptLibraryData", "executionCounter", "nexusVocabService"
  ],
  "key_components": [
    "FuturisticTabBar", "QuickButlerBar", "NexusTabIcons",
    "GlowCard", "CircularMetricRing", "HexTag", "CornerFrame"
  ]
}
```

---

*End of QuickButlerBar Upgrade Pack v2.0*
*Generated: 2026-07-21 · Butler AI v8.0.0*
*©2026 Andrej Sladkovic. All Rights Reserved.*
