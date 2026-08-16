import subprocess, shutil, sys
if not shutil.which('winget'): print('winget not found'); sys.exit(1)
r = subprocess.run(['winget','upgrade','--all','--silent',
                    '--accept-source-agreements','--accept-package-agreements','--include-unknown'],
                   capture_output=True, text=True)
print(r.stdout[-4000:]); print(r.stderr[-500:])