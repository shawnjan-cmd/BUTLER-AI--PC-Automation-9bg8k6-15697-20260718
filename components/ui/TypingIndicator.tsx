/**
 * TypingIndicator — 3-dot bouncing animation for AI response loading.
 * Section 19.5: "Three dots with glow + DataStreamLine below"
 *
 * TypingDot: 8dp circle that springs scale 0.4→1.0→0.4 in a repeating loop.
 * All animations use useNativeDriver: true.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, AppState } from 'react-native';
import { DataStreamLine } from '@/components/ui/NexusFX';

interface TypingDotProps {
  delay: number;
  color: string;
}

function TypingDot({ delay, color }: TypingDotProps) {
  const scaleA = useRef(new Animated.Value(0.4)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleA, {
        toValue:  1.0,
        tension:  260,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(scaleA, {
        toValue:  0.4,
        tension:  200,
        friction: 14,
        useNativeDriver: true,
      }),
    ]));
    loop.start();

    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') loop.stop(); else loop.start();
    });

    return () => {
      mountedRef.current = false;
      loop.stop();
      sub.remove();
    };
  }, [delay]);

  return (
    <Animated.View style={[
      s.dot,
      {
        backgroundColor: color,
        transform: [{ scale: scaleA }],
        shadowColor: color,
      },
    ]} />
  );
}

interface TypingIndicatorProps {
  color?:          string;
  showDataStream?: boolean;
}

export const TypingIndicator = memo(function TypingIndicator({
  color          = '#A78BFA',
  showDataStream = true,
}: TypingIndicatorProps) {
  return (
    <View>
      <View style={s.row}>
        {[0, 180, 360].map((delay, i) => (
          <TypingDot key={i} delay={delay} color={color} />
        ))}
      </View>
      {showDataStream && (
        <DataStreamLine color={color} height={10} />
      )}
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:            7,
    padding:        14,
    paddingBottom:   8,
    alignItems:    'center',
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    shadowRadius: 4,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default TypingIndicator;
