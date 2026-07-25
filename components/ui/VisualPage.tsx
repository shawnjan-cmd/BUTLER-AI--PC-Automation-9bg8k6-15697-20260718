import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export type VisualItem = {
  title: string;
  description: string;
  cta?: string;
  href?: string;
};

export type VisualSection = {
  title: string;
  items: VisualItem[];
};

type VisualPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: VisualSection[];
  footerNote?: string;
};

export function VisualPage({ eyebrow, title, subtitle, sections, footerNote }: VisualPageProps) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>{eyebrow}</Text>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const clickable = Boolean(item.href);
              return (
                <Pressable
                  key={`${section.title}-${item.title}`}
                  style={({ pressed }) => [s.card, clickable && pressed && s.cardPressed]}
                  onPress={
                    item.href
                      ? () => {
                          router.push(item.href as any);
                        }
                      : undefined
                  }
                >
                  <View style={s.cardTextWrap}>
                    <Text style={s.cardTitle}>{item.title}</Text>
                    <Text style={s.cardDescription}>{item.description}</Text>
                  </View>
                  <Text style={s.cardCta}>{item.cta ?? (clickable ? 'Open' : 'Soon')}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {footerNote ? <Text style={s.footer}>{footerNote}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#05070D',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(91,175,255,0.3)',
    padding: 18,
    backgroundColor: '#0B1220',
    gap: 8,
  },
  eyebrow: {
    color: '#7DB6FF',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#C5D5EA',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#EEF3FB',
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0F1728',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardPressed: {
    opacity: 0.84,
  },
  cardTextWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#B7C6DC',
    fontSize: 13,
    lineHeight: 19,
  },
  cardCta: {
    color: '#6CC3FF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: {
    color: '#93A8C5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
