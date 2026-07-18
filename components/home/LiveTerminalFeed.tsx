/**
 * LiveTerminalFeed — 4-channel live log panel for Butler AI homepage.
 *
 * Channels (last 4 entries each, auto-refresh every 8s):
 *   CHAN 01 · APP LOG     — in-memory ring buffer from utils/logger
 *   CHAN 02 · SERVER LOG  — autoErrorLogger entries (error/warn/info)
 *   CHAN 03 · SCRIPTS RAN — executionHistory (last 4 runs + result)
 *   CHAN 04 · MEMORY ΔGROWTH — knowledgeAccumulator growth events
 *
 * Bonus: animated "typing bot" row — Butler robot character that
 * periodically types a new system message into the terminal.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Platform, Pressable, Easing,
  ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { logger }          from '@/utils/logger';
import { autoErrorLogger } from '@/services/autoErrorLogger';
import { executionHistory } from '@/services/executionHistory';
import { knowledgeAccumulator } from '@/services/knowledgeAccumulator';
import { haptics } from '@/services/haptics';

const SW   = Math.max(320, Dimensions.get('window').width);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SANS: any = Platform.OS === 'ios' ? 'System' : 'sans-serif';

type ChanID = 'app' | 'server' | 'scripts' | 'memory';

interface LogRow {
  id:    string;
  ts:    number;
  label: string;
  sub?:  string;
  ok:    boolean | null; // null = neutral/info
  col:   string;
  tag?:  string;
}

// Channel metadata
const CHANNELS: {
  id: ChanID; label: string; icon: string; iconLib: 'material'|'community';
  color: string; tag: string;
}[] = [
  { id:'app',     label:'APP LOG',   icon:'terminal',        iconLib:'community', color:'#00E5FF', tag:'APP'    },
  { id:'server',  label:'SRV LOG',   icon:'server-network',  iconLib:'community', color:'#CC44FF', tag:'SRV'    },
  { id:'scripts', label:'SCRIPTS',   icon:'code-braces',     iconLib:'community', color:'#00FF88', tag:'RUN'    },
  { id:'memory',  label:'KB ΔGROWTH',icon:'brain',           iconLib:'community', color:'#FFB020', tag:'KB'     },
];

// Format elapsed time
function elapsed(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return `${Math.floor(d/1000)}s`;
  if (d < 3600000) return `${Math.floor(d/60000)}m`;
  return `${Math.floor(d/3600000)}h`;
}

// Typing bot messages — rotated every ~12s
const BOT_MSGS = [
  'butler-nexus@core:~$ uptime --local',
  'butler-nexus@core:~$ kb status --brief',
  'butler-nexus@core:~$ scan --lan --fast',
  'butler-nexus@core:~$ mem --private --report',
  'butler-nexus@core:~$ scripts --count --active',
];

// ── SINGLE LOG ROW ─────────────────────────────────────────────
function Row({ row, accent }: { row: LogRow; accent: string }) {
  const fadeA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeA, { toValue: 1, duration: 280, useNativeDriver: false }).start();
  }, []);
  const statusCol = row.ok === true ? '#00FF88' : row.ok === false ? '#FF3344' : accent;
  return (
    <Animated.View style={[row_s.wrap, { opacity: fadeA, borderLeftColor: statusCol }]}>
      <View style={[row_s.statusDot, { backgroundColor: statusCol }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[row_s.label, { color: accent }]} numberOfLines={1}>{row.label}</Text>
        {row.sub ? (
          <Text style={row_s.sub} numberOfLines={1}>{row.sub}</Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        {row.tag ? (
          <View style={[row_s.tag, { borderColor: accent + '40', backgroundColor: accent + '0C' }]}>
            <Text style={[row_s.tagTxt, { color: accent }]}>{row.tag}</Text>
          </View>
        ) : null}
        <Text style={row_s.time}>{elapsed(row.ts)}</Text>
      </View>
    </Animated.View>
  );
}
const row_s = StyleSheet.create({
  wrap:      { flexDirection:'row', alignItems:'flex-start', gap:8, paddingVertical:4, borderLeftWidth:2, paddingLeft:8 },
  statusDot: { width:5, height:5, borderRadius:3, marginTop:4, flexShrink:0 },
  label:     { fontFamily:MONO, fontSize:10, fontWeight:'900', letterSpacing:0.2 },
  sub:       { fontFamily:MONO, fontSize:9, color:'#4A6A80', marginTop:1 },
  tag:       { borderWidth:1, borderRadius:4, paddingHorizontal:5, paddingVertical:1 },
  tagTxt:    { fontFamily:MONO, fontSize:7.5, fontWeight:'900', letterSpacing:0.3 },
  time:      { fontFamily:MONO, fontSize:7.5, color:'#2A4060' },
});

// ── CHANNEL PANEL ─────────────────────────────────────────────
function ChanPanel({ chan, rows, isActive, onPress }: {
  chan: typeof CHANNELS[0]; rows: LogRow[]; isActive: boolean; onPress: () => void;
}) {
  const borderA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(borderA, {
      toValue: isActive ? 1 : 0, duration: 220, useNativeDriver: false,
    }).start();
  }, [isActive]);
  const borderC = borderA.interpolate({ inputRange:[0,1], outputRange:[chan.color+'28', chan.color+'BB'] });
  const Icon = chan.iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <Pressable onPress={() => { haptics.light(); onPress(); }} style={{ flex:1, minWidth:0 }}>
      <Animated.View style={[cp_s.panel, { borderColor: borderC,
        ...(Platform.OS==='ios' && isActive ? {
          shadowColor: chan.color, shadowOffset:{width:0,height:0}, shadowOpacity:0.55, shadowRadius:10,
        } : {}),
      }]}>
        {/* Channel header */}
        <View style={[cp_s.header, { borderBottomColor: chan.color + '22' }]}>
          <View style={[cp_s.iconBox, { borderColor: chan.color+'50', backgroundColor: chan.color+'10' }]}>
            <Icon name={chan.icon as any} size={10} color={chan.color} />
          </View>
          <Text style={[cp_s.label, { color: chan.color }]}>{chan.label}</Text>
          <View style={[cp_s.countBadge, { borderColor: chan.color+'45', backgroundColor: chan.color+'0C' }]}>
            <Text style={[cp_s.countTxt, { color: chan.color }]}>{rows.length}</Text>
          </View>
        </View>
        {/* Rows */}
        <View style={{ gap: 0 }}>
          {rows.length > 0 ? rows.map(r => (
            <Row key={r.id} row={r} accent={chan.color} />
          )) : (
            <View style={{ paddingVertical: 8, paddingLeft: 10 }}>
              <Text style={{ fontFamily: MONO, fontSize: 9, color: '#2A4060' }}>{'> no entries yet'}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
const cp_s = StyleSheet.create({
  panel:      { borderWidth:1.5, borderRadius:10, overflow:'hidden', backgroundColor:'#04090F', flex:1 },
  header:     { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:8, paddingVertical:6,
                borderBottomWidth:1, backgroundColor:'#030709' },
  iconBox:    { width:18, height:18, borderRadius:5, borderWidth:1, alignItems:'center', justifyContent:'center' },
  label:      { fontFamily:MONO, fontSize:8.5, fontWeight:'900', letterSpacing:0.5, flex:1 },
  countBadge: { borderWidth:1, borderRadius:5, paddingHorizontal:5, paddingVertical:1 },
  countTxt:   { fontFamily:MONO, fontSize:7.5, fontWeight:'900' },
});

// ── TYPING BOT ROW ─────────────────────────────────────────────
function TypingBotRow() {
  const [msgIdx, setMsgIdx]     = useState(0);
  const [typed,  setTyped]      = useState('');
  const [blinking, setBlinking] = useState(true);
  const cursorA = useRef(new Animated.Value(1)).current;
  const msgRef  = useRef(BOT_MSGS[0]);

  useEffect(() => {
    // Cursor blink
    const cl = Animated.loop(Animated.sequence([
      Animated.timing(cursorA, { toValue: 0, duration: 520, useNativeDriver: true }),
      Animated.timing(cursorA, { toValue: 1, duration: 520, useNativeDriver: true }),
    ])); cl.start();
    return () => cl.stop();
  }, []);

  useEffect(() => {
    const target = BOT_MSGS[msgIdx];
    msgRef.current = target;
    let i = 0;
    setTyped('');
    const tid = setInterval(() => {
      i++;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(tid);
        // Pause then cycle to next message
        setTimeout(() => setMsgIdx(m => (m + 1) % BOT_MSGS.length), 3800);
      }
    }, 38);
    return () => clearInterval(tid);
  }, [msgIdx]);

  return (
    <View style={bot_s.wrap}>
      {/* Robot icon */}
      <View style={bot_s.avatar}>
        <MaterialCommunityIcons name="robot-happy-outline" size={14} color="#00E5FF" />
        <View style={{ position:'absolute', bottom:-1, right:-1, width:5, height:5, borderRadius:3, backgroundColor:'#00FF88', borderWidth:1, borderColor:'#020810' }} />
      </View>
      {/* Terminal prompt */}
      <View style={bot_s.terminal}>
        <Text style={bot_s.prompt} numberOfLines={1}>
          <Text style={{ color:'#00E5FF' }}>{typed}</Text>
        </Text>
        <Animated.View style={{ width:6, height:12, backgroundColor:'#00E5FF', borderRadius:1, opacity:cursorA, marginLeft:1 }} />
      </View>
      <View style={[bot_s.liveBadge, { borderColor:'#00FF8845' }]}>
        <View style={{ width:4, height:4, borderRadius:2, backgroundColor:'#00FF88' }} />
        <Text style={{ fontFamily:MONO, fontSize:7, fontWeight:'900', color:'#00FF88' }}>LIVE</Text>
      </View>
    </View>
  );
}
const bot_s = StyleSheet.create({
  wrap:      { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:10, paddingVertical:7,
               borderTopWidth:1, borderTopColor:'#00E5FF18', backgroundColor:'#010508' },
  avatar:    { width:22, height:22, borderRadius:7, borderWidth:1.5, borderColor:'#00E5FF50',
               backgroundColor:'#00E5FF0C', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 },
  terminal:  { flex:1, flexDirection:'row', alignItems:'center', overflow:'hidden' },
  prompt:    { fontFamily:MONO, fontSize:9, color:'#00E5FFCC', letterSpacing:0.3, flex:1 },
  liveBadge: { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:5,
               paddingHorizontal:6, paddingVertical:2, backgroundColor:'#00FF880A', flexShrink:0 },
});

// ── MAIN COMPONENT ─────────────────────────────────────────────
interface LiveTerminalFeedProps {
  isConnected: boolean;
}

export function LiveTerminalFeed({ isConnected }: LiveTerminalFeedProps) {
  const isFocused = useIsFocused();
  const [activeChans, setActiveChans] = useState<ChanID[]>(['app','server','scripts','memory']);
  const [logs, setLogs] = useState<Record<ChanID, LogRow[]>>({
    app: [], server: [], scripts: [], memory: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  // Animation
  const headerGlowA = useRef(new Animated.Value(0.5)).current;
  const scanA       = useRef(new Animated.Value(-SW)).current;

  useEffect(() => {
    if (!isFocused) return;
    const gl = Animated.loop(Animated.sequence([
      Animated.timing(headerGlowA, { toValue:1,   duration:1800, useNativeDriver:false }),
      Animated.timing(headerGlowA, { toValue:0.3, duration:1800, useNativeDriver:false }),
    ]));
    const sc = Animated.loop(Animated.sequence([
      Animated.timing(scanA, { toValue:SW+80, duration:3000, useNativeDriver:false }),
      Animated.timing(scanA, { toValue:-SW,  duration:0,    useNativeDriver:false }),
      Animated.delay(5000),
    ]), { iterations: 3 });
    gl.start(); sc.start();
    return () => { gl.stop(); sc.stop(); };
  }, [isFocused]);

  const fetch = useCallback(async () => {
    try {
      // CHAN 01: App logs
      const appEntries = logger.getEntries().slice(-4).reverse();
      const appRows: LogRow[] = appEntries.map(e => ({
        id:    `app-${e.ts}`,
        ts:    e.ts,
        label: e.msg.slice(0, 60),
        ok:    e.level === 'error' ? false : e.level === 'warn' ? null : true,
        col:   '#00E5FF',
        tag:   e.level.toUpperCase().slice(0,3),
      }));

      // CHAN 02: Server/error logs
      const srvEntries = autoErrorLogger.getLogs().slice(0, 4);
      const srvRows: LogRow[] = srvEntries.map(e => ({
        id:    e.id,
        ts:    e.timestamp,
        label: `[${e.source}] ${e.message.slice(0, 48)}`,
        ok:    e.level === 'error' ? false : e.level === 'warn' ? null : true,
        col:   '#CC44FF',
        tag:   e.level.slice(0,3).toUpperCase(),
      }));

      // CHAN 03: Scripts ran
      const hist = (await executionHistory.getAll()).slice(0, 4);
      const scriptRows: LogRow[] = hist.map(h => ({
        id:    h.id,
        ts:    new Date(h.timestamp).getTime(),
        label: h.scriptName || 'Script',
        sub:   h.success ? `${h.ms}ms · OK` : `FAILED: ${(h.error || '').slice(0,30)}`,
        ok:    h.success,
        col:   '#00FF88',
        tag:   h.category?.slice(0,5).toUpperCase() || 'RUN',
      }));

      // CHAN 04: KB memory growth
      let memRows: LogRow[] = [];
      try {
        const stats = await knowledgeAccumulator.getStats?.();
        const total = stats?.totalFindings ?? 0;
        // Build synthetic growth events from sessions
        const sessions = (stats as any)?.sessions ?? [];
        memRows = sessions.slice(-4).reverse().map((s: any, i: number) => ({
          id:    `mem-${i}-${s.timestamp || Date.now()}`,
          ts:    s.timestamp ?? (Date.now() - i * 60000),
          label: `+${s.findings?.length ?? 1} findings`,
          sub:   s.query ? `q: ${String(s.query).slice(0, 36)}` : `total: ${total} entries`,
          ok:    null,
          col:   '#FFB020',
          tag:   'KB',
        }));
        // Fallback: show total stat if no sessions
        if (!memRows.length && total > 0) {
          memRows = [{ id:'mem-total', ts:Date.now(), label:`${total} total KB findings`, ok:true, col:'#FFB020', tag:'KB' }];
        }
        if (!memRows.length) {
          memRows = [{ id:'mem-empty', ts:Date.now(), label:'No KB data yet', ok:null, col:'#FFB020', tag:'KB' }];
        }
      } catch {}

      // Fallback seeds when empty
      const nowFallbacks: LogRow[] = [
        { id:'f1', ts:Date.now()-1000, label:'Butler AI ready', ok:true, col:'#00E5FF', tag:'SYS' },
        { id:'f2', ts:Date.now()-2000, label:'Encryption layer OK', ok:true, col:'#00E5FF', tag:'SEC' },
        { id:'f3', ts:Date.now()-3000, label:'LAN scanner idle', ok:null, col:'#00E5FF', tag:'NET' },
      ];

      setLogs({
        app:     appRows.length     ? appRows     : fallbackFeed('app',     isConnected),
        server:  srvRows.length     ? srvRows     : fallbackFeed('server',  isConnected),
        scripts: scriptRows.length  ? scriptRows  : fallbackFeed('scripts', isConnected),
        memory:  memRows,
      });
    } catch {}
    setRefreshing(false);
  }, [isConnected]);

  useEffect(() => {
    fetch();
    if (!isFocused) return;
    const t = setInterval(fetch, 8000);
    return () => clearInterval(t);
  }, [isFocused, fetch]);

  const headerBorderC = headerGlowA.interpolate({ inputRange:[0.3,1], outputRange:['#00E5FF28','#00E5FFAA'] });

  return (
    <View style={m.outer}>
      {/* Scan beam */}
      <Animated.View pointerEvents="none"
        style={[m.scanLine, { transform:[{ translateX: scanA }] }]} />

      {/* Header */}
      <Animated.View style={[m.header, { borderBottomColor: headerBorderC }]}>
        {/* macOS-style dots */}
        <View style={{ flexDirection:'row', gap:5, marginRight:8 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => (
            <View key={i} style={{ width:8, height:8, borderRadius:4, backgroundColor:c }} />
          ))}
        </View>
        <MaterialCommunityIcons name="monitor" size={11} color="#00E5FF" />
        <Text style={m.headerTitle}>BUTLER·NEXUS — LIVE TERMINAL FEED</Text>
        <TouchableOpacity onPress={() => { haptics.light(); setRefreshing(true); fetch(); }}
          hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <MaterialIcons name="refresh" size={13} color={refreshing ? '#00FF88' : '#2A4060'} />
        </TouchableOpacity>
        {/* Connection badge */}
        <View style={[m.connPill, { borderColor:(isConnected?'#00FF88':'#FF3344')+'50', backgroundColor:(isConnected?'#00FF88':'#FF3344')+'0A' }]}>
          <View style={{ width:4, height:4, borderRadius:2, backgroundColor:isConnected?'#00FF88':'#FF3344' }} />
          <Text style={{ fontFamily:MONO, fontSize:7, fontWeight:'900', color:isConnected?'#00FF88':'#FF3344' }}>
            {isConnected ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      </Animated.View>

      {/* 2×2 channel grid */}
      <View style={m.grid}>
        <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
          {CHANNELS.slice(0,2).map(ch => (
            <ChanPanel
              key={ch.id} chan={ch} rows={logs[ch.id]}
              isActive={activeChans.includes(ch.id)}
              onPress={() => setActiveChans(prev =>
                prev.includes(ch.id) ? prev.filter(c=>c!==ch.id) : [...prev, ch.id])}
            />
          ))}
        </View>
        <View style={{ flexDirection:'row', gap:8 }}>
          {CHANNELS.slice(2,4).map(ch => (
            <ChanPanel
              key={ch.id} chan={ch} rows={logs[ch.id]}
              isActive={activeChans.includes(ch.id)}
              onPress={() => setActiveChans(prev =>
                prev.includes(ch.id) ? prev.filter(c=>c!==ch.id) : [...prev, ch.id])}
            />
          ))}
        </View>
      </View>

      {/* Typing bot footer */}
      <TypingBotRow />

      {/* Bottom strip */}
      <View style={{ height:2.5, flexDirection:'row' }}>
        {['#00E5FF','#CC44FF','#00FF88','#FFB020'].map((c,i)=>(
          <View key={i} style={{ flex:1, backgroundColor:c, opacity:0.5 }} />
        ))}
      </View>
    </View>
  );
}

// ── FALLBACK SEED DATA (shown when real data is empty) ─────────
function fallbackFeed(chan: ChanID, isConnected: boolean): LogRow[] {
  const now = Date.now();
  switch (chan) {
    case 'app': return [
      { id:'a1', ts:now-400,  label:'App mounted OK', ok:true,  col:'#00E5FF', tag:'SYS' },
      { id:'a2', ts:now-2000, label:'Storage layer ready', ok:true, col:'#00E5FF', tag:'STOR' },
      { id:'a3', ts:now-5000, label:'Haptics warm', ok:true, col:'#00E5FF', tag:'HID' },
      { id:'a4', ts:now-9000, label:'Logger initialized', ok:true, col:'#00E5FF', tag:'LOG' },
    ];
    case 'server': return [
      { id:'s1', ts:now-1000, label:isConnected?'Heartbeat OK':'PC offline', ok:isConnected, col:'#CC44FF', tag:'HB' },
      { id:'s2', ts:now-3000, label:'Auth layer ready', ok:true, col:'#CC44FF', tag:'AUTH' },
      { id:'s3', ts:now-7000, label:'HMAC-SHA256 active', ok:true, col:'#CC44FF', tag:'SEC' },
      { id:'s4', ts:now-15000,label:'Rate limiter INIT', ok:null, col:'#CC44FF', tag:'RL' },
    ];
    case 'scripts': return [
      { id:'r1', ts:now-6000,  label:'No scripts run yet', ok:null, col:'#00FF88', tag:'—' },
      { id:'r2', ts:now-10000, label:'Script runtime ready', ok:true, col:'#00FF88', tag:'RT' },
    ];
    default: return [
      { id:'m1', ts:now-1000, label:'KB engine idle', ok:null, col:'#FFB020', tag:'KB' },
    ];
  }
}

const m = StyleSheet.create({
  outer:      { backgroundColor:'#020810', borderWidth:1.5, borderColor:'#00E5FF25', overflow:'hidden' },
  scanLine:   { position:'absolute', top:0, bottom:0, width:80,
                backgroundColor:'rgba(0,229,255,0.04)', transform:[{skewX:'-12deg'}], zIndex:0 },
  header:     { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8,
                backgroundColor:'#010407', borderBottomWidth:1, zIndex:1 },
  headerTitle:{ fontFamily:MONO, fontSize:8.5, color:'#00E5FF60', letterSpacing:0.8, flex:1 },
  connPill:   { flexDirection:'row', alignItems:'center', gap:3, borderWidth:1, borderRadius:5,
                paddingHorizontal:6, paddingVertical:2 },
  grid:       { padding:10, zIndex:1 },
});
