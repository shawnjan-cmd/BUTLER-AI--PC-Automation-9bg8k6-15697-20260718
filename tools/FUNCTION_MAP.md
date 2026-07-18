# BUTLER AI — FUNCTION MAP v1.0
> Auto-reference: never read_file a service just to find an export.
> Last updated: session auto-maintained. Check this BEFORE reading any file.

---

## ── SERVICES (import path → exports) ──────────────────────────────────────

### `@/services/serverConnection`
```ts
serverConnection                    // singleton
  .isConnected() → boolean
  .getIP() → string | null
  .getPort() → string | null
  .getToken() → string | null
  .fetchWithAuth(url, opts) → Promise<Response>
  .buildUrl(path) → string            // e.g. buildUrl('/api/execute')
  .pair(ip, port, pairingCode) → Promise<{success, error?}>
  .connectManual(ip, port) → Promise<{success, error?}>
  .reconnect() → Promise<{connected}>
  .load() → Promise<void>

AUTH_DISABLED_KEY: string
isAuthDisabled() → boolean
setAuthDisabled(val) → Promise<void>
loadAuthDisabled() → Promise<void>

interfaces: ConnState, ConnResult
```

### `@/services/autoConnectEngine`
```ts
autoConnectEngine                   // singleton
  .start() → Promise<void>
  .stop() → void
  .getCurrentConnection() → { connected, ip, port }
  .onEvent(cb: (evt: EngineEvent) => void) → () => void  // returns unsub fn
  .reconnect() → Promise<void>

EngineStatus = 'idle'|'scanning'|'connecting'|'connected'|'reconnecting'
EngineEvent = { status: EngineStatus; ip?: string; port?: string }
```

### `@/services/connectionHub`
```ts
connectionHub                       // singleton (wraps all connection logic)
  .start() → void
  .getState() → HubState
  .onState(cb) → () => void
  .connect(ip, port) → Promise<HubConnectResult>
  .disconnect() → void
  .powerAction(action) → Promise<HubPowerResult>

HubState = { isConnected, addr, connecting, ollamaOnline, serverVersion, capabilities }
HubConnectResult = { ok, error? }
HubPowerResult = { ok, error? }

// re-exports: serverConnection, autoConnectEngine, ServerFeature, EngineStatus, EngineEvent, ScanProgress
```

### `@/services/serverFeatures`
```ts
features                            // singleton FeatureGate
  .has(feat: ServerFeature) → boolean
  .set(capabilities: Record<string,boolean>) → void

ServerFeature = 'power'|'clipboard'|'keyboard'|'ollama'|'learn'|'files'
```

### `@/services/nexusBridge`
```ts
nexusBridge                         // singleton
  .chat(opts) → Promise<{content, model?}>
  .buildNexusContext(query, opts) → Promise<NexusContext>
  .pickBestModel(force?) → Promise<string>
  .loadStats() → Promise<BridgeStats|null>

NexusContext = { fusedBlock, localFindings[], relayFindings[], growthCount }
BridgeStats = { totalCallsTotal, fullBridgeHits, avgLatencyMs, totalGrowth, lastUsed }
```

### `@/services/pcClipboard`
```ts
pcClipboard
  .pushToPC(text) → Promise<boolean>
  .pullFromPC() → Promise<string|null>
  .powerAction(action: 'sleep'|'restart'|'shutdown') → Promise<{ok, error?}>
```

### `@/services/knowledgeAccumulator`
```ts
knowledgeAccumulator
  .compressResearch(text, domain, topic, source) → CompressedKnowledge
  .addFinding(finding) → void
  .saveNow() → Promise<void>
  .loadResearch() → Promise<ResearchSession[]>
  .getStats() → Promise<{totalFindings, totalSessions, storageUsed, ...}>
  .buildContext(query) → Promise<string>
  .clearAll() → Promise<void>
  .processExchange(userMsg, aiReply) → Promise<void>

CompressedKnowledge = { domain, topic, summary, keywords[], examples[], metadata }
ResearchSession = { timestamp, findings: CompressedKnowledge[] }
saveResearchFinding(text, domain, topic) → Promise<void>
```

### `@/services/butlerScripts`
```ts
ButlerScript = { id, title, description, script, category, tags[], createdAt }

extractPythonCode(content) → string|null   // first block only
extractAllPythonBlocks(content) → string[] // all blocks

saveButlerScript(code, opts?: {title, description, category}) → Promise<ButlerScript>
loadButlerScripts() → Promise<ButlerScript[]>
deleteButlerScript(id) → Promise<void>
updateButlerScript(id, updates) → Promise<void>
clearButlerScripts() → Promise<void>
```

### `@/services/scriptFavorites`
```ts
FavoriteScript = { id, type, title, description, category, scriptCode, runCount, addedAt, lastRunAt }

loadFavorites() → Promise<FavoriteScript[]>
isFavorited(id) → Promise<boolean>
addFavorite(script) → Promise<void>
removeFavorite(id) → Promise<void>
toggleFavorite(script) → Promise<boolean>   // returns true if now favorited
recordFavoriteRun(id) → Promise<void>
reorderFavorites(newOrder: string[]) → Promise<void>
invalidateFavCache() → void
```

### `@/services/scriptUndo`
```ts
scriptUndoManager
  .getStack(scriptId) → ScriptUndoStack
    .push(code) → void
    .pop() → string|null
    .snapshotNow(code) → void
```

### `@/services/pinnedScripts`
```ts
loadPinnedIds() → Promise<string[]>
togglePin(id) → Promise<void>
```

### `@/services/executionHistory`
```ts
executionHistory
  .addEntry(entry) → Promise<HistoryEntry[]>
  .getAll() → Promise<HistoryEntry[]>
  .loadHistory() → Promise<HistoryEntry[]>
  .clearHistory() → Promise<void>

HistoryEntry = { id, scriptId, scriptName, category, success, ms, timestamp, error? }
```

### `@/services/executionCounter`
```ts
executionCounter
  .increment(scriptId) → Promise<number>
  .load() → Promise<Record<string,number>>
```

### `@/services/haptics`
```ts
haptics
  .light() | .medium() | .heavy()
  .selection() | .success() | .warning()
```

### `@/services/geminiAssist`
```ts
geminiAssist
  .load() → Promise<void>
  .isEnabled() → boolean
  .ask(prompt, systemPrompt?) → Promise<{ok, text}>
  .chat({messages, systemPrompt?}) → Promise<{ok, text}>
```

### `@/services/autoResearch`
```ts
autoResearch
  .notifyTyping(text) → void
  .getCached(query) → {kbCtx?} | null
  .clearCache() → void
```

### `@/services/lanScanner`
```ts
quickScan(onProgress) → Promise<{ip, port}[]>
ScanProgress = { scanned, total }
```

### `@/services/qrParser`
```ts
parseQRConnection(data) → {ip, port, pairingCode?} | null
```

### `@/services/serverMetrics`
```ts
serverMetrics.getContextString() → Promise<string>
```

### `@/services/kbGrowthTracker`
```ts
kbGrowthTracker.getChartData(hours, buckets) → Promise<ChartBucket[]>
ChartBucket = { ts, delta }
```

### `@/services/lambdaScan`
```ts
lambdaScan
  .getDrives(refresh?) → Promise<DriveEntry[]>
  .scanDirectory(opts) → Promise<ScanResult>
  .readFile(path) → Promise<{ok, content?, error?}>

DriveEntry = { path, label }
ScanResult = { ok, files: ScannedFile[], total, latencyMs, error? }
ScannedFile = { path, name, relative, ext, size_kb }
```

### `@/services/performanceTuner`
```ts
perf
  .isLow: boolean
  .isMid: boolean
  .lazyDelay: number
  .afterInteractions(fn) → () => void  // cancel fn

afterInteractions(fn) → cancelFn
adaptiveFetches(fns[]) → Promise<void>
```

### `@/services/serverCrawler`
```ts
sigmaNetCrawler
  .crawlViaRelay(opts, onLog) → Promise<SigmaRelayResult>
  .batchCrawlViaRelay(targets, onLog, onProgress) → Promise<{completed,failed,totalWords,results[]}>
  .checkRelay() → Promise<boolean>
  .getRelayAddr() → string

SIGMA_PYTHON_TARGETS: string[]
SigmaRelayResult = { url, wordCount, latencyMs, compressed?, error? }
```

---

## ── HOOKS ────────────────────────────────────────────────────────────────

### `@/hooks/useConnection`
```ts
useConnection(onChange?) → UseConnectionResult
  // = HubState + { connect(ip,port), reconnect(), disconnect() }

useConnectionStatus() → { isConnected, addr, connecting }
```

### `@/hooks/useAppActive`
```ts
useAppActive() → boolean
```

### `@/hooks/useChatHistory`
```ts
useChatHistory() → { entries, addEntry, clear }
```

### `@/hooks/useTheme`
```ts
useTheme() → AppTheme    // same as useCosmetic().T
```

---

## ── CONTEXTS ─────────────────────────────────────────────────────────────

### `@/contexts/CosmeticContext`
```ts
useCosmetic() → {
  activePackId, T: AppTheme,           // T = effective theme (preview or active)
  previewPackId, isPreviewMode,
  applyPack(id), startPreview(id), endPreview(), confirmPreview(),
  isUnlocked(id), addUnlocked(id),
  extras: PackExtras, updateExtras(updates),
  isPrimeActive, getColor(key), fadeAnim,
}

PACK_THEMES: Record<string, AppTheme>  // 12 themes
TIER_CONFIG: Record<TierId, {...}>

AppTheme keys: id,name,primary,secondary,tertiary,bg,panel,panelBrt,
  textAccent,textDim,textHi,textMid,glowColor,borderColor,borderBrt,
  userBubble,aiBubble,aiBorder,chatBarBg,chatBarTopGlow,chatBarBorderTop,
  promptGlyph,isDefault,tagline?,category?,icon?,badge?,tier?
```

### `@/contexts/TabBarContext`
```ts
useTabBar() → { activeTab, setActiveTab }
```

### `@/contexts/LanguageContext`
```ts
useLanguage() → { lang, setLang }
```

---

## ── COMPONENTS ───────────────────────────────────────────────────────────

### `@/components/ui/CompactPageHeader`
```tsx
<CompactPageHeader
  accent={string}
  icon={string}
  iconLib?="material"|"community"|"ionicons"
  title={string}
  badge?={string}
  badgeColor?={string}
  isConnected={boolean}
  safeTop={number}
  rightAction?={{ icon, onPress, color }}
  rightAction2?={{ icon, onPress, color }}
  extraRow?={ReactNode}   // rendered below the title row
/>
```

### `@/components/ui/NexusPageBanner`
```tsx
<NexusPageBanner
  accent={string}
  accent2?={string}
  icon={string}
  iconLib?={string}
  title={string}
  subtitle?={string}
  safeTop={number}
  isConnected={boolean}
  badge?={string}
  badgeColor?={string}
  rightAction?={{ icon, onPress, color }}
  rightAction2?={{ icon, onPress, color }}
  themeExtra?={ReactNode}  // third row inside banner
/>
```

### `@/components/ui/NexusLiveCard`
```tsx
<NexusLiveCard
  title={string}
  subtitle?={string}
  accent={string}
  isLive?={boolean}
  liveLabel?={string}
  stats={NexusLiveCardStat[]}   // { label, value, color, icon?, trend?, prevValue? }
  sparkPoints?={number[]}
  onPress?={() => void}
  badge?={string}
  badgeColor?={string}
  actionLabel?={string}
  onAction?={() => void}
/>

NexusLiveCardStat = { label, value, color, icon?, trend?: 'up'|'down'|'flat', prevValue? }

<NexusMetricPillRow pills={MetricPill[]} />  // { label, value, color, icon? }
<NexusStatusBanner connected isConnected connectedText offlineText connColor offColor />
```

### `@/components/ui/TabSwipeOverlay`
```tsx
<TabSwipeOverlay leftRoute="/(tabs)/X" rightRoute="/(tabs)/Y" />
```

### `@/components/ui/WidgetLayer`
```tsx
<InlineWidgetSlot pageId={string} position="inline-top" />
// NOTE: InlineWidgetSlot is imported from @/components/ui/WidgetLayer
// but the export may be missing — check WidgetLayer.tsx before using
```

---

## ── SERVER API CONTRACT (v20.1.0) ──────────────────────────────────────
> Cached from butler_server_v20_1_0.py — no need to re-fetch

| Method | Path                   | Body / Params                        | Response                                    |
|--------|------------------------|--------------------------------------|---------------------------------------------|
| GET    | /api/status            | –                                    | { version, capabilities{} }                 |
| POST   | /api/execute           | { script: string }                   | { output, error?, success, ms }             |
| POST   | /api/butler/chat       | { messages: [{role,content}] }       | { content, response?, message?, model? }    |
| GET    | /api/metrics           | –                                    | { cpu_percent/cpu, memory/ram, disk, uptime_seconds } |
| GET    | /api/ollama/status     | –                                    | { running, model?, models[]? }              |
| GET    | /api/ollama/list       | –                                    | { models: [{name,...}] }                    |
| POST   | /api/crawl             | { url, domain?, topic? }             | { content, wordCount, latencyMs }           |
| GET    | /api/pair              | –                                    | QR code display (HTML/text)                 |
| GET    | /api/learn/status      | –                                    | { articlesTotal, queuePending, workersRunning, uptimeMins, topUserTopics[] } |
| GET    | /api/undo/list         | –                                    | { entries: [{id, userRequest, remainingMin}] } |
| POST   | /api/undo/rollback     | { id: number }                       | { ok, message?, restored?, error? }         |
| GET    | /api/clipboard         | –                                    | { text }                                    |
| POST   | /api/clipboard         | { text: string }                     | { ok }                                      |
| POST   | /api/power             | { action: 'sleep'|'restart'|'shutdown' } | { ok, error? }                         |
| POST   | /api/kb/search         | ?q=query  (GET param)                | { scripts: [{id,name,desc,...}] }           |
| GET    | /api/kb/enrich         | ?topic=X                             | { content }                                 |

> ❌ NOT ON SERVER v20: /api/memory, /api/scheduler, /api/scripts/library, /api/scripts/run, /api/scripts/build, /api/pc_scripts/*, /api/pc-check/*

### Auth
- Bearer token in `Authorization: Bearer <token>` header
- Token obtained after pairing via `/api/pair` QR scan
- `serverConnection.getToken()` → current token
- `serverConnection.fetchWithAuth(url, opts)` → auto-injects token

---

## ── TAB NAVIGATION MAP ────────────────────────────────────────────────────
```
/(tabs)/nexushome   HOME tab     (NexusHomeScreen)
/(tabs)/scripts     SCRIPTS tab  (ScriptsScreen)
/(tabs)/butler      AI tab       (ButlerScreen)
/(tabs)/knowledge   KB tab       (KnowledgeScreen)
/(tabs)/logs        PC tab       (PCCheckScreen)
/(tabs)/builder     BUILD tab    (builder.tsx)
/(tabs)/settings    CONFIG tab   (settings.tsx)
/(tabs)/cosmetic    SKINS tab    (CosmeticScreen)
/(tabs)/onboarding  INTRO tab    (hidden after done)
// hidden: index, terminal, fileshare, support
```

### Global bridge functions
```ts
(global as any).__butlerSwitchTab?.(tabName: string)  // switch to any tab
(global as any).__butlerInjectMessage?.(text: string) // send message to AI tab
(global as any).__showConnectionToast?.(msg, color)   // toast notification
(global as any).__scriptsOpenAIBuilder?.()            // open AI builder modal
(global as any).__butlerClearChat?.()                 // clear AI conversation
```

---

## ── ONBOARDING KEYS ──────────────────────────────────────────────────────
```ts
import { ONBOARDING_DONE_KEY } from '@/constants/onboardingKeys'
// Value '1' = done
// AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1')
```

---

## ── ASYNC STORAGE KEY REGISTRY ──────────────────────────────────────────
```
@butler_packs_active_v5       // active cosmetic pack id
@butler_packs_unlocked_v5     // unlocked pack ids array
@butler_packs_extras_v5       // per-pack FX overrides
@butler_conv_nexus_v1         // AI chat conversation history
@butler_ai_disclosure_v1      // '1' if AI disclosure accepted
@butler_crash_log_v1          // crash log array (last 20)
@botler_auto_saved_research   // KB research sessions JSON
boter_exec_counts_v1          // execution count map
@sc_auth_disabled_v1          // auth disabled flag
butler_script_streak_v1       // { streak, best, lastDate }
@kb_growth_last_run           // timestamp of last growth
@kbbot_last_auto_run          // timestamp of last bot cycle
@qlh_last_harvest             // timestamp of last QLH harvest
@butler_review_reward_v1      // 'unlocked' if review reward earned
ONBOARDING_DONE_KEY           // '1' if onboarding complete
butler_privacy_banner_dismissed_v2  // dismissed flag
```
