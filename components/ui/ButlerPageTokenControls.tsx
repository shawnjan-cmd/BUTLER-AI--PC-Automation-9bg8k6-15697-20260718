import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageLayoutState, PageVisualTokens } from '@/services/pageLayoutCustomization';
import { useSkin } from '@/hooks/useSkin';

const PALETTES = [
  { accent: '#6DE7F2', accent2: '#A468FF', accent3: '#FF4D9A', name: 'CYAN' },
  { accent: '#FFB43D', accent2: '#35D0B0', accent3: '#4A9EFF', name: 'EMBER' },
  { accent: '#A5F36B', accent2: '#FF6B9D', accent3: '#C8A8FF', name: 'MINT' },
] as const;
const EFFECTS: PageVisualTokens['effect'][] = ['none', 'soft-glow', 'scan', 'pulse', 'orbit', 'particles'];
const SCALES: PageVisualTokens['scale'][] = ['small', 'regular', 'large'];
const DENSITIES: PageVisualTokens['density'][] = ['compact', 'regular', 'spacious'];

function next<T>(current: T, values: readonly T[]): T { return values[(Math.max(0, values.indexOf(current)) + 1) % values.length]; }

export const ButlerPageTokenControls = memo(function ButlerPageTokenControls({ state, onChange }: { state: PageLayoutState; onChange: (patch: Partial<PageVisualTokens>) => void }) {
  const skin = useSkin();
  const paletteIndex = Math.max(0, PALETTES.findIndex(p => p.accent === state.tokens.accent));
  const palette = PALETTES[(paletteIndex + 1) % PALETTES.length];
  const button = (label: string, value: string, action: () => void, color: string) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Change ${label}`} onPress={action} style={[styles.button, { borderColor: `${color}70`, backgroundColor: `${color}12` }]}><Text style={[styles.label, { color }]}>{label}</Text><Text style={[styles.value, { color }]}>{value}</Text></TouchableOpacity>;
  return <View style={[styles.root, { borderColor: `${skin.accent2}35`, backgroundColor: `${skin.bg}CC` }]}><Text style={[styles.heading, { color: skin.accent2 }]}>PAGE VISUAL TOKENS · {state.pageId.toUpperCase()}</Text><View style={styles.row}>{button('PALETTE', palette.name, () => onChange(palette), skin.accent)}{button('EFFECT', state.tokens.effect.toUpperCase(), () => onChange({ effect: next(state.tokens.effect, EFFECTS) }), skin.accent3)}{button('SCALE', state.tokens.scale.toUpperCase(), () => onChange({ scale: next(state.tokens.scale, SCALES) }), skin.ok)}{button('DENSITY', state.tokens.density.toUpperCase(), () => onChange({ density: next(state.tokens.density, DENSITIES) }), skin.warn)}{button('LINE', `${state.tokens.lineThickness}px`, () => onChange({ lineThickness: ((state.tokens.lineThickness % 4) + 1) as 1 | 2 | 3 | 4 }), skin.accent2)}</View></View>;
});

const styles = StyleSheet.create({ root: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 7 }, heading: { fontFamily: 'monospace', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, button: { flexGrow: 1, minWidth: 58, minHeight: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, justifyContent: 'center' }, label: { fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900', letterSpacing: 0.6 }, value: { fontFamily: 'monospace', fontSize: 7.5, fontWeight: '900', marginTop: 3 } });

export default ButlerPageTokenControls;
