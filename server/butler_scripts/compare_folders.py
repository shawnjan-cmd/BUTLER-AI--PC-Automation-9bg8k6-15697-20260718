from pathlib import Path
import hashlib
A = Path.home() / 'Documents'
B = Path.home() / 'Documents_backup'
def index(root):
    out = {}
    if not root.exists(): return out
    for f in root.rglob('*'):
        if f.is_file():
            try: out[f.relative_to(root).as_posix()] = f.stat().st_size
            except Exception: pass
    return out
a, b = index(A), index(B)
only_a = sorted(set(a)-set(b)); only_b = sorted(set(b)-set(a))
diff = [p for p in set(a)&set(b) if a[p] != b[p]]
print(f'Only in A ({len(only_a)}):'); [print(' ',p) for p in only_a[:30]]
print(f'\nOnly in B ({len(only_b)}):'); [print(' ',p) for p in only_b[:30]]
print(f'\nDifferent size ({len(diff)}):'); [print(' ',p) for p in diff[:30]]