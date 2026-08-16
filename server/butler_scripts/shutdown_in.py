import sys, subprocess
sec = 600
if sys.platform == "win32":
    subprocess.run(["shutdown", "/s", "/t", str(sec)])
else:
    subprocess.run(["shutdown", "-h", f"+{sec//60}"])
print(f"✓ shutdown scheduled in {sec//60} minutes")