import re
from pathlib import Path
ssh_dir = Path.home() / '.ssh'
if not ssh_dir.exists():
    print('No ~/.ssh directory found.'); raise SystemExit
print(f'SSH keys in {ssh_dir}:\n')
for f in ssh_dir.iterdir():
    if f.is_file():
        try:
            content = f.read_text(errors='replace')[:500]
        except: content = ''
        is_private = 'PRIVATE KEY' in content or 'BEGIN RSA' in content
        encrypted = 'ENCRYPTED' in content or 'Proc-Type' in content
        key_type = 'RSA' if 'RSA' in content else ('EC' if 'EC' in content else ('Ed25519' if 'Ed25519' in content else ('DSA' if 'DSA' in content else 'unknown')))
        size_kb = f.stat().st_size / 1024
        if is_private:
            status = '✓ encrypted' if encrypted else '⚠ UNENCRYPTED'
            print(f'  [PRIVATE] {f.name:30} {key_type:10} {status}')
            if not encrypted:
                print(f'    → Run: ssh-keygen -p -f {f} to add a passphrase')
        else:
            print(f'  [public]  {f.name:30} {key_type}')
        if key_type == 'DSA':
            print(f'    ⚠ DSA key — deprecated and weak, regenerate with Ed25519')
print('\nDone.')