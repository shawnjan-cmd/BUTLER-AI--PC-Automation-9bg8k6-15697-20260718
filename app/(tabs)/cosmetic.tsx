/**
 * BUTLER AI — SKINS & FORGE v2.0
 * Fresh cyberpunk redesign · token system
 * Themes · FX · Support — all using shared design tokens
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Dimensions, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import {
  useCosmetic, PACK_THEMES, TIER_CONFIG,
  type AppTheme, type TierId,
} from '@/contexts/CosmeticContext';
import { purchasePack, loadPurchaseState } from '@/services/purchaseState';

const SW   = Math.max(320, Dimensions.get('window').width);
const MONO: any = FONT.mono;
const PAD = 14;

// ─── TABS ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'themes',  label: 'THEMES',  icon: 'palette',    color: COLOR.magenta },
  { id: 'fx',      label: 'FX',      icon: 'shimmer',    color: COLOR.amber   },
  { id: 'support', label: 'SUPPORT', icon: 'heart',      color: COLOR.pink    },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── PULSE DOT ────────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ─── HEADER ───────────────────────────────────────────────────────
function SkinsHeader({ safeTop, activeTab, onTabChange, accent }: { safeTop: number; activeTab: TabId; onTabChange: (t: TabId) => void; accent: string }) {
  return (
    <View style={[skh.root, { paddingTop: safeTop }]}>
      <View style={{ height: 3, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <View style={skh.row}>
        <View style={[skh.iconBox, { borderColor: COLOR.magenta + '50', backgroundColor: glow(COLOR.magenta, 8) }]}>
          <MaterialCommunityIcons name="palette-swatch" size={20} color={COLOR.magenta} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={skh.brand}>
            <Text style={{ color: COLOR.magenta }}>{'['}</Text>
            <Text style={{ color: '#FFF' }}>SKINS</Text>
            <Text style={{ color: COLOR.amber }}>_FX</Text>
            <Text style={{ color: COLOR.magenta }}>{']'}</Text>
          </Text>
          <Text style={skh.sub}>
            <Text style={{ color: COLOR.magenta + '55' }}>{'# '}</Text>
            <Text style={{ color: COLOR.mid }}>{Object.keys(PACK_THEMES).length} themes · 6 FX slots · support</Text>
          </Text>
        </View>
      </View>
      {/* Mode bar */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLOR.magenta + '18' }}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          const Icon = MaterialCommunityIcons;
          return (
            <TouchableOpacity key={tab.id} onPress={() => { haptics.selection(); onTabChange(tab.id); }} activeOpacity={0.8}
              style={[skh.tab, isActive && { backgroundColor: glow(tab.color, 10), borderBottomColor: tab.color }]}>
              <Icon name={tab.icon as any} size={12} color={isActive ? tab.color : COLOR.dim} />
              <Text style={[skh.tabTxt, { color: isActive ? tab.color : COLOR.dim }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const skh = StyleSheet.create({
  root:    { backgroundColor: '#020609', ...SHADOW.dark },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 7 },
  iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:   { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 8.5, lineHeight: 13, marginTop: 2 },
  tab:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabTxt:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});

// ─── LIVE CHAT PREVIEW ────────────────────────────────────────────
function ChatPreview({ theme }: { theme: AppTheme }) {
  const glowA = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  const borderC = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [theme.primary + '40', theme.primary + 'CC'] });
  return (
    <Animated.View style={[cpv.wrap, { borderColor: borderC, backgroundColor: theme.bg }]}>
      <View style={[cpv.hdr, { borderBottomColor: theme.primary + '22', backgroundColor: theme.panel }]}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary }} />
        <Text style={[cpv.title, { color: theme.primary }]}>{theme.name}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: MONO, fontSize: 8, color: theme.textDim }}>PREVIEW</Text>
      </View>
      <View style={{ padding: 10, gap: 8 }}>
        <View style={[cpv.aiBubble, { backgroundColor: theme.aiBubble, borderColor: theme.aiBorder }]}>
          <Text style={[cpv.msgTxt, { color: theme.textHi }]} numberOfLines={2}>{`Butler AI running on ${theme.name} theme.`}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[cpv.userBubble, { backgroundColor: theme.userBubble, borderColor: theme.primary + '55' }]}>
            <Text style={[cpv.msgTxt, { color: theme.textHi }]}>Looking great! 🔥</Text>
          </View>
        </View>
        <View style={[cpv.inputBar, { backgroundColor: theme.chatBarBg, borderTopColor: theme.chatBarBorderTop }]}>
          <View style={[cpv.inputField, { borderColor: theme.primary + '44' }]}>
            <Text style={[cpv.inputHint, { color: theme.textDim }]}>{theme.promptGlyph} Type here...</Text>
          </View>
          <View style={[cpv.sendBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="send" size={10} color="#000" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
const cpv = StyleSheet.create({
  wrap:      { borderRadius: 16, borderWidth: 2, overflow: 'hidden', marginBottom: 14 },
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  title:     { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  aiBubble:  { alignSelf: 'flex-start', maxWidth: '80%', borderWidth: 1.5, borderRadius: 12, padding: 10 },
  userBubble:{ maxWidth: '80%', borderWidth: 1.5, borderRadius: 12, padding: 9 },
  msgTxt:    { fontFamily: MONO, fontSize: 11, lineHeight: 17 },
  inputBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderTopWidth: 1 },
  inputField:{ flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  inputHint: { fontFamily: MONO, fontSize: 10 },
  sendBtn:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

// ─── THEME CARD ───────────────────────────────────────────────────
function ThemeCard({ theme, isActive, isPreview, onPreview, onApply }: {
  theme: AppTheme; isActive: boolean; isPreview: boolean; onPreview: () => void; onApply: () => void;
}) {
  const TIER_COLORS: Record<string, string> = { free: COLOR.green, supporter: COLOR.cyan, pro: COLOR.pink, elite: COLOR.yellow };
  const tierCol = TIER_COLORS[theme.tier ?? 'free'] ?? COLOR.cyan;
  const scaleA = useRef(new Animated.Value(1)).current;
  const handlePI = () => Animated.spring(scaleA, { toValue: 0.96, tension: 400, friction: 12, useNativeDriver: true }).start();
  const handlePO = () => Animated.spring(scaleA, { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();
  return (
    <Animated.View style={[thc.wrap, {
      borderColor: isActive ? theme.primary + 'CC' : isPreview ? theme.primary + '80' : COLOR.border,
      backgroundColor: isActive ? theme.bg : COLOR.surf,
      transform: [{ scale: scaleA }],
      ...Platform.select({ ios: { shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isActive ? 0.5 : 0.15, shadowRadius: 12 }, android: { elevation: isActive ? 8 : 3 } }),
    }]}>
      <View style={[thc.bar, { backgroundColor: theme.primary }]} />
      <View style={{ padding: 13, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[thc.iconBox, { borderColor: theme.primary + '60', backgroundColor: glow(theme.primary, 10) }]}>
            <MaterialCommunityIcons name={(theme.icon ?? 'palette') as any} size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[thc.name, { color: theme.primary }]} numberOfLines={1}>{theme.name}</Text>
            <Text style={thc.tagline} numberOfLines={1}>{theme.tagline}</Text>
          </View>
          <View style={[thc.tierBadge, { borderColor: tierCol + '50', backgroundColor: glow(tierCol, 10) }]}>
            <Text style={[thc.tierTxt, { color: tierCol }]}>{(theme.tier ?? 'FREE').toUpperCase()}</Text>
          </View>
        </View>
        {/* Color swatches */}
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          {[theme.primary, theme.secondary, theme.tertiary, theme.bg, theme.panel].map((c, i) => (
            <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
          ))}
        </View>
        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={onPreview} onPressIn={handlePI} onPressOut={handlePO}
            style={({ pressed }) => [thc.previewBtn, { borderColor: theme.primary + '55', backgroundColor: isPreview ? glow(theme.primary, 22) : pressed ? glow(theme.primary, 12) : 'transparent' }]}>
            <MaterialIcons name={isPreview ? 'visibility' : 'visibility-outlined'} size={12} color={theme.primary} />
            <Text style={[thc.previewTxt, { color: theme.primary }]}>{isPreview ? 'PREVIEWING' : 'PREVIEW'}</Text>
          </Pressable>
          <Pressable onPress={onApply} onPressIn={handlePI} onPressOut={handlePO}
            style={({ pressed }) => [thc.applyBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
            <MaterialIcons name={isActive ? 'check-circle' : 'bolt'} size={12} color="#000" />
            <Text style={thc.applyTxt}>{isActive ? 'ACTIVE' : 'APPLY'}</Text>
          </Pressable>
        </View>
      </View>
      {isActive && (
        <View style={[thc.activePill, { borderColor: theme.primary + '70', backgroundColor: glow(theme.primary, 18) }]}>
          <PulseDot color={theme.primary} size={5} />
          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: theme.primary, letterSpacing: 0.5 }}>ACTIVE</Text>
        </View>
      )}
    </Animated.View>
  );
}
const thc = StyleSheet.create({
  wrap:      { borderRadius: 16, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  bar:       { height: 3 },
  iconBox:   { width: 36, height: 36, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:      { fontFamily: MONO, fontSize: 11.5, fontWeight: '900', letterSpacing: 0.5 },
  tagline:   { fontFamily: MONO, fontSize: 8.5, color: COLOR.mid, lineHeight: 12 },
  tierBadge: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tierTxt:   { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  previewBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9 },
  previewTxt:{ fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  applyBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, paddingVertical: 9 },
  applyTxt:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.4 },
  activePill:{ position: 'absolute', top: 8, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
});

// ─── THEMES TAB ───────────────────────────────────────────────────
function ThemesTab() {
  const { activePackId, previewPackId, startPreview, endPreview, applyPack, effectiveTheme } = useCosmetic();
  const themes = useMemo(() => Object.values(PACK_THEMES), []);
  const TIER_ORDER = { free: 0, supporter: 1, pro: 2, elite: 3 };
  const sorted = useMemo(() => [...themes].sort((a, b) => (TIER_ORDER[a.tier ?? 'free'] ?? 0) - (TIER_ORDER[b.tier ?? 'free'] ?? 0)), [themes]);

  const handlePreview = useCallback((id: string) => {
    haptics.light();
    if (previewPackId === id) endPreview();
    else startPreview(id);
  }, [previewPackId, startPreview, endPreview]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: PAD, gap: 10, paddingBottom: 120 }}>
      {/* Live preview section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: COLOR.magenta }} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.magenta + '80', letterSpacing: 2 }}>LIVE PREVIEW</Text>
        {previewPackId && (
          <Pressable onPress={endPreview}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 8) }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.amber }}>EXIT PREVIEW</Text>
          </Pressable>
        )}
      </View>
      <ChatPreview theme={effectiveTheme} />

      {sorted.map(t => (
        <ThemeCard key={t.id} theme={t}
          isActive={activePackId === t.id && !previewPackId}
          isPreview={previewPackId === t.id}
          onPreview={() => handlePreview(t.id)}
          onApply={() => { haptics.success(); applyPack(t.id); }}
        />
      ))}
    </ScrollView>
  );
}

// ─── FX TAB ───────────────────────────────────────────────────────
const FX_BUBBLE_ANIMS = ['none', 'slide', 'pop', 'fade', 'glow'] as const;
const FX_TYPING       = ['dots', 'wave', 'pulse', 'scan'] as const;
const FX_SEND_FX      = ['none', 'ripple', 'flash', 'pulse'] as const;
const FX_NOTIF_SOUNDS = ['none', 'chime', 'pulse', 'blip', 'synth'] as const;

function FXChipRow<T extends string>({ label, icon, items, selected, onChange, color }: {
  label: string; icon: string; items: readonly T[]; selected: T; onChange: (v: T) => void; color: string;
}) {
  return (
    <View style={{ paddingTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <MaterialCommunityIcons name={icon as any} size={11} color={color} />
        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color, letterSpacing: 1.2 }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {items.map(item => (
          <Pressable key={item} onPress={() => { haptics.light(); onChange(item); }}
            style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, borderColor: selected === item ? color + '80' : COLOR.border, backgroundColor: selected === item ? glow(color, 18) : pressed ? glow(color, 9) : 'transparent' }]}>
            {selected === item && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />}
            <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: selected === item ? color : COLOR.mid }}>{item.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FXToggle({ label, sub, icon, value, onChange, color }: {
  label: string; sub: string; icon: string; value: boolean; onChange: (v: boolean) => void; color: string;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, backgroundColor: COLOR.surf, borderColor: value ? color + '40' : COLOR.border }]}>
      <View style={[{ width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderColor: color + '50', backgroundColor: glow(color, 10), flexShrink: 0 }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: value ? color : COLOR.text, letterSpacing: 0.4 }}>{label}</Text>
        <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.mid, marginTop: 2 }}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={v => { haptics.light(); onChange(v); }}
        trackColor={{ true: color, false: COLOR.dim + '60' }} thumbColor={value ? '#000' : COLOR.mid} />
    </View>
  );
}

function FXTab() {
  const { extras, updateExtras, effectiveTheme } = useCosmetic();
  const col = effectiveTheme.primary;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: PAD, gap: 2, paddingBottom: 120 }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, backgroundColor: COLOR.surf, borderColor: col + '35', marginBottom: 6 }]}>
        <MaterialCommunityIcons name="shimmer" size={18} color={col} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: col }}>EXPERIENCE FX</Text>
          <Text style={{ fontFamily: MONO, fontSize: 9.5, color: COLOR.mid, marginTop: 3 }}>Fine-tune animations, sounds & visual effects</Text>
        </View>
      </View>
      <FXChipRow label="BUBBLE ANIMATION" icon="comment-processing" color={col}        items={FX_BUBBLE_ANIMS} selected={extras.bubbleAnim}   onChange={v => updateExtras({ bubbleAnim: v })} />
      <View style={{ height: 1, backgroundColor: COLOR.border, marginTop: 14 }} />
      <FXChipRow label="TYPING INDICATOR"  icon="dots-horizontal"   color={COLOR.magenta} items={FX_TYPING}       selected={extras.typingStyle} onChange={v => updateExtras({ typingStyle: v })} />
      <View style={{ height: 1, backgroundColor: COLOR.border, marginTop: 14 }} />
      <FXChipRow label="SEND EFFECT"        icon="send-circle"       color={COLOR.green}   items={FX_SEND_FX}      selected={extras.sendEffect}  onChange={v => updateExtras({ sendEffect: v })} />
      <View style={{ height: 1, backgroundColor: COLOR.border, marginTop: 14 }} />
      <FXChipRow label="NOTIF SOUND"        icon="bell-ring"         color={COLOR.amber}   items={FX_NOTIF_SOUNDS} selected={extras.notifSound}  onChange={v => updateExtras({ notifSound: v })} />
      <View style={{ height: 1, backgroundColor: COLOR.border, marginTop: 14, marginBottom: 14 }} />
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.mid, letterSpacing: 1.5, marginBottom: 6 }}>VISUAL TOGGLES</Text>
        <FXToggle label="HEADER GLOW"    sub="Pulsing glow on tab headers"         icon="brightness-5" color={col}           value={extras.headerGlow}   onChange={v => updateExtras({ headerGlow: v })} />
        <FXToggle label="TAB PULSE"      sub="Active tab icon pulses"              icon="tab"          color={COLOR.cyan}    value={extras.tabPulse}     onChange={v => updateExtras({ tabPulse: v })} />
        <FXToggle label="CHAT SHIMMER"   sub="Shimmer effect on message bubbles"   icon="shimmer"      color={COLOR.magenta} value={extras.chatShimmer}  onChange={v => updateExtras({ chatShimmer: v })} />
      </View>
      <Pressable onPress={() => { haptics.warning(); updateExtras({ bubbleAnim: 'slide', typingStyle: 'dots', sendEffect: 'ripple', notifSound: 'chime', headerGlow: true, tabPulse: true, chatShimmer: false }); }}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, borderWidth: 1.5, borderRadius: 12, borderColor: COLOR.red + '50', backgroundColor: glow(COLOR.red, 7), paddingVertical: 13, opacity: pressed ? 0.7 : 1 }]}>
        <MaterialIcons name="restore" size={13} color={COLOR.red} />
        <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: COLOR.red }}>RESET TO DEFAULTS</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── SUPPORT TAB ──────────────────────────────────────────────────
function SupportTab() {
  const { addUnlocked } = useCosmetic();
  const [owned,   setOwned]   = useState<Set<string>>(new Set());
  const [toast,   setToast]   = useState<string | null>(null);
  const toastA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPurchaseState().then(s => setOwned(new Set(s.packIds))).catch(() => {});
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastA, { toValue: 1, duration: 280, useNativeDriver: false }),
      Animated.delay(2200),
      Animated.timing(toastA, { toValue: 0, duration: 280, useNativeDriver: false }),
    ]).start(() => setToast(null));
  }, []);

  const handlePurchase = useCallback(async (tierId: TierId) => {
    haptics.heavy();
    try {
      const cfg = TIER_CONFIG[tierId];
      const themeIds: string[] = 'themeIds' in cfg ? [...(cfg as any).themeIds] : [];
      const ok = await purchasePack(tierId, cfg.price);
      if (ok) {
        for (const id of themeIds) await addUnlocked(id);
        setOwned(prev => new Set([...prev, tierId, ...themeIds]));
        haptics.success(); showToast(`✓  Unlocked ${cfg.name} — thank you! 💙`);
      } else { haptics.warning(); showToast('Purchase cancelled.'); }
    } catch { haptics.warning(); showToast('Purchase failed.'); }
  }, [addUnlocked, showToast]);

  const tiers: TierId[] = ['supporter', 'pro', 'elite'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: PAD, gap: 12, paddingBottom: 140 }}>
      {/* Hero */}
      <View style={[{ borderRadius: 16, borderWidth: 2, backgroundColor: COLOR.surf, overflow: 'hidden', borderColor: COLOR.pink + '40' }]}>
        <View style={{ height: 3.5, flexDirection: 'row' }}>
          {[COLOR.pink, COLOR.magenta, COLOR.amber, COLOR.cyan, COLOR.green].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          <Text style={{ fontFamily: MONO, fontSize: 15, fontWeight: '900', color: '#FFF' }}>
            Butler AI is <Text style={{ color: COLOR.green }}>free forever.</Text>
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid, lineHeight: 17 }}>
            {'Every feature, script, AI chat — zero paywalls.\n\nThese packs are optional thanks 💙'}
          </Text>
          {[
            { icon: 'server',       col: COLOR.cyan,    txt: 'Server infra & iOS/Android certificates'       },
            { icon: 'code-braces',  col: COLOR.magenta, txt: 'New script packs, features & AI integrations'  },
            { icon: 'coffee',       col: COLOR.amber,   txt: 'One dev, working nights & weekends on this ☕'  },
          ].map(({ icon, col, txt }, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
              <MaterialCommunityIcons name={icon as any} size={13} color={col} style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid, flex: 1, lineHeight: 16 }}>{txt}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tier cards */}
      {tiers.map(tierId => {
        const cfg = TIER_CONFIG[tierId];
        const col  = cfg.color;
        const themeIds: string[] = 'themeIds' in cfg ? [...(cfg as any).themeIds] : [];
        const isOwned = owned.has(tierId) || (themeIds.every(id => owned.has(id)));
        return (
          <View key={tierId} style={[{ borderRadius: 16, borderWidth: 2, overflow: 'hidden', borderColor: isOwned ? col + 'CC' : col + '35', backgroundColor: isOwned ? glow(col, 8) : COLOR.surf }]}>
            <View style={{ height: 3.5, backgroundColor: col }} />
            <View style={{ padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[{ width: 48, height: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: col + '60', backgroundColor: glow(col, 10), flexShrink: 0 }]}>
                  <MaterialCommunityIcons name={cfg.icon as any} size={22} color={col} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: col, letterSpacing: 0.5 }}>{cfg.name}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: col, marginTop: 2 }}>{cfg.price}</Text>
                </View>
                {themeIds.length > 0 && (
                  <View style={[{ borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, alignItems: 'center', borderColor: col + '40', backgroundColor: glow(col, 10) }]}>
                    <Text style={{ fontFamily: MONO, fontSize: 20, fontWeight: '900', color: col, lineHeight: 24 }}>{themeIds.length}</Text>
                    <Text style={{ fontFamily: MONO, fontSize: 7.5, color: col + '80' }}>THEMES</Text>
                  </View>
                )}
              </View>
              <View style={{ gap: 5 }}>
                {cfg.features.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <MaterialIcons name="check" size={12} color={col} style={{ marginTop: 2 }} />
                    <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.text, flex: 1, lineHeight: 17 }}>{f}</Text>
                  </View>
                ))}
              </View>
              {themeIds.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.mid, marginRight: 2 }}>THEMES:</Text>
                  {themeIds.slice(0, 8).map(id => {
                    const t = PACK_THEMES[id];
                    return t ? <View key={id} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.primary, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} /> : null;
                  })}
                  {themeIds.length > 8 && <Text style={{ fontFamily: MONO, fontSize: 8.5, color: col }}>+{themeIds.length - 8}</Text>}
                </View>
              )}
              <Pressable onPress={() => handlePurchase(tierId)} disabled={isOwned}
                style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, backgroundColor: isOwned ? COLOR.green : col, opacity: isOwned ? 0.75 : pressed ? 0.85 : 1 }]}>
                <MaterialIcons name={isOwned ? 'check-circle' : 'favorite'} size={16} color="#000" />
                <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.8 }}>
                  {isOwned ? 'THANK YOU ❤️' : `SUPPORT · ${cfg.price}`}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 }}>
        <MaterialIcons name="restore" size={13} color={COLOR.mid} />
        <Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.mid, lineHeight: 15 }}>
          {'Purchases are tied to this device. Contact support@butlerai.app to transfer.'}
        </Text>
      </View>

      {toast && (
        <Animated.View style={[{ position: 'absolute', bottom: 80, left: 14, right: 14, padding: 14, borderRadius: 14, backgroundColor: COLOR.green + 'EE', alignItems: 'center' }, { opacity: toastA }]}>
          <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' }}>{toast}</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function CosmeticInner() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('themes');
  const { effectiveTheme } = useCosmetic();
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
      <TabSwipeOverlay />
      <SkinsHeader safeTop={insets.top} activeTab={tab} onTabChange={setTab} accent={effectiveTheme.primary} />
      {tab === 'themes'  && <ThemesTab />}
      {tab === 'fx'      && <FXTab />}
      {tab === 'support' && <SupportTab />}
    </View>
  );
}

export default function CosmeticScreen() {
  return (
    <TabErrorBoundary name="Skins & FX">
      <CosmeticInner />
    </TabErrorBoundary>
  );
}
