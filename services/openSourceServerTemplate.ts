type TemplateOptions = {
  defaultPort: string;
};

export function buildOpenSourceServerTemplate(options: TemplateOptions): string {
  const port = String(options.defaultPort || '11434').replace(/[^0-9]/g, '') || '11434';

  return `#!/usr/bin/env python3
"""
Butler Open Source Bridge Server
--------------------------------
This server is intentionally simple so users can audit every line.

What it does:
- Exposes /health, /api/status, /api/tags, /api/chat
- Proxies /api/tags and /api/chat to a local Ollama server
- Optional bearer token auth via BUTLER_SERVER_TOKEN

Run:
  python -m venv .venv
  source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
  pip install fastapi uvicorn requests
  export OLLAMA_BASE_URL=http://127.0.0.1:11434
  export BUTLER_SERVER_TOKEN=your_token_here   # optional
  python server.py
"""

from __future__ import annotations

import os
from typing import Any, Dict

import requests
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

APP_HOST = os.getenv("BUTLER_SERVER_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("BUTLER_SERVER_PORT", "${port}"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
BUTLER_SERVER_TOKEN = os.getenv("BUTLER_SERVER_TOKEN", "").strip()

app = FastAPI(title="Butler Open Source Bridge", version="1.0.0")

class ChatBody(BaseModel):
    model: str
    messages: list[dict[str, Any]]
    stream: bool = False


def _verify_auth(authorization: str | None) -> None:
    if not BUTLER_SERVER_TOKEN:
        return

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if token != BUTLER_SERVER_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid bearer token")


def _proxy(method: str, path: str, json_body: Dict[str, Any] | None = None) -> Dict[str, Any]:
    url = f"{OLLAMA_BASE_URL}{path}"
    response = requests.request(method=method, url=url, json=json_body, timeout=120)
    response.raise_for_status()
    return response.json()


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "service": "butler-open-source-bridge"}


@app.get("/api/status")
def api_status() -> Dict[str, Any]:
    return {"ok": True, "ollama": OLLAMA_BASE_URL}


@app.get("/api/tags")
def api_tags(authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    _verify_auth(authorization)
    return _proxy("GET", "/api/tags")


@app.post("/api/chat")
def api_chat(body: ChatBody, authorization: str | None = Header(default=None)) -> Dict[str, Any]:
    _verify_auth(authorization)
    payload = body.model_dump()
    payload["stream"] = False
    return _proxy("POST", "/api/chat", json_body=payload)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host=APP_HOST, port=APP_PORT, reload=False)
`;
}
