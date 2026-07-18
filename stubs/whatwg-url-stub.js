'use strict';
/**
 * COMPLETE URLSearchParams + URL stub for whatwg-url / tr46.
 *
 * WHY THIS EXISTS:
 * Hermes on Android has an *incomplete* native URLSearchParams — .has() / .set()
 * etc. throw "not implemented". expo-router's BaseRoute calls URLSearchParams.has()
 * on every navigation which crashes the app before any JS runs.
 *
 * The package.json "main" field cannot be changed (project constraint), so
 * index.js never runs and its polyfill is invisible. The only reliable intercept
 * is here in the Metro resolver — we redirect every require('whatwg-url') to
 * this stub which ships a fully-working pure-JS URLSearchParams implementation.
 *
 * The URL class below is minimal but covers everything expo-router / expo-linking
 * actually uses (href, origin, pathname, search, hash, host, protocol, port,
 * searchParams).
 */

// ── URLSearchParams — complete pure-JS implementation ─────────────────────────
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
      try {
        this._pairs.push([
          decodeURIComponent(k.replace(/\+/g, ' ')),
          decodeURIComponent(v.replace(/\+/g, ' ')),
        ]);
      } catch (_) { this._pairs.push([k, v]); }
    }
  } else if (Array.isArray(init)) {
    for (var j = 0; j < init.length; j++) {
      this._pairs.push([String(init[j][0]), String(init[j][1])]);
    }
  } else if (init && typeof init === 'object') {
    var keys = Object.keys(init);
    for (var n = 0; n < keys.length; n++) {
      this._pairs.push([String(keys[n]), String(init[keys[n]])]);
    }
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
  for (var i = 0; i < this._pairs.length; i++) {
    if (this._pairs[i][0] === k) return this._pairs[i][1];
  }
  return null;
};
URLSearchParams.prototype.getAll = function(name) {
  var k = String(name), out = [];
  for (var i = 0; i < this._pairs.length; i++) {
    if (this._pairs[i][0] === k) out.push(this._pairs[i][1]);
  }
  return out;
};
URLSearchParams.prototype.has = function(name) {
  var k = String(name);
  for (var i = 0; i < this._pairs.length; i++) {
    if (this._pairs[i][0] === k) return true;
  }
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
  this._pairs.sort(function(a, b) {
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });
};
URLSearchParams.prototype.forEach = function(cb, thisArg) {
  for (var i = 0; i < this._pairs.length; i++) {
    cb.call(thisArg, this._pairs[i][1], this._pairs[i][0], this);
  }
};
URLSearchParams.prototype.keys = function() {
  var pairs = this._pairs, i = 0;
  var iter = {
    next: function() {
      return i < pairs.length
        ? { value: pairs[i++][0], done: false }
        : { value: undefined, done: true };
    },
  };
  iter[typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator'] = function() { return iter; };
  return iter;
};
URLSearchParams.prototype.values = function() {
  var pairs = this._pairs, i = 0;
  var iter = {
    next: function() {
      return i < pairs.length
        ? { value: pairs[i++][1], done: false }
        : { value: undefined, done: true };
    },
  };
  iter[typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator'] = function() { return iter; };
  return iter;
};
URLSearchParams.prototype.entries = function() {
  var pairs = this._pairs, i = 0;
  var iter = {
    next: function() {
      return i < pairs.length
        ? { value: [pairs[i][0], pairs[i++][1]], done: false }
        : { value: undefined, done: true };
    },
  };
  iter[typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator'] = function() { return iter; };
  return iter;
};
var _IterSym = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
URLSearchParams.prototype[_IterSym] = URLSearchParams.prototype.entries;
URLSearchParams.prototype.toString = function() {
  return this._pairs.map(function(p) {
    return encodeURIComponent(p[0]).replace(/%20/g, '+') +
           '=' +
           encodeURIComponent(p[1]).replace(/%20/g, '+');
  }).join('&');
};
Object.defineProperty(URLSearchParams.prototype, 'size', {
  get: function() { return this._pairs.length; },
  configurable: true,
});

// ── Minimal URL implementation ─────────────────────────────────────────────────
// Handles the subset expo-router/expo-linking actually uses.
var URL_REGEX = /^(?:([a-zA-Z][a-zA-Z0-9+\-.]*):\/\/)?([^/?#:]*)?(?::(\d+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/;

function URL(urlStr, base) {
  var str = String(urlStr || '');
  // Resolve relative URL against base
  if (base && !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(str)) {
    var b = typeof base === 'string' ? base : (base && base.href) || String(base);
    var bMatch = b.match(URL_REGEX) || [];
    var proto = (bMatch[1] || 'http') + '://';
    var host  = (bMatch[2] || '') + (bMatch[3] ? ':' + bMatch[3] : '');
    str = str.startsWith('/') ? (proto + host + str) : (proto + host + (bMatch[4] || '/') + str);
  }
  var m = str.match(URL_REGEX) || [];
  this.protocol = (m[1] || 'http') + ':';
  this.hostname = m[2] || '';
  this.port     = m[3] || '';
  this.pathname = m[4] || '/';
  this.search   = m[5] ? ('?' + m[5]) : '';
  this.hash     = m[6] ? ('#' + m[6]) : '';
  this.host     = this.hostname + (this.port ? ':' + this.port : '');
  this.origin   = (this.protocol !== 'http:' && this.protocol !== 'https:' && this.protocol !== 'file:')
    ? 'null'
    : (this.protocol + '//' + this.host);
  this.href     = str;
  this.username = '';
  this.password = '';
  this.searchParams = new URLSearchParams(m[5] || '');
}
URL.prototype.toString = function() { return this.href; };
URL.prototype.toJSON   = function() { return this.href; };
URL.canParse = function(urlStr, base) {
  try { new URL(urlStr, base); return true; } catch(_) { return false; }
};

// ── Patch global BEFORE exporting ─────────────────────────────────────────────
// This runs at module evaluation time — which Metro guarantees happens before
// any module that requires('whatwg-url') tries to use URLSearchParams.
if (typeof global !== 'undefined') {
  global.URLSearchParams = URLSearchParams;
  if (!global.URL || typeof global.URL.canParse !== 'function') {
    global.URL = URL;
  }
}

module.exports = {
  URL: URL,
  URLSearchParams: URLSearchParams,
  parseURL: function(str) { try { return new URL(str); } catch(_) { return null; } },
  serializeURL: function(u) { return u && u.href || String(u); },
  serializeURLOrigin: function(u) { return u && u.origin || 'null'; },
  basicURLParse: function(str, opts) {
    try { return new URL(str, opts && opts.baseURL); } catch(_) { return 'failure'; }
  },
  setTheUsername: function(u, v) { if(u) u.username = v; },
  setThePassword: function(u, v) { if(u) u.password = v; },
  serializePath: function(u) { return u && u.pathname || '/'; },
  cannotHaveAUsernamePasswordPort: function() { return false; },
  hasAnOpaquePath: function(u) { return false; },
  percentEncodeChar: function(c) { return encodeURIComponent(c); },
  utf8PercentEncodeString: function(s) { return encodeURIComponent(s); },
};
module.exports.default = module.exports;
