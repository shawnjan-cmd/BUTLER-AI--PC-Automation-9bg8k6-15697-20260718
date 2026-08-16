from pathlib import Path
try:
    from PIL import Image
except ImportError:
    print("pip install pillow"); raise SystemExit
ROOT = Path.home() / "Pictures" / "convert_me"   # ← edit me
ROOT.mkdir(parents=True, exist_ok=True)
n = 0
for f in ROOT.iterdir():
    if f.suffix.lower() not in {".jpg",".jpeg",".png"}: continue
    try:
        out = f.with_suffix(".webp")
        Image.open(f).save(out, "WEBP", quality=85)
        n += 1; print(f"  {f.name} → {out.name}")
    except Exception as e:
        print(f"  skip {f.name}: {e}")
print(f"\n✓ {n} files")