#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = path.join(ROOT, 'node_modules', 'ajv-keywords', 'node_modules', 'ajv');
const targetCodegen = path.join(targetDir, 'dist', 'compile', 'codegen', 'index.js');
let sourceDir = path.join(ROOT, 'node_modules', 'schema-utils', 'node_modules', 'ajv');
let sourceCodegen = path.join(sourceDir, 'dist', 'compile', 'codegen', 'index.js');

if (fs.existsSync(targetCodegen)) process.exit(0);
if (!fs.existsSync(sourceCodegen)) {
  try {
    const require = createRequire(import.meta.url);
    const resolved = require.resolve('ajv/dist/compile/codegen/index.js');
    sourceDir = path.resolve(resolved, '../../../../..');
    sourceCodegen = path.join(sourceDir, 'dist', 'compile', 'codegen', 'index.js');
  } catch {
    const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm');
    if (fs.existsSync(pnpmDir)) {
      const candidates = fs.readdirSync(pnpmDir).filter(name => /^ajv@8(?:[.-]|$)/.test(name));
      for (const name of candidates) {
        const candidateDir = path.join(pnpmDir, name, 'node_modules', 'ajv');
        const candidateCodegen = path.join(candidateDir, 'dist', 'compile', 'codegen', 'index.js');
        if (fs.existsSync(candidateCodegen)) { sourceDir = candidateDir; sourceCodegen = candidateCodegen; break; }
      }
    }
  }
}
if (!fs.existsSync(sourceCodegen)) {
  console.error('[ensure-ajv-compat] compatible ajv source not found; run pnpm install --frozen-lockfile');
  process.exit(1);
}

fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });

try {
  fs.symlinkSync(sourceDir, targetDir, 'dir');
} catch {
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

if (!fs.existsSync(targetCodegen)) {
  console.error('[ensure-ajv-compat] failed to materialize ajv/dist/compile/codegen');
  process.exit(1);
}

console.log('[ensure-ajv-compat] linked nested ajv for expo-router/schema-utils');
