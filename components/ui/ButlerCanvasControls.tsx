import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LayoutComponent, ShapeKind, UniversalSize, UNIVERSAL_SIZE_LABELS, UNIVERSAL_SIZE_ORDER } from '@/services/layoutCustomization';
import { useSkin } from '@/hooks/useSkin';

const SHAPES: ShapeKind[] = ['card', 'pill', 'circle', 'hex', 'diamond', 'frame', 'blob'];
const ICONS = ['view-dashboard-outline', 'image-outline', 'link-variant', 'script-text-outline', 'home-outline', 'chat-outline', 'cog-outline', 'monitor-dashboard', 'brain', 'palette-outline'] as const;

export const ButlerCanvasControls = memo(function ButlerCanvasControls({ component, onNudge, onResize, onAlign, onShape, onIcon, onSize }: { component: LayoutComponent; onNudge: (dx: -1 | 0 | 1, dy: -1 | 0 | 1) => void; onResize: (dw: number, dh: number) => void; onAlign: (anchor: 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right') => void; onShape: (shape: ShapeKind) => void; onIcon: (icon: string) => void; onSize: (size: UniversalSize) => void }) {
  const skin = useSkin();
  if (component.protected) return null;
  const shapeIndex = Math.max(0, SHAPES.indexOf(component.shape || 'card'));
  const iconIndex = Math.max(0, ICONS.indexOf((component.iconName || 'view-dashboard-outline') as typeof ICONS[number]));
  const g = component.geometry;
  const button = (label: string, icon: string, action: () => void, color = skin.accent) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={action} style={[styles.button, { borderColor: `${color}70`, backgroundColor: `${color}12` }]}><MaterialCommunityIcons name={icon as any} size={16} color={color} /></TouchableOpacity>;
  return <View style={[styles.panel, { borderColor: `${skin.accent2}35`, backgroundColor: `${skin.bg}CC` }]}>
    <View style={styles.header}><Text style={[styles.label, { color: skin.accent2 }]}>CANVAS CONTROLS</Text><Text style={[styles.measure, { color: skin.mid }]}>{Math.round(g?.width ?? 100)} × {Math.round(g?.height ?? 80)} · ({Math.round(g?.x ?? 0)}, {Math.round(g?.y ?? 0)})</Text></View>
    <View style={styles.rows}><View style={styles.nudgeGrid}>{button('Move up', 'chevron-up', () => onNudge(0, -1))}<View style={styles.inline}>{button('Move left', 'chevron-left', () => onNudge(-1, 0))}{button('Center component', 'target', () => onAlign('center'), skin.ok)}{button('Move right', 'chevron-right', () => onNudge(1, 0))}</View>{button('Move down', 'chevron-down', () => onNudge(0, 1))}</View><View style={styles.optionGrid}>{button('Shrink width', 'arrow-collapse-horizontal', () => onResize(-8, 0), skin.warn)}{button('Grow width', 'arrow-expand-horizontal', () => onResize(8, 0), skin.ok)}{button('Shrink height', 'arrow-collapse-vertical', () => onResize(0, -8), skin.warn)}{button('Grow height', 'arrow-expand-vertical', () => onResize(0, 8), skin.ok)}</View></View>
    <View style={styles.sizeRow}><Text style={[styles.sizeLabel, { color: skin.mid }]}>UNIVERSAL SIZE</Text>{UNIVERSAL_SIZE_ORDER.map(size => <TouchableOpacity key={size} accessibilityRole="button" accessibilityLabel={`Set ${component.label} to ${UNIVERSAL_SIZE_LABELS[size]} size`} onPress={() => onSize(size)} style={[styles.sizeButton, { borderColor: component.universalSize === size ? skin.ok : `${skin.border}80`, backgroundColor: component.universalSize === size ? `${skin.ok}18` : `${skin.panel}88` }]}><Text style={[styles.sizeText, { color: component.universalSize === size ? skin.ok : skin.mid }]}>{UNIVERSAL_SIZE_LABELS[size]}</Text></TouchableOpacity>)}</View><View style={styles.footer}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Change shape for ${component.label}`} onPress={() => onShape(SHAPES[(shapeIndex + 1) % SHAPES.length])} style={[styles.select, { borderColor: `${skin.accent}60` }]}><MaterialCommunityIcons name="shape-outline" size={14} color={skin.accent} /><Text style={[styles.selectText, { color: skin.accent }]}>{(component.shape || 'card').toUpperCase()}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Change icon for ${component.label}`} onPress={() => onIcon(ICONS[(iconIndex + 1) % ICONS.length])} style={[styles.select, { borderColor: `${skin.accent3}60` }]}><MaterialCommunityIcons name={(component.iconName || 'view-dashboard-outline') as any} size={14} color={skin.accent3} /><Text style={[styles.selectText, { color: skin.accent3 }]}>ICON</Text></TouchableOpacity></View>
  </View>;
});

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 10, padding: 7, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  measure: { fontFamily: 'monospace', fontSize: 7 },
  rows: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nudgeGrid: { alignItems: 'center', gap: 3 },
  inline: { flexDirection: 'row', gap: 3 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 138, justifyContent: 'flex-end', gap: 3 },
  button: { width: 32, height: 30, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  sizeLabel: { width: '100%', fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900', letterSpacing: 0.8 },
  sizeButton: { minWidth: 44, minHeight: 28, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  sizeText: { fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900' },
  footer: { flexDirection: 'row', gap: 6 },
  select: { flex: 1, minHeight: 30, borderWidth: 1, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  selectText: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900' },
});

export default ButlerCanvasControls;
