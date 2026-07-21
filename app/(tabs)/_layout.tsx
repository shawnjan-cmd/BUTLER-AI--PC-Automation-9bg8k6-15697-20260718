
/**
 * Butler AI — Tabs Layout · v3.0 BULLETPROOF
 *
 * BLACK-SCREEN PREVENTION CONTRACT (read before editing):
 * ──────────────────────────────────────────────────────
 *  A) `isOnboardingDone()` from services/onboardingState.ts is the
 *     SINGLE SOURCE OF TRUTH for new/returning detection.
 *
 *  B) THREE timers protect against every failure mode:
 *     • FAST watchdog  (1 000 ms) — AsyncStorage hung briefly
 *     • HARD cap       (3 500 ms) — AsyncStorage hung completely
 *     • Mount timer    (   80 ms) — race between SplashScreen.hideAsync
 *                                   and the React commit
 *
 *  C) `<Tabs>` is ALWAYS the DIRECT root element returned from this
 *     component. Never wrap it in View/Animated.View — breaks Expo
 *     Router's ContextNavigator WeakMap and causes "Invalid value
 *     used as weak map key" on every platform.
 *
 *  D) While isDone === null (loading) we render a SPLASH PLACEHOLDER
 *     that is NOT part of the Tabs navigator — it is returned from
 *     an early-return path before `<Tabs>` is reached. This keeps
 *     the native splash opaque until React commits.
 *
 *  E) Navigation after onboarding is done via `router.replace` in a
 *     `useEffect` that fires ONLY when isDone flips false→true in the
 *     same session (user just finished onboarding). Cold-start
 *     returning users get `initialRouteName='nexushome'` with NO
 *     programmatic navigation.
 *
 *  F) `notifyOnboardingComplete()` is the only function onboarding.tsx
 *     should call. It sets isDone→true via the `_notifyDone` callback,
 *     which triggers (E) above.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, AppState } from 'react-native';
import { Tabs, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import FuturisticTabBar from '@/components/ui/FuturisticTabBar';
import { ONBOARDING_DONE_KEY, WELCOME_COMPLETE_KEY } from '@/constants/onboardingKeys';
import { isOnboardingDone, clearOnboardingCache } from '@/services/onboardingState';

// ── Export for onboarding.tsx to call on FINISH / SKIP ───────────
let _notifyDone:  (() => void) | null = null;
let _notifyReset: (() => void) | null = null;

export function notifyOnboardingComplete(): void {
  try {
    clearOnboardingCache();
    _notifyDone?.();
  } catch {}
}

/** Call from Settings > Replay Tutorial to re-show onboarding */
export function notifyOnboardingReset(): void {
  try {
    clearOnboardingCache();
    _notifyReset?.();
  } catch {}
}

// ── Tab icon definitions ─────────────────────────────────────────
type IconFn = (color: string, size: number) => React.ReactNode;

const ICON_MAP: Record<string, IconFn> = {
  nexushome:      (c, s) => <MaterialIcons name="home" size={s} color={c} />,
  scripts:        (c, s) => <MaterialIcons name="code" size={s} color={c} />,
  butler:         (c, s) => <MaterialCommunityIcons name="robot" size={s} color={c} />,
  knowledge:      (c, s) => <MaterialCommunityIcons name="brain" size={s} color={c} />,
  logs:           (c, s) => <MaterialIcons name="bar-chart" size={s} color={c} />,
  builder:        (c, s) => <MaterialIcons name="handyman" size={s} color={c} />,
  fileshare:      (c, s) => <MaterialIcons name="folder-open" size={s} color={c} />,
  connect:        (c, s) => <MaterialCommunityIcons name="server-network" size={s} color={c} />,
  settings:       (c, s) => <MaterialIcons name="tune" size={s} color={c} />,
  cosmetic:       (c, s) => <MaterialCommunityIcons name="palette-swatch" size={s} color={c} />,
  terminal:       (c, s) => <MaterialIcons name="receipt-long" size={s} color={c} />,
  support:        (c, s) => <MaterialCommunityIcons name="help-circle-outline" size={s} color={c} />,
};

const TAB_LABELS: Record<string, string> = {
  nexushome:      'CORE',
  scripts:        'FORGE',
  butler:         'BUTLR',
  knowledge:      'KB',
  logs:           'INTEL',
  builder:        'BUILD',
  fileshare:      'VAULT',
  settings:       'CFG',
  cosmetic:       'SKINS',
  terminal:       'LOGS',
  support:        'HELP',
  connect:        'PAIR',
};

// ── Loading splash — shown ONLY during the AsyncStorage read ─────
// Kept minimal and dark so it's invisible behind the native splash.
// It MUST NOT be a Tabs navigator — just a plain View.
function LoadingSplash() {
  return (
    <View style={s.splash}>
      <View style={s.splashDot} />
    </View>
  );
}

// ── Main Layout ──────────────────────────────────────────────────
export default function TabsLayout() {
  /**
   * isDone state machine:
   *  null  → still reading AsyncStorage (render LoadingSplash)
   *  false → new user (initialRouteName = 'onboarding')
   *  true  → returning user (initialRouteName = 'nexushome')
   */
  const [isDone, setIsDone] = useState<boolean | null>(null);

  const mountedRef       = useRef(true);
  const splashHiddenRef  = useRef(false);
  const fastWatchdogRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardCapRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wire up the notify callback for onboarding.tsx
  useEffect(() => {
    _notifyDone = () => {
      if (!mountedRef.current) return;
      clearOnboardingCache();
      setIsDone(true);
    };
    _notifyReset = () => {
      if (!mountedRef.current) return;
      clearOnboardingCache();
      setIsDone(false);
    };
    return () => {
      _notifyDone = null;
      _notifyReset = null;
      mountedRef.current = false;
      if (fastWatchdogRef.current) clearTimeout(fastWatchdogRef.current);
      if (hardCapRef.current) clearTimeout(hardCapRef.current);
    };
  }, []);

  // Re-check onboarding state whenever app comes to foreground (e.g. after Settings reset)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        clearOnboardingCache();
        isOnboardingDone().then((done) => {
          if (!mountedRef.current) return;
          setIsDone((prev) => (prev !== done ? done : prev));
        }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  // When isDone flips false→true IN SESSION (user just finished onboarding),
  // navigate to nexushome. The nav tree is fully ready at this point.
  const prevIsDoneRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (isDone === true && prevIsDoneRef.current === false) {
      try { router.replace('/(tabs)/nexushome' as any); } catch {}
    }
    prevIsDoneRef.current = isDone;
  }, [isDone]);

  // Hide the native splash once React has committed a frame.
  const hideSplash = useCallback(() => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Bootstrap: read AsyncStorage, then hide splash.
  useEffect(() => {
    let cancelled = false;

    // FAST watchdog: if AsyncStorage hasn't responded in 1 second,
    // assume NOT done (new user). This is deliberately aggressive
    // because a black screen for >1 second is worse than briefly
    // showing onboarding to a returning user.
    fastWatchdogRef.current = setTimeout(() => {
      if (!cancelled && mountedRef.current && isDone === null) {
        setIsDone(false);
        hideSplash();
      }
    }, 1000);

    // HARD cap: absolute backstop at 3.5 seconds.
    hardCapRef.current = setTimeout(() => {
      if (!cancelled && mountedRef.current) {
        setIsDone(prev => prev ?? false);
        hideSplash();
      }
    }, 3500);

    const bootstrap = async () => {
      try {
        const done = await isOnboardingDone();
        if (cancelled || !mountedRef.current) return;
        // Clear both watchdogs — we got an answer
        if (fastWatchdogRef.current) { clearTimeout(fastWatchdogRef.current); fastWatchdogRef.current = null; }
        if (hardCapRef.current)      { clearTimeout(hardCapRef.current);      hardCapRef.current       = null; }
        setIsDone(done);
      } catch {
        // AsyncStorage completely failed — safe to show new-user path
        if (cancelled || !mountedRef.current) return;
        if (fastWatchdogRef.current) { clearTimeout(fastWatchdogRef.current); fastWatchdogRef.current = null; }
        if (hardCapRef.current)      { clearTimeout(hardCapRef.current);      hardCapRef.current      = null; }
        setIsDone(false);
      } finally {
        // Tiny delay so LoadingSplash → Tabs doesn't flash on fast devices
        setTimeout(hideSplash, 80);
      }
    };

    bootstrap();
    return () => { cancelled = true; };
  // The original comment line for eslint-disable-next-line 'react-hooks/exhaustive-deps' is removed
  // because the error message indicates that this rule is not found or configured.
  // Removing the directive is the most direct way to resolve the reported syntax error/linter issue
  // without changing the intended logic or code style.
  }, []); // Mount-only — re-running on isDone change would cause infinite bootstrap loop

  // Tab bar renderer — hidden during onboarding
  const renderTabBar = useCallback((props: any) => {
    if (isDone === false) return <View style={{ height: 0 }} />;
    return <FuturisticTabBar {...props} iconMap={ICON_MAP} />;
  }, [isDone]);

  // ── LOADING PHASE: render BEFORE Tabs mounts ───────────────────
  // CRITICAL: this is an early return that renders a plain View,
  // NOT a Tabs navigator. This prevents Expo Router from trying to
  // register routes while AsyncStorage is still reading.
  if (isDone === null) {
    return <LoadingSplash />;
  }

  // ── ROUTE PHASE: new vs returning user ─────────────────────────
  const initialRoute = isDone ? 'nexushome' : 'onboarding';

  return (
    // ⚠️  <Tabs> MUST be the direct root. No wrappers. See contract (C) above.
    <Tabs
      initialRouteName={initialRoute}
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 0, display: 'none' },
      }}
    >
      {/* ── Tutorial: hidden from tab bar, always navigable ── */}
      <Tabs.Screen name="onboarding" options={{ href: null }} />

      {/* ── MAIN VISIBLE TABS ── */}
      <Tabs.Screen name="nexushome" options={{ title: TAB_LABELS.nexushome, tabBarLabel: TAB_LABELS.nexushome }} />
      <Tabs.Screen name="scripts"   options={{ title: TAB_LABELS.scripts,   tabBarLabel: TAB_LABELS.scripts   }} />
      <Tabs.Screen name="butler"    options={{ title: TAB_LABELS.butler,     tabBarLabel: TAB_LABELS.butler    }} />
      <Tabs.Screen name="knowledge" options={{ title: TAB_LABELS.knowledge,  tabBarLabel: TAB_LABELS.knowledge }} />
      <Tabs.Screen name="logs"      options={{ title: TAB_LABELS.logs,       tabBarLabel: TAB_LABELS.logs      }} />
      <Tabs.Screen name="builder"   options={{ title: TAB_LABELS.builder,    tabBarLabel: TAB_LABELS.builder   }} />
      <Tabs.Screen name="fileshare" options={{ title: TAB_LABELS.fileshare,  tabBarLabel: TAB_LABELS.fileshare }} />

      {/* ── SKINS tab before Settings so Settings is the rightmost/last tab ── */}
      <Tabs.Screen name="cosmetic"  options={{ title: 'SKINS',               tabBarLabel: 'SKINS'              }} />
      <Tabs.Screen name="settings"  options={{ title: TAB_LABELS.settings,   tabBarLabel: TAB_LABELS.settings  }} />

      {/* ── ADDITIONAL VISIBLE TABS (scroll right past CFG) ── */}
      <Tabs.Screen name="terminal" options={{ title: TAB_LABELS.terminal, tabBarLabel: TAB_LABELS.terminal }} />
      <Tabs.Screen name="support"  options={{ title: TAB_LABELS.support,  tabBarLabel: TAB_LABELS.support  }} />
      <Tabs.Screen name="connect"  options={{ title: TAB_LABELS.connect,  tabBarLabel: TAB_LABELS.connect  }} />

      {/* ── HIDDEN UTILITY TABS ── */}
      <Tabs.Screen name="index" options={{ href: null }} />


    </Tabs>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#010508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,229,255,0.25)',
  },
});
