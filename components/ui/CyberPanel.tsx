/**
 * CyberPanel — Butler AI reusable cyberpunk card container
 * ──────────────────────────────────────────────────────────
 * Features:
 *  • Animated neon border glow (native-driver opacity only — crash safe)
 *  • HUD corner brackets
 *  • Optional 5-color top stripe
 *  • Optional scanline sweep (JS driver translateX — NEVER mixed with native)
 *  • Mounted-ref guard on every Animated.loop
 *  • Zero SVG — pure React Native
 */

import React, { useRef, useEffect, ReactNode } from 'react';
import { View, StyleSheet, Animated, Platform, ViewStyle } from 'react-native';
import { COLOR, SHADOW, glow, hex } from '@/constants/tokens';

// ─── HUD CORNERS ─────────────────────────────────────────────────
function HudCorners({
  color,
  size = 10,
  thickness = 1.5,
}: {
  color: string;
  size?: number;
  thickness?: number;
}) {
  const base: ViewStyle = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: color,
  };
  return (
    <>
      <View style={[base, { top: 0,    left:  0,    borderTopWidth:    thickness, borderLeftWidth:  thickness }]} />
      <View style={[base, { top: 0,    right: 0,    borderTopWidth:    thickness, borderRightWidth: thickness }]} />
      <View style={[base, { bottom: 0, left:  0,    borderBottomWidth: thickness, borderLeftWidth:  thickness }]} />
      <View style={[base, { bottom: 0, right: 0,    borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </>
  );
}

// ─── 5-COLOR STRIPE ───────────────────────────────────────────────
function Stripe5({ colors, height = 3 }: { colors?: string[]; height?: number }) {
  const c = colors ?? COLOR.stripe5;
  return (
    <View style={{ height, flexDirection: 'row' }}>
      {c.map((col, i) => <View key={i} style={{ flex: 1, backgroundColor: col }} />)}
    </View>
  );
}

// ─── SCANLINE SWEEP ───────────────────────────────────────────────
// Uses JS driver (translateX) — separate Animated.Value, never mixed
function ScanlineSweep({ width }: { width: number }) {
  const posA  = useRef(new Animated.Value(-180)).current;
  const m     = useRef(true);

  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(posA, { toValue: width + 200, duration: 3200, useNativeDriver: false }),
      Animated.timing(posA, { toValue: -180,        duration: 0,    useNativeDriver: false }),
      Animated.delay(7000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [width]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          width: 140,
          transform: [{ translateX: posA }, { skewX: '-8deg' }],
          backgroundColor: 'rgba(0,229,255,0.025)',
          zIndex: 0,
        },
      ]}
    />
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────
export interface CyberPanelProps {
  children: ReactNode;
  /** Neon accent color for border glow + HUD corners */
  accentColor?: string;
  /** Show 5-color gradient top stripe */
  stripe?: boolean;
  /** Custom stripe colors (defaults to COLOR.stripe5) */
  stripeColors?: string[];
  /** Show horizontal scanline sweep animation */
  scanline?: boolean;
  /** Extra styles applied to the outer container */
  style?: ViewStyle;
  /** Screen width used for scanline — defaults to 375 */
  screenWidth?: number;
  /** Border corner size */
  cornerSize?: number;
  /** Disables the glow animation (static border only) */
  staticBorder?: boolean;
  /** Min/max opacity of the glow animation [low, high] */
  glowRange?: [number, number];
}

export function CyberPanel({
  children,
  accentColor = COLOR.cyan,
  stripe = true,
  stripeColors,
  scanline = false,
  style,
  screenWidth = 375,
  cornerSize = 10,
  staticBorder = false,
  glowRange = [0.18, 0.75],
}: CyberPanelProps) {
  // Single Animated.Value — opacity only (native driver is fine here, but
  // we interpolate to borderColor string so we use JS driver exclusively).
  const glowA = useRef(new Animated.Value(glowRange[0])).current;
  const m     = useRef(true);

  useEffect(() => {
    if (staticBorder) return;
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: glowRange[1], duration: 1600, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: glowRange[0], duration: 1600, useNativeDriver: false }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, [staticBorder]);

  const borderColor = staticBorder
    ? hex(accentColor, '30')
    : glowA.interpolate({
        inputRange:  [glowRange[0], glowRange[1]],
        outputRange: [hex(accentColor, '25'), hex(accentColor, '90')],
      });

  return (
    <Animated.View style={[styles.root, { borderColor }, style]}>
      {/* Stripe */}
      {stripe && <Stripe5 colors={stripeColors} />}

      {/* Scanline sweep (JS driver only, isolated) */}
      {scanline && <ScanlineSweep width={screenWidth} />}

      {/* HUD corner brackets */}
      <HudCorners color={hex(accentColor, '55')} size={cornerSize} />

      {/* Content */}
      {children}

      {/* Bottom stripe */}
      {stripe && (
        <View style={{ height: 2, flexDirection: 'row', opacity: 0.35 }}>
          {(stripeColors ?? COLOR.stripe5).map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: COLOR.surf,
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.dark,
  },
});

export default CyberPanel;
