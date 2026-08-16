import subprocess
print('=== GPU Temperature (NVIDIA) ===')
r = subprocess.run(['nvidia-smi','--query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total','--format=csv,noheader'], capture_output=True, text=True)
if r.returncode == 0:
    for line in r.stdout.strip().splitlines():
        parts = line.split(', ')
        if len(parts) >= 5:
            print(f'  {parts[0]}: {parts[1]}°C  GPU {parts[2]}  VRAM {parts[3]}/{parts[4]}')
else:
    print('  nvidia-smi not available (AMD/Intel GPU or not installed)')
print('\n=== CPU Temperature (WMI) ===')
ps = ('Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi -EA SilentlyContinue | '
      'Select-Object InstanceName,@{n="TempC";e={($_.CurrentTemperature - 2732) / 10}} | Format-Table -Auto')
r2 = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True)
print(r2.stdout or 'WMI thermal data not available (driver-dependent)')