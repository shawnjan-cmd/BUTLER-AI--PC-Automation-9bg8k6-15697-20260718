/**
 * BUTLER AI — NEXUS HOME v60.0 (FRESH)
 * ─────────────────────────────────────────────────────────────────
 * Complete rewrite: clean architecture, shared token system,
 * CyberPanel throughout, crash-proof animations.
 *
 * ANIMATION CONTRACT (never violate):
 *  • useNativeDriver:true  → opacity, translateX/Y, scale ONLY
 *  • useNativeDriver:false → borderColor, backgroundColor, width% ONLY
 *  • NEVER mix both drivers on the same Animated.Value
 *  • Every Animated.loop has a mounted-ref guard
 */

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions, Modal, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { COLOR, FONT, SHADOW, glow, hex } from '@/constants/tokens';
import { CyberPanel } from '@/components/ui/CyberPanel';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { RemoteAccessMonetizationCard } from '@/components/home/RemoteAccessMonetizationCard';
import { NexusVaultCard } from '@/components/ui/NexusVaultCard';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';
import { connectionHub } from '@/services/connectionHub';
import { executionHistory } from '@/services/executionHistory';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { personalMemory } from '@/services/personalMemory';
import { parseQRConnection } from '@/services/qrParser';
import { performanceHistory } from '@/services/performanceHistory';
import { logger } from '@/utils/logger';

const QRCameraScanner = React.lazy(() => import('@/components/qr/QRCameraScanner'));

// ─── CONSTANTS ────────────────────────────────────────────────────
const MONO: any = FONT.mono;
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;

// ─── SHARED MICRO-ATOMS ───────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
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
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a,
    }} />
  );
}

function Divider({ color = COLOR.border }: { color?: string }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color, marginHorizontal: PAD }} />;
}

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: PAD, paddingTop: 20, paddingBottom: 8,
    }}>
      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: color }} />
      <MaterialCommunityIcons name={icon as any} size={12} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color, letterSpacing: 2 }}>{label}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color + '30' }} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// HEADER — Robot automation theme
// ══════════════════════════════════════════════════════════════════
const TICKER_LINES = [
  '>> butler.run() :: hmac=active :: port=8766',
  '>> scheduler.next_job=02:00 :: 3_queued',
  '>> kb.vectors=847 :: sigma_net=True',
  '>> psutil.cpu=23% :: ram=58% :: disk=61%',
  '>> aes256+hmac_sha256 :: zero_cloud=True',
];

function Ticker() {
  const [idx,   setIdx]   = useState(0);
  const [chars, setChars] = useState(0);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const line = TICKER_LINES[idx];
    if (chars < line.length) {
      const t = setTimeout(() => { if (m.current) setChars(c => c + 1); }, 26);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (m.current) { setIdx(i => (i + 1) % TICKER_LINES.length); setChars(0); }
    }, 2800);
    return () => clearTimeout(t);
  }, [chars, idx]);
  const line = TICKER_LINES[idx];
  return (
    <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.green, flex: 1 }} numberOfLines={1}>
      {line.slice(0, chars)}<Text style={{ color: COLOR.cyan + '70' }}>▌</Text>
    </Text>
  );
}

function RobotLED({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return (
    <Animated.View style={{
      width: 8, height: 5, borderRadius: 3,
      backgroundColor: color, opacity: a,
    }} />
  );
}

const NAV_TABS = [
  { icon: 'robot-excited',    lib: 'c' as const, label: 'AI',     tab: 'butler'    },
  { icon: 'code-braces-box',  lib: 'c' as const, label: 'FORGE',  tab: 'scripts'   },
  { icon: 'brain',            lib: 'c' as const, label: 'KB',     tab: 'knowledge' },
  { icon: 'chart-bar',        lib: 'c' as const, label: 'INTEL',  tab: 'logs'      },
  { icon: 'folder-open',      lib: 'm' as const, label: 'VAULT',  tab: 'fileshare' },
  { icon: 'hammer-screwdriver',lib:'c' as const, label: 'BUILD',  tab: 'builder'   },
  { icon: 'palette-swatch',   lib: 'c' as const, label: 'SKINS',  tab: 'cosmetic'  },
  { icon: 'tune',             lib: 'm' as const, label: 'CFG',    tab: 'settings'  },
];

const NAV_COLORS = [COLOR.green, COLOR.magenta, COLOR.cyan, COLOR.amber, COLOR.pink, COLOR.yellow, COLOR.magenta, COLOR.mid];

interface HeaderProps {
  safeTop: number;
  isConn: boolean;
  addr: string;
  latency: number;
  onQR: () => void;
  onRefresh: () => void;
  goToTab: (t: string) => void;
}

function NexusHeader({ safeTop, isConn, addr, latency, onQR, onRefresh, goToTab }: HeaderProps) {
  const focused   = useIsFocused();
  const gearA     = useRef(new Animated.Value(0)).current;    // native — rotate
  const scanA     = useRef(new Animated.Value(-200)).current; // JS — translateX
  const loopGear  = useRef<any>(null);
  const loopScan  = useRef<any>(null);
  const m         = useRef(true);
  const [time, setTime] = useState(() => {
    const n = new Date(); return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  });

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    m.current = true;
    if (!focused) {
      loopGear.current?.stop();
      loopScan.current?.stop();
      return;
    }
    loopGear.current = Animated.loop(
      Animated.timing(gearA, { toValue: 1, duration: 9000, useNativeDriver: true })
    );
    loopScan.current = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 200, duration: 2800, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -200,     duration: 0,    useNativeDriver: false }),
      Animated.delay(6000),
    ]));
    loopGear.current.start();
    loopScan.current.start();
    return () => {
      m.current = false;
      loopGear.current?.stop();
      loopScan.current?.stop();
    };
  }, [focused]);

  const gearSpin = gearA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const cc = isConn ? COLOR.green : COLOR.red;

  return (
    <View style={[hdr.root, { paddingTop: safeTop }]}>
      {/* Scanline sweep — JS driver only */}
      <Animated.View pointerEvents="none" style={[hdr.scanline, { transform: [{ translateX: scanA }] }]} />

      {/* 5-color stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* ── BRAND ROW ── */}
      <View style={hdr.brandRow}>
        {/* Robot face */}
        <View style={[hdr.robot, { borderColor: COLOR.cyan + '50', backgroundColor: glow(COLOR.cyan, 6) }]}>
          <View style={[hdr.antenna, { backgroundColor: COLOR.cyan }]} />
          <Animated.View style={[hdr.antennaDot, { backgroundColor: cc, opacity: gearA.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0.3, 1, 1, 0.3] }) }]} />
          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 3 }}>
            <RobotLED color={cc} />
            <RobotLED color={cc} />
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ width: 3, height: 2, borderRadius: 1, backgroundColor: i % 2 === 0 ? COLOR.cyan : COLOR.cyan + '30' }} />
            ))}
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
            <View style={[hdr.badge, { borderColor: COLOR.cyan + '40', backgroundColor: glow(COLOR.cyan, 7) }]}>
              <Text style={[hdr.badgeTxt, { color: COLOR.cyan }]}>v7.3</Text>
            </View>
          </View>
          <Text style={hdr.sub}>
            <Text style={{ color: COLOR.green + '55' }}>{'# '}</Text>
            <Text style={{ color: COLOR.mid }}>automation · local_ai · zero_cloud</Text>
          </Text>
        </View>

        {/* Clock + actions */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[hdr.clock, { borderColor: COLOR.amber + '35', backgroundColor: glow(COLOR.amber, 7) }]}>
            <MaterialCommunityIcons name="clock-outline" size={9} color={COLOR.amber} />
            <Text style={[hdr.clockTxt, { color: COLOR.amber }]}>{time}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={() => { haptics.heavy(); onQR(); }} activeOpacity={0.8}
              style={[hdr.iconBtn, { borderColor: COLOR.cyan + '55', backgroundColor: glow(COLOR.cyan, 8) }]}>
              <MaterialIcons name="qr-code-scanner" size={14} color={COLOR.cyan} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { haptics.light(); onRefresh(); }} activeOpacity={0.8}
              style={[hdr.iconBtn, { borderColor: COLOR.mid + '30' }]}>
              <Animated.View style={{ transform: [{ rotate: gearSpin }] }}>
                <MaterialCommunityIcons name="cog" size={14} color={COLOR.mid} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── STATUS ROW ── */}
      <View style={hdr.statusRow}>
        <View style={[hdr.connPill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
          <PulseDot color={cc} size={5} />
          <Text style={[hdr.connTxt, { color: cc }]} numberOfLines={1}>
            {isConn ? (addr || 'ONLINE') : 'OFFLINE · PAIR PC'}
          </Text>
          {isConn && latency > 0 && (
            <Text style={{ fontFamily: MONO, fontSize: 7, color: COLOR.mid }}>{latency}ms</Text>
          )}
        </View>
        <View style={{ flex: 1, paddingLeft: 8, overflow: 'hidden' }}>
          <Ticker />
        </View>
      </View>

      {/* ── NAV PILLS ── */}
      <View style={hdr.navWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingVertical: 8, gap: 6 }}>
          {/* QR quick access */}
          <TouchableOpacity onPress={() => { haptics.heavy(); onQR(); }} activeOpacity={0.8}
            style={[hdr.pill, { borderColor: COLOR.cyan + '55', backgroundColor: glow(COLOR.cyan, 8) }]}>
            <MaterialIcons name="qr-code-scanner" size={10} color={COLOR.cyan} />
            <Text style={[hdr.pillTxt, { color: COLOR.cyan }]}>[PAIR]</Text>
          </TouchableOpacity>
          {NAV_TABS.map((n, i) => {
            const color = NAV_COLORS[i];
            const Icon = n.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <TouchableOpacity key={n.tab} onPress={() => { haptics.light(); goToTab(n.tab); }} activeOpacity={0.8}
                style={[hdr.pill, { borderColor: color + '50', backgroundColor: glow(color, 7) }]}>
                <Icon name={n.icon as any} size={10} color={color} />
                <Text style={[hdr.pillTxt, { color }]}>[{n.label}]</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Circuit bottom border */}
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: COLOR.cyan + '30' }} />
        <View style={{ width: 10, backgroundColor: COLOR.cyan }} />
        <View style={{ flex: 3, backgroundColor: COLOR.cyan + '14' }} />
        <View style={{ width: 5, backgroundColor: COLOR.green }} />
        <View style={{ flex: 2, backgroundColor: COLOR.cyan + '18' }} />
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  root:      { backgroundColor: '#020609', overflow: 'hidden', ...SHADOW.dark },
  scanline:  { position: 'absolute', top: 0, bottom: 0, width: 140, backgroundColor: 'rgba(0,229,255,0.025)', transform: [{ skewX: '-8deg' }], zIndex: 0 },
  brandRow:  { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 7, zIndex: 1 },
  robot:     { width: 44, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingTop: 5, flexShrink: 0, position: 'relative' },
  antenna:   { position: 'absolute', top: -9, left: '50%', width: 1.5, height: 9, marginLeft: -0.75 },
  antennaDot:{ position: 'absolute', top: -13, left: '50%', width: 6, height: 6, borderRadius: 3, marginLeft: -3 },
  brand:     { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  sub:       { fontFamily: MONO, fontSize: 8, letterSpacing: 0.2, marginTop: 2 },
  badge:     { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt:  { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  clock:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  clockTxt:  { fontFamily: MONO, fontSize: 11, fontWeight: '900' },
  iconBtn:   { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 6, borderTopWidth: 1, borderTopColor: COLOR.cyan + '0F', backgroundColor: '#010508', zIndex: 1 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, maxWidth: 160 },
  connTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', flexShrink: 1 },
  navWrap:   { backgroundColor: '#01050C', borderTopWidth: 1, borderTopColor: COLOR.cyan + '0F', zIndex: 1 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  pillTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.2 },
});

// ══════════════════════════════════════════════════════════════════
// HERO PANEL — mascot + AI chat CTA + quick actions
// ══════════════════════════════════════════════════════════════════
let _MASCOT: any = null;
try { _MASCOT = require('@/assets/images/butler-robot-3d.png'); } catch {
  try { _MASCOT = require('@/assets/images/mascot_shield_v2.png'); } catch {
    try { _MASCOT = require('@/assets/images/nexus-robot-mascot.png'); } catch {}
  }
}

const AI_PROMPTS = [
  '"Run a Python script on my PC remotely"',
  '"Clean temp files and free disk space"',
  '"Which process is killing my CPU?"',
  '"Schedule a backup for tonight 11 PM"',
  '"Show disk usage breakdown by folder"',
];

function HeroPanel({ isConn, goToTab, onQR }: { isConn: boolean; goToTab: (t: string) => void; onQR: () => void }) {
  const floatA  = useRef(new Animated.Value(0)).current; // native — translateY
  const cursorA = useRef(new Animated.Value(1)).current; // native — opacity
  const m       = useRef(true);
  const [promptIdx, setPromptIdx] = useState(0);

  useEffect(() => {
    m.current = true;
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatA,  { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(floatA,  { toValue: 0, duration: 2800, useNativeDriver: true }),
    ]));
    const cursor = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 500,  useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 500,  useNativeDriver: true }),
    ]));
    float.start(); cursor.start();
    const ti = setInterval(() => { if (m.current) setPromptIdx(i => (i + 1) % AI_PROMPTS.length); }, 3400);
    return () => { m.current = false; float.stop(); cursor.stop(); clearInterval(ti); };
  }, []);

  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const cc = isConn ? COLOR.green : COLOR.red;

  return (
    <CyberPanel accentColor={COLOR.cyan} stripe scanline screenWidth={SW}>
      <View style={hero.inner}>
        {/* Mascot */}
        <Animated.View style={[hero.mascotWrap, { transform: [{ translateY: floatY }] }]}>
          {_MASCOT ? (
            <Image source={_MASCOT} style={hero.mascot} contentFit="contain" transition={200} />
          ) : (
            <View style={hero.mascotFallback}>
              <MaterialCommunityIcons name="robot-happy" size={48} color={COLOR.cyan} />
            </View>
          )}
          <View style={[hero.connBadge, { borderColor: cc + '55', backgroundColor: cc + '0C' }]}>
            <PulseDot color={cc} size={4} />
            <Text style={[hero.connBadgeTxt, { color: cc }]}>{isConn ? 'LIVE' : 'PAIR'}</Text>
          </View>
        </Animated.View>

        {/* Title + prompt */}
        <View style={hero.titleCol}>
          <Text style={hero.title}>
            BUTLER<Text style={{ color: COLOR.cyan }}> AI</Text>
          </Text>
          <Text style={hero.sub} numberOfLines={2}>
            Local AI · controls your PC · zero cloud · your hardware
          </Text>
          {/* Prompt box */}
          <View style={[hero.promptBox, { borderColor: COLOR.cyan + '28' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.cyan + '50' }}>{'>'}</Text>
            <Text style={[hero.promptTxt, { color: COLOR.cyan + '70' }]} numberOfLines={2}>
              {AI_PROMPTS[promptIdx]}
            </Text>
            <Animated.View style={{ width: 5, height: 10, backgroundColor: COLOR.cyan + '55', borderRadius: 1, opacity: cursorA }} />
          </View>
        </View>

        {/* CTAs */}
        <View style={hero.ctaCol}>
          <Pressable onPress={() => { haptics.heavy(); goToTab('butler'); }}
            style={({ pressed }) => [hero.ctaMain, { backgroundColor: COLOR.cyan, opacity: pressed ? 0.85 : 1 }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={16} color="#000" />
            <Text style={hero.ctaMainTxt}>CHAT</Text>
          </Pressable>
          <Pressable onPress={() => { haptics.medium(); onQR(); }}
            style={({ pressed }) => [hero.ctaSec, { borderColor: COLOR.green + '55', opacity: pressed ? 0.8 : 1 }]}>
            <MaterialIcons name="qr-code-scanner" size={14} color={COLOR.green} />
            <Text style={[hero.ctaSecTxt, { color: COLOR.green }]}>PAIR</Text>
          </Pressable>
          <Pressable onPress={() => { haptics.light(); goToTab('scripts'); }}
            style={({ pressed }) => [hero.ctaSec, { borderColor: COLOR.magenta + '55', opacity: pressed ? 0.8 : 1 }]}>
            <MaterialIcons name="code" size={14} color={COLOR.magenta} />
            <Text style={[hero.ctaSecTxt, { color: COLOR.magenta }]}>CODE</Text>
          </Pressable>
        </View>
      </View>

      {/* Capability chips */}
      <View style={hero.chips}>
        {[
          { icon: 'shield-check', lib: 'c', label: 'ZERO CLOUD',  sub: 'LAN only',    color: COLOR.green   },
          { icon: 'brain',        lib: 'c', label: 'LOCAL AI',    sub: 'Ollama · LLM',color: COLOR.cyan    },
          { icon: 'code-braces',  lib: 'c', label: '250+ SCRIPTS',sub: 'Python · Bash',color: COLOR.magenta },
          { icon: 'lock',         lib: 'm', label: 'AES-256',     sub: 'E2E encrypted',color: COLOR.amber   },
        ].map((c, i) => {
          const Icon = c.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <View key={i} style={[hero.chip, { borderColor: c.color + '35', backgroundColor: glow(c.color, 8) }]}>
              <View style={[hero.chipIcon, { borderColor: c.color + '50', backgroundColor: glow(c.color, 12) }]}>
                <Icon name={c.icon as any} size={12} color={c.color} />
              </View>
              <View>
                <Text style={[hero.chipLabel, { color: c.color }]}>{c.label}</Text>
                <Text style={[hero.chipSub,   { color: c.color + '60' }]}>{c.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </CyberPanel>
  );
}

const hero = StyleSheet.create({
  inner:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 10, gap: 10 },
  mascotWrap:  { width: 84, alignItems: 'center', flexShrink: 0 },
  mascot:      { width: 80, height: 100 },
  mascotFallback: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  connBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5, marginTop: 6 },
  connBadgeTxt:{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  titleCol:    { flex: 1 },
  title:       { fontFamily: MONO, fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
  sub:         { fontFamily: MONO, fontSize: 8.5, color: COLOR.mid, lineHeight: 13, marginTop: 3, marginBottom: 8 },
  promptBox:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  promptTxt:   { fontFamily: MONO, fontSize: 8.5, flex: 1, lineHeight: 13 },
  ctaCol:      { gap: 7, flexShrink: 0, width: 64 },
  ctaMain:     { alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11, paddingVertical: 10 },
  ctaMainTxt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.3 },
  ctaSec:      { alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11, paddingVertical: 8, borderWidth: 1.5 },
  ctaSecTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PAD, paddingBottom: 14, gap: 7 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, width: `${50 - 1.5}%` as any },
  chipIcon:    { width: 24, height: 24, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipLabel:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  chipSub:     { fontFamily: MONO, fontSize: 7.5 },
});

// ══════════════════════════════════════════════════════════════════
// TELEMETRY DASHBOARD — CPU / RAM / DISK + quick launch
// ══════════════════════════════════════════════════════════════════
const QUICK_ITEMS = [
  { icon: 'lightning-bolt',       lib: 'c', label: 'SCRIPTS',  color: COLOR.magenta, tab: 'scripts'   },
  { icon: 'robot-excited',        lib: 'c', label: 'AI CHAT',  color: COLOR.green,   tab: 'butler'    },
  { icon: 'folder-network-outline',lib:'c', label: 'VAULT',    color: COLOR.pink,    tab: 'fileshare' },
  { icon: 'chart-bar',            lib: 'c', label: 'INTEL',    color: COLOR.amber,   tab: 'logs'      },
  { icon: 'hammer-screwdriver',   lib: 'c', label: 'BUILD',    color: COLOR.yellow,  tab: 'builder'   },
  { icon: 'brain',                lib: 'c', label: 'KB',       color: COLOR.cyan,    tab: 'knowledge' },
  { icon: 'palette-swatch',       lib: 'c', label: 'SKINS',    color: COLOR.magenta, tab: 'cosmetic'  },
  { icon: 'tune-variant',         lib: 'c', label: 'CONFIG',   color: COLOR.mid,     tab: 'settings'  },
];

interface MetricsProps {
  isConn: boolean;
  cpu: number; ram: number; disk: number;
  scripts: number; kbCount: number;
  goToTab: (t: string) => void;
}

function TelemetryDashboard({ isConn, cpu, ram, disk, scripts, kbCount, goToTab }: MetricsProps) {
  const bars = [
    { label: 'CPU',  val: cpu,  color: cpu  > 80 ? COLOR.red : cpu  > 60 ? COLOR.amber : COLOR.cyan   },
    { label: 'RAM',  val: ram,  color: ram  > 85 ? COLOR.red : ram  > 70 ? COLOR.amber : COLOR.green  },
    { label: 'DISK', val: disk, color: disk > 90 ? COLOR.red : disk > 75 ? COLOR.amber : COLOR.yellow },
  ];

  const stats = [
    { label: 'SCRIPTS', value: scripts > 0 ? String(scripts)  : '—', icon: 'code-braces',  lib: 'c', color: COLOR.magenta },
    { label: 'VECTORS', value: kbCount  > 0 ? String(kbCount)  : '—', icon: 'brain',        lib: 'c', color: COLOR.cyan    },
    { label: 'FREE',    value: isConn ? `${Math.max(0, 100 - Math.round(disk))}%` : '—', icon: 'harddisk', lib: 'c', color: COLOR.green },
    { label: 'STATUS',  value: isConn ? 'OK' : 'OFF', icon: 'shield-check', lib: 'c', color: isConn ? COLOR.teal : COLOR.mid },
  ];

  return (
    <CyberPanel accentColor={COLOR.amber} stripe stripeColors={[COLOR.cyan, COLOR.amber, COLOR.green, COLOR.magenta, COLOR.yellow]}>
      {/* Telemetry bars */}
      <View style={tel.section}>
        <View style={tel.sectionHdr}>
          <MaterialIcons name="monitor-heart" size={11} color={COLOR.cyan} />
          <Text style={[tel.sectionTitle, { color: COLOR.cyan }]}>LIVE TELEMETRY</Text>
          <View style={[tel.livePill, { borderColor: (isConn ? COLOR.green : COLOR.red) + '45', backgroundColor: (isConn ? COLOR.green : COLOR.red) + '09' }]}>
            <PulseDot color={isConn ? COLOR.green : COLOR.red} size={4} />
            <Text style={[tel.liveTxt, { color: isConn ? COLOR.green : COLOR.red }]}>{isConn ? 'LIVE' : 'OFFLINE'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {bars.map(b => (
            <View key={b.label} style={[tel.metricCard, { borderTopColor: b.color, borderColor: b.color + '28' }]}>
              <Text style={[tel.metricLbl, { color: b.color + '80' }]}>{b.label}</Text>
              <Text style={[tel.metricVal, { color: b.color }]}>
                {isConn ? `${Math.round(b.val)}%` : '—'}
              </Text>
              <View style={tel.metricTrack}>
                <View style={[tel.metricFill, { width: `${isConn ? b.val : 0}%` as any, backgroundColor: b.color }]} />
              </View>
              <View style={[tel.metricPill, { borderColor: b.color + '40', backgroundColor: b.color + '09' }]}>
                <PulseDot color={isConn ? b.color : COLOR.mid} size={4} />
                <Text style={[tel.metricPillTxt, { color: isConn ? b.color : COLOR.mid }]}>
                  {isConn ? (b.val > 80 ? 'WARN' : 'OK') : 'OFF'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Divider />

      {/* Stat cards */}
      <View style={tel.section}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {stats.map((s, i) => {
            const Icon = s.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <View key={i} style={[tel.statCard, { borderTopColor: s.color, borderColor: s.color + '28' }]}>
                <View style={{ position: 'absolute', top: 7, right: 8, opacity: 0.3 }}>
                  <Icon name={s.icon as any} size={14} color={s.color} />
                </View>
                <Text style={[tel.statVal, { color: s.color }]} adjustsFontSizeToFit minimumFontScale={0.4} numberOfLines={1}>{s.value}</Text>
                <Text style={[tel.statLbl, { color: s.color + '60' }]}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Divider />

      {/* Quick launch grid */}
      <View style={tel.section}>
        <View style={tel.sectionHdr}>
          <MaterialCommunityIcons name="rocket-launch" size={11} color={COLOR.amber} />
          <Text style={[tel.sectionTitle, { color: COLOR.amber }]}>QUICK LAUNCH</Text>
        </View>
        <View style={tel.grid}>
          {QUICK_ITEMS.map((q, i) => {
            const Icon = q.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <TouchableOpacity key={i} onPress={() => { haptics.light(); goToTab(q.tab); }} activeOpacity={0.75}
                style={tel.gridCell}>
                <View style={[tel.gridCard, { borderTopColor: q.color, borderColor: q.color + '35' }]}>
                  <View style={[tel.gridIcon, { borderColor: q.color + '55', backgroundColor: glow(q.color, 10) }]}>
                    <Icon name={q.icon as any} size={19} color={q.color} />
                  </View>
                  <Text style={[tel.gridLbl, { color: q.color }]}>{q.label}</Text>
                  <View style={[tel.gridBar, { backgroundColor: q.color }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </CyberPanel>
  );
}

const tel = StyleSheet.create({
  section:    { paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 11 },
  sectionHdr: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle:{ fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, flex: 1 },
  livePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  liveTxt:    { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  metricCard: { flex: 1, backgroundColor: COLOR.surf2, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, padding: 11, alignItems: 'center', overflow: 'hidden' },
  metricLbl:  { fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  metricVal:  { fontFamily: MONO, fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  metricTrack:{ width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  metricFill: { height: '100%', borderRadius: 2 },
  metricPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, marginTop: 7 },
  metricPillTxt: { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  statCard:   { flex: 1, backgroundColor: COLOR.surf2, borderRadius: 10, borderWidth: 1.5, borderTopWidth: 3, padding: 10, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  statVal:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: -1, lineHeight: 24 },
  statLbl:    { fontFamily: MONO, fontSize: 7, fontWeight: '700', letterSpacing: 0.5 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell:   { width: `${25 - 2}%` as any },
  gridCard:   { alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 13, borderWidth: 1.5, borderTopWidth: 3, backgroundColor: COLOR.surf2, overflow: 'hidden', position: 'relative' },
  gridIcon:   { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  gridLbl:    { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center', paddingHorizontal: 2 },
  gridBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.5 },
});

// ══════════════════════════════════════════════════════════════════
// AI CAPABILITIES SHOWCASE — horizontal scroll
// ══════════════════════════════════════════════════════════════════
const FEATURES = [
  { icon: 'robot-happy',           lib: 'c', title: 'LOCAL AI CHAT',   sub: 'Ollama · LLaMA · Mistral',   color: COLOR.cyan,    badge: 'LAN-ONLY', tab: 'butler'    },
  { icon: 'code-braces-box',       lib: 'c', title: '250+ SCRIPTS',    sub: 'Python · Bash · PowerShell', color: COLOR.magenta, badge: 'FORGE',    tab: 'scripts'   },
  { icon: 'brain',                 lib: 'c', title: 'SIGMA-NET KB',    sub: 'Auto-learning vectors',       color: COLOR.amber,   badge: 'NEURAL',   tab: 'knowledge' },
  { icon: 'shield-lock',           lib: 'c', title: 'AES-256 VAULT',   sub: 'Dead man switch · DNA',       color: COLOR.green,   badge: 'SECURE',   tab: 'fileshare' },
  { icon: 'desktop-tower-monitor', lib: 'c', title: 'PC REMOTE',       sub: 'Execute · Monitor · Sched',  color: COLOR.blue,    badge: 'LIVE',     tab: 'nexushome' },
  { icon: 'pipe',                  lib: 'c', title: 'PIPELINE',        sub: 'Drag-drop automation',        color: COLOR.yellow,  badge: 'BUILD',    tab: 'builder'   },
  { icon: 'wifi-off',              lib: 'c', title: 'ZERO CLOUD',      sub: 'Your PC · Your data',         color: COLOR.teal,    badge: 'PRIVATE',  tab: 'settings'  },
  { icon: 'satellite-uplink',      lib: 'c', title: 'REMOTE ACCESS',   sub: 'Tailscale · Cloudflare',      color: COLOR.pink,    badge: 'PRO',      tab: 'nexushome' },
];

function AICapabilities({ goToTab }: { goToTab: (t: string) => void }) {
  return (
    <View style={{ backgroundColor: COLOR.surf, borderWidth: 1, borderColor: COLOR.border, ...SHADOW.dark }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 14, gap: 9 }}>
        {FEATURES.map((f, i) => {
          const Icon = f.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          return (
            <TouchableOpacity key={i} onPress={() => { haptics.light(); goToTab(f.tab); }} activeOpacity={0.82}
              style={[feat.card, { borderColor: f.color + '45', borderTopColor: f.color }]}>
              <View style={[feat.iconBox, { borderColor: f.color + '55', backgroundColor: glow(f.color, 10) }]}>
                <Icon name={f.icon as any} size={22} color={f.color} />
              </View>
              <Text style={[feat.title, { color: f.color }]}>{f.title}</Text>
              <Text style={[feat.sub,   { color: COLOR.mid }]}>{f.sub}</Text>
              <View style={[feat.badge, { borderColor: f.color + '40', backgroundColor: glow(f.color, 8) }]}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: f.color }} />
                <Text style={[feat.badgeTxt, { color: f.color }]}>{f.badge}</Text>
              </View>
              <View style={[feat.bar, { backgroundColor: f.color }]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const feat = StyleSheet.create({
  card:    { width: 128, backgroundColor: COLOR.surf2, borderWidth: 1.5, borderTopWidth: 3, borderRadius: 13, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 10, gap: 5, overflow: 'hidden', position: 'relative' },
  iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  title:   { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', lineHeight: 13 },
  sub:     { fontFamily: MONO, fontSize: 7.5, lineHeight: 11 },
  badge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5, alignSelf: 'flex-start', marginTop: 3 },
  badgeTxt:{ fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  bar:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.4 },
});

// ══════════════════════════════════════════════════════════════════
// QUICK SCRIPTS PANEL
// ══════════════════════════════════════════════════════════════════
const Q_SCRIPTS = [
  { id: 's1', icon: 'desktop-mac',     lib: 'c', label: 'SYS INFO',  color: COLOR.cyan,
    script: `import platform,socket\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"Host: {socket.gethostname()}")` },
  { id: 's2', icon: 'broom',           lib: 'c', label: 'CLEAN TMP', color: COLOR.green,
    script: `import shutil,os,tempfile\nfreed=0;n=0\nfor item in os.listdir(tempfile.gettempdir()):\n fp=os.path.join(tempfile.gettempdir(),item)\n try:\n  sz=os.path.getsize(fp) if os.path.isfile(fp) else 0\n  (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)\n  freed+=sz;n+=1\n except:pass\nprint(f"Cleared {n} items, freed {freed//1024//1024}MB")` },
  { id: 's3', icon: 'harddisk',        lib: 'c', label: 'DISK USE',  color: COLOR.blue,
    script: `import psutil\nfor p in psutil.disk_partitions():\n try:\n  u=psutil.disk_usage(p.mountpoint)\n  print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")\n except:pass` },
  { id: 's4', icon: 'wifi-strength-4', lib: 'c', label: 'NETWORK',   color: COLOR.amber,
    script: `import psutil,socket\nnet=psutil.net_io_counters()\nprint(f"Sent: {net.bytes_sent/1024/1024:.1f}MB\\nRecv: {net.bytes_recv/1024/1024:.1f}MB")\ns=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)\ns.connect(("8.8.8.8",80));ip=s.getsockname()[0];s.close()\nprint(f"IP: {ip}")` },
  { id: 's5', icon: 'memory',          lib: 'c', label: 'PROCS',     color: COLOR.magenta,
    script: `import psutil\nprocs=sorted(psutil.process_iter(['name','cpu_percent']),key=lambda p:p.info['cpu_percent'] or 0,reverse=True)[:6]\nfor p in procs: print(f"{p.info['name'][:18]:18} CPU:{p.info['cpu_percent']:.1f}%")` },
  { id: 's6', icon: 'battery-charging',lib: 'c', label: 'BATTERY',   color: '#AAFF00',
    script: `import psutil\nb=psutil.sensors_battery()\nif b: print(f"Level: {b.percent:.0f}%\\nPlugged: {b.power_plugged}")\nelse: print("No battery (desktop?)")` },
];

function QuickScripts({ isConn }: { isConn: boolean }) {
  const [running, setRunning] = useState<string | null>(null);
  const [output,  setOutput]  = useState<{ label: string; text: string; ok: boolean } | null>(null);

  const run = async (s: typeof Q_SCRIPTS[0]) => {
    if (!isConn || running) return;
    haptics.heavy(); setRunning(s.id); setOutput(null);
    try {
      const ip  = serverConnection.getIP();
      const port = serverConnection.getPort();
      const tok  = serverConnection.getToken?.() || '';
      if (!ip || !port) throw new Error('Not connected');
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 28000);
      const res = await fetch(`http://${ip}:${port}/api/execute`, { method: 'POST', headers: h, body: JSON.stringify({ script: s.script }), signal: ctrl.signal });
      const d = await res.json();
      setOutput({ label: s.label, text: (d.output || d.error || 'Done').trim().slice(0, 500), ok: !d.error });
      haptics.success();
    } catch (e: any) {
      setOutput({ label: s.label, text: 'Error: ' + (e?.message || 'Network failed'), ok: false });
    } finally { setRunning(null); }
  };

  return (
    <CyberPanel accentColor={COLOR.green} stripe stripeColors={[COLOR.green, COLOR.cyan, COLOR.teal, COLOR.green, COLOR.cyan]}>
      <View style={qs.header}>
        <MaterialCommunityIcons name="code-braces-box" size={13} color={COLOR.green} />
        <Text style={[qs.headerTxt, { color: COLOR.green }]}>QUICK PC SCRIPTS</Text>
        <View style={{ flex: 1 }} />
        <View style={[qs.statusPill, { borderColor: (isConn ? COLOR.green : COLOR.red) + '45', backgroundColor: (isConn ? COLOR.green : COLOR.red) + '09' }]}>
          <PulseDot color={isConn ? COLOR.green : COLOR.red} size={4} />
          <Text style={[qs.statusTxt, { color: isConn ? COLOR.green : COLOR.red }]}>{isConn ? 'PC READY' : 'OFFLINE'}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PAD, paddingBottom: output ? 0 : PAD }}>
        {Q_SCRIPTS.map(s => {
          const Icon = s.lib === 'c' ? MaterialCommunityIcons : MaterialIcons;
          const isRun = running === s.id;
          return (
            <Pressable key={s.id} onPress={() => run(s)} disabled={!isConn || !!running}
              style={({ pressed }) => ({
                width: '33.33%', alignItems: 'center', paddingVertical: 13,
                opacity: !isConn ? 0.3 : 1,
                backgroundColor: pressed && isConn ? glow(s.color, 10) : 'transparent',
                borderRadius: 8,
              })}>
              <View style={[qs.scriptIcon, { borderTopColor: s.color, borderColor: s.color + '30', backgroundColor: glow(s.color, 8) }]}>
                {isRun
                  ? <ActivityIndicator size="small" color={s.color} />
                  : <Icon name={s.icon as any} size={20} color={s.color} />
                }
              </View>
              <Text style={[qs.scriptLbl, { color: s.color }]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {output && (
        <View style={{ paddingHorizontal: PAD, paddingBottom: PAD }}>
          <View style={[qs.outBox, { borderColor: (output.ok ? COLOR.green : COLOR.red) + '55', backgroundColor: (output.ok ? COLOR.green : COLOR.red) + '07' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <MaterialIcons name={output.ok ? 'check-circle' : 'error'} size={13} color={output.ok ? COLOR.green : COLOR.red} />
              <Text style={[qs.outLabel, { color: output.ok ? COLOR.green : COLOR.red }]}>{output.label}</Text>
              <TouchableOpacity onPress={() => setOutput(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 'auto' }}>
                <MaterialIcons name="close" size={14} color={COLOR.mid} />
              </TouchableOpacity>
            </View>
            <Text style={[qs.outTxt, { color: output.ok ? COLOR.green : COLOR.red }]} selectable>{output.text}</Text>
          </View>
        </View>
      )}
    </CyberPanel>
  );
}

const qs = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 11 },
  headerTxt: { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  statusPill:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  statusTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  scriptIcon:{ width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderTopWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  scriptLbl: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', textAlign: 'center' },
  outBox:    { borderWidth: 1.5, borderRadius: 11, padding: 11 },
  outLabel:  { fontFamily: MONO, fontSize: 10, fontWeight: '900', flex: 1 },
  outTxt:    { fontFamily: MONO, fontSize: 10.5, lineHeight: 17 },
});

// ══════════════════════════════════════════════════════════════════
// SESSION FOOTER
// ══════════════════════════════════════════════════════════════════
function SessionFooter({ isConn, addr }: { isConn: boolean; addr: string }) {
  const rows: [string, string, string][] = [
    ['version',   '7.3.0',                        COLOR.green],
    ['telemetry', 'DISABLED',                      COLOR.green],
    ['cloud',     'DISABLED',                      COLOR.green],
    ['crypto',    'AES-256 + HMAC-SHA256',         COLOR.mid  ],
    ['storage',   'DEVICE ONLY',                   COLOR.green],
    ['server',    isConn ? (addr || 'LINKED') : 'NOT CONNECTED', isConn ? COLOR.green : COLOR.red],
  ];
  return (
    <View style={foot.outer}>
      <View style={foot.chrome}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
        ))}
        <Text style={foot.chromeTitle}>butler@nexus — session</Text>
        <View style={[foot.secureBadge, { borderColor: COLOR.green + '35', backgroundColor: glow(COLOR.green, 8) }]}>
          <Text style={[foot.secureTxt, { color: COLOR.green }]}>SECURE</Text>
        </View>
      </View>
      <View style={foot.body}>
        {rows.map(([k, v, col], i) => (
          <View key={i} style={foot.row}>
            <Text style={foot.key}>  {k}:</Text>
            <Text style={[foot.val, { color: col }]}>{v}</Text>
          </View>
        ))}
        <View style={foot.statusRow}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isConn ? COLOR.green : COLOR.red }} />
          <Text style={[foot.statusTxt, { color: isConn ? COLOR.green : COLOR.red }]}>
            {isConn ? 'CONNECTED · HMAC token active' : 'OFFLINE · scan QR to pair PC'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Text style={foot.prompt}>$</Text>
          <View style={{ width: 6, height: 11, backgroundColor: COLOR.cyan + '50', borderRadius: 1 }} />
        </View>
      </View>
      <View style={{ height: 3, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c,i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
    </View>
  );
}

const foot = StyleSheet.create({
  outer:       { backgroundColor: '#010207', borderRadius: 14, borderWidth: 1, borderColor: COLOR.cyan + '20', overflow: 'hidden', marginBottom: 28 },
  chrome:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#020509', borderBottomWidth: 1, borderBottomColor: COLOR.cyan + '12' },
  chromeTitle: { flex: 1, fontFamily: MONO, fontSize: 8, color: COLOR.cyan + '50', letterSpacing: 0.3, textAlign: 'center' },
  secureBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  secureTxt:   { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  body:        { padding: 13, gap: 4 },
  row:         { flexDirection: 'row', gap: 8 },
  key:         { fontFamily: MONO, fontSize: 8.5, color: COLOR.dim, width: 72 },
  val:         { fontFamily: MONO, fontSize: 8.5, flex: 1 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
  statusTxt:   { fontFamily: MONO, fontSize: 8.5 },
  prompt:      { fontFamily: MONO, fontSize: 8.5, color: COLOR.cyan + '55' },
});

// ══════════════════════════════════════════════════════════════════
// CONNECT MODAL
// ══════════════════════════════════════════════════════════════════
function ConnectModal({ visible, onClose, onConnected }: {
  visible: boolean; onClose: () => void; onConnected: () => void;
}) {
  const [ip,      setIp]      = useState('');
  const [port,    setPort]    = useState('8766');
  const [status,  setStatus]  = useState('');
  const [busy,    setBusy]    = useState(false);
  const [showCam, setShowCam] = useState(false);
  const scanned = useRef(false);

  const handleQR = useCallback(async (data: string) => {
    if (scanned.current) return;
    scanned.current = true; setShowCam(false); haptics.success();
    try {
      const p = parseQRConnection(data);
      if (p?.ip) {
        setIp(p.ip); if (p.port) setPort(String(p.port));
        setStatus(`Connecting to ${p.ip}...`); setBusy(true);
        const r = await (serverConnection.connectManual
          ? serverConnection.connectManual(p.ip, String(p.port || port))
          : Promise.resolve({ success: false, error: 'N/A' }));
        setBusy(false);
        if ((r as any).success) { haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 600); return; }
        throw new Error((r as any).error || 'Failed');
      }
    } catch (e: any) { setBusy(false); setStatus('Error: ' + (e?.message || 'Failed')); }
    const m = data.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?/);
    if (m) { setIp(m[1]); if (m[2]) setPort(m[2]); setStatus(`Found IP: ${m[1]}`); }
    else   { setStatus(`Scanned: ${data.slice(0, 40)}`); scanned.current = false; }
  }, [port, onConnected, onClose]);

  const connect = async () => {
    if (!ip.trim()) { setStatus('Enter IP address'); return; }
    setBusy(true); setStatus(`Connecting to ${ip.trim()}...`);
    try {
      const r = await (serverConnection.connectManual
        ? serverConnection.connectManual(ip.trim(), port.trim())
        : Promise.resolve({ success: false, error: 'N/A' }));
      if ((r as any).success) { setStatus('Connected!'); haptics.success(); setTimeout(() => { onConnected(); onClose(); }, 500); }
      else throw new Error((r as any).error || 'Failed');
    } catch (e: any) { setStatus('Error: ' + (e?.message || 'Failed')); }
    setBusy(false);
  };

  if (!visible) return null;
  const statusColor = status.includes('Error') ? COLOR.red : status.includes('Connected') ? COLOR.green : COLOR.amber;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <View style={conn.sheet}>
          <View style={{ height: 3, backgroundColor: COLOR.cyan }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, paddingBottom: 12 }}>
            <MaterialIcons name="qr-code-scanner" size={20} color={COLOR.cyan} />
            <Text style={conn.title}>PAIR YOUR PC</Text>
            <Pressable onPress={onClose} style={conn.closeBtn}>
              <MaterialIcons name="close" size={15} color={COLOR.mid} />
            </Pressable>
          </View>
          {showCam ? (
            <View style={conn.camWrap}>
              <Suspense fallback={null}>
                <QRCameraScanner onScanned={handleQR} hudColor={COLOR.cyan}>
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={{ width: 110, height: 110, borderWidth: 2, borderColor: COLOR.cyan + '60', borderRadius: 4 }} />
                    <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.cyan, marginTop: 9, fontWeight: '900', letterSpacing: 1 }}>SCAN QR FROM TERMINAL</Text>
                  </View>
                </QRCameraScanner>
              </Suspense>
              <TouchableOpacity onPress={() => setShowCam(false)} style={conn.camClose}>
                <MaterialIcons name="close" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { scanned.current = false; setShowCam(true); }} activeOpacity={0.82}
              style={conn.scanBtn}>
              <MaterialIcons name="qr-code-scanner" size={18} color={COLOR.cyan} />
              <View>
                <Text style={conn.scanBtnTxt}>SCAN QR CODE</Text>
                <Text style={conn.scanBtnSub}>Run butler_server.py → scan QR in terminal</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLOR.dim }} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.mid }}>OR ENTER IP</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLOR.dim }} />
          </View>
          <View style={{ paddingHorizontal: 16, gap: 9 }}>
            <TextInput value={ip} onChangeText={setIp} placeholder="192.168.x.x" placeholderTextColor={COLOR.dim}
              style={conn.input} keyboardType="numeric" autoCorrect={false} />
            <TextInput value={port} onChangeText={setPort} placeholder="8766" placeholderTextColor={COLOR.dim}
              style={[conn.input, { borderColor: COLOR.cyan + '30' }]} keyboardType="numeric" />
          </View>
          {!!status && (
            <View style={[conn.statusBox, { borderColor: statusColor + '45', backgroundColor: glow(statusColor, 8) }]}>
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: statusColor }}>{status}</Text>
            </View>
          )}
          <Pressable onPress={connect} disabled={busy}
            style={({ pressed }) => [conn.connectBtn, { opacity: pressed || busy ? 0.8 : 1 }]}>
            {busy ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="link" size={18} color="#000" />}
            <Text style={conn.connectTxt}>{busy ? 'CONNECTING...' : 'CONNECT TO PC'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const conn = StyleSheet.create({
  sheet:      { backgroundColor: COLOR.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 44, overflow: 'hidden' },
  title:      { fontFamily: MONO, fontSize: 15, fontWeight: '900', color: COLOR.text, flex: 1 },
  closeBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: COLOR.surf2, alignItems: 'center', justifyContent: 'center' },
  camWrap:    { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: COLOR.cyan + '70' },
  camClose:   { position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  scanBtn:    { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderRadius: 12, borderColor: COLOR.cyan + '55', backgroundColor: glow(COLOR.cyan, 8), paddingVertical: 13, paddingHorizontal: 14 },
  scanBtnTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.cyan },
  scanBtnSub: { fontFamily: MONO, fontSize: 8.5, color: COLOR.mid, marginTop: 2 },
  input:      { backgroundColor: COLOR.bg, borderWidth: 1.5, borderColor: COLOR.cyan + '55', borderRadius: 11, color: COLOR.text, padding: 13, fontFamily: MONO, fontSize: 13 },
  statusBox:  { marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  connectBtn: { margin: 16, marginBottom: 0, backgroundColor: COLOR.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  connectTxt: { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
});

// ══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
function NexusHomeInner() {
  const insets  = useSafeAreaInsets();
  const [isConn,   setIsConn]   = useState(false);
  const [addr,     setAddr]     = useState('');
  const [latency,  setLatency]  = useState(0);
  const [metrics,  setMetrics]  = useState({ cpu: 0, ram: 0, disk: 0 });
  const [scripts,  setScripts]  = useState(0);
  const [kbCount,  setKbCount]  = useState(0);
  const [showQR,   setShowQR]   = useState(false);
  const [refresh,  setRefresh]  = useState(false);

  const loadData = useCallback(async () => {
    try {
      const conn = serverConnection.isConnected?.() ?? false;
      const ip   = serverConnection.getIP?.()   || '';
      const port = serverConnection.getPort?.() || '';
      setIsConn(conn);
      setAddr(ip && port ? `${ip}:${port}` : '');
      if (conn && ip && port) {
        const tok  = serverConnection.getToken?.() || '';
        const h: Record<string,string> = {};
        if (tok) h['Authorization'] = 'Bearer ' + tok;
        const ctrl = new AbortController();
        const t0   = Date.now();
        setTimeout(() => ctrl.abort(), 7000);
        try {
          const res = await fetch(`http://${ip}:${port}/api/metrics`, { headers: h, signal: ctrl.signal });
          if (res.ok) {
            const d = await res.json();
            setLatency(Date.now() - t0);
            setMetrics({
              cpu:  d.cpu_percent  ?? d.cpu?.percent    ?? 0,
              ram:  d.ram_percent  ?? d.memory?.percent ?? 0,
              disk: d.disk_percent ?? d.disk?.percent   ?? 0,
            });
            performanceHistory.recordFromMetrics(d);
          }
        } catch {}
      }
    } catch {}
    try {
      const h = await executionHistory.getAll().catch(() => [] as any[]);
      setScripts(Array.isArray(h) ? h.length : 0);
    } catch {}
    try {
      const stats = await knowledgeAccumulator.getStats?.().catch(() => null);
      if (stats) setKbCount(stats.totalFindings ?? 0);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, [loadData]));

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      const s = connectionHub.getState();
      setIsConn(s.isConnected ?? false);
      setAddr(s.addr || '');
      unsub = connectionHub.subscribe((st: any) => {
        setIsConn(st.isConnected ?? false);
        setAddr(st.addr || '');
        if (st.isConnected) loadData();
      });
    } catch {}
    return () => { unsub?.(); };
  }, [loadData]);

  useEffect(() => {
    (global as any).__nexusHomeOpenQR = () => setShowQR(true);
    return () => { delete (global as any).__nexusHomeOpenQR; };
  }, []);

  const goToTab = useCallback((tab: string) => {
    haptics.light();
    try { (global as any).__butlerSwitchTab?.(tab); } catch {}
  }, []);

  const onRefresh = useCallback(async () => {
    setRefresh(true); haptics.medium();
    await loadData();
    haptics.success(); setRefresh(false);
  }, [loadData]);

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
      <ConnectModal visible={showQR} onClose={() => setShowQR(false)} onConnected={loadData} />

      {/* ── HEADER ── */}
      <NexusHeader
        safeTop={insets.top}
        isConn={isConn} addr={addr} latency={latency}
        onQR={() => setShowQR(true)}
        onRefresh={onRefresh}
        goToTab={goToTab}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 260 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refresh} onRefresh={onRefresh}
            tintColor={COLOR.cyan}
            colors={[COLOR.cyan, COLOR.green, COLOR.magenta]}
            progressBackgroundColor={COLOR.surf}
          />
        }
      >
        {/* ── HERO ── */}
        <HeroPanel isConn={isConn} goToTab={goToTab} onQR={() => setShowQR(true)} />

        {/* ── REMOTE ACCESS ── */}
        <SectionLabel icon="remote-desktop" label="REMOTE ACCESS" color={COLOR.cyan} />
        <View style={{ paddingHorizontal: PAD }}>
          <RemoteAccessMonetizationCard onConnected={loadData} />
        </View>

        {/* ── TELEMETRY DASHBOARD ── */}
        <SectionLabel icon="monitor-dashboard" label="SYSTEM METRICS" color={COLOR.amber} />
        <TelemetryDashboard
          isConn={isConn}
          cpu={metrics.cpu} ram={metrics.ram} disk={metrics.disk}
          scripts={scripts} kbCount={kbCount}
          goToTab={goToTab}
        />

        {/* ── AI CAPABILITIES ── */}
        <SectionLabel icon="star-four-points" label="AI CAPABILITIES" color={COLOR.magenta} />
        <AICapabilities goToTab={goToTab} />

        {/* ── QUICK SCRIPTS ── */}
        <SectionLabel icon="code-braces-box" label="QUICK PC SCRIPTS" color={COLOR.green} />
        <QuickScripts isConn={isConn} />

        {/* ── NEXUS VAULT ── */}
        <SectionLabel icon="shield-lock" label="NEXUS VAULT SECURITY" color={COLOR.green} />
        <View style={{ paddingHorizontal: PAD }}>
          <NexusVaultCard isConnected={isConn} serverLatencyMs={latency} />
        </View>

        {/* ── SESSION FOOTER ── */}
        <SectionLabel icon="terminal" label="SESSION LOG" color={COLOR.mid} />
        <View style={{ paddingHorizontal: PAD, paddingTop: 4 }}>
          <SessionFooter isConn={isConn} addr={addr} />
        </View>
      </ScrollView>
    </View>
  );
}

export default function NexusHomeScreen() {
  return (
    <TabErrorBoundary name="Core">
      <NexusHomeInner />
    </TabErrorBoundary>
  );
}
