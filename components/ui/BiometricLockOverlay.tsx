/**
 * BiometricLockOverlay — Full-screen animated lock screen
 * Renders over everything when biometricLock.status === 'locked'.
 * Wire into app/_layout.tsx as the outermost child.
 *
 * Features:
 *  - Animated shield pulse + fingerprint scan lines
 *  - Face ID / Touch ID / Fingerprint auto-prompt
 *  - 6-digit PIN fallback with shake animation on wrong PIN
 *  - Settings toggle to enable/disable + change timeout
 *  - Graceful fallback when biometrics unavailable
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable, Modal,
  Platform, Dimensions, TextInput, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { biometricLock, BiometricLockState } from '@/services/biometricLock';
import { haptics } from '@/services/haptics';

const { width: SW, height: SH } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const C = {
  bg:      '#010508',
  surf:    '#060E1A',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  red:     '#FF3344',
  amber:   '#FFB020',
  purple:  '#CC44FF',
  mid:     '#5A7A96',
  dim:     '#243040',
  text:    '#C8E4F0',
};

type View = 'lock' | 'pin' | 'settings';

export function BiometricLockOverlay() {
  const insets = useSafeAreaInsets();
  const [lockState, setLockState] = useState<BiometricLockState>(biometricLock.getState());
  const [view,      setView]      = useState<View>('lock');
  const [pin,       setPin]       = useState('');
  const [pinError,  setPinError]  = useState('');
  const [newPin,    setNewPin]    = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy,      setBusy]      = useState(false);

  // Security: wipe PIN from memory when overlay unmounts or lock state changes
  useEffect(() => () => {
    setPin('');
    setNewPin('');
    setPinError('');
  }, []);
  useEffect(() => {
    if (lockState.status !== 'locked') {
      setPin('');
      setNewPin('');
      setPinError('');
    }
  }, [lockState.status]);

  // Animations
  const shieldA  = useRef(new Animated.Value(0.6)).current;
  const scanA    = useRef(new Animated.Value(-SH * 0.5)).current;
  const ring1A   = useRef(new Animated.Value(0)).current;
  const ring2A   = useRef(new Animated.Value(0)).current;
  const shakeA   = useRef(new Animated.Value(0)).current;
  const slideA   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = biometricLock.subscribe(s => {
      setLockState(s);
      if (s.status !== 'locked') setView('lock');
    });
    biometricLock.init();
    return unsub;
  }, []);

  // Shield pulse
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(shieldA, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      Animated.timing(shieldA, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);

  // Expanding rings
  const startRings = useCallback(() => {
    const makeRing = (a: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(400),
      ]));
    const r1 = makeRing(ring1A, 0);
    const r2 = makeRing(ring2A, 900);
    r1.start(); r2.start();
    return () => { r1.stop(); r2.stop(); };
  }, []);

  useEffect(() => {
    if (lockState.status !== 'locked') return;
    const stop = startRings();
    return stop;
  }, [lockState.status, startRings]);

  // Scan line
  useEffect(() => {
    if (lockState.status !== 'locked') return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SH * 0.6, duration: 3000, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -SH * 0.5, duration: 0, useNativeDriver: false }),
      Animated.delay(1500),
    ]));
    l.start(); return () => l.stop();
  }, [lockState.status]);

  // Slide up panel
  useEffect(() => {
    if (lockState.status === 'locked') {
      Animated.spring(slideA, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
      // Auto-prompt biometric on show
      if (lockState.isAvailable) {
        setTimeout(() => handleBiometric(), 600);
      }
    } else {
      slideA.setValue(0);
    }
  }, [lockState.status]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeA, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeA, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleBiometric = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const result = await biometricLock.unlockWithBiometric();
    setBusy(false);
    if (!result.success) {
      haptics.warning?.();
      setPinError(result.error?.includes('cancel') ? '' : (result.error ?? 'Failed'));
    } else {
      haptics.success();
    }
  }, [busy]);

  const handlePIN = useCallback(async () => {
    if (pin.length < 4) { setPinError('Enter at least 4 digits'); return; }
    setBusy(true);
    const result = await biometricLock.unlockWithPIN(pin);
    setBusy(false);
    if (!result.success) {
      shake(); haptics.warning?.();
      setPinError(result.error ?? 'Incorrect PIN');
      setPin('');
    } else {
      haptics.success();
      setPin('');
    }
  }, [pin]);

  const handleSaveNewPIN = useCallback(async () => {
    if (!confirming) {
      if (newPin.length < 4) { setPinError('Minimum 4 digits'); return; }
      setConfirming(true); setPinError('');
    } else {
      if (newPin !== pin) { shake(); setPinError('PINs do not match'); setPin(''); setConfirming(false); return; }
      await biometricLock.setPIN(newPin);
      haptics.success();
      setNewPin(''); setPin(''); setConfirming(false);
      setPinError('PIN saved!');
      setTimeout(() => setPinError(''), 2000);
    }
  }, [confirming, newPin, pin]);

  if (lockState.status !== 'locked') return null;

  const ringStyle = (a: Animated.Value) => ({
    position: 'absolute' as const,
    width:  a.interpolate({ inputRange: [0, 1], outputRange: [80, 280] }),
    height: a.interpolate({ inputRange: [0, 1], outputRange: [80, 280] }),
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: C.cyan,
    opacity: a.interpolate({ inputRange: [0, 0.3, 0.9, 1], outputRange: [0.8, 0.4, 0.05, 0] }),
    left: a.interpolate({ inputRange: [0, 1], outputRange: [SW / 2 - 40, SW / 2 - 140] }),
    top: a.interpolate({ inputRange: [0, 1], outputRange: [SH * 0.25 - 40, SH * 0.25 - 140] }),
  });

  const panelTranslate = slideA.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={s.container}>
        {/* Scan line */}
        <Animated.View pointerEvents="none" style={[s.scan, { top: scanA }]} />

        {/* Grid background */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={[s.gridLine, { top: (i / 12) * SH }]} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[s.gridCol, { left: (i / 8) * SW }]} />
          ))}
        </View>

        {/* Expanding rings */}
        <Animated.View pointerEvents="none" style={ringStyle(ring1A)} />
        <Animated.View pointerEvents="none" style={ringStyle(ring2A)} />

        {/* Shield hero */}
        <View style={s.hero}>
          <Animated.View style={[s.shieldWrap, { opacity: shieldA }]}>
            <MaterialCommunityIcons name="shield-lock" size={72} color={C.cyan} />
          </Animated.View>
          <View style={s.appName}>
            <Text style={s.appTitle}>BUTLER<Text style={{ color: C.cyan }}>·AI</Text></Text>
            <Text style={s.appSub}>Session locked · {lockState.biometricType !== 'NONE' ? lockState.biometricType.replace('_', ' ') : 'PIN required'}</Text>
          </View>
        </View>

        {/* Bottom panel */}
        <Animated.View style={[s.panel, { paddingBottom: insets.bottom + 20, transform: [{ translateY: panelTranslate }] }]}>
          {/* Color stripe */}
          <View style={{ height: 3, flexDirection: 'row' }}>
            {[C.cyan, C.green, C.purple, C.amber, C.cyan].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>

          {view === 'lock' && (
            <View style={s.lockView}>
              <Text style={s.lockTitle}>LOCKED</Text>
              <Text style={s.lockSub}>
                {lockState.failedAttempts > 0 ? `${lockState.failedAttempts} failed attempt(s)` : 'Verify your identity to continue'}
              </Text>

              {/* Biometric button */}
              {lockState.isAvailable && (
                <Pressable onPress={handleBiometric} disabled={busy}
                  style={({ pressed }) => [s.bioBtn, pressed && { opacity: 0.7 }]}>
                  <MaterialCommunityIcons
                    name={lockState.biometricType === 'FACE_ID' ? 'face-recognition' : 'fingerprint'}
                    size={28} color="#000"
                  />
                  <Text style={s.bioBtnTxt}>
                    {busy ? 'VERIFYING...' : `UNLOCK WITH ${lockState.biometricType.replace('_', ' ')}`}
                  </Text>
                </Pressable>
              )}

              {/* PIN fallback */}
              {lockState.pinSet && (
                <TouchableOpacity onPress={() => { setView('pin'); setPinError(''); setPin(''); }}
                  style={s.pinLink}>
                  <MaterialIcons name="lock-open" size={13} color={C.mid} />
                  <Text style={s.pinLinkTxt}>Use PIN instead</Text>
                </TouchableOpacity>
              )}

              {/* Settings cog */}
              <TouchableOpacity onPress={() => setView('settings')} style={s.settingsBtn}>
                <MaterialIcons name="settings" size={16} color={C.dim} />
              </TouchableOpacity>
            </View>
          )}

          {view === 'pin' && (
            <Animated.View style={[s.pinView, { transform: [{ translateX: shakeA }] }]}>
              <Text style={s.lockTitle}>ENTER PIN</Text>
              <TextInput
                style={s.pinInput}
                value={pin}
                onChangeText={v => { setPin(v.replace(/\D/g, '').slice(0, 8)); setPinError(''); }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                placeholder="••••"
                placeholderTextColor={C.dim}
                autoFocus
                onSubmitEditing={handlePIN}
              />
              {pinError ? <Text style={s.pinError}>{pinError}</Text> : null}
              <Pressable onPress={handlePIN} disabled={busy || pin.length < 4}
                style={({ pressed }) => [s.bioBtn, { backgroundColor: C.green, opacity: (pressed || busy || pin.length < 4) ? 0.6 : 1 }]}>
                <MaterialIcons name="check-circle" size={20} color="#000" />
                <Text style={s.bioBtnTxt}>{busy ? 'CHECKING...' : 'UNLOCK'}</Text>
              </Pressable>
              <TouchableOpacity onPress={() => { setView('lock'); setPin(''); setPinError(''); }} style={s.pinLink}>
                <Text style={s.pinLinkTxt}>← Back</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {view === 'settings' && (
            <View style={s.settingsView}>
              <Text style={s.lockTitle}>LOCK SETTINGS</Text>

              {/* Enable/disable toggle row */}
              <TouchableOpacity onPress={() => biometricLock.setEnabled(!lockState.isEnabled)}
                style={s.settingsRow}>
                <MaterialIcons name={lockState.isEnabled ? 'toggle-on' : 'toggle-off'} size={26} color={lockState.isEnabled ? C.green : C.dim} />
                <Text style={[s.settingsRowTxt, { color: lockState.isEnabled ? C.text : C.mid }]}>
                  {lockState.isEnabled ? 'Lock ENABLED' : 'Lock DISABLED'}
                </Text>
              </TouchableOpacity>

              {/* Timeout options */}
              <Text style={s.settingsLabel}>AUTO-LOCK AFTER</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {[30, 60, 120, 300].map(sec => (
                  <TouchableOpacity key={sec} onPress={() => biometricLock.setTimeout(sec)}
                    style={[s.timeoutChip, lockState.timeoutSec === sec && { borderColor: C.cyan, backgroundColor: C.cyan + '18' }]}>
                    <Text style={[s.timeoutTxt, lockState.timeoutSec === sec && { color: C.cyan }]}>
                      {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Set PIN */}
              <Text style={s.settingsLabel}>SET FALLBACK PIN</Text>
              <TextInput
                style={s.pinInput}
                value={confirming ? pin : newPin}
                onChangeText={v => {
                  const clean = v.replace(/\D/g, '').slice(0, 8);
                  confirming ? setPin(clean) : setNewPin(clean);
                  setPinError('');
                }}
                keyboardType="number-pad"
                secureTextEntry
                placeholder={confirming ? 'Confirm PIN' : 'New PIN (4–8 digits)'}
                placeholderTextColor={C.dim}
              />
              {pinError ? <Text style={[s.pinError, pinError.includes('saved') && { color: C.green }]}>{pinError}</Text> : null}
              <Pressable onPress={handleSaveNewPIN} style={({ pressed }) => [s.bioBtn, { backgroundColor: C.purple, opacity: pressed ? 0.7 : 1 }]}>
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={[s.bioBtnTxt, { color: '#fff' }]}>{confirming ? 'CONFIRM PIN' : 'SAVE PIN'}</Text>
              </Pressable>

              <TouchableOpacity onPress={() => { setView('lock'); setNewPin(''); setPin(''); setPinError(''); setConfirming(false); }} style={s.pinLink}>
                <Text style={s.pinLinkTxt}>← Back to lock</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#010508',
    alignItems: 'center', justifyContent: 'space-between',
  },
  scan: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: C.cyan + '35', zIndex: 1,
  },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: C.cyan + '06' },
  gridCol:  { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: C.cyan + '06' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  shieldWrap: { alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 30 }, android: {} }) },
  appName:    { alignItems: 'center' },
  appTitle:   { fontFamily: MONO, fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  appSub:     { fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 4, letterSpacing: 1 },
  panel: {
    width: '100%', backgroundColor: C.surf,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 20 } }),
  },
  lockView:  { paddingHorizontal: 24, paddingTop: 24, gap: 14, alignItems: 'center' },
  pinView:   { paddingHorizontal: 24, paddingTop: 24, gap: 14, alignItems: 'center' },
  settingsView: { paddingHorizontal: 24, paddingTop: 24, gap: 10 },
  lockTitle: { fontFamily: MONO, fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  lockSub:   { fontFamily: MONO, fontSize: 10, color: C.mid, textAlign: 'center', letterSpacing: 0.5 },
  bioBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: '100%' },
  bioBtnTxt: { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  pinLink:   { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8 },
  pinLinkTxt:{ fontFamily: MONO, fontSize: 10, color: C.mid },
  pinInput:  { width: '100%', backgroundColor: '#03090F', borderWidth: 1.5, borderColor: C.dim,
    borderRadius: 12, padding: 14, fontFamily: MONO, fontSize: 20, color: C.text, textAlign: 'center', letterSpacing: 6 },
  pinError:  { fontFamily: MONO, fontSize: 10, color: C.red, textAlign: 'center' },
  settingsBtn: { padding: 8, marginTop: -6 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  settingsRowTxt:{ fontFamily: MONO, fontSize: 13, fontWeight: '700' },
  settingsLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.mid, letterSpacing: 1.5, marginTop: 6 },
  timeoutChip: { borderWidth: 1.5, borderRadius: 8, borderColor: C.dim, paddingHorizontal: 14, paddingVertical: 7 },
  timeoutTxt:  { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: C.mid },
});

export default BiometricLockOverlay;
