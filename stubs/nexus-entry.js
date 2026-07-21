'use strict';
/**
 * nexus-entry.js — Butler AI entry redirect
 *
 * Metro resolveRequest intercepts require('expo-router/entry') and redirects
 * HERE so our URLSearchParams polyfill is guaranteed to run first.
 *
 * The polyfill (url-polyfill-inject.js) is injected separately via
 * polyfillModuleNames and runs even earlier — this is belt-and-suspenders.
 *
 * INFINITE LOOP GUARD: metro.config.js resolveRequest skips the intercept
 * when context.originModulePath includes 'nexus-entry', preventing circular
 * redirect back to this file.
 */

// Belt-and-suspenders: install URLSearchParams again in case polyfillModuleNames
// ran but got bypassed.  This is synchronous and cannot throw.
(function ensureUSP() {
  try {
    if (typeof global !== 'undefined' && !global.__butlerURLPolyfillInstalled) {
      function USP(init) {
        this._p = [];
        if (!init) return;
        if (typeof init === 'string') {
          var s = String(init);
          if (s.charCodeAt(0) === 63) s = s.slice(1);
          if (!s) return;
          var parts = s.split('&');
          for (var i = 0; i < parts.length; i++) {
            var seg = parts[i]; if (!seg) continue;
            var eq = seg.indexOf('=');
            var k = eq < 0 ? seg : seg.slice(0, eq);
            var v = eq < 0 ? '' : seg.slice(eq + 1);
            try { this._p.push([decodeURIComponent(k.replace(/\+/g,' ')), decodeURIComponent(v.replace(/\+/g,' '))]); }
            catch(_){ this._p.push([k,v]); }
          }
        } else if (Array.isArray(init)) {
          for (var j=0;j<init.length;j++) this._p.push([String(init[j][0]),String(init[j][1])]);
        } else if (init && typeof init==='object') {
          var ks=Object.keys(init);
          for (var n=0;n<ks.length;n++) this._p.push([String(ks[n]),String(init[ks[n]])]);
        }
      }
      var P = USP.prototype;
      P.append  = function(k,v){this._p.push([String(k),String(v)]);};
      P.delete  = function(k){var x=String(k);this._p=this._p.filter(function(p){return p[0]!==x;});};
      P.get     = function(k){var x=String(k);for(var i=0;i<this._p.length;i++)if(this._p[i][0]===x)return this._p[i][1];return null;};
      P.has     = function(k){var x=String(k);for(var i=0;i<this._p.length;i++)if(this._p[i][0]===x)return true;return false;};
      P.set     = function(k,v){
        var x=String(k),y=String(v),f=false;
        this._p=this._p.filter(function(p){if(p[0]!==x)return true;if(!f){p[1]=y;f=true;return true;}return false;});
        if(!f)this._p.push([x,y]);
      };
      P.toString=function(){return this._p.map(function(p){
        return encodeURIComponent(p[0]).replace(/%20/g,'+')+
          '='+encodeURIComponent(p[1]).replace(/%20/g,'+');}).join('&');};
      try{if(typeof globalThis!=='undefined')globalThis.URLSearchParams=USP;}catch(_){}
      try{global.URLSearchParams=USP;}catch(_){}
      try{global.__butlerURLPolyfillInstalled=true;}catch(_){}
    }
  } catch(_) {}
})();

// Hand off to real Expo Router entry point.
// Metro will NOT intercept this require() because our resolveRequest loop guard
// checks that originModulePath does NOT include 'nexus-entry'.
try {
  require('expo-router/entry');
} catch (e) {
  // Last-resort: if expo-router/entry fails, write crash key so next boot
  // skips onboarding and shows an error state rather than black screen.
  try {
    var AS = require('@react-native-async-storage/async-storage').default;
    AS.setItem('butler_onboarding_done', '1').catch(function(){});
    AS.setItem('@butler_onboarding_done_v2', '1').catch(function(){});
  } catch(_) {}
  // Re-throw so React's error boundary can catch it
  throw e;
}
