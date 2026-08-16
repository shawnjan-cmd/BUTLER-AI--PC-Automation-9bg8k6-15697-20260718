from pathlib import Path
ROOT = Path.cwd()
EXTS = {".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".java", ".go", ".rs", ".rb"}
totals = {}; gtotal = 0
for f in ROOT.rglob("*"):
    if f.suffix.lower() not in EXTS or not f.is_file(): continue
    if any(p in {"node_modules",".git","dist","build","__pycache__"} for p in f.parts): continue
    try:
        n = sum(1 for line in f.open("r", encoding="utf-8", errors="ignore") if line.strip())
        totals[f.suffix] = totals.get(f.suffix, 0) + n; gtotal += n
    except Exception: pass
for ext, n in sorted(totals.items(), key=lambda x:-x[1]):
    print(f"  {ext:6} {n:>8}")
print(f"\nTOTAL  {gtotal} lines in {ROOT}")