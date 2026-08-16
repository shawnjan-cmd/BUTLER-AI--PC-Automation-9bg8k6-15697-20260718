import platform, winreg
if platform.system()!='Windows': print('Windows only'); raise SystemExit
key=r'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'
with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key, 0, winreg.KEY_READ|winreg.KEY_WRITE) as k:
    cur,_ = winreg.QueryValueEx(k,'AppsUseLightTheme')
    new = 0 if cur else 1
    winreg.SetValueEx(k,'AppsUseLightTheme',0,winreg.REG_DWORD,new)
    winreg.SetValueEx(k,'SystemUsesLightTheme',0,winreg.REG_DWORD,new)
print(f"✓ Switched to {'Light' if new else 'Dark'} mode (some apps need restart)")