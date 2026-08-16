import urllib.request, json
DOMAIN='example.com'  # edit me
try:
    r=urllib.request.urlopen(f'https://rdap.org/domain/{DOMAIN}', timeout=10).read()
    d=json.loads(r)
    print(f"Domain: {d.get('ldhName')}")
    print(f"Status: {', '.join(d.get('status',[]))}")
    for e in d.get('events',[]):
        print(f"  {e.get('eventAction'):20s} {e.get('eventDate')}")
    for n in d.get('nameservers',[]):
        print(f"  NS: {n.get('ldhName')}")
except Exception as e: print(e)