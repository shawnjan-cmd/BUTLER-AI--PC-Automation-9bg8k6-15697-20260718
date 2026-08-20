# Butler AI: PC Automation — Ultimate Master Architecture & Provenance Specification (v12)

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This master specification represents the definitive, fully consolidated engineering document for **Butler AI**. It merges all prior releases, security audits, memory/crawler research memos, onboarding v10 upgrades, and the newly added robot-themed automation engines into **one complete OnSpace.ai compatible package**.

Every component, route, icon, and security envelope has been rigorously audited to ensure zero missing files, 100% native React Native/Expo compliance [2] [3], and verifiable proprietary ownership.

---

## 1. Why Release File Sizes Differ

Users frequently notice that certain release ZIPs are substantially larger than others. In React Native and Expo projects, size discrepancies are explained by:
1. **Build Artifacts & Caches:** Archives containing `.expo`, `node_modules`, build cache, or precompiled binaries are naturally much larger (megabytes to gigabytes) than source-only archives.
2. **Duplicated Archives & Documentation PDFs:** Several uploads included historical backup zips, build screenshots, and multi-page PDF handoffs rather than raw source code.
3. **Curated Source Trees:** The streamlined master archives (`BUTLER_AI_Ultimate_Master_Complete_v12.zip`) contain strictly the verified Android source tree, Python server scripts, tests, and markdown specifications, ensuring lightning-fast ingestion into OnSpace.ai [1] and GitHub [4] without bloat.

---

## 2. Proprietary Flow Sequence & Security Architecture

Butler AI implements a strict, deterministic security and execution lifecycle:
1. **Encrypted Storage Envelope (`encryptedStorage.ts`):** Local keys, memory chunks, and tokens are secured via AES-256-GCM AEAD encryption with a fresh 96-bit nonce per record.
2. **Flow Ledger 5-Stage Safety Gate (`flow_ledger.py`):** Every PC automation script passes through a deterministic validation pipeline:
   $$\text{INTENT} \rightarrow \text{SAFETY PREFLIGHT} \rightarrow \text{USER APPROVAL} \rightarrow \text{EXECUTION} \rightarrow \text{CRYPTOGRAPHIC RECEIPT}$$
3. **Resilient Offline Fallbacks:** When the self-hosted Python server (`butler_server_v20_1_0_OSS.py`) is offline, telemetry components display honest unavailable states rather than fabricated mock metrics.

---

## 3. Complete Route & Component Inventory

| Surface / Route | Primary Component | Key Capabilities & Features |
| :--- | :--- | :--- |
| **Home Hub** (`app/(tabs)/home.tsx`) | `ButlerAtmosphere`, `ButlerMascotMotion`, `ButlerRobotAutomationEngine` | Connection status, mascot breathing halo, live script automation queue, and hardware telemetry. |
| **Script Library** (`app/(tabs)/scripts.tsx`) | `ResearchCrawlerCard`, `ButlerGraphVariantRenderer` | Script discovery, fuzzy search, safe dry-run execution, and 15-minute Undo receipt window. |
| **Butler AI Chat** (`app/(tabs)/butler.tsx`) | `QuickButlerBar`, `FlowLedgerCard` | Local Ollama LAN chat streaming, intent classification, and safety preflight guardrails. |
| **Knowledgebase** (`app/(tabs)/knowledge.tsx`) | `VectorTopologyGraph`, `CrawlerEpochInspector` | Provenance-aware RAG vector index growth, sitemap spidering, and Bloom filter deduplication. |
| **PC Monitor** (`app/(tabs)/monitor.tsx`) | `PerformanceMonitorWidget`, `AnimatedWire` | Real-time CPU load, memory usage, disk I/O, network latency, and OS process diagnostics. |
| **Cosmetics** (`app/(tabs)/cosmetic.tsx`) | `SkinHeaderFX`, `ThemeVariantSelector` | Accent palette switcher (Cyan, Mint, Amber, Violet) and custom visual variants. |
| **Settings** (`app/(tabs)/settings.tsx`) | `encryptedStorage`, `ServerPairingInspector` | Local AES-256 canary validation, token rotation, privacy policy, and factory reset tools. |

---

## 4. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
