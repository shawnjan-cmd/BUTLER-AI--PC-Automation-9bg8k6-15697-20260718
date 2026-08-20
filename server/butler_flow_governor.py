#!/usr/bin/env python3
"""
BUTLER AI — CONNECTION & AUTOMATION FLOW GOVERNOR v1.0
Manages priority queues, connection smoothness, bounded retries, privacy gating,
and automated self-regulation between mobile client and companion server.
"""

import time
import logging

class ButlerFlowGovernor:
    def __init__(self):
        self.active_tasks = []
        self.priority_lane_active = True
        self.last_lag_notice = 0.0
        self.privacy_circuit_armed = True

    def enqueue_task(self, task_type: str, payload: dict, priority: int = 1) -> dict:
        """
        Enqueues an automation or sync task with priority routing.
        Priority 1 = Critical Safety / User Chat (Immediate execution)
        Priority 2 = Script Workshop & Dry Run
        Priority 3 = Background Crawler & Telemetry
        """
        if not self.privacy_circuit_armed:
            return {"status": "BLOCKED_BY_PRIVACY_CIRCUIT", "reason": "Egress egress circuit is fail-closed."}

        task = {
            "task_id": f"task_{int(time.time()*1000)}",
            "type": task_type,
            "payload": payload,
            "priority": priority,
            "timestamp": time.time(),
            "status": "QUEUED"
        }

        # Insert sorted by priority (lowest number first)
        self.active_tasks.append(task)
        self.active_tasks.sort(key=lambda x: x["priority"])
        return {"status": "ENQUEUED", "task": task}

    def process_next_task(self) -> dict:
        if not self.active_tasks:
            return {"status": "IDLE"}
        
        task = self.active_tasks.pop(0)
        task["status"] = "EXECUTING"
        # Simulate execution
        time.sleep(0.01)
        task["status"] = "COMPLETED"
        return {"status": "SUCCESS", "executed_task": task}

    def evaluate_performance(self, cpu_load: float, ram_usage_gb: float) -> dict:
        """
        Monitors system load. If legacy device lag is detected, throttles background tasks
        without spamming notifications (10-minute anti-spam cooldown).
        """
        now = time.time()
        is_lagging = cpu_load > 85.0 or ram_usage_gb > 14.0
        
        notice_sent = False
        if is_lagging and (now - self.last_lag_notice > 600.0):
            self.last_lag_notice = now
            notice_sent = True

        return {
            "is_lagging": is_lagging,
            "throttle_background": is_lagging,
            "notice_triggered": notice_sent
        }
