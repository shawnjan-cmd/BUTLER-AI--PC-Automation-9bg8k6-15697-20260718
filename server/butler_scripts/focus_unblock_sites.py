import platform
hosts = r'C:\\Windows\\System32\\drivers\\etc\\hosts' if platform.system()=='Windows' else '/etc/hosts'
marker = '# BUTLER_FOCUS_MODE'
try:
    lines = open(hosts).read().splitlines()
except PermissionError:
    print('Run as administrator/root'); raise SystemExit
out, inside = [], False
for ln in lines:
    if ln.strip() == marker: inside = not inside; continue
    if not inside: out.append(ln)
with open(hosts, 'w') as f: f.write('\n'.join(out) + '\n')
print('[OK] Focus mode lifted')