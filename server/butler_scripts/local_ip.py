import socket
host = socket.gethostname()
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]; s.close()
except Exception:
    ip = socket.gethostbyname(host)
print(f"Hostname : {host}")
print(f"Local IP : {ip}")