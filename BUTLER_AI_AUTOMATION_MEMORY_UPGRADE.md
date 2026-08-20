# Butler AI Automation Memory & Live Drafting Upgrade

## Purpose

This upgrade makes Butler’s automation knowledge **local-first, compact, reviewable, and execution-safe**. It does not treat chat as an execution channel. Instead, it helps a user move from a natural-language request to a reviewed workflow through visible stages: intent parsing, pattern matching, server-side safety preflight, draft preparation, Script Library review, dry run, and an explicit Flow Ledger approval.

> **Security rule:** A message, memory record, model reply, or animation must never be interpreted as execution authority. The paired PC may perform a side effect only through a fresh approval tied to an immutable reviewed script digest.

## Architecture

| Layer | Stores | Never stores | Security boundary |
|---|---|---|---|
| Android automation-memory vault | Reviewed pattern identifiers, redacted plan summaries, user preferences, receipt fingerprints, sync state | Script source, full chats, passwords, tokens, approval tokens, raw receipts | `encryptedStorage` plus memory admission controls |
| Paired PC companion server | Reviewed script drafts, AST preflight state, Flow Ledger events, terminal receipts, redacted manifest metadata | Mobile secrets, complete Android memory, approval tokens after use | Pairing lock, vault state, privacy circuit, single-use Flow Ledger approvals |
| Local Ollama lane | A bounded conversation and current plan context for draft-only assistance | Cloud fallback, execution authority, unbounded transcripts | Loopback-only Ollama endpoint and server-owned safety prompt |

## Reviewed Pattern Catalog

`services/automationMemoryVault.ts` contains a compact catalog of **23 task patterns**. These entries are not pre-executed code. They guide matching and drafting for system snapshots, disk reporting, cleanup previews, file organization previews, backup manifests, LAN inventory, local-port visibility, log triage, resource monitoring, Ollama health, local knowledge indexing, and related tasks.

Every entry declares a capability, risk level, prerequisites, and a safe boundary. For example, the duplicate-file pattern produces a candidate report rather than deleting anything, and the temporary-file pattern requires a preview before a deletion-capable draft can be considered.

## Real-Time Drafting UX

The Butler chat screen now shows an animated **Butler Draft Pipeline** only while actual app work is in progress. Its stages are not a fake progress bar:

| Stage | Real app action |
|---|---|
| `INTENT` | The request is classified as a possible automation request. |
| `PATTERN` | The encrypted local catalog is searched for reviewed task patterns. |
| `SAFETY` | A paired PC is asked to create a plan; it does not execute code. |
| `DRAFT` | The plan is persisted locally, the redacted manifest may sync, and local Butler may prepare a draft-only response. |

The plan card deliberately offers only **Review in Script Library**. It contains no run button, approval token, or hidden side effect.

## Redacted Pairing Manifest

The Android app can synchronize `version`, `patternIds`, safety preferences, record counts, and an integrity fingerprint to `/api/memory/automation-manifest`. The server rejects this operation unless the PC is paired, the local vault is unlocked, and the privacy circuit is armed. The endpoint stores metadata only, which is intentionally insufficient to recreate source code, user chat, account details, secrets, or approvals.

## Local Chat and Draft Contract

The canonical server now exposes `/api/ollama/models` and `/api/butler/chat`. These endpoints permit only a **loopback** Ollama target. The server ignores client-provided system instructions and applies its own draft-only constraints: no code execution, no claim of success without a receipt, no bypass of login/payment/platform/security controls, and explicit prerequisites and dry-run guidance for automation requests.

## Flow Ledger Integration

The upgraded pathway uses these endpoints in sequence:

| Endpoint | Purpose | Side effects permitted |
|---|---|---|
| `/api/automation/plan` | Classifies a request and returns visible requirements | None |
| `/api/flow/script/draft` | Saves a reviewed draft after AST policy review | Local draft write only |
| `/api/flow/script/intent` | Lints and dry-runs the exact draft, then creates a ledger intent | None |
| `/api/flow/script/approve` | Issues a short-lived, single-use approval after a user action | None |
| `/api/flow/script/execute` | Revalidates the script digest and executes the exact approved file | Only the approved local script |

## Validation

The project has been validated after this upgrade with the TypeScript compiler and the Python regression suite. The new canonical Flow Ledger tests cover external-side-effect planning, reviewed draft execution with a terminal receipt, approval invalidation after draft mutation, and the redacted memory boundary. A pre-existing learner rollback test was also corrected so a rollback restores the selected accepted rule deterministically.

## Operational Limits

This feature does not promise that every third-party PC application can be controlled safely. Software that requires a login, purchase, platform authorization, an anti-cheat environment, or a protected account remains user-controlled. Butler can prepare a reviewed local workflow, but it does not silently create accounts, bypass protections, complete purchases, or send external communications from chat alone.
