from pathlib import Path
ROOT = Path.home(); MIN = 100 * 1024 * 1024
hits = []
for f in ROOT.rglob("*"):
    try:
        if f.is_file() and f.stat().st_size >= MIN:
            hits.append((f.stat().st_size, f))
    except (PermissionError, OSError):
        pass
hits.sort(reverse=True)
for sz, f in hits[:30]:
    print(f"{sz/1024/1024:8.1f} MB   {f}")
print(f"\n{len(hits)} files ≥ 100 MB total")