/**
 * RemoteAccessCard v2 — Compact full-width LAN + Tailscale + Cloudflare card
 * Horizontal layout, 3-col feature grid, live test, copy prompts
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { safeSetClipboard } from '@/services/safeClipboard';
import { serverConnection } from '@/services/serverConnection';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

const C = {
  bg:      '#020810',
  surface: '#060E1A',
  surf2:   '#09141F',
  cyan:    '#00E5FF',
  green:   '#00FF88',
  amber:   '#FFB020',
  red:     '#FF3344',
  purple:  '#CC44FF',
  blue:    '#4488FF',
  text:    '#C8E4F0',
  mid:     '#6A8EA8',
  dim:     '#2A3E55',
  border:  'rgba(0,229,255,0.15)',
};

const STEPS = [
  { num:'1', col:C.cyan,   title:'INSTALL TAILSCALE',     sub:'tailscale.com — free. Install on PC + phone, sign in with same email.' },
  { num:'2', col:C.green,  title:'GET PC TAILSCALE IP',   sub:'Open Tailscale dashboard — your PC shows a 100.x.x.x IP. Copy it.' },
  { num:'3', col:C.amber,  title:'ENTER BELOW',            sub:'http://100.x.x.x:8766 (8766 is the default butler server port).' },
  { num:'4', col:C.purple, title:'SAVE & TEST',            sub:'Butler will connect and test the tunnel — works on 4G/5G worldwide.' },
];

function PulseDot({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue:1,   duration:900, useNativeDriver:true }),
      Animated.timing(a, { toValue:0.15,duration:900, useNativeDriver:true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return <Animated.View style={{ width:6, height:6, borderRadius:3, backgroundColor:color, opacity:a }} />;
}

export function RemoteAccessCard() {
  const [remoteOn,    setRemoteOn]    = useState(false);
  const [savedUrl,    setSavedUrl]    = useState('');
  const [inputUrl,    setInputUrl]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [testState,   setTestState]   = useState<'idle'|'testing'|'ok'|'fail'>('idle');
  const [testMsg,     setTestMsg]     = useState('');
  const [expanded,    setExpanded]    = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [pingMs,      setPingMs]      = useState<number|null>(null);
  const glowA   = useRef(new Animated.Value(0.4)).current;
  const expandH = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      await serverConnection.load();
      const url = serverConnection.getRemoteUrl?.();
      if (url) { setSavedUrl(url); setInputUrl(url); setRemoteOn(true); }
    })();
    const g = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue:1,   duration:1600, useNativeDriver:false }),
      Animated.timing(glowA, { toValue:0.2, duration:1600, useNativeDriver:false }),
    ]));
    g.start(); return () => g.stop();
  }, []);

  const toggleExpand = () => {
    haptics.light();
    setExpanded(v => {
      Animated.timing(expandH, { toValue:v?0:1, duration:260, useNativeDriver:false }).start();
      return !v;
    });
  };

  const handleSave = async () => {
    const url = inputUrl.trim().replace(/\/$/, '');
    if (!url) { Alert.alert('Empty URL', 'Enter a Tailscale IP or Cloudflare URL.'); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Must start with http:// or https://\n\nExamples:\n• http://100.78.43.21:8766\n• https://butler-xyz.trycloudflare.com');
      return;
    }
    haptics.medium(); setSaving(true);
    await serverConnection.setRemoteUrl?.(url);
    setSavedUrl(url); setRemoteOn(true); setSaving(false); haptics.success();
    testConnection(url);
  };

  const handleDisable = async () => {
    haptics.medium();
    await serverConnection.clearRemoteUrl?.();
    setRemoteOn(false); setSavedUrl(''); setInputUrl('');
    setTestState('idle'); setTestMsg(''); setPingMs(null);
  };

  const testConnection = async (urlToTest?: string) => {
    const url = (urlToTest || savedUrl || inputUrl).trim().replace(/\/$/, '');
    if (!url) return;
    setTestState('testing'); setTestMsg('Connecting\u2026');
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10000);
      const t0 = Date.now();
      const res = await fetch(`${url}/api/status`, { signal: ctrl.signal });
      const ms = Date.now() - t0;
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        setTestState('ok'); setTestMsg(`Online \u2713  ${d.version ? 'v'+d.version : 'Butler server'}`);
        setPingMs(ms); haptics.success();
      } else {
        setTestState('fail'); setTestMsg(`HTTP ${res.status}`); setPingMs(null); haptics.warning();
      }
    } catch (e: any) {
      setTestState('fail');
      setTestMsg(e?.name === 'AbortError' ? 'Timeout (10s) — check URL and server' : (e?.message || 'Connection failed'));
      setPingMs(null); haptics.warning();
    }
  };

  const copyServerPrompt = async () => {
    haptics.light();
    const prompt = [
      'Update butler_server.py for remote connections (Tailscale/Cloudflare):',
      '',
      '1. Relax IP check — Tailscale IPs start with 100.x:',
      '   def _is_trusted_ip(client_ip, paired_ip):',
      '     if client_ip.startswith("100."): return True  # Tailscale',
      '     return True  # HMAC token is real auth',
      '',
      '2. Read real client IP from proxy headers:',
      '   def _real_ip(self):',
      '     return (self.headers.get("CF-Connecting-IP") or',
      '       self.headers.get("X-Forwarded-For","").split(",")[0].strip() or',
      '       self.client_address[0])',
      '',
      '3. Relax CORS:',
      '   self.send_header("Access-Control-Allow-Origin", "*")',
    ].join('\n');
    try {
      await safeSetClipboard(prompt);
      setCopied(true); haptics.success();
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const accent = remoteOn ? C.green : C.cyan;
  const tcol   = testState==='ok'?C.green : testState==='fail'?C.red : testState==='testing'?C.amber : C.cyan;
  const borderC = glowA.interpolate({ inputRange:[0.2,1], outputRange:[accent+'30', accent+'99'] });
  const expandHt = expandH.interpolate({ inputRange:[0,1], outputRange:[0, 460] });

  // 3-col feature grid
  const FEATURES = [
    { icon:'code',           col:C.cyan,   lbl:'Scripts\nRemote'   },
    { icon:'content-copy',   col:C.amber,  lbl:'Clipboard\nSync'   },
    { icon:'wifi',           col:C.purple, lbl:'Tailscale\nTunnel' },
    { icon:'cloud',          col:C.blue,   lbl:'Cloudflare\nFree'  },
    { icon:'lock',           col:C.green,  lbl:'HMAC\nEncrypted'   },
    { icon:'power-settings-new', col:C.red, lbl:'Power\nControl'   },
  ];

  return (
    <Animated.View style={[s.card, { borderColor: borderC }]}>
      {/* Accent stripe */}
      <View style={{ height:3, flexDirection:'row' }}>
        {[accent, C.purple, C.amber, C.green, C.blue, C.red].map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </View>

      {/* HUD corners */}
      {[
        { top:0, left:0, borderTopWidth:1.5, borderLeftWidth:1.5 },
        { top:0, right:0, borderTopWidth:1.5, borderRightWidth:1.5 },
        { bottom:0, left:0, borderBottomWidth:1.5, borderLeftWidth:1.5 },
        { bottom:0, right:0, borderBottomWidth:1.5, borderRightWidth:1.5 },
      ].map((st2, i) => (
        <View key={i} style={[{ position:'absolute', width:10, height:10, borderColor:accent+'55' }, st2 as any]} />
      ))}

      {/* Header */}
      <View style={s.header}>
        <View style={[s.iconBox, { borderColor:accent+'60', backgroundColor:accent+'12' }]}>
          <MaterialIcons name="wifi-tethering" size={20} color={accent} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={[s.title, { color:accent }]}>REMOTE ACCESS</Text>
          <Text style={s.sub}>LAN · Tailscale · Cloudflare · anywhere</Text>
        </View>
        <View style={[s.badge, { borderColor:accent+'50', backgroundColor:accent+'0D' }]}>
          <PulseDot color={accent} />
          <Text style={[s.badgeTxt, { color:accent }]}>{remoteOn?'REMOTE':'LAN'}</Text>
        </View>
      </View>

      {/* Status row */}
      <View style={[s.statusBand, { borderColor:accent+'30', backgroundColor:accent+'07' }]}>
        <MaterialIcons name={remoteOn?'public':'home'} size={12} color={accent} />
        <Text style={[s.statusTxt, { color:accent+'CC' }]} numberOfLines={1}>
          {remoteOn ? `REMOTE — ${savedUrl||'\u2026'}` : 'LAN MODE — same Wi-Fi only'}
        </Text>
        {pingMs !== null && (
          <View style={[s.pingBadge, { borderColor:C.green+'45', backgroundColor:C.green+'0A' }]}>
            <Text style={[s.pingTxt, { color:C.green }]}>{pingMs}ms</Text>
          </View>
        )}
      </View>

      {/* URL input */}
      <View style={{ paddingHorizontal:14, paddingBottom:10, gap:7 }}>
        <Text style={s.label}>SERVER URL</Text>
        <View style={{ flexDirection:'row', gap:8 }}>
          <View style={[s.inputWrap, { borderColor: inputUrl ? C.cyan+'60' : C.border }]}>
            <MaterialIcons name="link" size={12} color={inputUrl?C.cyan:C.dim} />
            <TextInput style={s.input} value={inputUrl} onChangeText={setInputUrl}
              placeholder="http://100.x.x.x:8766" placeholderTextColor={C.dim}
              autoCapitalize="none" autoCorrect={false} keyboardType="url" />
            {inputUrl ? (
              <TouchableOpacity onPress={() => setInputUrl('')} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <MaterialIcons name="close" size={12} color={C.dim} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleSave} disabled={saving||!inputUrl.trim()}
            style={[s.saveBtn, { backgroundColor: saving ? C.cyan+'AA' : C.cyan, opacity:!inputUrl.trim()?0.4:1 }]}
            activeOpacity={0.85}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="check" size={15} color="#000" />}
            <Text style={s.saveBtnTxt}>{saving?'...':'SAVE'}</Text>
          </TouchableOpacity>
        </View>

        {/* Template chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6 }}>
          {[
            { lbl:'Tailscale', val:'http://100.x.x.x:8766' },
            { lbl:'Cloudflare',val:'https://butler-xyz.trycloudflare.com' },
          ].map(({ lbl, val }) => (
            <TouchableOpacity key={lbl} onPress={() => { haptics.light(); setInputUrl(val); }}
              style={[s.chip, { borderColor:C.cyan+'35', backgroundColor:C.cyan+'08' }]}>
              <MaterialIcons name="content-paste" size={9} color={C.cyan} />
              <Text style={[s.chipTxt, { color:C.cyan }]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action buttons row */}
      <View style={{ flexDirection:'row', gap:8, paddingHorizontal:14, paddingBottom:10 }}>
        <TouchableOpacity onPress={() => testConnection()} disabled={testState==='testing'||!savedUrl}
          style={[s.actionBtn, { flex:2, borderColor:tcol+'55', backgroundColor:tcol+'0A', opacity:!savedUrl?0.4:1 }]}
          activeOpacity={0.8}>
          {testState==='testing' ? <ActivityIndicator size="small" color={tcol} style={{transform:[{scale:0.75}]}} />
            : <MaterialIcons name={testState==='ok'?'check-circle':testState==='fail'?'error':'speed'} size={13} color={tcol} />}
          <Text style={[s.actionTxt, { color:tcol }]}>
            {testState==='testing'?'TESTING\u2026':testState==='ok'?'ONLINE \u2713':testState==='fail'?'RETRY':'TEST'}
          </Text>
        </TouchableOpacity>
        {remoteOn && (
          <TouchableOpacity onPress={handleDisable}
            style={[s.actionBtn, { flex:1, borderColor:C.red+'50', backgroundColor:C.red+'08' }]}
            activeOpacity={0.8}>
            <MaterialIcons name="wifi-off" size={13} color={C.red} />
            <Text style={[s.actionTxt, { color:C.red }]}>OFF</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={copyServerPrompt}
          style={[s.actionBtn, { flex:1, borderColor:C.purple+'50', backgroundColor: copied?C.purple+'18':C.purple+'0A' }]}
          activeOpacity={0.8}>
          <MaterialIcons name={copied?'check':'code'} size={13} color={copied?C.green:C.purple} />
          <Text style={[s.actionTxt, { color:copied?C.green:C.purple }]}>{copied?'OK':'PATCH'}</Text>
        </TouchableOpacity>
      </View>

      {/* Test result */}
      {testMsg ? (
        <View style={[s.testResult, { borderColor:tcol+'40', backgroundColor:tcol+'08' }]}>
          <MaterialIcons name={testState==='ok'?'check-circle':'info-outline'} size={12} color={tcol} />
          <Text style={[s.testTxt, { color:tcol }]} numberOfLines={2}>{testMsg}</Text>
        </View>
      ) : null}

      {/* Feature grid — 3 columns */}
      <View style={s.featGrid}>
        {FEATURES.map(({ icon, col, lbl }, i) => (
          <View key={i} style={[s.featCell, i % 3 !== 2 && { borderRightWidth:1, borderRightColor:accent+'15' }]}>
            <MaterialIcons name={icon as any} size={16} color={remoteOn ? col : col + '44'} />
            <Text style={[s.featTxt, { color:remoteOn ? col : C.dim }]}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* Expandable guide */}
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8}
        style={[s.guideToggle, { borderTopColor:accent+'20' }]}>
        <MaterialIcons name="help-outline" size={11} color={C.cyan+'80'} />
        <Text style={[s.guideTxt, { color:C.cyan+'80' }]}>
          {expanded ? 'HIDE SETUP GUIDE' : 'TAILSCALE SETUP GUIDE (5 MIN · FREE)'}
        </Text>
        <MaterialIcons name={expanded?'expand-less':'expand-more'} size={15} color={C.cyan+'60'} />
      </TouchableOpacity>

      <Animated.View style={{ overflow:'hidden', maxHeight:expandHt }}>
        <View style={{ paddingHorizontal:14, paddingTop:10, paddingBottom:14, gap:10 }}>
          {/* Steps */}
          {STEPS.map((st3, i) => (
            <View key={i} style={s.step}>
              <View style={[s.stepNum, { borderColor:st3.col+'65', backgroundColor:st3.col+'14' }]}>
                <Text style={[s.stepNumTxt, { color:st3.col }]}>{st3.num}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={[s.stepTitle, { color:st3.col }]}>{st3.title}</Text>
                <Text style={s.stepSub}>{st3.sub}</Text>
              </View>
            </View>
          ))}

          {/* Tailscale IP info */}
          <View style={[s.infoBand, { borderColor:C.cyan+'30', backgroundColor:C.cyan+'07' }]}>
            <MaterialIcons name="info-outline" size={12} color={C.cyan} />
            <View style={{ flex:1 }}>
              <Text style={[s.infoHdr, { color:C.cyan }]}>TAILSCALE IP FORMAT</Text>
              <Text style={[s.infoTxt, { color:C.cyan+'AA' }]}>{'Tailscale IPs start with 100.x.x.x\nPort: 8766 · Example: http://100.78.43.21:8766'}</Text>
            </View>
          </View>

          {/* Cloudflare info */}
          <View style={[s.infoBand, { borderColor:C.amber+'30', backgroundColor:C.amber+'07' }]}>
            <MaterialCommunityIcons name="cloud-outline" size={13} color={C.amber} />
            <View style={{ flex:1 }}>
              <Text style={[s.infoHdr, { color:C.amber }]}>CLOUDFLARE (NO APP ON PHONE)</Text>
              <Text style={[s.infoTxt, { color:C.amber+'AA' }]}>{'Run on PC:\ncloudflared tunnel --url http://localhost:8766\n\nCopy the https://butler-xxx.trycloudflare.com URL above.'}</Text>
            </View>
          </View>

          {/* Copy patch prompt */}
          <TouchableOpacity onPress={copyServerPrompt} activeOpacity={0.8}
            style={[s.actionBtn, { borderColor:C.purple+'50', backgroundColor:C.purple+'0A' }]}>
            <MaterialIcons name={copied?'check':'content-copy'} size={13} color={copied?C.green:C.purple} />
            <Text style={[s.actionTxt, { color:copied?C.green:C.purple }]}>
              {copied ? 'SERVER.PY PATCH COPIED!' : 'COPY SERVER.PY PATCH PROMPT'}
            </Text>
          </TouchableOpacity>
          <Text style={s.hint}>3-line change to butler_server.py — paste into Butler AI chat</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card:       { borderRadius:13, borderWidth:1.5, backgroundColor:C.surface, overflow:'hidden', position:'relative', marginBottom:14,
    ...Platform.select({ ios:{shadowColor:C.cyan,shadowOffset:{width:0,height:5},shadowOpacity:0.18,shadowRadius:16}, android:{elevation:9} }) },
  header:     { flexDirection:'row', alignItems:'center', gap:11, paddingHorizontal:14, paddingTop:12, paddingBottom:9 },
  iconBox:    { width:44, height:44, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0 },
  title:      { fontFamily:MONO, fontSize:13, fontWeight:'900', letterSpacing:1.5 },
  sub:        { fontFamily:MONO, fontSize:8, color:C.mid, letterSpacing:0.3, marginTop:2 },
  badge:      { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:8, paddingHorizontal:8, paddingVertical:5 },
  badgeTxt:   { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.8 },
  statusBand: { flexDirection:'row', alignItems:'center', gap:8, borderWidth:1, borderRadius:9, paddingHorizontal:12, paddingVertical:8, marginHorizontal:14, marginBottom:9 },
  statusTxt:  { fontFamily:MONO, fontSize:9, flex:1 },
  pingBadge:  { borderWidth:1, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  pingTxt:    { fontFamily:MONO, fontSize:8, fontWeight:'900' },
  label:      { fontFamily:MONO, fontSize:8, fontWeight:'900', color:C.dim, letterSpacing:1.5 },
  inputWrap:  { flex:1, flexDirection:'row', alignItems:'center', gap:8, borderWidth:1.5, borderRadius:10, backgroundColor:'rgba(0,0,0,0.3)', paddingHorizontal:11 },
  input:      { flex:1, fontFamily:MONO, fontSize:11, color:C.text, paddingVertical:11 },
  saveBtn:    { flexDirection:'row', alignItems:'center', gap:5, borderRadius:10, paddingHorizontal:13, paddingVertical:12 },
  saveBtnTxt: { fontFamily:MONO, fontSize:11, fontWeight:'900', color:'#000', letterSpacing:0.5 },
  chip:       { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:8, paddingHorizontal:9, paddingVertical:5 },
  chipTxt:    { fontFamily:MONO, fontSize:9 },
  actionBtn:  { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, borderWidth:1.5, borderRadius:10, paddingVertical:11 },
  actionTxt:  { fontFamily:MONO, fontSize:9.5, fontWeight:'900', letterSpacing:0.4 },
  testResult: { flexDirection:'row', alignItems:'center', gap:8, borderWidth:1, borderRadius:8, paddingHorizontal:12, paddingVertical:8, marginHorizontal:14, marginBottom:8 },
  testTxt:    { fontFamily:MONO, fontSize:9, flex:1, lineHeight:14 },
  featGrid:   { flexDirection:'row', flexWrap:'wrap', borderTopWidth:1, borderBottomWidth:1, borderColor:'rgba(0,229,255,0.12)' },
  featCell:   { width:'33.33%', alignItems:'center', paddingVertical:11, gap:5 },
  featTxt:    { fontFamily:MONO, fontSize:8, textAlign:'center', lineHeight:12 },
  guideToggle:{ flexDirection:'row', alignItems:'center', gap:7, borderTopWidth:1, paddingHorizontal:14, paddingVertical:9 },
  guideTxt:   { fontFamily:MONO, fontSize:8.5, fontWeight:'700', letterSpacing:0.8, flex:1 },
  step:       { flexDirection:'row', alignItems:'flex-start', gap:11 },
  stepNum:    { width:26, height:26, borderRadius:13, borderWidth:1.5, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepNumTxt: { fontFamily:MONO, fontSize:12, fontWeight:'900' },
  stepTitle:  { fontFamily:MONO, fontSize:10, fontWeight:'900', letterSpacing:0.3, marginBottom:2 },
  stepSub:    { fontFamily:MONO, fontSize:8.5, color:C.mid, lineHeight:13 },
  infoBand:   { flexDirection:'row', alignItems:'flex-start', gap:9, borderWidth:1, borderRadius:10, padding:11 },
  infoHdr:    { fontFamily:MONO, fontSize:9, fontWeight:'900', letterSpacing:0.8, marginBottom:3 },
  infoTxt:    { fontFamily:MONO, fontSize:8.5, lineHeight:13 },
  hint:       { fontFamily:MONO, fontSize:8, color:C.dim, textAlign:'center', lineHeight:12 },
});
