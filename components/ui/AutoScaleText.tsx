/**
 * AutoScaleText — text that NEVER overflows its container.
 *
 * Butler AI design system rule: every dynamic label (script names, IPs,
 * model names, file paths, KB titles, chat previews) must use this
 * component so no text is ever clipped, wrapped badly, or runs off-screen.
 *
 * Strategy (3 layers):
 *  1. adjustsFontSizeToFit + minimumFontScale — native engine shrinks font
 *     down to `minFontScale` of the original size before ellipsizing.
 *  2. numberOfLines — hard cap. Never wraps more than requested.
 *  3. ellipsizeMode="tail" — graceful truncation with "…" if font can't shrink enough.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo } from 'react';
import { Text, StyleSheet, TextStyle, Platform } from 'react-native';
import { FontFamily } from '@/constants/typography';

interface AutoScaleTextProps {
  children: React.ReactNode;
  /** Base font size in sp. Will shrink down to minFontScale * size. */
  size?: number;
  /** Minimum scale factor (0–1). Default 0.7 = shrinks to 70% of size. */
  minFontScale?: number;
  /** Max lines before ellipsis. Default 1. */
  lines?: number;
  /** Text color. */
  color?: string;
  /** Font family. Defaults to FontFamily.mono (Share Tech Mono). */
  fontFamily?: string;
  /** Letter spacing. */
  letterSpacing?: number;
  /** Text alignment. */
  align?: 'left' | 'center' | 'right';
  /** Additional TextStyle overrides. */
  style?: TextStyle;
  /** Font weight (only relevant for body/display fonts). */
  weight?: TextStyle['fontWeight'];
  /** Ellipsize position. Default 'tail'. */
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const AutoScaleText = memo(function AutoScaleText({
  children,
  size = 13,
  minFontScale = 0.7,
  lines = 1,
  color,
  fontFamily = FontFamily.mono,
  letterSpacing,
  align = 'left',
  style,
  weight,
  ellipsizeMode = 'tail',
}: AutoScaleTextProps) {
  const computed: TextStyle = {
    fontFamily,
    fontSize: size,
    color,
    letterSpacing,
    textAlign: align,
    fontWeight: weight,
    // Android: prevent extra vertical padding that misaligns mixed fonts
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
  };

  return (
    <Text
      style={[computed, style]}
      numberOfLines={lines}
      ellipsizeMode={ellipsizeMode}
      adjustsFontSizeToFit
      minimumFontScale={minFontScale}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
});

/**
 * MonoValue — Share Tech Mono number/data display that never overflows.
 * Use for: CPU 42%, IPs, latency ms, hex tags, script counts.
 */
export const MonoValue = memo(function MonoValue({
  children,
  size = 14,
  color = '#E4EBF5',
  style,
}: { children: React.ReactNode; size?: number; color?: string; style?: TextStyle }) {
  return (
    <AutoScaleText size={size} color={color} fontFamily={FontFamily.mono} style={style}>
      {children}
    </AutoScaleText>
  );
});

/**
 * HeroLabel — Orbitron display text that never overflows.
 * Use for: screen titles, card headings, "BUTLER AI" logotype.
 */
export const HeroLabel = memo(function HeroLabel({
  children,
  size = 20,
  color = '#E4EBF5',
  letterSpacing = 2,
  align = 'center',
  lines = 1,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
  lines?: number;
  style?: TextStyle;
}) {
  return (
    <AutoScaleText
      size={size}
      color={color}
      fontFamily={FontFamily.displayBold}
      letterSpacing={letterSpacing}
      align={align}
      lines={lines}
      minFontScale={0.6}
      style={style}
    >
      {children}
    </AutoScaleText>
  );
});

/**
 * BodyText — Inter readable text with proper line height.
 * Use for: descriptions, help text, any text > 2 lines.
 */
export const BodyText = memo(function BodyText({
  children,
  size = 13,
  color = '#B7C4D3',
  lines = 3,
  align = 'left',
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  lines?: number;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}) {
  return (
    <AutoScaleText
      size={size}
      color={color}
      fontFamily={FontFamily.body}
      lines={lines}
      align={align}
      minFontScale={0.85}
      style={{ lineHeight: size * 1.5, ...style }}
    >
      {children}
    </AutoScaleText>
  );
});

export default AutoScaleText;
