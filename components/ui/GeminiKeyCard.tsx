/**
 * GeminiKeyCard — Gemini service removed.
 * Renders a placeholder card so settings.tsx import stays valid.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

export function GeminiKeyCard() {
  return (
    <View style={st.card}>
      <View style={st.row}>
        <View style={st.iconWrap}>
          <MaterialIcons name="auto-awesome" size={20} color="#6A8EA8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>GEMINI AI</Text>
          <Text style={st.sub}>Offline AI — use Ollama on your PC instead (100% local, no API key needed).</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card:    { borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(100,140,160,0.2)', backgroundColor: '#060A12', padding: 14, marginBottom: 14 },
  row:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap:{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(100,140,160,0.3)', backgroundColor: 'rgba(100,140,160,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#6A8EA8', letterSpacing: 1, marginBottom: 4 },
  sub:     { fontFamily: MONO, fontSize: 10, color: '#3A5068', lineHeight: 15 },
});
