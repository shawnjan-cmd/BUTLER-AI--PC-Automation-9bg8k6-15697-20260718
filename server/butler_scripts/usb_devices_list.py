import subprocess
ps = "Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like 'USB*'} | Select-Object FriendlyName,Status | Format-Table -AutoSize"
print(subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True).stdout)