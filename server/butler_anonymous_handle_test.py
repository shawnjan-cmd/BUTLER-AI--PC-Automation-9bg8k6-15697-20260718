#!/usr/bin/env python3
import unittest
from butler_anonymous_handle import ButlerAnonymousHandleIssuer

class TestButlerAnonymousHandle(unittest.TestCase):
    def setUp(self):
        self.issuer = ButlerAnonymousHandleIssuer()

    def test_challenge_and_issue(self):
        fp = "test-device-fingerprint-001"
        chal = self.issuer.request_challenge(fp)
        self.assertIn("nonce", chal)

        res = self.issuer.issue_handle(fp, chal["nonce"])
        self.assertEqual(res["status"], "ISSUED")
        self.assertTrue(res["anonymous_handle"])
        self.assertTrue(res["blind_token_sig"])

    def test_invalid_nonce_rejection(self):
        res = self.issuer.issue_handle("test-device-002", "fake-nonce-999")
        self.assertEqual(res["status"], "REJECTED")

if __name__ == "__main__":
    unittest.main()
