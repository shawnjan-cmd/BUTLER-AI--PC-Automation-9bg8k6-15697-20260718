import subprocess
r = subprocess.run(['docker','ps','-a','--format','table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}'], capture_output=True, text=True)
if r.returncode != 0: print('[ERR]', r.stderr or 'docker not installed'); raise SystemExit
print(r.stdout or '(no containers)')