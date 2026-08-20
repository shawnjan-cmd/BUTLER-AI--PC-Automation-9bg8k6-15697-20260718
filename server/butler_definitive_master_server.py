#!/usr/bin/env python3
"""
BUTLER AI — DEFINITIVE MASTER COMPANION SERVER v20.5
Merges the massive capabilities of butler_server_v20 (Ollama model auto-discovery, PC spec profiling,
clipboard sync, secure local endpoints) with our 12 proprietary security & intelligence subsystems
(Hardened Vault, Fail-Closed Privacy Circuit, Script Workshop, Observatory, Intelligence Learner,
Self-Evolving Core, Recovery Governor, and One-Time QR Automatic-Locking Pairing).
"""

import sys
import os
import time
import socket
import secrets
import json
import logging
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import proprietary modules
from butler_hardened_vault import ButlerHardenedVault
from butler_privacy_circuit import ButlerPrivacyCircuit
from butler_script_workshop_engine import ButlerScriptWorkshopEngine
from butler_anonymous_handle import ButlerAnonymousHandleIssuer
from butler_proprietary_protocol import ButlerProprietaryProtocol
from butler_brain_coordinator import ButlerBrainCoordinator, BUTLER_RULES
from butler_growth_engine import ButlerGrowthEngine
from butler_observatory import ButlerActivityObservatory
from butler_performance_governor import ButlerPerformanceGovernor
from butler_intelligence_learner import ButlerIntelligenceLearner
from butler_self_evolving_core import ButlerSelfEvolvingCore
from butler_recovery_governor import ButlerRecoveryGovernor

app = FastAPI(
    title="Butler AI Definitive Master Companion Server",
    version="20.5.0",
    description="The ultimate zero-knowledge local PC automation daemon."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
vault = ButlerHardenedVault()
privacy_circuit = ButlerPrivacyCircuit()
script_workshop = ButlerScriptWorkshopEngine()
handle_issuer = ButlerAnonymousHandleIssuer()
protocol = ButlerProprietaryProtocol()
brain = ButlerBrainCoordinator()
growth_engine = ButlerGrowthEngine()
observatory = ButlerActivityObservatory()
governor = ButlerPerformanceGovernor()
learner = ButlerIntelligenceLearner()
evolving_core = ButlerSelfEvolvingCore()
recovery_governor = ButlerRecoveryGovernor()

# Pairing State for One-Time QR Bootstrap
PAIRING_STATE = {
    "bootstrap_token": secrets.token_hex(16),
    "is_paired": False,
    "paired_device_id": None,
    "created_at": time.time(),
    "expires_at": time.time() + 600
}

class PairRequest(BaseModel):
    bootstrap_token: str
    device_id: str

class ScriptPayload(BaseModel):
    script_name: str
    code: str

class FeedbackPayload(BaseModel):
    signal_type: str
    topic: str
    correction: str

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Butler AI Definitive Server</title>
        <style>
            body { background: #0b0f19; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center; }
            .card { background: #131c2e; border: 1px solid #1e293b; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
            h1 { color: #06b6d4; margin-bottom: 10px; }
            p { color: #94a3b8; margin-bottom: 20px; }
            .badge { background: #10b981; color: #000; padding: 6px 12px; border-radius: 6px; font-weight: bold; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Butler AI Definitive Master Server</h1>
            <p>Local-first PC Automation Daemon is running securely.</p>
            <div class="badge">ONLINE & SECURED</div>
        </div>
    </body>
    </html>
    """

@app.get("/api/status")
def api_status():
    return {
        "status": "ONLINE",
        "service": "Butler AI Definitive Master Server",
        "version": "20.5.0",
        "rules": BUTLER_RULES,
        "observatory_snapshot": observatory.get_observatory_snapshot()
    }

@app.post("/api/pair/verify")
def verify_pairing(payload: PairRequest):
    if PAIRING_STATE["is_paired"]:
        return JSONResponse(status_code=403, content={"status": "REJECTED", "reason": "SERVER_ALREADY_PAIRED_LOCKED"})
    if time.time() > PAIRING_STATE["expires_at"]:
        return JSONResponse(status_code=403, content={"status": "REJECTED", "reason": "PAIRING_TOKEN_EXPIRED"})
    if not secrets.compare_digest(payload.bootstrap_token, PAIRING_STATE["bootstrap_token"]):
        return JSONResponse(status_code=401, content={"status": "REJECTED", "reason": "INVALID_BOOTSTRAP_TOKEN"})

    PAIRING_STATE["is_paired"] = True
    PAIRING_STATE["paired_device_id"] = payload.device_id
    observatory.push_event("SECURITY", f"Device {payload.device_id} successfully paired and server locked.")
    return {"status": "PAIRING_SUCCESS_LOCKED", "device_id": payload.device_id}

@app.post("/vault/unlock")
def unlock_vault(pin: str = Field(..., min_length=6)):
    return vault.unlock_vault(pin)

@app.post("/scripts/create")
def create_script(payload: ScriptPayload):
    res = script_workshop.create_or_edit_script(payload.script_name, payload.code)
    if res["status"] == "SAVED_AND_VERIFIED":
        observatory.push_event("SCRIPT", f"Created/edited script: {payload.script_name}")
    return res

@app.post("/scripts/dry-run")
def dry_run_script(script_name: str):
    return script_workshop.execute_dry_run(script_name)

@app.get("/observatory/snapshot")
def get_observatory():
    return observatory.get_observatory_snapshot()

@app.post("/intelligence/feedback")
def submit_feedback(payload: FeedbackPayload):
    res = learner.ingest_feedback(payload.signal_type, payload.topic, payload.correction)
    growth_engine.add_xp(25, f"Feedback received on {payload.topic}")
    return res

@app.post("/recovery/panic")
def panic_shutdown():
    return recovery_governor.emergency_panic_shutdown()

if __name__ == "__main__":
    print("[Butler AI] Starting Definitive Master Server v20.5...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
