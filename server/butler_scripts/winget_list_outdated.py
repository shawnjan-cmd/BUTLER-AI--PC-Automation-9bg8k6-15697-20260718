import subprocess, shutil, sys
if not shutil.which('winget'): print('winget not found'); sys.exit(1)
print(subprocess.run(['winget','upgrade'], capture_output=True, text=True).stdout)