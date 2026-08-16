import subprocess, winreg
print('=== Screen Saver Settings ===')
try:
    k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Control Panel\Desktop')
    for name in ['ScreenSaveActive','ScreenSaverIsSecure','ScreenSaveTimeOut']:
        try:
            v, _ = winreg.QueryValueEx(k, name)
            print(f'  {name}: {v}')
        except: print(f'  {name}: (not set)')
    winreg.CloseKey(k)
except Exception as e:
    print(f'Registry error: {e}')
print('\n=== Power Plan Lock Timeout ===')
r = subprocess.run(['powercfg','/query','SCHEME_CURRENT','SUB_VIDEO','VIDEOIDLE'], capture_output=True, text=True)
for l in r.stdout.splitlines():
    if 'Current AC' in l or 'Current DC' in l:
        val = l.strip().split()[-1]
        try: secs = int(val, 16); print(f'  Timeout: {secs}s ({secs//60} min)')
        except: print(f'  {l.strip()}')