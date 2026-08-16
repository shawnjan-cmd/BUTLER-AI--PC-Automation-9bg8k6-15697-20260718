import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewProps } from 'react-native';
import { ButlerDesign, ButlerMotionMode } from '@/constants/butlerDesign';
import { useSkin } from '@/hooks/useSkin';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export interface ButlerSurfaceProps extends ViewProps {
  accent?: string;
  motion?: ButlerMotionMode;
  elevated?: boolean;
}

export const ButlerSurface = memo(function ButlerSurface({
  accent,
  motion = 'full',
  elevated = false,
  style,
  children,
  ...props
}: ButlerSurfaceProps) {
  const skin = useSkin();
  const layout = useResponsiveLayout();
  const resolvedAccent = accent ?? skin.accent;
  const resolvedPanel = skin.panel;
  const opacity = useRef(new Animated.Value(motion === 'off' ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(motion === 'full' ? 6 : 0)).current;

  useEffect(() => {
    if (motion === 'off') {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: motion === 'reduced' ? ButlerDesign.motion.quick : ButlerDesign.motion.standard, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: motion === 'reduced' ? ButlerDesign.motion.quick : ButlerDesign.motion.standard, useNativeDriver: true }),
    ]).start();
  }, [motion, opacity, translateY]);

  return (
    <Animated.View
      {...props}
      style={[
        styles.root,
        { borderColor: `${resolvedAccent}55`, backgroundColor: resolvedPanel, borderRadius: layout.radius, padding: layout.density === 'compact' ? 10 : layout.density === 'large' ? 18 : ButlerDesign.spacing.md, transform: [{ translateY }], opacity },
        elevated && styles.elevated,
        style,
      ]}
    >
      <View pointerEvents="none" style={[styles.accent, { backgroundColor: resolvedAccent }]} />
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: ButlerDesign.radius.md,
    backgroundColor: ButlerDesign.color.surface,
    padding: ButlerDesign.spacing.md,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
});

export default ButlerSurface;
