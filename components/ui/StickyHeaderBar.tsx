/**
 * StickyHeaderBar — always-visible compact header bar.
 * Matches Section 21.25: ">_ Pair PC to activate AI..." + OFFLINE/FULL badges.
 * Used in ScreenScaffold as a universal sticky header.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, TouchableOpacity, AppState,
  Platform, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  surfaceHeader: '#0C1019',
  text:     '#E8EAF0',
  cyan:     '#00D4FF',
  green:    '#00FF88',
  red:      '#FF3B30',
  muted:    '#888CA0',
  border:   'rgba(0,212,255,0.08)',
};

export interface StickyHeaderBarProps {
  isConnected?:  boolean;
  serverName?:   string;
  onToggleAI?:   () => void;
  onOpenChat?:   () => void;
  onExpand?:     () => void;
  aiEnabled?:    boolean;
}

export const StickyHeaderBar = memo(function StickyHeaderBar({
  isConnected = false,
  serverName  = '',
  onToggleAI,
  onOpenChat,
  onExpand,
  aiEnabled   = true,
}: StickyHeaderBarProps) {
  const insets = useSafeAreaInsets();
  const shimA  = useRef(new Animated.Value(-80)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: 260, duration: 2400, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -80, duration: 0,    useNativeDriver: true }),
      Animated.delay(7000),
    ]));
    loop.start();
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') loop.stop(); else loop.start();
    });
    return () => {
      mountedRef.current = false;
      loop.stop();
      sub.remove();
    };
  }, []);

  const cc = isConnected ? C.green : C.cyan;
  const prompt = isConnected
    ? (serverName || 'BUTLER-NEXUS @ 192.168.1.x')
    : '>_ Pair PC to activate AI...';

  return (
    <View style={[s.root, {
      paddingTop: insets.top > 0 ? insets.top + 2 : 8,
      borderBottomColor: C.border,
    }]}>
      {/* Shimmer sweep */}
      <Animated.View pointerEvents="none" style={[
        StyleSheet.absoluteFill,
        { transform: [{ translateX: shimA }] },
      ]}>
        <View style={s.shimmer} />
      </Animated.View>

      {/* Left: robot icon + prompt */}
      <MaterialCommunityIcons name="robot-happy-outline" size={20} color={cc} />
      <Text style={[s.prompt, { color: cc }]} numberOfLines={1}>
        {prompt}
      </Text>

      {/* Right: AI toggle + FULL + chevron */}
      <View style={s.right}>
        <TouchableOpacity
          onPress={onToggleAI}
          activeOpacity={0.75}
          style={[s.offBtn, {
            borderColor: aiEnabled ? C.red + '60' : C.muted + '40',
          }]}>
          <Text style={[s.offTxt, { color: aiEnabled ? C.red : C.muted }]}>
            {aiEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenChat}
          activeOpacity={0.75}
          style={[s.fullBtn, { borderColor: C.green + '50' }]}>
          <MaterialIcons name="open-in-new" size={9} color={C.green} />
          <Text style={[s.fullTxt, { color: C.green }]}>OPEN AI</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onExpand} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="expand-more" size={18} color={cc + '70'} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Second row: subtitle ticker
export const StickyHeaderSubrow = memo(function StickyHeaderSubrow({
  isConnected = false,
  onOpenChat,
}: { isConnected?: boolean; onOpenChat?: () => void }) {
  const TAGS = ['BUTLER AI', 'OLLAMA', 'LOCAL', 'AES-256', 'ZERO CLOUD'];
  return (
    <View style={s.subrow}>
      {TAGS.map((tag, i) => (
        <View key={tag} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          {i > 0 && <View style={s.subDot} />}
          <Text style={s.subTag}>{tag}</Text>
        </View>
      ))}
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={onOpenChat} activeOpacity={0.7}>
        <Text style={{ fontFamily: FontFamily.mono as any, fontSize: 8.5, color: C.cyan + '90', fontWeight: '900' as any }}>
          OPEN AI ›
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             9,
    backgroundColor: C.surfaceHeader,
    paddingHorizontal: 12,
    paddingBottom:   8,
    borderBottomWidth: 1,
    overflow:       'hidden',
    position:       'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  shimmer: {
    position:        'absolute',
    top:              0,
    bottom:           0,
    width:            80,
    backgroundColor: 'rgba(0,212,255,0.04)',
    transform:       [{ skewX: '-8deg' }],
  },
  prompt: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       11.5,
    flex:           1,
    letterSpacing:  0.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  offBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  offTxt: { fontFamily: FontFamily.mono as any, fontSize: 8.5, fontWeight: '900' as any, letterSpacing: 0.5 },
  fullBtn:{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: 'rgba(0,255,136,0.50)' },
  fullTxt:{ fontFamily: FontFamily.mono as any, fontSize: 8, fontWeight: '900' as any, letterSpacing: 0.3 },
  subrow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surfaceHeader,
    paddingHorizontal: 12, paddingBottom: 7, paddingTop: 2,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,212,255,0.06)',
  },
  subTag: { fontFamily: FontFamily.mono as any, fontSize: 8, color: '#6B7280', letterSpacing: 0.4, fontWeight: '700' as any },
  subDot: { width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: '#2A3649' },
});

export default StickyHeaderBar;
