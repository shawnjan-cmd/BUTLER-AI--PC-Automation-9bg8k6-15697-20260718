import subprocess, sys
try:
    import speedtest
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','speedtest-cli'])
    import speedtest
s = speedtest.Speedtest(); s.get_best_server()
print('Testing download...'); d = s.download()/1_000_000
print('Testing upload...');   u = s.upload()/1_000_000
p = s.results.ping
print(f'\nDownload: {d:6.2f} Mbps\nUpload:   {u:6.2f} Mbps\nPing:     {p:6.2f} ms')