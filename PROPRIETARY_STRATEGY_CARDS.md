# Butler Proprietary Strategy Cards

These strategies are deliberately small and composable. Their defensible value comes from the sequence and evidence they create together, not from claiming that any single idea is unprecedented.

| Strategy | Core idea | Evidence emitted | Primary failure it prevents |
|---|---|---|---|
| **Capability Narrowing** | Convert every PC action into a named manifest capability with explicit scope, network, time, and undo requirements. | Policy version, capability ID, scope digest, decision, reason. | Natural-language approval accidentally becoming unrestricted shell access. |
| **Digest-Locked Approval** | Bind approval to the exact actor, capability, script/content digest, resource budget, and expiry. | Intent digest, approval token digest, expiry, single-use state. | Replacing a script or changing arguments after approval. |
| **Receipt Continuity** | Hash-link immutable stage records and verify the chain before displaying success. | Previous hash, event hash, terminal outcome, resource summary. | False success indicators and untraceable partial execution. |
| **Resource Reservation** | Reserve a bounded CPU/RAM/time lane before side effects; release it on every exit path. | Requested budget, admission decision, release outcome, measured usage. | Optional crawlers or scripts starving chat and pairing. |
| **Evidence-Weighted Memory** | Admit durable memory only when provenance, sensitivity, user approval, and retention policy are present. | Admission decision, provenance digest, retention class, deletion state. | Private or unverified data silently becoming permanent memory. |
| **Recovery Choreography** | Classify faults, cancel optional work, preserve critical paths, and record bounded recovery attempts. | Fault class, attempt number, action, cooldown, final state. | Infinite retries and self-healing loops that consume resources. |
| **Trust-Decay Timer** | Reduce capability privileges after inactivity, failed auth, topology changes, or policy-version changes. | Trust epoch, trigger, revoked capabilities, re-pair requirement. | Old sessions remaining powerful after the environment changes. |
| **Quiet-Failure Budget** | Aggregate repeated warnings and surface one actionable receipt instead of spamming the user. | Suppression window, count, first/last event, surfaced summary. | Alert storms that hide the real failure and drain battery. |
| **Proof-Carrying UI** | Show only metrics and status cards that carry source, timestamp, freshness, and receipt state. | Source label, timestamp, freshness class, real-data flag. | Fake-looking dashboards and stale PC status presented as live truth. |
| **Optional-Lane Firewall** | Make crawlers, research, cosmetic downloads, and voice enhancements interruptible and unable to block chat, pairing, safety, or approved execution. | Lane decision, preemption reason, resume/cancel state. | Background convenience work breaking critical functions on weak devices. |

## Release rule

A strategy is not considered implemented until its decision path is exercised by a deterministic test and its result can be represented in a receipt or a typed diagnostic. Marketing language must describe the measured control, not an absolute security guarantee.
