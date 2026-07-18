/**
 * MicroGlyph — 6–12px decorative marks ("PCB silkscreen" layer).
 * Purely visual. Never interactive, never announced to screen readers.
 *
 * v2: react-native-svg REMOVED entirely — was causing Class A Android boot crash
 * (undefined is not a function at module load). Replaced with pure View/border shapes
 * that are visually equivalent at small sizes. Zero native dependencies.
 *
 *   <MicroGlyph name="hex" size={8} color="#00e5ff" dim />
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';

export type GlyphName =
  | 'hex'
  | 'circuit'
  | 'dotgrid'
  | 'spark'
  | 'crosshair'
  | 'registration'
  | 'chevrons'
  | 'shield'
  | 'bolt'
  | 'node'
  | 'terminal'
  | 'wave';

interface Props {
  name: GlyphName;
  size?: number;
  color?: string;
  dim?: boolean;
  style?: ViewStyle;
}

/** Pure-View glyph approximations — no SVG, no native module */
function GlyphShape({ name, size, color }: { name: GlyphName; size: number; color: string }) {
  const r = Math.max(1, Math.round(size * 0.18));
  const bw = Math.max(1, Math.round(size * 0.12));

  switch (name) {
    case 'hex':
    case 'shield':
      // Rounded square outline — represents hexagonal/shield at small sizes
      return (
        <View style={{
          width: size, height: size, borderRadius: r + 1,
          borderWidth: bw, borderColor: color,
        }} />
      );

    case 'circuit':
    case 'node':
      // Small filled dot with outer ring
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: size * 0.55, height: size * 0.55, borderRadius: size,
            backgroundColor: color, opacity: 0.9,
          }} />
          <View style={{
            position: 'absolute', width: size, height: size, borderRadius: size,
            borderWidth: bw, borderColor: color, opacity: 0.4,
          }} />
        </View>
      );

    case 'dotgrid':
    case 'wave':
      // 3 horizontal dots
      return (
        <View style={{ width: size, height: size, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'space-evenly' }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{
              width: Math.max(1, size * 0.22), height: Math.max(1, size * 0.22),
              borderRadius: size, backgroundColor: color,
            }} />
          ))}
        </View>
      );

    case 'spark':
    case 'bolt':
      // Diamond shape using border trick
      return (
        <View style={{
          width: size * 0.65, height: size * 0.65,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          borderRadius: 1,
        }} />
      );

    case 'crosshair':
      // Plus/cross shape
      return (
        <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: size, height: bw, backgroundColor: color }} />
          <View style={{ position: 'absolute', width: bw, height: size, backgroundColor: color }} />
        </View>
      );

    case 'registration':
    case 'chevrons':
    case 'terminal':
    default:
      // Corner bracket: top-left L shape
      return (
        <View style={{ width: size, height: size, position: 'relative' }}>
          <View style={{
            position: 'absolute', top: 0, left: 0,
            width: size * 0.55, height: bw, backgroundColor: color,
          }} />
          <View style={{
            position: 'absolute', top: 0, left: 0,
            width: bw, height: size * 0.55, backgroundColor: color,
          }} />
        </View>
      );
  }
}

export default function MicroGlyph({
  name, size = 8, color = '#5A6880', dim = false, style,
}: Props) {
  return (
    <View
      style={[{
        width: size, height: size,
        opacity: dim ? 0.45 : 0.8,
        alignItems: 'center', justifyContent: 'center',
      }, style]}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <GlyphShape name={name} size={size} color={color} />
    </View>
  );
}

export function CornerGlyph({
  corner = 'tr', inset = 8, ...rest
}: Props & { corner?: 'tl' | 'tr' | 'bl' | 'br'; inset?: number }) {
  const pos: ViewStyle = { position: 'absolute' };
  if (corner.includes('t')) pos.top = inset; else pos.bottom = inset;
  if (corner.includes('r')) pos.right = inset; else pos.left = inset;
  return <MicroGlyph {...rest} dim style={pos} />;
}
