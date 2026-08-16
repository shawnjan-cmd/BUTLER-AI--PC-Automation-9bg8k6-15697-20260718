"""Butler capability policy: one deny-by-default gate for all high-risk lanes."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import ipaddress
import re
from typing import Any, Mapping


class CapabilityDenied(Exception):
    pass


@dataclass(frozen=True)
class CapabilitySpec:
    capability_id: str
    risk: str
    approval: str
    network: str
    enabled_by_default: bool
    scope: tuple[str, ...]
    undo: Any


@dataclass(frozen=True)
class CapabilityRequest:
    capability_id: str
    actor_id: str
    approved: bool
    paths: tuple[str, ...] = ()
    hosts: tuple[str, ...] = ()
    timeout_s: int = 0
    network_requested: bool = False
    undo_available: bool = False


_SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9_.-]{1,79}$")


class CapabilityPolicy:
    def __init__(self, manifest: Mapping[str, Any]) -> None:
        if manifest.get("defaultDecision") != "deny":
            raise CapabilityDenied("capability manifest must default to deny")
        self.version = str(manifest.get("policyVersion", ""))
        if not self.version:
            raise CapabilityDenied("capability manifest has no policy version")
        self._specs: dict[str, CapabilitySpec] = {}
        for raw in manifest.get("capabilities", []):
            cid = str(raw.get("id", ""))
            if not _SAFE_ID.fullmatch(cid) or cid in self._specs:
                raise CapabilityDenied("invalid or duplicate capability id")
            self._specs[cid] = CapabilitySpec(cid, str(raw.get("risk", "unknown")), str(raw.get("approval", "per_action")), str(raw.get("network", "none")), bool(raw.get("enabledByDefault", False)), tuple(str(x) for x in raw.get("scope", [])), raw.get("undo", False))

    @classmethod
    def from_file(cls, path: Path) -> "CapabilityPolicy":
        import json
        return cls(json.loads(path.read_text(encoding="utf-8")))

    def spec(self, capability_id: str) -> CapabilitySpec:
        try:
            return self._specs[capability_id]
        except KeyError as exc:
            raise CapabilityDenied("unknown capability") from exc

    def validate(self, request: CapabilityRequest, *, phase: str = "execute") -> CapabilitySpec:
        if not request.actor_id:
            raise CapabilityDenied("actor identity required")
        spec = self.spec(request.capability_id)
        if phase not in {"preview", "execute"}:
            raise CapabilityDenied("unknown validation phase")
        if phase == "execute" and spec.approval in {"per_action", "per_job", "explicit_setup_and_per_session"} and not request.approved:
            raise CapabilityDenied("explicit approval required")
        if request.timeout_s < 0 or request.timeout_s > 900:
            raise CapabilityDenied("timeout outside bounded policy")
        if request.network_requested and spec.network in {"none", "loopback_only", "deny_by_default"}:
            raise CapabilityDenied("network is denied for this capability")
        if spec.network == "approved_hosts_only" and not request.hosts:
            raise CapabilityDenied("approved host declaration required")
        if spec.network == "approved_hosts_only":
            for host in request.hosts:
                self._validate_host(host)
        if spec.risk in {"side_effect", "remote_side_effect"} and spec.undo == "required_when_possible" and not request.undo_available:
            raise CapabilityDenied("undo or recovery handle required")
        if spec.scope and request.paths and "user_selected_paths" not in spec.scope and "declared_paths" not in spec.scope and "sandbox_only_by_default" not in spec.scope:
            raise CapabilityDenied("path scope is not declared for capability")
        return spec

    @staticmethod
    def _validate_host(host: str) -> None:
        value = host.strip().lower()
        if not value or len(value) > 253 or any(c.isspace() for c in value):
            raise CapabilityDenied("invalid host declaration")
        try:
            ip = ipaddress.ip_address(value)
            if ip.is_unspecified or ip.is_multicast or ip.is_reserved:
                raise CapabilityDenied("reserved host is not allowed")
        except ValueError:
            if not re.fullmatch(r"[a-z0-9][a-z0-9.-]*[a-z0-9]", value):
                raise CapabilityDenied("invalid hostname")


def load_default_policy() -> CapabilityPolicy:
    return CapabilityPolicy.from_file(Path(__file__).with_name("butler_capabilities.json"))
