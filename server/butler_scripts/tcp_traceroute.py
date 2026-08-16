import socket, time, struct, select
host = input('Target host [8.8.8.8]: ').strip() or '8.8.8.8'
try:
    dest_ip = socket.gethostbyname(host)
except Exception as e:
    print(f'DNS resolve failed: {e}'); raise SystemExit
print(f'TCP Traceroute to {host} ({dest_ip}):\n')
for ttl in range(1, 31):
    for _ in range(3):
        sender = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sender.setsockopt(socket.IPPROTO_IP, socket.IP_TTL, struct.pack('I', ttl))
        sender.settimeout(1)
        t0 = time.time()
        try:
            sender.connect((dest_ip, 80))
            rtt = (time.time()-t0)*1000
            print(f'  {ttl:2}  {dest_ip}  {rtt:.1f}ms  [REACHED]')
            sender.close()
            raise SystemExit
        except socket.timeout:
            print(f'  {ttl:2}  *  timeout')
        except OSError as e:
            hop = str(e)
            rtt = (time.time()-t0)*1000
            print(f'  {ttl:2}  {rtt:.1f}ms  {hop[:60]}')
        finally:
            sender.close()
        break