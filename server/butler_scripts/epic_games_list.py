import json, platform
from pathlib import Path
if platform.system()!='Windows': print('Windows only'); raise SystemExit
folder = Path('C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests')
if not folder.exists(): print('Epic Launcher not installed'); raise SystemExit
for m in folder.glob('*.item'):
    try:
        d = json.loads(m.read_text(encoding='utf-8'))
        print(f'  {d.get("DisplayName","?"):40s} {d.get("InstallLocation","")}')
    except Exception: pass