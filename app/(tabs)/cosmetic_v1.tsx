/**
 * BUTLER AI — SKINS & SUPPORT SHOP v5.0
 * Completely rebuilt. Three tabs:
 *   THEMES  — 12 theme packs with live preview
 *   SUPPORT — Tiered donation / one-time IAP
 *   FX      — Animation & sound micro-customisation
 *
 * Architecture:
 *  • CosmeticContext drives all preview/apply state
 *  • purchaseState.ts handles unlock persistence + stub billing
 *  • All animations driver-split correctly (JS vs native)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Dimensions, FlatList, Linking, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { CompactPageHeader } from '@/components/ui/CompactPageHeader';
import {
  useCosmetic, PACK_THEMES, TIER_CONFIG,
  type AppTheme, type TierId,
} from '@/contexts/CosmeticContext';
import {
  SCRIPT_PACKS, purchasePack, loadPurchaseState,
  type ScriptPack,
} from '@/services/purchaseState';

const SW   = Math.max(320, Dimensions.get('window').width);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ── GLOBAL COLOURS ─────────────────────────────────────────────────
const G = {
  bg:      '#020810',
  surface: '#07111C',
  card:    '#09152A',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  amber:   '#FFB020',
  purple:  '#CC44FF',
  pink:    '#FF6EB4',
  red:     '#FF3344',
  gold:    '#FFD700',
  text:    '#D4E8F6',
  textMid: '#4A6A88',
  textDim: '#1E3050',
  border:  'rgba(0,229,255,0.14)',
};

// ── TAB CONFIG ─────────────────────────────────────────────────────
const TABS = [
  { id: 'themes',  label: 'THEMES',  icon: 'palette',          lib: 'community' as const, color: G.purple },
  { id: 'support', label: 'SUPPORT', icon: 'heart',            lib: 'community' as const, color: G.pink   },
  { id: 'fx',      label: 'FX',      icon: 'shimmer',          lib: 'community' as const, color: G.amber  },
] as const;
type TabId = typeof TABS[number]['id'];

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ── MODE TAB BAR ──────────────────────────────────────────────────
function ModeBar({ active, onSelect }: { active: TabId; onSelect: (t: TabId) => void }) {
  return (
    <View style={mb.wrap}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        const Icon = tab.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
        return (
          <Pressable key={tab.id} onPress={() => { haptics.light(); onSelect(tab.id); }}
            style={({ pressed }) => [mb.tab, {
              backgroundColor: isActive ? tab.color + '18' : pressed ? tab.color + '09' : 'transparent',
              borderColor: isActive ? tab.color + '70' : G.textDim + '60',
            }]}>
            <Icon name={tab.icon as any} size={13} color={isActive ? tab.color : G.textMid} />
            <Text style={[mb.label, { color: isActive ? tab.color : G.textMid }]}>{tab.label}</Text>
            {isActive && <View style={[mb.activeLine, { backgroundColor: tab.color }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}
const mb = StyleSheet.create({
  wrap:       { flexDirection:'row', borderBottomWidth:1, borderBottomColor:G.border, backgroundColor:'#020A14' },
  tab:        { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7,
                paddingVertical:12, borderWidth:0, position:'relative' },
  label:      { fontFamily:MONO, fontSize:10, fontWeight:'900', letterSpacing:1.5 },
  activeLine: { position:'absolute', bottom:0, left:'15%', right:'15%', height:2.5, borderRadius:2 },
});

// ── LIVE CHAT PREVIEW ──────────────────────────────────────────────
function ChatPreview({ theme }: { theme: AppTheme }) {
  const glowA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const borderC = glowA.interpolate({
    inputRange: [0.2, 1],
    outputRange: [theme.primary + '40', theme.primary + 'CC'],
  });

  return (
    <Animated.View style={[cp.wrap, { borderColor: borderC, backgroundColor: theme.bg }]}>
      {/* Chat header */}
      <View style={[cp.header, { borderBottomColor: theme.primary + '22', backgroundColor: theme.panel }]}>
        <View style={[cp.dot, { backgroundColor: theme.primary }]} />
        <Text style={[cp.headerTitle, { color: theme.primary }]}>{theme.name}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: MONO, fontSize: 8, color: theme.textDim }}>PREVIEW</Text>
      </View>
      {/* AI bubble */}
      <View style={{ padding: 10, gap: 8 }}>
        <View style={[cp.aiBubble, { backgroundColor: theme.aiBubble, borderColor: theme.aiBorder }]}>
          <Text style={[cp.msgTxt, { color: theme.textHi }]} numberOfLines={2}>
            {`Butler AI online. Running on ${theme.name} theme.`}
          </Text>
        </View>
        {/* User bubble */}
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[cp.userBubble, { backgroundColor: theme.userBubble, borderColor: theme.primary + '55' }]}>
            <Text style={[cp.msgTxt, { color: theme.textHi }]}>Looking great! 🔥</Text>
          </View>
        </View>
        {/* Input bar */}
        <View style={[cp.inputBar, { backgroundColor: theme.chatBarBg, borderTopColor: theme.chatBarBorderTop }]}>
          <View style={[cp.inputField, { borderColor: theme.primary + '44' }]}>
            <Text style={[cp.inputHint, { color: theme.textDim }]}>{theme.promptGlyph} Type here...</Text>
          </View>
          <View style={[cp.sendBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="send" size={10} color="#000" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
const cp = StyleSheet.create({
  wrap:        { borderRadius:16, borderWidth:2, overflow:'hidden', marginBottom:16 },
  header:      { flexDirection:'row', alignItems:'center', gap:8, padding:12, borderBottomWidth:1 },
  dot:         { width:6, height:6, borderRadius:3 },
  headerTitle: { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:1 },
  aiBubble:    { alignSelf:'flex-start', maxWidth:'80%', borderWidth:1.5, borderRadius:12, padding:10 },
  userBubble:  { maxWidth:'80%', borderWidth:1.5, borderRadius:12, padding:9 },
  msgTxt:      { fontFamily:MONO, fontSize:11, lineHeight:17 },
  inputBar:    { flexDirection:'row', alignItems:'center', gap:8, padding:8, borderTopWidth:1 },
  inputField:  { flex:1, borderWidth:1.5, borderRadius:10, paddingHorizontal:10, paddingVertical:8 },
  inputHint:   { fontFamily:MONO, fontSize:10 },
  sendBtn:     { width:28, height:28, borderRadius:8, alignItems:'center', justifyContent:'center' },
});

// ── THEME CARD ─────────────────────────────────────────────────────
function ThemeCard({
  theme, isActive, isPreview, isPreviewing, onPreview, onApply,
}: {
  theme: AppTheme;
  isActive: boolean;
  isPreview: boolean;
  isPreviewing: boolean;
  onPreview: () => void;
  onApply: () => void;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const TIER_COLORS: Record<string, string> = {
    free: G.green, supporter: G.cyan, pro: G.pink, elite: G.gold,
  };
  const tierCol = TIER_COLORS[theme.tier ?? 'free'] ?? G.cyan;

  const handlePressIn  = () => Animated.spring(scaleA, { toValue: 0.96, tension: 400, friction: 12, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleA, { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <Animated.View style={[tc.wrap, {
      borderColor: isActive ? theme.primary + 'CC' : isPreview ? theme.primary + '80' : G.textDim + '40',
      backgroundColor: isActive ? theme.bg : G.surface,
      transform: [{ scale: scaleA }],
      ...Platform.select({ ios:{ shadowColor:theme.primary, shadowOffset:{width:0,height:4}, shadowOpacity:isActive?0.5:0.15, shadowRadius:12 }, android:{elevation: isActive?8:3} }),
    }]}>
      {/* Top colour bar */}
      <View style={[tc.topBar, { backgroundColor: theme.primary }]} />

      <View style={{ padding: 13, gap: 10 }}>
        {/* Title row */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <View style={[tc.iconBox, { borderColor: theme.primary + '60', backgroundColor: theme.primary + '0E' }]}>
            <MaterialCommunityIcons name={(theme.icon ?? 'palette') as any} size={16} color={theme.primary} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[tc.name, { color: theme.primary }]} numberOfLines={1}>{theme.name}</Text>
            <Text style={tc.tagline} numberOfLines={1}>{theme.tagline}</Text>
          </View>
          {/* Tier badge */}
          <View style={[tc.tierBadge, { borderColor: tierCol + '50', backgroundColor: tierCol + '0E' }]}>
            <Text style={[tc.tierTxt, { color: tierCol }]}>{(theme.tier ?? 'FREE').toUpperCase()}</Text>
          </View>
        </View>

        {/* Mini colour swatch */}
        <View style={{ flexDirection:'row', gap:4, alignItems:'center' }}>
          {[theme.primary, theme.secondary, theme.tertiary, theme.bg, theme.panel].map((c, i) => (
            <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
          ))}
          <View style={{ flex:1 }} />
          {theme.badge ? (
            <View style={[tc.badge, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '12' }]}>
              <Text style={[tc.badgeTxt, { color: theme.primary }]}>{theme.badge}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={{ flexDirection:'row', gap:8 }}>
          <Pressable onPress={onPreview} onPressIn={handlePressIn} onPressOut={handlePressOut}
            style={({ pressed }) => [tc.previewBtn, {
              borderColor: theme.primary + '55',
              backgroundColor: isPreview ? theme.primary + '22' : pressed ? theme.primary + '0F' : 'transparent',
            }]}>
            <MaterialIcons name={isPreview ? 'visibility' : 'visibility-outlined'} size={12} color={theme.primary} />
            <Text style={[tc.previewTxt, { color: theme.primary }]}>{isPreview ? 'PREVIEWING' : 'PREVIEW'}</Text>
          </Pressable>

          <Pressable onPress={onApply} onPressIn={handlePressIn} onPressOut={handlePressOut}
            style={({ pressed }) => [tc.applyBtn, {
              backgroundColor: isActive ? theme.primary : pressed ? theme.primary + 'CC' : theme.primary,
              opacity: pressed ? 0.85 : 1,
            }]}>
            <MaterialIcons name={isActive ? 'check-circle' : 'bolt'} size={12} color="#000" />
            <Text style={tc.applyTxt}>{isActive ? 'ACTIVE' : 'APPLY'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Active indicator */}
      {isActive && (
        <View style={[tc.activePill, { borderColor: theme.primary + '70', backgroundColor: theme.primary + '18' }]}>
          <View style={{ width:5, height:5, borderRadius:3, backgroundColor:theme.primary }} />
          <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:theme.primary, letterSpacing:0.5 }}>ACTIVE</Text>
        </View>
      )}
    </Animated.View>
  );
}
const tc = StyleSheet.create({
  wrap:       { borderRadius:16, borderWidth:2, overflow:'hidden', position:'relative' },
  topBar:     { height:3 },
  iconBox:    { width:36, height:36, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  name:       { fontFamily:MONO, fontSize:11.5, fontWeight:'900', letterSpacing:0.5 },
  tagline:    { fontFamily:MONO, fontSize:8.5, color:G.textMid, lineHeight:12 },
  tierBadge:  { borderWidth:1.5, borderRadius:6, paddingHorizontal:7, paddingVertical:3 },
  tierTxt:    { fontFamily:MONO, fontSize:7.5, fontWeight:'900', letterSpacing:0.5 },
  badge:      { borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  badgeTxt:   { fontFamily:MONO, fontSize:7, fontWeight:'900' },
  previewBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5,
                borderWidth:1.5, borderRadius:10, paddingVertical:9 },
  previewTxt: { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.4 },
  applyBtn:   { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5,
                borderRadius:10, paddingVertical:9 },
  applyTxt:   { fontFamily:MONO, fontSize:9, fontWeight:'900', color:'#000', letterSpacing:0.4 },
  activePill: { position:'absolute', top:8, right:10, flexDirection:'row', alignItems:'center', gap:4,
                borderWidth:1, borderRadius:6, paddingHorizontal:7, paddingVertical:3 },
});

// ── THEMES TAB ─────────────────────────────────────────────────────
function ThemesTab() {
  const { activePackId, previewPackId, startPreview, endPreview, applyPack, effectiveTheme } = useCosmetic();
  const themes = useMemo(() => Object.values(PACK_THEMES), []);

  const TIER_ORDER = { free: 0, supporter: 1, pro: 2, elite: 3 };
  const sorted = useMemo(() =>
    [...themes].sort((a, b) => (TIER_ORDER[a.tier ?? 'free'] ?? 0) - (TIER_ORDER[b.tier ?? 'free'] ?? 0)),
  [themes]);

  const handlePreview = useCallback((id: string) => {
    haptics.light();
    if (previewPackId === id) endPreview();
    else startPreview(id);
  }, [previewPackId, startPreview, endPreview]);

  const handleApply = useCallback((id: string) => {
    haptics.success();
    applyPack(id);
  }, [applyPack]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 120 }}>
      {/* Live preview panel */}
      <View style={{ marginBottom: 6 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
          <View style={{ width:3, height:16, borderRadius:2, backgroundColor:G.purple }} />
          <MaterialCommunityIcons name="monitor-eye" size={11} color={G.purple} />
          <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:G.purple, letterSpacing:1.5 }}>LIVE PREVIEW</Text>
          {previewPackId && (
            <Pressable onPress={endPreview}
              style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:8,
                       paddingHorizontal:9, paddingVertical:4, borderColor:G.amber+'55', backgroundColor:G.amber+'0A' }}>
              <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:G.amber }}>EXIT PREVIEW</Text>
            </Pressable>
          )}
        </View>
        <ChatPreview theme={effectiveTheme} />
      </View>

      {/* Theme grid */}
      {sorted.map(t => (
        <ThemeCard
          key={t.id}
          theme={t}
          isActive={activePackId === t.id && !previewPackId}
          isPreview={previewPackId === t.id}
          isPreviewing={!!previewPackId}
          onPreview={() => handlePreview(t.id)}
          onApply={() => handleApply(t.id)}
        />
      ))}
    </ScrollView>
  );
}

// ── DONATION / SUPPORT TAB ─────────────────────────────────────────
/**
 * The support tab is the heart of the monetisation story.
 * Design principles:
 *  • Be honest: app is free, packs are optional thanks
 *  • Show what you're funding (dev time, server costs)
 *  • Unlock flow that works TODAY (no account needed)
 *  • Transparent pricing with clear value
 */

function SupportHeroCard() {
  const glowA = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1600, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1600, useNativeDriver: false }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  const borderC = glowA.interpolate({ inputRange:[0.2,1], outputRange:[G.pink+'30',G.pink+'CC'] });
  let robotImg: any = null;
  try { robotImg = require('@/assets/images/mascot_shield_v2.png'); } catch {
    try { robotImg = require('@/assets/images/mascot_shield.png'); } catch {}
  }

  return (
    <Animated.View style={[shc.wrap, { borderColor: borderC }]}>
      <View style={{ height:3.5, flexDirection:'row' }}>
        {[G.pink, G.purple, G.amber, G.cyan, G.green].map((c,i)=><View key={i} style={{flex:1,backgroundColor:c}} />)}
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', padding:18, gap:16 }}>
        {robotImg ? (
          <View style={shc.robotFrame}>
            {/* We use Image from expo-image via require — safe */}
            <MaterialCommunityIcons name="robot-happy" size={56} color={G.pink} />
            <View style={[shc.heartBadge, { backgroundColor:G.pink }]}>
              <MaterialCommunityIcons name="heart" size={9} color="#000" />
            </View>
          </View>
        ) : (
          <View style={shc.robotFrame}>
            <MaterialCommunityIcons name="robot-happy" size={56} color={G.pink} />
          </View>
        )}
        <View style={{ flex:1 }}>
          <Text style={shc.title}>Butler AI is <Text style={{ color:G.green }}>free forever.</Text></Text>
          <Text style={shc.sub}>
            {`Every script, every feature, every AI chat — zero paywalls, zero subscriptions.\n\nIf you love Butler AI, these packs let you say thanks 💙`}
          </Text>
        </View>
      </View>
      {/* What your support funds */}
      <View style={{ borderTopWidth:1, borderTopColor:G.border, padding:14, gap:8 }}>
        <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:G.pink, letterSpacing:1.5, marginBottom:4 }}>YOUR SUPPORT FUNDS</Text>
        {[
          { icon:'server', col:G.cyan,   txt:'Server infrastructure & iOS/Android certificates' },
          { icon:'code-braces', col:G.purple, txt:'New script packs, features & AI integrations' },
          { icon:'bug-check', col:G.green, txt:'Fixes, security patches & Play Store compliance' },
          { icon:'coffee',   col:G.amber,  txt:'One developer, working nights and weekends on this ☕' },
        ].map(({ icon, col, txt }, i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:9 }}>
            <MaterialCommunityIcons name={icon as any} size={13} color={col} style={{ marginTop:1 }} />
            <Text style={{ fontFamily:SANS, fontSize:12, color:G.textMid, flex:1, lineHeight:17 }}>{txt}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
const shc = StyleSheet.create({
  wrap:       { borderRadius:18, borderWidth:2, backgroundColor:G.surface, overflow:'hidden',
                ...Platform.select({ ios:{shadowColor:G.pink,shadowOffset:{width:0,height:8},shadowOpacity:0.35,shadowRadius:20}, android:{elevation:10} }) },
  robotFrame: { width:80, height:80, borderRadius:20, borderWidth:2, borderColor:G.pink+'55',
                backgroundColor:G.pink+'0C', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 },
  heartBadge: { position:'absolute', bottom:-4, right:-4, width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  title:      { fontFamily:MONO, fontSize:15, fontWeight:'900', color:'#FFFFFF', marginBottom:8, lineHeight:21 },
  sub:        { fontFamily:SANS, fontSize:12, color:G.textMid, lineHeight:18 },
});

// ── TIER CARD ──────────────────────────────────────────────────────
function TierCard({
  tierId, config, isOwned, isPopular, onPurchase, processing,
}: {
  tierId: TierId;
  config: typeof TIER_CONFIG[TierId];
  isOwned: boolean;
  isPopular?: boolean;
  onPurchase: () => void;
  processing: boolean;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const col    = config.color;

  const handlePressIn  = () => Animated.spring(scaleA, { toValue:0.97, tension:400, friction:12, useNativeDriver:true }).start();
  const handlePressOut = () => Animated.spring(scaleA, { toValue:1,    tension:280, friction:10, useNativeDriver:true }).start();

  const themeIds = 'themeIds' in config ? config.themeIds : [];
  const themeCount = themeIds.length;

  return (
    <Animated.View style={[tirc.outer, {
      borderColor: isOwned ? col + 'CC' : isPopular ? col + '70' : col + '35',
      backgroundColor: isOwned ? col + '08' : G.surface,
      transform: [{ scale: scaleA }],
      ...Platform.select({ ios:{ shadowColor:col, shadowOffset:{width:0,height:6}, shadowOpacity:isOwned?0.5:0.22, shadowRadius:16 }, android:{elevation:isOwned?10:4} }),
    }]}>
      {/* Top bar */}
      <View style={{ height:3.5, backgroundColor: col }} />

      {/* Popular badge */}
      {isPopular && !isOwned && (
        <View style={[tirc.popularBadge, { borderColor:col+'70', backgroundColor:col+'15' }]}>
          <MaterialCommunityIcons name="star-shooting" size={9} color={col} />
          <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', color:col }}>MOST POPULAR</Text>
        </View>
      )}

      <View style={{ padding:16, gap:14 }}>
        {/* Header row */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
          <View style={[tirc.iconBox, { borderColor:col+'60', backgroundColor:col+'0D' }]}>
            <MaterialCommunityIcons name={config.icon as any} size={22} color={col} />
          </View>
          <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <Text style={[tirc.name, { color:col }]}>{config.name}</Text>
              {isOwned && (
                <View style={[tirc.ownedBadge, { borderColor:G.green+'70', backgroundColor:G.green+'12' }]}>
                  <MaterialIcons name="check-circle" size={10} color={G.green} />
                  <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:G.green }}>OWNED</Text>
                </View>
              )}
            </View>
            <Text style={[tirc.price, { color:col }]}>{config.price}</Text>
          </View>
          {themeCount > 0 && (
            <View style={[tirc.countBadge, { borderColor:col+'40', backgroundColor:col+'0D' }]}>
              <Text style={[tirc.countTxt, { color:col }]}>{themeCount}</Text>
              <Text style={{ fontFamily:MONO, fontSize:7.5, color:col+'80' }}>THEMES</Text>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={{ gap:6 }}>
          {config.features.map((f, i) => (
            <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:8 }}>
              <MaterialIcons name="check" size={12} color={col} style={{ marginTop:2 }} />
              <Text style={{ fontFamily:SANS, fontSize:12, color:G.text, flex:1, lineHeight:18 }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Theme preview dots */}
        {themeCount > 0 && (
          <View style={{ flexDirection:'row', gap:6, alignItems:'center' }}>
            <Text style={{ fontFamily:MONO, fontSize:8, color:G.textMid, marginRight:2 }}>THEMES:</Text>
            {themeIds.slice(0, 8).map(id => {
              const t = PACK_THEMES[id as string];
              return t ? (
                <View key={id as string} style={{ width:14, height:14, borderRadius:7,
                  backgroundColor: t.primary, borderWidth:1, borderColor:'rgba(255,255,255,0.15)' }} />
              ) : null;
            })}
            {themeIds.length > 8 && (
              <Text style={{ fontFamily:MONO, fontSize:8.5, color:col }}>+{themeIds.length - 8}</Text>
            )}
          </View>
        )}

        {/* CTA */}
        {!(tierId === 'review') ? (
          <Pressable
            onPress={onPurchase}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isOwned || processing}
            style={({ pressed }) => [tirc.cta, {
              backgroundColor: isOwned ? G.green : col,
              opacity: (isOwned || processing) ? 0.75 : pressed ? 0.85 : 1,
              ...Platform.select({ ios:{shadowColor:col,shadowOffset:{width:0,height:6},shadowOpacity:0.5,shadowRadius:14}, android:{elevation:8} }),
            }]}>
            <MaterialIcons name={isOwned ? 'check-circle' : 'favorite'} size={16} color="#000" />
            <Text style={tirc.ctaTxt}>
              {processing ? 'PROCESSING...' : isOwned ? 'THANK YOU ❤️' : `SUPPORT · ${config.price}`}
            </Text>
          </Pressable>
        ) : (
          /* Review reward — special unlock flow */
          <ReviewRewardCTA isOwned={isOwned} color={col} />
        )}
      </View>
    </Animated.View>
  );
}
const tirc = StyleSheet.create({
  outer:        { borderRadius:18, borderWidth:2, overflow:'hidden' },
  iconBox:      { width:52, height:52, borderRadius:16, borderWidth:2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  name:         { fontFamily:MONO, fontSize:13, fontWeight:'900', letterSpacing:0.5 },
  price:        { fontFamily:MONO, fontSize:16, fontWeight:'900', marginTop:2 },
  countBadge:   { borderWidth:1.5, borderRadius:10, paddingHorizontal:9, paddingVertical:5, alignItems:'center' },
  countTxt:     { fontFamily:MONO, fontSize:20, fontWeight:'900', lineHeight:24 },
  popularBadge: { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:8,
                  paddingHorizontal:10, paddingVertical:5, position:'absolute', top:14, right:14, zIndex:2 },
  ownedBadge:   { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:6, paddingHorizontal:7, paddingVertical:3 },
  cta:          { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10,
                  paddingVertical:15, borderRadius:14 },
  ctaTxt:       { fontFamily:MONO, fontSize:13, fontWeight:'900', color:'#000', letterSpacing:0.8 },
});

function ReviewRewardCTA({ isOwned, color }: { isOwned: boolean; color: string }) {
  const [expanded, setExpanded] = useState(false);
  if (isOwned) return (
    <View style={[rrc.claimed, { borderColor:G.green+'60', backgroundColor:G.green+'0D' }]}>
      <MaterialIcons name="check-circle" size={16} color={G.green} />
      <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:G.green }}>CHAMPION HOLO UNLOCKED!</Text>
    </View>
  );
  return (
    <View style={{ gap:10 }}>
      <Pressable onPress={() => { haptics.light(); setExpanded(!expanded); }}
        style={[rrc.btn, { borderColor:color+'70', backgroundColor:color+'0D' }]}>
        <MaterialCommunityIcons name="star-shooting" size={14} color={color} />
        <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color, letterSpacing:0.5 }}>UNLOCK WITH REVIEW</Text>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={16} color={color} />
      </Pressable>
      {expanded && (
        <View style={[rrc.steps, { borderColor:color+'35', backgroundColor:color+'06' }]}>
          {[
            '1. Leave a review on Google Play or App Store',
            '2. Take a screenshot of your review',
            '3. Join our Discord and post it in #reviews',
            '4. A bot will DM you the unlock code instantly',
          ].map((s,i)=>(
            <View key={i} style={{ flexDirection:'row', gap:8 }}>
              <Text style={{ fontFamily:MONO, fontSize:10, color:color+'80' }}>{'>'}</Text>
              <Text style={{ fontFamily:SANS, fontSize:11.5, color:G.textMid, flex:1, lineHeight:17 }}>{s}</Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://discord.gg/butlerai').catch(()=>{})}
            style={[rrc.discord, { borderColor:'#5865F2'+'60', backgroundColor:'#5865F2'+'0D' }]}>
            <MaterialCommunityIcons name="discord" size={14} color="#5865F2" />
            <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:'#5865F2' }}>JOIN DISCORD</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const rrc = StyleSheet.create({
  claimed: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
             borderWidth:1.5, borderRadius:12, paddingVertical:12 },
  btn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
             borderWidth:1.5, borderRadius:12, paddingVertical:12 },
  steps:   { borderWidth:1.5, borderRadius:12, padding:12, gap:8 },
  discord: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
             borderWidth:1.5, borderRadius:10, paddingVertical:9, marginTop:4 },
});

function SupportTab() {
  const { addUnlocked } = useCosmetic();
  const [processing, setProcessing] = useState<TierId | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPurchaseState().then(s => setOwned(new Set(s.packIds))).catch(() => {});
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastA, { toValue:1, duration:280, useNativeDriver:false }),
      Animated.delay(2200),
      Animated.timing(toastA, { toValue:0, duration:280, useNativeDriver:false }),
    ]).start(() => setToast(null));
  }, []);

  const handlePurchase = useCallback(async (tierId: TierId, price: string) => {
    haptics.heavy();
    setProcessing(tierId);
    try {
      const cfg = TIER_CONFIG[tierId];
      const themeIds: string[] = 'themeIds' in cfg ? [...cfg.themeIds] : [];
      // stub purchase — mark all theme packs for this tier as owned
      const ok = await purchasePack(tierId, price);
      if (ok) {
        for (const id of themeIds) await addUnlocked(id);
        setOwned(prev => new Set([...prev, tierId, ...themeIds]));
        haptics.success();
        showToast(`✓  Unlocked ${cfg.name} — thank you! 💙`);
      } else {
        haptics.warning();
        showToast('Purchase cancelled or failed.');
      }
    } catch {
      haptics.warning();
      showToast('Purchase failed. Try again.');
    } finally {
      setProcessing(null);
    }
  }, [addUnlocked, showToast]);

  const tiers: TierId[] = ['supporter', 'pro', 'elite', 'review'];

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding:14, gap:14, paddingBottom:140 }}>
      <SupportHeroCard />

      {/* Transparency note */}
      <View style={[st.transparencyCard, { borderColor:G.green+'35' }]}>
        <MaterialIcons name="info-outline" size={13} color={G.green} />
        <Text style={{ fontFamily:SANS, fontSize:12, color:G.textMid, flex:1, lineHeight:17 }}>
          {`All packs are one-time payments. No auto-renewal. No subscription. Themes unlock permanently on this device. They are a "thank you" — not a paywall. The full app is always free.`}
        </Text>
      </View>

      {/* Tier cards */}
      {tiers.map(tierId => {
        const cfg = TIER_CONFIG[tierId];
        const isOwned = owned.has(tierId) || (
          'themeIds' in cfg && (cfg as any).themeIds.every((id: string) => owned.has(id))
        );
        const isPopular = 'isPopular' in cfg ? !!(cfg as any).isPopular : false;
        return (
          <TierCard
            key={tierId}
            tierId={tierId}
            config={cfg}
            isOwned={isOwned}
            isPopular={isPopular}
            onPurchase={() => handlePurchase(tierId, cfg.price)}
            processing={processing === tierId}
          />
        );
      })}

      {/* Script packs section */}
      <ScriptPacksSection processing={processing} setProcessing={setProcessing}
        owned={owned} setOwned={setOwned} showToast={showToast} />

      {/* Restore purchases */}
      <View style={st.restoreRow}>
        <MaterialIcons name="restore" size={13} color={G.textMid} />
        <Text style={{ fontFamily:MONO, fontSize:10, color:G.textMid }}>
          {'Purchases are tied to this device. Contact support@butlerai.app to transfer.'}
        </Text>
      </View>

      {/* Toast */}
      {toast && (
        <Animated.View style={[st.toast, { opacity: toastA, backgroundColor: G.green + 'EE' }]}>
          <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:'#000' }}>{toast}</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}
const st = StyleSheet.create({
  transparencyCard: { flexDirection:'row', alignItems:'flex-start', gap:10, borderWidth:1.5,
                      borderRadius:14, padding:14, backgroundColor:G.green+'06' },
  restoreRow:       { flexDirection:'row', alignItems:'flex-start', gap:8, paddingHorizontal:4 },
  toast:            { position:'absolute', bottom:80, left:16, right:16, padding:14, borderRadius:14,
                      alignItems:'center' },
});

// ── SCRIPT PACKS MINI-SECTION ──────────────────────────────────────
function ScriptPacksSection({ processing, setProcessing, owned, setOwned, showToast }: {
  processing: TierId | null;
  setProcessing: (v: TierId | null) => void;
  owned: Set<string>;
  setOwned: React.Dispatch<React.SetStateAction<Set<string>>>;
  showToast: (m: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const buyPack = useCallback(async (pack: ScriptPack) => {
    haptics.heavy();
    setProcessing('pro');
    const ok = await purchasePack(pack.id, pack.price);
    setProcessing(null);
    if (ok) {
      setOwned(prev => new Set([...prev, pack.id]));
      haptics.success();
      showToast(`✓  ${pack.name} unlocked!`);
    } else {
      haptics.warning();
      showToast('Purchase failed.');
    }
  }, [setProcessing, setOwned, showToast]);

  return (
    <View style={{ gap:10 }}>
      <Pressable onPress={() => { haptics.light(); setExpanded(!expanded); }}
        style={sps.header}>
        <View style={{ width:3, height:16, borderRadius:2, backgroundColor:G.amber }} />
        <MaterialCommunityIcons name="code-braces-box" size={13} color={G.amber} />
        <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:G.amber, letterSpacing:1.5, flex:1 }}>SCRIPT PACKS</Text>
        <Text style={{ fontFamily:MONO, fontSize:9, color:G.textMid }}>{SCRIPT_PACKS.length} PACKS AVAILABLE</Text>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={18} color={G.amber} />
      </Pressable>
      {expanded && SCRIPT_PACKS.map(pack => (
        <View key={pack.id} style={[sps.card, { borderColor: pack.color + '40' }]}>
          <View style={[{ height:2.5, backgroundColor:pack.color }]} />
          <View style={{ padding:12, gap:10 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
              <View style={[sps.iconBox, { borderColor:pack.color+'55', backgroundColor:pack.color+'0D' }]}>
                <MaterialCommunityIcons name={pack.icon as any} size={20} color={pack.color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[sps.name, { color:pack.color }]}>{pack.name}</Text>
                <Text style={sps.desc}>{pack.tagline}</Text>
              </View>
              <View style={[sps.pricePill, { borderColor:pack.color+'55', backgroundColor:pack.color+'0A' }]}>
                <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:pack.color }}>{pack.price}</Text>
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap' }}>
              {pack.scripts.slice(0,3).map((s,i)=>(
                <View key={i} style={[sps.scriptPill, { borderColor:pack.color+'35' }]}>
                  <Text style={{ fontFamily:MONO, fontSize:8.5, color:pack.color+'CC' }}>{s.name}</Text>
                </View>
              ))}
              {pack.scripts.length > 3 && (
                <View style={[sps.scriptPill, { borderColor:pack.color+'25' }]}>
                  <Text style={{ fontFamily:MONO, fontSize:8.5, color:pack.color+'80' }}>+{pack.scripts.length-3} more</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => buyPack(pack)}
              disabled={owned.has(pack.id) || !!processing}
              style={({ pressed }) => [sps.buyBtn, {
                backgroundColor: owned.has(pack.id) ? G.green : pack.color,
                opacity: owned.has(pack.id) || !!processing ? 0.75 : pressed ? 0.85 : 1,
              }]}>
              <MaterialIcons name={owned.has(pack.id) ? 'check-circle' : 'add-shopping-cart'} size={14} color="#000" />
              <Text style={sps.buyTxt}>{owned.has(pack.id) ? 'OWNED' : `GET FOR ${pack.price}`}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
const sps = StyleSheet.create({
  header:   { flexDirection:'row', alignItems:'center', gap:8, borderWidth:1.5, borderRadius:12,
              borderColor:G.amber+'35', backgroundColor:G.amber+'06', padding:13 },
  card:     { borderWidth:1.5, borderRadius:14, backgroundColor:G.surface, overflow:'hidden' },
  iconBox:  { width:44, height:44, borderRadius:13, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  name:     { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.5 },
  desc:     { fontFamily:MONO, fontSize:9, color:G.textMid, marginTop:2, lineHeight:13 },
  pricePill:{ borderWidth:1.5, borderRadius:8, paddingHorizontal:10, paddingVertical:5 },
  scriptPill:{ borderWidth:1, borderRadius:6, paddingHorizontal:8, paddingVertical:4 },
  buyBtn:   { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
              borderRadius:11, paddingVertical:12 },
  buyTxt:   { fontFamily:MONO, fontSize:12, fontWeight:'900', color:'#000', letterSpacing:0.5 },
});

// ── FX TAB ─────────────────────────────────────────────────────────
const FX_BUBBLE_ANIMS = ['none','slide','pop','fade','glow'] as const;
const FX_TYPING       = ['dots','wave','pulse','scan'] as const;
const FX_SEND_FX      = ['none','ripple','flash','pulse'] as const;
const FX_NOTIF_SOUNDS = ['none','chime','pulse','blip','synth'] as const;

function FXChipRow<T extends string>({
  label, icon, items, selected, onChange, color,
}: {
  label: string; icon: string; items: readonly T[]; selected: T;
  onChange: (v: T) => void; color: string;
}) {
  return (
    <View style={fx.section}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:10 }}>
        <MaterialCommunityIcons name={icon as any} size={11} color={color} />
        <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color, letterSpacing:1.2 }}>{label}</Text>
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7 }}>
        {items.map(item => (
          <Pressable key={item} onPress={() => { haptics.light(); onChange(item); }}
            style={({ pressed }) => [fx.chip, {
              borderColor: selected === item ? color + '80' : G.textDim + '50',
              backgroundColor: selected === item ? color + '18' : pressed ? color + '09' : 'transparent',
            }]}>
            {selected === item && <View style={{ width:5, height:5, borderRadius:3, backgroundColor:color }} />}
            <Text style={[fx.chipTxt, { color: selected === item ? color : G.textMid }]}>
              {item.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ToggleRow({
  label, sub, icon, value, onChange, color,
}: {
  label: string; sub: string; icon: string; value: boolean; onChange: (v: boolean) => void; color: string;
}) {
  return (
    <View style={[fx.toggleRow, { borderColor: value ? color+'35' : G.textDim+'30' }]}>
      <View style={[fx.toggleIcon, { borderColor:color+'50', backgroundColor:color+'0A' }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:value?color:G.text, letterSpacing:0.4 }}>{label}</Text>
        <Text style={{ fontFamily:MONO, fontSize:9, color:G.textMid, marginTop:2 }}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={v => { haptics.light(); onChange(v); }}
        trackColor={{ true: color, false: G.textDim + '60' }}
        thumbColor={value ? '#000' : G.textMid}
      />
    </View>
  );
}

function FXTab() {
  const { extras, updateExtras, effectiveTheme } = useCosmetic();
  const col = effectiveTheme.primary;

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding:14, gap:2, paddingBottom:120 }}>
      <View style={[fx.hero, { borderColor:col+'35' }]}>
        <MaterialCommunityIcons name="shimmer" size={18} color={col} />
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:col }}>EXPERIENCE FX</Text>
          <Text style={{ fontFamily:MONO, fontSize:9.5, color:G.textMid, marginTop:3 }}>
            Fine-tune animations, sounds & visual effects for each theme
          </Text>
        </View>
      </View>

      <FXChipRow label="BUBBLE ANIMATION" icon="comment-processing" color={col}
        items={FX_BUBBLE_ANIMS} selected={extras.bubbleAnim}
        onChange={v => updateExtras({ bubbleAnim: v })} />
      <View style={fx.divider} />

      <FXChipRow label="TYPING INDICATOR" icon="dots-horizontal" color={G.purple}
        items={FX_TYPING} selected={extras.typingStyle}
        onChange={v => updateExtras({ typingStyle: v })} />
      <View style={fx.divider} />

      <FXChipRow label="SEND EFFECT" icon="send-circle" color={G.green}
        items={FX_SEND_FX} selected={extras.sendEffect}
        onChange={v => updateExtras({ sendEffect: v })} />
      <View style={fx.divider} />

      <FXChipRow label="NOTIFICATION SOUND" icon="bell-ring" color={G.amber}
        items={FX_NOTIF_SOUNDS} selected={extras.notifSound}
        onChange={v => updateExtras({ notifSound: v })} />
      <View style={fx.divider} />

      <View style={{ gap:8, marginTop:4 }}>
        <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:G.textMid, letterSpacing:1.5, marginBottom:6 }}>VISUAL TOGGLES</Text>
        <ToggleRow label="HEADER GLOW" sub="Pulsing glow on tab headers" icon="brightness-5" color={col}
          value={extras.headerGlow} onChange={v => updateExtras({ headerGlow: v })} />
        <ToggleRow label="TAB PULSE" sub="Active tab icon pulses" icon="tab" color={G.cyan}
          value={extras.tabPulse} onChange={v => updateExtras({ tabPulse: v })} />
        <ToggleRow label="CHAT SHIMMER" sub="Shimmer effect on message bubbles" icon="shimmer" color={G.purple}
          value={extras.chatShimmer} onChange={v => updateExtras({ chatShimmer: v })} />
      </View>

      {/* Reset */}
      <Pressable
        onPress={() => { haptics.warning(); updateExtras({ bubbleAnim:'slide', typingStyle:'dots', sendEffect:'ripple', notifSound:'chime', headerGlow:true, tabPulse:true, chatShimmer:false }); }}
        style={({ pressed }) => [fx.resetBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <MaterialIcons name="restore" size={13} color={G.red} />
        <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:G.red }}>RESET TO DEFAULTS</Text>
      </Pressable>
    </ScrollView>
  );
}
const fx = StyleSheet.create({
  hero:        { flexDirection:'row', alignItems:'center', gap:12, borderWidth:1.5, borderRadius:14,
                 padding:14, backgroundColor:G.surface, marginBottom:6 },
  section:     { paddingTop:14 },
  divider:     { height:1, backgroundColor:G.border, marginTop:14 },
  chip:        { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:9,
                 paddingHorizontal:12, paddingVertical:8 },
  chipTxt:     { fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:0.3 },
  toggleRow:   { flexDirection:'row', alignItems:'center', gap:12, borderWidth:1.5, borderRadius:14,
                 padding:14, backgroundColor:G.surface },
  toggleIcon:  { width:38, height:38, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  resetBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
                 marginTop:16, borderWidth:1.5, borderRadius:12, borderColor:G.red+'50',
                 backgroundColor:G.red+'07', paddingVertical:13 },
});

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
function CosmeticScreenInner() {
  const insets       = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('themes');
  const { effectiveTheme, activePackId } = useCosmetic();
  const accent = effectiveTheme.primary;

  const BADGE_LABELS: Record<TabId, string> = {
    themes:  `${Object.keys(PACK_THEMES).length}`,
    support: '❤',
    fx:      '6',
  };

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      <TabSwipeOverlay />

      <CompactPageHeader
        title="SKINS"
        subtitle="Themes · Support · FX"
        badge={BADGE_LABELS[tab]}
        badgeColor={tab === 'themes' ? G.purple : tab === 'support' ? G.pink : G.amber}
        icon="palette"
        safeTop={insets.top}
        accent={accent}
      />

      <ModeBar active={tab} onSelect={setTab} />

      {tab === 'themes'  && <ThemesTab />}
      {tab === 'support' && <SupportTab />}
      {tab === 'fx'      && <FXTab />}
    </View>
  );
}

export default function CosmeticScreen() {
  return (
    <TabErrorBoundary name="Cosmetic">
      <CosmeticScreenInner />
    </TabErrorBoundary>
  );
}
