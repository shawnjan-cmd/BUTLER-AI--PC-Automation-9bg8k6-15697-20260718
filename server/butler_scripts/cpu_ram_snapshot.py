try:
    import psutil
    print(f"CPU total : {psutil.cpu_percent(interval=1):5.1f}%")
    print(f"RAM       : {psutil.virtual_memory().percent:5.1f}%")
    cores = psutil.cpu_percent(interval=0.5, percpu=True)
    for i, p in enumerate(cores): print(f"  core {i:2}: {p:5.1f}%")
except ImportError:
    print("pip install psutil")