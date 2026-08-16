/**
 * BUTLER AI — Cosmetic / Skins v4 · Theme Redesign
 * Non-scrollable chrome · Theme grid FlatList
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import ButlerMicrocopy from '@/components/ui/ButlerMicrocopy';
import ButlerAtmosphere from '@/components/ui/ButlerAtmosphere';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, Platform, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import OpportunityReviewCard from '@/components/ui/OpportunityReviewCard';
import { haptics } from '@/services/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ButlerSurface from '@/components/ui/ButlerSurface';
import ButlerAutoScaleText from '@/components/ui/ButlerAutoScaleText';
import ButlerBuildModePanel from '@/components/ui/ButlerBuildModePanel';
import ButlerBackpackInventory from '@/components/ui/ButlerBackpackInventory';
import ButlerBackpackShowcase from '@/components/ui/ButlerBackpackShowcase';
import ButlerPackageSpotlight from '@/components/ui/ButlerPackageSpotlight';
import ButlerDragonFlavorMoment from '@/components/ui/ButlerDragonFlavorMoment';
import ButlerBackpackThankYou from '@/components/ui/ButlerBackpackThankYou';
import ButlerStyleRecipePreview from '@/components/ui/ButlerStyleRecipePreview';
import { PACK_THEMES, useCosmetic } from '@/contexts/CosmeticContext';

const BG   = '#050810';
const SURF = '#0B0F17';
const SURF2= '#111621';
const DIM  = '#00E5FF25';
const MID  = '#7B8EA9';
const AMBER = '#FFB43D';
const CYAN  = '#38D9E8';
const GREEN = '#2FE38A';
const PURP  = '#A468FF';
const TEXT  = '#DCE6F2';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW   = Math.max(320, Dimensions.get('window').width);
const CARD_W = (SW - 32 - 8) / 2;

type CosmeticPack = { id:string; name:string; price:string; mascot:string; chat:string; sound:string; alarm:string; scriptIcon:string; accent:string; note:string; features:string[]; };
const COSMETIC_PACKS: CosmeticPack[] = [
  {
    id:'butler-studio-10', name:'BUTLER STUDIO', price:'$10', mascot:'bowtie-bot', chat:'POLISHED', sound:'BRASS TICK', alarm:'GENTLE CHIME', scriptIcon:'spark', accent:'#FFB43D',
    note:'The complete visual polish pack for users who want Butler to feel personal, expressive, and unmistakably theirs.',
    features:['All premium palettes and chat-bubble shapes','Animated message entrances, send effects, and receipt reveals','Expanded mascot expressions, script icons, haptic styles, and sound cues'],
  },
  {
    id:'butler-atelier-20', name:'BUTLER ATELIER', price:'$20', mascot:'atelier-bot', chat:'SIGNATURE', sound:'BRASS SUITE', alarm:'CONCIERGE CHIME', scriptIcon:'diamond', accent:'#A468FF',
    note:'The signature pack with every Studio visual plus priority human support coverage.',
    features:['Everything in Butler Studio','Exclusive signature effects, transitions, mascot states, and premium sound set','Priority bug-triage and support response target within a few hours during published support hours'],
  },
];

type ProductCard = { id:string; name:string; price:string; icon:string; accent:string; note:string; features:string[]; };
const REMOTE_PRODUCT: ProductCard = {
  id:'butler-remote-connection', name:'REMOTE CONNECTION', price:'SEPARATE PRODUCT', icon:'vpn', accent:'#4A9EFF',
  note:'Secure remote access to the user’s own PC through a supported private VPN or correctly configured TLS endpoint. Remote access is never enabled by a cosmetic pack.',
  features:['Explicit pairing and device lock','Transport status shown from runtime evidence','No hidden background execution, cloud AI, or developer-operated relay'],
};

type Theme = { id:string; name:string; sub:string; accent:string; bg:string; preview:string[]; };
const THEMES: Theme[] = Object.values(PACK_THEMES).map(theme => ({
  id: theme.id,
  name: theme.name,
  sub: theme.tagline ?? theme.category ?? 'Butler visual preset',
  accent: theme.primary,
  bg: theme.bg,
  preview: [theme.bg, theme.panel, theme.primary, theme.secondary],
}));

const PulseDot = memo(({ color, size=6 }: { color:string; size?:number }) => {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue:1, duration:800, useNativeDriver:true }),
      Animated.timing(a, { toValue:0.2, duration:800, useNativeDriver:true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:color, opacity:a }} />;
});

const ThemeCard = memo(({ theme, active, onSelect }: { theme:Theme; active:boolean; onSelect:()=>void }) => {
  const scaleA = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scaleA, { toValue:0.93, duration:70, useNativeDriver:true }),
      Animated.spring(scaleA, { toValue:1, tension:280, friction:10, useNativeDriver:true }),
    ]).start();
  };
  return (
    <Animated.View style={[TC.card, { borderColor: active ? theme.accent+'80' : DIM+'80', borderWidth: active?2:1.5, transform:[{scale:scaleA}] }]}>
      <TouchableOpacity onPressIn={press} onPress={onSelect} activeOpacity={0.88} style={{ flex:1 }}>
        {/* Color strip */}
        <View style={{ flexDirection:'row', height:6, borderTopLeftRadius:10, borderTopRightRadius:10, overflow:'hidden' }}>
          {theme.preview.map((c,i) => (
            <View key={i} style={{ flex:1, backgroundColor:c }} />
          ))}
        </View>
        {/* Preview area */}
        <View style={[TC.preview, { backgroundColor:theme.bg }]}>
          <View style={[TC.previewCard, { backgroundColor: theme.preview[1], borderColor: theme.accent+'40' }]}>
            <View style={{ width:20, height:3, borderRadius:2, backgroundColor: theme.accent, marginBottom:4 }} />
            <View style={{ width:14, height:2, borderRadius:1, backgroundColor: theme.accent+'50' }} />
          </View>
          <View style={[TC.previewCard, { backgroundColor: theme.preview[1], borderColor: theme.preview[2]+'40' }]}>
            <View style={{ width:16, height:3, borderRadius:2, backgroundColor: theme.preview[2], marginBottom:4 }} />
            <View style={{ width:10, height:2, borderRadius:1, backgroundColor: theme.preview[2]+'50' }} />
          </View>
        </View>
        {/* Info */}
        <View style={{ padding:10, gap:3 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor: theme.accent }} />
            <ButlerAutoScaleText size={10} lines={1} weight="900" style={{ ...TC.name, color: TEXT }}>{theme.name}</ButlerAutoScaleText>
            {active && <MaterialIcons name="check-circle" size={12} color={theme.accent} />}
          </View>
          <ButlerAutoScaleText size={8} lines={2} minFontScale={0.72} style={TC.sub}>{theme.sub}</ButlerAutoScaleText>
        </View>
        {active && (
          <View style={[TC.activeBadge, { backgroundColor: theme.accent+'20', borderColor: theme.accent+'50' }]}>
            <Text style={[TC.activeTxt, { color:theme.accent }]}>ACTIVE</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});
const TC = StyleSheet.create({
  card:        { width:CARD_W, backgroundColor:SURF, borderRadius:12, overflow:'hidden',
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:0.4,shadowRadius:8}, android:{elevation:4} }) },
  preview:     { height:64, flexDirection:'row', gap:6, padding:8, alignItems:'center', justifyContent:'center' },
  previewCard: { flex:1, height:48, borderRadius:8, borderWidth:1, padding:8, justifyContent:'center' },
  name:        { fontFamily:MONO, fontSize:10, fontWeight:'900', flex:1, lineHeight:14 },
  sub:         { fontFamily:MONO, fontSize:8, color:MID, lineHeight:11 },
  activeBadge: { position:'absolute', top:8, right:8, borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  activeTxt:   { fontFamily:MONO, fontSize:7.5, fontWeight:'900' },
});

function CosmeticInner() {
  const insets  = useSafeAreaInsets();
  const { activePackId, previewPackId, isPreviewMode, isUnlocked, startPreview, endPreview, confirmPreview } = useCosmetic();
  const active = previewPackId ?? activePackId;
  const [pack, setPack] = useState<CosmeticPack>(COSMETIC_PACKS[0]);
  const [hh, setHh]         = useState('--:--');
  const scanX = useRef(new Animated.Value(-SW)).current;
  const ACCENT = THEMES.find(t => t.id===active)?.accent || '#38D9E8';

  useEffect(() => {
    AsyncStorage.getItem('@butler_cosmetic_pack_v1').then(raw => {
      if (!raw) return;
      const found = COSMETIC_PACKS.find(item => item.id === raw);
      if (found) setPack(found);
    }).catch(() => {});
  }, []);

  const selectPack = (next: CosmeticPack) => {
    setPack(next);
    AsyncStorage.setItem('@butler_cosmetic_pack_v1', next.id).catch(() => {});
    haptics.success();
  };

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setHh(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanX, { toValue:SW+120, duration:2600, useNativeDriver:true }),
      Animated.timing(scanX, { toValue:-SW, duration:0, useNativeDriver:true }),
      Animated.delay(6500),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const selectTheme = (id: string) => {
    startPreview(id);
    haptics.success();
  };

  return (
    <View style={{ flex:1, backgroundColor:BG }}>
      <ButlerAtmosphere accent="#FF4D9A" intensity={0.12} />
      <ButlerMicrocopy accent="#FF4D9A" text="Skins change presentation only; data and connection policy stay separate." icon="palette-outline" />
      {/* Header */}
      <View style={[SH.root, { paddingTop:insets.top }]}>
        <View style={{ height:3, backgroundColor:ACCENT }} />
        <Animated.View pointerEvents="none" style={[SH.scan, { transform:[{translateX:scanX}] }]} />
        <View style={SH.body}>
          <View style={{ flex:1, gap:4 }}>
            <Text style={[SH.eye, { color: ACCENT+'60' }]}>VISUAL SKIN · COLOR PALETTE</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <MaterialCommunityIcons name="palette-swatch" size={18} color={ACCENT} />
              <Text style={SH.title}>COSMETIC <Text style={{ color:ACCENT }}>SKINS</Text></Text>
            </View>
            <View style={{ flexDirection:'row', gap:6 }}>
              <View style={[SH.pill, { borderColor: ACCENT+'60', backgroundColor: ACCENT+'10' }]}>
                <PulseDot color={ACCENT} size={5} />
                <Text style={[SH.pTxt, { color:ACCENT }]}>{THEMES.find(t=>t.id===active)?.name}</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems:'flex-end', gap:3 }}>
            <Text style={[SH.cBig, { color:TEXT }]}>{hh}</Text>
            <Text style={SH.cSub}>LOCAL · SECURE</Text>
          </View>
        </View>
        <View style={{ height:2, backgroundColor: ACCENT+'30' }} />
      </View>

      {/* Live color preview bar */}
      <View style={{ height:8, flexDirection:'row' }}>
        {THEMES.find(t=>t.id===active)?.preview.map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </View>

      {/* Theme grid */}
      <FlatList
        data={THEMES}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <ThemeCard theme={item} active={active===item.id} onSelect={() => selectTheme(item.id)} />
        )}
        numColumns={2}
        contentContainerStyle={{ padding:12, gap:8, paddingBottom: insets.bottom + 80 }}
        columnWrapperStyle={{ gap:8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 10, paddingBottom: 2 }}>
            <ButlerPackageSpotlight />
            <ButlerDragonFlavorMoment />
            <ButlerBackpackThankYou />
            <ButlerStyleRecipePreview />
          <ButlerBackpackShowcase />
            <ButlerBackpackInventory />
            <ButlerBuildModePanel />
            <OpportunityReviewCard />
            <ButlerSurface accent={pack.accent} motion="reduced" elevated style={{ padding: 10, gap: 8 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <MaterialCommunityIcons name="robot-excited-outline" size={18} color={pack.accent} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:9, color:pack.accent, fontWeight:'900', letterSpacing:1.2 }}>BUTLER PACKS</Text>
                  <Text style={{ fontFamily:MONO, fontSize:8, color:MID, marginTop:2 }}>MASCOT · CHAT · SOUND · ALERT · SCRIPT ICONS</Text>
                </View>
                <Text style={{ fontFamily:MONO, fontSize:8, color:pack.accent }}>{pack.name}</Text>
              </View>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                {COSMETIC_PACKS.map(item => (
                  <TouchableOpacity key={item.id} onPress={() => selectPack(item)} accessibilityRole="button" accessibilityLabel={`Select ${item.name} cosmetic pack`}
                    style={{ borderWidth:1, borderColor:item.id===pack.id ? item.accent : DIM+'60', backgroundColor:item.id===pack.id ? item.accent+'18' : BG, borderRadius:7, paddingHorizontal:8, paddingVertical:6 }}>
                    <Text style={{ fontFamily:MONO, fontSize:8, color:item.id===pack.id ? item.accent : TEXT, fontWeight:'900' }}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontFamily:MONO, fontSize:8, color:MID, lineHeight:12 }}>{pack.price} · {pack.note}  {pack.mascot} · {pack.chat} · {pack.sound} · {pack.alarm} · {pack.scriptIcon}</Text>
              <View style={{ gap:4 }}>
                {pack.features.map(feature => <Text key={feature} style={{ fontFamily:MONO, fontSize:7.5, color:TEXT, lineHeight:11 }}>• {feature}</Text>)}
              </View>
              <Text style={{ fontFamily:MONO, fontSize:7.5, color:MID, lineHeight:11 }}>Preview only until a verified entitlement is returned. Safety, permissions, encryption, remote controls, and data handling never depend on a cosmetic pack.</Text>
            </ButlerSurface>
            <ButlerSurface accent={REMOTE_PRODUCT.accent} motion="reduced" elevated style={{ padding: 10, gap: 8 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <MaterialCommunityIcons name={REMOTE_PRODUCT.icon as any} size={18} color={REMOTE_PRODUCT.accent} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:9, color:REMOTE_PRODUCT.accent, fontWeight:'900', letterSpacing:1.2 }}>{REMOTE_PRODUCT.name}</Text>
                  <Text style={{ fontFamily:MONO, fontSize:8, color:MID, marginTop:2 }}>{REMOTE_PRODUCT.price} · PAIRING + PRIVATE VPN/TLS</Text>
                </View>
              </View>
              <Text style={{ fontFamily:MONO, fontSize:8, color:MID, lineHeight:12 }}>{REMOTE_PRODUCT.note}</Text>
              {REMOTE_PRODUCT.features.map(feature => <Text key={feature} style={{ fontFamily:MONO, fontSize:7.5, color:TEXT, lineHeight:11 }}>• {feature}</Text>)}
              <Text style={{ fontFamily:MONO, fontSize:7.5, color:AMBER, lineHeight:11 }}>Purchase and entitlement verification must use the platform billing flow. This page does not claim a purchase or active remote tunnel without a verified result.</Text>
            </ButlerSurface>
            <Text style={{ fontFamily:MONO, fontSize:9, color:MID, textAlign:'center', paddingBottom:8, letterSpacing:1.5 }}>
              TAP A THEME TO APPLY · {THEMES.length} VISUAL PRESETS · 2 COSMETIC PACKAGES + REMOTE CONNECTION
            </Text>
          </View>
        }
      />

      <View style={{ backgroundColor:SURF, borderTopWidth:1, borderTopColor: DIM+'60', paddingTop:8, paddingBottom:Math.max(insets.bottom+4,10), paddingHorizontal:14,
        flexDirection:'row', alignItems:'center', gap:8 }}>
        <View style={{ width:10, height:10, borderRadius:5, backgroundColor:ACCENT }} />
        <Text style={{ fontFamily:MONO, fontSize:9, color:MID, flex:1 }}>ACTIVE: {THEMES.find(t=>t.id===active)?.name}</Text>
        {isPreviewMode && !isUnlocked(active) && <Text style={{ fontFamily:MONO, fontSize:7, color:AMBER, maxWidth:150, textAlign:'right' }}>PREVIEW ONLY · VERIFIED ENTITLEMENT REQUIRED</Text>}
        {isPreviewMode && <TouchableOpacity onPress={() => { if (isUnlocked(active)) { confirmPreview(); haptics.heavy(); } else { endPreview(); haptics.warning(); } }} activeOpacity={0.85}
          style={{ borderWidth:1.5, borderRadius:20, paddingHorizontal:14, paddingVertical:6, borderColor: ACCENT+'60', backgroundColor: ACCENT+'12' }}>
          <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:ACCENT }}>{isUnlocked(active) ? 'APPLY' : 'CLOSE'}</Text>
        </TouchableOpacity>}
        {!isPreviewMode && <Text style={{ fontFamily:MONO, fontSize:8, color:MID }}>ACTIVE · VERIFIED STATE</Text>}
      </View>
    </View>
  );
}
const SH = StyleSheet.create({
  root: { backgroundColor:'#050810', overflow:'hidden' },
  scan: { position:'absolute', top:0, bottom:0, width:80, backgroundColor:'rgba(255,255,255,0.03)' },
  body: { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:14, paddingTop:11, paddingBottom:12, gap:10, zIndex:1 },
  eye:  { fontFamily:MONO, fontSize:7.5, letterSpacing:1.5, fontWeight:'700' },
  title:{ fontSize:22, fontWeight:'900', color:'#FFF' },
  pill: { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:20, paddingHorizontal:9, paddingVertical:4 },
  pTxt: { fontFamily:MONO, fontSize:9, fontWeight:'900' },
  cBig: { fontFamily:MONO, fontSize:22, fontWeight:'900', letterSpacing:1 },
  cSub: { fontFamily:MONO, fontSize:7, color:MID, letterSpacing:1 },
});

export default function CosmeticScreen() {
  return <TabErrorBoundary name="Cosmetic"><CosmeticInner /></TabErrorBoundary>;
}
