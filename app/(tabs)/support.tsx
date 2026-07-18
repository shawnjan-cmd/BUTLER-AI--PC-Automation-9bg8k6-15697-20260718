/**
 * SUPPORT SCREEN — Butler AI Help & Community v2.0
 * Terminal-themed, with FAQ accordion, changelog, contact cards, and server probe.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Linking, Platform, Pressable, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { CompactPageHeader } from '@/components/ui/CompactPageHeader';
import { serverConnection } from '@/services/serverConnection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const C = {
  bg:      '#020810',
  surface: '#07111C',
  card:    '#09152A',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  amber:   '#FFB020',
  purple:  '#CC44FF',
  pink:    '#FF6EB4',
  red:     '#FF3344',
  text:    '#D4E8F6',
  textMid: '#4A6A88',
  textDim: '#1E3050',
  border:  'rgba(0,229,255,0.14)',
};

// ── FAQ DATA ───────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'How do I connect Butler AI to my PC?',
    a: `1. Download butler_server.py from the GitHub link in Settings.\n2. Run it on your Windows/Mac/Linux PC: python butler_server.py\n3. Open Butler AI, go to HOME tab, tap the QR button.\n4. Scan the QR code shown in your PC terminal.\n5. Done — you're paired!`,
    icon: 'link-variant',
    col: C.cyan,
  },
  {
    q: 'Do I need an internet connection?',
    a: `No! Butler AI works entirely on your local Wi-Fi network (LAN). Your phone talks directly to your PC. No data leaves your network. No cloud. No account.`,
    icon: 'wifi-off',
    col: C.green,
  },
  {
    q: 'How do I set up local AI (Ollama)?',
    a: `1. Install Ollama from ollama.ai\n2. Run: ollama pull llama3\n3. In Butler AI Settings, set the Ollama endpoint to your PC IP on port 11434\n4. The AI chat will now run 100% locally on your hardware.`,
    icon: 'robot-happy',
    col: C.purple,
  },
  {
    q: 'Why is my connection dropping?',
    a: `• Phone and PC must be on the same Wi-Fi network\n• Disable Windows Firewall for port 8766 (or add an exception)\n• Make sure butler_server.py is still running\n• Try tapping "Refresh" on the Home tab\n• Some routers block device-to-device traffic — try a direct hotspot`,
    icon: 'wifi-alert',
    col: C.amber,
  },
  {
    q: 'Is my data safe? What does the app collect?',
    a: `Butler AI collects NOTHING. Zero telemetry. Zero analytics. No login required.\n\nAll communication is encrypted with HMAC-SHA256. Your session tokens never leave your device. The source code is fully open on GitHub.`,
    icon: 'shield-lock',
    col: C.green,
  },
  {
    q: 'Can I run scripts on Mac and Linux?',
    a: `Yes! butler_server.py runs on Windows, macOS, and Linux. Python-based scripts run cross-platform. Shell scripts (.sh) work on Mac/Linux. PowerShell scripts require Windows.`,
    icon: 'laptop',
    col: C.cyan,
  },
  {
    q: 'How do I add my own Python scripts?',
    a: `Go to SCRIPTS tab → Builder tab → New Script. Write your Python code directly in the app. Run it instantly on your PC. Scripts are saved locally on both your phone and PC.`,
    icon: 'code-braces',
    col: C.purple,
  },
  {
    q: 'The AI gives wrong answers — how to improve?',
    a: `• Use a larger Ollama model (llama3:70b, mistral-large)\n• Add context in the Knowledge Base tab — Butler learns from your files\n• Be specific in your prompts: include your PC type, OS, and goal\n• Enable "Auto-Learning" to let Butler index your scripts and history`,
    icon: 'brain',
    col: C.amber,
  },
];

// ── CHANGELOG ─────────────────────────────────────────────────────
const CHANGELOG = [
  { version: 'v5.0.9', date: 'Jul 2026', changes: ['Cinematic onboarding redesign', 'Custom SVG tab icons', 'NexusHeroCard + 4-channel LiveTerminalFeed', 'Support/Donation shop'], tag:'NEW' },
  { version: 'v5.0.8', date: 'Jul 2026', changes: ['Responsive scaling system (rf/rs)', 'FuturisticTabBar narrow-phone fix', 'Butler AI header compacted', 'InputBar HUD redesign'], tag:'HOT' },
  { version: 'v5.0.0', date: 'Jul 2026', changes: ['Expo SDK 54 / React Native 0.81', 'HMAC token encrypted storage', 'New Architecture enabled', 'hermes-parser cold-start crash fixed'], tag:'MAJOR' },
  { version: 'v4.x',   date: 'Jun 2026', changes: ['Digital Twin security baseline', 'Proximity PC lock', '50+ new automation scripts', 'Play Store approval'], tag:'' },
];

// ── FAQ ACCORDION ITEM ─────────────────────────────────────────────
function FAQItem({ item }: { item: typeof FAQ[0] }) {
  const [open, setOpen] = useState(false);
  const heightA = useRef(new Animated.Value(0)).current;
  const rotateA = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    haptics.light();
    const toOpen = !open;
    setOpen(toOpen);
    Animated.parallel([
      Animated.timing(heightA, { toValue: toOpen ? 1 : 0, duration: 260, useNativeDriver: false }),
      Animated.timing(rotateA, { toValue: toOpen ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [open]);

  const maxH  = heightA.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });
  const rotate = rotateA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[faq.wrap, { borderColor: open ? item.col + '55' : C.textDim + '40',
      backgroundColor: open ? item.col + '06' : C.surface }]}>
      <View style={[faq.topBar, { backgroundColor: item.col, opacity: open ? 1 : 0.4 }]} />
      <Pressable onPress={toggle} style={faq.header}>
        <View style={[faq.iconBox, { borderColor: item.col + '55', backgroundColor: item.col + '0D' }]}>
          <MaterialCommunityIcons name={item.icon as any} size={14} color={item.col} />
        </View>
        <Text style={[faq.q, { color: open ? item.col : C.text }]} numberOfLines={open ? 0 : 2}>
          {item.q}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialIcons name="expand-more" size={18} color={item.col} />
        </Animated.View>
      </Pressable>
      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <View style={faq.body}>
          <Text style={faq.a}>{item.a}</Text>
        </View>
      </Animated.View>
    </View>
  );
}
const faq = StyleSheet.create({
  wrap:    { borderRadius:14, borderWidth:1.5, overflow:'hidden' },
  topBar:  { height:2.5 },
  header:  { flexDirection:'row', alignItems:'center', gap:10, padding:14 },
  iconBox: { width:34, height:34, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  q:       { fontFamily:MONO, fontSize:11.5, fontWeight:'900', flex:1, lineHeight:16 },
  body:    { paddingHorizontal:14, paddingBottom:14, paddingTop:2 },
  a:       { fontFamily:SANS, fontSize:12.5, color:C.textMid, lineHeight:20 },
});

// ── SERVER PROBE CARD ──────────────────────────────────────────────
function ServerProbeCard() {
  const [status, setStatus] = useState<'idle'|'probing'|'ok'|'fail'>('idle');
  const [latency, setLatency] = useState(0);

  const probe = useCallback(async () => {
    haptics.light();
    setStatus('probing');
    const t0 = Date.now();
    try {
      const ip = serverConnection.getIP?.() || '';
      const port = serverConnection.getPort?.() || '';
      if (!ip) throw new Error('No server configured');
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`http://${ip}:${port}/health`, { signal: ctrl.signal });
      if (res.ok) {
        setLatency(Date.now() - t0);
        setStatus('ok');
        haptics.success();
      } else throw new Error(`HTTP ${res.status}`);
    } catch {
      setStatus('fail');
      haptics.warning();
    }
  }, []);

  const col = status === 'ok' ? C.green : status === 'fail' ? C.red : status === 'probing' ? C.amber : C.cyan;

  return (
    <View style={[spc.wrap, { borderColor: col + '40' }]}>
      <View style={[spc.bar, { backgroundColor: col }]} />
      <View style={{ flexDirection:'row', alignItems:'center', padding:14, gap:12 }}>
        <View style={[spc.iconBox, { borderColor: col + '55', backgroundColor: col + '0D' }]}>
          <MaterialCommunityIcons
            name={status === 'ok' ? 'check-circle' : status === 'fail' ? 'alert-circle' : 'server-network'}
            size={20} color={col} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:col, letterSpacing:0.5 }}>SERVER PROBE</Text>
          <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.textMid, marginTop:3 }}>
            {status === 'idle'    ? 'Tap to test connection to your PC' :
             status === 'probing' ? 'Pinging server...' :
             status === 'ok'      ? `Reachable · ${latency}ms response time` :
             'Server unreachable — check connection'}
          </Text>
        </View>
        <Pressable onPress={probe} disabled={status === 'probing'}
          style={({ pressed }) => [spc.btn, {
            borderColor: col + '60', backgroundColor: col + '0D',
            opacity: status === 'probing' ? 0.5 : pressed ? 0.8 : 1,
          }]}>
          <MaterialIcons name="wifi-tethering" size={14} color={col} />
          <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:col }}>PROBE</Text>
        </Pressable>
      </View>
    </View>
  );
}
const spc = StyleSheet.create({
  wrap:    { borderRadius:14, borderWidth:1.5, backgroundColor:C.surface, overflow:'hidden' },
  bar:     { height:3 },
  iconBox: { width:44, height:44, borderRadius:13, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  btn:     { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:10, paddingHorizontal:14, paddingVertical:10 },
});

// ── CONTACT CARDS ──────────────────────────────────────────────────
function ContactCard({ icon, label, sub, col, onPress }: {
  icon:string; label:string; sub:string; col:string; onPress:()=>void;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue:0.96, tension:400, friction:12, useNativeDriver:true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue:1,   tension:280, friction:10, useNativeDriver:true }).start()}
      onPress={() => { haptics.light(); onPress(); }}>
      <Animated.View style={[cc.card, { borderColor:col+'45', transform:[{scale:scaleA}] }]}>
        <View style={[cc.topBar, { backgroundColor:col }]} />
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:13 }}>
          <View style={[cc.iconBox, { borderColor:col+'60', backgroundColor:col+'0D' }]}>
            <MaterialCommunityIcons name={icon as any} size={18} color={col} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[cc.label, { color:col }]}>{label}</Text>
            <Text style={cc.sub} numberOfLines={1}>{sub}</Text>
          </View>
          <MaterialIcons name="open-in-new" size={14} color={col + '80'} />
        </View>
      </Animated.View>
    </Pressable>
  );
}
const cc = StyleSheet.create({
  card:    { borderRadius:12, borderWidth:1.5, backgroundColor:C.surface, overflow:'hidden' },
  topBar:  { height:2.5 },
  iconBox: { width:40, height:40, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  label:   { fontFamily:MONO, fontSize:11.5, fontWeight:'900', letterSpacing:0.4 },
  sub:     { fontFamily:MONO, fontSize:9, color:C.textMid, marginTop:3 },
});

// ── CHANGELOG ITEM ─────────────────────────────────────────────────
function ChangelogItem({ entry }: { entry: typeof CHANGELOG[0] }) {
  const TAG_COLORS: Record<string, string> = { NEW:C.cyan, HOT:C.pink, MAJOR:C.gold ?? C.amber };
  const col = TAG_COLORS[entry.tag] ?? C.textMid;
  return (
    <View style={[cli.wrap, { borderColor:col+'30' }]}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 }}>
        <Text style={[cli.version, { color:col }]}>{entry.version}</Text>
        <Text style={cli.date}>{entry.date}</Text>
        {entry.tag ? (
          <View style={[cli.tag, { borderColor:col+'55', backgroundColor:col+'0D' }]}>
            <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:col }}>{entry.tag}</Text>
          </View>
        ) : null}
      </View>
      {entry.changes.map((c,i) => (
        <View key={i} style={{ flexDirection:'row', gap:8, marginTop:4 }}>
          <Text style={{ fontFamily:MONO, fontSize:10, color:col+'70' }}>{'>'}</Text>
          <Text style={{ fontFamily:MONO, fontSize:10.5, color:C.textMid, flex:1, lineHeight:16 }}>{c}</Text>
        </View>
      ))}
    </View>
  );
}
const cli = StyleSheet.create({
  wrap:    { borderWidth:1, borderRadius:12, backgroundColor:C.surface, padding:12 },
  version: { fontFamily:MONO, fontSize:13, fontWeight:'900', letterSpacing:0.5 },
  date:    { fontFamily:MONO, fontSize:9.5, color:C.textMid },
  tag:     { borderWidth:1, borderRadius:6, paddingHorizontal:7, paddingVertical:2 },
});

// ── MAIN SCREEN ────────────────────────────────────────────────────
function SupportScreenInner() {
  const insets = useSafeAreaInsets();

  const SECTIONS = [
    { id:'faq',       label:'FAQ',        icon:'help-circle',  col:C.cyan   },
    { id:'server',    label:'SERVER',     icon:'server-network',col:C.green  },
    { id:'contact',   label:'CONTACT',    icon:'email-outline',col:C.purple },
    { id:'changelog', label:'CHANGELOG',  icon:'history',      col:C.amber  },
  ];

  function SectionHeader({ label, icon, col }: { label:string; icon:string; col:string }) {
    return (
      <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12, marginTop:8 }}>
        <View style={{ width:3, height:16, borderRadius:2, backgroundColor:col }} />
        <MaterialCommunityIcons name={icon as any} size={11} color={col} />
        <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:col, letterSpacing:1.8, flex:1 }}>{label}</Text>
        <View style={{ height:1, flex:1, backgroundColor:col+'25' }} />
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <CompactPageHeader
        title="SUPPORT"
        subtitle="Help · Community · Changelog"
        badge="?"
        badgeColor={C.cyan}
        icon="help-circle"
        safeTop={insets.top}
        accent={C.cyan}
      />

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:14, gap:8, paddingBottom:120 }}>

        {/* ── FAQ ── */}
        <SectionHeader label="FREQUENTLY ASKED" icon="help-circle" col={C.cyan} />
        <View style={{ gap:8, marginBottom:10 }}>
          {FAQ.map((item, i) => <FAQItem key={i} item={item} />)}
        </View>

        {/* ── SERVER PROBE ── */}
        <SectionHeader label="SERVER DIAGNOSTICS" icon="server-network" col={C.green} />
        <ServerProbeCard />
        <View style={{ gap:6, borderWidth:1.5, borderRadius:14, borderColor:C.green+'30',
          backgroundColor:C.green+'05', padding:14, marginBottom:8 }}>
          <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:C.green, letterSpacing:1.2, marginBottom:6 }}>QUICK DIAGNOSTICS</Text>
          {[
            { label:'Phone on same Wi-Fi as PC?',       check:'Essential — different networks = no connection' },
            { label:'butler_server.py running on PC?',  check:'Check your PC terminal for the green QR code' },
            { label:'Firewall blocking port 8766?',     check:'Add Windows Firewall exception for Python / port 8766' },
            { label:'Token expired?',                   check:'Re-scan QR code to refresh authentication' },
          ].map(({ label, check }, i) => (
            <View key={i} style={{ flexDirection:'row', gap:8, paddingVertical:5 }}>
              <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={12} color={C.green} style={{ marginTop:2, flexShrink:0 }} />
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:MONO, fontSize:10.5, color:C.text, fontWeight:'900', lineHeight:15 }}>{label}</Text>
                <Text style={{ fontFamily:MONO, fontSize:9, color:C.textMid, marginTop:2, lineHeight:13 }}>{check}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── CONTACT ── */}
        <SectionHeader label="GET IN TOUCH" icon="email-outline" col={C.purple} />
        <View style={{ gap:8, marginBottom:10 }}>
          <ContactCard icon="github" col={C.cyan}
            label="GitHub — Source Code & Issues" sub="github.com/butlerai/app"
            onPress={() => Linking.openURL('https://github.com').catch(()=>{})} />
          <ContactCard icon="discord" col="#5865F2"
            label="Discord — Live Community" sub="discord.gg/butlerai · fastest responses"
            onPress={() => Linking.openURL('https://discord.gg/butlerai').catch(()=>{})} />
          <ContactCard icon="email" col={C.purple}
            label="Email Support" sub="support@butlerai.app · 1–3 business day response"
            onPress={() => Linking.openURL('mailto:support@butlerai.app').catch(()=>{})} />
          <ContactCard icon="google-play" col={C.green}
            label="Rate on Google Play" sub="5 stars helps us stay visible — takes 10 seconds 🙏"
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.butlerai.pc.automation').catch(()=>{})} />
        </View>

        {/* ── CHANGELOG ── */}
        <SectionHeader label="WHAT'S NEW" icon="history" col={C.amber} />
        <View style={{ gap:8 }}>
          {CHANGELOG.map((entry, i) => <ChangelogItem key={i} entry={entry} />)}
        </View>

        {/* Footer */}
        <View style={{ alignItems:'center', paddingTop:20, paddingBottom:10, gap:4 }}>
          <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.textDim, letterSpacing:0.5 }}>BUTLER AI v5.0.9 · build clean24</Text>
          <Text style={{ fontFamily:MONO, fontSize:9, color:C.textDim }}>Made with ❤️ · Zero cloud · Zero tracking</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function SupportScreen() {
  return (
    <TabErrorBoundary name="Support">
      <SupportScreenInner />
    </TabErrorBoundary>
  );
}
