#!/usr/bin/env python3
import unittest
from butler_privacy_circuit import ButlerPrivacyCircuit

class TestButlerPrivacyCircuit(unittest.TestCase):
    def setUp(self):
        self.circuit = ButlerPrivacyCircuit()

    def test_approved_local_encrypted(self):
        res = self.circuit.evaluate_traffic_and_storage("data", True, "127.0.0.1")
        self.assertEqual(res["status"], "APPROVED")

    def test_blocked_external_egress(self):
        res = self.circuit.evaluate_traffic_and_storage("data", True, "8.8.8.8")
        self.assertEqual(res["status"], "BLOCKED")
        self.assertEqual(res["reason"], "UNAUTHORIZED_EXTERNAL_EGRESS_DETECTED")

        # Subsequent attempts remain halted
        res2 = self.circuit.evaluate_traffic_and_storage("data", True, "127.0.0.1")
        self.assertEqual(res2["status"], "HALTED")

if __name__ == "__main__":
    unittest.main()
