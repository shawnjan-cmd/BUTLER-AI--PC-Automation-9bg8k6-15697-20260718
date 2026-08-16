import subprocess
state = (input('on/off [off]: ').strip().lower() or 'off')
ps = ("[void][Windows.Devices.Radios.Radio,Windows.System.Devices,ContentType=WindowsRuntime];"
      "$r = (Await ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])) | ? { $_.Kind -eq 'Bluetooth' };"
      f"$r.SetStateAsync('{('On' if state=='on' else 'Off')}') | Out-Null")
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print(r.stdout or r.stderr or f'Bluetooth -> {state}')