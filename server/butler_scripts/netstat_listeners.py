import psutil
print(f"{'PROTO':6s} {'LADDR':30s} {'PID':>7s}  PROCESS")
for c in psutil.net_connections(kind='inet'):
    if c.status=='LISTEN':
        try: name=psutil.Process(c.pid).name() if c.pid else '-'
        except Exception: name='-'
        addr=f'{c.laddr.ip}:{c.laddr.port}'
        proto='TCP' if c.type==1 else 'UDP'
        print(f'{proto:6s} {addr:30s} {str(c.pid or "-"):>7s}  {name}')