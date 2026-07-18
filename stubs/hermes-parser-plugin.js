'use strict';
// hermes-parser-plugin.js — minimal no-op Babel plugin shim.
// babel-plugin-syntax-hermes-parser normally installs hermes-parser as the
// Babel parser override. The stock Expo SDK 53 Babel preset handles this
// internally; we only need this file to exist so the require() in
// @react-native/babel-preset/src/configs/main.js does not throw ENOENT.
module.exports = function() { return {}; };
