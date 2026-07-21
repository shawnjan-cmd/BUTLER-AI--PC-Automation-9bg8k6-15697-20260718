/**
 * GlowCard — Premium HUD card with optional corners, hex tag, scanline.
 * 3D top inner highlight, neon glow shadow on active state.
 * All new props default to off — safe drop-in for existing usages.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CornerFrame } from './CornerFrame';
import { HexTag } from './HexTag';
import { ScanlineOverlay } from './ScanlineOverlay';

interface GlowCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  active?: boolean;
  padding?: number;
  accentEdge?: 'left' | 'bottom' | 'top' | 'none';
  hexSeed?: string;
  corners?: boolean;
  scanline?: boolean;
  bg?: string;
}

export function GlowCard({
  children,
  style,
  glowColor = '#00E5FF',
  active = false,
  padding = 16,
  accentEdge = 'none',
  hexSeed,
  corners = false,
  scanline = false,
  bg = 'rgba(6,13,24,0.95)',
}: GlowCardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding, backgroundColor: bg },
        accentEdge === 'left'   && { borderLeftWidth: 3,   borderLeftColor:   glowColor },
        accentEdge === 'bottom' && { borderBottomWidth: 3, borderBottomColor: glowColor },
        accentEdge === 'top'    && { borderTopWidth: 3,    borderTopColor:    glowColor },
        active && {
          borderColor: glowColor + '66',
          shadowColor: glowColor,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
        },
        style,
      ]}
    >
      {/* 3D top inner highlight — simulates a light source from above */}
      <View style={styles.topHighlight} />

      {corners  && <CornerFrame color={glowColor + '55'} size={10} thickness={1.5} inset={2} />}
      {scanline && <ScanlineOverlay color={glowColor} />}

      {children}

      {hexSeed && (
        <View style={styles.hexCorner}>
          <HexTag seed={hexSeed} color={glowColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.12)',
    position: 'relative',
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  hexCorner: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
});
