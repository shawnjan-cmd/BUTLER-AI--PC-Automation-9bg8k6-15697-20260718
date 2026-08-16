/**
 * expo-video STUB — Butler AI Android SimpleCache crash fix (v3)
 *
 * expo-video registers a VideoModule on Android (media3 SimpleCache). In the
 * OnSpace shared preview container the cache folder is locked by the host APK,
 * causing IllegalStateException inside NativeUnimoduleProxy.getConstants()
 * BEFORE JS runs — "main has not been registered" error.
 *
 * This stub replaces the entire expo-video JS surface with safe no-ops so
 * Metro never bundles any real expo-video code that might trigger the native
 * module initialization path.
 *
 * v3: Converted to lazy getters — NO top-level require('react') or
 * require('react-native'). Top-level requires here resolve as {} (empty)
 * because this stub loads before React Native's module registry is populated,
 * causing "undefined is not a function" APK startup crashes.
 */

'use strict';

// CRITICAL: Lazy getters only — do NOT require react or react-native at top level.
// These are loaded before RN's module registry is populated; top-level requires
// create circular deps that resolve as {} causing "undefined is not a function".
var _React = null;
var _View  = null;
function getReact() { if (!_React) _React = require('react'); return _React; }
function getView()  { if (!_View)  { try { _View = require('react-native').View; } catch (_e) { _View = null; } } return _View; }

// Safe no-op VideoView component — lazily created on first use
var _VideoView = null;
function getVideoView() {
  if (!_VideoView) {
    try {
      _VideoView = getReact().forwardRef(function VideoView(props, _ref) {
        var V = getView();
        if (!V) return null;
        return getReact().createElement(V, { style: props.style });
      });
      _VideoView.displayName = 'VideoView';
    } catch (_e) {
      _VideoView = function VideoView() { return null; };
    }
  }
  return _VideoView;
}

// Safe no-op player object
var NOOP_PLAYER = {
  play: function() {},
  pause: function() {},
  replace: function() {},
  seekBy: function() {},
  seekTo: function() {},
  generateThumbnailsAsync: function() { return Promise.resolve([]); },
  addListener: function() { return { remove: function() {} }; },
  removeAllListeners: function() {},
  currentTime: 0,
  duration: 0,
  playing: false,
  muted: false,
  volume: 1,
  loop: false,
  playbackRate: 1,
  status: 'idle',
  error: null,
  bufferedPosition: 0,
  currentLiveTimestamp: null,
  currentOffsetFromLive: null,
  targetOffsetFromLive: 5,
  staysActiveInBackground: false,
  allowsExternalPlayback: false,
  showNowPlayingNotification: false,
};

// Safe no-op hook
function useVideoPlayer(_source, _setup) {
  return NOOP_PLAYER;
}

// Named exports for sub-path imports.
// VideoView is exposed as a lazy getter so it's only resolved after RN is ready.
module.exports = {
  get VideoView() { return getVideoView(); },
  useVideoPlayer: useVideoPlayer,
  VideoPlayer: NOOP_PLAYER,
  VideoSource: {},
  default: {
    get VideoView() { return getVideoView(); },
    useVideoPlayer: useVideoPlayer,
  },
};

// Support both require() and ES module default import patterns
module.exports.default = module.exports;
