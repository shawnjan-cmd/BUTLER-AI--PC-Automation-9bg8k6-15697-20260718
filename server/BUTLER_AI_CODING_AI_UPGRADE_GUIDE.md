# Butler AI: Definitive Coding-AI Compatibility & Upgrade Guide

**Author:** Manus AI  
**Target Audience:** Any AI Coding Agent or Developer Upgrading Butler AI  
**Compatibility Standards:** OnSpace.ai, Expo SDK 54+, React Native, Python FastAPI (v20.1.0+)

---

### Executive Overview & Architecture Principles

Butler AI is a secure, local-first PC automation and companion ecosystem. The system is split into two cleanly separated tiers:
1. **The Mobile Client**: A React Native (Expo SDK 54+) application featuring cyberpunk aesthetics, 60 FPS performance governance, a hardened UI shell, and offline-first local storage.
2. **The Companion Server**: A singular canonical Python FastAPI server (`butler_server.py`) embedding 12 proprietary subsystems (Butler Brain, Synapse Weaver, Script Workshop, Hardened Memory Vault, Self-Evolving Core, etc.).

When updating, refactoring, or extending codebases for **OnSpace.ai** or public release, AI coding assistants must strictly adhere to the rules, API endpoints, security guards, and compatibility specifications detailed in this guide.

---

### Core Compatibility Requirements for OnSpace.ai & Expo

| Subsystem | Requirement / Constraint | Correct Implementation Pattern |
| :--- | :--- | :--- |
| **Expo Router & Navigation** | File-based routing under `app/(tabs)/`. No orphaned routes. | Always use `router.push('/(tabs)/...')` or relative tab paths. |
| **TypeScript Strictness** | Zero type errors allowed (`pnpm exec tsc --noEmit`). | Explicitly type all service responses, props, and state interfaces. |
| **Local-First Privacy** | Zero telemetry exfiltration; all memories and scripts stay local. | Encrypt local storage using AES-256-GCM via `encryptedStorage.ts`. |
| **Python FastAPI Server** | Singular canonical entry point (`butler_server.py`). | Run with `python3 butler_server.py`; bind to local ports with fallback scanning. |
| **Ollama Integration** | Local port discovery (`11434`) with keep-alive persistence. | Poll `/api/ollama/status` and route prompts via local REST endpoints. |

---

### Complete API Endpoint Reference

The Python companion server exposes the following canonical endpoints consumed by the React Native client:

| Endpoint | Method | Payload / Parameters | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | None | Server health, version, and uptime check. |
| `/vault/unlock` | POST | `{ "pin": "string" }` | Unlocks the Hardened Memory Vault with 6+ digit PIN. |
| `/scripts/create` | POST | `{ "name": "string", "code": "string" }` | Validates AST syntax and runs security trust scan. |
| `/recovery/panic` | POST | None | Immediate fail-closed security circuit breaker. |
| `/api/leaderboard/chat` | POST | `{ "handle": "string", "score": number, "message": "string" }` | Submits achievement scores and public chat messages. |
| `/api/ollama/status` | GET | None | Checks local Ollama availability and model status. |

---

### Critical Warnings & Security Guardrails

1. **Never Expose Plaintext Secrets**: API keys, vault encryption keys, and user tokens must never be logged or transmitted over unencrypted channels.
2. **Fail-Closed Privacy Circuit**: If network isolation or tampering is detected, Butler must immediately trip its privacy circuit, falling back to local read-only mode.
3. **Strict Policy Enforcement**: AI prompts requesting bot-account creation, scraping evasion, credential harvesting, or website rule violations must be blocked and redirected by the shared command gateway.

---

### Development & Testing Commands

- **Verify TypeScript App Build**:
  ```bash
  pnpm exec tsc --noEmit
  ```
- **Run Python Server Test Suite (59 Tests)**:
  ```bash
  python3 -m unittest discover -s server -p "*_test.py"
  ```
- **Launch Companion Server**:
  ```bash
  python3 butler_server.py
  ```
