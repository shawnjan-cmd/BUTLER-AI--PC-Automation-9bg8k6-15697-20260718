/**
 * utils/responsive.ts — Butler AI Responsive Scale System
 *
 * Provides:
 *   rs(n)              — scale a spacing/size value by device width ratio
 *   rf(n)              — scale a font size, capped at 1.3× to prevent runaway
 *   rh(n)              — scale a height value by device height ratio
 *   wp(percent)        — percentage of screen width as a number
 *   hp(percent)        — percentage of screen height as a number
 *   useResponsive()    — reactive hook with above helpers + breakpoint flags
 *   scale(n)           — static rs() for use inside StyleSheet.create()
 *   verticalScale(n)   — static rh() for use inside StyleSheet.create()
 *   moderateScale(n,f) — dampened scale for font sizes in StyleSheet.create()
 *
 * Design reference: 390×844 (iPhone 13/14 standard)
 * All scale functions are clamped so nothing goes below 0.75× or above 1.4×
 */

import { Dimensions, PixelRatio } from 'react-native';

// ── Reference device ─────────────────────────────────────────────
const BASE_W = 390;
const BASE_H = 844;
const BASE_FONT_SCALE = 1;

// ── Static snapshot (for StyleSheet.create time) ──────────────────
const { width: STATIC_W, height: STATIC_H } = Dimensions.get('window');

const _safeW = Math.max(320, STATIC_W || BASE_W);
const _safeH = Math.max(568, STATIC_H || BASE_H);

const _wRatio   = Math.min(1.4, Math.max(0.75, _safeW / BASE_W));
const _hRatio   = Math.min(1.4, Math.max(0.75, _safeH / BASE_H));
const _fontMult = Math.min(1.3, Math.max(0.8,  _wRatio));

/**
 * scale — static spacing scale for StyleSheet.create()
 * Multiply any dp value. Clamped to [0.75×, 1.4×].
 */
export function scale(n: number): number {
  return Math.round(n * _wRatio * 10) / 10;
}

/**
 * verticalScale — static height scale for StyleSheet.create()
 */
export function verticalScale(n: number): number {
  return Math.round(n * _hRatio * 10) / 10;
}

/**
 * moderateScale — dampened scale for font sizes in StyleSheet.create()
 * @param factor  0 = no scaling, 1 = full scaling (default 0.5)
 */
export function moderateScale(n: number, factor = 0.5): number {
  return Math.round((n + (scale(n) - n) * factor) * 10) / 10;
}

/**
 * wp — static % of screen width
 */
export function wp(percent: number): number {
  return Math.max(1, (_safeW * percent) / 100);
}

/**
 * hp — static % of screen height
 */
export function hp(percent: number): number {
  return Math.max(1, (_safeH * percent) / 100);
}

// ── Breakpoint thresholds ─────────────────────────────────────────
const BREAK_SMALL_W    = 360;   // narrow phones (SE, Fold outer)
const BREAK_TABLET_W   = 600;   // 7-inch+ tablets
const BREAK_COMPACT_H  = 700;   // short-height devices (landscape, SE)
const BREAK_LARGE_W    = 900;   // large tablets / foldable unfolded

// ── React hook (reactive on rotation / window change) ────────────
import { useState, useEffect, useCallback } from 'react';

export interface ResponsiveValues {
  /** Current screen width in dp */
  sw: number;
  /** Current screen height in dp */
  sh: number;
  /** Scale a spacing/padding/size value */
  rs: (n: number) => number;
  /** Scale a font size (capped at 1.3×) */
  rf: (n: number) => number;
  /** Scale a height/vertical value */
  rh: (n: number) => number;
  /** % of screen width */
  wp: (percent: number) => number;
  /** % of screen height */
  hp: (percent: number) => number;
  /** Narrow phone — width < 360dp */
  isSmall: boolean;
  /** Tablet — width ≥ 600dp */
  isTablet: boolean;
  /** Large tablet / foldable unfolded — width ≥ 900dp */
  isLarge: boolean;
  /** Short device — height < 700dp (landscape phone, iPhone SE) */
  isCompactHeight: boolean;
  /** Width/height ratio > 1 (landscape orientation) */
  isLandscape: boolean;
}

export function useResponsive(): ResponsiveValues {
  const [dims, setDims] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width: Math.max(320, width || BASE_W), height: Math.max(568, height || BASE_H) };
  });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims({
        width:  Math.max(320, window.width  || BASE_W),
        height: Math.max(568, window.height || BASE_H),
      });
    });
    return () => sub?.remove();
  }, []);

  const sw = dims.width;
  const sh = dims.height;

  const wRatio   = Math.min(1.4, Math.max(0.75, sw / BASE_W));
  const hRatio   = Math.min(1.4, Math.max(0.75, sh / BASE_H));
  const fontMult = Math.min(1.3, Math.max(0.8,  wRatio));

  const rs = useCallback((n: number) => Math.round(n * wRatio * 10) / 10, [wRatio]);
  const rf = useCallback((n: number) => Math.round(n * fontMult * 10) / 10, [fontMult]);
  const rh = useCallback((n: number) => Math.round(n * hRatio * 10) / 10, [hRatio]);
  const wpFn = useCallback((p: number) => Math.max(1, (sw * p) / 100), [sw]);
  const hpFn = useCallback((p: number) => Math.max(1, (sh * p) / 100), [sh]);

  return {
    sw,
    sh,
    rs,
    rf,
    rh,
    wp: wpFn,
    hp: hpFn,
    isSmall:       sw < BREAK_SMALL_W,
    isTablet:      sw >= BREAK_TABLET_W,
    isLarge:       sw >= BREAK_LARGE_W,
    isCompactHeight: sh < BREAK_COMPACT_H,
    isLandscape:   sw > sh,
  };
}
