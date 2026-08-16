import time
from pathlib import Path
out = Path.home() / 'Documents' / 'standups'
out.mkdir(parents=True, exist_ok=True)
f = out / f'standup_{time.strftime("%Y-%m-%d")}.md'
if f.exists(): print(f'Already exists: {f}'); raise SystemExit
tmpl = f'''# Standup {time.strftime("%A %Y-%m-%d")}

## Yesterday
- 

## Today
- 

## Blockers
- 

## Notes
- 
'''
f.write_text(tmpl)
print(f'[OK] {f}')