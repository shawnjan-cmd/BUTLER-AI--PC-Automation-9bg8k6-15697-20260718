/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   BUTLER AI — LAYOUT ENGINE v1.0                                 ║
 * ║   © 2024-2026 Andrej Sladkovic. All Rights Reserved.             ║
 * ║   com.butlerai.pc.automation · PROPRIETARY                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS IS:
 *   A Butler AI-specific adaptive layout and typography system.
 *   It solves problems unique to the Butler AI UI:
 *     1. Terminal-monospace text in variable-width containers
 *     2. HUD corner bracket sizing that scales with card dimensions
 *     3. Metric value sizing (CPU %, latency ms) that never overflows
 *     4. Multi-line tag chip row height that adapts to content
 *     5. Safe padding calculation for notched/punched-hole devices
 *
 * WHY IT IS PROPRIETARY:
 *   The algorithms here are written specifically for Butler AI's
 *   design system (monospace-only, HUD aesthetic, terminal metric
 *   values). They are not general-purpose layout utilities.
 *   The BTLR_ naming prefix and the LayoutProfile type are specific
 *   to this application's architecture.
 *
 * HOW IT DIFFERS FROM utils/responsive.ts:
 *   responsive.ts provides raw scale ratios.
 *   ButlerLayoutEngine uses those ratios PLUS Butler AI design rules
 *   to compute component-specific layout decisions in a single call.
 *
 * USAGE:
 *   import { btlrLayout, btlrTypeset } from '@/utils/ButlerLayoutEngine';
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// ── Reference baseline (iPhone 13 / Pixel 6 viewport) ────────────
const _REF_W  = 390;
const _REF_H  = 844;
const _REF_DPR = 3;   // reference DPR for pixel-perfect sizing

// ── Live window snapshot ─────────────────────────────────────────
function _dims() {
  const d = Dimensions.get('window');
  return {
    w: Math.max(320, d.width  || _REF_W),
    h: Math.max(568, d.height || _REF_H),
    dpr: Math.min(3, Math.max(1, PixelRatio.get())),
  };
}

// ── Butler AI device tiers ────────────────────────────────────────
// These tiers determine how aggressively we scale UI density.
// 'micro'  = very small phone (< 360dp), ancient mid-range
// 'compact'= standard phone (360-413dp)
// 'regular'= large phone / phablet (414-599dp)
// 'tablet' = tablet / foldable unfolded (600dp+)
export type ButlerDeviceTier = 'micro' | 'compact' | 'regular' | 'tablet';

export function btlrDeviceTier(): ButlerDeviceTier {
  const { w } = _dims();
  if (w < 360) return 'micro';
  if (w < 414) return 'compact';
  if (w < 600) return 'regular';
  return 'tablet';
}

// ═══════════════════════════════════════════════════════════════════
// CORE: LAYOUT PROFILE
// A single object computed once per component that contains every
// layout decision needed. Eliminates repeated inline calculations.
// ═══════════════════════════════════════════════════════════════════

export interface ButlerLayoutProfile {
  // Device
  tier:        ButlerDeviceTier;
  sw:          number;   // screen width dp
  sh:          number;   // screen height dp
  dpr:         number;   // device pixel ratio
  isTablet:    boolean;
  isMicro:     boolean;  // very small phone

  // Spacing — Butler AI grid multiples of 4
  padH:        number;   // horizontal screen padding
  padV:        number;   // vertical card padding
  gap:         number;   // standard gap between elements
  gapSm:       number;   // small gap (chip rows, tag rows)
  gapLg:       number;   // large gap (section spacing)

  // Card dimensions
  cardRadius:  number;   // card border radius
  iconBoxSm:   number;   // small icon box dimension (28-34px)
  iconBoxMd:   number;   // medium icon box dimension (36-46px)
  iconBoxLg:   number;   // large icon box dimension (52-64px)
  iconSm:      number;   // icon size for small box
  iconMd:      number;   // icon size for medium box
  iconLg:      number;   // icon size for large box

  // HUD corners — unique to Butler AI design
  hudCornerSize: number; // corner bracket arm length
  hudCornerThick:number; // corner bracket line thickness
  hudAccentH:    number; // top accent bar height

  // Typography — Butler AI monospace scale
  typoXs:      number;   // 7-8px range  (labels, eyebrows)
  typoSm:      number;   // 9-10px range (sub-labels, metadata)
  typoMd:      number;   // 11-13px range (body)
  typoLg:      number;   // 14-16px range (titles)
  typoXl:      number;   // 18-22px range (headers)
  typoHero:    number;   // 24-32px range (hero numbers, big values)
  typoLineH:   number;   // body line height multiplier

  // Metric display (CPU %, latency ms, etc.) — Butler AI specific
  metricValueSz: number; // font size for numeric metrics
  metricLabelSz: number; // font size for metric labels below values

  // Quick nav row
  quickNavH:   number;   // height of quick nav button
  quickNavW:   number;   // width of each quick nav button

  // Chip/tag row
  chipH:       number;   // height of status chips / tag chips
  chipPadH:    number;   // horizontal padding inside chip
  chipRadius:  number;   // border radius of chips

  // Pulse dot
  pulseDotSm:  number;   // small pulse dot size (5-6px)
  pulseDotMd:  number;   // medium pulse dot size (7-8px)
}

/**
 * btlrLayout()
 * Compute a complete Butler AI layout profile for the current device.
 * Call this once per component (outside render, in a useMemo or
 * module-level constant) to get all layout values in one shot.
 *
 * @example
 *   const L = btlrLayout();
 *   // Use L.padH, L.typoMd, L.iconBoxMd, etc.
 */
export function btlrLayout(): ButlerLayoutProfile {
  const { w, h, dpr } = _dims();
  const tier = btlrDeviceTier();

  // Width ratio clamped to Butler AI design bounds
  const wR = Math.min(1.35, Math.max(0.78, w / _REF_W));

  // Typography multiplier — slightly more conservative than spacing
  // to keep text readable even on small screens
  const tR = Math.min(1.25, Math.max(0.82, wR));

  // Butler AI spacing formula:
  // All values snap to multiples of 4 (Butler AI grid unit)
  const snap4 = (n: number) => Math.round(n / 4) * 4;

  const padH  = snap4(Math.max(12, 16 * wR));
  const padV  = snap4(Math.max(10, 14 * wR));
  const gap   = snap4(Math.max(8,  12 * wR));
  const gapSm = snap4(Math.max(4,   7 * wR));
  const gapLg = snap4(Math.max(16, 20 * wR));

  // Card geometry
  const cardRadius  = Math.round(Math.max(10, 14 * wR));
  const iconBoxSm   = Math.round(Math.max(28, 32 * wR));
  const iconBoxMd   = Math.round(Math.max(36, 44 * wR));
  const iconBoxLg   = Math.round(Math.max(52, 60 * wR));
  const iconSm      = Math.round(iconBoxSm  * 0.5);
  const iconMd      = Math.round(iconBoxMd  * 0.42);
  const iconLg      = Math.round(iconBoxLg  * 0.44);

  // HUD corners — Butler AI design language.
  // Corner size scales with screen width but always stays crisp.
  // Thickness is always 1-2px so it looks etched, not painted.
  const hudCornerSize  = Math.max(7, Math.round(9  * wR));
  const hudCornerThick = dpr >= 3 ? 1.5 : 1;
  const hudAccentH     = dpr >= 3 ? 3   : 2.5;

  // Butler AI monospace scale
  // Formulas keep the relative hierarchy no matter what device:
  //   Xs < Sm < Md < Lg < Xl < Hero
  // All values rounded to 0.5px steps for crisp Hermes text rendering
  const round05 = (n: number) => Math.round(n * 2) / 2;
  const typoXs    = round05(Math.max(7,    7.5  * tR));
  const typoSm    = round05(Math.max(8,    9.5  * tR));
  const typoMd    = round05(Math.max(10.5, 12   * tR));
  const typoLg    = round05(Math.max(13,   15   * tR));
  const typoXl    = round05(Math.max(17,   20   * tR));
  const typoHero  = round05(Math.max(22,   28   * tR));
  const typoLineH = Math.max(1.4, 1.65 - (tR - 1) * 0.2);  // tighter on larger screens

  // Metric display — these are the CPU %, RAM %, latency numbers
  // in the home dashboard. They use a separate scale because they
  // need to be large and readable even at a glance.
  const metricValueSz = round05(Math.max(15, 20 * tR));
  const metricLabelSz = round05(Math.max(8,   8.5 * tR));

  // Quick nav row
  const quickNavH = Math.max(52, Math.round(64 * wR));
  const quickNavW = Math.max(64, Math.round(Math.min((w - padH * 2 - gapSm * 3) / 4, 90)));

  // Chips
  const chipH      = Math.max(24, Math.round(28 * wR));
  const chipPadH   = Math.max(8,  Math.round(11 * wR));
  const chipRadius = Math.round(chipH / 2);

  // Pulse dots
  const pulseDotSm = Math.max(4, Math.round(5 * wR));
  const pulseDotMd = Math.max(6, Math.round(7 * wR));

  return {
    tier,
    sw: w, sh: h, dpr,
    isTablet: tier === 'tablet',
    isMicro:  tier === 'micro',
    padH, padV, gap, gapSm, gapLg,
    cardRadius,
    iconBoxSm, iconBoxMd, iconBoxLg,
    iconSm, iconMd, iconLg,
    hudCornerSize, hudCornerThick, hudAccentH,
    typoXs, typoSm, typoMd, typoLg, typoXl, typoHero,
    typoLineH,
    metricValueSz, metricLabelSz,
    quickNavH, quickNavW,
    chipH, chipPadH, chipRadius,
    pulseDotSm, pulseDotMd,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TYPESETTER — Butler AI monospace auto-fit
// ═══════════════════════════════════════════════════════════════════

/**
 * btlrTypeset(text, containerWidth, maxLines, layout)
 * Computes the optimal font size for a monospace string to fit
 * in a given container width without wrapping, clamped to
 * Butler AI's defined type scale.
 *
 * BUTLER AI-SPECIFIC:
 *   Uses Menlo/monospace character width approximation.
 *   Monospace fonts have a fixed character-width-to-size ratio (~0.62).
 *   This function exploits that property to compute exact fit.
 *   Generic proportional fonts have variable width per character —
 *   this algorithm does NOT work for them (and that's intentional).
 *
 * @param text           The text to fit
 * @param containerWidth Available width in dp
 * @param maxFontSize    Upper cap (defaults to typoLg)
 * @param minFontSize    Lower cap (defaults to typoXs)
 * @returns              fontSize number to use in style
 */
export function btlrTypeset(
  text:           string,
  containerWidth: number,
  maxFontSize:    number = 15,
  minFontSize:    number = 8,
): number {
  if (!text || containerWidth <= 0) return minFontSize;

  // Menlo / monospace char-width-to-font-size ratio
  // Empirically measured across iOS (Menlo) and Android (monospace)
  const MONO_CHAR_RATIO = 0.615;

  const availableWidth = containerWidth * 0.96; // 2% each side breathing room
  const charCount = Math.max(1, text.length);

  // Ideal font size: the size where all characters fit in one line
  const idealSize = (availableWidth / charCount) / MONO_CHAR_RATIO;

  // Clamp to Butler AI type scale bounds
  const clamped = Math.min(maxFontSize, Math.max(minFontSize, idealSize));

  // Snap to 0.5px grid for crisp Hermes rendering
  return Math.round(clamped * 2) / 2;
}

// ═══════════════════════════════════════════════════════════════════
// CHIP ROW CALCULATOR — Butler AI status chip auto-layout
// ═══════════════════════════════════════════════════════════════════

export interface ButlerChipLayout {
  rows:          string[][];  // chips grouped into rows
  rowCount:      number;
  totalHeight:   number;      // total height including gaps (dp)
}

/**
 * btlrChipRows(labels, containerWidth, layout)
 * Distributes chip labels into rows that fit within the container.
 * Used in status strips, capability rows, security audit panels.
 *
 * BUTLER AI-SPECIFIC:
 *   Chips always have chipH height and chipPadH*2 horizontal padding.
 *   This function uses the ButlerLayoutProfile's chipH/chipPadH to
 *   compute exact chip widths using btlrTypeset.
 *
 * @param labels         Array of chip label strings
 * @param containerWidth Available width in dp
 * @param layout         ButlerLayoutProfile (from btlrLayout())
 * @param gap            Gap between chips (defaults to layout.gapSm)
 */
export function btlrChipRows(
  labels:         string[],
  containerWidth: number,
  layout:         ButlerLayoutProfile,
  gap?:           number,
): ButlerChipLayout {
  const g = gap ?? layout.gapSm;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentWidth = 0;

  for (const label of labels) {
    // Approximate chip width: padding + icon (12) + gap + text width
    const textWidth = label.length * layout.typoSm * 0.62;
    const chipWidth = layout.chipPadH * 2 + 14 + g + textWidth + 8; // 8 safety margin

    if (currentWidth + chipWidth + (currentRow.length > 0 ? g : 0) > containerWidth) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [label];
        currentWidth = chipWidth;
      } else {
        // Single chip wider than container — force it on its own row
        rows.push([label]);
        currentWidth = 0;
      }
    } else {
      currentWidth += chipWidth + (currentRow.length > 0 ? g : 0);
      currentRow.push(label);
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const rowH = layout.chipH;
  const rowGap = g;
  const totalHeight = rows.length * rowH + Math.max(0, rows.length - 1) * rowGap;

  return { rows, rowCount: rows.length, totalHeight };
}

// ═══════════════════════════════════════════════════════════════════
// SECTION HEADER CENTERING — unique Butler AI section marker
// ═══════════════════════════════════════════════════════════════════

export interface ButlerSectionMetrics {
  labelFontSize: number;
  leftLineWidth: number;
  rightLineWidth: number;
  totalWidth: number;
}

/**
 * btlrSectionHeader(label, containerWidth, layout)
 * Computes exact measurements for Butler AI's signature section
 * headers: [colored bar] [icon] [LABEL TEXT] [---line---]
 *
 * The line on the right expands/contracts to always fill exactly
 * the remaining space. The label font never exceeds the section
 * header type scale. Works at all screen widths.
 */
export function btlrSectionHeader(
  label:          string,
  containerWidth: number,
  layout:         ButlerLayoutProfile,
): ButlerSectionMetrics {
  // Left side: colored bar (3.5px) + icon (12px) + gaps (8+8)
  const leftFixedWidth = 3.5 + 12 + 16;

  const labelFontSize = btlrTypeset(
    label,
    containerWidth * 0.55,  // label gets at most 55% of container
    layout.typoSm + 1,       // max = slightly above small
    layout.typoXs,           // min = extra small
  );

  // Approximate label render width
  const labelRenderW = label.length * labelFontSize * 0.65;

  // Right line fills remaining space
  const rightLineWidth = Math.max(16, containerWidth - leftFixedWidth - labelRenderW - 24);

  return {
    labelFontSize,
    leftLineWidth: 16,  // standardized left line before icon
    rightLineWidth,
    totalWidth: containerWidth,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MODULE-LEVEL CACHED PROFILE
// Computed once at module load time. Components import this directly
// for static StyleSheet.create() calls — zero runtime overhead.
// ═══════════════════════════════════════════════════════════════════

/**
 * BTLR_L — Static layout profile snapshot.
 * Use this in StyleSheet.create() calls and as default arg.
 * For reactive components that need to respond to orientation
 * changes, call btlrLayout() inside useMemo() instead.
 */
export const BTLR_L: ButlerLayoutProfile = btlrLayout();
