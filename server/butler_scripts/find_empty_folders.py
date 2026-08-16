from pathlib import Path
root = Path.home()
empties = []
for d in root.rglob('*'):
    try:
        if d.is_dir() and not any(d.iterdir()): empties.append(d)
    except (PermissionError, OSError): pass
print(f'Found {len(empties)} empty folders under {root}:')
for d in empties[:200]: print(f'  {d}')
if len(empties) > 200: print(f'  ... and {len(empties)-200} more')