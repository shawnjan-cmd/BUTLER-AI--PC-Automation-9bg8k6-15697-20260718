import ctypes, sys, os
if not ctypes.windll.shell32.IsUserAnAdmin():
    print('Run Butler as Administrator.'); sys.exit(1)
d = input('Domain to block (e.g. example.com): ').strip().lower()
if not d: sys.exit(0)
hosts = r'C:\Windows\System32\drivers\etc\hosts'
line = f'127.0.0.1 {d}\n127.0.0.1 www.{d}\n'
with open(hosts,'r+',encoding='utf-8') as f:
    content = f.read()
    if d in content: print('Already blocked.'); sys.exit(0)
    f.write('\n# Butler block\n' + line)
os.system('ipconfig /flushdns')
print(f'Blocked {d}')