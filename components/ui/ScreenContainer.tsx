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
import { View, Dimensions, StyleSheet } from 'react-native';

const SW = Dimensions.get('window').width;
const MAX_CONTENT_WIDTH = 640;

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function ScreenContainer({ children, style }: Props) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', width: '100%' },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: SW > MAX_CONTENT_WIDTH ? MAX_CONTENT_WIDTH : SW,
  },
});
