import hashlib, urllib.request, getpass
pw = getpass.getpass('Password to check (hidden): ') or 'password'
h = hashlib.sha1(pw.encode()).hexdigest().upper()
prefix, suffix = h[:5], h[5:]
url = f'https://api.pwnedpasswords.com/range/{prefix}'
with urllib.request.urlopen(url, timeout=10) as r:
    body = r.read().decode()
hits = [line for line in body.splitlines() if line.startswith(suffix)]
if hits:
    count = hits[0].split(':')[1].strip()
    print(f'[!] PWNED — appears in {count} breaches. Change it.')
else:
    print('[OK] Not found in known breaches')