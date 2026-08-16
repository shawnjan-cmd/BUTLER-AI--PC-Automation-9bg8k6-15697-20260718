try:
    import psutil
    for p in psutil.disk_partitions(all=False):
        try:
            u = psutil.disk_usage(p.mountpoint)
            print(f"{p.device:12} {p.mountpoint:20} {p.fstype:8} "
                  f"{u.used/1e9:6.1f}/{u.total/1e9:6.1f} GB  ({u.percent}%)")
        except PermissionError:
            pass
except ImportError:
    print("pip install psutil")