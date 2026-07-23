/**
 * BUTLER AI — SCRIPT FORGE v2.0 · PLAY STORE EDITION
 * ─────────────────────────────────────────────────────
 * Complete visual overhaul: full-width layouts, maximized
 * space utilization, premium terminal cyberpunk aesthetic.
 * Every px used deliberately. Performance-optimized FlatList.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ScrollView, Platform, Alert, ActivityIndicator,
  Animated, Dimensions, FlatList, KeyboardAvoidingView, Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { COLOR, FONT, glow, SHADOW } from '@/constants/tokens';
import { serverConnection } from '@/services/serverConnection';
import { autoConnectEngine } from '@/services/autoConnectEngine';
import { loadButlerScripts, deleteButlerScript, saveButlerScript, ButlerScript } from '@/services/butlerScripts';
import { executionCounter } from '@/services/executionCounter';
import { executionHistory } from '@/services/executionHistory';
import { PYTHON_AUTOMATION_SCRIPTS, AutomationScript } from '@/services/pythonAutomationKnowledge';
import { ALL_CATEGORIES, CategoryDef } from '@/services/scriptLibraryData';
import { loadFavorites, toggleFavorite, removeFavorite, FavoriteScript } from '@/services/scriptFavorites';
import { analyzeScript } from '@/services/scriptSafetyGuard';
import { useCosmetic } from '@/contexts/CosmeticContext';
import SafeSchedulePanel from '@/components/scripts/SafeSchedulePanel';
import { useButlerDeferred, useButlerStaggerMount, ButlerSkeleton } from '@/utils/ButlerRenderGuard';
import { BTLR_L } from '@/utils/ButlerLayoutEngine';

const MONO: any = FONT.mono;
const { width: SCREEN_W } = Dimensions.get('window');
const SW = Math.max(320, SCREEN_W);
const PAD = 14;
const CARD_W = (SW - PAD * 2 - 10) / 2; // 2-col grid width

// ─── CATEGORY ACCENT COLORS ───────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'System':        COLOR.cyan,
  'Network':       COLOR.teal,
  'Files':         COLOR.amber,
  'Web':           '#4AFF88',
  'GUI':           COLOR.magenta,
  'Data':          COLOR.yellow,
  'AI Generated':  COLOR.pink,
  'Email':         '#FF44AA',
  'Monitoring':    COLOR.red,
  'Scheduling':    COLOR.blue,
  'Setup':         COLOR.amber,
  'Text':          COLOR.teal,
  'All':           COLOR.cyan,
  'PC Check Suite':COLOR.green,
  'File & Folder': COLOR.amber,
  'Security & Threat': COLOR.red,
  'System Cleaning': COLOR.teal,
  'Monitoring & Alerts': COLOR.red,
  'Performance & Speed': COLOR.yellow,
  'Privacy & Protection': COLOR.magenta,
  'Backup & Recovery': COLOR.blue,
  'Web & Scraping': '#4AFF88',
  'Setup & DevOps': COLOR.pink,
  'Email & Notify': '#FF44AA',
  'Text & Docs':   COLOR.teal,
};

// ─── SERVER EXECUTION ─────────────────────────────────────────────
async function executeScript(
  code: string,
  onChunk: (line: string) => void
): Promise<{ output: string; error: string; success: boolean; ms: number }> {
  const ip    = serverConnection.getIP();
  const port  = serverConnection.getPort();
  const token = serverConnection.getToken();
  if (!ip || !port) return { output: '', error: 'Not connected — pair PC from HOME tab', success: false, ms: 0 };
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 35000);
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`http://${ip}:${port}/api/execute`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ script: code, language: 'python' }),
      signal: ctrl.signal,
    });
    const ms = Date.now() - start;
    let fullText = '';
    const reader = res.body?.getReader();
    if (reader) {
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        fullText += chunk;
        chunk.split('\n').forEach(l => { if (l.trim()) onChunk(l); });
      }
    } else {
      fullText = await res.text();
      fullText.split('\n').forEach(l => { if (l.trim()) onChunk(l); });
    }
    let data: any = {};
    try { data = JSON.parse(fullText); } catch { data = { output: fullText }; }
    const raw     = (data.output || '').trim();
    const hasErr  = raw.toLowerCase().includes('traceback') || raw.toLowerCase().includes('error:');
    return { output: hasErr ? '' : raw, error: hasErr ? raw : (data.error || ''), success: !hasErr && !data.error, ms };
  } catch (e: any) {
    return { output: '', error: e?.name === 'AbortError' ? 'Timeout (35s)' : e?.message || 'Network error', success: false, ms: Date.now() - start };
  }
}

// ─── SHARED MICRO-COMPONENTS ──────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HUDCorners({ color, size = 8, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const s: any = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[s, { top: 0, left: 0,    borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[s, { top: 0, right: 0,   borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[s, { bottom: 0, left: 0, borderBottomWidth: t, borderLeftWidth: t,   borderColor: color }]} />
      <View style={[s, { bottom: 0, right: 0,borderBottomWidth: t, borderRightWidth: t,  borderColor: color }]} />
    </>
  );
}

// ─── EXECUTION OUTPUT MODAL ───────────────────────────────────────
function ExecModal({ visible, name, running, success, output, error, ms, lines, onClose, onAgain }: {
  visible: boolean; name: string; running: boolean;
  success: boolean | null; output: string; error: string; ms: number | null;
  lines: string[]; onClose: () => void; onAgain: () => void;
}) {
  const insets = useSafeAreaInsets();
  const sc = running ? COLOR.cyan : success ? COLOR.green : COLOR.red;
  const glowA = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    if (!visible) return;
    m.current = true;
    if (running) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(glowA, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(glowA, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      ]));
      loop.start();
      return () => { m.current = false; loop.stop(); };
    }
    return () => { m.current = false; };
  }, [visible, running]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          {/* Status stripe */}
          <View style={[em.stripe, { backgroundColor: sc }]} />
          {/* Header */}
          <View style={em.hdr}>
            <View style={[em.statusIcon, { borderColor: sc + '55', backgroundColor: glow(sc, 12) }]}>
              {running
                ? <ActivityIndicator size="small" color={sc} />
                : <MaterialIcons name={success ? 'check-circle' : 'error'} size={20} color={sc} />
              }
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[em.name, { color: sc }]} numberOfLines={1}>{name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <PulseDot color={sc} size={5} />
                <Text style={[em.statusTxt, { color: sc }]}>
                  {running ? 'EXECUTING ON YOUR PC...' : success ? `COMPLETED · ${ms}ms` : `FAILED · ${ms}ms`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={em.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={15} color={COLOR.mid} />
            </TouchableOpacity>
          </View>

          {/* Output area */}
          <View style={[em.outputContainer, { borderColor: sc + '30' }]}>
            <View style={em.outputHdr}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sc }} />
              <Text style={[em.outputLabel, { color: sc }]}>
                {running ? 'LIVE OUTPUT' : 'OUTPUT'}
              </Text>
              {ms !== null && !running && (
                <View style={[em.msBadge, { borderColor: sc + '40', backgroundColor: glow(sc, 8) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: sc }}>{ms}ms</Text>
                </View>
              )}
            </View>
            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
              {running ? (
                lines.slice(-25).map((l, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 2 }}>
                    <Text style={[em.lineNum, { color: COLOR.dim }]}>{(lines.length - lines.slice(-25).length + i + 1).toString().padStart(3, ' ')}</Text>
                    <Text style={em.lineText}>{l}</Text>
                  </View>
                ))
              ) : (
                <>
                  {output ? <Text style={em.outputText} selectable>{output}</Text> : null}
                  {error  ? <Text style={[em.outputText, { color: '#FF8888' }]} selectable>{error}</Text> : null}
                  {!output && !error ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                      <MaterialIcons name="check-circle-outline" size={28} color={COLOR.mid} />
                      <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid }}>Script completed with no output.</Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>

          {!running && (
            <View style={[em.footer, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
              <TouchableOpacity style={[em.runAgainBtn, { backgroundColor: COLOR.cyan }]} onPress={onAgain} activeOpacity={0.85}>
                <MaterialIcons name="replay" size={16} color="#000" />
                <Text style={em.runAgainTxt}>RUN AGAIN</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={em.dismissBtn}>
                <Text style={em.dismissTxt}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
const em = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: COLOR.surf, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', overflow: 'hidden' },
  stripe:          { height: 4 },
  hdr:             { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  statusIcon:      { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:            { fontFamily: MONO, fontSize: 15, fontWeight: '900' },
  statusTxt:       { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  closeBtn:        { width: 32, height: 32, borderRadius: 10, backgroundColor: COLOR.surf2, alignItems: 'center', justifyContent: 'center' },
  outputContainer: { margin: 14, borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' },
  outputHdr:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(0,0,0,0.3)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  outputLabel:     { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, flex: 1 },
  msBadge:         { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  lineNum:         { fontFamily: MONO, fontSize: 10, width: 30, flexShrink: 0, textAlign: 'right' },
  lineText:        { fontFamily: MONO, fontSize: 11, color: COLOR.mid, flex: 1, lineHeight: 17 },
  outputText:      { fontFamily: MONO, fontSize: 12, color: '#88FF99', lineHeight: 19 },
  footer:          { paddingHorizontal: 14, paddingTop: 10, gap: 10 },
  runAgainBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  runAgainTxt:     { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
  dismissBtn:      { alignItems: 'center', paddingVertical: 8 },
  dismissTxt:      { fontFamily: MONO, fontSize: 11, color: COLOR.mid },
});

// ─── PAGE HEADER ──────────────────────────────────────────────────
interface ForgeHeaderProps {
  safeTop: number;
  isConn: boolean;
  addr: string;
  mode: 'scripts' | 'library' | 'favorites' | 'schedule';
  onModeChange: (m: 'scripts' | 'library' | 'favorites' | 'schedule') => void;
  onAdd: () => void;
  accent: string;
}

function ForgeHeader({ safeTop, isConn, addr, mode, onModeChange, onAdd, accent }: ForgeHeaderProps) {
  const scanA = useRef(new Animated.Value(-SW)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW * 2, duration: 3000, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -SW, duration: 0, useNativeDriver: false }),
      Animated.delay(6000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);

  const cc = isConn ? COLOR.green : COLOR.red;

  const MODES = [
    { id: 'scripts'   as const, icon: 'code',          lib: 'm' as const, label: 'SCRIPTS', color: accent           },
    { id: 'library'   as const, icon: 'library-books',  lib: 'm' as const, label: 'LIBRARY', color: COLOR.magenta   },
    { id: 'favorites' as const, icon: 'star',           lib: 'm' as const, label: 'SAVED',   color: COLOR.yellow    },
    { id: 'schedule'  as const, icon: 'shield-lock',    lib: 'm' as const, label: 'SAFE',    color: '#00CCBB'       },
  ];

  return (
    <View style={[fh.root, { paddingTop: safeTop }]}>
      {/* Animated horizontal scanline */}
      <Animated.View pointerEvents="none" style={[fh.scan, { transform: [{ translateX: scanA }] }]} />

      {/* 5-stripe top */}
      <View style={{ height: 3.5, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>

      {/* Brand row */}
      <View style={fh.brandRow}>
        {/* Left: icon + title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 }}>
          <View style={[fh.iconGlyph, { borderColor: accent + '55', backgroundColor: glow(accent, 8) }]}>
            <HUDCorners color={accent + '70'} size={6} />
            <MaterialCommunityIcons name="code-braces-box" size={20} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={fh.brand} adjustsFontSizeToFit minimumFontScale={0.7}>
              <Text style={{ color: accent }}>{'{'}</Text>
              <Text style={{ color: '#FFF' }}>SCRIPT</Text>
              <Text style={{ color: COLOR.green }}>_FORGE</Text>
              <Text style={{ color: accent }}>{'}'}</Text>
            </Text>
            <Text style={fh.sub}>
              <Text style={{ color: COLOR.green + '55' }}>{'# '}</Text>
              <Text style={{ color: COLOR.mid }}>python · bash · ai writer · 250+ scripts</Text>
            </Text>
          </View>
        </View>

        {/* Right: connection + add */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[fh.connPill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
            <PulseDot color={cc} size={5} />
            <Text style={[fh.connTxt, { color: cc }]} numberOfLines={1}>
              {isConn ? (addr.split(':')[0] || 'LIVE') : 'OFFLINE'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => { haptics.heavy(); onAdd(); }} activeOpacity={0.85}
            style={[fh.addFAB, { backgroundColor: accent }]}>
            <MaterialIcons name="add" size={17} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode selector row */}
      <View style={fh.modeRow}>
        {MODES.map(tab => {
          const Icon = tab.lib === 'm' ? MaterialIcons : MaterialCommunityIcons;
          const isActive = mode === tab.id;
          return (
            <TouchableOpacity key={tab.id} onPress={() => { haptics.selection(); onModeChange(tab.id); }} activeOpacity={0.8}
              style={[fh.modeTab, isActive && { backgroundColor: glow(tab.color, 12), borderBottomColor: tab.color, borderBottomWidth: 3 }]}>
              <Icon name={tab.icon as any} size={13} color={isActive ? tab.color : COLOR.dim} />
              <Text style={[fh.modeLabel, { color: isActive ? tab.color : COLOR.dim }]}>{tab.label}</Text>
              {isActive && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: tab.color }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Circuit trace bottom */}
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 3, backgroundColor: accent + '22' }} />
        <View style={{ width: 8,  backgroundColor: accent }} />
        <View style={{ flex: 1,  backgroundColor: COLOR.green + '25' }} />
        <View style={{ width: 4,  backgroundColor: COLOR.green }} />
        <View style={{ flex: 4,  backgroundColor: accent + '10' }} />
        <View style={{ width: 12, backgroundColor: COLOR.magenta }} />
        <View style={{ flex: 2,  backgroundColor: COLOR.magenta + '15' }} />
      </View>
    </View>
  );
}
const fh = StyleSheet.create({
  root:      { backgroundColor: '#010407', overflow: 'hidden' },
  scan:      { position: 'absolute', top: 0, bottom: 0, width: 140, backgroundColor: 'rgba(0,229,255,0.015)', zIndex: 0 },
  brandRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingTop: 11, paddingBottom: 9, zIndex: 1 },
  iconGlyph: { width: 46, height: 46, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' },
  brand:     { fontFamily: MONO, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  sub:       { fontFamily: MONO, fontSize: 8.5, lineHeight: 13, marginTop: 2 },
  connPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  connTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', maxWidth: 80 },
  addFAB:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeRow:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(0,229,255,0.06)', backgroundColor: '#01060E' },
  modeTab:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  modeLabel: { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 },
});

// ─── SEARCH BAR ───────────────────────────────────────────────────
function SearchBar({ value, onChange, count, accent }: { value: string; onChange: (v: string) => void; count: number; accent: string }) {
  const [focused, setFocused] = useState(false);
  const borderA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(borderA, { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused]);
  const borderColor = borderA.interpolate({ inputRange: [0, 1], outputRange: [COLOR.border, accent + 'CC'] });

  return (
    <View style={{ paddingHorizontal: PAD, paddingVertical: 9 }}>
      <Animated.View style={[sb.wrap, { borderColor }]}>
        <MaterialIcons name="search" size={16} color={value ? accent : COLOR.dim} />
        <TextInput
          style={sb.input}
          value={value}
          onChangeText={onChange}
          placeholder="Search scripts, tags, categories..."
          placeholderTextColor={COLOR.dim}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={14} color={COLOR.mid} />
          </TouchableOpacity>
        ) : (
          <View style={[sb.countBadge, { borderColor: accent + '35', backgroundColor: glow(accent, 8) }]}>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: accent }}>{count}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, backgroundColor: COLOR.surf2, paddingHorizontal: 14, paddingVertical: 11 },
  input:      { flex: 1, fontFamily: MONO, fontSize: 12.5, color: COLOR.text, includeFontPadding: false },
  countBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
});

// ─── CATEGORY FILTER CHIPS ────────────────────────────────────────
function CategoryChips({ categories, selected, onSelect }: {
  categories: string[]; selected: string; onSelect: (c: string) => void;
}) {
  return (
    <View style={{ height: 42 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingVertical: 5, gap: 7, alignItems: 'center' }}>
        {categories.map(cat => {
          const isActive = cat === selected;
          const col = CAT_COLORS[cat] || COLOR.cyan;
          return (
            <TouchableOpacity key={cat} onPress={() => { haptics.selection(); onSelect(cat); }} activeOpacity={0.8}
              style={[cfc.chip, isActive && { borderColor: col + '90', backgroundColor: glow(col, 18) }]}>
              {isActive && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: col }} />}
              <Text style={[cfc.txt, isActive && { color: col, fontWeight: '900' }]}>{cat.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
const cfc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 5.5, borderColor: COLOR.border, backgroundColor: COLOR.surf },
  txt:  { fontFamily: MONO, fontSize: 9.5, fontWeight: '600', color: COLOR.mid },
});

// ─── FULL-WIDTH SCRIPT CARD ───────────────────────────────────────
const ScriptCard = React.memo(function ScriptCard({ title, desc, category, isRunning, runCount, onPress, onRun, onFav, isFav }: {
  title: string; desc: string; category: string;
  isRunning: boolean; runCount: number;
  onPress: () => void; onRun: () => void;
  onFav?: () => void; isFav?: boolean;
}) {
  const col   = CAT_COLORS[category] || COLOR.cyan;
  const scaleA = useRef(new Animated.Value(1)).current;
  const runA   = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scaleA, { toValue: 0.985, tension: 400, friction: 12, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue: 1,     tension: 280, friction: 10, useNativeDriver: true }).start();
  const triggerRun = () => {
    haptics.medium();
    Animated.sequence([
      Animated.timing(runA, { toValue: 0.78, duration: 55, useNativeDriver: true }),
      Animated.spring(runA, { toValue: 1, tension: 350, friction: 7, useNativeDriver: true }),
    ]).start();
    onRun();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc2.wrap, { borderColor: col + '30', transform: [{ scale: scaleA }] }]}>
        {/* Left accent bar */}
        <View style={[sc2.accentBar, { backgroundColor: col }]} />

        {/* Content */}
        <View style={sc2.content}>
          {/* Top row: icon + title + category */}
          <View style={sc2.topRow}>
            <View style={[sc2.iconBox, { borderColor: col + '50', backgroundColor: glow(col, 10) }]}>
              <MaterialIcons name="code" size={17} color={col} />
              {runCount > 0 && (
                <View style={[sc2.runBadge, { backgroundColor: col }]}>
                  <Text style={sc2.runBadgeTxt}>×{Math.min(runCount, 99)}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sc2.title} numberOfLines={1}>{title}</Text>
              <Text style={sc2.desc}  numberOfLines={1}>{desc}</Text>
            </View>
            {/* Category badge */}
            <View style={[sc2.catBadge, { borderColor: col + '45', backgroundColor: glow(col, 8) }]}>
              <Text style={[sc2.catTxt, { color: col }]}>{category.slice(0, 8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Right: actions */}
        <View style={sc2.actions}>
          {onFav && (
            <TouchableOpacity onPress={() => { haptics.light(); onFav(); }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={sc2.favBtn}>
              <MaterialIcons name={isFav ? 'star' : 'star-border'} size={14} color={isFav ? COLOR.yellow : COLOR.mid} />
            </TouchableOpacity>
          )}
          <Animated.View style={{ transform: [{ scale: runA }] }}>
            <TouchableOpacity onPress={triggerRun} disabled={isRunning}
              style={[sc2.runBtn, { borderColor: col + '80', backgroundColor: isRunning ? glow(col, 20) : col }]}>
              {isRunning
                ? <ActivityIndicator size="small" color={col + '80'} style={{ transform: [{ scale: 0.7 }] }} />
                : <MaterialIcons name="play-arrow" size={20} color="#000" />
              }
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
});
const sc2 = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLOR.surf, borderRadius: 14, borderWidth: 1, marginBottom: 9, overflow: 'hidden',
                ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 8 }, android: { elevation: 4 } }) },
  accentBar:  { width: 4, alignSelf: 'stretch' },
  content:    { flex: 1, paddingHorizontal: 12, paddingVertical: 13 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  runBadge:   { position: 'absolute', top: -5, right: -6, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  runBadgeTxt:{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: '#000' },
  title:      { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: COLOR.text, marginBottom: 3 },
  desc:       { fontFamily: MONO, fontSize: 10, color: COLOR.mid, lineHeight: 14 },
  catBadge:   { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, flexShrink: 0 },
  catTxt:     { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  actions:    { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingRight: 12, paddingLeft: 4 },
  favBtn:     { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  runBtn:     { width: 40, height: 40, borderRadius: 20, borderWidth: 0, alignItems: 'center', justifyContent: 'center',
                ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 4 } }) },
});

// ─── CATEGORY CARD (LIBRARY GRID) ────────────────────────────────
function CatCard({ cat, index, onPress }: { cat: CategoryDef; index: number; onPress: () => void }) {
  const col = CAT_COLORS[cat.title] || cat.color || COLOR.cyan;
  const Icon = cat.iconLibrary === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const scaleA = useRef(new Animated.Value(1)).current;
  const glowA  = useRef(new Animated.Value(0)).current;
  const m = useRef(true);

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scaleA, { toValue: 0.93, tension: 400, friction: 12, useNativeDriver: true }),
      Animated.timing(glowA,  { toValue: 1, duration: 120, useNativeDriver: false }),
    ]).start();
  };
  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
      Animated.timing(glowA,  { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const borderColor = glowA.interpolate({ inputRange: [0, 1], outputRange: [col + '30', col + '90'] });
  const scriptCount = cat.scripts?.length || 0;

  return (
    <Pressable onPress={() => { haptics.medium(); onPress(); }} onPressIn={pressIn} onPressOut={pressOut}
      style={{ width: CARD_W }}>
      {/* Outer: native-driver scale only — never mix with JS-driver props on Android */}
      <Animated.View style={{ transform: [{ scale: scaleA }] }}>
      <Animated.View style={[catc.card, { borderColor }]}>
        {/* Top accent */}
        <View style={[catc.topAccent, { backgroundColor: col }]} />
        <HUDCorners color={col + '40'} size={7} />

        {/* Count badge — top right */}
        <View style={[catc.countBubble, { borderColor: col + '70', backgroundColor: glow(col, 16) }]}>
          <Text style={[catc.countTxt, { color: col }]}>{scriptCount}</Text>
        </View>

        {/* Icon centered */}
        <View style={catc.body}>
          <View style={[catc.iconCircle, { borderColor: col + '60', backgroundColor: glow(col, 14) }]}>
            <Icon name={cat.icon as any} size={24} color={col} />
          </View>
          <Text style={catc.title} numberOfLines={2}>{cat.title}</Text>
          <Text style={catc.sub}   numberOfLines={1}>{cat.subtitle}</Text>

          {/* Mini script count bar */}
          <View style={catc.barWrap}>
            <View style={[catc.barFill, { backgroundColor: col, width: `${Math.min((scriptCount / 15) * 100, 100)}%` as any }]} />
          </View>
        </View>

        {/* Bottom: arrow */}
        <View style={[catc.arrowRow, { borderTopColor: col + '15' }]}>
          <Text style={[catc.arrowTxt, { color: col + '70' }]}>VIEW ALL</Text>
          <MaterialIcons name="chevron-right" size={13} color={col + '70'} />
        </View>

        {/* Bottom glow line */}
        <View style={[catc.bottomGlow, { backgroundColor: col }]} />
      </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
const catc = StyleSheet.create({
  card:       { backgroundColor: COLOR.surf, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', position: 'relative',
                ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 5 } }) },
  topAccent:  { height: 3.5 },
  body:       { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, paddingTop: 12, gap: 8 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  countBubble:{ position: 'absolute', top: 12, right: 10, minWidth: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  countTxt:   { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  title:      { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: COLOR.text, textAlign: 'center', lineHeight: 16 },
  sub:        { fontFamily: MONO, fontSize: 9, color: COLOR.mid, textAlign: 'center', lineHeight: 12 },
  barWrap:    { width: '80%', height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 2, opacity: 0.7 },
  arrowRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderTopWidth: 1, paddingVertical: 8 },
  arrowTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  bottomGlow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.3 },
});

// ─── LIBRARY HEADER ───────────────────────────────────────────────
function LibraryHero({ total, catCount, isConn }: { total: number; catCount: number; isConn: boolean }) {
  const [time, setTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={lhero.root}>
      {/* Eyebrow */}
      <Text style={lhero.eyebrow}>PYTHON AUTOMATION · {total}+ SCRIPTS</Text>

      {/* Title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={lhero.title}>SCRIPT<Text style={{ color: COLOR.magenta }}> LIBRARY</Text></Text>
        </View>
        {/* Live clock */}
        <View style={[lhero.clock, { borderColor: COLOR.cyan + '35', backgroundColor: glow(COLOR.cyan, 6) }]}>
          <HUDCorners color={COLOR.cyan + '40'} size={5} />
          <MaterialCommunityIcons name="clock-time-four-outline" size={10} color={COLOR.cyan + '70'} />
          <Text style={lhero.clockTxt}>{time}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[
          { label: `${total}+`,    sub: 'SCRIPTS', col: COLOR.cyan    },
          { label: `${catCount}`,  sub: 'CATS',    col: COLOR.magenta },
          { label: 'LOCAL',        sub: 'ONLY',    col: COLOR.green   },
          { label: 'AES256',       sub: 'SECURE',  col: COLOR.amber   },
        ].map((s, i) => (
          <View key={i} style={[lhero.stat, { borderTopColor: s.col, borderColor: s.col + '28' }]}>
            <Text style={[lhero.statVal, { color: s.col }]}>{s.label}</Text>
            <Text style={lhero.statSub}>{s.sub}</Text>
          </View>
        ))}
      </View>

      {/* Section label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: COLOR.magenta }} />
        <MaterialCommunityIcons name="folder-multiple" size={11} color={COLOR.magenta} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.magenta + '90', letterSpacing: 1.8 }}>
          {catCount} CATEGORIES
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: COLOR.magenta + '20' }} />
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderColor: (isConn ? COLOR.green : COLOR.red) + '45', backgroundColor: glow(isConn ? COLOR.green : COLOR.red, 7) }]}>
          <PulseDot color={isConn ? COLOR.green : COLOR.red} size={5} />
          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: isConn ? COLOR.green : COLOR.red }}>{isConn ? 'PC READY' : 'PAIR PC'}</Text>
        </View>
      </View>
    </View>
  );
}
const lhero = StyleSheet.create({
  root:     { backgroundColor: '#010407', paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: COLOR.magenta + '15' },
  eyebrow:  { fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: COLOR.magenta + '70', letterSpacing: 2, marginBottom: 7 },
  title:    { fontFamily: MONO, fontSize: 26, fontWeight: '900', color: COLOR.text, letterSpacing: 0.5 },
  clock:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6, position: 'relative', overflow: 'hidden' },
  clockTxt: { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: COLOR.cyan, letterSpacing: 1 },
  stat:     { flex: 1, backgroundColor: COLOR.surf2, borderRadius: 10, borderWidth: 1.5, borderTopWidth: 3, paddingVertical: 9, alignItems: 'center', gap: 2 },
  statVal:  { fontFamily: MONO, fontSize: 15, fontWeight: '900', lineHeight: 19 },
  statSub:  { fontFamily: MONO, fontSize: 7, color: COLOR.dim, letterSpacing: 0.5 },
});

// ─── CATEGORY DETAIL MODAL ────────────────────────────────────────
function CatModal({ cat, isConn, onClose }: { cat: CategoryDef | null; isConn: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<any | null>(null);
  const [running, setRunning]   = useState(false);
  const [output,  setOutput]    = useState('');
  const [lines,   setLines]     = useState<string[]>([]);
  const [elapsed, setElapsed]   = useState<number | null>(null);

  if (!cat) return null;
  const col = CAT_COLORS[cat.title] || cat.color || COLOR.cyan;
  const Icon = cat.iconLibrary === 'community' ? MaterialCommunityIcons : MaterialIcons;

  const run = async () => {
    if (!selected || !isConn) return;
    haptics.heavy(); setRunning(true); setOutput(''); setLines([]); setElapsed(null);
    const r = await executeScript(selected.code, l => setLines(p => [...p.slice(-30), l]));
    setOutput(r.output || r.error || ''); setRunning(false); setElapsed(r.ms);
    haptics[r.success ? 'success' : 'warning']();
  };

  return (
    <Modal visible={!!cat} animationType="slide" statusBarTranslucent onRequestClose={() => { selected ? setSelected(null) : onClose(); }}>
      <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
        {/* Header */}
        <View style={[cdm.hdr, { paddingTop: insets.top + 10, borderBottomColor: col + '55' }]}>
          <TouchableOpacity onPress={() => { selected ? setSelected(null) : onClose(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color={col} />
          </TouchableOpacity>
          <View style={[cdm.headerIconBox, { borderColor: col + '50', backgroundColor: glow(col, 10) }]}>
            <Icon name={cat.icon as any} size={16} color={col} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cdm.title, { color: col }]} numberOfLines={1}>{selected ? selected.name : cat.title}</Text>
            <Text style={cdm.sub} numberOfLines={1}>{selected ? selected.desc : cat.subtitle}</Text>
          </View>
          <View style={[cdm.badge, { borderColor: col + '60', backgroundColor: glow(col, 14) }]}>
            <Text style={[cdm.badgeTxt, { color: col }]}>{cat.scripts.length}</Text>
          </View>
        </View>

        {selected ? (
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: PAD }}>
              {/* Code block */}
              <View style={cdm.codeBlock}>
                <View style={cdm.codeChrome}>
                  {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><View key={i} style={{ width:10,height:10,borderRadius:5,backgroundColor:c }}/>)}
                  <Text style={cdm.codeFileName}>script.py</Text>
                  <View style={[cdm.pyBadge, { borderColor: col + '40', backgroundColor: glow(col, 8) }]}>
                    <Text style={[cdm.pyTxt, { color: col }]}>PYTHON</Text>
                  </View>
                </View>
                <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  <Text style={{ fontFamily: MONO, fontSize: 12, color: col + 'DD', lineHeight: 19 }} selectable>{selected.code}</Text>
                </ScrollView>
              </View>

              {/* Output area */}
              {(output || running) ? (
                <View style={[cdm.outBlock, { borderColor: (running ? COLOR.cyan : output.includes('Error') ? COLOR.red : COLOR.green) + '45' }]}>
                  <View style={cdm.outHdr}>
                    <MaterialIcons name={running ? 'autorenew' : 'terminal'} size={12} color={running ? COLOR.cyan : COLOR.green} />
                    <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: running ? COLOR.cyan : COLOR.green, letterSpacing: 1.2 }}>
                      {running ? 'EXECUTING...' : `OUTPUT · ${elapsed}ms`}
                    </Text>
                  </View>
                  {running ? lines.map((l, i) => <Text key={i} style={cdm.outLine}>{l}</Text>) : null}
                  {output ? <Text style={{ fontFamily: MONO, fontSize: 12, color: output.includes('Error') ? '#FF8888' : '#88FF99', lineHeight: 18 }} selectable>{output}</Text> : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={[cdm.footer, { paddingBottom: Math.max(insets.bottom + 10, 18) }]}>
              <TouchableOpacity onPress={run} disabled={running || !isConn}
                style={[cdm.runBtn, { backgroundColor: isConn ? col : COLOR.mid, opacity: running ? 0.7 : 1 }]}>
                {running ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="play-arrow" size={20} color="#000" />}
                <Text style={cdm.runBtnTxt}>{running ? 'RUNNING ON PC...' : 'RUN ON MY PC'}</Text>
              </TouchableOpacity>
              {!isConn && <Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.red, textAlign: 'center', marginTop: 6 }}>Pair PC from HOME to run scripts</Text>}
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: PAD, gap: 8, paddingBottom: 100 }}>
            {/* Category hero row */}
            <View style={[cdm.catHero, { borderColor: col + '35', backgroundColor: glow(col, 6) }]}>
              <View style={[cdm.catHeroIcon, { borderColor: col + '60', backgroundColor: glow(col, 12) }]}>
                <Icon name={cat.icon as any} size={28} color={col} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[cdm.catHeroTitle, { color: col }]}>{cat.title}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 9.5, color: COLOR.mid }}>{cat.subtitle}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: col + '70', marginTop: 4 }}>{cat.scripts.length} SCRIPTS READY</Text>
              </View>
            </View>

            {cat.scripts.map((s: any, i: number) => (
              <TouchableOpacity key={s.id} onPress={() => { haptics.selection(); setSelected(s); setOutput(''); setLines([]); setElapsed(null); }}
                style={[cdm.scriptRow, { borderLeftColor: col, borderColor: col + '30' }]}>
                <View style={[cdm.idx, { backgroundColor: glow(col, 16), borderColor: col + '40' }]}>
                  <Text style={[cdm.idxTxt, { color: col }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cdm.scriptName} numberOfLines={1}>{s.name}</Text>
                  <Text style={cdm.scriptDesc} numberOfLines={2}>{s.desc}</Text>
                </View>
                <View style={[cdm.arrowBox, { borderColor: col + '35', backgroundColor: glow(col, 8) }]}>
                  <MaterialIcons name="chevron-right" size={16} color={col} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
const cdm = StyleSheet.create({
  hdr:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, paddingBottom: 14, borderBottomWidth: 2 },
  headerIconBox:{ width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:        { fontFamily: MONO, fontSize: 16, fontWeight: '900' },
  sub:          { fontFamily: MONO, fontSize: 9, color: COLOR.mid, marginTop: 2 },
  badge:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  badgeTxt:     { fontFamily: MONO, fontSize: 16, fontWeight: '900' },
  catHero:      { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 4 },
  catHeroIcon:  { width: 60, height: 60, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catHeroTitle: { fontFamily: MONO, fontSize: 16, fontWeight: '900', marginBottom: 3 },
  codeBlock:    { backgroundColor: '#020810', borderRadius: 14, borderWidth: 1.5, borderColor: COLOR.border, overflow: 'hidden', marginBottom: 12 },
  codeChrome:   { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomWidth: 1, borderBottomColor: COLOR.border },
  codeFileName: { flex: 1, fontFamily: MONO, fontSize: 10, color: COLOR.mid, textAlign: 'center' },
  pyBadge:      { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  pyTxt:        { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  outBlock:     { borderWidth: 1.5, borderRadius: 12, padding: 12, marginTop: 8, backgroundColor: 'rgba(0,0,0,0.2)' },
  outHdr:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
  outLine:      { fontFamily: MONO, fontSize: 10, color: COLOR.mid, lineHeight: 16 },
  footer:       { padding: PAD, borderTopWidth: 1, borderTopColor: COLOR.border },
  runBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15,
                  ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 6 } }) },
  runBtnTxt:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
  scriptRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLOR.surf, borderRadius: 13, borderWidth: 1, borderLeftWidth: 4, padding: 14 },
  idx:          { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  idxTxt:       { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  scriptName:   { fontFamily: MONO, fontSize: 13, fontWeight: '700', color: COLOR.text, marginBottom: 4 },
  scriptDesc:   { fontFamily: MONO, fontSize: 10, color: COLOR.mid, lineHeight: 14 },
  arrowBox:     { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── AI SCRIPT CARD ───────────────────────────────────────────────
const AICard = React.memo(function AICard({ script, isRunning, onRun, onDelete, onEdit }: {
  script: ButlerScript; isRunning: boolean;
  onRun: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue: 0.985, tension: 400, friction: 12, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start()}
      onPress={onEdit}>
      <Animated.View style={[sc2.wrap, { borderColor: COLOR.amber + '35', transform: [{ scale: scaleA }] }]}>
        <View style={[sc2.accentBar, { backgroundColor: COLOR.amber }]} />
        <View style={sc2.content}>
          <View style={sc2.topRow}>
            <View style={[sc2.iconBox, { borderColor: COLOR.amber + '50', backgroundColor: glow(COLOR.amber, 10) }]}>
              <MaterialIcons name="psychology" size={17} color={COLOR.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sc2.title} numberOfLines={1}>{script.title}</Text>
              <Text style={sc2.desc}  numberOfLines={1}>{script.description}</Text>
            </View>
            <View style={[sc2.catBadge, { borderColor: COLOR.amber + '45', backgroundColor: glow(COLOR.amber, 8) }]}>
              <Text style={[sc2.catTxt, { color: COLOR.amber }]}>AI GEN</Text>
            </View>
          </View>
          {/* Action chips */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginLeft: 54 }}>
            <TouchableOpacity onPress={() => { haptics.light(); onEdit(); }}
              style={[aic.chip, { borderColor: COLOR.cyan + '40', backgroundColor: glow(COLOR.cyan, 7) }]}>
              <MaterialIcons name="edit" size={10} color={COLOR.cyan} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.cyan }}>EDIT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { haptics.heavy(); onDelete(); }}
              style={[aic.chip, { borderColor: COLOR.red + '40', backgroundColor: glow(COLOR.red, 7) }]}>
              <MaterialIcons name="delete-outline" size={10} color={COLOR.red} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: COLOR.red }}>DEL</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[sc2.actions, { paddingRight: 12 }]}>
          <TouchableOpacity onPress={() => { haptics.medium(); onRun(); }} disabled={isRunning}
            style={[sc2.runBtn, { backgroundColor: isRunning ? glow(COLOR.amber, 20) : COLOR.amber, borderWidth: 0 }]}>
            {isRunning
              ? <ActivityIndicator size="small" color={COLOR.amber + '80'} style={{ transform: [{ scale: 0.7 }] }} />
              : <MaterialIcons name="play-arrow" size={20} color="#000" />
            }
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Pressable>
  );
});
const aic = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
});

// ─── FEATURED SCRIPT ROW ─────────────────────────────────────────
function FeaturedRow({ scripts, isConn, onRun }: {
  scripts: AutomationScript[];
  isConn: boolean;
  onRun: (s: AutomationScript) => void;
}) {
  if (scripts.length === 0) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={fr.label}>
        <MaterialCommunityIcons name="star-four-points" size={11} color={COLOR.amber} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.amber + '90', letterSpacing: 1.8 }}>FEATURED</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: COLOR.amber + '20' }} />
        <MaterialCommunityIcons name="clipboard-list-outline" size={11} color={COLOR.mid} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 8, gap: 9 }}>
        {scripts.slice(0, 8).map((s, i) => {
          const col = CAT_COLORS[s.category] || COLOR.cyan;
          return (
            <TouchableOpacity key={s.id} onPress={() => { haptics.medium(); onRun(s); }} disabled={!isConn} activeOpacity={0.85}
              style={[fr.card, { borderColor: col + '40', borderTopColor: col, opacity: !isConn ? 0.45 : 1 }]}>
              <View style={[fr.iconBubble, { borderColor: col + '55', backgroundColor: glow(col, 12) }]}>
                <MaterialIcons name="code" size={16} color={col} />
              </View>
              <Text style={[fr.cardTitle, { color: col }]} numberOfLines={2}>{s.title}</Text>
              <View style={[fr.cardCat, { borderColor: col + '35', backgroundColor: glow(col, 7) }]}>
                <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: col }}>{s.category.slice(0,8).toUpperCase()}</Text>
              </View>
              <View style={[fr.runBubble, { backgroundColor: col }]}>
                <MaterialIcons name="play-arrow" size={12} color="#000" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
const fr = StyleSheet.create({
  label:     { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 6 },
  card:      { width: 130, backgroundColor: COLOR.surf, borderRadius: 13, borderWidth: 1.5, borderTopWidth: 3, padding: 12, gap: 7, position: 'relative', overflow: 'hidden',
               ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 3 } }) },
  iconBubble:{ width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '900', lineHeight: 14 },
  cardCat:   { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  runBubble: { position: 'absolute', bottom: 8, right: 8, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

// ─── SCRIPT EDITOR MODAL ─────────────────────────────────────────
function EditorModal({ visible, editScript, onClose, onRun }: {
  visible: boolean; editScript: ButlerScript | null;
  onClose: () => void; onRun: (name: string, code: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name,      setName]      = useState('');
  const [code,      setCode]      = useState('');
  const [saving,    setSaving]    = useState(false);
  const [aiPrompt,  setAiPrompt]  = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState('');
  const [tab,       setTab]       = useState<'write' | 'ai'>('write');

  useEffect(() => {
    if (visible) {
      setName(editScript?.title  || '');
      setCode(editScript?.script || '');
      setTab('write'); setAiResult(''); setAiPrompt('');
    }
  }, [visible, editScript?.id]);

  const save = async () => {
    if (!code.trim()) { Alert.alert('Empty Script', 'Add some Python code first.'); return; }
    if (!name.trim()) { Alert.alert('No Name',      'Give your script a name.');    return; }
    setSaving(true);
    try {
      await saveButlerScript(code, { title: name, category: 'AI Generated' });
      haptics.success(); onClose();
    } catch (e: any) { Alert.alert('Save Failed', e?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    const ip = serverConnection.getIP(), port = serverConnection.getPort(), token = serverConnection.getToken();
    if (!ip || !port) { Alert.alert('Not Connected', 'Connect your PC first.'); return; }
    setAiLoading(true); setAiResult('');
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 45000);
      const res  = await fetch(`http://${ip}:${port}/api/butler/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: `Write a Python script that: ${aiPrompt}. Return ONLY Python code.` }),
        signal: ctrl.signal,
      });
      const d = await res.json();
      const c = (d.content || d.response || d.message || '').replace(/```python\n?/gi,'').replace(/```\n?/g,'').trim();
      if (c) { setAiResult(c); haptics.success(); }
      else Alert.alert('No Result', 'AI returned empty response.');
    } catch (e: any) { Alert.alert('AI Error', e?.message || 'Failed'); }
    finally { setAiLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
        {/* Header */}
        <View style={[ede.hdr, { paddingTop: Math.max(insets.top + 8, 28) }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color={COLOR.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ede.title}>{editScript ? 'EDIT ' : 'NEW '}<Text style={{ color: COLOR.cyan }}>SCRIPT</Text></Text>
            <Text style={ede.sub}>Python · runs on your paired PC</Text>
          </View>
          <View style={[ede.pyBadge, { borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 8) }]}>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.amber }}>PYTHON</Text>
          </View>
        </View>
        {/* Tab bar */}
        <View style={ede.tabRow}>
          {[{ id: 'write' as const, icon: 'code', label: 'WRITE CODE', color: COLOR.cyan }, { id: 'ai' as const, icon: 'auto-awesome', label: 'AI GENERATE', color: COLOR.green }].map(t => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)}
              style={[ede.tabBtn, tab === t.id && { borderBottomWidth: 2.5, borderBottomColor: t.color, backgroundColor: glow(t.color, 8) }]}>
              <MaterialIcons name={t.icon as any} size={13} color={tab === t.id ? t.color : COLOR.mid} />
              <Text style={[ede.tabTxt, tab === t.id && { color: t.color, fontWeight: '900' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: PAD, gap: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            {tab === 'write' ? (
              <>
                <View>
                  <Text style={ede.fieldLabel}>SCRIPT NAME</Text>
                  <TextInput style={ede.textField} value={name} onChangeText={setName}
                    placeholder="e.g. System Snapshot" placeholderTextColor={COLOR.dim}
                    autoCapitalize="words" maxLength={40} />
                </View>
                <View style={ede.codeWrap}>
                  <View style={ede.codeChrome}>
                    {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><View key={i} style={{ width:10,height:10,borderRadius:5,backgroundColor:c }}/>)}
                    <Text style={ede.codeFileName}>script.py</Text>
                    <Text style={ede.lineCount}>{code.split('\n').length} lines</Text>
                  </View>
                  <TextInput style={ede.codeInput} value={code} onChangeText={setCode}
                    multiline autoCapitalize="none" autoCorrect={false} spellCheck={false}
                    placeholder={'# Write Python script\nimport platform\nprint(platform.system())'}
                    placeholderTextColor={COLOR.dim} textAlignVertical="top" />
                </View>
              </>
            ) : (
              <>
                <View style={[ede.infoBanner, { borderColor: COLOR.green + '30', backgroundColor: glow(COLOR.green, 5) }]}>
                  <MaterialIcons name="info-outline" size={14} color={COLOR.green} />
                  <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid, flex: 1, lineHeight: 17 }}>Powered by your local Ollama AI. Requires a connected PC.</Text>
                </View>
                <View>
                  <Text style={ede.fieldLabel}>DESCRIBE YOUR SCRIPT</Text>
                  <TextInput style={[ede.textField, { minHeight: 90, textAlignVertical: 'top' }]}
                    value={aiPrompt} onChangeText={setAiPrompt} multiline
                    placeholder="e.g. monitor CPU usage every 5s and alert if above 85%"
                    placeholderTextColor={COLOR.dim} autoCapitalize="none" />
                </View>
                <TouchableOpacity onPress={askAI} disabled={!aiPrompt.trim() || aiLoading}
                  style={[ede.genBtn, { opacity: (!aiPrompt.trim() || aiLoading) ? 0.4 : 1 }]}>
                  {aiLoading ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="auto-awesome" size={16} color="#000" />}
                  <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' }}>{aiLoading ? 'GENERATING...' : 'GENERATE WITH AI'}</Text>
                </TouchableOpacity>
                {aiResult ? (
                  <View style={[ede.aiResult, { borderColor: COLOR.green + '40' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: COLOR.green, letterSpacing: 1.2 }}>GENERATED SCRIPT</Text>
                      <TouchableOpacity onPress={() => { setCode(aiResult); setName(aiPrompt.slice(0, 40)); setTab('write'); haptics.success(); }}
                        style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderColor: COLOR.cyan, backgroundColor: glow(COLOR.cyan, 10) }]}>
                        <MaterialIcons name="check" size={12} color={COLOR.cyan} />
                        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.cyan }}>USE THIS</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.green + 'DD', lineHeight: 18 }}>{aiResult}</Text>
                    </ScrollView>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={[ede.footer, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
          <TouchableOpacity onPress={save} disabled={saving}
            style={[ede.actionBtn, { backgroundColor: COLOR.amber, flex: 1.3, opacity: saving ? 0.5 : 1 }]}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="save" size={16} color="#000" />}
            <Text style={ede.actionTxt}>{saving ? 'SAVING...' : editScript ? 'UPDATE' : 'SAVE'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (code.trim()) onRun(name.trim() || 'Custom', code); }} disabled={!code.trim()}
            style={[ede.actionBtn, { backgroundColor: COLOR.cyan, flex: 1, opacity: !code.trim() ? 0.35 : 1 }]}>
            <MaterialIcons name="play-arrow" size={18} color="#000" />
            <Text style={ede.actionTxt}>RUN NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const ede = StyleSheet.create({
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: COLOR.surf, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  title:      { fontFamily: MONO, fontSize: 18, fontWeight: '900', color: COLOR.text },
  sub:        { fontFamily: MONO, fontSize: 10, color: COLOR.mid, marginTop: 2 },
  pyBadge:    { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  tabRow:     { flexDirection: 'row', backgroundColor: COLOR.surf, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTxt:     { fontFamily: MONO, fontSize: 10, fontWeight: '600', color: COLOR.mid },
  fieldLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.mid, letterSpacing: 1.2, marginBottom: 7 },
  textField:  { backgroundColor: COLOR.surf, borderWidth: 1.5, borderColor: COLOR.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: COLOR.text, fontFamily: MONO, fontSize: 14 },
  codeWrap:   { backgroundColor: '#020810', borderRadius: 14, borderWidth: 1.5, borderColor: COLOR.border, overflow: 'hidden' },
  codeChrome: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomWidth: 1, borderBottomColor: COLOR.border },
  codeFileName:{ flex: 1, fontFamily: MONO, fontSize: 10, color: COLOR.mid, textAlign: 'center' },
  lineCount:  { fontFamily: MONO, fontSize: 9, color: COLOR.dim },
  codeInput:  { padding: 14, fontFamily: MONO, fontSize: 13, color: COLOR.text, minHeight: 260, lineHeight: 21 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 13 },
  genBtn:     { backgroundColor: COLOR.green, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14,
                ...Platform.select({ ios: { shadowColor: COLOR.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 }, android: { elevation: 6 } }) },
  aiResult:   { borderWidth: 1.5, borderRadius: 14, padding: 13, backgroundColor: glow(COLOR.green, 4) },
  footer:     { flexDirection: 'row', gap: 10, paddingHorizontal: PAD, paddingTop: 12, backgroundColor: COLOR.surf, borderTopWidth: 1, borderTopColor: COLOR.border },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, paddingVertical: 14 },
  actionTxt:  { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

// ─── FLOATING AI QUICK-CHAT ───────────────────────────────────────
function QuickAIWidget({ isConn }: { isConn: boolean }) {
  const [open,    setOpen]    = useState(false);
  const [msg,     setMsg]     = useState('');
  const [reply,   setReply]   = useState('');
  const [loading, setLoading] = useState(false);
  const slideA = useRef(new Animated.Value(0)).current;
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);

  const toggle = () => {
    haptics.medium();
    Animated.spring(slideA, { toValue: open ? 0 : 1, tension: 220, friction: 18, useNativeDriver: true }).start();
    setOpen(o => !o);
  };

  const send = async () => {
    if (!msg.trim() || loading) return;
    haptics.heavy(); setLoading(true); setReply('');
    const ip = serverConnection.getIP(), port = serverConnection.getPort(), token = serverConnection.getToken();
    if (!ip || !port) { setReply('Pair your PC from HOME tab to use AI.'); setLoading(false); return; }
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 20000);
      const res  = await fetch(`http://${ip}:${port}/api/butler/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: msg }),
        signal: ctrl.signal,
      });
      const d = await res.json();
      const r = (d.content || d.response || d.message || d.output || '').trim();
      if (m.current) { setReply(r || 'No response from Butler.'); haptics.success(); }
    } catch (e: any) {
      if (m.current) setReply(isConn ? 'Error: ' + (e?.message || 'failed') : 'Pair PC first.');
    } finally {
      if (m.current) setLoading(false);
    }
  };

  const translateY = slideA.interpolate({ inputRange: [0, 1], outputRange: [200, 0] });
  const opacity    = slideA.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.3, 1] });
  const cc = isConn ? COLOR.cyan : COLOR.mid;

  return (
    <View style={qai.container} pointerEvents="box-none">
      {open && (
        <Animated.View style={[qai.panel, { transform: [{ translateY }], opacity }]}>
          <View style={[qai.panelTop, { backgroundColor: cc }]} />
          <View style={[qai.panelHdr, { borderBottomColor: cc + '28' }]}>
            <View style={[qai.botIcon, { borderColor: cc + '55', backgroundColor: glow(cc, 12) }]}>
              <MaterialCommunityIcons name="robot-happy-outline" size={14} color={cc} />
            </View>
            <Text style={[qai.botTitle, { color: cc }]}>Butler · {isConn ? 'online' : 'offline'}</Text>
            <PulseDot color={cc} size={5} />
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => { setOpen(false); setReply(''); setMsg(''); slideA.setValue(0); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={15} color={COLOR.mid} />
            </TouchableOpacity>
          </View>
          {!isConn ? (
            <View style={{ padding: 14 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid, lineHeight: 16 }}>Quick AI chat. Pair your PC from the HOME tab to start.</Text>
            </View>
          ) : reply ? (
            <ScrollView style={{ maxHeight: 140 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: MONO, fontSize: 11.5, color: COLOR.green + 'DD', lineHeight: 18 }}>{reply}</Text>
            </ScrollView>
          ) : (
            <View style={{ padding: 12 }}>
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: COLOR.mid, lineHeight: 16 }}>Ask Butler anything about your PC or scripts...</Text>
            </View>
          )}
          <View style={qai.inputRow}>
            <TextInput
              style={[qai.chatInput, { borderColor: cc + '35' }]}
              value={msg} onChangeText={setMsg}
              placeholder={isConn ? 'Ask anything...' : 'Pair PC first...'}
              placeholderTextColor={COLOR.dim}
              autoCorrect={false} autoCapitalize="none"
              onSubmitEditing={send} returnKeyType="send"
              editable={isConn}
            />
            <TouchableOpacity onPress={send} disabled={loading || !msg.trim() || !isConn}
              style={[qai.sendBtn, { backgroundColor: isConn ? cc : COLOR.dim, opacity: (!msg.trim() || loading || !isConn) ? 0.35 : 1 }]}>
              {loading
                ? <ActivityIndicator size="small" color="#000" style={{ transform: [{ scale: 0.7 }] }} />
                : <MaterialIcons name="send" size={14} color="#000" />
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      {!open && (
        <TouchableOpacity onPress={toggle} activeOpacity={0.85}
          style={[qai.fab, { backgroundColor: isConn ? COLOR.cyan : '#0A1A2E', borderColor: isConn ? COLOR.cyan + '80' : COLOR.mid + '40' }]}>
          <MaterialCommunityIcons name="robot-happy-outline" size={22} color={isConn ? '#000' : COLOR.mid} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const qai = StyleSheet.create({
  container: { position: 'absolute', bottom: 90, right: PAD, zIndex: 999, alignItems: 'flex-end' },
  panel:     { width: Math.min(SW - 28, 310), backgroundColor: '#030C18', borderRadius: 18, borderWidth: 1.5, borderColor: COLOR.cyan + '35', overflow: 'hidden', marginBottom: 10,
               ...Platform.select({ ios: { shadowColor: COLOR.cyan, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 }, android: { elevation: 12 } }) },
  panelTop:  { height: 3 },
  panelHdr:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1 },
  botIcon:   { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  botTitle:  { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 6 },
  chatInput: { flex: 1, backgroundColor: '#010810', borderRadius: 22, borderWidth: 1.5, color: COLOR.text, fontFamily: MONO, fontSize: 12, paddingHorizontal: 14, paddingVertical: 10 },
  sendBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  fab:       { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
               ...Platform.select({ ios: { shadowColor: COLOR.cyan, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 }, android: { elevation: 10 } }) },
});

// ─── EMPTY STATE ──────────────────────────────────────────────────
function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 64, gap: 12, paddingHorizontal: 32 }}>
      <View style={{ width: 72, height: 72, borderRadius: 22, borderWidth: 1.5, borderColor: COLOR.dim, backgroundColor: glow(COLOR.cyan, 5), alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon as any} size={32} color={COLOR.dim} />
      </View>
      <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: COLOR.mid, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim, textAlign: 'center', lineHeight: 17 }}>{sub}</Text>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function ScriptsInner() {
  const insets = useSafeAreaInsets();
  const { T } = useCosmetic();
  const accent = T.primary || COLOR.cyan;

  const [mode,         setMode]         = useState<'scripts' | 'library' | 'favorites' | 'schedule'>('scripts');
  const [search,       setSearch]       = useState('');
  // BUTLER AI: deferred search value — filters only after 200ms of inactivity
  // This prevents filtering on every keystroke for 250+ scripts.
  // utils/ButlerRenderGuard.tsx — © 2024-2026 Andrej Sladkovic
  const deferredSearch = useButlerDeferred(search, 200);
  const [category,     setCategory]     = useState('All');
  const [isConn,       setIsConn]       = useState(false);
  const [addr,         setAddr]         = useState('');
  const [butlerScripts,setButlerScripts]= useState<ButlerScript[]>([]);
  const [runCounts,    setRunCounts]    = useState<Record<string, number>>({});
  const [runningId,    setRunningId]    = useState<string | null>(null);
  const [favorites,    setFavorites]    = useState<FavoriteScript[]>([]);
  const [exec, setExec] = useState<{
    visible: boolean; name: string; running: boolean; success: boolean | null;
    output: string; error: string; ms: number | null; code: string; lines: string[];
  }>({ visible: false, name: '', running: false, success: null, output: '', error: '', ms: null, code: '', lines: [] });
  const [catModal,   setCatModal]   = useState<CategoryDef | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editScript, setEditScript] = useState<ButlerScript | null>(null);

  const loadAll = useCallback(async () => {
    try {
      await serverConnection.load();
      const c = serverConnection.isConnected();
      setIsConn(c);
      setAddr(c ? `${serverConnection.getIP()}:${serverConnection.getPort()}` : '');
    } catch { setIsConn(false); }
    try { setButlerScripts(await loadButlerScripts()); } catch {}
    try { setRunCounts(await executionCounter.load()); } catch {}
    try { setFavorites(await loadFavorites()); } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadAll();
    const unsub = autoConnectEngine.onEvent(evt => {
      if (evt.status === 'connected' && evt.ip) { setIsConn(true); setAddr(`${evt.ip}:${evt.port}`); }
      else if (evt.status === 'idle')            { setIsConn(false); setAddr(''); }
    });
    return () => { unsub(); };
  }, [loadAll]));

  const run = useCallback(async (scriptName: string, scriptCode: string, id: string) => {
    if (!isConn) { Alert.alert('OFFLINE', 'Connect to PC from HOME tab first.'); return; }
    haptics.medium();
    setRunningId(id);
    setExec({ visible: true, name: scriptName, running: true, success: null, output: '', error: '', ms: null, code: scriptCode, lines: [] });
    const result = await executeScript(scriptCode, line => setExec(p => ({ ...p, lines: [...p.lines.slice(-30), line] })));
    setRunningId(null);
    setExec(p => ({ ...p, running: false, success: result.success, output: result.output, error: result.error, ms: result.ms }));
    haptics[result.success ? 'success' : 'warning']();
    try { await executionCounter.increment(id); setRunCounts(await executionCounter.load()); } catch {}
    try { await executionHistory.addEntry({ scriptId: id, scriptName, category: 'Custom', success: result.success, ms: result.ms ?? 0, timestamp: new Date().toISOString() }); } catch {}
  }, [isConn]);

  // Featured = most-run or top System scripts
  const featured = useMemo(() => {
    const sys = PYTHON_AUTOMATION_SCRIPTS.filter(s => s.category === 'System').slice(0, 4);
    const net = PYTHON_AUTOMATION_SCRIPTS.filter(s => s.category === 'Network').slice(0, 2);
    const fil = PYTHON_AUTOMATION_SCRIPTS.filter(s => s.category === 'Files').slice(0, 2);
    return [...sys, ...net, ...fil].slice(0, 8);
  }, []);

  // BUTLER AI: uses deferredSearch so filter only fires after typing pauses
  const allScripts = useMemo(() => PYTHON_AUTOMATION_SCRIPTS.filter(s => {
    if (category !== 'All' && s.category !== category) return false;
    if (!deferredSearch.trim()) return true;
    const q = deferredSearch.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  }), [category, deferredSearch]);

  const filteredButler = useMemo(() => butlerScripts.filter(s => {
    if (!deferredSearch.trim()) return true;
    const q = deferredSearch.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  }), [butlerScripts, deferredSearch]);

  const favIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);
  const CATS   = useMemo(() => ['All', ...Array.from(new Set(PYTHON_AUTOMATION_SCRIPTS.map(s => s.category)))].slice(0, 14), []);

  const listData = useMemo(() => [
    ...filteredButler.map(s => ({ type: 'butler' as const, data: s, id: 'b-' + s.id })),
    ...allScripts.map(s => ({ type: 'builtin' as const, data: s, id: 'bi-' + s.id })),
  ], [filteredButler, allScripts]);

  const renderScriptItem = useCallback(({ item }: any) => {
    if (item.type === 'butler') {
      const s = item.data as ButlerScript;
      return (
        <AICard
          script={s} isRunning={runningId === item.id}
          onRun={() => run(s.title, s.script, item.id)}
          onDelete={async () => { await deleteButlerScript(s.id); await loadAll(); }}
          onEdit={() => { setEditScript(s); setShowEditor(true); }}
        />
      );
    }
    const s = item.data as AutomationScript;
    return (
      <ScriptCard
        title={s.title} desc={s.description} category={s.category}
        isRunning={runningId === item.id} runCount={runCounts[s.id] ?? 0}
        isFav={favIds.has(s.id)}
        onPress={() => {}}
        onRun={() => run(s.title, s.script, item.id)}
        onFav={async () => {
          haptics.light();
          await toggleFavorite({ id: s.id, title: s.title, description: s.description, scriptCode: s.script, category: s.category });
          setFavorites(await loadFavorites());
        }}
      />
    );
  }, [runningId, runCounts, favIds, run, loadAll]);

  // 2-col library grid data pairs
  const libPairs = useMemo(() => {
    const cats = ALL_CATEGORIES;
    const pairs: (CategoryDef | null)[][] = [];
    for (let i = 0; i < cats.length; i += 2) {
      pairs.push([cats[i], cats[i + 1] ?? null]);
    }
    return pairs;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg || COLOR.bg }}>
      <ExecModal
        visible={exec.visible} name={exec.name} running={exec.running}
        success={exec.success} output={exec.output} error={exec.error}
        ms={exec.ms} lines={exec.lines}
        onClose={() => setExec(p => ({ ...p, visible: false }))}
        onAgain={() => {
          setExec(p => ({ ...p, running: true, output: '', error: '', lines: [] }));
          run(exec.name, exec.code, 'rerun');
        }}
      />
      <EditorModal
        visible={showEditor} editScript={editScript}
        onClose={async () => { setShowEditor(false); setEditScript(null); await loadAll(); }}
        onRun={(name, code) => { setShowEditor(false); run(name, code, 'editor_run'); }}
      />
      <CatModal cat={catModal} isConn={isConn} onClose={() => setCatModal(null)} />
      <TabSwipeOverlay leftRoute="/(tabs)/nexushome" rightRoute="/(tabs)/butler" />

      {/* ── HEADER ── */}
      <ForgeHeader
        safeTop={insets.top}
        isConn={isConn} addr={addr}
        mode={mode} onModeChange={setMode}
        onAdd={() => { setEditScript(null); setShowEditor(true); }}
        accent={accent}
      />

      {/* ── SCRIPTS MODE ── */}
      {mode === 'scripts' && (
        <>
          <SearchBar value={search} onChange={setSearch} count={listData.length} accent={accent} />
          <CategoryChips categories={CATS} selected={category} onSelect={setCategory} />
          {!search && category === 'All' && (
            <FeaturedRow scripts={featured} isConn={isConn} onRun={s => run(s.title, s.script, 'feat-' + s.id)} />
          )}
          <FlatList
            data={listData}
            keyExtractor={item => item.id}
            renderItem={renderScriptItem}
            contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 130, paddingTop: 6 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={12}
            windowSize={8}
            initialNumToRender={10}
            getItemLayout={(_, index) => ({ length: 81, offset: 81 * index, index })}
            ListEmptyComponent={<EmptyState icon="code-off" title="No Scripts Found" sub="Try a different category or clear the search filter" />}
          />
        </>
      )}

      {/* ── LIBRARY MODE ── */}
      {mode === 'library' && (
        <FlatList
          data={libPairs}
          keyExtractor={(_, i) => 'pair-' + i}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 130, paddingTop: 0, gap: 10 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={6}
          windowSize={6}
          ListHeaderComponent={
            <LibraryHero
              total={ALL_CATEGORIES.reduce((s, c) => s + (c.scripts?.length || 0), 0)}
              catCount={ALL_CATEGORIES.length}
              isConn={isConn}
            />
          }
          renderItem={({ item: [left, right], index }) => (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <CatCard cat={left} index={index * 2} onPress={() => setCatModal(left)} />
              {right
                ? <CatCard cat={right} index={index * 2 + 1} onPress={() => setCatModal(right)} />
                : <View style={{ width: CARD_W }} />
              }
            </View>
          )}
        />
      )}

      {/* ── SAFE SCHEDULE MODE ── */}
      {mode === 'schedule' && (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130, paddingTop: 4 }}
        >
          <SafeSchedulePanel isConn={isConn} />
        </ScrollView>
      )}

      {/* ── FAVORITES MODE ── */}
      {mode === 'favorites' && (
        favorites.length === 0 ? (
          <View style={{ flex: 1 }}>
            <EmptyState icon="star-border" title="No Saved Scripts" sub="Tap the star icon on any script to save it here for quick access" />
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={f => f.id}
            contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 130, paddingTop: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: fav }) => (
              <ScriptCard
                title={fav.title} desc={fav.description} category={fav.category}
                isRunning={runningId === fav.id} runCount={0}
                isFav={true}
                onPress={() => {}}
                onRun={() => run(fav.title, fav.scriptCode, fav.id)}
                onFav={async () => { await removeFavorite(fav.id); setFavorites(await loadFavorites()); }}
              />
            )}
          />
        )
      )}

      {/* ── FLOATING AI CHAT ── */}
      <QuickAIWidget isConn={isConn} />
    </View>
  );
}

export default function ScriptsScreen() {
  return (
    <TabErrorBoundary name="Scripts">
      <ScriptsInner />
    </TabErrorBoundary>
  );
}
