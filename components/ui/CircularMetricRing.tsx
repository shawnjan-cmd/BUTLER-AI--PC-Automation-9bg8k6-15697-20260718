/**
 * CircularMetricRing — Double-layer SVG ring gauge (outer glow + crisp inner stroke).
 * 60fps-safe: pure SVG, no Animated state.
 * Matches NEXUS design prompt's "Circular Progress Rings" spec.
 *
 * @example
 *   <CircularMetricRing value={73} color={COLOR.cyan} label="CPU" size={88} />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularMetricRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function CircularMetricRing({
  value,
  max = 100,
  size = 88,
  strokeWidth = 7,
  color = '#00E5FF',
  label,
  showValue = true,
}: CircularMetricRingProps) {
  const radius        = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct           = Math.min(1, Math.max(0, value / max));
  const dashOffset    = circumference * (1 - pct);
  const center        = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track ring */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Outer glow pass */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeOpacity={0.22}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        {/* Crisp inner stroke */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      {showValue && (
        <View style={styles.center}>
          <Text style={[styles.value, { color, fontSize: size * 0.22 }]}>
            {Math.round(value)}
          </Text>
          <Text style={[styles.unit, { color: color + '70' }]}>%</Text>
        </View>
      )}

      {label && (
        <Text style={[styles.label, { color: color + '90', marginTop: size + 4 }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  value: {
    fontFamily: 'monospace',
    fontWeight: '800',
    lineHeight: undefined,
  },
  unit: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    position: 'absolute',
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    top: '100%',
  },
});
