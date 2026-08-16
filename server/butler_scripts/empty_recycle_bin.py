import sys
if sys.platform != "win32":
    print("Windows only — on macOS/Linux trash is per-user")
else:
    import ctypes
    SHERB_NOCONFIRMATION = 1; SHERB_NOPROGRESSUI = 2; SHERB_NOSOUND = 4
    r = ctypes.windll.shell32.SHEmptyRecycleBinW(
        None, None, SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND)
    print("✓ Recycle Bin emptied" if r == 0 else f"Result code: {r}")