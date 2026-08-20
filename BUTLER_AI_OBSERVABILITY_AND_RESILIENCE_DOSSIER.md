# Butler AI: Observability, Self-Healing, and Resilience Dossier

This document records the comprehensive observability, self-healing, and connection resilience audit conducted for the **Butler AI** release candidate suite.

---

### Executive Architecture Overview

Butler AI integrates client-side mobile monitoring (`autoErrorLogger`, `runtimeErrorMonitor`, `connectionHub`) with a hardened companion server (`butler_server.py`) across 12 proprietary subsystems. Every telemetry stream, network probe, and self-healing loop operates on an **offline-first, fail-closed** foundation, ensuring absolute privacy without cloud exfiltration.

---

### Subsystem Wiring & Observability Matrix

| Subsystem | Monitoring & Interception Hook | Self-Healing / Auto-Fix Behavior | Persistence / Security Guard |
| :--- | :--- | :--- | :--- |
| **Runtime Error Monitor** | Global `ErrorUtils`, unhandled promise rejections, `fetch()` interceptor, console sink | Automatically matches error signatures against 10+ fix patterns (storage sync, network retry, fallback state) | Persists circular buffer (max 150 entries) locally via encrypted storage |
| **Connection Hub** | Polling heartbeat, engine lifecycle events, capability probe | Triggers fast pings (8s) and dynamic port/IP recovery across common port tables | Enforces HMAC pairing locks and Curve25519 session tokens |
| **Auto Error Logger** | Debounced buffer with console mirroring and error level counters | Maintains local memory ring (max 100 entries) with fallback persistence | Stored in AsyncStorage under encrypted keys |
| **Automation Watchdog** | Background process and script execution guard | Automatically catches process panics, file permission errors, and memory spikes | Restricts autonomous loops to prevent runaway resource consumption |

---

### Key Resilience Enhancements & Verifications

1. **Unified Error Signaling**: `connectionHub` now directly pushes pairing and connection failures into `autoErrorLogger` and `runtimeErrorMonitor`, enabling instant visibility across UI dashboards.
2. **Resilient Port & Network Discovery**: The adaptive connection engine scans a comprehensive list of common server ports (5000, 8000, 8080, 8765–8770, 3000, etc.) with timeout-bounded probes, eliminating single-port failure modes.
3. **Strict Type Safety & Clean Compilation**: TypeScript compilation (`pnpm exec tsc --noEmit`) passes with zero warnings or errors across the entire repository.

---

### References & Documentation

- [Butler AI Lawyer Disclosure Dossier](./BUTLER_AI_LAWYER_DISCLOSURE_DOSSIER.md)
- [Canonical Server Manifest](./server/BUTLER_SERVER_COMPLETE_MANIFEST.md)
- [Tools Page Validation Notes](./TOOLS_PAGE_VALIDATION_NOTES.md)
