import ctypes, psutil
psapi = ctypes.WinDLL('psapi.dll'); kernel = ctypes.WinDLL('kernel32.dll')
before = psutil.virtual_memory().available
ok = 0
for p in psutil.process_iter(['pid']):
    try:
        h = kernel.OpenProcess(0x001F0FFF, False, p.info['pid'])
        if h:
            psapi.EmptyWorkingSet(h); kernel.CloseHandle(h); ok += 1
    except Exception: pass
after = psutil.virtual_memory().available
print(f'Trimmed {ok} processes. RAM freed: {(after-before)/1024/1024:.1f} MB')