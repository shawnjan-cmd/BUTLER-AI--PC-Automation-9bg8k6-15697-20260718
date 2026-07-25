import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type Step = {
  title: string;
  description: string;
  points: string[];
};

const steps: Step[] = [
  {
    title: 'Professional by default',
    description: 'The interface has been rebuilt to feel premium, modern, and focused for real daily usage.',
    points: ['Cleaner visual hierarchy', 'Comfortable spacing and readability', 'Simple but detailed module layout'],
  },
  {
    title: 'Fast and performance-friendly',
    description: 'Navigation shell and page structure are optimized for reliability and smooth interaction.',
    points: ['Lightweight, reusable UI structure', 'Reduced startup complexity', 'Predictable screen behavior'],
  },
  {
    title: 'AI-first workflow',
    description: 'A quick Butler chat strip sits above the toolbar so assistance is always one tap away.',
    points: ['Ask Butler directly from navigation layer', 'Immediate jump to assistant workspace', 'Consistent utility across modules'],
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const progress = useMemo(() => `${index + 1}/${steps.length}`, [index]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.wrap}>
        <View style={s.hero}>
          <Text style={s.badge}>BUTLER AI · ONBOARDING</Text>
          <Text style={s.progress}>{progress}</Text>
          <Text style={s.title}>{step.title}</Text>
          <Text style={s.subtitle}>{step.description}</Text>
        </View>

        <View style={s.card}>
          {step.points.map((point) => (
            <View key={point} style={s.pointRow}>
              <View style={s.pointDot} />
              <Text style={s.pointText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={s.actions}>
          {index > 0 ? (
            <Pressable style={s.ghostButton} onPress={() => setIndex((v) => v - 1)}>
              <Text style={s.ghostText}>Back</Text>
            </Pressable>
          ) : (
            <View style={s.ghostPlaceholder} />
          )}

          {index < steps.length - 1 ? (
            <Pressable style={s.primaryButton} onPress={() => setIndex((v) => v + 1)}>
              <Text style={s.primaryText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable style={s.primaryButton} onPress={() => router.replace('/(tabs)/nexushome' as any)}>
              <Text style={s.primaryText}>Enter Butler AI</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05070D' },
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 18 },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(130,210,255,0.35)',
    backgroundColor: '#0B1220',
    padding: 18,
    gap: 8,
  },
  badge: {
    color: '#7DB6FF',
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  progress: {
    color: '#9BCBFF',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#C7D6EA',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#0F1728',
    padding: 16,
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#6CC3FF',
  },
  pointText: {
    flex: 1,
    color: '#D3E4F7',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ghostButton: {
    height: 46,
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostPlaceholder: {
    minWidth: 96,
  },
  ghostText: {
    color: '#D3E4F7',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#6CC3FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#08111E',
    fontWeight: '800',
    fontSize: 14,
  },
});
