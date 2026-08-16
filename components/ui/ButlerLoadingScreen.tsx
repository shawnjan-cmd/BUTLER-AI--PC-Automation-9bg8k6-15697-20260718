import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSkin } from '@/hooks/useSkin';

type LoadingVariant = 'boot' | 'orbit' | 'scan' | 'neural' | 'atelier';

type Props = {
  variant?: LoadingVariant;
  label: string;
  detail?: string;
  reducedMotion?: boolean;
};

const ICONS: Record<LoadingVariant, keyof typeof MaterialCommunityIcons.glyphMap> = {
  boot: 'power-cycle', orbit: 'orbit', scan: 'scan-helper', neural: 'brain', atelier: 'robot-excited-outline',
};

export const ButlerLoadingScreen = memo(function ButlerLoadingScreen({ variant = 'boot', label, detail, reducedMotion = false }: Props) {
  const skin = useSkin();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      spin.setValue(0);
      pulse.setValue(0.8);
      return;
    }
    const loop = Animated.loop(Animated.parallel([
      Animated.timing(spin, { toValue: 1, duration: variant === 'scan' ? 1500 : 2400, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    ]));
    loopRef.current = loop;
    loop.start();
    return () => { loop.stop(); loopRef.current = null; };
  }, [pulse, spin, variant, reducedMotion]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const secondary = variant === 'atelier' ? skin.accent3 : variant === 'neural' ? skin.ok : skin.accent2;

  return (
    <View style={[styles.root, { backgroundColor: skin.bg }]} accessibilityRole="progressbar" accessibilityLabel={label}>
      <Animated.View style={[styles.orbit, { borderColor: `${secondary}55`, transform: [{ rotate }] }]}>
        <View style={[styles.corner, styles.topLeft, { borderColor: skin.accent }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: secondary }]} />
      </Animated.View>
      <Animated.View style={[styles.core, { borderColor: `${skin.accent}80`, backgroundColor: `${skin.accent}12`, opacity: pulse }]}>
        <MaterialCommunityIcons name={ICONS[variant]} size={34} color={skin.accent} />
      </Animated.View>
      <Text style={[styles.label, { color: skin.text }]}>{label}</Text>
      {detail ? <Text style={[styles.detail, { color: skin.mid }]}>{detail}</Text> : null}
      <View style={[styles.track, { backgroundColor: `${skin.border}55` }]}><Animated.View style={[styles.fill, { backgroundColor: skin.accent, opacity: pulse }]} /></View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  orbit: { width: 126, height: 126, borderWidth: 1, borderRadius: 63, alignItems: 'center', justifyContent: 'center' },
  core: { position: 'absolute', width: 78, height: 78, borderWidth: 1.5, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 16, height: 16, borderWidth: 2 },
  topLeft: { left: -1, top: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  bottomRight: { right: -1, bottom: -1, borderLeftWidth: 0, borderTopWidth: 0 },
  label: { marginTop: 22, fontFamily: 'monospace', fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center' },
  detail: { marginTop: 8, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', lineHeight: 15 },
  track: { width: 180, height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 18 },
  fill: { width: '62%', height: '100%' },
});
