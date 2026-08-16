# Android Build Validation

Android-only gate. Nothing web is compiled, nothing web is checked.

## Run locally

```bash
npm ci --legacy-peer-deps
npm run validate:android
```

Exit code `0` = clean. Exit code `1` = build is broken and CI will fail.

## What it does

| Stage | Check | Fails on |
|---|---|---|
| 1. Preflight | `main` is `expo-router/entry`; no `index.js` entry; no web files (`vite.config.*`, `capacitor.config.ts`, `index.html`); `metro.config.js` is vanilla `getDefaultConfig(__dirname)` with no `resolveRequest` / `customSerializer` / `blockList`; no `react-native.config.js` autolink overrides; no `stubs/`; `app.json` has `expo.android.package`; every bare import resolves to a real dependency | any invariant broken |
| 2. Typecheck | `tsc --noEmit` | any TypeScript error |
| 3. Compile | `expo export --platform android --clear` | Metro bundle error, missing bundle, or bundle < 100 KB |

Stages run in order and stop at the first failing stage, so the log always
points at the real cause. The temporary `.android-build-check/` output dir is
deleted afterwards.

## CI

`.github/workflows/android-build-validation.yml` runs on every push, PR and
manual dispatch: Node 22 → `npm ci` → `expo install --check` → the validator.
A failure annotates the run with `::error title=Android build validation failed`
and blocks the commit from being considered green.

## Scripts added

```json
"typecheck":            "tsc --noEmit",
"validate:android":     "node ./scripts/validate-android.mjs",
"build:android:check":  "expo export --platform android --output-dir .android-build-check --clear",
"prebuild:android":     "expo prebuild --platform android --no-install"
```
