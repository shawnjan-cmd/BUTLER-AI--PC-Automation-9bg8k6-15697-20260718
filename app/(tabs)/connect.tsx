import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_CONFIG, type ServerConfig, loadConfig, saveConfig, testServerConnection } from '@/services/connection';
import { buildOpenSourceServerTemplate } from '@/services/openSourceServerTemplate';
import { safeSetClipboard } from '@/services/safeClipboard';

export default function ConnectScreen() {
  const [form, setForm] = useState<ServerConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState('Load your server details and run a live connection test.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const cfg = await loadConfig();
      setForm(cfg);
    })();
  }, []);

  const canTest = useMemo(() => Boolean(form.host.trim() && form.port.trim()), [form.host, form.port]);

  const updateField = useCallback(<K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onSave = useCallback(async () => {
    await saveConfig(form);
    setStatus('Connection settings saved.');
    Alert.alert('Saved', 'Server settings are now stored on this device.');
  }, [form]);

  const onTest = useCallback(async () => {
    if (!canTest) {
      Alert.alert('Missing fields', 'Host and port are required.');
      return;
    }

    setBusy(true);
    try {
      const result = await testServerConnection(form);
      if (result.ok) {
        await saveConfig(form);
        setStatus(`Connected via ${result.endpoint} (${result.latencyMs ?? 0}ms).`);
        Alert.alert('Connected', 'Server is reachable and settings were saved.');
      } else {
        setStatus(result.error || 'Unable to reach server.');
        Alert.alert('Connection failed', result.error || 'Unable to reach server.');
      }
    } finally {
      setBusy(false);
    }
  }, [canTest, form]);

  const onCopyPythonServer = useCallback(async () => {
    const script = buildOpenSourceServerTemplate({ defaultPort: form.port });
    await safeSetClipboard(script);
    setStatus('Open-source Python server template copied to clipboard.');
    Alert.alert('Template copied', 'Paste into server.py and run it locally so users can audit the full source.');
  }, [form.port]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.eyebrow}>SERVER LINK</Text>
          <Text style={s.title}>Connect Butler to your PC</Text>
          <Text style={s.subtitle}>This is now a real backend connection screen with persistence, auth, and live health checks.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Host / IP</Text>
          <TextInput
            value={form.host}
            onChangeText={(value) => updateField('host', value)}
            placeholder="192.168.1.100"
            placeholderTextColor="#6D86A5"
            autoCapitalize="none"
            style={s.input}
          />

          <Text style={s.label}>Port</Text>
          <TextInput
            value={form.port}
            onChangeText={(value) => updateField('port', value.replace(/[^0-9]/g, ''))}
            placeholder="11434"
            placeholderTextColor="#6D86A5"
            keyboardType="number-pad"
            style={s.input}
          />

          <Text style={s.label}>****** (optional)</Text>
          <TextInput
            value={form.token}
            onChangeText={(value) => updateField('token', value)}
            placeholder="Paste token if your server requires it"
            placeholderTextColor="#6D86A5"
            autoCapitalize="none"
            style={s.input}
          />

          <View style={s.switchRow}>
            <View>
              <Text style={s.switchTitle}>Use HTTPS</Text>
              <Text style={s.switchSub}>Enable this when your endpoint has TLS.</Text>
            </View>
            <Switch value={form.useHttps} onValueChange={(value) => updateField('useHttps', value)} trackColor={{ false: '#3B4D62', true: '#22D3A5' }} />
          </View>
        </View>

        <Text style={s.status}>{status}</Text>

        <View style={s.actions}>
          <Pressable style={s.action} onPress={() => void onSave()} disabled={busy}>
            <Text style={s.actionText}>Save Settings</Text>
          </Pressable>
          <Pressable style={[s.action, s.actionPrimary, (!canTest || busy) && s.actionDisabled]} onPress={() => void onTest()} disabled={!canTest || busy}>
            <Text style={s.actionText}>{busy ? 'Testing…' : 'Test & Connect'}</Text>
          </Pressable>
        </View>

        <Pressable style={s.openSourceAction} onPress={() => void onCopyPythonServer()}>
          <Text style={s.openSourceTitle}>Copy Open-Source Python Server</Text>
          <Text style={s.openSourceSub}>Lets users run and audit your backend source directly.</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#03060C' },
  content: { padding: 16, paddingBottom: 180, gap: 14 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(118,211,255,0.42)',
    backgroundColor: '#081425',
    padding: 15,
    gap: 7,
  },
  eyebrow: { color: '#7FD3FF', fontSize: 10, letterSpacing: 1.2, fontWeight: '900' },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#B8CCE7', fontSize: 13, lineHeight: 19 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0E182C',
    padding: 12,
    gap: 8,
  },
  label: { color: '#D8E9FF', fontSize: 12, fontWeight: '800' },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: '#111E33',
    color: '#EFF8FF',
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 14,
  },
  switchRow: {
    marginTop: 4,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: '#111E33',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  switchTitle: { color: '#ECF6FF', fontSize: 13, fontWeight: '800' },
  switchSub: { color: '#91AAC8', fontSize: 11, marginTop: 2 },
  status: { color: '#A8C4E4', fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#132036',
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionPrimary: {
    borderColor: 'rgba(43,227,190,0.55)',
    backgroundColor: 'rgba(20,228,182,0.18)',
  },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: '#E6F4FF', fontSize: 12, fontWeight: '900' },
  openSourceAction: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(136,197,255,0.42)',
    backgroundColor: '#101E34',
    padding: 12,
    gap: 4,
  },
  openSourceTitle: { color: '#E2F3FF', fontSize: 12, fontWeight: '900' },
  openSourceSub: { color: '#9CBCE0', fontSize: 11, lineHeight: 16 },
});
