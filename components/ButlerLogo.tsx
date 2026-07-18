/**
 * ButlerLogo — Animated Butler AI logo using pure React Native.
 * No SVG dependencies. Combines View layers, MaterialCommunityIcons,
 * and Animated API for a glowing, pulsing robot emblem.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

interface ButlerLogoProps {
  size?: number;
  animated?: boolean;
  showText?: boolean;
  glowColor?: string;
  subtitle?: string;
}

export default function ButlerLogo({
  size = 120,
  animated = true,
  showText = true,
  glowColor = '#00E5FF',
  subtitle = 'AI COMMAND CENTER',
}: ButlerLogoProps) {
  const pulseA   = useRef(new Animated.Value(0.4)).current;
  const ringA    = useRef(new Animated.Value(0)).current;
  const ring2A   = useRef(new Animated.Value(0.5)).current;
  const glowA    = useRef(new Animated.Value(0.3)).current;
  const eyeA     = useRef(new Animated.Value(1)).current;
  const scanA    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(pulseA,  { toValue: 1,   duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseA,  { toValue: 0.3, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])),
      Animated.loop(Animated.timing(ringA, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.timing(ring2A, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.sequence([
        Animated.timing(glowA,  { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(glowA,  { toValue: 0.2, duration: 1400, useNativeDriver: false }),
      ])),
      // Eye blink
      Animated.loop(Animated.sequence([
        Animated.delay(3500),
        Animated.timing(eyeA, { toValue: 0.1, duration: 80,  useNativeDriver: true }),
        Animated.timing(eyeA, { toValue: 1,   duration: 80,  useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(eyeA, { toValue: 0.1, duration: 80,  useNativeDriver: true }),
        Animated.timing(eyeA, { toValue: 1,   duration: 80,  useNativeDriver: true }),
      ])),
      // Scan line sweep
      Animated.loop(Animated.sequence([
        Animated.timing(scanA, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanA, { toValue: 0, duration: 0,    useNativeDriver: true }),
        Animated.delay(500),
      ])),
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [animated]);

  const iconSize  = size * 0.42;
  const outerR    = size * 0.48;
  const innerR    = size * 0.38;
  const eyeR      = size * 0.065;

  const ring1Rot  = ringA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ring2Rot  = ring2A.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const borderC   = glowA.interpolate({ inputRange: [0, 1], outputRange: [glowColor + '44', glowColor + 'CC'] });
  const glowBg    = glowA.interpolate({ inputRange: [0, 1], outputRange: [glowColor + '10', glowColor + '25'] });
  const scanTY    = scanA.interpolate({ inputRange: [0, 1], outputRange: [-innerR, innerR] });

  const iosShadow = Platform.OS === 'ios'
    ? { shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: size * 0.25 }
    : {};

  return (
    <View style={{ alignItems: 'center', gap: showText ? 10 : 0 }}>
      {/* OUTER GLOW HALO */}
      <Animated.View style={[{
        width: size, height: size,
        borderRadius: size,
        backgroundColor: glowBg,
        alignItems: 'center', justifyContent: 'center',
        ...iosShadow,
      }]}>

        {/* SPINNING OUTER RING — dashed effect via small dots */}
        <Animated.View style={[StyleSheet.absoluteFill, {
          borderRadius: size,
          borderWidth: 1,
          borderColor: glowColor + '50',
          borderStyle: 'dashed' as any,
          transform: [{ rotate: ring1Rot }],
        }]} />

        {/* SPINNING INNER RING — opposite direction */}
        <Animated.View style={{
          position: 'absolute',
          width: size * 0.82, height: size * 0.82,
          borderRadius: size,
          borderWidth: 1,
          borderColor: glowColor + '30',
          borderStyle: 'dashed' as any,
          transform: [{ rotate: ring2Rot }],
        }} />

        {/* MAIN AVATAR CIRCLE */}
        <Animated.View style={[{
          width: size * 0.74,
          height: size * 0.74,
          borderRadius: size,
          borderWidth: 2.5,
          borderColor: borderC,
          backgroundColor: '#030A18',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...iosShadow,
        }]}>
          {/* Scan line overlay */}
          <Animated.View pointerEvents="none" style={{
            position: 'absolute',
            left: 0, right: 0,
            height: 2,
            backgroundColor: glowColor,
            opacity: 0.35,
            transform: [{ translateY: scanTY }],
          }} />

          {/* Robot face layers */}
          {/* Antenna dots */}
          <View style={{
            position: 'absolute', top: 4,
            flexDirection: 'row', gap: size * 0.12, alignItems: 'flex-end',
          }}>
            {[0, 1].map(i => (
              <Animated.View key={i} style={{
                width: 4, height: 4 + i * 3,
                borderRadius: 2,
                backgroundColor: glowColor,
                opacity: pulseA,
              }} />
            ))}
          </View>

          {/* ICON */}
          <MaterialCommunityIcons
            name="robot-happy-outline"
            size={iconSize}
            color={glowColor}
          />

          {/* Eye blink overlay */}
          <Animated.View style={{
            position: 'absolute',
            flexDirection: 'row',
            gap: size * 0.15,
            marginTop: size * 0.04,
            opacity: eyeA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }}>
            {[0, 1].map(i => (
              <View key={i} style={{
                width: eyeR * 2, height: eyeR * 2,
                borderRadius: eyeR,
                backgroundColor: '#030A18',
              }} />
            ))}
          </Animated.View>

          {/* Bottom status bar */}
          <View style={{
            position: 'absolute', bottom: 0,
            left: 0, right: 0,
            height: size * 0.09,
            flexDirection: 'row',
          }}>
            {['#00E5FF', '#CC44FF', '#00FF88'].map((c, i) => (
              <Animated.View key={i} style={{ flex: 1, backgroundColor: c, opacity: pulseA }} />
            ))}
          </View>
        </Animated.View>

        {/* Corner accent dots */}
        {[
          { top: size * 0.08, left: size * 0.08 },
          { top: size * 0.08, right: size * 0.08 },
          { bottom: size * 0.08, left: size * 0.08 },
          { bottom: size * 0.08, right: size * 0.08 },
        ].map((pos, i) => (
          <Animated.View key={i} style={{
            position: 'absolute', ...pos,
            width: 5, height: 5, borderRadius: 3,
            backgroundColor: glowColor,
            opacity: pulseA,
          }} />
        ))}
      </Animated.View>

      {/* TEXT BLOCK */}
      {showText && (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
              fontSize: size * 0.185,
              fontWeight: '900',
              color: '#FFFFFF',
              letterSpacing: 2,
            }}>
              BUTLER
            </Text>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
              fontSize: size * 0.185,
              fontWeight: '900',
              color: glowColor,
              letterSpacing: 2,
            }}>
              {' AI'}
            </Text>
          </View>
          {subtitle ? (
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
              fontSize: size * 0.072,
              fontWeight: '700',
              color: glowColor + '80',
              letterSpacing: 2.5,
            }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
