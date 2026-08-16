import subprocess, sys, re
HOSTS = ["8.8.8.8", "1.1.1.1", "google.com", "github.com", "cloudflare.com"]
flag = "-n" if sys.platform == "win32" else "-c"
for h in HOSTS:
    try:
        r = subprocess.run(["ping", flag, "2", h], capture_output=True, text=True, timeout=10)
        m = re.search(r"(?:time[=<]|Average\s*=\s*)(\d+\.?\d*)", r.stdout)
        print(f"{h:18} → {m.group(1)+' ms' if m else 'no reply'}")
    except Exception as e:
        print(f"{h:18} → {e}")