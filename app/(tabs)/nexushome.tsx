import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadPreferences } from '@/services/appPreferences';
import { loadConfig, testServerConnection } from '@/services/connection';

type HealthState = {
  ready: boolean;
  ok: boolean;
  label: string;
  latencyMs: number | null;
  endpoint: string | null;
};

export default function NexusHomeScreen() {
  const [health, setHealth] = useState<HealthState>({
    ready: false,
    ok: false,
    label: 'Checking server status…',
    latencyMs: null,
    endpoint: null,
  });
  const [model, setModel] = useState('—');
  const [target, setTarget] = useState('Not configured');

  const refresh = useCallback(async () => {
    const [cfg, prefs] = await Promise.all([loadConfig(), loadPreferences()]);
    setModel(prefs.defaultModel);

    if (!cfg.host) {
      setTarget('Not configured');
      setHealth({
        ready: true,
        ok: false,
        label: 'Set your server on Connect to enable live automation.',
        latencyMs: null,
        endpoint: null,
      });
      return;
    }

    const scheme = cfg.useHttps ? 'https' : 'http';
    setTarget(`${scheme}://${cfg.host}:${cfg.port}`);

    const result = await testServerConnection(cfg);
    setHealth({
      ready: true,
      ok: result.ok,
      label: result.ok ? 'Server online and reachable.' : result.error || 'Server offline',
      latencyMs: result.latencyMs,
      endpoint: result.endpoint,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>ONSPACE READY</Text>
          <Text style={s.title}>Butler Command Center</Text>
          <Text style={s.subtitle}>A full visual/backend reset focused on stable server connectivity and usable AI execution.</Text>
        </View>

        <View style={s.grid}>
          <View style={[s.panel, health.ok ? s.panelOk : s.panelWarn]}>
            <Text style={s.panelLabel}>Server Health</Text>
            <Text style={s.panelMain}>{health.ready ? (health.ok ? 'ONLINE' : 'OFFLINE') : 'CHECKING'}</Text>
            <Text style={s.panelSub}>{health.label}</Text>
            {health.latencyMs != null ? <Text style={s.meta}>Latency: {health.latencyMs}ms</Text> : null}
            {health.endpoint ? <Text style={s.meta}>Probe: {health.endpoint}</Text> : null}
          </View>

          <View style={s.panel}>
            <Text style={s.panelLabel}>Active Target</Text>
            <Text style={s.panelMainSmall}>{target}</Text>
            <Text style={s.meta}>Default model: {model}</Text>
          </View>
        </View>

        <View style={s.actions}>
          <Pressable style={s.actionPrimary} onPress={() => router.push('/(tabs)/butler' as any)}>
            <Text style={s.actionPrimaryText}>Open Butler Chat</Text>
          </Pressable>
          <View style={s.secondaryRow}>
            <Pressable style={s.actionSecondary} onPress={() => router.push('/(tabs)/connect' as any)}>
              <Text style={s.actionSecondaryText}>Configure Server</Text>
            </Pressable>
            <Pressable style={s.actionSecondary} onPress={() => void refresh()}>
              <Text style={s.actionSecondaryText}>Refresh Status</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#03060D' },
  content: { padding: 16, paddingBottom: 180, gap: 14 },
  hero: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(104,204,255,0.45)',
    backgroundColor: '#091426',
    gap: 8,
  },
  eyebrow: { color: '#79D3FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#B7CAE5', fontSize: 13, lineHeight: 19 },
  grid: { gap: 10 },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0E182B',
    padding: 13,
    gap: 6,
  },
  panelOk: { borderColor: 'rgba(46,240,185,0.5)' },
  panelWarn: { borderColor: 'rgba(255,156,92,0.55)' },
  panelLabel: { color: '#95B5D7', fontSize: 11, fontWeight: '800' },
  panelMain: { color: '#E7F4FF', fontSize: 26, fontWeight: '900' },
  panelMainSmall: { color: '#E7F4FF', fontSize: 16, fontWeight: '700' },
  panelSub: { color: '#CCDEEF', fontSize: 12, lineHeight: 17 },
  meta: { color: '#84A4C6', fontSize: 11 },
  actions: { gap: 8 },
  actionPrimary: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(130,220,255,0.55)',
    backgroundColor: 'rgba(70,167,255,0.2)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionPrimaryText: { color: '#EBF7FF', fontSize: 13, fontWeight: '900' },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  actionSecondary: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#111D31',
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionSecondaryText: { color: '#CDE4FF', fontSize: 12, fontWeight: '800' },
});
