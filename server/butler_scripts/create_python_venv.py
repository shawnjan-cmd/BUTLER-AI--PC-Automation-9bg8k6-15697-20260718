import subprocess, sys, platform, os
out = os.path.join(os.getcwd(), '.venv')
if os.path.exists(out): print(f'.venv already exists: {out}'); raise SystemExit
r = subprocess.run([sys.executable,'-m','venv',out])
if r.returncode == 0:
    act = '.venv\\Scripts\\activate' if platform.system()=='Windows' else 'source .venv/bin/activate'
    print(f'[OK] Created {out}')
    print(f'Activate: {act}')