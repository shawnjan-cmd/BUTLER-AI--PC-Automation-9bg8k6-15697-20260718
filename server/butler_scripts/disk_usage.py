from pathlib import Path
root = Path.home()
print(f'Disk usage under {root}:\n')
sizes = []
for p in root.iterdir():
    if not p.is_dir(): continue
    try:
        sz = sum(f.stat().st_size for f in p.rglob('*') if f.is_file())
        sizes.append((sz, p.name))
    except Exception: pass
for sz, name in sorted(sizes, reverse=True)[:25]:
    print(f'  {sz/1024/1024/1024:8.2f} GB   {name}')