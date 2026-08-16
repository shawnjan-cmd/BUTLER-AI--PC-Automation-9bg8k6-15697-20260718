'use strict';
/**
 * require-native-module-web-stub.js
 *
 * Safe stub for expo-modules-core/src/requireNativeModule.web.ts
 *
 * The original file uses TypeScript generics + `as` type cast:
 *   return {} as ModuleType;
 * which @babel/parser 7.27.x in Flow mode cannot parse (reports
 * "Missing semicolon"). This stub provides the same runtime contract:
 *   - requireNativeModule(name) → {} (empty proxy, safe no-op on web)
 *   - requireOptionalNativeModule(name) → null
 */

function requireNativeModule(moduleName) {
  // On web, native modules don't exist. Return an empty object rather than
  // throwing, so callers that use optional chaining won't crash.
  if (typeof window === 'undefined') {
    // SSR: same behaviour as the original
    return {};
  }
  return {};
}

function requireOptionalNativeModule(moduleName) {
  return null;
}

module.exports = { requireNativeModule, requireOptionalNativeModule };
module.exports.default = module.exports;
module.exports.requireNativeModule = requireNativeModule;
module.exports.requireOptionalNativeModule = requireOptionalNativeModule;
