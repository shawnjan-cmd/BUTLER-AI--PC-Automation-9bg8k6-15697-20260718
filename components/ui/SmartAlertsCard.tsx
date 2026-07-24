/**
 * SmartAlertsCard — stacked alert cards with severity levels.
 * Matches Section 21.14 spec exactly.
 * Real-time dismiss, severity colors, timestamp, "VIEW ALL" link.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';

const C = {
  surface: '#0D1117',
  bg:      '#080C12',
  red:     '#FF3B30',
  amber:   '#FF9500',
  cyan:    '#00D4FF',
  text:    '#E8EAF0',
  textMut: '#6B7280',
  border:  'rgba(255,255,255,0.05)',
};

export interface Alert {
  id:      string;
  level:   'crit' | 'warn' | 'info';
  title:   string;
  detail?: string;
  time?:   string;
}

export interface SmartAlertsCardProps {
  alerts?:      Alert[];
  onViewAll?:   () => void;
  maxVisible?:  number;
}

const LEVEL_COLOR = {
  crit: C.red,
  warn: C.amber,
  info: C.cyan,
} as const;

const LEVEL_ICON = {
  crit: 'alert-circle-outline',
  warn: 'alert-outline',
  info: 'information-outline',
} as const;

export const SmartAlertsCard = memo(function SmartAlertsCard({
  alerts      = [],
  onViewAll,
  maxVisible  = 3,
}: SmartAlertsCardProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => [...prev, id]);
  }, []);

  const visible = alerts.filter(a => !dismissed.includes(a.id)).slice(0, maxVisible);
  const total   = alerts.filter(a => !dismissed.includes(a.id)).length;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.hdr}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="bell-ring-outline" size={13} color={C.red} />
          <Text style={[s.hdrTxt, { color: C.red + 'CC' }]}>SMART ALERTS</Text>
          {total > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countTxt}>{total}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontFamily: FontFamily.mono as any, fontSize: 8.5, color: C.cyan + '80', fontWeight: '900' as any }}>
            VIEW ALL ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert rows */}
      {visible.length === 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingTop: 0 }}>
          <MaterialCommunityIcons name="check-circle-outline" size={13} color="#00FF88" />
          <Text style={{ fontFamily: FontFamily.mono as any, fontSize: 9.5, color: '#00FF88' }}>
            All systems nominal
          </Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 4 }}>
          {visible.map((alert, i) => {
            const col = LEVEL_COLOR[alert.level];
            return (
              <View key={alert.id} style={[
                s.row,
                i < visible.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
              ]}>
                {/* Severity dot */}
                <View style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: col,
                  ...Platform.select({
                    ios: { shadowColor: col, shadowRadius: 4, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 } },
                  }),
                  flexShrink: 0, marginTop: 3,
                }} />

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text style={[s.alertTitle, { color: col }]} numberOfLines={1}>
                    {alert.title}
                  </Text>
                  {alert.detail && (
                    <Text style={s.alertDetail} numberOfLines={1}>{alert.detail}</Text>
                  )}
                </View>

                {/* Timestamp + dismiss */}
                <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {alert.time && (
                    <Text style={s.alertTime}>{alert.time}</Text>
                  )}
                  <TouchableOpacity
                    onPress={() => dismiss(alert.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={12} color={C.textMut} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    backgroundColor: C.surface,
    borderRadius:    16,
    borderWidth:      1,
    borderColor:    'rgba(255,59,48,0.22)',
    overflow:       'hidden',
  },
  hdr: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop:     12,
    paddingBottom:   9,
  },
  hdrTxt: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       9,
    fontWeight:    '900' as any,
    letterSpacing:  1.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  countBadge: {
    width:           16, height: 16, borderRadius: 8,
    backgroundColor: C.red,
    alignItems:     'center',
    justifyContent: 'center',
  },
  countTxt: {
    fontFamily: FontFamily.mono as any,
    fontSize:    8.5, fontWeight: '900' as any, color: '#fff',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:             9,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  alertTitle: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       12,
    fontWeight:    '600' as any,
    marginBottom:   2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  alertDetail: {
    fontFamily:    FontFamily.body as any,
    fontSize:       11,
    color:          C.textMut,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  alertTime: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       9,
    color:          C.textMut,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default SmartAlertsCard;
