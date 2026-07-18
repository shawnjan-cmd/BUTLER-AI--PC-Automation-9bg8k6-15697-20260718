/**
 * NexusHeroCard — Full-width animated hero image for the Butler AI homepage.
 * Auto-centers the mascot image, shows HUD overlay, scan beam, and a stats ticker.
 * Activates (fade + scale entrance) automatically on mount.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Platform, Pressable, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { haptics } from '@/services/haptics';

const SW = Math.max(320, Dimensions.get('window').width);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// Safe local image asset
let HERO_IMG: any = null;
try { HERO_IMG = require('@/assets/images/mascot_shield_v2.png'); } catch {
  try { HERO_IMG = require('@/assets/images/mascot_shield.png'); } catch {
    try { HERO_IMG = require('@/assets/images/butler_hud_robot.jpg'); } catch {}
  }
}

// Colour constants
const C = {
  cyan:    '#00E5FF',
  green:   '#00FF88',
  purple:  '#CC44FF',
  amber:   '#FFB020',
  pink:    '#FF6EB4',
  red:     '#FF3344',
  bg:      '#020810',
  surface: '#050E1C',
};

const COLORS = [C.cyan, C.purple, C.amber, C.green, C.pink];

interface NexusHeroCardProps {
  isConnected: boolean;
  serverAddr?: string;
  onPair: () => void;
  onChat: () => void;
}

export function NexusHeroCard({ isConnected, serverAddr, onPair, onChat }: NexusHeroCardProps) {
  const isFocused = useIsFocused();

  // ── Entrance animation ────────────────────────────────────────
  const entranceA   = useRef(new Animated.Value(0)).current;
  const entranceY   = useRef(new Animated.Value(24)).current;

  // ── Ongoing animations (JS-driver — never mix with above native refs) ──
  const scanA       = useRef(new Animated.Value(-SW)).current;   // scan X
  const glowA       = useRef(new Animated.Value(0.4)).current;   // border glow
  const floatA      = useRef(new Animated.Value(0)).current;     // robot float

  // ── Native-driver ─────────────────────────────────────────────
  const dotA        = useRef(new Animated.Value(0.4)).current;
  const btnPressA   = useRef(new Animated.Value(1)).current;
  const btn2PressA  = useRef(new Animated.Value(1)).current;

  const [tickerIdx, setTickerIdx] = useState(0);
  const [booted, setBooted] = useState(false);

  const TICKER_MSGS = [
    'BUTLER AI · PC AUTOMATION · LOCAL AI · ZERO CLOUD',
    'LAN-ONLY · HMAC-SHA256 · DEVICE-ENCRYPTED STORAGE',
    `STATUS: ${isConnected ? 'PC ONLINE · READY' : 'OFFLINE · SCAN QR TO PAIR'}`,
    'v7.3 · 250+ SCRIPTS · OLLAMA POWERED · NO SUBSCRIPTIONS',
    'PRIVACY FIRST · NO TELEMETRY · NO ACCOUNT REQUIRED',
  ];

  useEffect(() => {
    // Entrance: fade + slide up
    Animated.parallel([
      Animated.timing(entranceA, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(entranceY, { toValue: 0, tension: 100, friction: 14, useNativeDriver: false }),
    ]).start(() => setBooted(true));
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    const loops = [
      // Scan line sweeps across image
      Animated.loop(Animated.sequence([
        Animated.timing(scanA, { toValue: SW + 80, duration: 2600, useNativeDriver: false }),
        Animated.timing(scanA, { toValue: -SW, duration: 0, useNativeDriver: false }),
        Animated.delay(3200),
      ]), { iterations: 4 }),
      // Border glow breathe
      Animated.loop(Animated.sequence([
        Animated.timing(glowA, { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(glowA, { toValue: 0.25, duration: 1400, useNativeDriver: false }),
      ])),
      // Robot float (JS driver)
      Animated.loop(Animated.sequence([
        Animated.timing(floatA, { toValue: 1, duration: 2400, useNativeDriver: false }),
        Animated.timing(floatA, { toValue: 0, duration: 2400, useNativeDriver: false }),
      ])),
      // Status dot pulse (native driver)
      Animated.loop(Animated.sequence([
        Animated.timing(dotA, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(dotA, { toValue: 0.2, duration: 700, useNativeDriver: true }),
      ])),
    ];
    loops.forEach(l => l.start());

    const ti = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_MSGS.length), 3000);
    return () => { loops.forEach(l => l.stop()); clearInterval(ti); };
  }, [isFocused]);

  const borderC = glowA.interpolate({ inputRange: [0.25, 1], outputRange: [C.cyan + '35', C.cyan + 'CC'] });
  const floatY  = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const connCol = isConnected ? C.green : C.red;

  const handlePairPressIn  = () => Animated.spring(btnPressA,  { toValue: 0.93, tension: 400, friction: 12, useNativeDriver: true }).start();
  const handlePairPressOut = () => Animated.spring(btnPressA,  { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();
  const handleChatPressIn  = () => Animated.spring(btn2PressA, { toValue: 0.93, tension: 400, friction: 12, useNativeDriver: true }).start();
  const handleChatPressOut = () => Animated.spring(btn2PressA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <Animated.View style={[s.outer, {
      opacity: entranceA,
      transform: [{ translateY: entranceY }],
      borderColor: borderC,
      ...(Platform.OS === 'ios' ? {
        shadowColor: C.cyan, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 24,
      } : { elevation: 14 }),
    }]}>
      {/* Multi-colour stripe */}
      <View style={{ height: 3.5, flexDirection: 'row' }}>
        {COLORS.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* Scan line sweep */}
      <Animated.View pointerEvents="none" style={[s.scanLine, { transform: [{ translateX: scanA }] }]} />

      {/* HUD corner brackets */}
      {(['tl','tr','bl','br'] as const).map(p => (
        <View key={p} style={[s.corner, {
          top:    p.startsWith('t') ? 4 : undefined,
          bottom: p.startsWith('b') ? 4 : undefined,
          left:   p.endsWith('l')   ? 4 : undefined,
          right:  p.endsWith('r')   ? 4 : undefined,
          borderTopWidth:    p.startsWith('t') ? 2 : 0,
          borderBottomWidth: p.startsWith('b') ? 2 : 0,
          borderLeftWidth:   p.endsWith('l')   ? 2 : 0,
          borderRightWidth:  p.endsWith('r')   ? 2 : 0,
          borderColor: C.cyan + '70',
        }]} />
      ))}

      {/* Main layout: robot left, info right */}
      <View style={s.body}>
        {/* Robot hero image — auto-centered */}
        <Animated.View style={[s.robotWrap, { transform: [{ translateY: floatY }] }]}>
          {HERO_IMG ? (
            <Image
              source={HERO_IMG}
              style={s.robotImg}
              contentFit="contain"
              contentPosition="center"
              transition={400}
            />
          ) : (
            <View style={[s.robotImg, { alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="robot-happy" size={72} color={C.cyan} />
            </View>
          )}
          {/* Glow halo under robot */}
          <View style={[s.robotGlow, { backgroundColor: C.cyan + '18' }]} />
          {/* NEXUS label */}
          <View style={s.robotLabel}>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: C.cyan, letterSpacing: 1.5 }}>NEXUS</Text>
          </View>
        </Animated.View>

        {/* Info column */}
        <View style={s.info}>
          {/* Title */}
          <View style={{ marginBottom: 6 }}>
            <Text style={s.subLabel}>AI COMMAND CENTER</Text>
            <Text style={s.title}>BUTLER <Text style={{ color: C.cyan }}>AI</Text></Text>
            <Text style={s.tagline}>PC Automation · Local AI · Zero Cloud</Text>
          </View>

          {/* Pill badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {[
              { label: isConnected ? 'ONLINE' : 'OFFLINE', col: connCol },
              { label: 'LOCAL AI', col: C.purple },
              { label: 'AES-256',  col: C.amber  },
            ].map(({ label, col }) => (
              <View key={label} style={[s.pill, { borderColor: col + '55', backgroundColor: col + '0C' }]}>
                <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: col, opacity: label === (isConnected ? 'ONLINE' : 'OFFLINE') ? dotA : 1 }} />
                <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: col }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* CTA buttons */}
          <View style={{ gap: 7 }}>
            <Pressable
              onPressIn={handlePairPressIn} onPressOut={handlePairPressOut}
              onPress={() => { haptics.heavy(); onPair(); }}>
              <Animated.View style={[s.btnPrimary, { transform: [{ scale: btnPressA }],
                backgroundColor: C.cyan, borderColor: C.cyan }]}>
                <MaterialIcons name="qr-code-scanner" size={15} color="#000" />
                <Text style={s.btnPrimaryTxt}>SCAN QR TO PAIR</Text>
              </Animated.View>
            </Pressable>
            <Pressable
              onPressIn={handleChatPressIn} onPressOut={handleChatPressOut}
              onPress={() => { haptics.medium(); onChat(); }}>
              <Animated.View style={[s.btnSecondary, { transform: [{ scale: btn2PressA }],
                borderColor: C.green + '70', backgroundColor: C.green + '0D' }]}>
                <MaterialCommunityIcons name="robot-happy-outline" size={15} color={C.green} />
                <Text style={[s.btnSecondaryTxt, { color: C.green }]}>OPEN AI CHAT</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Stat ticker strip */}
      <View style={s.tickerRow}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.cyan, marginRight: 6 }} />
        <Text style={s.tickerTxt} numberOfLines={1}>
          {'> '}{TICKER_MSGS[tickerIdx]}
        </Text>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.amber, marginLeft: 6 }} />
      </View>

      {/* Bottom accent bar */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        {COLORS.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c, opacity: 0.6 }} />)}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  outer: {
    marginHorizontal: 0, marginBottom: 0, borderWidth: 2, borderRadius: 0,
    backgroundColor: C.surface, overflow: 'hidden', position: 'relative',
  },
  scanLine: {
    position: 'absolute', top: 0, bottom: 0, width: 100,
    backgroundColor: 'rgba(0,229,255,0.06)',
    transform: [{ skewX: '-12deg' }], zIndex: 0,
  },
  corner: { position: 'absolute', width: 14, height: 14, zIndex: 2 },
  body: {
    flexDirection: 'row', alignItems: 'stretch', padding: 14, gap: 12,
    minHeight: 170,
  },
  robotWrap: {
    width: 118, alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, position: 'relative',
  },
  robotImg: { width: 110, height: 130 },
  robotGlow: {
    position: 'absolute', bottom: 0, left: 4, right: 4, height: 30,
    borderRadius: 30, zIndex: -1,
  },
  robotLabel: {
    marginTop: 4, borderWidth: 1, borderColor: '#00E5FF35', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#00E5FF09',
  },
  info: { flex: 1, justifyContent: 'center' },
  subLabel: {
    fontFamily: MONO, fontSize: 8, fontWeight: '700', color: '#00E5FF70',
    letterSpacing: 2, marginBottom: 3,
  },
  title: {
    fontFamily: MONO, fontSize: 22, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 1.5, lineHeight: 26,
  },
  tagline: {
    fontFamily: MONO, fontSize: 8, color: '#4A6A80',
    letterSpacing: 0.5, marginTop: 2,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3.5,
  },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 10, borderWidth: 2, paddingVertical: 10,
  },
  btnPrimaryTxt: {
    fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 0.8,
  },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 10, borderWidth: 1.5, paddingVertical: 9,
  },
  btnSecondaryTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  tickerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: '#00E5FF18',
    backgroundColor: '#010508',
  },
  tickerTxt: {
    fontFamily: MONO, fontSize: 9, color: '#00E5FF80',
    letterSpacing: 0.8, flex: 1,
  },
});
