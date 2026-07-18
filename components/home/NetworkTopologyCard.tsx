/**
 * NetworkTopologyCard — Animated LAN device discovery map
 *
 * Scans the local subnet for Butler servers (using existing lanScanner service)
 * and renders them as an animated force-graph of nodes connected by glowing edges.
 * Each node shows IP, latency, and server version. Tap to select and connect.
 *
 * This is new code with no equivalent anywhere else in the app.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Platform, Dimensions, ActivityIndicator, ScrollView, Pressable,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fastProbeLastKnown, FoundServer } from '@/services/lanScanner';
import { serverConnection } from '@/services/serverConnection';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SW } = Dimensions.get('window');

const C = {
  bg:     '#010608',
  surf:   '#060E1A',
  surf2:  '#08121E',
  cyan:   '#00E5FF',
  green:  '#00FF88',
  amber:  '#FFB020',
  red:    '#FF3344',
  purple: '#CC44FF',
  teal:   '#00FFCC',
  blue:   '#4488FF',
  pink:   '#FF44AA',
  mid:    '#5A7A96',
  dim:    '#1A2E44',
  text:   '#C8E4F0',
};

const CANVAS_W = SW - 32;
const CANVAS_H = 180;
const NODE_R   = 18;

// ── Fixed node positions (phone is always center-top) ──────────────
const PHONE_POS = { x: CANVAS_W / 2, y: 28 };
const SLOT_POSITIONS = [
  { x: CANVAS_W * 0.15, y: 100 },
  { x: CANVAS_W * 0.40, y: 120 },
  { x: CANVAS_W * 0.65, y: 100 },
  { x: CANVAS_W * 0.85, y: 130 },
  { x: CANVAS_W * 0.10, y: 155 },
  { x: CANVAS_W * 0.50, y: 158 },
];
const NODE_COLORS = [C.cyan, C.green, C.teal, C.purple, C.amber, C.pink];

// ── Animated server node ────────────────────────────────────────────
function ServerNode({ server, pos, color, isSelected, isConnected, onPress }: {
  server: FoundServer;
  pos: { x: number; y: number };
  color: string;
  isSelected: boolean;
  isConnected: boolean;
  onPress: () => void;
}) {
  const pulseA = useRef(new Animated.Value(0.5)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1,   duration: 800 + Math.random() * 400, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 0.3, duration: 800 + Math.random() * 400, useNativeDriver: true }),
    ]));
    pulse.start(); return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (isSelected) {
      Animated.spring(scaleA, { toValue: 1.2, useNativeDriver: true, tension: 80, friction: 8 }).start();
    } else {
      Animated.spring(scaleA, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    }
  }, [isSelected]);

  const latColor = server.latencyMs < 30 ? C.green : server.latencyMs < 100 ? C.amber : C.red;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        left: pos.x - NODE_R,
        top: pos.y - NODE_R,
        width: NODE_R * 2,
        height: NODE_R * 2,
      }}
    >
      <Animated.View style={{
        width: NODE_R * 2, height: NODE_R * 2, borderRadius: NODE_R,
        borderWidth: isSelected ? 2.5 : 1.5,
        borderColor: color,
        backgroundColor: color + (isSelected ? '22' : '10'),
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: scaleA }],
        ...Platform.select({
          ios: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: isSelected ? 0.9 : 0.5, shadowRadius: isSelected ? 10 : 5 },
          android: {},
        }),
      }}>
        <Animated.View style={{ opacity: pulseA }}>
          <MaterialCommunityIcons name="server-network" size={14} color={color} />
        </Animated.View>
        {/* Latency dot */}
        <View style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 9, height: 9, borderRadius: 5,
          backgroundColor: latColor, borderWidth: 1.5, borderColor: C.bg,
        }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Animated phone node (always present) ───────────────────────────
function PhoneNode({ isConn }: { isConn: boolean }) {
  const glowA = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 1200, useNativeDriver: true }),
      Animated.timing(glowA, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  const col = isConn ? C.green : C.mid;
  return (
    <View style={{
      position: 'absolute',
      left: PHONE_POS.x - NODE_R * 1.2,
      top:  PHONE_POS.y - NODE_R * 1.2,
      width: NODE_R * 2.4, height: NODE_R * 2.4, borderRadius: NODE_R * 1.2,
      borderWidth: 2, borderColor: col,
      backgroundColor: col + '14',
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({ ios: { shadowColor: col, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 12 }, android: {} }),
    }}>
      <Animated.View style={{ opacity: glowA }}>
        <MaterialIcons name="smartphone" size={18} color={col} />
      </Animated.View>
    </View>
  );
}

// ── Animated edge (line between phone and server) ────────────────
function NetworkEdge({ from, to, color, active }: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  active: boolean;
}) {
  const packetA = useRef(new Animated.Value(0)).current;
  const opacA   = useRef(new Animated.Value(active ? 0.7 : 0.2)).current;

  useEffect(() => {
    Animated.timing(opacA, { toValue: active ? 0.7 : 0.2, duration: 400, useNativeDriver: true }).start();
    if (active) {
      const l = Animated.loop(Animated.sequence([
        Animated.timing(packetA, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(packetA, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(300),
      ]));
      l.start(); return () => l.stop();
    }
  }, [active]);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;

  const packetX = packetA.interpolate({ inputRange: [0, 1], outputRange: [from.x - 3, to.x - 3] });
  const packetY = packetA.interpolate({ inputRange: [0, 1], outputRange: [from.y - 3, to.y - 3] });
  const packetOp = packetA.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <>
      {/* Edge line */}
      <Animated.View pointerEvents="none" style={{
        position: 'absolute',
        left: mx - len / 2,
        top: my - 1,
        width: Math.round(len),
        height: 1.5,
        backgroundColor: color,
        opacity: opacA,
        transform: [{ rotate: `${angle}deg` }],
        borderRadius: 1,
      }} />
      {/* Packet dot */}
      {active && (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute',
          left: packetX,
          top: packetY,
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: color,
          opacity: packetOp,
        }} />
      )}
    </>
  );
}

// ── Server info card (shown on tap) ───────────────────────────────
function ServerInfoCard({ server, onConnect, onDismiss, isCurrentlyConnected }: {
  server: FoundServer;
  onConnect: () => void;
  onDismiss: () => void;
  isCurrentlyConnected: boolean;
}) {
  const version = server.info?.version ?? '?';
  const hasOllama = server.info?.ollama;
  const latColor = server.latencyMs < 30 ? C.green : server.latencyMs < 100 ? C.amber : C.red;

  return (
    <View style={nic.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name="server-network" size={14} color={C.cyan} />
        <Text style={nic.ip}>{server.ip}:{server.port}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={14} color={C.mid} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
        <View style={[nic.badge, { borderColor: latColor + '45', backgroundColor: latColor + '0A' }]}>
          <Text style={[nic.badgeTxt, { color: latColor }]}>{server.latencyMs}ms</Text>
        </View>
        {version !== '?' && (
          <View style={[nic.badge, { borderColor: C.purple + '40' }]}>
            <Text style={[nic.badgeTxt, { color: C.purple }]}>v{version}</Text>
          </View>
        )}
        {hasOllama && (
          <View style={[nic.badge, { borderColor: C.teal + '40', backgroundColor: C.teal + '0A' }]}>
            <MaterialCommunityIcons name="brain" size={9} color={C.teal} />
            <Text style={[nic.badgeTxt, { color: C.teal }]}>OLLAMA</Text>
          </View>
        )}
        {isCurrentlyConnected && (
          <View style={[nic.badge, { borderColor: C.green + '45', backgroundColor: C.green + '0A' }]}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.green }} />
            <Text style={[nic.badgeTxt, { color: C.green }]}>CONNECTED</Text>
          </View>
        )}
      </View>
      {!isCurrentlyConnected && (
        <Pressable onPress={onConnect} style={({ pressed }) => [nic.connectBtn, pressed && { opacity: 0.75 }]}>
          <MaterialIcons name="link" size={13} color="#000" />
          <Text style={nic.connectTxt}>CONNECT TO THIS SERVER</Text>
        </Pressable>
      )}
    </View>
  );
}

const nic = StyleSheet.create({
  card:       { backgroundColor: C.surf2, borderWidth: 1, borderColor: C.cyan + '30', borderRadius: 10, padding: 11, marginTop: 8 },
  ip:         { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: C.text },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.cyan, borderRadius: 8, paddingVertical: 10, marginTop: 10 },
  connectTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000' },
});

// ── Main component ─────────────────────────────────────────────────
export function NetworkTopologyCard({ isConnected, onConnected }: {
  isConnected: boolean;
  onConnected?: () => void;
}) {
  const [servers,    setServers]    = useState<FoundServer[]>([]);
  const [scanning,   setScanning]   = useState(false);
  const [selected,   setSelected]   = useState<FoundServer | null>(null);
  const [scanPhase,  setScanPhase]  = useState<'idle' | 'fast' | 'done'>('idle');
  const [lastScan,   setLastScan]   = useState(0);
  const [connecting, setConnecting] = useState(false);
  const glowA    = useRef(new Animated.Value(0.4)).current;
  const abortRef = useRef({ aborted: false });

  const connectedIP = serverConnection.getIP?.() ?? '';

  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,   duration: 2000, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
    ]));
    l.start();
    // Auto-scan on mount (fast probe only)
    startScan();
    return () => { l.stop(); abortRef.current.aborted = true; };
  }, []);

  const startScan = useCallback(async () => {
    if (scanning) return;
    abortRef.current = { aborted: false };
    setScanning(true); setScanPhase('fast'); setServers([]);
    haptics.medium();

    try {
      const found = await fastProbeLastKnown(srv => {
        setServers(prev => {
          const exists = prev.some(s => s.ip === srv.ip && s.port === srv.port);
          return exists ? prev : [...prev, srv];
        });
      });

      if (!found && !abortRef.current.aborted) {
        // Try a quick targeted scan
        const { quickScan } = await import('@/services/lanScanner');
        await quickScan(progress => {
          if (progress.found.length > 0) {
            setServers(progress.found);
          }
        }, abortRef.current);
      }
    } catch {}

    setScanning(false); setScanPhase('done'); setLastScan(Date.now());
  }, [scanning]);

  const handleConnect = useCallback(async (srv: FoundServer) => {
    if (connecting) return;
    setConnecting(true); haptics.heavy();
    try {
      const r = await (serverConnection as any).connectManual?.(srv.ip, String(srv.port));
      if (r?.success) {
        haptics.success();
        onConnected?.();
      }
    } catch {}
    setConnecting(false); setSelected(null);
  }, [connecting, onConnected]);

  const borderC = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [C.cyan + '25', C.cyan + '60'] });

  return (
    <Animated.View style={[ntc.outer, { borderColor: borderC }]}>
      {/* Stripe */}
      <View style={{ height: 2.5, flexDirection: 'row' }}>
        {[C.cyan, C.teal, C.green, C.purple, C.blue].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      {/* Header */}
      <View style={ntc.hdr}>
        <MaterialCommunityIcons name="lan" size={12} color={C.teal} />
        <Text style={ntc.hdrTxt}>LAN TOPOLOGY</Text>
        {servers.length > 0 && (
          <View style={[ntc.countBadge, { borderColor: C.teal + '45', backgroundColor: C.teal + '0A' }]}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: C.teal, fontWeight: '900' }}>
              {servers.length} SERVER{servers.length !== 1 ? 'S' : ''} FOUND
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {lastScan > 0 && (
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: C.mid }}>
            {Math.round((Date.now() - lastScan) / 1000)}s ago
          </Text>
        )}
        <TouchableOpacity onPress={startScan} disabled={scanning}
          style={[ntc.scanBtn, { borderColor: C.teal + '50' }]} activeOpacity={0.75}>
          {scanning ? (
            <ActivityIndicator size="small" color={C.teal} style={{ transform: [{ scale: 0.7 }] }} />
          ) : (
            <MaterialIcons name="radar" size={13} color={C.teal} />
          )}
          <Text style={{ fontFamily: MONO, fontSize: 8, color: C.teal, fontWeight: '900' }}>
            {scanning ? 'SCAN…' : 'RESCAN'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={[ntc.canvas, { height: CANVAS_H }]}>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <View key={f} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: f * CANVAS_H, height: 1, backgroundColor: C.cyan + '06' }} />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map(f => (
          <View key={f} pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: f * CANVAS_W, width: 1, backgroundColor: C.cyan + '05' }} />
        ))}

        {/* Edges from phone to each server */}
        {servers.slice(0, 6).map((srv, i) => (
          <NetworkEdge
            key={`${srv.ip}:${srv.port}`}
            from={PHONE_POS}
            to={SLOT_POSITIONS[i] ?? SLOT_POSITIONS[0]}
            color={NODE_COLORS[i % NODE_COLORS.length]}
            active={srv.ip === connectedIP || selected?.ip === srv.ip}
          />
        ))}

        {/* Phone node */}
        <PhoneNode isConn={isConnected} />

        {/* Server nodes */}
        {servers.slice(0, 6).map((srv, i) => (
          <ServerNode
            key={`${srv.ip}:${srv.port}`}
            server={srv}
            pos={SLOT_POSITIONS[i] ?? SLOT_POSITIONS[0]}
            color={NODE_COLORS[i % NODE_COLORS.length]}
            isSelected={selected?.ip === srv.ip && selected?.port === srv.port}
            isConnected={srv.ip === connectedIP}
            onPress={() => {
              haptics.light();
              setSelected(prev => (prev?.ip === srv.ip && prev.port === srv.port ? null : srv));
            }}
          />
        ))}

        {/* Empty/scanning state overlay */}
        {servers.length === 0 && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
            {scanning ? (
              <>
                <ActivityIndicator color={C.cyan} />
                <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid }}>SCANNING LAN FOR BUTLER SERVERS…</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="server-off" size={28} color={C.dim} />
                <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid }}>No servers found — tap RESCAN</Text>
              </>
            )}
          </View>
        )}

        {/* Currently connected indicator */}
        <View style={{ position: 'absolute', top: 4, right: 6 }}>
          <View style={[ntc.connBadge, { borderColor: (isConnected ? C.green : C.red) + '45', backgroundColor: (isConnected ? C.green : C.red) + '0A' }]}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isConnected ? C.green : C.red }} />
            <Text style={{ fontFamily: MONO, fontSize: 7.5, color: isConnected ? C.green : C.red, fontWeight: '900' }}>
              {isConnected ? 'PAIRED' : 'UNPAIRED'}
            </Text>
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={ntc.legend}>
        {[
          { col: C.green,  lbl: '< 30ms' },
          { col: C.amber,  lbl: '< 100ms' },
          { col: C.red,    lbl: '> 100ms' },
        ].map(({ col, lbl }) => (
          <View key={lbl} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col }} />
            <Text style={{ fontFamily: MONO, fontSize: 7, color: C.mid }}>{lbl}</Text>
          </View>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: MONO, fontSize: 7, color: C.dim }}>Tap node to connect</Text>
      </View>

      {/* Selected server info card */}
      {selected && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <ServerInfoCard
            server={selected}
            onConnect={() => handleConnect(selected)}
            onDismiss={() => setSelected(null)}
            isCurrentlyConnected={selected.ip === connectedIP}
          />
        </View>
      )}
    </Animated.View>
  );
}

const ntc = StyleSheet.create({
  outer:      { backgroundColor: C.surf, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 14,
    ...Platform.select({ ios: { shadowColor: C.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 14 }, android: { elevation: 6 } }) },
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 10 },
  hdrTxt:     { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.teal, letterSpacing: 1 },
  countBadge: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  scanBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  canvas:     { backgroundColor: C.bg, marginHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.cyan + '18', overflow: 'hidden', position: 'relative' },
  legend:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  connBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
});

export default NetworkTopologyCard;
