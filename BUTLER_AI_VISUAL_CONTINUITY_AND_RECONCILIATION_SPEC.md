# Butler AI: PC Automation — Visual Continuity & Reconciliation Specification

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This document details the reconciliation between the recently supplied `MISSING_FROM_MASTER_V10.zip` archive and the canonical **Butler AI** React Native / Expo codebase. It preserves all established page locations and names (`home.tsx`, `scripts.tsx`, `butler.tsx`, `knowledge.tsx`, `monitor.tsx`, `cosmetic.tsx`, `settings.tsx`), standardizes the robot mascot motion and AI chat surfaces into a cohesive cyberpunk HUD system, and establishes superior graph renderers, fallback contracts, and navigation transitions.

---

## 1. Page Map & Route Continuity

To ensure zero friction when upgrading your workspace, all canonical page names and tab locations have been strictly maintained:

| Tab Index | Route File Path | Surface Name | Purpose & Reconciled Enhancements |
| :--- | :--- | :--- | :--- |
| **0** | `app/(tabs)/home.tsx` | **Core Hub (Dashboard)** | Central connection status, breathing mascot halo, hardware telemetry gauges, and quick automation dispatches. |
| **1** | `app/(tabs)/scripts.tsx` | **Script Library** | Discovers, searches, rehearses, approves, and runs Python automation pipelines with a 15-minute Undo receipt window. |
| **2** | `app/(tabs)/butler.tsx` | **Butler AI Chat** | Self-hosted local Ollama chat streaming, prompt suggestions, and Flow Ledger safety preflight validation. |
| **3** | `app/(tabs)/knowledge.tsx` | **Knowledge Base** | Provenance-aware RAG vector index growth, sitemap spidering, and memory topology graphs. |
| **4** | `app/(tabs)/monitor.tsx` | **PC Monitor** | Real-time CPU load, memory utilization, disk I/O, network latency, and OS process diagnostics. |
| **5** | `app/(tabs)/cosmetic.tsx` | **Cosmetics / Skin** | Theme variant selector, accent palette swatches (Cyan, Mint, Amber, Violet), and HUD glitch toggles. |
| **6** | `app/(tabs)/settings.tsx` | **Settings & Vault** | Local AES-256-GCM AEAD encrypted storage canary, pairing key rotation, and privacy policy disclosures. |

---

## 2. Graph System Improvements: Current vs. Reconciled

| Graph Family | Standard Rendering | Reconciled Butler Implementation | Improvement & Rationale |
| :--- | :--- | :--- | :--- |
| **Line & Area Charts** | Static SVG lines | Glowing area paths with live pulsing end-markers | Delivers high-end cyberpunk telemetry aesthetics without lagging the UI thread. |
| **Radial Gauges** | Simple circles | Dual-ring arc gauges with percentage thresholds | Instantly conveys CPU/RAM saturation levels with color-coded safety cues. |
| **Node-Link Networks** | Hardcoded nodes | Dynamic SIGMA-NET crawler node progression | Visually demonstrates local RAG discovery paths with tap-to-inspect interactivity. |
| **Terminal Logs** | Plain text views | Monospaced auto-scrolling execution audit trails | Shows real-time server command receipts, safety preflights, and SHA-256 hashes. |

---

## 3. Mascot, Fallback, and Animation Upgrades

1. **Unified Robot Mascot (`ButlerMascotMotion.tsx`)**: Reconciles asset references across all releases, providing smooth native breathing and swaying animations (`Animated.Value`, `Animated.loop`) without relying on heavy Lottie or DOM runtimes [6].
2. **Resilient Offline Fallbacks**: Every network-dependent widget (Telemetry, Crawler, Chat) gracefully detects offline status (`/health` unreachable) and displays a clear recovery prompt rather than freezing or crashing.
3. **Optimized Transitions & Interactivity**: Pressable elements feature immediate visual feedback (opacity and scale transitions) and haptic triggers (`expo-haptics`) where supported, ensuring a responsive native feel [3].

---

## 4. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
- [6] Software Mansion. *React Native Reanimated Repository & License*. Available online: [https://github.com/software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated).
