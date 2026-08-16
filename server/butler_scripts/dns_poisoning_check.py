import socket
domains = {
    'google.com': None,
    'microsoft.com': None,
    'cloudflare.com': None,
    'github.com': None,
    'apple.com': None,
}
print('DNS Resolution Check:\n')
for d in domains:
    try:
        ips = socket.getaddrinfo(d, 80)
        resolved = list(set(i[4][0] for i in ips))
        print(f'  {d:25} -> {resolved}')
        # Flag private/loopback as suspicious
        for ip in resolved:
            if ip.startswith('192.168') or ip.startswith('10.') or ip.startswith('127.'):
                print(f'    ⚠ WARNING: {d} resolved to private IP {ip} — possible hijack!')
    except Exception as e:
        print(f'  {d:25} -> ERROR: {e}')