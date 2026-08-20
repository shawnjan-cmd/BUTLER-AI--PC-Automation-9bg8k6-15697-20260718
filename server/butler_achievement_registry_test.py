#!/usr/bin/env python3
import unittest
from butler_achievement_registry import ACHIEVEMENT_CATALOG, calculate_total_gamerscore

class TestButlerAchievementRegistry(unittest.TestCase):
    def test_total_gamerscore(self):
        all_ids = [a["id"] for a in ACHIEVEMENT_CATALOG]
        total = calculate_total_gamerscore(all_ids)
        self.assertEqual(total, 1000)

    def test_unique_ids_and_titles(self):
        ids = [a["id"] for a in ACHIEVEMENT_CATALOG]
        titles = [a["title"] for a in ACHIEVEMENT_CATALOG]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(titles), len(set(titles)))

if __name__ == "__main__":
    unittest.main()
