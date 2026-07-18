/**
 * constants/fonts.ts — Butler AI
 * Single source of truth for font families across 76+ files.
 * Import instead of redeclaring `const MONO = ...` in each file.
 *
 * Usage:
 *   import { MONO, BODY } from '@/constants/fonts';
 */
import { Platform } from 'react-native';

/** Monospace font — use for HUD labels, code, metrics, all-caps chips */
export const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

/** Body / sans-serif font — use for reading copy, chat bubbles, descriptions */
export const BODY: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

/** Courier variant — some older components use this for terminal aesthetics */
export const COURIER: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';
