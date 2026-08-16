import csv
from pathlib import Path
f = Path.home()/'Desktop'/'data.csv'   # <-- edit
if not f.exists(): print(f'Set f= a real file'); raise SystemExit
with f.open(newline='', encoding='utf-8', errors='ignore') as fh:
    r = csv.reader(fh); rows = list(r)
if not rows: print('(empty)'); raise SystemExit
print(f'Columns: {rows[0]}'); print(f'Rows   : {len(rows)-1}\n')
for row in rows[1:11]: print('  ', row)