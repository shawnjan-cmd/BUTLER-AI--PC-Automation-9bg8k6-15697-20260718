/**
 * BUTLER AI — DOWNLOAD CENTER v1.0
 * Everything you need to get the server stack running.
 * Official HTTPS sources only. Zero hardcoded IPs.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Pressable, Animated, Platform, Dimensions, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { haptics } from '@/services/haptics';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD = 16;

const C = {
  bg:     '#020509',
  surf:   '#07101A',
  surf2:  '#0C1828',
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

// ─── PULSE DOT ───────────────────────────────────────────────────
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

// ─── HUD CORNERS ─────────────────────────────────────────────────
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

// ─── COPY CHIP ───────────────────────────────────────────────────
function CopyChip({ label, value, color }: { label: string; value: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const scaleA = useRef(new Animated.Value(1)).current;
  const copy = async () => {
    haptics.success();
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 0.94, duration: 60,  useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1,    tension: 300,  friction: 10, useNativeDriver: true }),
    ]).start();
    try {
      const C2 = await import('expo-clipboard');
      await C2.setStringAsync(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
  label: { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.3, maxWidth: SW * 0.5 },
});

// ─── DOWNLOAD BUTTON ─────────────────────────────────────────────
function DownloadBtn({ label, sub, icon, color, url, badge }: {
  label: string; sub?: string; icon: string; color: string; url: string; badge?: string;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const tap = () => {
    haptics.heavy();
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 0.96, duration: 70,  useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1,    tension: 280,  friction: 10, useNativeDriver: true }),
    ]).start();
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open URL', 'Try manually:\n' + url, [{ text: 'OK' }])
    );
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleA }] }}>
      <TouchableOpacity onPress={tap} activeOpacity={0.88}
        style={[db.btn, { borderColor: color + '55', backgroundColor: color + '0E' }]}>
        <View style={[db.iconBox, { borderColor: color + '65', backgroundColor: color + '18' }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[db.label, { color }]}>{label}</Text>
          {sub ? <Text style={db.sub}>{sub}</Text> : null}
        </View>
        {badge ? (
          <View style={[db.badge, { borderColor: color + '50', backgroundColor: color + '0A' }]}>
            <Text style={[db.badgeTxt, { color }]}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name="open-in-new" size={15} color={color + '80'} />
      </TouchableOpacity>
    </Animated.View>
  );
}
const db = StyleSheet.create({
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 8 },
  iconBox:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  sub:      { fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 2, lineHeight: 15 },
  badge:    { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900' },
});

// ─── SECTION HEADER ──────────────────────────────────────────────
function Sec({ icon, label, color, sub }: { icon: string; label: string; color: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 10, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 3.5, height: 16, borderRadius: 2, backgroundColor: color }} />
        <MaterialCommunityIcons name={icon as any} size={12} color={color} />
        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: color + 'DD', letterSpacing: 2, flex: 1 }}>{label}</Text>
        <View style={{ height: 1, width: 20, backgroundColor: color + '25' }} />
      </View>
      {sub ? <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, marginLeft: 27, marginTop: 4, lineHeight: 16 }}>{sub}</Text> : null}
    </View>
  );
}

// ─── CODE BLOCK ──────────────────────────────────────────────────
function CodeBlock({ lines }: { lines: Array<{ text: string; color?: string; comment?: string }> }) {
  return (
    <View style={[cbl.root]}>
      <View style={cbl.chrome}>
        {['#FF5F57','#FEBC2E','#28C840'].map((col, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
        ))}
        <Text style={cbl.chromeLabel}>TERMINAL</Text>
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        {lines.map((l, i) => (
          <Text key={i} style={[cbl.line, { color: l.color ?? C.green }]} selectable>
            {l.text}
            {l.comment ? <Text style={{ color: C.dim }}>{l.comment}</Text> : null}
          </Text>
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

// ─── PAGE HEADER ─────────────────────────────────────────────────
function DlHeader({ safeTop }: { safeTop: number }) {
  const shimA = useRef(new Animated.Value(-SW)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.5, duration: 2800, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW,       duration: 0,    useNativeDriver: true }),
      Animated.delay(7000),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[dlh.root, { paddingTop: safeTop }]}>
      <View style={{ height: 3, backgroundColor: C.blue }} />
      <Animated.View pointerEvents="none" style={[dlh.shim, { transform: [{ translateX: shimA }] }]} />
      <View style={dlh.body}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={dlh.eye}>DOWNLOAD CENTER · SETUP HQ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={[dlh.iconBox, { borderColor: C.blue + '55', backgroundColor: C.blue + '10' }]}>
              <MaterialCommunityIcons name="download-circle" size={20} color={C.blue} />
            </View>
            <Text style={dlh.title}>GET <Text style={{ color: C.blue }}>BUTLER</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <View style={[dlh.pill, { borderColor: C.green + '60', backgroundColor: C.green + '0C' }]}>
              <PulseDot color={C.green} size={5} />
              <Text style={[dlh.pillTxt, { color: C.green }]}>OFFICIAL SOURCES</Text>
            </View>
            <View style={[dlh.pill, { borderColor: C.blue + '45', backgroundColor: C.blue + '08' }]}>
              <Text style={[dlh.pillTxt, { color: C.blue }]}>FREE · OPEN SOURCE</Text>
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
  shim:    { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(74,158,255,0.05)', zIndex: 0 },
  body:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 13, zIndex: 1 },
  eye:     { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: C.blue + '60', letterSpacing: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.4 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 10, color: C.blue, fontWeight: '900' },
  sub2:    { fontFamily: MONO, fontSize: 8, color: C.mid, letterSpacing: 1 },
});

// ─── TRUST STRIP ─────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: 'github',          color: C.cyan,   label: 'OPEN SOURCE' },
  { icon: 'lock-outline',    color: C.green,  label: 'AES-256-GCM' },
  { icon: 'wifi-off',        color: C.amber,  label: 'LAN ONLY' },
  { icon: 'cloud-off-outline', color: C.blue, label: 'ZERO CLOUD' },
  { icon: 'shield-check',    color: C.teal,   label: 'HMAC-SHA256' },
];
function TrustStrip() {
  return (
    <View style={ts2.root}>
      <View style={{ height: 2.5, backgroundColor: C.green + '80' }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingVertical: 12, gap: 12, alignItems: 'center' }}>
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
const ts2 = StyleSheet.create({
  root: { backgroundColor: C.surf, borderRadius: 13, borderWidth: 1, borderColor: C.green + '25', overflow: 'hidden' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function DownloadCenterInner() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <DlHeader safeTop={insets.top} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: insets.bottom + 160, gap: 20 }}
      >

        {/* ── TRUST BADGES ── */}
        <TrustStrip />

        {/* ═══════════════════════════════════════
            🖥 BUTLER SERVER
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="server" label="BUTLER SERVER" color={C.cyan}
            sub="Run butler_server.py on your PC. It prints a QR code — scan it in the app to pair instantly." />

          <View style={[card.root, { borderColor: C.cyan + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.cyan }} />
            <View style={{ padding: 14, gap: 0 }}>
              <HudCorners color={C.cyan + '35'} size={8} />

              <DownloadBtn
                label="LATEST RELEASE (ZIP)"
                sub="butler_server_vXX.zip — recommended for most users"
                icon="download-circle"
                color={C.cyan}
                url="https://github.com/shawnjan-cmd/butler-server/releases/latest"
                badge="LATEST"
              />
              <DownloadBtn
                label="SOURCE CODE (ZIP)"
                sub="Full repo archive — always up to date"
                icon="zip-box-outline"
                color={C.blue}
                url="https://github.com/shawnjan-cmd/butler-server/archive/refs/heads/main.zip"
              />
              <DownloadBtn
                label="GITHUB REPOSITORY"
                sub="Browse code, issues, releases, and changelog"
                icon="github"
                color={C.mid}
                url="https://github.com/shawnjan-cmd/butler-server"
              />

              <View style={{ height: 10 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 8, letterSpacing: 1 }}>QUICK START COMMANDS</Text>
              <CodeBlock lines={[
                { text: '# Windows — run in PowerShell as admin', color: C.dim },
                { text: 'python butler_server.py', color: C.cyan },
                { text: '', color: C.dim },
                { text: '# Mac / Linux', color: C.dim },
                { text: 'python3 butler_server.py', color: C.cyan },
                { text: '', color: C.dim },
                { text: '# Scan the QR code that appears → done!', color: C.green },
              ]} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                <CopyChip label="python butler_server.py"  value="python butler_server.py"  color={C.cyan} />
                <CopyChip label="python3 butler_server.py" value="python3 butler_server.py" color={C.blue} />
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            🤖 OLLAMA AI ENGINE
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="robot-happy" label="OLLAMA — LOCAL AI ENGINE" color={C.purple}
            sub="Ollama runs LLM models 100% on your PC. No cloud, no API key, no usage limits." />

          <View style={[card.root, { borderColor: C.purple + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.purple }} />
            <View style={{ padding: 14, gap: 0 }}>
              <HudCorners color={C.purple + '35'} size={8} />

              <DownloadBtn
                label="DOWNLOAD OLLAMA"
                sub="ollama.com — Windows / Mac / Linux installer"
                icon="download-circle-outline"
                color={C.purple}
                url="https://ollama.com/download"
                badge="FREE"
              />

              <View style={{ height: 10 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 8, letterSpacing: 1 }}>PULL RECOMMENDED MODELS</Text>
              <CodeBlock lines={[
                { text: '# Best for coding tasks (4GB)', color: C.dim },
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

        {/* ═══════════════════════════════════════
            🐍 PYTHON RUNTIME
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="language-python" label="PYTHON RUNTIME" color={C.amber}
            sub="Butler Server requires Python 3.10+. The installer auto-detects your version." />

          <View style={[card.root, { borderColor: C.amber + '35' }]}>
            <View style={{ height: 3, backgroundColor: C.amber }} />
            <View style={{ padding: 14, gap: 0 }}>
              <HudCorners color={C.amber + '35'} size={8} />

              <DownloadBtn
                label="PYTHON 3.12 — OFFICIAL"
                sub="python.org — all platforms · current recommended"
                icon="language-python"
                color={C.amber}
                url="https://www.python.org/downloads/"
                badge="3.12+"
              />

              <View style={{ height: 10 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 8, letterSpacing: 1 }}>VERIFY INSTALLATION</Text>
              <CodeBlock lines={[
                { text: 'python --version', color: C.amber },
                { text: '# Expected: Python 3.10 or higher', color: C.dim },
                { text: '', color: C.dim },
                { text: 'pip --version', color: C.amber },
                { text: '# Expected: pip 22+', color: C.dim },
              ]} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                <CopyChip label="python --version" value="python --version" color={C.amber} />
                <CopyChip label="pip --version"    value="pip --version"    color={C.amber} />
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            📱 PLAY STORE
        ═══════════════════════════════════════ */}
        <View>
          <Sec icon="google-play" label="BUTLER AI — ANDROID APP" color={C.green}
            sub="Share the app with others — direct link to Google Play." />

          <DownloadBtn
            label="BUTLER AI ON GOOGLE PLAY"
            sub="Share this link with anyone who needs Butler AI"
            icon="google-play"
            color={C.green}
            url="https://play.google.com/store/apps/details?id=com.butlerai.pc.automation"
            badge="FREE"
          />
        </View>

        {/* ═══════════════════════════════════════
            🔐 SECURITY NOTES
        ═══════════════════════════════════════ */}
        <View style={[card.root, { borderColor: C.green + '28' }]}>
          <View style={{ height: 2.5, backgroundColor: C.green + '80' }} />
          <View style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={14} color={C.green} />
              <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: '900', color: C.green, letterSpacing: 1 }}>SECURITY AUDIT SUMMARY</Text>
            </View>
            {[
              { label: 'Telemetry outbound', val: '0 requests',  ok: true  },
              { label: 'Cloud dependencies', val: 'None',         ok: true  },
              { label: 'Encryption cipher',  val: 'AES-256-GCM', ok: true  },
              { label: 'Auth method',         val: 'HMAC-SHA256', ok: true  },
              { label: 'Network scope',       val: 'LAN only',    ok: true  },
              { label: 'Account required',    val: 'No',          ok: true  },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
                borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: 'rgba(0,255,136,0.07)' }}>
                <MaterialIcons name="check-circle" size={12} color={C.green} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, flex: 1 }}>{row.label}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: C.green, fontWeight: '900' }}>{row.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, letterSpacing: 1 }}>BUTLER AI · DOWNLOAD CENTER · v1.0</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: C.dim, letterSpacing: 0.5 }}>ZERO CLOUD · OPEN SOURCE · LAN ONLY</Text>
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
