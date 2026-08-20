#!/usr/bin/env python3
"""
BUTLER AI — RED-TEAM ADVERSARIAL & FUZZING TEST SUITE v1.0
Simulates unauthorized attacks, path traversal probes, brute-force vault unlocking,
pairing lockout replays, and malformed script injections.
"""

import unittest
from butler_server import vault, script_workshop, PAIRING_STATE
import secrets

class TestButlerRedTeam(unittest.TestCase):
    def test_brute_force_vault_lockout(self):
        # Exhaust 5 attempts with invalid PIN
        for _ in range(5):
            res = vault.unlock_vault("000000")
        
        # 6th attempt should trigger lockout
        res_locked = vault.unlock_vault("000000")
        self.assertEqual(res_locked["status"], "LOCKED_OUT")

    def test_path_traversal_script_blocking(self):
        res = script_workshop.create_or_edit_script("../../../etc/passwd", "malicious_code = True")
        self.assertEqual(res["status"], "BLOCKED")

    def test_malformed_syntax_rejection(self):
        res = script_workshop.create_or_edit_script("bad_syntax.py", "def broken_syntax( - ")
        self.assertEqual(res["status"], "SYNTAX_ERROR")

if __name__ == "__main__":
    unittest.main()
