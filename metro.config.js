const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

try { require('./tools/postinstall.js'); } catch (e) {}

const config = getDefaultConfig(__dirname);

// Bump cache to force full rebuild.
config.cacheVersion = 'butler-ai-v5.0.69-crash-playstore-fix';

// Copyright is recorded in the APK manifest and assets/COPYRIGHT.md.
// A custom customSerializer is intentionally NOT used here — async dynamic
// imports inside Metro serializers cause initialization errors on Expo SDK 53.

// NOTE: metro-minify-terser is intentionally NOT configured here.
// Expo SDK 53 ships its own minifier (Hermes bytecode compiler) which
// is faster and Play Store compatible. Adding a custom minifierPath
// without the package installed crashes Metro immediately on startup.
config.transformer = config.transformer || {};

// ── ENTRY INTERCEPT ─────────────────────────────────────────────────────────────
// Redirect expo-router/entry → nexus-entry.js which installs URLSearchParams
// polyfill FIRST, then re-requires expo-router/entry. This is the only reliable
// way to run code before Expo Router since package.json "main" cannot be changed.
const NEXUS_ENTRY = path.resolve(__dirname, 'stubs', 'nexus-entry.js');

// ── STUB PATHS ─────────────────────────────────────────────────────────────────
const URL_POLYFILL_INJECT         = path.resolve(__dirname, 'stubs', 'url-polyfill-inject.js');
const LOCATION_STUB               = path.resolve(__dirname, 'stubs', 'metro-location-stub.js');
const EXPO_FX_STUB                = path.resolve(__dirname, 'stubs', 'expo-fx-stub.js');
const LOAD_BUNDLE_STUB            = path.resolve(__dirname, 'stubs', 'load-bundle-stub.js');
const ERROR_MANAGER_STUB          = path.resolve(__dirname, 'stubs', 'setup-error-manager-stub.js');
const EMPTY_STUB                  = path.resolve(__dirname, 'stubs', 'empty-module.js');
const EXPO_MODULES_FX_STUB        = path.resolve(__dirname, 'stubs', 'expo-modules-fx-stub.js');
const WHATWG_URL_STUB             = path.resolve(__dirname, 'stubs', 'whatwg-url-stub.js');
const BABEL_PARSER_STUB           = path.resolve(__dirname, 'stubs', 'babel-parser-stub.js');
const SCROLL_VIEW_CONTEXT_STUB     = path.resolve(__dirname, 'stubs', 'scroll-view-context-stub.js');
const REQUIRE_NATIVE_WEB_STUB     = path.resolve(__dirname, 'stubs', 'require-native-module-web-stub.js');

// ── LAYER 1: polyfillModuleNames — Metro's direct pre-bundle injection list ──
// This is the LOW-LEVEL Metro API — it directly prepends files before __d() factories.
// It does NOT go through Expo's getDefaultConfig overrides. It is an array, not a fn.
// NATIVE ONLY: web has complete URLSearchParams — don't inject on web.
// Note: Metro uses this array for ALL platforms. We add conditional logic inside
// the file itself (checks for Hermes / incomplete URLSearchParams).
config.serializer = config.serializer || {};
if (!Array.isArray(config.serializer.polyfillModuleNames)) {
  config.serializer.polyfillModuleNames = [];
}
// Prepend our polyfill — it runs before every other module including expo-router
config.serializer.polyfillModuleNames = [
  URL_POLYFILL_INJECT,
  ...config.serializer.polyfillModuleNames,
];

// ── LAYER 2: getPolyfills — secondary injection (belt-and-suspenders) ─────────
// Expo overrides this in getDefaultConfig, so we re-capture AFTER the call above.
const _originalGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = function(options) {
  const existing = _originalGetPolyfills ? _originalGetPolyfills(options) : [];
  const plat = (options && options.platform) || '';
  if (plat === 'web') return Array.isArray(existing) ? existing : [];
  const base = Array.isArray(existing) ? existing : [];
  return [URL_POLYFILL_INJECT, ...base];
};

// ── LAYER 2b: exclude .flow from source extensions ─────────────────────────
// .flow files contain Flow type syntax (`import typeof *`, `declare module`)
// that Hermes parser rejects. Removing 'flow' from sourceExts ensures Metro
// never attempts to parse them as JavaScript source files.
if (Array.isArray(config.resolver.sourceExts)) {
  config.resolver.sourceExts = config.resolver.sourceExts.filter(
    (ext) => ext !== 'flow',
  );
}

// ── LAYER 3: extraNodeModules — npm package name aliasing ────────────────────
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'tr46':          EMPTY_STUB,
  '@babel/parser': BABEL_PARSER_STUB,
};

// ── LAYER 4: BLOCKLIST ────────────────────────────────────────────────────────
const existingBlockList = config.resolver.blockList;

const expoModulesFxPattern      = /.*expo-modules-core[^/\\]*.*\.fx\.ts$/;
const locationBlockPattern      = /.*[/@+]metro-runtime[^/]*.*[/\\]location[/\\]Location\.native\.ts$/;
const expoFxBlockPattern        = /.*[/@+]expo[^/]*[/\\]src[/\\]Expo\.fx\.tsx$/;
const loadBundleBlockPattern    = /.*[/@+]metro-runtime[^/]*.*[/\\]async-require[/\\]loadBundle\.ts$/;
const errorManagerBlockPattern  = /.*expo-modules-core[^/]*.*[/\\]sweet[/\\]setUpErrorManager\.fx\.ts$/;
const requireNativeWebPattern   = /.*expo-modules-core[^/\\]*.*[/\\]src[/\\]requireNativeModule\.web\.ts$/;
// Block ALL .flow files — they contain Flow type syntax Hermes cannot parse
const flowFilePattern           = /.*\.flow$/

const newPatterns = [
  expoModulesFxPattern,
  locationBlockPattern,
  expoFxBlockPattern,
  loadBundleBlockPattern,
  errorManagerBlockPattern,
  requireNativeWebPattern,
  flowFilePattern,
];
config.resolver.blockList = existingBlockList
  ? Array.isArray(existingBlockList)
    ? [...existingBlockList, ...newPatterns]
    : [existingBlockList, ...newPatterns]
  : newPatterns;

// ── Resolve expo-modules-core to the top-level pnpm copy ─────────────────────
const REAL_EXPO_MODULES_CORE = (() => {
  try {
    return path.dirname(require.resolve('expo-modules-core/package.json'));
  } catch {
    return null;
  }
})();

// ── LAYER 5: resolveRequest — per-require module name intercept ───────────────
const _originalResolveRequest = config.resolver && config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isWeb = platform === 'web';

  if (typeof moduleName === 'string') {

    // ── expo-router/entry → nexus-entry.js (URLSearchParams polyfill first) ──
    // CRITICAL: Only intercept the TOP-LEVEL entry point, NOT when nexus-entry.js
    // itself re-requires it (infinite loop guard via __butlerEntryIntercepted).
    if (
      !isWeb &&
      (moduleName === 'expo-router/entry' ||
       moduleName.endsWith('/expo-router/entry.js') ||
       moduleName.endsWith('/expo-router/entry')) &&
      !(context && context.originModulePath && context.originModulePath.includes('nexus-entry'))
    ) {
      return { filePath: NEXUS_ENTRY, type: 'sourceFile' };
    }

    // ── requireNativeModule.web.ts (TypeScript `as` cast — Babel/Flow crash) ──
    if (
      moduleName.includes('requireNativeModule.web') ||
      moduleName.endsWith('requireNativeModule.web.ts') ||
      moduleName.endsWith('requireNativeModule.web')
    ) {
      return { filePath: REQUIRE_NATIVE_WEB_STUB, type: 'sourceFile' };
    }

    // ── ScrollViewContext.js — contains (null: ?React$Context<T>) Flow cast ──────
    // Hermes parser cannot parse this Flow-annotated JS file. The stub returns
    // null (identical runtime value) so ScrollView works exactly the same way.
    if (
      typeof moduleName === 'string' && (
        moduleName.endsWith('/ScrollViewContext') ||
        moduleName.endsWith('/ScrollViewContext.js') ||
        moduleName.includes('ScrollView/ScrollViewContext')
      )
    ) {
      return { filePath: SCROLL_VIEW_CONTEXT_STUB, type: 'sourceFile' };
    }

    // ── .flow files — contain Flow type syntax that Hermes parser rejects ────
    // react-native/index.js has `import typeof * from './index.js.flow'` which
    // is valid Flow but not valid JS/TS. Stub all .flow imports to empty module.
    if (
      typeof moduleName === 'string' && (
        moduleName.endsWith('.flow') ||
        moduleName.endsWith('.js.flow') ||
        moduleName === './index.js.flow'
      )
    ) {
      return { filePath: EMPTY_STUB, type: 'sourceFile' };
    }

    // ── whatwg-url: only stub on NATIVE platforms ─────────────────────────────
    if (!isWeb) {
      const isWhatwgUrl =
        moduleName === 'whatwg-url' ||
        moduleName === 'whatwg-url/webidl2js-wrapper' ||
        moduleName.startsWith('whatwg-url/') ||
        moduleName.includes('/whatwg-url/') ||
        moduleName.includes('\\whatwg-url\\') ||
        moduleName.includes('+whatwg-url+');

      if (isWhatwgUrl) {
        return { filePath: WHATWG_URL_STUB, type: 'sourceFile' };
      }
    }

    // ── tr46 → safe empty (not needed on any platform) ──────────────────────
    if (moduleName === 'tr46' || moduleName.startsWith('tr46/')) {
      return { filePath: EMPTY_STUB, type: 'sourceFile' };
    }

    // ── @babel/parser → safe no-op stub ─────────────────────────────────────
    if (moduleName === '@babel/parser' || moduleName.startsWith('@babel/parser/')) {
      return { filePath: BABEL_PARSER_STUB, type: 'sourceFile' };
    }

    // ── Location.native.ts ───────────────────────────────────────────────────
    if (
      (moduleName.includes('metro-runtime') && moduleName.includes('Location.native')) ||
      moduleName.endsWith('Location.native.ts') ||
      moduleName.endsWith('Location.native')
    ) {
      return { filePath: LOCATION_STUB, type: 'sourceFile' };
    }

    // ── Expo.fx.tsx ──────────────────────────────────────────────────────────
    if (
      (moduleName.includes('/expo/src/Expo.fx') || moduleName.includes('\\expo\\src\\Expo.fx')) ||
      moduleName.endsWith('Expo.fx.tsx') ||
      moduleName.endsWith('Expo.fx')
    ) {
      return { filePath: EXPO_FX_STUB, type: 'sourceFile' };
    }

    // ── loadBundle.ts ────────────────────────────────────────────────────────
    if (
      (moduleName.includes('metro-runtime') && moduleName.includes('loadBundle')) ||
      moduleName.endsWith('loadBundle.ts') ||
      moduleName.endsWith('loadBundle')
    ) {
      return { filePath: LOAD_BUNDLE_STUB, type: 'sourceFile' };
    }

    // ── setUpErrorManager.fx.ts ──────────────────────────────────────────────
    if (
      (moduleName.includes('expo-modules-core') && moduleName.includes('setUpErrorManager')) ||
      moduleName.endsWith('setUpErrorManager.fx.ts') ||
      moduleName.endsWith('setUpErrorManager.fx')
    ) {
      return { filePath: ERROR_MANAGER_STUB, type: 'sourceFile' };
    }

    // ── Broad catch-all: any *.fx.ts inside expo-modules-core ────────────────
    if (
      moduleName.includes('expo-modules-core') &&
      (moduleName.endsWith('.fx.ts') || /\.fx\.ts[/\\]?$/.test(moduleName))
    ) {
      return { filePath: EXPO_MODULES_FX_STUB, type: 'sourceFile' };
    }

    if (/expo-modules-core.*\.fx\.ts$/.test(moduleName)) {
      return { filePath: EXPO_MODULES_FX_STUB, type: 'sourceFile' };
    }

    // ── expo-video ───────────────────────────────────────────────────────────
    if (
      moduleName === 'expo-video' ||
      moduleName.startsWith('expo-video/') ||
      (moduleName.includes('expo-video') && !moduleName.includes('expo-video-thumbnails'))
    ) {
      const videoStub = path.resolve(__dirname, 'stubs', 'expo-video-stub.js');
      if (fs.existsSync(videoStub)) {
        return { filePath: videoStub, type: 'sourceFile' };
      }
    }
  }

  if (moduleName === 'expo-modules-core' && REAL_EXPO_MODULES_CORE) {
    const buildIndex = path.join(REAL_EXPO_MODULES_CORE, 'build', 'index.js');
    if (fs.existsSync(buildIndex)) {
      return { filePath: buildIndex, type: 'sourceFile' };
    }
  }

  if (_originalResolveRequest) {
    return _originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
