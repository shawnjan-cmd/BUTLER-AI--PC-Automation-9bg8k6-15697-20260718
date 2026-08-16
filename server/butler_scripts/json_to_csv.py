import csv, json
from pathlib import Path
SRC = Path.home() / "Desktop" / "data.json"   # ← edit me
DST = SRC.with_suffix(".csv")
rows = json.loads(SRC.read_text(encoding="utf-8"))
if not isinstance(rows, list) or not rows:
    print("Expected non-empty JSON array of objects"); raise SystemExit
keys = sorted({k for r in rows for k in r.keys()})
with DST.open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=keys); w.writeheader(); w.writerows(rows)
print(f"✓ {len(rows)} rows → {DST}")