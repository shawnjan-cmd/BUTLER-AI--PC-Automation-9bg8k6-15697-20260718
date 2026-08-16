import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styleChatRecipe } from '@/services/styleChatRecipes';
import { useCosmetic } from '@/contexts/CosmeticContext';
import { useSkin } from '@/hooks/useSkin';

export const ButlerStyleRecipePreview = memo(function ButlerStyleRecipePreview() {
  const { activePackId } = useCosmetic();
  const skin = useSkin();
  const recipe = styleChatRecipe(activePackId || 'butler-core');
  return (
    <View style={{ borderWidth: 1, borderColor: `${skin.accent}55`, borderRadius: 14, padding: 11, backgroundColor: `${skin.panel}E8`, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: skin.accent, backgroundColor: `${skin.accent}18`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: skin.accent, fontFamily: 'monospace', fontWeight: '900', fontSize: 17 }}>{recipe.titleMark}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: skin.text, fontFamily: 'monospace', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>{recipe.title}</Text>
          <Text style={{ color: skin.mid, fontFamily: 'monospace', fontSize: 8, marginTop: 2 }}>LIVE RECIPE · {recipe.chatBackdrop.toUpperCase()}</Text>
        </View>
        <MaterialCommunityIcons name="view-dashboard-variant-outline" size={20} color={skin.accent2} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {[['Mascot', recipe.mascotTalkingPose], ['Bubble', recipe.bubbleShape], ['Unread', recipe.unreadTreatment], ['Entry', recipe.entryTransition], ['Sound', recipe.bubbleSound]].map(([label, value]) => (
          <View key={label} style={{ borderWidth: 1, borderColor: `${skin.mid}45`, backgroundColor: `${skin.bg}88`, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 }}>
            <Text style={{ color: skin.mid, fontFamily: 'monospace', fontSize: 7 }}>{label}</Text>
            <Text style={{ color: skin.text, fontFamily: 'monospace', fontSize: 8, fontWeight: '800' }}>{String(value).replaceAll('-', ' ')}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: skin.mid, fontFamily: 'monospace', fontSize: 8, lineHeight: 12 }}>Preview only. Applying a recipe updates verified cosmetics tokens; audio remains opt-in and reduced-motion keeps the static fallback.</Text>
    </View>
  );
});

export default ButlerStyleRecipePreview;
