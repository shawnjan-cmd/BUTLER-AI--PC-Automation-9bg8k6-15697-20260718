import urllib.request, json
ids = 'bitcoin,ethereum,solana,dogecoin'
url = f'https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_24hr_change=true'
with urllib.request.urlopen(url, timeout=10) as r:
    d = json.loads(r.read())
for k, v in d.items():
    ch = v.get('usd_24h_change', 0); arrow = '\u2197' if ch>=0 else '\u2198'
    print(f'  {k:10s} ${v["usd"]:>10,.2f}   {arrow}{ch:+.2f}% 24h')