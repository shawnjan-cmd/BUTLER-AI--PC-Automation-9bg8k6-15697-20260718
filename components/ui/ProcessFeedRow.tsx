/**
 * ProcessFeedRow — single row for the live process feed / terminal log.
 * Matches Section 21.21 exact spec: level chip, timestamp, process name, result.
 * EXEC / OK / INF / WRN / ERR color-coded level chips.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FontFamily } from '@/constants/typography';

export type LogLevel = 'EXEC' | 'OK' | 'INF' | 'WRN' | 'ERR';

const LEVEL_CONFIG: Record<LogLevel, { bg: string; color: string; icon: string }> = {
  EXEC: { bg: 'rgba(34,119,255,0.20)',  color: '#2277FF', icon: '▶' },
  OK:   { bg: 'rgba(0,255,136,0.20)',   color: '#00FF88', icon: '▶' },
  INF:  { bg: 'rgba(0,212,255,0.20)',   color: '#00D4FF', icon: '▶' },
  WRN:  { bg: 'rgba(255,149,0,0.20)',   color: '#FF9500', icon: '⚠' },
  ERR:  { bg: 'rgba(255,59,48,0.20)',   color: '#FF3B30', icon: '✕' },
};

export interface ProcessFeedRowProps {
  level:     LogLevel;
  timestamp: string;
  process:   string;
  result?:   string;
  showBorder?: boolean;
}

export const ProcessFeedRow = memo(function ProcessFeedRow({
  level,
  timestamp,
  process,
  result,
  showBorder = true,
}: ProcessFeedRowProps) {
  const cfg = LEVEL_CONFIG[level];

  return (
    <View style={[s.row, showBorder && s.border]}>
      {/* Left icon */}
      <Text style={[s.icon, { color: cfg.color }]}>{cfg.icon}</Text>

      {/* Timestamp */}
      <Text style={s.ts}>{timestamp}</Text>

      {/* Level chip — fixed 36px */}
      <View style={[s.chip, { backgroundColor: cfg.bg }]}>
        <Text style={[s.chipTxt, { color: cfg.color }]} numberOfLines={1}>{level}</Text>
      </View>

      {/* Process name + result */}
      <Text style={s.content} numberOfLines={1}>
        <Text style={s.proc}>{process}</Text>
        {result ? <Text style={s.arrow}>{' → '}</Text> : null}
        {result ? <Text style={s.result}>{result}</Text> : null}
      </Text>
    </View>
  );
});

const MONO = FontFamily.mono as any;
const s = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingHorizontal: 12 },
  border:   { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  icon:     { fontFamily: MONO, fontSize: 8, width: 10, textAlign: 'center', ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}) },
  ts:       { fontFamily: MONO, fontSize: 9.5, color: 'rgba(0,212,255,0.55)', width: 56, ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}) },
  chip:     { width: 36, borderRadius: 3, paddingHorizontal: 2, paddingVertical: 2, alignItems: 'center' },
  chipTxt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900' as any, ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}) },
  content:  { fontFamily: MONO, fontSize: 9.5, flex: 1, ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}) },
  proc:     { color: '#E8EAF0', fontWeight: '700' as any },
  arrow:    { color: '#6B7280' },
  result:   { color: '#6B7280' },
});

export default ProcessFeedRow;
