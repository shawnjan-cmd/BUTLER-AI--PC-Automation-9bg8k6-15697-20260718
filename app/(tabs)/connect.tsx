/**
 * CONNECT SCREEN — Butler AI Server Download & Pairing Hub v3.0
 * Completely rebuilt: premium PC server download page + pairing wizard.
 * • Download server section with platform cards (Windows/Mac/Linux)
 * • Step-by-step setup wizard with animated progress
 * • Live connection status HUD with latency probe
 * • QR scan shortcut CTA
 * • Version badge + server info
 * • Ollama integration guide
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { CompactPageHeader } from '@/components/ui/CompactPageHeader';
import {
  DEFAULT_CONFIG, buildBaseUrl, loadConfig, pingServer, saveConfig,
  type ServerConfig,
} from '@/services/connection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const C = {
  bg:      '#020810',
  surface: '#07111C',
  card:    '#09152A',
  dark:    '#030810',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  amber:   '#FFB020',
  red:     '#FF3344',
  purple:  '#CC44FF',
  pink:    '#FF6EB4',
  blue:    '#4A9EFF',
  text:    '#D4E8F6',
  textMid: '#4A6A88',
  textDim: '#1E3050',
  border:  'rgba(0,229,255,0.14)',
};

type Status = 'idle' | 'testing' | 'ok' | 'fail';

// ── SETUP STEPS ─────────────────────────────────────────────────────
const STEPS = [
  {
    n: 1, icon: 'download-box', col: C.cyan,
    title: 'Download Butler Server',
    desc: 'Get the free Python server for your PC',
  },
  {
    n: 2, icon: 'console', col: C.amber,
    title: 'Run on Your PC',
    desc: 'Double-click or: python butler_server.py',
  },
  {
    n: 3, icon: 'qrcode-scan', col: C.green,
    title: 'Scan QR Code',
    desc: 'Go to HOME tab → Pair PC → point camera at QR',
  },
  {
    n: 4, icon: 'check-circle', col: C.purple,
    title: 'Paired & Ready',
    desc: 'Full automation + AI chat unlocked',
  },
];

// ── PLATFORM CARDS ──────────────────────────────────────────────────
const PLATFORMS = [
  {
    icon:'microsoft-windows', label:'Windows', sub:'v5.0.0',
    col:'#4A9EFF', badge:'RECOMMENDED',
    desc:'One-click .exe installer. Works on Win 10/11.',
    cmd:'butler_server_v5.exe',
  },
  {
    icon:'apple', label:'macOS', sub:'v5.0.0',
    col:C.textMid, badge:'',
    desc:'Python script. Requires Python 3.9+.',
    cmd:'python butler_server.py',
  },
  {
    icon:'penguin', label:'Linux', sub:'v5.0.0',
    col:C.green, badge:'',
    desc:'Full support. systemd service included.',
    cmd:'python3 butler_server.py',
  },
];

// ── SMALL SECTION HEADER ────────────────────────────────────────────
function SHdr({ icon, label, col, right }: { icon:string; label:string; col:string; right?:React.ReactNode }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:12 }}>
      <View style={{ width:3, height:17, borderRadius:2, backgroundColor:col }} />
      <MaterialCommunityIcons name={icon as any} size={11} color={col} />
      <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:col+'+CC',
        letterSpacing:1.8, flex:1 }}>{label}</Text>
      {right}
      <View style={{ height:1, width:20, backgroundColor:col+'20' }} />
    </View>
  );
}

// ── PLATFORM DOWNLOAD CARD ──────────────────────────────────────────
function PlatformCard({ data, onDownload }: {
  data: typeof PLATFORMS[0];
  onDownload: () => void;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scaleA, { toValue:0.97, tension:400, friction:12, useNativeDriver:true }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue:1,    tension:280, friction:10, useNativeDriver:true }).start();
  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={() => { haptics.medium(); onDownload(); }}>
      <Animated.View style={[pdc.wrap, {
        borderColor:data.col + (data.badge ? '60' : '30'),
        backgroundColor:data.col+'07',
        transform:[{scale:scaleA}],
      }]}>
        <View style={[pdc.topBar, { backgroundColor:data.col }]} />
        {/* Corner ticks */}
        {[{top:2,left:2},{top:2,right:2},{bottom:2,left:2},{bottom:2,right:2}].map((p,i)=>(
          <View key={i} style={[{
            position:'absolute', width:7, height:7,
            borderTopWidth:    'top' in p ? 1.5:0,
            borderBottomWidth: 'bottom' in p ? 1.5:0,
            borderLeftWidth:   'left' in p ? 1.5:0,
            borderRightWidth:  'right' in p ? 1.5:0,
            borderColor:data.col+'60', zIndex:2,
          }, p as any]} />
        ))}
        <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14 }}>
          <View style={[pdc.icon, { borderColor:data.col+'55', backgroundColor:data.col+'0E' }]}>
            <MaterialCommunityIcons name={data.icon as any} size={26} color={data.col} />
          </View>
          <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
              <Text style={[pdc.label, { color:data.col }]}>{data.label}</Text>
              <Text style={[pdc.sub, { color:data.col+'70' }]}>{data.sub}</Text>
              {data.badge ? (
                <View style={[pdc.badge, { borderColor:data.col, backgroundColor:data.col+'15' }]}>
                  <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:data.col }}>{data.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={pdc.desc} numberOfLines={1}>{data.desc}</Text>
            {/* Command preview */}
            <View style={[pdc.cmd, { borderColor:data.col+'30', backgroundColor:data.col+'08' }]}>
              <MaterialIcons name="terminal" size={9} color={data.col+'70'} />
              <Text style={[pdc.cmdTxt, { color:data.col+'AA' }]} numberOfLines={1}>{data.cmd}</Text>
            </View>
          </View>
          <View style={[pdc.dlBtn, { borderColor:data.col+'60', backgroundColor:data.col+'12' }]}>
            <MaterialIcons name="file-download" size={18} color={data.col} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
const pdc = StyleSheet.create({
  wrap:    { borderRadius:14, borderWidth:1.5, overflow:'hidden', position:'relative',
             ...(Platform.OS==='ios'?{shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.25,shadowRadius:10}:{elevation:4}) },
  topBar:  { position:'absolute', top:0, left:0, right:0, height:2.5 },
  icon:    { width:54, height:54, borderRadius:14, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  label:   { fontFamily:MONO, fontSize:14, fontWeight:'900', letterSpacing:0.5 },
  sub:     { fontFamily:MONO, fontSize:9.5 },
  badge:   { borderWidth:1.5, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  desc:    { fontFamily:SANS, fontSize:11.5, color:'#4A6A88', marginTop:3 },
  cmd:     { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:6,
             paddingHorizontal:7, paddingVertical:4, marginTop:6, alignSelf:'flex-start' },
  cmdTxt:  { fontFamily:MONO, fontSize:9 },
  dlBtn:   { width:44, height:44, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
});

// ── SETUP STEP COMPONENT ────────────────────────────────────────────
function SetupStep({ step, active, done }: {
  step: typeof STEPS[0]; active: boolean; done: boolean;
}) {
  const glowA = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!active) { glowA.setValue(done ? 1 : 0.3); return; }
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue:1,   duration:800, useNativeDriver:false }),
      Animated.timing(glowA, { toValue:0.3, duration:800, useNativeDriver:false }),
    ]));
    l.start(); return () => l.stop();
  }, [active, done]);

  const col = done ? C.green : active ? step.col : C.textDim;
  const bg  = done ? C.green+'0A' : active ? step.col+'0C' : 'transparent';

  return (
    <View style={[ss.wrap, { borderColor:col+(active?'55':'28'), backgroundColor:bg }]}>
      {active && <View style={[ss.activeLine, { backgroundColor:step.col }]} />}
      <View style={[ss.numBox, { borderColor:col+'60', backgroundColor:col+'10' }]}>
        {done
          ? <MaterialIcons name="check" size={16} color={C.green} />
          : <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:col }}>{step.n}</Text>
        }
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:col, letterSpacing:0.3 }}>
          {step.title}
        </Text>
        <Text style={{ fontFamily:SANS, fontSize:11.5, color:active?C.textMid:C.textDim, marginTop:3, lineHeight:16 }}>
          {step.desc}
        </Text>
      </View>
      <View style={[ss.iconBox, { borderColor:col+'40', backgroundColor:col+'08' }]}>
        <MaterialCommunityIcons name={step.icon as any} size={18} color={col} />
      </View>
    </View>
  );
}
const ss = StyleSheet.create({
  wrap:    { flexDirection:'row', alignItems:'center', gap:12, borderRadius:12, borderWidth:1.5, padding:13, position:'relative', overflow:'hidden' },
  activeLine:{ position:'absolute', left:0, top:0, bottom:0, width:3.5, borderTopLeftRadius:12, borderBottomLeftRadius:12 },
  numBox:  { width:36, height:36, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  iconBox: { width:38, height:38, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
});

// ── CONNECTION STATUS HUD ───────────────────────────────────────────
function ConnectionHUD({ status, latency }: { status:Status; latency:number }) {
  const pulseA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (status !== 'ok') { pulseA.setValue(0.4); return; }
    const l = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue:1,   duration:800, useNativeDriver:true }),
      Animated.timing(pulseA, { toValue:0.2, duration:800, useNativeDriver:true }),
    ]));
    l.start(); return () => l.stop();
  }, [status]);

  if (status === 'idle') return null;

  const col   = status === 'ok' ? C.green : status === 'fail' ? C.red : C.amber;
  const icon  = status === 'ok' ? 'check-circle' : status === 'fail' ? 'alert-circle' : 'wifi-sync';
  const msg   = status === 'ok'
    ? `Server reachable — ${latency}ms response`
    : status === 'fail'
    ? 'Connection failed — check IP, port, and server is running'
    : 'Probing server…';

  return (
    <View style={[hud.wrap, { borderColor:col+'50', backgroundColor:col+'09' }]}>
      <View style={[hud.bar, { backgroundColor:col }]} />
      <View style={{ flexDirection:'row', alignItems:'flex-start', gap:10, padding:13 }}>
        <MaterialCommunityIcons name={icon as any} size={16} color={col} style={{ marginTop:1 }} />
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:col, letterSpacing:0.4, marginBottom:3 }}>
            {status === 'ok' ? 'SERVER ONLINE' : status === 'fail' ? 'CONNECTION FAILED' : 'PROBING…'}
          </Text>
          <Text style={{ fontFamily:SANS, fontSize:12, color:status==='ok'?C.textMid:col+'AA', lineHeight:17 }}>
            {msg}
          </Text>
        </View>
        {status === 'ok' && (
          <View style={[hud.liveChip, { borderColor:C.green+'55' }]}>
            <Animated.View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green, opacity:pulseA }} />
            <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:C.green }}>LIVE</Text>
          </View>
        )}
      </View>
    </View>
  );
}
const hud = StyleSheet.create({
  wrap:     { borderRadius:12, borderWidth:1.5, overflow:'hidden' },
  bar:      { height:2.5 },
  liveChip: { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:6,
              paddingHorizontal:7, paddingVertical:3, alignSelf:'flex-start', marginTop:2 },
});

// ── NEXUS INPUT FIELD ────────────────────────────────────────────────
function NexusField({ label, icon, hint, ...rest }: {
  label:string; icon:string; hint?:string;
} & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const borderA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(borderA, { toValue:focused?1:0, duration:200, useNativeDriver:false }).start();
  }, [focused]);
  const borderC = borderA.interpolate({ inputRange:[0,1], outputRange:[C.cyan+'28',C.cyan+'CC'] });
  return (
    <View style={{ gap:6 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
        <MaterialIcons name={icon as any} size={10} color={C.cyan+'70'} />
        <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:C.cyan+'80', letterSpacing:1.2, flex:1 }}>{label}</Text>
        {hint ? <Text style={{ fontFamily:MONO, fontSize:9, color:C.textDim }}>{hint}</Text> : null}
      </View>
      <Animated.View style={[nf2.box, { borderColor:borderC,
        ...(Platform.OS==='ios'&&focused?{shadowColor:C.cyan,shadowOffset:{width:0,height:0},shadowOpacity:0.35,shadowRadius:8}:{}),
      }]}>
        {focused && (
          <>
            <View style={[nf2.corner,{top:2,left:2,borderTopWidth:1,borderLeftWidth:1,borderColor:C.cyan}]} />
            <View style={[nf2.corner,{top:2,right:2,borderTopWidth:1,borderRightWidth:1,borderColor:C.cyan}]} />
            <View style={[nf2.corner,{bottom:2,left:2,borderBottomWidth:1,borderLeftWidth:1,borderColor:C.cyan}]} />
            <View style={[nf2.corner,{bottom:2,right:2,borderBottomWidth:1,borderRightWidth:1,borderColor:C.cyan}]} />
          </>
        )}
        <TextInput {...rest} style={nf2.input} placeholderTextColor={C.textDim}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      </Animated.View>
    </View>
  );
}
const nf2 = StyleSheet.create({
  box:    { borderWidth:1.5, borderRadius:12, backgroundColor:C.card, position:'relative', overflow:'hidden' },
  corner: { position:'absolute', width:7, height:7 },
  input:  { fontFamily:MONO, fontSize:14, color:C.text, paddingHorizontal:14, paddingVertical:12 },
});

// ── OLLAMA SECTION ──────────────────────────────────────────────────
function OllamaCard() {
  const steps = [
    { cmd:'curl -fsSL https://ollama.ai/install.sh | sh', label:'Install Ollama', col:C.cyan },
    { cmd:'ollama pull llama3:8b',                        label:'Download AI model', col:C.amber },
    { cmd:'(runs automatically with butler_server.py)',   label:'Ollama starts auto', col:C.green },
  ];
  return (
    <View style={[ol.wrap]}>
      <View style={[ol.topBar, { backgroundColor:C.purple }]} />
      <View style={{ padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
          <View style={[ol.icon, { borderColor:C.purple+'60', backgroundColor:C.purple+'0E' }]}>
            <MaterialCommunityIcons name="brain" size={20} color={C.purple} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:C.purple, letterSpacing:0.5 }}>
              OLLAMA — LOCAL AI ENGINE
            </Text>
            <Text style={{ fontFamily:SANS, fontSize:11, color:C.textMid, marginTop:2 }}>
              Powers the AI chat tab. 100% on your hardware.
            </Text>
          </View>
          <View style={[ol.badge, { borderColor:C.green+'60', backgroundColor:C.green+'0A' }]}>
            <MaterialIcons name="lock" size={9} color={C.green} />
            <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:C.green }}>PRIVATE</Text>
          </View>
        </View>
        {steps.map((s,i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:10,
            borderLeftWidth:2, borderLeftColor:s.col+'50', paddingLeft:10, marginBottom:i<steps.length-1?10:0 }}>
            <View style={{ width:20, height:20, borderRadius:10, backgroundColor:s.col+'15',
              alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
              <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:s.col }}>{i+1}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:s.col }}>{s.label}</Text>
              <View style={[ol.cmdBox, { borderColor:s.col+'30', backgroundColor:s.col+'07' }]}>
                <MaterialIcons name="code" size={9} color={s.col+'70'} />
                <Text style={{ fontFamily:MONO, fontSize:10, color:s.col+'BB', flex:1 }}
                  numberOfLines={1}>{s.cmd}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const ol = StyleSheet.create({
  wrap:    { borderRadius:14, borderWidth:1.5, borderColor:C.purple+'35',
             backgroundColor:C.purple+'05', overflow:'hidden' },
  topBar:  { height:2.5 },
  icon:    { width:48, height:48, borderRadius:13, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  badge:   { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderRadius:7,
             paddingHorizontal:7, paddingVertical:3, flexShrink:0, alignSelf:'flex-start' },
  cmdBox:  { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:6,
             paddingHorizontal:8, paddingVertical:5, marginTop:4 },
});

// ── GITHUB CTA ──────────────────────────────────────────────────────
function GitHubCTA() {
  return (
    <Pressable
      onPress={() => { haptics.medium(); Linking.openURL('https://github.com/butlerai/butler-server/releases').catch(()=>{}); }}
      style={({ pressed }) => [gh.wrap, {
        borderColor: pressed ? C.cyan : C.cyan+'45',
        backgroundColor: pressed ? C.cyan+'15' : C.cyan+'08',
        opacity: pressed ? 0.9 : 1,
      }]}>
      <View style={[gh.topBar, { backgroundColor:C.cyan }]} />
      <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:16 }}>
        <View style={[gh.icon, { borderColor:C.cyan+'55', backgroundColor:C.cyan+'0E' }]}>
          <MaterialCommunityIcons name="github" size={28} color={C.cyan} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:C.cyan, letterSpacing:0.5 }}>
            DOWNLOAD BUTLER SERVER
          </Text>
          <Text style={{ fontFamily:SANS, fontSize:12, color:C.textMid, marginTop:3, lineHeight:17 }}>
            Free forever · Open source · No account needed
          </Text>
          <View style={{ flexDirection:'row', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {['v5.0.0','MIT LICENSE','⭐ FREE'].map((b,i) => (
              <View key={i} style={[gh.chip, { borderColor:C.cyan+'35', backgroundColor:C.cyan+'08' }]}>
                <Text style={{ fontFamily:MONO, fontSize:8, color:C.cyan+'BB', fontWeight:'900' }}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[gh.dlIcon, { borderColor:C.cyan+'60', backgroundColor:C.cyan+'12' }]}>
          <MaterialIcons name="open-in-new" size={20} color={C.cyan} />
        </View>
      </View>
    </Pressable>
  );
}
const gh = StyleSheet.create({
  wrap:    { borderRadius:16, borderWidth:1.5, overflow:'hidden', position:'relative',
             ...(Platform.OS==='ios'?{shadowColor:C.cyan,shadowOffset:{width:0,height:6},shadowOpacity:0.3,shadowRadius:16}:{elevation:8}) },
  topBar:  { position:'absolute', top:0, left:0, right:0, height:3 },
  icon:    { width:58, height:58, borderRadius:16, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  chip:    { borderWidth:1.5, borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  dlIcon:  { width:46, height:46, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
});

// ── QR SHORTCUT BANNER ──────────────────────────────────────────────
function QRBanner() {
  const pulseA = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue:1,   duration:900, useNativeDriver:true }),
      Animated.timing(pulseA, { toValue:0.25, duration:900, useNativeDriver:true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return (
    <View style={qrb.wrap}>
      <View style={[qrb.bar, { backgroundColor:C.green }]} />
      <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:13 }}>
        <View style={[qrb.icon, { borderColor:C.green+'60', backgroundColor:C.green+'0D' }]}>
          <MaterialCommunityIcons name="qrcode-scan" size={22} color={C.green} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:C.green, letterSpacing:0.5 }}>
            FASTER: QR AUTO-PAIR
          </Text>
          <Text style={{ fontFamily:SANS, fontSize:12, color:C.textMid, marginTop:3, lineHeight:16 }}>
            {'Server shows a QR code in terminal.\nGo HOME tab → tap ⚡ PAIR PC → scan it.'}
          </Text>
        </View>
        <Animated.View style={{ width:8, height:8, borderRadius:4,
          backgroundColor:C.green, opacity:pulseA, flexShrink:0 }} />
      </View>
    </View>
  );
}
const qrb = StyleSheet.create({
  wrap: { borderRadius:12, borderWidth:1.5, borderColor:C.green+'45',
          backgroundColor:C.green+'07', overflow:'hidden' },
  bar:  { height:2.5 },
  icon: { width:46, height:46, borderRadius:13, borderWidth:1.5, alignItems:'center',
          justifyContent:'center', flexShrink:0 },
});

// ══════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════
function ConnectScreenInner() {
  const insets = useSafeAreaInsets();
  const [cfg, setCfg]         = useState<ServerConfig>(DEFAULT_CONFIG);
  const [status, setStatus]   = useState<Status>('idle');
  const [saved,  setSaved]    = useState(false);
  const [latency, setLatency] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => { loadConfig().then(cfg => { setCfg(cfg); if (cfg.host) setActiveStep(2); }); }, []);

  const update = useCallback(<K extends keyof ServerConfig>(k: K, v: ServerConfig[K]) => {
    setCfg(c => ({ ...c, [k]:v })); setSaved(false); setStatus('idle');
  }, []);

  const onSave = useCallback(async () => {
    haptics.medium(); await saveConfig(cfg); setSaved(true); haptics.success();
    setActiveStep(3);
  }, [cfg]);

  const onTest = useCallback(async () => {
    haptics.light(); setStatus('testing');
    const t0 = Date.now();
    const ok = await pingServer(cfg);
    setLatency(Date.now() - t0);
    setStatus(ok ? 'ok' : 'fail');
    if (ok) { haptics.success(); setActiveStep(4); } else haptics.warning();
  }, [cfg]);

  const connCol = status === 'ok' ? C.green : status === 'fail' ? C.red : C.cyan;

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <CompactPageHeader
        title="PC SERVER"
        subtitle="Download · Install · Pair"
        badge={status === 'ok' ? 'LIVE' : status === 'fail' ? 'ERR' : 'SETUP'}
        badgeColor={connCol}
        icon="server-network"
        iconLib="community"
        safeTop={insets.top}
        accent={C.cyan}
        isConnected={status === 'ok'}
      />

      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={{ padding:14, gap:14, paddingBottom:100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── GitHub Download CTA ── */}
        <GitHubCTA />

        {/* ── QR Shortcut ── */}
        <QRBanner />

        {/* ── Platform cards ── */}
        <View>
          <SHdr icon="download-circle" label="DOWNLOAD FOR YOUR OS" col={C.blue} />
          <View style={{ gap:8 }}>
            {PLATFORMS.map((p,i) => (
              <PlatformCard key={i} data={p}
                onDownload={() => Linking.openURL('https://github.com/butlerai/butler-server/releases').catch(()=>{})} />
            ))}
          </View>
        </View>

        {/* ── Setup wizard ── */}
        <View>
          <SHdr icon="format-list-numbered" label="SETUP WIZARD" col={C.amber}
            right={
              <View style={{ flexDirection:'row', gap:4 }}>
                {STEPS.map((_,i) => (
                  <View key={i} style={{ width:i+1<=activeStep?18:8, height:4, borderRadius:2,
                    backgroundColor:i+1<=activeStep ? C.amber : C.textDim+'30',
                    transition:'all 0.3s',
                  }} />
                ))}
              </View>
            }
          />
          <View style={{ gap:7 }}>
            {STEPS.map(s => (
              <SetupStep key={s.n} step={s} active={s.n === activeStep} done={s.n < activeStep} />
            ))}
          </View>
        </View>

        {/* ── Ollama guide ── */}
        <OllamaCard />

        {/* ── Advanced config (collapsed by default) ── */}
        <View>
          <TouchableOpacity onPress={() => { haptics.light(); setShowAdvanced(v => !v); }}
            style={{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:4 }}>
            <View style={{ width:3, height:16, borderRadius:2, backgroundColor:C.purple }} />
            <MaterialCommunityIcons name="cog" size={11} color={C.purple} />
            <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:C.purple, letterSpacing:1.8, flex:1 }}>
              ADVANCED CONFIG
            </Text>
            <MaterialIcons name={showAdvanced?'keyboard-arrow-up':'keyboard-arrow-down'}
              size={16} color={C.purple} />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={{ gap:12, borderWidth:1.5, borderRadius:14, borderColor:C.border,
              backgroundColor:C.card, padding:14, marginTop:8 }}>
              <NexusField label="HOST" icon="dns" hint="IP or hostname"
                value={cfg.host} onChangeText={v => update('host',v)}
                placeholder="192.168.1.42" autoCapitalize="none" autoCorrect={false}
                keyboardAppearance="dark" />
              <NexusField label="PORT" icon="settings-ethernet" hint="default: 8766"
                value={cfg.port} onChangeText={v => update('port',v.replace(/[^0-9]/g,''))}
                placeholder="8766" keyboardType="number-pad" keyboardAppearance="dark" />
              <NexusField label="AUTH TOKEN" icon="vpn-key" hint="optional"
                value={cfg.token} onChangeText={v => update('token',v)}
                placeholder="Bearer token (if required)"
                secureTextEntry autoCapitalize="none" autoCorrect={false}
                keyboardAppearance="dark" />
              {/* HTTPS toggle */}
              <View style={{ flexDirection:'row', alignItems:'center', gap:12,
                borderWidth:1, borderRadius:10, borderColor:C.border, padding:12, backgroundColor:C.bg }}>
                <View style={[{
                  width:32, height:32, borderRadius:9, borderWidth:1.5,
                  alignItems:'center', justifyContent:'center',
                  borderColor:(cfg.useHttps?C.green:C.cyan)+'55',
                  backgroundColor:(cfg.useHttps?C.green:C.cyan)+'0A',
                }]}>
                  <MaterialIcons name={cfg.useHttps?'lock':'lock-open'} size={15}
                    color={cfg.useHttps?C.green:C.cyan} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900',
                    color:cfg.useHttps?C.green:C.textMid, letterSpacing:0.5 }}>
                    {cfg.useHttps ? 'HTTPS ENABLED' : 'USE HTTPS'}
                  </Text>
                  <Text style={{ fontFamily:SANS, fontSize:11, color:C.textDim, marginTop:2 }}>
                    Enable for TLS / Cloudflare Tunnel
                  </Text>
                </View>
                <Switch value={cfg.useHttps}
                  onValueChange={v => { haptics.light(); update('useHttps',v); }}
                  trackColor={{ true:C.green, false:C.border }}
                  thumbColor={cfg.useHttps?'#000':C.textMid} />
              </View>
              {/* Endpoint preview */}
              <View style={{ borderWidth:1.5, borderColor:C.border, borderRadius:10,
                backgroundColor:C.dark, padding:10, flexDirection:'row', alignItems:'center', gap:8 }}>
                <MaterialIcons name="link" size={11} color={C.cyan+'70'} />
                <Text style={{ fontFamily:MONO, fontSize:11, color:C.textMid, flex:1 }} numberOfLines={1}>
                  {buildBaseUrl(cfg) || '—'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Connection status ── */}
        <ConnectionHUD status={status} latency={latency} />

        {/* ── Action buttons ── */}
        <View style={{ flexDirection:'row', gap:10 }}>
          <Pressable onPress={onSave}
            style={({ pressed }) => [{
              flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
              paddingVertical:15, borderRadius:13, borderWidth:2,
              backgroundColor: saved ? C.green+'15' : C.cyan,
              borderColor: saved ? C.green : C.cyan,
              opacity: pressed ? 0.85 : 1,
              ...(Platform.OS==='ios'?{
                shadowColor:saved?C.green:C.cyan, shadowOffset:{width:0,height:6},
                shadowOpacity:0.45, shadowRadius:14,
              }:{elevation:8}),
            }]}>
            <MaterialIcons name={saved?'check-circle':'save'} size={18}
              color={saved?C.green:'#000'} />
            <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900',
              color:saved?C.green:'#000', letterSpacing:1 }}>
              {saved ? 'SAVED ✓' : 'SAVE CONFIG'}
            </Text>
          </Pressable>
          <Pressable onPress={onTest} disabled={!cfg.host || status==='testing'}
            style={({ pressed }) => [{
              flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
              paddingVertical:15, borderRadius:13, borderWidth:2,
              borderColor:C.amber+'60', backgroundColor:C.amber+'0C',
              opacity:(!cfg.host||status==='testing') ? 0.4 : pressed ? 0.8 : 1,
              ...(Platform.OS==='ios'?{shadowColor:C.amber,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:10}:{}),
            }]}>
            {status==='testing'
              ? <ActivityIndicator size="small" color={C.amber} />
              : <MaterialCommunityIcons name="wifi-strength-4" size={18} color={C.amber} />
            }
            <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900',
              color:C.amber, letterSpacing:1 }}>
              {status==='testing' ? 'PINGING…' : 'PING TEST'}
            </Text>
          </Pressable>
        </View>

        {/* ── Tips ── */}
        <View style={{ borderWidth:1.5, borderRadius:12, borderColor:C.cyan+'25',
          backgroundColor:C.cyan+'05', padding:13, gap:7 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
            <MaterialCommunityIcons name="lightbulb-on" size={11} color={C.cyan} />
            <Text style={{ fontFamily:MONO, fontSize:9, fontWeight:'900', color:C.cyan, letterSpacing:1.2 }}>
              QUICK TIPS
            </Text>
          </View>
          {[
            ['wifi',           'Same Wi-Fi',  'Both phone and PC must be on the same network'],
            ['fire',           'Firewall',    'Allow port 8766 in Windows Firewall if connection fails'],
            ['shield-lock',    'Encrypted',   'All traffic is HMAC-SHA256 signed — no plaintext secrets'],
            ['refresh-circle', 'Re-pair',     'If connection drops, re-scan QR from the HOME tab'],
          ].map(([icon, label, text],i) => (
            <View key={i} style={{ flexDirection:'row', gap:9, alignItems:'flex-start' }}>
              <MaterialCommunityIcons name={icon as any} size={12} color={C.cyan+'60'} style={{ marginTop:2, flexShrink:0 }} />
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:C.cyan+'90' }}>{label}</Text>
                <Text style={{ fontFamily:SANS, fontSize:11.5, color:C.textMid, lineHeight:16 }}>{text}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

export default function ConnectScreen() {
  return (
    <TabErrorBoundary name="Connect">
      <ConnectScreenInner />
    </TabErrorBoundary>
  );
}
