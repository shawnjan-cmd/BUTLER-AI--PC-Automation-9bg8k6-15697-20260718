import time, os
from pathlib import Path
folder = Path.home() / 'Downloads'
snap = lambda: {f.name: f.stat().st_mtime for f in folder.iterdir() if f.is_file()}
prev = snap(); end = time.time() + 60
print(f'Watching {folder} for 60s...')
while time.time() < end:
    time.sleep(2); cur = snap()
    for n in cur:
        if n not in prev: print(f'  + {n}')
        elif cur[n] != prev[n]: print(f'  ~ {n}')
    for n in prev:
        if n not in cur: print(f'  - {n}')
    prev = cur
print('[done]')