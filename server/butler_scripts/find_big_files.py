import os
from pathlib import Path
root = input('Folder (blank = home): ').strip() or str(Path.home())
files = []
for dp, _, fns in os.walk(root):
    for fn in fns:
        try:
            p = os.path.join(dp, fn); s = os.path.getsize(p)
            files.append((s, p))
        except Exception: pass
files.sort(reverse=True)
for s, p in files[:30]:
    print(f'{s/1024/1024:8.1f} MB  {p}')