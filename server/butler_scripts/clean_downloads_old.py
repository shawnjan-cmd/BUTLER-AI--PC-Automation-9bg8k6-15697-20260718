import time, shutil
from pathlib import Path
dl = Path.home()/'Downloads'
if not dl.exists(): print('No Downloads folder'); raise SystemExit
cutoff = time.time() - 30*86400
archive = dl/f'_archive_{time.strftime("%Y%m%d")}'
moved = 0
for f in dl.iterdir():
    if f.is_dir() or f.name.startswith('_archive'): continue
    try:
        if f.stat().st_mtime < cutoff:
            archive.mkdir(exist_ok=True)
            shutil.move(str(f), archive/f.name); moved += 1
    except Exception: pass
print(f'[OK] Archived {moved} old files to {archive.name}/' if moved else '[OK] Nothing older than 30 days')