/**
 * Remote Access Home Banner
 * Compact "away from home" widget for nexushome.tsx.
 * Shows remote mode status, Tailscale/Cloudflare setup hints,
 * and a one-tap "Test Remote" button.
 *
 * FIX: borderColor on Animated.View crashes Hermes — replaced with
 *      a static border + Animated opacity glow overlay instead.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';
import { router } from 'expo-router';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const C = {
  bg:      '#06080F',
  surface: '#0C1220',
  cyan:    '#00E5FF',
  amber:   '#FFB020',
  good:    '#00FF88',
  purple:  '#CC44FF',
  danger:  '#FF3131',
  text:    '#C8E4F0',
  textMid: '#6A8EA8',
  textDim: '#304558',
};

export function RemoteAccessHomeBanner() {
  const [isRemote,    setIsRemote]    = useState(false);
  const [remoteUrl,   setRemoteUrl]   = useState('');
  const [testing,     setTesting]     = useState(false);
  const [testResult,  setTestResult]  = useState<'ok'|'fail'|null>(null);
  const glowAnim  = useRef(new Animated.Value(0.4)).current;
  const scanAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    (async () => {
      try {
        await serverConnection.load?.();
        const url = serverConnection.getRemoteUrl?.() ?? '';
        setIsRemote(!!url);
        setRemoteUrl(url);
      } catch {}
    })();

    const g = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim,  { toValue: 1,   duration: 1600, useNativeDriver: true }),
      Animated.timing(glowAnim,  { toValue: 0.3, duration: 1600, useNativeDriver: true }),
    ]));
    const sc = Animated.loop(Animated.sequence([
      Animated.timing(scanAnim,  { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(scanAnim,  { toValue: 0, duration: 0,    useNativeDriver: true }),
      Animated.delay(500),
    ]));
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    g.start(); sc.start(); p.start();
    return () => { g.stop(); sc.stop(); p.stop(); };
  }, []);

  const testRemote = async () => {
    if (testing) return;
    const url = serverConnection.getRemoteUrl?.() ?? '';
    if (!url) { haptics.light(); return; }
    haptics.medium();
    setTesting(true);
    setTestResult(null);
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${url}/api/status`, { signal: ctrl.signal });
      setTestResult(res.ok ? 'ok' : 'fail');
      haptics[res.ok ? 'success' : 'warning']();
    } catch {
      setTestResult('fail');
      haptics.warning();
    } finally {
      setTesting(false);
    }
  };

  const accentColor = isRemote ? C.amber : C.cyan;

  // Safe scan-line translation — useNativeDriver:true for transform
  const scanX = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 300] });

  // Extract hostname for display — regex only (URL API unavailable on Hermes)
  let displayUrl = '';
  if (remoteUrl) {
    try {
      const m = remoteUrl.match(/^https?:\/\/([^/]+)/);
      displayUrl = m ? m[1].slice(0, 36) : remoteUrl.slice(0, 36);
    } catch { displayUrl = remoteUrl.slice(0, 36); }
  }

  return (
    <View>
      {/* Section label */}
      <View style={st.sectionRow}>
        <View style={[st.sectionDot, { backgroundColor: accentColor }]} />
        <MaterialIcons name="wifi-tethering" size={11} color={accentColor} />
        <Text style={[st.sectionLabel, { color: accentColor }]}>REMOTE ACCESS</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: accentColor + '25', marginLeft: 6 }} />
        <TouchableOpacity
          onPress={() => { haptics.light(); router.navigate('/(tabs)/settings' as any); }}
          style={[st.settingsBtn, { borderColor: accentColor + '40', backgroundColor: accentColor + '0C' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[st.settingsBtnTxt, { color: accentColor }]}>SETUP</Text>
          <MaterialIcons name="open-in-new" size={9} color={accentColor} />
        </TouchableOpacity>
      </View>

      {/* Main card — static border (no animated borderColor to avoid Hermes crash) */}
      <View style={[st.card, { borderColor: accentColor + '55' }]}>
        {/* Animated glow border overlay — opacity only (useNativeDriver:true safe) */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, {
            borderRadius: 16,
            borderWidth: 2,
            borderColor: accentColor,
            opacity: glowAnim,
          }]}
        />

        {/* Scan line */}
        <Animated.View
          pointerEvents="none"
          style={[st.scanLine, { transform: [{ translateX: scanX }], backgroundColor: accentColor }]}
        />

        {/* HUD corners */}
        <View style={[st.cTL, { borderColor: accentColor + '70' }]} />
        <View style={[st.cBR, { borderColor: accentColor + '40' }]} />

        {/* Top accent line */}
        <View style={[st.topLine, { backgroundColor: accentColor }]} />

        {/* Main content row */}
        <View style={st.contentRow}>
          {/* Left: icon */}
          <View style={[st.modeIconWrap, {
            borderColor: accentColor + '60',
            backgroundColor: accentColor + '14',
            ...Platform.select({ ios: { shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 }, android: {} }),
          }]}>
            <MaterialIcons
              name={isRemote ? 'public' : 'home'}
              size={22}
              color={accentColor}
            />
          </View>

          {/* Center: status */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Animated.View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: accentColor,
                opacity: pulseAnim,
              }} />
              <Text style={[st.modeTitle, { color: accentColor }]}>
                {isRemote ? 'REMOTE MODE' : 'LAN ONLY'}
              </Text>
              {isRemote && testResult === 'ok' ? (
                <View style={[st.pill, { borderColor: C.good + '55', backgroundColor: C.good + '0E' }]}>
                  <Text style={[st.pillTxt, { color: C.good }]}>✓ LIVE</Text>
                </View>
              ) : isRemote && testResult === 'fail' ? (
                <View style={[st.pill, { borderColor: C.danger + '55', backgroundColor: C.danger + '0E' }]}>
                  <Text style={[st.pillTxt, { color: C.danger }]}>TIMEOUT</Text>
                </View>
              ) : null}
            </View>
            <Text style={st.modeSub} numberOfLines={1}>
              {isRemote
                ? displayUrl || 'Remote URL configured'
                : 'Same Wi-Fi required · tap SETUP to enable remote'}
            </Text>
          </View>

          {/* Right: action button */}
          {isRemote ? (
            <TouchableOpacity
              onPress={testRemote}
              disabled={testing}
              style={[st.testBtn, {
                borderColor: (testResult === 'ok' ? C.good : testResult === 'fail' ? C.danger : accentColor) + '70',
                backgroundColor: (testResult === 'ok' ? C.good : testResult === 'fail' ? C.danger : accentColor) + '12',
                opacity: testing ? 0.6 : 1,
              }]}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={testing ? 'hourglass-empty' : testResult === 'ok' ? 'check-circle' : testResult === 'fail' ? 'error' : 'speed'}
                size={14}
                color={testResult === 'ok' ? C.good : testResult === 'fail' ? C.danger : accentColor}
              />
              <Text style={[st.testBtnTxt, { color: testResult === 'ok' ? C.good : testResult === 'fail' ? C.danger : accentColor }]}>
                {testing ? 'PINGING' : 'TEST'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => { haptics.medium(); router.navigate('/(tabs)/settings' as any); }}
              style={[st.enableBtn, { backgroundColor: accentColor }]}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={14} color="#000" />
              <Text style={st.enableBtnTxt}>ENABLE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feature pills row */}
        <View style={st.featureRow}>
          {([
            { icon: 'wifi',       label: 'Tailscale',  col: C.cyan,   active: isRemote },
            { icon: 'cloud',      label: 'Cloudflare', col: C.amber,  active: isRemote },
            { icon: 'vpn-key',    label: 'HMAC Auth',  col: C.purple, active: true     },
            { icon: 'smartphone', label: '4G/5G',      col: C.good,   active: isRemote },
          ] as { icon: string; label: string; col: string; active: boolean }[]).map(({ icon, label, col, active }, i) => (
            <View
              key={i}
              style={[st.featurePill, {
                borderColor:     active ? col + '55' : col + '18',
                backgroundColor: active ? col + '0E' : 'transparent',
                opacity: active ? 1 : 0.4,
              }]}
            >
              <MaterialIcons name={icon as any} size={9} color={col} />
              <Text style={[st.featurePillTxt, { color: col }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Bottom hint */}
        <View style={[st.hint, { borderTopColor: accentColor + '18' }]}>
          <MaterialIcons name="info-outline" size={10} color={C.textDim} />
          <Text style={st.hintTxt}>
            {isRemote
              ? 'All cockpit features work remotely — clipboard, scripts, power, processes'
              : 'Install Tailscale on PC + phone → enter 100.x.x.x IP in Settings'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  sectionRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionDot:    { width: 6, height: 6, borderRadius: 3 },
  sectionLabel:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  settingsBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  settingsBtnTxt:{ fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },

  card: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#060D18',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 18 },
      android: { elevation: 10 },
    }),
  },
  topLine:  { height: 3 },
  scanLine: { position: 'absolute', top: 0, bottom: 0, width: 60, opacity: 0.06, transform: [{ skewX: '-14deg' }] },
  cTL:      { position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2 },
  cBR:      { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottomWidth: 2, borderRightWidth: 2 },

  contentRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  modeIconWrap: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modeTitle:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  modeSub:      { fontFamily: MONO, fontSize: 9, color: C.textMid, letterSpacing: 0.3, marginTop: 1 },

  pill:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  pillTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },

  testBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, flexShrink: 0 },
  testBtnTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  enableBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexShrink: 0 },
  enableBtnTxt:{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.5 },

  featureRow:    { flexDirection: 'row', gap: 5, paddingHorizontal: 14, paddingBottom: 10, flexWrap: 'wrap' },
  featurePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  featurePillTxt:{ fontFamily: MONO, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },

  hint:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 10, borderTopWidth: 1, paddingTop: 8 },
  hintTxt: { fontFamily: MONO, fontSize: 8.5, color: C.textDim, flex: 1, lineHeight: 13 },
});
