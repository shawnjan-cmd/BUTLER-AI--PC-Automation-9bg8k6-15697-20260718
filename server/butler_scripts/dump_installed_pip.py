import subprocess, sys
from pathlib import Path
out = Path.home() / "Desktop" / "requirements.txt"
r = subprocess.run([sys.executable,"-m","pip","freeze"], capture_output=True, text=True)
out.write_text(r.stdout, encoding="utf-8")
print(f"✓ {sum(1 for _ in r.stdout.splitlines())} packages → {out}")