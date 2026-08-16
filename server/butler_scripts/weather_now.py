import urllib.request
try:
    with urllib.request.urlopen('https://wttr.in/?format=4', timeout=10) as r:
        print(r.read().decode())
    with urllib.request.urlopen('https://wttr.in/?T0&Q', timeout=10) as r:
        print(r.read().decode()[:2000])
except Exception as e: print(f'[ERR] {e}')