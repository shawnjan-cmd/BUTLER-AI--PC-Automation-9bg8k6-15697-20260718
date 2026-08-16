import urllib.request, json
try:
    with urllib.request.urlopen("https://api.ipify.org?format=json", timeout=6) as r:
        ip = json.load(r)["ip"]
    print(f"Public IP: {ip}")
except Exception as e:
    print(f"Lookup failed: {e}")