/**
 * ScanlineOverlay — A single 2px line in accent color, sweeping top→bottom
 * on a loop at low opacity. Used sparingly on hero/active cards only.
 *
 * @example
 *   <View style={{ position: 'relative', overflow: 'hidden' }}>
 *     <ScanlineOverlay color={COLOR.cyan} />
 *     {children}
 *   </View>
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ScanlineOverlayProps {
  color?: string;
  thickness?: number;
  duration?: number;
  opacity?: number;
}

export function ScanlineOverlay({
  color = '#00C8E0',
  thickness = 2,
  duration = 3600,
  opacity = 0.35,
}: ScanlineOverlayProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [h, setH] = useState(120);
  const m = useRef(true);

  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(duration * 1.5),
      ])
    );
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [duration]);

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
      onLayout={e => setH(e.nativeEvent.layout.height)}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: thickness,
          backgroundColor: color,
          opacity,
          ...(typeof window === 'undefined'
            ? {}
            : {
                shadowColor: color,
                shadowOpacity: 0.8,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }),
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-thickness, h],
              }),
            },
          ],
        }}
      />
    </View>
  );
}
