import subprocess
subprocess.run('cmd /c echo off | clip', shell=True)
print('Clipboard cleared.')