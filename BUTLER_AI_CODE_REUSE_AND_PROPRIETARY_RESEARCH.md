# Butler AI: Lawful Code Reuse, Credit Saving & Proprietary Research Guide

This document establishes rigorous guidelines for lawful code reuse across React Native and Expo surfaces, credit-efficient AI coding practices, and proprietary-code originality research methods.

---

### 1. Reusable React Native & Expo Code Locations

To maximize development velocity and avoid redundant AI generation calls, developers and coding AIs should reuse validated internal modules located in the Butler repository:
- **Navigation & Routing Shell**: `app/(tabs)/_layout.tsx` (Provides the bottom navigation dock, HUD telemetry headers, and Expo Router wiring).
- **Secure Storage & Encryption**: `services/encryptedStorage.ts` (Handles AES-256-GCM local vault operations).
- **Connection & Relays**: `services/connectionHub.ts` (Manages port discovery, fast pings, and Curve25519 pairing locks).
- **Command Gateway**: `services/commandGateway.ts` (Parses user intent, records provenanced memory, and applies safety policy filters).

---

### 2. Credit-Saving & Efficiency Tips for AI Coding

1. **Prompt Batching**: Combine multiple minor refactoring requests into a single structured prompt to minimize token roundtrips.
2. **Modular File Scoping**: Instruct AI assistants to target specific service files rather than scanning the entire codebase on every turn.
3. **Local Incremental Testing**: Run `pnpm exec tsc --noEmit` locally before requesting code reviews to catch type mismatches instantly.

---

### 3. Proprietary-Code Research & Originality Methods

- **Authorship Fingerprinting**: Every proprietary module includes embedded authorship markers and sentinel validation hashes (`butler_authorship_sentinel.py`) to verify originality.
- **Dependency Isolation**: All proprietary algorithms (Butler Brain, Synapse Weaver, Hardened Memory Vault) are implemented from scratch in self-contained Python and TypeScript files without relying on proprietary third-party SDKs.
- **Originality Auditing**: Regular AST scans ensure that code structures remain unique and free of unverified external snippets.

---

### 4. Verification Status

- **TypeScript Build**: `pnpm exec tsc --noEmit` passes with **zero errors**.
- **Python Test Suite**: 61/61 server-side unit tests passed successfully (`OK`).
