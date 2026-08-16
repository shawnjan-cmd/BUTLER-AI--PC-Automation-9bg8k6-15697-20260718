import subprocess, platform, re
if platform.system() == 'Windows':
    r = subprocess.run(['arp', '-a'], capture_output=True, text=True)
else:
    r = subprocess.run(['arp', '-n'], capture_output=True, text=True)
lines = [l for l in r.stdout.splitlines() if re.search(r'(\d+\.){3}\d+', l)]
print(f'Live hosts on LAN: {len(lines)}\n')
for l in lines: print(l)