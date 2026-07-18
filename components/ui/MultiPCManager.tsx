/**
 * MultiPCManager — Elite/Team tier feature
 * Manage and switch between multiple saved PC profiles.
 * One-tap switch with animated connection feedback.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Animated,
  Platform, Dimensions, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePurchase } from '@/contexts/PurchaseContext';
import { SavedPC } from '@/services/remoteAccessTiers';
import { serverConnection } from '@/services/serverConnection';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const C = {
  bg:     '#010508', surf:   '#060E1A', surf2:  '#09141F',
  cyan:   '#00E5FF', green:  '#00FF88', amber:  '#FFB020',
  red:    '#FF3344', purple: '#CC44FF', mid:    '#5A7A96',
  dim:    '#1A2E44', text:   '#C8E4F0', teal:   '#00CCBB',
  blue:   '#4488FF', pink:   '#FF6EB4',
};

const PC_ICONS = [
  'desktop-tower', 'laptop', 'server', 'desktop-mac', 'nas',
  'raspberry-pi', 'server-network', 'server-plus', 'desktop-classic',
];
const PC_COLORS = [C.cyan, C.green, C.amber, C.purple, C.pink, C.teal, C.blue, C.red];

function PCCard({
  pc, isActive, onConnect, onDelete, onSetPrimary, connecting,
}: {
  pc: SavedPC;
  isActive: boolean;
  onConnect: (pc: SavedPC) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  connecting: string | null;
}) {
  const glow = useRef(new Animated.Value(0.3)).current;
  const isBusy = connecting === pc.id;

  useEffect(() => {
    if (!isActive) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0.2, duration: 1200, useNativeDriver: false }),
    ]));
    l.start(); return () => l.stop();
  }, [isActive]);

  const borderC = isActive
    ? glow.interpolate({ inputRange: [0.2, 1], outputRange: [pc.color + '50', pc.color + 'DD'] })
    : pc.color + '30';

  const since = pc.lastSeen
    ? (() => {
        const d = Date.now() - pc.lastSeen;
        if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
        if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
        return `${Math.floor(d / 3600000)}h ago`;
      })()
    : 'Never';

  return (
    <Animated.View style={[pc2.card, { borderColor: borderC, backgroundColor: isActive ? pc.color + '0E' : C.surf2 }]}>
      <View style={[pc2.topBar, { backgroundColor: pc.color }]} />

      {/* Primary star */}
      {pc.isPrimary && (
        <View style={[pc2.primaryBadge, { backgroundColor: pc.color + '20', borderColor: pc.color + '60' }]}>
          <MaterialIcons name="star" size={9} color={pc.color} />
          <Text style={[pc2.primaryTxt, { color: pc.color }]}>PRIMARY</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10 }}>
        {/* Icon */}
        <View style={[pc2.iconBox, { borderColor: pc.color + '55', backgroundColor: pc.color + '12' }]}>
          <MaterialCommunityIcons name={pc.icon as any} size={22} color={pc.color} />
          {isActive && (
            <View style={[pc2.onlineDot, { backgroundColor: C.green, borderColor: C.surf2 }]} />
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={[pc2.pcName, { color: '#FFF' }]}>{pc.name}</Text>
          <Text style={pc2.pcAddr}>{pc.ip}:{pc.port}</Text>
          <Text style={[pc2.lastSeen, { color: pc.color + '70' }]}>Last: {since}</Text>
        </View>

        {/* Status */}
        <View style={[pc2.statusBadge, {
          borderColor: (isActive ? C.green : C.mid) + '50',
          backgroundColor: (isActive ? C.green : C.mid) + '0C',
        }]}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isActive ? C.green : C.mid }} />
          <Text style={[pc2.statusTxt, { color: isActive ? C.green : C.mid }]}>
            {isActive ? 'LIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={pc2.actions}>
        <Pressable
          onPress={() => { haptics.heavy(); onConnect(pc); }}
          disabled={!!connecting}
          style={({ pressed }) => [pc2.connectBtn, { backgroundColor: pc.color, opacity: pressed || !!connecting ? 0.75 : 1 }]}
        >
          {isBusy
            ? <ActivityIndicator size="small" color="#000" />
            : <MaterialIcons name="link" size={14} color="#000" />}
          <Text style={pc2.connectTxt}>{isBusy ? 'CONNECTING...' : isActive ? 'RECONNECT' : 'CONNECT'}</Text>
        </Pressable>

        {!pc.isPrimary && (
          <TouchableOpacity onPress={() => onSetPrimary(pc.id)} style={pc2.iconBtn}>
            <MaterialIcons name="star-outline" size={16} color={C.mid} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onDelete(pc.id)} style={pc2.iconBtn}>
          <MaterialIcons name="delete-outline" size={16} color={C.red + '90'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const pc2 = StyleSheet.create({
  card:        { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', position: 'relative', marginBottom: 10,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8 }, android: { elevation: 5 } }) },
  topBar:      { height: 2.5 },
  primaryBadge:{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, zIndex: 10 },
  primaryTxt:  { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  iconBox:     { width: 48, height: 48, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  onlineDot:   { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  pcName:      { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  pcAddr:      { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 },
  lastSeen:    { fontFamily: MONO, fontSize: 8, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, flexShrink: 0 },
  statusTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  actions:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
  connectBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, paddingVertical: 10 },
  connectTxt:  { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000' },
  iconBtn:     { width: 36, height: 36, borderRadius: 9, borderWidth: 1, borderColor: C.dim, alignItems: 'center', justifyContent: 'center' },
});

// ── Add PC Form ───────────────────────────────────────────────────
function AddPCForm({ onSave, onCancel, maxReached }: {
  onSave: (data: Omit<SavedPC, 'id'>) => void;
  onCancel: () => void;
  maxReached: boolean;
}) {
  const [name, setName]     = useState('');
  const [ip, setIp]         = useState('');
  const [port, setPort]     = useState('8766');
  const [iconIdx, setIconIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);

  if (maxReached) {
    return (
      <View style={af.outer}>
        <MaterialCommunityIcons name="server-off" size={28} color={C.amber} />
        <Text style={af.limitTxt}>PC limit reached for your plan</Text>
        <Text style={af.limitSub}>Upgrade to ELITE to manage more PCs</Text>
      </View>
    );
  }

  return (
    <View style={af.outer}>
      <Text style={af.title}>ADD NEW PC</Text>

      <TextInput style={af.input} value={name} onChangeText={setName} placeholder="PC Name (e.g. Gaming Rig)" placeholderTextColor={C.dim} />
      <TextInput style={af.input} value={ip} onChangeText={setIp} placeholder="IP Address" placeholderTextColor={C.dim} keyboardType="numeric" autoCorrect={false} />
      <TextInput style={af.input} value={port} onChangeText={setPort} placeholder="Port" placeholderTextColor={C.dim} keyboardType="numeric" />

      <Text style={af.sectionLabel}>ICON</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {PC_ICONS.map((icon, i) => (
          <TouchableOpacity key={i} onPress={() => setIconIdx(i)}
            style={[af.iconChip, iconIdx === i && { borderColor: PC_COLORS[colorIdx] + '80', backgroundColor: PC_COLORS[colorIdx] + '18' }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={iconIdx === i ? PC_COLORS[colorIdx] : C.mid} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={af.sectionLabel}>COLOR</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {PC_COLORS.map((col, i) => (
          <TouchableOpacity key={i} onPress={() => setColorIdx(i)}
            style={[af.colorChip, { backgroundColor: col + '20', borderColor: colorIdx === i ? col : C.dim }]}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col }} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Pressable onPress={onCancel} style={[af.btn, { borderColor: C.dim, backgroundColor: C.surf2 }]}>
          <Text style={[af.btnTxt, { color: C.mid }]}>CANCEL</Text>
        </Pressable>
        <Pressable onPress={() => {
          if (!name.trim() || !ip.trim()) return;
          onSave({ name: name.trim(), ip: ip.trim(), port: port.trim() || '8766', icon: PC_ICONS[iconIdx], color: PC_COLORS[colorIdx], isPrimary: false });
        }} style={[af.btn, { flex: 2, backgroundColor: C.cyan }]}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={[af.btnTxt, { color: '#000' }]}>ADD PC</Text>
        </Pressable>
      </View>
    </View>
  );
}
const af = StyleSheet.create({
  outer:       { backgroundColor: C.surf2, borderRadius: 14, borderWidth: 1, borderColor: C.cyan + '30', padding: 16, marginBottom: 12, gap: 10, alignItems: 'center' },
  title:       { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.cyan, letterSpacing: 1.5, alignSelf: 'flex-start' },
  limitTxt:    { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.amber, marginTop: 8 },
  limitSub:    { fontFamily: MONO, fontSize: 9, color: C.mid },
  input:       { width: '100%', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.dim, borderRadius: 10, padding: 11, fontFamily: MONO, fontSize: 12, color: C.text },
  sectionLabel:{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.mid, letterSpacing: 1.5, alignSelf: 'flex-start', marginTop: 4 },
  iconChip:    { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: C.dim, alignItems: 'center', justifyContent: 'center' },
  colorChip:   { width: 34, height: 34, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 11 },
  btnTxt:      { fontFamily: MONO, fontSize: 11, fontWeight: '900' },
});

// ── Main Modal ────────────────────────────────────────────────────
export function MultiPCManager({ visible, onClose, onConnected }: {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { savedPCs, savePCProfile, deletePCProfile, setPrimary, maxPCs } = usePurchase();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const slideA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideA, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }).start();
      // Find currently connected PC
      const currentIp = serverConnection.getIP();
      if (currentIp) {
        const match = savedPCs.find(p => p.ip === currentIp);
        if (match) setActiveId(match.id);
      }
    } else {
      slideA.setValue(0);
    }
  }, [visible, savedPCs]);

  const handleConnect = useCallback(async (pc: SavedPC) => {
    if (connecting) return;
    setConnecting(pc.id);
    try {
      const result = await serverConnection.connectManual(pc.ip, pc.port);
      if (result.success) {
        haptics.success();
        setActiveId(pc.id);
        await remoteAccessTiers_updateLastSeen(pc.id);
        onConnected?.();
      } else {
        haptics.warning?.();
      }
    } catch {}
    setConnecting(null);
  }, [connecting, onConnected]);

  const slideY = slideA.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[{ backgroundColor: C.surf, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '90%', paddingBottom: insets.bottom + 8 }, { transform: [{ translateY: slideY }] }]}>
          <View style={{ height: 3, flexDirection: 'row' }}>
            {[C.cyan, C.green, C.purple, C.amber, C.cyan].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 }}>
            <MaterialCommunityIcons name="server-network" size={22} color={C.cyan} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 }}>MULTI-PC MANAGER</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 }}>{savedPCs.length}/{maxPCs} PCs saved · Elite feature</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={{ width: 36, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: C.cyan + '50', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={showAdd ? 'close' : 'add'} size={18} color={C.cyan} />
            </TouchableOpacity>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="close" size={16} color={C.mid} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
            {showAdd && (
              <AddPCForm
                maxReached={savedPCs.length >= maxPCs}
                onSave={async (data) => { await savePCProfile(data); setShowAdd(false); }}
                onCancel={() => setShowAdd(false)}
              />
            )}
            {savedPCs.length === 0 && !showAdd ? (
              <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                <MaterialCommunityIcons name="server-plus" size={48} color={C.dim} />
                <Text style={{ fontFamily: MONO, fontSize: 12, color: C.mid, textAlign: 'center' }}>No PCs saved yet</Text>
                <Text style={{ fontFamily: MONO, fontSize: 9, color: C.dim, textAlign: 'center' }}>Tap + to add your first PC profile for instant one-tap switching</Text>
                <Pressable onPress={() => setShowAdd(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.cyan, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 20 }}>
                  <MaterialIcons name="add" size={16} color="#000" />
                  <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' }}>ADD FIRST PC</Text>
                </Pressable>
              </View>
            ) : (
              savedPCs.map(pc => (
                <PCCard
                  key={pc.id}
                  pc={pc}
                  isActive={activeId === pc.id}
                  onConnect={handleConnect}
                  onDelete={deletePCProfile}
                  onSetPrimary={setPrimary}
                  connecting={connecting}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Thin bridge to avoid circular import
async function remoteAccessTiers_updateLastSeen(id: string) {
  try {
    const { remoteAccessTiers } = await import('@/services/remoteAccessTiers');
    await remoteAccessTiers.updatePCLastSeen(id);
  } catch {}
}

export default MultiPCManager;
