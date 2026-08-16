"""Bounded retry policy for Butler's local network and crawler adapters.

Retries are permitted only when the caller declares the operation idempotent
and the failure class is transient. The helper computes deterministic delays
from a supplied jitter value so tests never depend on random timing.
"""
from __future__ import annotations

from dataclasses import dataclass


TRANSIENT = frozenset({"timeout", "connection_reset", "temporarily_unavailable", "rate_limited"})


@dataclass(frozen=True)
class RetryDecision:
    retry: bool
    attempt: int
    delay_s: float
    reason: str


@dataclass
class CircuitState:
    failures: int = 0
    opened_until_ms: int = 0

    def is_open(self, now_ms: int) -> bool:
        return self.opened_until_ms > int(now_ms)

    def record_failure(self, now_ms: int, threshold: int = 3, cooldown_ms: int = 30_000) -> None:
        self.failures += 1
        if self.failures >= threshold:
            self.opened_until_ms = int(now_ms) + int(cooldown_ms)

    def record_success(self) -> None:
        self.failures = 0
        self.opened_until_ms = 0


def decide_retry(
    *,
    attempt: int,
    max_attempts: int,
    failure_class: str,
    idempotent: bool,
    jitter_fraction: float = 0.0,
    base_delay_s: float = 0.25,
    max_delay_s: float = 8.0,
) -> RetryDecision:
    attempt = max(0, int(attempt))
    max_attempts = max(1, int(max_attempts))
    if not idempotent:
        return RetryDecision(False, attempt, 0.0, "non_idempotent_operation")
    if failure_class not in TRANSIENT:
        return RetryDecision(False, attempt, 0.0, "non_transient_failure")
    if attempt + 1 >= max_attempts:
        return RetryDecision(False, attempt, 0.0, "retry_budget_exhausted")
    jitter = min(1.0, max(0.0, float(jitter_fraction)))
    delay = min(float(max_delay_s), float(base_delay_s) * (2 ** attempt))
    delay *= 1.0 + jitter
    return RetryDecision(True, attempt + 1, round(delay, 3), "transient_idempotent_failure")
