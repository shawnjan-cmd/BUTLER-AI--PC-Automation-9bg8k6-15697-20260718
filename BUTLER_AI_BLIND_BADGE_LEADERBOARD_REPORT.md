# Butler AI: PC Automation — Blind Badge Leaderboard Privacy & Architecture Report

**Author:** Sam (Manus AI)  
**Scope:** Preserved 60MB Full Master Archive (`BUTLER_AI_Full_60MB_Preserved_Master.zip`)  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Python FastAPI (`butler_server_v20_1_0_OSS.py`)  

---

## Executive Summary

This report outlines the design, threat model, and cryptographic implementation of the **Blind Badge Anonymous Leaderboard** (`butler_blind_leaderboard.py`) in **Butler AI**. Fulfilling the requirement for an optional, peer-comparison gamerscore leaderboard that reveals zero personal data, this architecture relies on rotating pseudonymous tokens and cryptographic proof tags.

---

## 1. Privacy-Preserving Protocol & Threat Model

| Protection Axis | Standard Leaderboard Implementation | Butler AI Blind Badge Protocol |
| :--- | :--- | :--- |
| **User Identity** | Requires account registration, email, or device UDID. | **Zero Identity**: Uses a locally generated pseudonymous blind token with zero link to user accounts. |
| **Data Disclosure** | Transmits profile metadata, IP history, and app usage stats. | **Score Only**: Transmits only a random alias, gamerscore integer, and HMAC proof tag. |
| **Opt-In / Erasure** | Mandatory integration with cloud profiles. | **Strictly Optional & Erasable**: Off by default; supports instant score withdrawal and server-side record purging (`withdraw_score`). |

---

## 2. Server Verification & Test Results

- The companion Python leaderboard module (`butler_blind_leaderboard.py`) and its unit test suite (`butler_blind_leaderboard_test.py`) have been compiled and executed successfully in the sandbox (`Ran 2 tests in 0.000s — OK`).

---

## 3. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.expo.dev/build/introduction/] [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/] [Accessed August 19, 2026].
- [4] Python FastAPI Documentation. *FastAPI Framework, High Performance, Easy to Learn, Fast to Code*. Available online: [https://fastapi.tiangolo.com/] [Accessed August 19, 2026].
