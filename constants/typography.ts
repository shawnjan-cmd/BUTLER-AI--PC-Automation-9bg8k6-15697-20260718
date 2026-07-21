/**
 * BUTLER AI — NEXUS TYPOGRAPHY SYSTEM v1.0
 * ©2026 PROPRIETARY — Andrej Sladkovic. All Rights Reserved.
 *
 * Single-source-of-truth for ALL text sizing, weights, and families.
 * Every screen MUST reference these tokens — no inline fontSize literals allowed.
 *
 * FLOOR POLICY (enforced app-wide):
 *   • Body text     ≥ 13px
 *   • Captions      ≥ 11px
 *   • Labels        ≥ 15px
 *   • Monospace     ≥ 11px (terminal / log / timestamps)
 *   • Hero titles   ≥ 24px
 *
 * PLATFORM NOTES:
 *   • Android adds internal font padding — use `includeFontPadding: false`
 *   • iOS Menlo renders narrower than Android monospace at same px
 *   • Minimum tap target for any text CTA = 44×44 (iOS) / 48×48 (Android)
 */

import { Platform } from 'react-native';

// ── FONT FAMILIES ─────────────────────────────────────────────────
export const FontFamily = {
  /** Display / brand titles — Orbitron-style bold mono */
  display: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  /** Body prose — Inter / system sans */
  body: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  /** Monospace — terminal output, logs, code, timestamps */
  mono: Platform.select({ ios: 'Menlo-Bold', android: 'monospace', default: 'monospace' }),
} as const;

// ── MINIMUM FLOOR VALUES (NEVER go below these) ───────────────────
export const FontFloor = {
  /** Absolute minimum — only for hex IDs, version chips, badge micro-text */
  micro:   10,
  /** Captions, timestamps, sub-labels */
  caption: 11,
  /** Monospace terminal text, status strips */
  mono:    11,
  /** Body text — default readable size */
  body:    13,
  /** Labels, section headers, button text */
  label:   15,
  /** Sub-headings */
  subhead: 17,
  /** Screen titles */
  title:   20,
  /** Hero / brand text */
  hero:    24,
  /** Splash / counter */
  display: 30,
} as const;

// ── SEMANTIC SCALE ────────────────────────────────────────────────
/**
 * Each entry: { fontSize, lineHeight, fontWeight, letterSpacing?, textTransform? }
 * Use these as StyleSheet spread targets: `...T.body`
 */
export const T = {
  // Micro (chips, version badges, hex IDs)
  micro: {
    fontSize: FontFloor.micro,
    lineHeight: 14,
    fontWeight: '700' as const,
    fontFamily: FontFamily.mono,
    letterSpacing: 0.4,
    includeFontPadding: false,
  },

  // Captions (timestamps, sub-labels)
  caption: {
    fontSize: FontFloor.caption,
    lineHeight: 16,
    fontWeight: '600' as const,
    fontFamily: FontFamily.body,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  // Mono caption (terminal timestamps, latency readings)
  monoCaption: {
    fontSize: FontFloor.caption,
    lineHeight: 15,
    fontWeight: '700' as const,
    fontFamily: FontFamily.mono,
    letterSpacing: 0.6,
    includeFontPadding: false,
  },

  // Body (standard readable prose)
  body: {
    fontSize: FontFloor.body,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: FontFamily.body,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // Body bold (emphasis in paragraphs)
  bodyBold: {
    fontSize: FontFloor.body,
    lineHeight: 20,
    fontWeight: '700' as const,
    fontFamily: FontFamily.body,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // Mono body (terminal output, script text)
  mono: {
    fontSize: FontFloor.mono,
    lineHeight: 18,
    fontWeight: '700' as const,
    fontFamily: FontFamily.mono,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },

  // Labels (section headers, chip text)
  label: {
    fontSize: FontFloor.label,
    lineHeight: 21,
    fontWeight: '600' as const,
    fontFamily: FontFamily.body,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  // Label mono (STATUS · SYSTEM · badges)
  labelMono: {
    fontSize: FontFloor.caption,
    lineHeight: 14,
    fontWeight: '900' as const,
    fontFamily: FontFamily.mono,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },

  // Button labels
  button: {
    fontSize: FontFloor.label,
    lineHeight: 20,
    fontWeight: '700' as const,
    fontFamily: FontFamily.body,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },

  // Subheadings
  subhead: {
    fontSize: FontFloor.subhead,
    lineHeight: 24,
    fontWeight: '700' as const,
    fontFamily: FontFamily.body,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // Screen titles
  title: {
    fontSize: FontFloor.title,
    lineHeight: 27,
    fontWeight: '900' as const,
    fontFamily: FontFamily.display,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },

  // Hero / brand
  hero: {
    fontSize: FontFloor.hero,
    lineHeight: 30,
    fontWeight: '900' as const,
    fontFamily: FontFamily.display,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },

  // Display counter / clock
  display: {
    fontSize: FontFloor.display,
    lineHeight: 36,
    fontWeight: '900' as const,
    fontFamily: FontFamily.display,
    letterSpacing: 1,
    includeFontPadding: false,
  },
} as const;

// ── ACCESSIBLE MINIMUM SIZES ──────────────────────────────────────
/**
 * Call `clampFontSize(raw, 'body')` anywhere you compute a dynamic size
 * to guarantee you never go below the floor.
 */
export function clampFontSize(
  size: number,
  floor: keyof typeof FontFloor = 'body',
): number {
  return Math.max(size, FontFloor[floor]);
}

// ── RESPONSIVE SCALING ────────────────────────────────────────────
/**
 * Scale font relative to a 375pt base (iPhone SE / standard phone).
 * Always clamps to the relevant floor.
 */
export function scaledFont(
  base: number,
  screenWidth: number,
  floor: keyof typeof FontFloor = 'body',
): number {
  const ratio = Math.min(1.2, Math.max(0.85, screenWidth / 375));
  return clampFontSize(Math.round(base * ratio), floor);
}

// ── LINE HEIGHT HELPERS ───────────────────────────────────────────
export function lineHeight(fontSize: number, ratio = 1.45): number {
  return Math.round(fontSize * ratio);
}

export default T;
