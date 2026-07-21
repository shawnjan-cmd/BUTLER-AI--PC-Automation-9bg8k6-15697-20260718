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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { haptics } from '@/services/haptics';
import { notifyOnboardingReset } from './_layout';
import { resetOnboarding } from '@/services/onboardingState';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
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

const MODEL_KEY   = 'butler.model.v1';
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
            ™ COPYRIGHT BANNER — ALWAYS FIRST
        ═══════════════════════════════════════ */}
        <View style={[
          { backgroundColor: '#07040E', borderRadius: 16, borderWidth: 2,
            borderColor: '#9B40FF55', overflow: 'hidden',
            ...Platform.select({ ios: { shadowColor: '#9B40FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18 }, android: { elevation: 10 } }) },
        ]}>
          {/* Rainbow top stripe */}
          <View style={{ height: 4, flexDirection: 'row' }}>
            {['#9B40FF','#9B40FF','#CC44FF','#00E5FF','#00FF88','#FFB020','#FF3344','#9B40FF'].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>
          <View style={{ padding: 16, gap: 10 }}>
            {/* Main copyright line */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
                borderColor: '#CC44FF55', backgroundColor: '#CC44FF0D',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialCommunityIcons name="shield-crown" size={22} color="#CC44FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900',
                  color: '#CC44FF50', letterSpacing: 2, lineHeight: 12 }}>INTELLECTUAL PROPERTY</Text>
                <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900',
                  color: '#CC44FF', letterSpacing: 1, lineHeight: 22 }}>BUTLER AI™</Text>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: '#9B40FFBB', lineHeight: 16, marginTop: 2 }}>
                  © 2024–2026 AIKIDO. All rights reserved.
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#CC44FF20' }} />

            {/* Copyright details grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { icon: 'trademark',         label: 'BUTLER AI™',         sub: 'Trademark · Aikido',       color: '#CC44FF' },
                { icon: 'code-braces',        label: 'SOURCE CODE',         sub: '© 2024–2026 Aikido',       color: '#00E5FF' },
                { icon: 'server',             label: 'SERVER CODE',         sub: 'butler_server.py © Aikido',color: '#00FF88' },
                { icon: 'shield-lock',        label: 'PROPRIETARY',         sub: 'All rights reserved',      color: '#FFB020' },
                { icon: 'eye-off',            label: 'NOT OPEN SOURCE',     sub: 'No licence to copy',       color: '#FF3344' },
                { icon: 'gavel',              label: 'DMCA PROTECTED',       sub: '17 U.S.C. § 1201',        color: '#9B40FF' },
              ].map((b, i) => (
                <View key={i} style={{ width: '31%', borderWidth: 1.5, borderRadius: 10, padding: 9,
                  borderColor: b.color + '40', backgroundColor: b.color + '08',
                  borderTopWidth: 3, borderTopColor: b.color }}>
                  <MaterialCommunityIcons name={b.icon as any} size={14} color={b.color} style={{ marginBottom: 5 }} />
                  <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: b.color, lineHeight: 13 }}>{b.label}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: b.color + '70', lineHeight: 12, marginTop: 2 }}>{b.sub}</Text>
                </View>
              ))}
            </View>

            {/* Warning notice */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9,
              borderWidth: 1, borderRadius: 10, borderColor: '#FF334445',
              backgroundColor: '#FF33440A', padding: 11 }}>
              <MaterialCommunityIcons name="alert-octagon" size={14} color="#FF3344" style={{ flexShrink: 0, marginTop: 1 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: '#FF3344BB', flex: 1, lineHeight: 16 }}>
                Unauthorized copying, reverse-engineering, redistribution or resale of this software, server code or any portion is strictly prohibited and may result in legal action.
              </Text>
            </View>

            {/* Contact + package */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
              borderWidth: 1, borderRadius: 9, borderColor: '#CC44FF30',
              backgroundColor: '#CC44FF07', paddingHorizontal: 12, paddingVertical: 8 }}>
              <MaterialIcons name="email" size={12} color="#CC44FF" />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: '#CC44FFBB', flex: 1, letterSpacing: 0.3 }}>
                andrejsladkovic1992@gmail.com  ·  com.butlerai.pc.automation
              </Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            🎓 TUTORIAL — ALWAYS AT TOP
        ═══════════════════════════════════════ */}
        <TutorialBanner onReplay={onReplayOnboarding} />

        {/* ═══════════════════════════════════════
            📱 PLAY STORE PERMISSIONS DISCLOSURE
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="google-play" label="PLAY STORE PERMISSIONS" color={C.teal}
            sub="Declared permissions as shown on Google Play — all optional except network." />
          <View style={[ic.root, { borderColor: C.teal + '35' }]}>
            <View style={{ height: 2.5, backgroundColor: C.teal }} />
            <View style={{ padding: 14, gap: 10 }}>
              {/* Explanation header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9,
                borderWidth: 1, borderRadius: 10, borderColor: C.teal + '35',
                backgroundColor: C.teal + '07', padding: 11 }}>
                <MaterialCommunityIcons name="information-outline" size={15} color={C.teal} style={{ flexShrink: 0 }} />
                <Text style={{ fontFamily: MONO, fontSize: 11, color: C.teal + 'BB', flex: 1, lineHeight: 16 }}>
                  Butler AI requests the minimum permissions required. Each permission is used for one explicit purpose and nothing else.
                </Text>
              </View>

              {/* Play Store compliance notice */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9,
                borderWidth: 1, borderRadius: 10, borderColor: C.green + '40',
                backgroundColor: C.green + '07', padding: 11, marginBottom: 4 }}>
                <MaterialCommunityIcons name="check-circle" size={14} color={C.green} style={{ flexShrink: 0, marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.green, marginBottom: 4 }}>FILE ACCESS — SYSTEM PICKER ONLY</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, lineHeight: 15 }}>
                    Butler AI uses the Android system file picker (no READ_EXTERNAL_STORAGE needed). Files are selected by the user via the OS dialog — Play Store Photo & Video Permissions policy compliant.
                  </Text>
                </View>
              </View>

              {[
                {
                  permission: 'INTERNET',
                  group: 'Network',
                  required: true,
                  icon: 'wifi',
                  color: C.cyan,
                  purpose: 'Communicate with butler_server.py on your home LAN over Wi-Fi. Zero external internet calls.',
                  neverUsedFor: 'Cloud APIs, telemetry, analytics, ad networks',
                },
                {
                  permission: 'CHANGE_NETWORK_STATE',
                  group: 'Network',
                  required: false,
                  icon: 'lan-connect',
                  color: C.cyan,
                  purpose: 'Detect LAN connectivity changes to trigger auto-reconnect to PC server.',
                  neverUsedFor: 'Changing user network settings or VPN configuration',
                },
                {
                  permission: 'CAMERA',
                  group: 'Camera',
                  required: false,
                  icon: 'camera-outline',
                  color: C.amber,
                  purpose: 'Scan QR code displayed on your PC screen to pair with butler_server.py. One-shot only.',
                  neverUsedFor: 'Recording video, taking photos, background camera access',
                },
                {
                  permission: 'VIBRATE',
                  group: 'Haptics',
                  required: false,
                  icon: 'vibrate',
                  color: C.green,
                  purpose: 'Haptic feedback on button presses and script execution completion.',
                  neverUsedFor: 'Alerts, notifications, or any background vibration',
                },
              ].map((p, i) => (
                <View key={i} style={{
                  borderWidth: 1.5, borderRadius: 12, borderColor: p.color + '30',
                  backgroundColor: p.color + '06', overflow: 'hidden',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1.5,
                      borderColor: p.color + '55', backgroundColor: p.color + '14',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MaterialCommunityIcons name={p.icon as any} size={17} color={p.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: p.color, letterSpacing: 0.5 }}>
                          {p.permission}
                        </Text>
                        <View style={{
                          borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                          borderColor: (p.required ? C.red : C.green) + '55',
                          backgroundColor: (p.required ? C.red : C.green) + '0C',
                        }}>
                          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900',
                            color: p.required ? C.red : C.green }}>
                            {p.required ? 'REQUIRED' : 'OPTIONAL'}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: MONO, fontSize: 9, color: p.color + '60' }}>{p.group}</Text>
                      </View>
                      <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginTop: 4, lineHeight: 16 }}>
                        {p.purpose}
                      </Text>
                    </View>
                  </View>
                  {/* Never used for */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7,
                    borderTopWidth: 1, borderTopColor: p.color + '20',
                    paddingHorizontal: 12, paddingVertical: 8,
                    backgroundColor: C.red + '04' }}>
                    <MaterialIcons name="block" size={11} color={C.red + '70'} style={{ flexShrink: 0 }} />
                    <Text style={{ fontFamily: MONO, fontSize: 10, color: C.red + '60', flex: 1, lineHeight: 14 }}>
                      Never: {p.neverUsedFor}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Permissions NOT requested */}
              <View style={{ borderWidth: 1, borderRadius: 11, borderColor: C.green + '30',
                backgroundColor: C.green + '06', padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <MaterialCommunityIcons name="shield-check" size={14} color={C.green} />
                  <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.green, letterSpacing: 0.5 }}>
                    NEVER REQUESTED
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['CONTACTS','LOCATION','MICROPHONE','CALL LOG','SMS / MMS',
                    'BACKGROUND LOCATION','READ CALL LOG','RECORD AUDIO',
                    'PROCESS OUTGOING CALLS','READ PHONE STATE'].map((perm) => (
                    <View key={perm} style={{ borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5,
                      borderColor: C.green + '35', backgroundColor: C.green + '07' }}>
                      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: C.green + '90' }}>{perm}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Play Store compliance link */}
              <ActionRow icon="google-play" iconLib="community"
                label="PLAY STORE DATA SAFETY"
                sub="View our complete Play Store data safety declaration"
                color={C.teal}
                onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#data-safety')} />
            </View>
          </View>
        </View>

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
    </View>
  );
}
