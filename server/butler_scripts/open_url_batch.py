import webbrowser
URLS = [
    "https://github.com",
    "https://news.ycombinator.com",
    "https://stackoverflow.com",
]
for u in URLS: webbrowser.open(u)
print(f"✓ opened {len(URLS)} tabs")