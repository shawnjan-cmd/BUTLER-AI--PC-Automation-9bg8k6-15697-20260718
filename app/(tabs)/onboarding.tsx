import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.wrap}>
        <Text style={s.badge}>WELCOME</Text>
        <Text style={s.title}>Butler AI, rebuilt.</Text>
        <Text style={s.subtitle}>
          Faster startup, cleaner navigation, and a polished interface designed for professional distribution.
        </Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>What changed</Text>
          <Text style={s.cardBody}>• Fresh visual language across all core pages</Text>
          <Text style={s.cardBody}>• Simplified app shell to reduce startup failures</Text>
          <Text style={s.cardBody}>• Structured module navigation for daily operations</Text>
        </View>

        <Pressable style={s.button} onPress={() => router.replace('/(tabs)/nexushome' as any)}>
          <Text style={s.buttonText}>Enter Command Center</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05070D' },
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 18 },
  badge: {
    alignSelf: 'flex-start',
    color: '#7DB6FF',
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#C5D5EA', fontSize: 15, lineHeight: 22 },
  card: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: '#0F1728',
    padding: 16,
    gap: 8,
  },
  cardTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  cardBody: { color: '#B7C6DC', fontSize: 14, lineHeight: 20 },
  button: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#6CC3FF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#08111E', fontWeight: '800', fontSize: 15 },
});
