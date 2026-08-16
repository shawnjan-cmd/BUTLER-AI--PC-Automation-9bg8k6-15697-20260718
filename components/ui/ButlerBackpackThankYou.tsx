import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSkin } from '@/hooks/useSkin';
import { haptics } from '@/services/haptics';

export const ButlerBackpackThankYou = memo(function ButlerBackpackThankYou({ onSupport }: { onSupport?: () => void }) {
  const skin = useSkin();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.78, paddingHorizontal: 4, paddingVertical: 4 }}>
      <MaterialCommunityIcons name="robot-outline" size={21} color={skin.accent2} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: skin.text, fontFamily: 'monospace', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>BUTLER AI · PC AUTOMATION</Text>
        <Text style={{ color: skin.mid, fontFamily: 'monospace', fontSize: 7, lineHeight: 10 }}>Thank you for supporting a solo creator. Support is optional and helps fund private, local-first improvements.</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Thank the Butler creator" onPress={() => { try { haptics.light(); } catch {} onSupport?.(); }} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#FF6FAE88', backgroundColor: '#FF4F9E18', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="heart-outline" size={19} color="#FF6FAE" />
      </TouchableOpacity>
    </View>
  );
});

export default ButlerBackpackThankYou;
