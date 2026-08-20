#!/usr/bin/env python3
import unittest
from butler_hardened_vault import ButlerHardenedVault

class TestButlerHardenedVaultPIN(unittest.TestCase):
    def setUp(self):
        self.vault = ButlerHardenedVault()
        self.vault.set_pin("654321")

    def test_pin_length_enforcement(self):
        res = self.vault.set_pin("12345")
        self.assertEqual(res["status"], "REJECTED")

    def test_unlock_success_and_failure(self):
        bad_res = self.vault.unlock_vault("000000")
        self.assertEqual(bad_res["status"], "REJECTED")

        good_res = self.vault.unlock_vault("654321")
        self.assertEqual(good_res["status"], "UNLOCKED")

    def test_vault_store_and_query_isolation(self):
        self.vault.unlock_vault("654321")
        self.vault.store_secret_memory("k1", "ClassifiedAutomationKey")
        self.assertEqual(self.vault.query_butler_memory("k1"), "ClassifiedAutomationKey")

        self.vault.lock_vault()
        self.assertIsNone(self.vault.query_butler_memory("k1"))

if __name__ == "__main__":
    unittest.main()
