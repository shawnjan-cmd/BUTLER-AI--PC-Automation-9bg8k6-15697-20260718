/**
 * Butler Memory Atlas — NexusMind Omega visual system.
 * Design philosophy: an instrument-panel memory core with one dominant focal
 * point, bracketed data rails, and a small robot-butler guide. Every count,
 * category, and signal is derived from supplied local knowledge data.
 */
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Line } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const BG = '#070A10';
const SURFACE = '#0B0F17';
const TEXT = '#DCE6F2';
const MID = '#71809A';
const CYAN = '#38D9E8';
const GREEN = '#2FE38A';
const AMBER = '#FFB43D';
const PURPLE = '#A468FF';

export type ButlerMemorySignal = {
  id: string;
  category: string;
  color: string;
  when: string;
  tags: string[];
};

type Props = {
  total: number;
  visible: number;
  starred: number;
  isConnected: boolean;
  queryActive: boolean;
  facts: ButlerMemorySignal[];
};

type CategoryRollup = { category: string; color: string; count: number };

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

function shortTag(signal: ButlerMemorySignal): string {
  return signal.tags.find(Boolean)?.slice(0, 12).toUpperCase() || signal.category.toUpperCase();
}

function ButlerMemoryAtlasInner({ total, visible, starred, isConnected, queryActive, facts }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 385;
  const reducedMotion = useReducedMotion();
  const orbit = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  const categories = useMemo<CategoryRollup[]>(() => {
    const map = new Map<string, CategoryRollup>();
    facts.forEach((fact) => {
      const current = map.get(fact.category);
      if (current) current.count += 1;
      else map.set(fact.category, { category: fact.category, color: fact.color, count: 1 });
    });
    return [...map.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)).slice(0, 5);
  }, [facts]);

  const recentSignals = useMemo(() => facts.slice(0, 3), [facts]);
  const orbitSize = compact ? 154 : 174;
  const center = orbitSize / 2;
  const coreSize = compact ? 72 : 80;
  const coreOffset = (orbitSize - coreSize) / 2;
  const orbitRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const coreScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  useEffect(() => {
    if (reducedMotion || facts.length === 0) {
      orbit.stopAnimation();
      breathe.stopAnimation();
      orbit.setValue(0);
      breathe.setValue(0);
      return;
    }
    const orbitLoop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 16_000, useNativeDriver: true }));
    const breatheLoop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1_400, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1_400, useNativeDriver: true }),
    ]));
    orbitLoop.start();
    breatheLoop.start();
    return () => {
      orbitLoop.stop();
      breatheLoop.stop();
    };
  }, [breathe, facts.length, orbit, reducedMotion]);

  const stateColor = isConnected ? GREEN : AMBER;
  const stateLabel = isConnected ? 'LOCAL SYNC AVAILABLE' : 'OFFLINE CACHE READY';
  const modeLabel = queryActive ? 'FILTER FOCUS' : facts.length ? 'LOCAL INDEX' : 'AWAITING FIRST MEMORY';

  return (
    <View style={[S.root, { borderColor: PURPLE + '68' }]}>
      <View pointerEvents="none" style={[S.topRail, { backgroundColor: PURPLE }]} />
      <View pointerEvents="none" style={[S.grid, { opacity: compact ? 0.34 : 0.48 }]} />

      <View style={S.headerRow}>
        <View style={S.titleGroup}>
          <View style={[S.eyebrow, { borderColor: PURPLE + '70', backgroundColor: PURPLE + '12' }]}>
            <MaterialCommunityIcons name="brain" size={11} color={PURPLE} />
            <Text style={[S.eyebrowText, { color: PURPLE }]}>BUTLER MEMORY ATLAS</Text>
          </View>
          <Text style={S.title}>LOCAL RECALL <Text style={{ color: PURPLE }}>CORE</Text></Text>
          <Text style={S.subtitle}>A visual index of stored findings — no cloud mirror, no invented signals.</Text>
        </View>
        <View style={S.mascotDock} accessible accessibilityLabel="Butler memory assistant">
          <Image source={require('@/assets/images/mascot_thinking.png')} contentFit="contain" cachePolicy="memory-disk" style={S.mascot} />
          <View style={[S.mascotLamp, { backgroundColor: stateColor }]} />
        </View>
      </View>

      <View style={S.coreRow}>
        <View style={[S.coreFrame, { width: orbitSize, height: orbitSize }]}>
          <View style={[S.crossHair, { left: center - 1, height: orbitSize }]} />
          <View style={[S.crossHairHorizontal, { top: center - 1, width: orbitSize }]} />
          <Animated.View style={[S.orbitLayer, { width: orbitSize, height: orbitSize, transform: [{ rotate: orbitRotation }] }]}>
            <Svg width={orbitSize} height={orbitSize}>
              <Circle cx={center} cy={center} r={orbitSize * 0.43} stroke={PURPLE + '56'} strokeWidth="1" fill="none" />
              <Circle cx={center} cy={center} r={orbitSize * 0.31} stroke={CYAN + '28'} strokeWidth="1" strokeDasharray="3 5" fill="none" />
              {categories.map((item, index) => {
                const angle = (index / Math.max(categories.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const radius = orbitSize * 0.43;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                return (
                  <React.Fragment key={item.category}>
                    <Line x1={center} y1={center} x2={x} y2={y} stroke={item.color + '5A'} strokeWidth="1" />
                    <Circle cx={x} cy={y} r={compact ? 5 : 6} fill={item.color + '20'} stroke={item.color} strokeWidth="1.4" />
                  </React.Fragment>
                );
              })}
            </Svg>
          </Animated.View>
          <Animated.View style={[S.core, { width: coreSize, height: coreSize, left: coreOffset, top: coreOffset, borderColor: (facts.length ? PURPLE : MID) + '88', transform: [{ scale: coreScale }] }]}>
            <MaterialCommunityIcons name="brain" size={compact ? 19 : 22} color={facts.length ? PURPLE : MID} />
            <Text style={[S.coreCount, { color: facts.length ? TEXT : MID }]}>{total}</Text>
            <Text style={[S.coreLabel, { color: facts.length ? PURPLE : MID }]}>MEMORIES</Text>
          </Animated.View>
        </View>

        <View style={S.signalColumn}>
          <View style={[S.statusCard, { borderColor: stateColor + '60', backgroundColor: stateColor + '0C' }]}>
            <View style={[S.statusDot, { backgroundColor: stateColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[S.statusLabel, { color: stateColor }]}>{stateLabel}</Text>
              <Text style={S.statusSub}>{isConnected ? 'Paired PC can add approved findings.' : 'Stored findings remain readable on this device.'}</Text>
            </View>
          </View>

          <View style={S.protocolBlock}>
            <Text style={[S.protocolEye, { color: CYAN }]}>MEMORY PROTOCOL</Text>
            {[
              ['1', 'CAPTURE', facts.length ? 'Stored finding retained' : 'No finding retained yet', facts.length ? GREEN : MID],
              ['2', 'FILTER', queryActive ? `${visible} matching view` : 'All local findings in view', queryActive ? AMBER : CYAN],
              ['3', 'RECALL', starred ? `${starred} pinned locally` : 'No local pins', starred ? AMBER : MID],
            ].map(([step, label, detail, color]) => (
              <View key={String(step)} style={S.protocolRow}>
                <Text style={[S.step, { color: String(color) }]}>{step}</Text>
                <View style={[S.stepLine, { backgroundColor: String(color) + '50' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[S.stepLabel, { color: String(color) }]}>{label}</Text>
                  <Text style={S.stepDetail}>{detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={S.metricRail}>
        {[
          { label: 'STORED', value: String(total), color: PURPLE, icon: 'database-lock-outline' },
          { label: 'VISIBLE', value: String(visible), color: CYAN, icon: 'eye-outline' },
          { label: 'PINNED', value: String(starred), color: AMBER, icon: 'star-outline' },
        ].map((metric, index) => (
          <React.Fragment key={metric.label}>
            {index > 0 && <View style={S.metricDivider} />}
            <View style={S.metricCell}>
              <MaterialCommunityIcons name={metric.icon as any} size={12} color={metric.color} />
              <Text style={[S.metricValue, { color: metric.color }]}>{metric.value}</Text>
              <Text style={S.metricLabel}>{metric.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={S.bottomRow}>
        <View style={[S.modeChip, { borderColor: PURPLE + '54', backgroundColor: PURPLE + '0C' }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={11} color={PURPLE} />
          <Text style={[S.modeText, { color: PURPLE }]}>{modeLabel}</Text>
        </View>
        <View style={S.signalStrip}>
          {recentSignals.length ? recentSignals.map((signal) => (
            <View key={signal.id} style={[S.signalChip, { borderColor: signal.color + '50', backgroundColor: signal.color + '0A' }]}>
              <View style={[S.signalDot, { backgroundColor: signal.color }]} />
              <Text style={[S.signalText, { color: signal.color }]}>{shortTag(signal)}</Text>
              <Text style={S.signalWhen}>{signal.when}</Text>
            </View>
          )) : (
            <Text style={S.emptySignal}>SAVE A LOCAL FACT OR APPROVE RESEARCH TO POPULATE THIS ATLAS.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export const ButlerMemoryAtlas = memo(ButlerMemoryAtlasInner);

const S = StyleSheet.create({
  root: { backgroundColor: SURFACE, borderWidth: 1.5, borderRadius: 17, padding: 13, overflow: 'hidden', gap: 13 },
  topRail: { position: 'absolute', top: 0, left: 22, right: 22, height: 2 },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, height: 210, borderBottomWidth: 1, borderBottomColor: PURPLE + '16' },
  headerRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', zIndex: 1 },
  titleGroup: { flex: 1, gap: 4 },
  eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  eyebrowText: { fontFamily: MONO, fontSize: 7.2, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: TEXT, fontFamily: MONO, fontSize: 15, fontWeight: '900', letterSpacing: 0.35 },
  subtitle: { color: MID, fontFamily: MONO, fontSize: 8.5, lineHeight: 13 },
  mascotDock: { width: 58, height: 62, marginTop: -7, borderLeftWidth: 1, borderLeftColor: PURPLE + '36', alignItems: 'flex-end', overflow: 'visible' },
  mascot: { width: 63, height: 70, marginTop: -4 },
  mascotLamp: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1, borderColor: BG, position: 'absolute', bottom: 5, right: 4 },
  coreRow: { flexDirection: 'row', gap: 12, alignItems: 'center', zIndex: 1 },
  coreFrame: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orbitLayer: { position: 'absolute', top: 0, left: 0 },
  crossHair: { position: 'absolute', top: 0, width: 1, backgroundColor: PURPLE + '18' },
  crossHairHorizontal: { position: 'absolute', left: 0, height: 1, backgroundColor: PURPLE + '18' },
  core: { position: 'absolute', borderRadius: 99, borderWidth: 1.5, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  coreCount: { fontFamily: MONO, fontWeight: '900', fontSize: 18, marginTop: 1 },
  coreLabel: { fontFamily: MONO, fontWeight: '900', fontSize: 6.5, letterSpacing: 0.8 },
  signalColumn: { flex: 1, minWidth: 0, gap: 9 },
  statusCard: { borderWidth: 1, borderRadius: 10, padding: 8, flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  statusLabel: { fontFamily: MONO, fontWeight: '900', fontSize: 7.5, letterSpacing: 0.35 },
  statusSub: { color: MID, fontFamily: MONO, fontSize: 7.2, marginTop: 3, lineHeight: 10.5 },
  protocolBlock: { gap: 6 },
  protocolEye: { fontFamily: MONO, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  protocolRow: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 23 },
  step: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', width: 8 },
  stepLine: { width: 8, height: 1 },
  stepLabel: { fontFamily: MONO, fontSize: 7.4, fontWeight: '900', letterSpacing: 0.2 },
  stepDetail: { color: MID, fontFamily: MONO, fontSize: 7.1, marginTop: 1 },
  metricRail: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 11, borderColor: CYAN + '26', backgroundColor: BG, overflow: 'hidden' },
  metricCell: { flex: 1, minWidth: 0, paddingVertical: 8, alignItems: 'center', gap: 2 },
  metricDivider: { width: 1, backgroundColor: CYAN + '1C', marginVertical: 7 },
  metricValue: { fontFamily: MONO, fontSize: 15, fontWeight: '900' },
  metricLabel: { color: MID, fontFamily: MONO, fontSize: 6.7, fontWeight: '900', letterSpacing: 0.6 },
  bottomRow: { gap: 8 },
  modeChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4 },
  modeText: { fontFamily: MONO, fontWeight: '900', fontSize: 7.2, letterSpacing: 0.45 },
  signalStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, minHeight: 20 },
  signalChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4 },
  signalDot: { width: 4, height: 4, borderRadius: 2 },
  signalText: { fontFamily: MONO, fontWeight: '900', fontSize: 6.8 },
  signalWhen: { color: MID, fontFamily: MONO, fontSize: 6.5 },
  emptySignal: { color: MID, fontFamily: MONO, fontSize: 7.2, lineHeight: 12, letterSpacing: 0.2 },
});
