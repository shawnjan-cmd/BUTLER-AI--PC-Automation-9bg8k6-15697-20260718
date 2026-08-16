import urllib.request, json
RESOLVERS = [
    ('Cloudflare', 'https://cloudflare-dns.com/dns-query?name=example.com&type=A'),
    ('Google', 'https://dns.google/resolve?name=example.com&type=A'),
    ('Quad9', 'https://dns.quad9.net:5053/dns-query?name=example.com&type=A'),
    ('NextDNS', 'https://dns.nextdns.io/dns-query?name=example.com&type=A'),
]
print('DNS-over-HTTPS Resolver Status:\n')
for name, url in RESOLVERS:
    try:
        req = urllib.request.Request(url, headers={'Accept':'application/dns-json','User-Agent':'ButlerAI/1'})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            ips = [a['data'] for a in data.get('Answer', []) if a.get('type') == 1]
            print(f'  ✓ {name:15} Reachable  example.com -> {ips}')
    except Exception as e:
        print(f'  ✗ {name:15} FAILED: {e}')