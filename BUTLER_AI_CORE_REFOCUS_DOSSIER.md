# Butler AI: Core Experience Refocus & Polish Dossier

This document records the design and architectural refocusing of **Butler AI**, centering the product on a cohesive, original, high-performance core experience with flawless command routing, transparent local memory, safe automation, and smooth 60 FPS performance.

---

### Core Experience Principles

1. **Unified Command Flow**:
   - Every input across app and server chat surfaces is intercepted by the shared command gateway, ensuring instant intent classification, persistent memory storage, and strict policy gating.
2. **Transparent Local-First Memory**:
   - Provenance-checked memory admission and encrypted storage guarantee that user preferences and context are preserved locally without cloud exfiltration.
3. **Performance & FPS Prioritization**:
   - Resource governance (`performanceGovernor` and `frameBudgetMonitor`) sheds non-essential animations during heavy script execution to maintain smooth 60 FPS performance across all devices.

---

### Verification Status

- **TypeScript Build**: `pnpm exec tsc --noEmit` passes clean with **zero errors**.
- **Python Unit Test Suite**: 59/59 server-side unit tests passed successfully (`OK`).
- **Persistent Ledgers**: All state, charters, activity logs, and work ledgers remain fully synchronized.
