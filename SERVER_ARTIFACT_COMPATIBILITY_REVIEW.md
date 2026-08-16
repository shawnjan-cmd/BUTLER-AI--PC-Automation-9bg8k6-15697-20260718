# Butler AI Supplied Server Artifact Review

## Scope and Provenance Boundary

The files reviewed in this record were supplied by the project owner as Butler-related materials. They were **not executed**, deobfuscated, or copied into the active application. The review used only static file inspection and archive manifests.

One large uploaded server file, `butler_server_v21_5_0_pentested.py`, declares that it is proprietary and restricted to the identified owner. Its header also prohibits copying, modification, and derivative use by other parties. In accordance with the Butler provenance rule, it is **not a merge source**. It may inform only a compatibility inventory at the protocol level if the owner later confirms a suitable license and asks for a deliberate, source-controlled migration.

| Artifact | Observed scope | Integration decision |
|---|---|---|
| `butler_server_v21_5_0_pentested.py` | Large single-file server with proprietary restrictions, local-model, automation, and storage claims. | Do not copy, deobfuscate, or merge. Treat only as an ownership-sensitive interface reference. |
| `butler_server.py` | Compact Flask server with `/pair`, `/reconnect`, `/api/verify`, status/metrics, chat, and raw execution endpoints. | Do not adopt directly; use it only to identify compatibility and security gaps. |
| `PC_REMOTE_COCKPIT_SERVER_PROMPT.md` | Suggested cockpit endpoints, including clipboard, keyboard, power, process, remote-access, and tunnel behavior. | Do not implement as written. Several proposed functions require stronger consent and capability controls. |
| `DownloadServerPage.tsx.txt` | Unwired reference UI with placeholder repository URLs and claims not independently verified. | Do not import; no active source dependency. |
| Uploaded connection hooks/types | Earlier client-side interface variants. | Treat as reference only; the active audited Expo gateway remains authoritative. |

## Static Compatibility Findings

The current Expo gateway’s meaningful authenticated protocol is `/pair` or `/reconnect` returning `sessionToken`/`token`, followed by `/api/verify`, `/api/status`, `/api/metrics`, and bounded authenticated requests. It persists sensitive pairing state through the existing encrypted-storage boundary and uses an app-install-scoped identifier.

The compact `butler_server.py` implements a superficially similar shape, but it is not safe to adopt unchanged. It binds to all interfaces, permits unrestricted cross-origin responses, has an unauthenticated pair-reset endpoint, derives non-expiring tokens from a local secret and timestamp, and exposes `/api/execute` that accepts arbitrary Python, PowerShell, Bash, or CMD source from the phone. Its startup dependency auto-install and external IP detection also conflict with Butler’s privacy-first, no-silent-download policy.

The supplied cockpit prompt proposes additional high-risk capabilities such as clipboard access/history, keyboard injection, process termination, power control, remote tunnels, and scheduled scripts. These are not rejected as product goals, but they cannot be exposed as direct endpoints. Each needs to be modeled as a separate capability with local scope, active approval, fail-safe stop, bounded runtime, and a redacted audit result.

## Active Client Hardening Applied

The active Expo client no longer accepts a manual connection solely because an endpoint returns HTTP success. `serverConnection.ts` now requires an authenticated session token from `/reconnect` or `/pair`, clears any prior token before a new manual target is evaluated, and rejects token-less pairing responses. This intentionally prevents the app from treating an open or legacy server as a trusted paired PC.

## Original Self-Hosted Integration Direction

The correct next component is not a copy of either supplied server. It is an original Butler **Executor Contract** developed around the existing pair gateway:

1. The app sends a constrained task plan, not raw Python or shell text.
2. The PC validates the plan schema and capability class before any executor is selected.
3. The user approves the same plan on phone and PC for consequential work.
4. The PC chooses a least-powerful executor, sets a deadline, exposes a fail-safe stop, and verifies the expected visible result.
5. The result is returned as a redacted, bounded audit event rather than unfiltered process output.

This preserves the product’s private self-hosted direction while keeping Butler’s codebase original, compact, and auditable.

## Revalidation After Client Pairing Tightening

After token-less connection fallbacks were removed, TypeScript completed with no diagnostics. The guard scan reported **0 broken imports**, **0 web API leaks**, and **0 unregistered tab screens**. A fresh Android Metro export completed successfully and produced a Hermes bundle. This validates the Expo client change; it does not validate or execute any uploaded server artifact.
