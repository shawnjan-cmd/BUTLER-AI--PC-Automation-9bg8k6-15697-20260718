/**
 * NexusIcons — 30 custom SVG icons for Butler AI NCX aesthetic
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * All inline SVG via react-native-svg — zero external assets.
 * Section 20.6 of the Master Instructions.
 *
 * Icon catalog:
 *   cpu · memory · network · shield · terminal · ai-brain · radar · signal · bolt
 *   chip · drone · satellite · hexgrid · lock · unlock · scan · server · eye
 *   crosshair · robot · wifi-hud · data-flow · circuit · warning-hud · check-hud
 *   close-hud · sync · upload · download · power
 */
import React, { memo, useCallback } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Svg, {
  Circle, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText,
} from 'react-native-svg';
import { haptics } from '@/services/haptics';

export type NexusIconName =
  | 'cpu' | 'memory' | 'network' | 'shield' | 'terminal'
  | 'ai-brain' | 'radar' | 'signal' | 'bolt' | 'chip'
  | 'drone' | 'satellite' | 'hexgrid' | 'lock' | 'unlock'
  | 'scan' | 'server' | 'eye' | 'crosshair' | 'robot'
  | 'wifi-hud' | 'data-flow' | 'circuit' | 'warning-hud' | 'check-hud'
  | 'close-hud' | 'sync' | 'upload' | 'download' | 'power';

interface NexusIconProps {
  name:        NexusIconName;
  size?:       number;
  color?:      string;
  strokeWidth?: number;
  style?:      ViewStyle;
}

interface NexusIconButtonProps extends NexusIconProps {
  onPress:     () => void;
  padding?:    number;
  borderRadius?: number;
  bgColor?:    string;
}

// ── Individual icon paths ─────────────────────────────────────────
function renderIcon(name: NexusIconName, color: string, sw: number) {
  const c = color;
  const w = sw;
  switch (name) {
    case 'cpu':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="6" y="6" width="12" height="12" rx="1" />
          {[9, 12, 15].map(y => (
            <G key={y}>
              <Line x1="9" y1={y} x2="6" y2={y} />
              <Line x1="15" y1={y} x2="18" y2={y} />
            </G>
          ))}
          {[9, 12, 15].map(x => (
            <G key={x}>
              <Line x1={x} y1="9" x2={x} y2="6" />
              <Line x1={x} y1="15" x2={x} y2="18" />
            </G>
          ))}
          <Rect x="9" y="9" width="6" height="6" fill={c} opacity="0.3" />
        </G>
      );
    case 'memory':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Rect x="3" y="7" width="18" height="10" rx="1" />
          {[7, 10, 13, 17].map(x => (
            <G key={x}>
              <Line x1={x} y1="7" x2={x} y2="5" />
              <Line x1={x} y1="17" x2={x} y2="19" />
            </G>
          ))}
          <Rect x="6" y="10" width="12" height="4" rx="0.5" fill={c} opacity="0.2" />
        </G>
      );
    case 'network':
      return (
        <G stroke={c} strokeWidth={w} fill="none">
          <Circle cx="12" cy="5"  r="2" />
          <Circle cx="5"  cy="19" r="2" />
          <Circle cx="19" cy="19" r="2" />
          <Line x1="12" y1="7"  x2="5"  y2="17" />
          <Line x1="12" y1="7"  x2="19" y2="17" />
          <Line x1="5"  y1="19" x2="19" y2="19" />
        </G>
      );
    case 'shield':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3L4 6v6c0 5.25 3.5 9 8 11 4.5-2 8-5.75 8-11V6L12 3z" fill={c} fillOpacity="0.15" />
          <Path d="M9 12l2 2 4-4" />
        </G>
      );
    case 'terminal':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="4" width="18" height="16" rx="2" fill={c} fillOpacity="0.08" />
          <Polyline points="7,9 10,12 7,15" />
          <Line x1="13" y1="15" x2="17" y2="15" />
        </G>
      );
    case 'ai-brain':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v1A2.5 2.5 0 0 0 4.5 8C3 8 2 9 2 10.5S3 13 4.5 13A2.5 2.5 0 0 0 7 15.5v1a2.5 2.5 0 0 0 5 0v-1A2.5 2.5 0 0 0 14.5 13c1.5 0 2.5-1 2.5-2.5S16 8 14.5 8A2.5 2.5 0 0 0 12 5.5v-1A2.5 2.5 0 0 0 9.5 2z" />
          <Circle cx="9.5" cy="10.5" r="1.5" fill={c} fillOpacity="0.4" />
          <Line x1="14.5" y1="10.5" x2="17" y2="10.5" />
          <Line x1="7" y1="10.5" x2="5" y2="10.5" />
        </G>
      );
    case 'radar':
      return (
        <G stroke={c} strokeWidth={w} fill="none">
          <Circle cx="12" cy="12" r="9" />
          <Circle cx="12" cy="12" r="5" />
          <Circle cx="12" cy="12" r="1" fill={c} />
          <Path d="M12 12L18 6" />
          <Circle cx="17" cy="7" r="1.5" fill={c} fillOpacity="0.6" />
        </G>
      );
    case 'signal':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M1.5 8.5C4.5 5 8 3 12 3s7.5 2 10.5 5.5" />
          <Path d="M5 12c1.8-2 4.2-3 7-3s5.2 1 7 3" />
          <Circle cx="12" cy="17" r="2" fill={c} />
        </G>
      );
    case 'bolt':
      return (
        <G fill={c}>
          <Path d="M13 3L4 13h7l-1 8 9-10h-7z" fillOpacity="0.85" stroke={c} strokeWidth={w * 0.5} strokeLinejoin="round" />
        </G>
      );
    case 'chip':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Rect x="7" y="7" width="10" height="10" rx="1" fill={c} fillOpacity="0.1" />
          <Rect x="9" y="9" width="6" height="6" fill={c} fillOpacity="0.25" />
          {[9, 12, 15].map(y => <Line key={`l${y}`} x1="7" y1={y} x2="4" y2={y} />)}
          {[9, 12, 15].map(y => <Line key={`r${y}`} x1="17" y1={y} x2="20" y2={y} />)}
          {[9, 12, 15].map(x => <Line key={`t${x}`} x1={x} y1="7" x2={x} y2="4" />)}
          {[9, 12, 15].map(x => <Line key={`b${x}`} x1={x} y1="17" x2={x} y2="20" />)}
        </G>
      );
    case 'lock':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="5" y="11" width="14" height="10" rx="2" fill={c} fillOpacity="0.15" />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
          <Circle cx="12" cy="16" r="1.5" fill={c} />
        </G>
      );
    case 'unlock':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="5" y="11" width="14" height="10" rx="2" fill={c} fillOpacity="0.15" />
          <Path d="M8 11V7a4 4 0 0 1 8 0" />
          <Circle cx="12" cy="16" r="1.5" fill={c} />
        </G>
      );
    case 'scan':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M3 7V4a1 1 0 0 1 1-1h3" />
          <Path d="M17 3h3a1 1 0 0 1 1 1v3" />
          <Path d="M21 17v3a1 1 0 0 1-1 1h-3" />
          <Path d="M7 21H4a1 1 0 0 1-1-1v-3" />
          <Line x1="3" y1="12" x2="21" y2="12" stroke={c} strokeWidth={w * 1.5} opacity="0.7" />
        </G>
      );
    case 'server':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Rect x="3" y="3"  width="18" height="6" rx="1" fill={c} fillOpacity="0.1" />
          <Rect x="3" y="11" width="18" height="6" rx="1" fill={c} fillOpacity="0.1" />
          <Circle cx="7" cy="6"  r="1" fill={c} />
          <Circle cx="7" cy="14" r="1" fill={c} />
        </G>
      );
    case 'eye':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <Circle cx="12" cy="12" r="3" fill={c} fillOpacity="0.3" />
        </G>
      );
    case 'crosshair':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Circle cx="12" cy="12" r="8" />
          <Circle cx="12" cy="12" r="2" fill={c} fillOpacity="0.4" />
          <Line x1="12" y1="4"  x2="12" y2="8" />
          <Line x1="12" y1="16" x2="12" y2="20" />
          <Line x1="4"  y1="12" x2="8"  y2="12" />
          <Line x1="16" y1="12" x2="20" y2="12" />
        </G>
      );
    case 'robot':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="5" y="9" width="14" height="10" rx="2" fill={c} fillOpacity="0.12" />
          <Rect x="8" y="12" width="3" height="3" rx="0.5" fill={c} fillOpacity="0.5" />
          <Rect x="13" y="12" width="3" height="3" rx="0.5" fill={c} fillOpacity="0.5" />
          <Path d="M12 3v4" />
          <Circle cx="12" cy="2.5" r="1" fill={c} />
          <Line x1="3" y1="13" x2="5" y2="13" />
          <Line x1="19" y1="13" x2="21" y2="13" />
          <Path d="M9 19v2M15 19v2" />
        </G>
      );
    case 'wifi-hud':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M1.5 8.5C4.5 5 8 3 12 3s7.5 2 10.5 5.5" opacity="0.4" />
          <Path d="M5 12c1.8-2 4.2-3 7-3s5.2 1 7 3" opacity="0.7" />
          <Path d="M8.5 15.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" />
          <Circle cx="12" cy="19" r="1.5" fill={c} />
        </G>
      );
    case 'data-flow':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M3 6h4l2 3 4-6 2 3h4" />
          <Line x1="3" y1="12" x2="21" y2="12" opacity="0.3" />
          <Path d="M3 18h4l2-3 4 6 2-3h4" />
        </G>
      );
    case 'circuit':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Rect x="10" y="10" width="4" height="4" rx="0.5" fill={c} fillOpacity="0.3" />
          <Path d="M3 12h7M14 12h7" />
          <Path d="M12 3v7M12 14v7" />
          <Circle cx="3"  cy="12" r="1" fill={c} />
          <Circle cx="21" cy="12" r="1" fill={c} />
          <Circle cx="12" cy="3"  r="1" fill={c} />
          <Circle cx="12" cy="21" r="1" fill={c} />
        </G>
      );
    case 'warning-hud':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M10.3 3.7L2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z" fill={c} fillOpacity="0.12" />
          <Line x1="12" y1="9" x2="12" y2="13" />
          <Circle cx="12" cy="17" r="1" fill={c} />
        </G>
      );
    case 'check-hud':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" fill={c} fillOpacity="0.1" />
          <Polyline points="8,12 11,15 16,9" />
        </G>
      );
    case 'close-hud':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Circle cx="12" cy="12" r="9" fill={c} fillOpacity="0.1" />
          <Line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
          <Line x1="15.5" y1="8.5" x2="8.5" y2="15.5" />
        </G>
      );
    case 'sync':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 4v6h-6" />
          <Path d="M4 20v-6h6" />
          <Path d="M20 10A8 8 0 1 1 4 14" />
        </G>
      );
    case 'upload':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <Polyline points="17,8 12,3 7,8" />
          <Line x1="12" y1="3" x2="12" y2="15" />
        </G>
      );
    case 'download':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <Polyline points="7,10 12,15 17,10" />
          <Line x1="12" y1="15" x2="12" y2="3" />
        </G>
      );
    case 'power':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Path d="M6.3 5A9 9 0 1 0 17.7 5" />
          <Line x1="12" y1="3" x2="12" y2="12" />
        </G>
      );
    // Fallback for drone / satellite / hexgrid
    case 'drone':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Rect x="9" y="9" width="6" height="6" rx="1" fill={c} fillOpacity="0.2" />
          <Line x1="3" y1="3" x2="9" y2="9" /> <Circle cx="3" cy="3" r="2" fill={c} opacity="0.6" />
          <Line x1="21" y1="3" x2="15" y2="9" /><Circle cx="21" cy="3" r="2" fill={c} opacity="0.6" />
          <Line x1="3" y1="21" x2="9" y2="15" /><Circle cx="3" cy="21" r="2" fill={c} opacity="0.6" />
          <Line x1="21" y1="21" x2="15" y2="15" /><Circle cx="21" cy="21" r="2" fill={c} opacity="0.6" />
        </G>
      );
    case 'satellite':
      return (
        <G stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
          <Line x1="3" y1="21" x2="8" y2="16" />
          <Rect x="8" y="12" width="8" height="5" rx="1" transform="rotate(-45,12,14.5)" fill={c} fillOpacity="0.15" />
          <Line x1="12" y1="5" x2="12" y2="8" />
          <Circle cx="19" cy="5" r="2" fill={c} fillOpacity="0.4" />
          <Path d="M14 3c2 0 4 1 5 3" />
          <Path d="M11 6c4-1 7 2 6 6" />
        </G>
      );
    case 'hexgrid':
      return (
        <G stroke={c} strokeWidth={w} fill="none">
          {/* Center hex */}
          <Path d="M12 4l5 3v6l-5 3-5-3V7L12 4z" fill={c} fillOpacity="0.2" />
          {/* Outer connection dots */}
          {([
            [12, 1.5], [17.5, 4.5], [17.5, 13.5], [12, 16.5], [6.5, 13.5], [6.5, 4.5]
          ] as [number, number][]).map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r="1.5" fill={c} opacity="0.6" />
          ))}
          <Circle cx="12" cy="12" r="2" fill={c} fillOpacity="0.5" />
        </G>
      );
    default:
      return (
        <G stroke={c} strokeWidth={w} fill="none">
          <Circle cx="12" cy="12" r="9" />
          <Line x1="12" y1="8" x2="12" y2="16" />
          <Line x1="8" y1="12" x2="16" y2="12" />
        </G>
      );
  }
}

// ── NexusIcon ─────────────────────────────────────────────────────
export const NexusIcon = memo(function NexusIcon({
  name, size = 24, color = '#6EE7FF', strokeWidth, style,
}: NexusIconProps) {
  const sw = strokeWidth ?? Math.max(1, 24 / size * 1.5);
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {renderIcon(name, color, sw)}
      </Svg>
    </View>
  );
});

// ── NexusIconButton ───────────────────────────────────────────────
export const NexusIconButton = memo(function NexusIconButton({
  name, size = 24, color = '#6EE7FF', strokeWidth,
  onPress, padding = 10, borderRadius = 10, bgColor, style,
}: NexusIconButtonProps) {
  const handlePress = useCallback(() => {
    haptics.light();
    onPress();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={[
      {
        padding, borderRadius,
        backgroundColor: bgColor ?? color + '12',
        alignItems: 'center', justifyContent: 'center',
      },
      style,
    ]}>
      <NexusIcon name={name} size={size} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
});
