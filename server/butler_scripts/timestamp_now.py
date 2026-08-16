import time, datetime
now=datetime.datetime.now(datetime.timezone.utc)
local=datetime.datetime.now()
print(f'Epoch (s)  : {int(time.time())}')
print(f'Epoch (ms) : {int(time.time()*1000)}')
print(f'ISO UTC    : {now.isoformat()}')
print(f'RFC 2822   : {now.strftime("%a, %d %b %Y %H:%M:%S %z")}')
print(f'Local      : {local.strftime("%Y-%m-%d %H:%M:%S")}')