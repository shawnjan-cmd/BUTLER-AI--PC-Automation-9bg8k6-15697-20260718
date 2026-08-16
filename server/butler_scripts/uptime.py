import time
try:
    import psutil
    sec = time.time() - psutil.boot_time()
except ImportError:
    sec = 0
    import sys
    if sys.platform != "win32":
        with open("/proc/uptime") as f: sec = float(f.read().split()[0])
d, r = divmod(int(sec), 86400); h, r = divmod(r, 3600); m, _ = divmod(r, 60)
print(f"Uptime: {d}d {h}h {m}m")