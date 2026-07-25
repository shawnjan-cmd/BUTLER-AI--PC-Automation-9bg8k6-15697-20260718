import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';

import { MasterJsonPanel } from '@/components/ui/MasterJsonPanel';
import { BUNDLE_MANIFEST, buildAllFilesExport, buildExportJson, getBundleSources } from '@/constants/appSourceBundle';
import { safeSetClipboard } from '@/services/safeClipboard';

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlExport(jsonText: string, totalFiles: number, embeddedFiles: number): string {
  const exportedAt = new Date().toISOString();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Butler AI Full Export</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0; background:#05070d; color:#d6ecff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 18px; }
    .hero { border:1px solid rgba(0,255,200,.35); border-radius:14px; padding:14px; background:#0b1220; margin-bottom:14px; }
    .meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .pill { border:1px solid rgba(125,182,255,.35); border-radius:999px; padding:6px 10px; font-size:12px; color:#93c5fd; background:rgba(26,42,66,.45); }
    pre { white-space: pre-wrap; word-break: break-word; line-height: 1.35; font-size:12px; border:1px solid rgba(255,255,255,.16); border-radius:12px; padding:14px; background:#0a1322; }
    h1 { margin:0; font-size:22px; color:#fff; }
    p  { margin:8px 0 0 0; color:#b8d5f0; }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Butler AI — Full Source Export</h1>
      <p>Generated from Settings with full manifest and embedded source.</p>
      <div class="meta">
        <span class="pill">Exported: ${escapeHtml(exportedAt)}</span>
        <span class="pill">Total Files: ${totalFiles}</span>
        <span class="pill">Embedded Sources: ${embeddedFiles}</span>
      </div>
    </section>
    <pre>${escapeHtml(jsonText)}</pre>
  </div>
</body>
</html>`;
}

export default function SettingsScreen() {
  const [pauseAnimations, setPauseAnimations] = useState(false);
  const [bareMinimumMode, setBareMinimumMode] = useState(false);
  const [disableHaptics, setDisableHaptics] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [autoRun, setAutoRun] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const counts = useMemo(() => {
    const embedded = Object.keys(getBundleSources()).length;
    const total = BUNDLE_MANIFEST.length;
    return { embedded, total };
  }, []);

  const saveExportFile = async (filename: string, content: string) => {
    const base = FileSystem.documentDirectory;
    if (!base) {
      Alert.alert('Export failed', 'Document directory is unavailable on this device.');
      return;
    }

    const dir = `${base}butler_exports/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const path = `${dir}${filename}`;
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });

    if (Platform.OS !== 'web') {
      await Share.share({ url: path, message: path, title: filename });
    } else {
      await safeSetClipboard(content);
      Alert.alert('Saved to clipboard', 'Web mode copied export content to clipboard fallback.');
    }
  };

  const onCopyAll = async () => {
    try {
      await safeSetClipboard(buildAllFilesExport());
      Alert.alert('Copied', 'Full source export copied to clipboard.');
    } catch (error) {
      Alert.alert('Copy failed', String(error));
    }
  };

  const onSaveJson = async () => {
    try {
      const payload = buildExportJson();
      const jsonText = JSON.stringify(payload, null, 2);
      await saveExportFile(`butler_full_export_${stamp()}.json`, jsonText);
      Alert.alert('JSON export ready', 'Saved full source + manifest JSON from Settings.');
    } catch (error) {
      Alert.alert('JSON export failed', String(error));
    }
  };

  const onSaveHtml = async () => {
    try {
      const payload = buildExportJson();
      const jsonText = JSON.stringify(payload, null, 2);
      const html = buildHtmlExport(jsonText, counts.total, counts.embedded);
      await saveExportFile(`butler_full_export_${stamp()}.html`, html);
      Alert.alert('HTML export ready', 'Saved full source export as standalone HTML.');
    } catch (error) {
      Alert.alert('HTML export failed', String(error));
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>CONFIG</Text>
          <Text style={s.title}>Settings</Text>
          <Text style={s.subtitle}>Visual config + full source export controls in one place.</Text>
        </View>

        <View style={[s.card, s.cardCyan]}>
          <View style={s.cardHeaderRow}>
            <Text style={s.cardTitle}>🖥️ SERVER ADDRESS</Text>
            <Text style={s.savedBadge}>✓ SAVED</Text>
          </View>
          <Text style={s.cardSub}>Tap a field to edit — persists across app restarts</Text>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>📡 IP Address</Text>
            <Text style={s.infoValue}>192.168.1.100</Text>
          </View>
          <View style={[s.infoRow, s.infoRowNoBorder]}>
            <Text style={s.infoKey}>⇄ Port</Text>
            <Text style={s.infoValue}>8766</Text>
          </View>
        </View>

        <View style={[s.card, s.cardAmber]}>
          <Text style={s.sectionLabelAmber}>⚡ PERFORMANCE MODE</Text>
          <View style={s.toggleRow}>
            <View style={s.toggleTextWrap}>
              <Text style={s.toggleTitle}>Pause All Animations</Text>
              <Text style={s.toggleSub}>Stops glow loops — saves CPU on slow phones</Text>
            </View>
            <Switch value={pauseAnimations} onValueChange={setPauseAnimations} trackColor={{ false: '#344355', true: '#d58e35' }} />
          </View>
          <View style={s.toggleRow}>
            <View style={s.toggleTextWrap}>
              <Text style={[s.toggleTitle, { color: '#FF8E74' }]}>Bare Minimum Mode</Text>
              <Text style={s.toggleSub}>Disables HUD effects — max performance</Text>
            </View>
            <Switch value={bareMinimumMode} onValueChange={setBareMinimumMode} trackColor={{ false: '#344355', true: '#d58e35' }} />
          </View>
          <View style={[s.toggleRow, s.toggleRowNoBorder]}>
            <View style={s.toggleTextWrap}>
              <Text style={s.toggleTitle}>Disable Haptics</Text>
              <Text style={s.toggleSub}>Turn off vibration feedback</Text>
            </View>
            <Switch value={disableHaptics} onValueChange={setDisableHaptics} trackColor={{ false: '#344355', true: '#d58e35' }} />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionLabel}>📶 CONNECTION AND BEHAVIOR</Text>
          <View style={s.toggleRow}>
            <View style={s.toggleTextWrap}>
              <Text style={s.toggleTitle}>Auto-connect on startup</Text>
              <Text style={s.toggleSub}>Connect to last server when app opens</Text>
            </View>
            <Switch value={autoConnect} onValueChange={setAutoConnect} trackColor={{ false: '#344355', true: '#00A28A' }} />
          </View>
          <View style={s.toggleRow}>
            <View style={s.toggleTextWrap}>
              <Text style={s.toggleTitle}>Auto-run on startup</Text>
              <Text style={s.toggleSub}>Execute saved script when connected</Text>
            </View>
            <Switch value={autoRun} onValueChange={setAutoRun} trackColor={{ false: '#344355', true: '#00A28A' }} />
          </View>
          <View style={[s.toggleRow, s.toggleRowNoBorder]}>
            <View style={s.toggleTextWrap}>
              <Text style={s.toggleTitle}>Notifications</Text>
              <Text style={s.toggleSub}>Show execution result alerts</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#344355', true: '#00A28A' }} />
          </View>
        </View>

        <View style={[s.card, s.cardTeal]}>
          <Text style={s.cardTitleTeal}>📦 EXPORT ALL FILES</Text>
          <Text style={s.cardSub}>Download full app source, manifest, and embedded files from Settings.</Text>
          <View style={s.statsRow}>
            <View style={s.statPill}><Text style={s.statVal}>{counts.total}</Text><Text style={s.statLbl}>FILES</Text></View>
            <View style={s.statPill}><Text style={[s.statVal, { color: '#00FF88' }]}>{counts.embedded}</Text><Text style={s.statLbl}>EMBEDDED</Text></View>
            <View style={s.statPill}><Text style={[s.statVal, { color: '#79BFFF' }]}>JSON</Text><Text style={s.statLbl}>FULL</Text></View>
            <View style={s.statPill}><Text style={[s.statVal, { color: '#58F3D0' }]}>HTML</Text><Text style={s.statLbl}>EXPORT</Text></View>
          </View>

          <Pressable style={[s.actionPrimary, s.actionCyan]} onPress={onCopyAll}>
            <Text style={s.actionPrimaryTxt}>📋 COPY ALL FILES</Text>
          </Pressable>

          <View style={s.quickActions}>
            <Pressable style={[s.actionSecondary, s.actionTeal]} onPress={onSaveJson}><Text style={s.actionSecondaryTxt}>💾 SAVE JSON</Text></Pressable>
            <Pressable style={[s.actionSecondary, s.actionPurple]} onPress={onSaveHtml}><Text style={s.actionSecondaryTxt}>🌐 SAVE HTML</Text></Pressable>
          </View>
        </View>

        <Text style={s.panelTitle}>ONE JSON POWERHOUSE</Text>
        <Text style={s.panelSub}>Import/export engine with queue, snapshots, undo, and full source controls.</Text>
        <MasterJsonPanel accent="#00F6C4" />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05070D' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 180, gap: 14 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,255,204,0.30)',
    backgroundColor: '#0B1220',
    padding: 16,
    gap: 6,
  },
  eyebrow: { color: '#00F6C4', fontWeight: '900', letterSpacing: 1.1, fontSize: 11 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#BED3EB', fontSize: 13, lineHeight: 19 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0D1524',
    padding: 14,
    gap: 10,
  },
  cardCyan: { borderColor: 'rgba(88,200,255,0.35)' },
  cardAmber: { borderColor: 'rgba(255,176,32,0.35)' },
  cardTeal: { borderColor: 'rgba(20,241,217,0.40)' },

  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#EAF5FF', fontSize: 14, fontWeight: '900' },
  cardTitleTeal: { color: '#34F5D5', fontSize: 15, fontWeight: '900' },
  cardSub: { color: '#97AFC8', fontSize: 12, lineHeight: 16 },
  savedBadge: {
    color: '#00FF88',
    fontSize: 10,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.5)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,255,136,0.08)',
  },

  infoRow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRowNoBorder: { marginBottom: 0 },
  infoKey: { color: '#D6E7F8', fontSize: 12, fontWeight: '700' },
  infoValue: { color: '#8BC8FF', fontSize: 12, fontWeight: '900' },

  sectionLabel: { color: '#E8F0FB', fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  sectionLabelAmber: { color: '#FFC15D', fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  toggleRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
    marginBottom: 4,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  toggleRowNoBorder: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  toggleTextWrap: { flex: 1 },
  toggleTitle: { color: '#ECF6FF', fontSize: 13, fontWeight: '700' },
  toggleSub: { color: '#8CA5BF', fontSize: 11, marginTop: 2 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  statPill: {
    borderWidth: 1,
    borderColor: 'rgba(20,241,217,0.25)',
    backgroundColor: 'rgba(20,241,217,0.06)',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 72,
    alignItems: 'center',
    gap: 1,
  },
  statVal: { color: '#24FFE0', fontSize: 12, fontWeight: '900' },
  statLbl: { color: '#9CC8C8', fontSize: 9, fontWeight: '800' },

  actionPrimary: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionCyan: { backgroundColor: 'rgba(0,214,180,0.22)', borderColor: 'rgba(0,255,204,0.55)' },
  actionPrimaryTxt: { color: '#E9FFF9', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  quickActions: { flexDirection: 'row', gap: 8 },
  actionSecondary: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionTeal: { borderColor: 'rgba(20,241,217,0.50)', backgroundColor: 'rgba(20,241,217,0.08)' },
  actionPurple: { borderColor: 'rgba(174,128,255,0.55)', backgroundColor: 'rgba(174,128,255,0.10)' },
  actionSecondaryTxt: { color: '#D6EFFF', fontSize: 11, fontWeight: '900' },

  panelTitle: { color: '#CFF8EF', fontSize: 12, fontWeight: '900', letterSpacing: 0.7, marginTop: 2 },
  panelSub: { color: '#87AFC0', fontSize: 11, marginTop: -5 },
});
