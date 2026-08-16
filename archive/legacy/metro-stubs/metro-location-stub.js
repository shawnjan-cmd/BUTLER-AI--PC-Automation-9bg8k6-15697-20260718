/**
 * Stub for @expo/metro-runtime/src/location/Location.native
 *
 * The real file uses `typeof import('react-native')` TypeScript syntax
 * that @babel/parser 7.27.x rejects when processing in Flow mode.
 *
 * Root cause (pnpm-specific): pnpm stores packages under paths like
 *   node_modules/.pnpm/@expo+metro-runtime@5.0.4_react-native@0.79.3_.../
 *                                             ^^^^^ uses + not /
 * Metro's resolveRequest receives the pnpm store path, which does NOT
 * contain the string '@expo/metro-runtime' (with /), so checks for that
 * exact substring silently miss it.  The fix in metro.config.js now
 * matches on 'metro-runtime' + 'Location.native' (present in all forms)
 * and also registers a blockList pattern as a secondary guard.
 *
 * This stub provides the same public API so Metro and expo-router HMR
 * continue to work correctly at runtime.  The real module is only used
 * by the Metro dev-server reload path — it has zero effect on production.
 */
'use strict';

function getLocation() {
  return {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: '',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
  };
}

function setLocation() {}

// LocationProvider is referenced by some expo-router internals.
// Return children directly so it acts as a transparent wrapper.
function LocationProvider(props) {
  return (props && props.children) || null;
}

// navigate / replace stubs used by expo-router's internal Link component.
function navigate() {}
function replace() {}

module.exports = {
  getLocation,
  setLocation,
  navigate,
  replace,
  LocationProvider,
  // Named export alias some imports expect
  default: { getLocation, setLocation, navigate, replace, LocationProvider },
};
