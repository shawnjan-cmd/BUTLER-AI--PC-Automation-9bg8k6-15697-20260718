import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSkin } from '@/hooks/useSkin';

export const ButlerMascotMotion = memo(function ButlerMascotMotion({ size = 72, paused = false }: { size?: number; paused?: boolean }) {
  const skin = useSkin();
  const sway = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (paused) {
      sway.stopAnimation();
      breathe.stopAnimation();
      sway.setValue(0);
      breathe.setValue(0.92);
      return;
    }
    const movement = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(sway, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 2100, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sway, { toValue: -1, duration: 4200, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.88, duration: 2100, useNativeDriver: true }),
      ]),
      Animated.timing(sway, { toValue: 0, duration: 2100, useNativeDriver: true }),
    ]));
    movement.start();
    return () => movement.stop();
  }, [breathe, paused, sway]);

  const rotate = sway.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-3deg', '0deg', '3deg'] });
  const translateY = sway.interpolate({ inputRange: [-1, 0, 1], outputRange: [2, 0, -2] });
  const icon = skin.mascot === 'guardian' ? 'shield-moon-outline' : skin.mascot === 'terminal' ? 'robot-industrial' : skin.mascot === 'orbital' ? 'orbit' : skin.mascot === 'atelier' ? 'robot-excited-outline' : 'robot-happy';

  return (
    <Animated.View accessible accessibilityRole="image" accessibilityLabel="Butler mascot" style={[styles.wrap, { width: size, height: size, opacity: breathe, transform: [{ perspective: 500 }, { rotateY: rotate }, { rotate }, { translateY }] }]}>
      <View style={[styles.halo, { width: size, height: size, borderRadius: size / 2, borderColor: `${skin.accent}65`, backgroundColor: `${skin.accent}10` }]}>
        <MaterialCommunityIcons name={icon as any} size={size * 0.46} color={skin.accent} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});

export default ButlerMascotMotion;
