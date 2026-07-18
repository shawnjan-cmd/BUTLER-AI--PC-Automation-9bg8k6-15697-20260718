/**
 * predev.mjs — runs before `expo start` and `eas build`
 * Regenerates constants/tabSourcesBundle.ts from real source files.
 * This ensures the MasterJsonPanel export is always up-to-date.
 * 
 * Wired via package.json "predev" and "prebuild" scripts.
 * 
 * Usage: node tools/predev.mjs
 */

// Just delegate to the main generator
import './gen-tab-sources.mjs';
