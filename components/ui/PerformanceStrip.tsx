/**
 * PerformanceStrip — live performance metric pill row.
 * Shows CPU / RAM / DISK / LATENCY / FPS chips with real-time values.
 * Compact horizontal scroll strip for use at the top of Logs and Home screens.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Animated, AppState,
  Platform, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';

export interface PerformanceStripProps {
  cpu?:     number;  // 0–100
  ram?:     number;  // 0–100
  disk?:    number;  // 0–100
  latency?: number;  // ms
  fps?:     number;  // default 60
  isConn?:  boolean;
}

const CHIPS = (props: PerformanceStripProps) => {
  const { cpu = 0, ram = 0, disk = 0, latency = 0, fps = 60, isConn = false } = props;
  return [
    {
      icon:  'cpu-64-bit',
      label: 'CPU',
      value: isConn ? `${Math.round(cpu)}%`    : '—',
      color: cpu  > 80 ? '#F87171' : '#00FFD4',
    },
    {
      icon:  'memory',
      label: 'RAM',
      value: isConn ? `${Math.round(ram)}%`    : '—',
      color: ram  > 85 ? '#F87171' : '#FF9500',
    },
    {
      icon:  'harddisk',
      label: 'DISK',
      value: isConn ? `${Math.round(disk)}%`   : '—',
      color: disk > 90 ? '#F87171' : '#00FFD4',
    },
    {
      icon:  'lightning-bolt',
      label: 'PING',
      value: isConn && latency > 0 ? `${latency}ms` : '—',
      color: latency > 200 ? '#FF9500' : '#34D399',
    },
    {
      icon:  'monitor',
      label: 'FPS',
      value: `${fps}fps`,
      color: fps  < 30 ? '#F87171' : '#A78BFA',
    },
  ] as const;
};

export const PerformanceStrip = memo(function PerformanceStrip(props: PerformanceStripProps) {
  const chips = CHIPS(props);
  const pulseAnims = useRef(chips.map(() => new Animated.Value(0.6))).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;

    const loops = pulseAnims.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(a, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ]))
    );
    loops.forEach(l => l.start());

    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') loops.forEach(l => l.stop());
      else loops.forEach(l => l.start());
    });

    return () => {
      mountedRef.current = false;
      loops.forEach(l => l.stop());
      sub.remove();
    };
  }, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
    >
      {chips.map((chip, i) => (
        <View key={chip.label} style={[s.chip, {
          backgroundColor: chip.color + '0E',
          borderColor:     chip.color + '40',
          borderTopColor:  chip.color,
        }]}>
          <View style={[s.iconBox, { backgroundColor: chip.color + '14', borderColor: chip.color + '40' }]}>
            <Animated.View style={{ opacity: pulseAnims[i] }}>
              <MaterialCommunityIcons name={chip.icon as any} size={14} color={chip.color} />
            </Animated.View>
          </View>
          <Text style={[s.label, { color: chip.color + '80' }]}>{chip.label}</Text>
          <Text style={[s.value, { color: props.isConn ? chip.color : '#3D4C63' }]}>
            {chip.value}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
});

const s = StyleSheet.create({
  row:     { gap: 8, paddingHorizontal: 14, paddingVertical: 6 },
  chip:    {
    alignItems:    'center',
    borderRadius:   12,
    borderWidth:    1,
    borderTopWidth: 2.5,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap:            4,
    minWidth:       68,
  },
  iconBox: {
    width:        30,
    height:       30,
    borderRadius:  9,
    borderWidth:   1.5,
    alignItems:   'center',
    justifyContent: 'center',
  },
  label:   {
    fontFamily:    FontFamily.mono as any,
    fontSize:       8,
    fontWeight:    '900' as any,
    letterSpacing:  1,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  value:   {
    fontFamily:    FontFamily.mono as any,
    fontSize:       13,
    fontWeight:    '400' as any,
    lineHeight:     17,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default PerformanceStrip;
