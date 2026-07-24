/**
 * XusBusDivider — animated NEURAL.NET ──●──────●──── IOW.BRIDGE rail.
 * Seen between EVERY major section in the production screenshots (Section 21.5).
 *
 * DRIVER RULES:
 *   Dot pulse opacity → useNativeDriver: true (opacity only)
 *   Data packet translateX → useNativeDriver: true (transform only)
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, Dimensions, AppState, StyleSheet, Platform } from 'react-native';
import { FontFamily } from '@/constants/typography';

const SW = Math.max(320, Dimensions.get('window').width);

export interface XusBusDividerProps {
  color?:       string;   // primary accent — defaults to ice
  dotColors?:   [string, string, string]; // [green, amber, teal] defaults
  leftLabel?:   string;
  rightLabel?:  string;
  centerLabel?: string;
  marginVertical?: number;
}

export const XusBusDivider = memo(function XusBusDivider({
  color        = '#6EE7FF',
  dotColors    = ['#34D399', '#FDBA74', '#6EE7FF'],
  leftLabel    = 'NEURAL.NET',
  rightLabel   = 'IOW.BRIDGE',
  centerLabel  = '· XUS-BUS · LOCAL ·',
  marginVertical = 4,
}: XusBusDividerProps) {
  // Dot pulses — native driver (opacity only)
  const dotAnims = useRef(dotColors.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.3))).current;
  // Data packet — native driver (transform only)
  const packetX = useRef(new Animated.Value(-24)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;

    // Staggered dot pulses
    const dotLoops = dotAnims.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 500),
        Animated.timing(a, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: 900, useNativeDriver: true }),
      ]))
    );

    // Packet travels across the rail
    const RAIL_W = SW - 32 - 60; // approximate rail width
    const packetLoop = Animated.loop(Animated.sequence([
      Animated.timing(packetX, { toValue: RAIL_W, duration: 3200, useNativeDriver: true }),
      Animated.timing(packetX, { toValue: -24,    duration: 0,    useNativeDriver: true }),
      Animated.delay(800),
    ]));

    dotLoops.forEach(l => l.start());
    packetLoop.start();

    // Pause in background
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') {
        dotLoops.forEach(l => l.start());
        packetLoop.start();
      } else {
        dotLoops.forEach(l => l.stop());
        packetLoop.stop();
      }
    });

    return () => {
      mountedRef.current = false;
      dotLoops.forEach(l => l.stop());
      packetLoop.stop();
      sub.remove();
    };
  }, []);

  return (
    <View style={[s.root, { marginVertical }]}>
      {/* Left label */}
      <Text style={[s.label, { color: color + '38' }]}>{leftLabel}</Text>

      {/* Rail */}
      <View style={s.rail}>
        {/* Static hairline */}
        <View style={[s.line, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />

        {/* Animated packet */}
        <Animated.View style={[
          s.packet,
          { backgroundColor: color, transform: [{ translateX: packetX }] },
        ]} />

        {/* Dot 1 */}
        <Animated.View style={[
          s.dot,
          { left: '20%', backgroundColor: dotColors[0], opacity: dotAnims[0] },
        ]} />

        {/* Center label */}
        <Text style={[s.centerLabel, { color: 'rgba(255,255,255,0.22)' }]} numberOfLines={1}>
          {centerLabel}
        </Text>

        {/* Dot 2 */}
        <Animated.View style={[
          s.dot,
          { right: '20%', backgroundColor: dotColors[1], opacity: dotAnims[1] },
        ]} />
      </View>

      {/* Right label */}
      <Text style={[s.label, { color: color + '38' }]}>{rightLabel}</Text>
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    height:         24,
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
  },
  label: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       8,
    letterSpacing:  1.5,
    fontWeight:    '700' as any,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  rail: {
    flex:          1,
    height:        1,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'space-evenly',
    position:      'relative',
  },
  line: {
    position:      'absolute',
    left:           0,
    right:          0,
    height:         1,
  },
  packet: {
    position:      'absolute',
    left:           0,
    width:          24,
    height:         1.5,
    borderRadius:   1,
    opacity:        0.85,
  },
  dot: {
    position:      'absolute',
    width:          6,
    height:         6,
    borderRadius:   3,
    ...Platform.select({
      ios: { shadowRadius: 4, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 } },
    }),
  },
  centerLabel: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       8,
    letterSpacing:  1.5,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default XusBusDivider;
