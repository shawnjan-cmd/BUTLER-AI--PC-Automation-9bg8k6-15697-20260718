import sqlite3
from pathlib import Path
db = Path.home()/'Documents'/'data.db'   # <-- edit
if not db.exists(): print('Set db= a real file'); raise SystemExit
out = db.with_suffix('.sql')
conn = sqlite3.connect(db)
with out.open('w', encoding='utf-8') as f:
    for line in conn.iterdump(): f.write(f'{line}\n')
conn.close()
print(f'[OK] {out} ({out.stat().st_size:,} bytes)')