import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSkin } from '@/hooks/useSkin';

const LINES = ['Gold is only a color here—the real treasure is a calmer, clearer workspace.', 'The Dragon has forged a new ember edge for your next layout experiment.', 'A good Butler keeps the bright ideas local, labeled, and easy to undo.', 'Treasure the small details: one clean alignment can make a whole page feel intentional.'];

export const ButlerDragonFlavorMoment = memo(function ButlerDragonFlavorMoment() {
  const skin = useSkin();
  const [line, setLine] = useState(LINES[0]);
  const [visible, setVisible] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const focused = useRef(false);
  const reveal = useCallback(() => { if (!focused.current) return; setLine(LINES[Math.floor(Math.random() * LINES.length)]); setVisible(true); Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 260, useNativeDriver: true }), Animated.delay(4200), Animated.timing(pulse, { toValue: 0, duration: 320, useNativeDriver: true })]).start(({ finished }) => { if (finished) setVisible(false); }); }, [pulse]);
  useFocusEffect(useCallback(() => { focused.current = true; const timer = setInterval(reveal, 60 * 60 * 1000); return () => { focused.current = false; clearInterval(timer); setVisible(false); }; }, [reveal]));
  useEffect(() => () => { focused.current = false; }, []);
  if (!visible) return null;
  return <Animated.View style={[styles.root, { borderColor: `${skin.accent3}80`, backgroundColor: `${skin.accent3}12`, opacity: pulse, transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}><View style={[styles.avatar, { borderColor: skin.accent3, backgroundColor: `${skin.accent3}1C` }]}><MaterialCommunityIcons name="robot-outline" size={24} color={skin.accent3} /></View><View style={{ flex: 1 }}><Text style={[styles.title, { color: skin.accent3 }]}>GOLDEN GUARDIAN // LOCAL FLAVOR</Text><Text style={[styles.line, { color: skin.text }]}>{line}</Text><Text style={[styles.fine, { color: skin.mid }]}>Cosmetic flavor only · no notification · no network activity</Text></View></Animated.View>;
});

const styles = StyleSheet.create({ root: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, padding: 10 }, avatar: { width: 44, height: 44, borderWidth: 1.3, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, title: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 }, line: { fontFamily: 'monospace', fontSize: 8.5, lineHeight: 13, marginTop: 3 }, fine: { fontFamily: 'monospace', fontSize: 6.5, marginTop: 3 } });

export default ButlerDragonFlavorMoment;
