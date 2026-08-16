"""Butler Flow Ledger: deterministic authorization and receipt-chain primitives.

This module is deliberately side-effect free. HTTP handlers and executors must
call it before performing a side effect; they must not bypass it by constructing
an execution result directly.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid
from typing import Any, Mapping


class LedgerError(Exception):
    """Base error for fail-closed ledger violations."""


class StageError(LedgerError):
    pass


class ReplayError(LedgerError):
    pass


class IntegrityError(LedgerError):
    pass


class Stage(str, Enum):
    INTENT = "intent"
    SAFETY = "safety"
    APPROVAL = "approval"
    EXECUTION = "execution"
    RECEIPT = "receipt"


_NEXT_STAGE = {
    Stage.INTENT: Stage.SAFETY,
    Stage.SAFETY: Stage.APPROVAL,
    Stage.APPROVAL: Stage.EXECUTION,
    Stage.EXECUTION: Stage.RECEIPT,
}
_SECRET_KEYS = {"token", "authorization", "password", "secret", "api_key", "apikey", "private_key", "raw_audio", "script", "content"}


def _canonical(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value: Any) -> str:
    return hashlib.sha256(_canonical(value)).hexdigest()


def _redact(value: Any, key: str = "") -> Any:
    if key.lower() in _SECRET_KEYS or any(part in key.lower() for part in ("token", "password", "secret", "credential")):
        return "<redacted>"
    if isinstance(value, Mapping):
        return {str(k): _redact(v, str(k)) for k, v in value.items()}
    if isinstance(value, list):
        return [_redact(v, key) for v in value[:32]]
    if isinstance(value, tuple):
        return [_redact(v, key) for v in value[:32]]
    if isinstance(value, str):
        return value[:240]
    return value


@dataclass(frozen=True)
class Approval:
    approval_id: str
    ledger_id: str
    intent_digest: str
    actor_id: str
    capability: str
    expires_at_ms: int
    nonce: str


class FlowLedger:
    """In-memory ledger primitive; production adapters persist immutable events."""

    def __init__(self, *, now_ms: callable | None = None, clock_skew_ms: int = 30_000, signing_secret: bytes | None = None) -> None:
        self._now_ms = now_ms or (lambda: int(time.time() * 1000))
        self.clock_skew_ms = max(0, clock_skew_ms)
        self._signing_secret = signing_secret or secrets.token_bytes(32)
        self._events: dict[str, list[dict[str, Any]]] = {}
        self._used_approvals: set[str] = set()

    def _append(self, ledger_id: str, stage: Stage, payload: Mapping[str, Any], *, actor_id: str, parent_receipt_id: str | None = None) -> dict[str, Any]:
        events = self._events.setdefault(ledger_id, [])
        previous_hash = events[-1]["event_hash"] if events else "0" * 64
        redacted = _redact(dict(payload))
        event = {
            "receipt_id": str(uuid.uuid4()),
            "ledger_id": ledger_id,
            "stage": stage.value,
            "actor_id": actor_id,
            "created_at_ms": int(self._now_ms()),
            "payload_digest": digest(payload),
            "payload": redacted,
            "previous_hash": previous_hash,
            "parent_receipt_id": parent_receipt_id,
        }
        event["event_hash"] = hashlib.sha256(_canonical(event)).hexdigest()
        events.append(event)
        return dict(event)

    def begin_intent(self, *, actor_id: str, capability: str, request: Mapping[str, Any], ledger_id: str | None = None) -> dict[str, Any]:
        if not actor_id or not capability or not isinstance(request, Mapping):
            raise LedgerError("intent requires actor, capability, and structured request")
        lid = ledger_id or str(uuid.uuid4())
        return self._append(lid, Stage.INTENT, {"capability": capability, "request": dict(request)}, actor_id=actor_id)

    def record_safety(self, intent: Mapping[str, Any], *, actor_id: str, decision: str, policy_version: str, reasons: list[str] | None = None, resource_budget: Mapping[str, Any] | None = None) -> dict[str, Any]:
        self._require_last(intent, Stage.INTENT)
        if actor_id != intent.get("actor_id"):
            raise IntegrityError("safety actor does not match intent actor")
        if decision not in {"allow", "deny", "review"} or not policy_version:
            raise StageError("safety decision or policy version is invalid")
        event = self._append(intent["ledger_id"], Stage.SAFETY, {"decision": decision, "policy_version": policy_version, "reasons": reasons or [], "resource_budget": resource_budget or {}, "intent_digest": intent["payload_digest"]}, actor_id=actor_id, parent_receipt_id=intent["receipt_id"])
        if decision != "allow":
            return event
        return event

    def approve(self, safety: Mapping[str, Any], *, actor_id: str, capability: str, intent_digest: str, ttl_ms: int = 120_000) -> tuple[dict[str, Any], Approval]:
        self._require_last(safety, Stage.SAFETY)
        if safety["payload"].get("decision") != "allow":
            raise StageError("approval cannot follow denied or review safety result")
        if actor_id != safety.get("actor_id"):
            raise IntegrityError("approval actor does not match safety actor")
        if intent_digest != safety["payload"].get("intent_digest"):
            raise IntegrityError("approval intent digest does not match safety intent")
        if not actor_id or not capability or not intent_digest or ttl_ms <= 0 or ttl_ms > 900_000:
            raise StageError("approval bounds are invalid")
        approval = Approval(str(uuid.uuid4()), safety["ledger_id"], intent_digest, actor_id, capability, int(self._now_ms()) + ttl_ms, secrets.token_urlsafe(24))
        event = self._append(safety["ledger_id"], Stage.APPROVAL, {"approval_id": approval.approval_id, "intent_digest": intent_digest, "capability": capability, "expires_at_ms": approval.expires_at_ms, "nonce_digest": digest(approval.nonce)}, actor_id=actor_id, parent_receipt_id=safety["receipt_id"])
        return event, approval

    def approval_token(self, approval: Approval) -> str:
        body = {"approval_id": approval.approval_id, "ledger_id": approval.ledger_id, "intent_digest": approval.intent_digest, "actor_id": approval.actor_id, "capability": approval.capability, "expires_at_ms": approval.expires_at_ms, "nonce": approval.nonce}
        encoded = base64.urlsafe_b64encode(_canonical(body)).decode("ascii").rstrip("=")
        signature = hmac.new(self._signing_secret, encoded.encode("ascii"), hashlib.sha256).hexdigest()
        return f"{encoded}.{signature}"

    def approval_from_token(self, token: str) -> Approval:
        try:
            encoded, signature = token.split(".", 1)
            expected = hmac.new(self._signing_secret, encoded.encode("ascii"), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(signature, expected):
                raise IntegrityError("approval token signature mismatch")
            padded = encoded + "=" * (-len(encoded) % 4)
            body = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
            return Approval(str(body["approval_id"]), str(body["ledger_id"]), str(body["intent_digest"]), str(body["actor_id"]), str(body["capability"]), int(body["expires_at_ms"]), str(body["nonce"]))
        except IntegrityError:
            raise
        except Exception as exc:
            raise IntegrityError("malformed approval token") from exc

    def execute(self, approval_event: Mapping[str, Any], approval: Approval, *, actor_id: str, capability: str, intent_digest: str, result: Mapping[str, Any], retry: bool = False) -> dict[str, Any]:
        if approval.nonce in self._used_approvals:
            raise ReplayError("approval has already been consumed")
        self._require_last(approval_event, Stage.APPROVAL)
        now = int(self._now_ms())
        if now > approval.expires_at_ms + self.clock_skew_ms:
            raise ReplayError("approval expired")
        if not hmac.compare_digest(approval.ledger_id, approval_event["ledger_id"]) or approval.actor_id != actor_id or approval.capability != capability or approval.intent_digest != intent_digest:
            raise IntegrityError("approval binding mismatch")
        self._used_approvals.add(approval.nonce)
        return self._append(approval_event["ledger_id"], Stage.EXECUTION, {"capability": capability, "intent_digest": intent_digest, "retry": bool(retry), "result_digest": digest(result)}, actor_id=actor_id, parent_receipt_id=approval_event["receipt_id"])

    def receipt(self, execution: Mapping[str, Any], *, actor_id: str, outcome: str, resource_summary: Mapping[str, Any] | None = None, deletion_status: str = "not_applicable") -> dict[str, Any]:
        self._require_last(execution, Stage.EXECUTION)
        if outcome not in {"succeeded", "failed", "cancelled", "rejected"}:
            raise StageError("invalid terminal outcome")
        return self._append(execution["ledger_id"], Stage.RECEIPT, {"outcome": outcome, "resource_summary": resource_summary or {}, "deletion_status": deletion_status}, actor_id=actor_id, parent_receipt_id=execution["receipt_id"])

    def verify(self, ledger_id: str) -> bool:
        events = self._events.get(ledger_id, [])
        previous = "0" * 64
        for event in events:
            if event["previous_hash"] != previous:
                raise IntegrityError("receipt chain predecessor mismatch")
            stored = event["event_hash"]
            unsigned = dict(event)
            unsigned.pop("event_hash", None)
            if not hmac.compare_digest(stored, hashlib.sha256(_canonical(unsigned)).hexdigest()):
                raise IntegrityError("receipt event hash mismatch")
            previous = stored
        return bool(events)

    def events(self, ledger_id: str) -> list[dict[str, Any]]:
        return [dict(e) for e in self._events.get(ledger_id, [])]

    def event_for(self, ledger_id: str, stage: Stage) -> dict[str, Any] | None:
        for event in self._events.get(ledger_id, []):
            if event.get("stage") == stage.value:
                return dict(event)
        return None

    def _require_last(self, event: Mapping[str, Any], expected: Stage) -> None:
        ledger_id = event.get("ledger_id")
        events = self._events.get(ledger_id, [])
        if not events or events[-1]["receipt_id"] != event.get("receipt_id") or event.get("stage") != expected.value:
            raise StageError(f"expected current {expected.value} event")
