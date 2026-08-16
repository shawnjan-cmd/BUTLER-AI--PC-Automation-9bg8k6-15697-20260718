"""Butler optional-work resource governor.

This module deliberately contains scheduling policy, not arbitrary execution.
Callers still own authentication, capability checks, and subprocess isolation.
"""
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum

class Lane(str, Enum):
    CRITICAL = "critical"
    INTERACTIVE = "interactive"
    OPTIONAL_RAM = "optional_ram"
    OPTIONAL_NETWORK = "optional_network"
    OPTIONAL_DISK = "optional_disk"

@dataclass(frozen=True)
class ResourceSnapshot:
    cpu_percent: float
    ram_percent: float
    disk_free_percent: float
    network_available: bool = True

@dataclass(frozen=True)
class LaneDecision:
    allowed: bool
    reason: str
    max_concurrency: int


def decide(lane: Lane, snapshot: ResourceSnapshot, *, active_chat: bool = False, approved_action: bool = False) -> LaneDecision:
    """Decide whether optional work may start; never denies critical interaction."""
    if lane in (Lane.CRITICAL, Lane.INTERACTIVE):
        return LaneDecision(True, "core_lane_never_disabled", 1)
    if active_chat or approved_action:
        return LaneDecision(False, "protect_active_core_work", 0)
    if snapshot.cpu_percent >= 85 or snapshot.ram_percent >= 88:
        return LaneDecision(False, "cpu_or_ram_pressure", 0)
    if snapshot.disk_free_percent < 10 and lane == Lane.OPTIONAL_DISK:
        return LaneDecision(False, "low_disk_space", 0)
    if not snapshot.network_available and lane == Lane.OPTIONAL_NETWORK:
        return LaneDecision(False, "network_unavailable", 0)
    if snapshot.cpu_percent >= 70 or snapshot.ram_percent >= 75:
        return LaneDecision(True, "degraded_optional_mode", 1)
    return LaneDecision(True, "normal_optional_mode", 2)
