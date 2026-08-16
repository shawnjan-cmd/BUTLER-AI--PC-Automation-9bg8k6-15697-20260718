import subprocess
r = subprocess.run(['vssadmin','list','shadows'], capture_output=True, text=True)
if 'No items' in r.stdout or not r.stdout.strip():
    print('⚠ NO Volume Shadow Copies found!')
    print('Tip: Enable System Protection to create restore points.')
else:
    lines = [l for l in r.stdout.splitlines() if l.strip()]
    count = sum(1 for l in lines if 'Shadow Copy ID' in l)
    print(f'✓ {count} shadow copy(ies) found.')
    print(r.stdout[:3000])