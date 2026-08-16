import subprocess
ps = ("$sh=New-Object -ComObject WScript.Shell;"
      "$paths=@(\"$env:USERPROFILE\\Desktop\",\"$env:APPDATA\\Microsoft\\Windows\\Start Menu\");"
      "foreach($p in $paths){Get-ChildItem $p -Recurse -Filter *.lnk -ErrorAction SilentlyContinue | ForEach-Object {"
      "$t=$sh.CreateShortcut($_.FullName).TargetPath; if($t -and -not (Test-Path $t)){\"$($_.FullName) -> $t\"}}}")
out = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True).stdout
print(out.strip() or 'No broken shortcuts found.')