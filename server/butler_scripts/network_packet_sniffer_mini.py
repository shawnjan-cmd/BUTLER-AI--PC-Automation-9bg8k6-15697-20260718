import socket, struct, time, sys
if sys.platform != 'win32':
    print('Windows-specific raw socket approach — use tcpdump on Linux'); raise SystemExit
print('Sniffing for 10 seconds (requires admin)...\n')
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
    s.bind((socket.gethostbyname(socket.gethostname()), 0))
    s.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
    s.ioctl(socket.SIO_RCVALL, socket.RCVALL_ON)
except PermissionError:
    print('Run as Administrator for raw packet capture.'); raise SystemExit
end = time.time() + 10
count = 0
try:
    while time.time() < end:
        s.settimeout(1)
        try:
            data, addr = s.recvfrom(65535)
            if len(data) >= 20:
                proto = data[9]
                src = '.'.join(str(b) for b in data[12:16])
                dst = '.'.join(str(b) for b in data[16:20])
                proto_name = {6:'TCP',17:'UDP',1:'ICMP'}.get(proto, str(proto))
                print(f'  {proto_name:6} {src:20} -> {dst}')
                count += 1
        except socket.timeout: continue
finally:
    try: s.ioctl(socket.SIO_RCVALL, socket.RCVALL_OFF)
    except: pass
    s.close()
print(f'\n{count} packets captured.')