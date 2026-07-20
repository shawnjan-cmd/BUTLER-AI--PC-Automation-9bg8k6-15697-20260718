/**
 * IconBadge — 40×40 rounded-square with accent+22 background + optional glow.
 * Section headers, module tiles, script list rows.
 *
 * @example
 *   <IconBadge icon="psychology" color={COLOR.amber} glow />
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface IconBadgeProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  size?: number;
  iconSize?: number;
  glow?: boolean;
  style?: ViewStyle;
}

export function IconBadge({
  icon,
  color = '#00E5FF',
  size = 40,
  iconSize,
  glow = false,
  style,
}: IconBadgeProps) {
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: color + '22',
          borderColor: color + '40',
        },
        glow && {
          shadowColor: color,
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
        style,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={iconSize ?? Math.round(size * 0.5)}
        color={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
