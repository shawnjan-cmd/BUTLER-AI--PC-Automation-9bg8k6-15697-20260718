#!/usr/bin/env python3
import unittest
from butler_brain_engine import ButlerEncryptedVault, ButlerBrainOrchestrator

class TestButlerBrainEngine(unittest.TestCase):
    def test_vault_encryption(self):
        vault = ButlerEncryptedVault()
        record = "Sensitive system automation token"
        encrypted = vault.encrypt_record(record)
        self.assertEqual(encrypted["cipher"], "AES-256-GCM-SIM")
        decrypted = vault.decrypt_record(encrypted)
        self.assertEqual(decrypted, record)

    def test_brain_orchestration(self):
        brain = ButlerBrainOrchestrator()
        ingest_res = brain.ingest_memory("Test Topic", "Test payload content")
        self.assertEqual(ingest_res["status"], "INDEXED_AND_ENCRYPTED")
        intent = brain.evaluate_intent("Run security audit script")
        self.assertTrue(intent["requires_approval"])
        self.assertEqual(intent["target_lane"], "flow_ledger_lane")

if __name__ == "__main__":
    unittest.main()
