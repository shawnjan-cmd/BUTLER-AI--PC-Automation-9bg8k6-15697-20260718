try: import psutil
except ImportError: print('pip install psutil'); raise SystemExit
brands = ['chrome','msedge','firefox','brave','opera','vivaldi','arc']
counts = {b:0 for b in brands}; ram = {b:0 for b in brands}
for p in psutil.process_iter(['name','memory_info']):
    n = (p.info.get('name') or '').lower()
    for b in brands:
        if b in n:
            counts[b] += 1
            try: ram[b] += p.info['memory_info'].rss
            except Exception: pass
for b in brands:
    if counts[b]: print(f'  {b:10s} {counts[b]:4d} processes  {ram[b]/1024/1024:7.1f} MB')