import subprocess, platform
sys_ = platform.system()
if sys_ == 'Windows':
    r = subprocess.run(['sc','query','type=','service','state=','running'], capture_output=True, text=True)
    print(r.stdout)
elif sys_ == 'Linux':
    r = subprocess.run(['systemctl','list-units','--type=service','--state=running'], capture_output=True, text=True)
    print(r.stdout)
else:
    r = subprocess.run(['launchctl','list'], capture_output=True, text=True)
    print(r.stdout[:5000])