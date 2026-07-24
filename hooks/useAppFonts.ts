/**
 * BUTLER AI — Font Loader Hook v2.1
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 *
 * GlowWave-X font stack: Orbitron + ShareTechMono + Inter
 *
 * NOTE: Google Fonts packages are loaded via expo-font's useFonts hook.
 * The packages @expo-google-fonts/orbitron, @expo-google-fonts/share-tech-mono
 * and @expo-google-fonts/inter must be installed before enabling font loading.
 * Until then, the app uses system font fallbacks (defined in constants/typography.ts).
 *
 * To enable: run `npx expo install @expo-google-fonts/orbitron
 *   @expo-google-fonts/share-tech-mono @expo-google-fonts/inter`
 * then uncomment the useFonts block below.
 */

export function useAppFonts(): [boolean, Error | null] {
  // ── SAFE FALLBACK: system fonts until Google Fonts packages are installed ──
  // require() paths are resolved STATICALLY by Metro at bundle time — if the
  // npm package doesn't exist in node_modules, Metro resolves it to `undefined`
  // and the app crashes with "Requiring unknown module 'undefined'" at runtime.
  // Returning [true, null] here lets every component render immediately using
  // the platform system fonts defined in FontFallback (constants/typography.ts).
  return [true, null];

  // ── TO ACTIVATE GOOGLE FONTS: install packages, then replace the return
  // above with the useFonts block below (uncomment it). ──────────────────────
  //
  // import { useFonts } from 'expo-font';
  //
  // const [loaded, error] = useFonts({
  //   'Orbitron_400Regular': require('@expo-google-fonts/orbitron/Orbitron_400Regular.ttf'),
  //   'Orbitron_500Medium':  require('@expo-google-fonts/orbitron/Orbitron_500Medium.ttf'),
  //   'Orbitron_700Bold':    require('@expo-google-fonts/orbitron/Orbitron_700Bold.ttf'),
  //   'Orbitron_900Black':   require('@expo-google-fonts/orbitron/Orbitron_900Black.ttf'),
  //   'ShareTechMono_400Regular': require('@expo-google-fonts/share-tech-mono/ShareTechMono_400Regular.ttf'),
  //   'Inter_400Regular': require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
  //   'Inter_500Medium':  require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
  //   'Inter_600SemiBold':require('@expo-google-fonts/inter/Inter_600SemiBold.ttf'),
  //   'Inter_700Bold':    require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
  // });
  // return [loaded, error];
}
