import urllib.request
url = 'https://github.com'
req = urllib.request.Request(url, method='HEAD')
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print(f'Status: {r.status} {r.reason}')
        for k, v in r.headers.items(): print(f'  {k}: {v}')
except Exception as e:
    print(f'[ERR] {e}')