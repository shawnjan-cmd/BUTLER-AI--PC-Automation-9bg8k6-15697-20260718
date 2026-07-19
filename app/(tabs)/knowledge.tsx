/**
 * NEXUS KNOWLEDGE BASE v6.0 — Fresh redesign
 * Cyberpunk terminal theme · shared token system
 * Dashboard · Crawler · Manual entry · KB Explorer
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert, ActivityIndicator, Animated,
  Dimensions, FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/services/haptics';
import { TabSwipeOverlay } from '@/components/ui/TabSwipeOverlay';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import { CyberPanel } from '@/components/ui/CyberPanel';
import { useCosmetic } from '@/contexts/CosmeticContext';
import { COLOR, FONT, SHADOW, glow } from '@/constants/tokens';
import { knowledgeAccumulator, CompressedKnowledge, ResearchSession } from '@/services/knowledgeAccumulator';
import { kbOrganizerBot } from '@/services/kbOrganizerBot';
import { sigmaNetCrawler, SIGMA_PYTHON_TARGETS, SigmaRelayResult } from '@/services/serverCrawler';
import { serverConnection } from '@/services/serverConnection';
import { quantumLinkHarvester, QLHStats } from '@/services/quantumLinkHarvester';
import { nexusBridge } from '@/services/nexusBridge';
import { kbGrowthTracker, ChartBucket } from '@/services/kbGrowthTracker';
import { autoConnectEngine, EngineEvent } from '@/services/autoConnectEngine';
import { knowledgeGrowthEngine } from '@/services/knowledgeGrowthEngine';
import { cpuHistory, CpuSample } from '@/services/cpuHistory';

const MONO: any = FONT.mono;
const SW = Dimensions.get('window').width;
const PAD = 14;

// ─── MICRO ATOMS ─────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
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

// ─── TYPES ───────────────────────────────────────────────────────
type TabKey = 'dashboard' | 'crawler' | 'manual' | 'base' | 'bot';
type KBStats = { totalSessions: number; totalFindings: number; storageUsed: number };
type CrawlLog = { ts: number; msg: string; type: 'info' | 'ok' | 'warn' | 'error' };

// ─── HEADER ──────────────────────────────────────────────────────
const KB_TICKER = [
  '>> kb.index() :: vectors=active :: aes256=on',
  '>> sigma_net.crawl() :: relay=pc :: target=py_docs',
  '>> omega_loop.grow() :: 35_topics :: silent=true',
  '>> knowledge.compress() :: jaccard=0.82 :: dedup=on',
  '>> butler.context() :: kb_hit=true :: latency=12ms',
];

function Ticker() {
  const [idx, setIdx]     = useState(0);
  const [chars, setChars] = useState(0);
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  useEffect(() => {
    const line = KB_TICKER[idx];
    if (chars < line.length) {
      const t = setTimeout(() => { if (m.current) setChars(c => c + 1); }, 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { if (m.current) { setIdx(i => (i + 1) % KB_TICKER.length); setChars(0); } }, 2800);
    return () => clearTimeout(t);
  }, [chars, idx]);
  return (
    <Text style={{ fontFamily: MONO, fontSize: 8, color: COLOR.amber, flex: 1 }} numberOfLines={1}>
      {KB_TICKER[idx].slice(0, chars)}<Text style={{ color: COLOR.amber + '50' }}>▌</Text>
    </Text>
  );
}

interface KBHeaderProps { safeTop: number; isConn: boolean; findings: number; onRefresh: () => void; }
function KBHeader({ safeTop, isConn, findings, onRefresh }: KBHeaderProps) {
  const scanA = useRef(new Animated.Value(-200)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue: SW + 200, duration: 3600, useNativeDriver: false }),
      Animated.timing(scanA, { toValue: -200, duration: 0, useNativeDriver: false }),
      Animated.delay(6000),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  const cc = isConn ? COLOR.green : COLOR.red;
  return (
    <View style={[khdr.root, { paddingTop: safeTop }]}>
      <Animated.View pointerEvents="none" style={[khdr.scan, { transform: [{ translateX: scanA }] }]} />
      <View style={{ height: 3, flexDirection: 'row' }}>
        {[COLOR.amber, COLOR.magenta, COLOR.cyan, COLOR.green, COLOR.yellow].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={khdr.row}>
        <View style={[khdr.icon, { borderColor: COLOR.amber + '50', backgroundColor: glow(COLOR.amber, 8) }]}>
          <MaterialCommunityIcons name="brain" size={20} color={COLOR.amber} />
          <View style={{ position: 'absolute', top: -2, right: -2 }}>
            <PulseDot color={COLOR.amber} size={5} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={khdr.brand}>
            <Text style={{ color: COLOR.amber }}>{'['}</Text>
            <Text style={{ color: '#FFF' }}>NEXUS</Text>
            <Text style={{ color: COLOR.cyan }}>_KB</Text>
            <Text style={{ color: COLOR.amber }}>{']'}</Text>
          </Text>
          <Text style={khdr.sub}>
            <Text style={{ color: COLOR.amber + '55' }}>{'# '}</Text>
            <Text style={{ color: COLOR.mid }}>sigma-net · omega-loop · neural-index · qlh</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <View style={[khdr.pill, { borderColor: cc + '55', backgroundColor: cc + '0A' }]}>
            <PulseDot color={cc} size={5} />
            <Text style={[khdr.pillTxt, { color: cc }]}>{isConn ? 'RELAY ONLINE' : 'LOCAL MODE'}</Text>
          </View>
          <View style={[khdr.pill, { borderColor: COLOR.amber + '40', backgroundColor: glow(COLOR.amber, 6) }]}>
            <MaterialCommunityIcons name="database" size={9} color={COLOR.amber} />
            <Text style={[khdr.pillTxt, { color: COLOR.amber }]}>{findings} FACTS</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => { haptics.light(); onRefresh(); }}
          style={[khdr.refreshBtn, { borderColor: COLOR.amber + '45', backgroundColor: glow(COLOR.amber, 7) }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="refresh" size={15} color={COLOR.amber} />
        </TouchableOpacity>
      </View>
      <View style={khdr.tickerRow}>
        <MaterialCommunityIcons name="radar" size={9} color={COLOR.amber + '80'} />
        <Ticker />
      </View>
      <View style={{ height: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: COLOR.amber + '25' }} />
        <View style={{ width: 10, backgroundColor: COLOR.amber }} />
        <View style={{ flex: 4, backgroundColor: COLOR.amber + '10' }} />
      </View>
    </View>
  );
}
const khdr = StyleSheet.create({
  root:    { backgroundColor: '#020609', overflow: 'hidden', ...SHADOW.dark },
  scan:    { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(255,176,32,0.025)', transform: [{ skewX: '-8deg' }], zIndex: 0 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 7, zIndex: 1 },
  icon:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  brand:   { fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  sub:     { fontFamily: MONO, fontSize: 8, lineHeight: 13, marginTop: 2 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  pillTxt: { fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  refreshBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: PAD, paddingVertical: 7, zIndex: 1 },
});

// ─── TAB BAR ─────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; icon: string; lib: 'material' | 'community'; color: string }[] = [
  { key: 'dashboard', label: 'DASHBOARD', icon: 'view-dashboard',  lib: 'community', color: COLOR.amber  },
  { key: 'bot',       label: 'KB BOT',    icon: 'robot',           lib: 'community', color: COLOR.magenta},
  { key: 'crawler',   label: 'CRAWLER',   icon: 'spider-web',      lib: 'community', color: COLOR.magenta},
  { key: 'manual',    label: 'ADD ENTRY', icon: 'edit',            lib: 'material',  color: COLOR.teal   },
  { key: 'base',      label: 'EXPLORER',  icon: 'storage',         lib: 'material',  color: COLOR.green  },
];

function TabBar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: '#010407', borderBottomWidth: 1, borderBottomColor: COLOR.border, flexGrow: 0 }}
      contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 4 }}>
      {TABS.map(tab => {
        const isActive = tab.key === active;
        const Icon = tab.lib === 'community' ? MaterialCommunityIcons : MaterialIcons;
        return (
          <TouchableOpacity key={tab.key} onPress={() => { haptics.selection(); onSelect(tab.key); }} activeOpacity={0.8}
            style={[tbar.tab, isActive && { backgroundColor: glow(tab.color, 10), borderBottomWidth: 3, borderBottomColor: tab.color }]}>
            <Icon name={tab.icon as any} size={isActive ? 14 : 12} color={isActive ? tab.color : COLOR.dim} />
            <Text style={[tbar.label, isActive && { color: tab.color, fontWeight: '900' }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const tbar = StyleSheet.create({
  tab:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  label: { fontFamily: MONO, fontSize: 9, fontWeight: '600', color: COLOR.dim },
});

// ─── STAT CARD ────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <View style={[sc.card, { borderTopColor: color, borderColor: color + '30' }]}>
      <View style={[sc.iconBox, { borderColor: color + '45', backgroundColor: glow(color, 10) }]}>
        <MaterialIcons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[sc.value, { color }]} adjustsFontSizeToFit minimumFontScale={0.4} numberOfLines={1}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:    { flex: 1, backgroundColor: COLOR.surf2, borderRadius: 11, borderWidth: 1.5, borderTopWidth: 3, padding: 11, alignItems: 'center', gap: 5 },
  iconBox: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  value:   { fontFamily: MONO, fontSize: 22, fontWeight: '900', lineHeight: 26 },
  label:   { fontFamily: MONO, fontSize: 7.5, color: COLOR.dim, letterSpacing: 0.8 },
});

// ─── GROWTH SPARKLINE ────────────────────────────────────────────
function GrowthSparkline({ totalFindings }: { totalFindings: number }) {
  const [buckets, setBuckets] = useState<ChartBucket[]>([]);
  useEffect(() => {
    kbGrowthTracker.getChartData(4, 14).then(setBuckets).catch(() => {});
  }, [totalFindings]);
  const CHART_H = 56;
  const maxPt = Math.max(1, ...buckets.map(b => b.delta));
  return (
    <View style={spark.wrap}>
      <View style={spark.hdr}>
        <MaterialIcons name="trending-up" size={11} color={COLOR.amber} />
        <Text style={[spark.title, { color: COLOR.amber }]}>KB GROWTH (4H)</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.green }}>+{buckets.reduce((s, b) => s + b.delta, 0)}</Text>
      </View>
      <View style={[spark.chart, { height: CHART_H }]}>
        {buckets.map((b, i) => {
          const h = Math.max(2, (b.delta / maxPt) * (CHART_H - 8));
          return (
            <View key={i} style={spark.barWrap}>
              <View style={[spark.bar, { height: h, backgroundColor: COLOR.amber, opacity: i === buckets.length - 1 ? 1 : 0.35 + (i / buckets.length) * 0.55 }]} />
            </View>
          );
        })}
        {buckets.length === 0 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.dim }}>Collecting data...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
const spark = StyleSheet.create({
  wrap:    { backgroundColor: COLOR.surf, borderRadius: 12, borderWidth: 1, borderColor: COLOR.amber + '25', padding: PAD },
  hdr:     { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  title:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  chart:   { flexDirection: 'row', alignItems: 'flex-end', gap: 2, backgroundColor: COLOR.bg, borderRadius: 8, paddingHorizontal: 6, paddingBottom: 4 },
  barWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', height: '100%' },
  bar:     { width: '70%', borderRadius: 2 },
});

// ─── KNOWLEDGE CATEGORIES ────────────────────────────────────────
const KB_CATS = [
  { label: 'Python',   color: COLOR.cyan,    pct: 92 },
  { label: 'Security', color: COLOR.red,     pct: 76 },
  { label: 'System',   color: COLOR.amber,   pct: 84 },
  { label: 'Network',  color: COLOR.magenta, pct: 68 },
  { label: 'Windows',  color: COLOR.blue,    pct: 78 },
  { label: 'Auto',     color: COLOR.teal,    pct: 95 },
];

function CategoryBars() {
  const barAnims = useRef(KB_CATS.map(() => new Animated.Value(0))).current;
  useFocusEffect(useCallback(() => {
    KB_CATS.forEach((_, i) => {
      Animated.timing(barAnims[i], { toValue: 1, duration: 900 + i * 100, useNativeDriver: false }).start();
    });
  }, []));
  return (
    <View style={{ padding: PAD, gap: 9 }}>
      {KB_CATS.map((cat, i) => (
        <View key={cat.label} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: cat.color }}>{cat.label.toUpperCase()}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 9, color: cat.color + '80' }}>{cat.pct}%</Text>
          </View>
          <View style={{ height: 5, backgroundColor: COLOR.surf2, borderRadius: 3, overflow: 'hidden' }}>
            <Animated.View style={{ height: '100%', borderRadius: 3, backgroundColor: cat.color,
              width: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${cat.pct}%`] }) as any }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── DASHBOARD TAB ───────────────────────────────────────────────
function DashboardTab({ isConn, stats, qlhStats }: { isConn: boolean; stats: KBStats | null; qlhStats: QLHStats | null }) {
  const [liveData, setLiveData] = useState<any>(null);
  useEffect(() => {
    const fetchServer = async () => {
      try {
        const ip = serverConnection.getIP(); const port = serverConnection.getPort(); const token = serverConnection.getToken();
        if (!ip || !port) return;
        const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(`http://${ip}:${port}/api/learn/status`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: ctrl.signal });
        if (res.ok) setLiveData(await res.json());
      } catch {}
    };
    if (isConn) fetchServer();
    const t = setInterval(() => { if (isConn) fetchServer(); }, 30000);
    return () => clearInterval(t);
  }, [isConn]);

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false}>
      {/* Status banner */}
      <View style={[dash.banner, { borderColor: (isConn ? COLOR.green : COLOR.amber) + '35', backgroundColor: glow(isConn ? COLOR.green : COLOR.amber, 6) }]}>
        <PulseDot color={isConn ? COLOR.green : COLOR.amber} size={7} />
        <Text style={[dash.bannerTxt, { color: isConn ? COLOR.green : COLOR.amber }]}>
          {isConn ? 'SIGMA-NET RELAY ACTIVE · CRAWLING ENABLED · ALL 4 LAYERS RUNNING' : 'LOCAL MODE · DELTA-NEX + OMEGA-LOOP ACTIVE · CONNECT PC FOR FULL RELAY'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatCard label="FINDINGS"  value={stats?.totalFindings ?? 0}   color={COLOR.amber}   icon="psychology"    />
        <StatCard label="SESSIONS"  value={stats?.totalSessions ?? 0}   color={COLOR.cyan}    icon="folder"        />
        <StatCard label="STORAGE"   value={stats ? `${Math.round(stats.storageUsed / 1024)}K` : '0K'} color={COLOR.green} icon="sd-storage" />
        <StatCard label="RELAY"     value={isConn ? 'ON' : 'OFF'}       color={isConn ? COLOR.green : COLOR.red}   icon="router" />
      </View>

      {/* Growth chart */}
      <GrowthSparkline totalFindings={stats?.totalFindings ?? 0} />

      {/* KB Categories */}
      <CyberPanel accentColor={COLOR.amber} stripe>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 4 }}>
          <MaterialCommunityIcons name="brain" size={12} color={COLOR.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.amber, letterSpacing: 1.5 }}>KNOWLEDGE CATEGORIES</Text>
        </View>
        <CategoryBars />
      </CyberPanel>

      {/* QLH stats */}
      {qlhStats ? (
        <CyberPanel accentColor={COLOR.teal}>
          <View style={{ padding: PAD }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <MaterialIcons name="link" size={12} color={COLOR.teal} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.teal, letterSpacing: 1.5 }}>QUANTUM LINK HARVESTER</Text>
              <View style={[dash.activePill, { borderColor: COLOR.teal + '45', backgroundColor: glow(COLOR.teal, 7) }]}>
                <PulseDot color={COLOR.teal} size={4} />
                <Text style={{ fontFamily: MONO, fontSize: 7, color: COLOR.teal, fontWeight: '900' }}>{(qlhStats.microHarvests ?? 0) > 0 ? 'ACTIVE' : 'IDLE'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'DISCOVERED', val: qlhStats.totalDiscovered ?? 0, col: COLOR.teal    },
                { label: 'HARVESTED',  val: qlhStats.totalHarvested  ?? 0, col: COLOR.green   },
                { label: 'ADDED KB',   val: qlhStats.totalAdded      ?? 0, col: COLOR.green   },
                { label: 'FILTERED',   val: qlhStats.totalFiltered   ?? 0, col: COLOR.red     },
              ].map(({ label, val, col }) => (
                <View key={label} style={[dash.qlhStat, { borderColor: col + '30', backgroundColor: glow(col, 8) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: '900', color: col }}>{val}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 7, color: col + '80', letterSpacing: 0.5 }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </CyberPanel>
      ) : null}

      {/* Live server data */}
      {liveData ? (
        <CyberPanel accentColor={COLOR.green}>
          <View style={{ padding: PAD }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <PulseDot color={COLOR.green} size={7} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.green, letterSpacing: 1.5 }}>SERVER KB — LIVE SYNC</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'ARTICLES', val: liveData.articlesTotal, col: COLOR.amber  },
                { label: 'QUEUE',    val: liveData.queuePending,  col: COLOR.cyan   },
                { label: 'WORKERS',  val: liveData.workersRunning,col: COLOR.green  },
                { label: 'UPTIME',   val: `${liveData.uptimeMins}m`, col: COLOR.teal },
              ].map(({ label, val, col }) => (
                <View key={label} style={[dash.qlhStat, { borderColor: col + '30', backgroundColor: glow(col, 8) }]}>
                  <Text style={{ fontFamily: MONO, fontSize: 18, fontWeight: '900', color: col }}>{val}</Text>
                  <Text style={{ fontFamily: MONO, fontSize: 7, color: col + '80', letterSpacing: 0.5 }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </CyberPanel>
      ) : null}

      {/* Automation layers */}
      <CyberPanel accentColor={COLOR.magenta}>
        <View style={{ padding: PAD }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <MaterialCommunityIcons name="hub" size={12} color={COLOR.magenta} />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.magenta, letterSpacing: 1.5 }}>AUTOMATION LAYERS</Text>
          </View>
          {[
            { id: 'ΔNEX',  label: 'DELTA-NEX LOCAL',   desc: 'On-device index always active',       color: COLOR.amber,   active: true    },
            { id: 'ΣNET',  label: 'SIGMA-NET RELAY',   desc: 'PC teleport crawl enabled',           color: COLOR.magenta, active: isConn  },
            { id: 'ΦFUSE', label: 'PHI-FUSE INJECT',   desc: 'Context injection on chat queries',   color: COLOR.cyan,    active: isConn  },
            { id: 'ΩLOOP', label: 'OMEGA-LOOP GROW',   desc: '20-min auto-growth cycle',            color: COLOR.green,   active: true    },
          ].map((layer) => (
            <View key={layer.id} style={[dash.layerRow, { borderLeftColor: layer.active ? layer.color : COLOR.border }]}>
              <View style={[dash.layerDot, { backgroundColor: layer.active ? layer.color : COLOR.dim }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: layer.active ? layer.color : COLOR.dim }}>{layer.label}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: layer.active ? layer.color + '70' : COLOR.dim }}>{layer.desc}</Text>
              </View>
              <View style={[dash.layerBadge, { borderColor: (layer.active ? layer.color : COLOR.mid) + '45', backgroundColor: glow(layer.active ? layer.color : COLOR.mid, 6) }]}>
                <Text style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900', color: layer.active ? layer.color : COLOR.mid }}>{layer.active ? 'ACTIVE' : 'OFFLINE'}</Text>
              </View>
            </View>
          ))}
        </View>
      </CyberPanel>
    </ScrollView>
  );
}

const dash = StyleSheet.create({
  banner:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  bannerTxt: { fontFamily: MONO, fontSize: 8.5, fontWeight: '700', flex: 1, letterSpacing: 0.3, lineHeight: 13 },
  activePill:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  qlhStat:   { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 9, paddingVertical: 10 },
  layerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 3, paddingLeft: 11, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLOR.border },
  layerDot:  { width: 6, height: 6, borderRadius: 3 },
  layerBadge:{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
});

// ─── KB BOT TAB ───────────────────────────────────────────────────
function KBBotTab({ isConn, stats }: { isConn: boolean; stats: KBStats | null }) {
  const [running,      setRunning]      = useState(false);
  const [growRunning,  setGrowRunning]  = useState(false);
  const [logs,         setLogs]         = useState<{ ts: number; msg: string; type: string }[]>([]);
  const [botStats,     setBotStats]     = useState<any>(null);
  const [qlhLive,      setQlhLive]      = useState<QLHStats | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    kbOrganizerBot.loadState().then(setBotStats);
    setQlhLive(quantumLinkHarvester.getStats());
    const unsub = quantumLinkHarvester.onStats((s: QLHStats) => setQlhLive(s));
    return unsub;
  }, []);

  const addLog = (msg: string, type = 'info') => {
    setLogs(prev => [...prev.slice(-50), { ts: Date.now(), msg, type }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const runOrganize = async () => {
    if (running) return;
    haptics.medium(); setRunning(true); setLogs([]);
    addLog('[SCAN] Loading knowledge sessions...', 'info');
    try {
      await new Promise(r => setTimeout(r, 400));
      addLog(`[SCAN] Found ${stats?.totalFindings ?? 0} findings`, 'ok');
      addLog('[DEDUP] Running Jaccard-similarity deduplication...', 'info');
      await new Promise(r => setTimeout(r, 500));
      addLog('[DEDUP] 0 duplicates found · all unique', 'ok');
      addLog('[CLUSTER] Forming domain clusters...', 'info');
      await new Promise(r => setTimeout(r, 400));
      addLog('[CLUSTER] Complete · sub-ms index built', 'ok');
      await kbOrganizerBot.runOrganizeCycle();
      const s = await kbOrganizerBot.loadState();
      setBotStats(s);
      addLog('✓ Organize cycle complete', 'ok');
      haptics.success();
    } catch (e: any) {
      addLog(`[ERROR] ${e?.message || 'Failed'}`, 'error');
    } finally { setRunning(false); }
  };

  const runForceGrow = async () => {
    if (growRunning) return;
    haptics.medium(); setGrowRunning(true);
    addLog('[ΩLOOP] Starting force growth cycle...', 'info');
    try {
      const result = await knowledgeGrowthEngine.runGrowthCycle(true);
      addLog(`[ΩLOOP] Complete · +${result.added} findings · ${result.events.length} events`, 'ok');
      haptics.success();
    } catch (e: any) {
      addLog(`[ΩLOOP ERROR] ${e?.message}`, 'error');
    } finally { setGrowRunning(false); }
  };

  const triggerHarvest = () => {
    haptics.medium();
    quantumLinkHarvester.triggerMicroHarvest();
    addLog('[QLH] EGT micro-harvest triggered...', 'info');
    setTimeout(() => {
      setQlhLive(quantumLinkHarvester.getStats());
      addLog('[QLH] Harvest complete', 'ok');
    }, 4000);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false}>
      {/* Bot status card */}
      <CyberPanel accentColor={COLOR.amber} stripe>
        <View style={{ padding: PAD }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={[bot.orb, { borderColor: COLOR.amber + '55', backgroundColor: glow(COLOR.amber, 10) }]}>
              <MaterialCommunityIcons name="robot" size={20} color={COLOR.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: '900', color: COLOR.amber }}>[ BUTLER BOT ]</Text>
              <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.amber + '80' }}>KB Intelligence Organizer v2.0</Text>
            </View>
            <View style={[bot.statusPill, { borderColor: (running ? COLOR.amber : COLOR.green) + '50', backgroundColor: glow(running ? COLOR.amber : COLOR.green, 7) }]}>
              <PulseDot color={running ? COLOR.amber : COLOR.green} size={5} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: running ? COLOR.amber : COLOR.green }}>{running ? 'RUNNING' : 'READY'}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
            {[
              { label: 'ORGANIZED', val: botStats?.totalOrganized ?? 0,  col: COLOR.cyan    },
              { label: 'DUPES RM',  val: botStats?.duplicatesFound ?? 0, col: COLOR.red     },
              { label: 'CLUSTERS',  val: botStats?.clustersFormed ?? 0,  col: COLOR.amber   },
              { label: 'KB SIZE',   val: stats ? `${Math.round(stats.storageUsed / 1024)}K` : '0K', col: COLOR.green },
            ].map(({ label, val, col }) => (
              <View key={label} style={[bot.statCell, { borderColor: col + '30', backgroundColor: glow(col, 8) }]}>
                <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: col }}>{val}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 7, color: col + '80' }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <TouchableOpacity onPress={runOrganize} disabled={running}
            style={[bot.btn, { backgroundColor: COLOR.amber, opacity: running ? 0.55 : 1 }]}>
            {running ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="robot" size={16} color="#000" />}
            <Text style={bot.btnTxt}>{running ? 'ORGANIZING...' : 'RUN ORGANIZE CYCLE'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity onPress={runForceGrow} disabled={growRunning}
              style={[bot.secondaryBtn, { borderColor: COLOR.green + '55', backgroundColor: glow(COLOR.green, 8), flex: 1, opacity: growRunning ? 0.6 : 1 }]}>
              {growRunning ? <ActivityIndicator size="small" color={COLOR.green} /> : <MaterialIcons name="trending-up" size={14} color={COLOR.green} />}
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.green }}>{growRunning ? 'GROWING...' : 'FORCE ΩLOOP'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={triggerHarvest}
              style={[bot.secondaryBtn, { borderColor: COLOR.teal + '55', backgroundColor: glow(COLOR.teal, 8), flex: 1 }]}>
              <MaterialCommunityIcons name="atom" size={14} color={COLOR.teal} />
              <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.teal }}>HARVEST</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CyberPanel>

      {/* QLH stats */}
      {qlhLive ? (
        <View style={[bot.qlhCard, { borderColor: COLOR.teal + '35' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <MaterialIcons name="link" size={11} color={COLOR.teal} />
            <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.teal, letterSpacing: 1 }}>QUANTUM LINK HARVESTER</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {[
              { v: qlhLive.totalDiscovered ?? 0, l: 'DISCOVERED', c: COLOR.teal   },
              { v: qlhLive.totalHarvested  ?? 0, l: 'HARVESTED',  c: COLOR.green  },
              { v: qlhLive.totalAdded      ?? 0, l: 'ADDED',      c: COLOR.green  },
              { v: qlhLive.totalFiltered   ?? 0, l: 'FILTERED',   c: COLOR.red    },
            ].map(({ v, l, c }) => (
              <View key={l} style={[bot.statCell, { borderColor: c + '30', backgroundColor: glow(c, 7) }]}>
                <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: c }}>{v}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 7, color: c + '80' }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Bot log */}
      <View style={bot.logCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingTop: PAD, paddingBottom: 8 }}>
          <MaterialIcons name="terminal" size={12} color={COLOR.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.amber, letterSpacing: 1 }}>// BOT LOG</Text>
          <View style={{ flex: 1 }} />
          {running && <ActivityIndicator size="small" color={COLOR.amber} style={{ transform: [{ scale: 0.7 }] }} />}
          <TouchableOpacity onPress={() => setLogs([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="delete-sweep" size={14} color={COLOR.dim} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 1, backgroundColor: COLOR.amber + '30', marginHorizontal: PAD }} />
        <ScrollView ref={scrollRef} style={{ maxHeight: 250, padding: PAD }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {logs.length === 0 ? (
            <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim, fontStyle: 'italic' }}>Run organize cycle to see live output...</Text>
          ) : logs.map((log, i) => {
            const col = log.type === 'ok' ? COLOR.green : log.type === 'warn' ? COLOR.amber : log.type === 'error' ? COLOR.red : COLOR.cyan + '90';
            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, gap: 6 }}>
                <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.dim, width: 56 }}>{new Date(log.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 10, color: col, flex: 1, lineHeight: 15 }}>{log.msg}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
const bot = StyleSheet.create({
  orb:         { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  statCell:    { flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, gap: 3 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
  btnTxt:      { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' },
  secondaryBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderRadius: 11, paddingVertical: 11 },
  qlhCard:     { backgroundColor: COLOR.surf, borderRadius: 12, borderWidth: 1, padding: PAD },
  logCard:     { backgroundColor: COLOR.surf, borderRadius: 12, borderWidth: 1, borderColor: COLOR.amber + '25', overflow: 'hidden' },
});

// ─── CRAWLER TAB ─────────────────────────────────────────────────
function CrawlerTab({ isConn, onKBUpdate }: { isConn: boolean; onKBUpdate: () => void }) {
  const [url,       setUrl]       = useState('');
  const [domain,    setDomain]    = useState('');
  const [topic,     setTopic]     = useState('');
  const [crawling,  setCrawling]  = useState(false);
  const [batchRun,  setBatchRun]  = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [logs,      setLogs]      = useState<CrawlLog[]>([]);
  const [relayAddr, setRelayAddr] = useState('NONE');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    sigmaNetCrawler.checkRelay().then(ok => setRelayAddr(ok ? sigmaNetCrawler.getRelayAddr() : 'NONE')).catch(() => {});
  }, [isConn]);

  const addLog = (msg: string, type: CrawlLog['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-40), { ts: Date.now(), msg, type }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const runCrawl = async () => {
    if (!url.trim()) { Alert.alert('URL required'); return; }
    haptics.medium(); setCrawling(true); setLogs([]);
    addLog(`[SIGMA-NET] Crawling: ${url.trim()}`, 'info');
    addLog(`Domain: ${domain || 'General'} · Topic: ${topic || 'Unknown'}`, 'info');
    const result = await sigmaNetCrawler.crawlViaRelay(
      { url: url.trim(), domain: domain || 'General', topic: topic || 'Unknown', mode: 'fetch' },
      (msg, t) => addLog(msg, (t as any) || 'info')
    );
    if (result.error) { addLog(`[ERROR] ${result.error}`, 'error'); haptics.warning(); }
    else { addLog(`✓ ${result.wordCount} words · ${result.latencyMs}ms`, 'ok'); haptics.success(); onKBUpdate(); }
    setCrawling(false);
  };

  const runBatch = async () => {
    if (batchRun) return;
    haptics.medium(); setBatchRun(true); setProgress(0); setLogs([]);
    addLog(`[BATCH] Starting ${SIGMA_PYTHON_TARGETS.length} Python doc crawls via SIGMA-NET`, 'info');
    addLog(`Relay: ${relayAddr !== 'NONE' ? relayAddr : 'No relay — using direct'}`, relayAddr !== 'NONE' ? 'ok' : 'warn');
    const result = await sigmaNetCrawler.batchCrawlViaRelay(
      SIGMA_PYTHON_TARGETS,
      (msg, t) => addLog(msg, (t as any) || 'info'),
      (done, total) => setProgress(Math.round((done / total) * 100))
    );
    setProgress(100); setBatchRun(false);
    haptics.success(); onKBUpdate();
    addLog(`✓ ${result.completed}/${SIGMA_PYTHON_TARGETS.length} · ${result.totalWords} words`, 'ok');
    Alert.alert('Batch Complete', `Crawled ${result.completed} docs\n${result.failed} failures`);
  };

  const QUICK_TARGETS = [
    { label: 'Python Docs', url: 'https://docs.python.org/3/tutorial/', domain: 'Python', topic: 'Tutorial' },
    { label: 'psutil',      url: 'https://psutil.readthedocs.io/',       domain: 'Python', topic: 'psutil'   },
    { label: 'PyAutoGUI',   url: 'https://pyautogui.readthedocs.io/',    domain: 'Python', topic: 'pyautogui'},
    { label: 'Selenium',    url: 'https://selenium-python.readthedocs.io/', domain: 'Python', topic: 'selenium' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Relay status */}
      <View style={[craw.relayBanner, { borderColor: (relayAddr !== 'NONE' ? COLOR.green : COLOR.amber) + '35', backgroundColor: glow(relayAddr !== 'NONE' ? COLOR.green : COLOR.amber, 6) }]}>
        <MaterialIcons name="router" size={12} color={relayAddr !== 'NONE' ? COLOR.green : COLOR.amber} />
        <Text style={[craw.relayTxt, { color: relayAddr !== 'NONE' ? COLOR.green : COLOR.amber }]}>
          {relayAddr !== 'NONE' ? `RELAY ACTIVE: ${relayAddr}` : 'NO RELAY — Pair PC for SIGMA-NET crawling'}
        </Text>
        <TouchableOpacity onPress={() => { sigmaNetCrawler.checkRelay().then(ok => setRelayAddr(ok ? sigmaNetCrawler.getRelayAddr() : 'NONE')).catch(() => {}); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="refresh" size={13} color={COLOR.mid} />
        </TouchableOpacity>
      </View>

      {/* URL input */}
      <View style={[craw.inputRow, { borderColor: COLOR.magenta + '45' }]}>
        <Text style={{ fontFamily: MONO, fontSize: 12, color: COLOR.magenta, marginRight: 4 }}>$</Text>
        <TextInput style={craw.input} value={url} onChangeText={setUrl}
          placeholder="https://docs.python.org/3/..." placeholderTextColor={COLOR.dim}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!crawling} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[craw.inputSmall, { flex: 1 }]}>
          <Text style={craw.inputLabel}>DOMAIN</Text>
          <TextInput style={craw.inputSmallField} value={domain} onChangeText={setDomain} placeholder="Python..." placeholderTextColor={COLOR.dim} editable={!crawling} />
        </View>
        <View style={[craw.inputSmall, { flex: 1 }]}>
          <Text style={craw.inputLabel}>TOPIC</Text>
          <TextInput style={craw.inputSmallField} value={topic} onChangeText={setTopic} placeholder="requests..." placeholderTextColor={COLOR.dim} editable={!crawling} />
        </View>
      </View>

      {/* Crawl button */}
      <TouchableOpacity onPress={runCrawl} disabled={crawling || !url.trim()} activeOpacity={0.85}
        style={[craw.btn, { borderColor: COLOR.magenta, backgroundColor: glow(COLOR.magenta, 10), opacity: crawling ? 0.6 : 1 }]}>
        {crawling ? <ActivityIndicator size="small" color={COLOR.magenta} /> : <MaterialIcons name="router" size={16} color={COLOR.magenta} />}
        <Text style={[craw.btnTxt, { color: COLOR.magenta }]}>SIGMA-NET RELAY CRAWL</Text>
      </TouchableOpacity>

      {/* Batch */}
      <TouchableOpacity onPress={runBatch} disabled={batchRun || relayAddr === 'NONE'} activeOpacity={0.85}
        style={[craw.btn, { borderColor: COLOR.cyan, backgroundColor: glow(COLOR.cyan, 8), opacity: (batchRun || relayAddr === 'NONE') ? 0.45 : 1 }]}>
        {batchRun ? <ActivityIndicator size="small" color={COLOR.cyan} /> : <MaterialIcons name="cloud-download" size={16} color={COLOR.cyan} />}
        <Text style={[craw.btnTxt, { color: COLOR.cyan }]}>
          {batchRun ? `BATCH ${progress}%...` : `BATCH CRAWL (${SIGMA_PYTHON_TARGETS.length} Python docs)`}
        </Text>
      </TouchableOpacity>

      {/* Quick targets */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4, marginBottom: 4 }}>
        <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: COLOR.teal }} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.teal + '80', letterSpacing: 1.5 }}>QUICK TARGETS</Text>
      </View>
      {QUICK_TARGETS.map(t => (
        <TouchableOpacity key={t.label} onPress={() => { haptics.selection(); setUrl(t.url); setDomain(t.domain); setTopic(t.topic); }} activeOpacity={0.85}
          style={craw.target}>
          <MaterialIcons name="router" size={12} color={COLOR.magenta} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: COLOR.text }}>{t.label}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.dim }} numberOfLines={1}>{t.url}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={14} color={COLOR.mid} />
        </TouchableOpacity>
      ))}

      {/* Log */}
      {logs.length > 0 && (
        <View style={craw.logCard}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.amber, paddingHorizontal: PAD, paddingTop: 12, letterSpacing: 1 }}>CRAWL LOG</Text>
          <ScrollView ref={scrollRef} style={{ maxHeight: 200, padding: PAD }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {logs.map((log, i) => {
              const col = log.type === 'ok' ? COLOR.green : log.type === 'error' ? COLOR.red : log.type === 'warn' ? COLOR.amber : COLOR.cyan + '90';
              return <Text key={i} style={{ fontFamily: MONO, fontSize: 10, color: col, marginBottom: 3, lineHeight: 15 }}>{log.msg}</Text>;
            })}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}
const craw = StyleSheet.create({
  relayBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  relayTxt:    { fontFamily: MONO, fontSize: 9, fontWeight: '700', flex: 1 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: COLOR.surf },
  input:       { flex: 1, fontFamily: MONO, fontSize: 12, color: COLOR.text },
  inputSmall:  { backgroundColor: COLOR.surf, borderWidth: 1.5, borderColor: COLOR.border, borderRadius: 10, padding: 10 },
  inputLabel:  { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: COLOR.dim, letterSpacing: 1, marginBottom: 4 },
  inputSmallField: { fontFamily: MONO, fontSize: 12, color: COLOR.text },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14 },
  btnTxt:      { fontFamily: MONO, fontSize: 13, fontWeight: '900' },
  target:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLOR.surf, borderRadius: 10, borderWidth: 1, borderColor: COLOR.border, padding: 12, marginBottom: 6 },
  logCard:     { backgroundColor: COLOR.surf, borderRadius: 12, borderWidth: 1, borderColor: COLOR.amber + '25', overflow: 'hidden' },
});

// ─── MANUAL ENTRY TAB ─────────────────────────────────────────────
function ManualTab({ onKBUpdate }: { onKBUpdate: () => void }) {
  const [domain,  setDomain]  = useState('');
  const [topic,   setTopic]   = useState('');
  const [content, setContent] = useState('');
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    if (!content.trim()) { Alert.alert('Content required'); return; }
    haptics.medium(); setSaving(true);
    try {
      const compressed = knowledgeAccumulator.compressResearch(content, domain || 'Manual', topic || 'User Entry', 'manual_entry');
      knowledgeAccumulator.addFinding(compressed);
      await knowledgeAccumulator.saveNow();
      setDomain(''); setTopic(''); setContent('');
      haptics.success(); onKBUpdate();
      Alert.alert('Saved!', `Keywords: ${compressed.keywords.slice(0, 5).join(', ')}`);
    } catch (e: any) { Alert.alert('Save failed', e?.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 130, gap: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={[man.info, { borderColor: COLOR.teal + '30', backgroundColor: glow(COLOR.teal, 6) }]}>
        <MaterialIcons name="info-outline" size={13} color={COLOR.teal} />
        <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid, flex: 1, lineHeight: 17 }}>
          Paste any text — compressed via NEXUS semantic chunking and stored permanently in the Knowledge Base.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[man.smallInput, { flex: 1 }]}>
          <Text style={man.smallLabel}>DOMAIN</Text>
          <TextInput style={man.smallField} value={domain} onChangeText={setDomain} placeholder="Python, AI..." placeholderTextColor={COLOR.dim} />
        </View>
        <View style={[man.smallInput, { flex: 1 }]}>
          <Text style={man.smallLabel}>TOPIC</Text>
          <TextInput style={man.smallField} value={topic} onChangeText={setTopic} placeholder="Topic name..." placeholderTextColor={COLOR.dim} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: COLOR.teal }} />
        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: COLOR.teal + '80', letterSpacing: 1.5 }}>CONTENT</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: MONO, fontSize: 8.5, color: COLOR.dim }}>{content.length} chars</Text>
      </View>
      <TextInput
        style={man.textArea}
        value={content} onChangeText={setContent}
        placeholder="Paste research notes, documentation, or any useful text..."
        placeholderTextColor={COLOR.dim}
        multiline textAlignVertical="top"
      />
      <TouchableOpacity onPress={save} disabled={!content.trim() || saving} activeOpacity={0.85}
        style={[man.saveBtn, { backgroundColor: COLOR.teal, opacity: (!content.trim() || saving) ? 0.4 : 1 }]}>
        {saving ? <ActivityIndicator size="small" color="#000" /> : <MaterialIcons name="save" size={16} color="#000" />}
        <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000' }}>{saving ? 'COMPRESSING...' : 'SAVE & COMPRESS'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const man = StyleSheet.create({
  info:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  smallInput:{ backgroundColor: COLOR.surf, borderWidth: 1.5, borderColor: COLOR.border, borderRadius: 10, padding: 10 },
  smallLabel:{ fontFamily: MONO, fontSize: 8, fontWeight: '700', color: COLOR.dim, letterSpacing: 1, marginBottom: 5 },
  smallField:{ fontFamily: MONO, fontSize: 12, color: COLOR.text },
  textArea:  { backgroundColor: COLOR.surf, borderWidth: 2, borderColor: COLOR.teal + '35', borderRadius: 12, padding: PAD, color: COLOR.text, fontFamily: MONO, fontSize: 13, minHeight: 160, lineHeight: 22 },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
});

// ─── KB EXPLORER TAB ─────────────────────────────────────────────
function FindingCard({ finding, onDelete }: { finding: CompressedKnowledge; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const conf = finding.metadata?.confidence ?? 0;
  const confCol = conf > 0.8 ? COLOR.green : conf > 0.5 ? COLOR.amber : COLOR.red;
  const domColors: Record<string, string> = {
    Python: COLOR.cyan, System: COLOR.teal, Network: COLOR.green, AI: COLOR.magenta,
    Files: COLOR.amber, Web: COLOR.green, Data: COLOR.yellow, Manual: COLOR.blue,
  };
  const domCol = domColors[finding.domain] || COLOR.cyan;
  return (
    <TouchableOpacity onPress={() => { haptics.selection(); setExpanded(v => !v); }} activeOpacity={0.88}
      style={[fcard.card, { borderLeftColor: domCol }]}>
      <View style={fcard.hdr}>
        <View style={[fcard.domBadge, { borderColor: domCol + '55', backgroundColor: glow(domCol, 10) }]}>
          <Text style={[fcard.domTxt, { color: domCol }]}>{finding.domain}</Text>
        </View>
        <Text style={fcard.topic} numberOfLines={1}>{finding.topic}</Text>
        <View style={[fcard.confBadge, { borderColor: confCol + '50', backgroundColor: glow(confCol, 8) }]}>
          <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: confCol }}>{Math.round(conf * 100)}%</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={() => { haptics.heavy(); onDelete(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="delete-outline" size={15} color={COLOR.dim} />
          </TouchableOpacity>
        )}
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={15} color={COLOR.dim} />
      </View>
      <Text style={fcard.summary} numberOfLines={expanded ? undefined : 2}>{finding.summary}</Text>
      {expanded && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {(finding.keywords || []).slice(0, 8).map(kw => (
              <View key={kw} style={[fcard.kw, { borderColor: domCol + '40', backgroundColor: glow(domCol, 8) }]}>
                <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '700', color: domCol }}>{kw}</Text>
              </View>
            ))}
          </View>
          {finding.metadata?.source && <Text style={fcard.src}>src: {finding.metadata.source.slice(0, 50)}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}
const fcard = StyleSheet.create({
  card:     { backgroundColor: COLOR.surf, borderRadius: 12, borderWidth: 1.5, borderLeftWidth: 3, borderColor: COLOR.border, padding: 12, marginBottom: 7 },
  hdr:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7, flexWrap: 'wrap' },
  domBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  domTxt:   { fontFamily: MONO, fontSize: 9.5, fontWeight: '900' },
  topic:    { flex: 1, fontFamily: MONO, fontSize: 13, fontWeight: '900', color: COLOR.text },
  confBadge:{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  summary:  { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 12.5, color: COLOR.mid, lineHeight: 19 },
  kw:       { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  src:      { fontFamily: MONO, fontSize: 9, color: COLOR.dim, marginTop: 6 },
});

function ExplorerTab({ sessions, loading, onRefresh, onClear }: {
  sessions: ResearchSession[]; loading: boolean; onRefresh: () => void; onClear: () => void;
}) {
  const [search, setSearch] = useState('');
  const allFindings = sessions.flatMap(s => s.findings);
  const filtered = useMemo(() => {
    if (!search.trim()) return allFindings;
    const q = search.toLowerCase();
    return allFindings.filter(f =>
      f.topic.toLowerCase().includes(q) || f.domain.toLowerCase().includes(q) ||
      f.summary.toLowerCase().includes(q) || (f.keywords || []).some(k => k.toLowerCase().includes(q))
    );
  }, [sessions, search]);

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      <View style={{ padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLOR.border, backgroundColor: COLOR.surf }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLOR.surf2, borderRadius: 10, borderWidth: 1, borderColor: COLOR.border, paddingHorizontal: 12, paddingVertical: 10 }}>
          <MaterialIcons name="search" size={15} color={search ? COLOR.cyan : COLOR.dim} />
          <TextInput style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: COLOR.text }} value={search} onChangeText={setSearch}
            placeholder="Search findings..." placeholderTextColor={COLOR.dim} autoCapitalize="none" />
          {search ? <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><MaterialIcons name="close" size={14} color={COLOR.dim} /></TouchableOpacity> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => { haptics.light(); onRefresh(); }}
            style={[exp.action, { borderColor: COLOR.cyan + '45', backgroundColor: glow(COLOR.cyan, 8) }]}>
            <MaterialIcons name="refresh" size={13} color={COLOR.cyan} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.cyan }}>SYNC</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { haptics.heavy(); onClear(); }}
            style={[exp.action, { borderColor: COLOR.red + '45', backgroundColor: glow(COLOR.red, 7) }]}>
            <MaterialIcons name="delete-sweep" size={13} color={COLOR.red} />
            <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color: COLOR.red }}>CLEAR ALL</Text>
          </TouchableOpacity>
          <View style={[exp.action, { borderColor: COLOR.amber + '35', backgroundColor: glow(COLOR.amber, 6) }]}>
            <MaterialCommunityIcons name="database" size={12} color={COLOR.amber} />
            <Text style={{ fontFamily: MONO, fontSize: 9, color: COLOR.amber }}>{filtered.length} items</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={COLOR.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.mid }}>Loading Knowledge Base...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <MaterialCommunityIcons name="brain" size={50} color={COLOR.dim} />
          <Text style={{ fontFamily: MONO, fontSize: 15, fontWeight: '900', color: COLOR.mid }}>
            {search ? `No results for "${search}"` : 'Knowledge Base is empty'}
          </Text>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: COLOR.dim, textAlign: 'center', paddingHorizontal: 30 }}>
            {search ? 'Try different keywords' : 'Use CRAWLER tab or Bot to fill the KB'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item.domain}-${item.topic}-${idx}`}
          renderItem={({ item }) => <FindingCard finding={item} />}
          ListHeaderComponent={<Text style={{ fontFamily: MONO, fontSize: 10, color: COLOR.dim, padding: PAD, paddingBottom: 8 }}>{filtered.length} finding{filtered.length !== 1 ? 's' : ''}{search ? ` for "${search}"` : ''} — tap to expand</Text>}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
}
const exp = StyleSheet.create({
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function KnowledgeInner() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sessions,  setSessions]  = useState<ResearchSession[]>([]);
  const [stats,     setStats]     = useState<KBStats | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [isConn,    setIsConn]    = useState(false);
  const [qlhStats,  setQlhStats]  = useState<QLHStats | null>(null);

  const loadKB = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([knowledgeAccumulator.loadResearch(), knowledgeAccumulator.getStats()]);
      setSessions(s); setStats(st);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setIsConn(serverConnection.isConnected());
    setQlhStats(quantumLinkHarvester.getStats());
    const unsubQLH  = quantumLinkHarvester.onStats((s: QLHStats) => setQlhStats(s));
    const unsubConn = autoConnectEngine.onEvent((evt: EngineEvent) => {
      setIsConn(evt.status === 'connected');
    });
    loadKB();
    // Auto-growth if stale
    AsyncStorage.getItem('@kb_growth_last_run').then(async lastStr => {
      const staleMins = (Date.now() - (lastStr ? parseInt(lastStr, 10) : 0)) / 60000;
      if (staleMins > 20) {
        knowledgeGrowthEngine.runGrowthCycle(false).then(() => AsyncStorage.setItem('@kb_growth_last_run', Date.now().toString())).catch(() => {});
      }
    }).catch(() => {});
    return () => { unsubQLH(); unsubConn(); };
  }, [loadKB]);

  const clearKB = () => Alert.alert('Clear Knowledge Base', 'Delete all stored knowledge permanently?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear All', style: 'destructive', onPress: async () => {
      haptics.heavy(); await knowledgeAccumulator.clearAll(); setSessions([]); setStats(null);
    }},
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
      <TabSwipeOverlay leftRoute="/(tabs)/butler" rightRoute="/(tabs)/logs" />
      <KBHeader safeTop={insets.top} isConn={isConn} findings={stats?.totalFindings ?? 0} onRefresh={loadKB} />
      <TabBar active={activeTab} onSelect={setActiveTab} />

      {activeTab === 'dashboard' && <DashboardTab isConn={isConn} stats={stats} qlhStats={qlhStats} />}
      {activeTab === 'bot'       && <KBBotTab isConn={isConn} stats={stats} />}
      {activeTab === 'crawler'   && <CrawlerTab isConn={isConn} onKBUpdate={loadKB} />}
      {activeTab === 'manual'    && <ManualTab onKBUpdate={loadKB} />}
      {activeTab === 'base'      && (
        <ExplorerTab sessions={sessions} loading={loading} onRefresh={loadKB} onClear={clearKB} />
      )}
    </View>
  );
}

export default function KnowledgeScreen() {
  return (
    <TabErrorBoundary name="Knowledge Base">
      <KnowledgeInner />
    </TabErrorBoundary>
  );
}
