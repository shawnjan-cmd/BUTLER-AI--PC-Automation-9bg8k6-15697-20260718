/**
 * Butler AI — NEXUS COMMAND CENTER · Settings / CFG Tab
 * Full redesign: dark holographic HUD aesthetic matching the rest of the app.
 * No orange. No iOS-style cards. Pure NEXUS cyberpunk.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, Alert, Platform,
  Animated, Dimensions, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { haptics } from '@/services/haptics';
import { notifyOnboardingReset } from './_layout';
import { resetOnboarding } from '@/services/onboardingState';
import { PageMascot } from '@/components/ui/PageMascot';
import { CompactPageHeader } from '@/components/ui/CompactPageHeader';

import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { logger } from '@/utils/logger';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

// ─── NEXUS TOKENS ────────────────────────────────────────────────────
const T = {
  bg:       '#010508',
  surface:  '#070D18',
  surfHi:   '#0C1728',
  cyan:     '#00E5FF',
  cyanDim:  'rgba(0,229,255,0.10)',
  green:    '#00FF88',
  greenDim: 'rgba(0,255,136,0.09)',
  amber:    '#FFB020',
  amberDim: 'rgba(255,176,32,0.09)',
  danger:   '#FF3333',
  dangerDim:'rgba(255,51,51,0.09)',
  purple:   '#CC44FF',
  purpleDim:'rgba(204,68,255,0.09)',
  text:     '#C8E4F0',
  textMid:  '#5A7A96',
  textDim:  '#243040',
  border:   'rgba(0,229,255,0.12)',
};

// ─── KEYS ───────────────────────────────────────────────────────────
const MODEL_KEY  = 'butler.model.v1';
const SYSTEM_KEY = 'butler.system.v1';
const ONBOARDING_DONE_KEY = '@butler_onboarding_done_v2';
const MULTI_KEYS = [
  '@butler_onboarding_done_v2', '@butler_onboarding_done_v1',
  'butler_onboarding_done', '@butler_welcome_complete_v1',
];

// ─── HUD CORNER BRACKETS ────────────────────────────────────────────
function HudCorners({ color, size = 10, t = 1.5 }: { color: string; size?: number; t?: number }) {
  return (
    <>
      <View style={{ position:'absolute', top:0, left:0,  width:size, height:size, borderTopWidth:t,    borderLeftWidth:t,   borderColor:color }} />
      <View style={{ position:'absolute', top:0, right:0, width:size, height:size, borderTopWidth:t,    borderRightWidth:t,  borderColor:color }} />
      <View style={{ position:'absolute', bottom:0, left:0,  width:size, height:size, borderBottomWidth:t, borderLeftWidth:t,  borderColor:color }} />
      <View style={{ position:'absolute', bottom:0, right:0, width:size, height:size, borderBottomWidth:t, borderRightWidth:t, borderColor:color }} />
    </>
  );
}

// ─── NEON SECTION LABEL ─────────────────────────────────────────────
function SectionLabel({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:8, marginTop:4 }}>
      <View style={{ width:3, height:13, borderRadius:2, backgroundColor:color }} />
      <MaterialCommunityIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontSize:9, fontWeight:'900', fontFamily:MONO, color, letterSpacing:1.8 }}>{label}</Text>
      <View style={{ flex:1, height:StyleSheet.hairlineWidth, backgroundColor:color+'30' }} />
    </View>
  );
}

// ─── NEON INPUT ──────────────────────────────────────────────────────
function NeonInput({ value, onChangeText, placeholder, multiline = false, accent = T.cyan, ...rest }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[ni.wrap, {
      borderColor: focused ? accent + '80' : T.border,
      backgroundColor: focused ? accent + '06' : T.surface,
    }]}>
      <HudCorners color={focused ? accent + '50' : T.border} size={7} t={1} />
      <TextInput
        style={[ni.input, multiline && { minHeight:90, textAlignVertical:'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.textDim}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance="dark"
        {...rest}
      />
    </View>
  );
}
const ni = StyleSheet.create({
  wrap:  { borderWidth:1.5, borderRadius:10, paddingHorizontal:14, paddingVertical:10, position:'relative', overflow:'hidden' },
  input: { color: T.text, fontSize:14, fontFamily:MONO, padding:0, includeFontPadding: false },
});

// ─── NEXUS BUTTON ────────────────────────────────────────────────────
function NexusButton({ label, icon, color, onPress, disabled, variant = 'solid' }: {
  label: string; icon: string; color: string;
  onPress: () => void; disabled?: boolean; variant?: 'solid' | 'outline' | 'ghost';
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue:0.97, duration:70,  useNativeDriver:true }),
      Animated.spring(scale, { toValue:1,    tension:300,  friction:10, useNativeDriver:true }),
    ]).start();
    try { haptics.medium(); } catch {}
    onPress();
  };
  const bg   = variant === 'solid' ? color : 'transparent';
  const bCol = color;
  const tCol = variant === 'solid' ? '#000' : color;
  return (
    <Animated.View style={{ transform:[{scale}] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[nb.btn, {
          backgroundColor: variant === 'solid' ? color : variant === 'ghost' ? color+'10' : 'transparent',
          borderColor: bCol + (variant === 'outline' ? '70' : variant === 'ghost' ? '35' : '00'),
          borderWidth: variant !== 'solid' ? 1.5 : 0,
          opacity: disabled ? 0.4 : 1,
        }]}
      >
        {variant !== 'solid' && <HudCorners color={bCol+'40'} size={7} t={1} />}
        <MaterialIcons name={icon as any} size={16} color={tCol} />
        <Text style={[nb.txt, { color: tCol }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const nb = StyleSheet.create({
  btn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, paddingHorizontal:20, borderRadius:10, position:'relative', overflow:'hidden' },
  txt: { fontSize:13, fontWeight:'900', fontFamily:MONO, letterSpacing:0.8 },
});

// ─── LINK ROW ────────────────────────────────────────────────────────
function LinkRow({ icon, iconLib = 'material', label, sub, color = T.cyan, onPress }: {
  icon: string; iconLib?: 'material' | 'community'; label: string; sub?: string; color?: string; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue:0.98, duration:60, useNativeDriver:true }),
      Animated.spring(scale,  { toValue:1,   tension:300, friction:10, useNativeDriver:true }),
    ]).start();
    try { haptics.light(); } catch {}
    onPress();
  };
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <Animated.View style={{ transform:[{scale}] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}
        style={[lr.row, { borderColor: color+'28', backgroundColor: color+'06' }]}>
        <View style={[lr.iconBox, { backgroundColor:color+'15', borderColor:color+'40' }]}>
          <Icon name={icon as any} size={16} color={color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={[lr.label, { color: T.text }]}>{label}</Text>
          {sub ? <Text style={[lr.sub, { color: T.textMid }]}>{sub}</Text> : null}
        </View>
        <MaterialIcons name="chevron-right" size={16} color={color + '80'} />
      </TouchableOpacity>
    </Animated.View>
  );
}
const lr = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, paddingHorizontal:14, borderRadius:12, borderWidth:1.5, marginBottom:6, position:'relative', overflow:'hidden' },
  iconBox:{ width:36, height:36, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  label:  { fontSize:13, fontWeight:'700', fontFamily:MONO },
  sub:    { fontSize:10, fontFamily:MONO, marginTop:2 },
});

// ─── STAT CELL ───────────────────────────────────────────────────────
function StatCell({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <View style={[sc.cell, { borderColor:color+'30', backgroundColor:color+'08' }]}>
      <Text style={[sc.val, { color }]}>{val}</Text>
      <Text style={[sc.label, { color:color+'80' }]}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  cell:  { flex:1, alignItems:'center', borderWidth:1.5, borderRadius:10, paddingVertical:10, gap:3 },
  val:   { fontSize:18, fontWeight:'900', fontFamily:MONO },
  label: { fontSize:8, fontFamily:MONO, letterSpacing:0.8 },
});

// ─── TOGGLE ROW ──────────────────────────────────────────────────────
function ToggleRow({ icon, label, sub, value, onToggle, color = T.cyan }: {
  icon: string; label: string; sub?: string; value: boolean; onToggle: (v: boolean) => void; color?: string;
}) {
  return (
    <View style={[tr.row, { borderColor: value ? color+'40' : T.border, backgroundColor: value ? color+'06' : T.surface }]}>
      <HudCorners color={value ? color+'30' : T.border} size={6} t={1} />
      <MaterialCommunityIcons name={icon as any} size={16} color={value ? color : T.textMid} style={{ flexShrink:0 }} />
      <View style={{ flex:1 }}>
        <Text style={[tr.label, { color: value ? T.text : T.textMid }]}>{label}</Text>
        {sub ? <Text style={tr.sub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { try { haptics.light(); } catch {}; onToggle(v); }}
        trackColor={{ false:'rgba(255,255,255,0.08)', true: color+'60' }}
        thumbColor={value ? color : T.textDim}
        ios_backgroundColor="rgba(255,255,255,0.08)"
      />
    </View>
  );
}
const tr = StyleSheet.create({
  row:   { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, paddingHorizontal:14, borderRadius:12, borderWidth:1.5, marginBottom:6, position:'relative', overflow:'hidden' },
  label: { fontSize:13, fontWeight:'700', fontFamily:MONO },
  sub:   { fontSize:10, fontFamily:MONO, color:T.textMid, marginTop:2 },
});

// ─── NEXUS CARD ──────────────────────────────────────────────────────
function NCard({ accent = T.cyan, children, style }: { accent?: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[ncard.card, { borderColor:accent+'35' }, style]}>
      <View style={[ncard.topBar, { backgroundColor:accent }]} />
      <HudCorners color={accent+'40'} size={8} t={1} />
      <View style={{ padding:14 }}>{children}</View>
    </View>
  );
}
const ncard = StyleSheet.create({
  card:   { borderWidth:1.5, borderRadius:12, backgroundColor:T.surface, overflow:'hidden', marginBottom:10, position:'relative' },
  topBar: { height:2 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────────
export default function SettingsScreen() {
  return (
    <TabErrorBoundary name="Settings">
      <SettingsScreenInner />
    </TabErrorBoundary>
  );
}

function SettingsScreenInner() {
  const insets = useSafeAreaInsets();

  const [model,      setModel]      = useState('llama3.2');
  const [system,     setSystem]     = useState('');
  const [saved,      setSaved]      = useState(false);
  const [hapticsOn,  setHapticsOn]  = useState(true);
  const [autoReconn, setAutoReconn] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [[, m],[, s],[, h],[, ar]] = await AsyncStorage.multiGet([
          MODEL_KEY, SYSTEM_KEY, 'butler.haptics.v1', 'butler.autoreconn.v1',
        ]);
        if (m) setModel(m);
        if (s) setSystem(s);
        if (h !== null) setHapticsOn(h !== '0');
        if (ar !== null) setAutoReconn(ar !== '0');
      } catch {}
    })();
  }, []);

  const onSave = useCallback(async () => {
    try { haptics.success(); } catch {}
    await AsyncStorage.multiSet([
      [MODEL_KEY,  model.trim() || 'llama3.2'],
      [SYSTEM_KEY, system],
      ['butler.haptics.v1',   hapticsOn  ? '1' : '0'],
      ['butler.autoreconn.v1', autoReconn ? '1' : '0'],
    ]).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }, [model, system, hapticsOn, autoReconn]);

  const handleShareDiagnosticLog = useCallback(async () => {
    try {
      haptics.medium();
      const entries = logger.getEntries();
      const lines = entries.map(e => {
        const t = new Date(e.ts).toISOString();
        return `[${t}] ${e.level.toUpperCase()}: ${e.msg}`;
      });
      const header =
        `Butler AI Diagnostic Log\n` +
        `Generated: ${new Date().toISOString()}\n` +
        `App version: 7.3\n` +
        `Entries: ${entries.length}\n` +
        `--------------------------------\n`;
      const body = lines.length ? lines.join('\n') : '(no log entries yet — use the app and try again)';
      await Share.share({
        title: 'Butler AI Diagnostic Log',
        message: header + body,
      });
    } catch (err) {
      logger.error('[Settings] Failed to share diagnostic log:', err);
    }
  }, []);

  const onReplayOnboarding = useCallback(() => {
    Alert.alert(
      'REPLAY TUTORIAL',
      'Restart the full onboarding flow from step 1?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RESTART NOW',
          onPress: async () => {
            try { haptics.heavy(); } catch {}
            logger.info('[Settings] onReplayOnboarding START');
            try {
              // 1. Wipe EVERY onboarding key including consent/terms keys
              await resetOnboarding();
              logger.info('[Settings] resetOnboarding() done');

              // Verify: read canonical key after wipe
              const check = await AsyncStorage.getItem('@butler_onboarding_done_v2').catch(() => '__err__');
              logger.info('[Settings] post-wipe key check:', check ?? 'null');

              // 2. Signal the layout to flip isDone → false
              notifyOnboardingReset();
              logger.info('[Settings] notifyOnboardingReset() done');

              // 3. Short delay so layout re-renders before navigation
              await new Promise<void>(r => setTimeout(r, 80));

              // 4. Force navigate — try replace first, fall back to push
              try {
                router.replace('/(tabs)/onboarding' as any);
                logger.info('[Settings] router.replace done');
              } catch (navErr: any) {
                logger.warn('[Settings] replace failed, trying navigate:', navErr?.message);
                try { router.navigate('/(tabs)/onboarding' as any); } catch {}
              }
            } catch (err: any) {
              logger.error('[Settings] onReplayOnboarding FAILED:', err?.message);
              // Last resort: navigate anyway
              try { router.replace('/(tabs)/onboarding' as any); } catch {}
            }
          },
        },
      ]
    );
  }, []);

  const onReset = useCallback(() => {
    Alert.alert(
      'RESET ALL DATA',
      'This permanently clears all server config, model settings, and preferences. This CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: async () => {
            try { haptics.heavy(); } catch {}
            const keys = [
              MODEL_KEY, SYSTEM_KEY, ONBOARDING_DONE_KEY,
              '@butler_onboarding_done_v2', '@butler_welcome_complete_v1',
              'butler.haptics.v1', 'butler.autoreconn.v1',
              'commandcube_server_ip', 'commandcube_server_port',
              'commandcube_session_token', 'commandcube_device_id',
            ];
            await AsyncStorage.multiRemove(keys).catch(() => {});
            setModel('llama3.2'); setSystem('');
            setHapticsOn(true); setAutoReconn(true);
            try {
              const { serverConnection } = await import('@/services/serverConnection');
              await serverConnection.clearAll().catch(() => {});
            } catch {}
          },
        },
      ]
    );
  }, []);

  const openURL = (url: string) => {
    import('react-native').then(({ Linking }) => Linking.openURL(url).catch(() => {}));
  };

  return (
    <View style={{ flex:1, backgroundColor:T.bg }}>
      <CompactPageHeader
        accent={T.amber}
        icon="tune"
        iconLib="material"
        title="CONFIG"
        badge="CFG"
        badgeColor={T.amber}
        safeTop={insets.top}
        rightAction={{ icon: 'history', onPress: () => {}, color: T.amber }}
        extraRow={
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 8 }}>
            <PageMascot page="settings" size="sm" showBubble />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: T.amber + '90', letterSpacing: 1.5, flex: 1 }}>BUTLER AI · CONFIGURATION CENTER</Text>
            <View style={{ borderWidth: 1, borderRadius: 6, borderColor: T.amber + '40', backgroundColor: T.amber + '0A', paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: T.amber }}>v7.3</Text>
            </View>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:14, paddingTop:14, paddingBottom: insets.bottom + 120 }}
      >
        {/* ── AI MODEL ── */}
        <SectionLabel label="AI MODEL" icon="robot-outline" color={T.cyan} />
        <NCard accent={T.cyan}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
            <MaterialCommunityIcons name="brain" size={14} color={T.cyan} />
            <Text style={{ fontSize:10, fontWeight:'900', fontFamily:MONO, color:T.cyan }}>DEFAULT OLLAMA MODEL</Text>
          </View>
          <NeonInput
            value={model}
            onChangeText={(v: string) => { setModel(v); setSaved(false); }}
            placeholder="llama3.2"
            accent={T.cyan}
          />
          <Text style={{ fontSize:10, fontFamily:MONO, color:T.textMid, marginTop:8, lineHeight:15 }}>
            Any model installed in your Ollama instance — e.g. <Text style={{ color:T.cyan }}>llama3.2</Text>, <Text style={{ color:T.cyan }}>qwen2.5</Text>, <Text style={{ color:T.cyan }}>mistral</Text>
          </Text>
        </NCard>

        {/* ── SYSTEM PROMPT ── */}
        <SectionLabel label="SYSTEM PROMPT" icon="text-box-outline" color={T.purple} />
        <NCard accent={T.purple}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
            <MaterialCommunityIcons name="script-text" size={14} color={T.purple} />
            <Text style={{ fontSize:10, fontWeight:'900', fontFamily:MONO, color:T.purple }}>BUTLER BEHAVIOR DIRECTIVE</Text>
            <View style={{ borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:2, borderColor:T.purple+'40' }}>
              <Text style={{ fontSize:7, fontFamily:MONO, color:T.purple }}>OPTIONAL</Text>
            </View>
          </View>
          <NeonInput
            value={system}
            onChangeText={(v: string) => { setSystem(v); setSaved(false); }}
            placeholder="Optional — guide Butler's behavior..."
            multiline
            accent={T.purple}
          />
        </NCard>

        {/* ── SYSTEM PREFERENCES ── */}
        <SectionLabel label="SYSTEM PREFERENCES" icon="cog-outline" color={T.amber} />
        <View style={{ marginBottom:10 }}>
          <ToggleRow
            icon="vibrate"
            label="HAPTIC FEEDBACK"
            sub="Tactile responses on interactions"
            value={hapticsOn}
            onToggle={setHapticsOn}
            color={T.amber}
          />
          <ToggleRow
            icon="wifi-sync"
            label="AUTO RECONNECT"
            sub="Silently reconnect on app resume"
            value={autoReconn}
            onToggle={setAutoReconn}
            color={T.cyan}
          />
        </View>

        {/* ── SAVE BUTTON ── */}
        <NexusButton
          label={saved ? 'SAVED ✓' : 'SAVE CONFIG'}
          icon={saved ? 'check-circle' : 'save'}
          color={saved ? T.green : T.cyan}
          onPress={onSave}
        />

        <View style={s.divider} />

        {/* ── SECURITY & CONNECTION ── */}
        <SectionLabel label="SECURITY & CONNECTION" icon="shield-lock-outline" color={T.green} />
        <NCard accent={T.green} style={{ marginBottom:10 }}>
          <View style={{ flexDirection:'row', gap:8 }}>
            <StatCell val="256" label="BIT AES"   color={T.cyan} />
            <StatCell val="SHA" label="HMAC-256"  color={T.green} />
            <StatCell val="LAN" label="ONLY"      color={T.amber} />
            <StatCell val="0"   label="CLOUD"     color={T.danger} />
          </View>
          <Text style={{ fontSize:9, fontFamily:MONO, color:T.textMid, marginTop:10, lineHeight:14, textAlign:'center' }}>
            All traffic stays on your local network · Device UUID signed auth · Zero telemetry
          </Text>
        </NCard>

        {/* ── LEGAL & HELP ── */}
        <SectionLabel label="LEGAL & HELP" icon="gavel" color={T.amber} />
        <View style={{ marginBottom:10 }}>
          <LinkRow
            icon="shield-star-outline"
            iconLib="community"
            label="SECURITY & TRUST"
            sub="Zero cloud · No tracking · How your data stays safe"
            color={T.cyan}
            onPress={() => router.push('/security-trust' as any)}
          />
          <LinkRow
            icon="bug-report"
            iconLib="material"
            label="LAST CRASH REPORT"
            sub="Startup crash log · timestamps · stack trace · clear action"
            color={T.danger}
            onPress={() => router.push('/crash-report' as any)}
          />
          <LinkRow
            icon="bug-report"
            iconLib="material"
            label="SHARE DIAGNOSTIC LOG"
            sub="Export last 100 log entries — stays on device until you share"
            color={T.purple}
            onPress={handleShareDiagnosticLog}
          />
          <LinkRow
            icon="school"
            iconLib="material"
            label="REPLAY TUTORIAL"
            sub="Restart full onboarding flow"
            color={T.amber}
            onPress={onReplayOnboarding}
          />
          <LinkRow
            icon="shield-check"
            iconLib="community"
            label="PRIVACY POLICY"
            sub="GDPR compliant · Device UUID only"
            color={T.green}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/')}
          />
          <LinkRow
            icon="file-document-outline"
            iconLib="community"
            label="TERMS OF SERVICE"
            sub="18+ · Personal PC use only"
            color={T.amber}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#terms-of-service')}
          />
          <LinkRow
            icon="shield-lock-outline"
            iconLib="community"
            label="DATA SAFETY"
            sub="Google Play form · Camera = QR only"
            color={T.purple}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#data-safety')}
          />
          <LinkRow
            icon="delete-forever"
            iconLib="community"
            label="DATA DELETION"
            sub="GDPR right to erasure"
            color={T.danger}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#data-deletion')}
          />
        </View>



        {/* ── COSMETIC THEMES ── */}
        <SectionLabel label="THEMES & COSMETICS" icon="palette" color={T.purple} />
        <View style={{ marginBottom:10 }}>
          <LinkRow
            icon="palette"
            iconLib="material"
            label="COSMETIC THEME PACKS"
            sub="12 neon themes · Preview & apply instantly"
            color={T.purple}
            onPress={() => { (global as any).__butlerSwitchTab?.('cosmetic'); }}
          />
          <NCard accent={T.purple} style={{ marginBottom:0 }}>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
              {[
                { label:'NEXUS', color:'#00E5FF' },
                { label:'PHANTOM', color:'#CC44FF' },
                { label:'MATRIX', color:'#00FF88' },
                { label:'AMBER', color:'#FFB020' },
                { label:'RUBY', color:'#FF3344' },
                { label:'SAKURA', color:'#FF44AA' },
              ].map((th, i) => (
                <View key={i} style={{ borderWidth:1.5, borderRadius:8, paddingHorizontal:10, paddingVertical:5,
                  borderColor:th.color+'50', backgroundColor:th.color+'0C' }}>
                  <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:th.color }}>{th.label}</Text>
                </View>
              ))}
              <Text style={{ fontFamily:MONO, fontSize:9, color:T.textMid, alignSelf:'center', marginLeft:2 }}>+6 more</Text>
            </View>
            <Text style={{ fontFamily:MONO, fontSize:9, color:T.textMid, marginTop:8, lineHeight:14 }}>
              All themes free · FX settings per-theme · Live preview before applying
            </Text>
          </NCard>
        </View>

        {/* ── DANGER ZONE ── */}
        <SectionLabel label="DANGER ZONE" icon="alert-octagon" color={T.danger} />
        <NCard accent={T.danger} style={{ marginBottom:6 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={T.danger} />
            <Text style={{ fontSize:11, fontWeight:'900', fontFamily:MONO, color:T.danger, flex:1 }}>
              IRREVERSIBLE ACTIONS
            </Text>
          </View>
          <NexusButton
            label="RESET ALL DATA"
            icon="delete-sweep"
            color={T.danger}
            variant="outline"
            onPress={onReset}
          />
        </NCard>

        {/* ── VERSION FOOTER ── */}
        <View style={s.footer}>
          <View style={[s.footerLine, { backgroundColor:T.cyan }]} />
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:10 }}>
            <MaterialCommunityIcons name="robot-happy" size={14} color={T.textMid} />
            <Text style={s.versionTxt}>BUTLER AI · v7.3 · NEXUS COMMAND CENTER</Text>
            <MaterialCommunityIcons name="shield-check" size={14} color={T.textMid} />
          </View>
          <Text style={s.buildTxt}>ZERO CLOUD · 100% LOCAL · AES-256 ENCRYPTED</Text>
          <View style={[s.footerLine, { backgroundColor:T.cyan }]} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  divider:    { height:1, backgroundColor:T.border, marginVertical:16 },
  footer:     { marginTop:20, alignItems:'center', gap:4 },
  footerLine: { height:1.5, width:120, borderRadius:1, opacity:0.3 },
  versionTxt: { fontSize:9, fontFamily:MONO, color:T.textMid, letterSpacing:1 },
  buildTxt:   { fontSize:8, fontFamily:MONO, color:T.textDim, letterSpacing:0.8, marginBottom:4 },
});
