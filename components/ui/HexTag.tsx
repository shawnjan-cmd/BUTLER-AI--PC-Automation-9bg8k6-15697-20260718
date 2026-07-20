/**
 * HexTag — Deterministic hex "module address" tag
 * Same seed always produces the same hex, so a card's tag
 * doesn't flicker between renders.
 *
 * @example
 *   <HexTag seed="nexus-bot" color={COLOR.amber} />
 *   // Renders: 0x93EB (always the same for "nexus-bot")
 */
import React, { useMemo } from 'react';
import { Text, TextStyle } from 'react-native';

interface HexTagProps {
  seed: string;
  color?: string;
  style?: TextStyle;
  opacity?: number;
}

export function HexTag({ seed, color = '#6A8A9A', style, opacity = 0.55 }: HexTagProps) {
  const hex = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return '0x' + (h % 0xffff).toString(16).toUpperCase().padStart(4, '0');
  }, [seed]);

  return (
    <Text
      style={[
        {
          fontFamily: 'monospace',
          fontSize: 9,
          letterSpacing: 1,
          color,
          opacity,
          fontWeight: '700',
        } as TextStyle,
        style,
      ]}
    >
      {hex}
    </Text>
  );
}
