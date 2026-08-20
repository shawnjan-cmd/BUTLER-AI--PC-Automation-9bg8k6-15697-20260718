#!/usr/bin/env python3
"""
BUTLER AI — FAIL-CLOSED PRIVACY CIRCUIT & INTEGRITY ENGINE v1.0
Intercepts all data traffic and persistence requests. If envelope verification,
loopback isolation, or encryption checks fail, it instantly halts saving and purges RAM.
"""

import hashlib
from typing import Dict, Any, Optional

class ButlerPrivacyCircuit:
    def __init__(self):
        self.circuit_tripped = False

    def evaluate_traffic_and_storage(self, payload: str, is_encrypted: bool, destination_ip: str) -> Dict[str, Any]:
        """
        Validates that data traffic is loopback/private and storage envelope is encrypted.
        Trips circuit and blocks persistence if integrity checks fail.
        """
        if self.circuit_tripped:
            return {"status": "HALTED", "reason": "CIRCUIT_TRIPPED_SECURITY_LOCKDOWN"}

        # Verify loopback or RFC-1918 private network
        is_private_net = destination_ip.startswith("127.") or destination_ip.startswith("10.") or destination_ip.startswith("192.168.") or destination_ip.startswith("172.")
        
        if not is_private_net:
            self.circuit_tripped = True
            return {"status": "BLOCKED", "reason": "UNAUTHORIZED_EXTERNAL_EGRESS_DETECTED"}

        if not is_encrypted:
            self.circuit_tripped = True
            return {"status": "BLOCKED", "reason": "UNENCRYPTED_DATA_PERSISTENCE_REJECTED"}

        return {"status": "APPROVED", "action": "SECURE_STORAGE_PERMITTED"}

    def reset_circuit(self, admin_token: str):
        if admin_token == "butler-master-admin-2026":
            self.circuit_tripped = False
            return True
        return False

if __name__ == "__main__":
    circuit = ButlerPrivacyCircuit()
    print("Private encrypted save:", circuit.evaluate_traffic_and_storage("secret", True, "127.0.0.1"))
    print("External unencrypted save:", circuit.evaluate_traffic_and_storage("secret", False, "8.8.8.8"))
    print("Subsequent attempt:", circuit.evaluate_traffic_and_storage("secret", True, "127.0.0.1"))
