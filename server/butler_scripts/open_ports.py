import subprocess, platform
if platform.system()=='Windows':
    r = subprocess.run(['netstat','-ano','-p','TCP'], capture_output=True, text=True)
else:
    r = subprocess.run(['ss','-tulpn'], capture_output=True, text=True)
    if r.returncode != 0:
        r = subprocess.run(['netstat','-tulpn'], capture_output=True, text=True)
print(r.stdout[:8000])