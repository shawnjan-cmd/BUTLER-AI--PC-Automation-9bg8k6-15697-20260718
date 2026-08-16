import subprocess, winreg
print('=== Telemetry Services ===')
services = ['DiagTrack','dmwappushservice','WerSvc','PcaSvc','RemoteRegistry','WSearch']
for svc in services:
    r = subprocess.run(['sc','query',svc], capture_output=True, text=True)
    state = 'RUNNING' if 'RUNNING' in r.stdout else ('STOPPED' if 'STOPPED' in r.stdout else 'NOT FOUND')
    flag = '⚠' if state == 'RUNNING' and svc in ['DiagTrack','dmwappushservice'] else ' '
    print(f'  {flag} {svc:25} {state}')
print('\n=== Privacy Registry Keys ===')
keys_to_check = [
    (r'SOFTWARE\Policies\Microsoft\Windows\DataCollection', 'AllowTelemetry'),
    (r'SOFTWARE\Microsoft\Windows\CurrentVersion\Privacy', 'TailoredExperiencesWithDiagnosticDataEnabled'),
]
for key_path, value_name in keys_to_check:
    try:
        k = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path)
        v, _ = winreg.QueryValueEx(k, value_name)
        print(f'  {value_name}: {v}')
        winreg.CloseKey(k)
    except: print(f'  {value_name}: (not set)')