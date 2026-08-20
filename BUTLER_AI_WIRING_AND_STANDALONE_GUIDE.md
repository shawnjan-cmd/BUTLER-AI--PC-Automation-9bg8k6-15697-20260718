# Butler AI: In-Depth Wiring, Diagnostics & Standalone Internet Research Guide

This document defines the complete wiring architecture, Butler Brain control boundaries, silent-crash detection methods, and the standalone Internet Research Mode operating independently of the paired PC server.

---

### 1. In-Depth Wiring & Control Paths

- **Shared Command Gateway (`connectionHub` + `commandGateway`)**:
  - Intercepts all user prompts and chat messages from any entry point.
  - Classifies intent, indexes provenanced memory into encrypted SQLite, and applies fail-closed safety policy filters.
- **Butler Brain Orchestration (`butlerBrain`)**:
  - Manages active subsystem state, background heartbeats (8s ping, 20s Ollama poll), and resource governance (`performanceGovernor`).
  - Ensures non-essential background tasks yield immediately during active interactive chat or script execution to maintain 60 FPS performance.

---

### 2. Silent Crash Detection & Diagnostic Automation

- **Proactive Error Intercepts**:
  - `runtimeErrorMonitor` and `autoErrorLogger` continuously monitor unhandled promise rejections, network timeouts, and React render boundaries.
- **Self-Healing Supervisor (`selfHealingSupervisor`)**:
  - Matches captured stack traces against known error patterns, applying bounded fallback repairs (such as local read-only mode or connection resets) while notifying Butler of root causes.

---

### 3. Standalone Internet Research Mode (Server-Independent)

- **Isolated Research Operation (`standaloneResearchMode.ts`)**:
  - When the user's PC companion server is offline or un-paired, Butler enters **Standalone Internet Research Mode**.
  - **Capabilities**: Queries local knowledge bases, synthesizes public documentation, analyzes script templates, and prepares self-upgrade patch recommendations.
  - **Boundaries**: Strictly prohibits remote code execution or raw telemetry transmission while offline, preserving 100% user privacy.

---

### Verification Status

- **TypeScript Build**: `pnpm exec tsc --noEmit` passes with **zero errors**.
- **Python Test Suite**: 61/61 server-side unit tests passed successfully (`OK`).
