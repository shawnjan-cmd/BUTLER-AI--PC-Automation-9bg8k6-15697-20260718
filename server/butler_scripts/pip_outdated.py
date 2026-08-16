import subprocess, sys
r = subprocess.run([sys.executable, "-m", "pip", "list", "--outdated"],
                   capture_output=True, text=True)
print(r.stdout or "All packages up to date")