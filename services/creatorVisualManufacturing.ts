import type { AppTheme, PackExtras } from '@/contexts/CosmeticContext';
import type { GraphVariant, InventoryItem } from '@/services/cosmeticVariantRegistry';

export type CreatorFilterId = 'ember-forge' | 'terminal-phosphor' | 'hologram-relay' | 'titanium-command' | 'aurora-signal' | 'golden-guardian';
export type CreatorPerformanceClass = 'light' | 'standard' | 'enhanced';
export type CreatorVariantKind = 'style' | 'graph' | 'component' | 'mascot' | 'motion' | 'typography' | 'loading';
export type CreatorVariant = { id: string; name: string; kind: CreatorVariantKind; filter: CreatorFilterId; performance: CreatorPerformanceClass; themePatch: Partial<AppTheme>; extrasPatch: Partial<PackExtras>; metadata: { lineThickness: 1 | 2 | 3 | 4; corner: 'square' | 'clipped' | 'rounded' | 'orbital'; glow: 'none' | 'soft' | 'strong' | 'heat'; motion: 'still' | 'soft' | 'pulse' | 'scan' | 'orbit'; mascotPose?: string; graphTreatment?: string; titleTreatment?: string }; };

export const CREATOR_FILTERS: Record<CreatorFilterId, { label: string; palette: readonly string[]; defaultPerformance: CreatorPerformanceClass; fire: boolean; terminal: boolean }> = {
  'ember-forge': { label: 'EMBER FORGE', palette: ['#FF3D2E', '#FF7A1F', '#FFC247', '#20060A'], defaultPerformance: 'standard', fire: true, terminal: false },
  'terminal-phosphor': { label: 'PHOSPHOR COMMAND', palette: ['#2FE38A', '#8BFFB7', '#06130D', '#C8FFDA'], defaultPerformance: 'light', fire: false, terminal: true },
  'hologram-relay': { label: 'PRISM RELAY', palette: ['#38D9E8', '#A468FF', '#FF5FA8', '#070A18'], defaultPerformance: 'enhanced', fire: false, terminal: false },
  'titanium-command': { label: 'TITANIUM LOCK', palette: ['#C3CFDF', '#6B7A92', '#111621', '#F4F8FF'], defaultPerformance: 'light', fire: false, terminal: true },
  'aurora-signal': { label: 'AURORA SIGNAL', palette: ['#2FE38A', '#38D9E8', '#A468FF', '#050810'], defaultPerformance: 'standard', fire: false, terminal: false },
  'golden-guardian': { label: 'GOLDEN GUARDIAN', palette: ['#FFD166', '#FFB43D', '#A468FF', '#0B0714'], defaultPerformance: 'standard', fire: false, terminal: false },
};

const PREFIX = ['EMBER', 'PHOSPHOR', 'PRISM', 'TITANIUM', 'AURORA', 'GILDED'];
const NOUN = ['CIRCUIT', 'RELAY', 'VAULT', 'SENTINEL', 'DRAGON', 'PROTOCOL', 'LANTERN', 'MATRIX'];
export function proprietaryName(filter: CreatorFilterId, sourceId: string, index = 0): string { const hash = `${filter}:${sourceId}:${index}`.split('').reduce((value, char) => (value * 33 + char.charCodeAt(0)) >>> 0, 5381); return `${PREFIX[hash % PREFIX.length]} ${NOUN[(hash >>> 4) % NOUN.length]} ${String(hash % 997).padStart(3, '0')}`; }

export function manufactureVariant(filterId: CreatorFilterId, sourceId: string, kind: CreatorVariantKind, index = 0, performance?: CreatorPerformanceClass): CreatorVariant {
  const filter = CREATOR_FILTERS[filterId];
  const [primary, secondary, tertiary, background] = filter.palette;
  const fire = filter.fire;
  return { id: `creator:${filterId}:${kind}:${sourceId}`, name: proprietaryName(filterId, sourceId, index), kind, filter: filterId, performance: performance || filter.defaultPerformance, themePatch: { primary, secondary, tertiary, bg: background, panel: background, panelBrt: primary, textAccent: primary, textDim: secondary, textHi: '#F4F8FF', textMid: '#B7C4D6', glowColor: primary, borderColor: secondary, borderBrt: primary }, extrasPatch: { headerGlow: primary !== '#C3CFDF', tabPulse: !filter.terminal, chatShimmer: !filter.terminal, headerStyle: filter.terminal ? 'terminal' : fire ? 'halo' : 'scanline', motionProfile: fire ? 'neon' : filter.terminal ? 'terminal' : 'orbital', fontProfile: filter.terminal ? 'mono' : 'tech', bubbleShape: filter.terminal ? 'terminal' : fire ? 'capsule' : 'orbital', sendEffect: fire ? 'pulse' : 'flash', mascot: fire ? 'guardian' : filter.terminal ? 'terminal' : 'orbital' }, metadata: { lineThickness: fire ? 3 : 2, corner: filter.terminal ? 'square' : fire ? 'clipped' : 'orbital', glow: fire ? 'heat' : filter.defaultPerformance === 'enhanced' ? 'strong' : 'soft', motion: fire ? 'pulse' : filter.terminal ? 'scan' : 'orbit', mascotPose: fire ? 'dragon-crest' : filter.terminal ? 'operator-lean' : 'orbital-hover', graphTreatment: fire ? 'ember-trace' : filter.terminal ? 'phosphor-grid' : 'prism-depth', titleTreatment: fire ? 'forged-bracket' : filter.terminal ? 'prompt-title' : 'split-light' } };
}

export function manufactureInventory(source: readonly InventoryItem[], filterId: CreatorFilterId, kind: CreatorVariantKind, limit = 100): CreatorVariant[] { return source.slice(0, limit).map((item, index) => manufactureVariant(filterId, item.id, kind, index)); }
export function manufactureGraphs(source: readonly GraphVariant[], filterId: CreatorFilterId, limit = 100): CreatorVariant[] { return source.slice(0, limit).map((graph, index) => manufactureVariant(filterId, graph.id, 'graph', index, graph.performance)); }
