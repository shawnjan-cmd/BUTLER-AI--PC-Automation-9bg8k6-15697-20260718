import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransitionPerformance = 'light' | 'standard' | 'enhanced';
export type TransitionRotation = 'manual' | 'hourly';
export type ButlerTransition = { id: string; name: string; label: string; description: string; performance: TransitionPerformance; accent: string; durationMs: number; reducedMotion: 'fade' | 'none' };

export const TRANSITION_LIBRARY: readonly ButlerTransition[] = [
  { id: 'circuit-sweep', name: 'CIRCUIT SWEEP', label: 'CIRCUIT', description: 'Cyan edge sweep with a compact command-panel reveal.', performance: 'light', accent: '#38D9E8', durationMs: 260, reducedMotion: 'fade' },
  { id: 'ember-bloom', name: 'EMBER BLOOM', label: 'EMBER', description: 'Bounded red-orange bloom with no full-screen particle storm.', performance: 'standard', accent: '#FF4D5E', durationMs: 340, reducedMotion: 'fade' },
  { id: 'terminal-cursor', name: 'TERMINAL CURSOR', label: 'CURSOR', description: 'Prompt-led reveal with a single low-cost cursor pass.', performance: 'light', accent: '#2FE38A', durationMs: 220, reducedMotion: 'fade' },
  { id: 'orbital-dock', name: 'ORBITAL DOCK', label: 'ORBITAL', description: 'Short radial dock motion for hologram and knowledge surfaces.', performance: 'enhanced', accent: '#A468FF', durationMs: 420, reducedMotion: 'fade' },
  { id: 'golden-seal', name: 'GOLDEN SEAL', label: 'SEAL', description: 'Amber title lockup and soft seal pulse for the Guardian family.', performance: 'standard', accent: '#FFB43D', durationMs: 300, reducedMotion: 'fade' },
  { id: 'titanium-lock', name: 'TITANIUM LOCK', label: 'LOCK', description: 'Quiet high-contrast fade with no decorative motion.', performance: 'light', accent: '#C3CFDF', durationMs: 180, reducedMotion: 'none' },
  { id: 'violet-fold', name: 'VIOLET FOLD', label: 'FOLD', description: 'Clipped violet card fold for settings and script surfaces.', performance: 'light', accent: '#A468FF', durationMs: 280, reducedMotion: 'fade' },
  { id: 'scanline-drop', name: 'SCANLINE DROP', label: 'SCAN', description: 'Single scanline drop for terminal telemetry states.', performance: 'light', accent: '#2FE38A', durationMs: 240, reducedMotion: 'fade' },
  { id: 'dragon-wing', name: 'DRAGON WING', label: 'WING', description: 'Short dragon-crest scale reveal with capped heat shimmer.', performance: 'standard', accent: '#FF7A1F', durationMs: 360, reducedMotion: 'fade' },
  { id: 'prism-split', name: 'PRISM SPLIT', label: 'PRISM', description: 'Two-color split highlight for preview cards and package spotlights.', performance: 'enhanced', accent: '#38D9E8', durationMs: 380, reducedMotion: 'fade' },
  { id: 'knowledge-thread', name: 'KNOWLEDGE THREAD', label: 'THREAD', description: 'Thin relation-line draw for knowledge graph changes.', performance: 'standard', accent: '#4A9EFF', durationMs: 320, reducedMotion: 'fade' },
  { id: 'quiet-breathe', name: 'QUIET BREATHE', label: 'BREATHE', description: 'Low-motion opacity breathe for accessible idle states.', performance: 'light', accent: '#9DAABE', durationMs: 500, reducedMotion: 'fade' },
];

const KEY = '@butler_transition_preferences_v1';
export type TransitionPreferences = { selectedIds: string[]; rotation: TransitionRotation; activeIndex: number; updatedAt: string };
export const DEFAULT_TRANSITION_PREFERENCES: TransitionPreferences = { selectedIds: TRANSITION_LIBRARY.slice(0, 5).map(item => item.id), rotation: 'manual', activeIndex: 0, updatedAt: new Date(0).toISOString() };

export async function loadTransitionPreferences(): Promise<TransitionPreferences> { try { const raw = await AsyncStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) as Partial<TransitionPreferences> : {}; const selectedIds = Array.isArray(parsed.selectedIds) ? parsed.selectedIds.filter(id => TRANSITION_LIBRARY.some(item => item.id === id)).slice(0, 5) : DEFAULT_TRANSITION_PREFERENCES.selectedIds; return { ...DEFAULT_TRANSITION_PREFERENCES, ...parsed, selectedIds: selectedIds.length ? selectedIds : DEFAULT_TRANSITION_PREFERENCES.selectedIds, rotation: parsed.rotation === 'hourly' ? 'hourly' : 'manual', activeIndex: Math.max(0, Math.min(selectedIds.length - 1, Number(parsed.activeIndex) || 0)) }; } catch { return DEFAULT_TRANSITION_PREFERENCES; } }
export async function saveTransitionPreferences(preferences: TransitionPreferences): Promise<void> { const selectedIds = preferences.selectedIds.filter(id => TRANSITION_LIBRARY.some(item => item.id === id)).slice(0, 5); await AsyncStorage.setItem(KEY, JSON.stringify({ ...preferences, selectedIds, activeIndex: Math.max(0, Math.min(Math.max(0, selectedIds.length - 1), preferences.activeIndex)), updatedAt: new Date().toISOString() })); }
export function transitionById(id: string): ButlerTransition | undefined { return TRANSITION_LIBRARY.find(item => item.id === id); }
