import subprocess
name = input('Process name (e.g. chrome.exe): ').strip()
if not name: raise SystemExit('No name given.')
r = subprocess.run(['taskkill','/F','/IM',name,'/T'], capture_output=True, text=True)
print(r.stdout or r.stderr)