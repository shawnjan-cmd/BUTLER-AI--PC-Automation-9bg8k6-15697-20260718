import subprocess, sys
if sys.platform == "win32":
    cmd = ["ipconfig", "/flushdns"]
elif sys.platform == "darwin":
    cmd = ["sudo", "dscacheutil", "-flushcache"]
else:
    cmd = ["sudo", "resolvectl", "flush-caches"]
r = subprocess.run(cmd, capture_output=True, text=True)
print(r.stdout or r.stderr)
print("✓ DNS cache flushed")