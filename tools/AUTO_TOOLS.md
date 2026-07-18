# Tools — Butler AI Build Automation

## gen-tab-sources.mjs

**Purpose:** Regenerates `constants/tabSourcesBundle.ts` by reading ALL listed source files off disk and embedding them as strings. This is how the `MasterJsonPanel` export button gets real, up-to-date source code without any AI credits.

**Run manually:**
```bash
node tools/gen-tab-sources.mjs
```

**Auto-runs via package.json hooks:**
```json
{
  "scripts": {
    "start": "expo start",
    "prestart": "node tools/gen-tab-sources.mjs",
    "android": "expo run:android",
    "preandroid": "node tools/gen-tab-sources.mjs",
    "build": "eas build",
    "prebuild": "node tools/gen-tab-sources.mjs"
  }
}
```

> **IMPORTANT:** Add the `pre*` lines above to your `package.json` scripts if they are not already there. This ensures `tabSourcesBundle.ts` is always regenerated before any dev server start or native build, keeping the export panel in sync with zero manual effort.

## To add more files to the export:

Edit the `FILES` array at the top of `gen-tab-sources.mjs` and re-run it.

## Auto-heal features:

- Missing files produce a stub registration (never crash the build)  
- Read errors produce a stub registration (never crash the build)
- Backs up existing `tabSourcesBundle.ts` before overwriting
- Restores backup if write fails

## Why not read files at runtime?

In a production APK, only compiled JS ships — the `.tsx` source files don't exist on the device filesystem. `expo-file-system` reads from `documentDirectory`, not from the app bundle. So runtime file reads of source always return "file not found" on real Android builds. The generator solves this by embedding source at build time.
