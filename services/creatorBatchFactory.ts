import { BACKPACK_INVENTORY, GRAPH_VARIANTS } from '@/services/cosmeticVariantRegistry';
import { CreatorFilterId, CreatorVariant, manufactureGraphs, manufactureInventory } from '@/services/creatorVisualManufacturing';
import { CREATOR_PRESET_BUNDLES } from '@/services/creatorPresetBundles';

export type CreatorBatchRequest = { filters?: readonly CreatorFilterId[]; maxPerFamily?: number; includeGraphs?: boolean; includeInventory?: boolean };
export type CreatorBatchResult = { generatedAt: string; variants: CreatorVariant[]; bundleIds: readonly string[]; count: number; performanceCounts: Record<'light' | 'standard' | 'enhanced', number> };

/** Internal creator workflow only. Do not import from consumer Backpack screens. */
export function manufactureCreatorBatch(request: CreatorBatchRequest = {}): CreatorBatchResult {
  const filters = request.filters?.length ? request.filters : CREATOR_PRESET_BUNDLES.map(bundle => bundle.filter);
  const limit = Math.max(1, Math.min(250, request.maxPerFamily || 100));
  const variants = filters.flatMap(filter => [
    ...(request.includeInventory === false ? [] : manufactureInventory(BACKPACK_INVENTORY.filter(item => item.section !== 'graphs'), filter, 'component', limit)),
    ...(request.includeGraphs === false ? [] : manufactureGraphs(GRAPH_VARIANTS, filter, limit)),
  ]);
  const performanceCounts = { light: 0, standard: 0, enhanced: 0 } as Record<'light' | 'standard' | 'enhanced', number>;
  variants.forEach(variant => { performanceCounts[variant.performance] += 1; });
  return { generatedAt: new Date().toISOString(), variants, bundleIds: CREATOR_PRESET_BUNDLES.filter(bundle => filters.includes(bundle.filter)).map(bundle => bundle.id), count: variants.length, performanceCounts };
}
