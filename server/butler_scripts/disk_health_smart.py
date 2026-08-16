import subprocess
# Try wmic first
r = subprocess.run(['wmic','diskdrive','get','status,model,size,interfacetype,mediatype','/format:list'], capture_output=True, text=True)
print('=== Disk Status (WMIC) ==='); print(r.stdout)
# Try Get-PhysicalDisk for more detail
ps = 'Get-PhysicalDisk | Select-Object FriendlyName,Size,MediaType,HealthStatus,OperationalStatus | Format-Table -Auto'
r2 = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True)
print('=== Physical Disks (PowerShell) ==='); print(r2.stdout)
# Check for SMART failures
if 'Pred Fail' in r.stdout or 'Caution' in r2.stdout:
    print('\n⚠ SMART predicts potential disk failure! Back up immediately!')
else:
    print('\n✓ No SMART failure predictions.')