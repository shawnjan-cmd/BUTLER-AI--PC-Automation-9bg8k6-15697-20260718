#!/usr/bin/env python3
import unittest
from butler_ai_resilience import ButlerAIResilienceEngine

class TestButlerAIResilience(unittest.TestCase):
    def setUp(self):
        self.engine = ButlerAIResilienceEngine(timeout_seconds=0.1)

    def test_empty_prompt(self):
        res = self.engine.query_ai_model("")
        self.assertEqual(res["status"], "REJECTED")

    def test_fallback_behavior(self):
        res = self.engine.query_ai_model("Hello Butler")
        # Since local Ollama is offline in sandbox test, it should return graceful fallback
        self.assertEqual(res["status"], "FALLBACK")
        self.assertEqual(res["source"], "LOCAL_DETERMINISTIC")
        self.assertIn("Butler Local Fallback Engine", res["response"])

if __name__ == "__main__":
    unittest.main()
