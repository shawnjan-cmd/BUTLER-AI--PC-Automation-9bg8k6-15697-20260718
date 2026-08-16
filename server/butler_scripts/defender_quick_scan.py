import subprocess, platform
if platform.system() != 'Windows': print('Windows only'); raise SystemExit
exe = r'C:\\Program Files\\Windows Defender\\MpCmdRun.exe'
import os
if not os.path.exists(exe): print('MpCmdRun.exe not found'); raise SystemExit
print('Starting quick scan...')
p = subprocess.Popen([exe,'-Scan','-ScanType','1'], stdout=subprocess.PIPE, text=True)
for line in p.stdout: print(line.rstrip())
print(f'[exit {p.wait()}]')