import subprocess, platform
PORT = 3000   # <-- edit
sys_ = platform.system()
if sys_ == 'Windows':
    r = subprocess.run(['netstat','-ano','-p','TCP'], capture_output=True, text=True)
    pids = set()
    for line in r.stdout.splitlines():
        parts = line.split()
        if len(parts) >= 5 and f':{PORT}' in parts[1] and 'LISTENING' in line:
            pids.add(parts[-1])
    if not pids: print(f'Nothing on port {PORT}'); raise SystemExit
    for pid in pids:
        print(f'Killing PID {pid}'); subprocess.run(['taskkill','/F','/PID',pid])
else:
    r = subprocess.run(['lsof','-ti',f':{PORT}'], capture_output=True, text=True)
    pids = [p for p in r.stdout.split() if p]
    if not pids: print(f'Nothing on port {PORT}'); raise SystemExit
    for pid in pids: subprocess.run(['kill','-9',pid]); print(f'Killed {pid}')
print('[OK]')