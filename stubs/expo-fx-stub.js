/**
 * Stub for expo/src/Expo.fx.tsx
 *
 * The real file uses `(['android', 'ios'] as const)` TypeScript syntax
 * that @babel/parser 7.27.x rejects when processing in Flow mode.
 *
 * The real module only logs a warning in __DEV__ + ExpoGo environments
 * about New Architecture config. It has zero effect on production builds
 * and zero effect on non-ExpoGo dev previews.
 *
 * This stub is a safe no-op replacement.
 */
'use strict';

// No-op — the real file only runs a __DEV__ + isRunningInExpoGo() check
// that warns when newArchEnabled config is mismatched. In our build
// environment this is irrelevant (not running in Expo Go).

module.exports = {};
