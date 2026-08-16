import subprocess, platform, os
if platform.system() != 'Windows': print('Windows only'); raise SystemExit
out = os.path.expanduser('~/Desktop/battery_report.html')
r = subprocess.run(['powercfg','/batteryreport','/output',out], capture_output=True, text=True)
print(r.stdout or r.stderr)
if os.path.exists(out):
    print(f'[OK] {out}')
    os.startfile(out)