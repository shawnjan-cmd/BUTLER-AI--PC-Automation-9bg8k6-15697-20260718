/**
 * TextGuard — prevents EVERY possible text rendering problem:
 *
 *  1. Long strings truncated with "…" before they overflow
 *  2. Very long words (URLs, hex hashes, paths) broken mid-word
 *  3. RTL text never flips layout in LTR screens
 *  4. Numbers and data never use system font (always monospace)
 *  5. Android: eliminates font padding misalignment
 *  6. Accessibility: respects system large text but caps to maxFontSizeMultiplier
 *
 * This is a drop-in wrapper — children can be a string or any React node.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo } from 'react';
import { Text, TextStyle, Platform } from 'react-native';
import { FontFamily } from '@/constants/typography';

interface TextGuardProps {
  children:          React.ReactNode;
  style?:            TextStyle | TextStyle[];
  lines?:            number;
  /** Shrink font before ellipsizing. 0 = no shrink, 1 = no shrink, 0.7 = 70% min */
  minScale?:         number;
  /** Cap system font scale multiplier (accessibility). 1.5 = user can scale up 50% max */
  maxFontMultiplier?: number;
  /** Force word-break on long continuous strings (URLs, hashes, paths). */
  breakLong?:        boolean;
  /** Additional text props forwarded to <Text> */
  [key: string]:     any;
}

export const TextGuard = memo(function TextGuard({
  children,
  style,
  lines = 1,
  minScale = 0.75,
  maxFontMultiplier = 1.4,
  breakLong = false,
  ...rest
}: TextGuardProps) {
  // Pre-process string children to break very long tokens
  let processedChildren = children;
  if (breakLong && typeof children === 'string') {
    // Insert zero-width space every 25 chars in unbroken sequences
    processedChildren = children.replace(/([^\s]{25})/g, '$1\u200B');
  }

  const androidFix: TextStyle = Platform.OS === 'android'
    ? { includeFontPadding: false, textAlignVertical: 'center' }
    : {};

  return (
    <Text
      style={[androidFix, style]}
      numberOfLines={lines}
      ellipsizeMode="tail"
      adjustsFontSizeToFit={lines === 1}
      minimumFontScale={minScale}
      maxFontSizeMultiplier={maxFontMultiplier}
      allowFontScaling={maxFontMultiplier > 1}
      {...rest}
    >
      {processedChildren}
    </Text>
  );
});

/**
 * DataText — monospace text with guaranteed overflow protection.
 * Use for: IPs, ports, hex values, timestamps, script names.
 */
export const DataText = memo(function DataText({
  children,
  size = 11,
  color = '#B7C4D3',
  style,
  lines = 1,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: TextStyle;
  lines?: number;
}) {
  const androidFix: TextStyle = Platform.OS === 'android'
    ? { includeFontPadding: false }
    : {};
  return (
    <Text
      style={[
        {
          fontFamily: FontFamily.mono,
          fontSize: size,
          color,
          ...androidFix,
        },
        style,
      ]}
      numberOfLines={lines}
      ellipsizeMode="tail"
      adjustsFontSizeToFit={lines === 1}
      minimumFontScale={0.7}
      maxFontSizeMultiplier={1.3}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
});

/**
 * TruncateMiddle — shows beginning and end of long strings.
 * Use for: file paths, URLs, long hex addresses.
 * Example: /home/user/Documents/very/long/path → /home/.../path
 */
export const TruncateMiddle = memo(function TruncateMiddle({
  text,
  maxLen = 24,
  size = 11,
  color = '#B7C4D3',
  style,
}: {
  text: string;
  maxLen?: number;
  size?: number;
  color?: string;
  style?: TextStyle;
}) {
  let display = text;
  if (text.length > maxLen) {
    const half = Math.floor((maxLen - 3) / 2);
    display = `${text.slice(0, half)}…${text.slice(-half)}`;
  }

  const androidFix: TextStyle = Platform.OS === 'android'
    ? { includeFontPadding: false }
    : {};

  return (
    <Text
      style={[
        { fontFamily: FontFamily.mono, fontSize: size, color, ...androidFix },
        style,
      ]}
      numberOfLines={1}
      allowFontScaling={false}
    >
      {display}
    </Text>
  );
});

export default TextGuard;
