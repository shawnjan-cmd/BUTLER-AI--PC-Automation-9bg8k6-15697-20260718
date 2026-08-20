# Butler AI Companion Server Package

This package contains the **canonical local companion server** used by the Butler Android application. It is designed for a user-controlled private LAN: the phone is a review and approval surface, while the PC hosts local AI and approved capability execution.

> The companion server is **not** a public web service. Do not port-forward it, expose it through a public tunnel, or reuse the LAN pairing flow for remote access. Remote access requires a separately designed opt-in transport with identity pinning and visible revoke controls.

## Package Contents

| File | Purpose |
|---|---|
| `butler_server.py` | Canonical FastAPI companion server and Flow Ledger endpoints. |
| `flow_ledger.py` | Tamper-evident intent, approval, execution, and receipt primitives. |
| `requirements-companion.txt` | Minimal Python dependencies for the server. |
| `check_companion_contract.py` | Isolated contract check for status, pairing, reconnect, and vault configuration. |

## Local Setup

Create a Python 3.11+ virtual environment and install the supplied requirements.

```bash
python3 -m venv .venv
source .venv/bin/activate               # macOS/Linux
# .venv\Scripts\activate                # Windows PowerShell
pip install -r requirements-companion.txt
```

Set a unique local vault PIN before startup. You may optionally set the one-time pairing code; otherwise the server generates and prints a six-digit code for the current startup.

```bash
export BUTLER_VAULT_PIN='choose-a-unique-long-pin'
export BUTLER_PAIRING_CODE='654321'      # optional; omit to generate one
python3 butler_server.py
```

On Windows PowerShell, set the values as follows:

```powershell
$env:BUTLER_VAULT_PIN = 'choose-a-unique-long-pin'
$env:BUTLER_PAIRING_CODE = '654321'
python .\butler_server.py
```

The server prints its private-LAN address and a one-time pairing code. In the Butler mobile app, open **Cosmetics → LAN Connect · 5**, enter that exact private IP address and port, then enter the printed code. Pairing seals the server to the first verified mobile device for the current process.

## Security Boundaries

| Boundary | Enforced behavior |
|---|---|
| Local transport | The mobile app’s manual connection layer accepts only private LAN IPv4 ranges (`10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`) plus loopback for development. |
| Pairing | A code expires after ten minutes; a different device cannot replace the paired device without a deliberate local server restart. |
| Vault | No default unlock PIN is shipped. A unique `BUTLER_VAULT_PIN` is required before vault-gated workflow operations. |
| Automation | Script drafts are linted and dry-run; approval is bound to the exact digest; execution returns a Flow Ledger receipt. |
| Ollama | The server proxies only to a loopback Ollama endpoint and has no cloud fallback. |

## Verification

Run the isolated local contract check after installing requirements.

```bash
python3 check_companion_contract.py
```

This check does not launch a long-running server or access a real network. It verifies the FastAPI route contract in memory.

## Optional Environment Variables

| Variable | Default | Use |
|---|---|---|
| `BUTLER_VAULT_PIN` | Required for unlock | Unique vault unlock secret. |
| `BUTLER_PAIRING_CODE` | Random six digits per startup | One-time code shown to the user during LAN pairing. |
| `BUTLER_VAULT_STORE` | `~/.butler-ai/vault/vault.enc` | Local vault state path. |
| `BUTLER_OLLAMA_URL` | `http://127.0.0.1:11434` | PC-local Ollama endpoint; only loopback URLs are accepted. |
| `BUTLER_CORS_ORIGINS` | Empty | Optional comma-separated trusted origins for a deliberate web client configuration. |
