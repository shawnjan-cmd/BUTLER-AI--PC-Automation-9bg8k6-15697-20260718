'use strict';
/**
 * nexus-entry.js — Butler AI URLSearchParams patch entry.
 *
 * Metro resolveRequest intercepts require('expo-router/entry') and redirects
 * it here FIRST. This file patches the global URLSearchParams so Hermes gets
 * a complete implementation before Expo Router's BaseRoute runs.
 *
 * INFINITE LOOP GUARD: This file requires('expo-router/entry') at the bottom.
 * The metro config checks context.originModulePath and skips the intercept when
 * the origin is nexus-entry.js, so there is no circular redirect.
 */
(function installUSP() {
  function USP(init) {
    this._p = [];
    if (!init) return;
    if (typeof init === 'string') {
      var s = String(init);
      if (s.charCodeAt(0) === 63) s = s.slice(1);
      if (!s) return;
      var parts = s.split('&');
      for (var i = 0; i < parts.length; i++) {
        if (!parts[i]) continue;
        var eq = parts[i].indexOf('=');
        var k = eq < 0 ? parts[i] : parts[i].slice(0, eq);
        var v = eq < 0 ? '' : parts[i].slice(eq + 1);
        try { this._p.push([decodeURIComponent(k.replace(/\+/g,' ')), decodeURIComponent(v.replace(/\+/g,' '))]); }
        catch (_) { this._p.push([k, v]); }
      }
    } else if (Array.isArray(init)) {
      for (var j = 0; j < init.length; j++) this._p.push([String(init[j][0]), String(init[j][1])]);
    } else if (init && typeof init === 'object') {
      var ks = Object.keys(init);
      for (var n = 0; n < ks.length; n++) this._p.push([String(ks[n]), String(init[ks[n]])]);
    }
  }
  var P = USP.prototype;
  P.append  = function(k,v) { this._p.push([String(k),String(v)]); };
  P.delete  = function(k)   { var x=String(k); this._p=this._p.filter(function(p){return p[0]!==x;}); };
  P.get     = function(k)   { var x=String(k); for(var i=0;i<this._p.length;i++) if(this._p[i][0]===x)return this._p[i][1]; return null; };
  P.getAll  = function(k)   { var x=String(k),o=[]; for(var i=0;i<this._p.length;i++) if(this._p[i][0]===x) o.push(this._p[i][1]); return o; };
  P.has     = function(k)   { var x=String(k); for(var i=0;i<this._p.length;i++) if(this._p[i][0]===x) return true; return false; };
  P.set     = function(k,v) {
    var x=String(k), y=String(v), f=false;
    this._p = this._p.filter(function(p){ if(p[0]!==x) return true; if(!f){p[1]=y;f=true;return true;} return false; });
    if(!f) this._p.push([x,y]);
  };
  P.sort    = function() { this._p.sort(function(a,b){return a[0]<b[0]?-1:a[0]>b[0]?1:0;}); };
  P.forEach = function(cb,t) { for(var i=0;i<this._p.length;i++) cb.call(t,this._p[i][1],this._p[i][0],this); };
  function mkIter(fn, pp) {
    var i=0;
    var it = { next: function(){ return i<pp.length ? {value:fn(pp[i++]),done:false} : {value:undefined,done:true}; } };
    it['@@iterator'] = function(){ return it; };
    try{ if(typeof Symbol!=='undefined'&&Symbol.iterator) it[Symbol.iterator]=function(){return it;}; }catch(_){}
    return it;
  }
  P.keys    = function() { return mkIter(function(p){return p[0];}, this._p.slice()); };
  P.values  = function() { return mkIter(function(p){return p[1];}, this._p.slice()); };
  P.entries = function() { return mkIter(function(p){return [p[0],p[1]];}, this._p.slice()); };
  P['@@iterator'] = P.entries;
  try{ if(typeof Symbol!=='undefined'&&Symbol.iterator) P[Symbol.iterator]=P.entries; }catch(_){}
  P.toString = function() {
    return this._p.map(function(p){
      return encodeURIComponent(p[0]).replace(/%20/g,'+') + '=' + encodeURIComponent(p[1]).replace(/%20/g,'+');
    }).join('&');
  };
  try{ Object.defineProperty(P,'size',{get:function(){return this._p.length;},configurable:true}); }catch(_){}

  // Replace Hermes native (frozen prototype, incomplete) with our full JS impl
  try{ if(typeof globalThis!=='undefined') globalThis.URLSearchParams=USP; }catch(_){}
  try{ if(typeof global!=='undefined') global.URLSearchParams=USP; }catch(_){}
  try{ global.__butlerURLPolyfillInstalled=true; }catch(_){}
})();

// Boot Expo Router — Metro intercept won't redirect THIS require because
// the resolveRequest origin is nexus-entry.js (loop guard in metro.config.js).
require('expo-router/entry');
