import subprocess
try:
    r = subprocess.run(["npm", "outdated"], capture_output=True, text=True, shell=False)
    print(r.stdout or "All up to date")
except FileNotFoundError:
    print("npm not installed")