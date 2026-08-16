import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useSkin } from '@/hooks/useSkin';
import { pageRecipe, type ButlerPageId } from '@/services/stylePageRecipes';

export const ButlerPageRecipeBadge = memo(function ButlerPageRecipeBadge({ pageId }: { pageId: ButlerPageId }) {
  const skin = useSkin();
  const recipe = pageRecipe(skin.packId, pageId);
  return (
    <View accessibilityLabel={`${recipe.title} visual recipe`} style={{ borderWidth: 1, borderColor: `${skin.accent}45`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: `${skin.panel}EE`, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: skin.accent, shadowColor: skin.accent, shadowOpacity: 0.8, shadowRadius: 6 }} />
        <Text numberOfLines={1} style={{ flex: 1, color: skin.text, fontFamily: 'monospace', fontWeight: '900', fontSize: 10, letterSpacing: 0.7 }}>{recipe.eyebrow}</Text>
        <Text style={{ color: skin.accent2, fontFamily: 'monospace', fontSize: 8, fontWeight: '800' }}>{recipe.animation.toUpperCase()}</Text>
      </View>
      <Text style={{ color: skin.mid, fontFamily: 'monospace', fontSize: 8, marginTop: 4 }} numberOfLines={1}>{recipe.title} · {recipe.background} · {recipe.graphTitleTreatment} · {recipe.numberTreatment}</Text>
    </View>
  );
});

export default ButlerPageRecipeBadge;
