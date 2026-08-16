import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LayoutEditorState } from '@/services/layoutCustomization';
import { useSkin } from '@/hooks/useSkin';

export const ButlerBuildModeGuide = memo(function ButlerBuildModeGuide({ state, onGrid, onSnap, onGridSize, onUndo, onRedo, onReset, onSave, onPrevious, onNext, canUndo, canRedo }: { state: LayoutEditorState; onGrid: () => void; onSnap: () => void; onGridSize: () => void; onUndo: () => void; onRedo: () => void; onReset: () => void; onSave: () => void; onPrevious: () => void; onNext: () => void; canUndo: boolean; canRedo: boolean }) {
  const skin = useSkin();
  const action = (icon: string, label: string, onPress: () => void, color: string, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.action, { borderColor: disabled ? `${color}28` : `${color}88`, backgroundColor: disabled ? `${color}08` : `${color}15`, opacity: disabled ? 0.4 : 1 }]}><MaterialCommunityIcons name={icon as any} size={18} color={color} /><Text style={[styles.actionText, { color }]}>{label}</Text></TouchableOpacity>;
  return <View style={[styles.root, { borderColor: `${skin.warn}70`, backgroundColor: `${skin.warn}0D` }]}>
    <View style={styles.header}><MaterialCommunityIcons name="help-circle-outline" size={17} color={skin.warn} /><View style={{ flex: 1 }}><Text style={[styles.title, { color: skin.warn }]}>BUILD MODE GUIDE</Text><Text style={[styles.help, { color: skin.mid }]}>Tap a block, then use arrows to move it. Snap keeps edges aligned; Free lets you place it by hand. Grid is a visual guide only.</Text></View></View>
    <View style={styles.row}>{action('arrow-left-bold', 'PREVIOUS PAGE', onPrevious, skin.accent2)}{action('arrow-right-bold', 'NEXT PAGE', onNext, skin.accent2)}{action(state.gridVisible ? 'grid' : 'grid-off', state.gridVisible ? 'GRID ON' : 'GRID OFF', onGrid, skin.accent)}{action(state.snapMode === 'snap' ? 'magnet-on' : 'magnet-off', state.snapMode === 'snap' ? 'SNAP ON' : 'FREE DRAG', onSnap, skin.accent2)}{action('grid-large', `GRID ${state.gridSize}`, onGridSize, skin.accent3)}{action('undo', 'UNDO', onUndo, skin.accent, !canUndo)}{action('redo', 'REDO', onRedo, skin.accent, !canRedo)}{action('restore', 'RESET', onReset, skin.danger)}{action('content-save-check', 'SAVE & EXIT', onSave, skin.ok)}</View>
    <Text style={[styles.status, { color: skin.mid }]}>{state.gridVisible ? `Visible ${state.gridSize}px guide` : 'Guides hidden'} · {state.snapMode === 'snap' ? `snapping to ${state.gridSize}px` : 'free placement'} · protected headers and core functions stay locked</Text>
  </View>;
});

const styles = StyleSheet.create({ root: { borderWidth: 1, borderRadius: 12, padding: 9, gap: 8 }, header: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 }, title: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, help: { fontFamily: 'monospace', fontSize: 7.5, lineHeight: 11, marginTop: 3 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, action: { minHeight: 38, minWidth: 63, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', gap: 2 }, actionText: { fontFamily: 'monospace', fontSize: 6.6, fontWeight: '900', letterSpacing: 0.4 }, status: { fontFamily: 'monospace', fontSize: 6.8 } });

export default ButlerBuildModeGuide;
