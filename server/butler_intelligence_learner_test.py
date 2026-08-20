#!/usr/bin/env python3
"""
BUTLER AI — INTELLIGENCE LEARNER TEST SUITE v1.1
Validates feedback ingestion, confidence scoring increase, checkpoint creation,
and learning rollback capabilities.
"""

import unittest
from butler_intelligence_learner import ButlerIntelligenceLearner
import os

class TestButlerIntelligenceLearner(unittest.TestCase):
    def setUp(self):
        self.test_path = "/home/ubuntu/preserved_60mb/server/vault_store/test_intel.json"
        if os.path.exists(self.test_path):
            os.remove(self.test_path)
        self.learner = ButlerIntelligenceLearner(storage_path=self.test_path)

    def tearDown(self):
        if os.path.exists(self.test_path):
            os.remove(self.test_path)

    def test_feedback_ingestion_and_score_gain(self):
        initial_score = self.learner.state["intelligence_score"]
        res = self.learner.ingest_feedback("CORRECTION_ACCEPTED", "chat_style", "be_more_concise")
        self.assertEqual(res["status"], "LEARNED")
        self.assertGreater(self.learner.state["intelligence_score"], initial_score)
        self.assertIsNotNone(res["checkpoint_id"])

    def test_learning_rollback(self):
        # Clear default learned rules for clean test isolation
        self.learner.state["learned_rules"] = []
        res1 = self.learner.ingest_feedback("CORRECTION_ACCEPTED", "test_rule", "strict_mode")
        chk_id = res1["checkpoint_id"]

        # Add another feedback
        self.learner.ingest_feedback("CORRECTION_ACCEPTED", "test_rule", "relaxed_mode")
        
        # Roll back to first checkpoint
        rb = self.learner.rollback_learning(chk_id)
        self.assertEqual(rb["status"], "ROLLED_BACK")
        
        # Verify rule restored to strict_mode (safely handling iteration)
        rules = [r for r in self.learner.state["learned_rules"] if r["topic"] == "test_rule"]
        self.assertTrue(len(rules) > 0)
        self.assertEqual(rules[0]["preference"], "strict_mode")

if __name__ == "__main__":
    unittest.main()
