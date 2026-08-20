#!/usr/bin/env python3
"""
BUTLER AI — UNIVERSAL CONTROLLER TEST SUITE v1.0
Validates self-diagnosis and reversible self-repair routines.
"""

import unittest
from butler_universal_controller import ButlerUniversalController

class TestButlerUniversalController(unittest.TestCase):
    def setUp(self):
        self.controller = ButlerUniversalController()

    def test_health_diagnosis_and_repair(self):
        res = self.controller.run_self_diagnosis()
        self.assertEqual(res["status"], "HEALTHY")
        
        status = self.controller.get_universal_status()
        self.assertEqual(status["health_status"], "OPTIMAL")

if __name__ == "__main__":
    unittest.main()
