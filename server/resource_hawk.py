"""PC-local Resource Hawk for truthful, bounded workload adaptation.

The hawk samples real host resources. If psutil is unavailable, values remain
unknown and the policy conservatively selects low optional-work budgets rather
than fabricating metrics. Sampling can be frequent on the PC while UI updates
remain throttled by the client.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
import shutil
import time
from typing import Any, Callable


@dataclass(frozen=True)
class HawkSnapshot:
    captured_at_ms: int
    cpu_percent: float | None
    ram_percent: float | None
    disk_free_percent: float | None
    load_1m: float | None
    thermal_state: str
    source: str


@dataclass(frozen=True)
class HawkBudget:
    state: str
    optional_concurrency: int
    crawler_allowed: bool
    indexing_allowed: bool
    chat_reserved: bool
    reason: str


def collect_snapshot(path: str = ".", *, sampler: Callable[[], dict[str, Any]] | None = None) -> HawkSnapshot:
    now = int(time.time() * 1000)
    if sampler is not None:
        try:
            raw = sampler()
        except Exception:
            raw = {}
    else:
        try:
            import psutil  # optional server dependency
            vm = psutil.virtual_memory()
            disk = shutil.disk_usage(path)
            load = getattr(psutil, "getloadavg", lambda: (None, None, None))()[0]
            raw = {
                "cpu_percent": float(psutil.cpu_percent(interval=None)),
                "ram_percent": float(vm.percent),
                "disk_free_percent": (disk.free / disk.total * 100.0) if disk.total else None,
                "load_1m": float(load) if load is not None else None,
                "thermal_state": "unknown",
                "source": "psutil",
            }
        except Exception:
            raw = {}
    def num(key: str) -> float | None:
        value = raw.get(key)
        try:
            value = float(value)
            return value if value >= 0 else None
        except (TypeError, ValueError):
            return None
    return HawkSnapshot(
        captured_at_ms=now,
        cpu_percent=num("cpu_percent"),
        ram_percent=num("ram_percent"),
        disk_free_percent=num("disk_free_percent"),
        load_1m=num("load_1m"),
        thermal_state=str(raw.get("thermal_state") or "unknown"),
        source=str(raw.get("source") or "unavailable"),
    )


def choose_budget(snapshot: HawkSnapshot, *, active_chat: bool = False, approved_action: bool = False) -> HawkBudget:
    # Critical chat and explicitly approved actions remain reserved. Optional
    # work is what yields first under pressure.
    if active_chat or approved_action:
        return HawkBudget("interactive", 0, False, False, True, "critical_work_reserved")
    if snapshot.cpu_percent is None or snapshot.ram_percent is None:
        return HawkBudget("unknown", 0, False, False, True, "unknown_capacity_conservative_default")
    if snapshot.cpu_percent >= 90 or snapshot.ram_percent >= 92 or (snapshot.disk_free_percent is not None and snapshot.disk_free_percent < 5):
        return HawkBudget("dangerous", 0, False, False, True, "dangerous_resource_pressure")
    if snapshot.cpu_percent >= 78 or snapshot.ram_percent >= 82 or (snapshot.disk_free_percent is not None and snapshot.disk_free_percent < 10):
        return HawkBudget("pressured", 1, False, True, True, "optional_work_reduced")
    if snapshot.cpu_percent >= 60 or snapshot.ram_percent >= 70:
        return HawkBudget("guarded", 1, True, True, True, "bounded_optional_work")
    return HawkBudget("normal", 2, True, True, True, "measured_capacity_available")


class ResourceHawk:
    def __init__(self, interval_s: float = 1.0, recovery_samples: int = 3):
        self.interval_s = max(0.5, float(interval_s))
        self.recovery_samples = max(1, int(recovery_samples))
        self._last_budget: HawkBudget | None = None
        self._stable_samples = 0

    def evaluate(self, snapshot: HawkSnapshot, *, active_chat: bool = False, approved_action: bool = False) -> HawkBudget:
        candidate = choose_budget(snapshot, active_chat=active_chat, approved_action=approved_action)
        if self._last_budget and candidate.state == "normal" and self._last_budget.state in {"dangerous", "pressured", "guarded"}:
            self._stable_samples += 1
            if self._stable_samples < self.recovery_samples:
                return HawkBudget("recovering", self._last_budget.optional_concurrency, self._last_budget.crawler_allowed, self._last_budget.indexing_allowed, True, "recovery_hysteresis")
        else:
            self._stable_samples = 0
        self._last_budget = candidate
        return candidate


def public_snapshot(snapshot: HawkSnapshot, budget: HawkBudget) -> dict[str, Any]:
    return {"snapshot": asdict(snapshot), "budget": asdict(budget)}
