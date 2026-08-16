# Butler AI Server Console and Script Synchronization

## Runtime model

The Python file is a **desktop console/API server**, not a browser application. After installation, the user launches `server/start_server.bat` on Windows or `server/start_server.sh` on Linux/macOS. The process remains in the foreground and opens the server’s native desktop window when a desktop display is available. On headless systems it remains a terminal process and prints the pairing information and logs to stdout.

The desktop window contains the QR code, manual pairing code, connection state, activity log, CPU/RAM pressure indicators, server controls, and the native Script Library manager. The mobile app is the primary user-facing application UI. The server no longer contains a “Test in Browser” control and does not intentionally open a browser dashboard.

## Pairing sequence

The server creates a pairing code and displays it below the QR code. The mobile app can scan the QR or enter the PC address and code manually. The first successful pair binds the server to the device identity and issues a signed session token. Subsequent requests require the app signature, device identity, valid token, and paired network policy. Unpair/reset intentionally invalidates the old device relationship and creates a new pairing code.

## Script-library synchronization

The native app and desktop Script Library use the authenticated API, not shared unencrypted files or browser storage. The app reads the server’s authoritative library through `GET /api/pc_scripts/list`, uploads local Python files through `POST /api/scripts/upload`, and can invoke guarded server-library execution through `POST /api/pc_scripts/run`. The desktop manager reads and writes the same server library directory through the internal `_pc_scripts_*` functions and refreshes its count periodically.

| Operation | Native app/API path | Desktop server behavior |
|---|---|---|
| List server scripts | `GET /api/pc_scripts/list` | Reads the server script library index |
| Upload a Python script | `POST /api/scripts/upload` | Validates, normalizes, and stores the script |
| Run a stored script | `POST /api/pc_scripts/run` | Applies safety checks, timeout, CPU, and concurrency guards |
| Save/edit script | `POST /api/pc_scripts/save` or edit/update aliases | Updates the same library used by the desktop manager |
| Delete script | `POST /api/pc_scripts/delete` | Removes only the selected library entry |
| Export/import | `POST /api/pc_scripts/export` and `/import` | Handles explicit library backup/restore |

All remote operations use the app’s centralized authenticated transport and the server’s pairing controls. A user may share the open-source launcher and server source, but each installation receives its own pairing state, device lock, token material, and machine-local library. Source code cannot honestly be made impossible to copy; the security boundary is enforced through per-install secrets, pairing, authorization, encrypted local storage, and safe execution policy.

## Safe launch examples

```text
Windows: double-click server/start_server.bat
Unix:    ./server/start_server.sh
Trusted LAN only: ./server/start_server.sh --lan
```

Do not port-forward the process or use plaintext HTTP on an untrusted network. Use a user-managed encrypted private VPN or configure valid TLS certificates for remote access. The desktop console/API server is not a replacement for OS firewalling, TLS certificate management, or a true sandbox for arbitrary Python.
