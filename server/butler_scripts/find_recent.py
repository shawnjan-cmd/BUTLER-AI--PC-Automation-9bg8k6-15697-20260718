import time
from pathlib import Path
root = Path.home(); cutoff = time.time() - 86400
hits = []
for f in root.rglob('*'):
    try:
        if f.is_file() and f.stat().st_mtime > cutoff: hits.append((f.stat().st_mtime, f))
    except Exception: pass
print(f'{len(hits)} files modified in last 24h:')
for mt, f in sorted(hits, reverse=True)[:80]:
    print(f'  {time.strftime("%m-%d %H:%M", time.localtime(mt))}  {f}')