import { ButlerPageStudioHost } from '@/components/ui/ButlerPageStudioHost';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CyberPanel } from '@/components/ui/CyberPanel';
import { useSkin } from '@/hooks/useSkin';
import { serverMetrics, MetricSnapshot } from '@/services/serverMetrics';

function MetricTile({ icon, label, value, detail, color }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; detail: string; color: string }) {
  const skin = useSkin();
  return (
    <CyberPanel accentColor={color} screenWidth={220} scanline={false} style={[styles.tile, { backgroundColor: skin.panel }]}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.tileLabel, { color: skin.dim }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: skin.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.tileDetail, { color: skin.mid }]} numberOfLines={1}>{detail}</Text>
    </CyberPanel>
  );
}

export default function MonitorScreen() {
  const skin = useSkin();
  const { width } = useWindowDimensions();
  const [snapshot, setSnapshot] = useState<MetricSnapshot | null>(serverMetrics.getCache());
  const [loading, setLoading] = useState(!snapshot);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (force = false) => {
    if (force) setRefreshing(true); else setLoading(true);
    const next = await serverMetrics.fetch(force);
    setSnapshot(next);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh(false);
    const timer = setInterval(() => refresh(false), 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  const metrics = snapshot?.metrics;
  const compact = width < 380;
  const online = Boolean(snapshot?.metrics);
  const tiles = useMemo(() => metrics ? [
    { icon: 'speedometer' as const, label: 'CPU', value: `${Math.round(metrics.cpu?.percent ?? 0)}%`, detail: `${metrics.cpu?.cores ?? 0} cores`, color: skin.accent },
    { icon: 'memory' as const, label: 'MEMORY', value: `${Math.round(metrics.memory?.percent ?? 0)}%`, detail: `${metrics.memory?.used_gb ?? 0} / ${metrics.memory?.total_gb ?? 0} GB`, color: skin.accent2 },
    { icon: 'harddisk' as const, label: 'DISK', value: `${Math.round(metrics.disk?.percent ?? 0)}%`, detail: `${metrics.disk?.free_gb ?? 0} GB free`, color: skin.accent3 },
    { icon: 'lan-connect' as const, label: 'LATENCY', value: snapshot ? `${snapshot.latency}ms` : '—', detail: metrics.system?.hostname || 'paired server', color: skin.ok },
  ] : [], [metrics, snapshot, skin]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: skin.bg }]}>
      <View style={[styles.header, { width: Math.min(width - 28, 620) }]}>
        <View>
          <Text style={[styles.eyebrow, { color: skin.accent }]}>BUTLER / PC MONITOR</Text>
          <Text style={[styles.title, { color: skin.text }]}>Live system pulse</Text>
        </View>
        <Pressable onPress={() => refresh(true)} style={[styles.refresh, { borderColor: skin.border }]} accessibilityLabel="Refresh PC metrics">
          {refreshing ? <ActivityIndicator size="small" color={skin.accent} /> : <MaterialCommunityIcons name="refresh" size={20} color={skin.accent} />}
        </Pressable>
      </View>

      <ButlerPageStudioHost pageId="monitor" />
      <View style={[styles.status, { width: Math.min(width - 28, 620), backgroundColor: skin.panel2, borderColor: online ? `${skin.ok}55` : `${skin.warn}55` }]}>
        <View style={[styles.statusDot, { backgroundColor: online ? skin.ok : skin.warn }]} />
        <Text style={[styles.statusText, { color: skin.text }]}>{online ? 'Connected to real PC metrics' : loading ? 'Connecting to paired server…' : 'Server metrics unavailable'}</Text>
        <Text style={[styles.statusMeta, { color: skin.dim }]}>{snapshot ? new Date(snapshot.fetchedAt).toLocaleTimeString() : 'No cached snapshot'}</Text>
      </View>

      <View style={[styles.grid, { width: Math.min(width - 28, 620), gap: compact ? 8 : 12 }]}>
        {tiles.map(tile => <MetricTile key={tile.label} {...tile} />)}
        {!tiles.length && <View style={[styles.empty, { borderColor: skin.border }]}><MaterialCommunityIcons name="server-network-off" size={30} color={skin.dim} /><Text style={[styles.emptyText, { color: skin.mid }]}>{loading ? 'Reading the paired PC…' : 'Pair Butler with the Python server to see live data.'}</Text></View>}
      </View>

      <View style={[styles.footer, { width: Math.min(width - 28, 620) }]}>
        <MaterialCommunityIcons name="shield-check-outline" size={18} color={skin.accent} />
        <Text style={[styles.footerText, { color: skin.dim }]}>Metrics are read-only here. Butler never launches scripts automatically.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 14, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 25, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  refresh: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  status: { minHeight: 52, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  statusText: { fontSize: 13, fontWeight: '800', flex: 1 },
  statusMeta: { fontSize: 10, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: { width: '48%', minHeight: 128, borderRadius: 20, borderWidth: 1, padding: 13, marginBottom: 2 },
  tileIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tileValue: { fontSize: 25, fontWeight: '900', marginTop: 2 },
  tileDetail: { fontSize: 10, marginTop: 3 },
  empty: { width: '100%', minHeight: 180, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto', paddingVertical: 18 },
  footerText: { fontSize: 11, textAlign: 'center', flex: 1 },
});
