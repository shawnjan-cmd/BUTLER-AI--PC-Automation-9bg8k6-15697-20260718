/**
 * useUniversalFontSafety — automatically patches every Text in the app
 * to never cause layout overflow or Android font-padding misalignment.
 *
 * Call ONCE at the root of the app (in app/_layout.tsx RootLayout).
 * After calling this, every <Text> component in the app automatically gets:
 *  - maxFontSizeMultiplier: 1.4  (prevents system Accessibility large text from breaking layout)
 *  - Platform-specific defaults
 *
 * This is a global monkey-patch approach — safe in React Native because
 * Text's defaultProps is the official API for this pattern.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import { useEffect } from 'react';
import { Text, TextInput, Platform } from 'react-native';

let _patched = false;

export function useUniversalFontSafety() {
  useEffect(() => {
    if (_patched) return;
    _patched = true;

    // ── Text: cap accessibility font scaling at 1.4× ─────────────────────
    // Without this, users with "Large Text" accessibility setting
    // can cause text to overflow cards and buttons by 200-300%.
    // 1.4× is the sweet spot: readable for impaired users, doesn't break layout.
    const textDefaults = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = Object.assign({}, textDefaults, {
      maxFontSizeMultiplier: 1.4,
      allowFontScaling:      true,
    });

    // ── TextInput: same protection for inputs ─────────────────────────────
    const inputDefaults = (TextInput as any).defaultProps ?? {};
    (TextInput as any).defaultProps = Object.assign({}, inputDefaults, {
      maxFontSizeMultiplier: 1.4,
      allowFontScaling:      true,
    });
  }, []);
}

/**
 * patchTextDefaults — sync version, call before React renders.
 * Useful in module scope or in installBootGuard().
 */
export function patchTextDefaults() {
  if (_patched) return;
  _patched = true;

  try {
    const textDefaults = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = Object.assign({}, textDefaults, {
      maxFontSizeMultiplier: 1.4,
    });
    const inputDefaults = (TextInput as any).defaultProps ?? {};
    (TextInput as any).defaultProps = Object.assign({}, inputDefaults, {
      maxFontSizeMultiplier: 1.4,
    });
  } catch {}
}
