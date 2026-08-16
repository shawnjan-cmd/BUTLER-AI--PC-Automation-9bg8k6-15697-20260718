try:
    import psutil, time
    for p in psutil.process_iter(["pid","name"]): p.cpu_percent(None)
    time.sleep(1)
    procs = [(p.cpu_percent(None), p.info["pid"], p.info["name"]) for p in psutil.process_iter(["pid","name"])]
    procs.sort(reverse=True)
    print(f"{'CPU%':>6}  {'PID':>6}  NAME")
    for cpu, pid, name in procs[:10]:
        print(f"{cpu:6.1f}  {pid:6}  {name}")
except ImportError:
    print("pip install psutil")