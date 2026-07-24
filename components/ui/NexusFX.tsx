/**
 * NexusFX — Butler AI Special Effects Components
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * Exports: TypewriterBoot · DataStreamLine · HoloText · NexusScanFrame · GlitchPressButton
 * GlowWave-X design system — Section 20.5
 *
 * DRIVER NOTES:
 *   TypewriterBoot cursorOp  → useNativeDriver: true (opacity)
 *   DataStreamLine scrollX   → useNativeDriver: true (translateX)
 *   NexusScanFrame scanY     → useNativeDriver: false (top position)
 *   HoloText breathe         → useNativeDriver: true (opacity)
 *   GlitchPressButton scale  → useNativeDriver: true (transform)
 */
import React, {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import {
  Animated, Dimensions, Easing, Platform, Pressable,
  StyleSheet, Text, View, ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { haptics } from '@/services/haptics';

const SW = Math.max(320, Dimensions.get('window').width);

const C = {
  ice:    '#6EE7FF',
  mint:   '#34D399',
  violet: '#A78BFA',
  amber:  '#FDBA74',
  coral:  '#F87171',
  text:   '#E4EBF5',
  textMid:'#7A8FA5',
  textDim:'#3D4C63',
  surface:'#0F1828',
  card:   '#0A0F1A',
};

// ─────────────────────────────────────────────────────────────────
// TypewriterBoot — multi-line organic typewriter reveal
// Variable speed per character (12–26ms/char). Perfect for boot seq.
// ─────────────────────────────────────────────────────────────────
interface TypewriterBootProps {
  lines:    string[];
  color?:   string;
  fontSize?: number;
  onDone?:  () => void;
  style?:   ViewStyle;
}

export const TypewriterBoot = memo(function TypewriterBoot({
  lines, color = C.mint, fontSize = 10, onDone, style,
}: TypewriterBootProps) {
  const [visibleText, setVisibleText] = useState('');
  const [linesDone,   setLinesDone]   = useState(false);
  const cursorA = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const cursor = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    cursor.start();
    return () => { cursor.stop(); };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const full = lines.join('\n');
    let i = 0;
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      i++;
      setVisibleText(full.slice(0, i));
      if (i >= full.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setLinesDone(true);
        onDone?.();
      }
    }, 16 + Math.random() * 12); // 16–28ms per char
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lines.join('|')]);

  return (
    <View style={style}>
      <Text style={{
        fontFamily: FontFamily.mono as any,
        fontSize, color,
        lineHeight: fontSize * 1.65,
        letterSpacing: 0.3,
        includeFontPadding: false,
      }}>
        {visibleText}
        {!linesDone && (
          <Animated.Text style={{ color, opacity: cursorA }}>▌</Animated.Text>
        )}
      </Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────
// DataStreamLine — scrolling hex data footer banner
// Full-width strip with scrolling hex bytes — no gradient required
// Driver: translateX on native thread
// ─────────────────────────────────────────────────────────────────
interface DataStreamLineProps {
  color?:  string;
  height?: number;
  style?:  ViewStyle;
}

function genHexStream(len = 80): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
  ).join(' ');
}

export const DataStreamLine = memo(function DataStreamLine({
  color = C.ice, height = 16, style,
}: DataStreamLineProps) {
  const [stream, setStream] = useState(() => genHexStream(80));
  const scrollX = useRef(new Animated.Value(0)).current;
  const CONTENT_W = 1400;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -CONTENT_W,
        duration: 18000,
        easing:   Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    const refresh = setInterval(() => setStream(genHexStream(80)), 3000);
    return () => { loop.stop(); clearInterval(refresh); };
  }, []);

  return (
    <View style={[{ height, overflow: 'hidden', backgroundColor: color + '05' }, style]}>
      <Animated.Text
        numberOfLines={1}
        style={{
          fontFamily:   FontFamily.mono as any,
          fontSize:     Math.max(7, height * 0.58),
          color:        color + '55',
          letterSpacing: 1.8,
          lineHeight:   height,
          width:        CONTENT_W,
          transform:    [{ translateX: scrollX }],
          includeFontPadding: false,
        }}
      >
        {stream}
      </Animated.Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────
// HoloText — holographic shimmer text with breathing opacity
// ─────────────────────────────────────────────────────────────────
interface HoloTextProps {
  text:      string;
  fontSize?: number;
  color?:    string;
  style?:    ViewStyle;
}

export const HoloText = memo(function HoloText({
  text, fontSize = 11, color = C.textMid, style,
}: HoloTextProps) {
  const breathe = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1,    duration: 2200, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0.35, duration: 2200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text style={[
      {
        fontFamily:    FontFamily.mono as any,
        fontSize,
        color,
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity:       breathe,
        ...Platform.select({ ios: { textShadowColor: color, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } } }),
        includeFontPadding: false,
      },
      style,
    ]}>
      {text}
    </Animated.Text>
  );
});

// ─────────────────────────────────────────────────────────────────
// NexusScanFrame — animated L-bracket corners + horizontal scan line
// Wraps any element with an active scanning aesthetic
// Driver: scanY uses useNativeDriver: false (top position interpolation)
//         cornerOp uses useNativeDriver: true
// ─────────────────────────────────────────────────────────────────
interface NexusScanFrameProps {
  children:  React.ReactNode;
  color?:    string;
  active?:   boolean;
  armLength?: number;
  thickness?: number;
  style?:    ViewStyle;
}

export const NexusScanFrame = memo(function NexusScanFrame({
  children, color = C.ice, active = true, armLength = 16, thickness = 2, style,
}: NexusScanFrameProps) {
  const scanY    = useRef(new Animated.Value(0)).current;  // JS driver — position
  const cornerOp = useRef(new Animated.Value(0.5)).current; // native driver

  useEffect(() => {
    if (!active) return;
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanY, { toValue: 1, duration: 1800, useNativeDriver: false }),
      Animated.timing(scanY, { toValue: 0, duration: 0,    useNativeDriver: false }),
      Animated.delay(400),
    ]));
    const cornerLoop = Animated.loop(Animated.sequence([
      Animated.timing(cornerOp, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(cornerOp, { toValue: 0.3, duration: 900, useNativeDriver: true }),
    ]));
    scanLoop.start();
    cornerLoop.start();
    return () => { scanLoop.stop(); cornerLoop.stop(); };
  }, [active]);

  const BRACKET: ViewStyle = { position: 'absolute', width: armLength, height: armLength };

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      {children}
      {active && (
        <>
          {/* Corner brackets — native driver opacity */}
          <Animated.View style={[BRACKET, { top: 0, left: 0,  borderTopWidth: thickness, borderLeftWidth:  thickness, borderColor: color, opacity: cornerOp }]} />
          <Animated.View style={[BRACKET, { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness, borderColor: color, opacity: cornerOp }]} />
          <Animated.View style={[BRACKET, { bottom: 0, left: 0,  borderBottomWidth: thickness, borderLeftWidth:  thickness, borderColor: color, opacity: cornerOp }]} />
          <Animated.View style={[BRACKET, { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness, borderColor: color, opacity: cornerOp }]} />
          {/* Scan line — JS driver top % */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute', left: 0, right: 0, height: 1.5,
              backgroundColor: color, opacity: 0.55,
              top: scanY.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}
          />
        </>
      )}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────
// GlitchPressButton — button with press glitch + spark effect
// ─────────────────────────────────────────────────────────────────
interface GlitchPressButtonProps {
  label:    string;
  onPress:  () => void;
  color?:   string;
  disabled?: boolean;
  style?:   ViewStyle;
}

export const GlitchPressButton = memo(function GlitchPressButton({
  label, onPress, color = C.ice, disabled = false, style,
}: GlitchPressButtonProps) {
  const scale    = useRef(new Animated.Value(1)).current;
  const sparkOp  = useRef(new Animated.Value(0)).current;
  const sparkSc  = useRef(new Animated.Value(0)).current;
  const [sparking, setSparking] = useState(false);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.95, tension: 380, friction: 11, useNativeDriver: true }).start();
    haptics.medium();
  }, [disabled]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (disabled) return;
    setSparking(true);
    Animated.parallel([
      Animated.timing(sparkSc, { toValue: 1.6, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(sparkOp, { toValue: 1,   duration: 150, useNativeDriver: true }),
        Animated.timing(sparkOp, { toValue: 0,   duration: 350, useNativeDriver: true }),
      ]),
    ]).start(() => { setSparking(false); sparkSc.setValue(0); sparkOp.setValue(0); });
    onPress();
  }, [disabled, onPress]);

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View style={[
        s2.btn,
        {
          borderColor:     color + '70',
          backgroundColor: disabled ? color + '08' : color + '14',
          opacity:         disabled ? 0.4 : 1,
          transform:       [{ scale }],
          ...Platform.select({
            ios: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
            android: { elevation: 4 },
          }),
        },
        style,
      ]}>
        <Text style={[s2.btnTxt, { color }]}>{label}</Text>
        {sparking && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute', top: -32, left: -32, right: -32, bottom: -32,
              borderRadius: 48, borderWidth: 2.5, borderColor: color,
              transform: [{ scale: sparkSc }], opacity: sparkOp,
            }}
          />
        )}
      </Animated.View>
    </Pressable>
  );
});

const s2 = StyleSheet.create({
  btn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
    borderRadius:   12,
    paddingHorizontal: 18,
    paddingVertical:   12,
    overflow:       'hidden',
    position:       'relative',
  },
  btnTxt: {
    fontFamily:   FontFamily.displayMed as any,
    fontSize:     13,
    fontWeight:   '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
