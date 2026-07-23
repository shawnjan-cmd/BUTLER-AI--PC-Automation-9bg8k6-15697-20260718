/**
 * BUTLER AI — Persistent Work Session & TODO Registry
 * Saved to local file so AI assistant remembers context across messages.
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 *
 * ════════════════════════════════════════════════════════════════
 * USER PREFERENCES (never ask again — always apply automatically)
 * ════════════════════════════════════════════════════════════════
 *
 * WORK STYLE:
 *  • Pretend the user doesn't exist — take full creative control
 *  • Copy/steal code from past builds aggressively — never reinvent
 *  • Use ALL tools available (search_files, read_file, etc.)
 *  • Save credits but never at cost of quality
 *  • No startup black screen errors — NEVER corrupt boot flow
 *  • No looping errors — every change must be non-interfering
 *  • Every message: ask if should continue with pending TODO list
 *  • Always make a detailed upgrade list before coding
 *
 * DESIGN STANDARDS (apply to every component):
 *  • Colors: CYAN #00C8E0, GREEN #00CC96, AMBER #F5A820, PURPLE #9B6AFF,
 *            RED #FF4060, TEAL #00D4AA, BLUE #4A9EFF — NEVER PINK #FF69B4
 *  • Typography: MONO font, bold, robot-themed
 *  • Effects: glow (iOS shadowColor), 3D depth (layered shadows), HUD corners
 *  • All text centered or left-to-right filling space
 *  • No empty space — always fill with tiny info, rotating text, SVG icons
 *  • Every interactive element: spring press animation
 *  • Dividers: animated circuit/neural/spectrum themed
 *
 * DATA RULES:
 *  • Only real data from server APIs — no hardcoded fake mock values
 *  • Show '—' or 'offline' state when not connected
 *  • Every server call: try/catch, abort controller, 7s timeout
 *
 * PERFORMANCE RULES (must work on old Android phones):
 *  • FlatList for any list > 8 items (never ScrollView + map)
 *  • removeClippedSubviews={true} on Android FlatLists
 *  • React.memo on all pure display components
 *  • useCallback/useMemo for expensive operations
 *  • useNativeDriver:true for all transform/opacity animations
 *  • useNativeDriver:false only for color/width/height (JS driver)
 *  • NEVER mix native+JS driver on same Animated.View
 *
 * PLAYSTORE COMPLIANCE:
 *  • App works only in foreground (no background services)
 *  • Permissions auto-update based on actual usage
 *  • Onboarding explains every permission before requesting
 *  • No undisclosed data collection
 *  • Every page passes TabErrorBoundary
 *
 * STARTUP SAFETY:
 *  • Never touch: services/bootGuard.tsx, services/onboardingState.ts
 *  • Never modify: app/(tabs)/_layout.tsx boot logic
 *  • Never add: static top-level imports of expo-camera, expo-clipboard,
 *                expo-av, expo-haptics, expo-video
 *  • Always use: lazy require() / dynamic import() for native modules
 *
 * ════════════════════════════════════════════════════════════════
 * DELETED WIRING LOG (do not re-wire without checking here first)
 * ════════════════════════════════════════════════════════════════
 *
 * DELETED / DISABLED:
 *  [2026-07-22] RuntimeDiagnosticsHUD import in app/_layout.tsx — disabled by user
 *  [2026-07-22] runtimeErrorMonitor in app/_layout.tsx — disabled by user
 *  [2026-07-22] securityAuditEngine in app/_layout.tsx — disabled by user
 *  [2026-07-22] appHealthEngine in app/_layout.tsx — disabled by user
 *  [2026-07-22] useHaptics.ts static import of expo-haptics — replaced with lazy wrapper
 *  [2026-07-22] utils/serviceguard.tsx duplicate — deleted (kept serviceguard.ts)
 *
 * INCOMPLETE / NEEDS WIRING:
 *  [ ] /api/ollama/pull_status polling — server endpoint may not exist on all versions
 *  [ ] Session history encryption key rotation on unpair
 *  [ ] Onboarding permission list auto-sync with actual manifest permissions
 *
 * ════════════════════════════════════════════════════════════════
 * ACTIVE TODO LIST (ordered by priority / impact)
 * ════════════════════════════════════════════════════════════════
 *
 * ════════════════════════════════════════════════════════════════
 * PAST BUILD SALVAGE LOG — components confirmed in codebase
 * ════════════════════════════════════════════════════════════════
 *
 * FOUND IN components/home/MechBay.tsx:
 *  • MechBayHero — industrial Mech Bay header with visor bar, ArcReactor core
 *    (CRT scan line disc + hex address ticks + >/$/|/ terminal glyphs),
 *    brushed metal panels, hazard chevron stripes, bold 3D layered BUTLER AI
 *    title (rgba stacked text layers for extrude depth), telemetry strip below
 *  • HexCommandRing — 2×2 grid with HexShape tile, gauge fill bar, serial badge
 *  • MechPanel — reusable brushed-steel card wrapper (bolt corners, chamfer cuts,
 *    accent top bar, centered 3D section header with underline)
 *  • HazardStripe — animated diagonal yellow/black chevrons (Pacific Rim style)
 *  • VisorBar — scanning eye LED strip with moving pupil + LED cluster
 *  • ArcReactor — animated CRT disc with orbital hex addresses, terminal glyphs,
 *    vertical scanline sweep, radial gradient core hex
 *
 * FOUND IN components/cyber/OmegaLearningLoop.tsx:
 *  • OmegaLearningLoop (compact + full card modes) — self-learning KB sync:
 *    polls /api/learn/status every 5 min, triggers /api/kb/expand background,
 *    expandable stats (total topics, last sync, new entries, poll interval),
 *    animated progress bar tracking next sync cycle, force-sync button
 *  • compact prop: single-line pill showing OMEGA status inline anywhere
 *
 * FOUND IN components/home/NexusCommandCenter.tsx:
 *  • NexusCommandCenter — full hero header with:
 *    - SYS.BOOT label + animated radar circle (JS-driver rotation sweep)
 *    - Live crawler terminal (typewriter shell output, 15 scripted lines)
 *    - LAN scanner panel (4 discovered nodes + animated progress bar)
 *    - Metrics strip (CPU/RAM/DISK/ENC/AUTH/CLOUD 6 pills)
 *    - Feature grid (8 capability tiles: 250+SCRIPTS, LOCAL AI, SIGMA NET KB,
 *      AES256, PIPELINE BLDR, PC HEALTH, LAN ONLY, ZERO CLOUD)
 *    - Quick action row (5 nav buttons: SCRIPTS/KB/INTEL/BUILD/CONFIG)
 *    - Grid background + moving scanline + 5-color stripe
 *
 * FOUND IN components/home/AIBrainMasterpieceCard.tsx:
 *  • AIBrainMasterpieceCard — Neural KB card with:
 *    - NeuralBrain canvas (full-width force graph: 13 nodes + 20 edges,
 *      packet animations along edges, HUD corners, scan beam)
 *    - LevelBar (XP system: NEWBORN→LEARNER→STUDENT→SCHOLAR→EXPERT→
 *      MASTER→SAGE→ORACLE→SENTINEL→NEXUS→OMEGA with shimmer fill)
 *    - StatsRow (VECTORS/SESSIONS/TOPICS/GROW/H — 4 metric cells)
 *    - PersonalMemoryPanel (facts as 3-col chips, upcoming events strip,
 *      add fact/add event forms with type selector)
 *    - QuickCrawler (URL input + quick chips: Python/psutil/Requests/Selenium)
 *    - NeuralTripwire tab (MITM detection: σ deviation, alert level,
 *      baseline building progress bar)
 *    - 4-tab expanded view: BRAIN / MEMORY / CRAWLER / TRIPWIRE
 *
 * FOUND IN components/home/NetworkTopologyCard.tsx:
 *  • NetworkTopologyCard — animated LAN device discovery map:
 *    - CANVAS_H=180 with grid overlay + phone node (center-top)
 *    - Up to 6 server nodes with animated pulse, latency dot (green/amber/red)
 *    - NetworkEdge: animated packet dots flying between phone + server
 *    - Tap node → ServerInfoCard (ip, latency, version, Ollama badge, connect btn)
 *    - Auto-scans on mount via fastProbeLastKnown + quickScan fallback
 *    - Legend bar: <30ms / <100ms / >100ms
 *
 * FOUND IN components/home/SparklineWidget.tsx:
 *  • SparklineWidget — animated sparkline chart with real metrics
 *
 * FOUND IN components/home/HomeTerminalClock.tsx:
 *  • HomeTerminalClock — styled terminal clock with seconds and date
 *
 * FOUND IN components/home/LiveTerminalFeed.tsx:
 *  • LiveTerminalFeed — streaming terminal log card (butler_server.py output style)
 *    with SMART check lines, timestamped entries, WARN/STREAMING labels
 *
 * FOUND IN components/home/AutomationFeed.tsx:
 *  • AutomationFeed — scrolling activity feed with colored entries
 *
 * FOUND IN components/cyber/IsometricKBMap.tsx:
 *  • IsometricKBShardMap — isometric 3D grid visualization of KB shards
 *
 * ════════════════════════════════════════════════════════════════
 * COMPREHENSIVE UPGRADE IDEAS (ranked by impact + copy feasibility)
 * ════════════════════════════════════════════════════════════════
 *
 * IDEA A — RESTORE NexusCommandCenter as the NEW HomeHeader
 *  Copy NexusCommandCenter's SYS.BOOT aesthetic: radar circle, live crawler
 *  terminal, LAN scanner panel, metrics strip, feature grid. Replace current
 *  HomeHeader top section with this (below MiniChatBar, above PAIR PROMPT).
 *  Impact: MASSIVE — entire top-of-page completely transforms.
 *  Code source: components/home/NexusCommandCenter.tsx
 *
 * IDEA B — ADD NetworkTopologyCard to homepage
 *  Show animated LAN topology with phone node + up to 6 discovered Butler
 *  server nodes, packet animations, latency dots. Wire to lanScanner service.
 *  Replace or complement PairPrompt when !isConn.
 *  Impact: HIGH — makes connect flow visually stunning.
 *  Code source: components/home/NetworkTopologyCard.tsx (fully wired)
 *
 * IDEA C — RESTORE OmegaLearningLoop card on homepage
 *  Full-card mode: shows self-learning status, topics count, new entries,
 *  5-min poll cycle progress bar, force-sync button. Wired to /api/learn/status.
 *  Impact: HIGH — shows AI is alive and growing.
 *  Code source: components/cyber/OmegaLearningLoop.tsx (fully wired)
 *
 * IDEA D — RESTORE AIBrainMasterpieceCard to homepage
 *  Bring back NeuralBrain canvas (force graph), LevelBar XP system,
 *  StatsRow, PersonalMemoryPanel, QuickCrawler, NeuralTripwire MITM detection.
 *  MASSIVE content richness — nothing else shows this level of detail.
 *  Impact: MASSIVE — the deepest card in the codebase.
 *  Code source: components/home/AIBrainMasterpieceCard.tsx (fully wired)
 *
 * IDEA E — ADD MechBay hazard stripe dividers everywhere
 *  HazardStripe component (animated yellow/black chevrons) makes every section
 *  separator look industrial and professional. Drop in between every card.
 *  Impact: MEDIUM — huge visual polish upgrade for zero effort.
 *  Code source: components/home/MechBay.tsx — HazardStripe export
 *
 * IDEA F — RESTORE LiveTerminalFeed on homepage
 *  Streaming terminal log widget showing butler_server.py timestamped output.
 *  SMART check / Defender scan / git push / STREAMING status lines.
 *  Impact: HIGH — makes the app look like it's actively doing work.
 *  Code source: components/home/LiveTerminalFeed.tsx
 *
 * IDEA G — RESTORE SelfLearnLoop card (from image screenshots)
 *  Episode / Reward / CPU / Model stats in 4 mini-cards.
 *  Episode Buffer / Reward Signal / CPU Load progress bars.
 *  Model info line (Llama 3.1 8B · 8c · 8GB · Apple Silicon).
 *  Impact: HIGH — from user's reference images, looks stunning.
 *  NOTE: this needs new component — model TRAINING panel.
 *
 * IDEA H — RESTORE IsometricKBMap as a section in knowledge.tsx
 *  3D isometric grid of KB shards — each shard is a colored block.
 *  Impact: MEDIUM-HIGH — makes knowledge page unique and data-rich.
 *  Code source: components/cyber/IsometricKBMap.tsx
 *
 * IDEA I — ADD CompactPageHeader to ALL missing pages
 *  knowledge.tsx (AMBER), logs.tsx (BLUE), settings.tsx (MID),
 *  connect.tsx (TEAL), fileshare.tsx (PURPLE), cosmetic.tsx (BLUE),
 *  builder.tsx (GREEN). All pages need consistent standardized header.
 *  Impact: HIGH — consistency makes app look finished and professional.
 *  Code source: components/ui/CompactPageHeader.tsx (fully built)
 *
 * IDEA J — RESTORE HomeTerminalClock in header area
 *  Compact terminal clock showing HH:MM:SS in mono with date.
 *  Impact: LOW-MEDIUM — adds detail to header bar.
 *  Code source: components/home/HomeTerminalClock.tsx
 *
 * IDEA K — ADD background robot-themed particles to every page
 *  Floating tiny circuit nodes (12-16 dots) drifting at 4px/s behind content.
 *  Position: absolute, pointerEvents:none, opacity 0.04-0.07.
 *  Impact: MEDIUM — subtle but makes every page feel alive.
 *  New component: ~30 lines with Animated.Value array.
 *
 * TIER 1 — CRITICAL / HIGH IMPACT
 *  [x] MiniChatBar v11: full expandable with spring animation, quick-function chips,
 *      tab shortcut row, real API wiring, glow effects — DONE 2026-07-22
 *  [x] QuickActions icons: glowing dark rounded squares (image style) — DONE 2026-07-22
 *  [x] NetworkMetricsBar: horizontal pills (Latency/Net/Disk/Frame/Uptime) — DONE 2026-07-22
 *  [ ] IDEA A: Restore NexusCommandCenter header block (SYS.BOOT + crawler terminal
 *      + LAN scanner + metrics strip + feature grid) ABOVE PAIR PROMPT
 *  [ ] IDEA B: Add NetworkTopologyCard replacing/complementing PairPrompt
 *  [ ] IDEA C: Add OmegaLearningLoop card (full card, real /api/learn/status)
 *  [ ] IDEA D: Add AIBrainMasterpieceCard (NeuralBrain + LevelBar + XP system)
 *  [ ] IDEA I: CompactPageHeader on ALL missing pages
 *      knowledge.tsx (AMBER), logs.tsx (BLUE), settings.tsx (MID)
 *      connect.tsx (TEAL), fileshare.tsx (PURPLE), cosmetic.tsx (BLUE), builder.tsx (GREEN)
 *
 * TIER 2 — VISUAL UPGRADES
 *  [ ] IDEA E: HazardStripe chevron dividers between every major section
 *  [ ] IDEA F: LiveTerminalFeed card on homepage (streaming terminal log)
 *  [ ] IDEA G: SelfLearnLoop card — Episode/Reward/CPU/Model stats + 3 progress bars
 *  [ ] IDEA K: Background robot particles on each page (opacity 0.05, circuit dots)
 *  [ ] Remove ALL duplicate CPU graphs (only 1 per page, de-dupe IntelligenceGraphs)
 *
 * TIER 3 — FUTURE / OPTIONAL
 *  [ ] IDEA H: IsometricKBMap in knowledge.tsx
 *  [ ] IDEA J: HomeTerminalClock compact in header right side
 *  [ ] SBOM (Software Bill of Materials) for Play Store compliance
 *  [ ] TLS auto-generate + certificate pinning wiring
 *  [ ] Onboarding permission list reads from app.json dynamically
 */

export const BUTLER_WORK_SESSION_VERSION = '2026-07-23-v5';
// COMPLETED 2026-07-23-v5:
//  [x] Script Scheduling REMOVED from app UI (Play Store compliance)
//      - Scheduler capability row in RemoteAccessMonetizationCard now removed
//        from CAPS array — scheduler is NOT present in this build anywhere
//      - PlayStoreReviewerNote added to downloads.tsx with full compliance statement
//      - PlayStoreCompliance section added to settings.tsx
//  [x] SafetyArchitecturePanel added to downloads.tsx with:
//      - Unique custom SVG SafetyShieldSVG icon (circuit traces + lock + HUD corners)
//      - 7 expandable safety layer accordion (Consent Gate / Undo / Nefarious Detection
//        / AES-256 / LAN-Only / Zero Telemetry / Hard Stops)
//      - UNDO feature spotlight card
//      - 4 stat cells (7 layers / 40+ blocked patterns / 15m undo / 0 cloud)
//      - Zero Harm Guarantee statement
//  [x] SecurityAudit + PlayStoreReviewerNote in downloads.tsx below safety panel
//
// SCHEDULING POLICY DECISION (permanent):
//  Google Play rejected scheduling because it looked like undisclosed background
//  execution. Decision: scheduler feature REMOVED permanently from free/pro/elite UI.
//  FUTURE: Only locked, non-editable, pre-approved curated scripts (e.g. "Move
//  Downloads folder to Recycle Bin") COULD be schedulable IF:
//    (a) Server-side script is hardcoded and unmodifiable by user
//    (b) A persistent notification is shown while scheduled task is pending
//    (c) User can one-tap cancel at any time from notification
//    (d) Full disclosure added to Play Store listing and privacy policy
//  This requires a separate compliance review before implementing.
// COMPLETED 2026-07-23:
//  [x] HomeHeader replaced with AI COMMAND CENTER v2 (image 2 style)
//      - Robot mascot tall (110x160) on left with HUD corners + live orb
//      - 'AI COMMAND CENTER' eyebrow, 'BUTLER AI' 28px title, subtitle
//      - Status pills: OFFLINE/ONLINE + LOCAL AI + AES-256
//      - SCAN QR TO PAIR (cyan full-width), OPEN AI CHAT (dark border), NEXUS
//      - Scrolling ticker at bottom (JS driver translateX)
//      - Animated scan line (native driver)
//      - Backend code DISABLED — state from props only
//  [x] SecurityShowcase HUD tile grid added to homepage (above SecurityProtocols)
//  [x] SecurityShowcase added to first onboarding page (WelcomePage idx===0)
//  [x] ButlerIcons.tsx created with 10 custom SVG icons
//  [x] All uploads checked: master playbook + UI overhaul = docs only, no new components
//      ButlerIcon SVG code extracted and saved to components/ui/ButlerIcons.tsx

export const DELETED_WIRING = [
  'RuntimeDiagnosticsHUD — app/_layout.tsx',
  'runtimeErrorMonitor — app/_layout.tsx',
  'securityAuditEngine — app/_layout.tsx',
  'appHealthEngine — app/_layout.tsx',
  'expo-haptics static import — hooks/useHaptics.ts',
  'serviceguard.tsx duplicate — utils/',
] as const;

export const DESIGN_COLORS = {
  CYAN:   '#00C8E0',
  GREEN:  '#00CC96',
  AMBER:  '#F5A820',
  PURPLE: '#9B6AFF',
  RED:    '#FF4060',
  TEAL:   '#00D4AA',
  BLUE:   '#4A9EFF',
  PINK_FORBIDDEN: 'NEVER USE THIS — user explicitly banned pink',
} as const;
