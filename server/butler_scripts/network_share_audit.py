import subprocess
print('=== Active Network Shares ===')
r = subprocess.run(['net','share'], capture_output=True, text=True)
print(r.stdout)
print('\n=== Share Permissions (WMI) ===')
r2 = subprocess.run(['wmic','share','get','name,path,description,allowmaximum','/format:list'], capture_output=True, text=True)
print(r2.stdout[:3000])