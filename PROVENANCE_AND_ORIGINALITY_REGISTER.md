# Butler Provenance and Originality Register

## Purpose

This register prevents a useful implementation from being weakened by inaccurate ownership or originality claims. **Original implementation** means code authored for this Butler rebuild. It does not automatically mean that the underlying concept has no prior art, that the code is legally exclusive, or that it was not influenced by standard engineering practice.

## Classification rules

| Label | Meaning | Permitted claim |
|---|---|---|
| `BUTLER_AUTHORED` | Code or documentation written for this Butler rebuild and tracked by a hash. | “Authored for Butler in this rebuild.” |
| `INHERITED_PROJECT` | Code supplied in the existing Butler project or earlier project snapshots. | “Inherited and modified for Butler.” |
| `STANDARD_PATTERN` | General practice such as hashing, HMAC, AES-GCM, state machines, rate limiting, or bounded queues. | “Implemented using a standard security/engineering pattern.” |
| `THIRD_PARTY` | Dependency, library, asset, font, or copied code governed by an external license. | “Used under the applicable license.” |
| `UNVERIFIED_ORIGINALITY` | A Butler-specific combination or mechanism that has not undergone a formal prior-art search. | “Distinctive Butler implementation; originality not legally certified.” |
| `RELEASE_BLOCKED` | A claim or component that conflicts with the source, license, privacy policy, or runtime evidence. | Must be corrected before release. |

## Mechanism classifications

| Mechanism | Classification | Evidence / limitation |
|---|---|---|
| Flow Ledger stage enforcement | `BUTLER_AUTHORED` + `STANDARD_PATTERN` | The code and sequence were authored for Butler; hashing, HMAC, and state transitions are established techniques. No claim of universal novelty. |
| Capability policy gate | `BUTLER_AUTHORED` + `UNVERIFIED_ORIGINALITY` | Butler-specific manifest-to-request validation. Requires broader prior-art search before legal novelty claims. |
| Intent Shadow | `BUTLER_AUTHORED` + `UNVERIFIED_ORIGINALITY` | Butler-specific digest shadow bound to actor, capability, and trust epoch. Not certified as unprecedented. |
| Trust Epoch Cascade | `BUTLER_AUTHORED` + `UNVERIFIED_ORIGINALITY` | Butler-specific session invalidation composition. Requires integration into all sessions before production claims. |
| Freshness Envelope | `BUTLER_AUTHORED` + `STANDARD_PATTERN` | Explicit source/collection/expiry representation; common freshness concepts exist, but this implementation is Butler-authored. |
| Quiet-Failure Aggregator | `BUTLER_AUTHORED` + `STANDARD_PATTERN` | Bounded failure grouping and cooldown; common logging pattern with Butler-specific data shape. |
| Voice privacy deletion helper | `BUTLER_AUTHORED` + `STANDARD_PATTERN` | Ephemeral-audio policy and encrypted receipt storage; actual device transport still requires runtime testing. |
| AES-256-GCM wrapper | `INHERITED_PROJECT` + `STANDARD_PATTERN` | Must retain third-party library attribution and verify key lifecycle; do not call the entire system “unbreakable.” |
| React Native / Expo / Ollama / Python standard library | `THIRD_PARTY` | Preserve package and license records. |
| Existing Butler screens, server routes, mascots, and prior scripts | `INHERITED_PROJECT` | May be modified, but are not newly invented by this rebuild. |

## Release-blocking contradictions discovered

The source contains older privacy and data-safety text that refers inconsistently to Google or cloud AI, says microphone use is absent while the optional voice lane now exists, and makes absolute “no data ever” statements that are too broad for a local PC connection with optional voice, chat, diagnostics, or user-configured remote transport. These documents must be reconciled with the current runtime before a release claim is made.

The source snapshot has no `.git` metadata. Hashes provide integrity evidence for this snapshot but do not prove authorship or the date of creation. Preserve repository history, contributor agreements, dependency licenses, and dated records outside the ZIP.

## Safe public wording

> Butler AI includes Butler-authored mechanisms and an integrated Flow Ledger design. Some mechanisms use standard security and systems techniques, some code is inherited from earlier Butler work, and dependencies are third-party. The project makes no unsupported claim that any individual algorithm or sequence has no prior art. Originality, copyright ownership, patentability, and license compliance require jurisdiction-specific review and complete provenance records.
