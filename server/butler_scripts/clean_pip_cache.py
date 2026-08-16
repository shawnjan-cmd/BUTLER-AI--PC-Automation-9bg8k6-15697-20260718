import subprocess, sys
res = subprocess.run([sys.executable, "-m", "pip", "cache", "purge"],
                     capture_output=True, text=True)
print(res.stdout or res.stderr)
print("✓ pip cache cleared")