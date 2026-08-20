#!/usr/bin/env python3
"""
BUTLER AI — VISIBLE GROWTH LOOP & EXPLAINABLE DECISION ENGINE v1.1
Tracks Butler's XP accumulation, level progression, and autonomous decision-making
with a 3-second interactive countdown timer for user overrides.
"""

import time
import json
import os
from typing import Dict, Any, List, Optional

class ButlerGrowthEngine:
    def __init__(self, storage_path: str = "/home/ubuntu/preserved_60mb/server/vault_store/growth_state.json"):
        self.storage_path = storage_path
        self.state = {
            "level": 1,
            "xp": 180,
            "next_level_xp": 500,
            "maturity_title": "Apprentice Cyber-Assistant",
            "decisions_made": 19,
            "recent_decisions": []
        }
        self.load()

    def load(self):
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, "r") as f:
                    self.state.update(json.load(f))
        except Exception:
            pass

    def save(self):
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w") as f:
                json.dump(self.state, f, indent=2)
        except Exception:
            pass

    def add_xp(self, amount: int, reason: str) -> Dict[str, Any]:
        self.state["xp"] += amount
        if self.state["xp"] >= self.state["next_level_xp"]:
            self.state["level"] += 1
            self.state["xp"] -= self.state["next_level_xp"]
            self.state["next_level_xp"] = int(self.state["next_level_xp"] * 1.5)
            
            lvl = self.state["level"]
            if lvl >= 5:
                self.state["maturity_title"] = "Autonomous Cybernetic Sentinel"
            elif lvl >= 3:
                self.state["maturity_title"] = "Advanced System Orchestrator"
            elif lvl >= 2:
                self.state["maturity_title"] = "Competent Automation Aide"
            else:
                self.state["maturity_title"] = "Apprentice Cyber-Assistant"

        self.save()
        return {"status": "XP_ADDED", "reason": reason, "current_state": self.state}

    def record_decision(self, title: str, description: str, recommended: str, alternative: str, is_security_rule: bool = False) -> Dict[str, Any]:
        """
        Records a decision with a 3-second countdown window for user override.
        """
        decision = {
            "id": f"dec_{int(time.time()*1000)}",
            "title": title,
            "description": description,
            "recommended": recommended,
            "alternative": alternative,
            "is_security_rule": is_security_rule,
            "countdown_seconds": 3,
            "status": "AUTO_APPLIED_LOCKED" if is_security_rule else "COUNTDOWN_ACTIVE",
            "timestamp": time.time()
        }
        
        self.state["decisions_made"] += 1
        self.state["recent_decisions"].insert(0, decision)
        if len(self.state["recent_decisions"]) > 10:
            self.state["recent_decisions"].pop()
            
        self.save()
        return decision

    def resolve_decision(self, decision_id: str, choice: str) -> Dict[str, Any]:
        for dec in self.state["recent_decisions"]:
            if dec["id"] == decision_id:
                if dec["is_security_rule"]:
                    return {"status": "REJECTED", "reason": "CANNOT_OVERRIDE_SECURITY_RULE"}
                dec["status"] = f"USER_CHOSE_{choice.upper()}"
                self.save()
                return {"status": "RESOLVED", "decision": dec}
        return {"status": "NOT_FOUND"}

if __name__ == "__main__":
    engine = ButlerGrowthEngine()
    print("Growth Engine Initialized:", engine.state)
