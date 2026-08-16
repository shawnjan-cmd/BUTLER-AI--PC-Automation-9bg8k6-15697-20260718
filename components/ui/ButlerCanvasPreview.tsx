import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LayoutComponent } from '@/services/layoutCustomization';
import { useSkin } from '@/hooks/useSkin';

export const ButlerCanvasPreview = memo(function ButlerCanvasPreview({ components, gridVisible = true, gridSize = 8, gridColor, snapMode = 'snap' }: { components: LayoutComponent[]; gridVisible?: boolean; gridSize?: number; gridColor?: string; snapMode?: 'snap' | 'free' }) {
  const skin = useSkin();
  const guide = gridColor || skin.accent;
  const columns = Math.max(4, Math.min(16, Math.round(48 / gridSize)));
  const rows = Math.max(4, Math.min(18, Math.round(96 / gridSize)));
  return <View style={[styles.canvas, { borderColor: `${skin.warn}80`, backgroundColor: `${skin.bg}F5` }]} accessibilityLabel={`Build Mode layout canvas, ${gridVisible ? 'grid visible' : 'grid hidden'}, ${snapMode === 'snap' ? 'snap enabled' : 'free placement'}`}>
    {gridVisible && <>{Array.from({ length: columns }).map((_, i) => <View key={`v${i}`} pointerEvents="none" style={[styles.vGuide, { left: `${((i + 1) / columns) * 100}%`, backgroundColor: `${guide}20` }]} />)}{Array.from({ length: rows }).map((_, i) => <View key={`h${i}`} pointerEvents="none" style={[styles.hGuide, { top: `${((i + 1) / rows) * 100}%`, backgroundColor: `${guide}20` }]} />)}</>}
    {components.filter(item => item.visible).map((item, index) => { const g = item.geometry; const width = Math.min(92, Math.max(12, (g?.width ?? 100) / 10)); const height = Math.min(50, Math.max(10, (g?.height ?? 80) / 14)); const left = Math.min(88, Math.max(2, (g?.x ?? 0) / 10)); const top = Math.min(86, Math.max(2, (g?.y ?? index * 88) / 22)); return <View key={item.id} style={[styles.bound, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, borderColor: item.protected ? `${skin.accent}E0` : `${skin.ok}B0`, borderWidth: item.lineThickness ?? 1, backgroundColor: item.protected ? `${skin.accent}12` : `${skin.ok}0D`, borderRadius: item.shape === 'circle' ? 999 : item.shape === 'pill' ? 30 : 7 }]}><Text numberOfLines={1} style={[styles.boundText, { color: item.protected ? skin.accent : skin.ok }]}>{item.label}</Text></View>; })}
    <Text style={[styles.caption, { color: skin.warn }]}>{gridVisible ? `BUILD CANVAS · GRID ${gridSize} · ${snapMode === 'snap' ? 'SNAP' : 'FREE'}` : `BUILD CANVAS · GRID OFF · ${snapMode === 'snap' ? 'SNAP' : 'FREE'}`} · CORE BOUNDS LOCKED</Text>
  </View>;
});

const styles = StyleSheet.create({ canvas: { height: 164, borderWidth: 1.5, borderRadius: 12, overflow: 'hidden', position: 'relative' }, vGuide: { position: 'absolute', top: 0, bottom: 0, width: 1 }, hGuide: { position: 'absolute', left: 0, right: 0, height: 1 }, bound: { position: 'absolute', minWidth: 34, minHeight: 18, paddingHorizontal: 4, justifyContent: 'center', overflow: 'hidden' }, boundText: { fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900' }, caption: { position: 'absolute', left: 8, bottom: 6, fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900', letterSpacing: 0.7 } });

export default ButlerCanvasPreview;
