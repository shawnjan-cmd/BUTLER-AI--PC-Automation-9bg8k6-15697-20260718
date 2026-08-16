import socket
mac = input('MAC (AA:BB:CC:DD:EE:FF): ').strip().replace('-',':').upper()
parts = mac.split(':')
if len(parts) != 6: raise SystemExit('Invalid MAC.')
packet = b'\xff'*6 + (bytes.fromhex(''.join(parts)))*16
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
s.sendto(packet, ('255.255.255.255', 9))
print(f'Magic packet sent to {mac}')