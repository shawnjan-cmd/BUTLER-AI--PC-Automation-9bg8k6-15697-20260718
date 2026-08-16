import socket, subprocess
host = 'github.com'
print(f'Resolving {host}...\n')
try:
    infos = socket.getaddrinfo(host, None)
    seen = set()
    for fam, *_, sa in infos:
        ip = sa[0]
        if ip in seen: continue
        seen.add(ip)
        kind = 'AAAA' if ':' in ip else 'A'
        print(f'  {kind:4s}  {ip}')
except Exception as e:
    print(f'[ERR] {e}')
print('\n[nslookup MX]')
r = subprocess.run(['nslookup','-type=MX',host], capture_output=True, text=True, timeout=15)
print(r.stdout)