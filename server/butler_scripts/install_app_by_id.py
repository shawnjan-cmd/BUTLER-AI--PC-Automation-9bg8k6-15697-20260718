import subprocess, shutil, sys
if not shutil.which('winget'): print('winget not found'); sys.exit(1)
pkg = input('Winget package id (e.g. Mozilla.Firefox): ').strip()
if not pkg: print('No package given'); sys.exit(0)
r = subprocess.run(['winget','install','--id',pkg,'-e','--silent',
                    '--accept-source-agreements','--accept-package-agreements'],
                   capture_output=True, text=True)
print(r.stdout); print(r.stderr)