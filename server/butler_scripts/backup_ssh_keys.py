import zipfile, time
from pathlib import Path
src = Path.home() / '.ssh'
if not src.exists(): print('No ~/.ssh folder'); raise SystemExit
dst = Path.home() / 'Desktop' / f'ssh_backup_{time.strftime("%Y%m%d_%H%M%S")}.zip'
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in src.rglob('*'):
        if f.is_file(): z.write(f, f.relative_to(src.parent))
print(f'[OK] {dst.name} ({dst.stat().st_size} bytes)')
print('[!] Store this somewhere safe (USB / password manager)')