import subprocess, os
from pathlib import Path
print('=== REGISTRY RUN KEYS ===')
keys = [
    r'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
    r'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
    r'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce',
    r'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce',
    r'HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run',
]
for k in keys:
    r = subprocess.run(['reg','query',k], capture_output=True, text=True)
    if r.stdout.strip():
        print(f'\n{k}')
        for l in r.stdout.splitlines():
            if l.strip() and k not in l: print(' ', l.strip())
print('\n=== STARTUP FOLDERS ===')
for sf in [Path(os.environ.get('APPDATA',''))/r'Microsoft\Windows\Start Menu\Programs\Startup',
           Path(r'C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp')]:
    if sf.exists():
        items = list(sf.iterdir())
        print(f'{sf}: {len(items)} items')
        for i in items: print(' ', i.name)
print('\n=== SCHEDULED TASKS (1st level) ===')
r = subprocess.run(['schtasks','/query','/fo','LIST','/v'], capture_output=True, text=True)
print(r.stdout[:3000])