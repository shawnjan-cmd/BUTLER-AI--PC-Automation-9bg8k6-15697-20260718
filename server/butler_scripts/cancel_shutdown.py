import subprocess, platform
if platform.system()=='Windows':
    r = subprocess.run(['shutdown','/a'], capture_output=True, text=True)
else:
    r = subprocess.run(['shutdown','-c'], capture_output=True, text=True)
print(r.stdout or r.stderr or '[OK] cancel requested')