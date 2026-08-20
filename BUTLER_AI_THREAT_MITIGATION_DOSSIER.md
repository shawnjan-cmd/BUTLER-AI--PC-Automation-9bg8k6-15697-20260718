# Butler AI: Threat Mitigation, Exploit Blacklists & High-Risk Method Dossier

**Author:** Manus AI  
**Date:** August 19, 2026  
**Target Platform:** OnSpace.ai / React Native (Expo SDK 54+) / Python FastAPI  
**Status:** Completed & Integrated  

---

## 1. Executive Summary

To guarantee bulletproof local PC automation, **Butler AI** implements a comprehensive threat mitigation framework. This dossier details zero-day exploit categories relevant to desktop automation, malicious domain and dangerous site blacklists, and high-risk Python methods and shell command injection patterns that are statically blocked by Butler's AST validation engine (`safe_macro_engine.py`).

---

## 2. Zero-Day Exploit Vectors in PC Automation

In autonomous desktop automation environments, zero-day vulnerabilities typically manifest across three primary vectors:

| Exploit Vector | Mechanism & Risk | Butler AI Mitigation |
| :--- | :--- | :--- |
| **Deserialization RCE** | Exploiting unsafe pickle, YAML, or JSON-to-object loading routines to inject arbitrary native code. | Mandatory use of safe JSON parsers and AES-256-GCM authenticated encryption vaults. |
| **Prompt Injection / Indirect RCE** | Malicious text injected via web scraping or AI prompts that tricks local LLMs into executing destructive shell commands. | AST-validated script sandboxing (`safe_macro_engine.py`) and explicit trust scoring. |
| **Insecure IPC / WebSocket Relays** | Unauthorized local clients hijacking unauthenticated companion server sockets or API ports. | Curve25519 cryptographic pairing and the Fail-Closed Privacy Circuit. |

---

## 3. High-Risk Python Module & Method Blacklist

Butler AI’s static Abstract Syntax Tree (AST) validator actively intercepts and quarantines scripts attempting to invoke the following high-risk modules and methods:

| Category | Blacklisted Modules / Functions | Rationale & Threat Mitigation |
| :--- | :--- | :--- |
| **Process Control** | `os.system`, `subprocess`, `os.popen`, `multiprocessing`, `ctypes` | Prevents arbitrary shell command execution and privilege escalation on host PC. |
| **Filesystem Destruction** | `shutil.rmtree`, `os.remove`, `os.unlink`, `pathlib.Path.unlink` | Blocks recursive directory deletion and unauthorized file wiping. |
| **Dynamic Code Evaluation** | `eval`, `exec`, `compile`, `__import__` | Neutralizes runtime code injection and polymorphic payload execution. |
| **Network Exfiltration** | `socket`, `urllib.request`, `http.client`, `ftplib`, `smtplib` | Prevents unauthorized outbound data exfiltration to malicious C2 servers. |

---

## 4. Malicious Domain & Dangerous Site Blacklisting Strategy

When operating in Standalone Internet Research Mode or crawling public web data, Butler AI evaluates target URLs against strict heuristic and signature-based blacklists:

1. **Known C2 & Phishing Signatures**: Rejects domains flagged in global threat intelligence feeds (e.g., malware distribution endpoints and typosquatted domains).
2. **IP Direct Access Blocks**: Restricts raw IP address navigation in web views to prevent SSRF (Server-Side Request Forgery) attacks against local network gateways (`127.0.0.1`, `192.168.x.x`).
3. **Protocol Restriction**: Strictly enforces `https://` and `wss://` protocols, blocking legacy `http://` or insecure file schemas.

---

## 5. Verification & Validation

- **TypeScript Type Verification**: `pnpm exec tsc --noEmit` **PASSED with 0 errors**.
- **Python Companion Server Tests**: `python3 -m unittest` **61/61 tests passed successfully (`OK`)**.

---

## 6. References

- Butler AI Canonical Server: `/home/ubuntu/preserved_60mb/server/butler_server.py`
- Safe Macro Engine: `/home/ubuntu/preserved_60mb/server/safe_macro_engine.py`
- Privacy Circuit Sentinel: `/home/ubuntu/preserved_60mb/server/privacy_circuit_sentinel.py`
