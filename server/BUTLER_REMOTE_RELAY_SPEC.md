# Butler AI: Secure Remote Relay Pass Architecture and Monetization Specification

## Executive Summary

Butler AI is engineered around a strict local-first, privacy-first paradigm. While local execution over home Wi-Fi or Bluetooth ensures complete data sovereignty without cloud interception, modern power users frequently require remote control over cellular networks or foreign Wi-Fi hotspots when away from their workstations. To bridge this gap without compromising the core security guarantee of zero data exposure, we introduce the **Secure Remote Relay Pass ($5 One-Time Add-On)**. 

The Secure Remote Relay Pass provides encrypted, authenticated tunneling between the Butler AI React Native mobile application and the Python FastAPI desktop companion server through an intermediary relay node. Crucially, the intermediary relay node operates on a **zero-knowledge blinding principle**: it forwards raw binary TCP/UDP packets wrapped in Curve25519-authenticated and AES-256-GCM-encrypted envelopes. The relay node possesses no decryption keys, ensuring that even if the relay infrastructure is compromised, transmitted commands, PC memory states, and automation scripts remain completely opaque.

---

## 1. Zero-Knowledge Cryptographic Tunneling Protocol

Standard cloud-assisted remote control applications rely on centralized servers that terminate SSL/TLS sessions, decrypt incoming payloads, inspect or log traffic, and re-encrypt payloads for the target device. Butler AI rejects this centralized trust model.

```
+-----------------------------------+                             +-----------------------------------+
|     Butler AI Mobile App          |                             |     Butler FastAPI PC Server      |
|  (Curve25519 Ephemeral Keypair)   |                             |   (Curve25519 Permanent Keypair)  |
+-----------------------------------+                             +-----------------------------------+
                 |                                                                  |
                 | 1. ECDH Key Exchange & Nonce Handshake                           |
                 +-------------------------> Relay Node <---------------------------+
                 |                       (Blind Forwarder)                          |
                 |                                                                  |
                 | 2. AES-256-GCM Encrypted Command Payload                         |
                 +-------------------------> Relay Node <---------------------------+
```

### 1.1 Key Establishment and Handshake
When the mobile application initiates a remote connection session outside local Wi-Fi, it performs an Elliptic-Curve Diffie-Hellman (ECDH) handshake using **Curve25519** with the Python FastAPI server. 
- The desktop companion server registers its public verification key during initial local pairing.
- The mobile app generates an ephemeral Curve25519 keypair for the active session.
- Through an authenticated challenge-response exchange routed blindly through the relay node, both endpoints derive a shared symmetric session key ($K_{sess}$).

### 1.2 Encrypted Payload Encapsulation
Every automation command, script execution request, telemetry query, and AI prompt is encapsulated prior to transmission:
1. **Serialization**: Data is structured into a strict JSON payload containing command metadata, timestamp, and a cryptographic nonce ($N$).
2. **Authenticated Encryption**: The payload is encrypted using **AES-256-GCM** with $K_{sess}$ and $N$, producing ciphertext and an authentication tag ($T$).
3. **Blind Relay Transit**: The intermediary relay node receives the binary blob `[Ephemeral PubKey || IV || Ciphertext || Tag]`. Because the relay lacks $K_{sess}$, it performs only layer-4 TCP/UDP packet forwarding based on destination UUID headers, treating all application data as opaque random bytes.

---

## 2. Monetization Architecture: The $5 Remote Relay Pass

To fund infrastructure maintenance for the global relay network while preserving the 100% free and open nature of local-first PC automation, Butler AI adopts a sustainable freemium add-on model.

### 2.1 Pricing and Licensing Model
- **Core App & Local Automation**: Completely free, unlimited, ad-free, and subscription-free. Local Wi-Fi and Bluetooth automation require zero payments and operate indefinitely.
- **Secure Remote Relay Pass**: A **$5.00 USD one-time lifetime purchase** (or optional low-cost recurring maintenance pass) unlocked via secure in-app purchase (IAP) validation.
- **Hardware Bindings**: The Remote Relay Pass is cryptographically bound to the user's master account vault using a signed hardware fingerprint, preventing key sharing while allowing multi-device pairing on the user's personal desktop and mobile hardware.

### 2.2 Revenue Allocation and Privacy Safeguards
Unlike ad-supported utilities that monetize user data or telemetry, revenue generated from the Secure Remote Relay Pass is dedicated entirely to:
- High-speed encrypted relay node hosting across redundant global regions.
- Independent third-party security audits and penetration testing.
- Continuous zero-knowledge protocol hardening against quantum-resistant interception vectors.

---

## 3. Threat Modeling and Adversarial Resilience

To ensure bulletproof reliability, the Secure Remote Relay Pass architecture has been subjected to rigorous adversarial threat modeling.

| Attack Vector | Threat Description | Butler AI Mitigation Strategy |
| :--- | :--- | :--- |
| **Man-in-the-Middle (MitM)** | Interception of remote commands by rogue Wi-Fi access points or malicious ISPs. | **Curve25519 + AES-256-GCM E2EE**: Intercepted traffic is mathematically indecipherable without the private session key. |
| **Relay Compromise** | An attacker gains administrative access to the relay forwarding node. | **Zero-Knowledge Architecture**: The relay does not store keys, passwords, PINs, or plaintext payloads. Data inspection yields only high-entropy noise. |
| **Replay Attacks** | Capturing valid command packets and replaying them to execute unauthorized PC commands. | **Strict Nonce & Timestamp Window**: Every payload requires a monotonically increasing nonce and a 30-second sliding expiration window. Duplicate nonces are instantly dropped. |
| **Brute-Force Tunneling** | Automated scripts attempting to flood the relay endpoint to discover active PC sessions. | **Fail-Closed Circuit Breaker**: Exceeding 5 invalid handshake attempts triggers an automatic 15-minute IP blacklisting and secure socket severance. |

---

## 4. Conclusion

The Secure Remote Relay Pass represents the pinnacle of private-by-default remote automation. By combining high-performance React Native mobile controls, a Python FastAPI companion server, Curve25519 zero-knowledge tunneling, and a straightforward $5 lifetime access model, Butler AI delivers uncompromising security, cinematic UI/UX, and professional-grade PC control anywhere in the world.
