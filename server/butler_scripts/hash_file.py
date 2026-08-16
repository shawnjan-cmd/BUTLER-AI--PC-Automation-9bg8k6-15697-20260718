import hashlib, sys
from pathlib import Path
PATH = Path.home() / "Desktop"   # ← edit me
if PATH.is_dir():
    print(f"PATH is a folder. Edit PATH to a file.")
    raise SystemExit
h = hashlib.sha256()
with open(PATH, "rb") as f:
    for chunk in iter(lambda: f.read(1 << 20), b""): h.update(chunk)
print(f"{PATH.name}\nSHA-256: {h.hexdigest()}")