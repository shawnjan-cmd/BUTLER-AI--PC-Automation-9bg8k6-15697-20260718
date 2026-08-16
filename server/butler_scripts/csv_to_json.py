import csv, json
from pathlib import Path
SRC = Path.home() / "Desktop" / "data.csv"   # ← edit me
DST = SRC.with_suffix(".json")
with SRC.open(newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
DST.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"✓ {len(rows)} rows → {DST}")