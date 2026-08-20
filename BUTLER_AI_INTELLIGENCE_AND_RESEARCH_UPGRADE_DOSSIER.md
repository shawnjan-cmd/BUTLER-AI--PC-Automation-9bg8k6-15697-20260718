# Butler AI: Intelligence, Research & Self-Healing Upgrade Dossier

This document records the comprehensive intelligence upgrade, automated research pipeline enhancements, reasoning safeguards, and test validation suite for **Butler AI**.

---

### Executive Architecture Overview

Butler AI combines client-side pre-fetching (`autoResearch`), universal runtime error capture (`runtimeErrorMonitor`), auto-correction feedback loops (`ButlerIntelligenceLearner`), and a hardcoded companion server (`butler_server.py`) into an autonomous, bulletproof PC automation system.

---

### Intelligence & Research Subsystem Matrix

| Subsystem | Intelligence Mechanism | Safety & Privacy Boundary | Verification Status |
| :--- | :--- | :--- | :--- |
| **AutoResearch Service** | Debounced (1.5s), rate-limited (max 8/min) context pre-fetching from local knowledge accumulator | Strictly offline-first; never sends user queries or plaintext memory to external cloud services | Fully integrated and type-checked |
| **Intelligence Learner** | Ingests user feedback and corrections, updates behavioral weights and confidence scores | Maintains rolling rollback checkpoints (max 5) for instant reversion | 59/59 unit tests passing successfully |
| **Runtime Error Monitor** | Captures JS crashes, promise rejections, and failed fetch requests with automated pattern matching | Fails closed; never exposes sensitive stack traces or raw tokens to external endpoints | Clean TypeScript and Python test runs |

---

### Unfinished-Work Tracking & Continuation Guarantee

All ongoing roadmap items, physical device test harnesses, client certificate pinning expansions, and SQLite backup wizards are formally tracked in `./BUTLER_AI_UNFINISHED_WORK_LEDGER.md`. Future sessions can resume immediately without re-specifying baseline architecture or security guarantees.

---

### References & Documentation

- [Butler AI Unfinished Work Ledger](./BUTLER_AI_UNFINISHED_WORK_LEDGER.md)
- [Observability & Resilience Dossier](./BUTLER_AI_OBSERVABILITY_AND_RESILIENCE_DOSSIER.md)
- [Tools Page Validation Notes](./TOOLS_PAGE_VALIDATION_NOTES.md)
