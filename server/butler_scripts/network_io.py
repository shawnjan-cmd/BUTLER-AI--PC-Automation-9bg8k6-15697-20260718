try:
    import psutil, time
    a = psutil.net_io_counters(); time.sleep(5); b = psutil.net_io_counters()
    up = (b.bytes_sent - a.bytes_sent) / 5
    dn = (b.bytes_recv - a.bytes_recv) / 5
    print(f"↑ {up/1024:8.1f} KB/s   ↓ {dn/1024:8.1f} KB/s")
except ImportError:
    print("pip install psutil")