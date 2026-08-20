#!/usr/bin/env python3
"""
BUTLER AI — OBSERVATORY TEST SUITE v1.0
Validates live event ingestion, metric incrementing, and snapshot retrieval.
"""

import unittest
from butler_observatory import ButlerActivityObservatory
import os

class TestButlerObservatory(unittest.TestCase):
    def setUp(self):
        self.test_path = "/home/ubuntu/preserved_60mb/server/vault_store/test_obs.json"
        if os.path.exists(self.test_path):
            os.remove(self.test_path)
        self.obs = ButlerActivityObservatory(storage_path=self.test_path)

    def tearDown(self):
        if os.path.exists(self.test_path):
            os.remove(self.test_path)

    def test_push_event_and_metrics(self):
        initial_nodes = self.obs.state["memory_nodes_organized"]
        self.obs.push_event("MEMORY", "New cluster integrated")
        self.assertEqual(self.obs.state["memory_nodes_organized"], initial_nodes + 1)
        self.assertEqual(len(self.obs.state["recent_events"]), 4)

    def test_snapshot(self):
        snap = self.obs.get_observatory_snapshot()
        self.assertIn("cpu_load_pct", snap)
        self.assertIn("crawler_docs_indexed", snap)

if __name__ == "__main__":
    unittest.main()
