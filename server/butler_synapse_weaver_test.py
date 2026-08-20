#!/usr/bin/env python3
import unittest
from butler_synapse_weaver import ButlerSynapseWeaver

class TestButlerSynapseWeaver(unittest.TestCase):
    def setUp(self):
        self.weaver = ButlerSynapseWeaver()

    def test_weave_and_graph(self):
        res1 = self.weaver.weave_memory("Python Core", "FastAPI automation bridge", "Backend")
        res2 = self.weaver.weave_memory("Encrypted Vault", "AES-256 local storage", "Security")

        self.assertEqual(res1["status"], "WOVEN")
        self.assertEqual(res2["status"], "WOVEN")

        graph = self.weaver.get_knowledge_graph()
        self.assertEqual(graph["total_nodes"], 2)
        self.assertEqual(len(graph["edges"]), 1)

if __name__ == "__main__":
    unittest.main()
