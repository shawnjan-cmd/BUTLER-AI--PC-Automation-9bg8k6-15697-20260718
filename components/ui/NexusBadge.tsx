/**
 * NexusBadge — Butler AI HUD-style status badges
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * 7 variants · 3 sizes · Animated pulse dot on live/online/offline
 * Part of the GlowWave-X design system — Section 20.4
 */
import React, { useEffect, useRef, memo } from 'react';
import {
  View, Text, Animated, StyleSheet, Platform, ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';

// ─── TOKENS ──────────────────────────────────────────────────────
const C = {
  ice:    '#6EE7FF',
  mint:   '#34D399',
  violet: '#A78BFA',
  amber:  '#FDBA74',
  coral:  '#F87171',
  sky:    '#60A5FA',
  muted:  '#5B6E85',
  text:   '#E4EBF5',
  bg:     '#04080F',
  surface:'#0F1828',
};

export type BadgeVariant = 'status' | 'version' | 'tag' | 'count' | 'warning' | 'online' | 'offline' | 'live';
export type BadgeSize    = 'xs' | 'sm' | 'md';

interface NexusBadgeProps {
  label:    string;
  variant?: BadgeVariant;
  color?:   string;
  size?:    BadgeSize;
  pulse?:   boolean;
  style?:   ViewStyle;
}

const SIZE_CONFIG = {
  xs: { px: 5,  py: 2,  fs: 7.5, dot: 4, r: 4  },
  sm: { px: 7,  py: 3,  fs: 8.5, dot: 5, r: 5  },
  md: { px: 10, py: 5,  fs: 10,  dot: 6, r: 6  },
};

function PulseDot({ color, size }: { color: string; size: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a,
    }} />
  );
}

export const NexusBadge = memo(function NexusBadge({
  label, variant = 'status', color, size = 'sm', pulse, style,
}: NexusBadgeProps) {
  const cfg = SIZE_CONFIG[size];

  // Derive colors based on variant
  const accent = color ?? (
    variant === 'online'  ? C.mint  :
    variant === 'offline' ? C.coral :
    variant === 'live'    ? C.ice   :
    variant === 'warning' ? C.amber :
    variant === 'version' ? C.violet :
    C.ice
  );

  const showDot  = pulse || variant === 'online' || variant === 'offline' || variant === 'live';
  const showWarn = variant === 'warning';

  const isFilled = variant === 'online' || variant === 'offline';
  const fillColor = isFilled
    ? (variant === 'offline' ? C.coral + 'EE' : C.mint + 'EE')
    : undefined;

  return (
    <View style={[
      s.badge,
      {
        paddingHorizontal: cfg.px,
        paddingVertical:   cfg.py,
        borderRadius:      cfg.r,
        borderWidth:       isFilled ? 0 : 1,
        borderColor:       accent + '55',
        backgroundColor:   fillColor ?? accent + '12',
      },
      style,
    ]}>
      {showDot && (
        <PulseDot color={accent} size={cfg.dot} />
      )}
      {showWarn && (
        <MaterialIcons name="warning" size={cfg.dot + 4} color={accent} />
      )}
      <Text style={[
        s.label,
        {
          fontSize:    cfg.fs,
          color:       isFilled ? '#000' : accent,
          includeFontPadding: false,
        },
      ]}>
        {label}
      </Text>
    </View>
  );
});

export default NexusBadge;

const s = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    alignSelf:      'flex-start',
  },
  label: {
    fontFamily:   FontFamily.mono as any,
    fontWeight:   '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
