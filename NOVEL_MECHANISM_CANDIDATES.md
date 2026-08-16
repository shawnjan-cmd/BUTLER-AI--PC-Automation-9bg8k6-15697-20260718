# Butler Original Mechanism Design Record

This record distinguishes **original implementation mechanisms** from broad concepts that may already exist elsewhere. No prior-art search has established that any mechanism is legally unprecedented; that determination requires specialist research. The implementation goal is to create a distinctive, internally coherent system with measurable behavior.

## Selected mechanisms

| Mechanism | Concrete structure | Invariant | Evidence |
|---|---|---|---|
| **Intent Shadow** | Store a redacted, digest-only shadow of the approved request beside the live execution context. | Live execution arguments must hash to the shadow before any side effect. | Mismatch test prevents process start. |
| **Trust Epoch Cascade** | A monotonic epoch invalidates approvals, remote sessions, and optional memory writes after actor, topology, policy, or auth changes. | An old epoch can never authorize a newer epoch. | Epoch transition and stale-token tests. |
| **Budget Debt Ledger** | Each lane accumulates bounded “debt” from CPU, RAM, latency, and retry use; debt decays only during healthy idle windows. | Optional work cannot borrow from critical-lane capacity. | Admission decisions and debt snapshots. |
| **Receipt-Carried Recovery** | Every recovery action references the failed receipt and creates a new receipt rather than mutating failure state. | Recovery cannot erase the original failure or retry indefinitely. | Chain verification and retry-cap tests. |
| **Freshness Envelope** | Every dashboard metric carries source time, collection time, expiry, and confidence state. | Expired metrics render stale, never live. | Clock and stale-state tests. |
| **Memory Quarantine** | New memory first enters a quarantine queue with provenance and sensitivity labels; promotion requires an explicit admission event. | Unproven or sensitive data cannot become durable memory by default. | Admission and deletion tests. |
| **Quiet-Failure Aggregator** | Repeated equivalent failures are grouped by deterministic fingerprint with first/last time and count. | Alert volume is bounded without losing causal evidence. | Grouping and flush-window tests. |

## Implementation order

The first implementation tranche is Intent Shadow plus Trust Epoch Cascade because they directly strengthen approval binding and session invalidation. Budget Debt and Freshness Envelope follow because they improve smoothness without altering critical behavior. Receipt-Carried Recovery and Quiet-Failure Aggregator follow after the ledger integration is stable. Memory Quarantine is integrated through the existing memory-admission gate rather than implemented as a duplicate memory system.
