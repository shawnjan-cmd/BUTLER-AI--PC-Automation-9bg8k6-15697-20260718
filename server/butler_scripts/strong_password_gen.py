import secrets, string, subprocess
alpha = string.ascii_letters + string.digits + '!@#$%^&*-_=+?'
pwds = [''.join(secrets.choice(alpha) for _ in range(20)) for _ in range(5)]
for p in pwds: print(p)
try:
    subprocess.run('clip', input=pwds[0], text=True, shell=True); print('\nFirst copied to clipboard.')
except Exception: pass