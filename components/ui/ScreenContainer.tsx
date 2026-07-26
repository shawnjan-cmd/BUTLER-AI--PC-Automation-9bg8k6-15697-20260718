/**
 * ScreenContainer — universal content-width cap for large screens / tablets.
 * Wrap the root content of any screen to prevent full-bleed stretch on
 * tablets and desktop Chrome (web preview). Phone screens (<640px) are
 * unaffected — they render full width exactly as before.
 *
 * Usage:
 *   import { ScreenContainer } from '@/components/ui/ScreenContainer';
 *   <ScreenContainer>
 *     <YourScrollView ... />
 *   </ScreenContainer>
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

const MAX_CONTENT_WIDTH = 640;

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function ScreenContainer({ children, style }: Props) {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { maxWidth: Math.min(width, MAX_CONTENT_WIDTH) }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', width: '100%' },
  inner: {
    flex: 1,
    width: '100%',
  },
});
