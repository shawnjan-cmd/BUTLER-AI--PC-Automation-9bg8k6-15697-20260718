import subprocess
ps = ("Get-WmiObject Win32_Service | Where-Object {$_.State -eq 'Running'} | "
      "ForEach-Object { $path = $_.PathName -replace '\"',''; "
      "$sig = (Get-AuthenticodeSignature $path.Split(' ')[0] -EA SilentlyContinue); "
      "if ($sig.Status -ne 'Valid') { [PSCustomObject]@{Name=$_.Name; Status=$sig.Status; Path=$_.PathName} } } | "
      "Format-Table -Auto -Wrap")
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print(r.stdout[:5000] or 'All running services appear signed ✓')