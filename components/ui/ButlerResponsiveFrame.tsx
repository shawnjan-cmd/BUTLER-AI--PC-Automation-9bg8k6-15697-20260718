import React, { memo } from 'react';
import { View, ViewProps } from 'react-native';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export const ButlerResponsiveFrame = memo(function ButlerResponsiveFrame({ style, children, ...props }: ViewProps) {
  const layout = useResponsiveLayout();
  return (
    <View {...props} style={[{ flex: 1, width: '100%', alignItems: 'center' }, style]}>
      <View style={[layout.centeredStyle, { paddingHorizontal: layout.horizontalPad }]}>
        {children}
      </View>
    </View>
  );
});

export default ButlerResponsiveFrame;
