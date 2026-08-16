import subprocess
print('=== Active Connections with Owning Process ===')
r = subprocess.run(['netstat','-bno'], capture_output=True, text=True)
lines = r.stdout.splitlines()
procs = {}
for i, l in enumerate(lines):
    if 'ESTABLISHED' in l or 'TIME_WAIT' in l:
        parts = l.split()
        if len(parts) >= 5:
            ip = parts[2]
            pid = parts[4]
            procs.setdefault(pid, {'ip': ip, 'count': 0})
            procs[pid]['count'] += 1
from collections import Counter
print(f'\nTop talkers by connection count:')
for pid, info in sorted(procs.items(), key=lambda x: x[1]['count'], reverse=True)[:15]:
    print(f'  PID {pid:8} — {info["count"]} connections — {info["ip"]}')