import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { serverConnection } from '@/services/serverConnection';
import { useSkin } from '@/hooks/useSkin';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const POLL_INTERVAL_MS = 30_000;

type Proof = 'FRESH' | 'STALE' | 'UNVERIFIED' | 'ERROR';
type Probe = { at: number; ollamaStatus: string; latencyMs: number; model: string };

export default function ButlerEvidenceStrip({
  model = '',
  approvalPending = false,
  receiptRecorded = false,
}: { model?: string; approvalPending?: boolean; receiptRecorded?: boolean }) {
  const skin = useSkin();
  const [probe, setProbe] = useState<Probe | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  const refresh = useCallback(async () => {
    if (!serverConnection.isConnected()) {
      setProbe(null);
      return;
    }
    setIsProbing(true);
    const started = Date.now();
    try {
      const response = await serverConnection.request('/api/status');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const status = String(payload.ollamaStatus ?? payload.ollama ?? payload.ai?.status ?? 'unknown').toLowerCase();
      setProbe({
        at: Date.now(),
        ollamaStatus: status,
        latencyMs: Date.now() - started,
        model: String(payload.model ?? payload.active_model ?? model ?? ''),
      });
    } catch {
      setProbe({ at: Date.now(), ollamaStatus: 'error', latencyMs: 0, model: '' });
    } finally {
      setIsProbing(false);
    }
  }, [model]);

  useFocusEffect(useCallback(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]));

  const connected = serverConnection.isConnected();
  const isFresh = probe ? Date.now() - probe.at < POLL_INTERVAL_MS + 5_000 : false;
  const ollamaReady = probe && ['ready', 'running', 'online', 'connected', 'true'].some(value => probe.ollamaStatus.includes(value));
  const items: { label: string; detail?: string; icon: string; proof: Proof }[] = [
    connected && probe && isFresh
      ? { label: 'PC LINK VERIFIED', detail: `${probe.latencyMs}ms`, icon: 'monitor-check', proof: 'FRESH' }
      : connected && isProbing
        ? { label: 'VERIFYING PC LINK', icon: 'monitor-sync', proof: 'STALE' }
        : connected && probe?.ollamaStatus === 'error'
          ? { label: 'PC STATUS ERROR', icon: 'monitor-alert', proof: 'ERROR' }
          : connected
            ? { label: 'PC STATUS UNVERIFIED', icon: 'monitor-eye', proof: 'UNVERIFIED' }
            : { label: 'PC OFFLINE', icon: 'monitor-off', proof: 'UNVERIFIED' },
  ];
  if (connected && probe && isFresh) {
    items.push(ollamaReady
      ? { label: 'OLLAMA READY', detail: probe.model ? probe.model.split(':')[0].toUpperCase() : undefined, icon: 'brain', proof: 'FRESH' }
      : { label: 'OLLAMA UNAVAILABLE', detail: probe.ollamaStatus || undefined, icon: 'brain', proof: probe.ollamaStatus === 'error' ? 'ERROR' : 'UNVERIFIED' });
  } else if (model) {
    items.push({ label: 'MODEL UNVERIFIED', detail: model.split(':')[0].toUpperCase(), icon: 'brain', proof: 'UNVERIFIED' });
  }
  if (approvalPending) items.push({ label: 'REHEARSAL REQUIRED', icon: 'shield-check-outline', proof: 'STALE' });
  if (receiptRecorded) items.push({ label: 'RECEIPT RECORDED', icon: 'receipt-text-check-outline', proof: 'FRESH' });

  const colorFor = (proof: Proof) => proof === 'FRESH' ? skin.ok : proof === 'STALE' ? skin.warn : proof === 'ERROR' ? skin.danger : skin.mid;

  return (
    <Pressable onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Refresh real Butler evidence" style={[styles.root, { borderBottomColor: `${skin.border}88`, backgroundColor: `${skin.panel}F2` }]}>
      <View style={styles.inner}>
        {items.map((item, index) => {
          const color = colorFor(item.proof);
          return <View key={item.label} style={styles.item}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: `${skin.mid}44` }]} />}
            <MaterialCommunityIcons name={item.icon as any} size={12} color={color} />
            <Text style={[styles.label, { color }]}>{item.label}{item.detail ? <Text style={[styles.detail, { color: `${color}BB` }]}> · {item.detail}</Text> : null}</Text>
          </View>;
        })}
      </View>
      <Text style={[styles.hint, { color: skin.dim }]}>{isProbing ? 'VERIFYING' : 'TAP TO REFRESH'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', gap: 8, alignItems: 'center' },
  inner: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 10, marginRight: 2 },
  label: { fontFamily: MONO, fontSize: 7.2, fontWeight: '900', letterSpacing: 0.55 },
  detail: { fontFamily: MONO, fontSize: 6.5, fontWeight: '700' },
  hint: { fontFamily: MONO, fontSize: 6.2, fontWeight: '900', letterSpacing: 0.5 },
});
