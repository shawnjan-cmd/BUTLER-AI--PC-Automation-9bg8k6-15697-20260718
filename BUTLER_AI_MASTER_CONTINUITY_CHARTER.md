# Butler AI: Master Continuity & Control Charter

This charter records the non-negotiable user requirements for absolute memory recall, input routing, FPS/performance prioritization, Butler Brain control, proprietary code ownership, and privacy-preserving web/code research.

---

### Non-Negotiable Directives

1. **Absolute Memory Recall & Zero Forgetting**:
   - Every input, prompt, user preference, and correction must be persistently tracked and remembered across turns without omission or misinterpretation.
   - Provenance-checked memory admission (`memoryAdmission`) guarantees that durable facts are stored locally in encrypted SQLite and vector stores.

2. **Butler Brain Full System Control**:
   - Butler Brain acts as the central orchestrator, capable of routing prompts, dispatching scripts through the Script Workshop, checking system metrics, and enforcing security policies across the app and server.

3. **Smooth Performance & FPS Prioritization**:
   - Resource governance (`performanceGovernor`, `frameBudgetMonitor`) prioritizes critical tasks (chat, script execution, security checks) over background animations, maintaining smooth 60 FPS performance even on legacy devices.

4. **Proprietary Originality & Code Ownership**:
   - All code, protocols, and control sequences are original implementations designed to ensure complete intellectual property protection and lawyer-ready authorship tracking.

5. **Privacy-Preserving Research**:
   - Web and code research operations are strictly rate-limited, debounced, and executed locally or via zero-telemetry relay channels to prevent any exfiltration of private data.
