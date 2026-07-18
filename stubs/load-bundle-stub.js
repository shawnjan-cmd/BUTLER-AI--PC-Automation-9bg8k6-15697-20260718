'use strict';
// Stub for @expo/metro-runtime/src/async-require/loadBundle.ts
// The real file uses `as typeof import(...)` TypeScript syntax that
// @babel/parser 7.27.x in Flow mode cannot parse (it expects `;` after `import`).
// In production / EAS builds this module is only used by Metro's HMR dev overlay
// and is never called in release bundles. A no-op stub is safe.
function loadBundleAsync(requestUrl) {
  return Promise.resolve();
}
module.exports = loadBundleAsync;
module.exports.default = loadBundleAsync;
module.exports.loadBundleAsync = loadBundleAsync;
