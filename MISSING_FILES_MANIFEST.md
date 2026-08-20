# Missing Files Manifest

**Source (has the files):** BUTLER-AI-Upgraded.zip  
**Target (missing the files):** BUTLER_AI_Onspace_Master_v10.zip

Every file below exists in the Upgraded build but was not found anywhere in the Master v10 build (checked by full path, and by filename in case of moves/renames — none were found elsewhere).

## Summary

| Category | Files | Size |
|---|---|---|
| Config & Environment | 4 | 652.6 KB |
| App Screens | 1 | 20.5 KB |
| Components | 12 | 299.8 KB |
| Services | 3 | 28.7 KB |
| Documentation | 2 | 16.1 KB |
| Image Assets - Mascots | 18 | 58.50 MB |
| Image Assets - Other | 3 | 481.8 KB |
| Screenshots | 5 | 205.4 KB |
| Store Listing | 5 | 479.0 KB |
| **Total** | **53** | **60.64 MB** |

## Config & Environment (4 files)

| File | Size |
|---|---|
| `.emergent/emergent.yml` | 182 B |
| `.env` | 123 B |
| `.env.example` | 173 B |
| `package-lock.json` | 652.1 KB |

## App Screens (1 file)

| File | Size |
|---|---|
| `app/(tabs)/nexushome.tsx` | 20.5 KB |

## Components (12 files)

| File | Size |
|---|---|
| `components/home/AIBrainMasterpieceCard.tsx` | 47.1 KB |
| `components/layout/AskBar.tsx` | 4.5 KB |
| `components/layout/TopBar.tsx` | 4.7 KB |
| `components/ui/BiometricLockOverlay.tsx` | 17.6 KB |
| `components/ui/ButlerMascot.tsx` | 1.7 KB |
| `components/ui/MasterJsonPanel.tsx` | 90.3 KB |
| `components/ui/NexusFX.tsx` | 25.3 KB |
| `components/ui/NexusTabIcons.tsx` | 17.2 KB |
| `components/ui/NexusVaultCard.tsx` | 41.3 KB |
| `components/ui/PCRemoteCockpit.tsx` | 28.3 KB |
| `components/ui/PerformanceMonitorWidget.tsx` | 21.6 KB |
| `components/ui/PostOnboardingChat.tsx` | 248 B |

## Services (3 files)

| File | Size |
|---|---|
| `services/appHealthEngine.ts` | 19.2 KB |
| `services/autoResearch.ts` | 5.3 KB |
| `services/performanceTuner.ts` | 4.3 KB |

## Documentation (2 files)

| File | Size |
|---|---|
| `docs/guides/AUTHENTICATION_GUIDE.md` | 6.6 KB |
| `docs/guides/OLLAMA_SETUP_COMPLETE_GUIDE.md` | 9.5 KB |

## Image Assets - Mascots (18 files)

| File | Size |
|---|---|
| `assets/images/mascot_celebrate.png` | 2.91 MB |
| `assets/images/mascot_celebrate_original.png` | 2.94 MB |
| `assets/images/mascot_code.png` | 3.07 MB |
| `assets/images/mascot_code_original.png` | 3.06 MB |
| `assets/images/mascot_error.png` | 3.31 MB |
| `assets/images/mascot_error_original.png` | 2.97 MB |
| `assets/images/mascot_point.png` | 4.41 MB |
| `assets/images/mascot_point_original.png` | 2.94 MB |
| `assets/images/mascot_scan.png` | 3.19 MB |
| `assets/images/mascot_scan_original.png` | 3.01 MB |
| `assets/images/mascot_sleep.png` | 2.88 MB |
| `assets/images/mascot_sleep_original.png` | 2.97 MB |
| `assets/images/mascot_success.png` | 3.41 MB |
| `assets/images/mascot_success_original.png` | 2.83 MB |
| `assets/images/mascot_think.png` | 4.33 MB |
| `assets/images/mascot_think_original.png` | 2.88 MB |
| `assets/images/mascot_wave.png` | 4.44 MB |
| `assets/images/mascot_wave_original.png` | 2.95 MB |

## Image Assets - Other (3 files)

| File | Size |
|---|---|
| `assets/images/nexus-circuit-grid.jpg` | 80.3 KB |
| `assets/images/nexus-robot-mascot.png` | 241.0 KB |
| `assets/images/nexus-robot-v2.png` | 160.6 KB |

## Screenshots (5 files)

| File | Size |
|---|---|
| `assets/screenshots/screenshot_1_homepage.png` | 39.4 KB |
| `assets/screenshots/screenshot_2_chat.png` | 37.2 KB |
| `assets/screenshots/screenshot_3_qr.png` | 43.9 KB |
| `assets/screenshots/screenshot_4_scripts.png` | 46.1 KB |
| `assets/screenshots/screenshot_5_settings.png` | 38.8 KB |

## Store Listing (5 files)

| File | Size |
|---|---|
| `store-listing/for-app-reviewers.jpg` | 84.7 KB |
| `store-listing/google-play-compliant.jpg` | 35.0 KB |
| `store-listing/playstore-feature-graphic.jpg` | 61.3 KB |
| `store-listing/playstore-icon.png` | 232.6 KB |
| `store-listing/playstore-screenshot-1.jpg` | 65.4 KB |

## How to use this

**Drop-in ready (assets, docs, config):** copy these into the same relative path in your Master v10 project. No code changes needed.
- Image Assets (Mascots, Other, Screenshots, Store Listing)
- Documentation
- Config & Environment — check `.env` doesn't clash with any `.env` already in your Master v10 project before overwriting

**Needs integration (code):** these 16 files (1 screen + 12 components + 3 services) exist in Upgraded but were never added to Master v10. Copying them in makes the files present, but they won't do anything until something imports/renders them — check whether Master v10's `app/(tabs)/` layout, navigation, or other components are meant to reference them. They may also import other Upgraded-only files, so pull in the whole set together rather than picking individual ones.
- App Screens, Components, Services

**package-lock.json:** only copy this over if Master v10's `package.json` matches the Upgraded one — otherwise it'll lock the wrong dependency versions.
