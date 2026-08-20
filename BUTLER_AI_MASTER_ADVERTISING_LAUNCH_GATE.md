# Butler AI: PC Automation — Master Pre-Advertising Launch Gate & Risk Register

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

Before committing significant capital to user acquisition or advertising campaigns for **Butler AI**, engineering leadership and product stakeholders must enforce a rigorous, persistent launch gate. 

This document establishes the master verification ledger, risk register, and advertising stop conditions. It ensures that product behavior, cryptographic storage security, FastAPI server reliability, Flow Ledger safety gating, and Google Play compliance are fully verified—protecting user trust and preventing premature marketing spend.

---

## 1. Pre-Advertising Master Checklist & Evidence Ledger

| Category | Requirement / Milestone | Status | Verification Evidence & Action Plan |
| :--- | :--- | :--- | :--- |
| **App Build & Scaffolding** | Native React Native / Expo SDK 54 build configuration [3] | **VERIFIED** | Zero web-DOM dependencies; clean Expo Router v6 layout across 7 core tabs. |
| **Server Bridge** | Self-hosted Python FastAPI PC server (`butler_server_v20_1_0_OSS.py`) | **VERIFIED** | Fully operational with `/health` pings, metrics streaming, and start scripts. |
| **Security & Privacy** | AES-256-GCM AEAD encrypted local superbrain storage | **VERIFIED** | Enforced across all stored tokens and pairing records (`encryptedStorage.ts`). |
| **Safety Gating** | Deterministic 5-stage Flow Ledger execution protocol | **VERIFIED** | Preflight validation preventing unverified script dispatch (`INTENT → SAFETY → APPROVAL → EXEC → RECEIPT`). |
| **Store Readiness** | Privacy Policy & Data Safety declarations for Google Play [5] | **VERIFIED** | Local-first data architecture documented; zero external telemetry egress. |
| **Real-Device Testing** | Physical Android APK installation and end-to-end pairing test | **PENDING** | **ADVERTISING BLOCKER:** Must export APK via OnSpace [1] [5], install via ADB, and test physical LAN pairing. |

---

## 2. Advertising Stop Conditions (Do Not Advertise If...)

1. **Unverified Pairing:** Users cannot successfully pair the mobile app to their self-hosted PC server on a standard home Wi-Fi network.
2. **Unhandled Network Failures:** The app crashes or freezes when the Python server is offline instead of displaying a clean recovery banner.
3. **Store Policy Mismatch:** Google Play rejects the app build due to undeclared foreground service permissions or unencrypted local data storage.

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
