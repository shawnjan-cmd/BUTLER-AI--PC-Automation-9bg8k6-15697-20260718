import os, sys
from pathlib import Path
target = Path(input('File to securely wipe (IRREVERSIBLE): ').strip())
if not target.exists() or not target.is_file():
    print('File not found.'); sys.exit(1)
size = target.stat().st_size
confirm = input(f'Type YES to wipe {target.name} ({size} bytes) 7 passes: ')
if confirm.strip() != 'YES':
    print('Cancelled.'); sys.exit(0)
print('Wiping...')
with open(target, 'r+b') as f:
    for pass_num in range(7):
        patterns = [b'\x00', b'\xff', b'\x55', b'\xaa', b'\x92', b'\x49', b'\x24']
        f.seek(0)
        f.write(patterns[pass_num % 7] * size)
        f.flush()
        os.fsync(f.fileno())
        print(f'  Pass {pass_num+1}/7 done')
target.unlink()
print(f'\n✓ {target.name} securely wiped and deleted.')