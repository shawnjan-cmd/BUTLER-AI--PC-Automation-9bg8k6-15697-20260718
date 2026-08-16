import socket
PORTS = [22, 80, 135, 139, 443, 445, 3000, 3306, 3389, 5000, 5432, 5900, 6379, 8000, 8080, 8443, 27017]
print("Scanning localhost…")
open_ = []
for p in PORTS:
    s = socket.socket(); s.settimeout(0.3)
    try:
        if s.connect_ex(("127.0.0.1", p)) == 0:
            open_.append(p); print(f"  OPEN   {p}")
    finally:
        s.close()
print(f"\n{len(open_)} open ports")