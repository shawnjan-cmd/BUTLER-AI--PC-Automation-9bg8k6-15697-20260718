import os, sys
if sys.platform == "win32":
    import ctypes
    is_admin = bool(ctypes.windll.shell32.IsUserAnAdmin())
else:
    is_admin = (os.geteuid() == 0)
print("✓ admin/root" if is_admin else "✗ standard user")