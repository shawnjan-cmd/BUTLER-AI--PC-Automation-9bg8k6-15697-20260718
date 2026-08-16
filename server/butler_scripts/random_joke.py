import urllib.request, json
URL = "https://official-joke-api.appspot.com/jokes/programming/random"
try:
    with urllib.request.urlopen(URL, timeout=6) as r:
        j = json.load(r)[0]
    print(j["setup"]); print(" ", j["punchline"])
except Exception as e:
    print(f"offline: {e}")