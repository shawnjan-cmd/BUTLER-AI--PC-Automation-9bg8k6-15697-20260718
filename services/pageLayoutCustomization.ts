import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LAYOUT, LayoutEditorState, loadLayoutState, saveLayoutState } from '@/services/layoutCustomization';

export type ButlerPageId = 'home' | 'scripts' | 'chat' | 'knowledge' | 'monitor' | 'cosmetics' | 'settings' | 'tools';

export const BUTLER_PAGE_IDS: ButlerPageId[] = ['home', 'scripts', 'chat', 'knowledge', 'monitor', 'cosmetics', 'settings', 'tools'];
export const PAGE_LAYOUT_PREFIX = '@butler_page_layout_v2:';

export type PageHeaderStyle = 'bracket' | 'halo' | 'scanline' | 'terminal' | 'minimal' | 'orbit';
export type PageEffectStyle = 'none' | 'soft-glow' | 'scan' | 'pulse' | 'orbit' | 'particles';
export type PageDensity = 'compact' | 'regular' | 'spacious';
export type PageScale = 'small' | 'regular' | 'large';

export type PageVisualTokens = {
  accent: string;
  accent2: string;
  accent3: string;
  surfaceOpacity: number;
  borderOpacity: number;
  lineThickness: 1 | 2 | 3 | 4;
  radius: 8 | 12 | 16 | 20 | 24;
  spacing: 6 | 8 | 10 | 12 | 16 | 20;
  scale: PageScale;
  density: PageDensity;
  effect: PageEffectStyle;
  headerStyle: PageHeaderStyle;
  headerHeight: 'compact' | 'regular' | 'tall';
  reducedMotion: boolean;
};

export type PageLayoutState = LayoutEditorState & { pageId: ButlerPageId; tokens: PageVisualTokens; headerProtected: true };

export const DEFAULT_PAGE_TOKENS: PageVisualTokens = {
  accent: '#6DE7F2', accent2: '#A468FF', accent3: '#FF4D9A', surfaceOpacity: 0.92,
  borderOpacity: 0.55, lineThickness: 2, radius: 16, spacing: 12, scale: 'regular',
  density: 'regular', effect: 'soft-glow', headerStyle: 'bracket', headerHeight: 'regular', reducedMotion: false,
};

function key(pageId: ButlerPageId): string { return `${PAGE_LAYOUT_PREFIX}${pageId}`; }

export async function loadPageLayoutState(pageId: ButlerPageId): Promise<PageLayoutState> {
  try {
    const raw = await AsyncStorage.getItem(key(pageId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PageLayoutState>;
      return { ...DEFAULT_LAYOUT, ...parsed, pageId, components: Array.isArray(parsed.components) ? parsed.components : DEFAULT_LAYOUT.components, visuals: { ...DEFAULT_LAYOUT.visuals, ...(parsed.visuals || {}) }, tokens: { ...DEFAULT_PAGE_TOKENS, ...(parsed.tokens || {}) }, headerProtected: true, editMode: false };
    }
    const legacy = await loadLayoutState();
    return { ...legacy, pageId, tokens: DEFAULT_PAGE_TOKENS, headerProtected: true };
  } catch {
    return { ...DEFAULT_LAYOUT, pageId, tokens: DEFAULT_PAGE_TOKENS, headerProtected: true };
  }
}

export async function savePageLayoutState(state: PageLayoutState): Promise<void> {
  const safe: PageLayoutState = { ...state, tokens: { ...DEFAULT_PAGE_TOKENS, ...(state.tokens || {}) }, headerProtected: true, editMode: false, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(key(state.pageId), JSON.stringify(safe));
  // Preserve the prior global layout as a compatibility fallback for old builds.
  if (state.pageId === 'cosmetics') await saveLayoutState(safe);
}

export function updatePageTokens(state: PageLayoutState, patch: Partial<PageVisualTokens>): PageLayoutState {
  return { ...state, tokens: { ...state.tokens, ...patch, reducedMotion: Boolean(patch.reducedMotion ?? state.tokens.reducedMotion) } };
}

export async function clearPageLayoutState(pageId: ButlerPageId): Promise<void> {
  await AsyncStorage.removeItem(key(pageId));
}
