import AsyncStorage from '@react-native-async-storage/async-storage';

export const LAYOUT_KEY = '@butler_layout_editor_v1';

export type GraphStyle = 'bars' | 'line' | 'area' | 'radial' | 'matrix';
export type MotionStyle = 'still' | 'soft' | 'pulse' | 'scan' | 'orbit';
export type BubbleStyle = 'soft' | 'bracket' | 'capsule' | 'terminal' | 'orbital';
export type ShapeKind = 'card' | 'pill' | 'circle' | 'hex' | 'diamond' | 'line' | 'frame' | 'blob';
export type AnchorPosition = 'free' | 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type ShortcutTarget = { type: 'page'; pageId: 'home' | 'scripts' | 'chat' | 'knowledge' | 'monitor' | 'cosmetics' | 'settings' } | { type: 'script'; scriptId: string };
export type UniversalSize = 'tiny' | 'small' | 'medium' | 'large' | 'wide' | 'hero';
export const UNIVERSAL_SIZE_ORDER: readonly UniversalSize[] = ['tiny', 'small', 'medium', 'large', 'wide', 'hero'];
export const UNIVERSAL_SIZE_LABELS: Record<UniversalSize, string> = { tiny: 'TINY', small: 'SMALL', medium: 'MEDIUM', large: 'LARGE', wide: 'WIDE', hero: 'HERO' };
export type ComponentGeometry = { x: number; y: number; width: number; height: number; zIndex: number; anchor: AnchorPosition; snap: boolean; magnet: boolean };
export const UNIVERSAL_SIZE_GEOMETRY: Record<UniversalSize, Pick<ComponentGeometry, 'width' | 'height'>> = { tiny: { width: 92, height: 56 }, small: { width: 180, height: 82 }, medium: { width: 280, height: 120 }, large: { width: 420, height: 180 }, wide: { width: 620, height: 150 }, hero: { width: 860, height: 260 } };
export type LocalAsset = { uri: string; kind: 'image' | 'svg'; byteLength?: number; alt: string; sha256?: string };

export type ComponentKind = 'header' | 'chat' | 'scripts' | 'graph' | 'activity' | 'status' | 'mascot' | 'quick-action' | 'security' | 'knowledge' | 'image' | 'banner' | 'hero' | 'separator' | 'metric';

export type LayoutComponent = {
  id: string;
  label: string;
  kind: ComponentKind;
  visible: boolean;
  order: number;
  protected: boolean;
  removable: boolean;
  graphStyle?: GraphStyle;
  accent?: string;
  motion?: MotionStyle;
  lineThickness?: 1 | 2 | 3 | 4;
  imageUri?: string;
  imageAlt?: string;
  shape?: ShapeKind;
  iconName?: string;
  localAsset?: LocalAsset;
  shortcut?: ShortcutTarget;
  geometry?: ComponentGeometry;
  universalSize?: UniversalSize;
};

export type VisualPreferences = {
  motion: MotionStyle;
  bubble: BubbleStyle;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  particlesEnabled: boolean;
  headerStyle: 'bracket' | 'halo' | 'scanline' | 'terminal' | 'minimal';
  fontProfile: 'clean' | 'mono' | 'tech';
  density: 'compact' | 'regular' | 'large';
};

export type LayoutEditorState = {
  version: 1;
  editMode: boolean;
  components: LayoutComponent[];
  visuals: VisualPreferences;
  gridVisible: boolean;
  gridSize: 4 | 8 | 12 | 16 | 24;
  gridColor: string;
  snapMode: 'snap' | 'free';
  updatedAt: string;
};

export const PROTECTED_COMPONENT_IDS = new Set(['page-header', 'butler-chat', 'script-library']);

export const COMPONENT_INVENTORY: LayoutComponent[] = [
  { id: 'page-header', label: 'Page Header', kind: 'header', visible: true, order: 0, protected: true, removable: false, motion: 'soft' },
  { id: 'butler-chat', label: 'Butler AI Chat', kind: 'chat', visible: true, order: 1, protected: true, removable: false, motion: 'soft' },
  { id: 'script-library', label: 'Script Library', kind: 'scripts', visible: true, order: 2, protected: true, removable: false, motion: 'soft' },
  { id: 'pc-health', label: 'PC Health', kind: 'status', visible: true, order: 3, protected: false, removable: true, graphStyle: 'bars', motion: 'pulse' },
  { id: 'memory-graph', label: 'Memory Graph', kind: 'graph', visible: true, order: 4, protected: false, removable: true, graphStyle: 'area', motion: 'soft' },
  { id: 'crawler-graph', label: 'Crawler Graph', kind: 'knowledge', visible: true, order: 5, protected: false, removable: true, graphStyle: 'line', motion: 'scan' },
  { id: 'cpu-graph', label: 'CPU Graph', kind: 'graph', visible: true, order: 6, protected: false, removable: true, graphStyle: 'line', motion: 'pulse' },
  { id: 'ram-graph', label: 'RAM Graph', kind: 'graph', visible: true, order: 7, protected: false, removable: true, graphStyle: 'area', motion: 'pulse' },
  { id: 'storage-graph', label: 'Storage Graph', kind: 'graph', visible: true, order: 8, protected: false, removable: true, graphStyle: 'bars', motion: 'soft' },
  { id: 'security-strip', label: 'Security Evidence', kind: 'security', visible: true, order: 9, protected: false, removable: true, motion: 'scan' },
  { id: 'recent-activity', label: 'Recent Activity', kind: 'activity', visible: true, order: 10, protected: false, removable: true, motion: 'soft' },
  { id: 'quick-actions', label: 'Quick Actions', kind: 'quick-action', visible: true, order: 11, protected: false, removable: true, motion: 'pulse' },
  { id: 'mascot-orb', label: 'Butler Mascot', kind: 'mascot', visible: true, order: 12, protected: false, removable: true, motion: 'orbit', lineThickness: 2 },
  { id: 'hero-image', label: 'Hero Image Banner', kind: 'hero', visible: false, order: 13, protected: false, removable: true, motion: 'soft', lineThickness: 2 },
  { id: 'image-tile', label: 'Image Tile', kind: 'image', visible: false, order: 14, protected: false, removable: true, motion: 'soft', lineThickness: 1 },
  { id: 'status-chip', label: 'Status Chip Row', kind: 'status', visible: false, order: 15, protected: false, removable: true, motion: 'pulse', lineThickness: 1 },
  { id: 'quick-metric', label: 'Quick Metric Tile', kind: 'metric', visible: false, order: 16, protected: false, removable: true, motion: 'pulse', lineThickness: 2 },
  { id: 'section-divider', label: 'Glowing Divider', kind: 'separator', visible: false, order: 17, protected: false, removable: true, motion: 'scan', lineThickness: 2 },
  { id: 'announcement-banner', label: 'Announcement Banner', kind: 'banner', visible: false, order: 18, protected: false, removable: true, motion: 'soft', lineThickness: 2 },
  { id: 'shortcut-tile', label: 'Shortcut Tile', kind: 'quick-action', visible: false, order: 19, protected: false, removable: true, motion: 'pulse', lineThickness: 2, iconName: 'link-variant' },
];

export const DEFAULT_VISUALS: VisualPreferences = {
  motion: 'soft', bubble: 'bracket', soundEnabled: true, hapticsEnabled: true,
  particlesEnabled: true, headerStyle: 'bracket', fontProfile: 'mono', density: 'regular',
};

export const DEFAULT_LAYOUT: LayoutEditorState = {
  version: 1, editMode: false, components: COMPONENT_INVENTORY, visuals: DEFAULT_VISUALS, gridVisible: true, gridSize: 8, gridColor: '#6DE7F2', snapMode: 'snap', updatedAt: new Date(0).toISOString(),
};

const DEFAULT_GEOMETRY: ComponentGeometry = { x: 0, y: 0, width: 100, height: 80, zIndex: 0, anchor: 'free', snap: true, magnet: true };
const ALLOWED_ICON_NAMES = new Set(['view-dashboard-outline', 'image-outline', 'image-plus', 'link-variant', 'script-text-outline', 'home-outline', 'chat-outline', 'cog-outline', 'monitor-dashboard', 'brain', 'palette-outline']);

function clamp(value: unknown, min: number, max: number, fallback: number): number { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback; }
function normalizeGeometry(raw: unknown, index: number): ComponentGeometry { const value = raw && typeof raw === 'object' ? raw as Partial<ComponentGeometry> : {}; return { x: clamp(value.x, -100, 1000, 0), y: clamp(value.y, -100, 2000, index * 88), width: clamp(value.width, 32, 1000, 100), height: clamp(value.height, 24, 1200, 80), zIndex: Math.round(clamp(value.zIndex, 0, 999, index)), anchor: value.anchor || 'free', snap: value.snap !== false, magnet: value.magnet !== false }; }
function normalizeComponent(item: LayoutComponent, index: number): LayoutComponent { const size = UNIVERSAL_SIZE_ORDER.includes(item.universalSize as UniversalSize) ? item.universalSize as UniversalSize : 'medium'; const rawGeometry = item.geometry || UNIVERSAL_SIZE_GEOMETRY[size]; const safe = { ...item, universalSize: size, geometry: normalizeGeometry(rawGeometry, index), shape: item.shape || (item.kind === 'separator' ? 'line' : 'card'), iconName: item.iconName && ALLOWED_ICON_NAMES.has(item.iconName) ? item.iconName : 'view-dashboard-outline' }; return safe; }

export function normalizeCanvasState(state: LayoutEditorState): LayoutEditorState { return { ...state, components: state.components.map(normalizeComponent) }; }

export function normalize(raw: unknown): LayoutEditorState {
  if (!raw || typeof raw !== 'object') return DEFAULT_LAYOUT;
  const value = raw as Partial<LayoutEditorState>;
  const source = Array.isArray(value.components) ? value.components : [];
  const byId = new Map(source.filter(item => item && typeof item.id === 'string').map(item => [item.id, item]));
  const components = COMPONENT_INVENTORY.map(base => ({ ...base, ...(byId.get(base.id) || {}), protected: base.protected, removable: base.removable }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((item, index) => ({ ...item, order: index, visible: item.protected ? true : item.visible !== false }));
  const visuals = { ...DEFAULT_VISUALS, ...(value.visuals || {}) } as VisualPreferences;
  const allowedGridSizes = new Set([4, 8, 12, 16, 24]);
  const rawGridSize = Number(value.gridSize);
  const gridSize = (allowedGridSizes.has(rawGridSize) ? rawGridSize : 8) as LayoutEditorState['gridSize'];
  const gridColor = typeof value.gridColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value.gridColor) ? value.gridColor : '#6DE7F2';
  const snapMode = value.snapMode === 'free' ? 'free' : 'snap';
  return normalizeCanvasState({ version: 1, editMode: false, components, visuals, gridVisible: value.gridVisible !== false, gridSize, gridColor, snapMode, updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString() });
}

export async function loadLayoutState(): Promise<LayoutEditorState> {
  try { const raw = await AsyncStorage.getItem(LAYOUT_KEY); return raw ? normalize(JSON.parse(raw)) : DEFAULT_LAYOUT; } catch { return DEFAULT_LAYOUT; }
}

export async function saveLayoutState(state: LayoutEditorState): Promise<void> {
  const safe = normalize(state);
  await AsyncStorage.setItem(LAYOUT_KEY, JSON.stringify({ ...safe, editMode: false, updatedAt: new Date().toISOString() }));
}

export function removeComponent(state: LayoutEditorState, id: string): LayoutEditorState {
  const item = state.components.find(component => component.id === id);
  if (!item || item.protected || !item.removable) return state;
  return { ...state, components: state.components.filter(component => component.id !== id).map((component, index) => ({ ...component, order: index })) };
}

export function setComponentVisible(state: LayoutEditorState, id: string, visible: boolean): LayoutEditorState {
  return { ...state, components: state.components.map(component => component.id === id && !component.protected ? { ...component, visible } : component) };
}

export function moveComponent(state: LayoutEditorState, id: string, direction: -1 | 1): LayoutEditorState {
  const ordered = [...state.components].sort((a, b) => a.order - b.order);
  const from = ordered.findIndex(component => component.id === id);
  if (from < 0) return state;
  const to = Math.max(0, Math.min(ordered.length - 1, from + direction));
  if (from === to) return state;
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  return { ...state, components: ordered.map((component, index) => ({ ...component, order: index })) };
}

export function setGraphStyle(state: LayoutEditorState, id: string, graphStyle: GraphStyle): LayoutEditorState {
  return { ...state, components: state.components.map(component => component.id === id && component.kind === 'graph' ? { ...component, graphStyle } : component) };
}

export function updateVisuals(state: LayoutEditorState, visuals: Partial<VisualPreferences>): LayoutEditorState {
  return { ...state, visuals: { ...state.visuals, ...visuals } };
}

export function updateEditorPreferences(state: LayoutEditorState, patch: Partial<Pick<LayoutEditorState, 'gridVisible' | 'gridSize' | 'gridColor' | 'snapMode'>>): LayoutEditorState {
  const safeColor = patch.gridColor && /^#[0-9A-Fa-f]{6}$/.test(patch.gridColor) ? patch.gridColor : state.gridColor;
  const safeSize = patch.gridSize && [4, 8, 12, 16, 24].includes(patch.gridSize) ? patch.gridSize : state.gridSize;
  return { ...state, gridVisible: patch.gridVisible ?? state.gridVisible, gridSize: safeSize as LayoutEditorState['gridSize'], gridColor: safeColor, snapMode: patch.snapMode ?? state.snapMode };
}

export function addComponent(state: LayoutEditorState, id: string): LayoutEditorState {
  const base = COMPONENT_INVENTORY.find(component => component.id === id);
  if (!base || state.components.some(component => component.id === id)) return state;
  return { ...state, components: [...state.components, { ...base, visible: true, order: state.components.length }] };
}

export function updateComponentStyle(state: LayoutEditorState, id: string, patch: Partial<Pick<LayoutComponent, 'lineThickness' | 'graphStyle' | 'motion' | 'accent' | 'imageUri' | 'imageAlt'>>): LayoutEditorState {
  return { ...state, components: state.components.map(component => component.id === id && !component.protected ? { ...component, ...patch } : component) };
}

export function validateImageAsset(uri: string, byteLength?: number): { ok: boolean; reason?: string } {
  if (!uri || !/^(file|content|data):/i.test(uri)) return { ok: false, reason: 'Only local image URIs are allowed.' };
  if (byteLength !== undefined && (!Number.isFinite(byteLength) || byteLength <= 0 || byteLength > 8 * 1024 * 1024)) return { ok: false, reason: 'Image must be between 1 byte and 8 MB.' };
  return { ok: true };
}

export function validateLocalAsset(asset: LocalAsset): { ok: boolean; reason?: string } {
  const check = validateImageAsset(asset.uri, asset.byteLength);
  if (!check.ok) return check;
  if (asset.kind === 'svg' && !/^data:image\/svg\+xml|^(file|content):/i.test(asset.uri)) return { ok: false, reason: 'SVG must be a local file or image data URI.' };
  if (!asset.alt || asset.alt.length > 160) return { ok: false, reason: 'An accessible alt label between 1 and 160 characters is required.' };
  return { ok: true };
}

function snapValue(value: number, snap: boolean, gridSize = 8): number { return snap ? Math.round(value / gridSize) * gridSize : Math.round(value); }
function getGeometry(component: LayoutComponent, index = 0): ComponentGeometry { return normalizeGeometry(component.geometry, index); }

function nearestMagnet(value: number, candidates: number[], threshold: number): number { let best = value; let distance = threshold + 1; candidates.forEach(candidate => { const delta = Math.abs(candidate - value); if (delta <= threshold && delta < distance) { best = candidate; distance = delta; } }); return best; }

export function magnetizeComponent(state: LayoutEditorState, id: string): LayoutEditorState {
  const target = state.components.find(item => item.id === id);
  if (!target || target.protected || state.snapMode === 'free' || target.geometry?.magnet === false) return state;
  const targetGeometry = getGeometry(target);
  const others = state.components.filter(item => item.id !== id && item.visible).map(item => getGeometry(item));
  const xCandidates = others.flatMap(g => [g.x, g.x + g.width, g.x - targetGeometry.width, g.x + g.width - targetGeometry.width, g.x + (g.width - targetGeometry.width) / 2]);
  const yCandidates = others.flatMap(g => [g.y, g.y + g.height, g.y - targetGeometry.height, g.y + g.height - targetGeometry.height, g.y + (g.height - targetGeometry.height) / 2]);
  const threshold = Math.max(6, state.gridSize * 1.5);
  const nextGeometry = { ...targetGeometry, x: Math.max(0, nearestMagnet(targetGeometry.x, xCandidates, threshold)), y: Math.max(0, nearestMagnet(targetGeometry.y, yCandidates, threshold)) };
  return { ...state, components: state.components.map(item => item.id === id ? { ...item, geometry: nextGeometry } : item) };
}

export function nudgeComponent(state: LayoutEditorState, id: string, dx: -1 | 0 | 1, dy: -1 | 0 | 1): LayoutEditorState {
  const moved = { ...state, components: state.components.map((item, index) => { if (item.id !== id || item.protected) return item; const g = getGeometry(item, index); return { ...item, geometry: { ...g, x: Math.max(0, snapValue(g.x + dx * state.gridSize, state.snapMode !== 'free' && g.snap, state.gridSize)), y: Math.max(0, snapValue(g.y + dy * state.gridSize, state.snapMode !== 'free' && g.snap, state.gridSize)) } }; }) };
  return magnetizeComponent(moved, id);
}

export function setUniversalSize(state: LayoutEditorState, id: string, universalSize: UniversalSize): LayoutEditorState {
  const dimensions = UNIVERSAL_SIZE_GEOMETRY[universalSize];
  if (!dimensions) return state;
  return { ...state, components: state.components.map((item, index) => item.id === id && !item.protected ? { ...item, universalSize, geometry: normalizeGeometry({ ...(item.geometry || DEFAULT_GEOMETRY), ...dimensions }, index) } : item) };
}

export function resizeComponent(state: LayoutEditorState, id: string, dw: number, dh: number): LayoutEditorState {
  return { ...state, components: state.components.map((item, index) => { if (item.id !== id || item.protected) return item; const g = getGeometry(item, index); return { ...item, geometry: { ...g, width: clamp(g.width + dw, 32, 1000, g.width), height: clamp(g.height + dh, 24, 1200, g.height) } }; }) };
}

export function alignComponent(state: LayoutEditorState, id: string, anchor: AnchorPosition): LayoutEditorState {
  return { ...state, components: state.components.map((item, index) => {
    if (item.id !== id || item.protected) return item;
    const g = getGeometry(item, index);
    const x = anchor.endsWith('left') ? 16 : anchor.endsWith('right') ? 984 - g.width : (1000 - g.width) / 2;
    const y = anchor.startsWith('top') ? 16 : anchor.startsWith('bottom') ? 1984 - g.height : (2000 - g.height) / 2;
    return { ...item, geometry: { ...g, x: clamp(x, 0, 1000 - g.width, g.x), y: clamp(y, 0, 2000 - g.height, g.y), anchor } };
  }) };
}

export function setComponentShape(state: LayoutEditorState, id: string, shape: ShapeKind): LayoutEditorState { return { ...state, components: state.components.map(item => item.id === id && !item.protected ? { ...item, shape } : item) }; }
export function setComponentIcon(state: LayoutEditorState, id: string, iconName: string): LayoutEditorState { return { ...state, components: state.components.map(item => item.id === id && !item.protected && ALLOWED_ICON_NAMES.has(iconName) ? { ...item, iconName } : item) }; }
export function setComponentShortcut(state: LayoutEditorState, id: string, shortcut: ShortcutTarget | undefined): LayoutEditorState { return { ...state, components: state.components.map(item => item.id === id && !item.protected ? { ...item, shortcut } : item) }; }
