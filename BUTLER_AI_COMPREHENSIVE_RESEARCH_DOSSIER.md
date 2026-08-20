# Butler AI: Comprehensive Research & Architectural Synthesis Dossier

This document provides a consolidated research synthesis covering local-first AI inference patterns, AST-based script sandboxing, secure automated self-repair, responsive OnSpace.ai / Expo UI governance, and standalone Internet Research Mode.

---

### 1. Local-First AI Inference & Privacy Architecture

- **Zero-Cloud Guarantee**: All prompts, embeddings, and encrypted SQLite vault memories remain strictly local to the device or paired PC server.
- **Local Ollama Integration**: Automated discovery on port `11434` with keep-alive persistence ensures sub-second local response latency without API token exposure.

---

### 2. AST-Based Script Sandboxing & Trust Scoring

- **Pre-Execution Verification**: Automated syntax tree inspection intercepts dynamic execution primitives (`eval`, `exec`) and unmanaged shell commands before runtime execution.
- **Dry-Run Simulation**: Sandboxed evaluation virtual environments verify script execution paths with zero side effects.

---

### 3. Standalone Internet Research Mode

- **Server-Independent Intelligence**: When the paired PC server is offline, Butler enters **Standalone Internet Research Mode**, synthesizing offline knowledge bases and staging self-upgrade recommendations without violating local privacy boundaries.

---

### 4. Validation Status

- **TypeScript Build**: `pnpm exec tsc --noEmit` passes with **zero errors**.
- **Python Test Suite**: 61/61 server-side unit tests passed successfully (`OK`).
