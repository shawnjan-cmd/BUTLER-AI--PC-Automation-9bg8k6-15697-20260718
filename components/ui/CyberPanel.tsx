import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type CyberPanelProps = {
  accentColor: string;
  children: React.ReactNode;
  glowRange?: [number, number];
  scanline?: boolean;
  screenWidth?: number;
  stripe?: boolean;
  stripeColors?: string[];
  style?: StyleProp<ViewStyle>;
};

const alpha = (color: string, suffix: string) => (
  color?.startsWith('#') && color.length === 7 ? `${color}${suffix}` : color
);

export function CyberPanel({
  accentColor,
  children,
  glowRange = [0.22, 0.85],
  scanline = false,
  screenWidth = 360,
  stripe = false,
  stripeColors = [],
  style,
}: CyberPanelProps) {
  const borderGlow = useRef(new Animated.Value(glowRange[0])).current;
  const scanX = useRef(new Animated.Value(-screenWidth)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(borderGlow, { toValue: glowRange[1], duration: 1800, useNativeDriver: false }),
      Animated.timing(borderGlow, { toValue: glowRange[0], duration: 1800, useNativeDriver: false }),
    ]));

    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanX, { toValue: screenWidth, duration: 2600, useNativeDriver: true }),
      Animated.timing(scanX, { toValue: -screenWidth, duration: 0, useNativeDriver: true }),
      Animated.delay(1200),
    ]));

    glowLoop.start();
    if (scanline) scanLoop.start();

    return () => {
      glowLoop.stop();
      scanLoop.stop();
    };
  }, [borderGlow, glowRange, scanX, scanline, screenWidth]);

  const borderColor = borderGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [alpha(accentColor, '30'), alpha(accentColor, '88')],
  });

  return (
    <Animated.View style={[styles.panel, style, { borderColor }]}>
      {stripe && stripeColors.length > 0 && (
        <View style={styles.stripeRow}>
          {stripeColors.map((color, index) => (
            <View key={`${color}-${index}`} style={[styles.stripe, { backgroundColor: color }]} />
          ))}
        </View>
      )}
      {scanline && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scanline,
            {
              backgroundColor: alpha(accentColor, '18'),
              transform: [{ translateX: scanX }],
            },
          ]}
        />
      )}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#0B0F17',
  },
  stripeRow: {
    flexDirection: 'row',
    height: 3,
  },
  stripe: {
    flex: 1,
  },
  scanline: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 72,
    opacity: 0.9,
  },
});
