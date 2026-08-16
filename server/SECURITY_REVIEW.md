# Butler AI Server — Security Review

## Reviewed source

`butler_server_v20_1_0_OSS.py` is the supplied OSS server file. It passed `py_compile` before packaging. A SHA-256 manifest is stored beside it.

## Positive controls observed

The source contains pairing-code and HMAC/session-token paths, bounded request-body and execution-time constants, request authentication checks on many protected handlers, SQLite-backed local state, concurrency locks around metrics/streams, and a configurable bind host. The companion `run_server_safe.py` launcher defaults to loopback and requires an explicit `--lan` opt-in for non-loopback operation.

## Risks and release blockers

This review is not a penetration test. The server is a large single-file process with broad PC capabilities. It includes script execution, file operations, crawler/network features, automatic dependency behavior, and administrative elevation paths. Those capabilities require endpoint-by-endpoint authorization tests, path traversal tests, command-injection tests, rate-limit tests, resource exhaustion tests, and firewall/network isolation tests.

The code comments and onboarding copy must be kept consistent with the implementation. In particular, the app should not claim AES-256 if the server implementation derives an AES-128-GCM key, and it should not claim that LAN binding alone prevents attackers. Plain HTTP on a LAN can expose metadata or tokens to a hostile local network unless a secure transport and pairing design is verified.

The server should not be exposed through router port forwarding. Users need a visible revoke/reset pairing action, a clear bind-address display, a database backup/delete action, and a warning before enabling high-risk PC controls. The server also needs a dependency lock/hash policy and a release-signature or trusted-checksum process.

## Delivery status

The server file is included in the native handoff under `server/`. The app’s Open Source GitHub button is located below the server download control in onboarding and points to the existing project URL. The package is **not** called bulletproof or Play Store-ready until the runtime and security test matrix passes.
