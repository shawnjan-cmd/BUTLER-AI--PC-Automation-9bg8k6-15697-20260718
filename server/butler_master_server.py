#!/usr/bin/env python3
"""
BUTLER AI — UNIFIED MASTER COMPANION SERVER v1.6
Integrates FastAPI routing, all 12 core proprietary engines, and the responsive local dashboard UI.
"""

from fastapi import FastAPI, HTTPException, Security, Depends, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import time
import os
import json

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
    title="Butler AI Master Companion Server",
    version="1.6.0",
    description="Zero-knowledge, local-first PC automation companion server with responsive dashboard UI and 12 proprietary subsystems."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize subsystems
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

class ScriptPayload(BaseModel):
    script_name: str
    code: str

class FeedbackPayload(BaseModel):
    signal_type: str
    topic: str
    correction: str

@app.get("/", response_class=HTMLResponse)
def root_dashboard():
    dashboard_path = "/home/ubuntu/preserved_60mb/server/butler_dashboard_template.html"
    if os.path.exists(dashboard_path):
        with open(dashboard_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Butler AI Master Server Online</h1>"

@app.get("/api/status")
def api_status():
    return {
        "status": "ONLINE",
        "service": "Butler AI Master Companion Server",
        "version": "1.6.0",
        "rules": BUTLER_RULES,
        "observatory_snapshot": observatory.get_observatory_snapshot()
    }

@app.get("/rules")
def get_rules():
    return {"rules": BUTLER_RULES}

@app.post("/vault/unlock")
def unlock_vault(pin: str = Field(..., min_length=6)):
    res = vault.unlock_vault(pin)
    return res

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
    observatory.push_event("LEARNING", f"Learned new preference for {payload.topic}")
    return res

@app.post("/recovery/panic")
def panic_shutdown():
    return recovery_governor.emergency_panic_shutdown()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
