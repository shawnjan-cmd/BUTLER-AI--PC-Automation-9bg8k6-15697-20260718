import { Platform } from 'react-native';

/** Butler visual contract: one source for page geometry and mascot continuity. */
export const ButlerDesign = {
  color: {
    background: '#050810',
    surface: '#0B0F17',
    surfaceRaised: '#111621',
    border: '#24334A',
    text: '#DCE6F2',
    muted: '#6B7A92',
    cyan: '#38D9E8',
    blue: '#4A9EFF',
    mint: '#2FE38A',
    amber: '#FFB43D',
    danger: '#FF4D5E',
    mascotGlow: '#5DE7FF',
  },
  radius: { sm: 8, md: 12, lg: 18, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  typography: {
    display: Platform.select({ ios: 'Menlo-Bold', android: 'monospace', default: 'monospace' }),
    bodyFont: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    title: 22,
    section: 11,
    bodySize: 13,
    caption: 9,
  },
  motion: {
    quick: 120,
    standard: 220,
    ambient: 2600,
    reducedScale: 0.98,
  },
  layout: {
    minTouch: 44,
    pageHorizontal: 14,
    maxContentWidth: 720,
    compactCardGap: 8,
  },
} as const;

export type ButlerMotionMode = 'full' | 'reduced' | 'off';
export type ButlerMascotMode = 'core' | 'night-watch' | 'atelier' | 'greenhouse';

export const ButlerGlyph = {
  // The bowtie is a compositional mark, not a replacement for readable text.
  left: '◈',
  center: '◆',
  right: '◈',
  wordmark: 'BUTLER ◈ AI',
} as const;
