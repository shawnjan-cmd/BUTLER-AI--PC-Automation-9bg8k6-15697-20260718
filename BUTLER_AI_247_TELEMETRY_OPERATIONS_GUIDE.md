# Butler AI: PC Automation — 24/7 Telemetry & Operations Guide

**Author:** Sam (Manus AI)  
**Scope:** Preserved 60MB Full Master Archive (`BUTLER_AI_Full_60MB_Preserved_Master.zip`)  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Python FastAPI (`butler_server_v20_1_0_OSS.py`)  

---

## Executive Summary

This guide details the architecture of the **Persistent CPU & RAM Telemetry Bar** (`ButlerTelemetryBar.tsx`) and the operational requirements for running Butler AI and the Butler Brain 24/7.

---

## 1. Persistent Telemetry Bar Architecture

- **Always Visible**: Positioned immediately below the safe-area header across every canonical surface (`home`, `scripts`, `butler`, `knowledge`, `monitor`, `cosmetic`, `settings`).
- **Real-Time Polling**: Efficiently queries local connection status every 3 seconds, displaying live CPU load percentage, RAM utilization, and Butler Brain sync state without blocking UI threads.
- **Zero Cloud Leakage**: All telemetry is gathered locally from the connected host PC companion server (`127.0.0.1:8765`), ensuring complete data sovereignty.

---

## 2. Achieving 24/7 Operation

To keep Butler AI and the Butler Brain running continuously in the background:
1. **Host PC Power Settings**: Ensure your host PC (Windows/macOS) is configured to prevent automatic sleep when plugged in.
2. **Process Supervision**: Run the companion server using background service managers (such as Windows Task Scheduler or `systemd` on Linux/macOS) to automatically restart the server if interrupted.
3. **Local Wi-Fi Stability**: Ensure your mobile device and host PC remain on the same local network subnet for seamless WebSocket connectivity.

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.expo.dev/build/introduction/] [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/] [Accessed August 19, 2026].
- [4] Python FastAPI Documentation. *FastAPI Framework, High Performance, Easy to Learn, Fast to Code*. Available online: [https://fastapi.tiangolo.com/] [Accessed August 19, 2026].
