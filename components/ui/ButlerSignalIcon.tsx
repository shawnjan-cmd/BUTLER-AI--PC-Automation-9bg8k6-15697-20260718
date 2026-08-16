import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSkin } from '@/hooks/useSkin';

type SignalState = 'idle' | 'active' | 'success' | 'warning' | 'danger' | 'muted';

type ButlerSignalIconProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  state?: SignalState;
  size?: number;
  pulse?: boolean;
  accessibilityLabel?: string;
};

function ButlerSignalIconImpl({ icon, state = 'idle', size = 22, pulse = false, accessibilityLabel }: ButlerSignalIconProps) {
  const skin = useSkin();
  const opacity = useRef(new Animated.Value(0.72)).current;
  const color = state === 'success' ? skin.ok : state === 'warning' ? skin.warn : state === 'danger' ? skin.danger : state === 'active' ? skin.accent : state === 'muted' ? skin.dim : skin.accent2;
  const box = size + 18;

  useEffect(() => {
    if (!pulse || state === 'muted') { opacity.setValue(0.72); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.58, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity, pulse, state]);

  return (
    <Animated.View accessibilityLabel={accessibilityLabel} style={[styles.shell, { width: box, height: box, borderRadius: box / 3, borderColor: `${color}72`, backgroundColor: `${color}14`, opacity }]}> 
      <View pointerEvents="none" style={[styles.cornerTop, { borderColor: color }]} />
      <View pointerEvents="none" style={[styles.cornerBottom, { borderColor: color }]} />
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </Animated.View>
  );
}

export const ButlerSignalIcon = memo(ButlerSignalIconImpl);

const styles = StyleSheet.create({
  shell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cornerTop: { position: 'absolute', left: -1, top: -1, width: 8, height: 8, borderLeftWidth: 2, borderTopWidth: 2 },
  cornerBottom: { position: 'absolute', right: -1, bottom: -1, width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2 },
});
