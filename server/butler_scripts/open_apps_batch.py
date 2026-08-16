import webbrowser, subprocess, platform
urls = ['https://github.com','https://calendar.google.com','https://mail.google.com']
apps_win = ['notepad','calc']
for u in urls: webbrowser.open(u)
if platform.system()=='Windows':
    for a in apps_win:
        try: subprocess.Popen(a)
        except Exception as e: print(f'skip {a}: {e}')
print('[OK] Workspace ready')