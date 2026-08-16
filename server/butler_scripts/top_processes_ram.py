try:
    import psutil
    procs = [(p.info["memory_info"].rss, p.info["pid"], p.info["name"])
             for p in psutil.process_iter(["pid","name","memory_info"]) if p.info["memory_info"]]
    procs.sort(reverse=True)
    print(f"{'RAM MB':>8}  {'PID':>6}  NAME")
    for rss, pid, name in procs[:10]:
        print(f"{rss/1024/1024:8.1f}  {pid:6}  {name}")
except ImportError:
    print("pip install psutil")