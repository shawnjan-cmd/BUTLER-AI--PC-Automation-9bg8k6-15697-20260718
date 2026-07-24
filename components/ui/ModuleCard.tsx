/**
 * ModuleCard — canonical metric card with left accent rail.
 * Matches Section 21.4 anatomy exactly:
 *   left rail 3px | icon | module name | badge | sparkline | TAP TO EXPAND
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, Animated,
} from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Reanimated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';
import { haptics } from '@/services/haptics';

export interface ModuleCardProps {
  icon:       string;
  moduleName: string;
  subtitle?:  string;
  value:      string;   // main metric value
  unit?:      string;   // unit suffix
  badge?:     string;   // badge text (e.g. "LIVE", "STANDBY")
  badgeColor?:string;
  accent:     string;   // module accent color
  sparkData?: number[]; // 10-sample sparkline bars
  onTap?:     () => void;
  style?:     any;
}

const MOTION_SPRING = { damping: 22, stiffness: 260 };

export const ModuleCard = memo(function ModuleCard({
  icon, moduleName, subtitle, value, unit, badge, badgeColor,
  accent, sparkData = [], onTap, style,
}: ModuleCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, MOTION_SPRING);
  }, []);
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, MOTION_SPRING);
    haptics.light();
    onTap?.();
  }, [onTap]);

  const bc = badgeColor ?? accent;
  const max = Math.max(...sparkData, 1);

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
      <Reanimated.View style={[animStyle, s.root, { borderColor: accent + '28' }, style]}>
        {/* Left accent rail */}
        <View style={[s.rail, { backgroundColor: accent }]} />

        <View style={{ flex: 1, paddingLeft: 14 }}>
          {/* Header row */}
          <View style={s.hdrRow}>
            <View style={[s.iconBox, { backgroundColor: accent + '12', borderColor: accent + '40' }]}>
              <MaterialCommunityIcons name={icon as any} size={16} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.moduleName, { color: accent + 'CC' }]} numberOfLines={1}>
                {moduleName}
              </Text>
              {subtitle && (
                <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text>
              )}
            </View>
            {badge && (
              <View style={[s.badge, { borderColor: bc + '55', backgroundColor: bc + '0E' }]}>
                <Text style={[s.badgeTxt, { color: bc }]}>{badge}</Text>
              </View>
            )}
          </View>

          {/* Main value */}
          <Text style={[s.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
            {value}
            {unit && <Text style={[s.unit, { color: accent + '70' }]}> {unit}</Text>}
          </Text>

          {/* Sparkline */}
          {sparkData.length > 0 && (
            <View style={s.sparkRow}>
              {sparkData.map((v, i) => {
                const h = Math.max(3, (v / max) * 24);
                const isLast = i === sparkData.length - 1;
                return (
                  <View key={i} style={[
                    s.bar,
                    {
                      height: h,
                      backgroundColor: isLast ? accent : accent + '55',
                    },
                  ]} />
                );
              })}
            </View>
          )}

          {/* Tap hint */}
          <Text style={s.tapHint}>TAP TO EXPAND</Text>
        </View>
      </Reanimated.View>
    </Pressable>
  );
});

const MONO = FontFamily.mono as any;
const s = StyleSheet.create({
  root: {
    flexDirection:  'row',
    backgroundColor: '#0D1117',
    borderRadius:    12,
    borderWidth:      1,
    overflow:        'hidden',
    paddingVertical: 10,
    paddingRight:    12,
    position:       'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  rail: {
    width:        3,
    alignSelf:   'stretch',
    borderRadius: 0,
    flexShrink:   0,
  },
  hdrRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            8,
    marginBottom:   6,
  },
  iconBox: {
    width:           32,
    height:          32,
    borderRadius:     8,
    borderWidth:      1.5,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:       0,
  },
  moduleName: {
    fontFamily:    MONO,
    fontSize:       11,
    fontWeight:    '400' as any,
    letterSpacing:  1.5,
    textTransform: 'uppercase' as any,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  subtitle: {
    fontFamily:    MONO,
    fontSize:       8.5,
    color:         '#6B7280',
    letterSpacing:  0.5,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  badge: {
    borderWidth:     1,
    borderRadius:    6,
    paddingHorizontal: 6,
    paddingVertical:  2,
    flexShrink:      0,
  },
  badgeTxt: {
    fontFamily:    MONO,
    fontSize:       8,
    fontWeight:    '900' as any,
    letterSpacing:  0.5,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  value: {
    fontFamily:    MONO,
    fontSize:       26,
    fontWeight:    '400' as any,
    lineHeight:     30,
    marginBottom:   6,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  unit: {
    fontFamily:    MONO,
    fontSize:       13,
    fontWeight:    '400' as any,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:            2.5,
    height:         28,
    marginBottom:   5,
  },
  bar: {
    flex:         1,
    borderRadius: 2,
    minHeight:    3,
  },
  tapHint: {
    fontFamily:    MONO,
    fontSize:       8.5,
    color:         'rgba(255,255,255,0.18)',
    letterSpacing:  1.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default ModuleCard;
