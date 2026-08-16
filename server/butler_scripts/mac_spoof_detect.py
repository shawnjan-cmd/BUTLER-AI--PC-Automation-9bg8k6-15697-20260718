import subprocess
print('=== Adapter MAC Comparison ===')
r = subprocess.run(['getmac','/v','/fo','list'], capture_output=True, text=True)
print(r.stdout[:3000])
print('\n=== WMI Physical MACs ===')
r2 = subprocess.run(['wmic','nic','where','PhysicalAdapter=TRUE','get','Name,MACAddress','/format:list'], capture_output=True, text=True)
print(r2.stdout[:2000])
print('\nNote: Discrepancies between getmac and WMI output may indicate MAC spoofing.')