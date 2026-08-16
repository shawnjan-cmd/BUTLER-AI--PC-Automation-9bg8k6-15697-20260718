import urllib.request, time
URL = 'https://httpbin.org/get'   # <-- edit
t0 = time.time()
try:
    with urllib.request.urlopen(URL, timeout=15) as r:
        body = r.read(); ms = (time.time()-t0)*1000
        print(f'Status      : {r.status} {r.reason}')
        print(f'Content-Type: {r.headers.get("Content-Type")}')
        print(f'Body size   : {len(body):,} bytes')
        print(f'Time        : {ms:.0f} ms')
except Exception as e:
    print(f'[ERR] {e}')