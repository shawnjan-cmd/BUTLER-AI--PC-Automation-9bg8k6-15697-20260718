from pathlib import Path
try:
    from PIL import Image
    from PIL.ExifTags import TAGS
except ImportError:
    print("pip install pillow"); raise SystemExit
ROOT = Path.home() / "Pictures"   # ← edit me
n = 0
for f in ROOT.iterdir():
    if f.suffix.lower() not in {".jpg",".jpeg",".heic"}: continue
    try:
        ex = Image.open(f)._getexif() or {}
        dt = next((v for k,v in ex.items() if TAGS.get(k)=="DateTimeOriginal"), None)
        if not dt: continue
        new = f.with_name(dt.replace(":","").replace(" ","_") + f.suffix.lower())
        if not new.exists(): f.rename(new); n += 1
    except Exception: pass
print(f"✓ {n} photos renamed")