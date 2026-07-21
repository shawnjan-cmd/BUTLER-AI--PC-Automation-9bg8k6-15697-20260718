/**
 * SectionHeader — [● icon] SECTION TITLE ─────────
 * Standard section divider used by all screens.
 *
 * @example
 *   <SectionHeader title="LIVE GAUGES" color={COLOR.cyan} icon="gauge" />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  color?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  right?: React.ReactNode;
}

export function SectionHeader({
  title,
  color = '#00E5FF',
  icon,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {icon && (
        <MaterialIcons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
      )}
      <Text style={[styles.title, { color }]}>{title.toUpperCase()}</Text>
      <View style={[styles.rule, { backgroundColor: color + '30' }]} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  rule: {
    flex: 1,
    height: 1,
    marginLeft: 10,
  },
});
