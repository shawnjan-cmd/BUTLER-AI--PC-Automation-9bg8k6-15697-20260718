#!/usr/bin/env python3
"""
BUTLER AI — ANDROID LIFECYCLE & WORKMANAGER GOVERNOR v1.0
Aligns background crawlers and worker threads with Android background execution limits,
wakelock quotas, and idle constraints.
"""

import time
from typing import Dict, Any

class ButlerAndroidLifecycleGovernor:
    def __init__(self):
        self.app_state = "FOREGROUND"
        self.wakelock_active = False
        self.crawler_active_seconds = 0.0
        self.max_background_window = 30.0 # Strict Android background execution budget

    def set_app_state(self, state: str) -> Dict[str, Any]:
        """
        Transitions app lifecycle state (FOREGROUND, BACKGROUND, DESTROYED).
        """
        if state not in ["FOREGROUND", "BACKGROUND", "DESTROYED"]:
            return {"status": "REJECTED", "reason": "INVALID_STATE"}
        
        self.app_state = state
        if state == "BACKGROUND":
            self.wakelock_active = False # Release wakelock when backgrounded
        return {"status": "STATE_UPDATED", "state": self.app_state}

    def request_crawler_execution(self, requested_seconds: float) -> Dict[str, Any]:
        """
        Evaluates background crawler execution requests against Android background limits.
        """
        if self.app_state == "FOREGROUND":
            return {"status": "PERMITTED", "mode": "UNRESTRICTED_FOREGROUND"}

        if self.app_state == "DESTROYED":
            return {"status": "REJECTED", "reason": "APP_DESTROYED"}

        # Background state enforcement
        if requested_seconds > self.max_background_window:
            return {
                "status": "THROTTLED",
                "allowed_seconds": self.max_background_window,
                "reason": "ANDROID_BACKGROUND_EXECUTION_LIMIT"
            }

        return {"status": "PERMITTED", "mode": "WORKMANAGER_ALIGNED_BACKGROUND"}

if __name__ == "__main__":
    gov = ButlerAndroidLifecycleGovernor()
    print("Foreground request:", gov.request_crawler_execution(60))
    gov.set_app_state("BACKGROUND")
    print("Background request (60s):", gov.request_crawler_execution(60))
    print("Background request (15s):", gov.request_crawler_execution(15))
