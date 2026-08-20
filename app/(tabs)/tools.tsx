import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ANDROID_SAFETY_STEPS, openAndroidSafetyIntent, openEmergencyDialer, openEmergencySms } from '@/services/androidSafetyGuide';
import { importToVault, listVaultEntries, removeVaultEntry, type VaultEntry } from '@/services/localVault';
import ButlerPageStudioHost from '@/components/ui/ButlerPageStudioHost';
import { connectionHub, type HubState } from '@/services/connectionHub';
import { scanScriptTrust } from '@/services/trustLabClient';

const C = { bg: '#050810', panel: '#0C1220', panel2: '#101827', cyan: '#38D9E8', green: '#2FE38A', violet: '#B14DFF', amber: '#FFB43D', red: '#FF4D5E', text: '#E5F5FF', dim: '#7C91A5', line: '#1D3950' };

const RULES = [
  ['shield-lock', 'NEVER EXECUTE UNTRUSTED SOURCE', 'A scan must produce evidence before a user can request a run.'],
  ['download-off', 'NEVER DOWNLOAD OR INSTALL SILENTLY', 'Downloads, installers, archives, and network access require explicit review.'],
  ['key-remove', 'NEVER EXFILTRATE PRIVATE DATA', 'Secrets, credentials, tokens, clipboard contents, and memory remain local.'],
] as const;

interface ToolItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  actionEndpoint: string;
  requiresPin: boolean;
  color: string;
}

const TOOLS_MANIFEST: ToolItem[] = [
  {
    id: 'script_workshop',
    title: 'SCRIPT WORKSHOP',
    category: 'Automation',
    description: 'AST, syntax, dangerous-operation, provenance, and payload indicators',
    icon: 'file-search',
    actionEndpoint: '/scripts/create',
    requiresPin: false,
    color: C.cyan,
  },
  {
    id: 'vault_manager',
    title: 'MEMORY INSPECTOR',
    category: 'Security',
    description: 'Encrypted local memory admission and sensitivity review',
    icon: 'text-box-search-outline',
    actionEndpoint: '/vault/unlock',
    requiresPin: true,
    color: C.violet,
  },
  {
    id: 'server_trust',
    title: 'SERVER TRUST',
    category: 'Network',
    description: 'Paired-server identity, route, and local-only transport status',
    icon: 'lan-connect',
    actionEndpoint: '/api/status',
    requiresPin: false,
    color: C.green,
  },
  {
    id: 'audit_log',
    title: 'AUDIT LOG',
    category: 'Telemetry',
    description: 'Evidence timeline for every scan, block, review, and rehearsal',
    icon: 'chart-timeline-variant',
    actionEndpoint: '/observatory/snapshot',
    requiresPin: false,
    color: C.amber,
  },
  {
    id: 'recovery_panic',
    title: 'EMERGENCY LOCKDOWN',
    category: 'Recovery',
    description: 'Stop server-side automation and enter a fail-closed recovery state',
    icon: 'shield-alert-outline',
    actionEndpoint: '/recovery/panic',
    requiresPin: false,
    color: C.red,
  },
];

export default function ToolsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [helpNumber, setHelpNumber] = useState('');
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [vaultBusy, setVaultBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalTool, setActiveModalTool] = useState<ToolItem | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalOutput, setModalOutput] = useState<string | null>(null);
  const [loadingTool, setLoadingTool] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [hubState, setHubState] = useState<HubState>(() => connectionHub.getState());

  useEffect(() => connectionHub.subscribe(setHubState), []);

  const status = useMemo(() => {
    if (hubState.connecting) return { label: 'CONNECTING TO PAIRED SERVER', color: C.amber };
    if (hubState.isConnected) return { label: `PAIRED · ${hubState.addr || 'LOCAL SERVER'}`, color: C.green };
    return { label: 'PAIR PC TO ACTIVATE SERVER TOOLS', color: C.amber };
  }, [hubState]);
  
  useEffect(() => {
    listVaultEntries().then(setVaultEntries).catch(() => setVaultEntries([]));
  }, []);

  const filteredTools = TOOLS_MANIFEST.filter((tool) =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToolPress = (tool: ToolItem) => {
    setActiveModalTool(tool);
    setModalInput('');
    setModalOutput(null);
    setModalError(null);
  };

  const executeToolAction = async (confirmed = false) => {
    if (!activeModalTool) return;

    if (activeModalTool.id === 'recovery_panic' && !confirmed) {
      Alert.alert(
        'Confirm emergency lockdown',
        'This asks the paired server to stop active automation and enter fail-closed recovery. It cannot be undone from this screen.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Lock down', style: 'destructive', onPress: () => { void executeToolAction(true); } },
        ],
      );
      return;
    }

    if (!hubState.isConnected) {
      setModalError('PAIR_PC_REQUIRED: scan the server QR code before using server tools.');
      return;
    }

    setLoadingTool(activeModalTool.id);
    setModalOutput(null);
    setModalError(null);

    try {
      if (activeModalTool.id === 'script_workshop') {
        const source = modalInput.trim();
        if (!source) throw new Error('SCRIPT_SOURCE_REQUIRED: paste a script or research excerpt to scan.');
        const report = await scanScriptTrust(`tools-${Date.now()}`, source, 'tools-lab');
        setModalOutput(JSON.stringify({ action: 'trust_scan', report }, null, 2));
        return;
      }

      const request: RequestInit & { timeoutMs?: number } = {
        method: activeModalTool.id === 'vault_manager' || activeModalTool.id === 'recovery_panic' ? 'POST' : 'GET',
        timeoutMs: activeModalTool.id === 'recovery_panic' ? 8_000 : 10_000,
      };
      if (activeModalTool.id === 'vault_manager') {
        const pin = modalInput.trim();
        if (!/^\d{6,}$/.test(pin)) throw new Error('PIN_REQUIRED: enter the 6+ digit vault PIN.');
        request.headers = { 'Content-Type': 'application/json' };
        request.body = JSON.stringify({ pin });
      }

      const response = await connectionHub.fetch(activeModalTool.actionEndpoint, request);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(payload?.reason || payload?.code || payload?.error || `SERVER_HTTP_${response.status}`));
      }
      setModalOutput(JSON.stringify({ action: activeModalTool.id, result: payload }, null, 2));
    } catch (error: any) {
      setModalError(String(error?.message || 'TOOL_REQUEST_FAILED'));
    } finally {
      setLoadingTool(null);
    }
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Status Rail */}
        <View style={s.statusRail}>
          <View style={s.liveDot} />
          <Text style={s.statusText}>LOCAL TRUST LAB</Text>
          <Text style={s.statusDim}>OFFLINE-FIRST · FAIL-CLOSED</Text>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.eyebrow}>LAN · DEFENSIVE AUTOMATION</Text>
          <Text style={s.heroTitle}>TOOLS HUB</Text>
          <Text style={s.heroSub}>SCRIPT TRUST · MEMORY · FILE BRIDGE · AUDIT</Text>
        </View>

        <ButlerPageStudioHost pageId="tools" />

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <Ionicons name="search" size={18} color={C.cyan} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search defensive tools, scripts, vaults..."
            placeholderTextColor={C.dim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={C.dim} />
            </Pressable>
          )}
        </View>

        {/* Trust Status Card */}
        <Text style={s.section}>TRUST STATUS</Text>
        <View style={[s.trustCard, { borderColor: status.color + '80' }]}>
          <MaterialCommunityIcons name="shield-search" size={28} color={status.color} />
          <View style={s.flex}>
            <Text style={[s.trustTitle, { color: status.color }]}>{status.label}</Text>
            <Text style={s.body}>No result is invented. A green check appears only after the server or local Trust Lab records syntax, policy, provenance, and fail-closed rehearsal evidence.</Text>
          </View>
          <Pressable style={s.logButton} onPress={() => setExpanded(expanded === 'trust' ? null : 'trust')} accessibilityRole="button">
            <MaterialCommunityIcons name="text-box-search-outline" size={20} color={C.amber} />
            <Text style={s.logText}>LOG</Text>
          </Pressable>
        </View>
        {expanded === 'trust' && (
          <View style={s.logPanel}>
            <Text style={s.logMono}>EVENT  waiting_for_scan</Text>
            <Text style={s.logMono}>SOURCE  local or paired-server only</Text>
            <Text style={s.logMono}>NETWORK disabled unless explicitly reviewed</Text>
            <Text style={s.logMono}>EXECUTION blocked until evidence is complete</Text>
          </View>
        )}

        {/* Defensive Tools Grid */}
        <Text style={s.section}>DEFENSIVE TOOLS</Text>
        {filteredTools.map((tool) => (
          <Pressable
            key={tool.id}
            style={[s.toolCard, { borderColor: tool.color + '70' }]}
            onPress={() => handleToolPress(tool)}
            accessibilityRole="button"
          >
            <View style={[s.toolIcon, { borderColor: tool.color + '80' }]}>
              <MaterialCommunityIcons name={tool.icon as any} size={24} color={tool.color} />
            </View>
            <View style={s.flex}>
              <Text style={[s.toolTitle, { color: tool.color }]}>{tool.title}</Text>
              <Text style={s.body}>{tool.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={C.dim} />
          </Pressable>
        ))}

        {/* Private Vault */}
        <Text style={s.section}>PRIVATE VAULT</Text>
        <View style={s.vaultCard}>
          <View style={s.vaultHeader}>
            <MaterialCommunityIcons name="safe-square-outline" size={24} color={C.violet} />
            <View style={s.flex}>
              <Text style={s.vaultTitle}>BUTLER-SEALED FILES</Text>
              <Text style={s.body}>Selected files are sealed before they are written to app-private storage. No cloud upload and no plaintext fallback.</Text>
            </View>
          </View>
          <Pressable
            disabled={vaultBusy}
            onPress={async () => {
              setVaultBusy(true);
              try {
                const entry = await importToVault();
                if (entry) setVaultEntries(await listVaultEntries());
              } finally {
                setVaultBusy(false);
              }
            }}
            style={[s.vaultButton, vaultBusy && s.disabled]}
          >
            <MaterialCommunityIcons name="file-upload-outline" size={18} color={C.text} />
            <Text style={s.helpButtonText}>{vaultBusy ? 'SEALING…' : 'ADD IMAGE OR FILE'}</Text>
          </Pressable>
          {vaultEntries.length === 0 ? (
            <Text style={s.body}>No vault entries yet. Nothing is invented here.</Text>
          ) : (
            vaultEntries.map(entry => (
              <View key={entry.id} style={s.vaultRow}>
                <MaterialCommunityIcons name="file-lock-outline" size={18} color={C.violet} />
                <View style={s.flex}>
                  <Text style={s.vaultFile} numberOfLines={1}>{entry.name}</Text>
                  <Text style={s.logMono}>{entry.mimeType} · {entry.byteLength} bytes · {entry.digest.slice(0, 12)}…</Text>
                </View>
                <Pressable onPress={async () => { await removeVaultEntry(entry.id); setVaultEntries(await listVaultEntries()); }}>
                  <MaterialCommunityIcons name="delete-outline" size={19} color={C.red} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Android Security Guide */}
        <Text style={s.section}>ANDROID SECURITY GUIDE</Text>
        <Text style={s.body}>Butler can open the relevant Settings screen; only the user can review and change Android controls. Labels vary by manufacturer and Android version.</Text>
        {ANDROID_SAFETY_STEPS.map(step => (
          <Pressable key={step.id} style={s.guideCard} onPress={() => openAndroidSafetyIntent(step.intent)} accessibilityRole="button">
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={C.cyan} />
            <View style={s.flex}>
              <Text style={s.guideTitle}>{step.title}</Text>
              <Text style={s.body}>{step.why}</Text>
              <Text style={s.tradeoff}>TRADE-OFF · {step.tradeoff}</Text>
            </View>
            <MaterialIcons name="open-in-new" size={19} color={C.cyan} />
          </Pressable>
        ))}

        {/* Explicit Help */}
        <Text style={s.section}>EXPLICIT HELP — NO HIDDEN SURVEILLANCE</Text>
        <View style={s.helpCard}>
          <Text style={s.helpTitle}>QUICK HELP CONTACT</Text>
          <Text style={s.body}>Enter a trusted contact or your local emergency number. Butler opens the system dialer or SMS composer; it never calls, records, tracks, or sends messages silently.</Text>
          <TextInput
            value={helpNumber}
            onChangeText={setHelpNumber}
            keyboardType="phone-pad"
            placeholder="Number configured by you"
            placeholderTextColor={C.dim}
            style={s.helpInput}
          />
          <View style={s.helpRow}>
            <Pressable disabled={!helpNumber.trim()} onPress={() => openEmergencyDialer(helpNumber)} style={[s.helpButton, !helpNumber.trim() && s.disabled]}>
              <MaterialCommunityIcons name="phone-outline" size={18} color={C.text} />
              <Text style={s.helpButtonText}>DIAL</Text>
            </Pressable>
            <Pressable disabled={!helpNumber.trim()} onPress={() => openEmergencySms(helpNumber)} style={[s.helpButton, !helpNumber.trim() && s.disabled]}>
              <MaterialCommunityIcons name="message-text-outline" size={18} color={C.text} />
              <Text style={s.helpButtonText}>SMS</Text>
            </Pressable>
          </View>
        </View>

        {/* Unbreakable Rules */}
        <Text style={s.section}>THREE RULES THAT CANNOT BE OVERRIDDEN</Text>
        {RULES.map(([icon, title, detail]) => (
          <View key={title} style={s.ruleCard}>
            <MaterialCommunityIcons name={icon as any} size={22} color={C.red} />
            <View style={s.flex}>
              <Text style={s.ruleTitle}>{title}</Text>
              <Text style={s.body}>{detail}</Text>
            </View>
          </View>
        ))}

        {/* Privacy Banner */}
        <View style={s.privacy}>
          <MaterialCommunityIcons name="lock-outline" size={22} color={C.green} />
          <Text style={s.body}>
            <Text style={{ color: C.green, fontWeight: '800' }}>PRIVATE BY DEFAULT. </Text>
            Scan evidence, encrypted memory, and logs stay on the paired PC or phone storage. The app never sends data to developer-operated cloud services.
          </Text>
        </View>
      </ScrollView>

      {/* Tool Execution Modal */}
      <Modal visible={activeModalTool !== null} animationType="slide" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {activeModalTool && (
              <>
                <View style={s.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <MaterialCommunityIcons name={activeModalTool.icon as any} size={22} color={activeModalTool.color} />
                    <Text style={s.modalTitle}>{activeModalTool.title}</Text>
                  </View>
                  <Pressable onPress={() => setActiveModalTool(null)}>
                    <Ionicons name="close" size={22} color={C.dim} />
                  </Pressable>
                </View>

                <Text style={s.body}>{activeModalTool.description}</Text>

                {activeModalTool.requiresPin && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.inputLabel}>Enter your 6+ digit Vault PIN · never displayed or stored here</Text>
                    <TextInput
                      style={s.helpInput}
                      secureTextEntry
                      placeholder="6-digit PIN"
                      placeholderTextColor={C.dim}
                      value={modalInput}
                      onChangeText={setModalInput}
                      keyboardType="numeric"
                      maxLength={8}
                    />
                  </View>
                )}

                {activeModalTool.id === 'script_workshop' && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.inputLabel}>Paste source or a research excerpt for a local trust scan</Text>
                    <TextInput
                      style={[s.helpInput, s.sourceInput]}
                      multiline
                      textAlignVertical="top"
                      placeholder="No source is sent until you press Scan Trust"
                      placeholderTextColor={C.dim}
                      value={modalInput}
                      onChangeText={setModalInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}

                {modalError && (
                  <View style={s.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.red} />
                    <Text style={s.errorText}>{modalError}</Text>
                  </View>
                )}

                {modalOutput && (
                  <View style={s.outputContainer}>
                    <Text style={s.outputTitle}>Execution Result / Audit Receipt:</Text>
                    <ScrollView style={s.outputScroll}>
                      <Text style={s.outputMono}>{modalOutput}</Text>
                    </ScrollView>
                  </View>
                )}

                <View style={s.modalFooter}>
                  <Pressable style={s.cancelButton} onPress={() => setActiveModalTool(null)}>
                    <Text style={s.cancelButtonText}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[s.executeButton, { backgroundColor: activeModalTool.color }]}
                    onPress={() => { void executeToolAction(); }}
                    disabled={loadingTool === activeModalTool.id}
                  >
                    {loadingTool === activeModalTool.id ? (
                      <ActivityIndicator color={C.bg} size="small" />
                    ) : (
                      <Text style={s.executeButtonText}>{activeModalTool.id === 'script_workshop' ? 'SCAN TRUST' : activeModalTool.id === 'recovery_panic' ? 'LOCK DOWN' : 'RUN CHECK'}</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  modalTitleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  inputLabel: { fontSize: 12, color: C.dim, marginBottom: 6, fontWeight: '600' as const },
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingBottom: 60, gap: 12 },
  flex: { flex: 1 },
  statusRail: { minHeight: 42, borderWidth: 1, borderColor: C.cyan + '65', backgroundColor: C.panel, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.green },
  statusText: { color: C.green, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  statusDim: { color: C.dim, fontSize: 10, letterSpacing: 1, marginLeft: 'auto' },
  hero: { borderWidth: 1, borderColor: C.cyan + '85', backgroundColor: C.panel, padding: 22, borderTopColor: C.cyan, borderBottomColor: C.green, borderTopWidth: 2, borderBottomWidth: 1 },
  eyebrow: { color: C.green, letterSpacing: 4, fontSize: 11, fontWeight: '800' },
  heroTitle: { color: C.text, fontSize: 34, fontWeight: '900', letterSpacing: 5, textShadowColor: C.cyan, textShadowRadius: 12 },
  heroSub: { marginTop: 7, color: C.dim, letterSpacing: 3, fontSize: 11 },
  section: { color: C.cyan, fontSize: 13, letterSpacing: 3, fontWeight: '900', marginTop: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: C.text, fontSize: 13, padding: 0 },
  trustCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, backgroundColor: C.panel2 },
  trustTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  body: { color: C.dim, fontSize: 12, lineHeight: 18, marginTop: 4 },
  logButton: { borderWidth: 1, borderColor: C.amber + '80', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  logText: { color: C.amber, fontWeight: '900', letterSpacing: 1 },
  logPanel: { backgroundColor: '#070B12', borderWidth: 1, borderColor: C.amber + '55', padding: 14, gap: 7 },
  logMono: { color: '#C8D7E6', fontFamily: 'monospace', fontSize: 11 },
  vaultCard: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.violet + '70', padding: 15, gap: 12 },
  vaultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  vaultTitle: { color: C.violet, fontWeight: '900', letterSpacing: 1.5, fontSize: 13 },
  vaultButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: C.violet + '80', backgroundColor: C.violet + '20', paddingVertical: 12 },
  vaultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
  vaultFile: { color: C.text, fontWeight: '800', fontSize: 12 },
  toolCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.panel, borderWidth: 1 },
  guideCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: C.panel, borderWidth: 1, borderColor: C.cyan + '50' },
  guideTitle: { color: C.cyan, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  tradeoff: { color: C.amber, fontSize: 10, lineHeight: 14, marginTop: 5 },
  helpCard: { backgroundColor: '#17100A', borderWidth: 1, borderColor: C.amber + '70', padding: 15, gap: 10 },
  helpTitle: { color: C.amber, fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  helpInput: { color: C.text, borderWidth: 1, borderColor: C.amber + '70', backgroundColor: C.bg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sourceInput: { minHeight: 120, borderColor: C.cyan + '70' },
  helpRow: { flexDirection: 'row', gap: 10 },
  helpButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: C.amber + '28', borderWidth: 1, borderColor: C.amber + '70', paddingVertical: 11 },
  helpButtonText: { color: C.text, fontWeight: '900', letterSpacing: 1 },
  disabled: { opacity: 0.35 },
  toolIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: '#08101D' },
  toolTitle: { fontWeight: '900', letterSpacing: 1.5, fontSize: 13 },
  ruleCard: { flexDirection: 'row', gap: 12, padding: 15, backgroundColor: C.panel, borderLeftWidth: 3, borderLeftColor: C.red, borderWidth: 1, borderColor: C.line },
  ruleTitle: { color: C.text, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  privacy: { flexDirection: 'row', gap: 10, padding: 15, borderWidth: 1, borderColor: C.green + '60', backgroundColor: '#06150F', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: C.panel, borderRadius: 14, borderWidth: 1, borderColor: C.cyan, width: '100%', maxWidth: 460, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: C.text, letterSpacing: 1 },
  outputContainer: { backgroundColor: '#05070c', borderRadius: 8, borderWidth: 1, borderColor: C.line, padding: 10, marginVertical: 14, maxHeight: 150 },
  outputTitle: { fontSize: 11, color: C.green, fontWeight: 'bold', marginBottom: 6 },
  errorContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.red + '15', borderWidth: 1, borderColor: C.red + '70', padding: 10, marginTop: 12 },
  errorText: { flex: 1, color: C.red, fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  outputScroll: { maxHeight: 110 },
  outputMono: { color: C.green, fontFamily: 'monospace', fontSize: 11 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line },
  cancelButtonText: { color: C.dim, fontSize: 13, fontWeight: '700' },
  executeButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  executeButtonText: { color: C.bg, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
