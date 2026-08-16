import subprocess, sys
try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','pillow']); from PIL import Image
from pathlib import Path
n = saved = 0
for f in Path('.').glob('*'):
    if f.suffix.lower() in ('.jpg','.jpeg','.png'):
        try:
            out = f.with_suffix('.webp')
            Image.open(f).save(out,'WEBP',quality=80,method=6)
            saved += f.stat().st_size - out.stat().st_size; n += 1
            print(f'OK {f.name}')
        except Exception as e: print(f'FAIL {f.name}: {e}')
print(f'\n{n} files converted, {saved/1024/1024:.1f} MB saved.')