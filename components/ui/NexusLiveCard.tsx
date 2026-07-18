/**
 * NexusLiveCard — Reusable premium floating stats ticker + mini sparkline v2.0
 * Used across multiple tabs as a compact live-data widget
 * Works offline (shows '--' values gracefully)
 * v2: animated count-up numbers, trend arrows, icon support per stat
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, Animated, TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

export interface NexusLiveCardStat {
  label: string;
  value: string | number;
  color: string;
  icon?: string;
  trend?: 'up' | 'down' | 'flat';   // shows a trend arrow
  prevValue?: number;                // used for count-up animation
}

interface NexusLiveCardProps {
  title: string;
  subtitle?: string;
  accent: string;
  isLive?: boolean;
  liveLabel?: string;
  stats: NexusLiveCardStat[];
  sparkPoints?: number[];
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
  iconName?: string;    // MaterialIcons icon for the card header
  actionLabel?: string; // optional CTA text at bottom
  onAction?: () => void;
}

function MiniSparkline({ points, color, height = 32 }: {
  points: number[]; color: string; height?: number;
}) {
  if (points.length < 2) return null;
  const maxPt = Math.max(...points, 1);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, flex: 1 }}>
      {points.map((pt, i) => {
        const barH = Math.max(2, (pt / maxPt) * (height - 4));
        const isLast = i === points.length - 1;
        return (
          <View key={i} style={[{
            flex: 1, borderRadius: 1.5,
            backgroundColor: color,
            height: barH,
            opacity: isLast ? 1 : 0.25 + (i / points.length) * 0.6,
          }, Platform.OS === 'ios' && isLast
            ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5 }
            : {}]} />
        );
      })}
    </View>
  );
}

// ── Animated count-up stat value ─────────────────────────────────
function AnimatedStatValue({ value, color, prevValue }: { value: string | number; color: string; prevValue?: number }) {
  const numericVal = typeof value === 'number' ? value : null;
  const anim = useRef(new Animated.Value(prevValue ?? 0)).current;
  const [display, setDisplay] = useState(numericVal ?? 0);

  useEffect(() => {
    if (numericVal === null) return;
    const start = prevValue ?? 0;
    anim.setValue(start);
    const animation = Animated.timing(anim, {
      toValue: numericVal,
      duration: 900,
      useNativeDriver: false,
    });
    animation.start();
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => {
      anim.removeListener(listener);
      animation.stop();
    };
  }, [numericVal]);

  if (numericVal !== null) {
    return <Text style={[s.statVal, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{display}</Text>;
  }
  return <Text style={[s.statVal, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{String(value)}</Text>;
}

export function NexusLiveCard({
  title, subtitle, accent, isLive = false, liveLabel = 'LIVE',
  stats, sparkPoints = [], onPress, badge, badgeColor,
  iconName, actionLabel, onAction,
}: NexusLiveCardProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const shimmer   = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    const shim = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 2, duration: 3200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(shimmer, { toValue: -1, duration: 0, useNativeDriver: true }),
    ]));
    pulse.start();
    shim.start();
    return () => { pulse.stop(); shim.stop(); };
  }, []);

  const Wrap: any = onPress ? TouchableOpacity : View;
  const wrapProps = onPress ? { onPress, activeOpacity: 0.88 } : {};

  return (
    <Wrap {...wrapProps} style={[s.card, { borderColor: accent + '35' }]}>
      {/* Top accent bar */}
      <View style={[s.topBar, { backgroundColor: accent }]} />
      {/* Shimmer sweep */}
      <Animated.View pointerEvents="none" style={[s.shimmer, {
        transform: [{ translateX: shimmer.interpolate({ inputRange: [-1, 2], outputRange: [-120, 360] }) }],
        backgroundColor: accent + '12',
      }]} />
      {/* Corner brackets */}
      {[
        { top: 4, left: 4, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
        { top: 4, right: 4, borderTopWidth: 1.5, borderRightWidth: 1.5 },
        { bottom: 4, left: 4, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
        { bottom: 4, right: 4, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
      ].map((c: any, i) => (
        <View key={i} style={[s.corner, { borderColor: accent + '60', ...c }]} />
      ))}

      {/* Header row */}
      <View style={s.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {iconName ? (
            <View style={[s.iconBox, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
              <MaterialIcons name={iconName as any} size={14} color={accent} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: '#D2E8F6' }]}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {badge ? (
            <View style={[s.badge, { borderColor: (badgeColor || accent) + '60', backgroundColor: (badgeColor || accent) + '12' }]}>
              <Text style={[s.badgeTxt, { color: badgeColor || accent }]}>{badge}</Text>
            </View>
          ) : null}
          <View style={[s.livePill, { borderColor: (isLive ? '#00FF88' : accent) + '55', backgroundColor: (isLive ? '#00FF88' : accent) + '0C' }]}>
            <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isLive ? '#00FF88' : accent, opacity: pulseAnim }} />
            <Text style={[s.liveTxt, { color: isLive ? '#00FF88' : accent }]}>{isLive ? liveLabel : 'OFF'}</Text>
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={s.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={[s.statCell, i < stats.length - 1 && { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AnimatedStatValue value={stat.value} color={stat.color} prevValue={stat.prevValue} />
              {stat.trend ? (
                <MaterialIcons
                  name={stat.trend === 'up' ? 'trending-up' : stat.trend === 'down' ? 'trending-down' : 'trending-flat'}
                  size={14}
                  color={stat.trend === 'up' ? '#00FF88' : stat.trend === 'down' ? '#FF3131' : '#6890A8'}
                />
              ) : null}
            </View>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Mini sparkline */}
      {sparkPoints.length > 2 ? (
        <View style={s.sparkWrap}>
          <MiniSparkline points={sparkPoints} color={accent} height={28} />
        </View>
      ) : null}

      {/* Optional CTA button */}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.82}
          style={[s.ctaBtn, { borderColor: accent + '50', backgroundColor: accent + '0C' }]}
        >
          <MaterialIcons name="bolt" size={12} color={accent} />
          <Text style={[s.ctaTxt, { color: accent }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

      {onPress ? (
        <View style={[s.arrow, { borderColor: accent + '40', backgroundColor: accent + '08' }]}>
          <MaterialIcons name="chevron-right" size={12} color={accent} />
        </View>
      ) : null}
    </Wrap>
  );
}

// ─── COMPACT METRIC PILL ROW ──────────────────────────────────────
export interface MetricPill {
  label: string;
  value: string;
  color: string;
  icon?: string;
}

export function NexusMetricPillRow({ pills }: { pills: MetricPill[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {pills.map((p, i) => (
        <View key={i} style={[pill.wrap, { borderColor: p.color + '45', backgroundColor: p.color + '08' }]}>
          {p.icon ? <MaterialIcons name={p.icon as any} size={10} color={p.color} /> : null}
          <Text style={[pill.val, { color: p.color }]}>{p.value}</Text>
          <Text style={pill.label}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  val:   { fontFamily: MONO, fontSize: 12, fontWeight: '900' },
  label: { fontFamily: MONO, fontSize: 8, color: '#6890A8', letterSpacing: 0.5 },
});

// ─── STATUS BANNER ────────────────────────────────────────────────
export function NexusStatusBanner({
  connected, connectedText, offlineText, connColor = '#00FF88', offColor = '#FFB020',
}: {
  connected: boolean;
  connectedText: string;
  offlineText: string;
  connColor?: string;
  offColor?: string;
}) {
  const color = connected ? connColor : offColor;
  return (
    <View style={[banner.wrap, { borderColor: color + '35', backgroundColor: color + '07' }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={[banner.txt, { color }]}>{connected ? connectedText : offlineText}</Text>
    </View>
  );
}

const banner = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  txt:  { fontFamily: MONO, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

const s = StyleSheet.create({
  card:       { backgroundColor: '#070D16', borderRadius: 14, borderWidth: 1, overflow: 'hidden', position: 'relative',
    ...Platform.select({ ios:{ shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:12 }, android:{elevation:5} }) },
  topBar:     { height: 2.5 },
  shimmer:    { position: 'absolute', top: 0, bottom: 0, width: 80, transform: [{ skewX: '-18deg' }], zIndex: 0 },
  corner:     { position: 'absolute', width: 9, height: 9 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  title:      { fontFamily: MONO, fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },
  subtitle:   { fontFamily: MONO, fontSize: 9, color: '#6890A8', marginTop: 2, letterSpacing: 0.8 },
  badge:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  livePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  liveTxt:    { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  statsGrid:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  statCell:   { flex: 1, alignItems: 'flex-start', paddingHorizontal: 13, paddingVertical: 11 },
  statVal:    { fontFamily: MONO, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  statLabel:  { fontFamily: MONO, fontSize: 7.5, color: '#6890A8', letterSpacing: 1, marginTop: 3 },
  sparkWrap:  { paddingHorizontal: 13, paddingBottom: 10 },
  arrow:      { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBox:    { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ctaBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 13, marginBottom: 12, borderWidth: 1.5, borderRadius: 9, paddingVertical: 10 },
  ctaTxt:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
});
