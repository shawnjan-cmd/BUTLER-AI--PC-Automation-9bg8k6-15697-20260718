import subprocess, platform
sys_ = platform.system()
if sys_ == 'Windows':
    cmd = ['wevtutil','qe','Security','/q:*[System[(EventID=4625)]]','/c:20','/rd:true','/f:text']
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    print(r.stdout or r.stderr)
elif sys_ == 'Linux':
    r = subprocess.run(['grep','-i','failed','/var/log/auth.log'], capture_output=True, text=True)
    print('\n'.join(r.stdout.splitlines()[-30:]))
else:
    r = subprocess.run(['log','show','--predicate','eventMessage CONTAINS "failed"','--last','1d'], capture_output=True, text=True)
    print(r.stdout[:5000])