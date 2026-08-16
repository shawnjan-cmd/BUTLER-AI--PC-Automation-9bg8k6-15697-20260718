import subprocess, platform, time
sys_ = platform.system()
if sys_ == 'Windows':
    r = subprocess.run(['systeminfo'], capture_output=True, text=True, timeout=30)
    for line in r.stdout.splitlines():
        if 'Boot Time' in line or 'Install Date' in line: print(line.strip())
elif sys_ == 'Linux':
    print(subprocess.run(['last','-x','reboot','shutdown'], capture_output=True, text=True).stdout[:3000])
else:
    print(subprocess.run(['last','reboot'], capture_output=True, text=True).stdout[:3000])