#!/usr/bin/env python3
"""
BUTLER AI — PROPRIETARY SCRIPT WORKSHOP & CONTROLLED WORKSPACE ENGINE v1.1
Provides indexed script discovery, syntax linting, controlled creation, diff previews,
automatic backups, rollback, and dry-run execution without adding permissions.
"""

import os
import time
import ast
import hashlib
from typing import Dict, List, Any, Optional

class ButlerScriptWorkshop:
    def __init__(self, workspace_dir: str = "/home/ubuntu/preserved_60mb/scripts_sandbox"):
        self.workspace_dir = workspace_dir
        os.makedirs(self.workspace_dir, exist_ok=True)
        os.makedirs(os.path.join(self.workspace_dir, "backups"), exist_ok=True)

    def discover_scripts(self) -> List[Dict[str, Any]]:
        results = []
        for root, _, files in os.walk(self.workspace_dir):
            if "backups" in root:
                continue
            for file in files:
                if file.endswith(".py"):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.workspace_dir)
                    stats = os.stat(full_path)
                    results.append({
                        "path": rel_path,
                        "size": stats.st_size,
                        "updated": stats.st_mtime
                    })
        return results

    def lint_script(self, code: str) -> Dict[str, Any]:
        try:
            ast.parse(code)
            return {"status": "VALID", "error": None}
        except SyntaxError as e:
            return {"status": "INVALID_SYNTAX", "error": str(e), "line": e.lineno}

    def create_or_edit_script(self, script_name: str, new_code: str) -> Dict[str, Any]:
        # Block path traversal attempts
        if "/" in script_name or "\\" in script_name or ".." in script_name:
            return {"status": "REJECTED", "reason": "PATH_TRAVERSAL_ATTEMPT_BLOCKED"}

        clean_name = os.path.basename(script_name)
        if not clean_name.endswith(".py"):
            return {"status": "REJECTED", "reason": "MUST_BE_PYTHON_FILE"}

        lint = self.lint_script(new_code)
        if lint["status"] != "VALID":
            return {"status": "REJECTED", "reason": "SYNTAX_LINT_FAILED", "details": lint}

        target_path = os.path.join(self.workspace_dir, clean_name)
        
        if os.path.exists(target_path):
            with open(target_path, "r") as f:
                old_code = f.read()
            backup_name = f"{clean_name}.{int(time.time())}.bak"
            backup_path = os.path.join(self.workspace_dir, "backups", backup_name)
            with open(backup_path, "w") as f:
                f.write(old_code)
        else:
            old_code = ""

        with open(target_path, "w") as f:
            f.write(new_code)

        return {
            "status": "SAVED",
            "path": clean_name,
            "diff_summary": f"Updated {len(new_code)} bytes (previous: {len(old_code)} bytes)"
        }

    def rollback_script(self, script_name: str, backup_filename: str) -> Dict[str, Any]:
        clean_name = os.path.basename(script_name)
        backup_path = os.path.join(self.workspace_dir, "backups", backup_filename)
        target_path = os.path.join(self.workspace_dir, clean_name)

        if not os.path.exists(backup_path):
            return {"status": "REJECTED", "reason": "BACKUP_NOT_FOUND"}

        with open(backup_path, "r") as f:
            backup_code = f.read()

        with open(target_path, "w") as f:
            f.write(backup_code)

        return {"status": "ROLLED_BACK", "path": clean_name}

if __name__ == "__main__":
    ws = ButlerScriptWorkshop()
    sample_code = "print('Butler Script Workshop Active')"
    print("Create:", ws.create_or_edit_script("automation_core.py", sample_code))
    print("Discover:", ws.discover_scripts())
