import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ButlerGraphVariantRenderer from '@/components/ui/ButlerGraphVariantRenderer';
import ButlerMascotMotion from '@/components/ui/ButlerMascotMotion';
import { PACK_THEMES, useCosmetic } from '@/contexts/CosmeticContext';
import { GRAPH_VARIANTS, STYLE_PRESETS, StylePreset } from '@/services/cosmeticVariantRegistry';
import { useSkin } from '@/hooks/useSkin';

type GalleryMode = 'STYLE' | 'MASCOT' | 'GRAPH';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const labelForEntitlement = (entitlement: string) => entitlement === 'free' ? 'INCLUDED' : entitlement === 'studio10' ? 'STUDIO' : 'ATELIER';

export default function ButlerBackpackGallery() {
  const skin = useSkin();
  const { activePackId, isUnlocked, startPreview, applyPack, updateExtras } = useCosmetic();
  const [mode, setMode] = useState<GalleryMode>('STYLE');
  const [styleId, setStyleId] = useState(STYLE_PRESETS[0].id);
  const [graphId, setGraphId] = useState(GRAPH_VARIANTS[0].id);

  const style = useMemo(() => STYLE_PRESETS.find(item => item.id === styleId) ?? STYLE_PRESETS[0], [styleId]);
  const graph = useMemo(() => GRAPH_VARIANTS.find(item => item.id === graphId) ?? GRAPH_VARIANTS[0], [graphId]);
  const theme = PACK_THEMES[style.themeId] ?? PACK_THEMES.butler;
  const allowed = isUnlocked(style.themeId);

  const previewStyle = (next: StylePreset) => {
    setStyleId(next.id);
    startPreview(next.themeId);
  };

  const applyStyle = () => {
    if (!allowed) return;
    applyPack(style.themeId);
    void updateExtras(style.extras);
  };

  return (
    <View style={[styles.root, { borderColor: `${skin.accent3}60`, backgroundColor: skin.panel }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { borderColor: `${skin.accent3}70`, backgroundColor: `${skin.accent3}12` }]}><MaterialCommunityIcons name="bag-personal-outline" size={21} color={skin.accent3} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: skin.accent3 }]}>VISUAL BACKPACK · INSPECT BEFORE APPLY</Text>
          <Text style={[styles.title, { color: skin.text }]}>SEE THE <Text style={{ color: skin.accent3 }}>DESIGN SYSTEM</Text></Text>
        </View>
        <Text style={[styles.counter, { color: skin.mid }]}>{STYLE_PRESETS.length} STYLES · {GRAPH_VARIANTS.length} GRAPHS</Text>
      </View>

      <View style={styles.modeRow}>{(['STYLE', 'MASCOT', 'GRAPH'] as GalleryMode[]).map(item => <Pressable key={item} onPress={() => setMode(item)} accessibilityRole="button" accessibilityLabel={`Show ${item.toLowerCase()} previews`} style={({ pressed }) => [styles.modeButton, { borderColor: mode === item ? skin.accent3 : `${skin.border}90`, backgroundColor: mode === item ? `${skin.accent3}18` : skin.bg, opacity: pressed ? 0.78 : 1 }]}><Text style={[styles.modeText, { color: mode === item ? skin.accent3 : skin.mid }]}>{item}</Text></Pressable>)}</View>

      {mode === 'STYLE' && <>
        <View style={styles.swatches}>{STYLE_PRESETS.map(item => {
          const itemTheme = PACK_THEMES[item.themeId] ?? theme;
          const selected = item.id === style.id;
          return <Pressable key={item.id} onPress={() => previewStyle(item)} accessibilityRole="button" accessibilityLabel={`Preview ${item.label}`} style={({ pressed }) => [styles.swatch, { borderColor: selected ? itemTheme.primary : `${skin.border}88`, backgroundColor: itemTheme.bg, opacity: pressed ? 0.8 : 1 }]}>
            <View style={[styles.swatchRail, { backgroundColor: itemTheme.primary }]} />
            <MaterialCommunityIcons name="palette-swatch-outline" size={18} color={itemTheme.primary} />
            <Text style={[styles.swatchLabel, { color: itemTheme.textHi }]} numberOfLines={1}>{item.label}</Text>
            <Text style={[styles.swatchTier, { color: itemTheme.primary }]}>{labelForEntitlement(item.entitlement)}</Text>
          </Pressable>;
        })}</View>
        <View style={[styles.inspector, { borderColor: `${theme.primary}65`, backgroundColor: theme.panel }]}>
          <View style={[styles.paletteRail, { backgroundColor: theme.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.inspectorLabel, { color: theme.primary }]}>{style.label} · {labelForEntitlement(style.entitlement)}</Text>
            <Text style={[styles.inspectorTitle, { color: theme.textHi }]}>{style.description}</Text>
            <View style={styles.tokenRow}><Token color={theme.primary} label="PRIMARY" /><Token color={theme.secondary} label="SECONDARY" /><Token color={theme.tertiary} label="TERTIARY" /></View>
            <Text style={[styles.note, { color: theme.textMid ?? skin.mid }]}>Preview is reversible. Applying preserves the verified-entitlement boundary and only changes presentation settings.</Text>
          </View>
          <Pressable onPress={applyStyle} disabled={!allowed} accessibilityRole="button" accessibilityLabel={`Apply ${style.label}`} style={({ pressed }) => [styles.apply, { borderColor: allowed ? theme.primary : `${skin.warn}88`, backgroundColor: allowed ? `${theme.primary}18` : `${skin.warn}0D`, opacity: pressed ? 0.8 : 1 }]}><Text style={[styles.applyText, { color: allowed ? theme.primary : skin.warn }]}>{allowed ? 'APPLY' : 'PREVIEW'}</Text></Pressable>
        </View>
      </>}

      {mode === 'MASCOT' && <View style={[styles.mascotStage, { borderColor: `${theme.primary}60`, backgroundColor: theme.bg }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inspectorLabel, { color: theme.primary }]}>{style.mascot.toUpperCase()} · REDUCED-MOTION SAFE</Text>
          <Text style={[styles.inspectorTitle, { color: theme.textHi }]}>MASCOT POSE PREVIEW</Text>
          <Text style={[styles.note, { color: theme.textMid ?? skin.mid }]}>Mascot motion is decorative, pauses outside the active surface, and never represents connection, execution, or a verified security state.</Text>
          <View style={styles.tagRow}><Tag text={style.tokens.toolbar.toUpperCase()} color={theme.primary} /><Tag text={style.tokens.font.toUpperCase()} color={theme.secondary} /><Tag text={style.tokens.corner.toUpperCase()} color={theme.tertiary} /></View>
        </View>
        <ButlerMascotMotion size={102} paused={false} />
      </View>}

      {mode === 'GRAPH' && <>
        <View style={styles.graphChoices}>{GRAPH_VARIANTS.slice(0, 12).map(item => <Pressable key={item.id} onPress={() => setGraphId(item.id)} accessibilityRole="button" accessibilityLabel={`Inspect ${item.label}`} style={[styles.graphChoice, { borderColor: graph.id === item.id ? skin.accent : `${skin.border}80`, backgroundColor: graph.id === item.id ? `${skin.accent}14` : skin.bg }]}><Text style={[styles.graphChoiceText, { color: graph.id === item.id ? skin.accent : skin.mid }]} numberOfLines={1}>{item.label}</Text></Pressable>)}</View>
        <View style={[styles.graphStage, { borderColor: `${skin.accent}55`, backgroundColor: `${skin.bg}DD` }]}>
          <View style={{ flex: 1 }}><Text style={[styles.inspectorLabel, { color: skin.accent }]}>{graph.family.toUpperCase()} · {labelForEntitlement(graph.entitlement)}</Text><Text style={[styles.inspectorTitle, { color: skin.text }]}>{graph.label}</Text><Text style={[styles.note, { color: skin.mid }]}>{graph.description} This preview deliberately remains empty until the paired local PC supplies real metrics.</Text></View>
          <ButlerGraphVariantRenderer variantId={graph.id} width={130} height={82} offlineLabel="NO LIVE DATA" />
        </View>
      </>}
    </View>
  );
}

function Token({ color, label }: { color: string; label: string }) {
  return <View style={styles.token}><View style={[styles.tokenDot, { backgroundColor: color }]} /><Text style={[styles.tokenText, { color }]}>{label}</Text></View>;
}

function Tag({ text, color }: { text: string; color: string }) {
  return <View style={[styles.tag, { borderColor: `${color}70`, backgroundColor: `${color}0D` }]}><Text style={[styles.tagText, { color }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 15, padding: 10, gap: 9 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  title: { fontFamily: MONO, fontSize: 12, fontWeight: '900', marginTop: 3 },
  counter: { maxWidth: 68, fontFamily: MONO, fontSize: 6, lineHeight: 9, textAlign: 'right' },
  modeRow: { flexDirection: 'row', gap: 6 },
  modeButton: { minHeight: 32, flex: 1, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: { width: '48.7%', minHeight: 62, borderRadius: 9, borderWidth: 1, padding: 8, gap: 4, overflow: 'hidden' },
  swatchRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  swatchLabel: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  swatchTier: { fontFamily: MONO, fontSize: 6.5, fontWeight: '900', letterSpacing: 0.7 },
  inspector: { minHeight: 118, borderRadius: 11, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
  paletteRail: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3 },
  inspectorLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  inspectorTitle: { fontFamily: MONO, fontSize: 9, fontWeight: '900', marginTop: 4, lineHeight: 13 },
  note: { fontFamily: MONO, fontSize: 7, lineHeight: 10, marginTop: 5 },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  token: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  tokenDot: { width: 7, height: 7, borderRadius: 3.5 },
  tokenText: { fontFamily: MONO, fontSize: 6.2, fontWeight: '900' },
  apply: { minWidth: 56, minHeight: 38, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  mascotStage: { minHeight: 144, borderRadius: 11, borderWidth: 1, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  tag: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  tagText: { fontFamily: MONO, fontSize: 6, fontWeight: '900' },
  graphChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  graphChoice: { width: '31.9%', minHeight: 28, borderWidth: 1, borderRadius: 7, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  graphChoiceText: { fontFamily: MONO, fontSize: 6.5, fontWeight: '900', textAlign: 'center' },
  graphStage: { minHeight: 108, borderRadius: 10, borderWidth: 1, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
