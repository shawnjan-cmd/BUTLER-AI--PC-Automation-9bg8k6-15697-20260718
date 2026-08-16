import time
try: import psutil
except ImportError: print('pip install psutil'); raise SystemExit
a = psutil.disk_io_counters()
time.sleep(5)
b = psutil.disk_io_counters()
print(f'Read : {(b.read_bytes  - a.read_bytes )/5/1024/1024:6.2f} MB/s')
print(f'Write: {(b.write_bytes - a.write_bytes)/5/1024/1024:6.2f} MB/s')
print(f'IOPS : {(b.read_count - a.read_count + b.write_count - a.write_count)/5:.0f}/s')