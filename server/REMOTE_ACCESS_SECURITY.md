# Butler AI Remote Access and Security Model

## What is supported

Butler supports three deliberate deployment modes. **Loopback mode** binds only to `127.0.0.1` and is the safest diagnostic mode. **Trusted LAN mode** binds to a private interface and uses the existing pairing code, HMAC session token, app signature, IP/subnet checks, request limits, and local audit logging. **Worldwide mode** should use an encrypted private overlay network such as a user-managed Tailscale/WireGuard-style VPN on both the PC and phone; the Butler process is still private and is not port-forwarded.

The home screen now includes a **LAN & Remote Access** card. It reports the live paired endpoint and directs the user to a private VPN guide for away-from-home access. It does not claim that a public HTTP endpoint is safe.

## TLS mode

For deployments that have a certificate valid for the address the phone uses, configure:

```bash
BUTLER_BIND=0.0.0.0
BUTLER_TLS_CERT=/absolute/path/fullchain.pem
BUTLER_TLS_KEY=/absolute/path/private-key.pem
BUTLER_REQUIRE_TLS=1
python server/butler_server_v20_1_0_OSS.py --no-qr
```

The server uses an `ssl.SSLContext` with TLS 1.2 or newer and disables TLS compression where supported. The QR payload reports `https` when the configured certificate and key are present. The mobile app persists the scheme and uses it for subsequent requests.

A self-signed certificate is not automatically trustworthy to a native mobile client. For a real release, use a certificate whose hostname matches the address used by the app, or implement carefully reviewed certificate pinning with a rotation and recovery process. Do not bypass certificate validation.

## Private-VPN mode

For most home users, private overlay networking is preferable to opening a router port. Install the same VPN client on the PC and phone, sign both into the user’s own account/tailnet, run the Butler server on the PC, and pair using the PC’s private VPN address. Keep the server firewall restricted to the VPN interface where practical. Never expose the pairing QR endpoint or the Butler port through router port forwarding.

The server does not create a global relay or VPN account automatically. A production worldwide relay would require a separately operated HTTPS gateway, identity system, abuse controls, certificate management, availability monitoring, and a documented data-retention policy. That infrastructure is not included in this local-first package.

## Defensive controls added or verified

The server now has structured JSONL security events at `~/.butler_ai/security_audit.jsonl`, with redaction applied to tokens, secrets, authorization values, scripts, and content. The audit file is created with restrictive permissions where supported. Connection concurrency, slow-read timeouts, request body limits, authentication failure tracking, CORS restrictions, and typed authorization errors remain active.

Protected routes reject requests before pairing by default. `BUTLER_ALLOW_OPEN_MODE=1` is an explicit development-only escape hatch and should not be used for a public or shared network. Dependency installation is also opt-in through `BUTLER_AUTO_INSTALL=1`; default startup does not silently run pip.

## Honest limits

This is defensive hardening, not a guarantee against every attacker. The server uses Python’s `http.server` family, which Python documents as having only basic security checks and not being recommended as a production web server. A Play Store release should be accompanied by a real dependency lockfile, signed artifacts, a vulnerability scan, authenticated endpoint tests, file/path traversal tests, SSRF tests, script sandbox review, rate-limit tests, TLS certificate validation tests, and external penetration testing.
