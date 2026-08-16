import shutil, time
from pathlib import Path
home = Path.home()
dst = home/'Desktop'/f'Bookmark_Backup_{time.strftime("%Y%m%d")}'
dst.mkdir(exist_ok=True)
sources = {
    'chrome.json': home/'AppData/Local/Google/Chrome/User Data/Default/Bookmarks',
    'edge.json':   home/'AppData/Local/Microsoft/Edge/User Data/Default/Bookmarks',
    'brave.json':  home/'AppData/Local/BraveSoftware/Brave-Browser/User Data/Default/Bookmarks',
}
n = 0
for name, p in sources.items():
    if p.exists():
        shutil.copy2(p, dst/name); n += 1; print(f'  copied {name}')
ff = home/'AppData/Roaming/Mozilla/Firefox/Profiles'
if ff.exists():
    for prof in ff.iterdir():
        for f in prof.glob('places.sqlite'):
            shutil.copy2(f, dst/f'firefox_{prof.name}.sqlite'); n += 1
print(f'\n[OK] Saved {n} bookmark file(s) to {dst}')