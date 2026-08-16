import subprocess, platform
sys_ = platform.system()
if sys_ == 'Windows':
    subprocess.run(['rundll32.exe','powrprof.dll,SetSuspendState','0,1,0'])
elif sys_ == 'Linux':
    subprocess.run(['systemctl','suspend'])
else:
    subprocess.run(['pmset','sleepnow'])
print('[sent sleep command]')