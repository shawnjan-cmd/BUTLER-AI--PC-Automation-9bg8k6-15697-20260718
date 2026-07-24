/**
 * ButlerLogo — Animated Butler AI robot mascot.
 * v3: tap-for-tip tooltip, orbit ring, Orbitron/ShareTechMono fonts.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated, Easing, View, Text, Platform, StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { BUTLER_ROBOT_TIPS } from '@/constants/robotTips';

interface ButlerLogoProps {
  size?:     number;
  animated?: boolean;
  showText?: boolean;
  glowColor?: string;
  subtitle?: string;
  /** If true, tap shows a random tip from BUTLER_ROBOT_TIPS */
  interactive?: boolean;
}

export default function ButlerLogo({
  size        = 120,
  animated    = true,
  showText    = true,
  glowColor   = '#00E5FF',
  subtitle    = 'AI COMMAND CENTER',
  interactive = true,
}: ButlerLogoProps) {
  // ── Animation values ─────────────────────────────────────────────────
  // JS-driver values (backgroundColor, borderColor, opacity of non-transform)
  const pulseA = useRef(new Animated.Value(0.4)).current;  // useNativeDriver: false
  const glowA  = useRef(new Animated.Value(0.3)).current;  // useNativeDriver: false
  // Native-driver values (transform, opacity of transforms)
  const ringA  = useRef(new Animated.Value(0)).current;    // useNativeDriver: true
  const ring2A = useRef(new Animated.Value(0.5)).current;  // useNativeDriver: true
  const orbitA = useRef(new Animated.Value(0)).current;    // useNativeDriver: true
  const eyeA   = useRef(new Animated.Value(1)).current;    // useNativeDriver: true
  const scanA  = useRef(new Animated.Value(0)).current;    // useNativeDriver: true
  const floatA = useRef(new Animated.Value(0)).current;    // useNativeDriver: true

  // Tip tooltip
  const [tipText,    setTipText]    = useState('');
  const [tipVisible, setTipVisible] = useState(false);
  const tipOpacity = useRef(new Animated.Value(0)).current; // useNativeDriver: true
  const mountedRef = useRef(true);

  // ── Start animations ─────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!animated) return;
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;

    const loops = [
      // JS-driver only
      Animated.loop(Animated.sequence([
        Animated.timing(pulseA, { toValue: 1,   duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseA, { toValue: 0.3, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(glowA,  { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(glowA,  { toValue: 0.2, duration: 1400, useNativeDriver: false }),
      ])),
      // Native-driver only
      Animated.loop(Animated.timing(ringA, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.timing(ring2A, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })),
      // Orbit ring (9s)
      Animated.loop(Animated.timing(orbitA, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })),
      // Float bob (2.4s)
      Animated.loop(Animated.sequence([
        Animated.timing(floatA, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatA, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])),
      // Eye blink
      Animated.loop(Animated.sequence([
        Animated.delay(3500),
        Animated.timing(eyeA, { toValue: 0.1, duration: 80, useNativeDriver: true }),
        Animated.timing(eyeA, { toValue: 1,   duration: 80, useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(eyeA, { toValue: 0.1, duration: 80, useNativeDriver: true }),
        Animated.timing(eyeA, { toValue: 1,   duration: 80, useNativeDriver: true }),
      ])),
      // Scan line
      Animated.loop(Animated.sequence([
        Animated.timing(scanA, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanA, { toValue: 0, duration: 0,    useNativeDriver: true }),
        Animated.delay(500),
      ])),
    ];
    loops.forEach(l => l.start());
    return () => {
      mountedRef.current = false;
      loops.forEach(l => l.stop());
    };
  }, [animated]);

  // ── Tip tooltip ───────────────────────────────────────────────────────
  const showTip = useCallback(() => {
    if (!interactive || !mountedRef.current) return;
    try { require('@/services/haptics').haptics?.medium?.(); } catch {}
    const tip = BUTLER_ROBOT_TIPS[Math.floor(Math.random() * BUTLER_ROBOT_TIPS.length)];
    setTipText(tip);
    setTipVisible(true);
    Animated.sequence([
      Animated.timing(tipOpacity, { toValue: 1,   duration: 220, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(tipOpacity, { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(() => { if (mountedRef.current) setTipVisible(false); });
  }, [interactive]);

  // ── Derived animated values ───────────────────────────────────────────
  const iconSize  = size * 0.42;
  const innerR    = size * 0.38;
  const ring1Rot  = ringA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ring2Rot  = ring2A.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const orbitRot  = orbitA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const borderC   = glowA.interpolate({ inputRange: [0, 1], outputRange: [glowColor + '44', glowColor + 'CC'] });
  const glowBg    = glowA.interpolate({ inputRange: [0, 1], outputRange: [glowColor + '10', glowColor + '25'] });
  const scanTY    = scanA.interpolate({ inputRange: [0, 1], outputRange: [-innerR, innerR] });
  const floatTY   = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const orbitR    = size * 0.54;

  const iosShadow = Platform.OS === 'ios'
    ? { shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: size * 0.25 }
    : {};

  return (
    <Pressable onPress={showTip} style={{ alignItems: 'center', gap: showText ? 10 : 0 }}>

      {/* Tip tooltip */}
      {tipVisible && (
        <Animated.View style={{
          position:        'absolute',
          top:             -(size * 0.6),
          left:            -(size * 0.5),
          right:           -(size * 0.5),
          backgroundColor: '#131924',
          borderRadius:    8,
          borderWidth:     1,
          borderColor:     glowColor + '55',
          padding:         8,
          opacity:         tipOpacity,
          zIndex:          99,
        }}>
          <Text style={{
            fontFamily: FontFamily.body,
            fontSize:   11,
            color:      '#B7C4D3',
            textAlign:  'center',
            lineHeight: 16,
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
          }}>
            {tipText}
          </Text>
          {/* Tooltip arrow */}
          <View style={{
            position:        'absolute',
            bottom:          -5,
            left:            '50%',
            marginLeft:      -5,
            width:           10,
            height:          10,
            backgroundColor: '#131924',
            transform:       [{ rotate: '45deg' }],
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor:     glowColor + '55',
          }} />
        </Animated.View>
      )}

      {/* Floating container */}
      <Animated.View style={{ transform: [{ translateY: floatTY }], alignItems: 'center' }}>
        {/* Orbit ring */}
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            width:        orbitR * 2,
            height:       orbitR * 2,
            borderRadius: orbitR,
            alignSelf:    'center',
            transform:    [{ rotate: orbitRot }],
          },
        ]}>
          <View style={{
            position:        'absolute',
            top:             0,
            left:            orbitR - 4,
            width:           8,
            height:          8,
            borderRadius:    4,
            backgroundColor: glowColor,
            opacity:         0.9,
            ...iosShadow,
          }} />
        </Animated.View>

        {/* Outer glow halo */}
        <Animated.View style={{
          width:           size,
          height:          size,
          borderRadius:    size,
          backgroundColor: glowBg,
          alignItems:      'center',
          justifyContent:  'center',
          ...iosShadow,
        }}>
          {/* Spinning outer ring */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            borderRadius:  size,
            borderWidth:   1,
            borderColor:   glowColor + '50',
            borderStyle:   'dashed' as any,
            transform:     [{ rotate: ring1Rot }],
          }]} />
          {/* Spinning inner ring */}
          <Animated.View style={{
            position:      'absolute',
            width:         size * 0.82,
            height:        size * 0.82,
            borderRadius:  size,
            borderWidth:   1,
            borderColor:   glowColor + '30',
            borderStyle:   'dashed' as any,
            transform:     [{ rotate: ring2Rot }],
          }} />

          {/* Main avatar circle */}
          <Animated.View style={{
            width:           size * 0.74,
            height:          size * 0.74,
            borderRadius:    size,
            borderWidth:     2.5,
            borderColor:     borderC,
            backgroundColor: '#030A18',
            alignItems:      'center',
            justifyContent:  'center',
            overflow:        'hidden',
            ...iosShadow,
          }}>
            {/* Scan line */}
            <Animated.View pointerEvents="none" style={{
              position:        'absolute',
              left: 0, right: 0,
              height:          2,
              backgroundColor: glowColor,
              opacity:         0.35,
              transform:       [{ translateY: scanTY }],
            }} />

            {/* Antenna dots */}
            <View style={{
              position:      'absolute',
              top:           4,
              flexDirection: 'row',
              gap:           size * 0.12,
              alignItems:    'flex-end',
            }}>
              {[0, 1].map(i => (
                <Animated.View key={i} style={{
                  width:           4,
                  height:          4 + i * 3,
                  borderRadius:    2,
                  backgroundColor: glowColor,
                  opacity:         pulseA,
                }} />
              ))}
            </View>

            <MaterialCommunityIcons name="robot-happy-outline" size={iconSize} color={glowColor} />

            {/* Eye blink overlay */}
            <Animated.View style={{
              position:      'absolute',
              flexDirection: 'row',
              gap:           size * 0.15,
              marginTop:     size * 0.04,
              opacity:       eyeA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            }}>
              {[0, 1].map(i => (
                <View key={i} style={{
                  width:           size * 0.13,
                  height:          size * 0.13,
                  borderRadius:    size,
                  backgroundColor: '#030A18',
                }} />
              ))}
            </Animated.View>

            {/* Bottom color stripe */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.09, flexDirection: 'row' }}>
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
              position:        'absolute', ...pos,
              width:           5, height: 5, borderRadius: 3,
              backgroundColor: glowColor,
              opacity:         pulseA,
            }} />
          ))}
        </Animated.View>
      </Animated.View>

      {/* Text block */}
      {showText && (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontFamily:    FontFamily.displayBold,
              fontSize:      size * 0.185,
              color:         '#FFFFFF',
              letterSpacing: 2,
              ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
            }}>
              BUTLER
            </Text>
            <Text style={{
              fontFamily:    FontFamily.displayBold,
              fontSize:      size * 0.185,
              color:         glowColor,
              letterSpacing: 2,
              ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
            }}>
              {' AI'}
            </Text>
          </View>
          {subtitle ? (
            <Text style={{
              fontFamily:    FontFamily.displayMed,
              fontSize:      size * 0.072,
              color:         glowColor + '80',
              letterSpacing: 2.5,
              ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
            }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
