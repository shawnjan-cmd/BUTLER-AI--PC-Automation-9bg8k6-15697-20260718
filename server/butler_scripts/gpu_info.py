import subprocess, platform
def try_run(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception: return ''
out = try_run(['nvidia-smi','--query-gpu=name,memory.total,driver_version','--format=csv'])
if out: print('[NVIDIA]'); print(out); raise SystemExit
if platform.system() == 'Windows':
    out = try_run(['wmic','path','win32_videocontroller','get','name,adapterram,driverversion','/format:list'])
elif platform.system() == 'Linux':
    out = try_run(['lspci']) or ''
    out = '\n'.join(l for l in out.splitlines() if 'VGA' in l or '3D' in l)
else:
    out = try_run(['system_profiler','SPDisplaysDataType'])
print(out or '[INFO] No GPU info available')