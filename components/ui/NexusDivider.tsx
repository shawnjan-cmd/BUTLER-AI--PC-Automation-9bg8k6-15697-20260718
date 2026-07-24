/**
 * NexusDivider — section separator with center glowing pip.
 * Replaces every plain `<View style={{ height: 1 }} />` in the app.
 *
 * Per Section 21.5 (XUS-BUS divider) and Section 5 (data divider):
 *   NEURAL.NET ──●──────●──────●────── IOW.BRIDGE
 *
 * Two variants:
 *  "simple"  — lightweight hairline + center pip (inline sections)
 *  "xusbus"  — full NEURAL.NET ● XUS-BUS ● IOW.BRIDGE animated rail
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useEffect, useRef } from 'react';
import {
  View, Text, Animated, StyleSheet, ViewStyle, AppState,
} from 'react-native';
import { FontFamily } from '@/constants/typography';

// ── Simple divider ─────────────────────────────────────────────────────────
interface SimpleDividerProps {
  color?:   string;
  tag?:     string;
  opacity?: number;
  style?:   ViewStyle;
}

export const NexusDivider = memo(function NexusDivider({
  color   = 'rgba(110,231,255,0.14)',
  tag     = '◆',
  opacity = 0.4,
  style,
}: SimpleDividerProps) {
  return (
    <View style={[s.row, { opacity }, style]}>
      <View style={[s.line, { backgroundColor: color }]} />
      <Text style={[s.pip, { color }]}>{tag}</Text>
      <View style={[s.line, { backgroundColor: color }]} />
    </View>
  );
});

// ── XUS-BUS animated divider (legacy alias — use XusBusDivider from './XusBusDivider' for new code) ────
interface XusBusDividerLegacyProps {
  style?: ViewStyle;
}

export const XusBusDividerNexus = memo(function XusBusDividerNexus({ style }: XusBusDividerLegacyProps) {
  // Dot pulse animations — useNativeDriver: true (opacity only)
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(dot2, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();

    // Pause when app is backgrounded (battery guard)
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') { loop1.start(); loop2.start(); }
      else { loop1.stop(); loop2.stop(); }
    });

    return () => { loop1.stop(); loop2.stop(); sub.remove(); };
  }, []);

  return (
    <View style={[s.xusRow, style]}>
      {/* Left label */}
      <Text style={s.xusLabel}>NEURAL.NET</Text>

      {/* Rail */}
      <View style={s.rail}>
        <Animated.View style={[s.dot, s.dotGreen, { opacity: dot1 }]} />
        <Text style={s.railLabel}>• XUS-BUS · LOCAL •</Text>
        <Animated.View style={[s.dot, s.dotAmber, { opacity: dot2 }]} />
      </View>

      {/* Right label */}
      <Text style={s.xusLabel}>IOW.BRIDGE</Text>
    </View>
  );
});

const s = StyleSheet.create({
  // Simple divider
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  line: {
    flex:   1,
    height: StyleSheet.hairlineWidth,
  },
  pip: {
    fontSize:      10,
    marginHorizontal: 8,
  },

  // XUS-BUS divider
  xusRow: {
    height:          24,
    flexDirection:   'row',
    alignItems:      'center',
    marginVertical:  4,
    paddingHorizontal: 16,
  },
  xusLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      8,
    color:         'rgba(0,212,255,0.35)',
    letterSpacing: 1.5,
  },
  rail: {
    flex:            1,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-evenly',
    marginHorizontal: 8,
  },
  railLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      8,
    color:         'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  dotGreen: { backgroundColor: '#00FF88' },
  dotAmber: { backgroundColor: '#FF9500' },
});

export default NexusDivider;
