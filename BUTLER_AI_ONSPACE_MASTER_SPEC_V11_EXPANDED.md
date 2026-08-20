# Butler AI: PC Automation — Ultimate Component-Rich Master Specification (v11)

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This master specification extends the Butler AI mobile architecture by populating every surface with comprehensive component stacks, introducing **expandable component settings panels**, adding interactive telemetry inspection drawers, and incorporating curated space-filling command-center features. 

Every page now features distinct sub-components, live telemetry graphs, configurable animation toggles, and secure local storage bindings, fully optimized for OnSpace.ai ingestion and native Android/iOS deployment [1] [2].

---

## 1. Surface-by-Surface Component Stack & Expandable Settings

The application comprises seven primary surfaces, each equipped with dedicated modular components and an expandable inspector/settings drawer:

| Surface / Route | Core Components | Expandable Component Settings & Features |
| :--- | :--- | :--- |
| **Home Hub** (`app/(tabs)/home.tsx`) | `ButlerAtmosphere`, `ButlerMascotMotion`, `AskButlerHero`, `HomeStatsGrid`, `LiveTelemetryCard` | • Mascot mood & animation speed selector<br>• Greeting greeting tone toggle (Formal, Cyberpunk, Casual)<br>• Live telemetry refresh rate slider (5s to 60s) |
| **Script Library** (`app/(tabs)/scripts.tsx`) | `ScriptSearchHeader`, `ResearchCrawlerCard`, `ScriptExecutionCard`, `UndoReceiptTicker` | • Auto-rehearsal strictness toggle (Low, Strict, Fail-Closed)<br>• Default script timeout adjuster (10s to 300s)<br>• Sandbox isolation level toggle |
| **Butler AI Chat** (`app/(tabs)/butler.tsx`) | `QuickButlerBar`, `FlowLedgerCard`, `StreamingMessageBubble`, `SafetyContractBanner` | • Ollama model selector (`qwen2.5`, `llama3.3`, `mistral`)<br>• Context window token budget slider (2K to 32K)<br>• Prompt injection filter strictness |
| **Knowledgebase** (`app/(tabs)/knowledge.tsx`) | `VectorTopologyGraph`, `EmbeddingIndexCard`, `CrawlerEpochInspector`, `MemoryChunkList` | • Matryoshka vector dimension truncation toggle (Full vs. Compact)<br>• Sitemap priority weighting slider<br>• Local SQLite VACUUM trigger |
| **PC Monitor** (`app/(tabs)/monitor.tsx`) | `PerformanceMonitorWidget`, `AnimatedWire`, `CPUCoreHeatmap`, `NetworkLatencyGauge` | • Core threshold alert triggers<br>• Network polling interface selector (LAN vs. Tailscale)<br>• Log verbosity level |
| **Cosmetics** (`app/(tabs)/cosmetic.tsx`) | `SkinHeaderFX`, `ThemeVariantSelector`, `SoundFXToggle`, `HapticIntensitySlider` | • Accent color palette switcher (Cyan, Mint, Amber, Violet)<br>• Particle density toggle<br>• Sound feedback profile |
| **Settings** (`app/(tabs)/settings.tsx`) | `EncryptedStorageCanaryCard`, `ServerPairingInspector`, `PrivacyPolicyModal`, `ResetRecoveryPanel` | • AES-256-GCM cipher status & nonce verification<br>• Server session token rotation<br>• Full factory data reset override with confirmation seal |

---

## 2. Upgraded Reusable Component: Expandable Inspector Panel

To support per-component settings across every page without cluttering the UI, this collapsible inspector component allows users to tap any card header to expand live settings and telemetry debug toggles.

```tsx
import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSkin } from '@/hooks/useSkin';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableComponentSettingsProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  initialOpen?: boolean;
}

export const ExpandableComponentSettings = memo(function ExpandableComponentSettings({
  title,
  subtitle,
  children,
  initialOpen = false,
}: ExpandableComponentSettingsProps) {
  const S = useSkin();
  const [isOpen, setIsOpen] = useState(initialOpen);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, { backgroundColor: S.panel2, borderColor: `${S.accent}35` }]}>
      <TouchableOpacity
        onPress={toggleOpen}
        activeOpacity={0.8}
        style={[styles.header, { borderBottomColor: isOpen ? `${S.accent}25` : 'transparent' }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: S.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
            {title.toUpperCase()}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: S.mid, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <MaterialIcons
          name={isOpen ? 'expand-less' : 'expand-more'}
          size={20}
          color={S.accent}
        />
      </TouchableOpacity>
      {isOpen && <View style={styles.body}>{children}</View>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  body: {
    padding: 12,
    gap: 8,
  },
});

export default ExpandableComponentSettings;
```

---

## 3. Curated Extra Command-Center Features

To fulfill the request for "random extra cool stuff" packed into every scene, the master spec includes these optional space-filling features:
1. **Neural Pulse Barometer:** A real-time visual indicator in the top header that pulses proportionally to local Ollama inference token generation speed.
2. **Quantum Clipboard Watcher:** A background service visualizer that monitors safe clipboard snippets for automated PC script insertion without exposing raw text to cloud logs.
3. **Cipher Canary Verifier:** An interactive settings widget that performs a live AES-256-GCM test encryption and decryption pass to visually verify storage hardware integrity.
4. **Autonomous Crawler Epoch Timeline:** A step-by-step graphical timeline in the Knowledgebase tracking sitemap discovery, SimHash deduplication, and vector indexing progress.

---

## 4. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
- [6] Software Mansion. *React Native Reanimated Repository & License*. Available online: [https://github.com/software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated).
- [7] Jesper Lekland. *react-native-svg-charts Repository & License*. Available online: [https://github.com/JesperLekland/react-native-svg-charts].
- [8] Chart Kit. *React Native Chart Kit Repository & License*. Available online: [https://github.com/chart-kit/react-native-chart-kit].
- [9] NPM. *react-native-gifted-charts Package & License*. Available online: [https://www.npmjs.com/package/react-native-gifted-charts].
