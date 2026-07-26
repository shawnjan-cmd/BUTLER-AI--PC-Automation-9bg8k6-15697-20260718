/**
 * PAIR PC — Butler AI Server Setup & Pairing Hub v4.0
 *
 * TWO SECTIONS IN ONE SCROLLABLE SCREEN with a bold rainbow divider:
 * ① SERVER DOWNLOAD — platform cards, step wizard, Ollama setup, security grid
 * ② PAIRING CONFIG  — IP/port/token inputs, live ping test, connection status HUD
 *
 * All original connection.ts backend wiring preserved exactly.
 * Trust-first design: zero friction for new users.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import {
  DEFAULT_CONFIG, buildBaseUrl, loadConfig, pingServer, saveConfig,
  type ServerConfig,
} from '@/services/connection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 16;

const C = {
  bg:    '#020810', surf:  '#07111C', surf2: '#0C1728',
  cyan:  '#00E5FF', green: '#00FF88', amber: '#FFB020',
  red:   '#FF3344', purple:'#CC44FF', teal:  '#00CCBB',
  blue:  '#4A9EFF', text:  '#D4E8F6', mid:   '#4A7090',
  dim:   '#1A2E44', border:'rgba(0,229,255,0.10)',
};

type ConnStatus = 'idle' | 'testing' | 'ok' | 'fail';

// ── SETUP STEPS ──────────────────────────────────────────────────
const STEPS = [
  { n:1, icon:'download-box',  col:C.cyan,   title:'Download Server',  desc:'Get butler_server.py from GitHub — free, open source'       },
  { n:2, icon:'console',       col:C.amber,  title:'Run on Your PC',   desc:'python butler_server.py — works on Win, Mac, Linux'          },
  { n:3, icon:'qrcode-scan',   col:C.green,  title:'Scan QR Code',     desc:'HOME tab → Pair PC → point camera at QR shown in terminal'  },
  { n:4, icon:'check-circle',  col:C.purple, title:'Paired & Ready',   desc:'Full automation, AI chat, remote scripts — all unlocked'    },
];

const PLATFORMS = [
  { icon:'microsoft-windows', label:'Windows', sub:'v5.0.0', col:C.blue, badge:'RECOMMENDED',
    desc:'One-click .exe installer. Works on Win 10/11. No Python needed.', cmd:'butler_server_v5.exe' },
  { icon:'apple',   label:'macOS', sub:'v5.0.0', col:C.mid,   badge:'',
    desc:'Python script. Requires Python 3.9+. Tested on M1/M2.',        cmd:'python butler_server.py' },
  { icon:'penguin', label:'Linux', sub:'v5.0.0', col:C.green, badge:'',
    desc:'Full support. systemd service included for auto-start.',         cmd:'python3 butler_server.py' },
];

const SECURITY_FEATURES = [
  { icon:'shield-lock',       col:C.green,  label:'HMAC-SHA256',     desc:'Every request cryptographically signed'   },
  { icon:'lock',              col:C.cyan,   label:'AES-256 Tokens',  desc:'Session tokens encrypted at rest'          },
  { icon:'lan',               col:C.teal,   label:'LAN Only',        desc:'Zero external servers — your network only' },
  { icon:'cloud-off-outline', col:C.amber,  label:'Zero Cloud',      desc:'Nothing ever leaves your network'          },
];

// ── MICRO ATOMS ──────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: color, opacity: a }} />;
}

// ── SECTION LABEL ─────────────────────────────────────────────────
function SecHdr({ icon, label, color, sub }: { icon: string; label: string; color: string; sub?: string }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 }}>
      <View style={[styles.sh_iconBox, { borderColor:color+'50', backgroundColor:color+'10' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:MONO, fontSize:14, fontWeight:'900', color, letterSpacing:0.5 }}>{label}</Text>
        {sub ? <Text style={{ fontFamily:MONO, fontSize:9, color:C.mid, marginTop:2 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

// ── RAINBOW DIVIDER ───────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <View style={{ marginVertical: 6 }}>
      <View style={{ height:3, flexDirection:'row', borderRadius:2, overflow:'hidden', marginBottom:14 }}>
        {[C.cyan, C.green, C.amber, C.purple, C.teal, C.blue].map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </View>
      <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
        <View style={{ flex:1, height:1, backgroundColor:C.cyan+'30' }} />
        <View style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6,
          borderWidth:1.5, borderRadius:20, borderColor:C.cyan+'50', backgroundColor:C.cyan+'0A' }}>
          <MaterialIcons name="link" size={12} color={C.cyan} />
          <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:C.cyan, letterSpacing:1 }}>{label}</Text>
          <MaterialIcons name="link" size={12} color={C.cyan} />
        </View>
        <View style={{ flex:1, height:1, backgroundColor:C.cyan+'30' }} />
      </View>
    </View>
  );
}

// ── SETUP STEP ────────────────────────────────────────────────────
function SetupStep({ step, active, done }: { step:typeof STEPS[0]; active:boolean; done:boolean }) {
  const col = done ? C.green : active ? step.col : C.mid;
  return (
    <View style={[styles.step_wrap, { borderColor:col+(active?'50':'20'), backgroundColor:active?col+'07':'transparent' }]}>
      {active && <View style={[styles.step_line, { backgroundColor:step.col }]} />}
      <View style={[styles.step_numBox, { borderColor:col+'60', backgroundColor:col+'10' }]}>
        {done
          ? <MaterialIcons name="check" size={15} color={C.green} />
          : <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:col }}>{step.n}</Text>
        }
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:col }}>{step.title}</Text>
        <Text style={{ fontFamily:MONO, fontSize:10, color:active?C.mid:C.dim, marginTop:2, lineHeight:15 }}>{step.desc}</Text>
      </View>
      <View style={[styles.step_iconBox, { borderColor:col+'40', backgroundColor:col+'08' }]}>
        <MaterialCommunityIcons name={step.icon as any} size={16} color={col} />
      </View>
    </View>
  );
}

// ── PLATFORM CARD ─────────────────────────────────────────────────
function PlatformCard({ data, onDownload }: { data:typeof PLATFORMS[0]; onDownload:()=>void }) {
  const scaleA = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue:0.97, tension:400, friction:12, useNativeDriver:true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue:1,   tension:280, friction:10, useNativeDriver:true }).start()}
      onPress={() => { haptics.medium(); onDownload(); }}>
      <Animated.View style={[styles.pdc_wrap, { borderColor:data.col+(data.badge?'60':'28'), backgroundColor:data.col+'06', transform:[{scale:scaleA}] }]}>
        <View style={{ height:2.5, backgroundColor:data.col }} />
        <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:12 }}>
          <View style={[styles.pdc_icon, { borderColor:data.col+'55', backgroundColor:data.col+'0E' }]}>
            <MaterialCommunityIcons name={data.icon as any} size={24} color={data.col} />
          </View>
          <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:7, flexWrap:'wrap' }}>
              <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:data.col }}>{data.label}</Text>
              <Text style={{ fontFamily:MONO, fontSize:9.5, color:data.col+'70' }}>{data.sub}</Text>
              {data.badge ? (
                <View style={{ borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderColor:data.col, backgroundColor:data.col+'15' }}>
                  <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'900', color:data.col }}>{data.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontFamily:MONO, fontSize:10.5, color:C.mid, marginTop:3 }}>{data.desc}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:6, borderWidth:1, borderRadius:6,
              paddingHorizontal:7, paddingVertical:4, borderColor:data.col+'30', backgroundColor:data.col+'07', alignSelf:'flex-start' }}>
              <MaterialIcons name="terminal" size={9} color={data.col+'70'} />
              <Text style={{ fontFamily:MONO, fontSize:9.5, color:data.col+'BB' }}>{data.cmd}</Text>
            </View>
          </View>
          <View style={[styles.pdc_dlBtn, { borderColor:data.col+'60', backgroundColor:data.col+'12' }]}>
            <MaterialIcons name="file-download" size={16} color={data.col} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── SECURITY GRID ─────────────────────────────────────────────────
function SecurityGrid() {
  const cellW = (SW - PAD * 2 - 8) / 2;
  return (
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
      {SECURITY_FEATURES.map((f, i) => (
        <View key={i} style={[styles.sg_cell, { width:cellW, borderColor:f.col+'30', borderTopColor:f.col, borderTopWidth:2.5 }]}>
          <View style={[styles.sg_iconBox, { borderColor:f.col+'50', backgroundColor:f.col+'10' }]}>
            <MaterialCommunityIcons name={f.icon as any} size={14} color={f.col} />
          </View>
          <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:f.col, marginTop:6 }}>{f.label}</Text>
          <Text style={{ fontFamily:MONO, fontSize:8.5, color:C.mid, marginTop:2, textAlign:'center', lineHeight:13 }}>{f.desc}</Text>
        </View>
      ))}
    </View>
  );
}

// ── OLLAMA CARD ───────────────────────────────────────────────────
function OllamaCard() {
  return (
    <View style={{ borderRadius:14, borderWidth:1.5, borderColor:C.purple+'35', backgroundColor:C.purple+'05', overflow:'hidden' }}>
      <View style={{ height:2.5, backgroundColor:C.purple }} />
      <View style={{ padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
          <View style={{ width:42, height:42, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center', borderColor:C.purple+'60', backgroundColor:C.purple+'10' }}>
            <MaterialCommunityIcons name="brain" size={18} color={C.purple} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:C.purple }}>OLLAMA — LOCAL AI ENGINE</Text>
            <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.mid, marginTop:2 }}>Powers AI chat tab · 100% on your hardware · no cloud</Text>
          </View>
          <View style={{ borderWidth:1.5, borderRadius:8, paddingHorizontal:8, paddingVertical:4, borderColor:C.green+'60', backgroundColor:C.green+'0A' }}>
            <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.green }}>PRIVATE</Text>
          </View>
        </View>
        {[
          { cmd:'curl -fsSL https://ollama.ai/install.sh | sh', label:'1. Install Ollama',  col:C.cyan  },
          { cmd:'ollama pull llama3',                           label:'2. Download model', col:C.amber },
          { cmd:'(Starts automatically with butler_server.py)', label:'3. Auto-starts',    col:C.green },
        ].map((s, i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:10,
            borderLeftWidth:2, borderLeftColor:s.col+'50', paddingLeft:10, marginBottom:i<2?10:0 }}>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:s.col }}>{s.label}</Text>
              <View style={{ flexDirection:'row', gap:5, marginTop:4, borderWidth:1, borderRadius:6,
                paddingHorizontal:8, paddingVertical:4, borderColor:s.col+'30', backgroundColor:s.col+'07', alignSelf:'flex-start' }}>
                <MaterialIcons name="code" size={9} color={s.col+'70'} />
                <Text style={{ fontFamily:MONO, fontSize:9, color:s.col+'BB' }}>{s.cmd}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── CONNECTION HUD ────────────────────────────────────────────────
function ConnectionHUD({ status, latency }: { status:ConnStatus; latency:number }) {
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
  const col  = status==='ok'?C.green : status==='fail'?C.red : C.amber;
  const msg  = status==='ok' ? `Connected · ${latency}ms · ready to automate`
              : status==='fail' ? 'Failed — check IP/port and that server is running'
              : 'Pinging server…';
  return (
    <View style={[styles.hud_wrap, { borderColor:col+'50', backgroundColor:col+'09' }]}>
      <View style={{ height:2.5, backgroundColor:col }} />
      <View style={{ flexDirection:'row', alignItems:'flex-start', gap:10, padding:13 }}>
        <MaterialCommunityIcons
          name={status==='ok'?'check-circle':status==='fail'?'alert-circle':'wifi-sync'}
          size={16} color={col} style={{ marginTop:1 }} />
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:col, letterSpacing:0.4, marginBottom:3 }}>
            {status==='ok'?'● SERVER ONLINE':status==='fail'?'✕ CONNECTION FAILED':'◌ PROBING…'}
          </Text>
          <Text style={{ fontFamily:MONO, fontSize:10.5, color:status==='ok'?C.mid:col+'AA', lineHeight:16 }}>{msg}</Text>
        </View>
        {status==='ok' && (
          <View style={{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:7,
            paddingHorizontal:8, paddingVertical:4, borderColor:C.green+'55' }}>
            <Animated.View style={{ width:5, height:5, borderRadius:3, backgroundColor:C.green, opacity:pulseA }} />
            <Text style={{ fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.green }}>LIVE</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── NEXUS FIELD ───────────────────────────────────────────────────
function NexusField({ label, icon, hint, ...rest }: { label:string; icon:string; hint?:string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap:6 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
        <MaterialIcons name={icon as any} size={10} color={C.cyan+'70'} />
        <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:C.cyan+'80', letterSpacing:1.2, flex:1 }}>{label}</Text>
        {hint ? <Text style={{ fontFamily:MONO, fontSize:9, color:C.dim }}>{hint}</Text> : null}
      </View>
      <View style={[styles.nf_box, {
        borderColor: focused ? C.cyan+'80' : C.border,
        backgroundColor: focused ? C.cyan+'06' : C.surf,
      }]}>
        <TextInput {...rest}
          style={styles.nf_input}
          placeholderTextColor={C.dim}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

// ── HEADER ───────────────────────────────────────────────────────
function PairHeader({ safeTop, status }: { safeTop: number; status: ConnStatus }) {
  const connCol = status === 'ok' ? C.green : status === 'fail' ? C.red : C.cyan;
  const shimA = useRef(new Animated.Value(-SW)).current;
  const [time, setTime] = useState('');

  useEffect(() => {
    const upd = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    };
    upd(); const t = setInterval(upd, 1000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW*1.5, duration:2200, useNativeDriver:true }),
      Animated.timing(shimA, { toValue: -SW,    duration:0,    useNativeDriver:true }),
      Animated.delay(8000),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  return (
    <View style={[styles.hdr_root, { paddingTop: safeTop }]}>
      <View style={{ height:2.5, backgroundColor:C.cyan }} />
      <Animated.View pointerEvents="none" style={[styles.hdr_shimmer, { transform:[{ translateX: shimA }] }]} />
      <View style={{ flexDirection:'row', alignItems:'flex-start', gap:12, paddingHorizontal:PAD, paddingTop:13, paddingBottom:13, zIndex:1 }}>
        <View style={{ flex:1, gap:5 }}>
          <Text style={{ fontFamily:MONO, fontSize:7.5, fontWeight:'700', color:C.cyan+'55', letterSpacing:2 }}>SERVER SETUP · PAIRING · AUTOMATION</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            <View style={{ width:38, height:38, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center',
              borderColor:C.cyan+'55', backgroundColor:C.cyan+'10' }}>
              <MaterialCommunityIcons name="server-network" size={20} color={C.cyan} />
            </View>
            <Text style={{ fontSize:26, fontWeight:'900', color:'#FFF' }}>PAIR <Text style={{ color:C.cyan }}>PC</Text></Text>
          </View>
          <View style={{ flexDirection:'row', gap:7, marginTop:2 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:20,
              paddingHorizontal:9, paddingVertical:4, borderColor:connCol+'60', backgroundColor:connCol+'0D' }}>
              <PulseDot color={connCol} size={5} />
              <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', letterSpacing:0.3, color:connCol }}>
                {status==='ok'?'CONNECTED':'OFFLINE'}
              </Text>
            </View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:20,
              paddingHorizontal:9, paddingVertical:4, borderColor:C.green+'40', backgroundColor:C.green+'08' }}>
              <MaterialCommunityIcons name="shield-check" size={9} color={C.green} />
              <Text style={{ fontFamily:MONO, fontSize:8.5, fontWeight:'900', letterSpacing:0.3, color:C.green }}>ZERO CLOUD</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:4 }}>
          <Text style={{ fontFamily:MONO, fontSize:24, fontWeight:'900', color:'#C8E4F0', letterSpacing:1 }}>{time}</Text>
          <Text style={{ fontFamily:MONO, fontSize:8.5, color:'#4A7090', letterSpacing:1, fontWeight:'700' }}>LAN · LOCAL</Text>
        </View>
      </View>
      {/* Circuit trace */}
      <View style={{ height:2, flexDirection:'row' }}>
        {[{f:3,c:C.cyan+'18'},{w:12,c:C.cyan},{f:2,c:C.green+'12'},{w:6,c:C.green},{f:5,c:C.cyan+'08'},{w:8,c:C.teal}].map((seg,i)=>(
          <View key={i} style={[{backgroundColor:seg.c},'f' in seg?{flex:seg.f as number}:{width:seg.w as number}]} />
        ))}
      </View>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────
function PairPCScreenInner() {
  const insets = useSafeAreaInsets();
  const [cfg, setCfg]           = useState<ServerConfig>(DEFAULT_CONFIG);
  const [status, setStatus]     = useState<ConnStatus>('idle');
  const [saved, setSaved]       = useState(false);
  const [latency, setLatency]   = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    loadConfig().then(c => { setCfg(c); if (c.host) setActiveStep(2); });
  }, []);

  const update = useCallback(<K extends keyof ServerConfig>(k: K, v: ServerConfig[K]) => {
    setCfg(c => ({ ...c, [k]: v })); setSaved(false); setStatus('idle');
  }, []);

  const onSave = useCallback(async () => {
    haptics.medium(); await saveConfig(cfg); setSaved(true); haptics.success();
    setActiveStep(3); setTimeout(() => setSaved(false), 2500);
  }, [cfg]);

  const onTest = useCallback(async () => {
    haptics.light(); setStatus('testing');
    const t0 = Date.now();
    const ok = await pingServer(cfg);
    setLatency(Date.now() - t0);
    setStatus(ok ? 'ok' : 'fail');
    if (ok) { haptics.success(); setActiveStep(4); } else haptics.warning();
  }, [cfg]);

  const downloadUrl = 'https://github.com/shawnjan-cmd/butler-server/releases/latest';
  const downloadZip = 'https://github.com/shawnjan-cmd/butler-server/archive/refs/heads/main.zip';

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <PairHeader safeTop={insets.top} status={status} />

      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={{ padding:PAD, gap:14, paddingBottom:130 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ═══════════════════════════════════════════
            SECTION 1 · SERVER DOWNLOAD
        ═══════════════════════════════════════════ */}
        <SecHdr icon="download-circle-outline" label="DOWNLOAD BUTLER SERVER" color={C.cyan}
          sub="Free, open source, runs locally on your PC — no cloud account needed" />

        {/* GitHub CTA */}
        <Pressable onPress={() => { haptics.medium(); Linking.openURL(downloadUrl).catch(()=>{}); }}
          style={({ pressed }) => [styles.ghc_wrap, { opacity:pressed?0.88:1 }]}>
          <View style={{ height:3, backgroundColor:C.cyan }} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:16 }}>
            <View style={[styles.ghc_icon, { borderColor:C.cyan+'55', backgroundColor:C.cyan+'0E' }]}>
              <MaterialCommunityIcons name="github" size={28} color={C.cyan} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:14, fontWeight:'900', color:C.cyan }}>DOWNLOAD FREE SERVER</Text>
              <Text style={{ fontFamily:MONO, fontSize:10.5, color:C.mid, marginTop:3 }}>Open source · No account · Works 100% offline</Text>
              <View style={{ flexDirection:'row', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {['v5.0.0','MIT LICENSE','ZERO TELEMETRY'].map((b,i) => (
                  <View key={i} style={{ borderWidth:1, borderRadius:7, paddingHorizontal:7, paddingVertical:3,
                    borderColor:C.cyan+'35', backgroundColor:C.cyan+'08' }}>
                    <Text style={{ fontFamily:MONO, fontSize:8, color:C.cyan+'BB', fontWeight:'900' }}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.ghc_dlBtn, { borderColor:C.cyan+'60', backgroundColor:C.cyan+'12' }]}>
              <MaterialIcons name="open-in-new" size={18} color={C.cyan} />
            </View>
          </View>
        </Pressable>

        {/* Platform cards */}
        <View style={{ gap:8 }}>
          {PLATFORMS.map((p,i) => (
            <PlatformCard key={i} data={p} onDownload={() => Linking.openURL(downloadUrl).catch(()=>{})} />
          ))}
        </View>

        {/* Setup wizard */}
        <View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:11 }}>
            <View style={{ width:3, height:16, borderRadius:2, backgroundColor:C.amber }} />
            <MaterialCommunityIcons name="format-list-numbered" size={11} color={C.amber} />
            <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:C.amber+'CC', letterSpacing:1.8, flex:1 }}>SETUP WIZARD</Text>
            <View style={{ flexDirection:'row', gap:4 }}>
              {STEPS.map((_,i) => (
                <View key={i} style={{ width:i+1<=activeStep?18:8, height:4, borderRadius:2,
                  backgroundColor:i+1<=activeStep?C.amber:C.dim+'40' }} />
              ))}
            </View>
          </View>
          <View style={{ gap:7 }}>
            {STEPS.map(s => <SetupStep key={s.n} step={s} active={s.n===activeStep} done={s.n<activeStep} />)}
          </View>
        </View>

        {/* QR shortcut banner */}
        <View style={{ borderRadius:12, borderWidth:1.5, borderColor:C.green+'45', backgroundColor:C.green+'06', overflow:'hidden' }}>
          <View style={{ height:2.5, backgroundColor:C.green }} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:13 }}>
            <View style={{ width:42, height:42, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center',
              borderColor:C.green+'60', backgroundColor:C.green+'0D' }}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={C.green} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:12, fontWeight:'900', color:C.green }}>FASTER: QR AUTO-PAIR</Text>
              <Text style={{ fontFamily:MONO, fontSize:10, color:C.mid, marginTop:3, lineHeight:15 }}>
                Server shows QR in terminal → HOME tab → Pair PC → scan it
              </Text>
            </View>
            <PulseDot color={C.green} size={8} />
          </View>
        </View>

        {/* Ollama */}
        <OllamaCard />

        {/* Security grid */}
        <View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:11 }}>
            <View style={{ width:3, height:16, borderRadius:2, backgroundColor:C.green }} />
            <MaterialCommunityIcons name="shield-check-outline" size={11} color={C.green} />
            <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:C.green+'CC', letterSpacing:1.8 }}>SECURITY ARCHITECTURE</Text>
          </View>
          <SecurityGrid />
        </View>

        {/* ═══════════════════════════════════════════
            VISUAL DIVIDER
        ═══════════════════════════════════════════ */}
        <Divider label="CONFIGURE CONNECTION" />

        {/* ═══════════════════════════════════════════
            SECTION 2 · PAIRING CONFIG
        ═══════════════════════════════════════════ */}
        <SecHdr icon="server-network" label="MANUAL IP CONFIGURATION" color={C.amber}
          sub="Enter IP address — or scan QR from HOME tab for instant auto-pair" />

        {/* Input fields */}
        <View style={{ gap:12, borderWidth:1.5, borderRadius:14, borderColor:C.border, backgroundColor:C.surf, padding:14 }}>
          <NexusField label="HOST ADDRESS" icon="dns" hint="local IP"
            value={cfg.host} onChangeText={v => update('host', v)}
            placeholder="192.168.1.42" autoCapitalize="none" autoCorrect={false} keyboardAppearance="dark" />
          <NexusField label="PORT" icon="settings-ethernet" hint="default 8766"
            value={cfg.port} onChangeText={v => update('port', v.replace(/[^0-9]/g,''))}
            placeholder="8766" keyboardType="number-pad" keyboardAppearance="dark" />
          <NexusField label="AUTH TOKEN" icon="vpn-key" hint="optional"
            value={cfg.token} onChangeText={v => update('token', v)}
            placeholder="Bearer token (auto-set after QR scan)"
            secureTextEntry autoCapitalize="none" autoCorrect={false} keyboardAppearance="dark" />

          {/* HTTPS toggle */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:12, borderWidth:1, borderRadius:10,
            borderColor:C.border, padding:12, backgroundColor:C.bg }}>
            <View style={{ width:32, height:32, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center',
              borderColor:(cfg.useHttps?C.green:C.cyan)+'55', backgroundColor:(cfg.useHttps?C.green:C.cyan)+'0A' }}>
              <MaterialIcons name={cfg.useHttps?'lock':'lock-open'} size={14} color={cfg.useHttps?C.green:C.cyan} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:MONO, fontSize:11, fontWeight:'900', color:cfg.useHttps?C.green:C.mid }}>
                {cfg.useHttps?'HTTPS ENABLED':'HTTP MODE'}
              </Text>
              <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.dim, marginTop:2 }}>Enable for TLS / Cloudflare Tunnel</Text>
            </View>
            <Switch value={cfg.useHttps}
              onValueChange={v => { haptics.light(); update('useHttps',v); }}
              trackColor={{ true:C.green, false:'rgba(255,255,255,0.08)' }}
              thumbColor={cfg.useHttps?'#000':C.mid} />
          </View>

          {/* Endpoint preview */}
          {cfg.host ? (
            <View style={{ borderWidth:1.5, borderColor:C.border, borderRadius:9, backgroundColor:C.bg, padding:10,
              flexDirection:'row', alignItems:'center', gap:8 }}>
              <MaterialIcons name="link" size={10} color={C.cyan+'70'} />
              <Text style={{ fontFamily:MONO, fontSize:11, color:C.mid, flex:1 }} numberOfLines={1}>{buildBaseUrl(cfg)}</Text>
            </View>
          ) : null}
        </View>

        {/* Status HUD */}
        <ConnectionHUD status={status} latency={latency} />

        {/* Action buttons */}
        <View style={{ flexDirection:'row', gap:10 }}>
          <Pressable onPress={onSave}
            style={({ pressed }) => [{
              flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
              paddingVertical:15, borderRadius:13, borderWidth:2,
              backgroundColor:saved?C.green+'15':C.cyan, borderColor:saved?C.green:C.cyan,
              opacity:pressed?0.88:1,
              ...Platform.select({ ios:{shadowColor:saved?C.green:C.cyan,shadowOffset:{width:0,height:5},shadowOpacity:0.4,shadowRadius:12}, android:{elevation:7} }),
            }]}>
            <MaterialIcons name={saved?'check-circle':'save'} size={16} color={saved?C.green:'#000'} />
            <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:saved?C.green:'#000', letterSpacing:0.8 }}>
              {saved?'SAVED ✓':'SAVE CONFIG'}
            </Text>
          </Pressable>
          <Pressable onPress={onTest} disabled={!cfg.host||status==='testing'}
            style={({ pressed }) => [{
              flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
              paddingVertical:15, borderRadius:13, borderWidth:2,
              borderColor:C.amber+'60', backgroundColor:C.amber+'0C',
              opacity:(!cfg.host||status==='testing')?0.4:pressed?0.8:1,
            }]}>
            {status==='testing'
              ? <ActivityIndicator size="small" color={C.amber} />
              : <MaterialCommunityIcons name="wifi-strength-4" size={16} color={C.amber} />}
            <Text style={{ fontFamily:MONO, fontSize:13, fontWeight:'900', color:C.amber, letterSpacing:0.8 }}>
              {status==='testing'?'PINGING…':'TEST PING'}
            </Text>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={{ borderWidth:1.5, borderRadius:12, borderColor:C.cyan+'25', backgroundColor:C.cyan+'04', padding:14, gap:10 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={12} color={C.cyan} />
            <Text style={{ fontFamily:MONO, fontSize:9.5, fontWeight:'900', color:C.cyan, letterSpacing:1.2 }}>QUICK TIPS</Text>
          </View>
          {[
            ['wifi','Same Network','Phone and PC must be on the same Wi-Fi'],
            ['fire','Firewall','Allow port 8766 in Windows Defender if connection fails'],
            ['shield-lock','Encrypted','All traffic uses HMAC-SHA256 — no plaintext secrets'],
            ['refresh-circle','Re-Pair','If connection drops, re-scan QR from the HOME tab'],
            ['robot-happy','Local AI','Install Ollama for 100% private AI chat on your hardware'],
          ].map(([icon,label,text],i) => (
            <View key={i} style={{ flexDirection:'row', gap:9, alignItems:'flex-start' }}>
              <MaterialCommunityIcons name={icon as any} size={12} color={C.cyan+'60'} style={{ marginTop:2, flexShrink:0 }} />
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:MONO, fontSize:10, fontWeight:'900', color:C.cyan+'90' }}>{label}</Text>
                <Text style={{ fontFamily:MONO, fontSize:10.5, color:C.mid, lineHeight:15 }}>{text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer trust line */}
        <View style={{ alignItems:'center', paddingTop:8, gap:5 }}>
          <Text style={{ fontFamily:MONO, fontSize:9.5, color:C.dim, textAlign:'center' }}>BUTLER AI · 100% LOCAL · AES-256 · ZERO TELEMETRY</Text>
          <Text style={{ fontFamily:MONO, fontSize:8.5, color:C.dim+'80', textAlign:'center' }}>Your commands never leave your network.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function PairPCScreen() {
  return (
    <TabErrorBoundary name="Pair PC">
      <PairPCScreenInner />
    </TabErrorBoundary>
  );
}

// ── STYLESHEET ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Section header
  sh_iconBox: { width:40, height:40, borderRadius:12, borderWidth:1.5, alignItems:'center', justifyContent:'center' },

  // Setup step
  step_wrap:    { flexDirection:'row', alignItems:'center', gap:12, borderRadius:12, borderWidth:1.5, padding:12, position:'relative', overflow:'hidden' },
  step_line:    { position:'absolute', left:0, top:0, bottom:0, width:3.5 },
  step_numBox:  { width:34, height:34, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  step_iconBox: { width:36, height:36, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },

  // Platform card
  pdc_wrap:  { borderRadius:14, borderWidth:1.5, overflow:'hidden',
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.2,shadowRadius:10}, android:{elevation:4} }) },
  pdc_icon:  { width:50, height:50, borderRadius:14, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  pdc_dlBtn: { width:40, height:40, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },

  // Security grid
  sg_cell:    { backgroundColor:C.surf, borderRadius:12, borderWidth:1.5, padding:12, alignItems:'center' },
  sg_iconBox: { width:36, height:36, borderRadius:10, borderWidth:1.5, alignItems:'center', justifyContent:'center' },

  // Connection HUD
  hud_wrap: { borderRadius:12, borderWidth:1.5, overflow:'hidden' },

  // Nexus field
  nf_box:   { borderWidth:1.5, borderRadius:12 },
  nf_input: { fontFamily:MONO, fontSize:14, color:C.text, paddingHorizontal:14, paddingVertical:12 },

  // Header
  hdr_root:    { backgroundColor:'#07111C', overflow:'hidden' },
  hdr_shimmer: { position:'absolute', top:0, bottom:0, width:90, backgroundColor:'rgba(0,229,255,0.04)', zIndex:0 },

  // GitHub CTA
  ghc_wrap:  { borderRadius:16, borderWidth:1.5, borderColor:C.cyan+'45', backgroundColor:C.cyan+'06', overflow:'hidden' },
  ghc_icon:  { width:52, height:52, borderRadius:14, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  ghc_dlBtn: { width:40, height:40, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
});
