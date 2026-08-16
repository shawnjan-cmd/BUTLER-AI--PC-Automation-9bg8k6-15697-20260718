from pathlib import Path
try:
    from PIL import Image
except ImportError:
    print("pip install pillow"); raise SystemExit
ROOT = Path.home() / "Pictures"   # ← edit me
EXTS = {".jpg",".jpeg",".png",".gif",".webp",".bmp"}
n = 0
for f in ROOT.rglob("*"):
    if f.suffix.lower() not in EXTS: continue
    try:
        with Image.open(f) as im: print(f"{im.size[0]:5}×{im.size[1]:5}   {f.name}")
        n += 1
    except Exception: pass
print(f"\n{n} images")