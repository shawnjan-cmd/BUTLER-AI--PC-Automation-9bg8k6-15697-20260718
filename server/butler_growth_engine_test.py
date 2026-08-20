#!/usr/bin/env python3
"""
BUTLER AI — GROWTH ENGINE TEST SUITE v1.1
Validates XP gain, leveling, maturity progression, explainable decision recording,
and security rule override protection with 3-second countdown timer support.
"""

import unittest
from butler_growth_engine import ButlerGrowthEngine
import os

class TestButlerGrowthEngine(unittest.TestCase):
    def setUp(self):
        self.test_path = "/home/ubuntu/preserved_60mb/server/vault_store/test_growth.json"
        if os.path.exists(self.test_path):
            os.remove(self.test_path)
        self.engine = ButlerGrowthEngine(storage_path=self.test_path)

    def tearDown(self):
        if os.path.exists(self.test_path):
            os.remove(self.test_path)

    def test_xp_and_level_up(self):
        initial_level = self.engine.state["level"]
        res = self.engine.add_xp(600, "Completed heavy task")
        self.assertEqual(res["status"], "XP_ADDED")
        self.assertGreater(self.engine.state["level"], initial_level)

    def test_decision_and_alternative_choice(self):
        dec = self.engine.record_decision(
            "Cache Cleanup",
            "Temporary files exceed 1GB.",
            "Recommended: Purge stale logs.",
            "Alternative: Keep files."
        )
        self.assertEqual(dec["status"], "COUNTDOWN_ACTIVE")

        resolved = self.engine.resolve_decision(dec["id"], "alternative")
        self.assertEqual(resolved["status"], "RESOLVED")
        self.assertEqual(resolved["decision"]["status"], "USER_CHOSE_ALTERNATIVE")

    def test_security_rule_cannot_be_overridden(self):
        dec = self.engine.record_decision(
            "Fail-Closed Circuit",
            "Unauthorized external telemetry attempt detected.",
            "Recommended: Block egress immediately.",
            "Alternative: Allow telemetry.",
            is_security_rule=True
        )
        self.assertEqual(dec["status"], "AUTO_APPLIED_LOCKED")

        resolved = self.engine.resolve_decision(dec["id"], "alternative")
        self.assertEqual(resolved["status"], "REJECTED")
        self.assertEqual(resolved["reason"], "CANNOT_OVERRIDE_SECURITY_RULE")

if __name__ == "__main__":
    unittest.main()
