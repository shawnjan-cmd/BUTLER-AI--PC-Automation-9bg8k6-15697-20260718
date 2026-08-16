import subprocess, ctypes, sys
if not ctypes.windll.shell32.IsUserAnAdmin():
    print('Run Butler as Administrator for this script.'); sys.exit(1)
print('Installing WSL2 + Ubuntu...')
r = subprocess.run(['wsl','--install','-d','Ubuntu'], capture_output=True, text=True)
print(r.stdout); print(r.stderr)
print('\nReboot required to finish setup.')