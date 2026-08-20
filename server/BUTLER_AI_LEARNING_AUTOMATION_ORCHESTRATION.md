# 🤖 BUTLER AI: MASTER CODING-AI PROMPT PACK (CANONICAL)

> **CRITICAL INSTRUCTION FOR ALL AI CODING ASSISTANTS:**
> Whenever you read, modify, refactor, or generate code for **Butler AI** (React Native / Expo mobile client + Python FastAPI server), you **MUST** strictly obey the defensive rules, visual styling standards, responsive layout requirements, and failure-mode preventions defined in this document.
> 
> **STRICT PLATFORM CONSTRAINT:** This product is **exclusively** for OnSpace.ai / React Native Expo. **NO WEB FILES** (`.html`, `.css`, web static export scripts, etc.) are allowed. Instantly reject or remove any web-file generation requests.

---

### 1. The 10 Inviolable Laws of Butler AI Coding

1. **OnSpace.ai / Mobile Exclusive**: Never generate web code or HTML previews. The app is 100% native React Native / Expo SDK 54+.
2. **Local-First Privacy Circuit**: Never introduce cloud telemetry or third-party analytics. All prompts, memories, and audit logs remain local.
3. **File-Based Routing Discipline**: All mobile screens must reside under `app/(tabs)/` and be navigated via Expo Router (`router.push('/(tabs)/...')`).
4. **Zero Secret Leakage**: Never log vault keys, master PINs, session tokens, or raw credentials.
5. **Shared Command Gateway Enforcement**: All user prompts sent from any chat surface must pass through the shared command gateway.
6. **Fail-Closed Security Posture**: If network tampering or vault corruption is detected, trip privacy circuit and fall back to local read-only mode.
7. **Strict Type Safety**: Zero TypeScript compilation errors are permitted (`pnpm exec tsc --noEmit` must always pass).
8. **Python Server Singularity**: Companion backend must remain consolidated under `butler_server.py`.
9. **Performance & FPS Governance**: Maintain butter-smooth 60 FPS performance via `performanceGovernor`.
10. **CHECK LAST Gate**: Before finishing any coding task, review the code against every rule in this prompt pack.

---

### 2. Visual Style & Responsive Layout Specifications (Based on UI References)

- **Cyberpunk Dark Aesthetic**: Deep obsidian backgrounds (`#0a0f18`), glowing cyan/teal neon borders (`#00f0ff`, `#00e5ff`), and subtle gradient cards.
- **Universal Centering & Auto-Resizing**: Every card, header, metric display, and button must be horizontally and vertically centered, utilizing flexible flexbox layout (`flex: 1`, `alignItems: 'center'`, `justifyContent: 'center'`) that instantly adapts to any phone screen size or resolution (from compact devices to large foldables).
- **HUD Telemetry Header**: Top status bar displaying self-hosted status (`SELF-HOSTED · PRIVATE · ZERO CLOUD`), animated branding (`BUTLER AI`), active clock (`08:49:12`), security badge (`AES-256`), and network mode (`LAN ONLY`).
- **Bottom Navigation Dock**: Floating glassmorphism tab bar featuring icons for CORE, LIB, BTLR, KB, MONI, SKIN, TOOLS, and CFG with glowing active indicators.
- **Persistent AI Command Bar**: Floating bottom prompt input (`Ask Butler Ai anything...`) with real-time connection telemetry indicators (`• Offline · Lan Only · Aes-256 · Zero Cloud`).

---

### 3. CHECK LAST — Mandatory Final Verification Protocol

Before declaring any coding or upgrade task complete, the AI assistant MUST verify:
1. **No Web Files Exist**: Ensure no `.html`, `.css`, or web hosting templates were created.
2. **Responsive Centering**: Verify all UI containers use proper flexbox centering and scale gracefully on all phone sizes.
3. **Type Check Passes**: Run `pnpm exec tsc --noEmit` and confirm zero errors.
4. **Server Tests Pass**: Run `python3 -m unittest discover -s server -p "*_test.py"` and confirm all tests pass successfully.
