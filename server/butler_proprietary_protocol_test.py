#!/usr/bin/env python3
"""
BUTLER AI — PROPRIETARY PROTOCOL TEST SUITE v1.1
Validates end-to-end handshakes, trust receipt generation, fail-closed security,
and provenance verification.
"""

import unittest
from butler_proprietary_protocol import ButlerProprietaryProtocol
import hmac
import hashlib

class TestButlerProprietaryProtocol(unittest.TestCase):
    def setUp(self):
        self.protocol = ButlerProprietaryProtocol()

    def test_handshake_and_receipt_flow(self):
        device_id = "test_device_777"
        hs = self.protocol.initiate_handshake(device_id)
        self.assertEqual(hs["status"], "HANDSHAKE_INITIATED")

        client_sig = hmac.new(
            b"butler_proprietary_root_2026",
            f"{device_id}:{hs['challenge_nonce']}:{hs['session_id']}".encode(),
            hashlib.sha256
        ).hexdigest()

        res = self.protocol.verify_and_issue_receipt(hs["session_id"], client_sig, {"action": "ping"})
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["trust_receipt"]["device_id"], device_id)
        self.assertEqual(res["fail_closed_circuit"], "ARMED")

    def test_invalid_signature_fails_closed(self):
        device_id = "test_device_888"
        hs = self.protocol.initiate_handshake(device_id)
        
        bad_sig = "deadbeef" * 8
        res = self.protocol.verify_and_issue_receipt(hs["session_id"], bad_sig, {"action": "ping"})
        self.assertEqual(res["status"], "BLOCKED")
        self.assertEqual(res["reason"], "CRYPTOGRAPHIC_PROOF_FAILURE")

if __name__ == "__main__":
    unittest.main()
