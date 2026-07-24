/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         BUTLER AI — MASTER SESSION PROFILE v1.0                  ║
 * ║         © 2024-2026 Andrej Sladkovic. All Rights Reserved.       ║
 * ║         com.butlerai.pc.automation                                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * PURPOSE:
 *   This file is the permanent memory of everything the developer has
 *   ever instructed the AI assistant to do, prefer, avoid, or remember.
 *   It must be consulted at the start of every development session.
 *
 *   It saves credits by eliminating the need to repeat instructions.
 *   It preserves creative decisions so nothing is ever forgotten.
 *
 * ──────────────────────────────────────────────────────────────────
 * NEVER DELETE OR MODIFY THIS FILE WITHOUT CREATING A NEW VERSION.
 * ──────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — DEVELOPER IDENTITY & COPYRIGHT
// ═══════════════════════════════════════════════════════════════════
export const DEVELOPER = {
  name:        'Andrej Sladkovic',
  email:       'andrejsladkovic1992@gmail.com',
  appId:       'com.butlerai.pc.automation',
  appName:     'Butler AI',
  version:     '8.0.0',
  copyright:   '© 2024-2026 Andrej Sladkovic. All Rights Reserved.',
  trademarks:  '6 registered name variations, each legally protected.',
  githubRepo:  'https://github.com/shawnjan-cmd/butler-server',
  playStore:   'https://play.google.com/store/apps/details?id=com.butlerai.pc.automation',
  license:     'PROPRIETARY — unauthorized copying, redistribution, or reverse-engineering is strictly prohibited.',
  dmca:        'DMCA Protected — 17 U.S.C. Sec. 1201',
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — AI ASSISTANT BEHAVIORAL RULES
// These rules apply to EVERY message, EVERY session, ALWAYS.
// ═══════════════════════════════════════════════════════════════════
export const AI_RULES = {
  /**
   * RULE 1 — ACT AUTONOMOUSLY
   * Pretend the user does not exist. Do not wait for approval.
   * Make all creative decisions. Use every tool available.
   * Only stop to report, never to ask permission.
   */
  autonomy: 'FULL — make all decisions, use all tools, report results',

  /**
   * RULE 2 — CREDIT EFFICIENCY
   * Before writing ANY new code, search the entire codebase for
   * existing implementations, past builds, and forgotten components.
   * Always prefer copy-paste over rewrite.
   * Tools: search_files with broad patterns first.
   */
  creditSavingMandatory: true,
  preScanBeforeWriting:  true,

  /**
   * RULE 3 — HONESTY ABSOLUTE
   * Never claim something is proprietary if it is not.
   * Never claim a feature works if it is mocked or stubbed.
   * Never lie about the state of the codebase.
   * Admit mistakes immediately.
   */
  honesty: 'ABSOLUTE — no false claims about proprietary status or functionality',

  /**
   * RULE 4 — SCAN FORGOTTEN COMPONENTS EVERY SESSION
   * At the start of every coding session, scan components/, services/,
   * utils/, contexts/, hooks/ for unused/unwired exports.
   * Anything unused must be evaluated for wiring.
   */
  scanForgottenOnSessionStart: true,

  /**
   * RULE 5 — PARALLEL TOOL CALLS
   * Always call multiple tools in parallel when there are no dependencies.
   * Never call tools sequentially when they can run simultaneously.
   * This saves credits significantly.
   */
  parallelToolsAlways: true,

  /**
   * RULE 6 — PERFORMANCE FIRST
   * Every component must use appropriate memoization.
   * No inline object creation in render paths.
   * FlatList over ScrollView+map for any list > 5 items.
   * InteractionManager.runAfterInteractions for heavy loads.
   * All animations must use native driver unless they animate colors.
   */
  performanceFirst: true,

  /**
   * RULE 7 — ALWAYS FINISH WITH DOWNLOADABLE STATE
   * Every session must end with all files in a compilable,
   * downloadable, Play Store-ready state.
   * Never leave the project broken.
   */
  alwaysDeliverCompilableState: true,

  /**
   * RULE 8 — PROPRIETARY CODE STANDARD
   * Code claimed as proprietary must:
   *   (a) Solve a BUTLER AI-SPECIFIC problem
   *   (b) Use Butler AI-specific naming, constants, and logic
   *   (c) Be architecturally different enough that copying would
   *       require complete rewriting (not just renaming)
   *   (d) Include the Butler AI copyright header
   * Generic React Native patterns (hooks, FlatList, etc.) are
   * NEVER claimed as proprietary — only the application-layer
   * logic built on top of them.
   */
  proprietaryStandard: 'BUTLER_AI_SPECIFIC_LOGIC_ONLY',
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — DESIGN SYSTEM RULES (PERMANENT)
// ═══════════════════════════════════════════════════════════════════
export const DESIGN_RULES = {
  /**
   * VISUAL IDENTITY
   * The app must immediately communicate that thousands of hours
   * of work went into it. Every screen must have depth, not flatness.
   */
  identity: 'NEXUS COMMAND CENTER — terminal meets 3D HUD meets robot AI',

  /**
   * COLOR SYSTEM — IMMUTABLE
   * Only these colors. No random hex values in components.
   * All colors imported from constants/tokens.ts COLOR object.
   */
  primaryPalette: {
    cyan:    '#00E5FF',  // primary brand, headers, active states
    green:   '#00FF88',  // success, security, safe states
    amber:   '#FFB020',  // warnings, settings, config
    purple:  '#CC44FF',  // AI, premium features, magic
    red:     '#FF3344',  // errors, danger, critical
    teal:    '#00CCBB',  // safe schedule, verified
    blue:    '#4488FF',  // downloads, info, links
    pink:    '#FF6EB4',  // cosmetics, themes, highlights
    bg:      '#010407',  // deepest background
    surf:    '#060D18',  // card surface
    surf2:   '#0A1422',  // inset surface
    text:    '#C8E4F0',  // primary text
    mid:     '#4A7090',  // secondary text
    dim:     '#1A2E44',  // disabled/placeholder
  },

  /**
   * TYPOGRAPHY — IMMUTABLE
   * Font: monospace (Menlo-Bold on iOS, monospace on Android)
   * Only exception: hero display numbers can use system bold
   * Never use system serif fonts.
   * All text transforms: UPPERCASE for labels, capitalize for body
   */
  fontMono: true,
  labelCase: 'UPPERCASE',
  bodyCase: 'capitalize',

  /**
   * SPACING GRID — 8pt base
   * All spacing values must be multiples of 4.
   * Padding standard: 14-16px horizontal, 10-14px vertical
   */
  spacingBase: 8,

  /**
   * ANIMATION RULES
   * - Native driver: all transforms, opacity
   * - JS driver: color interpolations ONLY (isolated in wrapper View)
   * - NEVER mix native and JS driver on same Animated.Value
   * - Duration: micro 60ms, standard 180-300ms, spring preferred
   * - Decorative background animations: REMOVED (per user request)
   * - Rotating tips/facts text: KEEP (user explicitly wants these)
   */
  nativeDriverTransformsOnly: true,
  decorativeAnimationsEnabled: false,
  rotatingTipsEnabled: true,

  /**
   * HUD DESIGN LANGUAGE
   * Every card must have at minimum:
   *   - Corner HUD brackets (top-left, top-right, bottom-left, bottom-right)
   *   - Top accent bar (2.5-4px, colored by section theme)
   *   - Pulse dot indicator where status is relevant
   * Cards without these are considered "generic" and must be upgraded.
   */
  hudCornersRequired: true,
  topAccentBarRequired: true,
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — PLAY STORE COMPLIANCE DECISIONS (PERMANENT)
// ═══════════════════════════════════════════════════════════════════
export const PLAYSTORE_COMPLIANCE = {
  /**
   * SCRIPT SCHEDULING — PERMANENTLY REMOVED
   * Decision date: 2026-07-23
   * Reason: Play Store policy on background automation
   * Replacement: SAFE SCHEDULE (5 hardcoded foreground-only tasks)
   * Status: DO NOT RE-ADD script scheduling under any circumstances
   */
  scriptSchedulingRemoved: true,
  safeScheduleImplemented: true,

  /**
   * BACKGROUND EXECUTION — PERMANENTLY FORBIDDEN
   * No background services, no silent cron jobs, no deferred execution.
   * Every action requires an explicit user tap in the foreground.
   * This is hardcoded at the architecture level.
   */
  noBackgroundExecution: true,

  /**
   * PERMISSIONS — MINIMAL POLICY
   * Camera: QR pairing only, requested at scan time with rationale
   * Local Network: LAN connection to paired PC
   * NO: location, contacts, microphone, background location, storage
   */
  permissionsMinimal: true,

  /**
   * FIRST-RUN DISCLOSURE
   * All automation capabilities disclosed before first use.
   * Privacy policy URL shown on first run.
   */
  disclosureOnFirstRun: true,
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — ARCHITECTURE RULES (PERMANENT)
// ═══════════════════════════════════════════════════════════════════
export const ARCHITECTURE = {
  /**
   * LAYER ORDER (IMMUTABLE)
   * services/ → hooks/ → components/ → app/(tabs)/
   * Components NEVER import directly from services/.
   * Components import from hooks/ only.
   */
  layerOrder: ['services', 'hooks', 'components', 'app'] as const,

  /**
   * BACKEND
   * Supabase: NOT CONNECTED (as of 2026-07-23)
   * LAN-only architecture for free tier
   * No mock authentication unless explicitly requested
   */
  supabaseConnected: false,
  mockAuthForbidden: true,

  /**
   * NAVIGATION
   * expo-router exclusively
   * Tab navigation via FuturisticTabBar (custom, do not replace)
   * No duplicate headers (CompactPageHeader used on non-home tabs)
   */
  router: 'expo-router',
  tabBar: 'FuturisticTabBar — DO NOT REPLACE',

  /**
   * STATE MANAGEMENT
   * Context + hooks pattern for cross-tab data
   * Local AsyncStorage for persistence
   * No external state libraries (Redux, Zustand, etc.)
   */
  stateManagement: 'Context + hooks + AsyncStorage',

  /**
   * PERFORMANCE TARGETS
   * JS bundle startup: < 1.5s on mid-range Android (2020)
   * Tab switch: < 80ms felt latency
   * List scroll: 60fps on all devices
   * No memory leaks (all subscriptions cleaned on unmount)
   */
  startupTargetMs:   1500,
  tabSwitchTargetMs: 80,
  targetFps:         60,
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — FEATURES TO WIRE / TODO REGISTRY
// Updated automatically by AI sessions.
// ═══════════════════════════════════════════════════════════════════
export const FEATURE_REGISTRY = {
  /**
   * WIRED AND WORKING
   */
  wired: [
    'NexusMegaHeader — home page hero with SYS.BOOT, metrics, shell, LAN scan',
    'SafeSchedulePanel — 5 hardcoded tasks with 6 guards, audit log',
    'LiveWidgetStudio — PRO/ELITE gated widget builder',
    'SecurityShowcase — AES/LAN/NO-TELEMETRY HUD tile grid',
    'RemoteAccessMonetizationCard — tiered remote access with FreeVsProExplainer',
    'DonationModal — Play Store compliant optional support page',
    'FAQSection — 20 Q&As in downloads tab',
    'OpenSourcePanel — transparency proof with GitHub + Play Store badges',
    'SafetyArchitecturePanel — 7-layer safety with SVG shield icon',
    'PlayStoreReviewerNote — compliance notes for reviewers',
    'WidgetLayer — inline/floating widget placement system',
    'NexusTips — rotating 200+ tips, 6 pages, 3s interval with crossfade',
    'AIBrainMasterpieceCard — KB + personal memory + neural tripwire',
    'SparklineWidget — live perf graphs',
    'LiveTerminalFeed — 4-channel log panel',
    'NetworkTopologyCard — animated LAN node map',
    'AutomationFeed — CRT process feed',
    'CoreSurfaces — 3×3 surface launcher',
    'RotatingTips — auto-advancing tip card',
    'QuickNav4 — Pair/Chat/Run/Files quick nav',
  ],

  /**
   * EXISTS BUT NOT FULLY WIRED
   */
  partiallyWired: [
    'BiometricLockOverlay — exists, not wired (optional future security gate)',
    'PCRemoteCockpit — exists, not wired to connect tab',
    'MultiPCManager — exists, not wired',
    'RuntimeDiagnosticsHUD — exists, disabled by user (decorative animations)',
    'GeminiKeyCard — exists, Supabase not connected so not applicable',
  ],

  /**
   * SCHEDULED FOR NEXT SESSION
   */
  nextSession: [
    'Wire AppVersionGuard into nexushome.tsx as update-available banner',
    'Wire PerformanceMonitorWidget into logs.tsx or nexushome.tsx',
    'Implement ButlerLayoutEngine.ts auto-centering in key screens',
    'Implement ButlerRenderGuard.ts lazy mounting in nexushome',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — MONETIZATION DECISIONS
// ═══════════════════════════════════════════════════════════════════
export const MONETIZATION = {
  /**
   * TIERS (current implementation)
   * FREE: Home WiFi only, 250+ scripts, local Ollama, file transfer
   * PRO ($4.99/mo): Remote access via Tailscale/Cloudflare, history, analytics
   * ELITE: All PRO + priority support ($10/mo direct developer support)
   */
  tiers: ['FREE', 'PRO', 'ELITE'] as const,

  /**
   * PREMIUM SUPPORT — PLAY STORE COMPLIANT
   * $10/mo — developer responds within 1 hour
   * Allowed under Play Store policies (value-added service, not bug fixes)
   * Status: DESIGNED, not yet implemented as IAP
   */
  premiumSupportDesigned: true,

  /**
   * FUTURE MONETIZATION IDEAS (not yet implemented)
   * - Script Packs ($1.99-$2.99 one-time curated packs)
   * - Lifetime license (~$29.99)
   * - KB Export (PRO feature — PDF/JSON export)
   * - Extra PC Slots ($0.99 each)
   * - Android Home Screen Widget pack
   * - Scheduler add-on (only if Play Store approves Safe Schedule first)
   * - Theme packs (beyond 8 included)
   */
  futureIdeas: [
    'Script Packs ($1.99-$2.99)',
    'Lifetime license ($29.99)',
    'KB Export PRO feature',
    'Extra PC Slots ($0.99)',
    'Android Widget pack',
    'Premium theme packs',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════
// SECTION 8 — PERFORMANCE TARGETS & IMPLEMENTATION NOTES
// ═══════════════════════════════════════════════════════════════════
export const PERFORMANCE_NOTES = {
  /**
   * WHAT IS IMPLEMENTED
   * - Hermes JS engine (app.json jsEngine: hermes)
   * - Metro aggressive minification (terser, 3 passes, toplevel)
   * - Copyright banner serializer (metro.config.js)
   * - BootGuard startup crash handler
   * - AutoErrorLogger background error capture
   * - TabErrorBoundary on every tab
   * - FlatList with removeClippedSubviews, maxToRenderPerBatch, windowSize
   * - react-native-reanimated for spring animations
   */
  implemented: [
    'Hermes engine',
    'Metro terser minification (3 passes)',
    'BootGuard crash handler',
    'TabErrorBoundary on all tabs',
    'FlatList optimization flags',
    'react-native-reanimated springs',
  ],

  /**
   * NOT YET IMPLEMENTED (planned)
   * - InteractionManager.runAfterInteractions for heavy initial loads
   * - React.lazy + Suspense for heavy modals
   * - useDeferredValue for search inputs
   * - ButlerLayoutEngine auto-centering (see utils/ButlerLayoutEngine.ts)
   * - ButlerRenderGuard lazy mounting (see utils/ButlerRenderGuard.ts)
   */
  planned: [
    'InteractionManager.runAfterInteractions for nexushome heavy sections',
    'ButlerLayoutEngine auto-centering (utils/ButlerLayoutEngine.ts)',
    'ButlerRenderGuard lazy mounting (utils/ButlerRenderGuard.ts)',
    'useDeferredValue for script search',
  ],
} as const;
