import platform, os, ctypes
sites = ['reddit.com','www.reddit.com','twitter.com','x.com','youtube.com','www.youtube.com','tiktok.com','news.ycombinator.com']
hosts = r'C:\\Windows\\System32\\drivers\\etc\\hosts' if platform.system()=='Windows' else '/etc/hosts'
marker = '# BUTLER_FOCUS_MODE'
try:
    cur = open(hosts).read()
except PermissionError:
    print('Run as administrator/root'); raise SystemExit
if marker in cur:
    print('Focus mode already on. Re-run unblock script to remove.'); raise SystemExit
lines = [marker] + [f'127.0.0.1 {s}' for s in sites] + [marker]
with open(hosts, 'a') as f: f.write('\n' + '\n'.join(lines) + '\n')
print(f'[OK] Blocked {len(sites)} sites. Flush DNS for immediate effect.')