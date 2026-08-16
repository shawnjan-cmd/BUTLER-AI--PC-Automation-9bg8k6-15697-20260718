import platform, os
from pathlib import Path
if platform.system()!='Windows': print('Windows only'); raise SystemExit
recent = Path(os.environ['APPDATA'])/'Microsoft'/'Windows'/'Recent'
n=0
for f in recent.rglob('*'):
    try:
        if f.is_file(): f.unlink(); n+=1
    except Exception: pass
print(f'✓ Cleared {n} recent-file entries')