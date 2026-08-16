import subprocess
stores = ['Root','CA','My']
for store in stores:
    print(f'\n=== {store} Store ===')
    r = subprocess.run(['certutil','-store',store], capture_output=True, text=True)
    lines = r.stdout.splitlines()
    certs = [l for l in lines if 'Subject:' in l or 'Issuer:' in l or 'Expires:' in l]
    for c in certs[:60]: print(c)
print('\nTip: Unexpected certs in Root store can enable SSL interception.')