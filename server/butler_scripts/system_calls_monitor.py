import subprocess, time
print('Enabling process creation audit...')
subprocess.run(['auditpol','/set','/subcategory:Process Creation','/success:enable'], capture_output=True)
print('Monitoring new process creation events for 30 seconds...\n')
time.sleep(30)
ps = ("Get-WinEvent -FilterHashtable @{LogName='Security';Id=4688;StartTime=(Get-Date).AddSeconds(-35)} "
      "-EA SilentlyContinue | Select-Object TimeCreated,@{n='Process';e={$_.Properties[5].Value}},"
      "@{n='Parent';e={$_.Properties[13].Value}},@{n='User';e={$_.Properties[1].Value}} | Format-Table -Auto")
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print(r.stdout or 'No events found (may need admin or audit policy enabled).')