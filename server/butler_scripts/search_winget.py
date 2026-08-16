import subprocess, shutil, sys
if not shutil.which('winget'): print('winget not found'); sys.exit(1)
q = input('Search term: ').strip()
if not q: sys.exit(0)
print(subprocess.run(['winget','search',q], capture_output=True, text=True).stdout)