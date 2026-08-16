import subprocess
ps = (
    "$procs = Get-Process; "
    "foreach ($p in $procs) {"
    "  try {"
    "    $mods = $p.Modules | Where-Object {$_.ModuleName -match 'hook|key|log|monitor|spy' } ;"
    "    if ($mods) { Write-Output \"SUSPECT: $($p.Name) ($($p.Id)) — $($mods.ModuleName)\" }"
    "  } catch {}"
    "}"
)
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print('=== Processes with suspicious module names ===')
print(r.stdout or 'None found ✓')
print('\n=== Global Hook Check (WinAPI) ===')
r2 = subprocess.run(['powershell','-NoProfile','-Command',
    'Get-WmiObject Win32_Process | Where-Object {$_.CommandLine -match "hook|SetWindowsHookEx"} | Select-Object Name,ProcessId,CommandLine | Format-Table -Auto'],
    capture_output=True, text=True)
print(r2.stdout or 'None found ✓')