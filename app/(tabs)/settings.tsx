/**
 * BUTLER AI — CONFIGURATION CENTER v3.0
 * Mission-control aesthetic — hexagonal system overview, live version badges,
 * animated stats, model picker carousel, full per-section neon accents.
 * All backend wires (AsyncStorage keys, resetOnboarding, haptics, Share) preserved.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, Alert, Platform,
  Animated, Dimensions, Share, Pressable,
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
import { ScanlineOverlay } from '@/components/ui/ScanlineOverlay';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { HexTag } from '@/components/ui/HexTag';
import { StatusChip } from '@/components/ui/StatusChip';
import { GlowCard } from '@/components/ui/GlowCard';
import { GlitchText } from '@/components/ui/GlitchText';
import { logger } from '@/utils/logger';
import { serverConnection } from '@/services/serverConnection';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD = 14;

// ─── PALETTE ────────────────────────────────────────────────────────
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
  text:     '#C8E4F0',
  mid:      '#4A7090',
  dim:      '#1A2E44',
  border:   'rgba(0,229,255,0.10)',
};

// ─── STORAGE KEYS ────────────────────────────────────────────────────
const MODEL_KEY  = 'butler.model.v1';
const SYSTEM_KEY = 'butler.system.v1';

// ─── POPULAR MODELS ──────────────────────────────────────────────────
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

// ─── MICRO ATOMS ─────────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{ width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a }} />
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────
function Sec({ icon, label, color, right }: { icon: string; label: string; color: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11, marginTop: 4 }}>
      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: color }} />
      <MaterialCommunityIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: color + 'DD',
        letterSpacing: 1.8, flex: 1 }}>{label}</Text>
      {right}
      <View style={{ height: 1, width: 20, backgroundColor: color + '20' }} />
    </View>
  );
}

// ─── NEXUS INPUT ──────────────────────────────────────────────────────
function NexusInput({ value, onChangeText, placeholder, multiline = false, accent = C.cyan, ...rest }: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  accent?: string;
  [k: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[ni.wrap, {
      borderColor: focused ? accent + '80' : C.border,
      backgroundColor: focused ? accent + '06' : C.surf,
    }]}>
      <CornerFrame color={focused ? accent + '55' : C.border} size={7} thickness={1} />
      <TextInput
        style={[ni.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
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
  wrap:  { borderWidth: 1.5, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10,
    position: 'relative', overflow: 'hidden' },
  input: { color: C.text, fontSize: 14, fontFamily: MONO, padding: 0, includeFontPadding: false as any },
});

// ─── TOGGLE ROW ───────────────────────────────────────────────────────
function ToggleRow({ icon, label, sub, value, onToggle, color = C.cyan, iconLib = 'community' }: {
  icon: string; label: string; sub?: string; value: boolean;
  onToggle: (v: boolean) => void; color?: string; iconLib?: 'material' | 'community';
}) {
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <TouchableOpacity activeOpacity={0.88}
      style={[tr.row, { borderColor: value ? color + '45' : C.border,
        backgroundColor: value ? color + '06' : C.surf }]}
      onPress={() => { haptics.light(); onToggle(!value); }}>
      <CornerFrame color={value ? color + '35' : C.dim} size={6} thickness={1} />
      <View style={[tr.iconBox, { borderColor: color + (value ? '50' : '25'),
        backgroundColor: color + (value ? '12' : '06') }]}>
        <Icon name={icon as any} size={15} color={value ? color : C.mid} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: value ? C.text : C.mid }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.dim, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { haptics.light(); onToggle(v); }}
        trackColor={{ false: 'rgba(255,255,255,0.08)', true: color + '70' }}
        thumbColor={value ? color : C.mid + '80'}
        ios_backgroundColor="rgba(255,255,255,0.08)"
      />
    </TouchableOpacity>
  );
}
const tr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    paddingHorizontal: 13, borderRadius: 12, borderWidth: 1.5, marginBottom: 6,
    position: 'relative', overflow: 'hidden' },
  iconBox: { width: 34, height: 34, borderRadius: 9, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
});

// ─── LINK ROW ─────────────────────────────────────────────────────────
function LinkRow({ icon, iconLib = 'community', label, sub, color = C.cyan, onPress, badge }: {
  icon: string; iconLib?: 'material' | 'community'; label: string; sub?: string;
  color?: string; onPress: () => void; badge?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => { Animated.sequence([
          Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
        ]).start(); haptics.light(); onPress(); }}
        activeOpacity={0.88}
        style={[lnk.row, { borderColor: color + '28', backgroundColor: color + '06' }]}>
        <View style={[lnk.iconBox, { backgroundColor: color + '14', borderColor: color + '40' }]}>
          <Icon name={icon as any} size={15} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: C.text }}>{label}</Text>
          {sub ? <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 2 }}>{sub}</Text> : null}
        </View>
        {badge ? (
          <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
            borderColor: color + '45', backgroundColor: color + '0A' }}>
            <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: color }}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name="chevron-right" size={15} color={color + '70'} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}
const lnk = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12,
    paddingHorizontal: 13, borderRadius: 12, borderWidth: 1.5, marginBottom: 6 },
  iconBox: { width: 34, height: 34, borderRadius: 9, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
});

// ─── NEXUS BTN ────────────────────────────────────────────────────────
function NexBtn({ label, icon, color, onPress, variant = 'solid', disabled, loading }: {
  label: string; icon: string; color: string; onPress: () => void;
  variant?: 'solid' | 'outline' | 'ghost'; disabled?: boolean; loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const handlePressIn = () => {
    Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: true }).start();
    Animated.spring(scale, { toValue: 0.97, tension: 400, friction: 12, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    Animated.spring(scale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();
  };
  const bg      = variant === 'solid' ? color : variant === 'ghost' ? color + '14' : 'transparent';
  const bColor  = variant !== 'solid' ? color + '60' : 'transparent';
  const txtCol  = variant === 'solid' ? '#000' : color;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={() => { haptics.medium(); onPress(); }}
        onPressIn={handlePressIn} onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[nxb.btn, {
          backgroundColor: bg,
          borderColor: bColor,
          borderWidth: variant !== 'solid' ? 1.5 : 0,
          opacity: disabled ? 0.38 : 1,
          ...(Platform.OS === 'ios' && variant === 'solid' ? {
            shadowColor: color, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45, shadowRadius: 12,
          } : variant === 'solid' ? { elevation: 8 } : {}),
        }]}>
        <Animated.View pointerEvents="none" style={[nxb.tick, nxb.tTL, { borderColor: txtCol, opacity: flash }]} />
        <Animated.View pointerEvents="none" style={[nxb.tick, nxb.tBR, { borderColor: txtCol, opacity: flash }]} />
        {loading
          ? <MaterialIcons name="hourglass-empty" size={16} color={txtCol} style={{ marginRight: 7 }} />
          : <MaterialIcons name={icon as any} size={16} color={txtCol} style={{ marginRight: 7 }} />
        }
        <Text style={[nxb.txt, { color: txtCol }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
const nxb = StyleSheet.create({
  btn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 11, paddingVertical: 14, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  txt:  { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  tick: { position: 'absolute', width: 8, height: 8 },
  tTL:  { top: -2, left: -2, borderTopWidth: 2, borderLeftWidth: 2 },
  tBR:  { bottom: -2, right: -2, borderBottomWidth: 2, borderRightWidth: 2 },
});

// ─── SYSTEM HEADER ────────────────────────────────────────────────────
function CfgHeader({ safeTop, isConn }: { safeTop: number; isConn: boolean }) {
  const [time, setTime] = useState('');
  const [secs, setSecs] = useState('');
  const [dateStr, setDateStr] = useState('');
  const shimA = useRef(new Animated.Value(-SW)).current;

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setSecs(String(n.getSeconds()).padStart(2,'0'));
      setDateStr(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
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

  return (
    <View style={[ch.root, { paddingTop: safeTop }]}>
      {/* Top stripe */}
      <View style={ch.topStripe} />

      {/* Shimmer sweep */}
      <Animated.View pointerEvents="none"
        style={[ch.shimmer, { transform: [{ translateX: shimA }] }]} />

      <View style={ch.body}>
        {/* Left */}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ch.eyebrow}>CONFIGURATION CENTER</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[ch.logoBox, { borderColor: C.amber + '55', backgroundColor: C.amber + '10' }]}>
              <MaterialCommunityIcons name="tune-variant" size={20} color={C.amber} />
            </View>
            <GlitchText style={ch.brand}>CFG</GlitchText>
          </View>
          {/* Status pills */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <View style={[ch.pill, { borderColor: (isConn ? C.green : C.amber) + '60',
              backgroundColor: (isConn ? C.green : C.amber) + '0C' }]}>
              <PulseDot color={isConn ? C.green : C.amber} size={5} />
              <Text style={[ch.pillTxt, { color: isConn ? C.green : C.amber }]}>
                {isConn ? 'PC CONNECTED' : 'OFFLINE'}
              </Text>
            </View>
            <View style={[ch.pill, { borderColor: C.amber + '40', backgroundColor: C.amber + '08' }]}>
              <MaterialCommunityIcons name="shield-check" size={9} color={C.amber} />
              <Text style={[ch.pillTxt, { color: C.amber }]}>AES-256</Text>
            </View>
          </View>
        </View>

        {/* Right: clock */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={ch.clock}>{time}</Text>
            <Text style={[ch.secs, { color: C.amber }]}>{secs}</Text>
          </View>
          <Text style={ch.clockSub}>LOCAL · SECURE</Text>
          <Text style={ch.dateTxt}>{dateStr}</Text>
          <View style={[ch.vBadge, { borderColor: C.amber + '40', backgroundColor: C.amber + '0A' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.amber }}>v8.0.0</Text>
          </View>
        </View>
      </View>

      {/* Hex tag */}
      <View style={{ position: 'absolute', top: safeTop + 4, right: 14 }}>
        <HexTag seed="butler-cfg-screen" color={C.amber} opacity={0.35} />
      </View>

      {/* Scanline when connected */}
      {isConn && <ScanlineOverlay color={C.amber} duration={5000} opacity={0.12} />}

      {/* Bottom circuit trace */}
      <View style={{ height: 2, flexDirection: 'row' }}>
        {[
          { flex: 4, bg: C.amber + '18' }, { width: 14, bg: C.amber },
          { flex: 2, bg: C.green + '14' }, { width: 8,  bg: C.green },
          { flex: 6, bg: C.amber + '08' }, { width: 10, bg: C.cyan  },
          { flex: 3, bg: C.cyan + '10'  },
        ].map((seg, i) => (
          <View key={i} style={[{ backgroundColor: seg.bg }, 'flex' in seg ? { flex: seg.flex } : { width: seg.width as number }]} />
        ))}
      </View>
    </View>
  );
}
const ch = StyleSheet.create({
  root:      { backgroundColor: C.surf, overflow: 'hidden' },
  topStripe: { height: 2.5, backgroundColor: C.amber },
  shimmer:   { position: 'absolute', top: 0, bottom: 0, width: 90,
    backgroundColor: 'rgba(255,176,32,0.04)', zIndex: 0 },
  body:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD,
    paddingTop: 13, paddingBottom: 13, zIndex: 1 },
  eyebrow:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '700', color: C.amber + '60', letterSpacing: 2 },
  logoBox:   { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:     { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: 2 } as any,
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  pillTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 },
  clock:     { fontFamily: MONO, fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: 1 },
  secs:      { fontFamily: MONO, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  clockSub:  { fontFamily: MONO, fontSize: 8, color: C.mid, letterSpacing: 1, fontWeight: '700' },
  dateTxt:   { fontFamily: MONO, fontSize: 7.5, color: C.dim, letterSpacing: 0.5 },
  vBadge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
});

// ─── SYSTEM STATUS CARD ───────────────────────────────────────────────
function SystemStatusCard({ isConn }: { isConn: boolean }) {
  const stats = [
    { label: 'SECURITY',  value: 'AES-256',  color: C.green,  icon: 'lock'       },
    { label: 'PROTOCOL',  value: 'HMAC',     color: C.cyan,   icon: 'security'   },
    { label: 'NETWORK',   value: 'LAN',      color: C.amber,  icon: 'wifi'       },
    { label: 'CLOUD',     value: 'ZERO',     color: C.red,    icon: 'cloud-off'  },
  ];
  return (
    <GlowCard glowColor={C.amber} active={isConn} corners={true} hexSeed="system-status"
      style={{ marginBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 13 }}>
        <View style={[ssc.orb, { borderColor: (isConn ? C.green : C.amber) + '55',
          backgroundColor: (isConn ? C.green : C.amber) + '0E' }]}>
          <MaterialCommunityIcons name={isConn ? 'check-network' : 'server-off'}
            size={18} color={isConn ? C.green : C.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.text }}>
            SYSTEM STATUS
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 2 }}>
            {isConn ? 'PC server online · full automation enabled' : 'Offline · local-only mode'}
          </Text>
        </View>
        <StatusChip
          label={isConn ? 'ONLINE' : 'OFFLINE'}
          color={isConn ? C.green : C.mid}
          pulse={isConn}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stats.map((s, i) => (
          <View key={i} style={[ssc.cell, { borderColor: s.color + '30', backgroundColor: s.color + '08',
            borderTopColor: s.color, borderTopWidth: 2.5 }]}>
            <MaterialIcons name={s.icon as any} size={13} color={s.color + '80'} />
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: s.color,
              lineHeight: 16 }}>{s.value}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 7.5, color: s.color + '70',
              letterSpacing: 0.5 }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </GlowCard>
  );
}
const ssc = StyleSheet.create({
  orb:  { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
  cell: { flex: 1, alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 10, gap: 4 },
});

// ─── MODEL SELECTOR ───────────────────────────────────────────────────
function ModelSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const selected = POPULAR_MODELS.find(m => m.id === value);

  return (
    <View style={{ gap: 10 }}>
      {/* Current model display */}
      <TouchableOpacity onPress={() => { haptics.light(); setShowPicker(v => !v); }}
        style={[msel.current, { borderColor: (selected?.color ?? C.cyan) + '50' }]}>
        <CornerFrame color={(selected?.color ?? C.cyan) + '40'} size={8} thickness={1.5} />
        <View style={[msel.badge, { backgroundColor: (selected?.color ?? C.cyan) + '15',
          borderColor: (selected?.color ?? C.cyan) + '50' }]}>
          <MaterialCommunityIcons name="brain" size={16} color={selected?.color ?? C.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: C.mid, letterSpacing: 1.5, marginBottom: 2 }}>
            ACTIVE MODEL
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 15, fontWeight: '900',
            color: selected?.color ?? C.cyan }}>{selected?.label ?? value}</Text>
          {selected && (
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 1 }}>
              {selected.size} parameters · local inference
            </Text>
          )}
        </View>
        <View style={[msel.sizeBadge, { borderColor: (selected?.color ?? C.cyan) + '45',
          backgroundColor: (selected?.color ?? C.cyan) + '0A' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900',
            color: selected?.color ?? C.cyan }}>{selected?.size ?? '?'}</Text>
        </View>
        <MaterialIcons name={showPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={18} color={(selected?.color ?? C.cyan) + '80'} />
      </TouchableOpacity>

      {/* Quick-pick chips */}
      {showPicker && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {POPULAR_MODELS.map((m) => {
            const isActive = m.id === value;
            return (
              <TouchableOpacity key={m.id}
                onPress={() => { haptics.selection(); onChange(m.id); }}
                style={[msel.chip, { borderColor: m.color + (isActive ? 'AA' : '35'),
                  backgroundColor: m.color + (isActive ? '18' : '08') }]}>
                <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: m.color }}>
                  {m.label}
                </Text>
                <View style={[msel.sizeTag, { borderColor: m.color + '40' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 7.5, color: m.color + 'BB' }}>{m.size}</Text>
                </View>
                {isActive && <MaterialIcons name="check-circle" size={11} color={m.color} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Custom model input */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: MONO, fontSize: 8.5, color: C.mid, letterSpacing: 1 }}>
          OR ENTER CUSTOM MODEL NAME
        </Text>
        <NexusInput
          value={value}
          onChangeText={(v: string) => onChange(v)}
          placeholder="llama3.2 / qwen2.5-coder:7b / ..."
          accent={C.cyan}
        />
      </View>
    </View>
  );
}
const msel = StyleSheet.create({
  current:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
    borderWidth: 1.5, backgroundColor: C.surf, position: 'relative', overflow: 'hidden' },
  badge:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
  sizeBadge:{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 11, paddingVertical: 8 },
  sizeTag:  { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
});

// ─── PRIVACY SPEC CARD ────────────────────────────────────────────────
function PrivacyCard() {
  const rows = [
    { icon: 'cloud-off-outline',  label: 'Zero Cloud',      desc: 'All execution on your LAN — nothing routed externally', color: C.cyan   },
    { icon: 'eye-off-outline',    label: 'No Tracking',     desc: 'No analytics, no ad IDs, no background network calls',  color: C.green  },
    { icon: 'hand-pointing-right',label: 'You Control It',  desc: 'Nothing runs without a tap — consent before execution', color: C.amber  },
    { icon: 'delete-outline',     label: 'Delete Anytime',  desc: 'One tap wipes all local data — full GDPR compliance',   color: C.purple },
  ];
  return (
    <GlowCard glowColor={C.green} hexSeed="privacy-spec" corners style={{ marginBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View style={[{ width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center',
          justifyContent: 'center', borderColor: C.green + '55', backgroundColor: C.green + '0E' }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={C.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.green }}>
            PRIVACY GUARANTEE
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 2 }}>
            Verified local-only architecture
          </Text>
        </View>
        <StatusChip label="VERIFIED" color={C.green} />
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: 10,
          borderLeftWidth: 2, borderLeftColor: r.color + '50', paddingLeft: 10, paddingVertical: 8,
          borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: C.border }]}>
          <MaterialCommunityIcons name={r.icon as any} size={14} color={r.color} style={{ marginTop: 1, flexShrink: 0 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: r.color }}>{r.label}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 2, lineHeight: 14 }}>{r.desc}</Text>
          </View>
        </View>
      ))}
    </GlowCard>
  );
}

// ─── THEME PREVIEW STRIP ─────────────────────────────────────────────
function ThemeStrip({ onPress }: { onPress: () => void }) {
  const themes = [
    { label: 'NEXUS',   color: '#00E5FF' },
    { label: 'PHANTOM', color: '#CC44FF' },
    { label: 'MATRIX',  color: '#00FF88' },
    { label: 'AMBER',   color: '#FFB020' },
    { label: 'RUBY',    color: '#FF3344' },
    { label: 'SAKURA',  color: '#FF44AA' },
    { label: 'COBALT',  color: '#4A9EFF' },
    { label: 'TEAL',    color: '#00CCBB' },
  ];
  return (
    <TouchableOpacity onPress={() => { haptics.light(); onPress(); }} activeOpacity={0.88}>
      <GlowCard glowColor={C.purple} hexSeed="theme-picker" style={{ marginBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={[{ width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center',
            justifyContent: 'center', borderColor: C.purple + '55', backgroundColor: C.purple + '0E' }]}>
            <MaterialCommunityIcons name="palette-swatch" size={16} color={C.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.purple }}>
              THEMES & FX
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 }}>
              {themes.length} themes · live preview · FX animations
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={16} color={C.purple + '70'} />
        </View>
        {/* Color swatch row */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {themes.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
              borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
              borderColor: t.color + '45', backgroundColor: t.color + '0A' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.color }} />
              <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: t.color }}>{t.label}</Text>
            </View>
          ))}
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, alignSelf: 'center', marginLeft: 4 }}>
            → tap to apply
          </Text>
        </View>
      </GlowCard>
    </TouchableOpacity>
  );
}

// ─── DANGER ZONE ──────────────────────────────────────────────────────
function DangerZone({ onReset, onReplay }: { onReset: () => void; onReplay: () => void }) {
  return (
    <GlowCard glowColor={C.red} corners hexSeed="danger-zone" style={{ marginBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View style={[{ width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center',
          justifyContent: 'center', borderColor: C.red + '55', backgroundColor: C.red + '0E' }]}>
          <MaterialCommunityIcons name="alert-octagon-outline" size={18} color={C.red} />
        </View>
        <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.red, flex: 1 }}>
          DANGER ZONE
        </Text>
        <StatusChip label="IRREVERSIBLE" color={C.red} dot={false} pulse={false} />
      </View>
      <View style={{ gap: 8 }}>
        <NexBtn label="REPLAY TUTORIAL" icon="school"
          color={C.amber} variant="ghost" onPress={onReplay} />
        <NexBtn label="RESET ALL DATA" icon="delete-sweep"
          color={C.red} variant="outline" onPress={onReset} />
      </View>
    </GlowCard>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────
function CfgFooter() {
  return (
    <View style={{ alignItems: 'center', gap: 6, paddingVertical: 22, borderTopWidth: 1, borderTopColor: C.border }}>
      {/* Rainbow bar */}
      <View style={{ flexDirection: 'row', height: 2, width: 80, borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
        {[C.cyan, C.green, C.amber, C.purple, C.red].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name="robot-happy-outline" size={13} color={C.mid} />
        <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, letterSpacing: 1 }}>
          BUTLER AI  ·  v8.0.0  ·  NEXUS COMMAND CENTER
        </Text>
        <MaterialCommunityIcons name="shield-check" size={13} color={C.mid} />
      </View>
      <Text style={{ fontFamily: MONO, fontSize: 8, color: C.dim, letterSpacing: 0.5 }}>
        ZERO CLOUD · AES-256 · 100% LOCAL
      </Text>
      <HexTag seed="butler-ai-v800" color={C.amber} opacity={0.3} />
    </View>
  );
}

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

  const [model,       setModel]      = useState('llama3.2');
  const [system,      setSystem]     = useState('');
  const [saved,       setSaved]      = useState(false);
  const [hapticsOn,   setHapticsOn]  = useState(true);
  const [autoReconn,  setAutoReconn] = useState(true);
  const [debugMode,   setDebugMode]  = useState(false);
  const [isConn,      setIsConn]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [[, m], [, s], [, h], [, ar], [, dbg]] = await AsyncStorage.multiGet([
          MODEL_KEY, SYSTEM_KEY,
          'butler.haptics.v1', 'butler.autoreconn.v1', 'butler.debug.v1',
        ]);
        if (m)   setModel(m);
        if (s)   setSystem(s);
        if (h   !== null) setHapticsOn(h !== '0');
        if (ar  !== null) setAutoReconn(ar !== '0');
        if (dbg !== null) setDebugMode(dbg === '1');
      } catch {}
    })();
    // Check connection
    try { setIsConn(serverConnection.isConnected?.()); } catch {}
  }, []);

  const onSave = useCallback(async () => {
    haptics.success();
    await AsyncStorage.multiSet([
      [MODEL_KEY,  model.trim() || 'llama3.2'],
      [SYSTEM_KEY, system],
      ['butler.haptics.v1',    hapticsOn  ? '1' : '0'],
      ['butler.autoreconn.v1', autoReconn ? '1' : '0'],
      ['butler.debug.v1',      debugMode  ? '1' : '0'],
    ]).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }, [model, system, hapticsOn, autoReconn, debugMode]);

  const handleShareLog = useCallback(async () => {
    haptics.medium();
    try {
      const { logger } = await import('@/utils/logger');
      const entries = logger.getEntries();
      const lines   = entries.map(e => `[${new Date(e.ts).toISOString()}] ${e.level.toUpperCase()}: ${e.msg}`);
      const header  = `Butler AI Diagnostic Log\nGenerated: ${new Date().toISOString()}\nEntries: ${entries.length}\n${'─'.repeat(40)}\n`;
      await Share.share({
        title: 'Butler AI Diagnostic Log',
        message: header + (lines.length ? lines.join('\n') : '(no entries yet)'),
      });
    } catch (err) {
      console.warn('[Settings] Share log failed:', err);
    }
  }, []);

  const onReplayOnboarding = useCallback(() => {
    Alert.alert('REPLAY TUTORIAL', 'Restart the full onboarding flow?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'RESTART NOW', onPress: async () => {
        haptics.heavy();
        await resetOnboarding();
        notifyOnboardingReset();
        await new Promise<void>(r => setTimeout(r, 80));
        try { router.replace('/(tabs)/onboarding' as any); } catch {
          try { router.navigate('/(tabs)/onboarding' as any); } catch {}
        }
      }},
    ]);
  }, []);

  const onReset = useCallback(() => {
    Alert.alert('RESET ALL DATA',
      'This permanently clears all server config, model settings, and preferences. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'RESET', style: 'destructive', onPress: async () => {
          haptics.heavy();
          await AsyncStorage.multiRemove([
            MODEL_KEY, SYSTEM_KEY,
            '@butler_onboarding_done_v2', '@butler_welcome_complete_v1',
            'butler.haptics.v1', 'butler.autoreconn.v1', 'butler.debug.v1',
          ]).catch(() => {});
          setModel('llama3.2'); setSystem('');
          setHapticsOn(true); setAutoReconn(true); setDebugMode(false);
          try {
            const { serverConnection } = await import('@/services/serverConnection');
            await serverConnection.clearAll?.().catch?.(() => {});
          } catch {}
        }},
      ]
    );
  }, []);

  const openURL = (url: string) => {
    import('react-native').then(({ Linking }) => Linking.openURL(url).catch(() => {}));
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TabSwipeOverlay />
      <CfgHeader safeTop={insets.top} isConn={isConn} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: PAD, paddingBottom: insets.bottom + 130, gap: 14 }}
      >
        {/* ── System Status ── */}
        <SystemStatusCard isConn={isConn} />

        {/* ── AI Model ── */}
        <View>
          <Sec icon="brain" label="AI MODEL" color={C.cyan} />
          <GlowCard glowColor={C.cyan} hexSeed="ai-model-cfg">
            <ModelSelector value={model} onChange={v => { setModel(v); setSaved(false); }} />
          </GlowCard>
        </View>

        {/* ── System Prompt ── */}
        <View>
          <Sec icon="text-box-outline" label="SYSTEM PROMPT" color={C.purple}
            right={
              <View style={{ borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                borderColor: C.purple + '40', backgroundColor: C.purple + '08' }}>
                <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: C.purple }}>OPTIONAL</Text>
              </View>
            }
          />
          <GlowCard glowColor={C.purple} hexSeed="system-prompt">
            <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, letterSpacing: 0.5, marginBottom: 8 }}>
              BUTLER BEHAVIOR DIRECTIVE
            </Text>
            <NexusInput
              value={system}
              onChangeText={(v: string) => { setSystem(v); setSaved(false); }}
              placeholder="Guide Butler's behavior, tone, or specialization..."
              multiline
              accent={C.purple}
            />
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 8, lineHeight: 14 }}>
              Prepended to every conversation. Leave blank for default Butler AI personality.
            </Text>
          </GlowCard>
        </View>

        {/* ── Preferences ── */}
        <View>
          <Sec icon="cog-outline" label="SYSTEM PREFERENCES" color={C.amber} />
          <ToggleRow icon="vibrate"    label="HAPTIC FEEDBACK"  sub="Tactile responses on every interaction"     value={hapticsOn}  onToggle={setHapticsOn}  color={C.amber} />
          <ToggleRow icon="wifi-sync"  label="AUTO RECONNECT"   sub="Silently reconnect on app resume"           value={autoReconn} onToggle={setAutoReconn} color={C.cyan}  />
          <ToggleRow icon="bug-report" label="DEBUG MODE"       sub="Verbose logs + diagnostic overlay"          value={debugMode}  onToggle={setDebugMode}  color={C.purple} iconLib="material" />
        </View>

        {/* ── Save ── */}
        <NexBtn
          label={saved ? 'SAVED ✓' : 'SAVE CONFIGURATION'}
          icon={saved ? 'check-circle' : 'save'}
          color={saved ? C.green : C.amber}
          variant="solid"
          onPress={onSave}
        />

        {/* ── Privacy Guarantee ── */}
        <View>
          <Sec icon="shield-check-outline" label="PRIVACY & SECURITY" color={C.green} />
          <PrivacyCard />
        </View>

        {/* ── Themes ── */}
        <View>
          <Sec icon="palette" label="THEMES & COSMETICS" color={C.purple} />
          <ThemeStrip onPress={() => { (global as any).__butlerSwitchTab?.('cosmetic'); }} />
        </View>

        {/* ── Legal & Help ── */}
        <View>
          <Sec icon="gavel" label="LEGAL & SUPPORT" color={C.blue} />
          <LinkRow icon="shield-star-outline" iconLib="community" label="SECURITY & TRUST"
            sub="Zero cloud · no tracking · how your data stays safe"
            color={C.cyan} badge="VIEW" onPress={() => router.push('/security-trust' as any)} />
          <LinkRow icon="bug-report" iconLib="material" label="SHARE DIAGNOSTIC LOG"
            sub="Export last 100 log entries — stays on device until you share"
            color={C.purple} onPress={handleShareLog} />
          <LinkRow icon="shield-check" iconLib="community" label="PRIVACY POLICY"
            sub="GDPR compliant · device UUID only" color={C.green}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/')} />
          <LinkRow icon="file-document-outline" iconLib="community" label="TERMS OF SERVICE"
            sub="18+ · personal PC use only" color={C.amber}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#terms-of-service')} />
          <LinkRow icon="alert-circle-outline" iconLib="community" label="CRASH REPORT"
            sub="Startup crash log · timestamps · stack trace" color={C.red}
            onPress={() => router.push('/crash-report' as any)} />
          <LinkRow icon="delete-forever" iconLib="community" label="DATA DELETION"
            sub="GDPR right to erasure" color={C.red}
            onPress={() => openURL('https://shawnjan-cmd.github.io/privacy-policy-/#data-deletion')} />
        </View>

        {/* ── Danger Zone ── */}
        <View>
          <Sec icon="alert-octagon" label="DANGER ZONE" color={C.red} />
          <DangerZone onReset={onReset} onReplay={onReplayOnboarding} />
        </View>

        {/* ── Footer ── */}
        <CfgFooter />
      </ScrollView>
    </View>
  );
}
