#!/usr/bin/env python3
"""
BUTLER AI — ADVERSARIAL PENETRATION TEST SUITE v1.5
Simulates hacker attack vectors (path traversal, brute-force PIN guessing, unencrypted egress,
and replay attacks) to verify server resilience and fail-closed security.
"""

import unittest
from butler_hardened_vault import ButlerHardenedVault
from butler_privacy_circuit import ButlerPrivacyCircuit
from butler_script_workshop import ButlerScriptWorkshop
from butler_anonymous_handle import ButlerAnonymousHandleIssuer

class TestButlerAdversarialPenetration(unittest.TestCase):
    def setUp(self):
        self.vault = ButlerHardenedVault()
        self.vault.set_pin("999999")
        self.privacy_circuit = ButlerPrivacyCircuit()
        self.workshop = ButlerScriptWorkshop()
        self.issuer = ButlerAnonymousHandleIssuer()

    def test_exploit_1_path_traversal_blocked(self):
        """Simulates hacker attempting path traversal in Script Workshop."""
        malicious_name = "../../../etc/passwd"
        res = self.workshop.create_or_edit_script(malicious_name, "print('hacked')")
        self.assertEqual(res["status"], "REJECTED")
        self.assertEqual(res["reason"], "PATH_TRAVERSAL_ATTEMPT_BLOCKED")

    def test_exploit_2_brute_force_lockout(self):
        """Simulates automated bot attempting PIN brute-forcing."""
        for _ in range(5):
            self.vault.unlock_vault("000000")
        
        # 6th attempt should trigger lockout
        res = self.vault.unlock_vault("000000")
        self.assertEqual(res["status"], "REJECTED")
        self.assertEqual(res["reason"], "MAX_ATTEMPTS_EXCEEDED_LOCKOUT")

    def test_exploit_3_data_exfiltration_blocked(self):
        """Simulates unauthorized external telemetry or data exfiltration."""
        res = self.privacy_circuit.evaluate_traffic_and_storage("secret_tokens", True, "203.0.113.50")
        self.assertEqual(res["status"], "BLOCKED")
        self.assertEqual(res["reason"], "UNAUTHORIZED_EXTERNAL_EGRESS_DETECTED")

    def test_exploit_4_nonce_replay_blocked(self):
        """Simulates malicious reuse of anonymous handle nonces."""
        device_id = "device_xyz_999"
        
        # Request a challenge first to get a valid nonce
        challenge = self.issuer.request_challenge(device_id)
        nonce = challenge["nonce"]

        first = self.issuer.issue_handle(device_id, nonce)
        self.assertEqual(first["status"], "ISSUED")

        # Second attempt with same nonce should be rejected
        second = self.issuer.issue_handle(device_id, nonce)
        self.assertEqual(second["status"], "REJECTED")
        self.assertEqual(second["reason"], "INVALID_OR_EXPIRED_NONCE")

if __name__ == "__main__":
    unittest.main()
