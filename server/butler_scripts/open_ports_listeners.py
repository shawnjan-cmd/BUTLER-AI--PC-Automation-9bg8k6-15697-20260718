import subprocess, re
out = subprocess.run(['netstat','-ano','-p','tcp'], capture_output=True, text=True).stdout
pids = {}
for ln in out.splitlines():
    m = re.match(r'\s*TCP\s+(\S+)\s+(\S+)\s+LISTENING\s+(\d+)', ln)
    if m: pids.setdefault(m.group(3),[]).append(m.group(1))
tl = subprocess.run(['tasklist','/FO','CSV','/NH'], capture_output=True, text=True).stdout
names = {row.split('","')[1]: row.split('","')[0].strip('"') for row in tl.splitlines() if '","' in row}
for pid, addrs in sorted(pids.items(), key=lambda x:int(x[0])):
    print(f'PID {pid:>6}  {names.get(pid,"?"):<30}  {", ".join(addrs[:3])}')