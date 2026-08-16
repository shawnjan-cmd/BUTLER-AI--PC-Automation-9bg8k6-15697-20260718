try: import psutil
except ImportError: print('pip install psutil'); raise SystemExit
targets = {'gamebar.exe','gamebarftserver.exe','nvidia overlay.exe','nvcontainer.exe','discord.exe','razer cortex.exe'}
n = 0
for p in psutil.process_iter(['name']):
    nm = (p.info.get('name') or '').lower()
    if nm in targets:
        try: p.kill(); n += 1; print(f'  killed {nm}')
        except Exception: pass
print(f'[OK] killed {n} process(es)')