# Butler AI — Native Component Merge Report

## Canonical source

The canonical deliverable remains the Expo/React Native Android project under `app/`, `components/`, `services/`, `constants/`, `hooks/`, `contexts/`, `assets/`, and `server/`. Web/TanStack/Vite files, HTML previews, and legacy browser component kitchensinks were treated as visual references only and were not copied into the native runtime.

## Reused or strengthened native pieces

The merge preserves the existing Butler visual system, `ButlerFX`, `SkinHeaderFX`, `FuturisticTabBar`, `SecurityShowcase`, native SVG chart primitives, `serverConnection`, `scriptExecutor`, `knowledgeAccumulator`, `personalMemory`, `encryptedStorage`, `privateDataPolicy`, and the Python desktop console server. The new shared `ButlerAtmosphere` adds one cleanup-safe circuit-grid layer, accent frame, and restrained ambient pulse to the nine main tab screens. The new `ButlerMicrocopy` component adds a small contextual instruction beneath each main screen's atmosphere without introducing another navigation level.

The home knowledge topology now shows a real empty state until a paired server returns knowledge counts; it no longer invents a fallback node count. Home metrics use the shared transport-aware authenticated request path rather than a direct hardcoded HTTP metrics fetch. Static security labels were softened to describe session-token authentication, protected-storage policy, pairing guard, local console, and configured/not-configured states rather than unsupported cryptographic or telemetry guarantees.

## Graph and data policy

Existing native SVG graphs and status visualizations were retained because they are already integrated with live screen data. New graph data was not fabricated. A graph must show a paired/live state or an explicit empty/unavailable message. Randomness remaining in the native project is limited to decorative particle/glitch identity generation and legacy modules; it must not be used as telemetry, knowledge counts, CPU/RAM data, or security evidence.

## Deliberately rejected inputs

The supplied Vite/TanStack/web files, browser HTML previews, `vite.config.ts`, DOM APIs, WebView-only designs, duplicated theme hooks, stale Nexus-branded modules, and packages that conflict with the Expo dependency graph were not merged into the Android runtime. The older handoff notes identify a separate v33 tree with divergent Script Library and Knowledge screens; those files were not blindly overlaid because doing so could destroy the current pairing, onboarding, or route contracts.

## Validation

The native TypeScript check passed after the merge. Expo configuration export and Python server compilation passed in the preceding release checks; they should be rerun by CI/Onspace against its own dependency installation. This source package has not been represented as a compiled APK/AAB or as a completed real-device test. Legacy encryption documentation remains truthful: the existing storage layer is a compatibility boundary and must not be marketed as an unbreakable or certified cryptographic implementation.


## Final graph correction

The home CPU and RAM visuals now render deterministic current samples or an explicit unavailable state. They no longer generate random history bars, fake trend deltas, or fabricated peak values. Historical charts should only be added after the server exposes and the app persists a real time-series endpoint.
