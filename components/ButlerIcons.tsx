/**
 * ButlerIcons — 9 themed icon components using pure React Native + @expo/vector-icons.
 * No SVG dependency. Each icon wraps AnimatedIcon with MaterialCommunityIcons/MaterialIcons.
 */
import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AnimatedIcon, { GlowColor, AnimationPreset } from './AnimatedIcon';

interface IconProps {
  size?: number;
  glowColor?: GlowColor;
  animation?: AnimationPreset;
  glowIntensity?: number;
  showBorder?: boolean;
}

const GLOW_MAP: Record<GlowColor, string> = {
  teal:   '#00E5FF',
  green:  '#00FF88',
  purple: '#CC44FF',
  red:    '#FF3344',
  amber:  '#FFB020',
  blue:   '#4499FF',
  pink:   '#FF6EB4',
};

// ── 1. Robot Head — butler/AI tab ──────────────────────────────────────────
export function RobotHeadIcon({ size = 48, glowColor = 'teal', animation = 'pulse', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="robot-happy-outline" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 2. Brain Gear — knowledge ──────────────────────────────────────────────
export function BrainGearIcon({ size = 48, glowColor = 'purple', animation = 'breathe', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="brain" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 3. Shield Lock — security ──────────────────────────────────────────────
export function ShieldLockIcon({ size = 48, glowColor = 'green', animation = 'beat', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="shield-lock-outline" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 4. Wrench — builder / tools ────────────────────────────────────────────
export function WrenchIcon({ size = 48, glowColor = 'teal', animation = 'rotate', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="wrench-outline" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 5. Lightning — scripts / forge ────────────────────────────────────────
export function LightningIcon({ size = 48, glowColor = 'amber', animation = 'flicker', glowIntensity = 0.7, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialIcons name="bolt" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 6. Network QR — home / scan ───────────────────────────────────────────
export function NetworkQRIcon({ size = 48, glowColor = 'teal', animation = 'pulse', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialIcons name="qr-code-scanner" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 7. Bug Fix — debug / error ────────────────────────────────────────────
export function BugFixIcon({ size = 48, glowColor = 'red', animation = 'glitch', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialIcons name="bug-report" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 8. Hammer Wrench — build ──────────────────────────────────────────────
export function HammerWrenchIcon({ size = 48, glowColor = 'amber', animation = 'beat', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="hammer-wrench" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 9. Sliders — settings / config ────────────────────────────────────────
export function SlidersIcon({ size = 48, glowColor = 'blue', animation = 'breathe', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="tune-variant" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 10. File Vault — fileshare ────────────────────────────────────────────
export function FileVaultIcon({ size = 48, glowColor = 'pink', animation = 'pulse', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="folder-network-outline" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 11. Chart Intel — logs/intel ──────────────────────────────────────────
export function ChartIntelIcon({ size = 48, glowColor = 'amber', animation = 'pulse', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="chart-areaspline" size={ic} color={color} />
    </AnimatedIcon>
  );
}

// ── 12. Home HUD — nexushome/CORE ─────────────────────────────────────────
export function HomeHUDIcon({ size = 48, glowColor = 'teal', animation = 'breathe', glowIntensity = 0.6, showBorder = false }: IconProps) {
  const color = GLOW_MAP[glowColor];
  const ic = Math.round(size * 0.62);
  return (
    <AnimatedIcon size={size} glowColor={glowColor} animation={animation} glowIntensity={glowIntensity} showBorder={showBorder}>
      <MaterialCommunityIcons name="home-lightning-bolt" size={ic} color={color} />
    </AnimatedIcon>
  );
}

export { default as AnimatedIcon } from './AnimatedIcon';
