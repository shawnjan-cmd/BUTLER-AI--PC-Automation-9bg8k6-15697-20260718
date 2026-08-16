import subprocess, os, time
from pathlib import Path
out = Path.home() / 'Desktop' / f'system_report_{time.strftime("%Y%m%d_%H%M%S")}.txt'
sections = [
    ('SYSTEM INFO', ['systeminfo']),
    ('CPU', ['wmic','cpu','get','name,numberofcores,maxclockspeed','/format:list']),
    ('GPU', ['wmic','path','win32_videocontroller','get','name,driverversion','/format:list']),
    ('RAM', ['wmic','memorychip','get','capacity,speed,manufacturer','/format:list']),
    ('DISKS', ['wmic','diskdrive','get','model,size,interfacetype','/format:list']),
    ('NETWORK', ['ipconfig','/all']),
]
with open(out,'w',encoding='utf-8',errors='replace') as f:
    for title, cmd in sections:
        f.write(f'\n===== {title} =====\n')
        try: f.write(subprocess.run(cmd, capture_output=True, text=True, timeout=60).stdout)
        except Exception as e: f.write(f'(error: {e})')
print(f'Saved: {out}')