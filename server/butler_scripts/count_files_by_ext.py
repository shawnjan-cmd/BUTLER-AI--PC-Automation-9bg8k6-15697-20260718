from pathlib import Path
from collections import Counter
c=Counter(); total_bytes=Counter()
for f in Path('.').rglob('*'):
    if f.is_file():
        ext=f.suffix.lower() or '<none>'
        c[ext]+=1
        try: total_bytes[ext]+=f.stat().st_size
        except Exception: pass
for ext,n in c.most_common(40):
    mb=total_bytes[ext]/1024/1024
    print(f'  {ext:12s} {n:>6d} files  {mb:>10.1f} MB')
print(f'\nTotal: {sum(c.values())} files in {len(c)} extensions')