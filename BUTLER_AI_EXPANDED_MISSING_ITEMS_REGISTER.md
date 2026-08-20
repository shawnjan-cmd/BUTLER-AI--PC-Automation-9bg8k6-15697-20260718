# Butler AI: PC Automation — Expanded Missing-Items Register & Multi-Pass Audit

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This document establishes the definitive, multi-pass engineering audit for **Butler AI**. It combines repository inventory analysis, dependency inspection, threat modeling, performance profiling, responsive layout checks, accessibility standards, and Google Play compliance evaluations into an exhaustive missing-items register. 

Every identified gap includes a verifiable severity rating, architectural evidence, concrete remediation code patterns, and verification criteria to ensure 100% OnSpace.ai compatibility [1] [2] [3].

---

## 1. Multi-Pass Audit Methodology

The audit evaluates the application across eight distinct inspection passes:
1. **Source Integrity & Dependency Pass:** Verifies lockfile stability, native module mappings, and Expo SDK 54 alignment [3].
2. **Security & Cryptographic Pass:** Audits AES-256-GCM storage (`encryptedStorage.ts`), HMAC request signing, and path canonicalization.
3. **Server & API Contract Pass:** Audits FastAPI endpoints in `butler_server_v20_1_0_OSS.py` for rate limiting, CORS posture, and health checks.
4. **Performance & Memory Pass:** Audits list virtualization (`FlatList`), memoization (`useMemo`, `memo`), and animation cleanup.
5. **Responsive Layout & Geometry Pass:** Audits edge-to-edge padding (`16px`), dynamic centering, and flexbox scaling across diverse phone resolutions.
6. **Accessibility Pass:** Verifies screen-reader labels (`accessibilityLabel`), touch target minimums (`44px`), and dynamic type support.
7. **Privacy & Data Safety Pass:** Audits local-first data flows, zero external egress, and the 5-stage Flow Ledger safety gate.
8. **Release Readiness Pass:** Evaluates APK/AAB build configuration in `app.json` and `eas.json` for OnSpace export [1] [5].

---

## 2. Exhaustive Missing-Items Register & Remediation Matrix

| ID | Category | Subsystem | Severity | Description of Missing / Weak Item | Evidence & Impact | Remediation & Implementation Pattern |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M-01** | Security | Server HTTP | **HIGH** | Unsigned mutating POST requests to `/api/execute`. | Rogue LAN apps could invoke PC automation scripts without authorization. | Implement mandatory HMAC-SHA256 headers (`X-Butler-Signature`) verified against the paired session token. |
| **M-02** | Security | Storage | **HIGH** | Potential plaintext fallback if keystore is unavailable. | Rooted Android inspection could expose stored pairing keys. | Enforce strict AES-256-GCM AEAD encryption with a fresh 96-bit nonce; fail closed if unavailable. |
| **M-03** | Performance | Script Lists | **MEDIUM** | Possible use of ScrollView with `.map()` in long-form lists. | UI thread blocking and frame drops on budget Android hardware. | Mandate optimized `FlatList` with `windowSize={5}` and `maxToRenderPerBatch={8}`. |
| **M-04** | Layout | Screen Headers | **MEDIUM** | Fixed pixel margins causing clipping on ultra-wide screens. | Awkward left/right text cutoff on foldable displays. | Convert all card containers to flexible edge-to-edge padding (`16px`) and center alignment. |
| **M-05** | Reliability | Server Pairing | **MEDIUM** | Manual IP entry without automated zero-conf ping. | Users get stuck when typing incorrect LAN addresses. | Add automated UDP broadcast discovery and `/health` ping validation before saving. |
| **M-06** | Safety | Script Execution | **HIGH** | Missing preview before destructive batch shell commands. | Accidental file deletion or service restarts without warning. | Enforce the 5-stage Flow Ledger gating protocol (`INTENT → SAFETY → APPROVAL → EXEC → RECEIPT`). |
| **M-07** | Accessibility | Touch Targets | **LOW** | Minor icon buttons below 44x44px minimum touch area. | Difficult tapping for users with motor accessibility needs. | Wrap small interactive controls in padded containers ensuring ≥44px touch bounding boxes. |
| **M-08** | Release | Build Config | **HIGH** | Unverified package name or permissions in `app.json`. | Potential Google Play rejection or OnSpace build failure. | Align `app.json` package identifiers with verified Expo SDK 54 standards [3]. |

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
