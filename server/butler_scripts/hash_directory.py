import hashlib, json, time
from pathlib import Path
folder = Path(input('Folder path [Desktop]: ').strip() or Path.home()/'Desktop')
if not folder.exists(): print('Not found'); raise SystemExit
out = Path.home()/'Desktop'/f'hash_manifest_{time.strftime("%Y%m%d_%H%M%S")}.json'
print(f'Hashing {folder}...')
manifest = {}
for f in folder.rglob('*'):
    if f.is_file():
        try:
            h = hashlib.sha256(f.read_bytes()).hexdigest()
            manifest[str(f.relative_to(folder))] = {'sha256': h, 'size': f.stat().st_size, 'mtime': f.stat().st_mtime}
        except Exception as e:
            manifest[str(f.relative_to(folder))] = {'error': str(e)}
out.write_text(json.dumps(manifest, indent=2))
print(f'✓ {len(manifest)} files hashed → {out}')