"""Bounded capability trust epoch for Butler sessions."""
from __future__ import annotations
from dataclasses import dataclass


@dataclass(frozen=True)
class TrustState:
    epoch: int
    actor_id: str
    last_seen_ms: int
    policy_version: str
    topology_fingerprint: str
    auth_failures: int = 0


class TrustDecay:
    def __init__(self, *, idle_ms: int = 15 * 60 * 1000, max_auth_failures: int = 5) -> None:
        self.idle_ms = max(1_000, idle_ms)
        self.max_auth_failures = max(1, max_auth_failures)
        self._state: TrustState | None = None

    def establish(self, *, actor_id: str, now_ms: int, policy_version: str, topology_fingerprint: str) -> TrustState:
        self._state = TrustState(1, actor_id, now_ms, policy_version, topology_fingerprint)
        return self._state

    def observe(self, *, actor_id: str, now_ms: int, policy_version: str, topology_fingerprint: str) -> tuple[TrustState | None, str | None]:
        state = self._state
        if state is None:
            return None, "not_established"
        reason = None
        if actor_id != state.actor_id:
            reason = "actor_changed"
        elif policy_version != state.policy_version:
            reason = "policy_changed"
        elif topology_fingerprint != state.topology_fingerprint:
            reason = "topology_changed"
        elif now_ms - state.last_seen_ms > self.idle_ms:
            reason = "idle_timeout"
        elif state.auth_failures >= self.max_auth_failures:
            reason = "auth_failure_budget"
        if reason:
            self._state = TrustState(state.epoch + 1, actor_id, now_ms, policy_version, topology_fingerprint)
            return self._state, reason
        self._state = TrustState(state.epoch, state.actor_id, now_ms, state.policy_version, state.topology_fingerprint, state.auth_failures)
        return self._state, None

    def record_auth_failure(self) -> TrustState | None:
        if self._state is None:
            return None
        self._state = TrustState(self._state.epoch, self._state.actor_id, self._state.last_seen_ms, self._state.policy_version, self._state.topology_fingerprint, self._state.auth_failures + 1)
        return self._state

    def revoke(self, *, now_ms: int, reason: str) -> tuple[int, str]:
        if self._state is None:
            return 0, reason
        self._state = TrustState(self._state.epoch + 1, self._state.actor_id, now_ms, self._state.policy_version, self._state.topology_fingerprint)
        return self._state.epoch, reason
