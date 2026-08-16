# Butler AI Security and Encryption Audit

## Scope

This audit covers the native Expo/React Native client and the supplied Python PC bridge as packaged in this handoff. It is a source review plus automated validation; it is not a penetration test, formal cryptographic review, or Play Store approval.

## Verified protected native data

The encrypted-storage classifier now covers session tokens, device identity, server IP and port, app signature, transport scheme, known-good topology, script library/cache data, personal facts, events, crawl history, source-cache prefixes, session records, and server-token cleanup keys. Personal memory and source-cache operations were moved from direct AsyncStorage access to the encrypted wrapper. Sensitive writes fail closed if key derivation or the secure storage dependency is unavailable instead of silently writing plaintext.

Legacy plaintext values can still be read for migration compatibility. The normal migration pass rewrites registered legacy keys after the device-derived key is initialized. A clean install and a post-upgrade migration check should be included in release QA.

## Transport and authentication

The central native connection service carries the persisted HTTP/HTTPS scheme, device identity, app signature, and bearer token. Butler chat, script execution, streaming execution, script listing/upload, and core status requests use that authenticated service. The server defaults to safe loopback behavior and requires explicit pairing for protected endpoints. The server prints a pairing code below the QR output, and the app now accepts the code in manual connection mode.

Plain HTTP is still supported for trusted LAN/private-VPN compatibility, but it is not encrypted traffic. For untrusted networks, use a properly validated TLS certificate or an encrypted private VPN. The app must never disable certificate validation or expose the Python listener by router port forwarding.

## Resource and script guards

The PC bridge enforces script size limits, dangerous-pattern checks, safety verification for risky imports, bounded execution time, bounded concurrent execution, and CPU-pressure rejection. These controls reduce accidental overload and common abuse patterns. They do not create a secure sandbox for arbitrary Python, PowerShell, shell, or file access. The user must treat the paired PC as granting high privilege.

## Dependency policy

No new runtime dependency was added for these changes. Existing Expo SecureStore, Expo Crypto, AsyncStorage, and React Native dependencies are reused. The lockfile and manifest must remain synchronized; future dependency additions require a vulnerability review, license review, and Android compatibility check.

## Remaining risks

The native storage implementation retains legacy compatibility and must receive a formal cryptographic review before being marketed as proprietary or equivalent to AES-GCM. The Python bridge is not a hardened internet-facing production gateway. Certificate lifecycle, VPN account security, OS firewall configuration, script sandboxing, dependency CVEs, and platform-specific permissions still require release testing. Do not describe the package as hacker-proof or bulletproof.
