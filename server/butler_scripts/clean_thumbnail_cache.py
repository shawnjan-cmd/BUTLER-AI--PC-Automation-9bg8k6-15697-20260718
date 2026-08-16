import os
from pathlib import Path
p = Path.home()/'AppData/Local/Microsoft/Windows/Explorer'
if not p.exists(): print('Path not found'); raise SystemExit
n = 0
for f in p.glob('thumbcache_*.db'):
    try: f.unlink(); n += 1
    except Exception: pass
for f in p.glob('iconcache_*.db'):
    try: f.unlink(); n += 1
    except Exception: pass
print(f'[OK] Removed {n} thumbnail cache files (Explorer will rebuild)')