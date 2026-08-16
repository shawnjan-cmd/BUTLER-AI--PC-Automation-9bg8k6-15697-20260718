import subprocess, shutil
from pathlib import Path
target = Path('C:/Windows/SoftwareDistribution/Download')
if not target.exists(): print('Not on Windows or path missing'); raise SystemExit
subprocess.run(['net','stop','wuauserv'], capture_output=True)
try:
    sz = sum(f.stat().st_size for f in target.rglob('*') if f.is_file())
    shutil.rmtree(target, ignore_errors=True)
    target.mkdir(parents=True, exist_ok=True)
    print(f'[OK] Cleared {sz/1024/1024:.1f} MB of Windows Update cache')
except Exception as e:
    print(f'[ERR] {e}')
subprocess.run(['net','start','wuauserv'], capture_output=True)
print('[DONE] Update service restarted')