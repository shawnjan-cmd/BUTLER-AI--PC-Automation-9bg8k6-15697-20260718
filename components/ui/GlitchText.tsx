/**
 * GlitchText — RGB-channel split flicker.
 * v2: supports `text` prop (for use in non-JSX contexts), glitchIntensity levels,
 * typewriter mode, and continuous mode.
 *
 * RULE 23: Use ONLY on BUTLER AI hero title and error state headers.
 * Never on body text, labels, or cards.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Text, TextStyle, Platform } from 'react-native';
import { FontFamily } from '@/constants/typography';

// Intensity presets
const INTENSITY_MAP = {
  low:     { amplitude: 2,  duration: 80, interval: 5000, charSwap: 0.10 },
  medium:  { amplitude: 4,  duration: 60, interval: 3000, charSwap: 0.20 },
  high:    { amplitude: 7,  duration: 40, interval: 1800, charSwap: 0.35 },
  extreme: { amplitude: 12, duration: 25, interval:  900, charSwap: 0.50 },
} as const;

type Intensity = keyof typeof INTENSITY_MAP;

interface GlitchTextProps {
  /** The text to display. Can also pass as children (string). */
  text?: string;
  children?: string;
  style?: TextStyle;
  /** Legacy: keep active=false to disable glitch */
  active?: boolean;
  color?: string;
  redColor?: string;
  blueColor?: string;
  /** Glitch intensity level. Default 'low'. */
  glitchIntensity?: Intensity;
  /** Font size shorthand (overrides style.fontSize). */
  fontSize?: number;
  /** fontWeight shorthand. */
  fontWeight?: TextStyle['fontWeight'];
  /** Letter spacing shorthand. */
  letterSpacing?: number;
  /** Typewriter mode: characters are revealed one by one. */
  typewriter?: boolean;
  typewriterSpeed?: number;
  /** Continuous mode: glitch runs constantly (only for error states). */
  continuous?: boolean;
  /** Called when typewriter finishes. */
  onTypewriterDone?: () => void;
}

export function GlitchText({
  text,
  children,
  style,
  active = true,
  color = '#E6F0FF',
  redColor = '#FF3B30',
  blueColor = '#00E5FF',
  glitchIntensity = 'low',
  fontSize,
  fontWeight,
  letterSpacing,
  typewriter = false,
  typewriterSpeed = 40,
  continuous = false,
  onTypewriterDone,
}: GlitchTextProps) {
  const content = text ?? (typeof children === 'string' ? children : '');
  const { amplitude, duration, interval } = INTENSITY_MAP[glitchIntensity];

  const shift = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState(typewriter ? '' : content);
  const mountedRef = useRef(true);

  // Typewriter effect
  useEffect(() => {
    if (!typewriter) { setDisplayText(content); return; }
    let i = 0;
    mountedRef.current = true;
    const t = setInterval(() => {
      if (!mountedRef.current) return;
      i++;
      setDisplayText(content.slice(0, i));
      if (i >= content.length) {
        clearInterval(t);
        onTypewriterDone?.();
      }
    }, typewriterSpeed);
    return () => { mountedRef.current = false; clearInterval(t); };
  }, [content, typewriter, typewriterSpeed]);

  // Glitch animation
  useEffect(() => {
    if (!active) return;
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;

    const startDelay = continuous ? 0 : Math.random() * 1200;
    const timer = setTimeout(() => {
      let loop: Animated.CompositeAnimation;
      if (continuous) {
        loop = Animated.loop(Animated.sequence([
          Animated.timing(shift, { toValue: 1, duration, useNativeDriver: false }),
          Animated.timing(shift, { toValue: 0, duration, useNativeDriver: false }),
          Animated.delay(100),
        ]));
      } else {
        loop = Animated.loop(Animated.sequence([
          Animated.timing(shift, { toValue: 1, duration, useNativeDriver: false }),
          Animated.timing(shift, { toValue: 0, duration, useNativeDriver: false }),
          Animated.delay(interval + Math.random() * 1500),
        ]));
      }
      loop.start();
      return () => loop.stop();
    }, startDelay);

    return () => clearTimeout(timer);
  }, [active, glitchIntensity, continuous]);

  const merged: TextStyle = {
    ...(style ?? {}),
    ...(fontSize     ? { fontSize }     : {}),
    ...(fontWeight   ? { fontWeight }   : {}),
    ...(letterSpacing ? { letterSpacing } : {}),
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  };

  if (!active) {
    return <Text style={[merged, { color }]}>{displayText}</Text>;
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Red channel */}
      <Animated.Text
        style={[merged, {
          color:    redColor,
          position: 'absolute',
          opacity:  0.45,
          transform: [{
            translateX: shift.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -amplitude / 2],
            }),
          }],
        }]}
      >
        {displayText}
      </Animated.Text>
      {/* Blue channel */}
      <Animated.Text
        style={[merged, {
          color:    blueColor,
          position: 'absolute',
          opacity:  0.45,
          transform: [{
            translateX: shift.interpolate({
              inputRange: [0, 1],
              outputRange: [0, amplitude / 2],
            }),
          }],
        }]}
      >
        {displayText}
      </Animated.Text>
      {/* Main text */}
      <Text style={[merged, { color }]}>{displayText}</Text>
    </View>
  );
}

export default GlitchText;
