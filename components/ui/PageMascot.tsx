/**
 * PageMascot v2.0 — Per-page themed robot mascot.
 *
 * Each page gets a UNIQUE combination of:
 *  • robot face (pose)  — from MaterialCommunityIcons
 *  • accent colour      — matches page's design token
 *  • badge icon         — tiny context icon on the orb
 *  • bubble text        — page-specific one-liner tip/label
 *  • float speed        — slightly different per page (subtle personality)
 *  • ring style         — solid vs dashed orb border per page
 *
 * The bubble auto-shows on mount then hides; tap to toggle manually.
 * Zero heavy animations — only a gentle float (native driver).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

export interface PageMascotProps {
  page:
    | 'home'
    | 'scripts'
    | 'butler'
    | 'knowledge'
    | 'logs'
    | 'builder'
    | 'fileshare'
    | 'settings'
    | 'cosmetic'
    | 'onboarding';
  size?:        'sm' | 'md';
  showBubble?:  boolean;
}

interface PageCfg {
  face:        string; // MaterialCommunityIcons robot name
  badge:       string; // tiny badge icon
  color:       string;
  bubble:      string;
  floatMs:     number; // float cycle duration (ms)
  shape:       'circle' | 'squircle'; // border-radius style
}

const CFG: Record<PageMascotProps['page'], PageCfg> = {
  // HOME — friendly greeter, arms-open vibe → robot-happy, cyan
  home: {
    face: 'robot-happy', badge: 'home-variant', color: '#00E5FF',
    bubble: 'HOME BASE', floatMs: 2200, shape: 'circle',
  },
  // SCRIPTS — energetic coder, excited pose → robot-excited, purple
  scripts: {
    face: 'robot-excited', badge: 'code-braces-box', color: '#CC44FF',
    bubble: '250 SCRIPTS', floatMs: 1600, shape: 'squircle',
  },
  // BUTLER — warm AI assistant, heart eyes → robot-love, green
  butler: {
    face: 'robot-love', badge: 'message-text', color: '#00FF88',
    bubble: 'ASK ME', floatMs: 2600, shape: 'circle',
  },
  // KNOWLEDGE — studious, industrial look → robot-industrial, amber
  knowledge: {
    face: 'robot-industrial', badge: 'brain', color: '#FFB020',
    bubble: 'LEARNING', floatMs: 3000, shape: 'squircle',
  },
  // LOGS — alert watchdog → robot (standard, vigilant), pink
  logs: {
    face: 'robot', badge: 'chart-bar', color: '#FF6EB4',
    bubble: 'WATCHING', floatMs: 1800, shape: 'circle',
  },
  // BUILDER — hammer-time, slightly angry/focused → robot-angry, yellow
  builder: {
    face: 'robot-angry', badge: 'hammer-screwdriver', color: '#FFD400',
    bubble: 'BUILD IT', floatMs: 1400, shape: 'squircle',
  },
  // FILESHARE — calm vault guardian → robot-outline, blue
  fileshare: {
    face: 'robot-outline', badge: 'folder-lock', color: '#4488FF',
    bubble: 'VAULT OK', floatMs: 2800, shape: 'circle',
  },
  // SETTINGS — slightly confused but helpful → robot-confused, teal
  settings: {
    face: 'robot-confused', badge: 'tune-variant', color: '#00CCBB',
    bubble: 'CFG MODE', floatMs: 2400, shape: 'squircle',
  },
  // COSMETIC — fabulous, loves style → robot-love, hot pink
  cosmetic: {
    face: 'robot-love', badge: 'palette-swatch', color: '#FF44BB',
    bubble: 'STYLE UP', floatMs: 2000, shape: 'circle',
  },
  // ONBOARDING — excited welcome → robot-excited, cyan
  onboarding: {
    face: 'robot-excited', badge: 'rocket-launch', color: '#00E5FF',
    bubble: 'WELCOME!', floatMs: 1700, shape: 'circle',
  },
};

export function PageMascot({ page, size = 'sm', showBubble = true }: PageMascotProps) {
  const cfg = CFG[page] ?? CFG.home;
  const orbSize  = size === 'sm' ? 30 : 38;
  const iconSize = size === 'sm' ? 15 : 19;
  const radius   = cfg.shape === 'circle' ? orbSize / 2 : orbSize * 0.28;

  // Float — native driver only (translateY)
  const floatA  = useRef(new Animated.Value(0)).current;
  // Glow — JS driver (border colour), single lightweight loop
  const glowA   = useRef(new Animated.Value(0.35)).current;
  // Bubble scale — native driver spring
  const bubScaleA = useRef(new Animated.Value(0)).current;
  const [bubOpen, setBubOpen] = useState(false);

  useEffect(() => {
    const float = Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: cfg.floatMs,     useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: cfg.floatMs + 200, useNativeDriver: true }),
    ]));
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,    duration: 1200, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.25, duration: 1200, useNativeDriver: false }),
    ]));
    float.start();
    glow.start();

    if (showBubble) {
      const t = setTimeout(() => {
        setBubOpen(true);
        Animated.spring(bubScaleA, { toValue: 1, tension: 320, friction: 12, useNativeDriver: true }).start();
        setTimeout(() => {
          Animated.timing(bubScaleA, { toValue: 0, duration: 160, useNativeDriver: true })
            .start(() => setBubOpen(false));
        }, 2400);
      }, 700 + Math.random() * 400); // stagger so all headers don't pop at identical time
      return () => { float.stop(); glow.stop(); clearTimeout(t); };
    }
    return () => { float.stop(); glow.stop(); };
  }, []);

  const floatY  = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const borderC = glowA.interpolate({
    inputRange:  [0.25, 1],
    outputRange: [cfg.color + '45', cfg.color + 'CC'],
  });

  const toggleBubble = () => {
    if (bubOpen) {
      Animated.timing(bubScaleA, { toValue: 0, duration: 150, useNativeDriver: true })
        .start(() => setBubOpen(false));
    } else {
      setBubOpen(true);
      Animated.spring(bubScaleA, { toValue: 1, tension: 320, friction: 12, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(bubScaleA, { toValue: 0, duration: 150, useNativeDriver: true })
          .start(() => setBubOpen(false));
      }, 2000);
    }
  };

  return (
    <View style={st.wrap}>
      {/* Bubble — absolute, above the orb */}
      {showBubble && bubOpen && (
        <Animated.View
          pointerEvents="none"
          style={[st.bubble, {
            borderColor:     cfg.color + '70',
            backgroundColor: '#040C18',
            transform:       [{ scale: bubScaleA }],
          }]}
        >
          {/* Tail triangle */}
          <View style={[st.tail, { borderTopColor: cfg.color + '70' }]} />
          <Text style={[st.bubTxt, { color: cfg.color }]}>{cfg.bubble}</Text>
        </Animated.View>
      )}

      <TouchableOpacity
        onPress={toggleBubble}
        activeOpacity={0.82}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {/* Outer glow ring (JS driver — borderColor only) */}
        <Animated.View style={[
          st.orb,
          {
            width: orbSize, height: orbSize, borderRadius: radius,
            borderColor: borderC,
            backgroundColor: cfg.color + '10',
            ...Platform.select({
              ios:     { shadowColor: cfg.color, shadowOffset:{width:0,height:2}, shadowOpacity:0.55, shadowRadius:7 },
              android: { elevation: 3 },
            }),
          },
        ]}>
          {/* Float wrap — native driver */}
          <Animated.View style={{ transform: [{ translateY: floatY }] }}>
            <MaterialCommunityIcons name={cfg.face as any} size={iconSize} color={cfg.color} />
          </Animated.View>

          {/* Tiny badge icon — bottom-right corner */}
          <View style={[st.badge, {
            borderColor:     cfg.color + '55',
            backgroundColor: cfg.color + '18',
            borderRadius: cfg.shape === 'circle' ? 6 : 3,
          }]}>
            <MaterialCommunityIcons name={cfg.badge as any} size={6} color={cfg.color} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:   { alignItems: 'center', position: 'relative' },
  orb:    { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' },
  badge:  { position: 'absolute', bottom: -2, right: -2, width: 11, height: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', bottom: '100%', left: '50%', marginLeft: -34, marginBottom: 7, borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3.5, minWidth: 68, alignItems: 'center', zIndex: 999 },
  tail:   { position: 'absolute', bottom: -7, left: '50%', marginLeft: -5, width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  bubTxt: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, textAlign: 'center' },
});
