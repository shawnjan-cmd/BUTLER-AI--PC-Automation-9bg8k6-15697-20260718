import subprocess, winreg
print('=== LSA Protection ===')
try:
    k = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r'SYSTEM\CurrentControlSet\Control\Lsa')
    v, _ = winreg.QueryValueEx(k, 'RunAsPPL')
    print(f'RunAsPPL: {v}  ({"ENABLED ✓" if v == 1 else "DISABLED ✗"})')
    winreg.CloseKey(k)
except Exception as e:
    print(f'Could not read LSA key: {e}')
print('\n=== Credential Guard ===')
r = subprocess.run(['wmic','/namespace:\\\\root\\Microsoft\\Windows\\DeviceGuard','path','Win32_DeviceGuard','get','VirtualizationBasedSecurityStatus,SecurityServicesRunning','/format:list'], capture_output=True, text=True)
print(r.stdout or 'WMI query failed (Win10 Pro+)')
print('\n=== SecureBoot ===')
r2 = subprocess.run(['powershell','-NoProfile','-Command','Confirm-SecureBootUEFI 2>&1'], capture_output=True, text=True)
print(r2.stdout.strip() or r2.stderr.strip())