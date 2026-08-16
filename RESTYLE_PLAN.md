# Butler AI — Onboarding and Home Restyle Plan

## Chosen Direction: **The Butler’s Arrival**

The entry experience is designed as a composed command-deck reveal rather than a long informational page. The robot butler is the guide: it enters through a framed service hatch, presents the product’s most important capabilities as verified system cards, and makes the transition from orientation to daily control feel deliberate. The design keeps the existing **NexusMind Omega** palette and monospaced system voice, but uses one dominant focal point per viewport so the interface remains readable on compact Android hardware.

| Principle | Implementation decision |
|---|---|
| **One hero per viewport** | The welcome screen is a bounded composition. It no longer relies on vertical content length to communicate value. |
| **Truthful status language** | Connection, metric, and capability labels preserve their existing real data sources. Offline states remain explicit rather than implying activity. |
| **Contained visual energy** | Cyan signal traces, system rails, and low-opacity grid texture frame content without competing with action controls. |
| **Mascot as a guide, not decoration** | The mascot appears at onboarding entry, at a contextual prompt in the home overview, and never blocks accessibility controls or telemetry values. |
| **Reduced-motion-safe motion** | Essential layout is valid with every animation at rest. Motion is bounded, cancellable on unmount, and disabled when the operating system asks for reduced motion. |

## Onboarding First Page Composition

The welcome screen uses five vertically balanced zones between the existing top status bar and persistent navigation bar. The parent content region has a fixed `flex: 1` height; only the later legal and explanatory onboarding pages retain vertical scrolling.

| Zone | Content | Visual role |
|---|---|---|
| **Signal line** | Existing welcome circuit accent, condensed into a shallow HUD rail | Establishes the local command-center identity without consuming the hero space. |
| **Arrival hatch** | A framed cyan service hatch with `mascot_wave.png` crossing its top edge | Makes the robot butler the immediate focus. The mascot begins lower than the frame and springs upward to a resting position that intentionally exceeds the card boundary. |
| **Trust brief** | Local PC automation statement plus private-by-default / guarded execution markers | Keeps the first-read message factual and scannable. |
| **Capability deck** | Four concise capability chips: script forge, component builder, protected pairing, and live PC state | Replaces a dense six-card grid so narrow screens do not turn into an unreadable wall. |
| **Protocol ribbon** | A compact flow from build → verify → guard → run | Explains the script process visually without presenting an unverified activity feed. |

The mascot hatch uses `overflow: 'visible'`, `zIndex`, and Android elevation so the image can sit beyond its border. The selected portrait `butler-robot-tux.jpg` carries a black HUD field that blends into the existing command-deck background and includes a readable system-log motif, making it more legible than the available cutout assets on small screens. On entry, a spring moves the mascot from the hatch into its final position, then a small breathe loop only affects scale and translateY. On a deliberate downward pull, the fixed first-page capture zone updates a separate `peek` value, causing a small lower-edge mascot indicator to rise into view before returning to rest. This is a directional physical response, not an unintended page scroll.

## Motion Budget

| Motion | Trigger | Duration / behavior | Safety condition |
|---|---|---|---|
| **Mascot arrival** | First page mount | One spring: low origin → border-breaking rest position | Stops during unmount; skipped to rest with reduced motion. |
| **Mascot breathe** | After arrival | Gentle 2.4-second transform loop | Disabled with reduced motion. |
| **Scroll-peek reply** | Downward overscroll / pull gesture on page zero | Direct bounded translation, then spring reset | Page zero remains non-scrollable; this never writes state or navigates. |
| **Capability signal** | Page mount | Low-opacity pulse on active dot | Disabled with reduced motion. |
| **Home helper bob** | Overview only | Small scale/translateY loop | Disabled when app leaves the foreground or reduced motion is active. |

All animations in `onboarding.tsx` continue to use `useNativeDriver: false`, matching the audited Hermes safety rule. Home motion stays transform/opacity-only where native driver use already exists. There are no timers that make network requests, no background work, and no new permissions.

## Home Command Deck Alignment

The overview begins with an **Operations Concierge** card immediately below the existing real connection engine. `mascot_thinking.png` occupies a deliberately small, clipped-at-the-bottom helper window, visually paired with three real context labels: connection status, current next action, and security posture. The helper’s primary action invokes the existing pairing route; it does not create a separate connection flow.

Existing home cards will retain their real values and tap targets, but their presentation will be normalized around the onboarding language: double-weight card edges, bracket corners, compact status rails, larger visual hierarchy for real measurements, and consistent chip spacing. Compact width or enlarged font scales switch multi-column layouts to a single column instead of squeezing metric labels.

## Source and Accessibility Guardrails

The restyle does not add permissions, native modules, external endpoints, user-generated ratings, or invented telemetry. It preserves `AsyncStorage` onboarding completion behavior, existing page swipe/navigation behavior, current AppState polling guards, and haptic service usage. Image sources remain local Expo assets and use `expo-image`, which is already part of the audited dependency set.

## Implementation Record

The welcome step now disables vertical `ScrollView` movement only for page zero, retains it for explanatory/legal steps, and removes the generic page header in favor of the fixed arrival composition. The page-zero gesture responder maps a vertical gesture to a bounded mascot-peek value and springs it back to rest; horizontal swipes retain their original page navigation contract. The hero uses the dark portrait robot image inside an elevated, visible-overflow hatch so its frame deliberately crosses the hatch border.

The home overview now includes an **Operations Concierge** that uses the existing reusable `ButlerMascotMotion` atom with a contextual image dock. It routes only to the existing connection tab, displays connection-dependent copy, and preserves the existing foreground-only telemetry flow. Key overview cards have been normalized toward the same instrument-card edge hierarchy used by the onboarding composition.

## Butler Memory Atlas

The Knowledge screen’s **AI MEM** tab now begins with the Butler Memory Atlas. The component is deliberately a visual index rather than a mock analytics card: its memory count, visible-filter count, pinned count, category nodes, recent signal tags, and state language all derive from the active local fact collection and current filters. When the device is offline, it explicitly communicates that the locally retained cache remains readable; when the paired PC is available, it says only that approved findings can be added.

The composition combines a rotating radial knowledge graph, a protected central recall core, compact protocol rails, a small thinking-butler dock, and actual recent tag chips. It stays bounded on compact Android widths, renders no fabricated findings when the store is empty, and disables its non-essential orbit/breathe motion when the operating system enables reduced motion.

## Validation Record

The completed implementation passed TypeScript compilation with no diagnostics. The route/import guard scan reported **0 broken imports**, **0 web API leaks**, and **0 unregistered tab screens**. Android Metro export completed successfully and emitted the Hermes bundle. The Android release invariant and generated-manifest guards passed after unreferenced legacy Metro stubs were preserved under `archive/legacy/metro-stubs/` instead of the active source tree. The generated manifest allowlist remains unchanged: `CAMERA`, `INTERNET`, `USE_BIOMETRIC`, `USE_FINGERPRINT`, and `VIBRATE`.
