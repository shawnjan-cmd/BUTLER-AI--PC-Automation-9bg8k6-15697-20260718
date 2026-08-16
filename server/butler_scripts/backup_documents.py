import zipfile, time
from pathlib import Path
src = Path.home() / 'Documents'
dst = Path.home() / 'Desktop' / f'Documents_backup_{time.strftime("%Y%m%d_%H%M%S")}.zip'
n = 0
with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in src.rglob('*'):
        if f.is_file():
            try: z.write(f, f.relative_to(src)); n += 1
            except Exception: pass
print(f'[OK] Backed up {n} files to {dst.name} ({dst.stat().st_size/1024/1024:.1f} MB)')