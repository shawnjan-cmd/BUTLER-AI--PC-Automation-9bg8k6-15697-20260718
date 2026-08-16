# Butler AI PC Server Integration

The native app handoff now includes `butler_server_v20_1_0_OSS.py`, copied from the supplied OSS server file. The mobile app remains a client; this Python process runs on the user’s PC and exposes the local Butler bridge that the app pairs with.

## Safe operating contract

Run the server only on a trusted PC and trusted LAN. Keep `BUTLER_BIND=127.0.0.1` for local-only testing. Set `BUTLER_BIND` to the intended private LAN interface only when phone pairing is required. Do not port-forward the server, expose it to the public internet, or reuse its pairing token across devices.

The server uses a generated pairing code and HMAC/session-token authentication paths. The app must show disconnected, unauthorized, timeout, and stale states truthfully; a green state is not proof that the PC is safe or that the server is reachable from outside the LAN.

## Launch

Use a virtual environment where possible, install only reviewed dependencies, and run:

```bash
python server/butler_server_v20_1_0_OSS.py --no-qr
```

Use the GUI/QR mode only on a trusted desktop with a display. Review the printed bind address and port before pairing.

## Privacy boundary

The server can access the PC capabilities that the user explicitly enables through its API, including metrics, files, scripts, crawler data, clipboard, and local Ollama communication. The app must not describe this as zero-risk or hacker-proof. Users should be told what data is stored locally, what is sent over the LAN, how to revoke pairing, and how to delete the local server database.

## Additional hardening in this handoff

Sensitive native values now include personal memory, transport scheme, script cache data, script ETags, pairing/session metadata, and server topology. They are routed through the encrypted storage wrapper. Sensitive writes fail closed if the encryption key is unavailable instead of silently falling back to plaintext. Existing legacy plaintext values remain readable only for migration and should be rewritten during the normal encrypted-storage migration pass.

The PC server now prints the pairing code directly below the QR output as a manual fallback. The code is still subject to the same pairing and reset behavior; it is not a replacement for authentication.

Script execution has a bounded concurrency semaphore and a CPU-pressure guard. `BUTLER_MAX_EXEC_CONCURRENT` defaults to `2`, and `BUTLER_EXEC_CPU_CUTOFF` defaults to `92` percent, clamped to a defensive range. A busy or overloaded PC returns a typed `429` response instead of starting another process. This reduces burst amplification but is not a sandbox for arbitrary code.

The home screen’s remote setup card gives the user a private-VPN sequence and a direct download link. The supported worldwide pattern is a user-managed encrypted private network or properly configured trusted TLS; the package does not operate a public relay and does not recommend router port forwarding.

## Release limitation

This file passed Python syntax compilation and was copied with a SHA-256 manifest. It has not received a full dependency audit, static security scan, fuzz test, authenticated endpoint test, Windows/macOS/Linux matrix, firewall test, or penetration test. Do not publish it as bulletproof until those tests pass.
