import subprocess
r = subprocess.run(['net','localgroup','administrators'], capture_output=True, text=True)
print(r.stdout)
print('---')
r2 = subprocess.run(['wmic','useraccount','get','name,disabled,passwordrequired,lockout','/format:list'], capture_output=True, text=True)
print(r2.stdout[:3000])