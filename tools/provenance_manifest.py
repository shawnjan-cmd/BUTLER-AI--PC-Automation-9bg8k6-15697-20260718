"""Create a deterministic provenance manifest for a Butler source snapshot.

This proves integrity of a supplied snapshot, not legal authorship by itself.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

EXCLUDED_PARTS = {"node_modules", ".expo", "__pycache__", ".git", "dist", "build"}
TEXT_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".json", ".md", ".toml", ".yaml", ".yml", ".css"}


def classify(path: Path) -> str:
    name = path.as_posix()
    if any(x in name for x in ("flow_ledger", "capability_policy", "trust_decay", "proprietary_runtime", "flowLedger.ts", "NOVEL_MECHANISM", "PROVENANCE_AND_ORIGINALITY")):
        return "BUTLER_AUTHORED_OR_UNVERIFIED_ORIGINALITY"
    if "third_party" in name.lower() or "license" in name.lower() or "pnpm-lock" in name:
        return "THIRD_PARTY_OR_LICENSE_RECORD"
    if "/server/butler_scripts/" in name or "/assets/" in name:
        return "INHERITED_OR_ASSET_REQUIRES_REVIEW"
    return "PROJECT_SOURCE_REQUIRES_PROVENANCE_REVIEW"


def build(root: Path) -> dict:
    entries = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        rel = path.relative_to(root)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        data = path.read_bytes()
        entries.append({"path": rel.as_posix(), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "classification": classify(rel)})
    tree = hashlib.sha256("".join(f"{x['path']}:{x['sha256']}\n" for x in entries).encode()).hexdigest()
    return {"schema": "butler-provenance-v1", "root": str(root), "sourceTreeSha256": tree, "fileCount": len(entries), "entries": entries, "disclaimer": "Integrity evidence for this snapshot; not standalone proof of authorship or legal ownership."}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(build(args.root), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
