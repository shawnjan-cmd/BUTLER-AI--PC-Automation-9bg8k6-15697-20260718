import subprocess
ps = 'Get-MpPreference | Select-Object ExclusionPath,ExclusionProcess,ExclusionExtension | Format-List'
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print(r.stdout)
if 'ExclusionPath' in r.stdout and r.stdout.count('\n') > 5:
    print('⚠ Review these exclusions — unknown paths may indicate malware self-protection.')
else:
    print('\n(Tip: Clean exclusion list is a good sign.)')