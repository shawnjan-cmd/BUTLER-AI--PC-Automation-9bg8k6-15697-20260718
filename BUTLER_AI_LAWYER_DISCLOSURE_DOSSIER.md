# Butler AI: Lawyer-Ready Invention Disclosure & Proprietary Sequence Dossier

**Author / Inventor**: Butler AI Architecture Team (Canonical Build v26.0)  
**Document Classification**: Confidential — Prepared for IP Counsel and Legal Licensing Review  
**Date**: August 19, 2026  

---

## 1. Executive Summary & Purpose

This dossier formalizes the core technical sequences and architectural mechanisms of **Butler AI (Singular Canonical Server Edition v26.0)** for review by intellectual property counsel. It outlines the specific technical architecture, state machines, cryptographic handshakes, and invariant safety policies designed to establish proprietary trade-secret value and potential patentability for local-first, self-evolving PC automation.

*Disclaimer: This document constitutes technical specification and prior-art positioning. It does not constitute formal legal advice or guarantee patentability or trade-secret validity without independent review by qualified IP counsel.*

---

## 2. Core Inventive Sequences & Proprietary Mechanisms

### Mechanism A: One-Time Console QR Bootstrap & Permanent Pairing Lock
* **Technical Problem**: In local-first PC automation apps, exposing an unauthenticated API endpoint on a local network creates severe man-in-the-middle or unauthorized client-hijacking vulnerabilities if multiple devices can register.
* **Inventive Sequence**:
  1. Upon initialization in a local console process, the Python daemon generates a cryptographically secure 128-bit `bootstrap_token` and binds a single-use pairing state (`PAIRING_STATE`).
  2. The server renders an ASCII QR code directly to the console terminal containing the local IP, port, and bootstrap token URI (`butler://pair?url=...&token=...`).
  3. When the mobile client scans and posts to `/api/pair/verify`, the server verifies the token against a constant-time comparison (`secrets.compare_digest`).
  4. **Immediate Hardware/Session Lockdown**: Upon the first successful verification, the server sets `is_paired = True` and permanently locks out all subsequent pairing or replay attempts, returning HTTP 403 `SERVER_ALREADY_PAIRED_LOCKED`.
* **Prior-Art Distinction**: Unlike standard cloud OAuth flows or persistent PIN codes that allow repeated authentication attempts, Butler’s sequence creates a zero-touch, single-use physical console trust anchor that self-seals permanently after one successful client handshake.

### Mechanism B: The 3 Unbreakable Rules & Fail-Closed Capability Orchestrator
* **Technical Problem**: Autonomous agents and AI orchestration engines often suffer from prompt injection or automated logic flaws that inadvertently disable security boundaries or drain local resources.
* **Inventive Sequence**:
  1. The **Server Capability Orchestrator (`butler_server_capabilities.py` / `butler_server.py`)** maintains a strict tier-based capability registry (`HIGH_PRIVILEGE`, `IMMUTABLE_SAFETY`, `CONTROLLED_AUTOMATION`, `CRITICAL_SAFETY`).
  2. The engine programmatically enforces **The 3 Unbreakable Rules**:
     * **Rule I**: Absolute Data Sovereignty (Local-first encrypted storage).
     * **Rule II**: Fail-Closed Privacy Circuit (Instant egress blocking on threat).
     * **Rule III**: Deterministic Resource Guard (Safety & prompt processing priority).
  3. Any autonomous instruction or mobile request attempting to execute an `IMMUTABLE_SAFETY` action (such as disabling the privacy egress circuit) is intercepted by the core state machine, resulting in an immediate `BLOCKED_BY_RULES` rejection regardless of prompt wording or AI confidence.
* **Prior-Art Distinction**: Implements hardcoded, non-bypassable runtime invariants that supersede agentic planning and LLM tool-use authorization, preventing policy drift or jailbreak override.

### Mechanism C: Dual-Memory Self-Evolving Reflexion Loop
* **Technical Problem**: Standard AI memories are static retrieval-augmented generation (RAG) databases that do not learn or adapt behavioral weights from user corrections and script execution outcomes.
* **Inventive Sequence**:
  1. The **Self-Evolving Core (`butler_self_evolving_core.py`)** maintains a local, evidence-scored preference ledger and reflexion journal.
  2. Every user correction, alternative choice, or successful script execution is ingested as a typed reinforcement signal.
  3. Behavioral weights are dynamically adjusted with bounded confidence scores, while maintaining an immutable rollback checkpoint history.
  4. Core security rules remain permanently locked as immutable invariants that self-learning can never weaken.
* **Prior-Art Distinction**: Combines local-first execution sandboxing with automated reflection scoring, allowing personalized agent evolution without cloud telemetry or external data leakage.

---

## 3. Prior-Art Positioning & Comparative Advantage

| Feature / Dimension | Standard Remote Desktop / Automation Apps | Butler AI (Singular Canonical Edition v26.0) |
| :--- | :--- | :--- |
| **Trust Anchor** | Cloud relay server, persistent account credentials, or open PIN codes. | Physical console one-time QR bootstrap with permanent single-use pairing lock. |
| **Security Architecture** | Cloud-dependent telemetry; vulnerable to credential stuffing. | Local-first AES-256-GCM vault with Fail-Closed Privacy Circuit and Emergency Panic Lockdown. |
| **Agentic Governance** | Unrestricted tool execution; vulnerable to prompt injection. | The 3 Unbreakable Rules enforced via hardcoded capability orchestration tiers. |
| **Adaptation & Learning** | Static macros or cloud-trained proprietary models. | Local evidence-scored self-evolving reflexion loop with immutable rollback checkpoints. |

---

## 4. Claims-Style Structural Outline for Legal Review

1. **A system for secure local pairing and device binding in an automation companion daemon**, comprising:
   * A terminal execution environment operative to generate a single-use cryptographic bootstrap token upon startup;
   * An ASCII-rendered console QR code encoder operative to display local connection parameters;
   * An API verification endpoint operative to validate incoming handshake requests via constant-time token comparison; and
   * A persistent locking state machine operative to permanently block all subsequent pairing requests upon the first successful client handshake.

2. **A method for enforcing immutable runtime safety invariants in an autonomous AI orchestration engine**, comprising:
   * Maintaining a capability registry defining privileged tiers including immutable safety boundaries;
   * Intercepting incoming agentic tool calls and runtime capability requests;
   * Programmatically verifying whether a requested action violates hardcoded unbreakable rules; and
   * Rejecting execution with a fail-closed status code if a violation is detected, superseding agent autonomy.

---

## 5. Conclusion & Next Steps for Licensing
* **Code Provenance**: All implementation modules (`butler_server.py`, `butler_native_desktop_ui.py`, `butler_server_capabilities.py`, `butler_self_evolving_core.py`, etc.) are 100% original, written from scratch, and free of copyrighted third-party snippets.
* **Recommended Action**: Deliver this dossier along with the canonical source ZIP (`BUTLER_AI_Ultimate_Master_Release_v26.0_SingularServer.zip`) to registered intellectual property counsel for trade-secret registration, copyright deposition, and preliminary patentability assessment.
