import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { WorkflowSnapshot, WorkflowStage } from '@/services/automationWorkflowMonitor';
import { useSkin } from '@/hooks/useSkin';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const STAGES: { id: WorkflowStage; label: string; icon: string }[] = [
  { id: 'android_intent', label: 'INTENT', icon: 'cellphone-link' },
  { id: 'pattern_match', label: 'MATCH', icon: 'text-search' },
  { id: 'pc_preflight', label: 'SAFETY', icon: 'shield-check-outline' },
  { id: 'draft_ready', label: 'DRAFT', icon: 'script-text-outline' },
  { id: 'approval_required', label: 'APPROVE', icon: 'account-check-outline' },
  { id: 'receipt', label: 'RECEIPT', icon: 'receipt-text-check-outline' },
];

const stageIndex = (stage: WorkflowStage) => Math.max(0, STAGES.findIndex(item => item.id === stage));

export default function ButlerFlowLedgerCard({ snapshot }: { snapshot: WorkflowSnapshot | null }) {
  const skin = useSkin();
  if (!snapshot) return null;
  const activeIndex = stageIndex(snapshot.stage);
  const terminal = snapshot.state === 'blocked' || snapshot.state === 'failed' || snapshot.stage === 'receipt';
  const tone = snapshot.state === 'blocked' || snapshot.state === 'failed' ? skin.danger : snapshot.stage === 'receipt' ? skin.ok : skin.accent;
  const latest = snapshot.events[snapshot.events.length - 1];
  const receiptId = latest?.receiptId ? latest.receiptId.slice(0, 18).toUpperCase() : '';

  return (
    <View style={[styles.root, { borderColor: `${tone}65`, backgroundColor: skin.panel2 }]}>
      <View style={[styles.topRail, { backgroundColor: tone }]} />
      <View style={styles.head}>
        <View style={[styles.iconBox, { borderColor: `${tone}65`, backgroundColor: `${tone}12` }]}><MaterialCommunityIcons name={terminal ? 'file-certificate-outline' : 'source-branch'} size={16} color={tone} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: tone }]}>BUTLER FLOW LEDGER · {snapshot.state.toUpperCase()}</Text>
          <Text style={[styles.trace, { color: skin.mid }]}>TRACE {snapshot.correlationId.slice(-8).toUpperCase()} · {snapshot.events.length} VERIFIED EVENTS</Text>
        </View>
        <Text style={[styles.source, { color: latest?.source === 'paired_pc' ? skin.ok : skin.mid }]}>{latest?.source === 'paired_pc' ? 'PAIRED PC' : 'ANDROID'}</Text>
      </View>

      <View style={styles.timeline}>{STAGES.map((item, index) => {
        const passed = index < activeIndex;
        const active = index === activeIndex;
        const color = passed ? skin.ok : active ? tone : skin.dim;
        return <View key={item.id} style={styles.stepWrap}>
          <View style={[styles.stepDot, { borderColor: color, backgroundColor: passed ? skin.ok : active ? `${tone}18` : 'transparent' }]}>{passed ? <MaterialCommunityIcons name="check" size={8} color={skin.bg} /> : <MaterialCommunityIcons name={item.icon as any} size={9} color={color} />}</View>
          <Text style={[styles.stepText, { color }]}>{item.label}</Text>
        </View>;
      })}</View>

      <View style={[styles.detail, { borderTopColor: `${tone}2A` }]}>
        <MaterialCommunityIcons name={snapshot.state === 'blocked' || snapshot.state === 'failed' ? 'alert-circle-outline' : 'information-outline'} size={14} color={tone} />
        <Text style={[styles.detailText, { color: skin.mid }]}>{latest?.detail || 'Workflow state is being prepared. No script has run.'}</Text>
      </View>

      {receiptId ? <View style={[styles.receipt, { borderColor: `${skin.ok}55`, backgroundColor: `${skin.ok}0D` }]}><MaterialCommunityIcons name="fingerprint" size={13} color={skin.ok} /><Text style={[styles.receiptText, { color: skin.ok }]}>RECEIPT {receiptId}</Text></View> : null}
      {!terminal && <Pressable onPress={() => router.push('/(tabs)/scripts' as any)} accessibilityRole="button" accessibilityLabel="Review the workflow in the script library" style={({ pressed }) => [styles.action, { borderColor: `${tone}70`, backgroundColor: `${tone}10`, opacity: pressed ? 0.8 : 1 }]}><MaterialCommunityIcons name="script-text-outline" size={14} color={tone} /><Text style={[styles.actionText, { color: tone }]}>REVIEW IN SCRIPT LIBRARY</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginHorizontal: 12, marginBottom: 10, borderWidth: 1, borderRadius: 13, padding: 10, gap: 9, overflow: 'hidden' },
  topRail: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 3 },
  iconBox: { width: 32, height: 32, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.8 },
  trace: { fontFamily: MONO, fontSize: 6.5, marginTop: 3 },
  source: { maxWidth: 56, fontFamily: MONO, fontSize: 6.2, fontWeight: '900', textAlign: 'right' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', gap: 2 },
  stepWrap: { alignItems: 'center', gap: 3, flex: 1 },
  stepDot: { width: 22, height: 22, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: MONO, fontSize: 5.5, fontWeight: '900', textAlign: 'center' },
  detail: { borderTopWidth: 1, paddingTop: 7, flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  detailText: { flex: 1, fontFamily: MONO, fontSize: 7.5, lineHeight: 11 },
  receipt: { minHeight: 28, borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, flexDirection: 'row', gap: 5, alignItems: 'center' },
  receiptText: { fontFamily: MONO, fontSize: 7, fontWeight: '900' },
  action: { minHeight: 36, borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
});
