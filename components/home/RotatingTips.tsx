/**
 * BUTLER AI — RotatingTips Component
 * Auto-rotating helpful tips: large heading + wrapping subtitle,
 * tap-to-advance, progress dots, fully centered.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const C = {
  bg:     '#020509',
  surf:   '#06101A',
  cyan:   '#00D4F0',
  green:  '#00E880',
  amber:  '#FFB020',
  purple: '#C055FF',
  blue:   '#4890FF',
  teal:   '#00C8A8',
  text:   '#C8E2F4',
  mid:    '#486880',
  dim:    '#162230',
};

export interface Tip {
  icon:    string;
  color:   string;
  heading: string;
  body:    string;
  tag?:    string;
}

const DEFAULT_TIPS: Tip[] = [
  {
    icon: 'shield-lock-outline', color: C.cyan,
    heading: 'AES-256-GCM Encrypted',
    body: 'Every byte between your phone and PC is encrypted. No middleman, no relay server, no cloud.',
    tag: 'SECURITY',
  },
  {
    icon: 'robot-happy-outline', color: C.purple,
    heading: 'AI Runs on Your PC',
    body: 'Ollama runs qwen2.5-coder:7b on your own hardware. No API keys, no usage fees, no data leaving your home.',
    tag: 'LOCAL AI',
  },
  {
    icon: 'code-braces', color: C.amber,
    heading: '250+ Ready-to-Run Scripts',
    body: 'System cleanup, disk analysis, network scan, process monitoring — one tap to execute anything.',
    tag: 'SCRIPTS',
  },
  {
    icon: 'wifi-off', color: C.green,
    heading: 'Zero Cloud Architecture',
    body: 'Butler AI never connects to the internet. All traffic is phone ↔ LAN ↔ PC — fully air-gapped.',
    tag: 'PRIVACY',
  },
  {
    icon: 'undo-variant', color: C.teal,
    heading: 'Every Script Is Reversible',
    body: 'Execution logged and reversible for 15 minutes. Tap the UNDO button in the terminal to roll back.',
    tag: 'SAFETY',
  },
  {
    icon: 'brain', color: C.purple,
    heading: 'Knowledge Base Self-Grows',
    body: 'SIGMA-NET crawler indexes Python docs, psutil API, and your own scripts automatically over time.',
    tag: 'KNOWLEDGE',
  },
  {
    icon: 'clipboard-arrow-left-right-outline', color: C.blue,
    heading: 'Instant Clipboard Sync',
    body: 'Copy text on your phone, tap PUSH PC, and it instantly arrives in your PC clipboard — no cable needed.',
    tag: 'TOOLS',
  },
  {
    icon: 'qrcode-scan', color: C.cyan,
    heading: 'Pair Once, Reconnect Always',
    body: 'Scan the QR code once. Butler remembers your PC and reconnects automatically every time you open the app.',
    tag: 'PAIRING',
  },
  {
    icon: 'gesture-tap', color: C.amber,
    heading: 'Nothing Runs Without You',
    body: 'Every script, command, and AI prompt requires your explicit tap. No background execution, no scheduler.',
    tag: 'CONSENT',
  },
  {
    icon: 'delete-forever', color: C.teal,
    heading: 'Delete Everything in 3 Taps',
    body: 'Settings → DELETE ALL MY DATA — immediate, permanent, server + local storage wiped in seconds.',
    tag: 'GDPR',
  },
];

interface RotatingTipsProps {
  tips?:     Tip[];
  interval?: number;
}

export function RotatingTips({ tips = DEFAULT_TIPS, interval = 5500 }: RotatingTipsProps) {
  const [idx, setIdx] = useState(0);
  const fadeA  = useRef(new Animated.Value(1)).current;
  const slideA = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((next?: number) => {
    const nextIdx = next !== undefined ? next : (idx + 1) % tips.length;
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 0,   duration: 180, useNativeDriver: true }),
      Animated.timing(slideA, { toValue: -12, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleA, { toValue: 0.96, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setIdx(nextIdx);
      slideA.setValue(14);
      Animated.parallel([
        Animated.timing(fadeA,  { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideA, { toValue: 0, tension: 180, friction: 14, useNativeDriver: true }),
        Animated.spring(scaleA, { toValue: 1, tension: 200, friction: 12, useNativeDriver: true }),
      ]).start();
    });
  }, [idx, tips.length, fadeA, slideA, scaleA]);

  useEffect(() => {
    timerRef.current = setInterval(() => advance(), interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [advance, interval]);

  const handleTap = () => {
    haptics.light();
    if (timerRef.current) clearInterval(timerRef.current);
    advance();
    timerRef.current = setInterval(() => advance(), interval);
  };

  const tip = tips[idx];
  if (!tip) return null;

  return (
    <TouchableOpacity onPress={handleTap} activeOpacity={0.88}>
      <View style={[rt.root, { borderColor: tip.color + '35', backgroundColor: C.surf }]}>
        <View style={[rt.accentBar, { backgroundColor: tip.color }]} />
        <Animated.View style={[rt.inner, { opacity: fadeA, transform: [{ translateY: slideA }, { scale: scaleA }] }]}>
          {/* Icon + tag row */}
          <View style={rt.iconRow}>
            <View style={[rt.iconBox, { borderColor: tip.color + '60', backgroundColor: tip.color + '14' }]}>
              <MaterialCommunityIcons name={tip.icon as any} size={20} color={tip.color} />
            </View>
            {tip.tag && (
              <View style={[rt.tagBadge, { borderColor: tip.color + '50', backgroundColor: tip.color + '0C' }]}>
                <Text style={[rt.tagTxt, { color: tip.color }]}>{tip.tag}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <MaterialIcons name="touch-app" size={11} color={C.mid} />
            <Text style={rt.tapHint}>TAP TO ADVANCE</Text>
          </View>

          {/* Heading */}
          <Text style={[rt.heading, { color: tip.color }]}>{tip.heading}</Text>

          {/* Body */}
          <Text style={rt.body}>{tip.body}</Text>
        </Animated.View>

        {/* Progress dots */}
        <View style={rt.dots}>
          {tips.map((_, i) => (
            <View key={i} style={[
              rt.dot,
              i === idx
                ? { flex: 2, backgroundColor: tip.color, opacity: 1 }
                : { backgroundColor: C.dim },
            ]} />
          ))}
        </View>

        {/* Counter */}
        <View style={rt.counter}>
          <Text style={[rt.counterTxt, { color: tip.color + '70' }]}>
            {String(idx + 1).padStart(2, '0')} / {String(tips.length).padStart(2, '0')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rt = StyleSheet.create({
  root: {
    borderRadius: 15, borderWidth: 1.5, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  accentBar: { height: 2.5 },
  inner:     { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 8 },
  iconRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox:   { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tagBadge:  { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  tagTxt:    { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  tapHint:   { fontFamily: MONO, fontSize: 7.5, color: C.mid, letterSpacing: 0.5 },
  heading:   { fontFamily: MONO, fontSize: 15, fontWeight: '900', lineHeight: 20, letterSpacing: 0.2 },
  body:      { fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 17 },
  dots: {
    flexDirection: 'row', gap: 3,
    paddingHorizontal: 14, paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  dot:     { flex: 1, height: 3, borderRadius: 2, backgroundColor: C.dim, opacity: 0.6 },
  counter: { position: 'absolute', bottom: 10, right: 14 },
  counterTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
});

export default RotatingTips;
