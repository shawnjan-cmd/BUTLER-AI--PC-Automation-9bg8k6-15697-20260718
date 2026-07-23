/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   BUTLER AI — RENDER GUARD v1.0                                  ║
 * ║   © 2024-2026 Andrej Sladkovic. All Rights Reserved.             ║
 * ║   com.butlerai.pc.automation · PROPRIETARY                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS IS:
 *   A component-level render optimization system built specifically
 *   for Butler AI's tab structure and heavy home screen.
 *
 *   It solves 3 Butler AI-specific problems:
 *
 *   PROBLEM 1 — Nexus Home is too heavy to mount all at once.
 *     nexushome.tsx renders ~12 major components simultaneously.
 *     On mid-range Android (Pixel 4a, Samsung A-series), this causes
 *     a visible 200-400ms white flash before the UI appears.
 *     Solution: ButlerStaggerMount staggers component mounting in
 *     priority order using InteractionManager.
 *
 *   PROBLEM 2 — Tab switch lag from unchanged components re-rendering.
 *     Components that receive the same props re-render on every parent
 *     update because their comparison functions are missing.
 *     Solution: ButlerMemo — a wrapper around React.memo that includes
 *     Butler AI's standard prop comparison logic for the common prop
 *     shapes used throughout the app (status, isConn, metrics).
 *
 *   PROBLEM 3 — Polling hooks keep running on inactive tabs.
 *     ServerContext heartbeat, sysinfo polls, and LAN scanner continue
 *     running even when the user is on a different tab, wasting battery.
 *     Solution: useButlerTabFocus — a hook that returns a stable boolean
 *     indicating whether the current tab is the active focus, plus
 *     a cleanup function that pauses polling when false.
 *
 * WHY IT IS PROPRIETARY:
 *   The stagger order, priority weights, and polling pause logic
 *   are specific to Butler AI's exact tab/component hierarchy.
 *   The ButlerMemo prop comparison covers the exact prop shapes
 *   (status, isConn, addr, metrics) that Butler AI components use.
 *   Transplanting this to another app would require complete rewriting.
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import {
  InteractionManager, AppState, AppStateStatus, View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

// ═══════════════════════════════════════════════════════════════════
// 1. BUTLER STAGGER MOUNT
// Progressive component mounting for Butler AI's heavy screens.
// ═══════════════════════════════════════════════════════════════════

export type ButlerMountStage =
  | 'critical'     // Stage 0: rendered immediately (header, first visible card)
  | 'high'         // Stage 1: after first frame (~16ms)
  | 'normal'       // Stage 2: after interactions settle (~150ms)
  | 'low'          // Stage 3: after JS thread is idle (~400ms)
  | 'background';  // Stage 4: deferred until settled (~800ms)

// Delay map — tuned for Butler AI's typical component render times
const BTLR_STAGE_DELAY: Record<ButlerMountStage, number> = {
  critical:   0,
  high:       16,
  normal:     150,
  low:        400,
  background: 800,
};

/**
 * useButlerStaggerMount(stage)
 * Returns `true` when the component at the given priority stage
 * should mount. Components return null before this is true,
 * eliminating the initial "render everything at once" spike.
 *
 * USAGE:
 *   function HeavySection() {
 *     const ready = useButlerStaggerMount('low');
 *     if (!ready) return <SkeletonCard />;
 *     return <ActualHeavyContent />;
 *   }
 */
export function useButlerStaggerMount(stage: ButlerMountStage = 'normal'): boolean {
  const [ready, setReady] = useState(stage === 'critical');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted  = useRef(true);

  useEffect(() => {
    if (stage === 'critical') { setReady(true); return; }

    const delay = BTLR_STAGE_DELAY[stage];

    if (stage === 'normal' || stage === 'high') {
      // Use InteractionManager for animation-friendly mounting
      const task = InteractionManager.runAfterInteractions(() => {
        timerRef.current = setTimeout(() => {
          if (mounted.current) setReady(true);
        }, Math.max(0, delay - 100));  // subtract InteractionManager's own ~100ms
      });
      return () => {
        mounted.current = false;
        task.cancel();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Low and background stages — simple timeout
    timerRef.current = setTimeout(() => {
      if (mounted.current) setReady(true);
    }, delay);

    return () => {
      mounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stage]);

  return ready;
}

// ═══════════════════════════════════════════════════════════════════
// 2. BUTLER MEMO — Smart memo wrapper for Butler AI prop shapes
// ═══════════════════════════════════════════════════════════════════

/**
 * The standard "connection status" props that appear on every major
 * Butler AI home screen component. Comparing these prevents
 * unnecessary re-renders when only unrelated state changes.
 */
export interface ButlerConnectionProps {
  isConn?:  boolean;
  addr?:    string;
  status?:  string;
  latency?: number | null;
}

/**
 * butlerShallowEqual(prev, next)
 * Shallow equality check optimized for Butler AI component prop shapes.
 * Handles the specific patterns used in Butler AI's components:
 *   - Primitive props (string, number, boolean) — strict equality
 *   - Array props — by length + first/last element (sufficient for tag lists)
 *   - Object props — one level deep (metrics, config objects)
 *   - Function props — reference equality only (callbacks should be stable)
 *
 * Why not use a generic library?
 *   Generic deep-equal is too expensive for render-path comparisons.
 *   Reference equality alone misses updates to new object instances
 *   with identical values (common in Butler AI's context providers).
 *   This function sits between the two extremes, calibrated for
 *   Butler AI's exact prop patterns.
 */
export function butlerShallowEqual<T extends Record<string, any>>(
  prev: T,
  next: T,
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    const pv = prev[key];
    const nv = next[key];

    if (pv === nv) continue;

    // Both null/undefined
    if (pv == null && nv == null) continue;
    if (pv == null || nv == null) return false;

    const pvType = typeof pv;

    // Function — reference only (callbacks must be stable via useCallback)
    if (pvType === 'function') return false;  // different ref = different fn

    // Primitive
    if (pvType !== 'object') return false;

    // Array — length + sentinel elements only
    if (Array.isArray(pv)) {
      if (!Array.isArray(nv))       return false;
      if (pv.length !== nv.length)  return false;
      // Check first and last elements (covers most Butler AI array changes)
      const len = pv.length;
      if (len > 0) {
        if (pv[0] !== nv[0])         return false;
        if (pv[len - 1] !== nv[len - 1]) return false;
      }
      continue;
    }

    // Plain object — one level deep
    const pvObjKeys = Object.keys(pv);
    const nvObjKeys = Object.keys(nv);
    if (pvObjKeys.length !== nvObjKeys.length) return false;
    for (const objKey of pvObjKeys) {
      if (pv[objKey] !== nv[objKey]) return false;
    }
  }
  return true;
}

/**
 * ButlerMemo<P>(Component)
 * React.memo wrapper using butlerShallowEqual comparison.
 * Drop-in replacement for React.memo() on Butler AI components
 * that receive connection status and metrics as props.
 *
 * USAGE:
 *   export const MyCard = ButlerMemo(function MyCard(props) { ... });
 */
export function ButlerMemo<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  displayName?: string,
): React.MemoExoticComponent<React.ComponentType<P>> {
  const memoized = memo(Component, butlerShallowEqual);
  if (displayName) {
    memoized.displayName = `Butler.${displayName}`;
  }
  return memoized;
}

// ═══════════════════════════════════════════════════════════════════
// 3. BUTLER TAB FOCUS HOOK
// Pauses expensive operations when the tab is not focused.
// ═══════════════════════════════════════════════════════════════════

/**
 * useButlerTabFocus()
 * Returns { isFocused, isAppActive, shouldPoll }
 *
 * shouldPoll = isFocused && isAppActive
 * Use this to gate all polling loops in Butler AI tabs.
 * When shouldPoll is false, clear all timers and SSE connections.
 * When shouldPoll returns to true, restart them.
 *
 * This is more precise than useFocusEffect alone because it also
 * checks AppState — the user may have backgrounded the app while
 * the tab was already focused.
 *
 * BUTLER AI-SPECIFIC:
 *   Also fires the /api/lifecycle endpoint (POST foreground/background)
 *   when the app state changes, as required by Play Store compliance.
 *   The lifecycle call is fire-and-forget — it never blocks UI.
 */
export function useButlerTabFocus(): {
  isFocused:    boolean;
  isAppActive:  boolean;
  shouldPoll:   boolean;
} {
  const [isFocused,   setIsFocused]   = useState(false);
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === 'active',
  );

  // Tab focus tracking via expo-router
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  // App state tracking
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      const active = nextState === 'active';
      setIsAppActive(active);

      // Fire lifecycle endpoint — Play Store compliance requirement.
      // This is async fire-and-forget; never awaited in render path.
      _fireLifecycle(active ? 'foreground' : 'background');
    };

    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  const shouldPoll = isFocused && isAppActive;
  return { isFocused, isAppActive, shouldPoll };
}

// Internal: lifecycle endpoint call
// Imported lazily to avoid circular deps with serverConnection
async function _fireLifecycle(state: 'foreground' | 'background'): Promise<void> {
  try {
    const { serverConnection } = await import('@/services/serverConnection');
    const ip    = serverConnection.getIP?.()    ?? '';
    const port  = serverConnection.getPort?.()  ?? '';
    const token = serverConnection.getToken?.() ?? '';
    if (!ip || !port) return;

    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch(`http://${ip}:${port}/api/lifecycle`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ state }),
      signal: ctrl.signal,
    });
  } catch {
    // Intentionally silent — lifecycle is best-effort
  }
}

// ═══════════════════════════════════════════════════════════════════
// 4. BUTLER INTERVAL — Smart polling that respects shouldPoll
// ═══════════════════════════════════════════════════════════════════

/**
 * useButlerInterval(fn, intervalMs, active)
 * A polling hook that:
 *   - Immediately fires fn when active becomes true
 *   - Clears the interval when active becomes false
 *   - Clears on unmount (no memory leaks)
 *   - Uses a stable fn ref so callers don't need to wrap fn in useCallback
 *
 * BUTLER AI-SPECIFIC:
 *   The "fire immediately on activate" behavior is required because
 *   Butler AI's dashboard shows live data — a 10s delay before the
 *   first reading would look broken.
 *
 * USAGE:
 *   const { shouldPoll } = useButlerTabFocus();
 *   useButlerInterval(() => fetchMetrics(), 10_000, shouldPoll);
 */
export function useButlerInterval(
  fn:         () => void | Promise<void>,
  intervalMs: number,
  active:     boolean,
): void {
  const fnRef   = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the fn ref fresh without re-creating the interval
  useEffect(() => { fnRef.current = fn; });

  useEffect(() => {
    if (!active) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Fire immediately on activate
    try { const r = fnRef.current(); if (r && typeof r.catch === 'function') r.catch(() => {}); } catch {}

    timerRef.current = setInterval(() => {
      try {
        const r = fnRef.current();
        if (r && typeof r.catch === 'function') r.catch(() => {});
      } catch {}
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, intervalMs]);
}

// ═══════════════════════════════════════════════════════════════════
// 5. BUTLER DEFERRED VALUE — For heavy search / filter inputs
// ═══════════════════════════════════════════════════════════════════

/**
 * useButlerDeferred<T>(value, delayMs)
 * Returns a deferred copy of value that updates only after
 * delayMs of inactivity. Use this for search inputs that trigger
 * expensive filtering operations.
 *
 * Unlike React 18's useDeferredValue, this works in React Native
 * and is compatible with the older React version Expo uses.
 * It also gives us control over the exact delay, which
 * useDeferredValue doesn't expose.
 *
 * BUTLER AI-SPECIFIC:
 *   Default 200ms delay — tuned for Butler AI's script search
 *   (250+ scripts, category + text filter = moderate compute).
 *   200ms is imperceptible to users but prevents filtering on
 *   every single keystroke.
 */
export function useButlerDeferred<T>(value: T, delayMs = 200): T {
  const [deferred, setDeferred] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDeferred(value), delayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, delayMs]);

  return deferred;
}

// ═══════════════════════════════════════════════════════════════════
// 6. BUTLER SKELETON — Lightweight placeholder for staggered mounts
// ═══════════════════════════════════════════════════════════════════
import { StyleSheet, Animated } from 'react-native';

const SKEL_BG   = '#060D18';
const SKEL_SHIN = 'rgba(0,229,255,0.04)';

/**
 * ButlerSkeleton({ width, height, radius, style })
 * A minimal animated skeleton placeholder that matches Butler AI's
 * dark surface color. Used as the fallback while staggered components
 * are waiting to mount.
 *
 * The shimmer animation uses the NATIVE driver (opacity only) so it
 * never competes with JS-thread work during initial mount.
 */
export function ButlerSkeleton({
  width,
  height,
  radius = 10,
  style,
}: {
  width?:  number | string;
  height:  number;
  radius?: number;
  style?:  object;
}) {
  const shimA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimA, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimA, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View
      style={[
        {
          height,
          width: width ?? '100%',
          borderRadius: radius,
          backgroundColor: SKEL_BG,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: SKEL_SHIN,
            opacity: shimA,
          },
        ]}
      />
    </View>
  );
}
