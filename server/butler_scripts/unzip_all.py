import zipfile
from pathlib import Path
folder = Path.home() / 'Downloads'
n = 0
for z in folder.glob('*.zip'):
    out = z.with_suffix('')
    out.mkdir(exist_ok=True)
    try:
        with zipfile.ZipFile(z) as zf: zf.extractall(out)
        n += 1; print(f'  extracted {z.name} -> {out.name}/')
    except Exception as e:
        print(f'  ERR {z.name}: {e}')
print(f'\n[OK] Extracted {n} archive(s)')