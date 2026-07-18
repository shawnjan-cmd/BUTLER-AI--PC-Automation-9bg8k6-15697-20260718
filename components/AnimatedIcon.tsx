/**
 * AnimatedIcon — pure React Native animated icon wrapper.
 * No react-native-svg required. Uses View composition + Animated API.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Platform } from 'react-native';

export type AnimationPreset =
  | 'pulse' | 'breathe' | 'rotate' | 'glitch' | 'scan'
  | 'flicker' | 'spin' | 'beat' | 'none';

export type GlowColor = 'teal' | 'green' | 'purple' | 'red' | 'amber' | 'blue' | 'pink';

const GLOW_MAP: Record<GlowColor, string> = {
  teal:   '#00E5FF',
  green:  '#00FF88',
  purple: '#CC44FF',
  red:    '#FF3344',
  amber:  '#FFB020',
  blue:   '#4499FF',
  pink:   '#FF6EB4',
};

interface AnimatedIconProps {
  size?: number;
  glowColor?: GlowColor;
  glowIntensity?: number;
  animation?: AnimationPreset;
  animationDuration?: number;
  children: React.ReactNode;
  showBorder?: boolean;
  borderWidth?: number;
  backgroundColor?: string;
  style?: object;
}

export default function AnimatedIcon({
  size = 48,
  glowColor = 'teal',
  glowIntensity = 0.6,
  animation = 'pulse',
  animationDuration = 2000,
  children,
  showBorder = false,
  borderWidth = 1.5,
  backgroundColor,
  style,
}: AnimatedIconProps) {
  const color = GLOW_MAP[glowColor];
  const animRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animation === 'none') return;
    const isSpin = animation === 'rotate' || animation === 'spin';
    const loop = isSpin
      ? Animated.loop(
          Animated.timing(animRef, {
            toValue: 1,
            duration: animationDuration,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        )
      : Animated.loop(
          Animated.sequence([
            Animated.timing(animRef, {
              toValue: 1,
              duration: animationDuration / 2,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(animRef, {
              toValue: 0,
              duration: animationDuration / 2,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
    loop.start();
    return () => loop.stop();
  }, [animation, animationDuration]);

  const getStyle = () => {
    switch (animation) {
      case 'pulse':
        return { opacity: animRef.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) };
      case 'breathe':
        return { transform: [{ scale: animRef.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] }) }] };
      case 'rotate':
      case 'spin':
        return { transform: [{ rotate: animRef.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] };
      case 'glitch':
        return {
          transform: [{
            translateX: animRef.interpolate({
              inputRange: [0, 0.1, 0.2, 0.8, 0.9, 1],
              outputRange: [0, -2, 2, 0, -1, 0],
            }),
          }],
        };
      case 'flicker':
        return {
          opacity: animRef.interpolate({
            inputRange: [0, 0.05, 0.1, 0.5, 0.55, 1],
            outputRange: [1, 0.25, 1, 1, 0.2, 1],
          }),
        };
      case 'beat':
        return {
          transform: [{
            scale: animRef.interpolate({
              inputRange: [0, 0.15, 0.3, 1],
              outputRange: [1, 1.12, 1, 1],
            }),
          }],
        };
      default:
        return {};
    }
  };

  const glowOpacity = glowIntensity * 0.35;

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size * 0.22,
          borderWidth: showBorder ? borderWidth : 0,
          borderColor: color,
          backgroundColor: backgroundColor ?? color + Math.round(glowOpacity * 255).toString(16).padStart(2, '0'),
          ...(Platform.OS === 'ios'
            ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: glowIntensity * 0.7, shadowRadius: size * 0.2 }
            : {}),
        },
        getStyle(),
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
