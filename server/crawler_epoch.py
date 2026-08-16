"""Crawler Epoch Ledger for bounded, idempotent local research work."""
from __future__ import annotations

from dataclasses import dataclass, asdict
import hashlib
import json
import time
from typing import Any


@dataclass(frozen=True)
class CrawlCheckpoint:
    epoch_id: str
    url_digest: str
    url: str
    content_digest: str
    parser_version: str
    policy_epoch: str
    source_class: str
    captured_at_ms: int
    cursor: str
    status: str

    def public_dict(self) -> dict[str, Any]:
        return asdict(self)


def digest(value: str) -> str:
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()


def make_checkpoint(
    *,
    url: str,
    content: str,
    parser_version: str,
    policy_epoch: str,
    source_class: str,
    cursor: str = "",
    captured_at_ms: int | None = None,
) -> CrawlCheckpoint:
    if not url or not parser_version or not policy_epoch or not source_class:
        raise ValueError("url, parser_version, policy_epoch, and source_class are required")
    ts = int(captured_at_ms if captured_at_ms is not None else time.time() * 1000)
    if ts <= 0:
        raise ValueError("captured_at_ms must be positive")
    url_digest = digest(url.strip().lower())
    content_digest = digest(" ".join(str(content or "").split()))
    epoch_id = digest("|".join((url_digest, content_digest, parser_version, policy_epoch, str(cursor))))[:32]
    return CrawlCheckpoint(
        epoch_id=epoch_id,
        url_digest=url_digest,
        url=url,
        content_digest=content_digest,
        parser_version=parser_version,
        policy_epoch=policy_epoch,
        source_class=source_class,
        captured_at_ms=ts,
        cursor=str(cursor),
        status="completed",
    )


def is_idempotent_duplicate(previous: CrawlCheckpoint | None, candidate: CrawlCheckpoint) -> bool:
    if previous is None:
        return False
    return (
        previous.url_digest == candidate.url_digest
        and previous.content_digest == candidate.content_digest
        and previous.parser_version == candidate.parser_version
        and previous.policy_epoch == candidate.policy_epoch
        and previous.cursor == candidate.cursor
        and previous.status == "completed"
    )


def checkpoint_fingerprint(checkpoint: CrawlCheckpoint) -> str:
    payload = json.dumps(checkpoint.public_dict(), sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(payload).hexdigest()
