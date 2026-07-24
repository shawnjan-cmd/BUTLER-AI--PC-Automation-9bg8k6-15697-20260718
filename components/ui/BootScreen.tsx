/**
 * BootScreen — polished full-screen boot overlay.
 * Fades out when init completes. Section 18.1 spec.
 * All animations: useNativeDriver: true.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, StyleSheet, Dimensions,
} from 'react-native';
import { FontFamily } from '@/constants/typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SW, height: SH } = Dimensions.get('window');

const BOOT_MESSAGES = [
  'Checking onboarding state…',
  'Loading device profile…',
  'Mounting secure storage…',
  'Verifying pair signature…',
  'Preparing Butler AI…',
  'Almost there…',
] as const;

interface BootScreenProps {
  visible: boolean;
}

export const BootScreen = memo(function BootScreen({ visible }: BootScreenProps) {
  const opacity     = useRef(new Animated.Value(1)).current;   // native
  const pulse       = useRef(new Animated.Value(0.85)).current; // native — ring scale
  const cursorAnim  = useRef(new Animated.Value(1)).current;   // native — cursor blink

  const [msgIdx, setMsgIdx]     = useState(0);
  const [isVisible, setVisible] = useState(true);
  const mountedRef = useRef(true);

  // Fade out when visible→false
  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => { if (mountedRef.current) setVisible(false); });
    }
  }, [visible]);

  useEffect(() => {
    mountedRef.current = true;
    if ((globalThis as any).__BUTLER_SAFE_MODE__) return;

    // Pulsing ring
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse,  { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      Animated.timing(pulse,  { toValue: 0.85, duration: 900, useNativeDriver: true }),
    ]));
    // Cursor blink
    const cursorLoop = Animated.loop(Animated.sequence([
      Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    pulseLoop.start();
    cursorLoop.start();

    // Rotate status messages
    const t = setInterval(() => {
      if (mountedRef.current) setMsgIdx(i => (i + 1) % BOOT_MESSAGES.length);
    }, 1100);

    return () => {
      mountedRef.current = false;
      pulseLoop.stop();
      cursorLoop.stop();
      clearInterval(t);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Animated.View pointerEvents="none" style={[s.root, { opacity }]}>
      {/* Subtle grid lines */}
      <View style={s.gridH1} />
      <View style={s.gridH2} />

      {/* Logo ring */}
      <View style={s.center}>
        <Animated.View style={[s.ring, { transform: [{ scale: pulse }] }]}>
          <View style={s.logoBox}>
            <MaterialCommunityIcons name="robot-happy-outline" size={48} color="#6EE7FF" />
          </View>
        </Animated.View>

        {/* Status line */}
        <View style={s.statusRow}>
          <Text style={s.statusTxt}>{BOOT_MESSAGES[msgIdx]}</Text>
          <Animated.Text style={[s.cursor, { opacity: cursorAnim }]}>▌</Animated.Text>
        </View>

        {/* Progress hairline */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: `${(msgIdx / BOOT_MESSAGES.length) * 100}%` }]} />
        </View>
      </View>

      {/* BUTLER AI wordmark */}
      <View style={s.wordmark}>
        <Text style={s.wordmarkTxt}>BUTLER</Text>
        <Text style={[s.wordmarkTxt, { color: '#6EE7FF' }]}> AI</Text>
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#04080F',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:          200,
  },
  gridH1: {
    position:  'absolute',
    top:       '30%',
    left:       0,
    right:      0,
    height:     1,
    borderTopWidth: 1,
    borderColor: 'rgba(0,229,255,0.04)',
  },
  gridH2: {
    position:  'absolute',
    top:       '65%',
    left:       0,
    right:      0,
    height:     1,
    borderTopWidth: 1,
    borderColor: 'rgba(0,229,255,0.04)',
  },
  center: {
    alignItems: 'center',
    gap:         16,
  },
  ring: {
    width:           80,
    height:          80,
    borderRadius:    40,
    borderWidth:     2,
    borderColor:    'rgba(0,229,255,0.30)',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  logoBox: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            4,
  },
  statusTxt: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       12,
    color:         'rgba(0,229,255,0.55)',
    letterSpacing:  0.5,
  },
  cursor: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       12,
    color:         '#6EE7FF',
  },
  progressTrack: {
    width:           160,
    height:           2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:     1,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#6EE7FF',
    borderRadius:     1,
  },
  wordmark: {
    position:   'absolute',
    bottom:      48,
    flexDirection: 'row',
  },
  wordmarkTxt: {
    fontFamily:    FontFamily.displayBold as any,
    fontSize:       18,
    color:         '#E4EBF5',
    letterSpacing:  4,
  },
});

export default BootScreen;
