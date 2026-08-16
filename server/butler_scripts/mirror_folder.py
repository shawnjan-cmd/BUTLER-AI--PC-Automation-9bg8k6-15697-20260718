import shutil
from pathlib import Path
SRC = Path.home() / "Documents"             # ← edit me
DST = Path.home() / "Backups" / "Documents" # ← edit me
DST.mkdir(parents=True, exist_ok=True)
copied = 0
for f in SRC.rglob("*"):
    if not f.is_file(): continue
    rel = f.relative_to(SRC); target = DST / rel
    if not target.exists() or f.stat().st_mtime > target.stat().st_mtime:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, target); copied += 1
print(f"✓ {copied} files synced to {DST}")