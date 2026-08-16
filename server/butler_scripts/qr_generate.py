try: import qrcode
except ImportError: print('pip install qrcode[pil]'); raise SystemExit
from pathlib import Path
text = 'https://github.com'   # <-- edit
out = Path.home()/'Desktop'/'qr.png'
qrcode.make(text).save(out)
print(f'[OK] {out}')