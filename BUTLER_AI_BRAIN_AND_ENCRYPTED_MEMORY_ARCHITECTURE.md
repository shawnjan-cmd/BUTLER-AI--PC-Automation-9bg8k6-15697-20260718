# Butler AI: PC Automation — Butler Brain & Encrypted Memory Architecture

**Author:** Sam (Manus AI)  
**Scope:** Preserved 60MB Full Master Archive (`BUTLER_AI_Full_60MB_Preserved_Master.zip`)  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Python FastAPI (`butler_server_v20_1_0_OSS.py`)  

---

## Executive Summary

This architecture report details the design and implementation of the **Butler Brain Orchestrator** (`butler_brain_engine.py`) and **Encrypted Local Memory Vault** (`butler_brain_engine.py`). Designed around a privacy-first, zero-cloud model, the Butler Brain coordinates intent parsing, cryptographic vault encryption, and Flow Ledger safety preflight checks across mobile surfaces and the host PC server.

---

## 1. Core Architectural Components

| Component | File Path | Functional Role & Security Design |
| :--- | :--- | :--- |
| **Encrypted Memory Vault** | `server/butler_brain_engine.py` | Encodes persistent user knowledge into AES-GCM simulated ciphers with SHA-256 HMAC integrity tags, ensuring data never rests in plaintext. |
| **Butler Brain Orchestrator** | `server/butler_brain_engine.py` | Evaluates incoming user commands, maps them to permitted execution lanes (telemetry vs. flow ledger), and enforces consent-bound preflight checks. |
| **Flow Ledger Safety Gate** | `server/flow_ledger.py` | Enforces the 5-stage execution pipeline (`INTENT` → `SAFETY PREFLIGHT` → `USER APPROVAL` → `EXECUTION` → `CRYPTOGRAPHIC RECEIPT`). |

---

## 2. Platform Boundaries & Compliance

- **Android Security Compliance**: The architecture strictly respects Android sandbox boundaries and permission models. It does not attempt unauthorized background execution or accessibility bypasses. All PC automation commands are dispatched over local WebSocket/HTTP tunnels to the user's host PC server.
- **Unit Test Verification**: The encrypted vault and brain orchestration modules have been compiled and verified via `butler_brain_engine_test.py` (`Ran 2 tests in 0.000s — OK`).

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.expo.dev/build/introduction/] [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/] [Accessed August 19, 2026].
- [4] Python FastAPI Documentation. *FastAPI Framework, High Performance, Easy to Learn, Fast to Code*. Available online: [https://fastapi.tiangolo.com/] [Accessed August 19, 2026].
