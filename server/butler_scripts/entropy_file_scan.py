import os, math
from pathlib import Path
def entropy(data):
    if not data: return 0
    freq = {}
    for b in data: freq[b] = freq.get(b, 0) + 1
    l = len(data)
    return -sum((c/l)*math.log2(c/l) for c in freq.values())
scan_path = Path.home() / 'Downloads'
print(f'Scanning {scan_path} for high-entropy files (>7.5)...\n')
found = []
for f in scan_path.rglob('*'):
    if f.is_file() and f.stat().st_size < 5_000_000:
        try:
            e = entropy(f.read_bytes()[:50000])
            if e > 7.5:
                found.append((e, f))
        except: pass
found.sort(reverse=True)
for e, f in found[:30]:
    print(f'  {e:.3f}  {f}')
print(f'\n{len(found)} high-entropy files found.')