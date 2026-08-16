import platform
if platform.system() != 'Windows': print('Windows only'); raise SystemExit
import winreg
keys = [
    (winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'),
    (winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'),
    (winreg.HKEY_CURRENT_USER,  r'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'),
]
seen = set()
for root, path in keys:
    try:
        with winreg.OpenKey(root, path) as k:
            for i in range(winreg.QueryInfoKey(k)[0]):
                try:
                    sub = winreg.EnumKey(k, i)
                    with winreg.OpenKey(k, sub) as sk:
                        name = winreg.QueryValueEx(sk, 'DisplayName')[0]
                        try: ver = winreg.QueryValueEx(sk, 'DisplayVersion')[0]
                        except Exception: ver = ''
                        if name and name not in seen:
                            seen.add(name); print(f'  {name:60s} {ver}')
                except Exception: pass
    except Exception: pass
print(f'\n[{len(seen)} programs]')