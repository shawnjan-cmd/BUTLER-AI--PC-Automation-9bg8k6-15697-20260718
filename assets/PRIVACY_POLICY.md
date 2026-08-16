# Butler AI: PC Automation — Privacy Policy

**App Name:** Butler AI: PC Automation
**Developer:** Andrej Sladkovic
**Contact:** andrejsladkovic1992@gmail.com
**App Version:** 6.0
**Last Updated:** May 18, 2026
**Effective Date:** May 18, 2026

> **Privacy Policy URL (use this in Play Console):**
> `https://shawnjan-cmd.github.io/privacy-policy-/`

---

## 1. Overview

Butler AI: PC Automation (v6.0), also referred to as "Butler AI Command Center" or "CommandCube", is a **local-network, self-hosted** PC automation app. It connects your Android device to a Python server (`butler_server.py`) running on your own PC over your home or office Wi-Fi network.

**Our privacy philosophy is simple: Your data is your own.** The App is built on a local-first, privacy-centric architecture.

**The developer does not operate a cloud collection service for Butler data.** The app can transmit user-entered chat, selected commands, pairing identifiers, and—if the optional voice lane is enabled—short user-recorded audio to the user's paired PC. User-configured remote transport may leave the local network. Review the actual release configuration before relying on this statement.

---

## 2. Information We Do NOT Collect

We do not operate remote servers to collect your data. Specifically, we do not collect, store, or transmit:

- Personal Identifiable Information (PII) such as names, emails, or phone numbers
- Device identifiers, IP addresses, or location data sent to our servers
- Usage analytics, crash logs, or telemetry data
- Chat histories or command logs

## 3. Device Permissions and Usage

All data processed via these permissions remains strictly local to your device.

- **Camera Permission:** Used solely for scanning QR codes to pair your mobile device with your local desktop server. The camera feed is processed locally and discarded immediately. No images or videos are captured, stored, or transmitted.
- **Local Network (LAN) Access:** The App communicates directly over your Local Area Network to interface with your own PC (to fetch system vitals, execute scripts, and send commands). This traffic is routed directly between your mobile device and your computer — it never passes through our servers.
- **Local Storage:** The App uses your device's secure local storage to save user preferences, scripts, and pairing configurations (such as your local IP and port). This data never leaves your device and is permanently deleted if you uninstall the App.

## 4. Data We Collect

### 4.1 Data processed by Butler AI

Butler processes data locally on the Android device and/or the user's paired PC. The exact data flow depends on the features the user enables and the final release configuration.

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| Name or identity | ❌ No | Never requested |
| Email address | ❌ No | No account required |
| Phone number | ❌ No | Never requested |
| Location (GPS) | ❌ No | Not accessed |
| Contacts | ❌ No | Not accessed |
| Camera | ⚠️ QR only | Only for QR code scanning to pair with your PC. Images processed locally, never stored or transmitted. |
| Microphone | ⚠️ Optional | Used only for visible, user-started voice capture if the voice lane is enabled; raw audio is intended to be ephemeral. |
| Files / Storage | ❌ No | App reads no external files |
| Device identifiers | ⚠️ Local only | A random UUID is generated on first launch, stored locally, sent only to your own PC server on your local network. |
| Usage analytics | ❌ No | No analytics SDK included |
| Crash reports | ❌ No | No crash reporting SDK included |
| Payment info | ❌ No | App is free, no purchases |

### 4.2 Data Stored Locally on Your Device

The following data is stored in your device's private `AsyncStorage` (never accessible to other apps or any server):

- **Server IP / Port** — IP address of your PC server on your local network
- **Session Token** — Cryptographic bearer token for authenticating with your PC server
- **Device ID** — Random UUID string for device-lock pairing with your PC
- **Knowledge Base** — Python automation knowledge you crawl or manually enter (your data, stored locally)
- **Script Library** — Python scripts you create or import (your data, stored locally)
- **Chat History** — Butler AI conversation history (your data, stored locally)
- **Settings** — App configuration preferences

**Android-private local data is normally removed when the app is uninstalled, subject to Android backup and device behavior.** The paired PC may retain server-side records, scripts, receipts, or logs according to its own configuration; use the server's deletion controls as well. Butler does not intentionally send data to a developer-operated analytics or AI cloud in the local-only build, but a user-configured remote transport can change the network path.

---

## 5. Data Sharing

### Developer-operated third-party sharing

The local-only build does not intentionally send Butler content to developer-operated analytics, advertising, or cloud-AI services. The user's paired PC is a separate endpoint controlled by the user. A user-configured remote transport, external crawler source, or third-party integration can create additional recipients and must be disclosed and reviewed separately.

| Recipient | Data Shared | Purpose |
|-----------|-------------|---------|
| Third-party analytics | ❌ None | N/A |
| Advertising networks | ❌ None | N/A |
| Data brokers | ❌ None | N/A |
| Developer-operated cloud databases | ❌ None in local-only build | N/A |
| User's paired PC server | Chat, commands, pairing data, and optional voice payloads as enabled | Butler functionality |
| User-configured remote endpoint | Data selected by the user | Remote connectivity; review endpoint trust and transport |

The only "server" Butler AI communicates with is `butler_server.py` running on your own personal computer. You control this server entirely. No data passes through any infrastructure we own or operate.

---

## 6. Optional Third-Party Services

### 6.1 Local Ollama AI (Default — Fully Private)

By default, Butler AI uses a local Ollama AI model running on your own PC. No data leaves your network.

- **What is sent:** Your chat message is sent over your local WiFi to your own PC server
- **What is NOT sent:** Nothing goes to any external server
- **Privacy:** Completely private — all processing on your hardware

### 6.2 Local Ollama on the user's paired PC

The supported AI provider is local Ollama running on the user's paired PC. Chat text and the context selected by the app may be sent to that PC for response generation. No developer-operated cloud AI provider is enabled by the local-only architecture. Users remain responsible for securing their PC, Ollama service, network, firewall, and any remote access configuration.

---

## 7. Security Practices

### 7.1 Network Security
- All communication between the app and your PC occurs on your **local network only** (LAN — 192.168.x.x, 10.x.x.x)
- Authentication uses **64-character cryptographic Bearer tokens** generated with `secrets.token_urlsafe(64)`
- Token comparison uses **constant-time comparison** (`secrets.compare_digest`) to prevent timing attacks
- **Transport security depends on configuration:** authenticated LAN transport, TLS where configured, and additional protection for remote connections. Do not treat a self-signed certificate or bearer token alone as proof of secure internet exposure.
- The PC server implements **rate limiting** (60 requests/IP/minute) to prevent abuse
- **Single-device lock**: the PC server can restrict pairing to one device at a time; verify the active server configuration before relying on this control

### 7.2 Script Execution Safety
- All Python scripts are scanned for dangerous patterns before execution
- **Banned patterns:** `os.system`, `eval`, `exec`, `shell=True`, reading `/etc` paths
- Scripts run with a **30-second timeout** and a **64KB size limit**
- Scripts run as the user who launched `butler_server.py` — with the same permissions they already have

### 7.3 Data Protection
- All local data is stored in Android's private `AsyncStorage` — inaccessible to other apps
- No data is encrypted at rest beyond Android's standard storage encryption
- No backups of app data are created to external services
- Android-private app data is intended to be removed on uninstall; paired-PC data and user-created backups require separate deletion

---

## 8. Permissions Used

| Permission | Why It Is Used |
|-----------|---------------|
| `CAMERA` | Scanning QR codes displayed by `butler_server.py` on your PC to pair. The camera is only activated when you tap "SCAN QR CODE". No images are stored. |
| `INTERNET` | Communicating with the paired PC, local Ollama, or a user-configured remote endpoint. |

**No other permissions are requested.**

Butler AI does NOT use:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `READ_CONTACTS` / `WRITE_CONTACTS`
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
- `READ_PHONE_STATE`
- `RECORD_AUDIO` unless the optional voice lane is included in the final build
- Any hidden or continuous background microphone capture
- Any background location or activity recognition permissions

---

## 9. Children's Privacy

Butler AI is not directed at children under 18 years of age. This App is a developer tool intended for adults only. We do not knowingly collect any personal information from minors. If you believe a child under 18 has used the app, please contact us at andrejsladkovic1992@gmail.com — there is no personal data to delete as none is collected, but we will confirm this promptly.

---

## 10. Data Retention and Deletion

| Data | Retention | Deletion |
|------|----------|---------|
| Local KB / Scripts / Settings | Until you clear the app or uninstall | Clear via Settings → Clear Knowledge Base, or uninstall app |
| Chat History | Until you tap "Clear Chat" | Tap Clear Chat in Butler AI tab |
| Session Token | Until you disconnect or server resets | Tap DISCONNECT in Connect tab |
| Paired-PC request, receipt, script, and optional voice data | Depends on server configuration and retention policy | Use the paired server's deletion controls and clear encrypted receipts/audio according to policy |

**To delete all your data:** Uninstall Butler AI: PC Automation from your device. All `AsyncStorage` data is deleted automatically by Android.

---

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date above. Continued use of the app after changes constitutes acceptance of the updated policy.

---

## 12. Contact

If you have questions about this Privacy Policy, please contact:

**Developer:** Andrej Sladkovic
**Email:** andrejsladkovic1992@gmail.com
**GitHub:** https://github.com/shawnjan-cmd/butler-ai

---

## 13. Google Play Data Safety Summary

| Question | Answer |
|---------|--------|
| Does the app process or share user data? | Yes, only as required for user-enabled local PC, chat, pairing, script, and optional voice functionality |
| Is data encrypted in transit? | Depends on the final LAN/remote transport configuration; verify before release |
| Is deletion available? | Android-local deletion plus paired-PC/server deletion controls; uninstall alone does not guarantee deletion of PC-side data |
| Does the developer operate cloud AI or analytics for the local-only build? | No |

---

*This privacy policy was last reviewed for compliance with Google Play Developer Programme Policies, GDPR, CCPA, and COPPA on May 18, 2026. App Version: 7.1.0. Target audience: 18+ only.*
