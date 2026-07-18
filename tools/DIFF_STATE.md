# DIFF STATE — File Change Tracker
> Updated after each session. Check this BEFORE reading any file.
> Last verified: 2026-06-20 (Session 7)

---

## ── SESSION SUMMARY (most recent) ────────────────────────────────────────

Session goal: Activity Logs page built (terminal.tsx replaced), wiring all 6 previously hidden logging services.

## ── PREVIOUSLY HIDDEN / UNWIRED SERVICES (all now surfaced in terminal.tsx) ──

| Service | What was hidden | Now wired |
|---------|----------------|----------|
| `connectionDiagnostics.ts` | `connDiagnostics.logConnect/Disconnect/Ping` — 200 events stored, zero UI | NETWORK tab |
| `heartbeatEngine.ts` | `getConnectionQuality()` — score/jitter/latency/packetLoss never shown | QUALITY tab |
| `bootErrorLog.ts` | `getBootErrors()` — full crash phase reports, Settings never displayed them | BOOT tab |
| `logger.ts` | `getEntries()` ring buffer (last 100 entries) — never shown in UI | QUALITY > ring buffer |
| `aiLogger.ts` | `getRecentLogs()` + `getDiagnostics()` — has pattern matching, never had viewer | QUALITY > AI diagnostics |
| `autoErrorLogger.ts` | `getLogs()` — Settings showed count only, never the actual entries | FEED tab (all entries) |
| `app/_layout.tsx getCrashLogs()` | GlobalErrorBoundary crash reports — stored but never readable | BOOT > CRASH LOGS |

Key fixes:
1. `services/knowledgeAccumulator.ts` — `AUTO_SAVE_KEY` reads/writes now use `encryptedStorage` (was raw AsyncStorage, bypassing encryption for KB findings)
2. `app/(tabs)/butler.tsx` — `CONV_KEY` (chat history) reads/writes now use `encryptedStorage` (was raw AsyncStorage)
3. `app/_layout.tsx` — `knowledgeGrowthEngine.silentGrowth()` now called at app boot (was NEVER called — seed and 20-min auto-grow were disabled at startup)
4. `app/(tabs)/knowledge.tsx` — `KBLiveDashCard` fallback used wrong field names (`stats.total`/`stats.sessions` → `stats.totalFindings`/`stats.totalSessions`), causing KB count to always show 0 in offline mode
5. `app/(tabs)/knowledge.tsx` — `isConnected` seed now uses `|| serverConnection.isConnected()` fallback (was only checking `autoConnectEngine.getCurrentConnection().connected`)

---

## ── RECENTLY MODIFIED ────────────────────────────────────────────────────

| File | Status | Last Change Summary |
|------|--------|---------------------|
| `services/knowledgeAccumulator.ts` | MODIFIED | All AUTO_SAVE_KEY AsyncStorage ops replaced with encryptedStorage; import added |
| `app/(tabs)/butler.tsx` | MODIFIED | CONV_KEY chat history now encrypted via encryptedStorage; import added |
| `app/_layout.tsx` | MODIFIED | `knowledgeGrowthEngine.silentGrowth()` called at boot |
| `app/(tabs)/knowledge.tsx` | MODIFIED | KBLiveDashCard wrong field names fixed; isConnected seed fixed |
| `services/serverConnection.ts` | MODIFIED | All sensitive keys use encryptedStorage (Session 6) |
| `app/(tabs)/logs.tsx` | MODIFIED | MiniBar component, useConnectionStatus (Session 6) |
| `app/(tabs)/settings.tsx` | MODIFIED | Dead NexusPageBanner removed (Session 4) |
| `app/(tabs)/builder.tsx` | MODIFIED | CompactPageHeader (Session 4) |

---

## ── VERIFIED STABLE ───────────────────────────────────────────────────────

| File | Verified | Notes |
|------|----------|-------|
| `services/encryptedStorage.ts` | 2026-06-20 | PBKDF2-SHA256 XOR stream cipher; init(deviceId) + migrate() |
| `services/nexusBridge.ts` | 2026-06-20 | buildNexusContext, pickBestModel, chat — all confirmed |
| `services/knowledgeGrowthEngine.ts` | 2026-06-20 | silentGrowth() confirmed; background timer DISABLED (server handles crawl) |
| `services/knowledgeAccumulator.ts` | 2026-06-20 | Now uses encryptedStorage for AUTO_SAVE_KEY |
| `services/autoConnectEngine.ts` | 2026-06-20 | exports: autoConnectEngine, EngineStatus, EngineEvent |
| `services/serverFeatures.ts` | 2026-06-20 | features singleton, setFromStatus, has, reset |
| `services/connectionHub.ts` | 2026-06-20 | notifyConnected, 20s Ollama poll, fast-ping (Session 5) |
| `hooks/useConnection.ts` | 2026-06-20 | useConnection + useConnectionStatus — push updates |
| `constants/butlerKnowledge.ts` | 2026-06-20 | BUTLER_KNOWLEDGE_COMPACT + BUTLER_STARTER_KNOWLEDGE confirmed |

---

## ── KB SYSTEM ARCHITECTURE (verified) ───────────────────────────────────

### Auto-seed (one-time, on first launch):
- `_layout.tsx` → `knowledgeGrowthEngine.silentGrowth()` at boot
- `silentGrowth()` → `autoSeedIfNeeded()` (PYTHON_AUTOMATION_SCRIPTS + static security seeds)
- Seeds marked done via `@botler_seed_done_v1` — never re-seeds

### Auto-grow (every 20min when connected):
- `silentGrowth()` → `runGrowthCycle()` after 3s if connected, or on first connect event
- Phases: priority seeds → user question gap-fill → coverage gaps → PSI-RSS → NCX crawler
- DISABLED background interval timer (server handles crawl via SIGMA-NET 24/7)

### Encryption (all sensitive KB data):
- `@botler_auto_saved_research` (KB findings) → encryptedStorage ✓
- `@butler_conv_nexus_v1` (chat history) → encryptedStorage ✓
- Connection keys (IP/port/token/deviceId) → encryptedStorage ✓

### AI chat KB injection:
- butler.tsx → `knowledgeAccumulator.buildContext(query)` → injected into system prompt ✓
- butler.tsx → `nexusBridge.buildNexusContext(query)` → dual-channel (local + server relay) ✓
- butler.tsx → `knowledgeAccumulator.processExchange(user, reply)` → grows KB from every chat ✓

### Knowledge tab wiring:
- DASHBOARD tab: `KBLiveDashCard` + `KBIntelDashboard` (local stats + server stats)
- BRIDGE tab: `NexusBridgeFullTab` (Φ-NEXUS protocol + QLH stats)
- ORGANIZER tab: `NexusBotFullTab` (KB organize cycles + gap filling)
- KB EXPLORER tab: `FlatList` of all `CompressedKnowledge` findings

---

## ── KNOWN ISSUES / WATCH LIST ────────────────────────────────────────────

| Issue | File | Status |
|-------|------|--------|
| `extractPythonCode` returns `string|null` not array — butler.tsx inline workaround correct | `services/butlerScripts.ts` | WATCH |
| UndoCountdownBanner wire-up needs test run verification | `app/(tabs)/scripts.tsx` | WATCH |

---

## ── TAB ROUTE MAP (current) ──────────────────────────────────────────────

| Tab | File | Visible |
|-----|------|---------|
| nexushome | nexushome.tsx | YES |
| scripts | scripts.tsx | YES |
| butler | butler.tsx | YES |
| knowledge | knowledge.tsx | YES |
| logs | logs.tsx | YES |
| builder | builder.tsx | YES |
| settings | settings.tsx | YES |
| cosmetic | cosmetic.tsx | YES |
| onboarding | onboarding.tsx | hidden after done |
