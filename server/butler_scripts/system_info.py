import platform, os, sys, time
print("─" * 50)
print(f"OS         : {platform.system()} {platform.release()}")
print(f"Version    : {platform.version()}")
print(f"Machine    : {platform.machine()}  ({platform.processor() or 'cpu'})")
print(f"Hostname   : {platform.node()}")
print(f"Python     : {sys.version.split()[0]} @ {sys.executable}")
print(f"CPU count  : {os.cpu_count()}")
try:
    import psutil
    vm = psutil.virtual_memory()
    print(f"RAM        : {vm.used/1e9:.1f} / {vm.total/1e9:.1f} GB ({vm.percent}%)")
    print(f"Boot time  : {time.ctime(psutil.boot_time())}")
except ImportError:
    print("RAM        : (install psutil for details)")
print("─" * 50)