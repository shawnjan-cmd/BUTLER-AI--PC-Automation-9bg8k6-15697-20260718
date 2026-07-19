/**
 * BUTLER SCRIPT LIBRARY — Fresh v1.0
 * Clean cyberpunk terminal theme · token-based · crash-proof
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ScrollView, Platform, Alert, ActivityIndicator,
  Animated, Dimensions, FlatList, KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { haptics } from '@/services/haptics';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { CyberPanel } from '@/components/ui/CyberPanel';
import { COLOR, FONT, glow } from '@/constants/tokens';
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

const MONO: any = FONT.mono;
const SW = Dimensions.get('window').width;
const PAD = 14;

// ─── COLORS ──────────────────────────────────────────────────────
const C = {
  bg:     COLOR.bg,
  surf:   COLOR.surf,
  surf2:  COLOR.surf2,
  cyan:   COLOR.cyan,
  green:  COLOR.green,
  amber:  COLOR.amber,
  red:    COLOR.red,
  purple: COLOR.magenta,
  pink:   COLOR.pink,
  yellow: COLOR.yellow,
  teal:   COLOR.teal,
  blue:   COLOR.blue,
  text:   COLOR.text,
  mid:    COLOR.mid,
  dim:    COLOR.dim,
  border: COLOR.border,
};

const CAT_COLORS: Record<string, string> = {
  System: C.cyan, Network: C.green, Files: C.amber, Web: '#4AFF88',
  GUI: C.purple, Data: C.yellow, 'AI Generated': C.pink, Email: '#FF44AA',
  Monitoring: C.red, Scheduling: C.cyan, Setup: C.amber, Text: C.teal,
  All: C.cyan,
};

// ─── EXECUTE ON SERVER ────────────────────────────────────────────
async function executeScript(
  code: string,
  onChunk: (line: string) => void
): Promise<{ output: string; error: string; success: boolean; ms: number }> {
  const ip = serverConnection.getIP();
  const port = serverConnection.getPort();
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
    const raw = (data.output || '').trim();
    const hasErr = raw.toLowerCase().includes('traceback') || raw.toLowerCase().includes('error:');
    return { output: hasErr ? '' : raw, error: hasErr ? raw : (data.error || ''), success: !hasErr && !data.error, ms };
  } catch (e: any) {
    return { output: '', error: e?.name === 'AbortError' ? 'Timeout (35s)' : e?.message || 'Network error', success: false, ms: Date.now() - start };
  }
}

// ─── PULSE DOT ────────────────────────────────────────────────────
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

// ─── EXECUTION MODAL ─────────────────────────────────────────────
function ExecModal({ visible, name, running, success, output, error, ms, lines, onClose, onAgain }: {
  visible: boolean; name: string; running: boolean;
  success: boolean | null; output: string; error: string; ms: number | null;
  lines: string[]; onClose: () => void; onAgain: () => void;
}) {
  const insets = useSafeAreaInsets();
  const sc = running ? C.cyan : success ? C.green : C.red;
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={em.overlay}>
        <View style={em.sheet}>
          <View style={[em.stripe, { backgroundColor: sc }]} />
          <View style={em.hdr}>
            <View style={{ flex: 1 }}>
              <Text style={[em.name, { color: sc }]} numberOfLines={1}>{name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
                {running ? <ActivityIndicator size="small" color={sc} style={{ transform: [{ scale: 0.7 }] }} /> : <PulseDot color={sc} size={6} />}
                <Text style={[em.status, { color: sc }]}>
                  {running ? 'EXECUTING...' : success ? `SUCCESS · ${ms}ms` : `FAILED · ${ms}ms`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={em.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={16} color={C.mid} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {running ? (
              lines.slice(-20).map((l, i) => <Text key={i} style={em.line}>{l}</Text>)
            ) : (
              <>
                {output ? <Text style={[em.out, { color: '#88FF99' }]} selectable>{output}</Text> : null}
                {error  ? <Text style={[em.out, { color: '#FF8888' }]} selectable>{error}</Text>  : null}
                {!output && !error ? <Text style={em.line}>No output returned.</Text> : null}
              </>
            )}
          </ScrollView>
          {!running && (
            <View style={[em.footer, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
              <TouchableOpacity style={[em.runBtn, { backgroundColor: C.cyan }]} onPress={onAgain} activeOpacity={0.85}>
                <MaterialIcons name="replay" size={16} color="#000" />
                <Text style={em.runTxt}>RUN AGAIN</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, textAlign: 'center' }}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: C.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%', overflow: 'hidden' },
  stripe:  { height: 3 },
  hdr:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  name:    { fontFamily: MONO, fontSize: 15, fontWeight: '900' },
  status:  { fontFamily: MONO, fontSize: 9, fontWeight: '700' },
  closeBtn:{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  line:    { fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 17, marginBottom: 2 },
  out:     { fontFamily: MONO, fontSize: 12, lineHeight: 18 },
  footer:  { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  runBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },
  runTxt:  { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

// ─── SCRIPT CARD ─────────────────────────────────────────────────
const ScriptCard = React.memo(function ScriptCard({ title, desc, category, isRunning, runCount, onPress, onRun }: {
  title: string; desc: string; category: string;
  isRunning: boolean; runCount: number;
  onPress: () => void; onRun: () => void;
}) {
  const col = CAT_COLORS[category] || C.cyan;
  const scale = useRef(new Animated.Value(1)).current;
  const handleRun = () => {
    haptics.medium();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 300, friction: 7, useNativeDriver: true }),
    ]).start();
    onRun();
  };
  return (
    <TouchableOpacity onPress={() => { haptics.light(); onPress(); }} activeOpacity={0.88}
      style={[sc2.card, { borderColor: col + '30' }]}>
      <View style={[sc2.bar, { backgroundColor: col }]} />
      <View style={[sc2.iconBox, { borderColor: col + '45', backgroundColor: glow(col, 10) }]}>
        <MaterialIcons name="code" size={18} color={col} />
        {runCount > 0 && (
          <View style={[sc2.badge, { backgroundColor: col }]}>
            <Text style={sc2.badgeTxt}>×{runCount}</Text>
          </View>
        )}
      </View>
      <View style={sc2.body}>
        <Text style={sc2.title} numberOfLines={1}>{title}</Text>
        <Text style={sc2.desc} numberOfLines={1}>{desc}</Text>
        <View style={[sc2.chip, { borderColor: col + '50', backgroundColor: glow(col, 8) }]}>
          <Text style={[sc2.chipTxt, { color: col }]}>{category.toUpperCase()}</Text>
        </View>
      </View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity onPress={e => { (e as any).stopPropagation?.(); handleRun(); }}
          disabled={isRunning}
          style={[sc2.runBtn, { borderColor: col, backgroundColor: isRunning ? glow(col, 15) : glow(col, 20) }]}>
          {isRunning
            ? <ActivityIndicator size="small" color={col} />
            : <MaterialIcons name="play-arrow" size={20} color={col} />}
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
});
const sc2 = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#040A14', borderRadius: 13, borderWidth: 1, marginBottom: 8, overflow: 'hidden', minHeight: 72,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  bar:     { width: 3.5, alignSelf: 'stretch', margin: 3, borderRadius: 2 },
  iconBox: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10, flexShrink: 0, position: 'relative' },
  badge:   { position: 'absolute', top: -5, right: -6, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  badgeTxt:{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: '#000' },
  body:    { flex: 1, paddingVertical: 11, paddingRight: 6, gap: 4 },
  title:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#FFF' },
  desc:    { fontFamily: MONO, fontSize: 10, color: C.mid },
  chip:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  chipTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  runBtn:  { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});

// ─── LIBRARY HEADER (shown above category grid) ─────────────────
function LibraryHeader({ total, catCount, time }: { total: number; catCount: number; time: string }) {
  return (
    <View style={lh.root}>
      {/* top stripe */}
      <View style={{ height: 3, flexDirection: 'row' }}>
        {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <View style={lh.inner}>
        <View style={{ flex: 1 }}>
          <Text style={lh.eyebrow}>
            PYTHON AUTOMATION · {total > 0 ? `${total}+ SCRIPTS` : '250+ SCRIPTS'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="code-brackets" size={20} color={C.cyan} />
            <Text style={lh.title}>SCRIPT LIBRARY</Text>
          </View>
          <View style={lh.pills}>
            <View style={[lh.pill, { borderColor: C.cyan + '55', backgroundColor: glow(C.cyan, 10) }]}>
              <Text style={[lh.pillTxt, { color: C.cyan }]}>{total > 0 ? `${total} SCRIPTS` : '250+ SCRIPTS'}</Text>
            </View>
            <View style={[lh.pill, { borderColor: C.green + '40' }]}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.green }} />
              <Text style={[lh.pillTxt, { color: C.green }]}>LOCAL</Text>
            </View>
            <View style={[lh.pill, { borderColor: C.amber + '40' }]}>
              <MaterialIcons name="lock" size={8} color={C.amber} />
              <Text style={[lh.pillTxt, { color: C.amber }]}>SECURE</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[lh.clockBox, { borderColor: C.cyan + '35', backgroundColor: glow(C.cyan, 6) }]}>
            <Text style={[lh.clockHH, { color: C.cyan }]}>{time.slice(0,2)}</Text>
            <Text style={[lh.clockColon, { color: C.cyan + '70' }]}>:</Text>
            <Text style={[lh.clockMM, { color: C.text }]}>{time.slice(3,5)}</Text>
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: C.mid, letterSpacing: 0.5 }}>LOCAL · SECURE</Text>
        </View>
      </View>
      {/* bottom circuit border */}
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: C.cyan + '25' }} />
        <View style={{ width: 10, backgroundColor: C.cyan }} />
        <View style={{ flex: 4, backgroundColor: C.cyan + '10' }} />
      </View>
      {/* section label */}
      <View style={lh.sectionRow}>
        <MaterialCommunityIcons name="folder-multiple" size={12} color={C.cyan} />
        <Text style={[lh.sectionTxt, { color: C.cyan }]}>{catCount} CATEGORIES</Text>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.cyan + '25', marginLeft: 8 }} />
      </View>
    </View>
  );
}
const lh = StyleSheet.create({
  root:      { backgroundColor: '#020609', marginBottom: 8 },
  inner:     { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 12 },
  eyebrow:   { fontFamily: MONO, fontSize: 7.5, color: C.cyan + '80', letterSpacing: 1.2, marginBottom: 5, fontWeight: '700' },
  title:     { fontFamily: MONO, fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 0.5 },
  pills:     { flexDirection: 'row', gap: 6, marginTop: 9, flexWrap: 'wrap' },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  pillTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  clockBox:  { flexDirection: 'row', alignItems: 'baseline', gap: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  clockHH:   { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: -1 },
  clockColon:{ fontFamily: MONO, fontSize: 18, fontWeight: '900' },
  clockMM:   { fontFamily: MONO, fontSize: 20, fontWeight: '900', letterSpacing: -1 },
  sectionRow:{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingVertical: 10, backgroundColor: '#010407' },
  sectionTxt:{ fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
});

// ─── CATEGORY CARD ────────────────────────────────────────────────
function CatCard({ cat, onPress }: { cat: CategoryDef; onPress: () => void }) {
  const Icon = cat.iconLibrary === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={() => {
        haptics.medium();
        Animated.sequence([
          Animated.timing(scale, { toValue: 0.93, duration: 55, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 320, friction: 7, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      activeOpacity={0.88}
      style={{ width: '50%', padding: 5 }}>
      <Animated.View style={[cc.card, { borderColor: cat.color + '30', transform: [{ scale }] }]}>
        {/* top accent border */}
        <View style={[cc.topBorder, { backgroundColor: cat.color }]} />
        {/* count badge top-right */}
        <View style={[cc.countBadge, { borderColor: cat.color + '70', backgroundColor: glow(cat.color, 14) }]}>
          <Text style={[cc.countTxt, { color: cat.color }]}>{cat.scripts.length}</Text>
        </View>
        {/* icon circle */}
        <View style={[cc.iconWrap, { borderColor: cat.color + '55', backgroundColor: glow(cat.color, 12) }]}>
          <Icon name={cat.icon as any} size={22} color={cat.color} />
        </View>
        <Text style={cc.title} numberOfLines={2}>{cat.title}</Text>
        <Text style={cc.sub} numberOfLines={1}>{cat.subtitle}</Text>
        {/* bottom glow bar */}
        <View style={[cc.bottomGlow, { backgroundColor: cat.color }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  card:       { backgroundColor: '#070E1C', borderRadius: 14, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, position: 'relative', minHeight: 135,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 }, android: { elevation: 5 } }) },
  topBorder:  { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5 },
  bottomGlow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.25 },
  countBadge: { position: 'absolute', top: 9, right: 9, minWidth: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  countTxt:   { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  iconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 11, marginTop: 4 },
  title:      { fontFamily: MONO, fontSize: 12.5, fontWeight: '900', color: '#D0E8F5', letterSpacing: 0.1, marginBottom: 4, lineHeight: 17 },
  sub:        { fontFamily: MONO, fontSize: 9, color: C.mid, lineHeight: 13 },
});

// ─── CATEGORY DETAIL MODAL ────────────────────────────────────────
function CatModal({ cat, isConn, onClose }: { cat: CategoryDef | null; isConn: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  if (!cat) return null;
  const run = async () => {
    if (!selected || !isConn) return;
    haptics.heavy(); setRunning(true); setOutput(''); setLines([]);
    const r = await executeScript(selected.code, l => setLines(p => [...p.slice(-30), l]));
    setOutput(r.output || r.error || ''); setRunning(false);
    haptics[r.success ? 'success' : 'warning']();
  };
  return (
    <Modal visible={!!cat} animationType="slide" statusBarTranslucent onRequestClose={() => { selected ? setSelected(null) : onClose(); }}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={[cdm.hdr, { paddingTop: insets.top + 8, borderBottomColor: cat.color }]}>
          <TouchableOpacity onPress={() => { selected ? setSelected(null) : onClose(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color={cat.color} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[cdm.title, { color: cat.color }]} numberOfLines={1}>{selected ? selected.name : cat.title}</Text>
            <Text style={cdm.sub} numberOfLines={1}>{selected ? selected.desc : cat.subtitle}</Text>
          </View>
          <View style={[cdm.badge, { borderColor: cat.color + '60', backgroundColor: glow(cat.color, 15) }]}>
            <Text style={[cdm.badgeTxt, { color: cat.color }]}>{cat.scripts.length}</Text>
          </View>
        </View>
        {selected ? (
          <View style={{ flex: 1 }}>
            {/* Code viewer */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: PAD }}>
              <View style={cdm.codeBox}>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: cat.color + 'DD', lineHeight: 18 }} selectable>{selected.code}</Text>
              </View>
              {(output || running) ? (
                <View style={[cdm.outBox, { borderColor: (running ? C.cyan : output.includes('Error') ? C.red : C.green) + '55' }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, marginBottom: 5 }}>OUTPUT</Text>
                  {running ? lines.map((l, i) => <Text key={i} style={cdm.outLine}>{l}</Text>) : null}
                  {output ? <Text style={{ fontFamily: MONO, fontSize: 11, color: output.includes('Error') ? '#FF8888' : '#88FF99', lineHeight: 17 }} selectable>{output}</Text> : null}
                </View>
              ) : null}
            </ScrollView>
            <View style={[cdm.footer, { paddingBottom: Math.max(insets.bottom + 10, 16) }]}>
              <TouchableOpacity onPress={run} disabled={running || !isConn}
                style={[cdm.runBtn, { backgroundColor: isConn ? cat.color : C.mid, opacity: running ? 0.7 : 1 }]}>
                {running ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="play-arrow" size={20} color="#000" />}
                <Text style={cdm.runBtnTxt}>{running ? 'RUNNING...' : 'RUN ON MY PC'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: PAD, gap: 8, paddingBottom: 100 }}>
            {cat.scripts.map((s: any, i: number) => (
              <TouchableOpacity key={s.id} onPress={() => { haptics.selection(); setSelected(s); setOutput(''); setLines([]); }}
                style={[cdm.scriptRow, { borderLeftColor: cat.color, borderColor: cat.color + '35' }]}>
                <View style={[cdm.idx, { backgroundColor: glow(cat.color, 15) }]}>
                  <Text style={[cdm.idxTxt, { color: cat.color }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cdm.scriptName} numberOfLines={1}>{s.name}</Text>
                  <Text style={cdm.scriptDesc} numberOfLines={2}>{s.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={cat.color} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
const cdm = StyleSheet.create({
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingBottom: 14, borderBottomWidth: 2 },
  title:     { fontFamily: MONO, fontSize: 18, fontWeight: '900' },
  sub:       { fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 2 },
  badge:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  badgeTxt:  { fontFamily: MONO, fontSize: 15, fontWeight: '900' },
  codeBox:   { backgroundColor: '#030810', borderRadius: 12, padding: PAD, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  outBox:    { borderWidth: 1.5, borderRadius: 10, padding: 12 },
  outLine:   { fontFamily: MONO, fontSize: 10, color: C.mid },
  footer:    { padding: PAD, borderTopWidth: 1, borderTopColor: C.border },
  runBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15 },
  runBtnTxt: { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
  scriptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surf, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 13 },
  idx:       { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  idxTxt:    { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  scriptName:{ fontFamily: MONO, fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  scriptDesc:{ fontFamily: MONO, fontSize: 10, color: C.mid, lineHeight: 14 },
});

// ─── AI SCRIPT CARD ───────────────────────────────────────────────
function AICard({ script, isRunning, onRun, onDelete, onEdit }: {
  script: ButlerScript; isRunning: boolean;
  onRun: () => void; onDelete: () => void; onEdit: () => void;
}) {
  return (
    <View style={[sc2.card, { borderColor: C.amber + '35', marginBottom: 8 }]}>
      <View style={[sc2.bar, { backgroundColor: C.amber }]} />
      <View style={[sc2.iconBox, { borderColor: C.amber + '40', backgroundColor: glow(C.amber, 10) }]}>
        <MaterialIcons name="psychology" size={18} color={C.amber} />
      </View>
      <View style={sc2.body}>
        <Text style={sc2.title} numberOfLines={1}>{script.title}</Text>
        <Text style={sc2.desc} numberOfLines={1}>{script.description}</Text>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={[sc2.chip, { borderColor: C.amber + '50', backgroundColor: glow(C.amber, 8) }]}>
            <Text style={[sc2.chipTxt, { color: C.amber }]}>AI GENERATED</Text>
          </View>
          <TouchableOpacity onPress={() => { haptics.light(); onEdit(); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MaterialIcons name="edit" size={13} color={C.mid + '80'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptics.heavy(); onDelete(); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MaterialIcons name="delete-outline" size={13} color={C.red + '80'} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={e => { (e as any).stopPropagation?.(); haptics.medium(); onRun(); }}
        disabled={isRunning}
        style={[sc2.runBtn, { borderColor: C.amber, backgroundColor: glow(C.amber, 20) }]}>
        {isRunning
          ? <ActivityIndicator size="small" color={C.amber} />
          : <MaterialIcons name="play-arrow" size={20} color={C.amber} />}
      </TouchableOpacity>
    </View>
  );
}

// ─── SCRIPT EDITOR MODAL ─────────────────────────────────────────
function EditorModal({ visible, editScript, onClose, onRun }: {
  visible: boolean; editScript: ButlerScript | null;
  onClose: () => void; onRun: (name: string, code: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [tab, setTab] = useState<'write' | 'ai'>('write');

  useEffect(() => {
    if (visible) {
      setName(editScript?.title || '');
      setCode(editScript?.script || '');
      setTab('write'); setAiResult(''); setAiPrompt('');
    }
  }, [visible, editScript?.id]);

  const save = async () => {
    if (!code.trim()) { Alert.alert('Empty Script', 'Add some Python code first.'); return; }
    if (!name.trim()) { Alert.alert('No Name', 'Give your script a name.'); return; }
    setSaving(true);
    try { await saveButlerScript(code, { title: name, category: 'AI Generated' }); haptics.success(); onClose(); }
    catch (e: any) { Alert.alert('Save Failed', e?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    const ip = serverConnection.getIP(), port = serverConnection.getPort(), token = serverConnection.getToken();
    if (!ip || !port) { Alert.alert('Not Connected', 'Connect your PC first.'); return; }
    setAiLoading(true); setAiResult('');
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 45000);
      const res = await fetch(`http://${ip}:${port}/api/butler/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: `Write a Python script that: ${aiPrompt}. Return ONLY Python code.` }),
        signal: ctrl.signal,
      });
      const d = await res.json();
      const c = (d.content || d.response || d.message || '').replace(/```python\n?/gi, '').replace(/```\n?/g, '').trim();
      if (c) { setAiResult(c); haptics.success(); }
      else Alert.alert('No Result', 'AI returned empty response.');
    } catch (e: any) { Alert.alert('AI Error', e?.message || 'Failed'); }
    finally { setAiLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={[ed.hdr, { paddingTop: Platform.OS === 'ios' ? 52 : 32 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialIcons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ed.title}>{editScript ? 'EDIT ' : 'NEW '}<Text style={{ color: C.cyan }}>SCRIPT</Text></Text>
            <Text style={ed.sub}>Python · executes on your paired PC</Text>
          </View>
          <View style={[ed.pyBadge, { borderColor: C.amber + '55', backgroundColor: glow(C.amber, 8) }]}>
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.amber }}>PY</Text>
          </View>
        </View>
        {/* Tabs */}
        <View style={ed.tabBar}>
          {(['write', 'ai'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[ed.tabBtn, tab === t && { borderBottomWidth: 2.5, borderBottomColor: t === 'write' ? C.cyan : C.green }]}>
              <MaterialIcons name={t === 'write' ? 'code' : 'auto-awesome'} size={13} color={tab === t ? (t === 'write' ? C.cyan : C.green) : C.mid} />
              <Text style={[ed.tabTxt, tab === t && { color: t === 'write' ? C.cyan : C.green }]}>
                {t === 'write' ? 'WRITE' : 'AI GENERATE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: PAD, gap: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            {tab === 'write' ? (
              <>
                <View>
                  <Text style={ed.label}>SCRIPT NAME</Text>
                  <TextInput style={ed.input} value={name} onChangeText={setName}
                    placeholder="e.g. System Snapshot" placeholderTextColor={C.dim}
                    autoCapitalize="words" maxLength={40} />
                </View>
                <View style={ed.codeWrap}>
                  <View style={ed.codeHdr}>
                    {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><View key={i} style={{ width:10,height:10,borderRadius:5,backgroundColor:c }}/>)}
                    <Text style={ed.codeFile}>script.py</Text>
                    <Text style={ed.codeLines}>{code.split('\n').length} lines</Text>
                  </View>
                  <TextInput style={ed.codeInput} value={code} onChangeText={setCode}
                    multiline autoCapitalize="none" autoCorrect={false} spellCheck={false}
                    placeholder={'# Write your Python script here\nimport platform\nprint(platform.system())'}
                    placeholderTextColor={C.dim} textAlignVertical="top" />
                </View>
              </>
            ) : (
              <>
                <View style={[ed.infoBanner, { borderColor: C.green + '30', backgroundColor: glow(C.green, 6) }]}>
                  <MaterialIcons name="info-outline" size={14} color={C.green} />
                  <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, flex: 1, lineHeight: 17 }}>
                    Powered by your local Ollama AI. Requires a connected PC.
                  </Text>
                </View>
                <View>
                  <Text style={ed.label}>DESCRIBE YOUR SCRIPT</Text>
                  <TextInput style={[ed.input, { minHeight: 90, textAlignVertical: 'top' }]}
                    value={aiPrompt} onChangeText={setAiPrompt} multiline
                    placeholder="e.g. monitor CPU usage every 5 seconds and alert if above 85%"
                    placeholderTextColor={C.dim} autoCapitalize="none" />
                </View>
                <TouchableOpacity onPress={askAI} disabled={!aiPrompt.trim() || aiLoading}
                  style={[ed.genBtn, { opacity: (!aiPrompt.trim() || aiLoading) ? 0.4 : 1 }]}>
                  {aiLoading ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="auto-awesome" size={16} color="#000" />}
                  <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' }}>{aiLoading ? 'GENERATING...' : 'GENERATE'}</Text>
                </TouchableOpacity>
                {aiResult ? (
                  <View style={[ed.aiResult, { borderColor: C.green + '40' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.green }}>GENERATED</Text>
                      <TouchableOpacity onPress={() => { setCode(aiResult); setName(aiPrompt.slice(0, 40)); setTab('write'); haptics.success(); }}
                        style={[ed.useBtn, { borderColor: C.cyan, backgroundColor: glow(C.cyan, 10) }]}>
                        <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: C.cyan }}>USE THIS</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      <Text style={{ fontFamily: MONO, fontSize: 11, color: C.green + 'DD', lineHeight: 17 }}>{aiResult}</Text>
                    </ScrollView>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={[ed.footer, { paddingBottom: Math.max(insets.bottom + 6, 14) }]}>
          <TouchableOpacity onPress={save} disabled={saving}
            style={[ed.saveBtn, { backgroundColor: C.amber, opacity: saving ? 0.5 : 1 }]}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="save" size={16} color="#000" />}
            <Text style={ed.saveTxt}>{saving ? 'SAVING...' : editScript ? 'UPDATE' : 'SAVE'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (code.trim()) onRun(name.trim() || 'Custom', code); }} disabled={!code.trim()}
            style={[ed.saveBtn, { backgroundColor: C.cyan, opacity: !code.trim() ? 0.4 : 1 }]}>
            <MaterialIcons name="play-arrow" size={18} color="#000" />
            <Text style={ed.saveTxt}>RUN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const ed = StyleSheet.create({
  hdr:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.surf, borderBottomWidth: 1, borderBottomColor: C.border },
  title:     { fontFamily: MONO, fontSize: 20, fontWeight: '900', color: C.text },
  sub:       { fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 2 },
  pyBadge:   { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  tabBar:    { flexDirection: 'row', backgroundColor: C.surf, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTxt:    { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: C.mid },
  label:     { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.mid, letterSpacing: 1, marginBottom: 6 },
  input:     { backgroundColor: C.surf, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontFamily: MONO, fontSize: 14 },
  codeWrap:  { backgroundColor: C.surf2, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  codeHdr:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  codeFile:  { flex: 1, fontFamily: MONO, fontSize: 10, color: C.mid, textAlign: 'center' },
  codeLines: { fontFamily: MONO, fontSize: 9, color: C.dim },
  codeInput: { padding: 14, fontFamily: MONO, fontSize: 13, color: C.text, minHeight: 260, lineHeight: 20 },
  infoBanner:{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  genBtn:    { backgroundColor: C.green, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  aiResult:  { borderWidth: 1.5, borderRadius: 12, padding: 12, backgroundColor: glow(C.green, 5) },
  useBtn:    { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  footer:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.surf, borderTopWidth: 1, borderTopColor: C.border },
  saveBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
  saveTxt:   { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
});

// ─── FLOATING AI QUICK-CHAT WIDGET ──────────────────────────────
function QuickAIWidget({ isConn }: { isConn: boolean }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const slideA = useRef(new Animated.Value(0)).current;
  const m = useRef(true);

  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);

  const toggle = () => {
    haptics.medium();
    Animated.spring(slideA, {
      toValue: open ? 0 : 1,
      tension: 220, friction: 18,
      useNativeDriver: true,
    }).start();
    setOpen(o => !o);
  };

  const send = async () => {
    if (!msg.trim() || loading) return;
    haptics.heavy(); setLoading(true); setReply('');
    const ip = serverConnection.getIP(), port = serverConnection.getPort(), token = serverConnection.getToken();
    if (!ip || !port) { setReply('Pair your PC from HOME tab to use AI.'); setLoading(false); return; }
    try {
      const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(`http://${ip}:${port}/api/butler/chat`, {
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

  const translateY = slideA.interpolate({ inputRange: [0, 1], outputRange: [180, 0] });
  const opacity    = slideA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });

  return (
    <View style={aiw.container} pointerEvents="box-none">
      {/* expanded panel */}
      {open && (
        <Animated.View style={[aiw.panel, { transform: [{ translateY }], opacity }]}>
          <View style={[aiw.panelHdr, { borderBottomColor: isConn ? C.cyan + '30' : C.red + '20' }]}>
            <View style={[aiw.dot, { backgroundColor: isConn ? C.cyan : C.red }]} />
            <Text style={[aiw.panelTitle, { color: isConn ? C.cyan : C.mid }]}>Butler · {isConn ? 'online' : 'offline'}</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={toggle} style={aiw.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="remove" size={14} color={C.mid} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setOpen(false); setReply(''); setMsg(''); slideA.setValue(0); }} style={[aiw.iconBtn, { marginLeft: 4 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={14} color={C.mid} />
            </TouchableOpacity>
          </View>
          {!isConn ? (
            <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 16 }}>Quick chat. Pair PC for live AI.</Text>
            </View>
          ) : reply ? (
            <ScrollView style={{ maxHeight: 130 }} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: MONO, fontSize: 11.5, color: C.green + 'DD', lineHeight: 18 }}>{reply}</Text>
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid, lineHeight: 16 }}>Ask Butler anything about your PC...</Text>
            </View>
          )}
          <View style={aiw.inputRow}>
            <TextInput
              style={aiw.input}
              value={msg} onChangeText={setMsg}
              placeholder={isConn ? 'Ask...' : 'Pair PC first...'}
              placeholderTextColor={C.dim}
              autoCorrect={false} autoCapitalize="none"
              onSubmitEditing={send} returnKeyType="send"
              editable={isConn}
            />
            <TouchableOpacity onPress={send} disabled={loading || !msg.trim() || !isConn}
              style={[aiw.sendBtn, { backgroundColor: isConn ? C.cyan : C.dim, opacity: (!msg.trim() || loading || !isConn) ? 0.45 : 1 }]}>
              {loading
                ? <ActivityIndicator size="small" color="#000" style={{ transform: [{ scale: 0.7 }] }} />
                : <MaterialIcons name="send" size={14} color="#000" />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      {/* FAB */}
      {!open && (
        <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={[aiw.fab, { backgroundColor: isConn ? C.cyan : '#0A1A2E', borderColor: isConn ? C.cyan : C.mid + '50' }]}>
          <MaterialCommunityIcons name="robot-happy-outline" size={22} color={isConn ? '#000' : C.mid} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const aiw = StyleSheet.create({
  container: { position: 'absolute', bottom: 90, right: 14, zIndex: 999, alignItems: 'flex-end' },
  panel:     { width: Math.min(SW - 28, 320), backgroundColor: '#040C18', borderRadius: 14, borderWidth: 1.5, borderColor: C.cyan + '35', overflow: 'hidden', marginBottom: 10,
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18 }, android: { elevation: 10 } }) },
  panelHdr:  { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  dot:       { width: 7, height: 7, borderRadius: 3.5 },
  panelTitle:{ fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  iconBtn:   { width: 26, height: 26, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 6 },
  input:     { flex: 1, backgroundColor: '#020810', borderRadius: 22, borderWidth: 1, borderColor: C.cyan + '30', color: C.text, fontFamily: MONO, fontSize: 11.5, paddingHorizontal: 14, paddingVertical: 9 },
  sendBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fab:       { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 8 } }) },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function ScriptsInner() {
  const insets = useSafeAreaInsets();
  const { T } = useCosmetic();
  const PR = T.primary || C.cyan;
  const [clockTime, setClockTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  });

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setClockTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const [mode, setMode] = useState<'scripts' | 'library' | 'favorites'>('scripts');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isConn, setIsConn] = useState(false);
  const [addr, setAddr] = useState('');
  const [butlerScripts, setButlerScripts] = useState<ButlerScript[]>([]);
  const [runCounts, setRunCounts] = useState<Record<string, number>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [exec, setExec] = useState<{ visible: boolean; name: string; running: boolean; success: boolean | null; output: string; error: string; ms: number | null; code: string; lines: string[] }>({
    visible: false, name: '', running: false, success: null, output: '', error: '', ms: null, code: '', lines: [],
  });
  const [catModal, setCatModal] = useState<CategoryDef | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editScript, setEditScript] = useState<ButlerScript | null>(null);
  const [favorites, setFavorites] = useState<FavoriteScript[]>([]);
  const connRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAll = useCallback(async () => {
    try {
      await serverConnection.load();
      const c = serverConnection.isConnected();
      setIsConn(c);
      setAddr(c ? `${serverConnection.getIP()}:${serverConnection.getPort()}` : '');
    } catch { setIsConn(false); }
    try { setButlerScripts(await loadButlerScripts()); } catch {}
    try {
      const counts = await executionCounter.load();
      setRunCounts(counts);
    } catch {}
    try {
      const favs = await loadFavorites();
      setFavorites(favs);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadAll();
    const unsub = autoConnectEngine.onEvent(evt => {
      if (evt.status === 'connected' && evt.ip) {
        setIsConn(true); setAddr(`${evt.ip}:${evt.port}`);
      } else if (evt.status === 'idle') {
        setIsConn(false); setAddr('');
      }
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
    setExec(p => ({ ...p, running: false, success: result.success, output: result.output, error: result.error, ms: result.ms, lines: p.lines }));
    haptics[result.success ? 'success' : 'warning']();
    try {
      await executionCounter.increment(id);
      const counts = await executionCounter.load();
      setRunCounts(counts);
    } catch {}
    try {
      await executionHistory.addEntry({ scriptId: id, scriptName, category: 'Custom', success: result.success, ms: result.ms ?? 0, timestamp: new Date().toISOString() });
    } catch {}
  }, [isConn]);

  // Filtered scripts
  const allScripts = useMemo(() => PYTHON_AUTOMATION_SCRIPTS.filter(s => {
    if (category !== 'All' && s.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  }), [category, search]);

  const filteredButler = useMemo(() => butlerScripts.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  }), [butlerScripts, search]);

  const CATS = ['All', 'System', 'Network', 'Files', 'Web', 'GUI', 'Data', 'AI Generated', 'Email', 'Monitoring', 'Scheduling', 'Setup', 'Text'];
  const total = allScripts.length + filteredButler.length;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg || C.bg }}>
      <ExecModal
        visible={exec.visible} name={exec.name} running={exec.running}
        success={exec.success} output={exec.output} error={exec.error}
        ms={exec.ms} lines={exec.lines}
        onClose={() => setExec(p => ({ ...p, visible: false }))}
        onAgain={() => { setExec(p => ({ ...p, running: true, output: '', error: '', lines: [] })); run(exec.name, exec.code, 'rerun'); }}
      />
      <EditorModal
        visible={showEditor}
        editScript={editScript}
        onClose={async () => { setShowEditor(false); setEditScript(null); await loadAll(); }}
        onRun={(name, code) => { setShowEditor(false); run(name, code, 'editor_run'); }}
      />
      <CatModal cat={catModal} isConn={isConn} onClose={() => setCatModal(null)} />
      <TabSwipeOverlay leftRoute="/(tabs)/nexushome" rightRoute="/(tabs)/butler" />

      {/* ── PAGE HEADER ── */}
      <View style={[hdr.root, { paddingTop: insets.top }]}>
        {/* 5-color stripe */}
        <View style={{ height: 3, flexDirection: 'row' }}>
          {COLOR.stripe5.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        <View style={hdr.row}>
          <View style={[hdr.iconBox, { borderColor: C.cyan + '50', backgroundColor: glow(C.cyan, 8) }]}>
            <MaterialCommunityIcons name="code-braces-box" size={18} color={C.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={hdr.brand}>
              <Text style={{ color: C.cyan }}>{'{'}</Text>
              <Text style={{ color: C.text }}>SCRIPT</Text>
              <Text style={{ color: C.green }}>_LIB</Text>
              <Text style={{ color: C.cyan }}>{'}'}</Text>
            </Text>
            <Text style={hdr.sub}>
              <Text style={{ color: C.green + '55' }}>{'# '}</Text>
              <Text style={{ color: C.mid }}>python · bash · ai writer · chain runner</Text>
            </Text>
          </View>
          {/* Connection status */}
          <View style={[hdr.connChip, { borderColor: (isConn ? C.green : C.red) + '55', backgroundColor: (isConn ? C.green : C.red) + '0A' }]}>
            <PulseDot color={isConn ? C.green : C.red} size={5} />
            <Text style={[hdr.connTxt, { color: isConn ? C.green : C.red }]} numberOfLines={1}>
              {isConn ? (addr || 'ONLINE') : 'OFFLINE'}
            </Text>
          </View>
        </View>
        {/* Tags row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: PAD, paddingTop: 5, paddingBottom: 9 }}>
          {[{ lbl: 'PYTHON', col: C.purple }, { lbl: '250+ SCRIPTS', col: C.cyan }, { lbl: 'AI WRITER', col: C.green }, { lbl: 'SAFETY SCAN', col: C.amber }].map(b => (
            <View key={b.lbl} style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderColor: b.col + '50', backgroundColor: glow(b.col, 7) }}>
              <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: b.col, letterSpacing: 0.5 }}>{b.lbl}</Text>
            </View>
          ))}
        </View>
        {/* Circuit border */}
        <View style={{ height: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: C.cyan + '30' }} />
          <View style={{ width: 10, backgroundColor: C.cyan }} />
          <View style={{ flex: 3, backgroundColor: C.cyan + '14' }} />
        </View>
      </View>

      {/* ── MODE TABS ── */}
      <View style={[tb.wrap, { borderBottomColor: PR + '20' }]}>
        <View style={tb.tabs}>
          {([['scripts','code','SCRIPTS'],['library','local-library','LIBRARY'],['favorites','star','FAVORITES']] as const).map(([m, icon, lbl]) => {
            const active = mode === m;
            return (
              <TouchableOpacity key={m} onPress={() => { haptics.selection(); setMode(m as any); }} activeOpacity={0.8}
                style={[tb.tab, active && { borderBottomWidth: 2.5, borderBottomColor: PR, backgroundColor: glow(PR, 8) }]}>
                <MaterialIcons name={icon as any} size={12} color={active ? PR : C.mid} />
                <Text style={[tb.tabTxt, active && { color: PR, fontWeight: '900' }]}>{lbl}</Text>
                {active && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: PR }} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={() => { haptics.medium(); setEditScript(null); setShowEditor(true); }}
          style={[tb.addBtn, { backgroundColor: PR }]}>
          <MaterialIcons name="add" size={16} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ── SEARCH ── */}
      {mode !== 'favorites' && (
        <View style={[sr.wrap, { borderColor: PR + '40', backgroundColor: C.surf2 }]}>
          <MaterialIcons name="search" size={16} color={search ? PR : C.dim} />
          <TextInput style={sr.input} value={search} onChangeText={setSearch}
            placeholder="Search scripts, tags, categories..." placeholderTextColor={C.dim}
            autoCapitalize="none" autoCorrect={false} />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={14} color={C.mid} />
            </TouchableOpacity>
          ) : <Text style={{ fontFamily: MONO, fontSize: 8, color: C.dim }}>{total}</Text>}
        </View>
      )}

      {/* ── SCRIPTS MODE ── */}
      {mode === 'scripts' && (
        <>
          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: PAD, paddingVertical: 8, gap: 6 }}>
            {CATS.map(cat => {
              const active = cat === category;
              const col = CAT_COLORS[cat] || C.cyan;
              return (
                <TouchableOpacity key={cat} onPress={() => { haptics.selection(); setCategory(cat); }} activeOpacity={0.8}
                  style={[cf.chip, active && { borderColor: col, backgroundColor: glow(col, 15) }]}>
                  <Text style={[cf.txt, active && { color: col, fontWeight: '900' }]}>{cat.toUpperCase()}</Text>
                  {active && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: col }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <FlatList
            data={[
              ...filteredButler.map(s => ({ type: 'butler' as const, data: s, id: 'b-' + s.id })),
              ...allScripts.map(s => ({ type: 'builtin' as const, data: s, id: 'bi-' + s.id })),
            ]}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 120, paddingTop: 4 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={li.empty}>
                <MaterialIcons name="code-off" size={44} color={C.dim} />
                <Text style={li.emptyTxt}>No Scripts Found</Text>
                <Text style={li.emptySub}>Try a different category or search term</Text>
              </View>
            }
            renderItem={({ item }) => {
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
                  onPress={() => {}} onRun={() => run(s.title, s.script, item.id)}
                />
              );
            }}
          />
        </>
      )}

      {/* ── LIBRARY MODE ── */}
      {mode === 'library' && (
        <FlatList
          data={ALL_CATEGORIES}
          keyExtractor={c => c.id}
          numColumns={2}
          key="library-2col"
          contentContainerStyle={{ paddingHorizontal: PAD - 5, paddingBottom: 140, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <LibraryHeader
              total={ALL_CATEGORIES.reduce((s, c) => s + (c.scripts?.length || 0), 0)}
              catCount={ALL_CATEGORIES.length}
              time={clockTime}
            />
          }
          renderItem={({ item }) => <CatCard cat={item} onPress={() => setCatModal(item)} />}
        />
      )}

      {/* ── FLOATING AI WIDGET ── */}
      <QuickAIWidget isConn={isConn} />

      {/* ── FAVORITES MODE ── */}
      {mode === 'favorites' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 120, paddingTop: 12 }}>
          {favorites.length === 0 ? (
            <View style={li.empty}>
              <MaterialIcons name="star-border" size={44} color={C.dim} />
              <Text style={li.emptyTxt}>No Favorites Yet</Text>
              <Text style={li.emptySub}>Tap the star on any script to save it here</Text>
            </View>
          ) : favorites.map(fav => (
            <View key={fav.id} style={[sc2.card, { borderColor: C.yellow + '35', marginBottom: 8 }]}>
              <View style={[sc2.bar, { backgroundColor: C.yellow }]} />
              <View style={[sc2.iconBox, { borderColor: C.yellow + '40', backgroundColor: glow(C.yellow, 10) }]}>
                <MaterialIcons name="star" size={18} color={C.yellow} />
              </View>
              <View style={sc2.body}>
                <Text style={sc2.title} numberOfLines={1}>{fav.title}</Text>
                <Text style={sc2.desc} numberOfLines={1}>{fav.description}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={[sc2.chip, { borderColor: C.yellow + '50', backgroundColor: glow(C.yellow, 8) }]}>
                    <Text style={[sc2.chipTxt, { color: C.yellow }]}>{fav.category.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={async () => { await removeFavorite(fav.id); await loadAll(); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialIcons name="delete-outline" size={13} color={C.red + '80'} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => run(fav.title, fav.scriptCode, fav.id)}
                disabled={runningId === fav.id || !isConn}
                style={[sc2.runBtn, { borderColor: C.yellow, backgroundColor: glow(C.yellow, 20), opacity: !isConn ? 0.4 : 1 }]}>
                {runningId === fav.id
                  ? <ActivityIndicator size="small" color={C.yellow} />
                  : <MaterialIcons name="play-arrow" size={20} color={C.yellow} />}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// Styles
const hdr = StyleSheet.create({
  root:    { backgroundColor: '#020609', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 }, android: { elevation: 6 } }) },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 5 },
  iconBox: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brand:   { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 8.5, lineHeight: 13, marginTop: 2 },
  connChip:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, maxWidth: 130 },
  connTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', flexShrink: 1 },
});
const tb = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 6, backgroundColor: '#040810', borderBottomWidth: 1 },
  tabs:    { flex: 1, flexDirection: 'row', gap: 4 },
  tab:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTxt:  { fontFamily: MONO, fontSize: 10, fontWeight: '600', color: C.mid },
  addBtn:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
const sr = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: PAD, marginVertical: 8, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 13, paddingVertical: 10 },
  input: { flex: 1, fontFamily: MONO, fontSize: 12, color: C.text },
});
const cf = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, borderColor: C.border },
  txt:   { fontFamily: MONO, fontSize: 9, fontWeight: '600', color: C.mid },
});
const li = StyleSheet.create({
  empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { fontFamily: MONO, fontSize: 15, fontWeight: '700', color: C.mid },
  emptySub: { fontFamily: MONO, fontSize: 11, color: C.dim, textAlign: 'center', paddingHorizontal: 24 },
});

export default function ScriptsScreen() {
  return (
    <TabErrorBoundary name="Scripts">
      <ScriptsInner />
    </TabErrorBoundary>
  );
}
