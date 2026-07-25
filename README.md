# Butler AI — OnSpace overhaul build

This branch overhauls the app into a reliable core flow with live backend wiring:

- **Home**: live server health, latency, endpoint status
- **Connect**: editable host/port/token/HTTPS + live test/persist
- **Butler**: real chat connected to `/api/chat` with model + system prompt controls
- **Settings**: persisted assistant defaults + full connection reset

## Open-source trust mode

To support transparent/self-hosted backend trust, this repo now includes:

- `backend/open_source_server.py` — auditable Python server users can run directly
- `app/(tabs)/connect.tsx` action to copy a generated server template to clipboard

The open-source server exposes:

- `GET /health`
- `GET /api/status`
- `GET /api/tags` (proxied to Ollama)
- `POST /api/chat` (proxied to Ollama)

Optional auth is supported via `BUTLER_SERVER_TOKEN` bearer token.

## Run the open-source Python server

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install fastapi uvicorn requests
export OLLAMA_BASE_URL=http://127.0.0.1:11434
export BUTLER_SERVER_TOKEN=your_token_here   # optional
python backend/open_source_server.py
```

## App runtime

The app expects an Ollama-compatible backend and checks:

- `/api/tags` for connection health
- `/api/chat` for assistant replies

Set your server details from the **Connect** tab.
