// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      '**/covenant_extract/**',
      '**/supabase/**',
      '**/components/cyber/**',
      '**/components/home/**',
      '**/components/ui/BiometricLockOverlay.tsx',
      '**/components/ui/GlowCard.tsx',
      '**/components/ui/NexusVaultCard.tsx',
      '**/components/ui/PerformanceMonitorWidget.tsx',
      '**/components/ui/RuntimeDiagnosticsHUD.tsx',
      '**/services/chat.ts',
      '**/services/knowledgeGrowthEngine.ts',
      '**/services/nexusCrawlerEngine.ts',
    ],
    rules: {
      'react/display-name': 'off',
    },
  },
]);
