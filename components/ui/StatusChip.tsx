/**
 * StatusChip — Small live-status badge with a pulse dot.
 * radius:8 (not a full pill), consistent app-wide.
 *
 * @example
 *   <StatusChip label="LIVE"    color={COLOR.green} />
 *   <StatusChip label="OFFLINE" color={COLOR.red}   dot={false} />
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StatusChipProps {
  label: string;
  color?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  dot?: boolean;
  pulse?: boolean;
}

function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: a,
      }}
    />
  );
}

export function StatusChip({
  label,
  color = '#00FF88',
  icon,
  dot = true,
  pulse = true,
}: StatusChipProps) {
  return (
    <View style={[styles.chip, { borderColor: color + '44', backgroundColor: color + '14' }]}>
      {dot && (pulse
        ? <PulseDot color={color} size={5} />
        : <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
      )}
      {icon && <MaterialIcons name={icon} size={11} color={color} />}
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
