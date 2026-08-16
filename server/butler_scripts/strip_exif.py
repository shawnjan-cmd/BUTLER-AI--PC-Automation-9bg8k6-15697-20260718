from pathlib import Path
try:
    from PIL import Image
except ImportError:
    print('Install: pip install pillow'); raise SystemExit
n=0
for f in list(Path('.').glob('*.jpg'))+list(Path('.').glob('*.jpeg'))+list(Path('.').glob('*.png')):
    try:
        img=Image.open(f); data=list(img.getdata())
        clean=Image.new(img.mode, img.size); clean.putdata(data)
        clean.save(f); n+=1; print(f'  cleaned {f.name}')
    except Exception as e: print(f'  skip {f.name}: {e}')
print(f'\n✓ Stripped EXIF from {n} images')