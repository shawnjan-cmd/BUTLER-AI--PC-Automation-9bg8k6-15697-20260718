/**
 * BUTLER AI — DOWNLOAD CENTER v3.0 · SETUP HQ + Q&A + OPEN SOURCE PROOF
 * ─────────────────────────────────────────────────────────────────────
 * Combined from onboarding download step + original downloads tab.
 * Includes:
 *  • Full server + Ollama + Python downloads with copy chips
 *  • In-app FAQ / Q&A section (no need to revisit onboarding)
 *  • Open source transparency proof panel
 *  • Security audit summary
 *  • Play Store badge + share
 *  • 3-step visual quick-start
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Pressable, Animated, Platform, Dimensions, Linking,
  LayoutAnimation, UIManager, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { haptics } from '@/services/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD = 16;

const C = {
  bg:     '#020509',
  surf:   '#07101A',
  surf2:  '#0C1828',
  surf3:  '#040810',
  cyan:   '#00E0FF',
  green:  '#00FF88',
  amber:  '#FFB020',
  purple: '#CC55FF',
  blue:   '#4A9EFF',
  teal:   '#00CCAA',
  red:    '#FF3A5A',
  text:   '#D0E8F8',
  mid:    '#507090',
  dim:    '#1A2E42',
  border: 'rgba(0,224,255,0.12)',
};

// ═══════════════════════════════════════════════════════════════
// MICRO ATOMS
// ═══════════════════════════════════════════════════════════════

function PulseDot({ color, size = 6, delay = 0 }: { color: string; size?: number; delay?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1,   duration: 850, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 850, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HudCorners({ color, size = 10, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const b: any = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[b, { top: 0, left: 0,     borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { top: 0, right: 0,    borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[b, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t,  borderColor: color }]} />
    </>
  );
}

function CopyChip({ label, value, color }: { label: string; value: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const scaleA = useRef(new Animated.Value(1)).current;
  const copy = async () => {
    haptics.success();
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 0.93, duration: 60,  useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1,    tension: 300,  friction: 10, useNativeDriver: true }),
    ]).start();
    try {
      const Cl = await import('expo-clipboard');
      await Cl.setStringAsync(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleA }] }}>
      <TouchableOpacity onPress={copy} activeOpacity={0.8}
        style={[cc.chip, { borderColor: copied ? C.green + '90' : color + '50', backgroundColor: copied ? C.green + '12' : color + '0C' }]}>
        <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={11} color={copied ? C.green : color} />
        <Text style={[cc.label, { color: copied ? C.green : color }]} numberOfLines={1}>{copied ? 'COPIED!' : label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const cc = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  label: { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.3, maxWidth: SW * 0.55 },
});

function DownloadBtn({ label, sub, icon, color, url, badge, primary }: {
  label: string; sub?: string; icon: string; color: string; url: string; badge?: string; primary?: boolean;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const tap = () => {
    haptics.heavy();
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 0.96, duration: 70,  useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1,    tension: 280,  friction: 10, useNativeDriver: true }),
    ]).start();
    Linking.openURL(url).catch(() => {});
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleA }] }}>
      <TouchableOpacity onPress={tap} activeOpacity={0.88}
        style={[
          db.btn,
          primary
            ? { backgroundColor: color, borderColor: color }
            : { borderColor: color + '55', backgroundColor: color + '0E' },
        ]}>
        <View style={[db.iconBox, {
          borderColor: primary ? 'rgba(0,0,0,0.2)' : color + '65',
          backgroundColor: primary ? 'rgba(0,0,0,0.15)' : color + '18',
        }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={primary ? '#000' : color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[db.label, { color: primary ? '#000' : color }]}>{label}</Text>
          {sub ? <Text style={[db.sub, { color: primary ? 'rgba(0,0,0,0.55)' : C.mid }]}>{sub}</Text> : null}
        </View>
        {badge ? (
          <View style={[db.badge, {
            borderColor: primary ? 'rgba(0,0,0,0.25)' : color + '50',
            backgroundColor: primary ? 'rgba(0,0,0,0.12)' : color + '0A',
          }]}>
            <Text style={[db.badgeTxt, { color: primary ? '#000' : color }]}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name="open-in-new" size={15} color={primary ? 'rgba(0,0,0,0.4)' : color + '80'} />
      </TouchableOpacity>
    </Animated.View>
  );
}
const db = StyleSheet.create({
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 8 },
  iconBox:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  sub:      { fontFamily: MONO, fontSize: 10, marginTop: 2, lineHeight: 15 },
  badge:    { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900' },
});

function Sec({ icon, label, color, sub }: { icon: string; label: string; color: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 10, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 3.5, height: 16, borderRadius: 2, backgroundColor: color }} />
        <MaterialCommunityIcons name={icon as any} size={12} color={color} />
        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: color + 'DD', letterSpacing: 2, flex: 1 }}>{label}</Text>
      </View>
      {sub ? <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginLeft: 27, marginTop: 4, lineHeight: 16 }}>{sub}</Text> : null}
    </View>
  );
}

function CodeBlock({ lines }: { lines: Array<{ text: string; color?: string }> }) {
  return (
    <View style={cbl.root}>
      <View style={cbl.chrome}>
        {['#FF5F57','#FEBC2E','#28C840'].map((col, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
        ))}
        <Text style={cbl.chromeLabel}>TERMINAL</Text>
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        {lines.map((l, i) => (
          <Text key={i} style={[cbl.line, { color: l.color ?? C.green }]} selectable>{l.text}</Text>
        ))}
      </View>
    </View>
  );
}
const cbl = StyleSheet.create({
  root:        { backgroundColor: '#010608', borderRadius: 12, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden', marginBottom: 8 },
  chrome:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#010408', borderBottomWidth: 1, borderBottomColor: C.border },
  chromeLabel: { fontFamily: MONO, fontSize: 8, color: C.mid + '80', flex: 1, textAlign: 'center', letterSpacing: 1 },
  line:        { fontFamily: MONO, fontSize: 12, lineHeight: 18 },
});

// ═══════════════════════════════════════════════════════════════
// PAGE HEADER
// ═══════════════════════════════════════════════════════════════
function DlHeader({ safeTop }: { safeTop: number }) {
  const shimA = useRef(new Animated.Value(-SW)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.6, duration: 2800, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW,       duration: 0,    useNativeDriver: true }),
      Animated.delay(7000),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[dlh.root, { paddingTop: safeTop }]}>
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[4,1,6,1,3,1,8,1,2].map((f,i) => (
          <View key={i} style={{ flex: f, backgroundColor: [C.blue,C.blue+'20',C.cyan,C.cyan+'10',C.blue+'60',C.cyan+'08',C.green+'30',C.blue+'08',C.blue+'25'][i] }} />
        ))}
      </View>
      <Animated.View pointerEvents="none" style={[dlh.shim, { transform: [{ translateX: shimA }] }]} />
      <View style={dlh.body}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={dlh.eye}>SETUP HQ · DOWNLOADS · Q&A · OPEN SOURCE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={[dlh.iconBox, { borderColor: C.blue + '55', backgroundColor: C.blue + '10' }]}>
              <MaterialCommunityIcons name="download-circle" size={20} color={C.blue} />
            </View>
            <Text style={dlh.title}>GET <Text style={{ color: C.blue }}>BUTLER</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            <View style={[dlh.pill, { borderColor: C.green + '60', backgroundColor: C.green + '0C' }]}>
              <PulseDot color={C.green} size={5} />
              <Text style={[dlh.pillTxt, { color: C.green }]}>OFFICIAL SOURCES</Text>
            </View>
            <View style={[dlh.pill, { borderColor: C.blue + '45', backgroundColor: C.blue + '08' }]}>
              <Text style={[dlh.pillTxt, { color: C.blue }]}>FREE · OPEN SOURCE</Text>
            </View>
            <View style={[dlh.pill, { borderColor: C.cyan + '45', backgroundColor: C.cyan + '06' }]}>
              <Text style={[dlh.pillTxt, { color: C.cyan }]}>Q&A INSIDE</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <MaterialCommunityIcons name="shield-check" size={32} color={C.blue + '60'} />
          <Text style={dlh.sub}>v21.2.0</Text>
          <Text style={dlh.sub2}>ZERO CLOUD</Text>
        </View>
      </View>
      <View style={{ height: 2, flexDirection: 'row' }}>
        <View style={{ flex: 3, backgroundColor: C.blue + '30' }} />
        <View style={{ width: 18, backgroundColor: C.blue }} />
        <View style={{ flex: 2, backgroundColor: C.cyan + '18' }} />
        <View style={{ width: 10, backgroundColor: C.cyan }} />
        <View style={{ flex: 5, backgroundColor: C.green + '10' }} />
      </View>
    </View>
  );
}
const dlh = StyleSheet.create({
  root:    { backgroundColor: C.surf, overflow: 'hidden' },
  shim:    { position: 'absolute', top: 0, bottom: 0, width: 90, backgroundColor: 'rgba(74,158,255,0.05)', zIndex: 0 },
  body:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13, zIndex: 1 },
  eye:     { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: C.blue + '60', letterSpacing: 1.5 },
  iconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.4 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 10, color: C.blue, fontWeight: '900' },
  sub2:    { fontFamily: MONO, fontSize: 8, color: C.mid, letterSpacing: 1 },
});

// ═══════════════════════════════════════════════════════════════
// TRUST STRIP
// ═══════════════════════════════════════════════════════════════
const TRUST_ITEMS = [
  { icon: 'github',              color: C.cyan,   label: 'OPEN SOURCE' },
  { icon: 'lock-outline',        color: C.green,  label: 'AES-256-GCM' },
  { icon: 'wifi-off',            color: C.amber,  label: 'LAN ONLY' },
  { icon: 'cloud-off-outline',   color: C.blue,   label: 'ZERO CLOUD' },
  { icon: 'shield-check',        color: C.teal,   label: 'HMAC-SHA256' },
  { icon: 'eye-off-outline',     color: C.purple, label: 'NO TELEMETRY' },
  { icon: 'google-play',         color: C.green,  label: 'PLAY STORE' },
];
function TrustStrip() {
  return (
    <View style={[card.root, { borderColor: C.green + '28' }]}>
      <View style={{ height: 2.5, backgroundColor: C.green + '80' }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingVertical: 12, gap: 14, alignItems: 'center' }}>
        {TRUST_ITEMS.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {i > 0 && <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.dim }} />}
            <MaterialCommunityIcons name={t.icon as any} size={13} color={t.color} />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: t.color + 'CC', letterSpacing: 0.8 }}>{t.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3-STEP VISUAL QUICK START
// ═══════════════════════════════════════════════════════════════
const STEPS = [
  {
    num: '01', color: C.cyan, icon: 'download-circle',
    title: 'Download & Run Server',
    body: 'Save butler_server.py from GitHub. Run it with Python in any terminal. It auto-installs deps and prints a QR code.',
    cmd: 'python butler_server.py',
  },
  {
    num: '02', color: C.green, icon: 'qrcode-scan',
    title: 'Scan QR to Pair',
    body: 'Tap the QR icon on the home screen of this app. Point your camera at the QR shown in the terminal window.',
    cmd: null,
  },
  {
    num: '03', color: C.purple, icon: 'robot-happy',
    title: 'Start Automating',
    body: 'Everything is live. Run scripts, chat with local AI, transfer files — all 100% on your own network.',
    cmd: null,
  },
];

function QuickStartSteps() {
  return (
    <View style={[card.root, { borderColor: C.cyan + '28' }]}>
      <View style={{ height: 3, backgroundColor: C.cyan }} />
      <View style={{ padding: 14 }}>
        <HudCorners color={C.cyan + '30'} size={8} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <MaterialCommunityIcons name="lightning-bolt" size={12} color={C.cyan} />
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.cyan + 'CC', letterSpacing: 2 }}>3-STEP QUICK START</Text>
        </View>
        {STEPS.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: i < 2 ? 16 : 0 }}>
            {/* Step number bubble */}
            <View style={[qs.numBubble, { backgroundColor: s.color + '18', borderColor: s.color + '55' }]}>
              <Text style={[qs.num, { color: s.color }]}>{s.num}</Text>
            </View>
            {/* Connector line */}
            {i < 2 && (
              <View style={[qs.connector, { backgroundColor: s.color + '30', left: 20 }]} />
            )}
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name={s.icon as any} size={14} color={s.color} />
                <Text style={[qs.title, { color: s.color }]}>{s.title}</Text>
              </View>
              <Text style={qs.body}>{s.body}</Text>
              {s.cmd ? (
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  <CopyChip label={s.cmd} value={s.cmd} color={s.color} />
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const qs = StyleSheet.create({
  numBubble: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  num:       { fontFamily: MONO, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  connector: { position: 'absolute', width: 1.5, top: 40, height: 28, left: 19, zIndex: 0 },
  title:     { fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
  body:      { fontFamily: MONO, fontSize: 10.5, color: C.mid, lineHeight: 17 },
});

// ═══════════════════════════════════════════════════════════════
// OPEN SOURCE TRANSPARENCY PANEL
// ═══════════════════════════════════════════════════════════════
function OpenSourcePanel() {
  const glowA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1600, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1600, useNativeDriver: false }),
    ]));
    l.start();
    return () => l.stop();
  }, []);

  const borderC = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [C.cyan + '30', C.cyan + '80'] });

  const PROOFS = [
    { icon: 'github',              color: C.cyan,   title: 'Fully Open Source Code',        body: 'Every line of butler_server.py is publicly visible on GitHub. No compiled binaries, no hidden scripts — you can audit exactly what runs on your PC.' },
    { icon: 'google-play',         color: C.green,  title: 'Verified on Google Play Store',  body: 'Butler AI passed Google Play\'s automated and manual security review. The Play Store badge means Google has independently verified this app meets strict security policies.' },
    { icon: 'eye-outline',         color: C.purple, title: 'Nothing Hidden',                 body: 'No analytics SDK, no Firebase, no Crashlytics, no third-party tracking. This is unusual for a small developer — but it\'s how we prove we are not hiding anything.' },
    { icon: 'shield-lock-outline', color: C.teal,   title: 'You Control the Server',         body: 'You download and run butler_server.py on your OWN computer. The app cannot do anything without your explicit permission on your own machine.' },
    { icon: 'wifi-off',            color: C.amber,  title: 'Zero Cloud Relay',               body: 'The free tier never sends a single packet to any server we control. Your phone talks directly to your PC over your home Wi-Fi. We literally cannot see your data.' },
  ];

  return (
    <Animated.View style={[card.root, { borderColor: borderC }]}>
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[C.cyan, C.green, C.purple, C.teal, C.amber].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={{ padding: 14 }}>
        <HudCorners color={C.cyan + '30'} size={8} />

        {/* Header with dual badges */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <View style={[osp.iconOrb, { borderColor: C.cyan + '55', backgroundColor: C.cyan + '12' }]}>
            <MaterialCommunityIcons name="github" size={24} color={C.cyan} />
            <PulseDot color={C.green} size={6} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.text, letterSpacing: 0.3 }}>
              WHY YOU CAN TRUST THIS APP
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 4, lineHeight: 15 }}>
              We are not a large corporation. We cannot prove safety with a press release. Instead we prove it by showing you everything.
            </Text>
          </View>
        </View>

        {/* Play Store + GitHub visual badge row */}
        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://github.com/shawnjan-cmd/butler-server').catch(() => {})}
            activeOpacity={0.85}
            style={[osp.badge, { borderColor: C.cyan + '50', backgroundColor: C.cyan + '08', flex: 1 }]}>
            <MaterialCommunityIcons name="github" size={20} color={C.cyan} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.cyan }}>GITHUB</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid }}>Read every line of code</Text>
            </View>
            <MaterialIcons name="open-in-new" size={13} color={C.cyan + '60'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.butlerai.pc.automation').catch(() => {})}
            activeOpacity={0.85}
            style={[osp.badge, { borderColor: C.green + '50', backgroundColor: C.green + '08', flex: 1 }]}>
            <MaterialCommunityIcons name="google-play" size={20} color={C.green} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.green }}>PLAY STORE</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid }}>Verified by Google</Text>
            </View>
            <MaterialIcons name="open-in-new" size={13} color={C.green + '60'} />
          </TouchableOpacity>
        </View>

        {/* Proof items */}
        {PROOFS.map((p, i) => (
          <View key={i} style={[osp.proofRow, i < PROOFS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
            <View style={[osp.proofIcon, { borderColor: p.color + '45', backgroundColor: p.color + '0E' }]}>
              <MaterialCommunityIcons name={p.icon as any} size={14} color={p.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[osp.proofTitle, { color: p.color + 'DD' }]}>{p.title}</Text>
              <Text style={osp.proofBody}>{p.body}</Text>
            </View>
          </View>
        ))}

        {/* Statement */}
        <View style={[osp.statement, { borderColor: C.amber + '35', backgroundColor: C.amber + '05' }]}>
          <MaterialCommunityIcons name="format-quote-open" size={14} color={C.amber + '70'} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: C.amber + 'BB', lineHeight: 16, flex: 1, fontStyle: 'italic' }}>
            "I am a solo developer. My reputation is the only thing I have. Every line of server code is on GitHub — not because I have to put it there, but because I want you to see exactly what runs on your computer."
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: C.amber + '60', textAlign: 'right', marginTop: 4 }}>
            — Andrej Sladkovic, Developer
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
const osp = StyleSheet.create({
  iconOrb:    { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 4 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 },
  proofRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11 },
  proofIcon:  { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  proofTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.2, marginBottom: 3 },
  proofBody:  { fontFamily: MONO, fontSize: 10, color: C.mid, lineHeight: 15 },
  statement:  { borderWidth: 1.5, borderRadius: 12, padding: 12, marginTop: 12, gap: 4 },
});

// ═══════════════════════════════════════════════════════════════
// FAQ / Q&A SECTION — In-app help, no need to revisit onboarding
// ═══════════════════════════════════════════════════════════════
const FAQ_DATA = [
  {
    cat: 'GETTING STARTED', catColor: C.cyan,
    items: [
      {
        q: 'Do I need to know programming to use Butler AI?',
        a: 'No programming knowledge required. The app comes with 250+ ready-to-run scripts. You simply tap a script and it runs on your PC. The AI chat can also write custom scripts for you in plain English.',
      },
      {
        q: 'What do I need on my PC to get started?',
        a: 'Just Python 3.10+ (free, official python.org download). The butler_server.py script installs everything else automatically the first time you run it — including all dependencies.',
      },
      {
        q: 'How does pairing work? Is it complicated?',
        a: 'Run butler_server.py on your PC. A QR code appears in the terminal window. Open Butler AI on your phone, tap SCAN QR, point camera at the QR. Done — paired in under 10 seconds.',
      },
      {
        q: 'Does it work on Mac and Linux as well as Windows?',
        a: 'Yes. butler_server.py runs on Windows 10/11, macOS 12+, and any modern Linux distro with Python 3.10+. The app connects the same way on all platforms.',
      },
    ],
  },
  {
    cat: 'PRIVACY & SAFETY', catColor: C.green,
    items: [
      {
        q: 'I\'m worried about installing software. Is butler_server.py safe?',
        a: 'Every line of code is public on GitHub — link above. It is a pure Python script with no compiled binary, no installer, and no admin rights required (unless you want to use admin-level features). Read the code yourself before running it.',
      },
      {
        q: 'Does the app send any data to your servers?',
        a: 'On the free plan: zero bytes. Your phone communicates only with your PC on your local Wi-Fi. We operate zero infrastructure that handles your data. This is verifiable — your router logs will show no external connections.',
      },
      {
        q: 'Can other people on my Wi-Fi access my PC through Butler?',
        a: 'No. Butler uses HMAC-SHA256 signed tokens generated at pairing time. Without that specific token (stored only on your phone), no other device can send commands to your server — even on the same network.',
      },
      {
        q: 'What happens to my data if I uninstall the app?',
        a: 'Everything is deleted automatically — the app stores nothing in the cloud. Your PC\'s butler_server.py can also be deleted with no trace. Tap Settings → Delete My Data for an instant full wipe.',
      },
    ],
  },
  {
    cat: 'FEATURES & PLANS', catColor: C.amber,
    items: [
      {
        q: 'What is Ollama and do I need it?',
        a: 'Ollama is a free, open-source tool that runs AI language models (like Llama 3, Mistral, Qwen) entirely on your PC. Butler AI uses it for the AI chat feature. It\'s optional — the scripts and file transfer work fine without it.',
      },
      {
        q: 'Can I use Butler AI away from home on a different network?',
        a: 'The free plan requires your phone and PC on the same Wi-Fi. For away-from-home access (work, travel, mobile data), PRO unlocks Tailscale VPN support — a free-to-set-up private tunnel that works from anywhere on Earth.',
      },
      {
        q: 'What is included in the free plan forever?',
        a: 'Full PC control on home Wi-Fi, all 250+ automation scripts, local Ollama AI chat, file transfer phone→PC, clipboard sync, real-time CPU/RAM/disk monitoring — all free, forever. No trial, no expiry.',
      },
      {
        q: 'If I pay for PRO, what exactly does it unlock?',
        a: 'Remote access via Tailscale VPN and Cloudflare Tunnel (use Butler from anywhere), script execution history, advanced analytics, and priority support. PRO is $4.99/month, cancel any time from Play Store settings.',
      },
    ],
  },
  {
    cat: 'TROUBLESHOOTING', catColor: C.red,
    items: [
      {
        q: 'The QR scan fails or nothing happens when I scan.',
        a: 'Ensure your phone and PC are on the same Wi-Fi network (not mobile data). Check Windows Firewall — add Python or butler_server.py as an exception. The server prints its IP and port; you can also enter them manually in the PAIR tab.',
      },
      {
        q: 'I get "connection refused" or "cannot connect" errors.',
        a: 'Most common causes: (1) Windows Firewall blocking port 8766. Add a Windows Defender Firewall inbound rule for TCP 8766. (2) Running on a VPN — disable VPN first. (3) PC sleeping — make sure it is fully awake.',
      },
      {
        q: 'butler_server.py crashes on startup with a Python error.',
        a: 'Run "python --version" — you need 3.10 or higher. Then run "pip install -r requirements.txt" to install dependencies manually. If still failing, open a GitHub Issue with the full error message — link at top of this page.',
      },
      {
        q: 'The AI chat says "Ollama not found" or gives empty responses.',
        a: 'Download and install Ollama (link above), then pull a model: run "ollama pull llama3.2" in your terminal. Restart butler_server.py after pulling. The Butler Scripts tab works independently of Ollama.',
      },
    ],
  },
  {
    cat: 'OPEN SOURCE', catColor: C.purple,
    items: [
      {
        q: 'What does "open source" mean for an app like this?',
        a: 'It means the server-side code (butler_server.py) is publicly available on GitHub for anyone to read, inspect, and verify. Open source is how small developers prove they have nothing to hide — it is the technology world\'s gold standard for transparency.',
      },
      {
        q: 'Can I modify the server code for my own use?',
        a: 'Yes, for personal non-commercial use. The server code is available on GitHub. Building competing products or redistributing the app under a different name is not permitted under the license and trademark registration.',
      },
      {
        q: 'How is this different from remote desktop apps like TeamViewer?',
        a: 'TeamViewer routes all traffic through their servers (cloud relay). Butler AI free plan uses direct LAN only — your data never leaves your network. This gives you maximum privacy and zero latency, at the cost of needing to be on the same Wi-Fi.',
      },
    ],
  },
];

function FAQSection() {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(['GETTING STARTED']));
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => {
    haptics.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCats(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  };

  const toggleItem = (key: string) => {
    haptics.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItems(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  return (
    <View style={[card.root, { borderColor: C.cyan + '28' }]}>
      <View style={{ height: 3, backgroundColor: C.cyan }} />
      <View style={{ padding: 14 }}>
        <HudCorners color={C.cyan + '28'} size={8} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View style={[faq.iconBox, { borderColor: C.cyan + '55', backgroundColor: C.cyan + '0E' }]}>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: C.text }}>FREQUENTLY ASKED QUESTIONS</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 3 }}>
              Common questions — tap to expand. No need to re-read onboarding.
            </Text>
          </View>
          <View style={[faq.countBadge, { borderColor: C.cyan + '40', backgroundColor: C.cyan + '08' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.cyan }}>
              {FAQ_DATA.reduce((s, c) => s + c.items.length, 0)}
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 7, color: C.mid }}>Q&A</Text>
          </View>
        </View>

        {FAQ_DATA.map((cat, ci) => {
          const isCatOpen = openCats.has(cat.cat);
          return (
            <View key={cat.cat} style={[faq.catCard, { borderColor: cat.catColor + '30' }]}>
              {/* Category header — tap to expand/collapse */}
              <TouchableOpacity onPress={() => toggleCat(cat.cat)} activeOpacity={0.8} style={faq.catHeader}>
                <View style={[faq.catStripe, { backgroundColor: cat.catColor }]} />
                <MaterialCommunityIcons name="folder-outline" size={12} color={cat.catColor} />
                <Text style={[faq.catLabel, { color: cat.catColor }]}>{cat.cat}</Text>
                <View style={[faq.catCount, { borderColor: cat.catColor + '45', backgroundColor: cat.catColor + '0C' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: cat.catColor, fontWeight: '900' }}>{cat.items.length}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <MaterialIcons
                  name={isCatOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={18} color={cat.catColor + '80'} />
              </TouchableOpacity>

              {isCatOpen && (
                <View style={{ paddingBottom: 4 }}>
                  {cat.items.map((item, ii) => {
                    const key = `${cat.cat}-${ii}`;
                    const isOpen = openItems.has(key);
                    return (
                      <View key={key} style={[faq.qaRow, ii < cat.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                        <TouchableOpacity onPress={() => toggleItem(key)} activeOpacity={0.8} style={faq.qHeader}>
                          <View style={[faq.qDot, { backgroundColor: isOpen ? cat.catColor : C.dim }]} />
                          <Text style={[faq.qText, { color: isOpen ? C.text : C.text + 'CC' }]}>{item.q}</Text>
                          <MaterialIcons
                            name={isOpen ? 'remove' : 'add'}
                            size={16} color={cat.catColor + (isOpen ? 'CC' : '60')} />
                        </TouchableOpacity>
                        {isOpen && (
                          <View style={[faq.aBox, { borderLeftColor: cat.catColor + '60', backgroundColor: cat.catColor + '06' }]}>
                            <Text style={faq.aText}>{item.a}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
const faq = StyleSheet.create({
  iconBox:   { width: 44, height: 44, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  countBadge:{ borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5, alignItems: 'center', gap: 1 },
  catCard:   { borderRadius: 11, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: C.surf2 },
  catStripe: { width: 3, height: 14, borderRadius: 2, flexShrink: 0 },
  catLabel:  { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2 },
  catCount:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  qaRow:     { paddingHorizontal: 12 },
  qHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 12 },
  qDot:      { width: 6, height: 6, borderRadius: 3, flexShrink: 0, marginTop: 4 },
  qText:     { fontFamily: MONO, fontSize: 11.5, fontWeight: '700', lineHeight: 17, flex: 1 },
  aBox:      { borderLeftWidth: 3, borderRadius: 0, paddingLeft: 12, paddingRight: 4, paddingBottom: 12, marginLeft: 15 },
  aText:     { fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 18 },
});

// ═══════════════════════════════════════════════════════════════
// SECURITY AUDIT SUMMARY
// ═══════════════════════════════════════════════════════════════
function SecurityAudit() {
  return (
    <View style={[card.root, { borderColor: C.green + '28' }]}>
      <View style={{ height: 2.5, backgroundColor: C.green + '80' }} />
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color={C.green} />
          <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.green, letterSpacing: 1 }}>SECURITY AUDIT SUMMARY</Text>
        </View>
        {[
          { label: 'Telemetry outbound requests', val: '0',          ok: true  },
          { label: 'Cloud infrastructure used',   val: 'None',       ok: true  },
          { label: 'Encryption cipher',           val: 'AES-256-GCM',ok: true  },
          { label: 'Authentication method',        val: 'HMAC-SHA256',ok: true  },
          { label: 'Network scope (free plan)',    val: 'LAN only',   ok: true  },
          { label: 'Account / email required',    val: 'No',         ok: true  },
          { label: 'Persistent background service', val: 'No',       ok: true  },
          { label: 'Location access',             val: 'Never',      ok: true  },
          { label: 'Server source code visible',  val: 'GitHub ✓',   ok: true  },
        ].map((row, i, arr) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
            borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(0,255,136,0.07)' }}>
            <MaterialIcons name="check-circle" size={12} color={C.green} style={{ marginRight: 8, flexShrink: 0 }} />
            <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, flex: 1 }}>{row.label}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: C.green, fontWeight: '900' }}>{row.val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM REQUIREMENTS
// ═══════════════════════════════════════════════════════════════
function SystemRequirements() {
  const reqs = [
    { icon: 'language-python', color: C.amber,  label: 'Python 3.10 or higher',           sub: 'python.org — free download' },
    { icon: 'wifi',            color: C.cyan,   label: 'Local Wi-Fi network',              sub: 'Phone and PC on same network' },
    { icon: 'brain',           color: C.purple, label: 'Ollama (optional)',                sub: 'For local AI chat — ollama.com' },
    { icon: 'harddisk',        color: C.mid,    label: '~250MB disk space',               sub: 'For server + dependencies' },
    { icon: 'microsoft-windows', color: C.blue, label: 'Windows 10/11, macOS 12+, Linux', sub: 'Any Python-supported platform' },
  ];
  return (
    <View style={[card.root, { borderColor: C.amber + '28' }]}>
      <View style={{ height: 2.5, backgroundColor: C.amber + '70' }} />
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MaterialCommunityIcons name="list-status" size={13} color={C.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.amber + 'DD', letterSpacing: 1.5 }}>SYSTEM REQUIREMENTS</Text>
        </View>
        {reqs.map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8,
            borderBottomWidth: i < reqs.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
            <View style={[{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
              { borderColor: r.color + '45', backgroundColor: r.color + '0E' }]}>
              <MaterialCommunityIcons name={r.icon as any} size={16} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '700', color: C.text }}>{r.label}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 }}>{r.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
function DownloadCenterInner() {
  const insets = useSafeAreaInsets();

  const shareApp = useCallback(async () => {
    haptics.medium();
    try {
      await Share.share({
        title: 'Butler AI — PC Automation',
        message: 'Check out Butler AI — control your PC from your phone with local AI, 250+ automation scripts, and zero cloud. Free on Google Play:\nhttps://play.google.com/store/apps/details?id=com.butlerai.pc.automation',
      });
    } catch {}
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DlHeader safeTop={insets.top} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: insets.bottom + 170, gap: 16 }}
      >

        {/* ── TRUST BADGES ── */}
        <TrustStrip />

        {/* ── 3-STEP QUICK START ── */}
        <QuickStartSteps />

        {/* ══════════════════════════════════
            🖥 BUTLER SERVER
        ══════════════════════════════════ */}
        <View>
          <Sec icon="server" label="BUTLER SERVER" color={C.cyan}
            sub="Run butler_server.py on your PC. It prints a QR code — scan it in the app to pair instantly." />
          <View style={[card.root, { borderColor: C.cyan + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.cyan }} />
            <View style={{ padding: 14 }}>
              <HudCorners color={C.cyan + '35'} size={8} />

              {/* Primary download CTA */}
              <DownloadBtn
                label="DOWNLOAD BUTLER SERVER"
                sub="butler_server.py · latest release · GitHub official"
                icon="download-circle"
                color={C.cyan}
                url="https://github.com/shawnjan-cmd/butler-server/releases/latest"
                badge="LATEST"
                primary
              />
              <DownloadBtn
                label="SOURCE CODE (ZIP)"
                sub="Full repo archive — browse every line before running"
                icon="zip-box-outline"
                color={C.blue}
                url="https://github.com/shawnjan-cmd/butler-server/archive/refs/heads/main.zip"
              />
              <DownloadBtn
                label="BROWSE ON GITHUB"
                sub="View changelog, issues, README, open source code"
                icon="github"
                color={C.mid}
                url="https://github.com/shawnjan-cmd/butler-server"
              />

              <View style={{ height: 10 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 8, letterSpacing: 1 }}>QUICK START COMMANDS</Text>
              <CodeBlock lines={[
                { text: '# Windows — run in PowerShell or CMD', color: C.dim },
                { text: 'python butler_server.py', color: C.cyan },
                { text: '', color: C.dim },
                { text: '# Mac / Linux', color: C.dim },
                { text: 'python3 butler_server.py', color: C.cyan },
                { text: '', color: C.dim },
                { text: '# QR code appears → scan it in the app', color: C.green },
              ]} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                <CopyChip label="python butler_server.py"  value="python butler_server.py"  color={C.cyan} />
                <CopyChip label="python3 butler_server.py" value="python3 butler_server.py" color={C.blue} />
              </View>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════
            🤖 OLLAMA AI ENGINE
        ══════════════════════════════════ */}
        <View>
          <Sec icon="robot-happy" label="OLLAMA — LOCAL AI ENGINE" color={C.purple}
            sub="Ollama runs LLM models 100% on your PC. No cloud, no API key, no usage limits. Optional but recommended." />
          <View style={[card.root, { borderColor: C.purple + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.purple }} />
            <View style={{ padding: 14 }}>
              <HudCorners color={C.purple + '35'} size={8} />
              <DownloadBtn
                label="DOWNLOAD OLLAMA"
                sub="ollama.com — Windows / Mac / Linux · completely free"
                icon="download-circle-outline"
                color={C.purple}
                url="https://ollama.com/download"
                badge="FREE"
                primary
              />
              <View style={{ height: 10 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 8, letterSpacing: 1 }}>PULL RECOMMENDED MODELS</Text>
              <CodeBlock lines={[
                { text: '# Best for coding tasks (4GB RAM)', color: C.dim },
                { text: 'ollama pull qwen2.5-coder:7b', color: C.purple },
                { text: '', color: C.dim },
                { text: '# Smaller / faster option (2GB)', color: C.dim },
                { text: 'ollama pull llama3.2', color: C.purple },
                { text: '', color: C.dim },
                { text: '# General purpose chat (4GB)', color: C.dim },
                { text: 'ollama pull mistral', color: C.purple },
                { text: '', color: C.dim },
                { text: '# Check installed models', color: C.dim },
                { text: 'ollama list', color: C.cyan },
              ]} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                <CopyChip label="pull qwen2.5-coder:7b" value="ollama pull qwen2.5-coder:7b" color={C.purple} />
                <CopyChip label="pull llama3.2"         value="ollama pull llama3.2"          color={C.blue} />
                <CopyChip label="pull mistral"          value="ollama pull mistral"           color={C.mid} />
                <CopyChip label="ollama list"           value="ollama list"                   color={C.teal} />
              </View>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════
            🐍 PYTHON RUNTIME
        ══════════════════════════════════ */}
        <View>
          <Sec icon="language-python" label="PYTHON RUNTIME" color={C.amber}
            sub="Butler Server requires Python 3.10+. The server auto-detects your version on startup." />
          <View style={[card.root, { borderColor: C.amber + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.amber }} />
            <View style={{ padding: 14 }}>
              <HudCorners color={C.amber + '35'} size={8} />
              <DownloadBtn
                label="PYTHON 3.12 — OFFICIAL"
                sub="python.org — all platforms · current recommended version"
                icon="language-python"
                color={C.amber}
                url="https://www.python.org/downloads/"
                badge="3.12+"
                primary
              />
              <View style={{ height: 10 }} />
              <CodeBlock lines={[
                { text: 'python --version', color: C.amber },
                { text: '# Must show Python 3.10 or higher', color: C.dim },
                { text: '', color: C.dim },
                { text: 'pip --version', color: C.amber },
                { text: '# Must show pip 22+', color: C.dim },
              ]} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                <CopyChip label="python --version" value="python --version" color={C.amber} />
                <CopyChip label="pip --version"    value="pip --version"    color={C.amber} />
              </View>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════
            📱 PLAY STORE + SHARE
        ══════════════════════════════════ */}
        <View>
          <Sec icon="google-play" label="SHARE BUTLER AI" color={C.green}
            sub="Share the app with friends, family, or colleagues. Free on Google Play." />
          <View style={{ gap: 8 }}>
            <DownloadBtn
              label="BUTLER AI ON GOOGLE PLAY"
              sub="Official app listing · free download · verified by Google"
              icon="google-play"
              color={C.green}
              url="https://play.google.com/store/apps/details?id=com.butlerai.pc.automation"
              badge="FREE"
            />
            <TouchableOpacity onPress={shareApp} activeOpacity={0.85}
              style={[db.btn, { borderColor: C.teal + '55', backgroundColor: C.teal + '0E' }]}>
              <View style={[db.iconBox, { borderColor: C.teal + '65', backgroundColor: C.teal + '18' }]}>
                <MaterialIcons name="share" size={22} color={C.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[db.label, { color: C.teal }]}>SHARE WITH FRIENDS</Text>
                <Text style={db.sub}>Send the Play Store link to someone</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={15} color={C.teal + '80'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════
            🔐 OPEN SOURCE TRANSPARENCY
        ══════════════════════════════════ */}
        <OpenSourcePanel />

        {/* ══════════════════════════════════
            ❓ FAQ / Q&A
        ══════════════════════════════════ */}
        <FAQSection />

        {/* ══════════════════════════════════
            📋 SYSTEM REQUIREMENTS
        ══════════════════════════════════ */}
        <SystemRequirements />

        {/* ══════════════════════════════════
            🛡 SECURITY AUDIT
        ══════════════════════════════════ */}
        <SecurityAudit />

        {/* Footer */}
        <View style={{ alignItems: 'center', gap: 7, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => Linking.openURL('https://github.com/shawnjan-cmd/butler-server').catch(() => {})} activeOpacity={0.75}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 9, borderColor: C.cyan + '35', paddingHorizontal: 12, paddingVertical: 7 }}>
              <MaterialCommunityIcons name="github" size={13} color={C.cyan} />
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.cyan, fontWeight: '900' }}>VIEW SOURCE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:andrejsladkovic1992@gmail.com').catch(() => {})} activeOpacity={0.75}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 9, borderColor: C.mid + '35', paddingHorizontal: 12, paddingVertical: 7 }}>
              <MaterialIcons name="email" size={13} color={C.mid} />
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, fontWeight: '900' }}>SUPPORT</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, letterSpacing: 1 }}>BUTLER AI · DOWNLOAD CENTER · v3.0</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: C.dim, letterSpacing: 0.5 }}>ZERO CLOUD · OPEN SOURCE · LAN ONLY · © 2026 ANDREJ SLADKOVIC</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const card = StyleSheet.create({
  root: { backgroundColor: C.surf, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
});

export default function DownloadCenterScreen() {
  return (
    <TabErrorBoundary name="Downloads">
      <DownloadCenterInner />
    </TabErrorBoundary>
  );
}
