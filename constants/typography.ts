/**
 * BUTLER AI — NEXUS TYPOGRAPHY SYSTEM v3.0 · GLOWWAVE-X
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * THREE-FONT SYSTEM:
 *   DISPLAY:  Orbitron  — hero titles, BUTLER AI logotype, tab labels, HUD headings
 *   MONO:     Share Tech Mono — ALL data: CPU%, IPs, latency, hex tags, log entries
 *   BODY:     Inter — body text, descriptions, chat messages, settings copy
 *
 * PLATFORM FALLBACKS (when Google Fonts not loaded yet):
 *   display → AvenirNext-Heavy (iOS) / sans-serif-condensed (Android)
 *   mono    → Menlo-Bold (iOS) / monospace (Android)
 *   body    → System (iOS) / sans-serif (Android)
 */

import { Platform } from 'react-native';

// ── FONT FAMILIES ─────────────────────────────────────────────────
export const FontFamily = {
  // ── DISPLAY — Orbitron (robot/HUD aesthetic) ──────────────────
  /** Orbitron_900Black — hero BUTLER AI title, massive displays */
  displayBold: 'Orbitron_900Black',
  /** Orbitron_700Bold — screen titles, section headers */
  display:     'Orbitron_700Bold',
  /** Orbitron_500Medium — card headings, tab labels */
  displayMed:  'Orbitron_500Medium',
  /** Orbitron_400Regular — subtitles, eyebrow labels */
  displayReg:  'Orbitron_400Regular',

  // ── DATA / HUD — Share Tech Mono (CRT readout aesthetic) ─────
  /** ShareTechMono_400Regular — ALL data values, hex tags, logs */
  mono:        'ShareTechMono_400Regular',
  /** System fallback when ShareTechMono not loaded */
  monoSys:     Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',

  // ── BODY — Inter (readable human copy) ───────────────────────
  /** Inter_700Bold — bold body emphasis */
  bodyBold:    'Inter_700Bold',
  /** Inter_600SemiBold — button labels, stronger emphasis */
  bodySemi:    'Inter_600SemiBold',
  /** Inter_500Medium — secondary labels */
  bodyMed:     'Inter_500Medium',
  /** Inter_400Regular — prose, descriptions, chat */
  body:        'Inter_400Regular',
} as const;

// Platform fallbacks when fonts haven't loaded:
export const FontFallback = {
  display: Platform.OS === 'ios' ? 'AvenirNext-Heavy'    : 'sans-serif-condensed',
  mono:    Platform.OS === 'ios' ? 'Menlo-Bold'           : 'monospace',
  body:    Platform.OS === 'ios' ? 'System'               : 'sans-serif',
} as const;

// ── MINIMUM FLOOR VALUES (NEVER go below these) ───────────────────
export const FontFloor = {
  /** Absolute minimum — hex IDs, version chips, badge micro-text */
  micro:   9,
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
export const T = {
  // ── MICRO (chips, hex IDs, version badges) ───────────────────
  micro: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },

  // ── CAPTIONS (timestamps, sub-labels) ─────────────────────────
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  // ── MONO CAPTION (terminal timestamps, latency ms) ────────────
  monoCaption: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.6,
    includeFontPadding: false,
  },

  // ── BODY (standard prose) ────────────────────────────────────
  body: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // ── BODY BOLD (emphasis) ──────────────────────────────────────
  bodyBold: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // ── BODY SMALL (secondary body) ──────────────────────────────
  bodyS: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // ── BODY XS (fine print, hints) ──────────────────────────────
  bodyXS: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // ── MONO BODY (terminal output, script text, code) ──────────
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },

  // ── LABEL MONO (STATUS · SYSTEM · badge text) ────────────────
  labelMono: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },

  // ── TAG (hex tags, micro chips, tiny badges) ──────────────────
  tag: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '400' as const,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },

  // ── LABEL (section headers, chip text — Inter) ───────────────
  label: {
    fontFamily: FontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },

  // ── BUTTON (readable action labels — Inter Bold) ─────────────
  button: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },

  // ── CODE (terminal, logs, scripts) ───────────────────────────
  code: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
    includeFontPadding: false,
  },

  // ── NUM LARGE (big metrics: 42% CPU, big counters) ──────────
  numLg: {
    fontFamily: FontFamily.mono,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '400' as const,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },

  // ── NUM MEDIUM (card metrics, stat values) ────────────────────
  numMd: {
    fontFamily: FontFamily.mono,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },

  // ── NUM SMALL (inline stats, chip values) ────────────────────
  numSm: {
    fontFamily: FontFamily.mono,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
    includeFontPadding: false,
  },

  // ── H3 (card headings — Orbitron Medium) ─────────────────────
  h3: {
    fontFamily: FontFamily.displayMed,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },

  // ── H2 (screen sections — Orbitron Bold) ─────────────────────
  h2: {
    fontFamily: FontFamily.display,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    letterSpacing: 1,
    includeFontPadding: false,
  },

  // ── H1 (screen title — Orbitron Bold) ─────────────────────────
  h1: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    includeFontPadding: false,
  },

  // ── HERO (BUTLER AI logotype — Orbitron Black) ───────────────
  hero: {
    fontFamily: FontFamily.displayBold,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900' as const,
    letterSpacing: 4,
    includeFontPadding: false,
  },

  // ── DISPLAY (counters, clocks, splash) ───────────────────────
  display: {
    fontFamily: FontFamily.mono,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '400' as const,
    letterSpacing: 1,
    includeFontPadding: false,
  },

  // ── EYEBROW (tiny cap label above hero — Orbitron Regular) ───
  eyebrow: {
    fontFamily: FontFamily.displayReg,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    includeFontPadding: false,
  },

  // ── HINT (helper text, microcopy) ────────────────────────────
  hint: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  // ── STRONG (bold inline emphasis) ────────────────────────────
  strong: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
} as const;

// ── RESPONSIVE SCALING ────────────────────────────────────────────
/**
 * Scale font relative to 375pt base.
 * Clamps to floor so we never go below readable.
 */
export function scaleFont(base: number): number {
  // Simple pass-through — Orbitron handles its own optical scaling
  return Math.max(base, 9);
}

export function clampFontSize(
  size: number,
  floor: keyof typeof FontFloor = 'body',
): number {
  return Math.max(size, FontFloor[floor]);
}

export function lineHeight(fontSize: number, ratio = 1.45): number {
  return Math.round(fontSize * ratio);
}

// Legacy alias used in older files
export const FontFamilyLegacy = {
  display: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  body:    Platform.OS === 'ios' ? 'System'  : 'sans-serif-medium',
  mono:    Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
} as const;

export default T;
