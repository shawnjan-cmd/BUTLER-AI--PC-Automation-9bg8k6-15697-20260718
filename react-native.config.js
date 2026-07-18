/**
 * react-native.config.js — Native auto-link exclusions
 *
 * expo-video registers VideoModule (VideoCache / media3 SimpleCache) at Android
 * native init time. When the app hot-reloads or the process restarts without
 * releasing the native cache lock, Android throws:
 *
 *   IllegalStateException: Another SimpleCache instance uses the folder
 *
 * This crash occurs inside NativeUnimoduleProxy.getConstants() BEFORE any JS
 * runs, so JS-layer patches cannot intercept it.
 *
 * Since this app never uses video playback, we exclude expo-video from React
 * Native auto-linking entirely so Gradle never compiles or registers the
 * VideoModule native code.
 *
 * Metro-layer: metro.config.js already redirects require('expo-video') to
 * stubs/expo-video-stub.js (JS no-ops).
 * Native-layer: THIS FILE prevents the Gradle module from being linked.
 */
module.exports = {
  dependencies: {
    'expo-video': {
      platforms: {
        android: null, // Exclude from Android auto-linking — prevents SimpleCache crash
        ios: null,     // Exclude from iOS auto-linking as well (unused)
      },
    },
    // expo-av: zero JS usage confirmed via full codebase grep (v10.10 audit).
    // JS imports were removed in v9, but the package remained in package.json,
    // meaning Gradle was still compiling and linking the native module into every
    // build. Excluded here using the same pattern as expo-video above.
    'expo-av': {
      platforms: { android: null, ios: null },
    },
    // expo-sharing: zero JS usage — same situation as expo-av above.
    'expo-sharing': {
      platforms: { android: null, ios: null },
    },
    // expo-linear-gradient: zero JS usage — removed from JS in v9, native module
    // still linked. Exclude to prevent potential native-init interference.
    'expo-linear-gradient': {
      platforms: { android: null, ios: null },
    },
    // expo-clipboard: zero JS usage — removed from JS in v9, native module
    // still linked. Exclude to match the JS-layer removal.
    'expo-clipboard': {
      platforms: { android: null, ios: null },
    },
    // expo-haptics: only consumed via lazy require('expo-haptics') inside
    // services/haptics.ts. No static top-level import exists anywhere.
    // Excluding here prevents any future accidental static import from
    // causing a Class A Android cold-start boot crash.
    'expo-haptics': {
      platforms: { android: null, ios: null },
    },
  },
};
