/**
 * BUTLER AI — NexusHero Component
 * Responsive hero section: status chips · gradient title · scan beam · 4 stat tiles · CTAs
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';

const { width: SW_RAW } = Dimensions.get('window');
const SW = Math.max(320, SW_RAW);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const C = {
  bg:     '#020509',
  surf:   '#06101A',
  surf2:  '#0B1826',
  cyan:   '#00D8F0',
  green:  '#00E880',
  amber:  '#FFB020',
  purple: '#BB55FF',
  blue:   '#4A9AFF',
  teal:   '#00CCA8',
  red:    '#FF3A5A',
  text:   '#CCE4F4',
  mid:    '#4A7090',
  dim:    '#172030',
  border: 'rgba(0,216,240,0.13)',
};

// ── Pulse dot ─────────────────────────────────────────────────────
function PulseDot({ color, size = 6, delay = 0 }: { color: string; size?: number; delay?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ── HUD corners ───────────────────────────────────────────────────
function HudCorners({ color, size = 10, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const b: any = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[b, { top: 0, left: 0,     borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { top: 0, right: 0,    borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[b, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t,  borderColor: color }]} />
    </>
  );
}

// ── Shimmer card (CTA button) ──────────────────────────────────────
function ShimmerBtn({
  icon, label, sub, color, onPress, solid,
}: {
  icon: string; label: string; sub?: string; color: string;
  onPress: () => void; solid?: boolean;
}) {
  const shimX = useRef(new Animated.Value(-180)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimX, { toValue: 240, duration: 1800, useNativeDriver: true }),
      Animated.timing(shimX, { toValue: -180, duration: 0, useNativeDriver: true }),
      Animated.delay(3200),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleA }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scaleA, { toValue: 0.95, tension: 400, friction: 12, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleA, { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start()}
        onPress={() => { haptics.heavy(); onPress(); }}
        style={[sb.btn, {
          backgroundColor: solid ? color : color + '14',
          borderColor: color + (solid ? 'FF' : '70'),
          overflow: 'hidden',
          ...Platform.select({
            ios: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: solid ? 0.5 : 0.2, shadowRadius: 10 },
            android: { elevation: solid ? 7 : 3 },
          }),
        }]}>
        {/* shimmer */}
        <Animated.View pointerEvents="none"
          style={[sb.shim, { transform: [{ translateX: shimX }, { skewX: '-18deg' }] }]} />
        <MaterialCommunityIcons name={icon as any} size={18} color={solid ? '#000' : color} />
        <View style={{ flex: 1 }}>
          <Text style={[sb.label, { color: solid ? '#000' : color }]}>{label}</Text>
          {sub ? <Text style={[sb.sub, { color: solid ? '#000000AA' : C.mid }]}>{sub}</Text> : null}
        </View>
        <MaterialIcons name="chevron-right" size={16} color={solid ? '#000' : color + '70'} />
      </Pressable>
    </Animated.View>
  );
}
const sb = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5 },
  shim:  { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  label: { fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
  sub:   { fontFamily: MONO, fontSize: 9, marginTop: 2 },
});

// ── 4 animated stat tiles ─────────────────────────────────────────
const STAT_DEFS = [
  { icon: 'code-braces',            color: '#00D8F0', label: '250+',     sub: 'SCRIPTS'  },
  { icon: 'robot-happy-outline',    color: '#BB55FF', label: '100%',     sub: 'LOCAL AI' },
  { icon: 'shield-lock-outline',    color: '#00E880', label: 'AES',      sub: '256-GCM'  },
  { icon: 'cloud-off-outline',      color: '#FFB020', label: 'ZERO',     sub: 'CLOUD'    },
];

function StatTiles() {
  const scaleAnims = useRef(STAT_DEFS.map(() => new Animated.Value(0))).current;
  const opAnims    = useRef(STAT_DEFS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    STAT_DEFS.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(opAnims[i],    { toValue: 1, duration: 300, delay: i * 80, useNativeDriver: true }),
        Animated.spring(scaleAnims[i], { toValue: 1, tension: 160, friction: 14, delay: i * 80, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const TILE_W = (SW - 32 - 9 * 3) / 4;

  return (
    <View style={{ flexDirection: 'row', gap: 9 }}>
      {STAT_DEFS.map((t, i) => (
        <Animated.View key={i} style={{
          width: TILE_W, opacity: opAnims[i],
          transform: [{ scale: scaleAnims[i] }],
        }}>
          <View style={[stile.root, {
            borderColor: t.color + '40', borderTopColor: t.color,
            ...Platform.select({
              ios: { shadowColor: t.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
              android: { elevation: 4 },
            }),
          }]}>
            <HudCorners color={t.color + '30'} size={6} t={1.2} />
            <PulseDot color={t.color} size={5} delay={i * 200} />
            <View style={{ width: 28, height: 28, marginTop: 4, borderRadius: 8, borderWidth: 1, borderColor: t.color + '45', backgroundColor: t.color + '12', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={t.icon as any} size={15} color={t.color} />
            </View>
            <Text style={[stile.big, { color: t.color }]}>{t.label}</Text>
            <Text style={stile.sub}>{t.sub}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
const stile = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, gap: 5, borderRadius: 12, borderWidth: 1, borderTopWidth: 2.5, backgroundColor: '#060E18', overflow: 'hidden', position: 'relative' },
  big:  { fontFamily: MONO, fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  sub:  { fontFamily: MONO, fontSize: 7, color: C.mid, letterSpacing: 0.8, textAlign: 'center' },
});

// ─── MAIN HERO ────────────────────────────────────────────────────
interface NexusHeroProps {
  isConnected:  boolean;
  serverAddr:   string;
  kbCount:      number;
  scripts:      number;
  onPair:       () => void;
  goToTab:      (t: string) => void;
}

export function NexusHero({
  isConnected, serverAddr, kbCount, scripts, onPair, goToTab,
}: NexusHeroProps) {
  // Scan beam — native translateX
  const scanA = useRef(new Animated.Value(-SW * 0.3)).current;
  // Ring pulse — native scale
  const ringA = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW * 1.2, duration: 2600, useNativeDriver: true }),
      Animated.timing(scanA, { toValue: -SW * 0.3, duration: 0, useNativeDriver: true }),
      Animated.delay(5000),
    ]));
    const ringLoop = Animated.loop(Animated.sequence([
      Animated.timing(ringA, { toValue: 1.02, duration: 1400, useNativeDriver: true }),
      Animated.timing(ringA, { toValue: 0.94, duration: 1400, useNativeDriver: true }),
    ]));
    scanLoop.start();
    ringLoop.start();
    return () => { scanLoop.stop(); ringLoop.stop(); };
  }, []);

  const cc = isConnected ? C.green : C.amber;
  const STRIPE = [C.cyan, C.green, C.purple, C.amber, C.blue];

  return (
    <View style={nh.root}>
      {/* 5-color stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {STRIPE.map((col, i) => <View key={i} style={{ flex: 1, backgroundColor: col }} />)}
      </View>

      {/* Scan beam */}
      <Animated.View pointerEvents="none"
        style={[nh.scanBeam, { transform: [{ translateX: scanA }] }]} />

      {/* Header row */}
      <View style={nh.headerRow}>
        {/* Status chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          <View style={[nh.chip, { borderColor: cc + '60', backgroundColor: cc + '0E' }]}>
            <PulseDot color={cc} size={5} />
            <Text style={[nh.chipTxt, { color: cc }]}>{isConnected ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
          <View style={[nh.chip, { borderColor: C.purple + '50', backgroundColor: C.purple + '0A' }]}>
            <MaterialCommunityIcons name="robot-happy-outline" size={9} color={C.purple} />
            <Text style={[nh.chipTxt, { color: C.purple }]}>LOCAL AI</Text>
          </View>
          <View style={[nh.chip, { borderColor: C.green + '45', backgroundColor: C.green + '08' }]}>
            <MaterialIcons name="lock" size={9} color={C.green} />
            <Text style={[nh.chipTxt, { color: C.green }]}>AES-256</Text>
          </View>
        </View>
        {/* Animated ring badge */}
        <Animated.View style={[nh.ringBadge, { borderColor: cc + '70', transform: [{ scale: ringA }] }]}>
          <PulseDot color={cc} size={7} />
        </Animated.View>
      </View>

      {/* Gradient-style title */}
      <View style={nh.titleBlock}>
        <Text style={nh.eyebrow}>AI COMMAND CENTER · PC AUTOMATION</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={[nh.titleWhite]}>BUTLER</Text>
          <Text style={[nh.titleCyan]}> AI</Text>
        </View>
        {isConnected && serverAddr ? (
          <Text style={[nh.serverAddr]} numberOfLines={1}>
            {'⬡ NEXUS-CORE · '}{serverAddr}
          </Text>
        ) : (
          <Text style={nh.serverAddr}>⬡ SELF-HOSTED · PRIVATE · ZERO CLOUD</Text>
        )}
      </View>

      {/* Stat tiles */}
      <View style={{ paddingHorizontal: 14, marginBottom: 12 }}>
        <StatTiles />
      </View>

      {/* CTA row */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', gap: 9 }}>
        <ShimmerBtn
          icon="qr-code-scanner"
          label={isConnected ? 'PAIRED ✓' : 'SCAN QR TO PAIR'}
          sub={isConnected ? serverAddr : 'butler_server.py → scan'}
          color={isConnected ? C.green : C.cyan}
          onPress={onPair}
          solid
        />
        <ShimmerBtn
          icon="robot-happy-outline"
          label="OPEN AI CHAT"
          sub="Ollama · LAN · private"
          color={C.purple}
          onPress={() => goToTab('butler')}
        />
      </View>

      {/* Bottom stripe */}
      <View style={{ height: 2, flexDirection: 'row', opacity: 0.45 }}>
        {STRIPE.map((col, i) => <View key={i} style={{ flex: 1, backgroundColor: col }} />)}
      </View>
    </View>
  );
}

const nh = StyleSheet.create({
  root: {
    backgroundColor: C.surf,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 18 },
      android: { elevation: 6 },
    }),
  },
  scanBeam: {
    position: 'absolute', top: 0, bottom: 0, width: SW * 0.18,
    backgroundColor: C.cyan + '05', zIndex: 0,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, zIndex: 1,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
  },
  chipTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },
  ringBadge: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    backgroundColor: C.surf2,
  },
  titleBlock: { paddingHorizontal: 14, paddingBottom: 13, zIndex: 1 },
  eyebrow: { fontFamily: MONO, fontSize: 8, color: C.cyan + '65', letterSpacing: 2, marginBottom: 4 },
  titleWhite: {
    fontSize: SW < 360 ? 32 : 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: SW < 360 ? 38 : 44,
  },
  titleCyan: {
    fontSize: SW < 360 ? 32 : 38,
    fontWeight: '900',
    color: C.cyan,
    letterSpacing: -0.5,
    lineHeight: SW < 360 ? 38 : 44,
  },
  serverAddr: {
    fontFamily: MONO, fontSize: 10, color: C.mid,
    letterSpacing: 0.5, marginTop: 5,
  },
});

export default NexusHero;
