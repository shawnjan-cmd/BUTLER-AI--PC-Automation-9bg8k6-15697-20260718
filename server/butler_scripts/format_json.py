import json, sys
from pathlib import Path
PATH = Path.home() / "Desktop" / "data.json"   # ← edit me
if not PATH.exists():
    print(f"Edit PATH to point at a JSON file."); raise SystemExit
data = json.loads(PATH.read_text(encoding="utf-8"))
PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"✓ {PATH} formatted")