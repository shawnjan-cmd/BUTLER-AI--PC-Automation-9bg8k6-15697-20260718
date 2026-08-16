/**
 * GlitchText — RGB-channel split flicker (~3-4s intervals).
 * Use SPARINGLY: boot sequences, error states, or one hero title only.
 * Not for body text.
 *
 * @example
 *   <GlitchText style={{ fontSize: 28, color: '#FFF' }}>BUTLER AI</GlitchText>
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, Text, TextStyle } from 'react-native';

interface GlitchTextProps {
  children: string;
  style?: TextStyle;
  active?: boolean;
  color?: string;
  redColor?: string;
  blueColor?: string;
}

export function GlitchText({
  children,
  style,
  active = true,
  color = '#E6F0FF',
  redColor = '#FF3B30',
  blueColor = '#00E5FF',
}: GlitchTextProps) {
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    // Stagger start to prevent synchronized glitching
    const startDelay = Math.random() * 1200;
    const timer = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shift, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(shift, { toValue: 0, duration: 60, useNativeDriver: true }),
          Animated.delay(2600 + Math.random() * 2000),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, startDelay);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) {
    return <Text style={[style, { color }]}>{children}</Text>;
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Red channel — offset left */}
      <Animated.Text
        style={[
          style,
          {
            color: redColor,
            position: 'absolute',
            opacity: 0.45,
            transform: [{ translateX: shift.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }) }],
          },
        ]}
      >
        {children}
      </Animated.Text>
      {/* Blue channel — offset right */}
      <Animated.Text
        style={[
          style,
          {
            color: blueColor,
            position: 'absolute',
            opacity: 0.45,
            transform: [{ translateX: shift.interpolate({ inputRange: [0, 1], outputRange: [0, 1.5] }) }],
          },
        ]}
      >
        {children}
      </Animated.Text>
      {/* Main text */}
      <Text style={[style, { color }]}>{children}</Text>
    </View>
  );
}
