import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useRouter } from 'expo-router';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { useCosmetic } from '@/contexts/CosmeticContext';
import {
  COMPONENT_INVENTORY, DEFAULT_LAYOUT, LayoutEditorState, moveComponent,
  addComponent, alignComponent, nudgeComponent, removeComponent, resizeComponent, setComponentIcon, setComponentShape, setComponentShortcut, setComponentVisible, setGraphStyle, setUniversalSize, updateComponentStyle, updateVisuals, updateEditorPreferences,
} from '@/services/layoutCustomization';
import { useSkin } from '@/hooks/useSkin';
import ButlerMediaBlockEditor from '@/components/ui/ButlerMediaBlockEditor';
import ButlerCanvasControls from '@/components/ui/ButlerCanvasControls';
import ButlerCanvasPreview from '@/components/ui/ButlerCanvasPreview';
import ButlerShortcutBlockEditor from '@/components/ui/ButlerShortcutBlockEditor';
import ButlerPageTokenControls from '@/components/ui/ButlerPageTokenControls';
import ButlerBuildModeGuide from '@/components/ui/ButlerBuildModeGuide';
import { ButlerPageId, PageLayoutState, loadPageLayoutState, savePageLayoutState, updatePageTokens } from '@/services/pageLayoutCustomization';

const ATELIER_PRODUCT_ID = 'butler_cosmetics_atelier_20';

export const ButlerBuildModePanel = memo(function ButlerBuildModePanel({ pageId = 'cosmetics' }: { pageId?: ButlerPageId }) {
  const skin = useSkin();
  const router = useRouter();
  const { verifiedProductIds } = useCosmetic();
  const [state, setState] = useState<PageLayoutState>({ ...DEFAULT_LAYOUT, pageId, gridVisible: true, gridSize: 8, gridColor: '#6DE7F2', snapMode: 'snap', tokens: { accent: '#6DE7F2', accent2: '#A468FF', accent3: '#FF4D9A', surfaceOpacity: 0.92, borderOpacity: 0.55, lineThickness: 2, radius: 16, spacing: 12, scale: 'regular', density: 'regular', effect: 'soft-glow', headerStyle: 'bracket', headerHeight: 'regular', reducedMotion: false }, headerProtected: true });
  const [history, setHistory] = useState<PageLayoutState[]>([]);
  const [future, setFuture] = useState<PageLayoutState[]>([]);
  const [loaded, setLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(0.84)).current;
  const entitled = verifiedProductIds.has(ATELIER_PRODUCT_ID);
  const pageOrder: ButlerPageId[] = ['home', 'scripts', 'chat', 'knowledge', 'monitor', 'cosmetics', 'settings'];
  const movePage = (delta: -1 | 1) => { const index = pageOrder.indexOf(pageId); const next = pageOrder[(index + delta + pageOrder.length) % pageOrder.length]; router.push(`/(tabs)/${next}` as never); };
  const visible = useMemo(() => [...state.components].sort((a, b) => a.order - b.order), [state.components]);
  const available = useMemo(() => COMPONENT_INVENTORY.filter(item => !state.components.some(existing => existing.id === item.id)), [state.components]);

  useEffect(() => { loadPageLayoutState(pageId).then(next => { setState(next); setLoaded(true); }).catch(() => setLoaded(true)); }, [pageId]);
  useEffect(() => {
    if (!state.editMode) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.84, duration: 850, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [pulse, state.editMode]);

  const commit = useCallback((next: LayoutEditorState) => {
    setHistory(previous => [...previous.slice(-19), state]);
    setFuture([]);
    setState({ ...state, ...next, pageId, tokens: state.tokens, headerProtected: true });
    haptics.light();
  }, [pageId, state]);

  const toggleEdit = useCallback(() => {
    if (!entitled) { haptics.warning(); return; }
    setState(previous => ({ ...previous, editMode: !previous.editMode }));
    haptics.medium();
  }, [entitled]);

  const undo = useCallback(() => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture(next => [state, ...next].slice(0, 20));
    setHistory(next => next.slice(0, -1));
    setState(previous);
    haptics.light();
  }, [history, state]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setHistory(previous => [...previous, state].slice(-20));
    setFuture(previous => previous.slice(1));
    setState(next);
    haptics.light();
  }, [future, state]);

  const save = useCallback(async () => {
    await savePageLayoutState({ ...state, pageId, editMode: false });
    setState(previous => ({ ...previous, editMode: false }));
    haptics.success();
  }, [pageId, state]);

  const reset = useCallback(() => { commit({ ...DEFAULT_LAYOUT, visuals: { ...DEFAULT_LAYOUT.visuals } }); haptics.warning(); }, [commit]);
  if (!loaded) return null;

  return (
    <View style={[styles.root, { borderColor: `${skin.accent}55`, backgroundColor: skin.panel }]}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Animated.View style={{ opacity: state.editMode ? pulse : 1 }}>
            <MaterialCommunityIcons name={state.editMode ? 'hammer-wrench' : 'tune-variant'} size={22} color={state.editMode ? skin.warn : skin.accent} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: skin.accent }]}>ATELIER CUSTOMIZATION STUDIO</Text>
            <Text style={[styles.title, { color: skin.text }]}>{state.editMode ? 'BUILD MODE · LIVE LAYOUT FROZEN' : 'MAKE BUTLER YOURS'}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={entitled ? (state.editMode ? 'Exit Build Mode' : 'Enter Build Mode') : 'Build Mode requires Atelier'} onPress={toggleEdit} style={[styles.modeButton, { borderColor: entitled ? skin.accent : skin.mid, backgroundColor: entitled ? `${skin.accent}18` : `${skin.mid}12` }]}>
          <MaterialCommunityIcons name={entitled ? (state.editMode ? 'lock-open-variant' : 'lock-outline') : 'lock'} size={18} color={entitled ? skin.accent : skin.mid} />
          <Text style={[styles.modeText, { color: entitled ? skin.accent : skin.mid }]}>{entitled ? (state.editMode ? 'EXIT' : 'BUILD') : '$20'}</Text>
        </TouchableOpacity>
      </View>

      {!entitled && <Text style={[styles.notice, { color: skin.mid }]}>Build Mode unlocks with a verified Butler Atelier entitlement. Preview controls remain available without a purchase; no local tap can fake an unlock.</Text>}
      {state.editMode && <View style={[styles.banner, { borderColor: skin.warn, backgroundColor: `${skin.warn}20` }]}><MaterialCommunityIcons name="alert-decagram" size={18} color={skin.warn} /><Text style={[styles.bannerText, { color: skin.warn }]}>BUILD MODE ON · LIVE METRICS AND AUTOMATION ARE FROZEN · CORE COMPONENTS ARE PROTECTED</Text></View>}

      {state.editMode && <ButlerPageTokenControls state={state} onChange={patch => commit(updatePageTokens(state, patch))} />}
      {state.editMode && <ButlerBuildModeGuide state={state} onPrevious={() => movePage(-1)} onNext={() => movePage(1)} onGrid={() => commit(updateEditorPreferences(state, { gridVisible: !state.gridVisible }))} onSnap={() => commit(updateEditorPreferences(state, { snapMode: state.snapMode === 'snap' ? 'free' : 'snap' }))} onGridSize={() => commit(updateEditorPreferences(state, { gridSize: ({ 4: 8, 8: 12, 12: 16, 16: 24, 24: 4 } as const)[state.gridSize] }))} onUndo={undo} onRedo={redo} onReset={reset} onSave={() => void save()} canUndo={!!history.length} canRedo={!!future.length} />}
      {state.editMode && <ButlerCanvasPreview components={visible} gridVisible={state.gridVisible} gridSize={state.gridSize} gridColor={state.gridColor} snapMode={state.snapMode} />}

      {state.editMode && <View style={styles.quickAdd}><Action icon="plus-circle" label="ADD BLOCK" color={skin.ok} onPress={() => { const missing = available[0]; if (missing) commit(addComponent(state, missing.id)); }} /><Text style={[styles.quickAddHint, { color: skin.mid }]}>Choose a block from the inventory below. Every insert starts at a safe default size and position; resize, nudge, or align it before saving.</Text></View>}

      {state.editMode && <View style={styles.inventory}>
        <Text style={[styles.section, { color: skin.mid }]}>COMPONENT INVENTORY · {visible.length} LOADED</Text>
        {available.length > 0 && <View style={styles.catalog}><Text style={[styles.catalogTitle, { color: skin.accent }]}>UNIVERSAL BUILDING BLOCKS · TAP TO ADD</Text><View style={styles.catalogRow}>{available.map(item => <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Add ${item.label}`} onPress={() => commit(addComponent(state, item.id))} style={[styles.catalogButton, { borderColor: `${skin.ok}70`, backgroundColor: `${skin.ok}12` }]}><MaterialCommunityIcons name={item.kind === 'hero' || item.kind === 'image' ? 'image-plus' : item.kind === 'separator' ? 'minus' : 'view-grid-plus-outline'} size={16} color={skin.ok} /><Text style={[styles.catalogText, { color: skin.ok }]}>{item.label}</Text></TouchableOpacity>)}</View></View>}
        {visible.map((item, index) => <React.Fragment key={item.id}><View style={[styles.item, { borderColor: item.protected ? `${skin.accent}55` : `${skin.mid}28`, backgroundColor: item.protected ? `${skin.accent}10` : `${skin.bg}99` }]}>
          <MaterialCommunityIcons name={item.protected ? 'shield-lock-outline' : 'view-dashboard-outline'} size={18} color={item.protected ? skin.accent : skin.mid} />
          <View style={{ flex: 1 }}><Text style={[styles.itemLabel, { color: skin.text }]}>{item.label}</Text><Text style={[styles.itemMeta, { color: skin.mid }]}>{item.protected ? 'PROTECTED CORE' : `${item.kind.toUpperCase()} · ${item.graphStyle ?? 'VISUAL'}`}</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move ${item.label} up`} disabled={index === 0 || item.protected} onPress={() => commit(moveComponent(state, item.id, -1))} style={styles.smallButton}><MaterialCommunityIcons name="chevron-up" size={18} color={index === 0 || item.protected ? skin.mid : skin.accent} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move ${item.label} down`} disabled={index === visible.length - 1 || item.protected} onPress={() => commit(moveComponent(state, item.id, 1))} style={styles.smallButton}><MaterialCommunityIcons name="chevron-down" size={18} color={index === visible.length - 1 || item.protected ? skin.mid : skin.accent} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${item.visible ? 'Hide' : 'Show'} ${item.label}`} disabled={item.protected} onPress={() => commit(setComponentVisible(state, item.id, !item.visible))} style={styles.smallButton}><MaterialCommunityIcons name={item.visible ? 'eye-outline' : 'eye-off-outline'} size={18} color={item.protected ? skin.mid : skin.ok} /></TouchableOpacity>
          {!item.protected && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Change line thickness for ${item.label}`} onPress={() => commit(updateComponentStyle(state, item.id, { lineThickness: (((item.lineThickness ?? 1) % 4) + 1) as 1 | 2 | 3 | 4 }))} style={styles.thicknessButton}><Text style={[styles.thicknessText, { color: skin.accent }]}>{item.lineThickness ?? 1}px</Text></TouchableOpacity>}
        </View>{(item.kind === 'image' || item.kind === 'hero') && <ButlerMediaBlockEditor component={item} onChange={patch => commit(updateComponentStyle(state, item.id, patch))} />}<ButlerCanvasControls component={item} onNudge={(dx, dy) => commit(nudgeComponent(state, item.id, dx, dy))} onResize={(dw, dh) => commit(resizeComponent(state, item.id, dw, dh))} onAlign={anchor => commit(alignComponent(state, item.id, anchor))} onShape={shape => commit(setComponentShape(state, item.id, shape))} onIcon={icon => commit(setComponentIcon(state, item.id, icon))} onSize={size => commit(setUniversalSize(state, item.id, size))} />{item.id === 'shortcut-tile' && <ButlerShortcutBlockEditor component={item} onChange={shortcut => commit(setComponentShortcut(state, item.id, shortcut))} />}</React.Fragment>)}
      </View>}

      {!state.editMode && <Text style={[styles.footer, { color: skin.mid }]}>Atelier Build Mode is reversible. Core chat, script library, and headers cannot be removed. Every layout change is local, persisted, and recoverable.</Text>}
      {state.editMode && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save layout and exit Build Mode" onPress={() => void save()} style={[styles.saveDock, { borderColor: `${skin.ok}90`, backgroundColor: `${skin.bg}E8` }]}><MaterialCommunityIcons name="content-save-check" size={20} color={skin.ok} /><Text style={[styles.saveDockText, { color: skin.ok }]}>SAVE & EXIT BUILD MODE</Text></TouchableOpacity>}
    </View>
  );
});

function Action({ icon, label, color, onPress, disabled = false }: { icon: string; label: string; color: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.action, { borderColor: disabled ? `${color}30` : `${color}90`, backgroundColor: disabled ? `${color}08` : `${color}18`, opacity: disabled ? 0.45 : 1 }]}><MaterialCommunityIcons name={icon as any} size={22} color={color} /><Text style={[styles.actionText, { color }]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { marginHorizontal: 12, marginVertical: 10, borderWidth: 1.5, borderRadius: 16, padding: 12, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: { fontFamily: 'monospace', fontSize: 8, letterSpacing: 1.4, fontWeight: '900' },
  title: { fontFamily: 'monospace', fontSize: 14, letterSpacing: 1.2, fontWeight: '900', marginTop: 3 },
  modeButton: { minHeight: 46, minWidth: 72, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  modeText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  notice: { fontFamily: 'monospace', fontSize: 9, lineHeight: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderRadius: 10, padding: 10 },
  bannerText: { flex: 1, fontFamily: 'monospace', fontSize: 8, lineHeight: 12, fontWeight: '900', letterSpacing: 0.8 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickAdd: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#6DE7F220', borderRadius: 10, padding: 8 },
  quickAddHint: { flex: 1, fontFamily: 'monospace', fontSize: 7, lineHeight: 11 },
  action: { minWidth: 74, minHeight: 50, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  actionText: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  inventory: { gap: 7 },
  catalog: { borderWidth: 1, borderColor: '#6DE7F220', borderRadius: 10, padding: 8, gap: 7 },
  catalogTitle: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  catalogRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catalogButton: { minHeight: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  catalogText: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900', maxWidth: 100 },
  section: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  item: { minHeight: 52, borderWidth: 1, borderRadius: 10, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  itemLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '900' },
  itemMeta: { fontFamily: 'monospace', fontSize: 7, marginTop: 2, letterSpacing: 0.7 },
  smallButton: { minWidth: 34, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  thicknessButton: { minWidth: 34, minHeight: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  thicknessText: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900' },
  footer: { fontFamily: 'monospace', fontSize: 8, lineHeight: 13, textAlign: 'center' },
  saveDock: { position: 'absolute', right: 14, bottom: 14, minHeight: 48, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.94, elevation: 6 },
  saveDockText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
});

export default ButlerBuildModePanel;
