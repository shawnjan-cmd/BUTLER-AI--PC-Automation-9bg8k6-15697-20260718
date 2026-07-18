/**
 * useConnection — Single React hook for ALL connection state.
 * ──────────────────────────────────────────────────────────
 * Drop-in replacement for the scattered pattern:
 *   useState isConnected + useState serverAddr + useFocusEffect × 3
 *
 * Usage:
 *   import { useConnection } from '@/hooks/useConnection';
 *   const { isConnected, addr, caps, connect, reconnect, pairQR, power, execute } = useConnection();
 *
 * Features:
 *  - Auto-subscribes to connectionHub on mount, unsubscribes on unmount
 *  - Refreshes on tab focus with 400ms debounce (prevents rapid re-renders on tab swipe)
 *  - Silently attempts reconnect on focus if offline + saved server exists
 *  - Returns the full HubState + action helpers in one object
 *  - Accepts an optional onChange callback for side-effects
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { connectionHub, HubState, HubConnectResult, HubPowerResult } from '@/services/connectionHub';

// ─── Return shape ────────────────────────────────────────────────
export interface UseConnectionResult extends HubState {
  // Action helpers — stable references (useCallback-wrapped)
  connect:    (ip: string, port: string) => Promise<HubConnectResult>;
  reconnect:  () => Promise<HubConnectResult>;
  pairQR:     (data: string) => Promise<HubConnectResult>;
  disconnect: () => Promise<void>;
  power:      (action: 'sleep' | 'restart' | 'shutdown') => Promise<HubPowerResult>;
  execute:    (
    script: string,
    onChunk?: (line: string) => void,
    timeoutMs?: number
  ) => Promise<{ output: string; error: string; success: boolean; ms: number }>;
  clipboardPush: (text: string) => Promise<boolean>;
  clipboardPull: () => Promise<string>;
  lanScan:    (onProgress?: (p: any) => void) => Promise<{ ip: string; port: number }[]>;
  /** Notify hub that connection was established externally (e.g. from settings manual IP entry) */
  notifyConnected: (ip: string, port: string, latencyMs?: number) => void;
}

// Tab-focus debounce: only refresh state once per 400ms to prevent
// rapid re-renders when the user swipes between tabs quickly.
const FOCUS_DEBOUNCE_MS = 400;

// ─── Hook ────────────────────────────────────────────────────────
export function useConnection(onChange?: (state: HubState) => void): UseConnectionResult {
  const [state, setState]  = useState<HubState>(() => connectionHub.getState());
  const onChangeRef        = useRef(onChange);
  const lastFocusTs        = useRef(0);
  onChangeRef.current      = onChange;

  // Subscribe to hub — runs on mount, cleans up on unmount
  useEffect(() => {
    const unsub = connectionHub.subscribe((s) => {
      setState(s);
      onChangeRef.current?.(s);
    });
    return unsub;
  }, []);

  // Refresh on tab focus with debounce — prevents multiple rapid updates
  // when user swipes tabs quickly.
  // Also triggers a silent reconnect attempt if offline + saved server found.
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusTs.current < FOCUS_DEBOUNCE_MS) return;
      lastFocusTs.current = now;

      const s = connectionHub.getState();
      setState(s);

      // If offline and not already connecting, silently attempt reconnect.
      // This handles: server came back while user was on another tab.
      if (!s.isConnected && !s.connecting) {
        import('@react-native-async-storage/async-storage').then(({ default: AS }) =>
          Promise.all([
            AS.getItem('commandcube_server_ip').catch(() => null),
            AS.getItem('commandcube_server_port').catch(() => null),
          ])
        ).then(([ip, port]) => {
          if (ip && port && !connectionHub.getState().isConnected) {
            connectionHub.reconnect().catch(() => {});
          }
        }).catch(() => {});
      }
    }, [])
  );

  // ── Stable action refs ────────────────────────────────────────
  const connect = useCallback(
    (ip: string, port: string) => connectionHub.connect(ip, port),
    []
  );

  const reconnect = useCallback(
    () => connectionHub.reconnect(),
    []
  );

  const pairQR = useCallback(
    (data: string) => connectionHub.pairQR(data),
    []
  );

  const disconnect = useCallback(
    () => connectionHub.disconnect(),
    []
  );

  const power = useCallback(
    (action: 'sleep' | 'restart' | 'shutdown') => connectionHub.power(action),
    []
  );

  const execute = useCallback(
    (script: string, onChunk?: (line: string) => void, timeoutMs?: number) =>
      connectionHub.execute(script, onChunk, timeoutMs),
    []
  );

  const clipboardPush = useCallback(
    (text: string) => connectionHub.clipboardPush(text),
    []
  );

  const clipboardPull = useCallback(
    () => connectionHub.clipboardPull(),
    []
  );

  const lanScan = useCallback(
    (onProgress?: (p: any) => void) => connectionHub.lanScan(onProgress),
    []
  );

  const notifyConnected = useCallback(
    (ip: string, port: string, latencyMs = 0) => connectionHub.notifyConnected(ip, port, latencyMs),
    []
  );

  return {
    ...state,
    connect,
    reconnect,
    pairQR,
    disconnect,
    power,
    execute,
    clipboardPush,
    clipboardPull,
    lanScan,
    notifyConnected,
  };
}

// ─── Mini hook: connection badge only (very low re-render cost) ──
export function useConnectionStatus(): { isConnected: boolean; addr: string; connecting: boolean } {
  const [s, setS] = useState(() => {
    const { isConnected, addr, connecting } = connectionHub.getState();
    return { isConnected, addr, connecting };
  });
  useEffect(() => {
    return connectionHub.subscribe((next) => {
      setS(prev => {
        if (
          prev.isConnected === next.isConnected &&
          prev.addr === next.addr &&
          prev.connecting === next.connecting
        ) return prev;
        return { isConnected: next.isConnected, addr: next.addr, connecting: next.connecting };
      });
    });
  }, []);
  return s;
}
