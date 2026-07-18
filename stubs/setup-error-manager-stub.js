'use strict';
// Stub for expo-modules-core/src/sweet/setUpErrorManager.fx.ts
// The real file uses `declare namespace globalThis { ... }` TypeScript ambient
// declaration syntax that @babel/parser 7.27.x in Flow mode cannot parse.
// Its only runtime effect is assigning CodedError onto globalThis —
// a safe no-op stub here lets the rest of expo-modules-core load normally.
try {
  var CodedError = require('expo-modules-core').CodedError;
  if (CodedError && typeof globalThis !== 'undefined') {
    globalThis.ExpoModulesCore_CodedError = CodedError;
  }
} catch (_) {}
module.exports = {};
