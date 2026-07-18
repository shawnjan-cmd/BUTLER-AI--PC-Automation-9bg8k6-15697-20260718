/**
 * DownloadButtons v8 — Butler AI Server Distribution
 * Open-source · Trustworthy · Detailed · Visually stunning NEXUS aesthetic
 * New server link: github.com/shawnjan-cmd/butler-server
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Alert, ActivityIndicator, Animated, Linking, ScrollView,
  Share, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { haptics } from '@/services/haptics';

const { width: SW } = Dimensions.get('window');
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ── NEW GitHub link ───────────────────────────────────────────────────────────
const GITHUB_SERVER_URL = 'https://github.com/shawnjan-cmd/butler-server/blob/main/butler_server_v21_1_1_FINAL-3.py';
const GITHUB_REPO_URL   = 'https://github.com/shawnjan-cmd/butler-server';
const RAW_SERVER_URL    = 'https://raw.githubusercontent.com/shawnjan-cmd/butler-server/main/butler_server_v21_1_1_FINAL-3.py';

// ── Design tokens — NEXUS palette ────────────────────────────────────────────
const C = {
  bg:      '#020810',
  card:    '#060E1A',
  surf:    '#09141F',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  amber:   '#FFB020',
  purple:  '#CC44FF',
  red:     '#FF3344',
  blue:    '#4499FF',
  teal:    '#00CCBB',
  text:    '#D4E8F6',
  mid:     '#6A8EA8',
  dim:     '#2A4060',
  border:  'rgba(0,229,255,0.14)',
};

// ── Shared helpers ────────────────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a,
    }} />
  );
}

function HudCorners({ color, size = 8, t = 1.5 }: { color: string; size?: number; t?: number }) {
  return (
    <>
      <View style={{ position:'absolute', top:0, left:0,   width:size, height:size, borderTopWidth:t,    borderLeftWidth:t,   borderColor:color }} />
      <View style={{ position:'absolute', top:0, right:0,  width:size, height:size, borderTopWidth:t,    borderRightWidth:t,  borderColor:color }} />
      <View style={{ position:'absolute', bottom:0, left:0,  width:size, height:size, borderBottomWidth:t, borderLeftWidth:t,  borderColor:color }} />
      <View style={{ position:'absolute', bottom:0, right:0, width:size, height:size, borderBottomWidth:t, borderRightWidth:t, borderColor:color }} />
    </>
  );
}

function SectionLabel({ icon, label, color, iconLib = 'material' }: { icon: string; label: string; color: string; iconLib?: 'material'|'community' }) {
  const IconC = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:10, marginTop:4 }}>
      <View style={{ width:3, height:12, borderRadius:2, backgroundColor:color }} />
      <IconC name={icon as any} size={10} color={color} />
      <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color, letterSpacing:2 }}>{label}</Text>
      <View style={{ flex:1, height:StyleSheet.hairlineWidth, backgroundColor:color+'30' }} />
    </View>
  );
}

// ── Expandable info section ───────────────────────────────────────────────────
function ExpandCard({ title, icon, color, iconLib = 'material', children }: {
  title: string; icon: string; color: string; iconLib?: 'material'|'community'; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const IconC = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const toggle = () => {
    haptics.light();
    setOpen(v => {
      Animated.timing(anim, { toValue: v ? 0 : 1, duration: 250, useNativeDriver: false }).start();
      return !v;
    });
  };
  return (
    <View style={[ec.wrap, { borderColor: color+'30' }]}>
      <View style={{ height:2, backgroundColor:color }} />
      <HudCorners color={color+'35'} size={7} t={1} />
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={ec.header}>
        <View style={[ec.iconBox, { borderColor:color+'55', backgroundColor:color+'10' }]}>
          <IconC name={icon as any} size={16} color={color} />
        </View>
        <Text style={[ec.title, { color }]}>{title}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={18} color={color+'80'} />
      </TouchableOpacity>
      {open && (
        <View style={{ paddingHorizontal:14, paddingBottom:14 }}>
          {children}
        </View>
      )}
    </View>
  );
}
const ec = StyleSheet.create({
  wrap:    { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  header:  { flexDirection:'row', alignItems:'center', gap:10, padding:14 },
  iconBox: { width:36, height:36, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:   { flex:1, fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
});

// ── Security badge row ────────────────────────────────────────────────────────
function SafetyBadge({ icon, label, sub, color }: { icon: string; label: string; sub: string; color: string }) {
  return (
    <View style={[sb.cell, { borderColor:color+'35', backgroundColor:color+'07' }]}>
      <View style={[sb.iconCircle, { borderColor:color+'55', backgroundColor:color+'12' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[sb.label, { color }]}>{label}</Text>
      <Text style={sb.sub} numberOfLines={2}>{sub}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  cell:       { width:(SW-32-8)/2, borderWidth:1.5, borderRadius:12, padding:12, alignItems:'center', gap:7 },
  iconCircle: { width:44, height:44, borderRadius:22, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  label:      { fontFamily:MONO, fontSize:10, fontWeight:'900', textAlign:'center', letterSpacing:0.5 },
  sub:        { fontFamily:MONO, fontSize:8, color:C.mid, textAlign:'center', lineHeight:12 },
});

// ── Endpoint row ──────────────────────────────────────────────────────────────
function EndpointRow({ method, path, desc, color, auth = false }: {
  method: string; path: string; desc: string; color: string; auth?: boolean;
}) {
  const mc = method === 'GET' ? C.green : C.amber;
  return (
    <View style={[ep.row, { borderBottomColor:C.border }]}>
      <View style={[ep.method, { backgroundColor:mc+'18', borderColor:mc+'50' }]}>
        <Text style={[ep.methodTxt, { color:mc }]}>{method}</Text>
      </View>
      <View style={{ flex:1 }}>
        <Text style={[ep.path, { color }]}>{path}</Text>
        <Text style={ep.desc}>{desc}</Text>
      </View>
      {auth && (
        <View style={[ep.authBadge]}>
          <MaterialIcons name="lock" size={8} color={C.amber} />
          <Text style={ep.authTxt}>AUTH</Text>
        </View>
      )}
    </View>
  );
}
const ep = StyleSheet.create({
  row:      { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:9, borderBottomWidth:1 },
  method:   { borderWidth:1, borderRadius:5, paddingHorizontal:7, paddingVertical:3, flexShrink:0 },
  methodTxt:{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', letterSpacing:0.5 },
  path:     { fontFamily:MONO, fontSize:10, fontWeight:'700', letterSpacing:0.3 },
  desc:     { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  authBadge:{ flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:2, borderColor:C.amber+'50', backgroundColor:C.amber+'08' },
  authTxt:  { fontFamily:MONO, fontSize:7, fontWeight:'900', color:C.amber },
});

// ── Main hero download card ───────────────────────────────────────────────────
function HeroDownloadCard({ onPress, glowAnim }: { onPress: () => void; glowAnim: Animated.Value }) {
  const borderC = glowAnim.interpolate({ inputRange:[0,1], outputRange:[C.cyan+'35', C.cyan+'AA'] });
  return (
    <Animated.View style={[hd.card, { borderColor:borderC }]}>
      {/* 6-color stripe */}
      <View style={{ height:3.5, flexDirection:'row' }}>
        {[C.cyan, C.green, C.purple, C.amber, C.teal, C.blue].map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </View>
      <HudCorners color={C.cyan+'55'} size={10} t={1.5} />

      {/* Header row */}
      <View style={hd.headerRow}>
        <Animated.View style={[hd.iconOrb, {
          borderColor: glowAnim.interpolate({inputRange:[0,1],outputRange:[C.cyan+'40',C.cyan+'CC']}),
          backgroundColor: C.cyan+'0D',
        }]}>
          <MaterialCommunityIcons name="github" size={28} color={C.cyan} />
        </Animated.View>
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <Text style={hd.title}>OPEN SOURCE SERVER</Text>
            <View style={hd.verBadge}>
              <Text style={[hd.verTxt, { color:C.cyan }]}>v21.1.1</Text>
            </View>
            <View style={[hd.verBadge, { borderColor:C.green+'60', backgroundColor:C.green+'10' }]}>
              <Text style={[hd.verTxt, { color:C.green }]}>LATEST</Text>
            </View>
          </View>
          <Text style={hd.sub}>butler_server_v21_1_1_FINAL-3.py</Text>
          <Text style={[hd.sub, { color:C.mid, marginTop:2, fontSize:8 }]}>github.com/shawnjan-cmd/butler-server</Text>
        </View>
      </View>

      {/* Value proposition */}
      <View style={{ paddingHorizontal:14, paddingBottom:10 }}>
        <Text style={hd.description}>
          {'The entire server is a single Python file — fully readable, fully auditable. No binary blobs. No obfuscation. No hidden network calls. Every line of code is public and open to inspection before you run it.'}
        </Text>
      </View>

      {/* Feature tags */}
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:5, paddingHorizontal:14, paddingBottom:12 }}>
        {[
          { label:'OPEN SOURCE',    col:C.cyan   },
          { label:'SINGLE FILE',    col:C.green  },
          { label:'ZERO CLOUD',     col:C.amber  },
          { label:'HMAC AUTH',      col:C.purple },
          { label:'LAN ONLY',       col:C.teal   },
          { label:'AUTO-INSTALL',   col:C.blue   },
          { label:'OLLAMA AI',      col:C.cyan   },
          { label:'NO TRACKING',    col:C.green  },
          { label:'QR PAIR',        col:C.amber  },
          { label:'UDP BEACON',     col:C.purple },
          { label:'FILE TRANSFER',  col:C.teal   },
          { label:'PROCESS GUARD',  col:C.red    },
        ].map(({ label, col }) => (
          <View key={label} style={[hd.tag, { borderColor:col+'45', backgroundColor:col+'0A' }]}>
            <View style={{ width:4, height:4, borderRadius:2, backgroundColor:col }} />
            <Text style={[hd.tagTxt, { color:col }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* CTA buttons */}
      <View style={{ flexDirection:'row', gap:8, paddingHorizontal:14, paddingBottom:14 }}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}
          style={[hd.cta, { flex:2, backgroundColor:C.cyan }]}>
          <MaterialCommunityIcons name="github" size={18} color="#000" />
          <Text style={[hd.ctaTxt, { color:'#000' }]}>VIEW SOURCE CODE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { haptics.light(); Linking.openURL(GITHUB_REPO_URL).catch(() => {}); }}
          activeOpacity={0.85}
          style={[hd.cta, { flex:1, borderWidth:1.5, borderColor:C.green+'55', backgroundColor:C.green+'0A' }]}>
          <MaterialIcons name="open-in-new" size={15} color={C.green} />
          <Text style={[hd.ctaTxt, { color:C.green }]}>REPO</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const hd = StyleSheet.create({
  card:       { borderWidth:1.5, borderRadius:14, backgroundColor:C.card, overflow:'hidden', marginBottom:12, position:'relative',
    ...Platform.select({ ios:{shadowColor:C.cyan,shadowOffset:{width:0,height:6},shadowOpacity:0.2,shadowRadius:20}, android:{elevation:10} }) },
  headerRow:  { flexDirection:'row', alignItems:'flex-start', gap:12, padding:14, paddingBottom:10 },
  iconOrb:    { width:56, height:56, borderRadius:14, borderWidth:2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:      { fontFamily:MONO, fontSize:13, fontWeight:'900', color:'#FFFFFF', letterSpacing:1 },
  sub:        { fontFamily:MONO, fontSize:9, color:C.cyan, marginTop:3, letterSpacing:0.5 },
  verBadge:   { borderWidth:1.5, borderRadius:7, paddingHorizontal:7, paddingVertical:3, borderColor:C.cyan+'60', backgroundColor:C.cyan+'10' },
  verTxt:     { fontFamily:MONO, fontSize:8.5, fontWeight:'900', letterSpacing:0.8 },
  description:{ fontFamily:SANS, fontSize:12.5, color:C.mid, lineHeight:19 },
  tag:        { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7, paddingHorizontal:8, paddingVertical:5 },
  tagTxt:     { fontFamily:MONO, fontSize:7.5, fontWeight:'900', letterSpacing:0.5 },
  cta:        { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, borderRadius:10, paddingVertical:13 },
  ctaTxt:     { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
});

// ── Open source trust card ────────────────────────────────────────────────────
function OpenSourceTrustCard() {
  const glowA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue:1,   duration:1400, useNativeDriver:false }),
      Animated.timing(glowA, { toValue:0.2, duration:1400, useNativeDriver:false }),
    ]));
    l.start(); return () => l.stop();
  }, []);

  const points = [
    {
      icon: 'code',
      color: C.cyan,
      title: '100% Readable Code',
      desc: 'Every function, every API endpoint, every security check — visible in a single Python file. No compiled binaries, no encrypted payloads, no hidden modules.',
    },
    {
      icon: 'visibility',
      color: C.green,
      title: 'Publicly Auditable',
      desc: 'The full source is on GitHub under your control. Fork it, inspect it, diff every commit. Know exactly what runs on your PC before you start it.',
    },
    {
      icon: 'security',
      color: C.amber,
      title: 'No Surprise Network Calls',
      desc: 'Search the code for "requests.get" or any outbound call — you\'ll find exactly zero calls to any external server. It only talks to Ollama on localhost and your phone on LAN.',
    },
    {
      icon: 'lock',
      color: C.purple,
      title: 'Your Machine, Your Rules',
      desc: 'The server runs with YOUR credentials. Scripts run as YOU. No butler service account, no daemon with elevated access beyond what you already have.',
    },
    {
      icon: 'cloud-off',
      color: C.teal,
      title: 'Air-Gapped Capable',
      desc: 'Works completely offline. No license server, no telemetry ping, no update check. Pull the ethernet cable and everything still runs.',
    },
    {
      icon: 'history',
      color: C.blue,
      title: 'Full Commit History',
      desc: 'Every change to the server is tracked on GitHub. Compare any version to the previous. Know what changed, when, and why.',
    },
  ];

  return (
    <View style={[os.card, { borderColor:C.green+'30' }]}>
      <View style={{ height:2.5, backgroundColor:C.green }} />
      <HudCorners color={C.green+'40'} size={8} t={1} />

      {/* Header */}
      <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:14, paddingBottom:10 }}>
        <View style={[os.iconBox, { borderColor:C.green+'55', backgroundColor:C.green+'0C' }]}>
          <MaterialCommunityIcons name="shield-check" size={22} color={C.green} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={[os.title, { color:C.green }]}>WHY YOU CAN TRUST THIS SERVER</Text>
          <Text style={os.subtitle}>Open source = no secrets. Here is exactly why.</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal:14, paddingBottom:14, gap:10 }}>
        {points.map(({ icon, color, title, desc }) => (
          <View key={title} style={[os.point, { borderColor:color+'28', backgroundColor:color+'06' }]}>
            <View style={[os.pointIcon, { borderColor:color+'50', backgroundColor:color+'12' }]}>
              <MaterialIcons name={icon as any} size={16} color={color} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={[os.pointTitle, { color }]}>{title}</Text>
              <Text style={os.pointDesc}>{desc}</Text>
            </View>
          </View>
        ))}

        {/* Verify yourself prompt */}
        <View style={[os.verifyBox, { borderColor:C.cyan+'40', backgroundColor:C.cyan+'06' }]}>
          <MaterialIcons name="terminal" size={13} color={C.cyan} />
          <View style={{ flex:1 }}>
            <Text style={[os.verifyTitle, { color:C.cyan }]}>VERIFY IT YOURSELF — 30 SECONDS</Text>
            <Text style={[os.verifyCode]}>{'$ grep -n "requests.get\\|urllib.request" butler_server.py'}</Text>
            <Text style={os.verifyResult}>{'→ Only localhost Ollama calls. No external connections.'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
const os = StyleSheet.create({
  card:      { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  iconBox:   { width:46, height:46, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:     { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  subtitle:  { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  point:     { flexDirection:'row', alignItems:'flex-start', gap:10, borderWidth:1, borderRadius:10, padding:11 },
  pointIcon: { width:34, height:34, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  pointTitle:{ fontFamily:MONO, fontSize:10, fontWeight:'900', letterSpacing:0.5, marginBottom:4 },
  pointDesc: { fontFamily:SANS, fontSize:11, color:C.mid, lineHeight:16 },
  verifyBox: { borderWidth:1.5, borderRadius:10, padding:12, gap:5 },
  verifyTitle:{ fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:1, marginBottom:4 },
  verifyCode: { fontFamily:MONO, fontSize:9, color:C.text, backgroundColor:C.bg, borderRadius:6, padding:8, lineHeight:14 },
  verifyResult:{ fontFamily:MONO, fontSize:9, color:C.green },
});

// ── Safety features grid ──────────────────────────────────────────────────────
function SafetyFeaturesCard() {
  const FEATURES = [
    {
      icon: 'lock',
      color: C.cyan,
      title: 'HMAC-SHA256 AUTH',
      detail: 'Every API call is authenticated using HMAC-SHA256 signed tokens. A 32-byte cryptographically random secret is generated on first run and stored locally. No token = no access — even from inside your own network.',
    },
    {
      icon: 'qr-code-scanner',
      color: C.green,
      title: 'QR PAIRING',
      detail: 'Pairing is done by scanning a QR code shown in your PC terminal. The code contains IP, port, and a one-time pairing key. No manual IP entry. No port-forward required. Works purely on LAN.',
    },
    {
      icon: 'device-hub',
      color: C.amber,
      title: 'DEVICE LOCK',
      detail: 'After pairing, the server locks to your device\'s UUID. A second device cannot pair until you run --reset-pair on your PC. One phone, one server — by design.',
    },
    {
      icon: 'timer',
      color: C.purple,
      title: 'RATE LIMITING',
      detail: 'Built-in rate limiter: max 30 requests per 5 seconds per IP, max 150 per minute. Prevents brute-force token guessing from any device on your LAN.',
    },
    {
      icon: 'shield',
      color: C.teal,
      title: 'BODY SIZE GUARD',
      detail: 'All incoming request bodies are capped at 10MB. Scripts are capped at 200KB. Prevents memory exhaustion attacks from malformed requests.',
    },
    {
      icon: 'timer-off',
      color: C.blue,
      title: 'EXEC TIMEOUT',
      detail: 'Every Python script executed has a hard 60-second timeout via subprocess. A runaway script cannot hang the server or lock your phone out.',
    },
    {
      icon: 'no-encryption-glyph',
      color: C.red,
      title: 'LAN-ONLY BY DEFAULT',
      detail: 'The server binds to 0.0.0.0 (all interfaces) but is unreachable from the internet without a VPN or tunnel you explicitly set up. No port-forwarding = not exposed.',
    },
    {
      icon: 'manage-accounts',
      color: C.cyan,
      title: 'PROCESS GUARDIAN',
      detail: 'On startup the server kills any old instance of itself, and optionally clears blocking processes on server ports. Ensures clean single-instance operation — no zombie processes.',
    },
    {
      icon: 'firewall',
      color: C.amber,
      title: 'AUTO FIREWALL RULE',
      detail: 'On Windows, the server adds a named Windows Firewall rule for the chosen port. On Linux it uses ufw or iptables. The rule name is visible so you can remove it anytime.',
    },
    {
      icon: 'save',
      color: C.green,
      title: 'PERSISTENT SESSION',
      detail: 'Pairing state, device UUID, and session token are written to a local JSON file in your home directory. Re-running the server reconnects your phone instantly — no re-pair needed.',
    },
    {
      icon: 'compare-arrows',
      color: C.purple,
      title: 'TOKEN EXPIRY',
      detail: 'Session tokens include a UTC timestamp. Tokens older than 30 days are automatically invalidated. Both device UUID and HMAC signature must match — replayed tokens are rejected.',
    },
    {
      icon: 'privacy-tip',
      color: C.teal,
      title: 'SECRET FILE PERMISSIONS',
      detail: 'On Mac/Linux the HMAC secret file is written with chmod 600 — readable only by the owner. On Windows it is stored in your home directory, outside any shared folder.',
    },
  ];

  return (
    <View style={[sf.card, { borderColor:C.cyan+'28' }]}>
      <View style={{ height:2.5, flexDirection:'row' }}>
        {[C.cyan, C.green, C.amber, C.purple, C.teal, C.blue].map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </View>
      <HudCorners color={C.cyan+'35'} size={8} t={1} />

      <View style={{ padding:14, paddingBottom:10 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 }}>
          <View style={[sf.hdrIcon, { borderColor:C.cyan+'55', backgroundColor:C.cyan+'0D' }]}>
            <MaterialIcons name="verified-user" size={22} color={C.cyan} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[sf.hdrTitle, { color:C.cyan }]}>12 BUILT-IN SECURITY LAYERS</Text>
            <Text style={sf.hdrSub}>Every safety feature is visible in the open-source code</Text>
          </View>
          <View style={[sf.countBadge, { borderColor:C.cyan+'55', backgroundColor:C.cyan+'10' }]}>
            <Text style={[sf.countTxt, { color:C.cyan }]}>12</Text>
          </View>
        </View>

        <View style={{ gap:8 }}>
          {FEATURES.map(({ icon, color, title, detail }) => (
            <View key={title} style={[sf.feat, { borderColor:color+'28', backgroundColor:color+'05' }]}>
              <View style={[sf.featIcon, { borderColor:color+'50', backgroundColor:color+'12' }]}>
                <MaterialIcons name={icon as any} size={15} color={color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[sf.featTitle, { color }]}>{title}</Text>
                <Text style={sf.featDesc}>{detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const sf = StyleSheet.create({
  card:       { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  hdrIcon:    { width:46, height:46, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  hdrTitle:   { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  hdrSub:     { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  countBadge: { width:40, height:40, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  countTxt:   { fontFamily:MONO, fontSize:18, fontWeight:'900' },
  feat:       { flexDirection:'row', alignItems:'flex-start', gap:10, borderWidth:1, borderRadius:10, padding:11 },
  featIcon:   { width:32, height:32, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  featTitle:  { fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:0.5, marginBottom:4 },
  featDesc:   { fontFamily:SANS, fontSize:10.5, color:C.mid, lineHeight:15 },
});

// ── API Endpoint reference ────────────────────────────────────────────────────
function APIReferenceCard() {
  const endpoints = [
    { method:'GET',  path:'/api/status',           desc:'Server info, version, Ollama status, all IPs',          auth:false },
    { method:'GET',  path:'/api/metrics',           desc:'Live CPU, RAM, disk, network, top processes',           auth:false },
    { method:'GET',  path:'/api/requirements',      desc:'Python package scan — which are installed/missing',     auth:false },
    { method:'GET',  path:'/api/processes',         desc:'All running processes + port conflict map',             auth:false },
    { method:'GET',  path:'/api/sysinfo',           desc:'OS details, hostname, Python version, admin status',    auth:false },
    { method:'GET',  path:'/api/ollama/status',     desc:'Ollama availability + loaded model list',               auth:false },
    { method:'POST', path:'/pair',                  desc:'Initial QR pairing — returns HMAC session token',       auth:false },
    { method:'POST', path:'/reconnect',             desc:'Silent token refresh for returning paired device',      auth:false },
    { method:'POST', path:'/api/execute',           desc:'Execute Python script (max 200KB, 60s timeout)',        auth:true  },
    { method:'POST', path:'/api/butler/chat',       desc:'Send message to Ollama AI with conversation history',  auth:true  },
    { method:'POST', path:'/api/receive_file',      desc:'Receive base64-encoded file → saves to Desktop',       auth:true  },
    { method:'POST', path:'/api/pip/install',       desc:'Install validated pip packages (allowlist only)',       auth:true  },
    { method:'POST', path:'/api/kill_interference', desc:'Remove blocking processes from server ports',           auth:true  },
    { method:'POST', path:'/api/ollama/pull',       desc:'Pull a new Ollama model in background',                 auth:true  },
    { method:'POST', path:'/api/reset_pair',        desc:'Reset pairing — generates new code, clears lock',      auth:true  },
  ];

  return (
    <View style={[ap.card, { borderColor:C.blue+'28' }]}>
      <View style={{ height:2.5, backgroundColor:C.blue }} />
      <HudCorners color={C.blue+'35'} size={8} t={1} />
      <View style={{ padding:14, paddingBottom:10 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 }}>
          <View style={[ap.hdrIcon, { borderColor:C.blue+'55', backgroundColor:C.blue+'0D' }]}>
            <MaterialIcons name="api" size={20} color={C.blue} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[ap.hdrTitle, { color:C.blue }]}>COMPLETE API REFERENCE</Text>
            <Text style={ap.hdrSub}>{endpoints.length} endpoints · All visible in source code</Text>
          </View>
          <View style={[ap.lockBadge]}>
            <MaterialIcons name="lock" size={9} color={C.amber} />
            <Text style={ap.lockTxt}>= auth required</Text>
          </View>
        </View>
        {endpoints.map(e => (
          <EndpointRow key={e.path} method={e.method} path={e.path} desc={e.desc} color={C.text} auth={e.auth} />
        ))}
      </View>
    </View>
  );
}
const ap = StyleSheet.create({
  card:     { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  hdrIcon:  { width:42, height:42, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  hdrTitle: { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  hdrSub:   { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  lockBadge:{ flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:3, borderColor:C.amber+'45', backgroundColor:C.amber+'08' },
  lockTxt:  { fontFamily:MONO, fontSize:7.5, color:C.amber, fontWeight:'900' },
});

// ── What the server is NOT card ───────────────────────────────────────────────
function WhatIsNotCard() {
  const nopes = [
    { icon:'cloud',          label:'Not a cloud service',    desc:'No accounts, no servers, no SaaS. Runs on YOUR hardware.' },
    { icon:'analytics',      label:'Not tracking you',       desc:'Zero telemetry. No crash reports sent anywhere. No analytics.' },
    { icon:'update',         label:'Not auto-updating',      desc:'Never downloads anything without your explicit command.' },
    { icon:'person',         label:'Not accessing contacts', desc:'No access to your contacts, photos, or personal files beyond what scripts you write.' },
    { icon:'wifi',           label:'Not using the internet', desc:'All traffic is LAN-only by default. Internet = only Tailscale/Cloudflare tunnels YOU set up.' },
    { icon:'notifications',  label:'Not a background service',desc:'Runs only when you double-click it. Close the terminal = server stops.' },
  ];

  return (
    <View style={[wn.card, { borderColor:C.red+'20' }]}>
      <View style={{ height:2, backgroundColor:C.red }} />
      <HudCorners color={C.red+'30'} size={8} t={1} />
      <View style={{ padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
          <View style={[wn.iconBox, { borderColor:C.red+'50', backgroundColor:C.red+'0C' }]}>
            <MaterialIcons name="do-not-disturb" size={20} color={C.red} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[wn.title, { color:C.red }]}>WHAT THIS SERVER IS NOT</Text>
            <Text style={wn.sub}>No hidden behaviour — verified in open source code</Text>
          </View>
        </View>
        <View style={{ gap:7 }}>
          {nopes.map(({ icon, label, desc }) => (
            <View key={label} style={[wn.row, { borderColor:C.red+'20' }]}>
              <View style={[wn.rowIcon, { borderColor:C.red+'35', backgroundColor:C.red+'08' }]}>
                <MaterialIcons name={icon as any} size={14} color={C.red+'90'} />
                <MaterialIcons name="close" size={9} color={C.red} style={{ position:'absolute', bottom:-2, right:-2 }} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[wn.rowLabel]}>{label}</Text>
                <Text style={wn.rowDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const wn = StyleSheet.create({
  card:     { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  iconBox:  { width:42, height:42, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:    { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  sub:      { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  row:      { flexDirection:'row', alignItems:'flex-start', gap:10, borderWidth:1, borderRadius:8, padding:10 },
  rowIcon:  { width:32, height:32, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, position:'relative', overflow:'visible' },
  rowLabel: { fontFamily:MONO, fontSize:10, fontWeight:'700', color:C.text, marginBottom:3 },
  rowDesc:  { fontFamily:SANS, fontSize:10, color:C.mid, lineHeight:15 },
});

// ── Quick start steps ─────────────────────────────────────────────────────────
function QuickStartCard({ accent }: { accent: string }) {
  const steps = [
    {
      n:'1', color:C.cyan,
      title:'Open the source code',
      desc:'Tap VIEW SOURCE CODE above → GitHub opens the full server.py. Read it before running. Every line is there.',
      action: { label:'OPEN GITHUB', onPress: () => Linking.openURL(GITHUB_SERVER_URL).catch(() => {}) },
    },
    {
      n:'2', color:C.green,
      title:'Download the file',
      desc:'On GitHub → tap the Raw button → Save Page As to download butler_server_v21_1_1_FINAL-3.py to your PC.',
    },
    {
      n:'3', color:C.amber,
      title:'Install dependencies',
      desc:'Open terminal in the same folder and run:\npip install psutil qrcode[pil] pillow requests\n\nThe server also auto-installs on first run.',
    },
    {
      n:'4', color:C.purple,
      title:'Run the server',
      desc:'Double-click the .py file or run:\npython butler_server_v21_1_1_FINAL-3.py\n\nA QR code appears in your terminal.',
    },
    {
      n:'5', color:C.teal,
      title:'Pair your phone',
      desc:'In Butler AI app → Home tab → SCAN QR → point camera at terminal. Paired in under 3 seconds.',
    },
    {
      n:'6', color:C.blue,
      title:'Install Ollama (optional, for AI chat)',
      desc:'Download from ollama.com → run: ollama pull qwen2.5-coder:7b\n\nFree, private, runs on your CPU/GPU. No API key needed.',
      action: { label:'OLLAMA.COM', onPress: () => Linking.openURL('https://ollama.com').catch(() => {}) },
    },
  ];

  return (
    <View style={[qs.card, { borderColor:accent+'30' }]}>
      <View style={{ height:2.5, backgroundColor:accent }} />
      <HudCorners color={accent+'40'} size={8} t={1} />
      <View style={{ padding:14, paddingBottom:10 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 }}>
          <View style={[qs.hdrIcon, { borderColor:accent+'55', backgroundColor:accent+'0D' }]}>
            <MaterialIcons name="rocket-launch" size={20} color={accent} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[qs.hdrTitle, { color:accent }]}>QUICK START — 6 STEPS</Text>
            <Text style={qs.hdrSub}>From zero to paired in under 5 minutes</Text>
          </View>
        </View>
        <View style={{ gap:10 }}>
          {steps.map(({ n, color, title, desc, action }) => (
            <View key={n} style={[qs.step, { borderColor:color+'28', backgroundColor:color+'05' }]}>
              <View style={[qs.numCircle, { borderColor:color+'70', backgroundColor:color+'15' }]}>
                <Text style={[qs.num, { color }]}>{n}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={[qs.stepTitle, { color }]}>{title}</Text>
                <Text style={qs.stepDesc}>{desc}</Text>
                {action && (
                  <TouchableOpacity onPress={() => { haptics.light(); action.onPress(); }} activeOpacity={0.8}
                    style={[qs.actionBtn, { borderColor:color+'50', backgroundColor:color+'0C' }]}>
                    <MaterialIcons name="open-in-new" size={10} color={color} />
                    <Text style={[qs.actionTxt, { color }]}>{action.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const qs = StyleSheet.create({
  card:       { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  hdrIcon:    { width:42, height:42, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  hdrTitle:   { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  hdrSub:     { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  step:       { flexDirection:'row', alignItems:'flex-start', gap:10, borderWidth:1, borderRadius:10, padding:12 },
  numCircle:  { width:30, height:30, borderRadius:15, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  num:        { fontFamily:MONO, fontSize:14, fontWeight:'900' },
  stepTitle:  { fontFamily:MONO, fontSize:10, fontWeight:'900', letterSpacing:0.5, marginBottom:5 },
  stepDesc:   { fontFamily:SANS, fontSize:11, color:C.mid, lineHeight:16 },
  actionBtn:  { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:7, paddingHorizontal:9, paddingVertical:5, marginTop:8, alignSelf:'flex-start' },
  actionTxt:  { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.3 },
});

// ── Version info card ─────────────────────────────────────────────────────────
function VersionInfoCard() {
  const commits = [
    { ver:'v21.1.1', label:'CURRENT', color:C.green,  date:'Latest',    note:'Butler server — final production build with full API, HMAC auth, Ollama chat, file transfer' },
    { ver:'v7.0.0',  label:'STABLE',  color:C.cyan,   date:'Previous',  note:'Bulletproof edition — auto-admin, kill old instances, requirements scan, process guardian' },
    { ver:'v5.x',    label:'LEGACY',  color:C.amber,  date:'Archived',  note:'Initial release — basic execute + pair flow, no HMAC, no beacon' },
  ];
  return (
    <View style={[vi.card, { borderColor:C.purple+'25' }]}>
      <View style={{ height:2.5, backgroundColor:C.purple }} />
      <HudCorners color={C.purple+'35'} size={8} t={1} />
      <View style={{ padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
          <View style={[vi.hdrIcon, { borderColor:C.purple+'55', backgroundColor:C.purple+'0D' }]}>
            <MaterialCommunityIcons name="source-branch" size={20} color={C.purple} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[vi.hdrTitle, { color:C.purple }]}>VERSION HISTORY</Text>
            <Text style={vi.hdrSub}>Full commit history available on GitHub</Text>
          </View>
          <TouchableOpacity onPress={() => { haptics.light(); Linking.openURL(GITHUB_REPO_URL+'/commits').catch(() => {}); }}
            style={[vi.ghBtn]} activeOpacity={0.8}>
            <MaterialCommunityIcons name="github" size={12} color={C.purple} />
            <Text style={[vi.ghTxt]}>COMMITS</Text>
          </TouchableOpacity>
        </View>
        {commits.map(({ ver, label, color, date, note }) => (
          <View key={ver} style={[vi.row, { borderColor:color+'25' }]}>
            <View style={[vi.verBadge, { borderColor:color+'55', backgroundColor:color+'10' }]}>
              <Text style={[vi.verTxt, { color }]}>{ver}</Text>
            </View>
            <View style={{ flex:1 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <View style={[vi.labelPill, { borderColor:color+'40', backgroundColor:color+'0A' }]}>
                  <Text style={[vi.labelTxt, { color }]}>{label}</Text>
                </View>
                <Text style={vi.dateTxt}>{date}</Text>
              </View>
              <Text style={vi.noteTxt}>{note}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const vi = StyleSheet.create({
  card:       { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  hdrIcon:    { width:42, height:42, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  hdrTitle:   { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  hdrSub:     { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  ghBtn:      { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7, paddingHorizontal:8, paddingVertical:5, borderColor:C.purple+'45', backgroundColor:C.purple+'0A' },
  ghTxt:      { fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.purple },
  row:        { flexDirection:'row', alignItems:'flex-start', gap:10, borderWidth:1, borderRadius:9, padding:10, marginBottom:7 },
  verBadge:   { borderWidth:1.5, borderRadius:7, paddingHorizontal:8, paddingVertical:5, alignSelf:'flex-start', flexShrink:0 },
  verTxt:     { fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:0.5 },
  labelPill:  { borderWidth:1, borderRadius:5, paddingHorizontal:6, paddingVertical:2 },
  labelTxt:   { fontFamily:MONO, fontSize:7.5, fontWeight:'900', letterSpacing:0.5 },
  dateTxt:    { fontFamily:MONO, fontSize:8, color:C.dim },
  noteTxt:    { fontFamily:SANS, fontSize:10, color:C.mid, lineHeight:15, marginTop:4 },
});

// ── System requirements card ──────────────────────────────────────────────────
function SystemRequirementsCard() {
  const reqs = [
    { icon:'computer',    color:C.cyan,   label:'Python 3.8+',   note:'Windows/Mac/Linux · pip included' },
    { icon:'memory',      color:C.green,  label:'psutil',        note:'CPU/RAM/disk metrics' },
    { icon:'qr-code',     color:C.amber,  label:'qrcode[pil]',   note:'QR code generation + PIL' },
    { icon:'http',        color:C.purple, label:'requests',      note:'HTTP client for Ollama' },
    { icon:'psychology',  color:C.teal,   label:'Ollama (opt.)', note:'ollama.com — AI chat, 100% local' },
  ];
  return (
    <View style={[sr2.card, { borderColor:C.amber+'25' }]}>
      <View style={{ height:2.5, backgroundColor:C.amber }} />
      <HudCorners color={C.amber+'35'} size={8} t={1} />
      <View style={{ padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
          <View style={[sr2.hdrIcon, { borderColor:C.amber+'55', backgroundColor:C.amber+'0D' }]}>
            <MaterialIcons name="check-circle" size={20} color={C.amber} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[sr2.hdrTitle, { color:C.amber }]}>SYSTEM REQUIREMENTS</Text>
            <Text style={sr2.hdrSub}>Auto-installed on first run (pip)</Text>
          </View>
        </View>
        <View style={{ gap:7 }}>
          {reqs.map(({ icon, color, label, note }) => (
            <View key={label} style={[sr2.row, { borderColor:color+'28' }]}>
              <View style={[sr2.rowIcon, { borderColor:color+'50', backgroundColor:color+'0C' }]}>
                <MaterialIcons name={icon as any} size={16} color={color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[sr2.rowLabel, { color }]}>{label}</Text>
                <Text style={sr2.rowNote}>{note}</Text>
              </View>
              <View style={[sr2.okBadge, { borderColor:color+'45', backgroundColor:color+'0A' }]}>
                <MaterialIcons name="check" size={10} color={color} />
              </View>
            </View>
          ))}
        </View>
        <View style={[sr2.cmdBox]}>
          <Text style={sr2.cmdLabel}>INSTALL ALL AT ONCE</Text>
          <Text style={sr2.cmd}>pip install psutil qrcode[pil] pillow requests</Text>
        </View>
      </View>
    </View>
  );
}
const sr2 = StyleSheet.create({
  card:     { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  hdrIcon:  { width:42, height:42, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  hdrTitle: { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  hdrSub:   { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  row:      { flexDirection:'row', alignItems:'center', gap:10, borderWidth:1, borderRadius:9, padding:11 },
  rowIcon:  { width:34, height:34, borderRadius:8, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  rowLabel: { fontFamily:MONO, fontSize:10, fontWeight:'900' },
  rowNote:  { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  okBadge:  { width:24, height:24, borderRadius:6, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  cmdBox:   { marginTop:12, backgroundColor:C.bg, borderRadius:10, borderWidth:1.5, borderColor:C.amber+'30', padding:12 },
  cmdLabel: { fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.amber, letterSpacing:1.5, marginBottom:6 },
  cmd:      { fontFamily:MONO, fontSize:11, color:C.text, lineHeight:16 },
});

// ── Main exported component ───────────────────────────────────────────────────
interface Props { accentColor?: string; }

export default function DownloadButtons({ accentColor = C.cyan }: Props) {
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue:1,   duration:1600, useNativeDriver:false }),
      Animated.timing(glowAnim, { toValue:0.2, duration:1600, useNativeDriver:false }),
    ]));
    l.start(); return () => l.stop();
  }, []);

  const openGithub = useCallback(() => {
    haptics.medium();
    Linking.openURL(GITHUB_SERVER_URL).catch(() => {
      Alert.alert('Open Failed', 'Visit: github.com/shawnjan-cmd/butler-server');
    });
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding:16, paddingBottom:40, gap:0 }}
    >
      {/* ── PAGE TITLE ── */}
      <View style={{ marginBottom:16 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
          <View style={{ width:4, height:18, borderRadius:2, backgroundColor:C.cyan }} />
          <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.cyan+'70', letterSpacing:3 }}>SERVER DOWNLOAD CENTER</Text>
        </View>
        <Text style={{ fontFamily:MONO, fontSize:21, fontWeight:'900', color:'#FFFFFF', letterSpacing:1, lineHeight:26 }}>
          BUTLER <Text style={{ color:C.cyan }}>SERVER</Text>
        </Text>
        <Text style={{ fontFamily:SANS, fontSize:13, color:C.mid, lineHeight:19, marginTop:6 }}>
          Open-source Python server that runs on your PC. Every line of code is publicly readable on GitHub — no surprises, no hidden behaviour.
        </Text>

        {/* Quick trust badges */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:12 }}>
          {[
            { icon:'code',      label:'Open Source',  col:C.cyan   },
            { icon:'lock',      label:'HMAC Auth',    col:C.green  },
            { icon:'cloud-off', label:'Zero Cloud',   col:C.amber  },
            { icon:'visibility',label:'Auditable',    col:C.purple },
          ].map(({ icon, label, col }) => (
            <View key={label} style={[{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1.5, borderRadius:9, paddingHorizontal:10, paddingVertical:7, borderColor:col+'45', backgroundColor:col+'09' }]}>
              <MaterialIcons name={icon as any} size={12} color={col} />
              <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:col }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── HERO CARD ── */}
      <HeroDownloadCard onPress={openGithub} glowAnim={glowAnim} />

      {/* ── SAFETY BADGES ROW ── */}
      <SectionLabel icon="verified-user" label="TRUST INDICATORS" color={C.green} />
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 }}>
        <SafetyBadge icon="code"          label="FULLY READABLE" sub="Single Python file — inspect before run" color={C.cyan} />
        <SafetyBadge icon="visibility"    label="PUBLIC REPO"    sub="github.com/shawnjan-cmd/butler-server"    color={C.green} />
        <SafetyBadge icon="cloud-off"     label="NO OUTBOUND"    sub="Zero calls to any external server"        color={C.amber} />
        <SafetyBadge icon="lock"          label="HMAC-SHA256"    sub="Cryptographically signed sessions"        color={C.purple} />
        <SafetyBadge icon="history"       label="COMMIT HISTORY" sub="Every change tracked on GitHub"           color={C.teal} />
        <SafetyBadge icon="devices-other" label="ONE DEVICE LOCK" sub="Pairs to exactly one phone UUID"         color={C.blue} />
      </View>

      {/* ── OPEN SOURCE TRUST ── */}
      <SectionLabel icon="shield-check" label="WHY YOU CAN TRUST IT" color={C.green} iconLib="community" />
      <OpenSourceTrustCard />

      {/* ── SECURITY FEATURES ── */}
      <SectionLabel icon="security" label="12 SECURITY LAYERS" color={C.cyan} />
      <SafetyFeaturesCard />

      {/* ── WHAT IT IS NOT ── */}
      <SectionLabel icon="do-not-disturb" label="WHAT IT DOES NOT DO" color={C.red} />
      <WhatIsNotCard />

      {/* ── QUICK START ── */}
      <SectionLabel icon="rocket-launch" label="QUICK START GUIDE" color={accentColor} />
      <QuickStartCard accent={accentColor} />

      {/* ── REQUIREMENTS ── */}
      <SectionLabel icon="check-circle" label="SYSTEM REQUIREMENTS" color={C.amber} />
      <SystemRequirementsCard />

      {/* ── API REFERENCE ── */}
      <SectionLabel icon="api" label="API ENDPOINTS" color={C.blue} />
      <APIReferenceCard />

      {/* ── VERSION HISTORY ── */}
      <SectionLabel icon="source-branch" label="VERSION HISTORY" color={C.purple} iconLib="community" />
      <VersionInfoCard />

      {/* ── PLATFORM COMPAT ── */}
      <SectionLabel icon="computer" label="PLATFORM SUPPORT" color={C.teal} />
      <View style={[plat.card, { borderColor:C.teal+'25' }]}>
        <View style={{ height:2, backgroundColor:C.teal }} />
        <HudCorners color={C.teal+'35'} size={7} t={1} />
        <View style={{ padding:14, gap:8 }}>
          {[
            { icon:'computer',  col:C.blue,  os:'Windows 10/11', note:'Full support · auto firewall · admin elevation · startup registration · .bat/.ps1 installer' },
            { icon:'laptop-mac',col:C.cyan,  os:'macOS 12+',     note:'Full support · bash installer · pbcopy clipboard bridge · launchd startup (manual)' },
            { icon:'dns',       col:C.green, os:'Linux / Ubuntu', note:'Full support · ufw/iptables firewall · xclip clipboard bridge · systemd startup (manual)' },
            { icon:'devices',   col:C.amber, os:'Raspberry Pi',  note:'Full support on Pi OS · lightweight server · perfect for always-on home automation' },
          ].map(({ icon, col, os, note }) => (
            <View key={os} style={[plat.row, { borderColor:col+'28', backgroundColor:col+'06' }]}>
              <View style={[plat.rowIcon, { borderColor:col+'50', backgroundColor:col+'12' }]}>
                <MaterialIcons name={icon as any} size={16} color={col} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[plat.osName, { color:col }]}>{os}</Text>
                <Text style={plat.osNote}>{note}</Text>
              </View>
              <View style={[plat.checkBadge, { borderColor:col+'45', backgroundColor:col+'0A' }]}>
                <MaterialIcons name="check" size={12} color={col} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── FOOTER OPEN SOURCE NOTE ── */}
      <View style={[footer.wrap, { borderColor:C.cyan+'20' }]}>
        <View style={{ height:1.5, backgroundColor:C.cyan, marginBottom:12 }} />
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
          <MaterialCommunityIcons name="github" size={22} color={C.cyan} />
          <View style={{ flex:1 }}>
            <Text style={[footer.title, { color:C.cyan }]}>100% OPEN SOURCE — FOREVER</Text>
            <Text style={footer.sub}>No licence fees. No account required. No expiry.</Text>
          </View>
        </View>
        <Text style={footer.body}>
          {'This server will always be free and open source. Fork it, modify it, self-host it. The only requirement is that you keep it for personal use on your own machines — not for distributing to others as a commercial service.'}
        </Text>
        <TouchableOpacity
          onPress={() => { haptics.medium(); Linking.openURL(GITHUB_REPO_URL).catch(() => {}); }}
          activeOpacity={0.85}
          style={[footer.ghBtn, { borderColor:C.cyan+'55', backgroundColor:C.cyan+'0C' }]}
        >
          <MaterialCommunityIcons name="github" size={16} color={C.cyan} />
          <Text style={[footer.ghTxt, { color:C.cyan }]}>github.com/shawnjan-cmd/butler-server</Text>
          <MaterialIcons name="open-in-new" size={12} color={C.cyan+'80'} />
        </TouchableOpacity>
        <View style={{ height:1.5, backgroundColor:C.cyan+'30', marginTop:12 }} />
        <Text style={footer.credit}>Butler AI · Server v21.1.1 · Zero Cloud · Open Source</Text>
      </View>
    </ScrollView>
  );
}

const plat = StyleSheet.create({
  card:      { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, overflow:'hidden', marginBottom:10, position:'relative' },
  row:       { flexDirection:'row', alignItems:'center', gap:10, borderWidth:1, borderRadius:10, padding:11 },
  rowIcon:   { width:36, height:36, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  osName:    { fontFamily:MONO, fontSize:11, fontWeight:'900', marginBottom:3 },
  osNote:    { fontFamily:SANS, fontSize:10, color:C.mid, lineHeight:15 },
  checkBadge:{ width:28, height:28, borderRadius:7, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
});

const footer = StyleSheet.create({
  wrap:   { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, padding:16, marginBottom:10, position:'relative', overflow:'hidden' },
  title:  { fontFamily:MONO, fontSize:11, fontWeight:'900', letterSpacing:0.8 },
  sub:    { fontFamily:MONO, fontSize:8, color:C.mid, marginTop:2 },
  body:   { fontFamily:SANS, fontSize:12, color:C.mid, lineHeight:18, marginBottom:12 },
  ghBtn:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1.5, borderRadius:10, paddingVertical:13 },
  ghTxt:  { fontFamily:MONO, fontSize:10, fontWeight:'700' },
  credit: { fontFamily:MONO, fontSize:8, color:C.dim, textAlign:'center', marginTop:10, letterSpacing:1 },
});
