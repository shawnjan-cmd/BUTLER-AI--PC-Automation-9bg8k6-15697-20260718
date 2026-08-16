"""Memory Trust Envelope for Butler's local-first memory boundary.

This module does not decide whether content is true. It decides whether a
candidate is eligible for durable retrieval based on provenance, actor,
policy epoch, sensitivity, and corroboration evidence. Crawler and procedural
entries are quarantined by default because untrusted content must not silently
become trusted instructions.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
import hashlib
import hmac
import json
import re
from typing import Any, Mapping

MAX_TEXT = 12_000
_SECRET = re.compile(r"(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|private[_ -]?key|seed phrase|mnemonic|authorization:\s*bearer)\s*[:=]", re.I)

SOURCE_CLASSES = {"user", "local_receipt", "local_observation", "pc_file", "crawler", "model_inference", "import"}
MEMORY_KINDS = {"fact", "preference", "experience", "procedure", "policy"}


@dataclass(frozen=True)
class TrustEnvelope:
    content_digest: str
    source_class: str
    source_id: str
    actor_id: str
    captured_at_ms: int
    policy_epoch: str
    kind: str
    sensitivity: str
    confidence: float
    user_approved: bool
    corroboration_count: int
    quarantined: bool
    eligible: bool
    reason: str

    def public_dict(self) -> dict[str, Any]:
        """Return metadata only; raw content is intentionally absent."""
        return asdict(self)


def content_digest(text: str) -> str:
    normalized = " ".join(str(text or "").split()).strip()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def envelope_mac(envelope: TrustEnvelope, key: bytes) -> str:
    payload = json.dumps(envelope.public_dict(), sort_keys=True, separators=(",", ":")).encode()
    return hmac.new(key, payload, hashlib.sha256).hexdigest()


def verify_envelope_mac(envelope: TrustEnvelope, mac: str, key: bytes) -> bool:
    return hmac.compare_digest(envelope_mac(envelope, key), str(mac or ""))


def build_envelope(
    *,
    text: str,
    source_class: str,
    source_id: str,
    actor_id: str,
    captured_at_ms: int,
    policy_epoch: str,
    kind: str,
    sensitivity: str = "personal",
    confidence: float = 0.0,
    user_approved: bool = False,
    corroboration_count: int = 0,
) -> TrustEnvelope:
    normalized = " ".join(str(text or "").split()).strip()[:MAX_TEXT]
    source_class = str(source_class or "").strip()
    kind = str(kind or "").strip()
    sensitivity = str(sensitivity or "personal").strip()
    confidence = float(confidence)
    corroboration_count = max(0, int(corroboration_count))
    reason = "eligible"
    quarantined = False
    eligible = True

    if not normalized:
        eligible, reason = False, "empty"
    elif source_class not in SOURCE_CLASSES:
        eligible, reason = False, "unknown_source_class"
    elif kind not in MEMORY_KINDS:
        eligible, reason = False, "unknown_memory_kind"
    elif not source_id or not actor_id or not policy_epoch:
        eligible, reason = False, "missing_provenance_fields"
    elif not isinstance(captured_at_ms, int) or captured_at_ms <= 0:
        eligible, reason = False, "invalid_capture_time"
    elif not 0.0 <= confidence <= 1.0:
        eligible, reason = False, "invalid_confidence"
    elif _SECRET.search(normalized):
        eligible, reason = False, "secret_like_content"
    elif sensitivity == "secret":
        eligible, reason = False, "secret_sensitivity_forbidden"
    elif kind == "procedure" and not user_approved:
        eligible, quarantined, reason = False, True, "procedure_requires_user_approval"
    elif source_class in {"crawler", "model_inference", "import"} and not user_approved and corroboration_count < 1:
        eligible, quarantined, reason = False, True, "untrusted_source_quarantined"
    elif confidence < 0.25:
        eligible, reason = False, "confidence_below_threshold"
    elif sensitivity != "public" and not user_approved:
        eligible, quarantined, reason = False, True, "personal_memory_requires_user_approval"

    return TrustEnvelope(
        content_digest=content_digest(normalized),
        source_class=source_class,
        source_id=str(source_id),
        actor_id=str(actor_id),
        captured_at_ms=captured_at_ms,
        policy_epoch=str(policy_epoch),
        kind=kind,
        sensitivity=sensitivity,
        confidence=confidence,
        user_approved=bool(user_approved),
        corroboration_count=corroboration_count,
        quarantined=quarantined,
        eligible=eligible,
        reason=reason,
    )
