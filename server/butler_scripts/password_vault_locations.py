import os
from pathlib import Path
VAULT_PATTERNS = [
    ('*.kdbx', 'KeePass'),
    ('*.agilekeychain', '1Password (old)'),
    ('*.opvault', '1Password'),
    ('data.json', 'Bitwarden (local)'),
    ('*.pwm', 'PWManager'),
    ('logins.json', 'Firefox passwords'),
    ('Login Data', 'Chrome passwords'),
]
print('Searching for password vaults...\n')
for pattern, label in VAULT_PATTERNS:
    for base in [Path.home(), Path('C:/Users')]:
        if not base.exists(): continue
        for f in base.rglob(pattern):
            print(f'  [{label}] {f}')
print('\nDone.')