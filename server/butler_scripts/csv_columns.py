import csv
from pathlib import Path
from collections import Counter
f = Path.home()/'Desktop'/'data.csv'   # <-- edit
if not f.exists(): print('Set f= a real file'); raise SystemExit
with f.open(newline='', encoding='utf-8', errors='ignore') as fh:
    rows = list(csv.DictReader(fh))
if not rows: print('(empty)'); raise SystemExit
for col in rows[0]:
    vals = [r.get(col,'') for r in rows]
    try:
        nums = [float(v) for v in vals if v not in ('',None)]
        print(f'{col} [num]: min={min(nums):.2f} max={max(nums):.2f} mean={sum(nums)/len(nums):.2f}')
    except ValueError:
        top = Counter(vals).most_common(5)
        print(f'{col} [text]: top= {top}')