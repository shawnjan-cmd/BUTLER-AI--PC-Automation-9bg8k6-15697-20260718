import hashlib
from collections import defaultdict
from pathlib import Path
ROOT = Path.home() / "Downloads"     # ← edit me
groups = defaultdict(list)
for f in ROOT.rglob("*"):
    if not f.is_file(): continue
    try:
        h = hashlib.sha1()
        with open(f, "rb") as fp:
            for c in iter(lambda: fp.read(1 << 16), b""): h.update(c)
        groups[h.hexdigest()].append(f)
    except Exception:
        pass
n = 0
for digest, files in groups.items():
    if len(files) > 1:
        n += 1
        print(f"\n● {digest[:12]} ({len(files)} copies)")
        for f in files: print(f"    {f}")
print(f"\n{n} duplicate groups in {ROOT}")