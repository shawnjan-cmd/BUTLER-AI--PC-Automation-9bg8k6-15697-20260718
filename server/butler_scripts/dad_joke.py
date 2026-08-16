import urllib.request, json
req=urllib.request.Request('https://icanhazdadjoke.com/', headers={'Accept':'application/json','User-Agent':'butler'})
try:
    d=json.loads(urllib.request.urlopen(req, timeout=8).read())
    print(d.get('joke','(no joke)'))
except Exception as e: print(e)