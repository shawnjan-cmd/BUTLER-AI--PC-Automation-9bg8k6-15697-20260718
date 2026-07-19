/**
 * NexusHero — Butler AI full hero section
 * ──────────────────────────────────────────────────────────────
 * Self-contained above-the-fold hero card:
 *  • Animated headline + subtitle typewriter
 *  • 4 capability chips
 *  • 3 primary CTAs (CHAT / QR PAIR / CODE)
 *  • 8-tile feature grid
 *  • Live status row
 *
 * Wraps itself in CyberPanel so it inherits all glow/corner/stripe
 * effects automatically.
 *
 * ANIMATION SAFETY:
 *  - Native driver: opacity, translateX/Y, scale
 *  - JS driver:     borderColor, backgroundColor  (separate values)
 *  - NEVER mix on same Animated.Value
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Animated, Platform, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR, FONT, glow, hex, TYPE } from '@/constants/tokens';
import { CyberPanel } from '@/components/ui/CyberPanel';
import { haptics } from '@/services/haptics';

const SW = Math.max(320, Dimensions.get('window').width);
const MONO = FONT.mono;

// ── PULSE DOT — native opacity only ──────────────────────────────
function PulseDot({ color, size = 5 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 750, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 750, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return (
    <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />
  );
}

// ── CAPABILITY CHIPS ──────────────────────────────────────────────
const CAPS = [
  { icon: 'shield-check',  lib: 'community' as const, label: 'ZERO CLOUD',   sub: 'LAN only',           color: COLOR.green   },
  { icon: 'brain',         lib: 'community' as const, label: 'LOCAL AI',      sub: 'Ollama on PC',       color: COLOR.cyan    },
  { icon: 'code-braces',   lib: 'community' as const, label: '250+ SCRIPTS',  sub: 'Python automations', color: COLOR.magenta },
  { icon: 'lock',          lib: 'material'  as const, label: 'AES-256',        sub: 'E2E encrypted',      color: COLOR.amber   },
] as const;

// ── FEATURE TILES ─────────────────────────────────────────────────
const TILES = [
  { icon: 'code-braces-box',       lib: 'community' as const, label: '250+\nSCRIPTS', color: COLOR.magenta },
  { icon: 'robot-happy',           lib: 'community' as const, label: 'LOCAL\nAI',     color: COLOR.cyan    },
  { icon: 'brain',                 lib: 'community' as const, label: 'SIGMA\nNET KB', color: COLOR.amber   },
  { icon: 'shield-lock',           lib: 'community' as const, label: 'AES\n256',      color: COLOR.green   },
  { icon: 'hammer-screwdriver',    lib: 'community' as const, label: 'PIPELINE\nBLD', color: COLOR.yellow  },
  { icon: 'desktop-tower-monitor', lib: 'community' as const, label: 'PC\nHEALTH',   color: COLOR.blue    },
  { icon: 'wifi-off',              lib: 'community' as const, label: 'LAN\nONLY',     color: COLOR.pink    },
  { icon: 'lock',                  lib: 'material'  as const, label: 'ZERO\nCLOUD',   color: COLOR.teal    },
] as const;

// ── AI PROMPTS TYPEWRITER ─────────────────────────────────────────
const PROMPTS = [
  '"Run Python on my PC remotely..."',
  '"Clean temp files and free disk space"',
  '"What processes are eating my CPU?"',
  '"Schedule a backup at 11 PM tonight"',
  '"Show disk usage by folder"',
];

function PromptTypewriter() {
  const [idx, setIdx]   = useState(0);
  const [chars, setChars] = useState(0);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const target = PROMPTS[idx];
    if (chars < target.length) {
      const t = setTimeout(() => { if (m.current) setChars(c => c + 1); }, 28);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { if (m.current) { setIdx(i => (i + 1) % PROMPTS.length); setChars(0); } }, 2800);
    return () => clearTimeout(t);
  }, [chars, idx]);
  return (
    <Text style={tw.txt} numberOfLines={1}>
      {PROMPTS[idx].slice(0, chars)}
      <Text style={{ color: COLOR.cyan }}>▌</Text>
    </Text>
  );
}
const tw = StyleSheet.create({
  txt: { fontFamily: MONO, fontSize: 10, color: hex(COLOR.cyan, '80'), flex: 1 },
});

// ── ASSET ─────────────────────────────────────────────────────────
let MASCOT: any = null;
try { MASCOT = require('@/assets/images/mascot_shield_v2.png'); } catch {
  try { MASCOT = require('@/assets/images/nexus-robot-mascot.png'); } catch {}
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
interface NexusHeroProps {
  isConnected: boolean;
  onChatPress:   () => void;
  onQRPress:     () => void;
  onScriptsPress:() => void;
  serverAddr?:   string;
  latencyMs?:    number;
}

export function NexusHero({
  isConnected,
  onChatPress,
  onQRPress,
  onScriptsPress,
  serverAddr,
  latencyMs,
}: NexusHeroProps) {
  // Native-driver entrance animations
  const scaleA = useRef(new Animated.Value(0.93)).current;
  const opA    = useRef(new Animated.Value(0)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const m      = useRef(true);

  useEffect(() => {
    m.current = true;
    Animated.parallel([
      Animated.spring(scaleA, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
      Animated.timing(opA, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ]));
    floatLoop.start();
    return () => { m.current = false; floatLoop.stop(); };
  }, []);

  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const cc = isConnected ? COLOR.green : COLOR.red;

  return (
    <CyberPanel accentColor={COLOR.cyan} stripe scanline screenWidth={SW}>
      <Animated.View style={{ opacity: opA, transform: [{ scale: scaleA }] }}>

        {/* ── SYS.BOOT HEADER ROW ── */}
        <View style={s.bootRow}>
          <View style={s.bootLeft}>
            <Text style={s.sysLabel}>// SYS.BOOT · v7.3.0</Text>
            <Text style={s.heroTitle}>
              <Text style={{ color: '#FFF' }}>BUTLER</Text>
              <Text style={{ color: COLOR.cyan }}> AI</Text>
            </Text>
            <View style={[s.subBadge, { borderColor: hex(COLOR.cyan, '40'), backgroundColor: glow(COLOR.cyan, 7) }]}>
              <Text style={[s.subBadgeTxt, { color: COLOR.cyan }]}>NEXUS · INTELLIGENCE · PLATFORM</Text>
            </View>
          </View>

          {/* Floating mascot */}
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            {MASCOT ? (
              <Image source={MASCOT} style={{ width: 64, height: 78 }} contentFit="contain" transition={200} />
            ) : (
              <View style={[s.mascotFallback, { borderColor: hex(COLOR.cyan, '50'), backgroundColor: glow(COLOR.cyan, 8) }]}>
                <MaterialCommunityIcons name="robot-happy" size={44} color={COLOR.cyan} />
              </View>
            )}
            <View style={[s.mascotBadge, { borderColor: hex(cc, '55'), backgroundColor: glow(cc, 8) }]}>
              <PulseDot color={cc} size={4} />
              <Text style={[s.mascotBadgeTxt, { color: cc }]}>{isConnected ? 'LIVE' : 'PAIR'}</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── STATUS ROW ── */}
        <View style={s.statusRow}>
          <PulseDot color={cc} size={5} />
          <Text style={[s.statusTxt, { color: cc }]}>
            {isConnected ? `CONNECTED · ${serverAddr || 'LOCAL'}` : 'OFFLINE · TAP QR TO PAIR'}
          </Text>
          {isConnected && latencyMs != null && latencyMs > 0 && (
            <View style={[s.latBadge, { borderColor: hex(COLOR.mid, '40') }]}>
              <Text style={{ fontFamily: MONO, fontSize: 7.5, color: COLOR.mid }}>{latencyMs}ms</Text>
            </View>
          )}
        </View>

        {/* ── CAPABILITY CHIPS ── */}
        <View style={s.capsRow}>
          {CAPS.map((c, i) => {
            const Icon = c.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <View key={i} style={[s.cap, { borderColor: hex(c.color, '35'), backgroundColor: glow(c.color, 7) }]}>
                <View style={[s.capIcon, { borderColor: hex(c.color, '50'), backgroundColor: glow(c.color, 10) }]}>
                  <Icon name={c.icon as any} size={10} color={c.color} />
                </View>
                <View>
                  <Text style={[s.capLabel, { color: c.color }]}>{c.label}</Text>
                  <Text style={[s.capSub,   { color: hex(c.color, '60') }]}>{c.sub}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── PROMPT TYPEWRITER ROW ── */}
        <View style={[s.promptRow, { borderColor: hex(COLOR.cyan, '25') }]}>
          <Text style={{ fontFamily: MONO, fontSize: 10, color: hex(COLOR.cyan, '50') }}>{'>'}</Text>
          <PromptTypewriter />
        </View>

        {/* ── 3-CTA ROW ── */}
        <View style={s.ctaRow}>
          <Pressable onPress={() => { haptics.heavy(); onChatPress(); }}
            style={({ pressed }) => [s.ctaPrimary, { backgroundColor: COLOR.cyan, opacity: pressed ? 0.85 : 1 }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={16} color="#000" />
            <Text style={s.ctaPrimaryTxt}>CHAT WITH AI</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
            <Pressable onPress={() => { haptics.medium(); onQRPress(); }}
              style={({ pressed }) => [s.ctaSecondary, { borderColor: hex(COLOR.green, '55'), opacity: pressed ? 0.8 : 1 }]}>
              <MaterialIcons name="qr-code-scanner" size={14} color={COLOR.green} />
              <Text style={[s.ctaSecTxt, { color: COLOR.green }]}>PAIR</Text>
            </Pressable>
            <Pressable onPress={() => { haptics.light(); onScriptsPress(); }}
              style={({ pressed }) => [s.ctaSecondary, { borderColor: hex(COLOR.magenta, '55'), opacity: pressed ? 0.8 : 1 }]}>
              <MaterialIcons name="code" size={14} color={COLOR.magenta} />
              <Text style={[s.ctaSecTxt, { color: COLOR.magenta }]}>CODE</Text>
            </Pressable>
          </View>
        </View>

        {/* ── FEATURE TILE GRID ── */}
        <View style={s.tileSection}>
          <View style={s.tileSectionHdr}>
            <View style={[s.tileSectionBar, { backgroundColor: COLOR.cyan }]} />
            <Text style={[s.tileSectionTitle, { color: COLOR.cyan }]}>CORE CAPABILITIES</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: hex(COLOR.cyan, '20') }} />
            <View style={[s.tilesBadge, { borderColor: hex(COLOR.green, '50'), backgroundColor: glow(COLOR.green, 8) }]}>
              <PulseDot color={COLOR.green} size={4} />
              <Text style={[s.tilesBadgeTxt, { color: COLOR.green }]}>8 MODULES</Text>
            </View>
          </View>
          <View style={s.tileGrid}>
            {TILES.map((t, i) => {
              const Icon = t.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
              return (
                <View key={i} style={[s.tile, { borderColor: hex(t.color, '35'), borderTopColor: t.color }]}>
                  <View style={[s.tileIcon, { backgroundColor: glow(t.color, 10), borderColor: hex(t.color, '45') }]}>
                    <Icon name={t.icon as any} size={17} color={t.color} />
                  </View>
                  <Text style={[s.tileLbl, { color: t.color }]}>{t.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </Animated.View>
    </CyberPanel>
  );
}

const s = StyleSheet.create({
  // SYS.BOOT header
  bootRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 10 },
  bootLeft:     { flex: 1 },
  sysLabel:     { fontFamily: MONO, fontSize: 9, color: hex(COLOR.cyan, '70'), letterSpacing: 1.5, marginBottom: 3 },
  heroTitle:    { fontFamily: MONO, fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  subBadge:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  subBadgeTxt:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  mascotFallback: { width: 64, height: 64, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  mascotBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, marginTop: 5, alignSelf: 'center' },
  mascotBadgeTxt:{ fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  // Status
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: hex(COLOR.cyan, '10') },
  statusTxt:    { fontFamily: MONO, fontSize: 9.5, fontWeight: '700', flex: 1 },
  latBadge:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  // Caps
  capsRow:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, gap: 6 },
  cap:          { width: `${(100 / 2) - 1.8}%` as any, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  capIcon:      { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  capLabel:     { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 },
  capSub:       { fontFamily: MONO, fontSize: 7.5, lineHeight: 11 },
  // Prompt
  promptRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  // CTAs
  ctaRow:       { flexDirection: 'column', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  ctaPrimary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 12, paddingVertical: 13 },
  ctaPrimaryTxt:{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.3 },
  ctaSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 11, borderWidth: 1.5 },
  ctaSecTxt:    { fontFamily: MONO, fontSize: 10, fontWeight: '900' },
  // Feature tiles
  tileSection:     { paddingHorizontal: 12, paddingBottom: 12 },
  tileSectionHdr:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
  tileSectionBar:  { width: 3, height: 12, borderRadius: 2 },
  tileSectionTitle:{ fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  tilesBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tilesBadgeTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  tileGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile:            { width: `${(100 / 4) - 2.2}%` as any, alignItems: 'center', gap: 6, borderWidth: 1.5, borderTopWidth: 2.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 4, backgroundColor: COLOR.surf2 },
  tileIcon:        { width: 34, height: 34, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tileLbl:         { fontFamily: MONO, fontSize: 7, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3, lineHeight: 10 },
});

export default NexusHero;
