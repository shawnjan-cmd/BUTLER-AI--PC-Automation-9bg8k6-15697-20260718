import type { StylePreset } from '@/services/cosmeticVariantRegistry';

export type StyleChatRecipe = {
  styleId: StylePreset['id'];
  title: string;
  titleMark: string;
  fontProfile: 'mono' | 'tech' | 'clean';
  chatBackdrop: 'command-grid' | 'phosphor-scan' | 'ember-forge' | 'hologram-orbit' | 'titanium-mesh' | 'aqua-current' | 'aurora-ribbon' | 'frost-crystal';
  mascotTalkingPose: 'greeting' | 'focused' | 'celebration' | 'idle';
  bubbleShape: 'bracket' | 'terminal' | 'capsule' | 'orbital' | 'square';
  bubbleSound: 'none' | 'scan-blip' | 'ember-pulse' | 'hologram-chime' | 'metal-tap' | 'water-drop' | 'aurora-bell' | 'frost-chime';
  unreadTreatment: 'cyan-beacon' | 'green-cursor' | 'ember-spark' | 'prism-ping' | 'steel-dot' | 'aqua-ripple' | 'aurora-star' | 'frost-spark';
  entryTransition: string;
  performance: 'light' | 'standard' | 'enhanced';
};

export const STYLE_CHAT_RECIPES: readonly StyleChatRecipe[] = [
  { styleId: 'butler-core', title: 'BUTLER AI · PC AUTOMATION', titleMark: '⌘', fontProfile: 'mono', chatBackdrop: 'command-grid', mascotTalkingPose: 'greeting', bubbleShape: 'bracket', bubbleSound: 'none', unreadTreatment: 'cyan-beacon', entryTransition: 'circuit-sweep', performance: 'light' },
  { styleId: 'terminal-forge', title: 'TERMINAL FORGE // BUTLER', titleMark: '>', fontProfile: 'mono', chatBackdrop: 'phosphor-scan', mascotTalkingPose: 'focused', bubbleShape: 'terminal', bubbleSound: 'scan-blip', unreadTreatment: 'green-cursor', entryTransition: 'terminal-cursor', performance: 'light' },
  { styleId: 'ember-dragon', title: 'EMBER DRAGON // SAFE RUN', titleMark: '◆', fontProfile: 'tech', chatBackdrop: 'ember-forge', mascotTalkingPose: 'celebration', bubbleShape: 'capsule', bubbleSound: 'ember-pulse', unreadTreatment: 'ember-spark', entryTransition: 'ember-bloom', performance: 'standard' },
  { styleId: 'hologram-relay', title: 'HOLOGRAM RELAY // LOCAL AI', titleMark: '◇', fontProfile: 'tech', chatBackdrop: 'hologram-orbit', mascotTalkingPose: 'greeting', bubbleShape: 'orbital', bubbleSound: 'hologram-chime', unreadTreatment: 'prism-ping', entryTransition: 'orbital-dock', performance: 'enhanced' },
  { styleId: 'titanium-guardian', title: 'TITANIUM GUARDIAN // TRUST', titleMark: '▣', fontProfile: 'clean', chatBackdrop: 'titanium-mesh', mascotTalkingPose: 'focused', bubbleShape: 'square', bubbleSound: 'metal-tap', unreadTreatment: 'steel-dot', entryTransition: 'titanium-lock', performance: 'light' },
  { styleId: 'aqua-tide', title: 'AQUA TIDE // QUIET RELAY', titleMark: '≈', fontProfile: 'clean', chatBackdrop: 'aqua-current', mascotTalkingPose: 'greeting', bubbleShape: 'capsule', bubbleSound: 'water-drop', unreadTreatment: 'aqua-ripple', entryTransition: 'quiet-breathe', performance: 'standard' },
  { styleId: 'aurora-veil', title: 'AURORA VEIL // KNOWLEDGE', titleMark: '✦', fontProfile: 'tech', chatBackdrop: 'aurora-ribbon', mascotTalkingPose: 'celebration', bubbleShape: 'orbital', bubbleSound: 'aurora-bell', unreadTreatment: 'aurora-star', entryTransition: 'prism-split', performance: 'standard' },
  { styleId: 'frostbound-butler', title: 'FROSTBOUND BUTLER // PRIVATE AUTOMATION', titleMark: '❄', fontProfile: 'clean', chatBackdrop: 'frost-crystal', mascotTalkingPose: 'greeting', bubbleShape: 'capsule', bubbleSound: 'frost-chime', unreadTreatment: 'frost-spark', entryTransition: 'ice-slide', performance: 'standard' },
];

export function styleChatRecipe(styleId: string): StyleChatRecipe { return STYLE_CHAT_RECIPES.find(recipe => recipe.styleId === styleId) ?? STYLE_CHAT_RECIPES[0]; }
