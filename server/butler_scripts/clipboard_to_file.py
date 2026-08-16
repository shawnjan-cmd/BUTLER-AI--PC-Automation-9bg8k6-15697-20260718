import sys, subprocess
from pathlib import Path
text = ""
try:
    if sys.platform == "win32":
        import ctypes
        CF_TEXT = 1
        u = ctypes.windll.user32; k = ctypes.windll.kernel32
        u.OpenClipboard(0); h = u.GetClipboardData(CF_TEXT)
        text = ctypes.c_char_p(k.GlobalLock(h)).value.decode("utf-8", "ignore") if h else ""
        k.GlobalUnlock(h); u.CloseClipboard()
    elif sys.platform == "darwin":
        text = subprocess.run(["pbpaste"], capture_output=True, text=True).stdout
    else:
        text = subprocess.run(["xclip","-o","-selection","clipboard"], capture_output=True, text=True).stdout
except Exception as e:
    print(f"clipboard read failed: {e}"); raise SystemExit
out = Path.home() / "Desktop" / "clipboard.txt"
out.write_text(text, encoding="utf-8")
print(f"✓ {len(text)} chars → {out}")