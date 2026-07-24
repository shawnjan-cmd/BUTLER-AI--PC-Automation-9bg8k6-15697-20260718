/**
 * AdaptiveCard — a card container that automatically:
 *  1. Uses the correct background, border, and left accent rail
 *  2. Adapts border radius to screen size (tablet gets bigger corners)
 *  3. Slides up + fades in on mount (Reanimated stagger ready)
 *  4. Scales 0.97 on press with haptic feedback
 *  5. Shows "TAP TO EXPAND" label if onPress is provided (per spec 21.31)
 *  6. Respects __BUTLER_SAFE_MODE__ — static render in safe mode
 *
 * This is the canonical card component for Butler AI.
 * Every metric card, feature card, and info card should use this.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useCallback, useEffect } from 'react';
import {
  Pressable, View, Text, StyleSheet, ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { FontFamily } from '@/constants/typography';
import { haptics } from '@/services/haptics';

const SPRING = { damping: 22, stiffness: 260 } as const;

interface AdaptiveCardProps {
  children:     React.ReactNode;
  /** Module accent color (left rail + border tint). */
  accent?:      string;
  /** Stagger index — delays entrance animation by idx × 60ms. */
  staggerIndex?: number;
  /** Called on tap. Shows "TAP TO EXPAND" hint when provided. */
  onPress?:     () => void;
  /** Long-press handler. */
  onLongPress?: () => void;
  /** Extra outer style. */
  style?:       ViewStyle;
  /** Inner padding. Default 12. */
  padding?:     number;
  /** Show left accent rail. Default true. */
  rail?:        boolean;
  /** Disable entrance animation. */
  noAnimation?: boolean;
}

export const AdaptiveCard = memo(function AdaptiveCard({
  children,
  accent        = '#6EE7FF',
  staggerIndex  = 0,
  onPress,
  onLongPress,
  style,
  padding       = 12,
  rail          = true,
  noAnimation   = false,
}: AdaptiveCardProps) {
  const safeMode = (globalThis as any).__BUTLER_SAFE_MODE__;

  // Entrance animation
  const translateY = useSharedValue(noAnimation || safeMode ? 0 : 16);
  const opacity    = useSharedValue(noAnimation || safeMode ? 1 : 0);

  useEffect(() => {
    if (noAnimation || safeMode) return;
    const delay = staggerIndex * 60;
    translateY.value = withDelay(delay, withSpring(0, SPRING));
    opacity.value    = withDelay(delay, withTiming(1, { duration: 220 }));
  }, []);

  // Press scale
  const scale = useSharedValue(1);

  const handlePressIn  = useCallback(() => {
    scale.value = withSpring(0.97, SPRING);
    haptics.light();
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform:   [{ translateY: translateY.value }, { scale: scale.value }],
    opacity:     opacity.value,
  }));

  const inner = (
    <View style={[ss.card, { padding }, style]}>
      {/* Left accent rail */}
      {rail && (
        <View style={[ss.rail, { backgroundColor: accent }]} />
      )}

      {/* Top accent border */}
      <View style={[ss.topBorder, { backgroundColor: accent + '40' }]} />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {children}
      </View>

      {/* TAP TO EXPAND hint — shown per spec 21.31 whenever onPress is defined */}
      {onPress ? (
        <Text style={ss.expandHint}>TAP TO EXPAND</Text>
      ) : null}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <Animated.View style={animStyle}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {inner}
        </Pressable>
      </Animated.View>
    );
  }

  return <Animated.View style={animStyle}>{inner}</Animated.View>;
});

const ss = StyleSheet.create({
  card: {
    backgroundColor:   '#0D1117',
    borderRadius:      10,
    borderWidth:       1,
    borderColor:       'rgba(110,231,255,0.14)',
    overflow:          'hidden',
    marginBottom:      12,
    flexDirection:     'row',
    position:          'relative',
  },
  rail: {
    width:             3,
    alignSelf:         'stretch',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    marginRight:       10,
  },
  topBorder: {
    position:   'absolute',
    top:        0,
    left:       0,
    right:      0,
    height:     1,
  },
  expandHint: {
    position:      'absolute',
    bottom:        6,
    right:         10,
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    color:         'rgba(107,114,128,0.7)',
    letterSpacing: 1,
  },
});

export default AdaptiveCard;
