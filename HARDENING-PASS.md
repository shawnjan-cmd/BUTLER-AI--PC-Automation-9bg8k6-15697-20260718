# HARDENING-PASS.md — v4 → v4-hardened

Scope: safe, additive fixes only. Invasive bulk refactors deferred (noted below) to avoid silently changing behavior.

## Applied
- **§1 tsconfig.json** — added at project root (`extends: expo/tsconfig.base`, `strict: true`, `@/*` path alias).
- **§0 / drop-in** — `app/(tabs)/_layout.tsx` replaced with the verified `_layout.TABS.fixed.tsx` (v11 DIRECT). Restores `notifyOnboardingComplete` export, keeps `SplashScreen` import for any failsafe call sites.
- **§6 comment casing** — `utils/serviceguard.ts` doc comment `@/utils/serviceGuard` → `@/utils/serviceguard` to match the real filename.

## Deferred (require per-file human review, not safe to bulk-automate)
- **§2 LanguageContext** — `LanguageProvider` is defined but only referenced as a string literal in `components/ui/MasterJsonPanel.tsx` (recipe data). No live consumer. Decide (a) mount + wire UI, or (b) delete the file. Both are 1-line changes; deferred pending product decision.
- **§3 AsyncStorage try/catch wrap (67 sites)** — automating the wrap risks swallowing errors that legitimately need to surface to UI state. Recommend file-by-file walk with `rg -n 'AsyncStorage\.' app services contexts`.
- **§4 JSON.parse wrap (59 sites)** — same risk profile as §3. The existing `utils/safeJsonParse.ts` already exists; migration to it should be done per call site.
- **§5 Dimensions.get → useWindowDimensions (24 files)** — converts module-scope constants to hook calls; touches StyleSheet definitions and may break files that read dimensions outside a React component. Per-file refactor.
- **§7 list-key audit** — needs visual inspection of ~385 `.map()` call sites.
- **§8 tsc/eslint pass** — run locally after `bun install`; can't be executed inside this sandbox without the Expo toolchain.
- **§9 Android release config** — cross-check `app.json` / `eas.json` / `android/` manually.

## Verification commands run
```
ls tsconfig.json                                      → present
grep -n "notifyOnboardingComplete" app/(tabs)/_layout.tsx  → present (line 30)
grep -n "serviceguard" utils/serviceguard.ts          → comment fixed
```
