"""Original Butler runtime mechanisms for integrity, truthfulness, and quiet failure."""
from __future__ import annotations
from dataclasses import dataclass
import hashlib
import json
from typing import Any, Mapping


def _digest(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


@dataclass(frozen=True)
class IntentShadow:
    ledger_id: str
    capability: str
    actor_id: str
    argument_digest: str
    trust_epoch: int

    @classmethod
    def create(cls, *, ledger_id: str, capability: str, actor_id: str, arguments: Mapping[str, Any], trust_epoch: int) -> "IntentShadow":
        if not ledger_id or not capability or not actor_id or trust_epoch < 1:
            raise ValueError("incomplete intent shadow")
        return cls(ledger_id, capability, actor_id, _digest(arguments), trust_epoch)

    def matches(self, *, capability: str, actor_id: str, arguments: Mapping[str, Any], trust_epoch: int) -> bool:
        return self.capability == capability and self.actor_id == actor_id and self.trust_epoch == trust_epoch and self.argument_digest == _digest(arguments)


@dataclass(frozen=True)
class FreshnessEnvelope:
    value: Any
    source: str
    collected_at_ms: int
    expires_at_ms: int
    confidence: str = "measured"

    def state(self, now_ms: int) -> str:
        if now_ms < self.collected_at_ms:
            return "clock_uncertain"
        if now_ms >= self.expires_at_ms:
            return "stale"
        return "fresh"

    def present(self, now_ms: int) -> dict[str, Any]:
        current = self.state(now_ms)
        return {"value": self.value if current == "fresh" else None, "source": self.source, "collectedAtMs": self.collected_at_ms, "expiresAtMs": self.expires_at_ms, "confidence": self.confidence, "state": current}


@dataclass(frozen=True)
class FailureGroup:
    fingerprint: str
    category: str
    count: int
    first_at_ms: int
    last_at_ms: int
    latest_detail: str


class QuietFailureAggregator:
    def __init__(self, *, window_ms: int = 30_000, max_groups: int = 128) -> None:
        self.window_ms = max(1_000, window_ms)
        self.max_groups = max(1, max_groups)
        self._groups: dict[str, FailureGroup] = {}

    def record(self, *, category: str, operation: str, detail: str, now_ms: int) -> FailureGroup:
        fingerprint = _digest({"category": category, "operation": operation, "detail": detail[:240]})[:24]
        old = self._groups.get(fingerprint)
        if old and now_ms - old.last_at_ms <= self.window_ms:
            group = FailureGroup(fingerprint, category, old.count + 1, old.first_at_ms, now_ms, detail[:240])
        else:
            group = FailureGroup(fingerprint, category, 1, now_ms, now_ms, detail[:240])
        self._groups[fingerprint] = group
        if len(self._groups) > self.max_groups:
            oldest = min(self._groups.values(), key=lambda item: item.last_at_ms)
            self._groups.pop(oldest.fingerprint, None)
        return group

    def flush(self, *, now_ms: int) -> list[FailureGroup]:
        ready = [group for group in self._groups.values() if now_ms - group.last_at_ms > self.window_ms]
        for group in ready:
            self._groups.pop(group.fingerprint, None)
        return sorted(ready, key=lambda item: item.first_at_ms)
