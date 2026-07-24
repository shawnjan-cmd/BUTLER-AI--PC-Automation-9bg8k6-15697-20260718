/**
 * HoldToConfirmButton — hold-to-confirm action button.
 * Section 22.14: fill animates scaleX (native driver) while held.
 * Supports medium (1.5s) and critical (3s) hold durations.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useCallback, useRef } from 'react';
import {
  View, Text, Animated, Pressable, StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { haptics } from '@/services/haptics';

export type ConfirmLevel = 'medium' | 'high' | 'critical';

const DURATION: Record<ConfirmLevel, number> = {
  medium:   1500,
  high:     3000,
  critical: 3000,
};

const COLORS: Record<ConfirmLevel, string> = {
  medium:   '#FF9500',
  high:     '#FF6622',
  critical: '#FF3B30',
};

export interface HoldToConfirmButtonProps {
  label:      string;
  icon?:      string;
  level?:     ConfirmLevel;
  onConfirm:  () => void;
  disabled?:  boolean;
  style?:     any;
}

export const HoldToConfirmButton = memo(function HoldToConfirmButton({
  label,
  icon,
  level     = 'medium',
  onConfirm,
  disabled  = false,
  style,
}: HoldToConfirmButtonProps) {
  const fillAnim = useRef(new Animated.Value(0)).current; // native — transform scaleX
  const activeRef = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dur       = DURATION[level];
  const col       = COLORS[level];

  const startHold = useCallback(() => {
    if (disabled) return;
    activeRef.current = true;
    haptics.light();
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: dur,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && activeRef.current) {
        haptics.success();
        onConfirm();
      }
    });
    // Haptic tick at 50%
    timerRef.current = setTimeout(() => {
      if (activeRef.current) haptics.medium();
    }, dur / 2);
  }, [disabled, dur, onConfirm]);

  const cancelHold = useCallback(() => {
    activeRef.current = false;
    fillAnim.stopAnimation();
    Animated.timing(fillAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={cancelHold}
      onLongPress={() => {}}
      delayLongPress={dur + 100}
      disabled={disabled}
      style={[s.root, { borderColor: col + '55', opacity: disabled ? 0.4 : 1 }, style]}
    >
      {/* Fill rail — scaleX native driver */}
      <Animated.View style={[
        StyleSheet.absoluteFill,
        s.fill,
        {
          backgroundColor: col + '25',
          transform: [
            { translateX: -1 },
            { scaleX: fillAnim },
            { translateX: 1 },
          ],
          transformOrigin: ['0%', '50%'],
        },
      ]} />

      {/* Content */}
      <View style={s.content}>
        {icon && (
          <MaterialIcons name={icon as any} size={15} color={col} />
        )}
        <Text style={[s.label, { color: col }]}>{label}</Text>
        <Text style={[s.hint, { color: col + '60' }]}>
          {level === 'critical' ? 'HOLD 3S' : 'HOLD'}
        </Text>
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  root: {
    borderRadius:  12,
    borderWidth:    1.5,
    overflow:      'hidden',
    position:      'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fill: {
    borderRadius:   0,
  },
  content: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             8,
    paddingVertical:  13,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       13,
    fontWeight:    '900' as any,
    letterSpacing:  0.5,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  hint: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       9,
    fontWeight:    '900' as any,
    letterSpacing:  0.5,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default HoldToConfirmButton;
