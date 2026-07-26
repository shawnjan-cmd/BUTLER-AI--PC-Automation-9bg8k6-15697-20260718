import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';

type IndigoHeroProps = {
  isConnected?: boolean;
  cpu?: number;
  ram?: number;
  disk?: number;
};

const INDIGO = '#6366F1';

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.pill, { borderColor: color + '66', backgroundColor: color + '1A' }]}>
      <View style={[s.pillDot, { backgroundColor: color }]} />
      <Text style={[s.pillTxt, { color }]}>{label}</Text>
    </View>
  );
}

function UptimeBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.max(8, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function IndigoHero({ isConnected = false, cpu = 0, ram = 0, disk = 0 }: IndigoHeroProps) {
  const cpuHealth = isConnected ? Math.max(0, 100 - Math.round(cpu)) : 0;
  const ramHealth = isConnected ? Math.max(0, 100 - Math.round(ram)) : 0;
  const diskHealth = isConnected ? Math.max(0, 100 - Math.round(disk)) : 0;

  return (
    <View style={s.wrap}>
      <View style={s.headerRow}>
        <View style={s.avatar}>
          <MaterialCommunityIcons name="robot-happy-outline" size={24} color="#E0E7FF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>ALL SYSTEMS OPERATIONAL</Text>
          <Text style={s.subtitle}>INDIGO CORE STATUS</Text>
        </View>
      </View>

      <View style={s.pillRow}>
        <Pill label={isConnected ? 'ONLINE' : 'OFFLINE'} color={isConnected ? '#34D399' : '#94A3B8'} />
        <Pill label="SECURE" color={INDIGO} />
      </View>

      <View style={s.bars}>
        <UptimeBar value={cpuHealth} color="#818CF8" />
        <UptimeBar value={ramHealth} color="#6366F1" />
        <UptimeBar value={diskHealth} color="#A5B4FC" />
      </View>

      <Text style={s.footer}>30D · HEALTHY</Text>
    </View>
  );
}

export default IndigoHero;

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.45)',
    backgroundColor: 'rgba(30,27,75,0.50)',
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.7)',
    backgroundColor: 'rgba(99,102,241,0.25)',
  },
  title: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    fontWeight: '900',
    color: '#E0E7FF',
    letterSpacing: 0.9,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    color: '#A5B4FC',
    letterSpacing: 0.9,
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  pillDot: { width: 6, height: 6, borderRadius: 999 },
  pillTxt: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bars: { gap: 6 },
  barTrack: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(165,180,252,0.2)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  footer: {
    marginTop: 2,
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    color: '#C7D2FE',
    letterSpacing: 1.0,
    fontWeight: '800',
  },
});
