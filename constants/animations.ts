/**
 * Global Animation System — re-exports safe Animated API helpers from anim.ts.
 * react-native-reanimated is intentionally NOT imported here to prevent the
 * Hermes Android "undefined is not a function" crash during module init.
 * Components that need Reanimated import it directly.
 */

/**
 * RE-EXPORT: safeAnim / nativeAnim helpers from constants/anim.ts
 * Import from either place:
 *   import { safeAnimTiming } from '@/constants/anim';       ← preferred
 *   import { safeAnimTiming } from '@/constants/animations'; ← also works
 */
export * from './anim';

// ════════════════════════════════════════════════════════════════
// 🎭 BUTTON PRESS ANIMATIONS
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// 🎭 PERFORMANCE PRESETS (spring configs for use with Reanimated directly)
// ════════════════════════════════════════════════════════════════

/** Spring configs — pass these to withSpring() in component-level Reanimated calls */
export const PerformanceConfigs = {
  fast:   { damping: 20, stiffness: 400, mass: 0.5 },
  smooth: { damping: 15, stiffness: 300, mass: 1   },
  bouncy: { damping: 8,  stiffness: 200, mass: 0.8 },
  heavy:  { damping: 25, stiffness: 150, mass: 2   },
};
