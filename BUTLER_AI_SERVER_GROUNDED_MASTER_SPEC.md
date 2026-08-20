# Butler AI: PC Automation — Server-Grounded Master Specification

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This master specification establishes a direct, verifiable bridge between the **Butler AI Python desktop server (`butler_server_v20_1_0_OSS.py`)** and the native **React Native / Expo mobile client** [1] [2]. 

Every component, animation, graph telemetry curve, and security state in the mobile UI is strictly grounded in real server endpoints, events, and metrics, ensuring zero fabricated mock data and complete reliability during OnSpace.ai ingestion and device compilation [1] [2] [3].

---

## 1. Server-to-Client API Endpoint Contract

The mobile app communicates with the self-hosted Python PC server over authenticated HTTP endpoints and WebSocket telemetry streams:

| Endpoint Route | HTTP Method | Server Service / Module | Purpose & UI Telemetry Binding |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Server health check | Powers the top header pairing indicator and connection pill. |
| `/api/metrics` | `GET` | `_metrics_cached()` / `resource_hawk.py` | Feeds CPU load, RAM utilization, disk I/O, and LAN latency into live telemetry widgets. |
| `/api/pair/qr` | `POST` | `_qr()` / pairing engine | Handles 6-digit PIN and QR handshake to establish secure session tokens. |
| `/api/scripts/library` | `GET` | `scriptLibraryExtensions.py` | Supplies script discovery, categorization, search, and popularity sorting. |
| `/api/execute` | `POST` | `scriptExecutor.py` + `flow_ledger.py` | Triggers bounded script execution through the 5-stage Flow Ledger safety protocol. |
| `/api/undo` | `POST` | `receipt_recovery.py` | Manages the 15-minute Undo TTL window and script reversal logging. |
| `/api/learn/status` | `GET` | `knowledgeAccumulator.py` | Reports vector index chunk counts, episodic RAM memory, and RAG topology status. |

---

## 2. Server-Grounded UI Component & Animation Mapping

Every visual element on the mobile client is directly driven by server state:
* **Neural Pulse Barometer (Header):** Directly reflects active Ollama model token generation speed or server heartbeat intervals.
* **Flow Ledger Lifecycle Cards:** Governed by server-side capability policies (`capability_policy.py`) and preflight safety checks (`_safety_preflight`).
* **Universal Graph Renderer (`ButlerGraphVariantRenderer.tsx`):** Renders real-time telemetry from `/api/metrics`, falling back to an honest offline state when the server socket drops.
* **Custom Vector Icons (`ButlerVectorIcon`):** Pure React Native SVG glyphs representing core hexagon, forge anvil, neural chat, knowledge brain, monitor waveform, and shield badge systems without relying on external fonts.

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
