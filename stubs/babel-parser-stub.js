'use strict';
// Stub for @babel/parser — redirected from whatwg-url-stub.js for any
// direct require('@babel/parser') calls. Returns a minimal safe API
// so callers that check typeof parse won't throw.

function emptyFile() {
  return {
    type: 'File',
    program: {
      type: 'Program', body: [], directives: [],
      sourceType: 'module', interpreter: null,
    },
    comments: [],
  };
}

function parse(_code, _opts) { return emptyFile(); }
function parseExpression(_code, _opts) { return { type: 'StringLiteral', value: '' }; }

module.exports = { parse, parseExpression };
module.exports.default = module.exports;
