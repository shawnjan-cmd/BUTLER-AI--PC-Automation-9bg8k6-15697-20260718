import subprocess
from pathlib import Path
ROOT = Path.home() / "projects"   # ← edit me
if not ROOT.exists(): ROOT = Path.home()
for git in ROOT.rglob(".git"):
    if not git.is_dir(): continue
    repo = git.parent
    r = subprocess.run(["git","-C",str(repo),"status","--short"], capture_output=True, text=True)
    flag = "●" if r.stdout.strip() else "○"
    print(f"{flag} {repo}")
    if r.stdout.strip():
        for line in r.stdout.strip().splitlines()[:5]: print(f"    {line}")