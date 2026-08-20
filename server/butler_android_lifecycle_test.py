#!/usr/bin/env python3
import unittest
from butler_android_lifecycle import ButlerAndroidLifecycleGovernor

class TestButlerAndroidLifecycle(unittest.TestCase):
    def setUp(self):
        self.gov = ButlerAndroidLifecycleGovernor()

    def test_foreground_unrestricted(self):
        res = self.gov.request_crawler_execution(120)
        self.assertEqual(res["status"], "PERMITTED")
        self.assertEqual(res["mode"], "UNRESTRICTED_FOREGROUND")

    def test_background_throttling(self):
        self.gov.set_app_state("BACKGROUND")
        res_long = self.gov.request_crawler_execution(60)
        self.assertEqual(res_long["status"], "THROTTLED")

        res_short = self.gov.request_crawler_execution(20)
        self.assertEqual(res_short["status"], "PERMITTED")

if __name__ == "__main__":
    unittest.main()
