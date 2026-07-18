'use strict';

// ── TextDecoder / TextEncoder polyfill — MUST be first ──────────────────────
(function _installTextDecoderPolyfill() {
  function _safeDecodeBytes(bytes) {
    var out = '', i = 0;
    while (i < bytes.length) {
      var b = bytes[i++];
      if (b < 0x80) { out += String.fromCharCode(b); }
      else if ((b & 0xe0) === 0xc0 && i < bytes.length) {
        out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
      } else if ((b & 0xf0) === 0xe0 && i + 1 < bytes.length) {
        out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
      } else if ((b & 0xf8) === 0xf0 && i + 2 < bytes.length) {
        var cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      } else { out += String.fromCharCode(b); }
    }
    return out;
  }
  function SafeTextDecoder(encoding) { this.encoding = encoding || 'utf-8'; }
  SafeTextDecoder.prototype.decode = function(input) {
    if (input == null) return '';
    try {
      if (typeof input === 'string') return input;
      var bytes;
      if (input instanceof Uint8Array) bytes = input;
      else if (input instanceof ArrayBuffer) bytes = new Uint8Array(input);
      else if (input && input.buffer instanceof ArrayBuffer) bytes = new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength);
      else { try { bytes = new Uint8Array(input); } catch (_) { return ''; } }
      return _safeDecodeBytes(bytes);
    } catch (_) { return typeof input === 'string' ? input : ''; }
  };
  global.TextDecoder = SafeTextDecoder;
})();

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = function TextEncoder() {};
  global.TextEncoder.prototype.encode = function(str) {
    if (!str) return new Uint8Array(0);
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code < 0x80) bytes.push(code);
      else if (code < 0x800) { bytes.push(0xc0 | (code >> 6)); bytes.push(0x80 | (code & 0x3f)); }
      else { bytes.push(0xe0 | (code >> 12)); bytes.push(0x80 | ((code >> 6) & 0x3f)); bytes.push(0x80 | (code & 0x3f)); }
    }
    return new Uint8Array(bytes);
  };
}

// ── COMPLETE URLSearchParams replacement — MUST run BEFORE react-native-url-polyfill ──
// Hermes Android's native URLSearchParams has a FROZEN prototype — you cannot
// add .has(), .set(), .keys() etc. to it. The only reliable fix is to replace
// global.URLSearchParams entirely with a pure-JS implementation that has all
// methods. This runs before the url-polyfill so that polyfill's URL class
// also gets the complete implementation.
(function _installURLSearchParams() {
  function URLSearchParams(init) {
    this._pairs = [];
    if (!init) return;
    if (typeof init === 'string') {
      var s = String(init);
      if (s.charAt(0) === '?') s = s.slice(1);
      if (!s) return;
      var parts = s.split('&');
      for (var i = 0; i < parts.length; i++) {
        if (!parts[i]) continue;
        var idx = parts[i].indexOf('=');
        var k, v;
        if (idx === -1) { k = parts[i]; v = ''; }
        else { k = parts[i].slice(0, idx); v = parts[i].slice(idx + 1); }
        try { this._pairs.push([decodeURIComponent(k.replace(/\+/g, ' ')), decodeURIComponent(v.replace(/\+/g, ' '))]); } catch (_) { this._pairs.push([k, v]); }
      }
    } else if (Array.isArray(init)) {
      for (var j = 0; j < init.length; j++) { this._pairs.push([String(init[j][0]), String(init[j][1])]); }
    } else if (init && typeof init === 'object') {
      var keys = Object.keys(init);
      for (var n = 0; n < keys.length; n++) { this._pairs.push([String(keys[n]), String(init[keys[n]])]); }
    }
  }

  URLSearchParams.prototype.append = function(name, value) {
    this._pairs.push([String(name), String(value)]);
  };
  URLSearchParams.prototype.delete = function(name) {
    var k = String(name);
    this._pairs = this._pairs.filter(function(p) { return p[0] !== k; });
  };
  URLSearchParams.prototype.get = function(name) {
    var k = String(name);
    for (var i = 0; i < this._pairs.length; i++) { if (this._pairs[i][0] === k) return this._pairs[i][1]; }
    return null;
  };
  URLSearchParams.prototype.getAll = function(name) {
    var k = String(name), out = [];
    for (var i = 0; i < this._pairs.length; i++) { if (this._pairs[i][0] === k) out.push(this._pairs[i][1]); }
    return out;
  };
  URLSearchParams.prototype.has = function(name) {
    var k = String(name);
    for (var i = 0; i < this._pairs.length; i++) { if (this._pairs[i][0] === k) return true; }
    return false;
  };
  URLSearchParams.prototype.set = function(name, value) {
    var k = String(name), v = String(value), found = false;
    this._pairs = this._pairs.filter(function(p) {
      if (p[0] !== k) return true;
      if (!found) { p[1] = v; found = true; return true; }
      return false;
    });
    if (!found) this._pairs.push([k, v]);
  };
  URLSearchParams.prototype.sort = function() {
    this._pairs.sort(function(a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  };
  URLSearchParams.prototype.forEach = function(cb, thisArg) {
    for (var i = 0; i < this._pairs.length; i++) { cb.call(thisArg, this._pairs[i][1], this._pairs[i][0], this); }
  };
  URLSearchParams.prototype.keys = function() {
    var pairs = this._pairs, i = 0;
    return { next: function() { return i < pairs.length ? { value: pairs[i++][0], done: false } : { value: undefined, done: true }; },
      '@@iterator': function() { return this; } };
  };
  URLSearchParams.prototype.values = function() {
    var pairs = this._pairs, i = 0;
    return { next: function() { return i < pairs.length ? { value: pairs[i++][1], done: false } : { value: undefined, done: true }; },
      '@@iterator': function() { return this; } };
  };
  URLSearchParams.prototype.entries = function() {
    var pairs = this._pairs, i = 0;
    return { next: function() { return i < pairs.length ? { value: [pairs[i][0], pairs[i++][1]], done: false } : { value: undefined, done: true }; },
      '@@iterator': function() { return this; } };
  };
  URLSearchParams.prototype['@@iterator'] = URLSearchParams.prototype.entries;
  URLSearchParams.prototype.toString = function() {
    return this._pairs.map(function(p) {
      return encodeURIComponent(p[0]).replace(/%20/g, '+') + '=' + encodeURIComponent(p[1]).replace(/%20/g, '+');
    }).join('&');
  };
  Object.defineProperty(URLSearchParams.prototype, 'size', {
    get: function() { return this._pairs.length; }, configurable: true,
  });

  // UNCONDITIONALLY replace — Hermes native implementation is incomplete
  global.URLSearchParams = URLSearchParams;
})();

// Save our complete URLSearchParams BEFORE the url-polyfill can overwrite it.
// react-native-url-polyfill/auto ships whatwg-url's URLSearchParams which is ALSO
// incomplete on Hermes — it replaces global.URLSearchParams with one missing .has()
// We load it only for its URL implementation, then immediately restore ours.
var _OurURLSearchParams = global.URLSearchParams;
try { require('react-native-url-polyfill/auto'); } catch (_) {}
// Restore — our implementation is complete; whatwg-url's is not
global.URLSearchParams = _OurURLSearchParams;

// Extra safety: ensure expo-router's whatwg-url copy also uses our impl.
// Some versions import URLSearchParams at the top of their own module scope,
// so we patch the whatwg-url package's exports too if accessible.
try {
  var _whatwg = require('whatwg-url');
  if (_whatwg && _whatwg.URLSearchParams) {
    _whatwg.URLSearchParams = _OurURLSearchParams;
  }
} catch (_) {}

// Boot the app
require('expo-router/entry');
