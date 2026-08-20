#!/usr/bin/env python3
import unittest
import time
from butler_interaction_governor import ButlerInteractionGovernor

class TestButlerInteractionGovernor(unittest.TestCase):
    def setUp(self):
        self.gov = ButlerInteractionGovernor()

    def test_priority_bypass(self):
        res = self.gov.request_interaction("CRITICAL_CHAT", "m1")
        self.assertEqual(res["status"], "PERMITTED")
        self.assertEqual(res["mode"], "PRIORITY_EXECUTION")

    def test_cooldown_suppression(self):
        r1 = self.gov.request_interaction("ACHIEVEMENT_TOAST", "t1")
        self.assertEqual(r1["status"], "PERMITTED")

        r2 = self.gov.request_interaction("ACHIEVEMENT_TOAST", "t2")
        self.assertEqual(r2["status"], "SUPPRESSED")
        self.assertEqual(r2["reason"], "COOLDOWN_ACTIVE")

    def test_resource_pressure_throttling(self):
        status = self.gov.evaluate_resource_pressure(90.0, 95.0)
        self.assertEqual(status["status"], "THROTTLED")
        self.assertIn("CRITICAL_CHAT", status["protected_lanes"])

if __name__ == "__main__":
    unittest.main()
