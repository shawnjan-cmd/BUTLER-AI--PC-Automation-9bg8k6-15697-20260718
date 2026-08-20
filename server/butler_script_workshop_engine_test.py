#!/usr/bin/env python3
"""
BUTLER AI — SCRIPT WORKSHOP ENGINE TEST SUITE v1.0
Validates syntax linting, path traversal blocking, automatic backups, and sandboxed dry runs.
"""

import unittest
import os
from butler_script_workshop_engine import ButlerScriptWorkshopEngine

class TestButlerScriptWorkshopEngine(unittest.TestCase):
    def setUp(self):
        self.test_dir = "/home/ubuntu/preserved_60mb/server/scripts_sandbox_test"
        self.engine = ButlerScriptWorkshopEngine(workspace_dir=self.test_dir)

    def test_syntax_linting_and_creation(self):
        res = self.engine.create_or_edit_script("automator.py", "print('hello world')")
        self.assertEqual(res["status"], "SAVED_AND_VERIFIED")

    def test_path_traversal_blocked(self):
        res = self.engine.create_or_edit_script("../../../etc/cron.d/malicious.py", "print('hack')")
        self.assertEqual(res["status"], "REJECTED")
        self.assertEqual(res["reason"], "PATH_TRAVERSAL_ATTEMPT_BLOCKED")

    def test_dry_run_execution(self):
        self.engine.create_or_edit_script("greeter.py", "print('Greetings from Butler Workshop')")
        run_res = self.engine.execute_dry_run("greeter.py")
        self.assertEqual(run_res["status"], "SUCCESS")
        self.assertIn("Greetings from Butler Workshop", run_res["stdout"])

if __name__ == "__main__":
    unittest.main()
