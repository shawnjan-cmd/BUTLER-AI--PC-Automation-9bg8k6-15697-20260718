/**
 * QuickButlerBar — NEXUS ASK BUTLER v3.0
 * Expandable AI prompt bar that floats above the tab bar.
 * Inspired by the "ASK BUTLER" HUD panel from reference images.
 * Features: terminal prompt input · expandable chip grid · animated glow frame
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  Keyboard, Animated, Dimensions, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';

export const BUTLER_PREFILL_KEY = '@butler_prefill_prompt';

const SW = Dimensions.get('window').width;
const BAR_H = 66;
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const C = {
  bg:     '#040A14',
  panel:  '#070F1E',
  cyan:   '#00E5FF',
  green:  '#00FF88',
  purple: '#9B3DFF',
  amber:  '#FFB020',
  pink:   '#FF44AA',
  text:   '#D0E8F6',
  dim:    '#2A4060',
};

const QUICK_PROMPTS = [
  { label: 'PC Status',     icon: 'desktop-mac',         lib: 'community' as const, color: C.cyan,
    msg: 'Show me CPU, RAM, and disk usage right now' },
  { label: 'Write Script',  icon: 'code-braces',          lib: 'community' as const, color: C.purple,
    msg: 'Write a Python automation script for' },
  { label: 'Live Metrics',  icon: 'chart-areaspline',     lib: 'community' as const, color: C.green,
    msg: 'Show live system performance metrics and graphs' },
  { label: 'Scan Network',  icon: 'access-point-network', lib: 'community' as const, color: C.amber,
    msg: 'Scan my local network for active devices' },
  { label: 'Clean Temp',    icon: 'broom',                lib: 'community' as const, color: C.pink,
    msg: 'Write a Python script to clean temp files and free disk space' },
  { label: 'Auto Backup',   icon: 'backup-restore',       lib: 'community' as const, color: '#4A9EFF',
    msg: 'Create an automated backup script for my Documents folder' },
];

export default function QuickButlerBar() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const barBottom = 72 + (insets.bottom > 0 ? insets.bottom : 8) + 6;

  const [text,     setText]     = useState('');
  const [focused,  setFocused]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animations
  const glowA    = useRef(new Animated.Value(0.4)).current;
  const shimX    = useRef(new Animated.Value(-SW)).current;
  const cursor   = useRef(new Animated.Value(1)).current;
  const sendSc   = useRef(new Animated.Value(1)).current;
  const expandA  = useRef(new Animated.Value(0)).current;
  const scanA    = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    // Outer glow pulse (borderA merged into glowA — single value, no redundant loop)
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowA,  { toValue: 1,   duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA,  { toValue: 0.2, duration: 1800, useNativeDriver: false }),
    ]));
    // Shimmer sweep — 3 iterations then rests until next focus
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimX, { toValue: SW + 80, duration: 2800, useNativeDriver: false }),
        Animated.timing(shimX, { toValue: -SW,     duration: 0,    useNativeDriver: false }),
        Animated.delay(5000),
      ]),
      { iterations: 3 }
    );
    // Cursor blink — native driver, cheap
    const cursorLoop = Animated.loop(Animated.sequence([
      Animated.timing(cursor, { toValue: 0, duration: 60, delay: 650, useNativeDriver: true }),
      Animated.timing(cursor, { toValue: 1, duration: 60, delay: 650, useNativeDriver: true }),
    ]));
    // Scan line — 3 iterations
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanA, { toValue: 1, duration: 3200, useNativeDriver: false }),
        Animated.timing(scanA, { toValue: 0, duration: 0,    useNativeDriver: false }),
        Animated.delay(600),
      ]),
      { iterations: 3 }
    );

    const loops = [glowLoop, shimmerLoop, cursorLoop, scanLoop];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [isFocused]);

  const toggleExpand = useCallback(() => {
    try { haptics.light(); } catch {}
    const next = !expanded;
    setExpanded(next);
    if (next) Keyboard.dismiss();
    Animated.spring(expandA, { toValue: next ? 1 : 0, tension: 65, friction: 10, useNativeDriver: false }).start();
  }, [expanded]);

  const handleSend = useCallback(async () => {
    const prompt = text.trim();
    try { haptics.medium(); } catch {}
    Animated.sequence([
      Animated.spring(sendSc, { toValue: 0.80, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(sendSc, { toValue: 1,    useNativeDriver: true, speed: 26, bounciness: 12 }),
    ]).start();
    if (prompt) {
      try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, prompt); } catch {}
      try { (global as any).__butlerInjectMessage?.(prompt); } catch {}
      setText('');
      Keyboard.dismiss();
    }
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, [text]);

  const handleChip = useCallback(async (msg: string) => {
    try { haptics.medium(); } catch {}
    try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, msg); } catch {}
    try { (global as any).__butlerInjectMessage?.(msg); } catch {}
    setExpanded(false);
    Animated.spring(expandA, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }).start();
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, []);

  const handleOpenChat = useCallback(() => {
    try { haptics.heavy(); } catch {}
    setExpanded(false);
    Animated.spring(expandA, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }).start();
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, []);

  const ready    = text.trim().length > 0;
  const expandH  = expandA.interpolate({ inputRange: [0, 1], outputRange: [0, 238] });
  const borderC  = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [C.cyan + '45', C.cyan + 'BB'] });
  const glowSc   = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [C.cyan + '22', C.cyan + '66'] });
  const scanY    = scanA.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_H + 2] });

  return (
    <View style={[s.wrap, { bottom: barBottom }]} pointerEvents="box-none">

      {/* ── EXPANDED PROMPT PANEL ─────────────────────────────── */}
      <Animated.View style={[s.panel, { height: expandH }]}>
        {/* Panel header */}
        <View style={s.panelHeader}>
          {/* Chat bubble icon (matches reference image "ASK BUTLER") */}
          <View style={s.chatIconBox}>
            <MaterialCommunityIcons name="chat-processing-outline" size={22} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.panelTitle}>ASK BUTLER</Text>
            <Text style={s.panelSub}>{`Quick prompts · tap to send instantly`}</Text>
          </View>
          <View style={[s.actionTag, { borderColor: C.cyan + '50', backgroundColor: C.cyan + '10' }]}>
            <Text style={[s.actionTagTxt, { color: C.cyan }]}>ACTION</Text>
          </View>
        </View>

        {/* Prompt chip grid */}
        <View style={s.chipGrid}>
          {QUICK_PROMPTS.map((p, i) => {
            const Icon = p.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
            return (
              <Pressable key={i} onPress={() => handleChip(p.msg)}
                style={({ pressed }) => [s.chip, {
                  borderColor: pressed ? p.color + 'AA' : p.color + '35',
                  backgroundColor: pressed ? p.color + '18' : p.color + '08',
                }]}>
                <Icon name={p.icon as any} size={11} color={p.color} />
                <Text style={[s.chipTxt, { color: p.color }]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Open full chat CTA */}
        <Pressable onPress={handleOpenChat}
          style={({ pressed }) => [s.openBtn, { opacity: pressed ? 0.85 : 1 }]}>
          <MaterialCommunityIcons name="robot-excited" size={16} color="#000" />
          <Text style={s.openBtnTxt}>OPEN BUTLER AI CHAT</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#000" />
        </Pressable>
      </Animated.View>

      {/* ── 3D DEPTH PLATE ──────────────────────────────────────── */}
      <View pointerEvents="none" style={s.depthPlate} />

      {/* ── GLOW SHELL (animated neon border) ───────────────────── */}
      <Animated.View pointerEvents="none" style={[s.glowShell, { borderColor: borderC,
        ...(Platform.OS === 'ios' ? {
          shadowColor: C.cyan, shadowOffset:{width:0,height:0},
          shadowOpacity: glowA as any, shadowRadius: 20,
        } : {}),
      }]} />

      {/* ── MAIN BAR ────────────────────────────────────────────── */}
      <View style={[s.slab, expanded && s.slabExpanded]}>
        {/* Top neon bar with shimmer */}
        <Animated.View style={[s.topNeonBar, { opacity: glowA }]}>
          <Animated.View pointerEvents="none" style={[s.shimmer, { transform: [{ translateX: shimX }] }]} />
        </Animated.View>

        {/* Scan line */}
        <Animated.View pointerEvents="none" style={[s.scanLine, { transform: [{ translateY: scanY }] }]} />

        {/* HUD corners */}
        {[
          { top: 3, left: 3,   borderTopWidth: 2, borderLeftWidth: 2  },
          { top: 3, right: 3,  borderTopWidth: 2, borderRightWidth: 2 },
          { bottom: 8, left: 3,   borderBottomWidth: 2, borderLeftWidth: 2  },
          { bottom: 8, right: 3,  borderBottomWidth: 2, borderRightWidth: 2 },
        ].map((c, i) => (
          <View key={i} pointerEvents="none" style={[s.hudCorner, { borderColor: C.cyan + '70', ...c }]} />
        ))}

        {/* Content row */}
        <View style={s.row}>
          {/* Robot avatar button */}
          <Pressable onPress={toggleExpand} hitSlop={{ top:8,bottom:8,left:4,right:4 }}
            style={[s.robotBtn, expanded && { backgroundColor: C.cyan + '22', borderColor: C.cyan + 'AA' }]}>
            <MaterialCommunityIcons
              name={expanded ? 'robot-happy' : 'robot-outline'}
              size={18} color={C.cyan} />
            <Animated.View style={[s.robotDot, { backgroundColor: C.green, opacity: glowA }]} />
          </Pressable>

          {/* Terminal prompt prefix + cursor */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Text style={s.promptPrefix}>{'>|'}</Text>
            {!focused && text.length === 0 && (
              <Animated.View style={[s.cursor, { opacity: cursor }]} />
            )}
          </View>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onFocus={() => { setFocused(true); if (expanded) toggleExpand(); }}
            onBlur={() => setFocused(false)}
            placeholder="ASK BUTLER"
            placeholderTextColor={C.cyan + '38'}
            style={s.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            maxLength={500}
            underlineColorAndroid="transparent"
            selectionColor={C.cyan}
          />

          {/* Expand toggle */}
          <Pressable onPress={toggleExpand} hitSlop={{top:8,bottom:8,left:4,right:4}}
            style={[s.expandBtn, expanded && { backgroundColor: C.cyan + '1A', borderColor: C.cyan + '70' }]}>
            <MaterialIcons
              name={expanded ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
              size={16} color={C.cyan} />
          </Pressable>

          {/* Send button */}
          <Animated.View style={{ transform: [{ scale: sendSc }] }}>
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.8}
              hitSlop={{ top:10,bottom:10,left:6,right:10 }}
              style={[s.sendBtn,
                ready ? [s.sendReady, Platform.OS === 'ios' && {
                  shadowColor: C.cyan, shadowOffset:{width:0,height:0},
                  shadowOpacity: 0.9, shadowRadius: 12,
                }] : s.sendIdle
              ]}>
              <MaterialIcons name={ready ? 'send' : 'chevron-right'} size={15} color={ready ? '#000' : C.cyan} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Status line */}
        <View pointerEvents="none" style={s.statusRow}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.green, opacity: 0.8 }} />
          <Text style={s.statusTxt}>{`BUTLER · LOCAL LLM · LAN-ONLY`}</Text>
          {expanded && (
            <Text style={[s.statusTxt, { color: C.cyan + '80', marginLeft: 6 }]}>{`▲ QUICK PROMPTS`}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 10, right: 10, zIndex: 60,
  },
  // ── Expanded panel
  panel: {
    backgroundColor: 'rgba(4,10,22,0.97)',
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
    borderWidth: 1.5, borderBottomWidth: 0, borderColor: C.cyan + '40',
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: C.cyan, shadowOffset:{width:0,height:-6}, shadowOpacity:0.35, shadowRadius:16 }
      : { elevation: 12 }),
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.cyan + '18',
  },
  chatIconBox: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1.5,
    borderColor: C.cyan + '55', backgroundColor: C.cyan + '12',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  panelTitle: {
    fontFamily: MONO, fontSize: 18, fontWeight: '900', color: C.cyan, letterSpacing: 1.5,
  },
  panelSub: {
    fontFamily: MONO, fontSize: 8.5, color: C.dim, marginTop: 2, letterSpacing: 0.3,
  },
  actionTag: {
    borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
  },
  actionTagTxt: {
    fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.8,
  },
  chipGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 18,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipTxt: {
    fontFamily: MONO, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.2,
  },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.cyan, borderRadius: 10, paddingVertical: 11,
    marginHorizontal: 12, marginBottom: 10,
    ...(Platform.OS === 'ios'
      ? { shadowColor: C.cyan, shadowOffset:{width:0,height:0}, shadowOpacity:0.7, shadowRadius:12 }
      : {}),
  },
  openBtnTxt: {
    fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 0.8,
  },
  // ── 3D depth
  depthPlate: {
    position: 'absolute', left: 4, right: 4, top: 6, bottom: -6,
    borderRadius: 15, backgroundColor: '#000', opacity: 0.65,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset:{width:0,height:12}, shadowOpacity:0.85, shadowRadius:22 }
      : { elevation: 18 }),
  },
  glowShell: {
    position: 'absolute', left: -1, right: -1, top: -1, bottom: 6,
    borderRadius: 15, borderWidth: 2,
  },
  // ── Main slab
  slab: {
    height: BAR_H, borderRadius: 13, overflow: 'hidden',
    backgroundColor: '#06101E',
    borderWidth: 1.5, borderColor: C.cyan + '35',
    position: 'relative',
    ...(Platform.OS === 'android' ? { elevation: 6 } : {}),
  },
  slabExpanded: {
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    borderTopColor: C.cyan + '80',
  },
  topNeonBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
    backgroundColor: C.cyan, overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 70,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ skewX: '-20deg' }],
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: C.cyan, opacity: 0.12, zIndex: 5,
  },
  hudCorner: {
    position: 'absolute', width: 10, height: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 10, paddingRight: 8, paddingTop: 5, paddingBottom: 10,
    gap: 6, flex: 1,
  },
  robotBtn: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    backgroundColor: C.cyan + '0E', borderWidth: 1.5, borderColor: C.cyan + '45',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    ...(Platform.OS === 'ios'
      ? { shadowColor: C.cyan, shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:8 }
      : {}),
  },
  robotDot: {
    position: 'absolute', top: -3, right: -3,
    width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: '#06101E',
  },
  promptPrefix: {
    fontFamily: MONO, fontSize: 13, fontWeight: '900', color: C.cyan, letterSpacing: -1,
  },
  cursor: {
    width: 7, height: 14, backgroundColor: C.cyan, marginLeft: 2, borderRadius: 1,
  },
  input: {
    flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '700',
    fontFamily: MONO, letterSpacing: 0.3,
    paddingVertical: 0, paddingHorizontal: 2,
  },
  expandBtn: {
    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
    backgroundColor: C.cyan + '08', borderWidth: 1, borderColor: C.cyan + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  sendReady: { backgroundColor: C.cyan, borderColor: C.cyan + 'DD' },
  sendIdle:  { backgroundColor: C.cyan + '0C', borderColor: C.cyan + '45' },
  statusRow: {
    position: 'absolute', bottom: 3, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  statusTxt: {
    fontFamily: MONO, fontSize: 7, fontWeight: '700',
    color: C.cyan + '55', letterSpacing: 1.5,
  },
});
