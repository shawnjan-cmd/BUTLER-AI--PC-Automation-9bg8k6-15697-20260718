/**
 * RootErrorBoundary — last line of defense against white-screen crashes.
 * Catches errors that escape tab boundaries (providers, tab bar, root layout).
 * SAFE MODE: sets globalThis.__BUTLER_SAFE_MODE__ = true — all ambient FX
 * components check this flag and render their static first frame instead of
 * animating. This turns "app crashes on low-end phone" into "app runs quietly".
 *
 * STYLING NOTE: deliberately uses raw hex + literal font names.
 * If the crash was inside the design-token or font module, importing them
 * here would crash the boundary itself. This file is exempt from Rule 5.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';

interface State { error: Error | null; safeMode: boolean; }

export class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null, safeMode: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      const { bootErrorLog } = require('@/services/bootErrorLog');
      bootErrorLog?.record?.('ROOT_BOUNDARY', String(error?.message).slice(0, 300));
    } catch {}
  }

  render() {
    if (!this.state.error) return this.props.children;

    const msg  = String(this.state.error.message);
    const hash = String(
      Math.abs([...msg].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7))
    ).slice(0, 8);

    const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

    return (
      <View style={{
        flex: 1, backgroundColor: '#080C12',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        {/* Title */}
        <Text style={{
          fontFamily: MONO, fontSize: 22, color: '#FF3B30', letterSpacing: 2,
          textTransform: 'uppercase', textAlign: 'center',
        }}>
          SYSTEM FAULT
        </Text>

        {/* Error ID */}
        <Text style={{
          fontFamily: MONO, fontSize: 11, color: '#6B7280', marginTop: 10,
          textAlign: 'center', letterSpacing: 1,
        }}>
          ERR-ID {hash} · UI layer crashed · your data is safe
        </Text>

        {/* Short message */}
        <View style={{
          marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)',
          borderRadius: 8, padding: 12, maxWidth: 320,
          backgroundColor: 'rgba(255,59,48,0.06)',
        }}>
          <Text style={{
            fontFamily: MONO, fontSize: 10, color: '#FF9090',
            textAlign: 'center', lineHeight: 16,
          }} numberOfLines={4}>
            {msg.slice(0, 200)}
          </Text>
        </View>

        {/* Restart button */}
        <Pressable
          onPress={() => this.setState({ error: null, safeMode: false })}
          style={({ pressed }) => ({
            marginTop: 28, borderWidth: 1.5, borderColor: '#00FFD4',
            borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
            backgroundColor: 'rgba(0,255,212,0.07)',
          })}
        >
          <Text style={{
            fontFamily: MONO, fontSize: 12, color: '#00FFD4', letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            RESTART INTERFACE
          </Text>
        </Pressable>

        {/* Safe mode button */}
        <Pressable
          onPress={() => {
            (globalThis as any).__BUTLER_SAFE_MODE__ = true;
            this.setState({ error: null, safeMode: true });
          }}
          style={({ pressed }) => ({
            marginTop: 12, paddingHorizontal: 24, paddingVertical: 10,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{
            fontFamily: MONO, fontSize: 10, color: '#FF9500', letterSpacing: 1,
          }}>
            SAFE MODE — no animations
          </Text>
        </Pressable>

        <Text style={{
          fontFamily: MONO, fontSize: 8, color: '#3D4C63', marginTop: 24,
          textAlign: 'center', letterSpacing: 0.5,
        }}>
          com.butlerai.pc.automation · all local data is preserved
        </Text>
      </View>
    );
  }
}

export default RootErrorBoundary;
