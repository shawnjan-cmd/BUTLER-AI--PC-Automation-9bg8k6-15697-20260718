/**
 * useResponsiveLayout — universal responsive grid and size system.
 *
 * Provides COL2 / COL3 / COL4 column widths, screen dimensions,
 * and safe layout helpers that work on any Android/iOS device.
 *
 * Rules (from Master Instructions):
 *  - Never use useWindowDimensions() — broken in Expo Web SSR.
 *  - Use Dimensions.get('window') + event listener.
 *  - All calculated values use Math.max(1, value) to prevent zeros.
 *  - Default fallback: 375×667 (iPhone SE — smallest common phone).
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import { useState, useEffect, useMemo } from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';

const PAD  = 28;  // total horizontal padding (14 × 2)
const GAP2 = 12;  // 2-col gap
const GAP3 = 8;   // 3-col gap  (× 2 = 16)
const GAP4 = 8;   // 4-col gap  (× 3 = 24)

export interface ResponsiveLayout {
  /** Screen width (safe, never 0). */
  sw: number;
  /** Screen height (safe, never 0). */
  sh: number;
  /** 2-column cell width with 12px gap and 14px side padding each side. */
  col2: number;
  /** 3-column cell width with 8px gaps and 14px side padding each side. */
  col3: number;
  /** 4-column cell width with 8px gaps and 14px side padding each side. */
  col4: number;
  /** True when sw >= 600 (tablet breakpoint). */
  isTablet: boolean;
  /** True when sw >= 1024 (desktop breakpoint). */
  isDesktop: boolean;
  /** Scale factor relative to 375px base. Use for icon/avatar sizes. */
  scale: number;
  /** Font scale factor. Use with scaleFont() from design-system/tokens. */
  fontScale: number;
  /** Safe outer padding (14px on phone, 24px on tablet). */
  screenPad: number;
}

let _cached: ResponsiveLayout | null = null;

function compute(): ResponsiveLayout {
  const dim = Dimensions.get('window');
  const sw  = Math.max(1, dim.width  || 375);
  const sh  = Math.max(1, dim.height || 667);

  const isTablet  = sw >= 600;
  const isDesktop = sw >= 1024;
  const screenPad = isTablet ? 24 : 14;
  const totalPad  = screenPad * 2;

  const col2 = Math.max(1, Math.floor((sw - totalPad - GAP2) / 2));
  const col3 = Math.max(1, Math.floor((sw - totalPad - GAP3 * 2) / 3));
  const col4 = Math.max(1, Math.floor((sw - totalPad - GAP4 * 3) / 4));

  const scale     = Math.min(sw / 375, 1.4);   // cap at 1.4× so giant phones don't over-scale
  const fontScale = Math.min(Math.max(sw / 375, 0.85), 1.25);

  return { sw, sh, col2, col3, col4, isTablet, isDesktop, scale, fontScale, screenPad };
}

/**
 * Hook — re-renders whenever orientation or screen size changes.
 * Call once in each screen that needs responsive grids.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(() => {
    _cached = compute();
    return _cached;
  });

  useEffect(() => {
    const update = () => {
      const next = compute();
      _cached = next;
      setLayout(next);
    };
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  return layout;
}

/**
 * Sync helper — get the current layout without subscribing to updates.
 * Use in callbacks, event handlers, and StyleSheet.create() calls.
 */
export function getLayout(): ResponsiveLayout {
  return _cached ?? compute();
}

/**
 * scaleSize — scale a base size value to the current screen width.
 * Use for icon sizes, card heights, avatar dimensions.
 */
export function scaleSize(base: number): number {
  const { scale } = getLayout();
  return Math.round(Math.max(1, base * scale));
}

/**
 * scaleFont — scale a base font size to the current screen.
 * Clamps between 0.85× and 1.25× of base to stay readable.
 */
export function scaleFont(base: number): number {
  const { fontScale } = getLayout();
  return Math.round(Math.max(1, base * fontScale));
}

/**
 * adaptiveGridStyle — returns a StyleSheet-compatible style object
 * for a grid item based on column count and gap.
 * Usage: <View style={adaptiveGridStyle(layout, 2, 12)} />
 */
export function adaptiveGridStyle(
  layout: ResponsiveLayout,
  cols: 2 | 3 | 4,
  gap = 12,
): { width: number } {
  const map = { 2: layout.col2, 3: layout.col3, 4: layout.col4 };
  return { width: map[cols] };
}

export default useResponsiveLayout;
