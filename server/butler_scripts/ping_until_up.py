import subprocess, platform, time, sys
HOST='8.8.8.8'  # edit me
MAX=120
flag='-n' if platform.system()=='Windows' else '-c'
for i in range(MAX):
    r=subprocess.run(['ping',flag,'1',HOST], capture_output=True, text=True)
    if r.returncode==0:
        print(f'✓ {HOST} is UP after {i+1} attempts'); sys.stdout.write('\a'); break
    print(f'  try {i+1}/{MAX}...'); time.sleep(2)
else:
    print(f'✗ {HOST} still down after {MAX} tries')