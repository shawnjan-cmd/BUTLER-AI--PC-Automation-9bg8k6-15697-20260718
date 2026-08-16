import subprocess
ps = ("$s=(New-Object -com Microsoft.Update.Session);"
      "$r=$s.CreateUpdateSearcher().Search('IsInstalled=0');"
      "$r.Updates | ForEach-Object { '{0} ({1} MB)' -f $_.Title, [math]::Round($_.MaxDownloadSize/1MB,1) }")
r = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True)
print(r.stdout.strip() or 'No pending updates.')