import time, mimetypes, stat as st
from pathlib import Path
target = Path.home() / 'Desktop'   # <-- edit me
if not target.exists(): print('Path not found'); raise SystemExit
for f in (target.iterdir() if target.is_dir() else [target]):
    try:
        s = f.stat(); mt = mimetypes.guess_type(f.name)[0] or '-'
        print(f'\n{f.name}')
        print(f'  size : {s.st_size:,} bytes')
        print(f'  ctime: {time.ctime(s.st_ctime)}')
        print(f'  mtime: {time.ctime(s.st_mtime)}')
        print(f'  mode : {st.filemode(s.st_mode)}')
        print(f'  mime : {mt}')
    except Exception as e:
        print(f'  ERR {e}')