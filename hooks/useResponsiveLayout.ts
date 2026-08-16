import { useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PixelRatio, useWindowDimensions } from 'react-native';

export type ButlerDensity = 'compact' | 'regular' | 'large';

export type ResponsiveLayout = {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  density: ButlerDensity;
  isSmall: boolean;
  isLarge: boolean;
  horizontalPad: number;
  contentMaxWidth: number;
  cardGap: number;
  radius: number;
  iconSize: number;
  minTouch: number;
  textScale: number;
  centeredStyle: { width: '100%'; maxWidth: number; alignSelf: 'center' };
};

const VIEWPORT_PROFILE_KEY = '@butler_viewport_profile_v1';

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height, scale, fontScale } = useWindowDimensions();
  useEffect(() => { AsyncStorage.setItem(VIEWPORT_PROFILE_KEY, JSON.stringify({ width: Math.round(width), height: Math.round(height), scale: Number(scale.toFixed(2)), fontScale: Number((fontScale || PixelRatio.getFontScale()).toFixed(2)), savedAt: new Date().toISOString() })).catch(() => {}); }, [width, height, scale, fontScale]);
  return useMemo(() => {
    const isSmall = width < 360;
    const isLarge = width >= 600;
    const density: ButlerDensity = isSmall ? 'compact' : isLarge ? 'large' : 'regular';
    const horizontalPad = isSmall ? 12 : isLarge ? 24 : 16;
    const contentMaxWidth = Math.min(width - horizontalPad * 2, isLarge ? 760 : 560);
    const textScale = Math.min(1.18, Math.max(0.88, fontScale || PixelRatio.getFontScale()));
    return {
      width, height, scale, fontScale, density, isSmall, isLarge, horizontalPad,
      contentMaxWidth, cardGap: isSmall ? 8 : isLarge ? 14 : 10,
      radius: isSmall ? 10 : isLarge ? 16 : 13,
      iconSize: isSmall ? 18 : isLarge ? 24 : 21,
      minTouch: 44,
      textScale,
      centeredStyle: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
    };
  }, [width, height, scale, fontScale]);
}

export default useResponsiveLayout;
