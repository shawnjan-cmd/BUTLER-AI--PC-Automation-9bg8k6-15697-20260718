import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ButlerMascotMotion from '@/components/ui/ButlerMascotMotion';
import { haptics } from '@/services/haptics';
import {
  catalogCosmeticAsset,
  CosmeticCatalogAsset,
  loadCosmeticAssetCatalog,
} from '@/services/cosmeticAssetCatalog';
import { useSkin } from '@/hooks/useSkin';

const TOUR_KEY = '@butler_cosmetics_first_entry_v1';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const LAN_STEPS = ['PACKAGE', 'LAN', 'PAIR', 'VERIFY', 'READY'];

function TinyLabel({ children, color }: { children: string; color: string }) {
  return <Text style={[styles.tinyLabel, { color }]}>{children}</Text>;
}

export default function CosmeticsCommandDeck() {
  const skin = useSkin();
  const [assets, setAssets] = useState<CosmeticCatalogAsset[]>([]);
  const [intakeState, setIntakeState] = useState<'idle' | 'working' | 'saved' | 'failed'>('idle');
  const [message, setMessage] = useState('No local asset selected yet.');
  const [showTour, setShowTour] = useState(false);
  const scan = useRef(new Animated.Value(-1)).current;

  const refreshAssets = useCallback(async () => setAssets(await loadCosmeticAssetCatalog()), []);

  useEffect(() => {
    void refreshAssets();
    AsyncStorage.getItem(TOUR_KEY).then(value => setShowTour(value !== 'done')).catch(() => setShowTour(true));
  }, [refreshAssets]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(scan, { toValue: -1, duration: 0, useNativeDriver: true }),
      Animated.delay(4200),
    ]));
    loop.start();
    return () => loop.stop();
  }, [scan]);

  const finishTour = useCallback(() => {
    setShowTour(false);
    void AsyncStorage.setItem(TOUR_KEY, 'done');
    haptics.light();
  }, []);

  const chooseAsset = useCallback(async () => {
    try {
      setIntakeState('working');
      setMessage('Opening the local file picker…');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'image/svg+xml'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) {
        setIntakeState('idle');
        setMessage('No file selected. Nothing was uploaded or shared.');
        return;
      }
      const source = result.assets[0];
      const entry = await catalogCosmeticAsset({
        name: source.name,
        uri: source.uri,
        mimeType: source.mimeType,
        size: source.size,
      });
      await refreshAssets();
      setIntakeState('saved');
      setMessage(`${entry.displayName} is categorized and ready for local review.`);
      haptics.success();
    } catch {
      setIntakeState('failed');
      setMessage('The file could not be cataloged. Your existing project assets were not changed.');
      haptics.error();
    }
  }, [refreshAssets]);

  const latestAsset = assets[0];
  const scanX = scan.interpolate({ inputRange: [-1, 1], outputRange: [-220, 420] });
  const statusColor = intakeState === 'saved' ? skin.ok : intakeState === 'failed' ? skin.danger : skin.accent;
  const assetCount = useMemo(() => assets.length, [assets.length]);

  return (
    <View style={[styles.root, { borderColor: `${skin.accent}60`, backgroundColor: skin.panel }]}>
      <Animated.View pointerEvents="none" style={[styles.scanline, { backgroundColor: `${skin.accent}14`, transform: [{ translateX: scanX }] }]} />
      <View style={[styles.accentRail, { backgroundColor: skin.accent }]} />
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <TinyLabel color={skin.accent}>COSMETICS FIRST · LOCAL DESIGN WORKBENCH</TinyLabel>
          <Text style={[styles.title, { color: skin.text }]}>MAKE BUTLER <Text style={{ color: skin.accent }}>YOURS</Text></Text>
          <Text style={[styles.copy, { color: skin.mid }]}>Preview the designs, organize the Backpack, and configure a separate local connection package without confusing style with authority.</Text>
        </View>
        <ButlerMascotMotion size={76} paused={false} />
      </View>

      {showTour && (
        <View style={[styles.tour, { borderColor: `${skin.accent2}70`, backgroundColor: `${skin.accent2}10` }]}>
          <View style={{ flex: 1 }}>
            <TinyLabel color={skin.accent2}>FIRST ENTRY · 3 STEPS</TinyLabel>
            <Text style={[styles.tourText, { color: skin.text }]}>Choose a style, inspect its Backpack parts, then save only what your verified entitlement allows.</Text>
          </View>
          <TouchableOpacity onPress={finishTour} accessibilityRole="button" accessibilityLabel="Dismiss Cosmetics guide" style={[styles.dismiss, { borderColor: `${skin.accent2}70` }]}>
            <Text style={[styles.dismissText, { color: skin.accent2 }]}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dualRow}>
        <Pressable onPress={() => router.push('/(tabs)/serverSetup' as any)} accessibilityRole="button" accessibilityLabel="Open five-step local PC setup" style={({ pressed }) => [styles.lanCard, { borderColor: `${skin.warn}70`, backgroundColor: `${skin.warn}0D`, opacity: pressed ? 0.8 : 1 }]}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="lan-connect" size={20} color={skin.warn} />
            <TinyLabel color={skin.warn}>LAN CONNECT · 5</TinyLabel>
          </View>
          <Text style={[styles.cardTitle, { color: skin.text }]}>REMOTE CONNECTION SETUP</Text>
          <Text style={[styles.cardCopy, { color: skin.mid }]}>A consent-first local pairing package. It only tests the address you enter and requires a one-time PC code.</Text>
          <View style={styles.steps}>{LAN_STEPS.map((step, index) => <View key={step} style={styles.stepWrap}><View style={[styles.stepDot, { borderColor: `${skin.warn}80`, backgroundColor: index === 0 ? `${skin.warn}22` : skin.bg }]}><Text style={[styles.stepText, { color: skin.warn }]}>{index + 1}</Text></View><Text style={[styles.stepLabel, { color: skin.mid }]}>{step}</Text></View>)}</View>
        </Pressable>

        <View style={[styles.assetCard, { borderColor: `${statusColor}70`, backgroundColor: `${statusColor}0B` }]}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="folder-open-outline" size={20} color={statusColor} />
            <TinyLabel color={statusColor}>LOCAL ASSET INTAKE</TinyLabel>
          </View>
          <Text style={[styles.cardTitle, { color: skin.text }]}>AUTO-CATALOG DESIGNS</Text>
          <Text style={[styles.cardCopy, { color: skin.mid }]}>{message}</Text>
          <TouchableOpacity onPress={chooseAsset} accessibilityRole="button" accessibilityLabel="Choose a local cosmetic asset" style={[styles.intakeButton, { borderColor: `${statusColor}80`, backgroundColor: `${statusColor}16` }]}>
            <MaterialCommunityIcons name="file-plus-outline" size={17} color={statusColor} />
            <Text style={[styles.intakeText, { color: statusColor }]}>{intakeState === 'working' ? 'CATALOGING…' : 'SELECT LOCAL FILE'}</Text>
          </TouchableOpacity>
          <Text style={[styles.assetMeta, { color: skin.mid }]}>{assetCount} LOCAL {assetCount === 1 ? 'ASSET' : 'ASSETS'} · NO CLOUD UPLOAD</Text>
        </View>
      </View>

      {latestAsset && (
        <View style={[styles.latest, { borderColor: `${skin.accent3}65`, backgroundColor: `${skin.accent3}0D` }]}>
          {latestAsset.mimeType.startsWith('image/') ? <Image source={{ uri: latestAsset.uri }} style={[styles.thumb, { borderColor: `${skin.accent3}66` }]} /> : <View style={[styles.thumb, styles.thumbFallback, { borderColor: `${skin.accent3}66` }]}><MaterialCommunityIcons name="file-image-outline" size={22} color={skin.accent3} /></View>}
          <View style={{ flex: 1 }}>
            <TinyLabel color={skin.accent3}>LATEST LOCAL CATALOG ITEM</TinyLabel>
            <Text style={[styles.latestName, { color: skin.text }]} numberOfLines={1}>{latestAsset.displayName}</Text>
            <Text style={[styles.latestMeta, { color: skin.mid }]} numberOfLines={2}>{latestAsset.tags.join(' · ')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 10, overflow: 'hidden' },
  scanline: { position: 'absolute', top: 0, bottom: 0, width: 96, opacity: 0.8 },
  accentRail: { position: 'absolute', left: 0, top: 18, width: 3, height: 46, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 90 },
  title: { fontFamily: MONO, fontSize: 18, fontWeight: '900', letterSpacing: 0.2, marginTop: 4 },
  copy: { fontFamily: MONO, fontSize: 8.5, lineHeight: 13, marginTop: 5, maxWidth: 340 },
  tinyLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 1.15 },
  tour: { minHeight: 60, borderRadius: 10, borderWidth: 1, padding: 9, flexDirection: 'row', gap: 8, alignItems: 'center' },
  tourText: { fontFamily: MONO, fontSize: 8, lineHeight: 12, marginTop: 3 },
  dismiss: { minWidth: 54, minHeight: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  dismissText: { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  dualRow: { flexDirection: 'row', gap: 8 },
  lanCard: { flex: 1.12, minHeight: 196, borderWidth: 1, borderRadius: 12, padding: 10, gap: 7 },
  assetCard: { flex: 0.88, minHeight: 196, borderWidth: 1, borderRadius: 12, padding: 10, gap: 7 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '900', lineHeight: 14 },
  cardCopy: { fontFamily: MONO, fontSize: 7.5, lineHeight: 11, flex: 1 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', gap: 3, marginTop: 2 },
  stepWrap: { alignItems: 'center', flex: 1, gap: 3 },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  stepLabel: { fontFamily: MONO, fontSize: 5.5, fontWeight: '900', textAlign: 'center' },
  intakeButton: { minHeight: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 6 },
  intakeText: { fontFamily: MONO, fontSize: 7, fontWeight: '900', textAlign: 'center' },
  assetMeta: { fontFamily: MONO, fontSize: 6.5, lineHeight: 10 },
  latest: { flexDirection: 'row', gap: 9, minHeight: 60, borderWidth: 1, borderRadius: 10, padding: 7, alignItems: 'center' },
  thumb: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, backgroundColor: '#050810' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  latestName: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', marginTop: 3 },
  latestMeta: { fontFamily: MONO, fontSize: 6.5, lineHeight: 10, marginTop: 2 },
});
