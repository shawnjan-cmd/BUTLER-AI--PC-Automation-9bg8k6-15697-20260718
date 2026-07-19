/**
 * useHaptics.ts
 * ──────────────────────────────────────────────────────────────────
 * Typed, centralised haptic-feedback hook. Wrap every Haptics.* call
 * here so you can toggle the whole app's haptic feedback by editing
 * one file. All methods are safe to call repeatedly and silently
 * no-op on platforms / devices that don't support haptics.
 *
 * IMPORTANT: expo-haptics is excluded from native autolinking in
 * react-native.config.js specifically to prevent a static top-level
 * `import ... from 'expo-haptics'` from crashing Android cold start
 * (see that file's comments). This hook delegates to the existing
 * lazy-loaded services/haptics.ts wrapper instead of importing
 * expo-haptics directly here — do not re-add a static import.
 *
 * Usage:
 *   const haptics = useHaptics();
 *   haptics.medium();    // for primary action buttons
 *   haptics.success();   // when a task completes
 */
import { haptics as safeHaptics } from '@/services/haptics';

export function useHaptics() {
  return {
    /** Tab press, list item select, toggle. */
    light:     () => safeHaptics.light(),
    /** Button press, action tile, send. */
    medium:    () => safeHaptics.medium(),
    /** Destructive action, hard error. */
    heavy:     () => safeHaptics.heavy(),
    /** Successful operation completed. */
    success:   () => safeHaptics.success(),
    /** Operation failed. */
    error:     () => safeHaptics.error(),
    /** Warning / partial success. */
    warning:   () => safeHaptics.warning(),
    /** Selection changed (model picker, theme, segmented). */
    selection: () => safeHaptics.selection(),
  };
}
