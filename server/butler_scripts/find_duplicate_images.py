import subprocess, sys
from pathlib import Path
try:
    from PIL import Image; import imagehash
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','pillow','imagehash'])
    from PIL import Image; import imagehash
hashes = {}
for f in Path('.').rglob('*'):
    if f.suffix.lower() in ('.jpg','.jpeg','.png','.bmp','.webp'):
        try: h = str(imagehash.phash(Image.open(f)))
        except Exception: continue
        hashes.setdefault(h,[]).append(str(f))
dupes = {k:v for k,v in hashes.items() if len(v) > 1}
for k,v in dupes.items():
    print('\nDuplicate group:'); [print(' ',p) for p in v]
print(f'\n{len(dupes)} duplicate groups found.')