import urllib.request, json
try:
    with urllib.request.urlopen('https://zenquotes.io/api/random', timeout=10) as r:
        q = json.loads(r.read())[0]
    print(f'"{q["q"]}"\n   — {q["a"]}')
except Exception as e: print(f'[ERR] {e}')