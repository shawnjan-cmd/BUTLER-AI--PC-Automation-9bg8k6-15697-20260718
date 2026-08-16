import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ButlerMicrocopy({ text, accent = '#38D9E8', icon = 'information-outline' }: { text: string; accent?: string; icon?: string }) {
  return (
    <View style={styles.row} accessibilityRole="text">
      <MaterialCommunityIcons name={icon as any} size={12} color={accent} />
      <Text style={[styles.text, { color: accent + 'CC' }]} numberOfLines={2}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 3 },
  text: { flex: 1, fontFamily: 'monospace', fontSize: 8.5, lineHeight: 13, letterSpacing: 0.2 },
});

export default ButlerMicrocopy;
