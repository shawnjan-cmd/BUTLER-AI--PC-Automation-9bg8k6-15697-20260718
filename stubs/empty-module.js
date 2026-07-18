// Empty stub — used by Metro resolver to prevent dev-only packages
// (hermes-parser, babel-plugin-syntax-hermes-parser) from being bundled
// into the runtime APK. These packages are only needed by Babel transforms
// at build time and must not appear in the device bundle.
module.exports = {};
