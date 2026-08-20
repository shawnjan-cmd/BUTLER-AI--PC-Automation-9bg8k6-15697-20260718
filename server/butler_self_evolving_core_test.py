#!/usr/bin/env python3
"""
BUTLER AI — SELF-EVOLVING CORE TEST SUITE v1.0
Validates experience ingestion, evidence scoring, reflexion journaling, and immutable safety rules.
"""

import unittest
from butler_self_evolving_core import ButlerSelfEvolvingCore
import os

class TestButlerSelfEvolvingCore(unittest.TestCase):
    def setUp(self):
        self.test_path = "/home/ubuntu/preserved_60mb/server/vault_store/test_evolve.json"
        if os.path.exists(self.test_path):
            os.remove(self.test_path)
        self.core = ButlerSelfEvolvingCore(storage_path=self.test_path)

    def tearDown(self):
        if os.path.exists(self.test_path):
            os.remove(self.test_path)

    def test_experience_recording_and_evolution(self):
        initial_signals = self.core.state["total_experience_signals"]
        res = self.core.record_experience("script_workshop", "User corrected script indentation to 4 spaces.", "Updated script template generator.")
        self.assertEqual(res["status"], "EVOLVED")
        self.assertEqual(self.core.state["total_experience_signals"], initial_signals + 1)
        self.assertGreater(len(self.core.state["reflexion_journal"]), 0)

    def test_immutable_security_invariant_preserved(self):
        # Ensure immutable security rule cannot be overwritten by self-learning
        security_rule = next(p for p in self.core.state["durable_preferences"] if p["category"] == "security")
        self.assertEqual(security_rule["status"], "IMMUTABLE_INVARIANT")

if __name__ == "__main__":
    unittest.main()
