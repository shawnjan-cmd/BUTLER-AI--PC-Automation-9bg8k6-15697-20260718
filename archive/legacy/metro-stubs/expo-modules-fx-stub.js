'use strict';
// Universal stub for expo-modules-core *.fx.ts files.
// These files use TypeScript-only syntax (declare namespace globalThis,
// declare global, as const arrays, typeof import(...)) that @babel/parser
// 7.27.x in Flow mode cannot parse.
//
// The runtime effect of most .fx.ts files is:
//   - setUpErrorManager.fx.ts  → assigns CodedError onto globalThis
//   - Others                   → side-effect only initialisation (often no-ops in non-ExpoGo builds)
//
// This stub safely handles the known side-effect case and is otherwise a no-op.
try {
  // setUpErrorManager.fx.ts assigns globalThis.ExpoModulesCore_CodedError
  if (typeof globalThis !== 'undefined') {
    try {
      var mod = require('expo-modules-core');
      if (mod && mod.CodedError && !globalThis.ExpoModulesCore_CodedError) {
        globalThis.ExpoModulesCore_CodedError = mod.CodedError;
      }
    } catch (_) {}
  }
} catch (_) {}
module.exports = {};
module.exports.default = {};
