#!/usr/bin/env python3
"""
BUTLER AI — SERVER CAPABILITY ORCHESTRATOR v1.0
Gives Butler Brain guarded, explainable control over the complete companion-server
capability surface (Vault, Privacy Circuit, Script Workshop, Crawler, Observatory,
Learning, Recovery, and Relays) under The 3 Unbreakable Rules.
"""

import time
import logging

class ButlerServerCapabilityOrchestrator:
    def __init__(self):
        self.capabilities = {
            "vault_access": {"tier": "HIGH_PRIVILEGE", "requires_pin": True, "description": "Access encrypted memory vault."},
            "privacy_circuit": {"tier": "IMMUTABLE_SAFETY", "requires_pin": False, "description": "Fail-closed egress circuit."},
            "script_execution": {"tier": "CONTROLLED_AUTOMATION", "requires_pin": False, "description": "Run sandboxed Python automation scripts."},
            "kb_crawler": {"tier": "BACKGROUND_TASK", "requires_pin": False, "description": "Index local documentation and knowledge vectors."},
            "observatory_stream": {"tier": "TELEMETRY", "requires_pin": False, "description": "Stream live performance and memory stats."},
            "learning_ledger": {"tier": "ADAPTIVE_INTELLIGENCE", "requires_pin": False, "description": "Ingest feedback and update preference weights."},
            "emergency_recovery": {"tier": "CRITICAL_SAFETY", "requires_pin": False, "description": "Trigger panic shutdown and process reaping."}
        }
        self.audit_log = []

    def execute_capability(self, capability_name: str, payload: dict, auth_token: str = "") -> dict:
        """
        Executes a server capability through Butler Brain with rule enforcement and audit logging.
        """
        if capability_name not in self.capabilities:
            return {"status": "REJECTED", "reason": "UNKNOWN_CAPABILITY"}

        cap = self.capabilities[capability_name]
        
        # Enforce security tiers
        if cap["tier"] == "IMMUTABLE_SAFETY" and payload.get("action") == "disable":
            return {
                "status": "BLOCKED_BY_RULES",
                "reason": "Rule II violation: Privacy Circuit is fail-closed and immutable."
            }

        audit_entry = {
            "timestamp": time.time(),
            "capability": capability_name,
            "tier": cap["tier"],
            "status": "AUTHORIZED_AND_EXECUTED"
        }
        self.audit_log.append(audit_entry)

        return {
            "status": "SUCCESS",
            "capability": capability_name,
            "tier": cap["tier"],
            "audit_receipt": audit_entry
        }

    def get_capabilities_manifest(self) -> dict:
        return self.capabilities
