import type { ButlerPageId } from '@/services/pageLayoutCustomization';

export type { ButlerPageId } from '@/services/pageLayoutCustomization';
export type PageRecipe = {
  styleId: string;
  pageId: ButlerPageId;
  eyebrow: string;
  title: string;
  subtitle: string;
  background: 'command-lattice' | 'phosphor-grid' | 'ember-forge' | 'hologram-depth' | 'titanium-mesh' | 'aqua-current' | 'aurora-veil' | 'frost-crystal';
  titleTreatment: 'glow-wide' | 'scanline-caps' | 'ember-core' | 'prism-split' | 'steel-stamp' | 'wave-line' | 'aurora-bloom' | 'frost-lattice';
  graphTitleTreatment: 'trace-label' | 'prompt-label' | 'heat-label' | 'orbit-label' | 'plate-label' | 'tide-label' | 'veil-label' | 'ice-label';
  numberTreatment: 'segmented' | 'terminal' | 'heat' | 'orbital' | 'engraved' | 'liquid' | 'spectrum' | 'crystal';
  buttonTreatment: 'clipped-command' | 'prompt-key' | 'ember-edge' | 'prism-action' | 'steel-plate' | 'tide-pill' | 'aurora-chip' | 'snow-cap';
  iconTreatment: 'bowtie-line' | 'phosphor-pixel' | 'dragon-claw' | 'hologram-wire' | 'titanium-plate' | 'aqua-line' | 'aurora-star' | 'snowflake-bowtie';
  animation: 'calm-sweep' | 'cursor-scan' | 'ember-breathe' | 'orbit-shimmer' | 'steel-pulse' | 'wave-drift' | 'veil-flow' | 'frost-drift';
  reducedMotion: 'static-grid' | 'static-scanline' | 'static-ember' | 'static-orbit' | 'static-mesh' | 'static-wave' | 'static-veil' | 'static-frost';
};

const pages: ButlerPageId[] = ['home', 'scripts', 'chat', 'knowledge', 'monitor', 'cosmetics', 'settings', 'tools'];
const styles = [
  { id: 'butler-core', prefix: 'BUTLER CORE', bg: 'command-lattice', title: 'glow-wide', graph: 'trace-label', num: 'segmented', button: 'clipped-command', icon: 'bowtie-line', anim: 'calm-sweep', reduced: 'static-grid' },
  { id: 'terminal-forge', prefix: 'TERMINAL FORGE', bg: 'phosphor-grid', title: 'scanline-caps', graph: 'prompt-label', num: 'terminal', button: 'prompt-key', icon: 'phosphor-pixel', anim: 'cursor-scan', reduced: 'static-scanline' },
  { id: 'ember-dragon', prefix: 'EMBER DRAGON', bg: 'ember-forge', title: 'ember-core', graph: 'heat-label', num: 'heat', button: 'ember-edge', icon: 'dragon-claw', anim: 'ember-breathe', reduced: 'static-ember' },
  { id: 'hologram-relay', prefix: 'HOLOGRAM RELAY', bg: 'hologram-depth', title: 'prism-split', graph: 'orbit-label', num: 'orbital', button: 'prism-action', icon: 'hologram-wire', anim: 'orbit-shimmer', reduced: 'static-orbit' },
  { id: 'titanium-guardian', prefix: 'TITANIUM GUARDIAN', bg: 'titanium-mesh', title: 'steel-stamp', graph: 'plate-label', num: 'engraved', button: 'steel-plate', icon: 'titanium-plate', anim: 'steel-pulse', reduced: 'static-mesh' },
  { id: 'aqua-tide', prefix: 'AQUA TIDE', bg: 'aqua-current', title: 'wave-line', graph: 'tide-label', num: 'liquid', button: 'tide-pill', icon: 'aqua-line', anim: 'wave-drift', reduced: 'static-wave' },
  { id: 'aurora-veil', prefix: 'AURORA VEIL', bg: 'aurora-veil', title: 'aurora-bloom', graph: 'veil-label', num: 'spectrum', button: 'aurora-chip', icon: 'aurora-star', anim: 'veil-flow', reduced: 'static-veil' },
  { id: 'frostbound-butler', prefix: 'FROSTBOUND BUTLER', bg: 'frost-crystal', title: 'frost-lattice', graph: 'ice-label', num: 'crystal', button: 'snow-cap', icon: 'snowflake-bowtie', anim: 'frost-drift', reduced: 'static-frost' },
] as const;

export const STYLE_PAGE_RECIPES: readonly PageRecipe[] = styles.flatMap(style => pages.map(pageId => ({
  styleId: style.id,
  pageId,
  eyebrow: `${style.prefix} · LOCAL-FIRST`,
  title: pageId === 'home' ? 'BUTLER AI PC AUTOMATION' : pageId.toUpperCase(),
  subtitle: pageId === 'chat' ? 'PRIVATE OLLAMA · STREAMING · SAFE FALLBACK' : pageId === 'scripts' ? 'TRUST REHEARSAL · LIBRARY · UNDO' : pageId === 'knowledge' ? 'CRAWL · MEMORY · GRAPH' : pageId === 'monitor' ? 'CPU · MEMORY · STORAGE' : pageId === 'settings' ? 'ONBOARDING · PRIVACY · POWER' : pageId === 'cosmetics' ? 'STYLES · BACKPACK · BUILD MODE' : pageId === 'tools' ? 'SCRIPT TRUST · MEMORY · AUDIT' : 'LOCAL SERVER · PRIVATE AUTOMATION',
  background: style.bg,
  titleTreatment: style.title,
  graphTitleTreatment: style.graph,
  numberTreatment: style.num,
  buttonTreatment: style.button,
  iconTreatment: style.icon,
  animation: style.anim,
  reducedMotion: style.reduced,
})));

export function pageRecipe(styleId: string, pageId: ButlerPageId): PageRecipe { return STYLE_PAGE_RECIPES.find(recipe => recipe.styleId === styleId && recipe.pageId === pageId) ?? STYLE_PAGE_RECIPES[0]; }
