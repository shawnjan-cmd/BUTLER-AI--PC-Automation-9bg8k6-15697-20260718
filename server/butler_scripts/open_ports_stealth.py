import socket, concurrent.futures, time
host = input('Target host/IP [127.0.0.1]: ').strip() or '127.0.0.1'
PORTS = [21,22,23,25,53,80,110,135,139,143,443,445,3306,3389,5900,8080,8443,9200,27017]
open_p = []
def chk(p):
    try:
        s = socket.socket()
        s.settimeout(0.5)
        s.connect((host, p))
        s.close()
        return p
    except: return None
print(f'Probing {host}...')
with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex:
    for r in ex.map(chk, PORTS):
        if r: open_p.append(r); print(f'  OPEN  {r}')
print(f'\n[Done] {len(open_p)} open of {len(PORTS)} probed.')