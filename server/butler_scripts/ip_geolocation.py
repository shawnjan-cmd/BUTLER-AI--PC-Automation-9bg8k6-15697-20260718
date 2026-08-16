import urllib.request, json
IP=''  # blank = your own
try:
    r=urllib.request.urlopen(f'https://ipapi.co/{IP}/json/', timeout=10).read()
    d=json.loads(r)
    for k in ('ip','city','region','country_name','postal','org','asn','timezone'):
        print(f'  {k:14s}: {d.get(k,"-")}')
except Exception as e: print(e)