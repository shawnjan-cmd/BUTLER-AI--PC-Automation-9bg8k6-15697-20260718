import { Platform } from 'react-native';

export const COLOR = {
  bg: '#050810',
  surf: '#0B0F17',
  surf2: '#111621',
  surf3: '#151B27',
  cyan: '#38D9E8',
  green: '#2FE38A',
  amber: '#FFB43D',
  red: '#FF4D5E',
  magenta: '#A468FF',
  teal: '#38D9E8',
  blue: '#4A9EFF',
  pink: '#FF73C6',
  text: '#DCE6F2',
  mid: '#9DAABE',
  dim: '#6B7A92',
  border: 'rgba(56,217,232,0.18)',
} as const;

export const FONT = {
  mono: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) ?? 'System',
} as const;

export const TYPE = {} as const;

export function hex(color: string, alpha = 'FF'): string {
  if (!color?.startsWith('#') || color.length !== 7) return color;
  return `${color}${alpha}`;
}

export function glow(color: string, alphaPercent = 10): string {
  const clamped = Math.max(0, Math.min(100, alphaPercent));
  const alpha = Math.round((clamped / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
  return hex(color, alpha);
}
