/**
 * NexusGlowButton — Reusable cyberpunk glow action button
 * Drop-in replacement for plain TouchableOpacity CTAs
 * Features: corner brackets, glow shadow, press animation, loading state
 */

import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity, Text, View, StyleSheet, Platform,
  Animated, ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

interface NexusGlowButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  icon?: string;
  iconLib?: 'material' | 'community';
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  style?: any;
}

export function NexusGlowButton({
  label, onPress, color = '#00DCFF',
  icon, iconLib = 'material',
  loading = false, disabled = false,
  size = 'md', variant = 'solid',
  style,
}: NexusGlowButtonProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    haptics.light();
    Animated.spring(pressAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;

  const sizes = {
    sm: { pad: { paddingHorizontal: 12, paddingVertical: 8 },  fontSize: 10, iconSize: 13, radius: 8 },
    md: { pad: { paddingHorizontal: 16, paddingVertical: 13 }, fontSize: 12, iconSize: 16, radius: 12 },
    lg: { pad: { paddingHorizontal: 22, paddingVertical: 16 }, fontSize: 14, iconSize: 18, radius: 14 },
  };
  const sz = sizes[size];

  const bgColor = variant === 'solid'   ? color
    : variant === 'outline' ? color + '14'
    : 'transparent';
  const borderColor = color;
  const textColor   = variant === 'solid' ? '#000' : color;
  const opacity     = disabled ? 0.4 : 1;

  return (
    <Animated.View style={[{ transform: [{ scale: pressAnim }], opacity }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          gb.btn,
          sz.pad,
          {
            backgroundColor: bgColor,
            borderColor,
            borderRadius: sz.radius,
            borderWidth: variant === 'ghost' ? 0 : 1.5,
            ...Platform.select({
              ios: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
              android: { elevation: 6 },
            }),
          },
        ]}
      >
        {/* HUD corners — only on md/lg */}
        {size !== 'sm' ? (
          <>
            <View style={[gb.cTL, { borderColor: color + '80' }]} />
            <View style={[gb.cBR, { borderColor: color + '50' }]} />
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator size="small" color={textColor} style={{ transform: [{ scale: 0.8 }] }} />
        ) : icon ? (
          <Icon name={icon as any} size={sz.iconSize} color={textColor} />
        ) : null}

        <Text style={[gb.label, { color: textColor, fontSize: sz.fontSize }]}>
          {loading ? 'LOADING...' : label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const gb = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', overflow: 'hidden' },
  label: { fontFamily: MONO, fontWeight: '900', letterSpacing: 1 },
  cTL:   { position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  cBR:   { position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
});

export default NexusGlowButton;
