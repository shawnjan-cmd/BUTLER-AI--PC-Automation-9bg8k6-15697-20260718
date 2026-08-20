#!/usr/bin/env python3
"""
BUTLER AI — SERVER CAPABILITIES TEST SUITE v1.0
Validates guarded capability execution, rule enforcement, and audit receipts.
"""

import unittest
from butler_server_capabilities import ButlerServerCapabilityOrchestrator

class TestButlerServerCapabilities(unittest.TestCase):
    def setUp(self):
        self.orchestrator = ButlerServerCapabilityOrchestrator()

    def test_valid_capability_execution(self):
        res = self.orchestrator.execute_capability("script_execution", {"script": "print('test')"})
        self.assertEqual(res["status"], "SUCCESS")
        self.assertIn("audit_receipt", res)

    def test_immutable_safety_rule_blocking(self):
        res = self.orchestrator.execute_capability("privacy_circuit", {"action": "disable"})
        self.assertEqual(res["status"], "BLOCKED_BY_RULES")

if __name__ == "__main__":
    unittest.main()
