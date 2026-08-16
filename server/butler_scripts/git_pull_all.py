import subprocess
from pathlib import Path
root = Path.home()/'Projects'
if not root.exists(): root = Path.home()
ok = fail = 0
for repo in root.iterdir():
    if not (repo/'.git').exists(): continue
    r = subprocess.run(['git','-C',str(repo),'pull','--ff-only'], capture_output=True, text=True)
    status = 'OK ' if r.returncode==0 else 'ERR'
    print(f'  [{status}] {repo.name}: {(r.stdout+r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else ""}')
    ok += r.returncode==0; fail += r.returncode!=0
print(f'\n[DONE] {ok} ok, {fail} failed')