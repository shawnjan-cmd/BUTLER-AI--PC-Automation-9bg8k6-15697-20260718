import subprocess, ctypes, sys
if not ctypes.windll.shell32.IsUserAnAdmin():
    print('Run Butler as Administrator.'); sys.exit(1)
new = input('New computer name: ').strip()
if not new: sys.exit(0)
r = subprocess.run(['powershell','-NoProfile','-Command',f'Rename-Computer -NewName "{new}" -Force'],
                   capture_output=True, text=True)
print(r.stdout or r.stderr); print('Reboot to apply.')