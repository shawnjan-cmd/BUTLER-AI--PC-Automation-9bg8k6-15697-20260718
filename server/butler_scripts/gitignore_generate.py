import urllib.request
STACK='python,node,vscode,windows,macos'
try:
    body=urllib.request.urlopen(f'https://www.toptal.com/developers/gitignore/api/{STACK}', timeout=10).read().decode()
    from pathlib import Path
    Path('.gitignore').write_text(body, encoding='utf-8')
    print(f'✓ Wrote .gitignore ({len(body)} bytes) for: {STACK}')
except Exception as e: print(e)