import subprocess, time
print('Monitoring clipboard for changes (30 sec)... Ctrl+C to stop')
def get_clip():
    try:
        r = subprocess.run(['powershell','-NoProfile','-Command','Get-Clipboard'], capture_output=True, text=True, timeout=2)
        return r.stdout.strip()[:200]
    except: return ''
last = get_clip()
changes = 0
try:
    for _ in range(60):
        time.sleep(0.5)
        current = get_clip()
        if current != last:
            changes += 1
            print(f'  [{time.strftime("%H:%M:%S")}] Clipboard changed → "{current[:80]}"')
            last = current
except KeyboardInterrupt: pass
print(f'\nClipboard changes observed: {changes}')