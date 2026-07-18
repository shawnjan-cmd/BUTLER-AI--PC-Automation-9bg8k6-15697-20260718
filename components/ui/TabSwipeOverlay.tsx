/**
 * TabSwipeOverlay — Transparent PanResponder layer for horizontal tab-swipe navigation.
 * Place as the FIRST child inside any tab page's root View.
 * - Swipe LEFT  → leftRoute  (previous tab)
 * - Swipe RIGHT → rightRoute (next tab)
 * Uses box-none so all children still receive touches normally.
 */
import React, { useRef } from 'react';
import { PanResponder, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { haptics } from '@/services/haptics';

interface TabSwipeOverlayProps {
  /** Route to navigate when swiping left (swipe right → go left in tab order) */
  leftRoute: string | null;
  /** Route to navigate when swiping right (swipe left → go right in tab order) */
  rightRoute: string | null;
}

export function TabSwipeOverlay({ leftRoute, rightRoute }: TabSwipeOverlayProps) {
  const pan = useRef(
    PanResponder.create({
      // Only intercept clearly horizontal gestures
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 50 && Math.abs(g.dy) < 40 && Math.abs(g.dx) > Math.abs(g.dy) * 2.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 && leftRoute) {
          // Swipe right → go to previous (left) tab
          haptics.light();
          try { router.navigate(leftRoute as any); } catch {}
        } else if (g.dx < -80 && rightRoute) {
          // Swipe left → go to next (right) tab
          haptics.light();
          try { router.navigate(rightRoute as any); } catch {}
        }
      },
    })
  ).current;

  return (
    <View
      {...pan.panHandlers}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="box-none"
    />
  );
}
