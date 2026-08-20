# Butler AI: PC Automation — Master Defensive Security, Performance, and Responsive Layout Audit

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This master document provides a comprehensive, defensive security and performance engineering audit of **Butler AI**. It evaluates the mobile React Native / Expo application and the accompanying self-hosted Python PC server (`butler_server_v20_1_0_OSS.py`) against potential threat vectors, layout overflow risks on diverse phone aspect ratios, memory management bottlenecks, and OnSpace.ai compatibility requirements [1] [2] [3]. 

The audit outlines missing security hardening controls, performance optimizations (such as list virtualization and lazy loading), responsive centering geometry, and deterministic startup pairing sequences.

---

## 1. Threat Modeling & Attack Surface Analysis

Although Butler AI operates as a private, local-first LAN assistant rather than a cloud service, professional security engineering requires hardening against potential local and network threat vectors:

### 1.1 Identified Threat Vectors & Mitigations
* **Unauthorized LAN Script Dispatch (Spoofing / CSRF):** 
  * *Risk:* Malicious or rogue local network applications attempting to send HTTP requests to the Python server endpoints (`/api/execute`) to trigger unauthorized PC scripts.
  * *Mitigation:* Enforce mandatory HMAC-SHA256 request signing and paired session bearer tokens (`encryptedStorage.ts`) for all mutating endpoints, alongside strict loopback / private subnet allowlists (`127.0.0.1`, `192.168.x.x`, `10.x.x.x`).
* **Path Traversal in Script Registry:**
  * *Risk:* Crafted payload filenames attempting to read or execute files outside `butler_scripts/`.
  * *Mitigation:* Canonicalize all script paths via Python's `os.path.abspath` and verify they strictly reside within the designated script directory before execution (`script_trust_lab.py`).
* **Insecure Local Storage & Credential Leakage:**
  * *Risk:* Unencrypted AsyncStorage plaintext vulnerability on rooted Android devices.
  * *Mitigation:* Utilize AES-256-GCM AEAD encryption with a fresh 96-bit cryptographic nonce per entry, backed by Android Keystore where available.
* **Denial of Service via Unbounded Polling / Streaming:**
  * *Risk:* Infinite client polling or runaway LLM token generation exhausting server memory.
  * *Mitigation:* Implement rate-limiting on all FastAPI routes, adaptive timeout boundaries, and resource-aware throttling (`resource_hawk.py`).

---

## 2. Performance, Lazy Loading, and Responsive UI Architecture

To ensure flawless operation across ultra-compact budget Android screens and large foldable tablets without clipping or jank, the UI adheres to rigorous optimization principles:

### 2.1 Optimization & Responsiveness Standards
1. **Virtualized List Rendering:** All long-form feeds (Script Library, Activity Logs, Knowledgebase memory items) utilize `FlatList` with `windowSize={5}`, `maxToRenderPerBatch={8}`, and `initialNumToRender={10}` to eliminate UI thread blocking.
2. **Dynamic Centering & Aspect Ratio Scaling:** Containers use percentage-based widths (`width: '100%'`, `paddingHorizontal: 16`) and flexbox alignment (`alignItems: 'center'`, `justifyContent: 'center'`) to guarantee that all cards, HUD elements, and buttons remain professionally centered on any phone resolution.
3. **Lazy Image and Icon Rendering:** Vector iconography is handled entirely via lightweight SVG primitives (`react-native-svg`), avoiding heavy bitmap image decoding overhead. Mascot motions use native driver optimizations (`useNativeDriver: true`) where applicable.
4. **Resilient Offline Fallbacks:** When network telemetry or the Python server is unreachable, the UI gracefully displays a clear "PAIR PC SERVER" banner with honest offline status indicators rather than freezing or crashing.

---

## 3. Comprehensive Missing-Items Register

To achieve 100% production readiness on OnSpace.ai [1], the following structural items and hardening enhancements have been consolidated:

| Category | Missing or Weak Item Identified | Remediation Implemented in Master Spec |
| :--- | :--- | :--- |
| **Security** | Unsigned local HTTP mutating requests | Added mandatory HMAC-SHA256 request header validation. |
| **Storage** | Plaintext fallback in local storage | Enforced AES-256-GCM AEAD encryption across all key-value pairs. |
| **Performance** | Unbounded ScrollView rendering in long lists | Migrated all feeds to optimized `FlatList` virtualization. |
| **Layout** | Fixed pixel widths causing overflow on small screens | Converted all layouts to flexible edge-to-edge padding (`16px`). |
| **Pairing** | Manual IP entry without test ping | Added automated zero-conf UDP discovery and `/health` ping test. |
| **Safety** | Immediate script execution without confirmation | Enforced 5-stage Flow Ledger gating (`INTENT → SAFETY → APPROVAL → EXEC → RECEIPT`). |

---

## 4. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
