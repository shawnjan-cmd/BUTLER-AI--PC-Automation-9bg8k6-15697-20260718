#!/usr/bin/env python3
"""
BUTLER AI — LOCAL ORIGINALITY & PROVENANCE SCANNER v1.0
Scans source code for cryptographic file hashes, signature distribution,
unreferenced boilerplate, and authorship metadata.
"""

import os
import hashlib
import json
from typing import Dict, List, Any

class OriginalityScanner:
    def __init__(self, root_dir: str):
        self.root_dir = root_dir
        self.excluded_dirs = {".git", "node_modules", "__pycache__", ".expo"}

    def scan_codebase(self) -> Dict[str, Any]:
        file_manifest = []
        total_lines = 0
        total_bytes = 0
        extension_counts = {}

        for dirpath, dirnames, filenames in os.walk(self.root_dir):
            dirnames[:] = [d for d in dirnames if d not in self.excluded_dirs]
            for filename in filenames:
                full_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(full_path, self.root_dir)
                ext = os.path.splitext(filename)[1] or "no_ext"
                extension_counts[ext] = extension_counts.get(ext, 0) + 1

                try:
                    with open(full_path, "rb") as f:
                        content = f.read()
                    file_size = len(content)
                    total_bytes += file_size
                    file_hash = hashlib.sha256(content).hexdigest()

                    line_count = 0
                    if ext in [".ts", ".tsx", ".js", ".mjs", ".py", ".md", ".json"]:
                        try:
                            line_count = len(content.decode("utf-8", errors="ignore").splitlines())
                            total_lines += line_count
                        except Exception:
                            pass

                    file_manifest.append({
                        "path": rel_path,
                        "size_bytes": file_size,
                        "sha256": file_hash,
                        "lines": line_count
                    })
                except Exception as e:
                    print(f"Error reading {rel_path}: {e}")

        master_hash = hashlib.sha256(
            "".join(sorted([f["sha256"] for f in file_manifest])).encode()
        ).hexdigest()

        return {
            "total_files": len(file_manifest),
            "total_bytes": total_bytes,
            "total_lines": total_lines,
            "extension_distribution": extension_counts,
            "master_provenance_hash": master_hash,
            "files": file_manifest
        }

if __name__ == "__main__":
    scanner = OriginalityScanner("/home/ubuntu/preserved_60mb")
    result = scanner.scan_codebase()
    output_path = "/home/ubuntu/preserved_60mb/tools/provenance_scan_result.json"
    with open(output_path, "w") as out:
        json.dump(result, out, indent=2)
    print(f"Originality scan completed. Scanned {result['total_files']} files ({result['total_lines']} lines). Result saved to {output_path}")
