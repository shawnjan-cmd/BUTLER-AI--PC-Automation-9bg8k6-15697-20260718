from pathlib import Path
try:
    from PIL import Image
except ImportError:
    print('Install: pip install pillow'); raise SystemExit
src=None
for ext in ('jpg','jpeg','png'):
    cand=list(Path('.').glob(f'input.{ext}'))
    if cand: src=cand[0]; break
if not src: print('Place input.jpg/.png in current dir'); raise SystemExit
CHARS=' .:-=+*#%@'
img=Image.open(src).convert('L')
w=100; h=int(img.height/img.width*w*0.5)
img=img.resize((w,h))
for y in range(h):
    print(''.join(CHARS[min(len(CHARS)-1, img.getpixel((x,y))*len(CHARS)//256)] for x in range(w)))