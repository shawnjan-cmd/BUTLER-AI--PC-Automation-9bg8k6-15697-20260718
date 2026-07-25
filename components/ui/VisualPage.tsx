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
          <View style={s.heroTop}>
            <Text style={s.eyebrow}>{eyebrow}</Text>
            <Text style={s.livePill}>LIVE UI</Text>
          </View>
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
                  <View style={s.cardRight}>
                    <Text style={s.cardCta}>{item.cta ?? (clickable ? 'Open' : 'Soon')}</Text>
                    <Text style={s.cardArrow}>›</Text>
                  </View>
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
    backgroundColor: '#03060C',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 170,
    gap: 14,
  },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(95,188,255,0.35)',
    padding: 14,
    backgroundColor: '#081222',
    gap: 8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#82C6FF',
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '900',
  },
  livePill: {
    color: '#13F0C8',
    borderWidth: 1,
    borderColor: 'rgba(19,240,200,0.45)',
    backgroundColor: 'rgba(19,240,200,0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: '#B7CBE7',
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#EEF5FF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0C1526',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardPressed: {
    opacity: 0.78,
  },
  cardTextWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#ABC2DE',
    fontSize: 12,
    lineHeight: 16,
  },
  cardRight: {
    alignItems: 'center',
    gap: 2,
  },
  cardCta: {
    color: '#79C8FF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardArrow: {
    color: '#5A83AA',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    color: '#839BB8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
