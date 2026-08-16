import subprocess
ps = ("Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; "
      "iwr -useb get.scoop.sh | iex")
r = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True)
print(r.stdout[-2000:]); print(r.stderr[-500:])