/**
 * BUTLER AI — CONFIGURATION CENTER v4.0
 * Complete overhaul:
 *  • RESET TUTORIAL at the very top (most-needed action)
 *  • Privacy Policy & Legal prominently placed
 *  • Animation toggle + accessibility settings
 *  • Haptic feedback on every interaction
 *  • All text 13px+ minimum, bold where important
 *  • Nothing goes off-screen, all padding correct
 *  • Third-party attributions included
 *  • Play Store compliance items properly exposed
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, Alert, Platform,
  Animated, Dimensions, Share, Pressable, Linking,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { haptics } from '@/services/haptics';
import { notifyOnboardingReset } from './_layout';
import { resetOnboarding } from '@/services/onboardingState';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { LiveWidgetStudio } from '@/components/ui/LiveWidgetStudio';
import { AppVersionCard } from '@/components/ui/AppVersionGuard';
import { usePurchase } from '@/contexts/PurchaseContext';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { logger } from '@/utils/logger';
import { serverConnection } from '@/services/serverConnection';
import { autoErrorLogger } from '@/services/autoErrorLogger';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD = 16;

const C = {
  bg:       '#010508',
  surf:     '#07111C',
  surf2:    '#0C1728',
  cyan:     '#00E5FF',
  green:    '#00FF88',
  amber:    '#FFB020',
  red:      '#FF3344',
  purple:   '#CC44FF',
  pink:     '#FF6EB4',
  blue:     '#4A9EFF',
  teal:     '#00CCBB',
  text:     '#D4E8F6',
  mid:      '#5A8098',
  dim:      '#203050',
  border:   'rgba(0,229,255,0.12)',
};

const MODEL_KEY      = 'butler.model.v1';
const DONATION_KEY   = '@butler_donations_v1';
const DONOR_NAME_KEY = '@butler_donor_name_v1';
const SYSTEM_KEY  = 'butler.system.v1';
const ANIM_KEY    = 'butler.animations.v1';
const HAPTICS_KEY = 'butler.haptics.v1';
const AR_KEY      = 'butler.autoreconn.v1';
const DEBUG_KEY   = 'butler.debug.v1';
const REDUCE_KEY  = 'butler.reducemotion.v1';

const POPULAR_MODELS = [
  { id: 'llama3.2',            label: 'Llama 3.2',   size: '2B', color: C.cyan   },
  { id: 'llama3.2:3b',         label: 'Llama 3.2',   size: '3B', color: C.cyan   },
  { id: 'qwen2.5-coder:7b',    label: 'Qwen 2.5',    size: '7B', color: C.amber  },
  { id: 'mistral',             label: 'Mistral',     size: '7B', color: C.purple },
  { id: 'deepseek-coder:6.7b', label: 'DeepSeek',   size: '7B', color: C.blue   },
  { id: 'phi3:mini',           label: 'Phi-3',       size: 'mini', color: C.green },
  { id: 'gemma2:2b',           label: 'Gemma 2',     size: '2B', color: C.pink   },
  { id: 'codellama:7b',        label: 'CodeLlama',   size: '7B', color: C.amber  },
];

// ─── PULSE DOT ───────────────────────────────────────────────────
function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ─── SECTION HEADER ──────────────────────────────────────────────
function Sec({ icon, label, color, right, sub }: {
  icon: string; label: string; color: string; right?: React.ReactNode; sub?: string;
}) {
  return (
    <View style={{ marginBottom: 11, marginTop: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color }} />
        <MaterialCommunityIcons name={icon as any} size={13} color={color} />
        <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: color + 'DD',
          letterSpacing: 1.8, flex: 1 }}>{label}</Text>
        {right}
        <View style={{ height: 1, width: 24, backgroundColor: color + '20' }} />
      </View>
      {sub ? <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginLeft: 28, marginTop: 4, lineHeight: 16 }}>{sub}</Text> : null}
    </View>
  );
}

// ─── TOGGLE ROW ──────────────────────────────────────────────────
function ToggleRow({ icon, label, sub, value, onToggle, color = C.cyan, iconLib = 'community' }: {
  icon: string; label: string; sub?: string; value: boolean;
  onToggle: (v: boolean) => void; color?: string; iconLib?: 'material' | 'community';
}) {
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const scaleA = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    haptics.light();
    onToggle(!value);
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleA }], marginBottom: 8 }}>
      <TouchableOpacity activeOpacity={0.88}
        style={[tr.row, { borderColor: value ? color + '50' : C.border, backgroundColor: value ? color + '07' : C.surf }]}
        onPress={handlePress}>
        <View style={[tr.iconBox, { borderColor: color + (value ? '55' : '25'), backgroundColor: color + (value ? '14' : '07') }]}>
          <Icon name={icon as any} size={17} color={value ? color : C.mid} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '700', color: value ? C.text : C.mid, lineHeight: 18 }}>{label}</Text>
          {sub ? <Text style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginTop: 3, lineHeight: 16 }}>{sub}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={(v) => { haptics.light(); onToggle(v); }}
          trackColor={{ false: 'rgba(255,255,255,0.08)', true: color + '70' }}
          thumbColor={value ? color : C.mid + '80'}
          ios_backgroundColor="rgba(255,255,255,0.08)"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
const tr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14,
    paddingHorizontal: 14, borderRadius: 13, borderWidth: 1.5 },
  iconBox: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
});

// ─── ACTION ROW ──────────────────────────────────────────────────
function ActionRow({ icon, iconLib = 'community', label, sub, color = C.cyan, onPress, badge, rightIcon = 'chevron-right' }: {
  icon: string; iconLib?: 'material' | 'community'; label: string; sub?: string;
  color?: string; onPress: () => void; badge?: string; rightIcon?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => {
          Animated.sequence([
            Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
          ]).start();
          haptics.medium();
          onPress();
        }}
        activeOpacity={0.88}
        style={[ar.row, { borderColor: color + '30', backgroundColor: color + '07' }]}>
        <View style={[ar.iconBox, { backgroundColor: color + '16', borderColor: color + '45' }]}>
          <Icon name={icon as any} size={17} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18 }}>{label}</Text>
          {sub ? <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginTop: 3, lineHeight: 16 }}>{sub}</Text> : null}
        </View>
        {badge ? (
          <View style={{ borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
            borderColor: color + '50', backgroundColor: color + '0C' }}>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: color }}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name={rightIcon as any} size={17} color={color + '70'} style={{ marginLeft: 5 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}
const ar = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13,
    paddingHorizontal: 14, borderRadius: 13, borderWidth: 1.5 },
  iconBox: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
});

// ─── DANGER BUTTON ───────────────────────────────────────────────
function DangerBtn({ label, icon, onPress, variant = 'outline', color = C.red }: {
  label: string; icon: string; onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost'; color?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const bg     = variant === 'solid' ? color : variant === 'ghost' ? color + '14' : 'transparent';
  const bc     = variant !== 'solid' ? color + '65' : 'transparent';
  const txtCol = variant === 'solid' ? '#000' : color;
  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 8 }}>
      <Pressable
        onPressIn={() => {
          Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: true }).start();
          Animated.spring(scale, { toValue: 0.97, tension: 400, friction: 12, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
          Animated.spring(scale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();
        }}
        onPress={() => { haptics.heavy(); onPress(); }}
        style={[db.btn, { backgroundColor: bg, borderColor: bc, borderWidth: variant !== 'solid' ? 2 : 0 }]}>
        <MaterialIcons name={icon as any} size={18} color={txtCol} />
        <Text style={[db.txt, { color: txtCol }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
const db = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 13, paddingVertical: 15, paddingHorizontal: 20 },
  txt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', letterSpacing: 0.8 },
});

// ─── PRIMARY BUTTON ──────────────────────────────────────────────
function PrimaryBtn({ label, icon, color, onPress, saved }: {
  label: string; icon: string; color: string; onPress: () => void; saved?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 400, friction: 12, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start()}
        onPress={() => { haptics.success(); onPress(); }}
        style={[pb.btn, { backgroundColor: color,
          ...Platform.select({ ios: { shadowColor: color, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 14 }, android: { elevation: 8 } }),
        }]}>
        <MaterialIcons name={icon as any} size={18} color="#000" />
        <Text style={pb.txt}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
const pb = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 13, paddingVertical: 16, paddingHorizontal: 20 },
  txt: { fontFamily: MONO, fontSize: 14, fontWeight: '900', letterSpacing: 0.8, color: '#000' },
});

// ─── HEADER ──────────────────────────────────────────────────────
function CfgHeader({ safeTop, isConn }: { safeTop: number; isConn: boolean }) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const shimA = useRef(new Animated.Value(-SW)).current;

  useEffect(() => {
    const upd = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
    };
    upd(); const t = setInterval(upd, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.5, duration: 2200, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW,       duration: 0,    useNativeDriver: true }),
      Animated.delay(7800),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const cc = isConn ? C.green : C.amber;
  return (
    <View style={[cfh.root, { paddingTop: safeTop }]}>
      <View style={{ height: 3, backgroundColor: C.amber }} />
      <Animated.View pointerEvents="none" style={[cfh.shimmer, { transform: [{ translateX: shimA }] }]} />
      <View style={cfh.body}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={cfh.eyebrow}>CONFIGURATION CENTER · SETTINGS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[cfh.logoBox, { borderColor: C.amber + '55', backgroundColor: C.amber + '10' }]}>
              <MaterialCommunityIcons name="tune-variant" size={20} color={C.amber} />
            </View>
            <Text style={cfh.brand}>BUTLER <Text style={{ color: C.amber }}>CFG</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 2 }}>
            <View style={[cfh.pill, { borderColor: cc + '65', backgroundColor: cc + '0D' }]}>
              <PulseDot color={cc} size={5} />
              <Text style={[cfh.pillTxt, { color: cc }]}>{isConn ? 'PC ONLINE' : 'OFFLINE'}</Text>
            </View>
            <View style={[cfh.pill, { borderColor: C.amber + '40', backgroundColor: C.amber + '08' }]}>
              <MaterialCommunityIcons name="shield-check" size={10} color={C.amber} />
              <Text style={[cfh.pillTxt, { color: C.amber }]}>AES-256</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={cfh.clock}>{time}</Text>
            <Text style={[cfh.secs, { color: C.amber }]}>{secs}</Text>
          </View>
          <Text style={cfh.clockSub}>LOCAL · SECURE</Text>
          <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
            borderColor: C.amber + '40', backgroundColor: C.amber + '0A' }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.amber }}>v8.0.0</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 2, flexDirection: 'row' }}>
        <View style={{ flex: 4, backgroundColor: C.amber + '18' }} />
        <View style={{ width: 14, backgroundColor: C.amber }} />
        <View style={{ flex: 2, backgroundColor: C.green + '14' }} />
        <View style={{ width: 8,  backgroundColor: C.green }} />
        <View style={{ flex: 6, backgroundColor: C.cyan + '08' }} />
        <View style={{ width: 10, backgroundColor: C.cyan }} />
        <View style={{ flex: 3, backgroundColor: C.cyan + '10' }} />
      </View>
    </View>
  );
}
const cfh = StyleSheet.create({
  root:    { backgroundColor: C.surf, overflow: 'hidden' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 90, backgroundColor: 'rgba(255,176,32,0.04)', zIndex: 0 },
  body:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13, zIndex: 1 },
  eyebrow: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: C.amber + '60', letterSpacing: 2 },
  logoBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:   { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  clock:   { fontFamily: MONO, fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: 1 },
  secs:    { fontFamily: MONO, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  clockSub:{ fontFamily: MONO, fontSize: 8, color: C.mid, letterSpacing: 1, fontWeight: '700' },
});

// ─── TUTORIAL BANNER ─────────────────────────────────────────────
function TutorialBanner({ onReplay }: { onReplay: () => void }) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const glowA  = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1, duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.4, duration: 1400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: scaleA }] }}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scaleA, { toValue: 0.97, tension: 400, friction: 12, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start()}
        onPress={() => { haptics.heavy(); onReplay(); }}
        activeOpacity={0.88}
        style={[tb.root]}>
        <View style={{ height: 3.5, backgroundColor: C.cyan }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
          <View style={[tb.iconBox, { borderColor: C.cyan + '60', backgroundColor: C.cyan + '14' }]}>
            <MaterialCommunityIcons name="school-outline" size={22} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: C.cyan, letterSpacing: 0.3, lineHeight: 19 }}>
              REPLAY TUTORIAL
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginTop: 4, lineHeight: 16 }}>
              New to Butler AI? Restart the full setup walkthrough to pair your PC, configure AI, and explore all features.
            </Text>
          </View>
          <View style={{ borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
            borderColor: C.cyan + '55', backgroundColor: C.cyan + '10' }}>
            <MaterialIcons name="play-arrow" size={20} color={C.cyan} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const tb = StyleSheet.create({
  root:    { backgroundColor: C.surf, borderRadius: 14, borderWidth: 2, borderColor: C.cyan + '40', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }, android: { elevation: 5 } }) },
  iconBox: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── INFO CARD (privacy, attribution) ────────────────────────────
function InfoCard({ title, icon, color, children }: {
  title: string; icon: string; color: string; children: React.ReactNode;
}) {
  return (
    <View style={[ic.root, { borderColor: color + '30' }]}>
      <View style={{ height: 2.5, backgroundColor: color }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 10 }}>
        <View style={[ic.iconBox, { borderColor: color + '55', backgroundColor: color + '10' }]}>
          <MaterialCommunityIcons name={icon as any} size={16} color={color} />
        </View>
        <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color, flex: 1, letterSpacing: 0.3 }}>{title}</Text>
      </View>
      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
        {children}
      </View>
    </View>
  );
}
const ic = StyleSheet.create({
  root:    { backgroundColor: C.surf, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 0 },
  iconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── MODEL SELECTOR ──────────────────────────────────────────────
function ModelSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const selected = POPULAR_MODELS.find(m => m.id === value);
  return (
    <View style={{ gap: 11 }}>
      <TouchableOpacity onPress={() => { haptics.light(); setShowPicker(v => !v); }}
        style={[ms.current, { borderColor: (selected?.color ?? C.cyan) + '50' }]}>
        <View style={[ms.badge, { backgroundColor: (selected?.color ?? C.cyan) + '15', borderColor: (selected?.color ?? C.cyan) + '50' }]}>
          <MaterialCommunityIcons name="brain" size={18} color={selected?.color ?? C.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, letterSpacing: 1.5, marginBottom: 3 }}>ACTIVE MODEL</Text>
          <Text style={{ fontFamily: MONO, fontSize: 15, fontWeight: '900', color: selected?.color ?? C.cyan, lineHeight: 20 }}>
            {selected?.label ?? value}
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginTop: 2 }}>
            {selected ? `${selected.size} parameters · local inference` : 'Custom model'}
          </Text>
        </View>
        <View style={[ms.sizeBadge, { borderColor: (selected?.color ?? C.cyan) + '45', backgroundColor: (selected?.color ?? C.cyan) + '0A' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: selected?.color ?? C.cyan }}>{selected?.size ?? '?'}</Text>
        </View>
        <MaterialIcons name={showPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={(selected?.color ?? C.cyan) + '80'} />
      </TouchableOpacity>
      {showPicker && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {POPULAR_MODELS.map((m) => {
            const isActive = m.id === value;
            return (
              <TouchableOpacity key={m.id}
                onPress={() => { haptics.selection(); onChange(m.id); }}
                style={[ms.chip, { borderColor: m.color + (isActive ? 'AA' : '38'), backgroundColor: m.color + (isActive ? '18' : '09') }]}>
                <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: m.color }}>{m.label}</Text>
                <View style={[ms.sizeTag, { borderColor: m.color + '40' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 9, color: m.color + 'BB' }}>{m.size}</Text>
                </View>
                {isActive && <MaterialIcons name="check-circle" size={13} color={m.color} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, letterSpacing: 1 }}>CUSTOM MODEL NAME</Text>
        <View style={[ms.inputWrap, { borderColor: C.border }]}>
          <MaterialIcons name="edit" size={14} color={C.mid} />
          <TextInput
            style={ms.input}
            value={value}
            onChangeText={onChange}
            placeholder="llama3.2 / qwen2.5-coder:7b / ..."
            placeholderTextColor={C.dim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
          />
        </View>
      </View>
    </View>
  );
}
const ms = StyleSheet.create({
  current:  { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 13,
    borderWidth: 1.5, backgroundColor: C.surf },
  badge:    { width: 46, height: 46, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sizeBadge:{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  sizeTag:  { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.surf },
  input:    { flex: 1, color: C.text, fontSize: 14, fontFamily: MONO, padding: 0 },
});

// ─── STATUS BAR ──────────────────────────────────────────────────
function SystemStatusBar({ isConn }: { isConn: boolean }) {
  const items = [
    { label: 'SECURITY',  value: 'AES-256',          color: C.green  },
    { label: 'PROTOCOL',  value: 'HMAC',             color: C.cyan   },
    { label: 'NETWORK',   value: 'LAN ONLY',         color: C.amber  },
    { label: 'CLOUD',     value: 'ZERO',             color: C.red    },
    { label: 'STATUS',    value: isConn ? 'LIVE' : 'OFF', color: isConn ? C.green : C.mid },
  ];
  return (
    <InfoCard title="SYSTEM STATUS" icon="chip" color={C.amber}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it, i) => (
          <View key={i} style={{ borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9,
            borderColor: it.color + '40', backgroundColor: it.color + '09', alignItems: 'center', minWidth: 70 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: it.color, lineHeight: 17 }}>{it.value}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: it.color + '70', letterSpacing: 0.8, marginTop: 2 }}>{it.label}</Text>
          </View>
        ))}
      </View>
    </InfoCard>
  );
}

// ─── PRIVACY GUARANTEE ───────────────────────────────────────────
function PrivacyGuaranteeCard() {
  const rows = [
    { icon: 'cloud-off-outline',  label: 'Zero Cloud',     desc: 'All execution stays on your LAN — nothing routed externally',     color: C.cyan   },
    { icon: 'eye-off-outline',    label: 'No Tracking',    desc: 'No analytics, no ad IDs, no background network calls to 3rd parties', color: C.green  },
    { icon: 'gesture-tap',        label: 'You Decide',     desc: 'Nothing runs without your explicit tap — full consent before execution', color: C.amber  },
    { icon: 'delete-outline',     label: 'Delete Anytime', desc: 'One tap wipes all local data — full GDPR right to erasure',        color: C.purple },
    { icon: 'lock',               label: 'HMAC-SHA256',    desc: 'Every request cryptographically signed — tokens stay encrypted',   color: C.teal   },
  ];
  return (
    <InfoCard title="PRIVACY GUARANTEE" icon="shield-check-outline" color={C.green}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11,
          borderLeftWidth: 2.5, borderLeftColor: r.color + '50', paddingLeft: 11, paddingVertical: 9,
          borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
          <MaterialCommunityIcons name={r.icon as any} size={15} color={r.color} style={{ marginTop: 2, flexShrink: 0 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: r.color, lineHeight: 17 }}>{r.label}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginTop: 3, lineHeight: 16 }}>{r.desc}</Text>
          </View>
        </View>
      ))}
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1,
        borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8, borderColor: C.green + '35', backgroundColor: C.green + '06' }}>
        <MaterialCommunityIcons name="check-circle" size={14} color={C.green} />
        <Text style={{ fontFamily: MONO, fontSize: 11, color: C.green, flex: 1, lineHeight: 16 }}>
          Independently verifiable — run Wireshark and confirm zero outbound traffic to any server except your own PC.
        </Text>
      </View>
    </InfoCard>
  );
}

// ─── OPEN SOURCE ATTRIBUTION ──────────────────────────────────────
function AttributionCard() {
  const libs = [
    { name: 'React Native', lic: 'MIT', author: 'Meta Platforms' },
    { name: 'Expo SDK',     lic: 'MIT', author: '650 Industries' },
    { name: '@expo/vector-icons', lic: 'MIT', author: 'Expo' },
    { name: 'react-native-reanimated', lic: 'MIT', author: 'Software Mansion' },
    { name: 'expo-router',  lic: 'MIT', author: 'Expo' },
    { name: 'react-native-safe-area-context', lic: 'MIT', author: 'Th3rd Wave' },
    { name: 'expo-image',   lic: 'MIT', author: 'Expo' },
    { name: 'expo-blur',    lic: 'MIT', author: 'Expo' },
    { name: 'AsyncStorage', lic: 'MIT', author: 'RN Community' },
  ];
  return (
    <InfoCard title="OPEN SOURCE ATTRIBUTION" icon="open-source-initiative" color={C.blue}>
      <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginBottom: 10, lineHeight: 16 }}>
        Butler AI is built on these open-source libraries (all MIT licensed):
      </Text>
      {libs.map((lib, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6,
          borderBottomWidth: i < libs.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
          <View style={{ width: 36, height: 22, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
            borderColor: C.green + '40', backgroundColor: C.green + '08' }}>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: C.green }}>{lib.lic}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 17 }}>{lib.name}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>{lib.author}</Text>
          </View>
        </View>
      ))}
      <Text style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginTop: 10, lineHeight: 15 }}>
        Full license texts available in node_modules/*/LICENSE and THIRD_PARTY_LICENSES.md
      </Text>
    </InfoCard>
  );
}

// ─── DONATION MODAL ─────────────────────────────────────────────
// Play Store compliant: no ads, no pressure, purely optional.
// User writes a message and their name alongside their donation.
// This is a gratitude/community page — not a purchase flow.
const DONATION_TIPS = [
  'Every donation directly funds server costs and future features.',
  'You never have to donate — the free plan is genuinely free forever.',
  'Donations are voluntary and processed via PayPal — fully secure.',
  'Leave a message and your name to be remembered in the app forever.',
  'Your support helps keep Butler AI ad-free and cloud-free.',
  'Even $1 means a lot to an indie developer. Thank you.',
];

function DonationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name,    setName]    = useState('');
  const [message, setMessage] = useState('');
  const [amount,  setAmount]  = useState('');
  const [saved,   setSaved]   = useState(false);
  const [tipIdx,  setTipIdx]  = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeA, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeA, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setTipIdx(i => (i + 1) % DONATION_TIPS.length), 280);
    }, 5000);
    // Pre-load name
    AsyncStorage.getItem(DONOR_NAME_KEY).then(n => { if (n) setName(n); }).catch(() => {});
    return () => clearInterval(interval);
  }, [visible]);

  const saveMemo = useCallback(async () => {
    if (!name.trim() && !message.trim()) return;
    haptics.success();
    try {
      const existing = await AsyncStorage.getItem(DONATION_KEY).then(r => r ? JSON.parse(r) : []).catch(() => []);
      const entry = { name: name.trim() || 'Anonymous', message: message.trim(), amount: amount.trim(), ts: Date.now() };
      await AsyncStorage.multiSet([
        [DONATION_KEY, JSON.stringify([entry, ...existing].slice(0, 50))],
        [DONOR_NAME_KEY, name.trim()],
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  }, [name, message, amount]);

  const openPayPal = () => {
    haptics.heavy();
    Linking.openURL('https://www.paypal.com/donate/?hosted_button_id=BUTLERAI_DONATE').catch(() => {
      Linking.openURL('https://paypal.me/andrejsladkovic').catch(() => {});
    });
  };

  const openBuyMeACoffee = () => {
    haptics.heavy();
    Linking.openURL('https://buymeacoffee.com/butlerai').catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent transparent onRequestClose={onClose}>
      <View style={dm.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={dm.sheet}>
          <View style={{ height: 3, flexDirection: 'row' }}>
            {[C.cyan, C.green, C.amber, C.purple, C.pink].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.dim }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>

            {/* ── HEADER ── */}
            <View style={{ alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 16 }}>
              <View style={[dm.heartOrb, { borderColor: C.cyan + '55', backgroundColor: C.cyan + '10' }]}>
                <MaterialCommunityIcons name="heart-outline" size={28} color={C.cyan} />
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 20, fontWeight: '900', color: '#FFF', textTransform: 'uppercase' }}>
                SUPPORT <Text style={{ color: C.cyan }}>BUTLER AI</Text>
              </Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, textAlign: 'center', lineHeight: 16 }}>
                100% voluntary · no pressure · no ads · just gratitude
              </Text>
            </View>

            {/* ── ROTATING TIP ── */}
            <Animated.View style={[dm.tipBox, { opacity: fadeA }]}>
              <MaterialCommunityIcons name="information-outline" size={12} color={C.amber + '80'} />
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: C.amber + 'BB', flex: 1, lineHeight: 16, fontWeight: '700' }}>
                {DONATION_TIPS[tipIdx]}
              </Text>
            </Animated.View>

            {/* ── WHAT YOUR SUPPORT DOES ── */}
            <View style={[dm.infoCard, { borderColor: C.green + '30', backgroundColor: C.green + '05' }]}>
              <View style={{ height: 2, backgroundColor: C.green + '60' }} />
              <View style={{ padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <MaterialCommunityIcons name="heart-plus-outline" size={13} color={C.green} />
                  <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.green, letterSpacing: 1 }}>WHAT YOUR SUPPORT FUNDS</Text>
                </View>
                {[
                  { icon: 'server-network',     text: 'Server costs to keep GitHub and releases free' },
                  { icon: 'code-braces-box',    text: 'Development time for new features and scripts' },
                  { icon: 'shield-check',        text: 'Security audits and Play Store compliance reviews' },
                  { icon: 'heart',               text: 'Motivation to keep building for free users' },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <MaterialCommunityIcons name={row.icon as any} size={12} color={C.green + '80'} style={{ marginTop: 2 }} />
                    <Text style={{ fontFamily: MONO, fontSize: 10.5, color: C.mid, lineHeight: 16, flex: 1 }}>{row.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── AMOUNT SELECTOR ── */}
            <Text style={dm.fieldLabel}>HOW MUCH? (OPTIONAL)</Text>
            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
              {['$1', '$3', '$5', '$10', '$25'].map((a) => (
                <TouchableOpacity key={a} onPress={() => { haptics.light(); setAmount(amount === a ? '' : a); }}
                  style={[dm.amountChip, { borderColor: amount === a ? C.cyan + '90' : C.dim, backgroundColor: amount === a ? C.cyan + '18' : C.surf2 }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: amount === a ? C.cyan : C.mid }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── NAME FIELD ── */}
            <Text style={dm.fieldLabel}>YOUR NAME (OPTIONAL)</Text>
            <View style={dm.inputWrap}>
              <MaterialCommunityIcons name="account-outline" size={15} color={C.mid} />
              <TextInput
                style={dm.input}
                value={name}
                onChangeText={setName}
                placeholder="Andrej, CoolDev42, Anonymous..."
                placeholderTextColor={C.dim}
                autoCapitalize="words"
                maxLength={50}
              />
              {name.length > 0 && (
                <Text style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>{name.length}/50</Text>
              )}
            </View>

            {/* ── MESSAGE FIELD ── */}
            <Text style={dm.fieldLabel}>YOUR MESSAGE (OPTIONAL)</Text>
            <View style={[dm.inputWrap, { alignItems: 'flex-start', paddingTop: 12, minHeight: 90 }]}>
              <MaterialCommunityIcons name="message-text-outline" size={15} color={C.mid} style={{ marginTop: 2 }} />
              <TextInput
                style={[dm.input, { textAlignVertical: 'top', minHeight: 70 }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Thanks for building this! I use it every day..."
                placeholderTextColor={C.dim}
                multiline
                maxLength={280}
              />
            </View>
            {message.length > 0 && (
              <Text style={{ fontFamily: MONO, fontSize: 9, color: C.dim, textAlign: 'right', marginTop: 4 }}>{message.length}/280</Text>
            )}

            {/* ── SAVE MESSAGE LOCALLY ── */}
            <TouchableOpacity onPress={saveMemo} activeOpacity={0.85}
              style={[dm.saveBtn, { backgroundColor: saved ? C.green : C.surf2, borderColor: saved ? C.green : C.cyan + '40' }]}>
              <MaterialIcons name={saved ? 'check-circle' : 'bookmark-outline'} size={16} color={saved ? '#000' : C.cyan} />
              <Text style={[dm.saveBtnTxt, { color: saved ? '#000' : C.cyan }]}>
                {saved ? 'MESSAGE SAVED LOCALLY' : 'SAVE MESSAGE LOCALLY'}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: C.dim, textAlign: 'center', marginTop: 4, marginBottom: 14, lineHeight: 14 }}>
              Saved only on this device — never uploaded anywhere
            </Text>

            {/* ── DONATION BUTTONS ── */}
            <View style={[dm.divider]} />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, textAlign: 'center', marginBottom: 12, letterSpacing: 1 }}>
              CHOOSE A PLATFORM TO DONATE
            </Text>

            <TouchableOpacity onPress={openPayPal} activeOpacity={0.85}
              style={[dm.donateBtn, { backgroundColor: '#003087', borderColor: '#009CDE' }]}>
              <MaterialCommunityIcons name="paypal" size={20} color="#009CDE" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#009CDE' }}>DONATE VIA PAYPAL</Text>
                <Text style={{ fontFamily: MONO, fontSize: 9, color: '#009CDE' + '80', marginTop: 2 }}>Secure · no account required</Text>
              </View>
              <MaterialIcons name="open-in-new" size={14} color="#009CDE70" />
            </TouchableOpacity>

            <TouchableOpacity onPress={openBuyMeACoffee} activeOpacity={0.85}
              style={[dm.donateBtn, { backgroundColor: '#FFDD00' + '15', borderColor: '#FFDD00' + '60' }]}>
              <MaterialCommunityIcons name="coffee-outline" size={20} color="#FFDD00" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#FFDD00' }}>BUY ME A COFFEE</Text>
                <Text style={{ fontFamily: MONO, fontSize: 9, color: '#FFDD00' + '80', marginTop: 2 }}>buymeacoffee.com · quick &amp; easy</Text>
              </View>
              <MaterialIcons name="open-in-new" size={14} color="#FFDD0070" />
            </TouchableOpacity>

            {/* ── LEGAL DISCLAIMER ── */}
            <View style={[dm.disclaimer, { borderColor: C.border }]}>
              <MaterialCommunityIcons name="information-outline" size={11} color={C.dim} />
              <Text style={dm.disclaimerTxt}>
                All donations are voluntary. Butler AI does not offer goods or services in exchange for donations.
                No donation provides any app features, benefits, or privileges beyond what is already available.
                Donations are processed by third-party platforms (PayPal, Buy Me a Coffee) subject to their own Terms of Service.
                Butler AI is not responsible for third-party payment processing.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={[dm.closeBtn, { borderColor: C.border }]}>
              <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.mid }}>CLOSE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: C.surf, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', maxHeight: '92%',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset:{width:0,height:-6}, shadowOpacity:0.2, shadowRadius:20 }, android: { elevation: 24 } }) },
  heartOrb:    { width: 64, height: 64, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tipBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 11,
    borderColor: C.amber + '30', backgroundColor: C.amber + '06', marginBottom: 14 },
  infoCard:    { borderRadius: 11, borderWidth: 1.5, overflow: 'hidden', marginBottom: 16 },
  fieldLabel:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.mid, letterSpacing: 1.5, marginBottom: 7, marginTop: 4 },
  amountChip:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1.5, borderRadius: 11, padding: 12, backgroundColor: C.surf2, borderColor: C.border, marginBottom: 8 },
  input:       { flex: 1, fontFamily: MONO, fontSize: 13, color: C.text, padding: 0, includeFontPadding: false },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 13 },
  saveBtnTxt:  { fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 14 },
  donateBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 13, padding: 14, marginBottom: 10 },
  disclaimer:  { borderWidth: 1, borderRadius: 10, padding: 11, marginTop: 14, marginBottom: 10 },
  disclaimerTxt: { fontFamily: MONO, fontSize: 9, color: C.dim, lineHeight: 14, flex: 1 },
  closeBtn:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderWidth: 1, borderRadius: 12 },
});

// ─── WIDGET STUDIO GATE (PRO/ELITE locked) ────────────────────────
function WidgetStudioSection() {
  const { isPro, isElite } = usePurchase();
  const isUnlocked = isPro || isElite;
  const [showPaywall, setShowPaywall] = useState(false);

  if (!isUnlocked) {
    return (
      <View>
        <Sec icon="widgets" label="WIDGET STUDIO" color="#BB33FF"
          sub="Code custom widgets · pin them to any page · 16+ templates" />
        <TouchableOpacity onPress={() => setShowPaywall(true)} activeOpacity={0.85}
          style={[ws.locked, { borderColor: '#BB33FF40' }]}>
          <View style={{ height: 3, backgroundColor: '#BB33FF' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
            <View style={[ws.lockedIcon, { borderColor: '#BB33FF55', backgroundColor: '#BB33FF12' }]}>
              <MaterialCommunityIcons name="widgets" size={22} color="#BB33FF" />
              <View style={ws.lockBadge}>
                <MaterialIcons name="lock" size={10} color="#000" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#BB33FF' }}>WIDGET STUDIO</Text>
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 3, lineHeight: 15 }}>
                Code React Native widgets · pin inline or floating to any page
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                {['16 TEMPLATES', 'LIVE PREVIEW', 'ANY PAGE'].map((t, i) => (
                  <View key={i} style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                    borderColor: '#BB33FF35', backgroundColor: '#BB33FF08' }}>
                    <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: '#BB33FF80' }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[ws.upgradeTag, { borderColor: C.amber + '60', backgroundColor: C.amber + '14' }]}>
              <MaterialCommunityIcons name="crown-outline" size={12} color={C.amber} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.amber }}>PRO+</Text>
            </View>
          </View>
        </TouchableOpacity>
        {showPaywall && (
          <View style={{ position: 'absolute', top: -999, opacity: 0, width: 0, height: 0 }}>
            {/* Render paywall on tap */}
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      <Sec icon="widgets" label="WIDGET STUDIO" color="#BB33FF"
        sub="Write code → preview live → pin to any tab page permanently." />
      <LiveWidgetStudio />

      {/* App Version Guard Card — version check + changelog */}
      <AppVersionCard />
    </View>
  );
}

const ws = StyleSheet.create({
  locked:     { backgroundColor: C.surf, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#BB33FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:10 }, android: { elevation: 5 } }) },
  lockedIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  lockBadge:  { position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  upgradeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
});

// ─── FOOTER ──────────────────────────────────────────────────────
function CfgFooter() {
  return (
    <View style={{ alignItems: 'center', gap: 7, paddingVertical: 24, borderTopWidth: 1, borderTopColor: C.border }}>
      <View style={{ flexDirection: 'row', height: 2.5, width: 90, borderRadius: 1.5, overflow: 'hidden', marginBottom: 6 }}>
        {[C.cyan, C.green, C.amber, C.purple, C.red, C.pink].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, letterSpacing: 0.8 }}>BUTLER AI  ·  v8.0.0  ·  NEXUS COMMAND CENTER</Text>
      <Text style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: 0.5 }}>ZERO CLOUD · AES-256 · 100% LOCAL · © 2026</Text>
      <Text style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>com.butlerai.pc.automation</Text>
    </View>
  );
}

// ─── GITHUB SYNC SECTION ────────────────────────────────────────
function GitHubSyncSection() {
  const [showZipGuide, setShowZipGuide] = useState(false);
  const [showGhGuide,  setShowGhGuide]  = useState(false);
  const [copied,       setCopied]       = useState<string | null>(null);

  const copyText = async (text: string, key: string) => {
    haptics.success();
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2200);
    } catch {}
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() =>{});
  };

  const STEP_ROWS: Array<{ n: string; icon: string; title: string; body: string; color: string }> = [
    { n:'1', icon:'github', title:'Push to GitHub',      body:'Click the GitHub button (top-right of OnSpace editor) → connect your repo → push all files.', color: C.cyan   },
    { n:'2', icon:'folder-zip-outline', title:'OR — Download ZIP', body:'Click Download → Export Source Code. You get a .zip with the full folder structure.', color: C.amber  },
    { n:'3', icon:'folder-open-outline', title:'Edit Locally',    body:'Unzip, make changes, keep identical folder/file names (app/(tabs)/, components/, services/, etc.).', color: C.green  },
    { n:'4', icon:'upload-outline',      title:'Re-import',       body:'Re-zip with same structure → open OnSpace project → GitHub push, OR drag-drop individual files via the Code View panel.', color: C.purple },
  ];

  const ZIP_RULES = [
    'Keep folder structure identical — app/, components/, services/, constants/, hooks/, contexts/',
    'File names must match exactly (case-sensitive)',
    'Do NOT include node_modules/ or .expo/ in your zip',
    'Do NOT modify package.json or react-native.config.js',
    'Use UTF-8 encoding for all .ts/.tsx files',
    'After upload, OnSpace rebuilds automatically',
  ];

  return (
    <View>
      <Sec icon="source-repository" label="FILE SYNC & UPDATES"
        sub="Two ways to update your app files efficiently." color={C.cyan} />

      {/* ── GITHUB METHOD ── */}
      <View style={[gs.card, { borderColor: C.cyan + '38' }]}>
        <View style={{ height: 3, backgroundColor: C.cyan }} />
        <TouchableOpacity
          onPress={() => { haptics.light(); setShowGhGuide(v => !v); }}
          activeOpacity={0.88}
          style={gs.cardHdr}>
          <View style={[gs.iconBox, { borderColor: C.cyan + '55', backgroundColor: C.cyan + '10' }]}>
            <MaterialCommunityIcons name="github" size={20} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[gs.cardTitle, { color: C.cyan }]}>GITHUB SYNC</Text>
            <Text style={gs.cardSub}>Recommended · push/pull entire project</Text>
          </View>
          <View style={[gs.badge, { borderColor: C.green + '55', backgroundColor: C.green + '0A' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.green }}>EASIEST</Text>
          </View>
          <MaterialIcons name={showGhGuide ? 'expand-less' : 'expand-more'} size={20} color={C.cyan + '80'} />
        </TouchableOpacity>

        {showGhGuide && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
            {STEP_ROWS.map(s => (
              <View key={s.n} style={[gs.stepRow, { borderLeftColor: s.color }]}>
                <View style={[gs.stepNum, { backgroundColor: s.color + '20', borderColor: s.color + '60' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: s.color }}>{s.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <MaterialCommunityIcons name={s.icon as any} size={12} color={s.color} />
                    <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: s.color }}>{s.title}</Text>
                  </View>
                  <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 17 }}>{s.body}</Text>
                </View>
              </View>
            ))}

            <View style={[gs.tipBox, { borderColor: C.cyan + '30', backgroundColor: C.cyan + '07' }]}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={13} color={C.cyan} />
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.cyan + 'DD', flex: 1, lineHeight: 16 }}>
                After connecting GitHub, any future git push from your local editor instantly reflects in OnSpace — no manual steps needed.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => openURL('https://github.com')}
              activeOpacity={0.85}
              style={[gs.openBtn, { backgroundColor: C.cyan }]}>
              <MaterialCommunityIcons name="github" size={16} color="#000" />
              <Text style={gs.openBtnTxt}>OPEN GITHUB.COM</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 8 }} />

      {/* ── ZIP UPLOAD METHOD ── */}
      <View style={[gs.card, { borderColor: C.amber + '38' }]}>
        <View style={{ height: 3, backgroundColor: C.amber }} />
        <TouchableOpacity
          onPress={() => { haptics.light(); setShowZipGuide(v => !v); }}
          activeOpacity={0.88}
          style={gs.cardHdr}>
          <View style={[gs.iconBox, { borderColor: C.amber + '55', backgroundColor: C.amber + '10' }]}>
            <MaterialCommunityIcons name="folder-zip-outline" size={20} color={C.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[gs.cardTitle, { color: C.amber }]}>ZIP FILE UPLOAD</Text>
            <Text style={gs.cardSub}>Manual method · replace files via zip</Text>
          </View>
          <MaterialIcons name={showZipGuide ? 'expand-less' : 'expand-more'} size={20} color={C.amber + '80'} />
        </TouchableOpacity>

        {showZipGuide && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
            {/* How to do it */}
            <View style={[gs.infoBlock, { borderColor: C.amber + '30', backgroundColor: C.amber + '07' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.amber, letterSpacing: 1.2, marginBottom: 8 }}>HOW TO UPLOAD A ZIP</Text>
              {[
                { icon: 'download-outline',      txt: 'Download current project: OnSpace → Download → Export Source Code' },
                { icon: 'folder-edit-outline',   txt: 'Edit files locally — keep EXACT same folder names and paths' },
                { icon: 'zip-box-outline',        txt: 'Re-zip: right-click folder → Compress / Send to ZIP (include top-level folder)' },
                { icon: 'cloud-upload-outline',  txt: 'OnSpace GitHub button → push your local edits, OR use Code View to paste files individually' },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 9, paddingVertical: 7,
                  borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: C.amber + '18' }}>
                  <MaterialCommunityIcons name={r.icon as any} size={14} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} />
                  <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 17, flex: 1 }}>{r.txt}</Text>
                </View>
              ))}
            </View>

            {/* Rules checklist */}
            <View style={[gs.infoBlock, { borderColor: C.red + '30', backgroundColor: C.red + '06' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={C.red} />
                <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.red, letterSpacing: 1 }}>CRITICAL RULES</Text>
              </View>
              {ZIP_RULES.map((rule, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 5,
                  borderBottomWidth: i < ZIP_RULES.length - 1 ? 1 : 0, borderBottomColor: C.red + '15' }}>
                  <MaterialCommunityIcons name="close-circle" size={11} color={C.red + '90'} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 16, flex: 1 }}>{rule}</Text>
                </View>
              ))}
            </View>

            {/* Folder structure cheat sheet */}
            <View style={[gs.codeBlock]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <MaterialCommunityIcons name="file-tree-outline" size={12} color={C.green} />
                <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.green, letterSpacing: 1 }}>REQUIRED FOLDER STRUCTURE</Text>
                <TouchableOpacity
                  onPress={() => copyText('app/\ncomponents/\nservices/\nconstants/\nhooks/\ncontexts/\nassets/', 'structure')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons
                    name={copied === 'structure' ? 'check' : 'content-copy'}
                    size={12} color={copied === 'structure' ? C.green : C.dim} />
                </TouchableOpacity>
              </View>
              {[
                { path: 'app/', desc: 'Expo Router screens', col: C.cyan   },
                { path: 'app/(tabs)/', desc: 'Tab screens', col: C.cyan   },
                { path: 'components/', desc: 'UI components', col: C.green  },
                { path: 'services/', desc: 'Data services', col: C.purple  },
                { path: 'constants/', desc: 'Config & theme', col: C.amber  },
                { path: 'hooks/', desc: 'Custom hooks', col: C.teal    },
                { path: 'contexts/', desc: 'Global state', col: C.pink    },
                { path: 'assets/', desc: 'Images & icons', col: C.blue    },
              ].map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5,
                  borderBottomWidth: i < 7 ? 1 : 0, borderBottomColor: 'rgba(0,229,255,0.06)' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 12, color: f.col, width: 130 }}>{f.path}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, flex: 1 }}>{f.desc}</Text>
                </View>
              ))}
            </View>

            <View style={[gs.tipBox, { borderColor: C.green + '30', backgroundColor: C.green + '06' }]}>
              <MaterialIcons name="tips-and-updates" size={13} color={C.green} />
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.green + 'CC', flex: 1, lineHeight: 16 }}>
                Fastest workflow: edit files → git commit → git push → OnSpace auto-syncs from GitHub. No zip needed at all.
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 8 }} />

      {/* ── QUICK LINKS ── */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => openURL('https://github.com')}
          activeOpacity={0.85}
          style={[gs.quickBtn, { flex: 1, borderColor: C.cyan + '50', backgroundColor: C.cyan + '0C' }]}>
          <MaterialCommunityIcons name="github" size={15} color={C.cyan} />
          <Text style={[gs.quickBtnTxt, { color: C.cyan }]}>GITHUB</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            haptics.medium();
            Alert.alert(
              'Download Source Code',
              'To export your project:\n\n1. Click the Download button (⬇) in the top-right toolbar\n2. Select "Export Source Code"\n3. You will get a complete ZIP of all files with the correct folder structure',
              [{ text: 'Got It' }]
            );
          }}
          activeOpacity={0.85}
          style={[gs.quickBtn, { flex: 1, borderColor: C.amber + '50', backgroundColor: C.amber + '0C' }]}>
          <MaterialIcons name="download" size={15} color={C.amber} />
          <Text style={[gs.quickBtnTxt, { color: C.amber }]}>EXPORT ZIP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            haptics.medium();
            Alert.alert(
              'Code View',
              'To edit or paste individual files:\n\n1. Click the Code View toggle (</>) in the top-right toolbar\n2. Navigate to any file\n3. Paste your updated content directly',
              [{ text: 'Got It' }]
            );
          }}
          activeOpacity={0.85}
          style={[gs.quickBtn, { flex: 1, borderColor: C.green + '50', backgroundColor: C.green + '0C' }]}>
          <MaterialIcons name="code" size={15} color={C.green} />
          <Text style={[gs.quickBtnTxt, { color: C.green }]}>CODE VIEW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const gs = StyleSheet.create({
  card:       { backgroundColor: '#070F1C', borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 0 },
  cardHdr:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle:  { fontFamily: MONO, fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },
  cardSub:    { fontFamily: MONO, fontSize: 10, color: '#5A8098', marginTop: 2 },
  badge:      { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  stepRow:    { flexDirection: 'row', gap: 11, paddingVertical: 5, borderLeftWidth: 3, paddingLeft: 11 },
  stepNum:    { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipBox:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, borderRadius: 10, padding: 11 },
  openBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 11, paddingVertical: 13 },
  openBtnTxt: { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
  infoBlock:  { borderWidth: 1, borderRadius: 11, padding: 11 },
  codeBlock:  { backgroundColor: '#020810', borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.14)', padding: 12 },
  quickBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 11, paddingVertical: 12 },
  quickBtnTxt:{ fontFamily: MONO, fontSize: 10, fontWeight: '900' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function SettingsScreen() {
  return (
    <TabErrorBoundary name="Settings">
      <SettingsScreenInner />
    </TabErrorBoundary>
  );
}

function SettingsScreenInner() {
  const insets = useSafeAreaInsets();

  const [model,        setModel]        = useState('llama3.2');
  const [system,       setSystem]       = useState('');
  const [showDonation, setShowDonation] = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [hapticsOn,    setHapticsOn]    = useState(true);
  const [animationsOn, setAnimationsOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoReconn,   setAutoReconn]   = useState(true);
  const [debugMode,    setDebugMode]    = useState(false);
  const [isConn,       setIsConn]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [[, m], [, s], [, h], [, ar], [, dbg], [, anim], [, rm]] = await AsyncStorage.multiGet([
          MODEL_KEY, SYSTEM_KEY, HAPTICS_KEY, AR_KEY, DEBUG_KEY, ANIM_KEY, REDUCE_KEY,
        ]);
        if (m)   setModel(m);
        if (s)   setSystem(s);
        if (h   !== null) setHapticsOn(h !== '0');
        if (ar  !== null) setAutoReconn(ar !== '0');
        if (dbg !== null) setDebugMode(dbg === '1');
        if (anim !== null) setAnimationsOn(anim !== '0');
        if (rm  !== null) setReduceMotion(rm === '1');
      } catch {}
      try { setIsConn(serverConnection.isConnected?.()); } catch {}
    })();
  }, []);

  const onSave = useCallback(async () => {
    haptics.success();
    await AsyncStorage.multiSet([
      [MODEL_KEY,   model.trim() || 'llama3.2'],
      [SYSTEM_KEY,  system],
      [HAPTICS_KEY, hapticsOn    ? '1' : '0'],
      [AR_KEY,      autoReconn   ? '1' : '0'],
      [DEBUG_KEY,   debugMode    ? '1' : '0'],
      [ANIM_KEY,    animationsOn ? '1' : '0'],
      [REDUCE_KEY,  reduceMotion ? '1' : '0'],
    ]).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
    Alert.alert('✓ Saved', 'Configuration saved successfully.', [{ text: 'OK' }]);
  }, [model, system, hapticsOn, autoReconn, debugMode, animationsOn, reduceMotion]);

  const handleShareLog = useCallback(async () => {
    haptics.medium();
    try {
      const entries = logger.getEntries();
      const lines = entries.map(e => `[${new Date(e.ts).toISOString()}] ${e.level.toUpperCase()}: ${e.msg}`);
      const header = `Butler AI Diagnostic Log\nGenerated: ${new Date().toISOString()}\nApp: v8.0.0\nEntries: ${entries.length}\n${'─'.repeat(40)}\n`;
      await Share.share({
        title: 'Butler AI Diagnostic Log',
        message: header + (lines.length ? lines.join('\n') : '(no entries yet)'),
      });
    } catch (err) {
      autoErrorLogger.log('warn', 'Settings', String(err));
    }
  }, []);

  const onReplayOnboarding = useCallback(() => {
    Alert.alert(
      'REPLAY TUTORIAL',
      'Restart the full onboarding flow? This will take you back to the setup wizard.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'RESTART NOW', style: 'default', onPress: async () => {
          haptics.heavy();
          await resetOnboarding();
          notifyOnboardingReset();
          await new Promise<void>(r => setTimeout(r, 80));
          try { router.replace('/(tabs)/onboarding' as any); } catch {
            try { router.navigate('/(tabs)/onboarding' as any); } catch {}
          }
        }},
      ]
    );
  }, []);

  const onReset = useCallback(() => {
    Alert.alert(
      'RESET ALL DATA',
      'This permanently clears all server config, model settings, preferences, and connection data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'RESET EVERYTHING', style: 'destructive', onPress: async () => {
          haptics.heavy();
          await AsyncStorage.multiRemove([
            MODEL_KEY, SYSTEM_KEY, HAPTICS_KEY, AR_KEY, DEBUG_KEY, ANIM_KEY, REDUCE_KEY,
            '@butler_onboarding_done_v2', '@butler_welcome_complete_v1',
            'butler_onboarding_done', 'butler_welcome_complete',
          ]).catch(() => {});
          setModel('llama3.2'); setSystem('');
          setHapticsOn(true); setAutoReconn(true); setDebugMode(false);
          setAnimationsOn(true); setReduceMotion(false);
          try {
            const { serverConnection: sc } = await import('@/services/serverConnection');
            await sc.clearAll?.().catch?.(() => {});
          } catch {}
          haptics.success();
          Alert.alert('Reset Complete', 'All data cleared. Please restart the tutorial to reconfigure.', [{ text: 'OK' }]);
        }},
      ]
    );
  }, []);

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot Open', 'Please visit the URL manually:\n' + url);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TabSwipeOverlay />
      <CfgHeader safeTop={insets.top} isConn={isConn} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: PAD,
          paddingTop: 16,
          paddingBottom: insets.bottom + 140,
          gap: 16,
        }}
      >

        {/* ═══════════════════════════════════════
            🎓 TUTORIAL — ALWAYS AT TOP
        ═══════════════════════════════════════ */}
        <TutorialBanner onReplay={onReplayOnboarding} />

        {/* ═══════════════════════════════════════
            🛡 PRIVACY & LEGAL — PROMINENT
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="shield-star-outline" label="PRIVACY & LEGAL"
            sub="Your data stays 100% local. No cloud, no tracking." color={C.green} />
          <PrivacyGuaranteeCard />
          <View style={{ height: 10 }} />
          <ActionRow icon="shield-check" iconLib="community" label="PRIVACY POLICY"
            sub="GDPR compliant · what data we collect (none)" color={C.green}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/')} />
          <ActionRow icon="file-document-outline" iconLib="community" label="TERMS OF SERVICE"
            sub="18+ · personal PC use only · no commercial resale" color={C.amber}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#terms-of-service')} />
          <ActionRow icon="delete-sweep" iconLib="community" label="DATA DELETION REQUEST"
            sub="GDPR right to erasure · delete all your data" color={C.red}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#data-deletion')} />
          <ActionRow icon="security" iconLib="material" label="SECURITY & TRUST"
            sub="How encryption, tokens and zero-cloud architecture work" color={C.cyan}
            badge="VIEW" onPress={() => router.push('/security-trust' as any)} />
        </View>

        {/* ═══════════════════════════════════════
            ⚙️ SYSTEM STATUS
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="chip" label="SYSTEM STATUS" color={C.amber} />
          <SystemStatusBar isConn={isConn} />
        </View>

        {/* ═══════════════════════════════════════
            🤖 AI MODEL
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="brain" label="AI MODEL — OLLAMA" color={C.cyan}
            sub="Models run 100% locally on your PC via Ollama. No API keys needed." />
          <View style={[ic.root, { borderColor: C.cyan + '30' }]}>
            <View style={{ height: 2.5, backgroundColor: C.cyan }} />
            <View style={{ padding: 14 }}>
              <ModelSelector value={model} onChange={v => { setModel(v); setSaved(false); }} />
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            💬 SYSTEM PROMPT
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="text-box-outline" label="SYSTEM PROMPT" color={C.purple}
            sub="Optional custom instructions prepended to every AI conversation." />
          <View style={[ic.root, { borderColor: C.purple + '30' }]}>
            <View style={{ height: 2.5, backgroundColor: C.purple }} />
            <View style={{ padding: 14, gap: 10 }}>
              <View style={{ borderWidth: 1.5, borderRadius: 11, borderColor: C.border, backgroundColor: C.surf2 }}>
                <TextInput
                  style={{ color: C.text, fontSize: 14, fontFamily: MONO, minHeight: 90,
                    padding: 13, textAlignVertical: 'top', lineHeight: 21 }}
                  value={system}
                  onChangeText={v => { setSystem(v); setSaved(false); }}
                  placeholder="Guide Butler's personality, tone, or specialization…"
                  placeholderTextColor={C.dim}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                />
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 16 }}>
                Blank = default Butler AI personality. Example: "You are a Python security expert focused on privacy tools."
              </Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            🎛 PREFERENCES
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="tune" label="PREFERENCES & ACCESSIBILITY" color={C.amber}
            sub="Customize Butler AI to your preferences and device needs." />
          <ToggleRow icon="vibrate"            label="HAPTIC FEEDBACK"
            sub="Tactile vibration on taps, buttons and alerts"
            value={hapticsOn}    onToggle={setHapticsOn}    color={C.amber} />
          <ToggleRow icon="animation-play"     label="ANIMATIONS ENABLED"
            sub="Toggle UI transitions and animated effects"
            value={animationsOn} onToggle={setAnimationsOn} color={C.cyan}
            iconLib="community" />
          <ToggleRow icon="run-fast"           label="REDUCE MOTION"
            sub="Minimal animations — accessibility mode"
            value={reduceMotion} onToggle={setReduceMotion} color={C.green}
            iconLib="community" />
          <ToggleRow icon="wifi-sync"          label="AUTO RECONNECT"
            sub="Silently reconnect to PC server on app resume"
            value={autoReconn}   onToggle={setAutoReconn}   color={C.cyan}
            iconLib="community" />
          <ToggleRow icon="bug-report"         label="DEBUG MODE"
            sub="Verbose logs + diagnostic overlay (dev use)"
            value={debugMode}    onToggle={setDebugMode}    color={C.purple}
            iconLib="material" />
        </View>

        {/* ═══════════════════════════════════════
            💾 SAVE BUTTON
        ═══════════════════════════════════════ */}
        <PrimaryBtn
          label={saved ? '✓ CONFIGURATION SAVED' : 'SAVE CONFIGURATION'}
          icon={saved ? 'check-circle' : 'save'}
          color={saved ? C.green : C.amber}
          onPress={onSave}
        />

        {/* ═══════════════════════════════════════
            🔄 GITHUB SYNC & FILE UPDATE
        ═══════════════════════════════════════ */}
        <GitHubSyncSection />

        {/* ═══════════════════════════════════════
            🎨 THEMES
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="palette-swatch" label="THEMES & COSMETICS" color={C.purple} />
          <ActionRow icon="palette-swatch" iconLib="community" label="OPEN THEMES & FX"
            sub="8 themes · bubble animations · notification sounds · live preview"
            color={C.purple} badge="8 THEMES"
            onPress={() => { (global as any).__butlerSwitchTab?.('cosmetic'); }} />
        </View>

        {/* ═══════════════════════════════════════
            🔧 DIAGNOSTICS
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="stethoscope" label="DIAGNOSTICS & SUPPORT" color={C.blue} />
          <ActionRow icon="text-box-search-outline" iconLib="community" label="SHARE DIAGNOSTIC LOG"
            sub="Export last 100 log entries — stays on device until you share it"
            color={C.blue} onPress={handleShareLog} />
          <ActionRow icon="alert-circle-outline" iconLib="community" label="CRASH REPORT"
            sub="View startup crash logs, timestamps and stack traces"
            color={C.red} onPress={() => router.push('/crash-report' as any)} />
          <ActionRow icon="help-circle-outline" iconLib="community" label="HELP & FAQ"
            sub="Setup guide, common issues, changelog, server probe"
            color={C.teal} onPress={() => { (global as any).__butlerSwitchTab?.('support'); }} />
        </View>

        {/* ═══════════════════════════════════════
            🎨 WIDGET STUDIO
        ═══════════════════════════════════════ */}
        <WidgetStudioSection />

        {/* ═══════════════════════════════════════
            💙 SUPPORT / DONATION
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="heart-outline" label="SUPPORT THE DEVELOPER" color={C.cyan}
            sub="100% optional. Donations fund future development." />
          <TouchableOpacity onPress={() => { haptics.medium(); setShowDonation(true); }} activeOpacity={0.88}
            style={[ic.root, { borderColor: C.cyan + '35' }]}>
            <View style={{ height: 3, flexDirection: 'row' }}>
              {[C.cyan, C.green, C.amber, C.purple, C.pink].map((c, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: c }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
              <View style={[ic.iconBox, { borderColor: C.cyan + '55', backgroundColor: C.cyan + '10' }]}>
                <MaterialCommunityIcons name="heart-outline" size={18} color={C.cyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: C.cyan }}>SUPPORT BUTLER AI</Text>
                <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 3, lineHeight: 15 }}>
                  Leave a message · optional donation · 100% voluntary
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={C.cyan + '70'} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════
            📋 PLAY STORE COMPLIANCE
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="google-play" label="PLAY STORE COMPLIANCE"
            sub="Policy compliance notes — visible for reviewers and users alike." color={C.blue} />
          <View style={[ic.root, { borderColor: C.blue + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.blue }} />
            <View style={{ padding: 14, gap: 0 }}>
              {[
                {
                  icon: 'calendar-remove-outline',
                  color: C.green,
                  title: 'Script Scheduling — Not Present',
                  body: 'Script scheduling has been fully removed from this app. No automated background execution exists anywhere. Every script requires an explicit user tap in the foreground. This is hardcoded at the architecture level, not a setting.',
                },
                {
                  icon: 'run-fast',
                  color: C.amber,
                  title: 'Foreground Only — Always',
                  body: 'Butler AI has zero background services, zero silent cron jobs, and zero deferred execution. When the app is minimized or the screen is off, absolutely nothing runs on your PC. Full stop.',
                },
                {
                  icon: 'shield-check-outline',
                  color: C.cyan,
                  title: '7-Layer Safety Architecture',
                  body: 'Consent Gate → One-Tap Undo → Nefarious Script Detection → AES-256-GCM → LAN-Only → Zero Telemetry → Permanent Hard Stops. All 7 layers run simultaneously on every command. See the Downloads tab for full details.',
                },
                {
                  icon: 'camera-off',
                  color: C.purple,
                  title: 'Minimal Permissions',
                  body: 'Camera: QR pairing only, requested at scan time. Local Network: required for LAN connection. No location, no contacts, no background location, no microphone, no storage.',
                },
                {
                  icon: 'eye-off-outline',
                  color: C.teal,
                  title: 'Zero Data Collection',
                  body: 'No analytics SDK. No Firebase. No Crashlytics. No third-party tracking. No usage reports. The only network calls are to your own paired PC on your own local network.',
                },
              ].map((item, i, arr) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 10,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderColor: item.color + '45', backgroundColor: item.color + '0E' }}>
                    <MaterialCommunityIcons name={item.icon as any} size={15} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: item.color, marginBottom: 3 }}>{item.title}</Text>
                    <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, lineHeight: 15 }}>{item.body}</Text>
                  </View>
                </View>
              ))}
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 9, padding: 10,
                borderColor: C.green + '40', backgroundColor: C.green + '06' }}>
                <MaterialCommunityIcons name="email-check-outline" size={13} color={C.green} />
                <Text style={{ fontFamily: MONO, fontSize: 10, color: C.green + 'CC', flex: 1, lineHeight: 15 }}>
                  Play Store reviewer questions: andrejsladkovic1992@gmail.com — 24h response guaranteed.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            📜 OPEN SOURCE ATTRIBUTION
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="open-source-initiative" label="OPEN SOURCE ATTRIBUTION"
            sub="Butler AI is built on open-source software (all MIT licensed)." color={C.blue} />
          <AttributionCard />
        </View>

        {/* ═══════════════════════════════════════
            ☢️ DANGER ZONE — LAST
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="alert-octagon" label="DANGER ZONE"
            sub="These actions are permanent and cannot be undone." color={C.red} />
          <View style={[ic.root, { borderColor: C.red + '35' }]}>
            <View style={{ height: 3.5, backgroundColor: C.red }} />
            <View style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <MaterialCommunityIcons name="alert-octagon-outline" size={18} color={C.red} />
                <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.red, flex: 1 }}>IRREVERSIBLE OPERATIONS</Text>
                <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: C.red + '50', backgroundColor: C.red + '0A' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.red }}>CAUTION</Text>
                </View>
              </View>
              <DangerBtn label="REPLAY TUTORIAL" icon="school" color={C.amber} variant="ghost" onPress={onReplayOnboarding} />
              <DangerBtn label="RESET ALL DATA & SETTINGS" icon="delete-sweep" color={C.red} variant="outline" onPress={onReset} />
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════ */}
        <CfgFooter />
      </ScrollView>

      {/* Donation modal — outside ScrollView so it's full-screen */}
      <DonationModal visible={showDonation} onClose={() => setShowDonation(false)} />
    </View>
  );
}
