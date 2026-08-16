# Butler Flow Ledger and Capability Receipt Graph

## Status

This specification is the authoritative contract for sensitive Butler operations. It supersedes descriptive UI text and informal route comments. A feature is not considered protected merely because it mentions safety, approval, or receipts; the runtime must emit and validate the ledger stages defined here.

## Core sequence

Every side-effecting operation must move through exactly these ordered stages:

| Stage | Required evidence | Failure behavior |
|---|---|---|
| Intent | Normalized user intent, actor/device identity, capability, request nonce, and bounded payload digest | Reject if missing or ambiguous |
| Safety | Local policy classification, jurisdiction-risk result, prompt-injection result, resource estimate, and policy version | Reject if unsafe, unknown, or stale |
| Approval | Explicit user approval bound to the exact intent digest, capability, device, and expiry | Reject if absent, mismatched, expired, or reused |
| Execution | Allowlisted capability, declared resources, cancellation handle, and executor result | Never execute outside the approved digest |
| Receipt | Hash-linked outcome, timestamps, resource summary, redacted evidence, and deletion status | Persist a failure receipt if execution did not complete |

Read-only informational operations may use a reduced ledger, but must still record intent, safety, and receipt when they access private PC state or personal memory.

## Invariants

1. **No stage skipping.** Execution is impossible without valid prior Intent, Safety, and Approval records.
2. **Digest binding.** Any change to capability, arguments, target paths, hosts, model, resource budget, or actor identity invalidates approval.
3. **Single use.** An approval nonce can authorize one execution attempt only. Retries require a new approval or a narrowly scoped retry token issued by the executor.
4. **Monotonic state.** A ledger entry cannot move backward or be edited in place. Corrections append a new event.
5. **Receipt continuity.** Every event contains the previous event hash and a canonical payload digest. Broken chains fail verification and are surfaced as integrity errors.
6. **Fail closed.** Unknown capabilities, missing policy versions, clock uncertainty beyond the configured skew, unavailable audit storage, or ambiguous safety results block side effects.
7. **Least privilege.** A capability grants only the declared operation and declared resources; natural-language approval never grants unrestricted shell access.
8. **Secret minimization.** Receipts never contain raw tokens, passwords, full scripts, private prompts, or raw audio. They contain redacted metadata and hashes.
9. **Bounded persistence.** Ledger storage is size- and age-bounded, but deletion creates a tombstone receipt before compaction where feasible.
10. **Local-only AI.** Chat, safety classification, transcription, and speech generation use the configured local Ollama/STT/TTS boundary. A missing local provider is a typed failure, never a cloud fallback.

## Capability Receipt Graph

Each receipt is a node with `receipt_id`, `ledger_id`, `capability`, `stage`, `payload_digest`, `previous_hash`, `event_hash`, `actor_id`, and `created_at`. Edges are represented by `previous_hash`, `parent_receipt_id`, and optional `caused_by_receipt_id`. A valid graph has one Intent root, a Safety child, one Approval child for side effects, one Execution child, and one terminal Receipt child. Rejected requests may terminate at Safety or Approval with a rejection receipt.

## Canonicalization

Canonical payloads use UTF-8 JSON with sorted keys, compact separators, no NaN or Infinity, and explicit nulls. Digests use SHA-256 over the canonical bytes. Timestamps are UTC epoch milliseconds. Identifiers are random UUIDs or cryptographically random nonces and are never derived from secrets.

## Operational defaults

The default approval lifetime is 120 seconds. The default clock-skew allowance is 30 seconds. The default ledger record limit is 2,000 events per installation, with an implementation-defined byte ceiling. High-risk script, file-delete, network, credential, and remote-control capabilities require per-action approval and cannot be approved by a generic session toggle.

## Security claims

This design provides a verifiable authorization and audit sequence; it does not prove that an arbitrary script is safe. Script execution remains a high-risk capability requiring allowlisting, declared resources, timeouts, CPU/concurrency limits, and independent sandbox review. The product must not use “bulletproof,” “impossible to hack,” or equivalent claims.
