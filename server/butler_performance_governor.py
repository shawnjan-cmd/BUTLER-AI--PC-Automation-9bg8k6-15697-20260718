#!/usr/bin/env python3
"""
BUTLER AI — PERFORMANCE GOVERNOR & RATE-LIMITED LAG NOTIFIER v1.0
Monitors execution frame cadence and memory pressure. If frame drops or latency
exceeds safe thresholds, triggers low-memory fallbacks and issues a respectful,
rate-limited user notification (at most once every 10 minutes) so as not to spam.
"""

import time
import json
import os
from typing import Dict, Any, Optional

class ButlerPerformanceGovernor:
    def __init__(self, state_path: str = "/home/ubuntu/preserved_60mb/server/vault_store/governor_state.json"):
        self.state_path = state_path
        self.last_warning_time = 0.0
        self.warning_cooldown = 600.0  # 10 minutes cooldown between lag alerts
        self.mode = "HIGH_PERFORMANCE"

    def evaluate_performance(self, frame_duration_ms: float, memory_usage_pct: float) -> Dict[str, Any]:
        """
        Evaluates system performance. Returns whether lag is detected and if a notification is permitted.
        """
        now = time.time()
        is_lagging = frame_duration_ms > 33.3 or memory_usage_pct > 88.0
        
        should_notify = False
        if is_lagging:
            if (now - self.last_warning_time) > self.warning_cooldown:
                self.last_warning_time = now
                should_notify = True
                self.mode = "CONSERVE_RESOURCES"
        else:
            if memory_usage_pct < 75.0 and frame_duration_ms < 16.6:
                self.mode = "HIGH_PERFORMANCE"

        return {
            "is_lagging": is_lagging,
            "mode": self.mode,
            "should_notify_user": should_notify,
            "message": "Performance dip detected on legacy device. Animations scaled to 60fps lightweight mode to protect responsiveness." if should_notify else None
        }

if __name__ == "__main__":
    gov = ButlerPerformanceGovernor()
    print("Normal check:", gov.evaluate_performance(14.2, 45.0))
    print("Lag check 1:", gov.evaluate_performance(45.0, 92.0))
    print("Lag check 2 (cooldown):", gov.evaluate_performance(45.0, 92.0))
