/**
 * APP SOURCE BUNDLE v6.0
 * ─────────────────────────────────────────────────────────────────────────────
 * • Full embedded sources registered via registerTabSource()
 * • buildExportJson() → safe JSON object (JSON.stringify handles all escaping)
 * • buildAllFilesExport() → clipboard-friendly text dump
 * • DETAILED_AI_PROMPT exported for embedding in every export output
 *
 * BUG FIXES v6.0:
 *  - Removed all references to expo-clipboard, expo-document-picker, expo-sharing
 *    (these caused black screen on APK install — replaced with RN Clipboard + Share)
 *  - Updated BUNDLE_MANIFEST line counts to current file sizes
 *  - Updated AI prompt to reflect v6 stack and banned package list
 *  - Added metro.config.js hermesParser stub redirect to manifest
 *
 * GUARDS:
 *  - No template-literal backtick embedding of large sources (module size limit)
 *  - Proxy-based BUNDLE_SOURCES for legacy compat (settings.tsx dot-access)
 *  - All source strings registered via registerTabSource() at runtime
 */

export interface BundleFile {
  path: string;
  description: string;
  category: 'tab' | 'component' | 'service' | 'constant' | 'layout';
  lines: number;
}

// ─── Manifest ─────────────────────────────────────────────────────────────────
export const BUNDLE_MANIFEST: BundleFile[] = [
  { path: 'app/(tabs)/nexushome.tsx',              description: 'Home page — neon hero header, stat cards, neural brain, quick scripts',   category: 'tab',       lines: 1050 },
  { path: 'app/(tabs)/scripts.tsx',                description: 'Script library — Python automation, favorites, undo, dash strip',          category: 'tab',       lines: 3200 },
  { path: 'app/(tabs)/butler.tsx',                 description: 'Butler AI chat — Ollama local AI, hero header, mode bar, context rail',    category: 'tab',       lines: 1100 },
  { path: 'app/(tabs)/knowledge.tsx',              description: 'Knowledge base — KB graph, crawler, growth, OMEGA loop',                   category: 'tab',       lines: 2800 },
  { path: 'app/(tabs)/builder.tsx',                description: 'Script builder — visual node pipeline, 40+ node library',                  category: 'tab',       lines: 1050 },
  { path: 'app/(tabs)/fileshare.tsx',              description: 'Net Ops — LAN scanner, port audit, ping tester, clipboard bridge',         category: 'tab',       lines: 1280 },
  { path: 'app/(tabs)/logs.tsx',                   description: 'PC health dashboard — CPU, RAM, disk, processes, health score',            category: 'tab',       lines: 680  },
  { path: 'app/(tabs)/cosmetic.tsx',               description: 'Cosmetic packs — themes, skins, customization, champion holo',             category: 'tab',       lines: 1400 },
  { path: 'app/(tabs)/settings.tsx',               description: 'System config — all settings, JSON export/import, tools',                  category: 'tab',       lines: 1100 },
  { path: 'app/(tabs)/terminal.tsx',               description: 'Live terminal — SSH/exec streaming',                                       category: 'tab',       lines: 120  },
  { path: 'app/(tabs)/_layout.tsx',                description: 'Tab layout — bulletproof bootstrap, futuristic tab bar, router',           category: 'layout',    lines: 230  },
  { path: 'app/_layout.tsx',                       description: 'Root layout — providers, splash, stack nav, crash guard',                  category: 'layout',    lines: 100  },
  { path: 'app/category/[id].tsx',                 description: 'Category detail — script viewer, run, auto-fix banner, KB suggestions',    category: 'layout',    lines: 720  },
  { path: 'app/privacy-policy.tsx',                description: 'Privacy policy screen — full HUD themed native',                           category: 'layout',    lines: 820  },
  { path: 'app/data-safety.tsx',                   description: 'Data safety screen — Google Play compliance',                               category: 'layout',    lines: 900  },
  { path: 'components/ui/MasterJsonPanel.tsx',     description: 'JSON import/export panel v6 — no banned native packages',                  category: 'component', lines: 780  },
  { path: 'components/ui/WidgetLayer.tsx',         description: 'Widget layer — inline/floating widget host',                                category: 'component', lines: 560  },
  { path: 'components/ui/LiveWidgetStudio.tsx',    description: 'Widget studio — code editor, templates, pin',                              category: 'component', lines: 1070 },
  { path: 'components/ui/TabErrorBoundary.tsx',    description: 'Tab error boundary — catches render crashes',                               category: 'component', lines: 60   },
  { path: 'components/ui/FuturisticTabBar.tsx',    description: 'Futuristic tab bar — animated HUD-style tab navigation',                   category: 'component', lines: 540  },
  { path: 'components/ui/CompactPageHeader.tsx',   description: 'Compact page header — used by scripts, builder, knowledge tabs',           category: 'component', lines: 120  },
  { path: 'components/ui/DownloadButtons.tsx',     description: 'Download buttons — server package, installer scripts (no expo-sharing)',    category: 'component', lines: 700  },
  { path: 'components/ui/ChatEnhancements.tsx',    description: 'Chat enhancements — slash commands, action bar, typing shimmer',           category: 'component', lines: 300  },
  { path: 'components/home/AIBrainMasterpieceCard.tsx', description: 'AI brain neural visualization — animated nodes, URL crawler, memory', category: 'component', lines: 620  },
  { path: 'components/home/AutomationFeed.tsx',    description: 'Automation feed — CRT process terminal display',                           category: 'component', lines: 180  },
  { path: 'components/qr/QRCameraScanner.tsx',     description: 'QR camera scanner — safe expo-camera wrapper (static import)',             category: 'component', lines: 80   },
  { path: 'components/cards/QuickSendCard.tsx',    description: 'Quick send card — phone→PC clipboard/file with RN Clipboard (no banned pkg)', category: 'component', lines: 360 },
  { path: 'services/widgetStorage.ts',             description: 'Widget persistence — AsyncStorage CRUD',                                   category: 'service',   lines: 90   },
  { path: 'services/serverConnection.ts',          description: 'Server connection — pair, ping, auth, REST',                               category: 'service',   lines: 400  },
  { path: 'services/autoConnectEngine.ts',         description: 'Auto-connect engine — backoff reconnect loop',                             category: 'service',   lines: 350  },
  { path: 'services/haptics.ts',                   description: 'Haptic feedback helpers — lazy expo-haptics (SDK 53 safe)',                category: 'service',   lines: 30   },
  { path: 'services/scriptExecutor.ts',            description: 'Script executor — streaming Python execution',                             category: 'service',   lines: 180  },
  { path: 'services/personalMemory.ts',            description: 'Personal memory — facts, events, birthday reminders, crawl history',       category: 'service',   lines: 220  },
  { path: 'services/bootGuard.tsx',                description: 'Boot guard — crash boundary, splash control, SYSTEM FAULT screen',         category: 'service',   lines: 380  },
  { path: 'services/pcClipboard.ts',               description: 'PC clipboard — uses RN Clipboard API (no expo-clipboard)',                 category: 'service',   lines: 80   },
  { path: 'constants/HeaderConstants.ts',          description: 'Header config — all titles, subtitles, colors',                            category: 'constant',  lines: 40   },
  { path: 'constants/theme.ts',                    description: 'Design tokens — colors, spacing, typography',                              category: 'constant',  lines: 80   },
  { path: 'constants/appSourceBundle.ts',          description: 'Export engine v6 — manifest, JSON builder, AI prompt, no banned pkgs',    category: 'constant',  lines: 600  },
  { path: 'constants/tabSourcesBundle.ts',         description: 'Source registry — registers all tab sources',                              category: 'constant',  lines: 200  },
  { path: 'constants/animations.ts',               description: 'Animations helper — Animated API only (no react-native-reanimated top-level)', category: 'constant', lines: 60  },
  { path: 'contexts/CosmeticContext.tsx',          description: 'Cosmetic context — themes, skins, pack system',                            category: 'constant',  lines: 220  },
  { path: 'contexts/TabBarContext.tsx',             description: 'Tab bar context — compact mode, omega log',                                category: 'constant',  lines: 80   },
  { path: 'hooks/useServerConnection.ts',          description: 'Server connection hook — connection state',                                category: 'service',   lines: 60   },
  { path: 'hooks/useAppSync.ts',                   description: 'App sync hook — foreground POST /api/sync',                                category: 'service',   lines: 40   },
  { path: 'metro.config.js',                       description: 'Metro config — expo-video stub, hermes-parser redirect, asset exts',       category: 'constant',  lines: 65   },
  { path: 'react-native.config.js',                description: 'RN config — expo-video native exclusion',                                  category: 'constant',  lines: 30   },
  { path: 'stubs/hermes-parser-plugin.js',         description: 'Hermes parser stub — babel plugin replacement, no parserOverride crash',   category: 'constant',  lines: 35   },
  { path: 'app.json',                              description: 'Expo config — permissions, plugins, store listing',                        category: 'constant',  lines: 120  },
];

// ─── Lightweight djb2 string hash ─────────────────────────────────────────────
function _djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h | 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * Compute a lightweight hash of ALL currently registered sources.
 * Sorted by path so key ordering does not affect the hash.
 */
export function computeSourceHash(): string {
  const sources = getBundleSources();
  const combined = Object.keys(sources)
    .sort()
    .map(k => k + '::' + _djb2(sources[k]))
    .join('|');
  return _djb2(combined + String(BUNDLE_MANIFEST.length));
}

// ─── Color palette reference ──────────────────────────────────────────────────
export const APP_PALETTE = {
  bg:      '#090a0f',
  surface: '#0f1520',
  card:    '#060F18',
  border:  '#1c1e28',
  NCX_BG:      '#0d0e14',
  NCX_SURFACE: '#111318',
  NCX_BORDER:  '#1c1e28',
  NCX_LIGHT:   'rgba(255,255,255,0.04)',
  teal:    '#10d9a0',
  cyan:    '#00CCDD',
  green:   '#00FF88',
  purple:  '#8b5cf6',
  amber:   '#f59e0b',
  red:     '#ef4444',
  sigma:   '#CC33FF',
  blue:    '#4488FF',
  yellow:  '#FFD700',
  pink:    '#FF6EB4',
  text:    '#336677',
  textBrt: '#88AACC',
};

// ─── DETAILED AI BUILDER PROMPT ───────────────────────────────────────────────
export const DETAILED_AI_PROMPT = `
# BUTLER AI — MASTER CODING PROMPT (V12 — UPDATED JUNE 2026)
# Stack: React Native 0.79.3 / Expo SDK 53 / Expo Router v5 / TypeScript / Hermes

## CRITICAL BANNED PACKAGES (cause black screen on APK install — NEVER use)
The following packages were REMOVED in v9 due to incompatible native auto-linking:
  • expo-clipboard         — use: safeSetClipboard/safeGetClipboard from services/safeClipboard.ts
  • expo-document-picker  — use: lazy require('expo-document-picker') inside function
  • expo-sharing          — use: import { Share } from 'react-native'
  • expo-linear-gradient  — use: react-native-svg LinearGradient
  • expo-image (in most components) — use only where already whitelisted
  • expo-av / expo-speech — use only expo-av for AUDIO (never for video)
  • expo-video (direct native module) — excluded from Android auto-linking

## PROTECTED SERVICES (never modify internals)
  services/serverConnection.ts — getIP(), getPort(), getToken(), connect()
  services/autoConnectEngine.ts — onEvent(), start(), stop()
  services/widgetStorage.ts — getForPage(), pin(), remove()
  services/haptics.ts — haptic feedback API
  services/knowledgeAccumulator.ts — KB compression
  services/nexusBridge.ts — bridge protocol
  services/lanScanner.ts — LAN auto-scan
  services/connectionPersistence.ts — connection state

## PROTECTED ASYNCSTORAGE KEYS (never rename)
  commandcube_server_ip / commandcube_server_port / commandcube_session_token
  @butler_pinned_widgets_v2 — widget storage
  @butler_onboarding_done_v2 — NEVER rename this key
  @clipboard_history_v1 — clipboard history
  @butler_export_hash_v1 — export change detection

## APP IDENTITY
  App: Butler AI: PC Automation | Package: com.butlerai.pc.automation
  Version: v9.x | Expo SDK: 53 | RN: 0.79.3 | Min Android: API 26 | Target: API 35
  AI Backend: Ollama local (qwen2.5-coder:7b) — ZERO cloud
  PC Bridge: butler_server.py v7.0 (Python, runs on user's PC, LAN only)
  Auth: HMAC-SHA256 token | Authorization: Bearer <token> header

## REACT NATIVE HARD RULES
  • Never use transformOrigin — use transform: [{ rotate: '45deg' }]
  • Never use inline gap on Views — use marginRight/marginBottom
  • Never use CSS units (px/em/rem/vw/vh) — RN uses unitless numbers
  • Never import react-native-web or browser APIs (window/document/localStorage)
  • Named exports only for screens — never default exports
  • Never use useLayoutEffect — SSR warning + Hermes timing bug
  • Never nest ScrollViews without nestedScrollEnabled
  • Never put VirtualizedLists inside ScrollView
  • FlatList keyExtractor must return string: keyExtractor={(item) => String(item.id)}
  • Every interval/timeout in useEffect MUST be cleared in cleanup return
  • All animations: useNativeDriver:true for transform/opacity; false for layout

## NCX CARD PATTERN (use for ALL cards)
  backgroundColor: '#0d0e14', borderWidth:1, borderColor:'#1c1e28',
  borderLeftWidth:2, borderLeftColor:'<accent>',
  borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.04)',
  borderRadius:12, elevation:3

## DESIGN PALETTE
  bg:#090a0f  surface:#0f1520  card:#060F18
  NCX_BG:#0d0e14  NCX_BORDER:#1c1e28
  teal:#10d9a0  cyan:#00CCDD  green:#00FF88  purple:#8b5cf6
  sigma:#CC33FF  blue:#4488FF  amber:#f59e0b  red:#ef4444
  yellow:#FFD700  pink:#FF6EB4  text:#336677  textBrt:#88AACC

## CLIPBOARD SAFE PATTERN (no expo-clipboard)
  import { safeSetClipboard, safeGetClipboard } from '@/services/safeClipboard';
  await safeSetClipboard(text);
  const text = await safeGetClipboard();

## SHARE SAFE PATTERN (no expo-sharing)
  import { Share } from 'react-native';
  await Share.share({ title: 'filename.txt', message: content });

## DOCUMENT PICKER SAFE PATTERN (use lazy require inside function only)
  const result = await require('expo-document-picker').getDocumentAsync({ ... });

## API FETCH PATTERN (always AbortController)
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 10000);
  const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));

## NAVIGATION
  Use router.push('/(tabs)/knowledge') — group prefix required
  Tab switching: (global as any).__butlerSwitchTab?.('butler')
  QR modal: (global as any).__nexusHomeOpenQR?.()

## RETURN FORMAT
  Always return COMPLETE file content. Never partial diffs.
  Preserve ALL existing imports.
  Do not explain how to paste — just return code.

## RESTORE ORDER
  1. constants/HeaderConstants.ts   2. constants/theme.ts
  3. services/widgetStorage.ts      4. services/serverConnection.ts
  5. stubs/hermes-parser-plugin.js  6. metro.config.js
  7. app/(tabs)/_layout.tsx         8. app/_layout.tsx
  9. Each tab page                  10. components/ files
`;

// ─── Source file registry ─────────────────────────────────────────────────────
const _sourceFns: Record<string, () => string> = {};

// ─── Built-in constant sources ────────────────────────────────────────────────

function getHeaderConstantsSrc(): string {
  return [
    '/**',
    ' * BUTLER AI — ZERO-CREDIT HEADER CONSTANTS v2',
    ' * Edit text labels, subtitles, button labels, and accent colors here.',
    ' * All values consumed by CompactPageHeader / NexusPageHeader components.',
    ' */',
    '',
    "export interface TabHeaderEntry {",
    "  title: string;",
    "  subtitle: string;",
    "  actionLabel: string;",
    "  actionIcon: string;",
    "  accentColor: string;",
    "}",
    '',
    "export const TAB_HEADER_ENTRIES: Record<string, TabHeaderEntry> = {",
    "  nexushome: { title:'NEXUS HOME',      subtitle:'PC Automation · Command Center',       actionLabel:'QR SCAN',  actionIcon:'qr-code-scanner', accentColor:'#00f3ff' },",
    "  butler:    { title:'BUTLER AI',       subtitle:'Local Ollama · Private · Zero Cloud',  actionLabel:'CLEAR',    actionIcon:'delete-sweep',    accentColor:'#bc00ff' },",
    "  scripts:   { title:'SCRIPTS',         subtitle:'Python Automation · Library',           actionLabel:'HISTORY',  actionIcon:'history',         accentColor:'#00DCFF' },",
    "  knowledge: { title:'KNOWLEDGE BASE',  subtitle:'SIGMA-NET · Live Crawler · KB Graph',  actionLabel:'SYNC',     actionIcon:'sync',            accentColor:'#FF8C00' },",
    "  fileshare: { title:'NET OPS',         subtitle:'LAN Scanner · Port Audit · Ping',      actionLabel:'REFRESH',  actionIcon:'refresh',         accentColor:'#00CCDD' },",
    "  logs:      { title:'PC INTEL',        subtitle:'Health · Cleaning · Automation',       actionLabel:'REFRESH',  actionIcon:'refresh',         accentColor:'#00FF88' },",
    "  cosmetic:  { title:'SKINS',           subtitle:'Themes · Cosmetics · Customization',   actionLabel:'BROWSE',   actionIcon:'palette',         accentColor:'#FF6EB4' },",
    "  settings:  { title:'SYSTEM CONFIG',   subtitle:'App Settings · Preferences · Export',  actionLabel:'EXPORT',   actionIcon:'download',        accentColor:'#CC7755' },",
    "  terminal:  { title:'LIVE TERMINAL',   subtitle:'nexus@terminal:~$',                    actionLabel:'CLEAR',    actionIcon:'delete-sweep',    accentColor:'#44FF22' },",
    "  builder:   { title:'BUILDER',         subtitle:'Visual Node Pipeline · Drag & Build',  actionLabel:'CLEAR',    actionIcon:'delete-sweep',    accentColor:'#BB33FF' },",
    "};",
    '',
    "export const CONN_COLORS = {",
    "  connected:    '#00FF88',",
    "  disconnected: '#FF3366',",
    "};",
    '',
    "export const SPLASH_CONFIG = {",
    "  titleLine1:  'BUTLER',",
    "  titleLine2:  'AI',",
    "  tagline:     'PC AUTOMATION · COMMAND CENTER',",
    "  bootText:    'INITIALIZING SYSTEMS...',",
    "  versionBadge:'v9.x · ANDROID · LOCAL AI',",
    "  accentColor: '#00f3ff',",
    "};",
  ].join('\n');
}

function getWidgetStorageSrc(): string {
  return [
    "/**",
    " * Widget Storage Service v2 — AsyncStorage CRUD for pinned widgets",
    " * Safe: no banned packages.",
    " */",
    "import AsyncStorage from '@react-native-async-storage/async-storage';",
    '',
    "const STORAGE_KEY = '@butler_pinned_widgets_v2';",
    '',
    "export type WidgetPlacement = 'floating' | 'inline-top' | 'inline-middle' | 'inline-bottom';",
    '',
    "export interface PinnedWidget {",
    "  id: string;",
    "  pageId: string;",
    "  label: string;",
    "  code: string;",
    "  placement: WidgetPlacement;",
    "  x: number;",
    "  y: number;",
    "  height?: number;",
    "  createdAt: string;",
    "}",
    '',
    "async function loadAll(): Promise<PinnedWidget[]> {",
    "  try {",
    "    const raw = await AsyncStorage.getItem(STORAGE_KEY);",
    "    if (raw) return JSON.parse(raw) as PinnedWidget[];",
    "    return [];",
    "  } catch { return []; }",
    "}",
    '',
    "async function saveAll(widgets: PinnedWidget[]): Promise<void> {",
    "  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));",
    "}",
    '',
    "export const widgetStorage = {",
    "  async getForPage(pageId: string): Promise<PinnedWidget[]> {",
    "    const all = await loadAll();",
    "    return all.filter(w => w.pageId === pageId);",
    "  },",
    "  async pin(widget: Omit<PinnedWidget, 'id' | 'createdAt'>): Promise<PinnedWidget> {",
    "    const all = await loadAll();",
    "    const nw: PinnedWidget = { ...widget, id: 'widget_' + Date.now(), createdAt: new Date().toISOString() };",
    "    await saveAll([...all, nw]);",
    "    return nw;",
    "  },",
    "  async updateCode(id: string, code: string, label?: string): Promise<void> {",
    "    const all = await loadAll();",
    "    await saveAll(all.map(w => w.id === id ? { ...w, code, ...(label ? { label } : {}) } : w));",
    "  },",
    "  async updateHeight(id: string, height: number): Promise<void> {",
    "    const all = await loadAll();",
    "    await saveAll(all.map(w => w.id === id",
    "      ? { ...w, height: height > 0 ? Math.max(60, Math.round(height)) : undefined }",
    "      : w));",
    "  },",
    "  async remove(id: string): Promise<void> {",
    "    const all = await loadAll();",
    "    await saveAll(all.filter(w => w.id !== id));",
    "  },",
    "  async getAll(): Promise<PinnedWidget[]> { return loadAll(); },",
    "  async clearAll(): Promise<void> { await AsyncStorage.removeItem(STORAGE_KEY); },",
    "};",
  ].join('\n');
}

function getHermesPluginSrc(): string {
  return [
    "/**",
    " * stubs/hermes-parser-plugin.js",
    " * Replacement for babel-plugin-syntax-hermes-parser.",
    " * Only adds flow + flowComments parser plugins — no parserOverride.",
    " * Redirect wired in metro.config.js and both node_modules copies.",
    " */",
    "'use strict';",
    "module.exports = function hermesParserPlugin(api) {",
    "  if (!api || !api.assertVersion) return {};",
    "  try { api.assertVersion(7); } catch (_) {}",
    "  return {",
    "    name: 'syntax-hermes-parser-stub',",
    "    manipulateOptions: function(opts, parserOpts) {",
    "      if (!parserOpts) return;",
    "      if (!Array.isArray(parserOpts.plugins)) parserOpts.plugins = [];",
    "      var plugins = parserOpts.plugins;",
    "      if (!plugins.includes('flow')) plugins.push('flow');",
    "      if (!plugins.includes('flowComments')) plugins.push('flowComments');",
    "    },",
    "  };",
    "};",
  ].join('\n');
}

// Register built-in sources
_sourceFns['constants/HeaderConstants.ts'] = getHeaderConstantsSrc;
_sourceFns['services/widgetStorage.ts']    = getWidgetStorageSrc;
_sourceFns['stubs/hermes-parser-plugin.js'] = getHermesPluginSrc;

// ─── Public API ───────────────────────────────────────────────────────────────

/** Register a tab/component source at runtime (called from tabSourcesBundle.ts) */
export function registerTabSource(path: string, source: string): void {
  _sourceFns[path] = () => source;
}

/** Get all registered sources as a plain object (safe for JSON.stringify) */
export function getBundleSources(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, fn] of Object.entries(_sourceFns)) {
    try { out[path] = fn(); } catch (e) { out[path] = '[source load error: ' + String(e) + ']'; }
  }
  return out;
}

/** Legacy compat: BUNDLE_SOURCES[path] dot/bracket access */
export const BUNDLE_SOURCES: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_t, prop: string) {
      const fn = _sourceFns[prop];
      if (fn) { try { return fn(); } catch { return '[error]'; } }
      return undefined;
    },
    has(_t, prop: string) { return prop in _sourceFns; },
    ownKeys() { return Object.keys(_sourceFns); },
    getOwnPropertyDescriptor(_t, prop: string) {
      if (prop in _sourceFns) {
        let v: string;
        try { v = _sourceFns[prop](); } catch { v = '[error]'; }
        return { configurable: true, enumerable: true, writable: false, value: v };
      }
      return undefined;
    },
  }
);

// ─── Build JSON export ────────────────────────────────────────────────────────
/**
 * Returns a plain JS object safe for JSON.stringify.
 * GUARD: All content stored as JS strings — JSON.stringify handles
 *        backslashes, quotes, newlines, and all special chars automatically.
 */
export function buildExportJson(): Record<string, unknown> {
  const sources = getBundleSources();

  const obj: Record<string, unknown> = {
    _meta: {
      exportedAt:     new Date().toISOString(),
      appName:        'Butler AI — PC Automation',
      version:        'v9.x',
      packageId:      'com.butlerai.pc.automation',
      totalFiles:     BUNDLE_MANIFEST.length,
      embeddedFiles:  Object.keys(sources).length,
      stack:          'React Native 0.79.3 / Expo SDK 53 / Expo Router v5 / TypeScript / Hermes',
      targetPlatform: 'Android API 35 (min API 26 / Android 8.0)',
      aiEngine:       'Ollama local (qwen2.5-coder:7b) — no cloud',
      builtIn:        'OnSpace.ai App Builder',
      palette:        APP_PALETTE,
      aiBuilderGuide: DETAILED_AI_PROMPT,
      bannedPackages: [
        'expo-clipboard — REMOVED: black screen on APK install; use RN Clipboard',
        'expo-document-picker — REMOVED: black screen on APK install; use lazy require inside function',
        'expo-sharing — REMOVED: black screen on APK install; use RN Share',
        'expo-linear-gradient — REMOVED: black screen on APK install; use react-native-svg LinearGradient',
        'expo-av — REMOVED for audio/video combo; use expo-av for audio only',
        'expo-video native module — excluded from Android auto-linking in react-native.config.js',
        'react-native-reanimated top-level import at module level — causes install() crash before native ready',
        'AbortSignal.timeout() — ES2022, not in Hermes; use AbortController + setTimeout instead',
      ],
      criticalFixes: [
        'constants/animations.ts: removed react-native-reanimated Proxy at module level (caused install() crash)',
        'All expo-clipboard static imports → replaced with RN Clipboard API',
        'All expo-document-picker static imports → replaced with lazy require() inside functions',
        'All expo-sharing static imports → replaced with RN Share',
        'All AbortSignal.timeout() → replaced with AbortController + setTimeout',
        'nexushome.tsx: removed await import("expo-camera") dynamic import → uses QRCameraScanner component',
        'stubs/hermes-parser-plugin.js: removed parserOverride (caused metro-source-map invariant crash)',
        'metro.config.js: intercepts both babel-plugin-syntax-hermes-parser copies → stubs file',
        'app/(tabs)/_layout.tsx: removed isDone from useEffect dependency array (caused infinite bootstrap loop)',
      ],
      restorePrompt: [
        'You are an AI assistant inside OnSpace.ai (https://onspace.ai).',
        'Stack: React Native + Expo SDK 53 + TypeScript + Expo Router v5 + Hermes.',
        'This export is from Butler AI: PC Automation (com.butlerai.pc.automation) v9.x.',
        'READ THE bannedPackages AND criticalFixes IN _meta BEFORE MAKING ANY CHANGES.',
        'Always return COMPLETE file content — OnSpace.ai replaces entire files.',
        'Never return partial diffs. Preserve all imports.',
        'Protected: serverConnection, autoConnectEngine, widgetStorage, all services/ network code.',
        'To restore: use content from type:"source" files. For type:"manifest", use metadata + guide.',
      ].join(' '),
    },
  };

  // Embedded source files (full content)
  for (const [filePath, source] of Object.entries(sources)) {
    obj[filePath] = {
      type:    'source',
      content: source,
      lines:   source.split('\n').length,
      chars:   source.length,
    };
  }

  // Manifest-only entries
  for (const f of BUNDLE_MANIFEST) {
    if (!obj[f.path]) {
      obj[f.path] = {
        type:        'manifest',
        description: f.description,
        category:    f.category,
        lines:       f.lines,
        restoreHint: 'Ask OnSpace.ai to regenerate this file based on the aiBuilderGuide in _meta and the bannedPackages/criticalFixes lists.',
      };
    }
  }

  return obj;
}

// ─── Build clipboard text export ─────────────────────────────────────────────
export function buildAllFilesExport(): string {
  const sources = getBundleSources();
  const now = new Date().toLocaleString();
  const lines: string[] = [
    '// ╔══════════════════════════════════════════════════════════════════════════╗',
    '// ║  BUTLER AI — FULL APP SOURCE EXPORT v6.0 (BUG-FIXED)                  ║',
    `// ║  Generated: ${now.padEnd(57)}║`,
    '// ║  Stack: React Native · Expo Router v5 · TypeScript · Expo SDK 53       ║',
    '// ║  IMPORTANT: expo-clipboard/document-picker/sharing REMOVED             ║',
    '// ╚══════════════════════════════════════════════════════════════════════════╝',
    '',
    `// App: Butler AI: PC Automation — com.butlerai.pc.automation — v9.x`,
    `// Total files in project: ${BUNDLE_MANIFEST.length}`,
    `// Files with embedded source: ${Object.keys(sources).length}`,
    '',
    '// ═══ BANNED PACKAGES (black screen on APK install — NEVER re-add) ═══════',
    '// expo-clipboard       → use: import { Clipboard } from "react-native"',
    '// expo-document-picker → use: lazy require() inside function only',
    '// expo-sharing         → use: import { Share } from "react-native"',
    '// expo-linear-gradient → use: react-native-svg LinearGradient',
    '',
    '// ═══ CRITICAL FIXES APPLIED ══════════════════════════════════════════════',
    '// • constants/animations.ts: removed react-native-reanimated Proxy (install() crash)',
    '// • All static expo-clipboard/document-picker/sharing → RN equivalents',
    '// • All AbortSignal.timeout() → AbortController + setTimeout (Hermes safe)',
    '// • nexushome.tsx: removed dynamic await import("expo-camera")',
    '// • stubs/hermes-parser-plugin.js: removed parserOverride',
    '// • app/(tabs)/_layout.tsx: removed isDone from useEffect deps (infinite loop)',
    '',
  ];

  lines.push('// ─── FILE MANIFEST ─────────────────────────────────────────────────────────');
  for (let i = 0; i < BUNDLE_MANIFEST.length; i++) {
    const f = BUNDLE_MANIFEST[i];
    const hasSrc = Boolean(sources[f.path]);
    lines.push(
      `// ${String(i + 1).padStart(2, '0')}. [${hasSrc ? '●SRC' : '○   '}] [${f.category.toUpperCase().padEnd(9)}] ${f.path.padEnd(45)} ~${f.lines}L`
    );
  }
  lines.push('// Legend: ● = full source embedded   ○ = manifest only');
  lines.push('');

  for (const promptLine of DETAILED_AI_PROMPT.split('\n')) {
    lines.push('// ' + promptLine);
  }

  lines.push('');
  for (const [path, source] of Object.entries(sources)) {
    lines.push(`// ${'═'.repeat(72)}`);
    lines.push(`// EMBEDDED SOURCE: ${path}`);
    lines.push(`// Lines: ${source.split('\n').length} · Chars: ${source.length}`);
    lines.push(`// ${'─'.repeat(72)}`);
    lines.push('');
    for (const srcLine of source.split('\n')) {
      lines.push('// ' + srcLine);
    }
    lines.push('');
  }

  lines.push('// ─── END OF BUTLER AI EXPORT v6.0 ──────────────────────────────────────────');
  lines.push(`// Exported: ${now}`);
  return lines.join('\n');
}
