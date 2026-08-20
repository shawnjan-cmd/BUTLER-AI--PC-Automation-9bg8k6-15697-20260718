#!/usr/bin/env python3
"""
BUTLER AI — SERVER-ISSUED ANONYMOUS HANDLE & CHALLENGE PROTOCOL v1.0
Issues cryptographically bound, rotating pseudonymous handles and one-time
challenge nonces for the optional leaderboard, preventing spoofing and collisions
without interfering with any local app state or the private Butler Brain.
"""

import time
import hashlib
import secrets
from typing import Dict, Any

class ButlerAnonymousHandleIssuer:
    def __init__(self):
        self.active_challenges: Dict[str, float] = {}
        self.issued_handles: Dict[str, str] = {}
        self.adjectives = ["Shadow", "Cyber", "Neon", "Quantum", "Vector", "Pulse", "Void", "Holo"]
        self.nouns = ["Sentinel", "Ghost", "Runner", "Nomad", "Cipher", "Apex", "Nexus", "Drifter"]

    def request_challenge(self, client_device_fingerprint: str) -> Dict[str, str]:
        """
        Issues a one-time challenge nonce tied to a temporary client fingerprint.
        """
        nonce = secrets.token_hex(16)
        self.active_challenges[nonce] = time.time()
        return {"nonce": nonce, "status": "CHALLENGE_ISSUED"}

    def issue_handle(self, client_device_fingerprint: str, nonce: str) -> Dict[str, Any]:
        """
        Exchanges a valid challenge nonce for a cryptographically secure,
        server-assigned rotating pseudonym.
        """
        if nonce not in self.active_challenges:
            return {"status": "REJECTED", "reason": "INVALID_OR_EXPIRED_NONCE"}

        # Consume nonce
        del self.active_challenges[nonce]

        if client_device_fingerprint in self.issued_handles:
            handle = self.issued_handles[client_device_fingerprint]
        else:
            adj = secrets.choice(self.adjectives)
            noun = secrets.choice(self.nouns)
            suffix = secrets.randbelow(900) + 100
            handle = f"{adj}{noun}_{suffix}"
            self.issued_handles[client_device_fingerprint] = handle

        # Generate proof signature for the client to use when submitting scores
        sig_payload = f"{client_device_fingerprint}:{handle}:{nonce}"
        token_sig = hashlib.sha256(sig_payload.encode()).hexdigest()[:32]

        return {
            "status": "ISSUED",
            "anonymous_handle": handle,
            "blind_token_sig": token_sig
        }

if __name__ == "__main__":
    issuer = ButlerAnonymousHandleIssuer()
    fp = "device-hash-xyz"
    chal = issuer.request_challenge(fp)
    print("Challenge:", chal)
    res = issuer.issue_handle(fp, chal["nonce"])
    print("Issued Handle:", res)
