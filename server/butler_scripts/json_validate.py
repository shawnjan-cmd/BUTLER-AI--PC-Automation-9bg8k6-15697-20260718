import json
from pathlib import Path
f = Path.home()/'Desktop'/'data.json'   # <-- edit
if not f.exists(): print(f'Set f= a real file (current: {f})'); raise SystemExit
try:
    json.loads(f.read_text(encoding='utf-8'))
    print(f'[OK] {f.name} is valid JSON')
except json.JSONDecodeError as e:
    print(f'[INVALID] {e.msg} at line {e.lineno} col {e.colno} (char {e.pos})')