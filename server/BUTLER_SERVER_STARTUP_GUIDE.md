# Butler AI: PC Automation — Server Startup & Privacy Guide

**Author:** Manus AI  
**Scope:** Preserved 60MB Full Master Archive (`BUTLER_AI_Full_60MB_Preserved_Master.zip`)  
**Compatibility:** Python 3.9+, FastAPI, Windows, macOS, Linux  

---

## Executive Summary

This guide explains how to start the updated **Butler AI Companion Server** (`butler_server_starter.py`) on your host PC (Windows, macOS, or Linux). Designed around a privacy-first, zero-cloud architecture, the server binds strictly to your local machine (`127.0.0.1`) or secure LAN network, ensuring your data never leaves your personal hardware.

---

## 1. Quick Start Instructions

1. **Prerequisites**: Ensure Python 3.9 or higher is installed on your PC, along with FastAPI and Uvicorn (`pip install fastapi uvicorn`).
2. **Launch the Server**:
   - **Windows**: Double-click `start_server.bat` or run `python butler_server_starter.py` in your terminal.
   - **macOS / Linux**: Run `./start_server.sh` or `python3 butler_server_starter.py` in your terminal.
3. **Cyberpunk Boot Sequence**: Enjoy the cinematic, color-coded startup animation with real-time preflight checks and port availability verification.
4. **Pair with Mobile App**: Open the Butler AI app on your phone, navigate to the Home or Settings tab, and tap **PAIR PC** to connect over your local network.

---

## 2. Security & Privacy Guarantees

- **Zero Cloud Egress**: The server makes zero outbound telemetry requests. All operations remain strictly local.
- **AES-256-GCM Encryption**: All communications and local vaults are protected by authenticated encryption with associated data.
- **Flow Ledger Safety**: Every automated script execution requires explicit approval stages (`INTENT` → `SAFETY PREFLIGHT` → `USER APPROVAL` → `EXECUTION` → `CRYPTOGRAPHIC RECEIPT`).

---

## 3. References

- [1] Python FastAPI Documentation. *FastAPI Framework, High Performance, Easy to Learn, Fast to Code*. Available online: [https://fastapi.tiangolo.com/] [Accessed August 19, 2026].
- [2] Uvicorn Documentation. *An ASGI web server for Python*. Available online: [https://www.uvicorn.org/] [Accessed August 19, 2026].
- [3] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [4] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/] [Accessed August 19, 2026].
