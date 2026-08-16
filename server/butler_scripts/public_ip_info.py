import urllib.request, json
d = json.loads(urllib.request.urlopen('https://ipapi.co/json/', timeout=10).read())
for k in ('ip','city','region','country_name','org','asn','postal','timezone'):
    print(f'{k:>14}: {d.get(k,"")}')