/**
 * ZeroCloudCard — zero-cloud architecture trust footer card.
 * Matches exact spec from Section 21.27 of master instructions.
 * Appears at the bottom of several screens as a trust footer.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/typography';

const C = {
  bg:       '#0A0F1A',
  surface:  '#0D1117',
  green:    '#00FF88',
  text:     '#E8EAF0',
  textMuted:'#6B7280',
};

interface ZeroCloudCardProps {
  title?: string;
  body?:  string;
}

export const ZeroCloudCard = memo(function ZeroCloudCard({
  title = 'Zero-cloud architecture',
  body  = 'All processing on-device or your paired PC. Nothing transmitted off-network.',
}: ZeroCloudCardProps) {
  return (
    <View style={s.root}>
      <View style={s.leftRail} />
      <View style={[s.iconBox, { backgroundColor: C.green + '14', borderColor: C.green + '50' }]}>
        <MaterialCommunityIcons name="shield-off-outline" size={28} color={C.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>
      </View>
      <MaterialIcons name="check-circle-outline" size={24} color={C.green + '70'} />
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             14,
    backgroundColor: C.surface,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:    'rgba(0,255,136,0.25)',
    overflow:       'hidden',
    padding:         16,
    paddingLeft:     20,
    position:       'relative',
  },
  leftRail: {
    position:        'absolute',
    left:            0,
    top:             0,
    bottom:          0,
    width:           3,
    backgroundColor: C.green,
    opacity:         0.8,
  },
  iconBox: {
    width:           48,
    height:          48,
    borderRadius:    14,
    borderWidth:     1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:      0,
  },
  title: {
    fontFamily:    FontFamily.mono as any,
    fontSize:       13,
    color:          C.text,
    fontWeight:    '700' as any,
    marginBottom:   4,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  body: {
    fontFamily:    FontFamily.body as any,
    fontSize:       12,
    color:          C.textMuted,
    lineHeight:     17,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});

export default ZeroCloudCard;
