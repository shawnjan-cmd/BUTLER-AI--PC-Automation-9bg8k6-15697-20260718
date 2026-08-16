import subprocess, sys, json
r = subprocess.run([sys.executable,'-m','pip','list','--outdated','--format=json'], capture_output=True, text=True)
pkgs = [p['name'] for p in json.loads(r.stdout or '[]')]
if not pkgs: print('[OK] Everything up to date'); raise SystemExit
print(f'Upgrading {len(pkgs)} package(s)...')
for p in pkgs:
    print(f'\n--- {p} ---')
    subprocess.run([sys.executable,'-m','pip','install','-U',p])
print('\n[DONE]')