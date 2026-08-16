import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BACKPACK_INVENTORY } from '@/services/cosmeticVariantRegistry';
import { useSkin } from '@/hooks/useSkin';

const TOKENS = BACKPACK_INVENTORY.slice(0, 20);

export const ButlerBackpackShowcase = memo(function ButlerBackpackShowcase() {
  const skin = useSkin();
  const focused = useRef(true);
  const progress = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const start = useCallback(() => {
    loopRef.current?.stop();
    if (!focused.current) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(900),
    ]));
    loopRef.current = loop;
    loop.start();
  }, [progress]);
  useFocusEffect(useCallback(() => { focused.current = true; start(); return () => { focused.current = false; loopRef.current?.stop(); loopRef.current = null; }; }, [start]));
  useEffect(() => () => { loopRef.current?.stop(); }, []);
  return <View style={[styles.root, { borderColor: `${skin.accent2}75`, backgroundColor: `${skin.panel}E8` }]} accessibilityLabel="Animated Backpack preview, twenty rotating component samples">
    <View style={styles.titleRow}><Text style={[styles.kicker, { color: skin.accent2 }]}>BACKPACK PREVIEW BAY</Text><Text style={[styles.live, { color: skin.ok }]}>LIVE PREVIEW · PAUSES OFF PAGE</Text></View>
    <Text style={[styles.title, { color: skin.text }]}>WATCH THE INVENTORY COME ALIVE</Text>
    <Text style={[styles.copy, { color: skin.mid }]}>Preview premium components, graph skins, mascots, effects, and controls before buying. Preview never changes your saved layout.</Text>
    <View style={styles.stage}>{TOKENS.map((item, index) => <Animated.View key={item.id} style={[styles.token, { borderColor: index % 3 === 0 ? skin.accent : index % 3 === 1 ? skin.accent2 : skin.accent3, backgroundColor: `${skin.bg}E8`, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8 - (index % 4) * 4, 98 + (index % 5) * 8] }) }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [(index % 5) * 17 - 34, ((index * 29) % 150) - 75] }) }, { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [`${(index % 2 ? -8 : 8)}deg`, `${index % 2 ? 14 : -14}deg`] }) }], opacity: progress.interpolate({ inputRange: [0, 0.12, 0.78, 1], outputRange: [0, 1, 0.85, 0] }) }]}><Text numberOfLines={1} style={[styles.tokenText, { color: index % 3 === 0 ? skin.accent : index % 3 === 1 ? skin.accent2 : skin.accent3 }]}>{item.label}</Text></Animated.View>)}</View>
    <View style={styles.footer}><Text style={[styles.footerText, { color: skin.mid }]}>20 rotating samples · low-cost native motion · no network requests</Text><Text style={[styles.footerAction, { color: skin.ok }]}>OPEN BACKPACK ↓</Text></View>
  </View>;
});

const styles = StyleSheet.create({ root: { borderWidth: 1, borderRadius: 14, padding: 11, gap: 7, overflow: 'hidden' }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 }, kicker: { fontFamily: 'monospace', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.1 }, live: { fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900' }, title: { fontFamily: 'monospace', fontSize: 13, fontWeight: '900', letterSpacing: 1 }, copy: { fontFamily: 'monospace', fontSize: 7.5, lineHeight: 11 }, stage: { height: 76, borderWidth: 1, borderColor: '#FFFFFF10', borderRadius: 10, overflow: 'hidden', position: 'relative', alignItems: 'center' }, token: { position: 'absolute', top: 2, minWidth: 48, maxWidth: 92, paddingHorizontal: 5, paddingVertical: 5, borderWidth: 1, borderRadius: 7 }, tokenText: { fontFamily: 'monospace', fontSize: 6, fontWeight: '900', textAlign: 'center' }, footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 }, footerText: { flex: 1, fontFamily: 'monospace', fontSize: 6.5 }, footerAction: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900' } });

export default ButlerBackpackShowcase;
