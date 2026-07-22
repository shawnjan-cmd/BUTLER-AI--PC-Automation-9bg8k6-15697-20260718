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
 * TIER 1 — CRITICAL / HIGH IMPACT
 *  [x] MiniChatBar v11: full expandable with spring animation, quick-function chips,
 *      tab shortcut row, real API wiring, glow effects — DONE 2026-07-22
 *  [x] QuickActions icons: glowing dark rounded squares (image style) — DONE 2026-07-22
 *  [x] NetworkMetricsBar: horizontal pills (Latency/Net/Disk/Frame/Uptime) — DONE 2026-07-22
 *  [ ] Standardize all non-home page headers using CompactPageHeader — IN PROGRESS
 *  [ ] knowledge.tsx: add CompactPageHeader with AMBER accent
 *  [ ] logs.tsx: add CompactPageHeader with RED/BLUE accent
 *  [ ] settings.tsx: add CompactPageHeader with MID accent
 *  [ ] connect.tsx: add CompactPageHeader with TEAL accent
 *  [ ] fileshare.tsx: add CompactPageHeader with PURPLE accent
 *  [ ] cosmetic.tsx: add CompactPageHeader with BLUE accent
 *  [ ] builder.tsx: add CompactPageHeader with GREEN accent
 *
 * TIER 2 — VISUAL UPGRADES
 *  [ ] Homepage icon glow overhaul: all QA_ITEMS and NAV_ITEMS icons get
 *      glowing dark rounded square containers (matched to image style)
 *  [ ] Remove ALL duplicate CPU graphs across pages (only 1 CPU graph per page)
 *  [ ] SelfLearnLoop card on homepage (from image: episode/reward/CPU/model stats)
 *  [ ] Terminal streaming log card (from image: butler_server.py live output)
 *  [ ] Background particles on each page (light, non-interfering, CYAN colored)
 *
 * TIER 3 — FUTURE / OPTIONAL
 *  [ ] SBOM (Software Bill of Materials) for Play Store compliance
 *  [ ] TLS auto-generate + certificate pinning wiring
 *  [ ] Onboarding permission list reads from app.json dynamically
 *  [ ] Reproducible build docs
 */

export const BUTLER_WORK_SESSION_VERSION = '2026-07-22-v1';

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
