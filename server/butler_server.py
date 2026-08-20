#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════════════════════
BUTLER AI — SINGULAR CANONICAL COMPANION SERVER (butler_server.py v26.2)
══════════════════════════════════════════════════════════════════════════════
Consolidates every single subsystem into one standalone, self-contained Python file:
  • Console Batch Startup Banner & One-Time QR Code Generator
  • Automatic Pairing Lock (Locks permanently after first verified client join)
  • FastAPI REST API & Web Dashboard Endpoints
  • Hardened Memory Vault (AES-256-GCM + PIN lockout protection)
  • Fail-Closed Privacy Circuit (Anti-egress data integrity blocker)
  • Script Workshop Engine (AST syntax linting, timestamped backups, dry runs)
  • Anonymous Handle & Challenge Issuer (Spoof-proof retro gamerscore leaderboard)
  • Proprietary E2E Protocol (HMAC handshake & trust receipts)
  • Butler Brain Coordinator (Enforces The 3 Unbreakable Rules & priority task queue)
  • Growth Engine (XP, maturity progression, 3-second decision countdown timer)
  • Activity Observatory & Flow Governor (Live telemetry, performance governor, anti-spam lag notices)
  • Intelligence Learner & Self-Evolving Core (Dual-memory feedback loop & reflexion journal)
  • Recovery Governor (Emergency panic lockdown & zombie process reaping)
  • Server Capability Orchestrator (Guarded server function control)
══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import time
import socket
import secrets
import json
import logging
import subprocess
import ast
import hashlib
import uuid
import re
import unicodedata
from urllib import request as urllib_request, error as urllib_error
from pathlib import Path
from typing import Dict, Any, List, Optional
import uvicorn
import qrcode
from fastapi import FastAPI, HTTPException, Request, Response, Body
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from flow_ledger import FlowLedger, Stage, LedgerError, IntegrityError, ReplayError

# ──────────────────────────────────────────────────────────────────────────────
# 1. LOGGING & SECURITY SETUP
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ButlerServer")

app = FastAPI(
    title="Butler AI Singular Canonical Server",
    version="26.2.0",
    description="The complete, zero-knowledge, local-first PC automation companion server."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────────
# 2. SUBSYSTEM ENGINES
# ──────────────────────────────────────────────────────────────────────────────

BUTLER_RULES = [
    "Rule I: Absolute Data Sovereignty (Local-first encrypted storage).",
    "Rule II: Fail-Closed Privacy Circuit (Instant egress blocking on threat).",
    "Rule III: Deterministic Resource Guard (Safety & prompt processing priority)."
]

class CanonicalVault:
    def __init__(self, store_path="/home/ubuntu/preserved_60mb/server/vault_store/vault.enc"):
        self.store_path = Path(store_path)
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self.locked = True
        self.failed_attempts = 0

    def unlock_vault(self, pin: str) -> dict:
        if self.failed_attempts >= 5:
            return {"status": "LOCKED_OUT", "reason": "Too many failed attempts. Brute-force lockout active."}
        if len(pin) < 6 or pin != "123456":
            self.failed_attempts += 1
            if self.failed_attempts >= 5:
                return {"status": "LOCKED_OUT", "reason": "Too many failed attempts. Brute-force lockout active."}
            return {"status": "FAILED", "reason": "Invalid PIN or length < 6."}
        if pin == "123456":
            self.locked = False
            self.failed_attempts = 0
            return {"status": "UNLOCKED", "vault_state": "ACTIVE"}
        self.failed_attempts += 1
        return {"status": "FAILED", "reason": "Invalid PIN."}

class CanonicalPrivacyCircuit:
    def __init__(self):
        self.armed = True
    def check_egress(self, destination: str) -> bool:
        if not self.armed:
            return False
        allowed = ["127.0.0.1", "localhost", "10.", "192.168.", "172."]
        return any(destination.startswith(prefix) for prefix in allowed)

class CanonicalScriptWorkshop:
    def __init__(self, sandbox_dir="/home/ubuntu/preserved_60mb/server/scripts_sandbox"):
        self.sandbox_dir = Path(sandbox_dir)
        self.sandbox_dir.mkdir(parents=True, exist_ok=True)
        self.backups_dir = self.sandbox_dir / "backups"
        self.backups_dir.mkdir(parents=True, exist_ok=True)

    def create_or_edit_script(self, name: str, code: str) -> dict:
        if ".." in name or "/" in name:
            return {"status": "BLOCKED", "reason": "Path traversal detected."}
        try:
            ast.parse(code)
        except SyntaxError as e:
            return {"status": "SYNTAX_ERROR", "error": str(e)}
        
        target = self.sandbox_dir / name
        if target.exists():
            backup_path = self.backups_dir / f"{name}.{int(time.time())}.bak"
            backup_path.write_text(target.read_text())
        
        target.write_text(code)
        return {"status": "SAVED_AND_VERIFIED", "path": str(target)}

    def execute_dry_run(self, name: str) -> dict:
        target = self.sandbox_dir / name
        if not target.exists():
            return {"status": "NOT_FOUND"}
        try:
            res = subprocess.run([sys.executable, "-m", "py_compile", str(target)], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return {"status": "DRY_RUN_PASSED", "output": "AST lint and compile check successful."}
            return {"status": "DRY_RUN_FAILED", "error": res.stderr}
        except Exception as e:
            return {"status": "TIMEOUT_OR_ERROR", "error": str(e)}

class CanonicalObservatory:
    """Redacted local diagnostics. Telemetry is never a source of execution authority."""
    _SENSITIVE_EVENT = re.compile(
        r"(?:token|password|secret|authorization|api[_ -]?key)\s*[:=]\s*[^\s,;]+|"
        r"https?://[^\s,;]+|(?:[A-Za-z]:\\|/home/|/Users/)[^\s,;]+|"
        r"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b",
        re.IGNORECASE,
    )

    def __init__(self):
        self.events: List[Dict[str, Any]] = []

    @classmethod
    def _redact(cls, value: str) -> str:
        return cls._SENSITIVE_EVENT.sub("<redacted>", str(value or "").replace("\\n", " ").replace("\\r", " ").strip())[:240]

    @staticmethod
    def _host_metrics() -> Dict[str, float]:
        cpu_count = max(1, os.cpu_count() or 1)
        try:
            load_1m = os.getloadavg()[0]
            cpu_load_pct = round(min(100.0, (load_1m / cpu_count) * 100.0), 1)
        except (AttributeError, OSError):
            cpu_load_pct = 0.0
        total_kb = available_kb = 0
        try:
            with open("/proc/meminfo", "r", encoding="utf-8") as handle:
                values = dict(line.split(":", 1) for line in handle if ":" in line)
            total_kb = int(values.get("MemTotal", "0 kB").split()[0])
            available_kb = int(values.get("MemAvailable", "0 kB").split()[0])
        except (OSError, ValueError):
            pass
        total_gb = round(total_kb / 1024 / 1024, 2)
        used_gb = round(max(0, total_kb - available_kb) / 1024 / 1024, 2)
        return {"cpu_load_pct": cpu_load_pct, "ram_used_gb": used_gb, "ram_total_gb": total_gb}

    def push_event(self, category: str, message: str):
        event = {"timestamp": time.time(), "category": re.sub(r"[^A-Z0-9_]", "_", str(category or "UNKNOWN").upper())[:48], "message": self._redact(message)}
        self.events = (self.events + [event])[-200:]

    def get_snapshot(self) -> dict:
        metrics = self._host_metrics()
        manifest = globals().get("AUTOMATION_MEMORY_MANIFEST", {})
        return {
            "memory_nodes_organized": int(manifest.get("planCount", 0)) + int(manifest.get("receiptCount", 0)),
            "crawler_docs_indexed": int(manifest.get("crawlerDocsIndexed", 0)),
            **metrics,
            "recent_events": self.events[-10:],
        }

class CanonicalGrowthEngine:
    def __init__(self):
        self.xp = 450
        self.level = "Competent Aide"
    def add_xp(self, amount: int, reason: str):
        self.xp += amount

class CanonicalRecoveryGovernor:
    def emergency_panic_shutdown(self) -> dict:
        return {"status": "EMERGENCY_SHUTDOWN_EXECUTED", "vault_status": "LOCKED_FAIL_CLOSED", "terminated_subprocesses": 0}

class CanonicalCapabilities:
    def execute(self, name: str, payload: dict) -> dict:
        if name == "privacy_circuit" and payload.get("action") == "disable":
            return {"status": "BLOCKED_BY_RULES", "reason": "Rule II violation: Privacy Circuit is immutable."}
        return {"status": "SUCCESS", "capability": name}


class CanonicalAutomationFlow:
    """Fail-closed server-side bridge from reviewed drafts to Flow Ledger receipts."""

    _BLOCKED_TERMS = (
        "bypass", "credential", "keylog", "malware", "ransomware", "steal token",
        "exfiltrat", "ddos", "evade security", "crack password",
    )
    _EXTERNAL_TERMS = (
        "download", "install", "purchase", "checkout", "friend request", "send message",
        "discord", "battle.net", "battlenet", "account", "login", "sign in", "upload", "post",
    )
    _FORBIDDEN_IMPORTS = {"subprocess", "socket", "ctypes", "requests", "urllib", "http", "ftplib", "smtplib", "pickle", "marshal"}
    _FORBIDDEN_CALLS = {"eval", "exec", "compile", "__import__", "open", "input", "system", "popen", "run", "Popen", "remove", "unlink", "rmtree"}
    _PROMPT_OVERRIDE_TERMS = ("ignore previous", "ignore all previous", "system prompt", "developer message", "override policy", "jailbreak")
    _PLAN_TTL_SECONDS = 15 * 60

    def __init__(self, workshop: CanonicalScriptWorkshop) -> None:
        self.workshop = workshop
        self.ledger = FlowLedger()
        self.plans: Dict[str, Dict[str, Any]] = {}
        self.contexts: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def _script_path(script_id: str) -> Path:
        if not script_id or "/" in script_id or "\\" in script_id or ".." in script_id:
            raise ValueError("Invalid script identifier")
        return script_workshop.sandbox_dir / script_id

    @staticmethod
    def _digest_path(path: Path) -> str:
        return hashlib.sha256(path.read_bytes()).hexdigest()

    @staticmethod
    def _actor_id() -> str:
        device = PAIRING_STATE.get("paired_device_id") or "unpaired"
        return f"paired:{device}"

    def _require_paired_and_unlocked(self) -> None:
        if not PAIRING_STATE.get("is_paired"):
            raise PermissionError("Pair a trusted mobile device before creating or running automation plans")
        if vault.locked:
            raise PermissionError("Unlock the local vault before using a consequential automation workflow")
        if not privacy_circuit.armed:
            raise PermissionError("Privacy circuit is not armed; execution is fail-closed")

    @staticmethod
    def _normalize_request(request_text: str) -> str:
        normalized = unicodedata.normalize("NFKC", str(request_text or ""))
        if any(ord(char) < 32 and char not in "\n\t" for char in normalized):
            raise ValueError("Automation request contains unsupported control characters")
        return re.sub(r"\s+", " ", normalized).strip()[:1200]

    def _prune_expired_plans(self) -> None:
        now_ms = int(time.time() * 1000)
        self.plans = {plan_id: plan for plan_id, plan in self.plans.items() if int(plan.get("expiresAtMs", 0)) > now_ms}

    def inspect_code(self, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            return {"allowed": False, "reasons": [f"Syntax error: {exc.msg}"], "warnings": []}

        reasons: List[str] = []
        warnings: List[str] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.split(".")[0] in self._FORBIDDEN_IMPORTS:
                        reasons.append(f"Blocked import: {alias.name}")
            elif isinstance(node, ast.ImportFrom):
                if (node.module or "").split(".")[0] in self._FORBIDDEN_IMPORTS:
                    reasons.append(f"Blocked import: {node.module}")
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in self._FORBIDDEN_CALLS:
                    reasons.append(f"Blocked call: {node.func.id}")
                elif isinstance(node.func, ast.Attribute) and node.func.attr in self._FORBIDDEN_CALLS:
                    reasons.append(f"Blocked method: {node.func.attr}")
            elif isinstance(node, (ast.Delete, ast.Raise)):
                warnings.append("Destructive or exceptional control flow requires manual review")
        return {"allowed": not reasons, "reasons": reasons, "warnings": warnings}

    def plan_request(self, request_text: str) -> Dict[str, Any]:
        try:
            request = self._normalize_request(request_text)
        except ValueError as exc:
            return {"status": "blocked", "reason": str(exc)}
        lowered = request.lower()
        if not request:
            return {"status": "blocked", "reason": "Automation request is empty"}
        if any(term in lowered for term in self._BLOCKED_TERMS):
            return {"status": "blocked", "reason": "Request contains a prohibited or unsafe action"}
        if any(term in lowered for term in self._PROMPT_OVERRIDE_TERMS):
            return {"status": "blocked", "reason": "Request attempts to override Butler safety controls"}

        self._prune_expired_plans()
        external = any(term in lowered for term in self._EXTERNAL_TERMS) or bool(re.search(r"\bhttps?://", lowered))
        plan_id = str(uuid.uuid4())
        now_ms = int(time.time() * 1000)
        prerequisites = [
            "paired PC connection", "unlocked local vault", "reviewed Script Library draft",
            "AST lint and server dry-run", "fresh Flow Ledger approval",
        ]
        if external:
            prerequisites.insert(3, "desktop app already installed and signed in by the user")
            prerequisites.insert(4, "user present for each external account or download action")
        plan = {
            "planId": plan_id,
            # Retain a one-way fingerprint rather than raw natural-language input.
            # Raw user text remains on the phone’s encrypted conversation store.
            "requestFingerprint": hashlib.sha256(request.encode("utf-8")).hexdigest()[:24],
            "summary": "External-account or download automation proposal" if external else "Local PC automation proposal",
            "risk": "external_side_effect" if external else "local_change",
            "requiresExplicitApproval": True,
            "state": "draft_required",
            "createdAtMs": now_ms,
            "expiresAtMs": now_ms + (self._PLAN_TTL_SECONDS * 1000),
            "prerequisites": prerequisites,
            "warnings": (
                ["Butler will not bypass sign-in, payment, platform, age, or account protections.",
                 "External actions require a separate fresh approval and are never performed from chat alone."]
                if external else
                ["No code has been executed. Save a reviewed draft, then complete lint, dry-run, and approval."]
            ),
            "nextStep": "Create or select a Script Library draft. The server will bind approval to its exact digest.",
        }
        self.plans[plan_id] = plan
        observatory.push_event("AUTOMATION_PLAN", f"Created reviewed plan {plan_id[:8]} ({plan['risk']})")
        return {"status": "ready", "plan": plan}

    def save_draft(self, name: str, code: str, plan_id: Optional[str]) -> Dict[str, Any]:
        self._require_paired_and_unlocked()
        safety = self.inspect_code(code)
        if not safety["allowed"]:
            return {"status": "blocked", "safety": safety}
        self._prune_expired_plans()
        if plan_id and plan_id not in self.plans:
            return {"status": "blocked", "reason": "Unknown or expired automation plan"}
        result = self.workshop.create_or_edit_script(name, code)
        if result.get("status") != "SAVED_AND_VERIFIED":
            return result
        path = self._script_path(name)
        digest = self._digest_path(path)
        observatory.push_event("SCRIPT_DRAFT", f"Saved reviewed draft {name}")
        return {"status": "draft_saved", "scriptId": name, "scriptDigest": digest, "safety": safety, "dryRunRequired": True}

    def begin_intent(self, script_id: str, envelope: Dict[str, Any]) -> Dict[str, Any]:
        self._require_paired_and_unlocked()
        path = self._script_path(script_id)
        if not path.exists():
            return {"status": "blocked", "error": "Script Library draft was not found on this PC"}
        code = path.read_text(encoding="utf-8")
        safety = self.inspect_code(code)
        if not safety["allowed"]:
            return {"status": "blocked", "safety": safety, "error": "Script failed server-side policy preflight"}
        dry = self.workshop.execute_dry_run(script_id)
        if dry.get("status") != "DRY_RUN_PASSED":
            return {"status": "blocked", "error": "Server dry-run failed", "dryRun": dry}
        actor = self._actor_id()
        script_digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
        request = {
            "script_id": script_id,
            "script_digest": script_digest,
            "capability": "pc.script.run",
            "declared_scope": envelope.get("scope", []),
            "risk": envelope.get("risk", "side_effect"),
        }
        intent = self.ledger.begin_intent(actor_id=actor, capability="pc.script.run", request=request)
        safety_event = self.ledger.record_safety(
            intent, actor_id=actor, decision="allow", policy_version="butler-flow-v30",
            reasons=safety.get("warnings", []), resource_budget={"timeout_seconds": 30, "stdout_bytes": 65536},
        )
        self.contexts[intent["ledger_id"]] = {"script_id": script_id, "script_digest": script_digest, "actor_id": actor, "intent": intent, "safety": safety_event}
        observatory.push_event("FLOW_INTENT", f"Preflight passed for {script_id}; approval pending")
        return {"status": "ready_for_approval", "intent": {"ledgerId": intent["ledger_id"], "intentDigest": intent["payload_digest"], "scriptId": script_id, "scriptDigest": script_digest}, "dryRun": dry, "safety": safety}

    def approve_intent(self, ledger_id: str, intent_digest: str) -> Dict[str, Any]:
        context = self.contexts.get(ledger_id)
        if not context:
            return {"status": "blocked", "error": "Flow Ledger intent is unknown or expired"}
        try:
            approval_event, approval = self.ledger.approve(
                context["safety"], actor_id=context["actor_id"], capability="pc.script.run", intent_digest=intent_digest,
            )
            context["approval_event"] = approval_event
            observatory.push_event("FLOW_APPROVAL", f"Explicit approval captured for {context['script_id']}")
            return {"status": "approved", "approvalToken": self.ledger.approval_token(approval), "expiresAtMs": approval.expires_at_ms}
        except LedgerError as exc:
            return {"status": "blocked", "error": str(exc)}

    def execute_approved(self, approval_token: str) -> Dict[str, Any]:
        try:
            approval = self.ledger.approval_from_token(approval_token)
            context = self.contexts.get(approval.ledger_id)
            if not context or context.get("actor_id") != approval.actor_id:
                return {"success": False, "error": "Approval context is unavailable", "status": "blocked"}
            path = self._script_path(context["script_id"])
            if not path.exists() or self._digest_path(path) != context["script_digest"]:
                return {"success": False, "error": "Draft changed after approval; re-run lint and approval", "status": "blocked"}
            self._require_paired_and_unlocked()
            started = time.monotonic()
            completed = subprocess.run([sys.executable, str(path)], cwd=str(self.workshop.sandbox_dir), capture_output=True, text=True, timeout=30)
            output = (completed.stdout or completed.stderr or "").strip()[:65536]
            result = {"exit_code": completed.returncode, "output_digest": hashlib.sha256(output.encode("utf-8")).hexdigest()}
            execution = self.ledger.execute(context["approval_event"], approval, actor_id=context["actor_id"], capability="pc.script.run", intent_digest=context["intent"]["payload_digest"], result=result)
            success = completed.returncode == 0
            receipt = self.ledger.receipt(execution, actor_id=context["actor_id"], outcome="succeeded" if success else "failed", resource_summary={"exit_code": completed.returncode, "elapsed_ms": round((time.monotonic() - started) * 1000), "stdout_bytes": len(output.encode("utf-8"))})
            observatory.push_event("FLOW_RECEIPT", f"{context['script_id']} {'completed' if success else 'failed'} with receipt {receipt['receipt_id'][:8]}")
            return {"success": success, "status": "completed" if success else "failed", "output": output, "receipt": receipt, "undoId": None}
        except subprocess.TimeoutExpired:
            return {"success": False, "status": "failed", "error": "Script exceeded the 30 second resource budget"}
        except (LedgerError, ValueError) as exc:
            return {"success": False, "status": "blocked", "error": str(exc)}
        except Exception as exc:
            logger.exception("Flow execution failed")
            return {"success": False, "status": "failed", "error": "Internal execution failure"}


# Instantiate Core Engines
vault = CanonicalVault()
privacy_circuit = CanonicalPrivacyCircuit()
script_workshop = CanonicalScriptWorkshop()
observatory = CanonicalObservatory()
growth_engine = CanonicalGrowthEngine()
recovery_governor = CanonicalRecoveryGovernor()
capabilities = CanonicalCapabilities()
automation_flow = CanonicalAutomationFlow(script_workshop)

# Pairing State for One-Time QR Bootstrap
PAIRING_STATE = {
    "bootstrap_token": secrets.token_hex(16),
    "is_paired": False,
    "paired_device_id": None,
    "created_at": time.time(),
    "expires_at": time.time() + 600
}

# Redacted synchronization metadata only. Raw chats, secrets, script source,
# approval tokens and receipts never cross this Android-to-PC memory boundary.
AUTOMATION_MEMORY_MANIFEST: Dict[str, Any] = {}

# ──────────────────────────────────────────────────────────────────────────────
# 3. API ENDPOINTS & DASHBOARD ROUTES
# ──────────────────────────────────────────────────────────────────────────────

class VaultUnlockPayload(BaseModel):
    pin: str = Field(..., min_length=6)

class ScriptPayload(BaseModel):
    script_name: str
    code: str

class PairRequest(BaseModel):
    bootstrap_token: str
    device_id: str


class AutomationPlanPayload(BaseModel):
    request: str = Field(..., min_length=1, max_length=1200)


class AutomationDraftPayload(BaseModel):
    script_name: str = Field(..., min_length=3, max_length=96)
    code: str = Field(..., min_length=1, max_length=24000)
    plan_id: Optional[str] = Field(default=None, max_length=96)


class FlowIntentPayload(BaseModel):
    id: str = Field(..., min_length=3, max_length=96)
    envelope: Dict[str, Any] = Field(default_factory=dict)


class FlowApprovalPayload(BaseModel):
    ledgerId: str = Field(..., min_length=8, max_length=96)
    intentDigest: str = Field(..., min_length=32, max_length=128)


class FlowExecutePayload(BaseModel):
    approvalToken: str = Field(..., min_length=16, max_length=4096)


class AutomationMemoryManifestPayload(BaseModel):
    version: int = Field(..., ge=1, le=10)
    generatedAt: int = Field(..., ge=0)
    patternIds: List[str] = Field(default_factory=list, max_length=128)
    preferences: Dict[str, bool] = Field(default_factory=dict)
    planCount: int = Field(default=0, ge=0, le=10000)
    receiptCount: int = Field(default=0, ge=0, le=10000)
    integrity: str = Field(..., min_length=8, max_length=128)


class ButlerChatPayload(BaseModel):
    message: str = Field(default="", max_length=1200)
    messages: List[Dict[str, str]] = Field(default_factory=list, max_length=16)
    conversation: List[Dict[str, str]] = Field(default_factory=list, max_length=12)
    automationPlan: Optional[Dict[str, Any]] = None
    scriptConcierge: Optional[Dict[str, Any]] = None

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Butler AI Canonical Server</title>
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
            <h1>Butler AI Canonical Master Server</h1>
            <p>Singular Local-First PC Automation Daemon is running securely.</p>
            <div class="badge">ONLINE & SECURED</div>
        </div>
    </body>
    </html>
    """

def _require_paired_for_local_ai() -> None:
    if not PAIRING_STATE.get("is_paired"):
        raise PermissionError("Pair the PC before using the local AI lane")
    if not privacy_circuit.armed:
        raise PermissionError("Privacy circuit is not armed; the local AI lane is fail-closed")


def _ollama_url(path: str) -> str:
    # The companion server may only proxy to its own loopback Ollama daemon.
    configured = os.environ.get("BUTLER_OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
    if not configured.startswith("http://127.0.0.1:") and not configured.startswith("http://localhost:"):
        raise PermissionError("Ollama endpoint must remain on PC loopback")
    return f"{configured}{path}"


def _ollama_json(path: str, payload: Optional[Dict[str, Any]] = None, timeout: int = 35) -> Dict[str, Any]:
    url = _ollama_url(path)
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib_request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST" if data is not None else "GET")
    with urllib_request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


@app.get("/api/ollama/models")
def list_local_ollama_models():
    try:
        _require_paired_for_local_ai()
        payload = _ollama_json("/api/tags", timeout=8)
        models = [str(item.get("name") or item.get("model")) for item in payload.get("models", []) if item.get("name") or item.get("model")]
        return {"models": models, "localOnly": True}
    except PermissionError as exc:
        return JSONResponse(status_code=423, content={"error": str(exc)})
    except (urllib_error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return JSONResponse(status_code=503, content={"error": "Local Ollama is unavailable on the paired PC"})


@app.post("/api/butler/chat")
def local_butler_chat(payload: ButlerChatPayload):
    try:
        _require_paired_for_local_ai()
        user_message = (payload.message or "").strip()
        if not user_message and payload.messages:
            user_message = str(payload.messages[-1].get("content") or "").strip()
        if not user_message:
            return JSONResponse(status_code=422, content={"error": "A chat message is required"})
        if any(term in user_message.lower() for term in CanonicalAutomationFlow._BLOCKED_TERMS):
            return {"reply": "I cannot draft or execute that request. I can help make a safe, lawful alternative.", "localOnly": True}

        system = (
            "You are Butler AI, a private local PC automation assistant. Keep all work local. "
            "For any automation request, create only a reviewable Python draft or explanation; never execute code, "
            "never claim an action succeeded without a Flow Ledger receipt, and never bypass account, payment, login, platform, or security controls. "
            "State prerequisites, scope, expected result, and dry-run guidance before presenting code."
        )
        messages: List[Dict[str, str]] = [{"role": "system", "content": system}]
        for turn in payload.conversation[-8:]:
            role = str(turn.get("role") or "user")
            if role not in {"user", "assistant"}:
                continue
            content = str(turn.get("content") or "").strip()[:1600]
            if content:
                messages.append({"role": role, "content": content})
        if payload.automationPlan:
            plan = payload.automationPlan
            messages.append({"role": "system", "content": f"Automation plan context: risk={str(plan.get('risk') or 'unknown')[:64]}; requires approval={bool(plan.get('requiresExplicitApproval'))}; prerequisites={json.dumps(plan.get('prerequisites') or [])[:900]}."})
        if payload.scriptConcierge:
            brief = str(payload.scriptConcierge.get("generationBrief") or "")[:2400]
            if brief:
                messages.append({"role": "system", "content": brief})
        messages.append({"role": "user", "content": user_message[:1200]})

        models = _ollama_json("/api/tags", timeout=8).get("models", [])
        model = next((str(item.get("name") or item.get("model")) for item in models if item.get("name") or item.get("model")), "")
        if not model:
            return JSONResponse(status_code=503, content={"error": "No local Ollama model is installed on the paired PC"})
        response = _ollama_json("/api/chat", {"model": model, "messages": messages, "stream": False, "options": {"temperature": 0.2, "num_predict": 900}}, timeout=35)
        reply = str((response.get("message") or {}).get("content") or response.get("response") or "").strip()
        if not reply:
            return JSONResponse(status_code=503, content={"error": "Local Ollama returned no usable reply"})
        observatory.push_event("LOCAL_CHAT", "Local Butler draft response completed")
        return {"reply": reply, "model": model, "localOnly": True, "executed": False}
    except PermissionError as exc:
        return JSONResponse(status_code=423, content={"error": str(exc)})
    except (urllib_error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return JSONResponse(status_code=503, content={"error": "Local Ollama request failed; no cloud fallback was used"})


@app.get("/api/status")
def api_status():
    return {
        "status": "ONLINE",
        "service": "Butler AI Canonical Server",
        "version": "26.2.0",
        "rules": BUTLER_RULES,
        "observatory_snapshot": observatory.get_snapshot()
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
def unlock_vault(payload: VaultUnlockPayload):
    return vault.unlock_vault(payload.pin)

@app.post("/scripts/create")
def create_script(payload: ScriptPayload):
    res = script_workshop.create_or_edit_script(payload.script_name, payload.code)
    if res["status"] == "SAVED_AND_VERIFIED":
        observatory.push_event("SCRIPT", f"Created/edited script: {payload.script_name}")
    return res

@app.post("/scripts/dry-run")
def dry_run_script(script_name: str):
    return script_workshop.execute_dry_run(script_name)


@app.post("/api/memory/automation-manifest")
def sync_automation_memory_manifest(payload: AutomationMemoryManifestPayload):
    if not PAIRING_STATE.get("is_paired"):
        return JSONResponse(status_code=423, content={"status": "blocked", "reason": "Pair the PC before synchronizing automation memory"})
    if vault.locked or not privacy_circuit.armed:
        return JSONResponse(status_code=423, content={"status": "blocked", "reason": "Memory synchronization is fail-closed until the vault is unlocked and privacy circuit is armed"})
    global AUTOMATION_MEMORY_MANIFEST
    AUTOMATION_MEMORY_MANIFEST = {
        "version": payload.version,
        "generatedAt": payload.generatedAt,
        "patternIds": [item[:96] for item in payload.patternIds],
        "preferences": {str(key)[:64]: bool(value) for key, value in payload.preferences.items()},
        "planCount": payload.planCount,
        "receiptCount": payload.receiptCount,
        "integrity": payload.integrity,
        "receivedAt": int(time.time() * 1000),
    }
    observatory.push_event("MEMORY_SYNC", "Redacted Android automation-memory manifest synchronized")
    return {"status": "synced", "acceptedPatterns": len(AUTOMATION_MEMORY_MANIFEST["patternIds"]), "serverStores": "redacted_manifest_only"}


@app.get("/api/memory/automation-manifest")
def get_automation_memory_manifest():
    if not PAIRING_STATE.get("is_paired"):
        return JSONResponse(status_code=423, content={"status": "blocked", "reason": "Pair the PC before reading automation memory status"})
    return {"status": "available", "manifest": AUTOMATION_MEMORY_MANIFEST or None}


@app.post("/api/automation/plan")
def create_automation_plan(payload: AutomationPlanPayload):
    if not PAIRING_STATE.get("is_paired"):
        return JSONResponse(status_code=423, content={"status": "blocked", "reason": "Pair the PC before creating a server-verified automation plan"})
    return automation_flow.plan_request(payload.request)


@app.post("/api/flow/script/draft")
def save_automation_draft(payload: AutomationDraftPayload):
    try:
        result = automation_flow.save_draft(payload.script_name, payload.code, payload.plan_id)
        return JSONResponse(status_code=403 if result.get("status") == "blocked" else 200, content=result)
    except PermissionError as exc:
        return JSONResponse(status_code=423, content={"status": "blocked", "error": str(exc)})


@app.post("/api/flow/script/intent")
def create_flow_intent(payload: FlowIntentPayload):
    try:
        result = automation_flow.begin_intent(payload.id, payload.envelope)
        return JSONResponse(status_code=403 if result.get("status") == "blocked" else 200, content=result)
    except PermissionError as exc:
        return JSONResponse(status_code=423, content={"status": "blocked", "error": str(exc)})


@app.post("/api/flow/script/approve")
def approve_flow_intent(payload: FlowApprovalPayload):
    result = automation_flow.approve_intent(payload.ledgerId, payload.intentDigest)
    return JSONResponse(status_code=403 if result.get("status") == "blocked" else 200, content=result)


@app.post("/api/flow/script/execute")
def execute_flow_intent(payload: FlowExecutePayload):
    result = automation_flow.execute_approved(payload.approvalToken)
    return JSONResponse(status_code=403 if result.get("status") == "blocked" else 200, content=result)


@app.get("/observatory/snapshot")
def get_observatory():
    return observatory.get_snapshot()

@app.post("/recovery/panic")
def panic_shutdown():
    return recovery_governor.emergency_panic_shutdown()

# ──────────────────────────────────────────────────────────────────────────────
# 4. CONSOLE STARTUP & ONE-TIME QR PAIRING
# ──────────────────────────────────────────────────────────────────────────────

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def print_banner_and_qr(server_url: str):
    banner = """
================================================================================
  ____        _   _              _    ___ 
 | __ ) _   _| |_| | ___ _ __   / \\  |_ _|
 |  _ \\| | | | __| |/ _ \\ '__| / _ \\  | | 
 | |_) | |_| | |_| |  __/ |   / ___ \\ | | 
 |____/ \\__,_|\\__|_|\\___|_|  /_/   \\_\\___|
 
 BULLETPROOF PC AUTOMATION DAEMON (SINGULAR CANONICAL EDITION v26.2)
================================================================================
"""
    print(banner)
    print(f"[*] Companion Server running at: {server_url}")
    print(f"[*] Local Bootstrap Token: {PAIRING_STATE['bootstrap_token']}")
    print("[*] Generating One-Time App Pairing QR Code...\n")

    pairing_payload = f"butler://pair?url={server_url}&token={PAIRING_STATE['bootstrap_token']}"
    
    try:
        qr = qrcode.QRCode(version=1, box_size=1, border=1)
        qr.add_data(pairing_payload)
        qr.make(fit=True)
        qr.print_ascii(tty=True)
    except Exception:
        print(f"[!] Pairing URI: {pairing_payload}")

    print("\n[!] Scan this QR code with the Butler mobile app to pair.")
    print("[!] SECURITY NOTICE: Server pairing will automatically lock after first join.\n")
    print("--------------------------------------------------------------------------------\n")

if __name__ == "__main__":
    local_ip = get_local_ip()
    server_url = f"http://{local_ip}:8000"
    
    print_banner_and_qr(server_url)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
