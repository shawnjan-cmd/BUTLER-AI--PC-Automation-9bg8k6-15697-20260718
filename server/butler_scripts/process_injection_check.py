import subprocess
r = subprocess.run(['powershell','-NoProfile','-Command',
    'Get-Process | Select-Object Name,Id,@{n="Parent";e={(Get-Process -Id $_.Parent.Id -EA SilentlyContinue).Name}},Path | Format-Table -Auto'],
    capture_output=True, text=True)
print('=== Process Parent Map ===')
print(r.stdout[:4000])
# Check for common injection targets with unexpected parents
suspicious_pairs = [('cmd','explorer'),('powershell','word'),('powershell','excel'),('wscript','svchost')]
lines = r.stdout.lower().splitlines()
print('\n=== Suspicious Parent→Child Checks ===')
for child, bad_parent in suspicious_pairs:
    hits = [l for l in lines if child in l and bad_parent in l]
    for h in hits:
        print(f'  ⚠ {h.strip()}')
print('[Done]')