import subprocess
r = subprocess.run(['docker','system','prune','-af','--volumes'], capture_output=True, text=True)
if r.returncode != 0: print('[ERR]', r.stderr.strip() or 'Docker not installed?'); raise SystemExit
print(r.stdout.strip())
print('[DONE]')