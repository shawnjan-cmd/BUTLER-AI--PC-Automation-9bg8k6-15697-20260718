/**
 * BUTLER AI™ — Legal About Screen
 * © 2025-2026 Shawn Papanek. ALL RIGHTS RESERVED.
 *
 * Renders the Settings → About & Legal screen with proper copyright notice,
 * trademark declaration, source-available statement, and EULA access.
 * Required for Play Store compliance and trademark enforcement.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Linking, Platform,
  Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { NX_COPYRIGHT } from '@/services/nexusCopyright';
import { BUILD_ID, BUILD_DATE, _WM_1, _WM_2, _WM_3, _WM_4 } from '@/constants/buildFingerprint';
import { haptics } from '@/services/haptics';

// ── EULA text (6 plain-English clauses) ───────────────────────
const EULA_TEXT = `BUTLER AI — END USER LICENCE AGREEMENT
© 2025-2026 Shawn Papanek. All rights reserved.
Last updated: 2026-07-24

1. LICENCE
   You are granted a personal, non-transferable licence to use the Butler AI app on your own device and to run the server component on your own PC.

2. NO COPYING
   You may not copy, redistribute, upload, or share the app, the server executable, or any part of either.

3. NO REVERSE ENGINEERING
   You may not decompile, disassemble, or extract source code from the compiled app or server binary.

4. PRIVACY
   All AI processing runs on YOUR hardware. By default, no data is transmitted to the internet. The app connects only to your paired PC on your local network.

5. OWNERSHIP
   BUTLER AI and all related trademarks, code, designs, and documentation remain the exclusive property of Shawn Papanek. This licence grants no trademark rights.

6. TERMINATION
   Breach of any term ends this licence immediately. Shawn Papanek reserves the right to seek legal remedies for violations.

CONTACT: shawnpapanek@butlerai.app
DMCA AGENT: shawnpapanek@butlerai.app`;

// ── Trademark list ─────────────────────────────────────────────
const TRADEMARKS = [
  { mark: 'BUTLER AI™',     desc: 'Product wordmark' },
  { mark: 'BOTER™',         desc: 'Suite / mascot identity' },
  { mark: 'COMMANDCUBE™',   desc: 'PC tray presence' },
  { mark: 'NEXUS™',         desc: 'Home surface' },
  { mark: 'XUSLINK™',       desc: 'Pairing ceremony + LAN frame protocol' },
  { mark: 'SCRIPTSHIELD™',  desc: 'Script safety engine' },
  { mark: 'FITCORE™',       desc: 'PC profiling + model match engine' },
  { mark: 'DARKBOOT™',      desc: 'Signature launch ritual' },
  { mark: 'BUTLER MIND™',   desc: 'Learning pipeline + .bmind vault' },
  { mark: 'VAULTPROOF™',    desc: 'Live privacy ledger' },
  { mark: 'PULSECODE™',     desc: 'Haptic grammar system' },
];

const C = {
  bg:       '#080C12',
  surface:  '#0D1117',
  text:     '#E8EAF0',
  textMid:  '#9CA3AF',
  textDim:  '#4B5563',
  cyan:     '#00FFD4',
  violet:   '#9B59F6',
  amber:    '#FF9500',
  green:    '#00FF88',
  border:   'rgba(0,212,255,0.10)',
};

// ── Legal row ─────────────────────────────────────────────────
function LegalRow({
  icon, label, onPress, color = C.cyan,
}: { icon: string; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={() => { haptics.light(); onPress(); }}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: color + '0A' }]}
    >
      <View style={[s.iconBox, { backgroundColor: color + '14', borderColor: color + '40' }]}>
        <MaterialIcons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[s.rowLabel, { color: C.text }]}>{label}</Text>
      <MaterialIcons name="chevron-right" size={16} color={C.textDim} />
    </Pressable>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function LegalAboutScreen() {
  const [eulaOpen, setEulaOpen] = useState(false);
  const [tmOpen,   setTmOpen]   = useState(false);

  const openPrivacy  = useCallback(() => Linking.openURL(NX_COPYRIGHT.privacyUrl), []);
  const openGitHub   = useCallback(() => Linking.openURL(NX_COPYRIGHT.github), []);
  const openContact  = useCallback(() => Linking.openURL(`mailto:${NX_COPYRIGHT.contact}`), []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.heroTitle}>BUTLER AI™</Text>
        <Text style={s.version}>v{NX_COPYRIGHT.version} · {BUILD_ID}</Text>
        <Text style={s.copyright}>© 2025–2026 {NX_COPYRIGHT.owner}</Text>
        <Text style={s.copyright}>All Rights Reserved</Text>
      </View>

      {/* ── Legal rows ── */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>LEGAL</Text>
        <LegalRow icon="gavel"        label="End User Licence Agreement"  onPress={() => setEulaOpen(true)}  color={C.cyan}   />
        <LegalRow icon="lock"         label="Privacy Policy"              onPress={openPrivacy}               color={C.violet} />
        <LegalRow icon="shield"       label="Trademark Notice"            onPress={() => setTmOpen(true)}    color={C.amber}  />
        <LegalRow icon="code"         label="Source-Available Server"     onPress={openGitHub}                color={C.green}  />
        <LegalRow icon="mail"         label="Contact / DMCA"              onPress={openContact}               color={C.cyan}   />
      </View>

      {/* ── Source-available notice ── */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>SERVER LICENCE</Text>
        <View style={[s.infoBox, { borderColor: C.green + '40', backgroundColor: C.green + '08' }]}>
          <MaterialIcons name="info-outline" size={14} color={C.green} />
          <Text style={[s.infoText, { color: C.green + 'CC' }]}>
            The server component is published as{' '}
            <Text style={{ fontWeight: '700' }}>source-available</Text>
            {' '}(NOT open source) under the Butler AI Source-Available Licence v1.0.
            You may read, audit, and run it locally.
            You may not redistribute, host as a service, or use it in a competing product.
            Trademarks are not licensed.
          </Text>
        </View>
      </View>

      {/* ── Build fingerprint ── */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>BUILD INFORMATION</Text>
        {[
          ['Build ID',      BUILD_ID],
          ['Build Date',    BUILD_DATE],
          ['Package',       NX_COPYRIGHT.packageId],
          ['Owner',         NX_COPYRIGHT.owner],
          ['DMCA Contact',  NX_COPYRIGHT.contact],
        ].map(([label, value]) => (
          <View key={label} style={s.buildRow}>
            <Text style={s.buildLabel}>{label}</Text>
            <Text style={s.buildValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          </View>
        ))}
      </View>

      {/* ── Footer copyright ── */}
      <View style={s.footer}>
        <Text style={s.footerLine}>{_WM_1}</Text>
        <Text style={s.footerLine}>{_WM_2}</Text>
        <Text style={s.footerLine}>{_WM_3}</Text>
        <Text style={s.footerLine}>{_WM_4}</Text>
        <Text style={[s.footerLine, { marginTop: 8, color: C.textDim }]}>
          PROPRIETARY · NOT OPEN SOURCE · SOURCE-AVAILABLE SERVER ONLY
        </Text>
      </View>

      <View style={{ height: 80 }} />

      {/* ── EULA Modal ── */}
      <Modal visible={eulaOpen} animationType="slide" onRequestClose={() => setEulaOpen(false)}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <Text style={s.modalTitle}>EULA</Text>
            <Pressable onPress={() => setEulaOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialIcons name="close" size={20} color={C.textMid} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={s.eulaText}>{EULA_TEXT}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Trademark Modal ── */}
      <Modal visible={tmOpen} animationType="slide" onRequestClose={() => setTmOpen(false)}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <Text style={s.modalTitle}>TRADEMARK NOTICE</Text>
            <Pressable onPress={() => setTmOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialIcons name="close" size={20} color={C.textMid} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={[s.eulaText, { marginBottom: 16 }]}>
              The following are trademarks of {NX_COPYRIGHT.owner}.
              No trademark right is granted by the source-available licence
              or by possession of any part of this software.
            </Text>
            {TRADEMARKS.map(({ mark, desc }) => (
              <View key={mark} style={[s.tmRow, { borderColor: C.amber + '30' }]}>
                <Text style={[s.tmMark, { color: C.amber }]}>{mark}</Text>
                <Text style={[s.tmDesc, { color: C.textMid }]}>{desc}</Text>
              </View>
            ))}
            <Text style={[s.eulaText, { marginTop: 20, color: C.textDim }]}>
              Trademark Filing: SN-210694951 (Butler AI: PC Automation)
              {'\n'}Owner: {NX_COPYRIGHT.owner}
              {'\n'}Contact: {NX_COPYRIGHT.contact}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const MONO = FontFamily.mono as any;
const ORBITRON = FontFamily.display as any;

const s = StyleSheet.create({
  header: {
    alignItems: 'center', padding: 32, paddingTop: 48, gap: 6,
  },
  heroTitle: {
    fontFamily: ORBITRON, fontSize: 28, color: '#E8EAF0',
    letterSpacing: 3, includeFontPadding: false,
  },
  version: {
    fontFamily: MONO, fontSize: 10, color: '#4B5563', letterSpacing: 1,
    includeFontPadding: false,
  },
  copyright: {
    fontFamily: MONO, fontSize: 11, color: '#6B7280', letterSpacing: 0.5,
    includeFontPadding: false,
  },
  sectionLabel: {
    fontFamily: MONO, fontSize: 9, color: '#4B5563', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4,
    includeFontPadding: false,
  },
  card: {
    marginHorizontal: 14, marginBottom: 12, backgroundColor: '#0D1117',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,212,255,0.10)',
    padding: 14,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderRadius: 10,
    paddingHorizontal: 6,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: 9, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: MONO, fontSize: 12, flex: 1, includeFontPadding: false,
  },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  infoText: {
    fontFamily: FontFamily.body as any, fontSize: 12,
    lineHeight: 18, flex: 1, includeFontPadding: false,
  },
  buildRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6, gap: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,212,255,0.06)',
  },
  buildLabel: {
    fontFamily: MONO, fontSize: 9, color: '#4B5563', letterSpacing: 1,
    includeFontPadding: false,
  },
  buildValue: {
    fontFamily: MONO, fontSize: 9, color: '#9CA3AF', flex: 1,
    textAlign: 'right', includeFontPadding: false,
  },
  footer: {
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 3,
  },
  footerLine: {
    fontFamily: MONO, fontSize: 8, color: '#4B5563', textAlign: 'center',
    letterSpacing: 0.5, includeFontPadding: false,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: ORBITRON, fontSize: 14, color: '#E8EAF0',
    letterSpacing: 2, includeFontPadding: false,
  },
  eulaText: {
    fontFamily: FontFamily.body as any, fontSize: 13,
    color: '#9CA3AF', lineHeight: 21, includeFontPadding: false,
  },
  tmRow: {
    borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8,
  },
  tmMark: {
    fontFamily: MONO, fontSize: 13, fontWeight: '900' as any,
    letterSpacing: 0.5, marginBottom: 4, includeFontPadding: false,
  },
  tmDesc: {
    fontFamily: FontFamily.body as any, fontSize: 12,
    includeFontPadding: false,
  },
});
