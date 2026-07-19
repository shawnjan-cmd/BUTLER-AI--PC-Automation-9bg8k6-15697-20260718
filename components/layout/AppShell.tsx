/**
 * AppShell — Butler AI screen wrapper
 * ──────────────────────────────────────────────────────────────
 * Provides:
 *  • SafeAreaView root with dark bg
 *  • Subtle animated circuit-grid background
 *  • Optional TopBar
 *  • Optional AskBar floating dock
 *  • Correct status bar style
 *
 * Usage:
 *   <AppShell topBarProps={{ isConnected, onQRPress }} askBarProps={{ onPress }}>
 *     <ScrollView>...</ScrollView>
 *   </AppShell>
 */

import React, { ReactNode, useRef, useEffect } from 'react';
import {
  View, StyleSheet, Animated, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLOR } from '@/constants/tokens';
import { TopBar } from './TopBar';
import { AskBar } from './AskBar';
import type { TopBarProps } from './TopBar';
import type { AskBarProps } from './AskBar';

// Re-export TopBarProps / AskBarProps so consumers don't need deep imports
export type { TopBarProps } from './TopBar';
export type { AskBarProps } from './AskBar';

// ── ANIMATED CIRCUIT GRID ─────────────────────────────────────────
function CircuitGrid() {
  const pulseA = useRef(new Animated.Value(0.03)).current; // native — opacity
  const m      = useRef(true);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 0.07, duration: 3500, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 0.02, duration: 3500, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);

  const hLines = Array.from({ length: 14 }, (_, i) => ({ pct: (i + 1) / 15 }));
  const vLines = Array.from({ length: 9  }, (_, i) => ({ pct: (i + 1) / 10 }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: pulseA }]}
    >
      {hLines.map((l, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${l.pct * 100}%` as any,
            height: StyleSheet.hairlineWidth,
            backgroundColor: COLOR.cyan,
          }}
        />
      ))}
      {vLines.map((l, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${l.pct * 100}%` as any,
            width: StyleSheet.hairlineWidth,
            backgroundColor: COLOR.cyan,
          }}
        />
      ))}
      {/* Corner glow blobs */}
      <View style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: COLOR.cyan, opacity: 0.4 }} />
      <View style={{ position: 'absolute', bottom: -40, right: -50, width: 180, height: 180, borderRadius: 90,  backgroundColor: COLOR.magenta, opacity: 0.25 }} />
    </Animated.View>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
interface AppShellProps {
  children: ReactNode;
  /** Pass TopBar props to render the top header; omit to hide it */
  topBarProps?: TopBarProps;
  /** Pass AskBar props to render the floating AI dock; omit to hide it */
  askBarProps?: Omit<AskBarProps, 'isConnected'> & { isConnected?: boolean };
  /** Show the animated circuit grid background (default: true) */
  circuitBg?: boolean;
  /** Status bar style (default: 'light') */
  statusBarStyle?: 'light' | 'dark' | 'auto';
}

export function AppShell({
  children,
  topBarProps,
  askBarProps,
  circuitBg = true,
  statusBarStyle = 'light',
}: AppShellProps) {
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <StatusBar style={statusBarStyle} />

      {/* Animated circuit grid background */}
      {circuitBg && <CircuitGrid />}

      {/* Optional top bar */}
      {topBarProps && <TopBar {...topBarProps} />}

      {/* Screen content */}
      <View style={s.content}>{children}</View>

      {/* Floating AI dock */}
      {askBarProps && (
        <AskBar
          isConnected={topBarProps?.isConnected}
          {...askBarProps}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLOR.bg },
  content: { flex: 1 },
});

export default AppShell;
