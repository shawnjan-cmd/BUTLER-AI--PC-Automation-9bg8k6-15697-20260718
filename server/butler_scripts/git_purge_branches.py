import subprocess
keep = {'main','master','dev','develop'}
r = subprocess.run(['git','branch','--merged'], capture_output=True, text=True)
if r.returncode != 0: print('Not a git repo'); raise SystemExit
n = 0
for line in r.stdout.splitlines():
    name = line.strip().lstrip('* ').strip()
    if not name or name in keep: continue
    d = subprocess.run(['git','branch','-d',name], capture_output=True, text=True)
    print(d.stdout.strip() or d.stderr.strip()); n += int(d.returncode==0)
print(f'\n[OK] Deleted {n} merged branch(es)')