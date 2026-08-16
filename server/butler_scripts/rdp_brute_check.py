import subprocess
print('Checking Security event log for failed logins (Event ID 4625)...')
ps = ("Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625} -MaxEvents 100 -EA SilentlyContinue | "
      "Select-Object TimeCreated,@{n='User';e={$_.Properties[5].Value}},@{n='IP';e={$_.Properties[19].Value}} | "
      "Format-Table -Auto")
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print(r.stdout or 'No failed login events found (or insufficient permissions).')
fails = r.stdout.count('\n') - 3
if fails > 10:
    print(f'\n⚠ {fails}+ failed logins detected — consider blocking RDP or enabling Account Lockout Policy.')