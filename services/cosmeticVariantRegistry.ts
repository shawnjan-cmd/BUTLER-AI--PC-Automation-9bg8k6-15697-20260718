import { AppTheme, PackExtras } from '@/contexts/CosmeticContext';

export type CosmeticEntitlement = 'free' | 'studio10' | 'atelier20' | 'remoteConnection';
export type GraphFamily = 'trace' | 'area' | 'bar' | 'radial' | 'terminal' | 'timeline' | 'heat' | 'node-link' | 'gauge' | 'sparkline';
export type GraphVariant = {
  id: string; label: string; family: GraphFamily; description: string;
  entitlement: CosmeticEntitlement; performance: 'light' | 'standard' | 'enhanced';
  props: Record<string, string | number | boolean>;
};
export type InventorySection = 'styles' | 'headers' | 'headers-non-homepage' | 'homepage-header' | 'toolbars' | 'icons' | 'fonts' | 'buttons' | 'chat' | 'ai-chat-box' | 'bubbles' | 'mascots' | 'graphs' | 'graph-titles' | 'number-displays' | 'page-backgrounds' | 'accessibility' | 'bubbles' | 'mascots' | 'animations' | 'transitions' | 'loading-pages' | 'tip-bubbles' | 'rotating-tips' | 'script-icons' | 'haptics' | 'sounds' | 'shapes' | 'media' | 'shortcuts' | 'grid' | 'builder';
export type InventoryItem = { id: string; section: InventorySection; label: string; description: string; entitlement: CosmeticEntitlement; performance: 'light' | 'standard' | 'enhanced'; preview: string; patch?: Record<string, unknown> };
export type StylePreset = { id: string; label: string; description: string; entitlement: CosmeticEntitlement; themeId: string; extras: Partial<PackExtras>; tokens: { corner: 'square' | 'clipped' | 'rounded' | 'orbital'; grid: string; glow: 'none' | 'soft' | 'strong' | 'heat'; font: 'mono' | 'tech' | 'clean'; toolbar: 'command' | 'terminal' | 'dock' | 'orbital' | 'guardian' }; mascot: string };

export const STYLE_PRESETS: readonly StylePreset[] = [
  { id: 'butler-core', label: 'BUTLER CORE', description: 'Professional cyan-blue command grid with violet sweep.', entitlement: 'free', themeId: 'butler', extras: { mascot: 'bowtie', headerStyle: 'bracket', motionProfile: 'calm', fontProfile: 'mono', bubbleShape: 'bracket' }, tokens: { corner: 'clipped', grid: '#4A9EFF', glow: 'soft', font: 'mono', toolbar: 'command' }, mascot: 'bowtie-butler' },
  { id: 'terminal-forge', label: 'TERMINAL FORGE', description: 'Green phosphor operator console with scanline telemetry.', entitlement: 'studio10', themeId: 'matrix', extras: { mascot: 'terminal', headerStyle: 'terminal', motionProfile: 'terminal', fontProfile: 'mono', bubbleShape: 'terminal', typingStyle: 'scan' }, tokens: { corner: 'square', grid: '#2FE38A', glow: 'soft', font: 'mono', toolbar: 'terminal' }, mascot: 'terminal-butler' },
  { id: 'ember-dragon', label: 'EMBER DRAGON', description: 'Fire-red Atelier system with ember accents and heat-safe motion.', entitlement: 'atelier20', themeId: 'phantom', extras: { mascot: 'guardian', headerStyle: 'halo', motionProfile: 'neon', fontProfile: 'tech', bubbleShape: 'capsule', sendEffect: 'pulse' }, tokens: { corner: 'clipped', grid: '#FF4D5E', glow: 'heat', font: 'tech', toolbar: 'dock' }, mascot: 'robot-dragon-3d' },
  { id: 'hologram-relay', label: 'HOLOGRAM RELAY', description: 'Iridescent cyan-magenta projection interface with orbital traces.', entitlement: 'atelier20', themeId: 'hologram', extras: { mascot: 'orbital', headerStyle: 'scanline', motionProfile: 'orbital', fontProfile: 'tech', bubbleShape: 'orbital', chatShimmer: true }, tokens: { corner: 'orbital', grid: '#38D9E8', glow: 'strong', font: 'tech', toolbar: 'orbital' }, mascot: 'hologram-orbital' },
  { id: 'titanium-guardian', label: 'TITANIUM GUARDIAN', description: 'Steel security console with high contrast and low-motion defaults.', entitlement: 'studio10', themeId: 'titanium', extras: { mascot: 'guardian', headerStyle: 'bracket', motionProfile: 'calm', fontProfile: 'clean', bubbleShape: 'bracket', hapticProfile: 'silent' }, tokens: { corner: 'square', grid: '#9DAABE', glow: 'none', font: 'clean', toolbar: 'guardian' }, mascot: 'guardian-butler' },
  { id: 'aqua-tide', label: 'AQUA TIDE', description: 'Cool water-blue relay with calm wave motion and glass telemetry.', entitlement: 'atelier20', themeId: 'aurora', extras: { mascot: 'neon', headerStyle: 'halo', motionProfile: 'orbital', fontProfile: 'clean', bubbleShape: 'capsule', hapticProfile: 'soft', loadingVariant: 'neural' }, tokens: { corner: 'rounded', grid: '#27C7D8', glow: 'soft', font: 'clean', toolbar: 'orbital' }, mascot: 'aqua-leviathan' },
  { id: 'aurora-veil', label: 'AURORA VEIL', description: 'Northern-light cyan, violet, and green layered system with quiet shimmer.', entitlement: 'atelier20', themeId: 'sakura', extras: { mascot: 'neon', headerStyle: 'scanline', motionProfile: 'neon', fontProfile: 'tech', bubbleShape: 'orbital', hapticProfile: 'soft', loadingVariant: 'orbit', chatShimmer: true }, tokens: { corner: 'orbital', grid: '#6BE7B4', glow: 'strong', font: 'tech', toolbar: 'orbital' }, mascot: 'aurora-moth' },
  { id: 'frostbound-butler', label: 'FROSTBOUND BUTLER', description: 'Snow-lit private automation console with crystalline rails, quiet frost motion, and a Butler snowman guardian.', entitlement: 'atelier20', themeId: 'frostbound', extras: { mascot: 'snowman', headerStyle: 'crystal', motionProfile: 'frost', fontProfile: 'clean', bubbleShape: 'capsule', hapticProfile: 'soft', loadingVariant: 'frost', chatShimmer: true }, tokens: { corner: 'clipped', grid: '#B9F3FF', glow: 'soft', font: 'clean', toolbar: 'guardian' }, mascot: 'robot-snowman' },
];

const g = (id: string, label: string, family: GraphFamily, description: string, entitlement: CosmeticEntitlement = 'studio10', performance: GraphVariant['performance'] = 'light', props: GraphVariant['props'] = {}): GraphVariant => ({ id, label, family, description, entitlement, performance, props });

export const GRAPH_VARIANTS: readonly GraphVariant[] = [
  g('trace-cyan', 'Cyan Trace', 'trace', 'Thin electric trace with corner ticks.'),
  g('trace-violet', 'Violet Trace', 'trace', 'Soft violet trace with glow cap.', 'studio10', 'standard', { glow: true }),
  g('trace-terminal', 'Terminal Trace', 'trace', 'Monospaced trace with command ticks.', 'studio10', 'light', { grid: 'terminal' }),
  g('trace-dashed', 'Dashed Trace', 'trace', 'Dashed trace for sparse telemetry.', 'studio10', 'light', { dash: true }),
  g('area-glass', 'Glass Area', 'area', 'Low-opacity area under a clean trace.', 'studio10', 'standard', { opacity: 0.18 }),
  g('area-ember', 'Ember Area', 'area', 'Red-orange heat area with bounded shimmer.', 'atelier20', 'standard', { gradient: 'ember' }),
  g('area-stacked', 'Stacked Area', 'area', 'Multiple real series stacked in a compact card.', 'atelier20', 'standard', { stacked: true }),
  g('bars-command', 'Command Bars', 'bar', 'Vertical bars with clipped tops.', 'studio10'),
  g('bars-terminal', 'Terminal Bars', 'bar', 'Phosphor bars with prompt labels.', 'studio10', 'light', { grid: 'terminal' }),
  g('bars-stacked', 'Stacked Bars', 'bar', 'Stacked resource categories from real series.', 'atelier20', 'standard', { stacked: true }),
  g('bars-horizontal', 'Horizontal Load', 'bar', 'Horizontal bars for compact phone layouts.', 'studio10', 'light', { horizontal: true }),
  g('bars-waterfall', 'Waterfall Bars', 'bar', 'Sequential positive/negative deltas.', 'atelier20', 'standard', { waterfall: true }),
  g('radial-ring', 'Radial Ring', 'radial', 'Single real percentage ring with empty fallback.', 'studio10', 'standard', { rings: 1 }),
  g('radial-triple', 'Triple Rings', 'radial', 'CPU, memory, and disk rings in one card.', 'studio10', 'standard', { rings: 3 }),
  g('radial-orbit', 'Orbital Rings', 'radial', 'Orbiting ring accents with capped motion.', 'atelier20', 'enhanced', { rings: 3, orbit: true }),
  g('gauge-arc', 'Arc Gauge', 'gauge', 'Semicircle gauge with threshold bands.', 'studio10'),
  g('gauge-needle', 'Needle Gauge', 'gauge', 'Single needle over real host health.', 'atelier20', 'standard', { needle: true }),
  g('terminal-log', 'Terminal Log', 'terminal', 'Timestamped text trace for live server events.', 'studio10', 'light', { cursor: true }),
  g('terminal-prompt', 'Prompt Stream', 'terminal', 'Prompt-led event stream with severity colors.', 'atelier20', 'light', { prompt: '>' }),
  g('terminal-hex', 'Hex Telemetry', 'terminal', 'Compact hexadecimal-like labels around real values.', 'atelier20', 'light', { radix: 16 }),
  g('timeline-events', 'Event Timeline', 'timeline', 'Chronological activity rail with offline state.', 'studio10'),
  g('timeline-lanes', 'Lane Timeline', 'timeline', 'Multiple server event lanes.', 'atelier20', 'standard', { lanes: 3 }),
  g('heat-calendar', 'Heat Calendar', 'heat', 'Activity heat cells by real event date.', 'studio10', 'standard', { weeks: 12 }),
  g('heat-strip', 'Heat Strip', 'heat', 'Horizontal intensity strip for compact cards.', 'studio10', 'light', { cells: 24 }),
  g('heat-matrix', 'Heat Matrix', 'heat', 'Grid of real resource/error intensity.', 'atelier20', 'standard', { rows: 5, cols: 8 }),
  g('knowledge-node', 'Knowledge Node', 'node-link', 'Node-link knowledge graph using real relations.', 'atelier20', 'standard', { labels: true }),
  g('knowledge-radial', 'Knowledge Radial', 'node-link', 'Radial relation view for sparse knowledge data.', 'atelier20', 'enhanced', { radial: true }),
  g('sparkline-minimal', 'Minimal Sparkline', 'sparkline', 'Small trace for metric tiles.', 'studio10', 'light', { labels: false }),
  g('sparkline-glow', 'Glow Sparkline', 'sparkline', 'Glowing sparkline with end marker.', 'studio10', 'light', { marker: true, glow: true }),
  g('sparkline-ember', 'Ember Sparkline', 'sparkline', 'Fire-red sparkline reserved for Ember Dragon.', 'atelier20', 'light', { palette: 'ember', marker: true }),
  g('crawler-growth', 'Crawler Growth', 'trace', 'Crawler entities indexed over time from real server epochs.', 'studio10', 'light', { metric: 'crawler_entities' }),
  g('memory-admission', 'Memory Admission', 'area', 'Approved memory admissions by trust lane from real local/server records.', 'atelier20', 'standard', { metric: 'memory_admissions' }),
  g('knowledge-gain', 'Knowledge Gain', 'bar', 'Knowledge additions and relation growth from real accumulator receipts.', 'atelier20', 'standard', { metric: 'knowledge_gain' }),
];

export const UNIVERSAL_CREATURE_POSES = [
  ...(['butler-core', 'terminal-forge', 'ember-dragon', 'hologram-relay', 'titanium-guardian', 'aqua-tide', 'aurora-veil', 'frostbound-butler'] as const).flatMap(styleId => (['idle', 'greeting', 'focused', 'celebration', 'reduced-motion'] as const).map(pose => ({ styleId, pose, id: `${styleId}:${pose}`, label: `${styleId.replaceAll('-', ' ').toUpperCase()} ${pose.toUpperCase()}` }))),
] as const;

const item = (id: string, section: InventorySection, label: string, description: string, entitlement: CosmeticEntitlement, performance: InventoryItem['performance'] = 'light', patch: Record<string, unknown> = {}): InventoryItem => ({ id, section, label, description, entitlement, performance, preview: `${section}:${id}`, patch });

export const BACKPACK_INVENTORY: readonly InventoryItem[] = [
  ...STYLE_PRESETS.map(style => item(`style:${style.id}`, 'styles', style.label, style.description, style.entitlement, style.tokens.glow === 'strong' ? 'enhanced' : 'light', { styleId: style.id })),
  ...['bracket', 'scanline', 'halo', 'terminal', 'split-pane', 'telemetry'].map((id, i) => item(`header:${id}`, 'headers', id.replace('-', ' ').toUpperCase(), 'Reusable Butler header treatment.', i > 3 ? 'atelier20' : 'studio10', 'light', { headerStyle: id })),
  ...STYLE_PRESETS.map((style, i) => item(`homepage-header:${style.id}`, 'homepage-header', `${style.label} HOMEPAGE HEADER`, 'Medium Butler PC automation header with style-matched title, mascot, accent rail, and motion.', style.entitlement, i > 3 ? 'enhanced' : 'standard', { styleId: style.id, headerType: 'homepage' })),
  ...STYLE_PRESETS.map((style, i) => item(`header-non-homepage:${style.id}`, 'headers-non-homepage', `${style.label} PAGE HEADERS`, 'Style-complete headers for Scripts, Chat, Knowledge, Monitor, Cosmetics, and Settings.', style.entitlement, i > 3 ? 'enhanced' : 'standard', { styleId: style.id, headerType: 'non-homepage' })),
  ...['command', 'terminal', 'dock', 'orbital', 'guardian', 'compact-grid'].map((id, i) => item(`toolbar:${id}`, 'toolbars', id.toUpperCase(), 'Complete toolbar icon and spacing preset.', i > 4 ? 'atelier20' : 'studio10', 'light', { toolbar: id })),
  ...['button-bowtie', 'command-seal', 'script-shield', 'crawler-lens', 'memory-lock', 'knowledge-link', 'server-pulse', 'ollama-orb', 'safe-run', 'folder-gear', 'clipboard-bridge', 'network-lantern', 'remote-key', 'graph-node', 'terminal-prompt', 'firewall-flame', 'aqua-wave', 'aurora-spark', 'titanium-plate', 'hologram-prism', 'snowflake-bowtie', 'frost-lock', 'ice-lantern', 'crystal-node'].map((id, i) => item(`icon:${id}`, 'icons', id.replaceAll('-', ' ').toUpperCase(), 'Butler-native automation icon with static and reduced-motion fallback.', i > 11 ? 'atelier20' : 'studio10', i > 15 ? 'standard' : 'light', { icon: id })),
  ...['mono', 'tech', 'clean', 'terminal-pixel', 'display-wide', 'accessible-large'].map((id, i) => item(`font:${id}`, 'fonts', id.toUpperCase(), 'Typography profile with readable fallback.', i > 3 ? 'atelier20' : 'studio10', 'light', { font: id })),
  ...['outline', 'filled', 'glow', 'bracket', 'hex', 'ember'].map((id, i) => item(`button:${id}`, 'buttons', id.toUpperCase(), 'Button geometry, border, press, and disabled-state preset.', i > 4 ? 'atelier20' : 'studio10', 'light', { button: id })),
  ...['soft', 'bracket', 'capsule', 'terminal', 'orbital', 'ember-heat'].map((id, i) => item(`bubble:${id}`, 'bubbles', id.toUpperCase(), 'Chat bubble shape and receipt treatment.', i > 4 ? 'atelier20' : 'studio10', 'light', { bubble: id })),
  ...STYLE_PRESETS.map((style, i) => item(`ai-chat-box:${style.id}`, 'ai-chat-box', `${style.label} AI CHAT BOX`, 'Compact Butler chat input treatment with style-matched prompt glyph, send state, haptic, and safe offline fallback.', style.entitlement, i > 3 ? 'enhanced' : 'standard', { styleId: style.id, chatBox: style.id })),
  ...['bowtie', 'atelier', 'guardian', 'neon', 'terminal', 'orbital', 'robot-dragon-3d', 'dragon-crest', 'dragon-wing-guard', 'dragon-gold-scout', 'butler-operator-lean', 'butler-salute', 'butler-orbital-hover', 'butler-forge-smile'].map((id, i) => item(`mascot:${id}`, 'mascots', id.replaceAll('-', ' ').toUpperCase(), 'Mascot identity and compact header pose with reduced-motion fallback.', i > 5 ? 'atelier20' : 'studio10', i > 5 ? 'enhanced' : 'standard', { mascot: id })),
  ...UNIVERSAL_CREATURE_POSES.map((pose, i) => item(`mascot-pose:${pose.id}`, 'mascots', pose.label, 'Original Butler creature pose with style-matched reduced-motion fallback.', pose.styleId === 'butler-core' ? 'free' : pose.styleId === 'terminal-forge' || pose.styleId === 'titanium-guardian' ? 'studio10' : 'atelier20', pose.pose === 'celebration' ? 'enhanced' : 'standard', { mascotStyle: pose.styleId, mascotPose: pose.pose })),
  ...['boot-rail', 'orbit-core', 'scanline-guard', 'neural-weave', 'atelier-reveal', 'aqua-bubble', 'dragon-forge', 'aurora-drift'].map((id, i) => item(`loading:${id}`, 'loading-pages', id.replaceAll('-', ' ').toUpperCase(), 'High-resolution loading composition with low-cost fallback.', i > 4 ? 'atelier20' : 'studio10', i > 5 ? 'enhanced' : 'standard', { loading: id })),
  ...['first-run-welcome', 'snap-grid-tip', 'backpack-tip', 'privacy-first', 'server-lock', 'ollama-local', 'script-safe', 'offline-ready', 'reduced-motion'].map((id, i) => item(`tip:${id}`, 'tip-bubbles', id.replaceAll('-', ' ').toUpperCase(), 'Short contextual tip bubble with dismiss and persistence.', i > 4 ? 'atelier20' : 'studio10', 'light', { tip: id })),
  ...['golden-hour', 'one-minute-build', 'real-data-only', 'server-first', 'protect-the-core', 'try-snap', 'preview-before-apply', 'quiet-mode'].map((id, i) => item(`rotating-tip:${id}`, 'rotating-tips', id.replaceAll('-', ' ').toUpperCase(), 'Short rotating Butler automation tip with deterministic local rotation and dismiss state.', i > 4 ? 'atelier20' : 'studio10', 'light', { rotatingTip: id })),
  ...['python-file', 'terminal-command', 'safe-script', 'server-sync', 'crawler-index', 'memory-seal', 'knowledge-node', 'graph-trace', 'folder-watch', 'network-lock', 'ollama-model', 'script-draft'].map((id, i) => item(`script-icon:${id}`, 'script-icons', id.replaceAll('-', ' ').toUpperCase(), 'Animated Butler script-library icon with static fallback.', i > 5 ? 'atelier20' : 'studio10', i > 8 ? 'standard' : 'light', { scriptIcon: id })),
  ...['none', 'soft-glow', 'scan', 'pulse', 'orbit', 'heat-shimmer', 'particle-burst', 'ember-breathe', 'ember-rise', 'terminal-cursor', 'robot-scan', 'dragon-wingbeat', 'gold-spark', 'hologram-sweep', 'frost-drift', 'snowfall-pulse', 'crystal-breathe'].map((id, i) => item(`animation:${id}`, 'animations', id.replaceAll('-', ' ').toUpperCase(), 'Motion profile with reduced-motion fallback and bounded frame budget.', i > 5 ? 'atelier20' : 'studio10', i > 5 ? 'enhanced' : 'light', { animation: id })),
  ...['circuit-sweep', 'ember-bloom', 'terminal-cursor', 'orbital-dock', 'golden-seal', 'titanium-lock', 'violet-fold', 'scanline-drop', 'dragon-wing', 'prism-split', 'knowledge-thread', 'quiet-breathe', 'ice-slide', 'frost-fold'].map((id, i) => item(`transition:${id}`, 'transitions', id.replaceAll('-', ' ').toUpperCase(), 'Selectable page and component transition with reduced-motion fallback.', i > 4 ? 'atelier20' : 'studio10', i === 3 || i === 9 ? 'enhanced' : 'light', { transition: id })),
  ...['soft', 'crisp', 'heavy', 'silent'].map((id, i) => item(`haptic:${id}`, 'haptics', id.toUpperCase(), 'Tap and confirmation haptic profile.', i > 1 ? 'atelier20' : 'studio10', 'light', { haptic: id })),
  ...['none', 'chime', 'pulse', 'blip', 'synth', 'ember-alarm', 'frost-chime', 'snow-tick'].map((id, i) => item(`sound:${id}`, 'sounds', id.toUpperCase(), 'Optional low-volume local sound profile.', i > 4 ? 'atelier20' : 'studio10', 'light', { sound: id })),
  ...['card', 'pill', 'circle', 'hex', 'diamond', 'frame', 'blob', 'clipped-terminal', 'ember-claw', 'dragon-scale', 'terminal-bracket', 'gold-seal', 'orbital-ring', 'ice-crystal', 'snow-cap', 'frost-frame'].map((id, i) => item(`shape:${id}`, 'shapes', id.replaceAll('-', ' ').toUpperCase(), 'Composable block geometry with line and radius tokens.', i > 6 ? 'atelier20' : 'studio10', 'light', { shape: id })),
  ...GRAPH_VARIANTS.map(graph => item(`graph:${graph.id}`, 'graphs', graph.label, graph.description, graph.entitlement, graph.performance, { graphId: graph.id })),
  ...STYLE_PRESETS.map((style, i) => item(`graph-title:${style.id}`, 'graph-titles', `${style.label} GRAPH TITLES`, 'Style-specific graph title lettering, metric label, axis, and empty-state treatment.', style.entitlement, i > 3 ? 'enhanced' : 'standard', { styleId: style.id })),
  ...STYLE_PRESETS.map((style, i) => item(`number-display:${style.id}`, 'number-displays', `${style.label} NUMBER DISPLAY`, 'Style-specific live metric numerals with real-data and offline states.', style.entitlement, i > 3 ? 'enhanced' : 'standard', { styleId: style.id })),
  ...STYLE_PRESETS.map((style, i) => item(`page-background:${style.id}`, 'page-backgrounds', `${style.label} PAGE BACKGROUND`, 'Style-specific low-cost Butler background geometry with reduced-motion fallback.', style.entitlement, i > 3 ? 'enhanced' : 'standard', { styleId: style.id })),
  ...STYLE_PRESETS.map((style, i) => item(`accessibility:${style.id}`, 'accessibility', `${style.label} ACCESSIBLE MODE`, 'High-contrast, large-text, reduced-motion, and haptic-safe variant for this style.', style.entitlement, 'light', { styleId: style.id, accessibility: true })),
  ...['local-image', 'local-svg', 'hero-banner', 'media-frame', 'mascot-card'].map((id, i) => item(`media:${id}`, 'media', id.replace('-', ' ').toUpperCase(), 'Validated local-only media building block.', i > 3 ? 'atelier20' : 'studio10', 'light', { media: id })),
  ...['page-shortcut', 'script-shortcut', 'server-action-shortcut'].map((id, i) => item(`shortcut:${id}`, 'shortcuts', id.replace('-', ' ').toUpperCase(), 'Allowlisted declarative shortcut; never auto-launches scripts.', i === 0 ? 'studio10' : 'atelier20', 'light', { shortcut: id })),
  ...['4', '8', '12', '16', '24'].map((id, i) => item(`grid:${id}`, 'grid', `${id}px GRID`, 'Snap grid spacing and visible guide color.', i > 3 ? 'atelier20' : 'studio10', 'light', { gridSize: Number(id) })),
  item('builder:custom-component', 'builder', 'BUILD YOUR OWN COMPONENT', 'Start a guided custom block: choose shape, size, color, line weight, icon, motion, and safe placement.', 'atelier20', 'standard', { builder: 'custom-component' }),
];

export const GRAPH_VARIANT_COUNT = GRAPH_VARIANTS.length;
export const INVENTORY_SECTION_ORDER: readonly InventorySection[] = ['styles', 'headers', 'headers-non-homepage', 'homepage-header', 'toolbars', 'icons', 'fonts', 'buttons', 'chat', 'ai-chat-box', 'bubbles', 'mascots', 'graphs', 'graph-titles', 'number-displays', 'page-backgrounds', 'accessibility', 'animations', 'transitions', 'loading-pages', 'tip-bubbles', 'rotating-tips', 'script-icons', 'haptics', 'sounds', 'shapes', 'media', 'shortcuts', 'grid', 'builder'];

export function variantsForSection(section: InventorySection): readonly InventoryItem[] { return BACKPACK_INVENTORY.filter(item => item.section === section); }
export function graphVariant(id: string): GraphVariant | undefined { return GRAPH_VARIANTS.find(variant => variant.id === id); }
export function stylePreset(id: string): StylePreset | undefined { return STYLE_PRESETS.find(style => style.id === id); }
export function entitlementAllows(required: CosmeticEntitlement, verified: ReadonlySet<string>, reviewUnlocked = false): boolean {
  if (required === 'free') return true;
  if (required === 'studio10') return verified.has('butler_cosmetics_studio_10') || verified.has('butler_cosmetics_atelier_20');
  if (required === 'atelier20') return verified.has('butler_cosmetics_atelier_20');
  if (required === 'remoteConnection') return verified.has('butler_remote_connection');
  return reviewUnlocked;
}

export const INVENTORY_LICENSE_NOTES = {
  adaptedLibraries: ['react-native-reanimated', 'react-native-svg-charts', 'react-native-chart-kit', 'react-native-gifted-charts'],
  license: 'MIT references only; retain notices when code is copied. Registry records are Butler-original metadata and do not include third-party source code.',
  sourceManifest: 'GRAPH_AND_ANIMATION_RESEARCH.md',
} as const;

export type CosmeticThemePatch = Partial<Pick<AppTheme, 'primary' | 'secondary' | 'tertiary' | 'bg' | 'panel' | 'textAccent' | 'glowColor' | 'borderColor'>>;
