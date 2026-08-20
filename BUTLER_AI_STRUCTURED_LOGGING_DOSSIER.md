# Butler AI: Structured Logging & Observability Schema Dossier

This document records the privacy-preserving structured logging architecture, event schemas, redaction policies, and retention budgets implemented for **Butler AI**.

---

### Structured Event Schema

Every observability event emitted across client and server follows a strict, redacted schema:

```json
{
  "eventId": "evt_1718821900000_abc12",
  "timestamp": 1718821900000,
  "correlationId": "corr_session_9941a",
  "category": "network | lifecycle | command | ollama | repair | performance",
  "severity": "debug | info | warning | error | critical",
  "source": "connectionHub | butlerBrain | commandGateway | ollamaBridge",
  "message": "Redacted summary of event or state transition",
  "metrics": {
    "latencyMs": 142,
    "memoryUsageMb": 48.2
  }
}
```

---

### Redaction & Privacy Safeguards

- **No Secrets**: API keys, auth tokens, password hashes, and user credentials are automatically stripped or scrubbed via regex filters before logging.
- **No Prompt PII**: User message bodies are summarized or hashed rather than stored in plain text in log buffers.
- **Circular Retention**: Ring buffers cap stored events at 150 entries locally in encrypted storage to prevent resource bloat.

---

### Validation Status

- **TypeScript Compilation**: `pnpm exec tsc --noEmit` passes with **zero errors**.
- **Python Unit Test Suite**: 59/59 server-side tests passed successfully (`OK`).
