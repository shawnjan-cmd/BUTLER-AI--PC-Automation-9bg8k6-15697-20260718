import urllib.request, urllib.error
url = input('URL to check [https://example.com]: ').strip() or 'https://example.com'
if not url.startswith('http'): url = 'https://' + url
try:
    req = urllib.request.Request(url, headers={'User-Agent':'ButlerAI/1'})
    with urllib.request.urlopen(req, timeout=10) as r:
        headers = dict(r.headers)
except Exception as e:
    print(f'Error: {e}'); raise SystemExit
SECURITY_HEADERS = {
    'Strict-Transport-Security': 'HSTS',
    'Content-Security-Policy': 'CSP',
    'X-Frame-Options': 'Clickjacking protection',
    'X-Content-Type-Options': 'MIME sniffing protection',
    'Referrer-Policy': 'Referrer policy',
    'Permissions-Policy': 'Permissions policy',
    'X-XSS-Protection': 'XSS protection (legacy)',
}
print(f'Security headers for {url}:\n')
for h, label in SECURITY_HEADERS.items():
    val = headers.get(h, None)
    if val:
        print(f'  ✓ {label:30} {val[:60]}')
    else:
        print(f'  ✗ {label:30} MISSING')
print(f'\nAll headers: {list(headers.keys())}')