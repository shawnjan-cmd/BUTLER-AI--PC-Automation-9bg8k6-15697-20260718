import subprocess, time
from pathlib import Path
out_dir = Path.home()/'Desktop'
logs = ['System','Security','Application']
for log in logs:
    out = out_dir/f'eventlog_{log.lower()}_{time.strftime("%Y%m%d")}.csv'
    ps = (f"Get-WinEvent -LogName '{log}' -MaxEvents 500 -EA SilentlyContinue | "
          f"Select-Object TimeCreated,Id,LevelDisplayName,ProviderName,Message | "
          f"Export-Csv '{out}' -NoTypeInformation")
    r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True, timeout=60)
    if out.exists():
        print(f'✓ {log}: {out}')
    else:
        print(f'✗ {log}: {r.stderr.strip() or "no events"}')
print('Done.')