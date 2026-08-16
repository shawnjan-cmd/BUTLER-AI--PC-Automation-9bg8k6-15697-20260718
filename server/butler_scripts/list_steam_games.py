import re
from pathlib import Path
ROOT = Path(r"C:/Program Files (x86)/Steam/steamapps")
if not ROOT.exists():
    print(f"Not found: {ROOT}"); raise SystemExit
games = []
for f in ROOT.glob("appmanifest_*.acf"):
    m = re.search(r'"name"\s*"([^"]+)"', f.read_text(encoding="utf-8", errors="ignore"))
    if m: games.append(m.group(1))
for g in sorted(games): print(f"  • {g}")
print(f"\n{len(games)} installed games")