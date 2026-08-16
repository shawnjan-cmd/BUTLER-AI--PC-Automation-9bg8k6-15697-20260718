import { CREATOR_FILTERS, CreatorFilterId, CreatorVariant, manufactureVariant } from '@/services/creatorVisualManufacturing';

export type ButlerPageSurface = 'home' | 'scripts' | 'chat' | 'knowledge' | 'monitor' | 'cosmetics' | 'settings';
export type CreatorPresetBundle = { id: string; name: string; filter: CreatorFilterId; description: string; pages: Record<ButlerPageSurface, { header: CreatorVariant; body: CreatorVariant; toolbar: CreatorVariant; graph?: CreatorVariant; mascot: CreatorVariant; loading: CreatorVariant }>; performance: 'light' | 'standard' | 'enhanced' };

const PAGE_ORDER: readonly ButlerPageSurface[] = ['home', 'scripts', 'chat', 'knowledge', 'monitor', 'cosmetics', 'settings'];
const makeBundle = (id: string, filter: CreatorFilterId, name: string, description: string, performance: CreatorPresetBundle['performance']): CreatorPresetBundle => ({ id: `creator-bundle:${id}`, name, filter, description, performance, pages: Object.fromEntries(PAGE_ORDER.map((page, index) => [page, { header: manufactureVariant(filter, `${page}:header`, 'component', index, performance), body: manufactureVariant(filter, `${page}:body`, 'component', index + 10, performance), toolbar: manufactureVariant(filter, `${page}:toolbar`, 'component', index + 20, 'light'), graph: ['knowledge', 'monitor'].includes(page) ? manufactureVariant(filter, `${page}:graph`, 'graph', index, performance) : undefined, mascot: manufactureVariant(filter, `${page}:mascot`, 'mascot', index, performance), loading: manufactureVariant(filter, `${page}:loading`, 'loading', index, 'light') }])) as CreatorPresetBundle['pages'] });

export const CREATOR_PRESET_BUNDLES: readonly CreatorPresetBundle[] = [
  makeBundle('ember-forge', 'ember-forge', 'EMBER FORGE // DRAGONFIRE', 'Fire-red clipped surfaces, ember graph traces, dragon-crest mascot poses, and bounded heat shimmer.', 'standard'),
  makeBundle('phosphor-command', 'terminal-phosphor', 'PHOSPHOR COMMAND // NIGHT SHIFT', 'Green terminal surfaces, prompt-led titles, cursor motion, and low-cost scanline telemetry.', 'light'),
  makeBundle('prism-relay', 'hologram-relay', 'PRISM RELAY // DEEP SIGNAL', 'Cyan-violet-pink orbital surfaces with capped hologram sweeps and relation-focused graph styling.', 'enhanced'),
  makeBundle('titanium-lock', 'titanium-command', 'TITANIUM LOCK // QUIET GUARD', 'High-contrast security surfaces with restrained motion and accessibility-first typography.', 'light'),
  makeBundle('aurora-signal', 'aurora-signal', 'AURORA SIGNAL // NORTHSTAR', 'Green-cyan-violet telemetry layers with soft orbital depth and calm assistant poses.', 'standard'),
  makeBundle('golden-guardian', 'golden-guardian', 'GOLDEN GUARDIAN // TREASURE CIRCUIT', 'Gold-violet guardian surfaces, dragon-inspired accents, and local cosmetic flavor moments.', 'standard'),
];

export function creatorPresetBundle(id: string): CreatorPresetBundle | undefined { return CREATOR_PRESET_BUNDLES.find(bundle => bundle.id === id || bundle.id === `creator-bundle:${id}`); }
export function creatorFilterNames(): readonly string[] { return Object.values(CREATOR_FILTERS).map(filter => filter.label); }
