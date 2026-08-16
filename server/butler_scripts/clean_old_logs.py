import time
from pathlib import Path
ROOT = Path.home(); DAYS = 30
cutoff = time.time() - DAYS*86400
removed = freed = 0
for f in ROOT.rglob("*.log"):
    try:
        if f.stat().st_mtime < cutoff:
            sz = f.stat().st_size
            f.unlink(); removed += 1; freed += sz
    except Exception:
        pass
print(f"✓ Removed {removed} old logs, freed {freed/1024:.1f} KB")