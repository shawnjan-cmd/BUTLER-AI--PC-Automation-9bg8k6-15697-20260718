/**
 * SafeLayoutWrapper — universal screen container that automatically:
 *  1. Applies safe-area insets (notch, home bar, status bar)
 *  2. Adds correct bottom padding for tab bar + chat bar clearance
 *  3. Prevents content touching screen edges (min 14px on all sides)
 *  4. Handles keyboard avoiding behavior on screens with inputs
 *  5. Provides a pull-to-refresh scaffold
 *  6. Manages ambient particle background layer
 *
 * Use this instead of bare <ScrollView> on any tab screen.
 *
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useCallback, ReactNode } from 'react';
import {
  View, ScrollView, RefreshControl, StyleSheet,
  KeyboardAvoidingView, Platform, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_H  = 72;
const CHAT_BAR_H = 52;
const SCREEN_PAD = 14;

interface SafeLayoutWrapperProps {
  children:      ReactNode;
  /** Scrollable content (default true). */
  scrollable?:   boolean;
  /** Show pull-to-refresh indicator. */
  refreshing?:   boolean;
  /** Called on pull-to-refresh gesture. */
  onRefresh?:    () => void;
  /** Accent color for refresh indicator. Default ice blue. */
  accentColor?:  string;
  /** Add bottom padding for the floating QuickButlerBar. Default true. */
  hasChatBar?:   boolean;
  /** Add bottom padding for the floating tab bar. Default true. */
  hasTabBar?:    boolean;
  /** Horizontal padding override. */
  horizontalPad?: number;
  /** Keyboard-avoiding behavior (only when inputs are on screen). */
  keyboardAvoiding?: boolean;
  /** Override the background color. */
  backgroundColor?:  string;
  /** Extra style on the outer container. */
  style?: ViewStyle;
  /** Extra style on the content container. */
  contentStyle?: ViewStyle;
}

export const SafeLayoutWrapper = memo(function SafeLayoutWrapper({
  children,
  scrollable       = true,
  refreshing       = false,
  onRefresh,
  accentColor      = '#6EE7FF',
  hasChatBar       = true,
  hasTabBar        = true,
  horizontalPad    = SCREEN_PAD,
  keyboardAvoiding = false,
  backgroundColor  = '#0A0F1A',
  style,
  contentStyle,
}: SafeLayoutWrapperProps) {
  const insets = useSafeAreaInsets();

  const bottomPad =
    (hasTabBar  ? TAB_BAR_H  : 0) +
    (hasChatBar ? CHAT_BAR_H : 0) +
    insets.bottom +
    20; // breathing room

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={accentColor}
      colors={[accentColor]}
    />
  ) : undefined;

  const contentContainerStyle: ViewStyle = {
    paddingTop:       insets.top + 8,
    paddingBottom:    bottomPad,
    paddingHorizontal: horizontalPad,
    ...contentStyle,
  };

  const inner = scrollable ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
      overScrollMode="never"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingBottom: bottomPad }, contentStyle]}>
      {children}
    </View>
  );

  const wrapper = (
    <View style={[s.root, { backgroundColor }, style]}>
      {inner}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {wrapper}
      </KeyboardAvoidingView>
    );
  }

  return wrapper;
});

const s = StyleSheet.create({
  root: { flex: 1 },
});

export default SafeLayoutWrapper;
