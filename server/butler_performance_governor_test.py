#!/usr/bin/env python3
"""
BUTLER AI — PERFORMANCE GOVERNOR TEST SUITE v1.0
Validates lag detection and rate-limited notification cooldowns (10-minute anti-spam).
"""

import unittest
from butler_performance_governor import ButlerPerformanceGovernor
import time

class TestButlerPerformanceGovernor(unittest.TestCase):
    def setUp(self):
        self.gov = ButlerPerformanceGovernor()

    def test_governor_throttling_and_cooldown(self):
        # First lag trigger should notify
        res1 = self.gov.evaluate_performance(50.0, 92.0)
        self.assertTrue(res1["is_lagging"])
        self.assertTrue(res1["should_notify_user"])
        self.assertEqual(res1["mode"], "CONSERVE_RESOURCES")

        # Immediate second lag trigger should NOT notify (cooldown active)
        res2 = self.gov.evaluate_performance(50.0, 92.0)
        self.assertTrue(res2["is_lagging"])
        self.assertFalse(res2["should_notify_user"])

if __name__ == "__main__":
    unittest.main()
