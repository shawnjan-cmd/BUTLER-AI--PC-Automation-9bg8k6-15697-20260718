import React, { memo, useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LayoutComponent, validateImageAsset, validateLocalAsset } from '@/services/layoutCustomization';
import { useSkin } from '@/hooks/useSkin';

export const ButlerMediaBlockEditor = memo(function ButlerMediaBlockEditor({ component, onChange }: { component: LayoutComponent; onChange: (patch: Partial<LayoutComponent>) => void }) {
  const skin = useSkin();
  const choose = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Photo access is off', 'Enable photo access only if you want to add a local Butler image block.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.82, selectionLimit: 1 });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    const check = validateImageAsset(asset.uri, asset.fileSize);
    if (!check.ok) { Alert.alert('Image not added', check.reason ?? 'The image did not pass local validation.'); return; }
    onChange({ imageUri: asset.uri, imageAlt: asset.fileName || component.label });
  }, [component.label, onChange]);
  const chooseFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'image/svg+xml'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    const kind = asset.mimeType === 'image/svg+xml' || asset.name.toLowerCase().endsWith('.svg') ? 'svg' : 'image';
    const check = validateLocalAsset({ uri: asset.uri, kind, byteLength: asset.size, alt: asset.name || component.label });
    if (!check.ok) { Alert.alert('Asset not added', check.reason ?? 'The local asset did not pass validation.'); return; }
    onChange({ imageUri: asset.uri, imageAlt: asset.name || component.label, localAsset: { uri: asset.uri, kind, byteLength: asset.size, alt: asset.name || component.label } });
  }, [component.label, onChange]);
  const clear = useCallback(() => onChange({ imageUri: undefined, imageAlt: undefined, localAsset: undefined }), [onChange]);
  return <View style={[styles.card, { borderColor: `${skin.accent}55`, backgroundColor: `${skin.bg}CC` }]}>
    {component.imageUri ? <Image source={{ uri: component.imageUri }} contentFit="cover" transition={160} style={[styles.preview, component.kind === 'hero' && styles.heroPreview]} accessibilityLabel={component.imageAlt || component.label} /> : <View style={[styles.empty, { borderColor: `${skin.accent}44` }]}><MaterialCommunityIcons name="image-plus" size={28} color={skin.accent} /><Text style={[styles.emptyText, { color: skin.mid }]}>LOCAL IMAGE SLOT · NO IMAGE SAVED</Text></View>}
    <View style={styles.row}><View style={{ flex: 1 }}><Text style={[styles.title, { color: skin.text }]}>{component.label}</Text><Text style={[styles.meta, { color: skin.mid }]}>LOCAL ONLY · PERSISTED IN LAYOUT STATE · MAX 8 MB</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Choose image for ${component.label}`} onPress={() => void choose()} style={[styles.action, { borderColor: skin.accent, backgroundColor: `${skin.accent}18` }]}><MaterialCommunityIcons name="image-edit-outline" size={18} color={skin.accent} /></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Choose local SVG or image file for ${component.label}`} onPress={() => void chooseFile()} style={[styles.action, { borderColor: skin.accent2, backgroundColor: `${skin.accent2}18` }]}><MaterialCommunityIcons name="file-image-plus-outline" size={18} color={skin.accent2} /></TouchableOpacity>{component.imageUri && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove image from ${component.label}`} onPress={clear} style={[styles.action, { borderColor: skin.warn, backgroundColor: `${skin.warn}18` }]}><MaterialCommunityIcons name="image-off-outline" size={18} color={skin.warn} /></TouchableOpacity>}</View>
  </View>;
});

const styles = StyleSheet.create({
  card: { borderWidth: 1.2, borderRadius: 12, padding: 8, gap: 8 },
  preview: { width: '100%', height: 122, borderRadius: 9, backgroundColor: '#050810' },
  heroPreview: { height: 168 },
  empty: { height: 104, borderWidth: 1, borderStyle: 'dashed', borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { fontFamily: 'monospace', fontSize: 7, letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontFamily: 'monospace', fontSize: 10, fontWeight: '900' },
  meta: { fontFamily: 'monospace', fontSize: 7, marginTop: 3, letterSpacing: 0.5 },
  action: { width: 38, height: 38, borderWidth: 1.3, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

export default ButlerMediaBlockEditor;
