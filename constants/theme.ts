// Flat legacy theme — kept for the original 3 screens (index/connect/settings).
// For the full NEXUS/Dark-Matter HUD token system (colors, fonts, spacing),
// see ./designTokens.ts (richer, nested `theme.colors.*` shape used by newer
// visual components such as RobotThemeUI, FuturisticTabBar, ButlerAITitle3D).
export const theme = {
  bg: '#0C0E14',
  surface: '#131620',
  surfaceAlt: '#171A24',
  border: 'rgba(255,106,31,0.18)',
  text: '#D0DFF0',
  textMuted: '#5A6880',
  primary: '#FF6A1F',
  primaryText: '#ffffff',
  success: '#00FF88',
  danger: '#EF4444',
  warn: '#FFC400',
} as const;

export type Theme = typeof theme;
