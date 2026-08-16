import psutil
killed=freed=0
for p in psutil.process_iter(['name','memory_info','cmdline']):
    try:
        n=(p.info['name'] or '').lower()
        cmd=' '.join(p.info.get('cmdline') or [])
        if any(x in n for x in ('chrome','msedge','brave','vivaldi')) and ('--type=renderer' in cmd or '--type=utility' in cmd or '--type=gpu-process' in cmd):
            mem=p.info['memory_info'].rss
            p.kill(); killed+=1; freed+=mem
    except Exception: pass
print(f'✓ Killed {killed} helper processes, freed {freed/1024/1024:.1f} MB RAM')