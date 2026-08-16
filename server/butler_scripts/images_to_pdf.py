from pathlib import Path
try:
    from PIL import Image
except ImportError:
    print('Install: pip install pillow'); raise SystemExit
files=sorted(list(Path('.').glob('*.jpg'))+list(Path('.').glob('*.jpeg'))+list(Path('.').glob('*.png')))
if not files: print('No images'); raise SystemExit
imgs=[Image.open(f).convert('RGB') for f in files]
imgs[0].save('images.pdf', save_all=True, append_images=imgs[1:])
print(f'✓ images.pdf ({len(files)} pages)')