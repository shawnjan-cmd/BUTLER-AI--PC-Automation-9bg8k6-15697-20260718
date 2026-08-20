#!/usr/bin/env python3
"""
BUTLER AI — PROPRIETARY INTERACTION GOVERNOR & RESOURCE SCHEDULER v1.0
Enforces priority lanes (AI Chat & Script Workshop > Achievements > Telemetry/Crawlers),
cooldowns, deduplication, and emergency CPU/RAM throttling.
"""

import time
from typing import Dict, List, Any, Optional

class ButlerInteractionGovernor:
    def __init__(self):
        self.last_interaction_times: Dict[str, float] = {}
        self.active_priority_lane: Optional[str] = None
        self.cooldown_map = {
            "CRITICAL_CHAT": 0.0,
            "SCRIPT_WORKSHOP": 0.0,
            "ACHIEVEMENT_TOAST": 4.0,  # 4 second cooldown between toasts
            "TELEMETRY_POLL": 2.5,
            "CRAWLER_SYNC": 10.0
        }

    def request_interaction(self, lane: str, payload_id: str) -> Dict[str, Any]:
        """
        Evaluates whether an interaction (toast, alert, background sync) is permitted
        based on priority lanes, cooldowns, and system pressure.
        """
        now = time.time()
        
        # Priority 1: AI Chat and Script Workshop always bypass cooldowns
        if lane in ["CRITICAL_CHAT", "SCRIPT_WORKSHOP"]:
            self.active_priority_lane = lane
            return {"status": "PERMITTED", "lane": lane, "mode": "PRIORITY_EXECUTION"}

        # Enforce cooldowns for non-critical notifications/toasts
        cooldown = self.cooldown_map.get(lane, 2.0)
        last_time = self.last_interaction_times.get(lane, 0.0)

        if now - last_time < cooldown:
            return {"status": "SUPPRESSED", "reason": "COOLDOWN_ACTIVE", "remaining": round(cooldown - (now - last_time), 2)}

        self.last_interaction_times[lane] = now
        return {"status": "PERMITTED", "lane": lane}

    def evaluate_resource_pressure(self, cpu_load: float, ram_usage: float) -> Dict[str, Any]:
        """
        If CPU load > 85% or RAM > 90%, governor throttles background crawlers and non-critical UI.
        """
        if cpu_load > 85.0 or ram_usage > 90.0:
            return {
                "status": "THROTTLED",
                "action": "PAUSE_BACKGROUND_CRAWLERS_AND_ANIMATIONS",
                "protected_lanes": ["CRITICAL_CHAT", "SCRIPT_WORKSHOP"]
            }
        return {"status": "OPTIMAL", "action": "FULL_SPEED"}

if __name__ == "__main__":
    gov = ButlerInteractionGovernor()
    print("Toast 1:", gov.request_interaction("ACHIEVEMENT_TOAST", "ach_1"))
    print("Toast 2 (Immediate):", gov.request_interaction("ACHIEVEMENT_TOAST", "ach_2"))
    print("Chat (Priority):", gov.request_interaction("CRITICAL_CHAT", "chat_1"))
    print("Pressure Test:", gov.evaluate_resource_pressure(88.5, 92.0))
