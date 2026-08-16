import platform, os
from pathlib import Path
if platform.system()!='Windows': print('Windows only'); raise SystemExit
try:
    import pythoncom
    from win32com.client import Dispatch
except ImportError:
    print('Install: pip install pywin32'); raise SystemExit
pythoncom.CoInitialize()
sh = Dispatch('WScript.Shell')
roots=[Path(os.environ['USERPROFILE'])/'Desktop',
       Path(os.environ['PUBLIC'])/'Desktop',
       Path(os.environ['APPDATA'])/'Microsoft'/'Windows'/'Start Menu']
broken=0
for r in roots:
    if not r.exists(): continue
    for lnk in r.rglob('*.lnk'):
        try:
            tgt=sh.CreateShortcut(str(lnk)).Targetpath
            if tgt and not Path(tgt).exists():
                print(f'  BROKEN  {lnk} -> {tgt}'); broken+=1
        except Exception: pass
print(f'\n✓ Found {broken} broken shortcuts')