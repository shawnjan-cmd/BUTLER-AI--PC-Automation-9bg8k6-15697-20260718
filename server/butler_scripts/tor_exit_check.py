import urllib.request, json
try:
    with urllib.request.urlopen('https://api.ipify.org?format=json', timeout=8) as r:
        my_ip = json.loads(r.read())['ip']
except Exception as e:
    print(f'Could not get public IP: {e}'); raise SystemExit
print(f'Your public IP: {my_ip}')
try:
    url = f'https://check.torproject.org/api/ip'
    with urllib.request.urlopen(url, timeout=8) as r:
        data = json.loads(r.read())
    is_tor = data.get('IsTor', False)
    print(f'Is Tor exit node: {is_tor}')
    if is_tor:
        print('⚠ You are routing through Tor!')
    else:
        print('✓ Not a Tor exit node.')
except Exception:
    # Fallback: check Tor DNS list
    try:
        import socket
        rev = '.'.join(reversed(my_ip.split('.'))) + '.dnsel.torproject.org'
        socket.gethostbyname(rev)
        print('⚠ IP found in Tor exit list!')
    except socket.gaierror:
        print('✓ Not in Tor exit list (DNS check).')