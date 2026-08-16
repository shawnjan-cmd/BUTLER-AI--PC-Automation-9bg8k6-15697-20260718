import ssl, socket
from datetime import datetime
host = 'github.com'; port = 443
ctx = ssl.create_default_context()
with socket.create_connection((host, port), timeout=10) as sock:
    with ctx.wrap_socket(sock, server_hostname=host) as ss:
        cert = ss.getpeercert()
print(f'Host       : {host}')
print(f'Subject    : {dict(x[0] for x in cert["subject"])}')
print(f'Issuer     : {dict(x[0] for x in cert["issuer"])}')
print(f'Valid from : {cert["notBefore"]}')
print(f'Valid until: {cert["notAfter"]}')
exp = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
print(f'Days left  : {(exp - datetime.utcnow()).days}')