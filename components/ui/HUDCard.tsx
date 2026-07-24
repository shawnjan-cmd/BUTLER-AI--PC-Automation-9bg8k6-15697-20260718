/**
 * HUDCard — Butler AI signature card primitive
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * THE FOUR SIGNATURE ELEMENTS (Section 1, Rule 4):
 *  1. Top glow rail — 1.5px, accent, breathing opacity 0.25→0.90, runner sweeps 3.8s
 *  2. Corner brackets — L-shaped, 1px × 8px at all 4 corners, accent color
 *  3. Hex address tag — 0xABCD top-right, mono 9sp, 55% opacity
 *  4. Border — hairlineWidth, rgba(accent, 0.14)
 *
 * Animation driver: all Animated values use useNativeDriver:true (transform/opacity).
 * Glow borderColor uses isolated Animated.View with useNativeDriver:false.
 */
import React, { memo, useEffect, useRef } from 'react';
import {
  Animated, Platform, StyleSheet, Text, View, ViewStyle,
} from 'react-native';
import { FontFamily } from '@/constants/typography';

// ─── DETERMINISTIC HEX TAG FROM SEED ──────────────────────────────
function seedHex(seed: string): string {
  let h = 0x811C9DC5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return '0x' + (h >>> 16).toString(16).toUpperCase().padStart(4, '0');
}

// ─── ANIMATED RAIL WITH RUNNER ────────────────────────────────────
function GlowRail({ color }: { color: string }) {
  const breatheA = useRef(new Animated.Value(0.25)).current; // native — opacity
  const runnerX  = useRef(new Animated.Value(-100)).current; // native — translateX

  useEffect(() => {
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(breatheA, { toValue: 0.90, duration: 1800, useNativeDriver: true }),
      Animated.timing(breatheA, { toValue: 0.25, duration: 1800, useNativeDriver: true }),
    ]));
    const runner = Animated.loop(Animated.sequence([
      Animated.timing(runnerX, { toValue: 800, duration: 1200, useNativeDriver: true }),
      Animated.timing(runnerX, { toValue: -100, duration: 0, useNativeDriver: true }),
      Animated.delay(2600),
    ]));
    breathe.start();
    runner.start();
    return () => { breathe.stop(); runner.stop(); };
  }, []);

  return (
    <View style={{ height: 1.5, overflow: 'hidden', backgroundColor: color + '15' }}>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: color, opacity: breatheA }} />
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: color + 'EE', transform: [{ translateX: runnerX }], opacity: 0.9 }} />
    </View>
  );
}

// ─── CORNER BRACKETS ──────────────────────────────────────────────
function Corners({ color, size = 8, t = 1 }: { color: string; size?: number; t?: number }) {
  const b: ViewStyle = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[b, { top: 0, left: 0,  borderTopWidth: t, borderLeftWidth:  t, borderColor: color }]} />
      <View style={[b, { top: 0, right: 0, borderTopWidth: t, borderRightWidth: t, borderColor: color }]} />
      <View style={[b, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth:  t, borderColor: color }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t, borderColor: color }]} />
    </>
  );
}

// ─── HUDCARD ──────────────────────────────────────────────────────
interface HUDCardProps {
  children:   React.ReactNode;
  accent?:    string;
  rail?:      boolean;
  corners?:   boolean;
  hex?:       string;
  padding?:   number;
  flush?:     boolean;
  live?:      boolean;
  style?:     ViewStyle;
}

export const HUDCard = memo(function HUDCard({
  children,
  accent  = '#6EE7FF',
  rail    = true,
  corners = true,
  hex,
  padding = 14,
  flush   = false,
  live,
  style,
}: HUDCardProps) {
  const hexTag = hex ? seedHex(hex) : null;

  return (
    <View style={[
      s.card,
      {
        borderColor: accent + '18',
        ...Platform.select({
          ios: { shadowColor: accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
          android: { elevation: 3 },
        }),
      },
      style,
    ]}>
      {/* ① Top glow rail */}
      {rail && <GlowRail color={accent} />}

      {/* Absolute overlays — corners + hex tag */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* ② Corner brackets */}
        {corners && <Corners color={accent + '70'} size={8} t={1} />}

        {/* ③ Hex tag */}
        {hexTag && (
          <Text style={[s.hexTag, { color: accent + '55' }]}>
            {hexTag}
          </Text>
        )}

        {/* Live dot */}
        {live && (
          <View style={[s.liveDot, { backgroundColor: accent }]} />
        )}
      </View>

      {/* Content */}
      <View style={flush ? undefined : { padding }}>
        {children}
      </View>
    </View>
  );
});

export default HUDCard;

const s = StyleSheet.create({
  card: {
    backgroundColor: '#0F1828',
    borderRadius:    12,
    borderWidth:     StyleSheet.hairlineWidth,
    overflow:        'hidden',
    position:        'relative',
  },
  hexTag: {
    position:      'absolute',
    top:           6,
    right:         8,
    fontFamily:    FontFamily.mono as any,
    fontSize:      9,
    letterSpacing: 1.5,
    fontWeight:    '700',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  liveDot: {
    position: 'absolute',
    top:      6,
    left:     8,
    width:    5,
    height:   5,
    borderRadius: 3,
    opacity:  0.8,
  },
});
