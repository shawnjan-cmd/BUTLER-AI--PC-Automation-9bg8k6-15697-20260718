/**
 * NexusPageBanner v2 — Universal page header
 * • Centered title layout
 * • Larger hexagonal icon badge with animated rings
 * • Slow soft particle drift in accent color
 * • CPU/RAM/DISK metrics bar
 * • Lazy animation: particles only start after mount to avoid startup cost
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Platform, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { serverConnection } from '@/services/serverConnection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW = Math.max(1, (Dimensions.get('window').width || 375) || 375);

// ─── PARTICLE CONFIG ─────────────────────────────────────────────
const PARTICLE_COUNT = 10;

interface ParticleSeed {
  x: number; y: number; size: number; dur: number; delay: number;
  dx: number; dy: number;
}

function useParticleSeeds(count: number): ParticleSeed[] {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    x:     (i / count) * 0.9 + Math.random() * 0.1,
    y:     Math.random(),
    size:  2 + Math.random() * 3,
    dur:   7000 + Math.random() * 8000,          // 7–15s per cycle  ← very slow
    delay: Math.random() * 5000,
    dx:    (Math.random() - 0.5) * 0.12,         // tiny horizontal drift
    dy:    -0.08 - Math.random() * 0.08,          // gentle upward float
  })), []);
}

function SlowParticle({ seed, accent, containerH }: {
  seed: ParticleSeed; accent: string; containerH: number;
}) {
  const posY = useRef(new Animated.Value(seed.y)).current;
  const posX = useRef(new Animated.Value(seed.x)).current;
  const opa  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Each particle: fade in, drift up slowly, fade out, reset, repeat
    const runCycle = () => {
      posY.setValue(0.85 + Math.random() * 0.15);           // start near bottom
      posX.setValue(seed.x + (Math.random() - 0.5) * 0.15);
      opa.setValue(0);
      Animated.sequence([
        Animated.delay(seed.delay),
        Animated.parallel([
          Animated.timing(opa,  { toValue: 0.55, duration: 1200, useNativeDriver: false }),
          Animated.timing(posY, { toValue: 0.05 + Math.random() * 0.2, duration: seed.dur, useNativeDriver: false }),
          Animated.timing(posX, { toValue: seed.x + seed.dx, duration: seed.dur, useNativeDriver: false }),
        ]),
        Animated.timing(opa, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]).start(() => runCycle());
    };
    runCycle();
    return () => { posY.stopAnimation(); posX.stopAnimation(); opa.stopAnimation(); };
  }, []);

  const H = containerH || 72;
  const left = posX.interpolate({ inputRange: [0, 1], outputRange: [0, SW] });
  const top  = posY.interpolate({ inputRange: [0, 1], outputRange: [0, H] });

  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute',
      width: seed.size, height: seed.size, borderRadius: seed.size / 2,
      backgroundColor: accent,
      opacity: opa,
      left, top,
      ...Platform.select({ ios: { shadowColor: accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: seed.size * 2 }, android: {} }),
    }} />
  );
}

// ─── METRIC BAR SEGMENT ─────────────────────────────────────────
function MiniBar({ value, color, label }: { value: number; color: string; label: string }) {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: Math.min(1, Math.max(0, value / 100)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const col = value > 90 ? '#FF3131' : value > 75 ? '#FFB020' : color;
  const displayVal = value > 0 ? `${Math.round(value)}%` : '--';
  const TRACK = Math.max(36, (SW - 32 - 120) / 3);

  return (
    <View style={mb.wrap}>
      <Text style={[mb.label, { color: col }]}>{label}</Text>
      <View style={[mb.track, { width: TRACK }]}>
        <Animated.View style={[mb.fill, {
          width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any,
          backgroundColor: col,
        }]} />
        {[0.33, 0.66].map((f, i) => (
          <View key={i} style={[mb.grid, { left: `${f * 100}%` as any }]} />
        ))}
      </View>
      <Text style={[mb.val, { color: col }]}>{displayVal}</Text>
    </View>
  );
}

const mb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 8, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.8, width: 26, flexShrink: 0 },
  track: { height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'visible', position: 'relative', flexShrink: 0 },
  fill:  { height: '100%', borderRadius: 2 },
  grid:  { position: 'absolute', top: -2, width: 1, height: 7, backgroundColor: 'rgba(0,0,0,0.35)' },
  val:   { fontSize: 9, fontWeight: '900', fontFamily: MONO, width: 26, textAlign: 'right', flexShrink: 0 },
});

// ─── HEXAGONAL ICON BADGE ────────────────────────────────────────
// Unique shape: double-ring + animated outer glow + hex-clip illusion via borderRadius
function HexIconBadge({ icon, iconLib = 'material', accent, size = 56 }: {
  icon: string; iconLib?: 'material' | 'community'; accent: string; size?: number;
}) {
  const glowPulse  = useRef(new Animated.Value(0.4)).current;
  const spinAnim   = useRef(new Animated.Value(0)).current;
  const innerPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Lazy start: slight delay so it doesn't block first render
    const t = setTimeout(() => {
      const glow = Animated.loop(Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1,   duration: 2200, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 2200, useNativeDriver: false }),
      ]));
      // Slow orbit ring
      const spin = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 8000, useNativeDriver: false })
      );
      const inner = Animated.loop(Animated.sequence([
        Animated.timing(innerPulse, { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(innerPulse, { toValue: 0.4, duration: 1400, useNativeDriver: false }),
      ]));
      glow.start(); spin.start(); inner.start();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
  const R = size / 2;
  const outerR = R + 10;
  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: size + 24, height: size + 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {/* Outer glow ring — pulses */}
      <Animated.View style={{
        position: 'absolute',
        width: size + 22, height: size + 22, borderRadius: (size + 22) / 2,
        borderWidth: 1.5, borderColor: accent,
        opacity: glowPulse,
        ...Platform.select({ ios: { shadowColor: accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 18 }, android: {} }),
      }} />
      {/* Spinning dashed ring — rotates slowly */}
      <Animated.View style={{
        position: 'absolute',
        width: size + 14, height: size + 14, borderRadius: (size + 14) / 2,
        borderWidth: 1.5,
        borderColor: accent + '55',
        borderStyle: 'dashed',
        transform: [{ rotate: spinDeg }],
      }} />
      {/* Inner ring */}
      <Animated.View style={{
        position: 'absolute',
        width: size + 4, height: size + 4, borderRadius: (size + 4) / 2,
        borderWidth: 2, borderColor: accent + '70',
        opacity: innerPulse,
        ...Platform.select({ ios: { shadowColor: accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 }, android: {} }),
      }} />
      {/* Core badge — "hex" using large borderRadius + rotated corners */}
      <View style={{
        width: size, height: size,
        borderRadius: size * 0.28,          // quasi-hexagonal rounding
        backgroundColor: accent + '18',
        borderWidth: 2.5,
        borderColor: accent + '90',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.7, shadowRadius: 16 }, android: { elevation: 10 } }),
      }}>
        {/* Inner tint overlay */}
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: accent + '0C' }} />
        <Icon name={icon as any} size={Math.round(size * 0.5)} color={accent} />
        {/* Corner accent dots */}
        <View style={{ position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: accent + '90' }} />
        <View style={{ position: 'absolute', bottom: 4, left: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: accent + '60' }} />
      </View>
    </View>
  );
}

// ─── PROPS ──────────────────────────────────────────────────────
export interface NexusPageBannerProps {
  accent: string;
  accent2?: string;
  iconLib?: 'material' | 'community';
  icon: string;
  title: string;
  subtitle?: string;
  safeTop?: number;
  isConnected?: boolean;
  rightAction?: { icon: string; iconLib?: 'material' | 'community'; onPress: () => void; color?: string };
  rightAction2?: { icon: string; iconLib?: 'material' | 'community'; onPress: () => void; color?: string };
  badge?: string;
  badgeColor?: string;
  /** Per-tab themed accent row rendered below the metrics bar */
  themeExtra?: React.ReactNode;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export function NexusPageBanner({
  accent, accent2, iconLib = 'material', icon, title, subtitle,
  safeTop = 0, isConnected = false, rightAction, rightAction2,
  badge, badgeColor, themeExtra,
}: NexusPageBannerProps) {
  const [metrics, setMetrics] = useState({ cpu: 0, ram: 0, disk: 0 });
  const [containerH, setContainerH] = useState(0);
  const [particlesReady, setParticlesReady] = useState(false);

  const pulseAnim   = useRef(new Animated.Value(0.4)).current;
  const shimmerAnim = useRef(new Animated.Value(-SW)).current;

  const a2 = accent2 ?? accent;
  const particleSeeds = useParticleSeeds(PARTICLE_COUNT);

  // Lazy: start particles after banner has measured itself
  useEffect(() => {
    const t = setTimeout(() => setParticlesReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Status dot pulse
  useEffect(() => {
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 1100, useNativeDriver: false }),
    ]));
    p.start();
    return () => p.stop();
  }, []);

  // Shimmer sweep on accent bar
  useEffect(() => {
    const s = Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: SW + 60, duration: 2200, useNativeDriver: false }),
      Animated.timing(shimmerAnim, { toValue: -SW, duration: 0, useNativeDriver: false }),
      Animated.delay(3500),
    ]));
    s.start();
    return () => s.stop();
  }, []);

  // Poll metrics when connected
  useEffect(() => {
    if (!isConnected) { setMetrics({ cpu: 0, ram: 0, disk: 0 }); return; }
    const poll = async () => {
      try {
        const ip    = serverConnection.getIP?.();
        const port  = serverConnection.getPort?.();
        const token = serverConnection.getToken?.();
        if (!ip || !port) return;
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(`http://${ip}:${port}/api/metrics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
        });
        if (res.ok) {
          const d = await res.json();
          setMetrics({
            cpu:  d.cpu?.percent  ?? d.cpu_percent  ?? d.cpu  ?? 0,
            ram:  d.memory?.percent ?? d.ram_percent ?? d.ram ?? 0,
            disk: d.disk?.percent ?? d.disk_percent ?? d.disk ?? 0,
          });
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 6000);
    return () => clearInterval(t);
  }, [isConnected]);

  const connCol = isConnected ? '#00FF88' : '#FF3131';
  const ramColor = accent === '#00FF88' ? '#FFB020'
    : accent === '#FFB020' ? '#00FF88'
    : accent === '#9B40FF' ? '#00DCFF'
    : accent === '#FF6EB4' ? '#FFB020'
    : '#FFB020';

  return (
    <View
      style={[st.root, { paddingTop: safeTop }]}
      onLayout={e => setContainerH(e.nativeEvent.layout.height)}
    >
      {/* ── Slow soft accent particles (lazy) ── */}
      {particlesReady && particleSeeds.map((seed, i) => (
        <SlowParticle key={i} seed={seed} accent={accent} containerH={containerH} />
      ))}

      {/* ── Top accent line with shimmer ── */}
      <View style={[st.accentLine, { backgroundColor: accent }]}>
        <Animated.View pointerEvents="none"
          style={[st.shimmer, { transform: [{ translateX: shimmerAnim }] }]} />
      </View>

      {/* ── CENTERED MAIN HEADER ── */}
      <View style={st.mainSection}>
        {/* Left action slot (width-matched to right for centering) */}
        <View style={st.sideSlot}>
          {rightAction2 ? (
            <TouchableOpacity
              onPress={rightAction2.onPress}
              style={[st.actionBtn, { borderColor: (rightAction2.color ?? a2) + '50', backgroundColor: (rightAction2.color ?? a2) + '10' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {rightAction2.iconLib === 'community'
                ? <MaterialCommunityIcons name={rightAction2.icon as any} size={17} color={rightAction2.color ?? a2} />
                : <MaterialIcons name={rightAction2.icon as any} size={17} color={rightAction2.color ?? a2} />}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Center: icon + title + subtitle */}
        <View style={st.centerBlock}>
          <HexIconBadge icon={icon} iconLib={iconLib} accent={accent} size={54} />
          <View style={{ alignItems: 'center', gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
              <Text style={[st.title, { color: '#FFFFFF' }]}>{title}</Text>
              {badge ? (
                <View style={[st.badge, { borderColor: (badgeColor ?? accent) + '60', backgroundColor: (badgeColor ?? accent) + '14' }]}>
                  <Text style={[st.badgeTxt, { color: badgeColor ?? accent }]}>{badge}</Text>
                </View>
              ) : null}
            </View>
            {subtitle ? (
              <Text style={[st.subtitle, { color: accent + 'AA' }]}>{subtitle}</Text>
            ) : null}
            {/* Accent underline */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 20, height: 1.5, borderRadius: 1, backgroundColor: accent + '40' }} />
              <View style={{ width: 6, height: 3, borderRadius: 1.5, backgroundColor: accent + '80' }} />
              <View style={{ width: 20, height: 1.5, borderRadius: 1, backgroundColor: accent + '40' }} />
            </View>
          </View>
        </View>

        {/* Right action slot */}
        <View style={[st.sideSlot, { alignItems: 'flex-end' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {rightAction ? (
              <TouchableOpacity
                onPress={rightAction.onPress}
                style={[st.actionBtn, { borderColor: (rightAction.color ?? accent) + '50', backgroundColor: (rightAction.color ?? accent) + '10' }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {rightAction.iconLib === 'community'
                  ? <MaterialCommunityIcons name={rightAction.icon as any} size={17} color={rightAction.color ?? accent} />
                  : <MaterialIcons name={rightAction.icon as any} size={17} color={rightAction.color ?? accent} />}
              </TouchableOpacity>
            ) : null}
            <Animated.View style={[st.connDot, { backgroundColor: connCol, opacity: pulseAnim }]} />
          </View>
        </View>
      </View>

      {/* ── CPU / RAM / DISK metrics bar ── */}
      <View style={[st.metricsBar, { borderTopColor: accent + '18' }]}>
        <MiniBar value={metrics.cpu}  color={accent}        label="CPU"  />
        <View style={[st.divider, { backgroundColor: accent + '25' }]} />
        <MiniBar value={metrics.ram}  color={ramColor}      label="RAM"  />
        <View style={[st.divider, { backgroundColor: accent + '25' }]} />
        <MiniBar value={metrics.disk} color={accent + 'BB'} label="DISK" />
        <View style={{ flex: 1 }} />
        <View style={[st.liveBadge, { borderColor: connCol + '50', backgroundColor: connCol + '0C' }]}>
          <MaterialIcons name={isConnected ? 'wifi' : 'wifi-off'} size={8} color={connCol} />
          <Text style={[st.liveTxt, { color: connCol }]}>{isConnected ? 'LIVE' : 'OFF'}</Text>
        </View>
      </View>

      {/* ── Per-tab themed extra row ── */}
      {themeExtra ? (
        <View style={{ borderTopWidth: 1, borderTopColor: accent + '18' }}>
          {themeExtra}
        </View>
      ) : null}

      {/* ── Bottom HUD line ── */}
      <View style={[st.hudLine, { backgroundColor: accent + '22' }]} />
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    backgroundColor: '#030810',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,220,255,0.18)',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#00DCFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  accentLine: { height: 3, overflow: 'hidden' },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ skewX: '-18deg' }],
  },
  // CENTER LAYOUT
  mainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sideSlot: {
    width: 80,                    // fixed width so center is truly centered
    justifyContent: 'center',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 1,
    textAlign: 'center',
  },
  badge: {
    borderWidth: 1.5, borderRadius: 7,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  badgeTxt: {
    fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6,
  },
  connDot: {
    width: 9, height: 9, borderRadius: 5, flexShrink: 0,
    ...Platform.select({
      ios: { shadowColor: '#00FF88', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 7 },
      android: {},
    }),
  },
  actionBtn: {
    width: 36, height: 36, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#00DCFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: {},
    }),
  },
  metricsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7,
    borderTopWidth: 1, backgroundColor: '#020608',
  },
  divider: { width: 1, height: 14, flexShrink: 0 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1.5, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4,
  },
  liveTxt: { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  hudLine: { height: 2 },
});
