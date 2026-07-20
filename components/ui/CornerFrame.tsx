/**
 * CornerFrame — HUD corner bracket overlay for any card/container.
 * Generalizes the corner-bracket code so any card can use it.
 * Renders 4 independent L-shaped corner ticks.
 *
 * @example
 *   <View style={{ position: 'relative' }}>
 *     <CornerFrame color={COLOR.cyan} size={10} thickness={1.5} />
 *     {children}
 *   </View>
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CornerFrameProps {
  color?: string;
  size?: number;
  thickness?: number;
  inset?: number;
  corners?: ('tl' | 'tr' | 'bl' | 'br')[];
  style?: ViewStyle;
}

export function CornerFrame({
  color = '#00C8E0',
  size = 12,
  thickness = 1.5,
  inset = 0,
  corners = ['tl', 'tr', 'bl', 'br'],
  style,
}: CornerFrameProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
      {corners.includes('tl') && (
        <View style={{
          position: 'absolute',
          top: inset, left: inset,
          width: size, height: size,
          borderTopWidth: thickness,
          borderLeftWidth: thickness,
          borderColor: color,
        }} />
      )}
      {corners.includes('tr') && (
        <View style={{
          position: 'absolute',
          top: inset, right: inset,
          width: size, height: size,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
          borderColor: color,
        }} />
      )}
      {corners.includes('bl') && (
        <View style={{
          position: 'absolute',
          bottom: inset, left: inset,
          width: size, height: size,
          borderBottomWidth: thickness,
          borderLeftWidth: thickness,
          borderColor: color,
        }} />
      )}
      {corners.includes('br') && (
        <View style={{
          position: 'absolute',
          bottom: inset, right: inset,
          width: size, height: size,
          borderBottomWidth: thickness,
          borderRightWidth: thickness,
          borderColor: color,
        }} />
      )}
    </View>
  );
}
