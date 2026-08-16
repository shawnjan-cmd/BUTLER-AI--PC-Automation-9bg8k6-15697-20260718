import subprocess, shutil, sys
if not shutil.which('winget'):
    print('winget not found. Install "App Installer" from the Microsoft Store first.'); sys.exit(1)
pkgs = ['Figma.Figma', 'GIMP.GIMP', 'Inkscape.Inkscape', 'BlenderFoundation.Blender']
print('Installing: Design')
ok = fail = 0
for p in pkgs:
    print(f'\n--- {p} ---')
    r = subprocess.run(['winget','install','--id',p,'-e','--silent',
                        '--accept-source-agreements','--accept-package-agreements'],
                       capture_output=True, text=True)
    if r.returncode == 0 or 'already installed' in (r.stdout+r.stderr).lower():
        print(f'OK: {p}'); ok += 1
    else:
        print(f'FAIL: {p}\n{r.stderr or r.stdout}'); fail += 1
print(f'\nDone. {ok} ok, {fail} failed of {len(pkgs)}.')