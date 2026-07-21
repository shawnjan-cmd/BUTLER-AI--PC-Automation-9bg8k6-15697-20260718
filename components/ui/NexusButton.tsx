/**
 * NexusButton — Reusable CTA with corner-flash press signature.
 * On press-in, four corner ticks flash for 80ms then fade.
 * Variants: primary (filled) | outline | danger | ghost.
 *
 * @example
 *   <NexusButton label="EXECUTE" icon="play-arrow" color={COLOR.green} onPress={run} />
 *   <NexusButton label="CANCEL"  variant="outline" color={COLOR.red}   onPress={cancel} />
 */
import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated, ViewStyle, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Variant = 'primary' | 'outline' | 'danger' | 'ghost';

interface NexusButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  color?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: any;
  full?: boolean;
}

export function NexusButton({
  label,
  onPress,
  variant = 'primary',
  color = '#00E5FF',
  icon,
  disabled,
  loading,
  style,
  textStyle,
  full,
}: NexusButtonProps) {
  const flash = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const bg =
    variant === 'primary' ? color :
    variant === 'danger'  ? '#FF3B30' :
    variant === 'ghost'   ? color + '18' :
    'transparent';

  const border =
    variant === 'outline' ? color + '70' :
    variant === 'ghost'   ? color + '35' :
    'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger' ? '#000' : color;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant !== 'primary' && variant !== 'danger' ? 1.5 : 0,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        (variant === 'primary' || variant === 'danger') && {
          shadowColor: variant === 'danger' ? '#FF3B30' : color,
          shadowOpacity: 0.45,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 10,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
        (disabled || loading) && { opacity: 0.38 },
        style,
      ]}
    >
      {/* Signature corner flash on press-in */}
      <Animated.View pointerEvents="none" style={[styles.tick, styles.tickTL, { borderColor: textColor, opacity: flash }]} />
      <Animated.View pointerEvents="none" style={[styles.tick, styles.tickBR, { borderColor: textColor, opacity: flash }]} />

      {loading
        ? <ActivityIndicator size="small" color={textColor} />
        : icon && <MaterialIcons name={icon} size={16} color={textColor} style={{ marginRight: 4 }} />
      }
      <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tick: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  tickTL: { top: -2,   left: -2,   borderTopWidth: 2, borderLeftWidth: 2 },
  tickBR: { bottom: -2, right: -2, borderBottomWidth: 2, borderRightWidth: 2 },
});
