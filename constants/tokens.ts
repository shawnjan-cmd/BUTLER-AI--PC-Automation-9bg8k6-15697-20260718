/**
 * BUTLER AI — Unified Cyberpunk Design Tokens v1.0
 * Single source of truth for every color, font, spacing, and glow.
 * Import from here instead of defining inline hex values in components.
 */

import { Platform } from 'react-native';

// ─── FONT FAMILIES ────────────────────────────────────────────────
export const FONT = {
  mono: (Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace') as any,
  sans: (Platform.OS === 'ios' ? 'System'     : 'sans-serif') as any,
};

// ─── PALETTE ──────────────────────────────────────────────────────
export const COLOR = {
  // Backgrounds
  bg:       '#010407',
  surf:     '#060D18',
  surf2:    '#0A1422',
  surf3:    '#0D1C30',

  // Brand neons
  cyan:     '#00E5FF',
  green:    '#00FF88',
  magenta:  '#CC44FF',
  amber:    '#FFB020',
  red:      '#FF3344',
  blue:     '#4488FF',
  pink:     '#FF6EB4',
  yellow:   '#FFD400',
  teal:     '#00CCBB',

  // UI
  text:     '#C8E4F0',
  mid:      '#4A7090',
  dim:      '#1A2E44',
  border:   'rgba(0,229,255,0.10)',
  stripe5: ['#00E5FF', '#00FF88', '#CC44FF', '#FFB020', '#FF6EB4'] as string[],
} as const;

// ─── SPACING ──────────────────────────────────────────────────────
export const SPACE = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

// ─── RADIUS ───────────────────────────────────────────────────────
export const RADIUS = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
} as const;

// ─── TYPOGRAPHY SCALE ─────────────────────────────────────────────
export const TYPE = {
  caption:   { fontFamily: FONT.mono, fontSize: 7.5,  fontWeight: '700'  as const, letterSpacing: 0.4 },
  label:     { fontFamily: FONT.mono, fontSize: 8.5,  fontWeight: '900'  as const, letterSpacing: 0.8 },
  body:      { fontFamily: FONT.mono, fontSize: 10,   fontWeight: '400'  as const, lineHeight: 16     },
  subtitle:  { fontFamily: FONT.mono, fontSize: 12,   fontWeight: '700'  as const, letterSpacing: 0.3 },
  title:     { fontFamily: FONT.mono, fontSize: 16,   fontWeight: '900'  as const, letterSpacing: 0.4 },
  hero:      { fontFamily: FONT.mono, fontSize: 24,   fontWeight: '900'  as const, letterSpacing: 1   },
  sectionHdr:{ fontFamily: FONT.mono, fontSize: 9,    fontWeight: '900'  as const, letterSpacing: 1.5 },
} as const;

// ─── SHADOWS ──────────────────────────────────────────────────────
export const SHADOW = {
  cyan: Platform.select({
    ios:     { shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 16 },
    android: { elevation: 8 },
    default: {},
  }),
  green: Platform.select({
    ios:     { shadowColor: '#00FF88', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
    android: { elevation: 6 },
    default: {},
  }),
  dark: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
    android: { elevation: 7 },
    default: {},
  }),
} as const;

// ─── GLOW HELPER ──────────────────────────────────────────────────
/**
 * glow(color, opacity?)
 * Returns a tinted semi-transparent background — use for card halos,
 * icon boxes, chip backgrounds, etc.
 *
 * @example
 *   backgroundColor: glow(COLOR.cyan)      // rgba(0,229,255,0.08)
 *   backgroundColor: glow(COLOR.amber, 15) // rgba(255,176,32,0.15)
 */
export function glow(hex: string, pct = 8): string {
  // If already rgba/rgb just return
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${(pct / 100).toFixed(2)})`;
}

/**
 * hex(color, alphaHex)
 * Appends a 2-char hex alpha suffix to a #rrggbb color.
 *
 * @example
 *   hex(COLOR.cyan, '40')  // '#00E5FF40'
 */
export function hex(color: string, alpha: string): string {
  return `${color}${alpha}`;
}

// ─── 5-COLOR STRIPE BUILDER ───────────────────────────────────────
/**
 * Returns 5 flex:1 View style objects for building gradient-stripe headers.
 * Each element's backgroundColor is taken from COLOR.stripe5 by default,
 * or from a custom palette if provided.
 */
export function stripe5(palette = COLOR.stripe5): { flex: number; backgroundColor: string }[] {
  return palette.map(c => ({ flex: 1, backgroundColor: c }));
}
