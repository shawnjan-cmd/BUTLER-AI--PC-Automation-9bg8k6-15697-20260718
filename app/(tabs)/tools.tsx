import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View , TextInput } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ANDROID_SAFETY_STEPS, openAndroidSafetyIntent, openEmergencyDialer, openEmergencySms } from '@/services/androidSafetyGuide';
import { importToVault, listVaultEntries, removeVaultEntry, type VaultEntry } from '@/services/localVault';
import ButlerPageStudioHost from '@/components/ui/ButlerPageStudioHost';

const C = { bg: '#050810', panel: '#0C1220', panel2: '#101827', cyan: '#38D9E8', green: '#2FE38A', violet: '#B14DFF', amber: '#FFB43D', red: '#FF4D5E', text: '#E5F5FF', dim: '#7C91A5', line: '#1D3950' };

const RULES = [
  ['shield-lock', 'NEVER EXECUTE UNTRUSTED SOURCE', 'A scan must produce evidence before a user can request a run.'],
  ['download-off', 'NEVER DOWNLOAD OR INSTALL SILENTLY', 'Downloads, installers, archives, and network access require explicit review.'],
  ['key-remove', 'NEVER EXFILTRATE PRIVATE DATA', 'Secrets, credentials, tokens, clipboard contents, and memory remain local.'],
] as const;

const TOOLS = [
  ['file-search', 'SCRIPT SCANNER', 'AST, syntax, dangerous-operation, provenance, and payload indicators', C.cyan],
  ['text-box-search-outline', 'MEMORY INSPECTOR', 'Encrypted local memory admission and sensitivity review', C.violet],
  ['lan-connect', 'SERVER TRUST', 'Paired-server identity, route, and local-only transport status', C.green],
  ['chart-timeline-variant', 'AUDIT LOG', 'Evidence timeline for every scan, block, review, and rehearsal', C.amber],
] as const;

export default function ToolsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [helpNumber, setHelpNumber] = useState('');
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [vaultBusy, setVaultBusy] = useState(false);
  const status = useMemo(() => ({ label: 'WAITING FOR LOCAL SCAN', color: C.amber }), []);
  useEffect(() => { listVaultEntries().then(setVaultEntries).catch(() => setVaultEntries([])); }, []);
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.statusRail}>
          <View style={s.liveDot} /><Text style={s.statusText}>LOCAL TRUST LAB</Text><Text style={s.statusDim}>OFFLINE-FIRST · FAIL-CLOSED</Text>
        </View>
        <View style={s.hero}>
          <Text style={s.eyebrow}>LAN · DEFENSIVE AUTOMATION</Text>
          <Text style={s.heroTitle}>TOOLS HUB</Text>
          <Text style={s.heroSub}>SCRIPT TRUST · MEMORY · FILE BRIDGE · AUDIT</Text>
        </View>
        <ButlerPageStudioHost pageId="tools" />
        <Text style={s.section}>TRUST STATUS</Text>
        <View style={[s.trustCard, { borderColor: status.color + '80' }]}>
          <MaterialCommunityIcons name="shield-search" size={28} color={status.color} />
          <View style={s.flex}><Text style={[s.trustTitle, { color: status.color }]}>{status.label}</Text><Text style={s.body}>No result is invented. A green check appears only after the server or local Trust Lab records syntax, policy, provenance, and fail-closed rehearsal evidence.</Text></View>
          <Pressable style={s.logButton} onPress={() => setExpanded(expanded === 'trust' ? null : 'trust')} accessibilityRole="button"><MaterialCommunityIcons name="text-box-search-outline" size={20} color={C.amber} /><Text style={s.logText}>LOG</Text></Pressable>
        </View>
        {expanded === 'trust' && <View style={s.logPanel}><Text style={s.logMono}>EVENT  waiting_for_scan</Text><Text style={s.logMono}>SOURCE  local or paired-server only</Text><Text style={s.logMono}>NETWORK disabled unless explicitly reviewed</Text><Text style={s.logMono}>EXECUTION blocked until evidence is complete</Text></View>}
        <Text style={s.section}>DEFENSIVE TOOLS</Text>
        {TOOLS.map(([icon, label, desc, color]) => <View key={label} style={[s.toolCard, { borderColor: color + '70' }]}><View style={[s.toolIcon, { borderColor: color + '80' }]}><MaterialCommunityIcons name={icon as any} size={24} color={color} /></View><View style={s.flex}><Text style={[s.toolTitle, { color }]}>{label}</Text><Text style={s.body}>{desc}</Text></View><MaterialIcons name="chevron-right" size={24} color={C.dim} /></View>)}
        <Text style={s.section}>PRIVATE VAULT</Text>
        <View style={s.vaultCard}><View style={s.vaultHeader}><MaterialCommunityIcons name="safe-square-outline" size={24} color={C.violet} /><View style={s.flex}><Text style={s.vaultTitle}>BUTLER-SEALED FILES</Text><Text style={s.body}>Selected files are sealed before they are written to app-private storage. No cloud upload and no plaintext fallback.</Text></View></View><Pressable disabled={vaultBusy} onPress={async () => { setVaultBusy(true); try { const entry = await importToVault(); if (entry) setVaultEntries(await listVaultEntries()); } finally { setVaultBusy(false); } }} style={[s.vaultButton, vaultBusy && s.disabled]}><MaterialCommunityIcons name="file-upload-outline" size={18} color={C.text} /><Text style={s.helpButtonText}>{vaultBusy ? 'SEALING…' : 'ADD IMAGE OR FILE'}</Text></Pressable>{vaultEntries.length === 0 ? <Text style={s.body}>No vault entries yet. Nothing is invented here.</Text> : vaultEntries.map(entry => <View key={entry.id} style={s.vaultRow}><MaterialCommunityIcons name="file-lock-outline" size={18} color={C.violet} /><View style={s.flex}><Text style={s.vaultFile} numberOfLines={1}>{entry.name}</Text><Text style={s.logMono}>{entry.mimeType} · {entry.byteLength} bytes · {entry.digest.slice(0, 12)}…</Text></View><Pressable onPress={async () => { await removeVaultEntry(entry.id); setVaultEntries(await listVaultEntries()); }}><MaterialCommunityIcons name="delete-outline" size={19} color={C.red} /></Pressable></View>)}</View>
        <Text style={s.section}>ANDROID SECURITY GUIDE</Text>
        <Text style={s.body}>Butler can open the relevant Settings screen; only the user can review and change Android controls. Labels vary by manufacturer and Android version.</Text>
        {ANDROID_SAFETY_STEPS.map(step => <Pressable key={step.id} style={s.guideCard} onPress={() => openAndroidSafetyIntent(step.intent)} accessibilityRole="button"><MaterialCommunityIcons name="shield-check-outline" size={22} color={C.cyan} /><View style={s.flex}><Text style={s.guideTitle}>{step.title}</Text><Text style={s.body}>{step.why}</Text><Text style={s.tradeoff}>TRADE-OFF · {step.tradeoff}</Text></View><MaterialIcons name="open-in-new" size={19} color={C.cyan} /></Pressable>)}
        <Text style={s.section}>EXPLICIT HELP — NO HIDDEN SURVEILLANCE</Text>
        <View style={s.helpCard}><Text style={s.helpTitle}>QUICK HELP CONTACT</Text><Text style={s.body}>Enter a trusted contact or your local emergency number. Butler opens the system dialer or SMS composer; it never calls, records, tracks, or sends messages silently.</Text><TextInput value={helpNumber} onChangeText={setHelpNumber} keyboardType="phone-pad" placeholder="Number configured by you" placeholderTextColor={C.dim} style={s.helpInput} /><View style={s.helpRow}><Pressable disabled={!helpNumber.trim()} onPress={() => openEmergencyDialer(helpNumber)} style={[s.helpButton, !helpNumber.trim() && s.disabled]}><MaterialCommunityIcons name="phone-outline" size={18} color={C.text} /><Text style={s.helpButtonText}>DIAL</Text></Pressable><Pressable disabled={!helpNumber.trim()} onPress={() => openEmergencySms(helpNumber)} style={[s.helpButton, !helpNumber.trim() && s.disabled]}><MaterialCommunityIcons name="message-text-outline" size={18} color={C.text} /><Text style={s.helpButtonText}>SMS</Text></Pressable></View></View>
        <Text style={s.section}>THREE RULES THAT CANNOT BE OVERRIDDEN</Text>
        {RULES.map(([icon, title, detail]) => <View key={title} style={s.ruleCard}><MaterialCommunityIcons name={icon as any} size={22} color={C.red} /><View style={s.flex}><Text style={s.ruleTitle}>{title}</Text><Text style={s.body}>{detail}</Text></View></View>)}
        <View style={s.privacy}><MaterialCommunityIcons name="lock-outline" size={22} color={C.green} /><Text style={s.body}><Text style={{ color: C.green, fontWeight: '800' }}>PRIVATE BY DEFAULT. </Text>Scan evidence, encrypted memory, and logs stay on the paired PC or phone storage. The app never sends data to developer-operated cloud services.</Text></View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, content: { padding: 18, paddingBottom: 60, gap: 12 }, flex: { flex: 1 },
  statusRail: { minHeight: 42, borderWidth: 1, borderColor: C.cyan + '65', backgroundColor: C.panel, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.green }, statusText: { color: C.green, fontWeight: '900', letterSpacing: 2, fontSize: 12 }, statusDim: { color: C.dim, fontSize: 10, letterSpacing: 1, marginLeft: 'auto' },
  hero: { borderWidth: 1, borderColor: C.cyan + '85', backgroundColor: C.panel, padding: 22, borderTopColor: C.cyan, borderBottomColor: C.green, borderTopWidth: 2, borderBottomWidth: 1 }, eyebrow: { color: C.green, letterSpacing: 4, fontSize: 11, fontWeight: '800' }, heroTitle: { color: C.text, fontSize: 34, fontWeight: '900', letterSpacing: 5, textShadowColor: C.cyan, textShadowRadius: 12 }, heroSub: { marginTop: 7, color: C.dim, letterSpacing: 3, fontSize: 11 }, section: { color: C.cyan, fontSize: 13, letterSpacing: 3, fontWeight: '900', marginTop: 10 },
  trustCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, backgroundColor: C.panel2 }, trustTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5 }, body: { color: C.dim, fontSize: 12, lineHeight: 18, marginTop: 4 }, logButton: { borderWidth: 1, borderColor: C.amber + '80', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, logText: { color: C.amber, fontWeight: '900', letterSpacing: 1 }, logPanel: { backgroundColor: '#070B12', borderWidth: 1, borderColor: C.amber + '55', padding: 14, gap: 7 }, logMono: { color: '#C8D7E6', fontFamily: 'monospace', fontSize: 11 },
  vaultCard: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.violet+'70', padding: 15, gap: 12 }, vaultHeader: { flexDirection:'row', alignItems:'flex-start', gap: 10 }, vaultTitle: { color: C.violet, fontWeight:'900', letterSpacing: 1.5, fontSize: 13 }, vaultButton: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap: 7, borderWidth: 1, borderColor: C.violet+'80', backgroundColor: C.violet+'20', paddingVertical: 12 }, vaultRow: { flexDirection:'row', alignItems:'center', gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }, vaultFile: { color: C.text, fontWeight:'800', fontSize: 12 }, toolCard: { flexDirection:'row', alignItems:'center', gap: 12, padding: 14, backgroundColor: C.panel, borderWidth: 1 }, guideCard: { flexDirection:'row', alignItems:'center', gap: 10, padding: 14, backgroundColor: C.panel, borderWidth: 1, borderColor: C.cyan+'50' }, guideTitle: { color: C.cyan, fontWeight:'900', letterSpacing: 1, fontSize: 12 }, tradeoff: { color: C.amber, fontSize: 10, lineHeight: 14, marginTop: 5 }, helpCard: { backgroundColor: '#17100A', borderWidth: 1, borderColor: C.amber+'70', padding: 15, gap: 10 }, helpTitle: { color: C.amber, fontWeight:'900', letterSpacing: 2, fontSize: 13 }, helpInput: { color: C.text, borderWidth: 1, borderColor: C.amber+'70', backgroundColor: C.bg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 }, helpRow: { flexDirection:'row', gap: 10 }, helpButton: { flex: 1, flexDirection:'row', justifyContent:'center', alignItems:'center', gap: 6, backgroundColor: C.amber+'28', borderWidth: 1, borderColor: C.amber+'70', paddingVertical: 11 }, helpButtonText: { color: C.text, fontWeight:'900', letterSpacing: 1 }, disabled: { opacity: 0.35 }, toolIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: '#08101D' }, toolTitle: { fontWeight: '900', letterSpacing: 1.5, fontSize: 13 }, ruleCard: { flexDirection: 'row', gap: 12, padding: 15, backgroundColor: C.panel, borderLeftWidth: 3, borderLeftColor: C.red, borderWidth: 1, borderColor: C.line }, ruleTitle: { color: C.text, fontSize: 12, fontWeight: '900', letterSpacing: 1 }, privacy: { flexDirection: 'row', gap: 10, padding: 15, borderWidth: 1, borderColor: C.green + '60', backgroundColor: '#06150F', marginTop: 8 },
});
