import urllib.request, time
SITES=['https://google.com','https://github.com','https://cloudflare.com']
for u in SITES:
    t=time.time()
    try:
        req=urllib.request.Request(u, headers={'User-Agent':'butler'})
        r=urllib.request.urlopen(req, timeout=8)
        dt=(time.time()-t)*1000
        print(f'  {r.status} {dt:6.0f}ms  {u}')
    except Exception as e:
        print(f'  ERR        {u} -> {e}')