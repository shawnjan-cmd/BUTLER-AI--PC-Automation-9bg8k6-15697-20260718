import platform, os
from pathlib import Path
if platform.system()!='Windows': print('Windows only'); raise SystemExit
p = Path(os.environ.get('SystemRoot','C:/Windows'))/'Prefetch'
if not p.exists(): print('No Prefetch folder'); raise SystemExit
n=freed=0
for f in p.glob('*.pf'):
    try:
        sz=f.stat().st_size; f.unlink(); n+=1; freed+=sz
    except Exception: pass
print(f'✓ Removed {n} prefetch files, freed {freed/1024/1024:.1f} MB')