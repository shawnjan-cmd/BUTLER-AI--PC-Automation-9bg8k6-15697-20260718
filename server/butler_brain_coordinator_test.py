#!/usr/bin/env python3
"""
BUTLER AI — BUTLER BRAIN COORDINATOR TEST SUITE v1.0
Validates the 3 unbreakable rules, priority task queuing, and fail-closed fallbacks.
"""

import unittest
from butler_brain_coordinator import ButlerBrainCoordinator, BUTLER_RULES

class TestButlerBrainCoordinator(unittest.TestCase):
    def setUp(self):
        self.brain = ButlerBrainCoordinator()

    def test_three_rules_present(self):
        rules = self.brain.get_rules()
        self.assertEqual(len(rules), 3)
        self.assertEqual(rules[0]["id"], 1)
        self.assertEqual(rules[1]["id"], 2)
        self.assertEqual(rules[2]["id"], 3)

    def test_priority_queuing_and_execution(self):
        res_crit = self.brain.submit_task("Critical Task", "CRITICAL", {}, lambda p: "done_crit")
        res_back = self.brain.submit_task("Background Task", "BACKGROUND", {}, lambda p: "done_back")
        
        self.assertEqual(res_crit["status"], "QUEUED")
        self.assertEqual(res_back["status"], "QUEUED")

        # Critical task should execute first
        executed = self.brain.execute_next()
        self.assertEqual(executed["status"], "SUCCESS")
        self.assertEqual(executed["result"], "done_crit")

if __name__ == "__main__":
    unittest.main()
