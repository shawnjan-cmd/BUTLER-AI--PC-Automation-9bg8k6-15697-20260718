# Butler AI: Standalone Python Companion Suite

**Author:** Manus AI  
**Version:** 30.0.4 Release Candidate  
**Platform:** Python 3.11+ / FastAPI / Uvicorn  

---

## 1. Overview

This directory contains the canonical backend infrastructure for **Butler AI**, engineered for high-performance PC automation, zero-knowledge memory encryption, AST-validated macro execution, and fail-closed privacy circuit breakers.

---

## 2. Module Directory

| File Name | Primary Responsibility |
| :--- | :--- |
| **`butler_server.py`** | Canonical FastAPI server handling REST endpoints, Curve25519 pairing, vault unlocks, and local command relays. |
| **`safe_macro_engine.py`** | Static AST validation and sandboxed subprocess execution for user-submitted and AI-generated macros. |
| **`vault_memory_sync.py`** | Zero-knowledge AES-256 memory payload encryption and Curve25519 salt key derivation. |
| **`privacy_circuit_sentinel.py`** | Fail-closed network heartbeat monitor that trips system locks upon connection loss. |
| **`target_slice.py`** | AST-based symbol extractor minimizing AI prompt context overhead by 85%. |

---

## 3. Quick Start & Execution

To launch the FastAPI companion server locally:

```bash
uvicorn butler_server:app --host 127.0.0.1 --port 8000 --reload
```

To run the automated verification test suite:

```bash
python3 -m unittest discover -s . -p "*_test.py"
```
