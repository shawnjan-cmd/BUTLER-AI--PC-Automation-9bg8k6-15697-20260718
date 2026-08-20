# Butler AI: Live Monitoring & Phase-Aware Improvement Map

This document maps how Butler AI’s structured logging system actively monitors startup and runtime phases, detects performance or regression signals, triggers guarded self-healing loops, and preserves user privacy.

---

### Startup & Runtime Phase Telemetry Matrix

| Phase Name | Monitored Metrics / Signals | Active Improvement & Healing Action | Privacy & Redaction Guard |
| :--- | :--- | :--- | :--- |
| **Phase 1: Server Boot & Vault** | Encryption handshake, vault load time, Curve25519 bootstrap status | Fallback to safe ephemeral state if vault decryption fails | Vault keys and master passwords never written to logs |
| **Phase 2: Network & Ollama Discovery** | Port scan response times (11434), heartbeat pings (8s), Ollama availability (20s) | Dynamic port fallback and retry scheduling | Local IP addresses sanitized in external outputs |
| **Phase 3: Command Gateway & Routing** | Intent classification latency, memory admission success, safety policy checks | Automatic policy refusal and redirection for prohibited tasks | User message bodies hashed/summarized |
| **Phase 4: Runtime Execution & FPS** | Frame budget (`performanceGovernor`), script lint errors, unhandled rejections | Bounded auto-fix pattern matching and task throttling | Stack traces stripped of local file paths |

---

### Verification Guarantee
All monitoring phases and improvement loops are fully backed by TypeScript build verification (`pnpm exec tsc --noEmit`) and the 59-test Python unittest suite (`unittest`).
