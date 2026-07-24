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

// ─── PALETTE (Section 21.30 — ground-truth from production screenshots) ────
export const COLOR = {
  // ── BACKGROUNDS ─────────────────────────────────────────────────────────
  bg:            '#080C12',   // root screen background
  surface:       '#0D1117',   // all card / HUDCard inner fill
  surfaceDeep:   '#0A0E16',   // nested inner panels, input areas
  surfaceInput:  '#0B0F18',   // text inputs, search bars
  surfaceHeader: '#0C1019',   // sticky header bar
  surfaceBar:    '#0D1420',   // runtime scanner bar
  // Legacy aliases kept for backward compat:
  surf:          '#0D1117',
  surf2:         '#0A0E16',
  surf3:         '#080C12',

  // ── TEXT ────────────────────────────────────────────────────────────────
  text:          '#E8EAF0',   // primary readable text
  textMuted:     '#6B7280',   // secondary / dim text
  textMid:       '#9CA3AF',   // mid-level
  textDim:       '#4B5563',   // very dim
  mid:           '#6B7280',
  dim:           '#2A3649',

  // ── BRAND ACCENTS (exact module colors from Section 21.2) ───────────────
  cyan:          '#00FFD4',   // CPU, Disk, primary teal features
  sky:           '#00D4FF',   // AI Chat, LAN, lighter blue-teal
  teal:          '#00CC88',   // Files Organized, mid-teal
  green:         '#00FF88',   // Scripts, Space Recovered, success
  blue:          '#2277FF',   // File Transfer, Process EXEC
  violet:        '#9B59F6',   // KB, AI Memory, Scripts Active
  amber:         '#FF9500',   // RAM, Uptime, Quick Tools, warnings
  orange:        '#FF6622',   // Logs module
  red:           '#FF3B30',   // Threats, Alerts, errors, OFFLINE
  muted:         '#888CA0',   // Config, Sandbox, disabled states
  // Legacy aliases:
  magenta:       '#9B59F6',
  pink:          '#FF44AA',
  yellow:        '#FFD400',
  ice:           '#6EE7FF',   // Butler AI signature ice-blue

  // ── BORDERS ─────────────────────────────────────────────────────────────
  border:        'rgba(0,212,255,0.10)',
  borderHi:      'rgba(0,212,255,0.20)',
  borderSharp:   'rgba(0,212,255,0.35)',

  // ── GLOWS ───────────────────────────────────────────────────────────────
  glowCyan:      'rgba(0,255,212,0.18)',
  glowGreen:     'rgba(0,255,136,0.18)',
  glowViolet:    'rgba(155,89,246,0.18)',
  glowAmber:     'rgba(255,149,0,0.18)',

  // ── STRIPE ──────────────────────────────────────────────────────────────
  stripe5: ['#FF0055', '#FF9500', '#00FF88', '#00D4FF', '#9B59F6'] as string[],
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
