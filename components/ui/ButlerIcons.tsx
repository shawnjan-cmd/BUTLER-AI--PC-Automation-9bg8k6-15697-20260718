/**
 * BUTLER AI — Custom SVG Icon System
 * 14 geometric neon-themed icons. Zero external dependencies.
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polygon, G } from 'react-native-svg';

type ButlerIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const ICONS = {
  QR_SCAN: ({ size = 28, color = '#00E5FF' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x="2" y="2" width="24" height="24" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="4" y="4" width="6" height="6" stroke={color} strokeWidth="1" fill="none" />
      <Rect x="5" y="5" width="4" height="4" fill={color} />
      <Rect x="18" y="4" width="6" height="6" stroke={color} strokeWidth="1" fill="none" />
      <Rect x="19" y="5" width="4" height="4" fill={color} />
      <Rect x="4" y="18" width="6" height="6" stroke={color} strokeWidth="1" fill="none" />
      <Rect x="5" y="19" width="4" height="4" fill={color} />
      <Circle cx="14" cy="14" r="3" stroke={color} strokeWidth="1" fill="none" />
      <Line x1="10" y1="14" x2="18" y2="14" stroke={color} strokeWidth="0.8" opacity="0.6" />
      <Line x1="14" y1="10" x2="14" y2="18" stroke={color} strokeWidth="0.8" opacity="0.6" />
    </Svg>
  ),

  CHAT_BOT: ({ size = 28, color = '#00E5FF' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="9" r="4" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="11" cy="8.5" r="0.8" fill={color} />
      <Circle cx="17" cy="8.5" r="0.8" fill={color} />
      <Path d="M 11.5 10 Q 14 11 16.5 10" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <Rect x="10" y="14" width="8" height="7" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
      <Circle cx="14" cy="17" r="1" fill={color} opacity="0.7" />
      <Path d="M 18 20 L 21 23 L 19 21" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  ),

  PLAY: ({ size = 28, color = '#00FF88' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon points="14,2 24,8 24,20 14,26 4,20 4,8" stroke={color} strokeWidth="1.5" fill="none" />
      <Polygon points="10,10 10,18 18,14" fill={color} />
    </Svg>
  ),

  SHIELD_LOCK: ({ size = 28, color = '#00FF88' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M 14 2 L 22 5 L 22 14 Q 22 22 14 26 Q 6 22 6 14 L 6 5 Z" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="10" y="12" width="8" height="8" stroke={color} strokeWidth="1.2" fill="none" rx="1" />
      <Path d="M 11 12 Q 11 9 14 9 Q 17 9 17 12" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Circle cx="14" cy="16" r="1" fill={color} />
    </Svg>
  ),

  DOWNLOAD: ({ size = 28, color = '#00E5FF' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x="4" y="4" width="20" height="16" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
      <Path d="M 14 8 L 14 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M 10 14 L 14 18 L 18 14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="6" y1="22" x2="22" y2="22" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  ),

  CLOUD_OFF: ({ size = 28, color = '#FF6B9D' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M 4 16 Q 4 12 8 10 Q 10 6 14 6 Q 18 6 20 10 Q 24 12 24 16 Z" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="6" y1="24" x2="22" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </Svg>
  ),

  SERVER_STACK: ({ size = 28, color = '#00E5FF' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {[0, 8, 16].map((offset, i) => (
        <G key={i}>
          <Rect x="4" y={4 + offset} width="20" height="6" stroke={color} strokeWidth="1" fill="none" rx="0.5" />
          <Circle cx="6" cy={7 + offset} r="0.8" fill={color} opacity="0.7" />
          <Circle cx="10" cy={7 + offset} r="0.8" fill={color} opacity="0.7" />
          <Rect x="16" y={6 + offset} width="6" height="3" stroke={color} strokeWidth="0.8" fill="none" />
        </G>
      ))}
    </Svg>
  ),

  HOME: ({ size = 28, color = '#00E5FF' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon points="14,2 4,12 6,12 6,24 22,24 22,12 24,12" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="11" y="14" width="6" height="10" stroke={color} strokeWidth="1.2" fill="none" />
      <Circle cx="16" cy="19" r="0.8" fill={color} />
      <Rect x="8" y="15" width="3" height="3" stroke={color} strokeWidth="1" fill="none" />
    </Svg>
  ),

  CHECKMARK_CIRCLE: ({ size = 28, color = '#00FF88' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="14" r="11" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M 9 14 L 12 17 L 19 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  ALERT_TRIANGLE: ({ size = 28, color = '#FF8A00' }: ButlerIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon points="14,3 24,23 4,23" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="14" cy="19" r="1" fill={color} />
      <Line x1="14" y1="10" x2="14" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  ),
};

export type ButlerIconName = keyof typeof ICONS;

export function ButlerIcon({
  name,
  size = 28,
  color = '#00E5FF',
}: {
  name: ButlerIconName;
  size?: number;
  color?: string;
}) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}

export default ICONS;
