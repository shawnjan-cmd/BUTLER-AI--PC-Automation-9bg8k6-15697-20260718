#!/usr/bin/env python3
import unittest
from butler_proprietary_engine import ButlerProprietaryEngine

class TestButlerProprietaryEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ButlerProprietaryEngine()

    def test_topology_calculation(self):
        nodes = [{"id": "a", "neighbors": ["b"]}, {"id": "b", "neighbors": ["a"]}]
        res = self.engine.compute_crawler_topology(nodes)
        self.assertEqual(res["nodes"], 2)
        self.assertEqual(res["edges"], 2)
        self.assertIn("signature", res)

    def test_memory_trust(self):
        res = self.engine.evaluate_memory_trust("test_1", "secure memory payload", 0.95)
        self.assertIn("trust_score", res)
        self.assertEqual(res["status"], "VERIFIED_PROPRIETARY")

if __name__ == "__main__":
    unittest.main()
