'use strict';
/**
 * url-polyfill-inject.js
 *
 * PURPOSE: Injected via Metro's `serializer.polyfillModuleNames` so it runs
 * as the ABSOLUTE FIRST code in the bundle — before any __d() module factory.
 * Also injected via `serializer.getPolyfills` as a belt-and-suspenders fallback.
 *
 * WHY: Hermes Android's native URLSearchParams is frozen and incomplete —
 * .has(), .set(), .keys(), .values(), .entries() all throw "not implemented".
 * expo-router's BaseRoute calls URLSearchParams.has() on every navigation,
 * crashing the app immediately after launch.
 *
 * Since package.json "main" = "expo-router/entry" (cannot be changed), index.js
 * never runs and can't be used for early polyfilling.
 *
 * SAFE ON WEB: checks if we're in a browser context and skips replacement if
 * the native URLSearchParams already has working .has() (web browsers).
 */
(function installURLPolyfill() {
  'use strict';

  // Skip on web — browsers have complete URLSearchParams
  try {
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // ReactNative environment — proceed with polyfill
    } else if (typeof window !== 'undefined' && typeof window.URLSearchParams === 'function') {
      // Check if native implementation actually works
      try {
        var testUSP = new window.URLSearchParams('a=1');
        if (testUSP.has('a')) return; // Native is complete, skip
      } catch (_) {}
    }
  } catch (_) {}

  // ── Complete pure-JS URLSearchParams ──────────────────────────────────────
  function URLSearchParams(init) {
    this._p = [];
    if (!init) return;
    if (typeof init === 'string') {
      var s = String(init);
      if (s.charCodeAt(0) === 63) s = s.slice(1); // remove leading '?'
      if (!s) return;
      var parts = s.split('&');
      for (var i = 0; i < parts.length; i++) {
        var seg = parts[i];
        if (!seg) continue;
        var eq = seg.indexOf('=');
        var k, v;
        if (eq === -1) { k = seg; v = ''; }
        else { k = seg.slice(0, eq); v = seg.slice(eq + 1); }
        try {
          this._p.push([
            decodeURIComponent(k.replace(/\+/g, ' ')),
            decodeURIComponent(v.replace(/\+/g, ' ')),
          ]);
        } catch (_) { this._p.push([k, v]); }
      }
    } else if (Array.isArray(init)) {
      for (var j = 0; j < init.length; j++) {
        this._p.push([String(init[j][0]), String(init[j][1])]);
      }
    } else if (init && typeof init === 'object') {
      var keys = Object.keys(init);
      for (var n = 0; n < keys.length; n++) {
        this._p.push([String(keys[n]), String(init[keys[n]])]);
      }
    }
  }

  var P = URLSearchParams.prototype;

  P.append = function(k, v) { this._p.push([String(k), String(v)]); };

  P.delete = function(k) {
    var key = String(k);
    this._p = this._p.filter(function(pair) { return pair[0] !== key; });
  };

  P.get = function(k) {
    var key = String(k);
    for (var i = 0; i < this._p.length; i++) {
      if (this._p[i][0] === key) return this._p[i][1];
    }
    return null;
  };

  P.getAll = function(k) {
    var key = String(k), out = [];
    for (var i = 0; i < this._p.length; i++) {
      if (this._p[i][0] === key) out.push(this._p[i][1]);
    }
    return out;
  };

  P.has = function(k) {
    var key = String(k);
    for (var i = 0; i < this._p.length; i++) {
      if (this._p[i][0] === key) return true;
    }
    return false;
  };

  P.set = function(k, v) {
    var key = String(k), val = String(v), found = false;
    this._p = this._p.filter(function(pair) {
      if (pair[0] !== key) return true;
      if (!found) { pair[1] = val; found = true; return true; }
      return false;
    });
    if (!found) this._p.push([key, val]);
  };

  P.sort = function() {
    this._p.sort(function(a, b) {
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    });
  };

  P.forEach = function(cb, thisArg) {
    for (var i = 0; i < this._p.length; i++) {
      cb.call(thisArg, this._p[i][1], this._p[i][0], this);
    }
  };

  function makeIter(fn, pairs) {
    var idx = 0;
    var iter = {
      next: function() {
        if (idx < pairs.length) { return { value: fn(pairs[idx++]), done: false }; }
        return { value: undefined, done: true };
      },
    };
    try {
      if (typeof Symbol !== 'undefined' && Symbol.iterator) {
        iter[Symbol.iterator] = function() { return iter; };
      }
    } catch (_) {}
    iter['@@iterator'] = function() { return iter; };
    return iter;
  }

  P.keys    = function() { return makeIter(function(p) { return p[0]; }, this._p.slice()); };
  P.values  = function() { return makeIter(function(p) { return p[1]; }, this._p.slice()); };
  P.entries = function() { return makeIter(function(p) { return [p[0], p[1]]; }, this._p.slice()); };

  try {
    if (typeof Symbol !== 'undefined' && Symbol.iterator) {
      P[Symbol.iterator] = P.entries;
    }
  } catch (_) {}
  P['@@iterator'] = P.entries;

  P.toString = function() {
    return this._p.map(function(p) {
      return encodeURIComponent(p[0]).replace(/%20/g, '+') +
             '=' +
             encodeURIComponent(p[1]).replace(/%20/g, '+');
    }).join('&');
  };

  try {
    Object.defineProperty(P, 'size', {
      get: function() { return this._p.length; },
      configurable: true,
      enumerable: false,
    });
  } catch (_) {}

  // ── Minimal URL class ─────────────────────────────────────────────────────
  var URL_RE = /^(?:([a-zA-Z][a-zA-Z0-9+\-.]*):\/\/)?([^/?#:@]*)?(?::(\d+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/;

  function URL(href, base) {
    var str = String(href || '');
    if (base && !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(str)) {
      var b = typeof base === 'string' ? base : String((base && base.href) || base);
      var bm = b.match(URL_RE) || [];
      var bp = (bm[1] || 'http') + '://';
      var bh = (bm[2] || '') + (bm[3] ? ':' + bm[3] : '');
      str = str.charAt(0) === '/'
        ? bp + bh + str
        : bp + bh + (bm[4] || '/') + str;
    }
    var m = str.match(URL_RE) || [];
    this.protocol     = (m[1] || 'http') + ':';
    this.hostname     = m[2] || '';
    this.port         = m[3] || '';
    this.pathname     = m[4] || '/';
    this.search       = m[5] ? ('?' + m[5]) : '';
    this.hash         = m[6] ? ('#' + m[6]) : '';
    this.host         = this.hostname + (this.port ? ':' + this.port : '');
    this.origin       = (/^https?:$/.test(this.protocol) || this.protocol === 'file:')
      ? this.protocol + '//' + this.host
      : 'null';
    this.href         = str;
    this.username     = '';
    this.password     = '';
    this.searchParams = new URLSearchParams(m[5] || '');
  }
  URL.prototype.toString = function() { return this.href; };
  URL.prototype.toJSON   = function() { return this.href; };
  URL.canParse = function(u, b) { try { void new URL(u, b); return true; } catch (_) { return false; } };

  // ── Patch globals UNCONDITIONALLY on React Native ─────────────────────────
  // Always replace on RN — Hermes native URLSearchParams is frozen and incomplete.
  try {
    if (typeof globalThis !== 'undefined') {
      globalThis.URLSearchParams = URLSearchParams;
      if (!globalThis.URL || typeof globalThis.URL.canParse !== 'function') {
        globalThis.URL = URL;
      }
    }
  } catch (_) {}
  try {
    if (typeof global !== 'undefined') {
      global.URLSearchParams = URLSearchParams;
      if (!global.URL || typeof global.URL.canParse !== 'function') {
        global.URL = URL;
      }
    }
  } catch (_) {}

  // Mark that our polyfill ran — useful for debugging
  try {
    if (typeof global !== 'undefined') global.__butlerURLPolyfillInstalled = true;
  } catch (_) {}

})();
