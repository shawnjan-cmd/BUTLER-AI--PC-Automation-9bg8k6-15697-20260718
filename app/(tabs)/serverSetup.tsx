import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSkin } from '@/hooks/useSkin';
import { ButlerSignalIcon } from '@/components/ui/ButlerSignalIcon';
import { haptics } from '@/services/haptics';
import { isLocalLanAddress, LOCAL_LAN_ONLY_ERROR, serverConnection } from '@/services/serverConnection';

type StepState = 'idle' | 'working' | 'passed' | 'failed';

const STEPS = [
  { icon: 'package-variant-closed' as const, title: 'Get the PC server package', body: 'Use the supplied Butler companion-server package on the PC that should stay private. Do not expose it publicly or use an untrusted download source.' },
  { icon: 'lan-connect' as const, title: 'Find your PC', body: 'Enter the local IP address and port shown by the running Python server. Butler never invents a connection.' },
  { icon: 'cellphone-key' as const, title: 'Pair this phone', body: 'Enter the one-time pairing code visible on the PC server window or QR screen. Pairing locks the server to this device.' },
  { icon: 'robot-outline' as const, title: 'Verify local AI', body: 'Butler checks the real server health and reports the actual Ollama state. No cloud fallback is used.' },
  { icon: 'shield-check-outline' as const, title: 'Ready for Butler', body: 'The connection is verified. You can return to the Command Center and choose every script action yourself.' },
];

export default function ServerSetupScreen() {
  const skin = useSkin();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8765');
  const [code, setCode] = useState('');
  const [states, setStates] = useState<StepState[]>(['idle', 'idle', 'idle', 'idle', 'idle']);
  const [message, setMessage] = useState('');
  const slide = useRef(new Animated.Value(0)).current;
  const compact = width < 380;
  const active = STEPS[step];
  const complete = states[1] === 'passed' && states[2] === 'passed' && states[3] === 'passed';

  useEffect(() => {
    Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }).start();
    return () => slide.stopAnimation();
  }, [step, slide]);

  const setState = (index: number, value: StepState) => setStates(prev => prev.map((s, i) => i === index ? value : s));
  const next = () => { haptics.medium(); setMessage(''); setStep(s => Math.min(STEPS.length - 1, s + 1)); };

  const testServer = async () => {
    if (!ip.trim() || !/^\d{1,5}$/.test(port.trim())) {
      setState(1, 'failed'); setMessage('Enter the real PC IP address and a numeric port.'); haptics.error(); return;
    }
    if (!isLocalLanAddress(ip.trim())) {
      setState(1, 'failed'); setMessage(LOCAL_LAN_ONLY_ERROR); haptics.error(); return;
    }
    setState(1, 'working'); setMessage('Testing the real server…');
    const latency = await serverConnection.quickPing(ip.trim(), port.trim());
    if (latency === null) { setState(1, 'failed'); setMessage('No response. Check that the Python server is running and both devices share the intended network.'); haptics.error(); return; }
    await serverConnection.saveManual(ip.trim(), port.trim());
    setState(1, 'passed'); setMessage(`Server responded in ${latency} ms.`); haptics.success();
  };

  const pairPhone = async () => {
    if (states[1] !== 'passed') { setMessage('Test the server address first.'); haptics.error(); return; }
    if (code.trim().length < 4) { setState(2, 'failed'); setMessage('Enter the pairing code shown on the PC.'); haptics.error(); return; }
    setState(2, 'working'); setMessage('Pairing and locking this server to the device…');
    const result = await serverConnection.pair(ip.trim(), port.trim(), code.trim(), true);
    if (!result.success) { setState(2, 'failed'); setMessage(result.error || 'Pairing failed.'); haptics.error(); return; }
    setState(2, 'passed'); setMessage('Pairing succeeded and the session was stored securely.'); haptics.connectionSuccess();
  };

  const verifyOllama = async () => {
    if (states[2] !== 'passed') { setMessage('Pair the phone before checking local AI.'); haptics.error(); return; }
    setState(3, 'working'); setMessage('Reading the real server and Ollama state…');
    try {
      const response = await serverConnection.request('/api/status');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      const ollama = String(data.ollamaStatus ?? data.ollama ?? data.ai?.status ?? '').toLowerCase();
      if (ollama && !['running', 'ready', 'online', 'connected'].some(v => ollama.includes(v))) {
        setState(3, 'failed'); setMessage(`Server is reachable, but Ollama reports: ${ollama}.`); haptics.error(); return;
      }
      setState(3, 'passed'); setMessage(ollama ? `Ollama is ${ollama}.` : 'Server is paired; Ollama status was not exposed by this server version.'); haptics.success();
    } catch (error: any) {
      setState(3, 'failed'); setMessage(error?.message || 'Could not read server status.'); haptics.error();
    }
  };

  const action = useMemo(() => {
    if (step === 0) return { label: 'I have the server package', onPress: next };
    if (step === 1) return { label: states[1] === 'passed' ? 'Continue' : 'Test server', onPress: states[1] === 'passed' ? next : testServer };
    if (step === 2) return { label: states[2] === 'passed' ? 'Continue' : 'Pair phone', onPress: states[2] === 'passed' ? next : pairPhone };
    if (step === 3) return { label: states[3] === 'passed' ? 'Continue' : 'Verify Ollama', onPress: states[3] === 'passed' ? next : verifyOllama };
    return { label: complete ? 'Return to Cosmetics' : 'Review connection steps', onPress: complete ? () => router.replace('/(tabs)/cosmetic' as any) : () => setStep(1) };
  }, [step, states, complete]);

  const isWorking = states[step] === 'working';
  const statusColor = states[step] === 'passed' ? skin.ok : states[step] === 'failed' ? skin.danger : skin.accent;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: skin.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.top, { width: Math.min(width - 28, 620) }]}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close server setup" style={[styles.close, { borderColor: skin.border }]}><MaterialCommunityIcons name="close" size={20} color={skin.mid} /></Pressable>
          <View style={styles.topCopy}><Text style={[styles.eyebrow, { color: skin.accent }]}>COSMETICS / LAN CONNECT · 5</Text><Text style={[styles.topTitle, { color: skin.text }]}>Connect your PC safely</Text></View>
          <Text style={[styles.counter, { color: skin.dim }]}>{step + 1}/{STEPS.length}</Text>
        </View>
        <View style={[styles.progress, { width: Math.min(width - 28, 620), backgroundColor: skin.panel2 }]}>{STEPS.map((_, i) => <View key={i} style={[styles.progressStep, { backgroundColor: i <= step ? skin.accent : skin.border }]} />)}</View>

        <Animated.View style={[styles.card, { width: Math.min(width - 28, 620), backgroundColor: skin.panel, borderColor: `${statusColor}55`, opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}55` }]}><ButlerSignalIcon icon={active.icon} size={compact ? 34 : 42} state={states[step] === 'failed' ? 'danger' : states[step] === 'passed' ? 'success' : 'active'} pulse={states[step] === 'working'} accessibilityLabel={active.title} /></View>
          <Text style={[styles.stepTitle, { color: skin.text }]}>{active.title}</Text>
          <Text style={[styles.stepBody, { color: skin.mid }]}>{active.body}</Text>
          {step === 1 && <View style={styles.form}><TextInput value={ip} onChangeText={setIp} placeholder="PC IP address" placeholderTextColor={skin.dim} autoCapitalize="none" keyboardType="numbers-and-punctuation" style={[styles.input, { color: skin.text, borderColor: skin.border, backgroundColor: skin.panel2 }]} accessibilityLabel="PC IP address" /><TextInput value={port} onChangeText={setPort} placeholder="Port" placeholderTextColor={skin.dim} keyboardType="number-pad" style={[styles.input, styles.port, { color: skin.text, borderColor: skin.border, backgroundColor: skin.panel2 }]} accessibilityLabel="PC server port" /></View>}
          {step === 2 && <TextInput value={code} onChangeText={setCode} placeholder="Pairing code from PC" placeholderTextColor={skin.dim} autoCapitalize="none" keyboardType="number-pad" style={[styles.input, { color: skin.text, borderColor: skin.border, backgroundColor: skin.panel2 }]} accessibilityLabel="PC pairing code" />}
          {message ? <View style={[styles.message, { backgroundColor: `${statusColor}12`, borderColor: `${statusColor}44` }]}><MaterialCommunityIcons name={states[step] === 'failed' ? 'alert-circle-outline' : 'information-outline'} size={17} color={statusColor} /><Text style={[styles.messageText, { color: skin.mid }]}>{message}</Text></View> : null}
        </Animated.View>

        <View style={[styles.bottom, { width: Math.min(width - 28, 620) }]}>
          <Pressable onPress={action.onPress} disabled={isWorking} accessibilityRole="button" accessibilityLabel={action.label} style={({ pressed }) => [styles.primary, { backgroundColor: isWorking ? skin.panel2 : skin.accent, opacity: pressed || isWorking ? 0.78 : 1 }]}>{isWorking ? <ActivityIndicator color={skin.bg} /> : <><Text style={[styles.primaryText, { color: skin.bg }]}>{action.label}</Text><MaterialCommunityIcons name="arrow-right" size={19} color={skin.bg} /></>}</Pressable>
          {step > 0 && <Pressable onPress={() => { haptics.light(); setMessage(''); setStep(s => s - 1); }} accessibilityLabel="Previous setup step" style={styles.back}><Text style={[styles.backText, { color: skin.dim }]}>Previous step</Text></Pressable>}
          <Text style={[styles.privacy, { color: skin.dim }]}><MaterialCommunityIcons name="lock-outline" size={13} color={skin.accent} /> Local network only · no automatic script launches · pairing is stored through encrypted app storage</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 14, paddingTop: 12 },
  flex: { flex: 1, width: '100%', alignItems: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  close: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, marginLeft: 10 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  topTitle: { fontSize: 21, fontWeight: '900', marginTop: 2 },
  counter: { fontSize: 12, fontWeight: '800' },
  progress: { height: 6, borderRadius: 5, padding: 1, flexDirection: 'row', gap: 3, marginBottom: 18 },
  progressStep: { flex: 1, borderRadius: 4 },
  card: { borderRadius: 26, borderWidth: 1, padding: 22, alignItems: 'center', minHeight: 330, justifyContent: 'center' },
  heroIcon: { width: 82, height: 82, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 25, fontWeight: '900', textAlign: 'center' },
  stepBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9, maxWidth: 470 },
  form: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 18 },
  input: { minHeight: 50, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, flex: 1 },
  port: { flex: 0.42 },
  message: { width: '100%', borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  messageText: { flex: 1, fontSize: 12, lineHeight: 17 },
  bottom: { marginTop: 'auto', paddingTop: 16, paddingBottom: 12, alignItems: 'center' },
  primary: { minHeight: 54, borderRadius: 17, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
  primaryText: { fontSize: 15, fontWeight: '900' },
  back: { paddingVertical: 12 },
  backText: { fontSize: 12, fontWeight: '800' },
  privacy: { textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: 4 },
});
