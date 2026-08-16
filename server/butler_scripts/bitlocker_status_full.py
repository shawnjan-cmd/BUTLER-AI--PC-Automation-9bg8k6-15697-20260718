import subprocess
r = subprocess.run(['manage-bde','-status'], capture_output=True, text=True)
if r.returncode != 0:
    # Try PowerShell
    ps = 'Get-BitLockerVolume | Format-List MountPoint,VolumeStatus,EncryptionMethod,ProtectionStatus,EncryptionPercentage'
    r = subprocess.run(['powershell','-NoProfile','-Command',ps], capture_output=True, text=True)
print(r.stdout or r.stderr or 'BitLocker tools not available (Home edition?)')