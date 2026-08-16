import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { opportunityEngine, Opportunity } from '@/services/opportunityEngine';
import { haptics } from '@/services/haptics';

export default function OpportunityReviewCard() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setItems(await opportunityEngine.list({ limit: 3 }));
    setBusy(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (item: Opportunity, decision: 'accepted' | 'deferred' | 'rejected') => {
    haptics.light();
    const updated = await opportunityEngine.review(item.id, decision);
    if (updated) setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
  };

  return (
    <View style={S.root}>
      <View style={S.head}>
        <View style={S.icon}><MaterialCommunityIcons name="lightbulb-on-outline" size={15} color="#FFB43D" /></View>
        <View style={{ flex: 1 }}><Text style={S.title}>BUTLER OPPORTUNITY ENGINE</Text><Text style={S.sub}>Sourced ideas only · review before implementation or billing</Text></View>
        <TouchableOpacity onPress={load} disabled={busy} style={S.refresh} accessibilityLabel="Refresh opportunity proposals"><MaterialCommunityIcons name="refresh" size={14} color="#38D9E8" /></TouchableOpacity>
      </View>
      {busy ? <ActivityIndicator color="#38D9E8" style={{ paddingVertical: 12 }} /> : items.length === 0 ? (
        <View style={S.empty}><MaterialCommunityIcons name="radar" size={16} color="#71809A" /><Text style={S.emptyText}>No sourced proposals yet. The server can store approved research here without changing the app automatically.</Text></View>
      ) : items.map(item => (
        <View key={item.id} style={S.item}>
          <View style={{ flex: 1 }}><Text style={S.itemTitle} numberOfLines={2}>{item.title}</Text><Text style={S.itemSummary} numberOfLines={3}>{item.summary}</Text><Text style={S.meta}>{item.category.toUpperCase()} · {item.status.toUpperCase()} · PLAY RISK {item.play_risk.toFixed(1)}/5</Text></View>
          <View style={S.actions}>
            <TouchableOpacity onPress={() => decide(item, 'accepted')} style={[S.action, S.accept]} accessibilityLabel={`Accept ${item.title}`}><MaterialCommunityIcons name="check" size={13} color="#2FE38A" /></TouchableOpacity>
            <TouchableOpacity onPress={() => decide(item, 'deferred')} style={[S.action, S.defer]} accessibilityLabel={`Defer ${item.title}`}><MaterialCommunityIcons name="clock-outline" size={13} color="#FFB43D" /></TouchableOpacity>
            <TouchableOpacity onPress={() => decide(item, 'rejected')} style={[S.action, S.reject]} accessibilityLabel={`Reject ${item.title}`}><MaterialCommunityIcons name="close" size={13} color="#FF4D5E" /></TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  root: { backgroundColor: '#0B0F17', borderRadius: 14, borderWidth: 1, borderColor: '#FFB43D45', padding: 12, gap: 9 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFB43D50', backgroundColor: '#FFB43D12' },
  title: { color: '#DCE6F2', fontFamily: 'monospace', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },
  sub: { color: '#71809A', fontFamily: 'monospace', fontSize: 7.5, marginTop: 3 },
  refresh: { width: 29, height: 29, borderRadius: 8, borderWidth: 1, borderColor: '#38D9E855', alignItems: 'center', justifyContent: 'center' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  emptyText: { flex: 1, color: '#71809A', fontFamily: 'monospace', fontSize: 7.5, lineHeight: 12 },
  item: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#1A2230', paddingTop: 9 },
  itemTitle: { color: '#DCE6F2', fontFamily: 'monospace', fontSize: 9, fontWeight: '900' },
  itemSummary: { color: '#A8B4C5', fontFamily: 'monospace', fontSize: 7.5, lineHeight: 12, marginTop: 3 },
  meta: { color: '#71809A', fontFamily: 'monospace', fontSize: 6.5, marginTop: 5 },
  actions: { justifyContent: 'center', gap: 5 },
  action: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  accept: { borderColor: '#2FE38A55', backgroundColor: '#2FE38A10' },
  defer: { borderColor: '#FFB43D55', backgroundColor: '#FFB43D10' },
  reject: { borderColor: '#FF4D5E55', backgroundColor: '#FF4D5E10' },
});
