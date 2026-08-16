import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCosmetic } from '@/contexts/CosmeticContext';
import { useSkin } from '@/hooks/useSkin';

const PACKAGES = [
  { id: 'studio', title: 'BUTLER STUDIO', price: '$10', icon: 'palette-swatch', accent: '#38D9E8', tag: 'PERSONAL POLISH', copy: 'Premium palettes, chat bubbles, mascot poses, sound cues, haptics, and signature transitions.', bullets: ['Instant visual presets', 'Expanded chat and toolbar styling', 'Low-cost motion with reduced-motion fallback'] },
  { id: 'atelier', title: 'BUTLER ATELIER', price: '$20', icon: 'hammer-wrench', accent: '#A468FF', tag: 'FULL CUSTOMIZATION', copy: 'Everything in Studio plus the Atelier Vault, Build Mode, and the complete Backpack customization studio.', bullets: ['Build Mode with grid, snap, nudge, and Undo', 'Full component and graph inventory', 'Verified entitlement required to apply'] },
  { id: 'remote', title: 'REMOTE CONNECTION', price: 'SEPARATE', icon: 'lan-connect', accent: '#FFB43D', tag: 'PRIVATE ACCESS', copy: 'A separate connection product for reaching the user’s own PC through supported private VPN or TLS configuration.', bullets: ['Explicit pairing and device lock', 'Runtime status only—no hidden relay', 'Never bundled into cosmetic unlocks'] },
] as const;

export const ButlerPackageSpotlight = memo(function ButlerPackageSpotlight() {
  const skin = useSkin();
  const { startPreview } = useCosmetic();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const focused = useRef(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotate = useCallback(() => { if (!focused.current) return; Animated.sequence([Animated.timing(fade, { toValue: 0.25, duration: 140, useNativeDriver: true }), Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true })]).start(); setIndex(current => (current + 1) % PACKAGES.length); }, [fade]);
  const start = useCallback(() => { if (timer.current) clearInterval(timer.current); if (!focused.current) return; timer.current = setInterval(rotate, 1800); }, [rotate]);
  useFocusEffect(useCallback(() => { focused.current = true; start(); return () => { focused.current = false; if (timer.current) clearInterval(timer.current); timer.current = null; }; }, [start]));
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const pack = PACKAGES[index];
  return <Animated.View style={[styles.root, { opacity: fade, borderColor: `${pack.accent}85`, backgroundColor: `${skin.panel}F5` }]}>
    <View style={styles.top}><View style={[styles.icon, { borderColor: pack.accent, backgroundColor: `${pack.accent}18` }]}><MaterialCommunityIcons name={pack.icon as any} size={27} color={pack.accent} /></View><View style={{ flex: 1 }}><Text style={[styles.tag, { color: pack.accent }]}>{pack.tag}</Text><Text style={[styles.title, { color: skin.text }]}>{pack.title}</Text><Text style={[styles.price, { color: pack.accent }]}>{pack.price}</Text></View><View style={styles.dots}>{PACKAGES.map((item, dot) => <View key={item.id} style={[styles.dot, { backgroundColor: dot === index ? pack.accent : `${skin.mid}45` }]} />)}</View></View>
    <Text style={[styles.copy, { color: skin.mid }]}>{pack.copy}</Text><View style={styles.bullets}>{pack.bullets.map(bullet => <Text key={bullet} style={[styles.bullet, { color: skin.text }]}>◆ {bullet}</Text>)}</View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Preview ${pack.title}`} onPress={() => pack.id !== 'remote' && startPreview(pack.id === 'studio' ? 'matrix' : 'phantom')} style={[styles.preview, { borderColor: pack.accent, backgroundColor: `${pack.accent}18` }]}><MaterialCommunityIcons name="eye-outline" size={18} color={pack.accent} /><Text style={[styles.previewText, { color: pack.accent }]}>{pack.id === 'remote' ? 'VIEW PRODUCT DETAILS' : 'PREVIEW THIS PACKAGE'}</Text></TouchableOpacity>
    <Text style={[styles.fine, { color: skin.mid }]}>Preview is local and reversible. Applying a cosmetic requires a verified entitlement; connection access is separate.</Text>
  </Animated.View>;
});

const styles = StyleSheet.create({ root: { borderWidth: 1.5, borderRadius: 16, padding: 13, gap: 9 }, top: { flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 54, height: 54, borderWidth: 1.5, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, tag: { fontFamily: 'monospace', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.2 }, title: { fontFamily: 'monospace', fontSize: 16, fontWeight: '900', letterSpacing: 1.3, marginTop: 2 }, price: { fontFamily: 'monospace', fontSize: 11, fontWeight: '900', marginTop: 2 }, dots: { flexDirection: 'row', gap: 4, alignSelf: 'flex-start' }, dot: { width: 6, height: 6, borderRadius: 3 }, copy: { fontFamily: 'monospace', fontSize: 8.5, lineHeight: 13 }, bullets: { gap: 3 }, bullet: { fontFamily: 'monospace', fontSize: 7.5, lineHeight: 11 }, preview: { minHeight: 44, borderWidth: 1.3, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, previewText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, fine: { fontFamily: 'monospace', fontSize: 6.8, lineHeight: 10 } });

export default ButlerPackageSpotlight;
