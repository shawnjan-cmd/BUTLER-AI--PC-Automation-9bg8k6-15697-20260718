/**
 * OverflowGuard — wraps any content and automatically clips it
 * to its container bounds. Prevents the #1 cause of visual bugs
 * in Butler AI: content rendering outside its card/section boundaries.
 *
 * Also provides:
 *  - FadeEdge: horizontal ScrollView with gradient fade at edges
 *    (pure View-based, no expo-linear-gradient)
 *  - BoundedRow: a flex row that never orphans items or overflows
 *  - SpacedGrid: auto-distributes items into even columns
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, ReactNode } from 'react';
import {
  View, ScrollView, StyleSheet, ViewStyle,
  Dimensions,
} from 'react-native';

// ── OverflowGuard ──────────────────────────────────────────────────────────
interface OverflowGuardProps {
  children:   ReactNode;
  style?:     ViewStyle;
  /** Radius applied both to container and overflow clip. Default 10. */
  radius?:    number;
}

export const OverflowGuard = memo(function OverflowGuard({
  children, style, radius = 10,
}: OverflowGuardProps) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
});

// ── FadeEdge — horizontal scroll with fade indicators (no LinearGradient) ─
interface FadeEdgeProps {
  children:       ReactNode;
  height?:        number;
  fadeWidth?:     number;
  fadeColor?:     string;
  contentPadding?: number;
  gap?:           number;
  style?:         ViewStyle;
}

export const FadeEdge = memo(function FadeEdge({
  children,
  height        = 48,
  fadeWidth     = 20,
  fadeColor     = '#0A0F1A',
  contentPadding = 14,
  gap           = 8,
  style,
}: FadeEdgeProps) {
  return (
    <View style={[{ height }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection:   'row',
          alignItems:      'center',
          paddingHorizontal: contentPadding,
          gap,
        }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        {children}
      </ScrollView>

      {/* Left fade (pure Views, no gradient package) */}
      <View
        pointerEvents="none"
        style={[ss.fadeLeft, { width: fadeWidth }]}
      >
        {/* 5 layered semi-transparent views create the fade illusion */}
        {[0.85, 0.65, 0.45, 0.25, 0.1].map((op, i) => (
          <View
            key={i}
            style={{
              flex:            1,
              backgroundColor: fadeColor,
              opacity:         op,
            }}
          />
        ))}
      </View>

      {/* Right fade */}
      <View
        pointerEvents="none"
        style={[ss.fadeRight, { width: fadeWidth }]}
      >
        {[0.1, 0.25, 0.45, 0.65, 0.85].map((op, i) => (
          <View
            key={i}
            style={{
              flex:            1,
              backgroundColor: fadeColor,
              opacity:         op,
            }}
          />
        ))}
      </View>
    </View>
  );
});

// ── BoundedRow — flex row that never overflows or orphans ─────────────────
interface BoundedRowProps {
  children:    ReactNode;
  gap?:        number;
  wrap?:       boolean;
  align?:      ViewStyle['alignItems'];
  justify?:    ViewStyle['justifyContent'];
  style?:      ViewStyle;
  padH?:       number;
}

export const BoundedRow = memo(function BoundedRow({
  children,
  gap     = 8,
  wrap    = false,
  align   = 'center',
  justify = 'flex-start',
  style,
  padH    = 0,
}: BoundedRowProps) {
  return (
    <View
      style={[
        {
          flexDirection:   'row',
          alignItems:      align,
          justifyContent:  justify,
          flexWrap:        wrap ? 'wrap' : 'nowrap',
          gap,
          paddingHorizontal: padH,
          overflow:        'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

// ── SpacedGrid — distribute N items into equal columns ────────────────────
interface SpacedGridProps {
  children:   ReactNode[];
  cols?:      2 | 3 | 4;
  gap?:       number;
  padH?:      number;
  style?:     ViewStyle;
}

export const SpacedGrid = memo(function SpacedGrid({
  children,
  cols  = 2,
  gap   = 8,
  padH  = 14,
  style,
}: SpacedGridProps) {
  const sw       = Dimensions.get('window').width;
  const totalPad = padH * 2;
  const totalGap = gap * (cols - 1);
  const cellW    = Math.max(1, Math.floor((sw - totalPad - totalGap) / cols));

  const rows: ReactNode[][] = [];
  const items               = React.Children.toArray(children);
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }

  return (
    <View style={[{ paddingHorizontal: padH }, style]}>
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={{
            flexDirection:   'row',
            gap,
            marginBottom:    ri < rows.length - 1 ? gap : 0,
          }}
        >
          {row.map((cell, ci) => (
            <View key={ci} style={{ width: cellW }}>
              {cell}
            </View>
          ))}
          {/* Phantom cells to keep alignment when row is not full */}
          {row.length < cols &&
            Array.from({ length: cols - row.length }).map((_, pi) => (
              <View key={`ph-${pi}`} style={{ width: cellW }} />
            ))}
        </View>
      ))}
    </View>
  );
});

const ss = StyleSheet.create({
  fadeLeft: {
    position:      'absolute',
    top:           0,
    left:          0,
    bottom:        0,
    flexDirection: 'row',
  },
  fadeRight: {
    position:      'absolute',
    top:           0,
    right:         0,
    bottom:        0,
    flexDirection: 'row',
  },
});

export default OverflowGuard;
