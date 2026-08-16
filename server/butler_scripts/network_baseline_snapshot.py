import subprocess, time
from pathlib import Path
out = Path.home()/'Desktop'/f'net_baseline_{time.strftime("%Y%m%d_%H%M%S")}.txt'
cmds = [
    ('IPCONFIG', ['ipconfig','/all']),
    ('ROUTE TABLE', ['route','print']),
    ('ARP CACHE', ['arp','-a']),
    ('NETSTAT CONNECTIONS', ['netstat','-ano']),
    ('DNS CACHE', ['ipconfig','/displaydns']),
    ('WIFI PROFILES', ['netsh','wlan','show','profiles']),
    ('SHARES', ['net','share']),
    ('OPEN PORTS', ['netstat','-bno']),
]
with open(out,'w',encoding='utf-8') as f:
    for title, cmd in cmds:
        f.write(f'\n[{"="*60}]\n[{title}]\n[{"="*60}]\n')
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            f.write(r.stdout)
        except Exception as e:
            f.write(f'ERROR: {e}\n')
print(f'✓ Network baseline saved to {out}')