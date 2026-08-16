import React, { memo } from 'react';
import { Platform, Text, TextStyle } from 'react-native';
import { useSkin } from '@/hooks/useSkin';

export type ButlerAutoScaleTextProps = {
  children: React.ReactNode;
  size?: number;
  minFontScale?: number;
  lines?: number;
  color?: string;
  fontFamily?: string;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  weight?: TextStyle['fontWeight'];
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
};

export const ButlerAutoScaleText = memo(function ButlerAutoScaleText({
  children, size = 13, minFontScale = 0.7, lines = 1, color, fontFamily, letterSpacing,
  align = 'left', style, weight, ellipsizeMode = 'tail',
}: ButlerAutoScaleTextProps) {
  const skin = useSkin();
  const resolvedFamily = fontFamily ?? (skin.fontProfile === 'tech' ? 'monospace' : skin.fontProfile === 'clean' ? undefined : 'monospace');
  const computed: TextStyle = {
    fontFamily: resolvedFamily, fontSize: size, color: color ?? skin.text, letterSpacing,
    textAlign: align, fontWeight: weight,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
  };
  return <Text style={[computed, style]} numberOfLines={lines} ellipsizeMode={ellipsizeMode} adjustsFontSizeToFit minimumFontScale={minFontScale}>{children}</Text>;
});

export const ButlerMonoValue = memo(({ children, size = 14, color, style }: { children: React.ReactNode; size?: number; color?: string; style?: TextStyle }) => (
  <ButlerAutoScaleText size={size} color={color} style={style}>{children}</ButlerAutoScaleText>
));

export const ButlerHeroLabel = memo(({ children, size = 20, color, letterSpacing = 2, lines = 1, style }: { children: React.ReactNode; size?: number; color?: string; letterSpacing?: number; lines?: number; style?: TextStyle }) => (
  <ButlerAutoScaleText size={size} color={color} letterSpacing={letterSpacing} align="center" lines={lines} minFontScale={0.6} weight="900" style={style}>{children}</ButlerAutoScaleText>
));

export const ButlerBodyText = memo(({ children, size = 13, color, lines = 3, align = 'left', style }: { children: React.ReactNode; size?: number; color?: string; lines?: number; align?: 'left' | 'center' | 'right'; style?: TextStyle }) => (
  <ButlerAutoScaleText size={size} color={color} lines={lines} align={align} minFontScale={0.85} style={{ lineHeight: size * 1.5, ...style }}>{children}</ButlerAutoScaleText>
));

export default ButlerAutoScaleText;
