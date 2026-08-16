import time
from pathlib import Path
try:
    from PIL import ImageGrab
except ImportError:
    print("pip install pillow"); raise SystemExit
img = ImageGrab.grab()
out = Path.home() / "Desktop" / f"screenshot_{int(time.time())}.png"
img.save(out); print(f"✓ {out}")