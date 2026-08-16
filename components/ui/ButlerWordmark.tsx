import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Butler Glyphmark: the bowtie is a deliberate brand character, not a font
 * substitution. It stays legible on low-end devices and avoids shipping a
 * large custom font file while preserving a distinctive visual signature.
 */
export function ButlerWordmark({ compact = false, accent = '#38D9E8' }: { compact?: boolean; accent?: string }) {
  const size = compact ? 16 : 22;
  return (
    <View style={styles.row} accessible accessibilityLabel="Butler AI">
      <Text style={[styles.word, { fontSize: size, letterSpacing: compact ? 1.5 : 2 }]}>BUTL</Text>
      <View style={[styles.glyph, { width: compact ? 16 : 21, height: compact ? 11 : 14 }]} accessibilityLabel="Butler bowtie glyph">
        <View style={[styles.wing, styles.leftWing, { borderRightColor: accent, borderTopColor: 'transparent', borderBottomColor: 'transparent' }]} />
        <View style={[styles.wing, styles.rightWing, { borderLeftColor: accent, borderTopColor: 'transparent', borderBottomColor: 'transparent' }]} />
        <View style={[styles.knot, { backgroundColor: accent }]} />
      </View>
      <Text style={[styles.word, { fontSize: size, letterSpacing: compact ? 1.5 : 2 }]}>R</Text>
      {!compact && <Text style={[styles.ai, { color: accent }]}>AI</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  word: { color: '#F4F8FF', fontFamily: 'monospace', fontWeight: '900' },
  ai: { marginLeft: 6, fontFamily: 'monospace', fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  glyph: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginHorizontal: 1 },
  wing: { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5 },
  leftWing: { borderRightWidth: 9 },
  rightWing: { borderLeftWidth: 9 },
  knot: { position: 'absolute', width: 3, height: 7, borderRadius: 2 },
});

export default ButlerWordmark;
