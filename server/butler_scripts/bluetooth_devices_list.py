import subprocess
ps = "Get-PnpDevice -Class Bluetooth | Select-Object FriendlyName,Status | Format-Table -AutoSize"
print(subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True).stdout)