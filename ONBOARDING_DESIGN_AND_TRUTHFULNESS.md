# Butler AI Onboarding Design and Truthfulness

## Visual direction

The onboarding uses a consistent dark Butler HUD shell inspired by the supplied reference screens: compact rounded panels, thin page-colored accents, corner brackets, scan-line transitions, restrained particle/grid texture, and a silver Butler robot mascot. Each page keeps the same header, progress, gesture, navigation, and spacing geometry while changing the accent color, role badge, and mascot asset treatment for the page topic.

The first page is intentionally compact and dense rather than a scrolling marketing wall. It introduces the app, shows the six verified product areas, shows the Python console boundary, and labels PC metrics as available only after pairing. It does not render synthetic graphs or imply that a disconnected device is reporting live values.

## Functional flow

The flow contains ten pages: welcome, app tour, consent, safety pledge, legal documents, permissions, questions, server privacy, PC setup, and launch. Next/back/skip/finish preserve the existing guarded navigation contract. Completion is persisted through `services/onboardingState.ts`; returning users do not re-enter onboarding unless Settings invokes the reset action.

The legal-document surface is native and user-controlled. It explains that the document is publicly hosted and opens externally only after the user taps the action. The onboarding no longer embeds a web browser dependency for these documents.

## Server setup boundary

The PC setup page describes the actual Python desktop console server, QR plus manual pairing code, deliberate dependency installation, visible launchers, and the loopback/private-VPN/TLS boundary. It does not promise silent package installation, automatic Ollama/model installation, or a universal one-click installer. The open-source GitHub actions point to the reviewed source/release location.

## Consent and safety

Consent covers adult/developer use, lawful PC authorization, privacy-policy acceptance, connection boundaries, QR-only camera use, and the fact that scripts run with PC permissions. The copy distinguishes local-first operation from optional AI providers, public documents, and remote networking that may transmit data.

## Security claims policy

The onboarding uses implementation-level language such as pairing, authenticated requests, protected local storage, redacted logs, bounded execution, and transport configuration. It avoids absolute claims such as “bulletproof,” “zero telemetry” without runtime evidence, universal AES coverage, or guaranteed cloud absence. The Python server remains a privileged PC bridge and must be run only on an authorized computer with a reviewed network boundary.

## Final accent and motion map

The ten pages now use distinct accents: Welcome cyan, App Tour blue, Consent amber, Safety Pledge red, Legal mint, Permissions green, Q&A pink, Server teal, PC Setup purple, and Launch lime. The shared shell keeps the same geometry so the app feels like one product rather than ten unrelated screens.

Motion is intentionally layered rather than random. The shell supplies the scan-line wipe, shimmer, progress movement, mascot ring rotation, mascot status pulse, page entrance/exit motion, haptic taps, and completion celebration. Page-specific content adds only restrained loops where they communicate state. The welcome screen uses a single ambient status pulse and no synthetic telemetry graph. Effects stop during unmount/cleanup, and the project’s existing FPS/performance guard remains the authority for reducing animation on constrained devices.
