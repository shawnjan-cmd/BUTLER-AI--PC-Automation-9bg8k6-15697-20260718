import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import ButlerBuildModePanel from '@/components/ui/ButlerBuildModePanel';
import ButlerPageRecipeBadge from '@/components/ui/ButlerPageRecipeBadge';
import { ButlerPageId } from '@/services/pageLayoutCustomization';

export const ButlerPageStudioHost = memo(function ButlerPageStudioHost({ pageId }: { pageId: ButlerPageId }) {
  return <View style={styles.host} accessibilityLabel={`${pageId} page customization studio`}><ButlerPageRecipeBadge pageId={pageId} /><ButlerBuildModePanel pageId={pageId} /></View>;
});

const styles = StyleSheet.create({ host: { width: '100%', zIndex: 5 } });

export default ButlerPageStudioHost;
