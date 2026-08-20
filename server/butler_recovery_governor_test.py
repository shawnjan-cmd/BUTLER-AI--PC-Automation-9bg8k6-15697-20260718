#!/usr/bin/env python3
"""
BUTLER AI — RECOVERY GOVERNOR TEST SUITE v1.0
Validates emergency panic shutdown, process pruning, and vault lockdown.
"""

import unittest
from butler_recovery_governor import ButlerRecoveryGovernor

class TestButlerRecoveryGovernor(unittest.TestCase):
    def setUp(self):
        self.gov = ButlerRecoveryGovernor()

    def test_emergency_shutdown(self):
        res = self.gov.emergency_panic_shutdown()
        self.assertEqual(res["status"], "EMERGENCY_SHUTDOWN_EXECUTED")
        self.assertEqual(res["vault_status"], "LOCKED_FAIL_CLOSED")

    def test_prune_zombies(self):
        pruned = self.gov.prune_zombie_processes()
        self.assertGreaterEqual(pruned, 0)

if __name__ == "__main__":
    unittest.main()
