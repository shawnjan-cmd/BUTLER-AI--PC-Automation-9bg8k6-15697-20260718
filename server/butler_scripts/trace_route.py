import subprocess, platform
cmd = ['tracert','-h','20','google.com'] if platform.system()=='Windows' else ['traceroute','-m','20','google.com']
try:
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
    for line in p.stdout: print(line.rstrip())
    p.wait(timeout=60)
except Exception as e:
    print(f'[ERR] {e}')