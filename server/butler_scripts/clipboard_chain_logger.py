import subprocess, time, json
from pathlib import Path
out = Path.home()/'Desktop'/'clipboard_log.json'
print('Logging clipboard for 2 minutes... (Ctrl+C to stop early)')
def get_clip():
    try:
        r = subprocess.run(['powershell','-NoProfile','-Command','Get-Clipboard -Format Text'], capture_output=True, text=True, timeout=2)
        return r.stdout.strip()[:1000]
    except: return ''
log = []
last = get_clip()
try:
    end = time.time() + 120
    while time.time() < end:
        time.sleep(1)
        c = get_clip()
        if c and c != last:
            entry = {'time': time.strftime('%H:%M:%S'), 'text': c}
            log.append(entry)
            print(f'  [{entry["time"]}] {c[:60]}')
            last = c
except KeyboardInterrupt: pass
out.write_text(json.dumps(log, indent=2, ensure_ascii=False))
print(f'\n{len(log)} clipboard events saved to {out}')