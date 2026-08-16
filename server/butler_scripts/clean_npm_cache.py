import subprocess
for cmd in (["npm", "cache", "verify"], ["npm", "cache", "clean", "--force"]):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, shell=False)
        print(" ".join(cmd), "→", r.returncode)
        print(r.stdout or r.stderr)
    except FileNotFoundError:
        print("npm not installed")
        break