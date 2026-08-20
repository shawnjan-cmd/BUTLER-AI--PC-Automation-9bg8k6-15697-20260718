#!/usr/bin/env python3
"""
BUTLER AI — FLOW GOVERNOR TEST SUITE v1.0
Validates priority queuing, resource throttling, and lag notice anti-spam cooldown.
"""

import unittest
from butler_flow_governor import ButlerFlowGovernor

class TestButlerFlowGovernor(unittest.TestCase):
    def setUp(self):
        self.gov = ButlerFlowGovernor()

    def test_priority_queuing(self):
        self.gov.enqueue_task("background_crawler", {"doc": "test"}, priority=3)
        self.gov.enqueue_task("user_chat", {"msg": "hello"}, priority=1)
        
        # Next task executed should be priority 1 (user chat)
        res = self.gov.process_next_task()
        self.assertEqual(res["executed_task"]["type"], "user_chat")

    def test_performance_throttle_and_cooldown(self):
        eval1 = self.gov.evaluate_performance(90.0, 15.0)
        self.assertTrue(eval1["is_lagging"])
        self.assertTrue(eval1["notice_triggered"])

        # Immediate second evaluation should not trigger another notification due to cooldown
        eval2 = self.gov.evaluate_performance(92.0, 15.5)
        self.assertTrue(eval2["is_lagging"])
        self.assertFalse(eval2["notice_triggered"])

if __name__ == "__main__":
    unittest.main()
