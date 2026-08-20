import unittest
import os

class TestPromptIntegrity(unittest.TestCase):
    def test_prompt_files_exist(self):
        canonical = '/home/ubuntu/preserved_60mb/BUTLER_AI_MASTER_CODING_PROMPT.md'
        app_copy = '/home/ubuntu/preserved_60mb/app/BUTLER_CODING_PROMPT.md'
        server_copy = '/home/ubuntu/preserved_60mb/server/BUTLER_SERVER_CODING_PROMPT.md'
        
        self.assertTrue(os.path.exists(canonical), "Canonical prompt missing")
        self.assertTrue(os.path.exists(app_copy), "App prompt copy missing")
        self.assertTrue(os.path.exists(server_copy), "Server prompt copy missing")

    def test_prompt_content_validity(self):
        canonical = '/home/ubuntu/preserved_60mb/BUTLER_AI_MASTER_CODING_PROMPT.md'
        with open(canonical, 'r') as f:
            content = f.read()
        self.assertIn("10 Inviolable Laws", content)
        self.assertIn("Local-First Privacy Circuit", content)

if __name__ == '__main__':
    unittest.main()
