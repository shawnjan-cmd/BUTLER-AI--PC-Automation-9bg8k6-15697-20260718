/**
 * BUTLER AI — CoreSurfaces Component
 * 3×3 surface launcher: dark navy cards with hairline borders + hex banner
 */

import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';

const { width: SW_RAW } = Dimensions.get('window');
const SW = Math.max(320, SW_RAW);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const PAD = 16;

const C = {
  bg:     '#020509',
  surf:   '#060E18',
  surf2:  '#091422',
  cyan:   '#00D4F0',
  green:  '#00E880',
  amber:  '#FFB020',
  purple: '#C055FF',
  blue:   '#4890FF',
  teal:   '#00C8A8',
  red:    '#FF3A5A',
  pink:   '#FF60A0',
  text:   '#C8E2F4',
  mid:    '#486880',
  dim:    '#162230',
  border: 'rgba(0,212,240,0.10)',
};

const SURFACES = [
  { icon: 'robot-happy-outline',    color: C.cyan,   label: 'Chat',     sub: 'Local AI',     tab: 'butler'    },
  { icon: 'auto-fix',               color: C.green,  label: 'Flows',    sub: 'Pipelines',    tab: 'builder'   },
  { icon: 'code-braces',            color: C.amber,  label: 'Scripts',  sub: '250+ Python',  tab: 'scripts'   },
  { icon: 'brain',                  color: C.purple, label: 'Knowledge',sub: 'Neural KB',    tab: 'knowledge' },
  { icon: 'folder-network-outline', color: C.pink,   label: 'Files',    sub: 'LAN vault',    tab: 'fileshare' },
  { icon: 'chart-bar',              color: C.blue,   label: 'Logs',     sub: 'Intel feed',   tab: 'logs'      },
  { icon: 'desktop-tower-monitor',  color: C.teal,   label: 'PC',       sub: 'Remote ctrl',  tab: 'connect'   },
  { icon: 'palette-swatch-outline', color: C.pink,   label: 'Theme',    sub: 'Cosmetics',    tab: 'cosmetic'  },
  { icon: 'tune-variant',           color: C.mid,    label: 'System',   sub: 'Config · CFG', tab: 'settings'  },
];

// ── Hex banner ────────────────────────────────────────────────────
function HexBanner() {
  const HEXES = Array.from({ length: 11 }, (_, i) => i);
  const colors = [C.cyan, C.green, C.amber, C.purple, C.blue, C.teal, C.pink, C.cyan, C.green, C.amber, C.purple];
  return (
    <View style={{ height: 5, flexDirection: 'row', gap: 2, overflow: 'hidden', marginBottom: 10, paddingHorizontal: 2 }}>
      {HEXES.map((_, i) => (
        <View key={i} style={{ flex: 1, height: 5, borderRadius: 2, backgroundColor: colors[i % colors.length] + '70' }} />
      ))}
    </View>
  );
}

// ── Single surface tile ───────────────────────────────────────────
interface SurfaceProps {
  item: typeof SURFACES[0];
  onPress: () => void;
}

function SurfaceTile({ item, onPress }: SurfaceProps) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const glowA  = useRef(new Animated.Value(0)).current;

  const pi = () => {
    Animated.parallel([
      Animated.spring(scaleA, { toValue: 0.90, tension: 420, friction: 12, useNativeDriver: true }),
      Animated.timing(glowA,  { toValue: 1, duration: 80, useNativeDriver: false }),
    ]).start();
  };
  const po = () => {
    Animated.parallel([
      Animated.spring(scaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
      Animated.timing(glowA,  { toValue: 0, duration: 280, useNativeDriver: false }),
    ]).start();
  };

  const TILE_W = (SW - PAD * 2 - 8 * 2) / 3;

  return (
    <Animated.View style={{ width: TILE_W, transform: [{ scale: scaleA }] }}>
      <TouchableOpacity
        onPress={() => { haptics.light(); onPress(); }}
        onPressIn={pi} onPressOut={po}
        activeOpacity={1}
        style={[tile.outer, {
          borderColor: item.color + '28',
          borderTopColor: item.color,
          ...Platform.select({
            ios: { shadowColor: item.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },
            android: { elevation: 3 },
          }),
        }]}>
        {/* Top accent line */}
        <View style={[tile.topAccent, { backgroundColor: item.color }]} />

        {/* Corner bracket */}
        <View style={tile.cornerTL} />

        {/* Icon */}
        <Animated.View style={[tile.iconBox, {
          borderColor: item.color + '55',
          backgroundColor: glowA.interpolate({ inputRange: [0, 1], outputRange: [item.color + '10', item.color + '25'] }),
        }]}>
          <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
        </Animated.View>

        {/* Labels */}
        <Text style={[tile.label, { color: item.color + 'CC' }]}>{item.label}</Text>
        <Text style={tile.sub} numberOfLines={1}>{item.sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const tile = StyleSheet.create({
  outer: {
    alignItems: 'center', paddingVertical: 15, paddingTop: 18, gap: 7,
    borderRadius: 14, borderWidth: 1, borderTopWidth: 2.5,
    backgroundColor: C.surf, overflow: 'hidden', position: 'relative',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5 },
  cornerTL:  { position: 'absolute', top: 5, left: 5, width: 7, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  iconBox:   { width: 46, height: 46, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label:     { fontFamily: MONO, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.3, textAlign: 'center' },
  sub:       { fontFamily: MONO, fontSize: 8, color: C.mid, textAlign: 'center', letterSpacing: 0.2 },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────
interface CoreSurfacesProps {
  goToTab: (t: string) => void;
}

export function CoreSurfaces({ goToTab }: CoreSurfacesProps) {
  return (
    <View style={{ paddingHorizontal: PAD }}>
      {/* Section header */}
      <View style={cs.sectionHdr}>
        <View style={{ width: 3.5, height: 14, borderRadius: 2, backgroundColor: C.cyan }} />
        <MaterialCommunityIcons name="view-grid" size={11} color={C.cyan} />
        <Text style={cs.hdrTxt}>CORE SURFACES</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.cyan + '20' }} />
        <View style={[cs.badge, { borderColor: C.green + '50', backgroundColor: C.green + '0A' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.green }}>9 TOOLS</Text>
        </View>
      </View>

      {/* Hex banner */}
      <HexBanner />

      {/* 3×3 grid */}
      <View style={[cs.grid, { backgroundColor: C.surf2 }]}>
        {/* Top hairline */}
        <View style={{ height: 1.5, backgroundColor: C.cyan + '18' }} />
        <View style={cs.innerGrid}>
          {SURFACES.map((s, i) => (
            <SurfaceTile key={s.tab} item={s} onPress={() => goToTab(s.tab)} />
          ))}
        </View>
        {/* Bottom hairline */}
        <View style={{ height: 1.5, backgroundColor: C.cyan + '10' }} />
      </View>

      {/* Footer note */}
      <Text style={cs.footer}>TAP ANY SURFACE TO ENTER · ZERO CLOUD · ALL LOCAL</Text>
    </View>
  );
}

const cs = StyleSheet.create({
  sectionHdr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  hdrTxt:     { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.cyan + 'CC', letterSpacing: 1.8 },
  badge:      { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  grid: {
    borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 },
      android: { elevation: 5 },
    }),
  },
  innerGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  footer:     { fontFamily: MONO, fontSize: 7.5, color: C.dim, textAlign: 'center', letterSpacing: 1, marginTop: 7 },
});

export default CoreSurfaces;
