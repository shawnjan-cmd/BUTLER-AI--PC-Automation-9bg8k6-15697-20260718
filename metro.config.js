const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

try { require('./tools/postinstall.js'); } catch (e) {}

const config = getDefaultConfig(__dirname);

// Bump cache to force full rebuild.
config.cacheVersion = 'butler-ai-v5.0.27-clean75';

// ── COPYRIGHT NOTICE SERIALIZER ───────────────────────────────────────
// Prepends a copyright banner to the COMPILED bundle. This banner
// is present even after minification — it is the first bytes of the
// JS bundle, readable by any hex editor or forensic tool, and serves
// as legally binding notice under the Berne Convention.
const _prevProcessModuleFilter = config.serializer.processModuleFilter;
const COPYRIGHT_BANNER = [
  '/*!',
  ' * Butler AI v8.0.0 (com.butlerai.pc.automation)',
  ' * Copyright (c) 2024-2026 Andrej Sladkovic. All Rights Reserved.',
  ' * PROPRIETARY AND CONFIDENTIAL.',
  ' * Unauthorized copying, reverse-engineering, or distribution of this',
  ' * software or any portion thereof is strictly prohibited.',
  ' * DMCA Protected - 17 U.S.C. Sec. 1201',
  ' * Contact: andrejsladkovic1992@gmail.com',
  ' */',
].join('\n');

const _prevSerializer = config.serializer.customSerializer;
config.serializer.customSerializer = async function(entryPoint, preModules, graph, options) {
  // Call original serializer if present
  let result;
  try {
    if (_prevSerializer) {
      result = await _prevSerializer(entryPoint, preModules, graph, options);
    } else {
      const { default: MetroBundler } = await import('@expo/metro-config/build/serializer/exportHermes.js').catch(() => ({ default: null }));
      return undefined;
    }
  } catch { return undefined; }
  if (typeof result === 'string') {
    return COPYRIGHT_BANNER + '\n' + result;
  }
  return result;
};

// ── AGGRESSIVE MINIFICATION / OBFUSCATION ──────────────────────────────────
// Enabled for ALL builds (dev + prod). This:
//   • Mangles all identifiers to single/double-letter names
//   • Removes all comments (strips copyright from compiled output seen by others)
//   • Collapses variable declarations, inlines constants
//   • Removes dead code and unreachable branches
//   • Makes reverse-engineering the bundle extremely difficult
config.transformer = config.transformer || {};
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  // Compress phase — folds constants, removes dead code
  compress: {
    dead_code:        true,
    drop_console:     false, // keep console for diagnostics
    drop_debugger:    true,
    pure_getters:     true,
    passes:           3,         // 3 compression passes
    unsafe:           true,
    unsafe_comps:     true,
    unsafe_math:      true,
    unsafe_methods:   true,
    unsafe_proto:     true,
    unsafe_undefined: true,
    collapse_vars:    true,
    reduce_vars:      true,
    inline:           3,
    join_vars:        true,
    sequences:        true,
    side_effects:     true,
    evaluate:         true,
    booleans_as_integers: true,
  },
  // Mangle phase — renames every identifier to gibberish
  mangle: {
    toplevel:      true,
    eval:          true,
    keep_fnames:   false,   // rename function names too
    keep_classnames: false,
    properties: {
      regex: /^_/,          // mangle private _prefixed properties
    },
  },
  // Output phase — strip all whitespace/comments
  output: {
    ascii_only:  true,
    beautify:    false,
    comments:    false,   // ← removes all copyright comments from bundle
    semicolons:  false,
    max_line_len: 32000,
  },
  // Module-level — wrap in IIFE to hide global scope
  module: false,
  toplevel: true,
};

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

const newPatterns = [
  expoModulesFxPattern,
  locationBlockPattern,
  expoFxBlockPattern,
  loadBundleBlockPattern,
  errorManagerBlockPattern,
  requireNativeWebPattern,
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
