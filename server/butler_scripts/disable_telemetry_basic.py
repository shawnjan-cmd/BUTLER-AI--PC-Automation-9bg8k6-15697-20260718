import subprocess, ctypes, sys
if not ctypes.windll.shell32.IsUserAnAdmin():
    print('Run Butler as Administrator.'); sys.exit(1)
cmds = [
    'sc config DiagTrack start= disabled',
    'sc stop DiagTrack',
    'sc config dmwappushservice start= disabled',
    'sc stop dmwappushservice',
    'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f',
]
for c in cmds:
    print('>',c); subprocess.run(c, shell=True)
print('Done.')