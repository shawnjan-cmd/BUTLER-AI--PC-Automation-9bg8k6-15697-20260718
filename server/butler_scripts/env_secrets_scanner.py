import os, re
from pathlib import Path
SECRET_PATTERNS = [
    (r'(?i)(api[_-]?key|apikey)[\s:=]+([\w\-]{16,})', 'API Key'),
    (r'(?i)(secret|password|passwd|pwd)[\s:=]+([^\s]{8,})', 'Password/Secret'),
    (r'sk-[a-zA-Z0-9]{20,}', 'OpenAI Key'),
    (r'(?i)github[_-]?token[\s:=]+([a-z0-9]{36,})', 'GitHub Token'),
    (r'AKIA[A-Z0-9]{16}', 'AWS Access Key'),
]
print('=== Environment Variables Scan ===')
for k, v in os.environ.items():
    for pat, label in SECRET_PATTERNS:
        if re.search(pat, f'{k}={v}'):
            print(f'  ⚠ [{label}] {k}={v[:30]}...')
print('\n=== .env File Scan ===')
for env_file in [Path('.env'), Path.home()/'.env', Path.home()/'.bashrc', Path.home()/'.zshrc', Path.home()/'.profile']:
    if env_file.exists():
        content = env_file.read_text(errors='replace')
        for pat, label in SECRET_PATTERNS:
            for m in re.finditer(pat, content):
                print(f'  ⚠ [{label}] in {env_file}: {m.group()[:50]}')
print('Done.')