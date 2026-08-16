import subprocess, ctypes, sys
if not ctypes.windll.shell32.IsUserAnAdmin():
    print('Run Butler as Administrator.'); sys.exit(1)
ps = ("Set-ExecutionPolicy Bypass -Scope Process -Force; "
      "[System.Net.ServicePointManager]::SecurityProtocol = "
      "[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; "
      "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))")
r = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True)
print(r.stdout[-2000:]); print(r.stderr[-500:])