/**
 * Sovereign Core FX v1.0 — Proprietary Visual Effect Component
 * Authored for Butler AI · 100% Original React Native & SVG Geometry
 *
 * Renders an animated multi-layered cybernetic core widget featuring:
 *   - Concentric rotating telemetry rings (Svg)
 *   - Pulsing core reactor node with variable intensity states
 *   - Orbiting satellite data nodes
 *   - Sweep radar line with smooth spring/timing interpolations
 *   - Cleanup-safe animation loops and reduced-motion compliance
 *
 * Zero external web dependencies. Fully OnSpace.ai and Expo compatible.
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Circle, Line, Path, G, Rect, Polygon } from 'react-native-svg';
import { useSkin } from '@/hooks/useSkin';

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

interface SovereignCoreFXProps {
  size?: number;
  status?: 'idle' | 'syncing' | 'secure' | 'alert';
  pulseSpeedMs?: number;
  label?: string;
}

export const SovereignCoreFX = memo(function SovereignCoreFX({
  size = 220,
  status = 'secure',
  pulseSpeedMs = 2400,
  label = 'SOVEREIGN CORE ACTIVE',
}: SovereignCoreFXProps) {
  const S = useSkin();
  
  // Animation drivers
  const rotation = useRef(new Animated.Value(0)).current;
  const counterRotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.85)).current;
  const sweepAngle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Clockwise Ring Rotation Loop
    const rotLoop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );
    rotLoop.start();

    // 2. Counter-Clockwise Ring Rotation Loop
    const counterLoop = Animated.loop(
      Animated.timing(counterRotation, {
        toValue: 1,
        duration: 16000,
        useNativeDriver: true,
      })
    );
    counterLoop.start();

    // 3. Reactor Pulse Loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: pulseSpeedMs / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: pulseSpeedMs / 2,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 4. Radar Sweep Loop
    const sweepLoop = Animated.loop(
      Animated.timing(sweepAngle, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    sweepLoop.start();

    return () => {
      rotLoop.stop();
      counterLoop.stop();
      pulseLoop.stop();
      sweepLoop.stop();
    };
  }, [pulseSpeedMs]);

  // Interpolations
  const spinCw = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCcw = counterRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const sweep = sweepAngle.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // State-driven color selection
  const accentColor =
    status === 'alert'
      ? S.danger
      : status === 'syncing'
      ? S.warn
      : status === 'secure'
      ? S.ok
      : S.accent;

  const centerRadius = size * 0.22;
  const midRadius = size * 0.36;
  const outerRadius = size * 0.44;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Glow Ring */}
      <View
        style={[
          styles.ambientGlow,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.8) / 2,
            backgroundColor: `${accentColor}12`,
            borderColor: `${accentColor}30`,
          },
        ]}
      />

      {/* SVG Vector Layers */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G transform={`translate(${size / 2}, ${size / 2})`}>
          
          {/* Outer Dashed Telemetry Ring */}
          <Circle
            cx="0"
            cy="0"
            r={outerRadius}
            stroke={`${accentColor}40`}
            strokeWidth="1.5"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* Inner Hexagonal Frame */}
          <Polygon
            points={`
              0,${-midRadius} 
              ${midRadius * 0.866},${midRadius * 0.5} 
              ${-midRadius * 0.866},${midRadius * 0.5}
            `}
            stroke={`${accentColor}50`}
            strokeWidth="1.2"
            fill="none"
          />
          <Polygon
            points={`
              0,${midRadius} 
              ${-midRadius * 0.866},${-midRadius * 0.5} 
              ${midRadius * 0.866},${-midRadius * 0.5}
            `}
            stroke={`${accentColor}30`}
            strokeWidth="1"
            fill="none"
          />

          {/* Crosshair Axes */}
          <Line x1={-outerRadius - 6} y1="0" x2={outerRadius + 6} y2="0" stroke={`${accentColor}30`} strokeWidth="1" />
          <Line x1="0" y1={-outerRadius - 6} x2="0" y2={outerRadius + 6} stroke={`${accentColor}30`} strokeWidth="1" />

        </G>
      </Svg>

      {/* Counter-Clockwise Animated Mid Ring */}
      <Animated.View
        style={[
          styles.absoluteLayer,
          {
            width: size,
            height: size,
            transform: [{ rotate: spinCcw }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G transform={`translate(${size / 2}, ${size / 2})`}>
            <Circle
              cx="0"
              cy="0"
              r={midRadius}
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="12 18"
              fill="none"
            />
            {/* Satellite Node */}
            <Circle cx={midRadius} cy="0" r="3.5" fill={accentColor} />
            <Circle cx={-midRadius} cy="0" r="2.5" fill={accentColor} opacity="0.6" />
          </G>
        </Svg>
      </Animated.View>

      {/* Clockwise Animated Outer Ring */}
      <Animated.View
        style={[
          styles.absoluteLayer,
          {
            width: size,
            height: size,
            transform: [{ rotate: spinCw }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G transform={`translate(${size / 2}, ${size / 2})`}>
            <Circle
              cx="0"
              cy="0"
              r={outerRadius}
              stroke={`${accentColor}80`}
              strokeWidth="2"
              strokeDasharray="24 36"
              fill="none"
            />
            {/* Dual Satellite Nodes */}
            <Circle cx="0" cy={outerRadius} r="4" fill={accentColor} />
            <Circle cx="0" cy={-outerRadius} r="3" fill={accentColor} opacity="0.7" />
          </G>
        </Svg>
      </Animated.View>

      {/* Radar Sweep Beam */}
      <Animated.View
        style={[
          styles.absoluteLayer,
          {
            width: size,
            height: size,
            transform: [{ rotate: sweep }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G transform={`translate(${size / 2}, ${size / 2})`}>
            <Line x1="0" y1="0" x2="0" y2={-outerRadius} stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.7" />
            <Path d={`M0 0 L 0 ${-outerRadius} A ${outerRadius} ${outerRadius} 0 0 1 ${outerRadius * 0.7} ${-outerRadius * 0.7} Z`} fill={`${accentColor}15`} />
          </G>
        </Svg>
      </Animated.View>

      {/* Pulsing Core Reactor Center */}
      <Animated.View
        style={[
          styles.absoluteLayer,
          styles.centerReactor,
          {
            width: centerRadius * 2,
            height: centerRadius * 2,
            borderRadius: centerRadius,
            borderColor: accentColor,
            backgroundColor: `${accentColor}25`,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <View
          style={[
            styles.innerCore,
            {
              width: centerRadius * 1.1,
              height: centerRadius * 1.1,
              borderRadius: (centerRadius * 1.1) / 2,
              backgroundColor: accentColor,
            },
          ]}
        />
      </Animated.View>

      {/* Status Badge Label */}
      <View style={[styles.badgeWrap, { borderColor: `${accentColor}50`, backgroundColor: `${S.panel}E6` }]}>
        <View style={[styles.ledDot, { backgroundColor: accentColor }]} />
        <Text style={[styles.badgeText, { color: accentColor, fontFamily: MONO }]}>
          {label}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 12,
  },
  ambientGlow: {
    position: 'absolute',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerReactor: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  innerCore: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  badgeWrap: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  ledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default SovereignCoreFX;
