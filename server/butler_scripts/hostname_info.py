import platform, socket, os, getpass
print(f'Hostname    : {socket.gethostname()}')
try: print(f'FQDN        : {socket.getfqdn()}')
except Exception: pass
print(f'User        : {getpass.getuser()}')
print(f'OS          : {platform.system()} {platform.release()} ({platform.version()})')
print(f'Machine     : {platform.machine()}  Processor: {platform.processor()}')
try:
    import psutil
    print(f'CPU cores   : {psutil.cpu_count(logical=False)} physical / {psutil.cpu_count()} logical')
    print(f'RAM total   : {psutil.virtual_memory().total/1024/1024/1024:.1f} GB')
except ImportError: pass