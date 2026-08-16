import subprocess
ps = ('Get-TlsCipherSuite | Select-Object Name,KeyExchangeAlgorithm,Cipher,Hash | '
      'Sort-Object Name | Format-Table -Auto')
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True)
print(r.stdout[:5000])
weak = ['RC4','NULL','EXPORT','DES','3DES','MD5','SHA1']
print('\n=== Potentially Weak Suites ===')
for line in r.stdout.splitlines():
    for w in weak:
        if w in line:
            print(f'  ⚠ {line.strip()}'); break