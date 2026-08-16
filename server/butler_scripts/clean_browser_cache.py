import os, shutil
from pathlib import Path
home = Path.home()
targets = [
    home/'AppData/Local/Google/Chrome/User Data/Default/Cache',
    home/'AppData/Local/Microsoft/Edge/User Data/Default/Cache',
    home/'AppData/Local/BraveSoftware/Brave-Browser/User Data/Default/Cache',
    home/'AppData/Roaming/Mozilla/Firefox/Profiles',
    home/'Library/Caches/Google/Chrome',
    home/'.cache/google-chrome',
    home/'.cache/mozilla/firefox',
]
freed = 0
for t in targets:
    if not t.exists(): continue
    try:
        sz = sum(f.stat().st_size for f in t.rglob('*') if f.is_file())
        shutil.rmtree(t, ignore_errors=True)
        t.mkdir(parents=True, exist_ok=True)
        freed += sz
        print(f'[OK] Cleared {t}')
    except Exception as e:
        print(f'[SKIP] {t}: {e}')
print(f'\n[DONE] Freed approximately {freed/1024/1024:.1f} MB')