from pathlib import Path
folder = Path.home() / 'Documents'
needle = 'OLD_TEXT'
replacement = 'NEW_TEXT'
exts = {'.txt','.md','.csv','.log'}
n = 0
for f in folder.rglob('*'):
    if not (f.is_file() and f.suffix.lower() in exts): continue
    try:
        s = f.read_text(encoding='utf-8', errors='ignore')
        if needle in s:
            f.write_text(s.replace(needle, replacement), encoding='utf-8'); n += 1
            print(f'  patched {f}')
    except Exception as e:
        print(f'  skip {f}: {e}')
print(f'\n[OK] {n} files updated')