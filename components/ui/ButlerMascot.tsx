import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';

export type MascotPose = 
  | 'wave' 
  | 'scan' 
  | 'success' 
  | 'think' 
  | 'point' 
  | 'celebrate' 
  | 'error' 
  | 'sleep' 
  | 'code';

interface ButlerMascotProps {
  pose: MascotPose;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

const POSES: Record<MascotPose, any> = {
  wave: require('@/assets/images/mascot_wave.png'),
  scan: require('@/assets/images/mascot_scan.png'),
  success: require('@/assets/images/mascot_success.png'),
  think: require('@/assets/images/mascot_think.png'),
  point: require('@/assets/images/mascot_point.png'),
  celebrate: require('@/assets/images/mascot_celebrate.png'),
  error: require('@/assets/images/mascot_error.png'),
  sleep: require('@/assets/images/mascot_sleep.png'),
  code: require('@/assets/images/mascot_code.png'),
};

/**
 * Butler AI Mascot Component
 * A high-quality 3D rendered mascot robot with multiple poses.
 */
export const ButlerMascot: React.FC<ButlerMascotProps> = ({ 
  pose, 
  size = 200, 
  style, 
  imageStyle 
}) => {
  const source = useMemo(() => POSES[pose] || POSES.wave, [pose]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={source}
        style={[styles.image, { width: size, height: size }, imageStyle]}
        contentFit="contain"
        transition={300}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: 'transparent',
  },
});

export default ButlerMascot;
