#!/usr/bin/env python3
import unittest
import os
import shutil
from butler_script_workshop import ButlerScriptWorkshop

class TestButlerScriptWorkshop(unittest.TestCase):
    def setUp(self):
        self.test_dir = "/home/ubuntu/preserved_60mb/test_workshop_sandbox"
        self.workshop = ButlerScriptWorkshop(workspace_dir=self.test_dir)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_syntax_linting(self):
        valid = "def run():\n    pass"
        invalid = "def run(\n    pass"
        self.assertEqual(self.workshop.lint_script(valid)["status"], "VALID")
        self.assertEqual(self.workshop.lint_script(invalid)["status"], "INVALID_SYNTAX")

    def test_create_and_discover(self):
        code = "print('hello')"
        res = self.workshop.create_or_edit_script("test_bot.py", code)
        self.assertEqual(res["status"], "SAVED")

        scripts = self.workshop.discover_scripts()
        self.assertEqual(len(scripts), 1)
        self.assertEqual(scripts[0]["path"], "test_bot.py")

if __name__ == "__main__":
    unittest.main()
