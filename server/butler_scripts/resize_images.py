try: from PIL import Image
except ImportError: print('pip install Pillow'); raise SystemExit
from pathlib import Path
folder = Path.home()/'Pictures'
out_dir = folder/'resized'; out_dir.mkdir(exist_ok=True)
n = 0
for f in folder.iterdir():
    if f.suffix.lower() not in {'.jpg','.jpeg','.png'}: continue
    try:
        im = Image.open(f)
        if im.width > 1920:
            im.thumbnail((1920, 1920*10))
        im.save(out_dir/f.name, optimize=True, quality=85); n += 1
    except Exception as e: print(f'  skip {f.name}: {e}')
print(f'[OK] {n} image(s) -> {out_dir}')