import time
from pathlib import Path
message = 'Finished feature X, started review of PR #42'   # <-- edit
log = Path.home()/'Documents'/'worklog.md'
ts = time.strftime('%Y-%m-%d %H:%M')
log.parent.mkdir(parents=True, exist_ok=True)
with log.open('a', encoding='utf-8') as f: f.write(f'- {ts}  {message}\n')
print(f'[OK] Logged to {log}')