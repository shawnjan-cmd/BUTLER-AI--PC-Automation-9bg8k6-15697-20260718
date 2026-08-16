import socket, concurrent.futures
host = input('Host to scan [127.0.0.1]: ').strip() or '127.0.0.1'
start = int(input('Start port [1]: ').strip() or '1')
end = int(input('End port [1024]: ').strip() or '1024')
print(f'Scanning {host} ports {start}-{end}...')
open_ports = []
def probe(p):
    try:
        s = socket.socket()
        s.settimeout(0.3)
        s.connect((host, p))
        try: svc = socket.getservbyport(p)
        except: svc = '?'
        s.close()
        return (p, svc)
    except: return None
with concurrent.futures.ThreadPoolExecutor(max_workers=100) as ex:
    for r in ex.map(probe, range(start, end+1)):
        if r: open_ports.append(r); print(f'  OPEN  {r[0]:6}  ({r[1]})')
print(f'\n[Done] {len(open_ports)} open ports in range {start}-{end}.')