/**
 * Butler AI — shared robot atmosphere.
 * Decorative only: it never reports data, never captures input, and never
 * changes layout. The single ambient pulse is stopped on unmount.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

const CIRCUIT_GRID = require('@/assets/images/butler-circuit-grid.jpg');

export function ButlerAtmosphere({ accent = '#38D9E8', intensity = 0.18 }: { accent?: string; intensity?: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2600, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0.45, duration: 2600, useNativeDriver: false }),
    ]));
    loop.start();
    return () => { loop.stop(); pulse.stopAnimation(); };
  }, [pulse]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={CIRCUIT_GRID} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: intensity }]} />
      <Animated.View style={[styles.tint, { borderColor: accent, opacity: pulse.interpolate({ inputRange:[0,1], outputRange:[0.04,0.16] }) }]} />
      <Animated.View style={[styles.beacon, { backgroundColor: accent, opacity: pulse.interpolate({ inputRange:[0,1], outputRange:[0.04,0.24] }) }]} />
      <View style={[styles.corner, { borderColor: accent + '55' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tint: { position:'absolute', top:72, left:14, right:14, bottom:92, borderWidth:1, borderRadius:22 },
  beacon: { position:'absolute', top:88, right:24, width:7, height:7, borderRadius:4 },
  corner: { position:'absolute', top:76, right:18, width:38, height:38, borderTopWidth:1.5, borderRightWidth:1.5, borderTopRightRadius:10 },
});

export default ButlerAtmosphere;
