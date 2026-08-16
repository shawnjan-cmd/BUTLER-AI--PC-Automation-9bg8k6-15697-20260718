import sys, subprocess
if sys.platform == "win32":
    import ctypes; ctypes.windll.user32.LockWorkStation()
elif sys.platform == "darwin":
    subprocess.run(["pmset", "displaysleepnow"])
else:
    for cmd in (["loginctl","lock-session"], ["gnome-screensaver-command","-l"], ["xdg-screensaver","lock"]):
        try: subprocess.run(cmd, check=True); break
        except Exception: continue
print("✓ locked")