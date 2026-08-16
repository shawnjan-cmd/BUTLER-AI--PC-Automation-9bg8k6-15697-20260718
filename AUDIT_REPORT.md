# Butler AI Native Expo Pre-UX Hardening Audit

**Audit date:** 2026-08-15  
**Scope:** Active Expo Router source, Expo configuration, generated Android manifest, dependency graph, Metro Android export, and static runtime-risk patterns.  
**Source of truth:** The files and command results in `audit/` are the evidence for this report.

## Outcome

The active native source has passed the available automated checks: TypeScript compilation, route/import guard scan, Expo Doctor, Android Metro export, and an effective generated-manifest permission check. The project is a valid baseline for the next UI/UX phase; it is not yet evidence of a production AAB running on every physical device.

| Validation | Result | Evidence |
|---|---|---|
| Expo Doctor | Passed, 18/18 checks | `audit/expo-doctor-clean.txt` |
| TypeScript | Passed | `audit/final-typecheck.txt` |
| Route/import scan | 0 broken imports, 0 web API leaks, 0 unregistered tabs | `audit/final-guard-scan.txt` |
| Android Metro export | Passed; one Android Hermes bundle, approximately 5.7 MB | `audit/final-android-export.txt` |
| Generated Android manifest | Passed allowlist check | `audit/final-manifest.txt` |
| Package security audit | 0 critical advisories after overrides | `audit/final-pnpm-audit-overrides-applied.json` |

## Confirmed repairs

The audit corrected source issues that were not reliably visible from the UI. Expo `app.json` now describes **Butler AI 5.0.10**, Android `versionCode` **1784400006**, and package `com.butlerai.pc.automation`. The invalid Android `copyright` field was removed because Expo Doctor rejects it.

The generated Android permission surface is now intentionally restricted. Expo prebuild produces only `INTERNET`, `CAMERA`, `VIBRATE`, `USE_BIOMETRIC`, and `USE_FINGERPRINT` as effective permissions. Location, foreground-service, calendar, contacts, media, overlay, audio-recording, and activity-recognition permissions are explicitly denied through `blockedPermissions`. `scripts/check-generated-manifest.mjs` makes this a repeatable check after every native prebuild.

The home telemetry path now avoids background polling, overlapping metrics requests, unbounded request duration, and reconnect bursts. It gates passive work behind foreground state, maintains the 25-second passive cadence, applies caller-respecting timeouts, and de-duplicates token-refresh reconnects. The home layout also collapses its metric and telemetry grids for narrow widths or enlarged system font scales.

Four confirmed inactive legacy modules with broken imports or web-only globals were preserved under `archive/legacy/` and excluded from the active TypeScript/Metro graph. They are not routes or active features. The archive is documented in `archive/legacy/README.md` rather than silently deleted.

The dependency footprint was reduced from 129 to 108 direct dependencies. Unused location, calendar, contacts, audio/video, notifications, sensors, GL, Skia, map, WebRTC, WebView, and deprecated visual modules were removed after confirming no active native source imports. This reduces native build surface, generated permission risk, and low-end-device memory pressure.

## Security and supply-chain status

The initial production dependency audit reported two critical advisories in transitive development/build-tool paths. Current pnpm 11 workspace overrides pin `tar` to `7.5.22` and `shell-quote` to `1.10.0`; the post-override audit reports **0 critical** advisories. It still reports low, moderate, and high transitive advisories. Those should be reassessed at every Expo SDK or dependency upgrade instead of being represented as resolved permanently.

## Known limits and next required verification

The following assertions cannot honestly be proven by this sandbox-only audit and remain required before Play production release:

| Area | Why it remains open | Required validation |
|---|---|---|
| Physical device stability | Emulator/export checks cannot reproduce OEM memory, GPU, battery, or font-scaling behavior | Test release build on compact/low-RAM and standard Android hardware; exercise pairing, camera, haptics, and navigation |
| AAB packaging | The constrained local Gradle environment has historically terminated under native compilation pressure | Build through a high-memory cloud runner, then inspect the emitted AAB manifest and install it on a device |
| Accessibility | Static responsive rules cannot prove spoken labels, focus order, contrast, or touch target quality | Run TalkBack and large-font manual acceptance testing |
| Server integration | The app intentionally does not contact a live PC server during the static audit | Pair with a controlled local Butler server and test offline, timeout, reconnect, and malformed-response paths |
| OnSpace publication | The sandbox can prepare an import archive but cannot write to a private OnSpace editor session | Import the current archive in OnSpace and verify the project preview/build state |

## References

1. [React Native performance guidance](https://reactnative.dev/docs/performance)
2. [React Native AppState documentation](https://reactnative.dev/docs/appstate)
3. [React Native responsive `useWindowDimensions`](https://reactnative.dev/docs/usewindowdimensions)
4. [Expo application performance guidance](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps)
5. [Expo React Native Reanimated documentation](https://docs.expo.dev/versions/latest/sdk/reanimated/)
6. [pnpm workspace settings and overrides](https://pnpm.io/settings#overrides)
