/**
 * QuickButlerBar — NEXUS ASK BAR v5.0
 * Terminal-inspired floating prompt strip above the dock.
 * Completely different from v4: no expand panel, no chip grid visible by default.
 * Just a clean terminal prompt line with a ghost hint and send action.
 * Tapping the robot icon opens a compact chip sheet.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  Keyboard, Animated, Dimensions, Pressable, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';

export const BUTLER_PREFILL_KEY = '@butler_prefill_prompt';

const SW   = Dimensions.get('window').width;
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

// Terminal green palette — distinct from the app's cyan-heavy main design
const T = {
  bg:      '#010A04',      // very dark green-tinted black
  bar:     '#021208',      // bar background
  green:   '#00FF41',      // classic matrix green
  dimGreen:'#00AA2A',
  amber:   '#FFB020',
  cyan:    '#00E5FF',
  mid:     '#1A4A1F',
  dim:     '#0D2210',
  text:    '#C0F0C8',
  border:  'rgba(0,255,65,0.20)',
};

const CHIPS = [
  { icon: 'monitor-dashboard',  label: 'PC Status',     msg: 'Show CPU, RAM, and disk usage right now' },
  { icon: 'broom',              label: 'Clean Temp',    msg: 'Write Python to clean all temp files and show freed MB' },
  { icon: 'code-braces',        label: 'Write Script',  msg: 'Write a Python script to automate: ' },
  { icon: 'access-point',       label: 'Scan LAN',      msg: 'Scan my local network and list all connected devices' },
  { icon: 'cpu-64-bit',         label: 'Top Procs',     msg: 'Show the top 8 CPU-consuming processes right now' },
  { icon: 'harddisk',           label: 'Disk Map',      msg: 'Show disk usage breakdown by folder and drive' },
];

export default function QuickButlerBar() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const dockH    = 64 + (insets.bottom > 0 ? insets.bottom : 8);
  const barBottom = dockH + 6;

  const [text,      setText]      = useState('');
  const [focused,   setFocused]   = useState(false);
  const [showChips, setShowChips] = useState(false);
  const inputRef   = useRef<TextInput>(null);

  // Animations
  const blinkA  = useRef(new Animated.Value(1)).current;
  const sendScA = useRef(new Animated.Value(1)).current;
  const chipsA  = useRef(new Animated.Value(0)).current;
  const glowA   = useRef(new Animated.Value(0.4)).current;

  // Cursor blink
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blinkA, { toValue: 0, duration: 550, useNativeDriver: true }),
      Animated.timing(blinkA, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Glow pulse on the border
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1800, useNativeDriver: true }),
      Animated.timing(glowA, { toValue: 0.25, duration: 1800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Chips panel
  const toggleChips = useCallback(() => {
    haptics.light();
    const next = !showChips;
    setShowChips(next);
    if (next) Keyboard.dismiss();
    Animated.spring(chipsA, { toValue: next ? 1 : 0, tension: 75, friction: 11, useNativeDriver: false }).start();
  }, [showChips]);

  const handleSend = useCallback(async () => {
    const prompt = text.trim();
    haptics.heavy();
    Animated.sequence([
      Animated.spring(sendScA, { toValue: 0.75, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(sendScA, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 16 }),
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
    haptics.medium();
    setShowChips(false);
    Animated.spring(chipsA, { toValue: 0, tension: 80, friction: 12, useNativeDriver: false }).start();
    try { await AsyncStorage.setItem(BUTLER_PREFILL_KEY, msg); } catch {}
    try { (global as any).__butlerInjectMessage?.(msg); } catch {}
    try { router.push('/(tabs)/butler' as any); } catch {}
  }, []);

  const chipsH = chipsA.interpolate({ inputRange: [0, 1], outputRange: [0, 110] });
  const ready  = text.trim().length > 0;

  return (
    <View style={[s.wrap, { bottom: barBottom }]} pointerEvents="box-none">

      {/* ── CHIP SHEET (slides up) ── */}
      <Animated.View style={[s.chipSheet, { maxHeight: chipsH, overflow: 'hidden' }]}>
        <View style={s.chipSheetInner}>
          <Text style={s.chipHdr}>{'>> QUICK_COMMANDS'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 7, paddingHorizontal: 10, paddingBottom: 8 }}>
            {CHIPS.map((c, i) => (
              <Pressable key={i} onPress={() => handleChip(c.msg)}
                style={({ pressed }) => [s.chip, { opacity: pressed ? 0.7 : 1 }]}>
                <MaterialCommunityIcons name={c.icon as any} size={12} color={T.green} />
                <Text style={s.chipTxt}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── MAIN TERMINAL BAR ── */}
      <Animated.View style={[s.bar, focused && s.barFocused]}>
        {/* Green scanline at top */}
        <View style={s.scanline} />

        {/* Prompt row */}
        <View style={s.row}>
          {/* Left: robot toggle (opens chips) */}
          <TouchableOpacity onPress={toggleChips} activeOpacity={0.8} style={s.robotBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <MaterialCommunityIcons
              name={showChips ? 'robot-happy' : 'robot-outline'}
              size={18}
              color={showChips ? T.green : T.dimGreen}
            />
          </TouchableOpacity>

          {/* Terminal prompt symbol */}
          <Text style={s.promptSym}>{'$>'}</Text>

          {/* Input */}
          <View style={s.inputWrap}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              onFocus={() => { setFocused(true); if (showChips) toggleChips(); }}
              onBlur={() => setFocused(false)}
              placeholder="run command or ask butler..."
              placeholderTextColor={T.mid}
              style={s.input}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              maxLength={600}
              underlineColorAndroid="transparent"
              selectionColor={T.green}
              keyboardAppearance="dark"
            />
            {/* Blinking cursor when not focused and empty */}
            {!focused && !text && (
              <Animated.View style={[s.cursor, { opacity: blinkA }]} />
            )}
          </View>

          {/* Send button */}
          <Animated.View style={{ transform: [{ scale: sendScA }] }}>
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.85}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
              style={[s.sendBtn, ready ? s.sendBtnActive : s.sendBtnIdle]}
            >
              <MaterialIcons
                name={ready ? 'send' : 'keyboard-arrow-right'}
                size={15}
                color={ready ? '#000' : T.dimGreen}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Status line at bottom */}
        <View style={s.statusRow}>
          <View style={s.statusDot} />
          <Text style={s.statusTxt}>BUTLER_AI  ·  LOCAL_LLM  ·  ZERO_CLOUD</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => { haptics.light(); try { router.push('/(tabs)/butler' as any); } catch {} }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.statusTxt, { color: T.green + '90', textDecorationLine: 'underline' }]}>OPEN_CHAT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:         { position: 'absolute', left: 8, right: 8, zIndex: 60 },

  // Chip sheet
  chipSheet:    { backgroundColor: '#010D04', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderBottomWidth: 0, borderColor: T.green + '35', overflow: 'hidden' },
  chipSheetInner:{ },
  chipHdr:      { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: T.dimGreen, letterSpacing: 1.2, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 4 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7, borderColor: T.green + '40', backgroundColor: T.dim },
  chipTxt:      { fontFamily: MONO, fontSize: 9.5, fontWeight: '700', color: T.green },

  // Main bar
  bar:          {
    height: 58, borderRadius: 12, overflow: 'hidden',
    backgroundColor: T.bar, borderWidth: 1.5, borderColor: T.green + '35',
    ...Platform.select({ android: { elevation: 7 }, default: {} }),
  },
  barFocused:   { borderColor: T.green + '80' },
  scanline:     { height: 2.5, backgroundColor: T.green },

  // Row
  row:          { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 9, flex: 1, gap: 7, marginTop: 4 },
  robotBtn:     { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  promptSym:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: T.dimGreen, letterSpacing: -0.5, flexShrink: 0 },
  inputWrap:    { flex: 1, position: 'relative', justifyContent: 'center', height: 32 },
  input:        { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: T.text, padding: 0, height: 32, includeFontPadding: false },
  cursor:       { position: 'absolute', left: 0, top: 8, width: 8, height: 14, backgroundColor: T.green, borderRadius: 1 },
  sendBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnActive:{ backgroundColor: T.green, ...Platform.select({ ios: { shadowColor: T.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 }, android: { elevation: 8 }, default: {} }) },
  sendBtnIdle:  { backgroundColor: T.dim, borderWidth: 1, borderColor: T.green + '30' },

  // Status
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingBottom: 5, marginTop: -2 },
  statusDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: T.green, opacity: 0.7 },
  statusTxt:    { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: T.dimGreen + 'AA', letterSpacing: 1.2 },
});
