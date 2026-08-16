import subprocess, platform
if platform.system() != 'Windows': print('Windows only'); raise SystemExit
r = subprocess.run(['netsh','advfirewall','show','allprofiles'], capture_output=True, text=True)
print(r.stdout)