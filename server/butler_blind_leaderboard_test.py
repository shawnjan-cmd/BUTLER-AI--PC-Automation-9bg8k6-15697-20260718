#!/usr/bin/env python3
import unittest
import hashlib
import time
from butler_blind_leaderboard import ButlerBlindLeaderboard

class TestButlerBlindLeaderboardAntiCheat(unittest.TestCase):
    def setUp(self):
        self.lb = ButlerBlindLeaderboard(min_update_interval=0.2, max_score_delta=300)

    def test_valid_registration(self):
        token = "token_clean_1"
        proof = hashlib.sha256(f"{token}:200".encode()).hexdigest()[:16]
        res = self.lb.register_score(token, "CleanPlayer", 200, proof)
        self.assertEqual(res["status"], "REGISTERED")

    def test_rate_limiting_bot(self):
        token = "token_bot_1"
        proof1 = hashlib.sha256(f"{token}:100".encode()).hexdigest()[:16]
        self.lb.register_score(token, "BotUser", 100, proof1)

        # Immediate second update should fail rate limit
        proof2 = hashlib.sha256(f"{token}:150".encode()).hexdigest()[:16]
        res2 = self.lb.register_score(token, "BotUser", 150, proof2)
        self.assertEqual(res2["status"], "REJECTED")
        self.assertEqual(res2["reason"], "RATE_LIMIT_EXCEEDED")

    def test_excessive_delta(self):
        token = "token_cheater_1"
        proof1 = hashlib.sha256(f"{token}:100".encode()).hexdigest()[:16]
        self.lb.register_score(token, "Cheater", 100, proof1)

        time.sleep(0.3)
        # Jump by 5000 points (exceeds max_score_delta of 300)
        proof2 = hashlib.sha256(f"{token}:5100".encode()).hexdigest()[:16]
        res2 = self.lb.register_score(token, "Cheater", 5100, proof2)
        self.assertEqual(res2["status"], "REJECTED")
        self.assertEqual(res2["reason"], "EXCESSIVE_SCORE_DELTA")

if __name__ == "__main__":
    unittest.main()
