#!/usr/bin/env python3
import unittest
import time
from butler_leaderboard_chat import ButlerLeaderboardChatRoom

class TestButlerLeaderboardChat(unittest.TestCase):
    def setUp(self):
        self.chat = ButlerLeaderboardChatRoom(rate_limit_seconds=0.2, max_message_length=100)

    def test_post_and_retrieve(self):
        res = self.chat.post_message("token_alpha", "NeonNomad_123", 900, "Automating localhost like a boss.")
        self.assertEqual(res["status"], "POSTED")
        msgs = self.chat.get_messages()
        self.assertEqual(len(msgs), 1)
        self.assertEqual(msgs[0]["handle"], "NeonNomad_123")
        self.assertEqual(msgs[0]["gamerscore"], 900)

    def test_rate_limiting(self):
        token = "token_beta"
        self.chat.post_message(token, "QuantumDrifter_456", 500, "First message")
        res2 = self.chat.post_message(token, "QuantumDrifter_456", 500, "Rapid spam message")
        self.assertEqual(res2["status"], "REJECTED")
        self.assertEqual(res2["reason"], "RATE_LIMIT_EXCEEDED")

if __name__ == "__main__":
    unittest.main()
