import subprocess, sys
try:
    from PIL import ImageGrab
    import win32clipboard
    from io import BytesIO
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','pillow','pywin32'])
    from PIL import ImageGrab
    import win32clipboard
    from io import BytesIO
img = ImageGrab.grab()
buf = BytesIO(); img.convert('RGB').save(buf,'BMP'); data = buf.getvalue()[14:]
win32clipboard.OpenClipboard(); win32clipboard.EmptyClipboard()
win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data); win32clipboard.CloseClipboard()
print(f'Screenshot {img.size[0]}x{img.size[1]} copied to clipboard.')