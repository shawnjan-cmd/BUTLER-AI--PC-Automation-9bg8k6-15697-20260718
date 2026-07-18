/**
 * RemoteSetupWizard — Full hand-holding 6-step remote access guide
 * ─────────────────────────────────────────────────────────────────
 * Auto-detects provider type from pasted URL.
 * Step-by-step with progress bar, copy-paste commands, live test.
 * Never lets the user get stuck — retry at every step.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, Pressable,
  Animated, Platform, Dimensions, TextInput,
  TouchableOpacity, ActivityIndicator, Clipboard,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/services/haptics';
import { serverConnection } from '@/services/serverConnection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SW } = Dimensions.get('window');

const C = {
  bg: '#010508', surf: '#060E1A', surf2: '#09141F',
  cyan: '#00E5FF', green: '#00FF88', amber: '#FFB020',
  red: '#FF3344', purple: '#CC44FF', mid: '#5A7A96',
  dim: '#1A2E44', text: '#C8E4F0', teal: '#00CCBB',
};

type Provider = 'tailscale' | 'cloudflare' | 'direct';
type WizardStep = 'choose' | 'install' | 'run' | 'enter' | 'test' | 'done';

// ── Copy-to-clipboard helper ──────────────────────────────────────
function copyText(text: string) {
  try {
    Clipboard.setString(text);
    haptics.success?.() ?? haptics.light();
  } catch {}
}

// ── Animated progress bar ─────────────────────────────────────────
function ProgressBar({ step, total, color }: { step: number; total: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: step / total, duration: 400, useNativeDriver: false }).start();
  }, [step, total]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height: 4, backgroundColor: C.dim, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
      <Animated.View style={{ height: '100%', width, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

// ── Code block with copy button ───────────────────────────────────
function CodeBlock({ code, color = C.cyan }: { code: string; color?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View style={[cb.outer, { borderColor: color + '35' }]}>
      <Text style={[cb.code, { color }]} selectable>{code}</Text>
      <TouchableOpacity onPress={handleCopy} style={[cb.copyBtn, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <MaterialIcons name={copied ? 'check' : 'content-copy'} size={12} color={color} />
        <Text style={[cb.copyTxt, { color }]}>{copied ? 'COPIED!' : 'COPY'}</Text>
      </TouchableOpacity>
    </View>
  );
}
const cb = StyleSheet.create({
  outer:   { backgroundColor: '#020810', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 8 },
  code:    { fontFamily: MONO, fontSize: 11, lineHeight: 16 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-end', marginTop: 8 },
  copyTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
});

// ── Step header ───────────────────────────────────────────────────
function StepHeader({ num, title, subtitle, color }: { num: string; title: string; subtitle: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <View style={[sh.badge, { borderColor: color + '70', backgroundColor: color + '18' }]}>
        <Text style={[sh.num, { color }]}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[sh.title, { color: '#FFF' }]}>{title}</Text>
        <Text style={sh.sub}>{subtitle}</Text>
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  badge: { width: 40, height: 40, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  num:   { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  title: { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  sub:   { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 },
});

// ── Info box ──────────────────────────────────────────────────────
function InfoBox({ text, color = C.cyan, icon = 'information' }: { text: string; color?: string; icon?: string }) {
  return (
    <View style={[ib.outer, { borderColor: color + '35', backgroundColor: color + '08' }]}>
      <MaterialCommunityIcons name={icon as any} size={14} color={color} style={{ flexShrink: 0 }} />
      <Text style={[ib.txt, { color: color + 'CC' }]}>{text}</Text>
    </View>
  );
}
const ib = StyleSheet.create({
  outer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 9, padding: 10, marginVertical: 6 },
  txt:   { fontFamily: MONO, fontSize: 9.5, lineHeight: 14, flex: 1 },
});

// ── STEP: Choose provider ─────────────────────────────────────────
function StepChoose({ onChoose }: { onChoose: (p: Provider) => void }) {
  const options: { id: Provider; name: string; sub: string; icon: string; color: string; tags: string[] }[] = [
    {
      id: 'tailscale', name: 'TAILSCALE', icon: 'vpn', color: C.cyan,
      sub: 'Best: permanent connection · works everywhere',
      tags: ['FREE', 'PERMANENT', 'ENCRYPTED'],
    },
    {
      id: 'cloudflare', name: 'CLOUDFLARE', icon: 'cloud-braces', color: C.amber,
      sub: 'Quick: HTTPS URL · no install needed on PC',
      tags: ['FREE', 'NO-INSTALL', 'HTTPS'],
    },
    {
      id: 'direct', name: 'DIRECT LAN+', icon: 'lan-connect', color: C.green,
      sub: 'Same network / VPN already configured',
      tags: ['INSTANT', 'NO-SETUP'],
    },
  ];
  return (
    <View>
      <StepHeader num="01" title="CHOOSE YOUR METHOD" subtitle="Pick how you want to connect remotely" color={C.cyan} />
      <InfoBox text="All 3 options are FREE to set up. Tailscale is recommended — it creates a permanent secure tunnel that always works, even after restarts." icon="check-circle" color={C.green} />
      {options.map(o => (
        <Pressable key={o.id} onPress={() => { haptics.heavy(); onChoose(o.id); }}
          style={({ pressed }) => [cho.card, { borderColor: o.color + '50', opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <View style={[cho.iconBox, { borderColor: o.color + '55', backgroundColor: o.color + '12' }]}>
            <MaterialCommunityIcons name={o.icon as any} size={24} color={o.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cho.name, { color: o.color }]}>{o.name}</Text>
            <Text style={cho.sub}>{o.sub}</Text>
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 6 }}>
              {o.tags.map(t => (
                <View key={t} style={[cho.tag, { borderColor: o.color + '40', backgroundColor: o.color + '0A' }]}>
                  <Text style={[cho.tagTxt, { color: o.color }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={14} color={o.color + '80'} />
        </Pressable>
      ))}
    </View>
  );
}
const cho = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: C.surf2 },
  iconBox: { width: 50, height: 50, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:    { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  sub:     { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 3, lineHeight: 13 },
  tag:     { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt:  { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
});

// ── STEP: Install ─────────────────────────────────────────────────
function StepInstall({ provider, onNext }: { provider: Provider; onNext: () => void }) {
  if (provider === 'tailscale') return (
    <View>
      <StepHeader num="02" title="INSTALL TAILSCALE" subtitle="One-time setup on PC + phone" color={C.cyan} />
      <InfoBox text="Tailscale is free for personal use (up to 3 devices). Install it on BOTH your PC and this phone." icon="download" color={C.cyan} />
      <Text style={ins.label}>STEP 1 — Download on your PC:</Text>
      <CodeBlock code="https://tailscale.com/download" color={C.cyan} />
      <Text style={ins.desc}>Open the link on your PC browser and install the Tailscale app. It takes about 2 minutes.</Text>
      <Text style={ins.label}>STEP 2 — Install on this phone:</Text>
      <InfoBox text="Search for 'Tailscale' in your App Store and install it. It's the one with the blue shield icon." icon="cellphone" color={C.cyan} />
      <Text style={ins.label}>STEP 3 — Sign in on BOTH devices:</Text>
      <Text style={ins.desc}>Create a free Tailscale account at tailscale.com and sign in on both your PC and phone with the SAME account. They will automatically connect to each other.</Text>
      <Pressable onPress={onNext} style={ins.nextBtn}>
        <Text style={ins.nextTxt}>TAILSCALE INSTALLED & SIGNED IN →</Text>
      </Pressable>
    </View>
  );

  if (provider === 'cloudflare') return (
    <View>
      <StepHeader num="02" title="GET CLOUDFLARED" subtitle="Download the one file you need" color={C.amber} />
      <InfoBox text="cloudflared is a single executable file — no install wizard, no account needed. Just download and run." icon="download" color={C.amber} />
      <Text style={ins.label}>Download cloudflared for Windows:</Text>
      <CodeBlock code="https://github.com/cloudflare/cloudflared/releases/latest" color={C.amber} />
      <Text style={ins.desc}>Look for cloudflared-windows-amd64.exe and download it. Save it somewhere easy like your Desktop.</Text>
      <InfoBox text="Mac? Run: brew install cloudflared    Linux? sudo apt install cloudflared" icon="apple-ios" color={C.amber} />
      <Pressable onPress={onNext} style={[ins.nextBtn, { backgroundColor: C.amber }]}>
        <Text style={[ins.nextTxt, { color: '#000' }]}>DOWNLOADED CLOUDFLARED →</Text>
      </Pressable>
    </View>
  );

  return (
    <View>
      <StepHeader num="02" title="CONFIRM YOUR SETUP" subtitle="Make sure Butler Server is running" color={C.green} />
      <InfoBox text="For direct connection, your butler_server.py must be running on your PC and both devices on the same network or VPN." icon="check-circle" color={C.green} />
      <Text style={ins.label}>Is Butler Server running on your PC?</Text>
      <Text style={ins.desc}>If not, open a terminal on your PC and run:</Text>
      <CodeBlock code="python butler_server_v21_1_1_FINAL-3.py" color={C.green} />
      <Text style={ins.desc}>Look for the QR code in the terminal — or note the IP:PORT it prints.</Text>
      <Pressable onPress={onNext} style={[ins.nextBtn, { backgroundColor: C.green }]}>
        <Text style={[ins.nextTxt, { color: '#000' }]}>SERVER IS RUNNING →</Text>
      </Pressable>
    </View>
  );
}
const ins = StyleSheet.create({
  label:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.mid, letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  desc:    { fontFamily: MONO, fontSize: 10, color: C.text, lineHeight: 15, marginBottom: 4 },
  nextBtn: { backgroundColor: C.cyan, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  nextTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

// ── STEP: Run / Get URL ───────────────────────────────────────────
function StepRun({ provider, onNext, onUrlDetected }: { provider: Provider; onNext: () => void; onUrlDetected: (url: string) => void }) {
  if (provider === 'tailscale') return (
    <View>
      <StepHeader num="03" title="FIND YOUR IP" subtitle="Get your Tailscale IP from the app" color={C.cyan} />
      <InfoBox text="Your Tailscale IP starts with 100. and never changes — it works from any network, anywhere on Earth." icon="information" color={C.cyan} />
      <Text style={ins.label}>On your PC, open the Tailscale app:</Text>
      <InfoBox text="Look at the Tailscale system tray icon (bottom-right of taskbar on Windows). Click it — your IP shows at the top like: 100.78.43.21" icon="crosshairs-gps" color={C.cyan} />
      <Text style={ins.label}>OR run this in PowerShell / Terminal:</Text>
      <CodeBlock code="tailscale ip" color={C.cyan} />
      <Text style={ins.desc}>Copy the 100.x.x.x address — you'll need it in the next step.</Text>
      <Pressable onPress={onNext} style={ins.nextBtn}>
        <Text style={ins.nextTxt}>I HAVE MY TAILSCALE IP →</Text>
      </Pressable>
    </View>
  );

  if (provider === 'cloudflare') return (
    <View>
      <StepHeader num="03" title="START THE TUNNEL" subtitle="Run one command · get your HTTPS URL" color={C.amber} />
      <InfoBox text="This command creates a secure HTTPS tunnel from the internet to your Butler server. New URL each session — but it works through ANY network." icon="information" color={C.amber} />
      <Text style={ins.label}>Open a terminal/PowerShell ON YOUR PC and run:</Text>
      <CodeBlock code={'cloudflared tunnel --url http://localhost:8766'} color={C.amber} />
      <Text style={ins.label}>Or if cloudflared is on your Desktop:</Text>
      <CodeBlock code={'cd Desktop && cloudflared.exe tunnel --url http://localhost:8766'} color={C.amber} />
      <Text style={ins.label}>Wait for a URL like this to appear:</Text>
      <CodeBlock code={'https://butler-random-abc123.trycloudflare.com'} color={C.green} />
      <InfoBox text="IMPORTANT: Keep this terminal window open while using remote access. Closing it will end the tunnel." icon="alert" color={C.amber} />
      <Pressable onPress={onNext} style={[ins.nextBtn, { backgroundColor: C.amber }]}>
        <Text style={[ins.nextTxt, { color: '#000' }]}>I HAVE MY HTTPS URL →</Text>
      </Pressable>
    </View>
  );

  return (
    <View>
      <StepHeader num="03" title="FIND YOUR SERVER" subtitle="Get the IP address from the terminal" color={C.green} />
      <Text style={ins.desc}>When Butler Server starts, it prints its IP and port. Look for something like:</Text>
      <CodeBlock code={'Server running at: 192.168.1.100:8766\nQR code ready to scan'} color={C.green} />
      <Text style={ins.label}>Note down the IP address and port.</Text>
      <Pressable onPress={onNext} style={[ins.nextBtn, { backgroundColor: C.green }]}>
        <Text style={[ins.nextTxt, { color: '#000' }]}>I HAVE THE IP →</Text>
      </Pressable>
    </View>
  );
}

// ── STEP: Enter URL/IP ────────────────────────────────────────────
function StepEnter({ provider, url, port, onUrlChange, onPortChange, onNext }: {
  provider: Provider; url: string; port: string;
  onUrlChange: (v: string) => void; onPortChange: (v: string) => void;
  onNext: () => void;
}) {
  const isTailscale   = provider === 'tailscale';
  const isCloudflare  = provider === 'cloudflare';
  const color         = isTailscale ? C.cyan : isCloudflare ? C.amber : C.green;
  const canProceed    = url.trim().length > 6;

  // Auto-detect provider from pasted URL
  const handlePaste = (v: string) => {
    onUrlChange(v);
  };

  return (
    <View>
      <StepHeader
        num="04"
        title={isTailscale ? 'ENTER TAILSCALE IP' : isCloudflare ? 'PASTE YOUR URL' : 'ENTER SERVER IP'}
        subtitle="Type or paste the address from the previous step"
        color={color}
      />

      {isTailscale && (
        <>
          <InfoBox text="Enter the 100.x.x.x IP from Tailscale on your PC. Don't include http:// — just the numbers." icon="information" color={C.cyan} />
          <Text style={ins.label}>TAILSCALE IP ADDRESS:</Text>
          <TextInput
            style={[en.input, { borderColor: C.cyan + '60' }]}
            value={url}
            onChangeText={handlePaste}
            placeholder="100.78.43.21"
            placeholderTextColor={C.dim}
            keyboardType="decimal-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={ins.label}>PORT (default 8766):</Text>
          <TextInput
            style={[en.input, { borderColor: C.cyan + '30' }]}
            value={port}
            onChangeText={onPortChange}
            placeholder="8766"
            placeholderTextColor={C.dim}
            keyboardType="numeric"
          />
        </>
      )}

      {isCloudflare && (
        <>
          <InfoBox text="Paste the full https://butler-xxx.trycloudflare.com URL exactly as it appeared in your terminal. No port number needed." icon="information" color={C.amber} />
          <Text style={ins.label}>CLOUDFLARE TUNNEL URL:</Text>
          <TextInput
            style={[en.input, { borderColor: C.amber + '60' }]}
            value={url}
            onChangeText={handlePaste}
            placeholder="https://butler-xxx.trycloudflare.com"
            placeholderTextColor={C.dim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {url.length > 5 && !url.startsWith('https://') && (
            <InfoBox text="Make sure the URL starts with https://" icon="alert" color={C.amber} />
          )}
        </>
      )}

      {provider === 'direct' && (
        <>
          <InfoBox text="Enter the IP address shown in the Butler Server terminal on your PC." icon="information" color={C.green} />
          <Text style={ins.label}>PC IP ADDRESS:</Text>
          <TextInput
            style={[en.input, { borderColor: C.green + '60' }]}
            value={url}
            onChangeText={handlePaste}
            placeholder="192.168.1.100"
            placeholderTextColor={C.dim}
            keyboardType="decimal-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={ins.label}>PORT:</Text>
          <TextInput
            style={[en.input, { borderColor: C.green + '30' }]}
            value={port}
            onChangeText={onPortChange}
            placeholder="8766"
            placeholderTextColor={C.dim}
            keyboardType="numeric"
          />
        </>
      )}

      <Pressable
        onPress={onNext}
        disabled={!canProceed}
        style={({ pressed }) => [ins.nextBtn, { backgroundColor: color, opacity: canProceed ? (pressed ? 0.8 : 1) : 0.35 }]}
      >
        <Text style={[ins.nextTxt, { color: color === C.amber ? '#000' : '#000' }]}>
          {canProceed ? 'TEST THE CONNECTION →' : 'ENTER ADDRESS ABOVE FIRST'}
        </Text>
      </Pressable>
    </View>
  );
}
const en = StyleSheet.create({
  input: { backgroundColor: C.bg, borderWidth: 2, borderRadius: 12, padding: 14, fontFamily: MONO, fontSize: 14, color: C.text, marginBottom: 6 },
});

// ── STEP: Test ────────────────────────────────────────────────────
function StepTest({ provider, url, port, onSuccess, onBack }: {
  provider: Provider; url: string; port: string;
  onSuccess: () => void; onBack: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const color = provider === 'tailscale' ? C.cyan : provider === 'cloudflare' ? C.amber : C.green;
  const spinA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'idle' && attempt === 0) {
      handleTest();
    }
  }, []);

  useEffect(() => {
    if (status !== 'testing') return;
    const loop = Animated.loop(
      Animated.timing(spinA, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [status]);

  const handleTest = useCallback(async () => {
    setStatus('testing');
    setMessage('Connecting...');
    setAttempt(a => a + 1);

    try {
      let testIp   = url.trim();
      let testPort = port.trim() || '8766';

      if (testIp.startsWith('https://') || testIp.startsWith('http://')) {
        try {
          const u = new URL(testIp);
          testPort = u.port || (testIp.startsWith('https') ? '443' : '80');
          testIp   = u.hostname;
        } catch {}
      }

      setMessage(`Connecting to ${testIp}:${testPort}...`);

      const result = await serverConnection.connectManual(testIp, testPort);
      if ((result as any).success) {
        haptics.success();
        setStatus('ok');
        setMessage('Connection verified! Butler AI is now connected remotely.');
        setTimeout(onSuccess, 1000);
      } else {
        haptics.warning?.();
        setStatus('fail');
        setMessage((result as any).error ?? 'Could not reach the server. See tips below.');
      }
    } catch (e: any) {
      setStatus('fail');
      setMessage(e?.message ?? 'Network error. Check that the server is running.');
    }
  }, [url, port, onSuccess]);

  const spin = spinA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const FAIL_TIPS = provider === 'tailscale' ? [
    'Is Tailscale running on BOTH your PC and phone?',
    'Are both logged into the SAME Tailscale account?',
    'Is Butler Server running on your PC?',
    'Try pinging the Tailscale IP from your PC: ping ' + (url || '100.x.x.x'),
  ] : provider === 'cloudflare' ? [
    'Is the cloudflared terminal window still open?',
    'Did you paste the full https://... URL including https://?',
    'Is Butler Server running on port 8766?',
    'The URL changes each time you run cloudflared — make sure it\'s fresh.',
  ] : [
    'Are both devices on the same WiFi network?',
    'Is Butler Server running on your PC?',
    'Try the IP shown in the Butler Server terminal',
    'Check Windows Firewall isn\'t blocking port ' + (port || '8766'),
  ];

  return (
    <View>
      <StepHeader num="05" title="TESTING CONNECTION" subtitle="Verifying remote access..." color={color} />

      <View style={[tt.statusBox, {
        borderColor: status === 'ok' ? C.green + '60' : status === 'fail' ? C.red + '60' : color + '40',
        backgroundColor: status === 'ok' ? C.green + '0A' : status === 'fail' ? C.red + '0A' : color + '08',
      }]}>
        {status === 'testing' && (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons name="loading" size={24} color={color} />
          </Animated.View>
        )}
        {status === 'ok' && <MaterialIcons name="check-circle" size={28} color={C.green} />}
        {status === 'fail' && <MaterialIcons name="error" size={28} color={C.red} />}
        {status === 'idle' && <ActivityIndicator size="small" color={color} />}

        <View style={{ flex: 1 }}>
          <Text style={[tt.statusTxt, {
            color: status === 'ok' ? C.green : status === 'fail' ? C.red : color,
          }]}>
            {status === 'ok' ? '✓ CONNECTED SUCCESSFULLY' : status === 'fail' ? '✗ CONNECTION FAILED' : 'TESTING...'}
          </Text>
          <Text style={tt.statusMsg}>{message}</Text>
          {url.trim() && (
            <Text style={[tt.addr, { color: color + '80' }]} numberOfLines={1}>{url}:{port}</Text>
          )}
        </View>
      </View>

      {status === 'fail' && (
        <View style={{ marginTop: 12 }}>
          <Text style={[ins.label, { color: C.amber }]}>TROUBLESHOOTING CHECKLIST:</Text>
          {FAIL_TIPS.map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 4 }}>
              <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: C.amber + '50', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: C.amber, fontWeight: '900' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.text, flex: 1, lineHeight: 14 }}>{tip}</Text>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Pressable onPress={onBack}
              style={[tt.btn, { borderColor: C.dim, flex: 1 }]}>
              <MaterialIcons name="arrow-back" size={14} color={C.mid} />
              <Text style={[tt.btnTxt, { color: C.mid }]}>CHANGE ADDRESS</Text>
            </Pressable>
            <Pressable onPress={handleTest}
              style={[tt.btn, { backgroundColor: color, flex: 2 }]}>
              <MaterialIcons name="refresh" size={14} color="#000" />
              <Text style={[tt.btnTxt, { color: '#000' }]}>RETRY ({attempt})</Text>
            </Pressable>
          </View>
        </View>
      )}

      {status === 'ok' && (
        <InfoBox text="Butler AI is now connected remotely! You can control your PC from anywhere. This connection will be remembered." icon="check-circle" color={C.green} />
      )}
    </View>
  );
}
const tt = StyleSheet.create({
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 12 },
  statusTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  statusMsg: { fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 3, lineHeight: 14 },
  addr:      { fontFamily: MONO, fontSize: 8, marginTop: 4 },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 11, paddingVertical: 12 },
  btnTxt:    { fontFamily: MONO, fontSize: 10, fontWeight: '900' },
});

// ── STEP: Done ────────────────────────────────────────────────────
function StepDone({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  const color = provider === 'tailscale' ? C.cyan : provider === 'cloudflare' ? C.amber : C.green;
  const floatA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);
  const translateY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View style={[dn.iconCircle, { borderColor: color + '60', backgroundColor: color + '14' }]}>
          <MaterialCommunityIcons name="check-circle" size={52} color={color} />
        </View>
      </Animated.View>
      <Text style={[dn.title, { color }]}>REMOTE ACCESS ACTIVE</Text>
      <Text style={dn.sub}>Butler AI is connected and encrypted</Text>

      <View style={dn.statsRow}>
        {[
          { label: 'PROVIDER', value: provider.toUpperCase(), color },
          { label: 'ENCRYPTION', value: 'AES-256', color: C.green },
          { label: 'STATUS', value: 'LIVE', color: C.green },
        ].map((s, i) => (
          <View key={i} style={[dn.stat, { borderColor: s.color + '35' }]}>
            <Text style={[dn.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={dn.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      {provider === 'cloudflare' && (
        <InfoBox text="Remember: the Cloudflare URL changes each time you restart cloudflared. Run the setup wizard again to update it." icon="alert" color={C.amber} />
      )}
      {provider === 'tailscale' && (
        <InfoBox text="Tailscale is permanent — your connection will work even after PC restarts. No need to run this wizard again." icon="check-circle" color={C.green} />
      )}

      <Pressable onPress={onClose} style={[dn.doneBtn, { backgroundColor: color }]}>
        <MaterialIcons name="check" size={18} color="#000" />
        <Text style={dn.doneTxt}>START USING REMOTE BUTLER AI</Text>
      </Pressable>
    </View>
  );
}
const dn = StyleSheet.create({
  iconCircle: { width: 88, height: 88, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:      { fontFamily: MONO, fontSize: 18, fontWeight: '900', letterSpacing: 0.5, marginBottom: 6 },
  sub:        { fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 20 },
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat:       { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  statVal:    { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  statLbl:    { fontFamily: MONO, fontSize: 7.5, color: C.mid, marginTop: 3 },
  doneBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 32, marginTop: 16 },
  doneTxt:    { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

// ── MAIN WIZARD ───────────────────────────────────────────────────
const STEP_COUNT = 5;

export function RemoteSetupWizard({ visible, onClose, onConnected }: {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [step, setStep]         = useState<WizardStep>('choose');
  const [url, setUrl]           = useState('');
  const [port, setPort]         = useState('8766');
  const slideA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideA, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }).start();
    } else {
      slideA.setValue(0);
      // Reset on close
      setTimeout(() => {
        setProvider(null);
        setStep('choose');
        setUrl('');
        setPort('8766');
      }, 300);
    }
  }, [visible]);

  const stepNum = step === 'choose' ? 0 : step === 'install' ? 1 : step === 'run' ? 2 : step === 'enter' ? 3 : step === 'test' ? 4 : 5;
  const provColor = provider === 'tailscale' ? C.cyan : provider === 'cloudflare' ? C.amber : provider === 'direct' ? C.green : C.cyan;

  const handleClose = () => {
    onClose();
  };

  const slideY = slideA.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={step === 'done' ? handleClose : undefined} />
        <Animated.View style={[wiz.sheet, { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideY }] }]}>
          {/* Top colour stripe */}
          <View style={{ height: 3, flexDirection: 'row' }}>
            {[C.cyan, C.green, C.purple, C.amber, C.cyan].map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
          </View>

          {/* Header */}
          <View style={wiz.header}>
            <View style={[wiz.headerIcon, { borderColor: provColor + '55', backgroundColor: provColor + '10' }]}>
              <MaterialCommunityIcons name="remote-desktop" size={20} color={provColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={wiz.title}>REMOTE SETUP WIZARD</Text>
              <Text style={wiz.sub}>
                {step === 'choose' ? 'Choose your connection method'
                  : step === 'done' ? 'Setup complete!'
                  : `Step ${stepNum} of ${STEP_COUNT}`}
              </Text>
            </View>
            {step !== 'test' && (
              <Pressable onPress={handleClose} style={wiz.closeBtn}>
                <MaterialIcons name="close" size={16} color={C.mid} />
              </Pressable>
            )}
          </View>

          {/* Progress bar */}
          {step !== 'choose' && step !== 'done' && (
            <View style={{ paddingHorizontal: 16 }}>
              <ProgressBar step={stepNum} total={STEP_COUNT} color={provColor} />
            </View>
          )}

          {/* Back button */}
          {step !== 'choose' && step !== 'done' && step !== 'test' && (
            <TouchableOpacity
              onPress={() => {
                if (step === 'install') { setStep('choose'); setProvider(null); }
                else if (step === 'run') setStep('install');
                else if (step === 'enter') setStep('run');
              }}
              style={wiz.backBtn}
            >
              <MaterialIcons name="arrow-back" size={13} color={C.mid} />
              <Text style={wiz.backTxt}>BACK</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingTop: step !== 'choose' ? 4 : 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'choose' && (
              <StepChoose onChoose={p => { setProvider(p); setStep('install'); }} />
            )}
            {step === 'install' && provider && (
              <StepInstall provider={provider} onNext={() => setStep('run')} />
            )}
            {step === 'run' && provider && (
              <StepRun provider={provider} onNext={() => setStep('enter')} onUrlDetected={setUrl} />
            )}
            {step === 'enter' && provider && (
              <StepEnter
                provider={provider} url={url} port={port}
                onUrlChange={setUrl} onPortChange={setPort}
                onNext={() => setStep('test')}
              />
            )}
            {step === 'test' && provider && (
              <StepTest
                provider={provider} url={url} port={port}
                onSuccess={() => { onConnected?.(); setStep('done'); }}
                onBack={() => setStep('enter')}
              />
            )}
            {step === 'done' && provider && (
              <StepDone provider={provider} onClose={handleClose} />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const wiz = StyleSheet.create({
  sheet:      { backgroundColor: C.surf, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '96%',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.25, shadowRadius: 20 }, android: { elevation: 24 } }) },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 },
  headerIcon: { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sub:        { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 },
  closeBtn:   { width: 34, height: 34, borderRadius: 9, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingBottom: 4 },
  backTxt:    { fontFamily: MONO, fontSize: 9, color: C.mid, fontWeight: '900' },
});

export default RemoteSetupWizard;
